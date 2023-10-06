import os
import pathlib
import subprocess
import shutil
import json
import argparse

parser = argparse.ArgumentParser(
                    prog='Sexlab Catalytic Converter',
                    description='Converts SLAL anims to SLSB in your Skyrim installation directory')

parser.add_argument('slsb', help='path to your slsb executable')
parser.add_argument('skyrim', help='path to your skyrim installation')
parser.add_argument('-c', '--clean', help='clean up temp dir after conversion', action='store_true')
parser.add_argument('-r', '--reset', help='reset sexlab registry', action='store_true')

args = parser.parse_args()

skyrim_dir = args.skyrim
slsb_path = args.slsb

slal_dir = skyrim_dir + "\\SLAnims\\json"
registry_dir = skyrim_dir + "\\SKSE\\SexLab\\Registry"
tmp_dir = './tmp'

if os.path.exists(tmp_dir):
    shutil.rmtree(tmp_dir)

os.makedirs(tmp_dir + '/edited')

if args.reset and os.path.exists(registry_dir):
    shutil.rmtree(registry_dir)

femdom_kwds = ['lesbian', 'femdom', 'ff', 'fff', 'ffff', 'fffff']
futa_kwds = ['futa']
sub_kwds = ['forced', 'rape', 'aggressive', 'aggressivedefault', 'bound', 'femdom', 'maledom', 'lezdom', 'gaydom', 'defeated', 'domsub', 'bdsm']
restraints = {'armbinder': 'armbinder', 'yoke': 'yoke', 'cuffs': 'handshackles', 'restraints': 'armbinder'}
restraint_keys = restraints.keys()

def process_stage(scene, stage):
    scene_name = scene['name']

    tags = [tag.lower() for tag in stage['tags']]

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

        print(sub, femdom, maledom, gay, lesbian, restraint)

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

    ext = pathlib.Path(filename).suffix

    if os.path.isfile(path) and ext == ".json":
        print('converting', path)
        
        output = subprocess.Popen(f"{slsb_path} convert --in \"{path}\" --out \"{tmp_dir}\"", stdout=subprocess.PIPE).stdout.read()
        print(output)

print("==============EDITING AND BUILDING SLSB PROJECTS==============")
for filename in os.listdir(tmp_dir):
    path = os.path.join(tmp_dir, filename)

    if os.path.isdir(path):
        continue
    
    print('editing', path)

    data = None

    with open(path, 'r') as f:
        data = json.load(f)

        scenes = data['scenes']


        for id in scenes:
            scene = scenes[id]

            print('modifying scene', scene['name'])

            stages = scene['stages']

            for stage in stages:
                process_stage(scene, stage)
            
    edited_path = tmp_dir + '/edited/' + filename

    with open(edited_path, 'w') as f:
        json.dump(data, f)
    
    print('building', path)
    output = subprocess.Popen(f"{slsb_path} build --in \"{edited_path}\" --out \"{skyrim_dir}\"", stdout=subprocess.PIPE).stdout.read()
    print(output)


if args.clean:
    shutil.rmtree(tmp_dir)