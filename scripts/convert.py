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
parser.add_argument('working', help='path to your working directory')
parser.add_argument('-a', '--author', help='name of the author of the pack', default="Unknown")
parser.add_argument('-c', '--clean', help='clean up temp dir after conversion', action='store_true')
parser.add_argument('-r', '--reset', help='reset sexlab registry', action='store_true')
parser.add_argument('-s', '--skyrim', help='path to your skyrim directory', default=None)
parser.add_argument('-ra', '--remove_anims', help='remove copied animations during fnis behaviour gen', action='store_true')

args = parser.parse_args()

working_dir = args.working
slsb_path = args.slsb

skyrim_path = args.skyrim
fnis_path = skyrim_path + '/Data/tools/GenerateFNIS_for_Modders'
remove_anims = args.remove_anims

slal_dir = working_dir + "\\SLAnims\\json"
registry_dir = working_dir + "\\SKSE\\SexLab\\Registry"
out_dir = working_dir + "\\conversion"
tmp_dir = './tmp'

if os.path.exists(out_dir):
    shutil.rmtree(out_dir)

if os.path.exists(tmp_dir):
    shutil.rmtree(tmp_dir)

os.makedirs(tmp_dir + '/edited')
os.makedirs(out_dir + '/SKSE/Sexlab/Registry/Source')

# TODO: furn, futa, dead

femdom_kwds = ['lesbian', 'femdom', 'ff', 'fff', 'ffff', 'fffff']
futa_kwds = ['futa']
sub_kwds = ['forced', 'rape', 'aggressive', 'aggressivedefault', 'bound', 'femdom', 'maledom', 'lezdom', 'gaydom', 'defeated', 'domsub', 'bdsm']
dead_kwds = ['dead', 'necro']
restraints = {'armbinder': 'armbinder', 'yoke': 'yoke', 'cuffs': 'handshackles', 'restraints': 'armbinder'}
restraint_keys = restraints.keys()

print("==============CONVERTING SLAL TO SLSB PROJECTS==============")
for filename in os.listdir(slal_dir):
    path = os.path.join(slal_dir, filename)


    ext = pathlib.Path(filename).suffix

    if os.path.isfile(path) and ext == ".json":
        print('converting', filename)
        output = subprocess.Popen(f"{slsb_path} convert --in \"{path}\" --out \"{tmp_dir}\"", stdout=subprocess.PIPE).stdout.read()

def parse_fnis_list(parent_dir, file):
    path = os.path.join(parent_dir, file)

    print('processing', path)

    with open(path) as topo_file:

        last_seq = None

        for line in topo_file:
            line = line.strip()
            if len(line) > 0 and line[0] != "'":

                splits = line.split()

                if (len(splits)) == 0 or splits[0].lower() == 'version':
                    continue

                anim_file_name = None
                anim_event_name = None
                options = []
                anim_objects = []

                for i in range(len(splits)):
                    split = splits[i].lower()
                    if anim_event_name is not None:
                        anim_objects.append(split)

                    if '.hkx' in split:
                        anim_file_name = splits[i]
                        anim_event_name = splits[i - 1]                        

                    if '-' in split:
                        options.append(split)

                anim_event_name = anim_event_name.lower()

                if '-a' in line:
                    last_seq = anim_event_name
                
                anim_path = os.path.join(parent_dir, anim_file_name)

                out_path = os.path.normpath(anim_path)
                out_path = out_path.split(os.sep)

                for i in range(len(out_path) - 1, -1, -1):
                    if (out_path[i].lower() == 'meshes'):
                        out_path = out_path[i:]
                        break
               
                out_path = os.path.join('', *out_path)
                
                data = {
                    'anim_file_name': anim_file_name,
                    'sequence': [],
                    'options': options,
                    'anim_obj': anim_objects,
                    'path': anim_path,
                    'out_path': out_path
                }

                if last_seq is None:
                    anim_data[anim_event_name] = data
                else:
                    anim_data[last_seq]['sequence'].append(data)
                    last_seq = None

anim_data = dict()

def iter_fnis_lists(dir, func):
    anim_dir = os.path.join(dir, 'animations')
    if os.path.exists(anim_dir) and os.path.exists(os.path.join(dir, 'animations')):
        for filename in os.listdir(anim_dir):
            path = os.path.join(anim_dir, filename)
            if os.path.isdir(path):
                for filename in os.listdir(path):
                    if filename.startswith('FNIS_') and filename.endswith('_List.txt'):
                        func(path, filename)
    else:
        for filename in os.listdir(dir):
            path = os.path.join(dir, filename)
            iter_fnis_lists(path, func)

print("==============PROCESSING FNIS LISTS==============")
anim_dir = working_dir + '\\meshes\\actors'
for filename in os.listdir(anim_dir):
    path = os.path.join(anim_dir, filename)

    if os.path.isdir(path):
        iter_fnis_lists(path, parse_fnis_list)

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

    positions = stage['positions']

    for pos in positions:        
        event = pos['event'][0].lower()
        data = anim_data[event]
        pos['event'][0] = os.path.splitext(data['anim_file_name'])[0]
        os.makedirs(os.path.dirname(os.path.join(out_dir, data['out_path'])), exist_ok=True)
        shutil.copyfile(data['path'], os.path.join(out_dir, data['out_path']))

    if sub and maybe_femdom:
        femdom = True
        maledom = False

    if sub:

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

print("==============EDITING AND BUILDING SLSB PROJECTS==============")
for filename in os.listdir(tmp_dir):
    path = os.path.join(tmp_dir, filename)
    
    if os.path.isdir(path):
        continue

    print('building slsb', filename)

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

    shutil.copyfile(edited_path, out_dir + '/SKSE/Sexlab/Registry/Source/' + filename)

def build_behaviour(parent_dir, list_name):
    list_path = os.path.join(parent_dir, list_name)

    behavior_file_name = list_name.lower().replace('fnis_', '')
    behavior_file_name = behavior_file_name.lower().replace('_list.txt', '')

    behavior_file_name = 'FNIS_' + behavior_file_name + '_Behavior.hkx'

    cwd = os.getcwd()
    os.chdir(fnis_path)
    output = subprocess.Popen(f"./commandlinefnisformodders.exe \"{list_path}\"", stdout=subprocess.PIPE).stdout.read()
    os.chdir(cwd)

    out_path = os.path.normpath(list_path)
    out_path = out_path.split(os.sep)

    start_index = -1
    end_index = -1

    for i in range(len(out_path) - 1, -1, -1):
        split = out_path[i].lower()

        if split == 'meshes':
            start_index = i
        elif split == 'animations':
            end_index = i

    behaviour_path = os.path.join(skyrim_path, 'data', *out_path[start_index:end_index], 'behaviors', behavior_file_name)

    if os.path.exists(behaviour_path):
        out_behavior_dir = os.path.join(out_dir, *out_path[start_index:end_index], 'behaviors')
        out_behaviour_path = os.path.join(out_behavior_dir, behavior_file_name)
        os.makedirs(out_behavior_dir, exist_ok=True)
        shutil.copyfile(behaviour_path, out_behaviour_path)
    else:
        print(f'WARNING: {behavior_file_name} not found for {list_name} - please gen and copy behaviour file')

    if remove_anims:
        for filename in os.listdir(parent_dir):
            if os.path.splitext(filename)[1] == '.hkx':
                os.remove(os.path.join(parent_dir, filename))

if fnis_path is not None:
    print("==============BUILDING FNIS BEHAVIOUR==============")
    anim_dir = out_dir + '\\meshes\\actors'
    iter_fnis_lists(anim_dir, build_behaviour)

if args.clean:
    shutil.rmtree(tmp_dir)


    