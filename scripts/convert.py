import os
import pathlib
import subprocess
import shutil
import json
import argparse

parser = argparse.ArgumentParser(
                    prog='Sexlab Catalytic Converter',
                    description='Converts SLAL anims to SLSB automagically')

parser.add_argument('slsb', help='path to your slsb executable')
#parser.add_argument('fnis', help='path to your generate fnis for modders executable')
parser.add_argument('working', help='path to your working directory')
parser.add_argument('-a', '--author', help='name of the author of the pack', default="Unknown")
parser.add_argument('-c', '--clean', help='clean up temp dir after conversion', action='store_true')
parser.add_argument('-r', '--reset', help='reset sexlab registry', action='store_true')
parser.add_argument('-f', '--fnis', help='path to your generate fnis for modders executable', default=None)

args = parser.parse_args()

working_dir = args.working
slsb_path = args.slsb

slal_dir = working_dir + "\\SLAnims\\json"
registry_dir = working_dir + "\\SKSE\\SexLab\\Registry"
out_dir = working_dir + "\\conversion"
tmp_dir = './tmp'

if os.path.exists(out_dir):
    shutil.rmtree(out_dir)

if os.path.exists(tmp_dir):
    shutil.rmtree(tmp_dir)

os.makedirs(tmp_dir + '/edited')
os.makedirs(out_dir)

if args.reset and os.path.exists(registry_dir):
    shutil.rmtree(registry_dir)

# TODO: furn, futa

femdom_kwds = ['lesbian', 'femdom', 'ff', 'fff', 'ffff', 'fffff']
futa_kwds = ['futa']
sub_kwds = ['forced', 'rape', 'aggressive', 'aggressivedefault', 'bound', 'femdom', 'maledom', 'lezdom', 'gaydom', 'defeated', 'domsub', 'bdsm']
restraints = {'armbinder': 'armbinder', 'yoke': 'yoke', 'cuffs': 'handshackles', 'restraints': 'armbinder'}
restraint_keys = restraints.keys()

def process_stage(scene, stage):
    tags = [tag.lower() for tag in stage['tags']]

    if ('aggressive' in tags or 'aggressivedefault' in tags) and 'forced' not in tags:
        tags.append('forced')

    sub = False
    restraint = ''

    maledom = False
    femdom = False

    maybe_femdom = False
    
    for tag in tags:
        if tag in sub_kwds:
            sub = True
            maledom = True

        if tag in restraint_keys:
            sub = True
            maledom = True
            restraint = restraints[tag]

        if tag in femdom_kwds:
            maybe_femdom = True

    if sub and maybe_femdom:
        femdom = True
        maledom = False

    if sub:
        positions = stage['positions']

        seen_male = False
        seen_female = False
        for pos in positions:
            if pos['sex']['male']:
                seen_male = True
            if pos['sex']['female']:
                seen_female = True

        gay = seen_male and not seen_female
        lesbian = seen_female and not seen_male

        applied_restraint = restraint == ''

        for i in range(len(positions)):
            pos = positions[i]

            if maledom and pos['sex']['female']:
                pos['extra']['submissive'] = True

            if maledom and pos['sex']['male'] and gay and i == 0:
                pos['extra']['submissive'] = True

            if femdom and pos['sex']['male']:
                pos['extra']['submissive'] = True
            
            if femdom and pos['sex']['female'] and lesbian and i == 0:
                pos['extra']['submissive'] = True

            if pos['extra']['submissive'] and not applied_restraint:
                applied_restraint = True
                pos['extra'][restraint] = True

print("==============CONVERTING SLAL TO SLSB PROJECTS==============")
for filename in os.listdir(slal_dir):
    path = os.path.join(slal_dir, filename)

    print('converting', filename)

    ext = pathlib.Path(filename).suffix

    if os.path.isfile(path) and ext == ".json":
        
        output = subprocess.Popen(f"{slsb_path} convert --in \"{path}\" --out \"{tmp_dir}\"", stdout=subprocess.PIPE).stdout.read()

print("==============EDITING AND BUILDING SLSB PROJECTS==============")
for filename in os.listdir(tmp_dir):
    path = os.path.join(tmp_dir, filename)

    print('building', filename)
    
    if os.path.isdir(path):
        continue
    
    data = None
    with open(path, 'r') as f:
        data = json.load(f)

        scenes = data['scenes']
        data['pack_author'] = args.author

        for id in scenes:
            scene = scenes[id]

            stages = scene['stages']

            for stage in stages:
                process_stage(scene, stage)
            
    edited_path = tmp_dir + '/edited/' + filename

    with open(edited_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    output = subprocess.Popen(f"{slsb_path} build --in \"{edited_path}\" --out \"{out_dir}\"", stdout=subprocess.PIPE).stdout.read()

# TODO: fix fnis output
# TODO: build all behaviors

def edit_fnis(path):
    print('modifying', path)
    with open(path) as topo_file:
        for line in topo_file:
            line = line.strip()
            if len(line) > 0 and line[0] != "'":
                print(line[:3])

def try_edit_anims(dir):
    anim_dir = os.path.join(dir, 'animations')
    if os.path.exists(anim_dir) and os.path.exists(os.path.join(dir, 'animations')):
        for filename in os.listdir(anim_dir):
            path = os.path.join(anim_dir, filename)
            if os.path.isdir(path):
                for filename in os.listdir(path):
                    if filename.startswith('FNIS_') and filename.endswith('_List.txt'):
                        edit_fnis(os.path.join(path, filename))
    else:
        for filename in os.listdir(dir):
            path = os.path.join(dir, filename)
            try_edit_anims(path)

print("==============EDITING AND BUILDING FNIS LISTS==============")
anim_dir = working_dir + '\\meshes\\actors'
for filename in os.listdir(anim_dir):
    path = os.path.join(anim_dir, filename)

    if os.path.isdir(path):
        try_edit_anims(path)


if args.clean:
    shutil.rmtree(tmp_dir)