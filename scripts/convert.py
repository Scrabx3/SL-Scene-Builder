import os
import pathlib
import subprocess
import shutil
import json
import argparse
import json
import re

parser = argparse.ArgumentParser(
                    prog='Sexlab Catalytic Converter',
                    description='Converts SLAL anims to SLSB automagically')

parser.add_argument('slsb', help='path to your slsb executable')
parser.add_argument('working', help='path to your working directory')
parser.add_argument('-a', '--author', help='name of the author of the pack', default="Unknown")
parser.add_argument('-c', '--clean', help='clean up temp dir after conversion', action='store_true')
parser.add_argument('-s', '--skyrim', help='path to your skyrim directory', default=None)
parser.add_argument('-ra', '--remove_anims', help='remove copied animations during fnis behaviour gen', action='store_true')
parser.add_argument('-nb', '--no_build', help='do not build the slsb project', action='store_true')

args = parser.parse_args()

slsb_path = args.slsb

skyrim_path = args.skyrim
fnis_path = skyrim_path + '/Data/tools/GenerateFNIS_for_Modders' if skyrim_path is not None else None
remove_anims = args.remove_anims
parent_dir = args.working

if os.path.exists(parent_dir + "\\conversion"):
    shutil.rmtree(parent_dir + "\\conversion")

def convert(parent_dir, dir):
    working_dir = os.path.join(parent_dir, dir)
    
    slal_dir = working_dir + "\\SLAnims\\json"
    anim_source_dir = working_dir + "\\SLAnims\\source"
    out_dir = parent_dir + "\\conversion\\" + dir
    tmp_dir = './tmp'

    if os.path.exists(tmp_dir):
        shutil.rmtree(tmp_dir)

    os.makedirs(tmp_dir + '/edited')
    os.makedirs(out_dir + '/SKSE/Sexlab/Registry/Source')

    # TODO: furn
    femdom_kwds = ['lesbian', 'femdom', 'ff', 'fff', 'ffff', 'fffff']
    futa_kwds = ['futa']
    sub_kwds = ['forced', 'rape', 'aggressive', 'aggressivedefault', 'bound', 'femdom', 'maledom', 'lezdom', 'gaydom', 'defeated', 'domsub', 'bdsm']
    dead_kwds = ['dead', 'necro', 'guro']
    restraints = {'armbinder': 'armbinder', 'yoke': 'yoke', 'cuffs': 'handshackles', 'restraints': 'armbinder', 'frontcuffs': 'handshackles'}
    restraint_keys = restraints.keys()
        
    print("==============CONVERTING SLAL TO SLSB PROJECTS==============")
    for filename in os.listdir(slal_dir):
        path = os.path.join(slal_dir, filename)

        ext = pathlib.Path(filename).suffix

        if os.path.isfile(path) and ext == ".json":
            print('converting', filename)
            output = subprocess.Popen(f"{slsb_path} convert --in \"{path}\" --out \"{tmp_dir}\"", stdout=subprocess.PIPE).stdout.read()

    print("==============PARSING ANIMATION SOURCE FILE==============")
    animations = dict()
    def reset_animation():
        return {
            "id": None,
            "name": None,
            "tags": [],
            "sound": None,
            "actors": {},
        }

    def parse_stage_params(stage_params):
        stages = []
        stage_data = None

        for line in stage_params:
            stage_match = re.search(r'Stage\((\d+)(.*?)\)', line)
            if stage_match:
                stage_info = stage_match.groups()
                stage_number = int(stage_info[0])
                stage_data = {
                    "sos": None,
                    "silent": False,
                    "open_mouth": False,
                    "object": None,
                    "animvars": "",  # Initialize animvars
                }
                attributes = re.findall(r'sos=(-?\d+)|silent=True|open_mouth=True|object="([^"]*)"|object=([^,)]+)', stage_info[1])
                for attr in attributes:
                    if attr[0]:
                        stage_data["sos"] = int(attr[0])
                    if "silent" in attr[1]:
                        stage_data["silent"] = True
                    if "open_mouth" in attr[1]:
                        stage_data["open_mouth"] = True
                    if attr[2]:
                        if stage_data["object"] is not None:
                            stage_data["object"] += f", {attr[2]}"
                        else:
                            stage_data["object"] = attr[2]
                
                # Extract the animvars attribute correctly
                animvars_match = re.search(r'animvars="([^"]*)"', stage_info[1])
                if animvars_match:
                    stage_data["animvars"] = animvars_match.group(1)
                
                stages.append({f"Stage {stage_number}": stage_data})

        return stages

    def parse_actor(line, current_animation):
        actor_match = re.search(r'actor(\d+)=([^()]+)\(([^)]*)\)', line)
        if actor_match:
            actor_number = actor_match.group(1)
            actor_type = actor_match.group(2)
            actor_args = actor_match.group(3)

            actor_info = {
                "type": actor_type,
                "args": {},
                f"a{actor_number}_stage_params": [],
            }

            args = re.findall(r'(\w+)=(?:"([^"]*)"|([^,)]+))', actor_args)
            for arg, value1, value2 in args:
                value = value1 if value1 else value2
                actor_info["args"][arg] = value

            current_animation["actors"][f"a{actor_number}"] = actor_info

    metadata = {
        "anim_dir": None,
        "anim_id_prefix": None,
        "anim_name_prefix": None,
        "common_tags": None,
    }

    def parse_file(file):
        inside_animation = False
        current_animation = None
        current_actor_number = None
        current_stage_params = []
        for line in file:
            line = line.strip()
            
            if line.startswith("anim_dir("):
                metadata["anim_dir"] = re.search(r'anim_dir\("([^"]*)"\)', line).group(1)
            elif line.startswith("anim_id_prefix("):
                metadata["anim_id_prefix"] = re.search(r'anim_id_prefix\("([^"]*)"\)', line).group(1)
            elif line.startswith("anim_name_prefix("):
                metadata["anim_name_prefix"] = re.search(r'anim_name_prefix\("([^"]*)"\)', line).group(1)
            elif line.startswith("common_tags("):
                metadata["common_tags"] = re.search(r'common_tags\("([^"]*)"\)', line).group(1)

            if line.startswith("Animation("):
                if current_animation:
                    if current_actor_number and current_stage_params:
                        current_animation["actors"][f"a{current_actor_number}"][f"a{current_actor_number}_stage_params"] = parse_stage_params(current_stage_params)
                    animations[metadata["anim_name_prefix"] + current_animation["name"]] = current_animation
                current_animation = reset_animation()
                inside_animation = True
                current_actor_number = None
                current_stage_params = []
            elif inside_animation and line.startswith(")"):
                inside_animation = False
            elif inside_animation:
                if line.startswith("id="):
                    current_animation["id"] = re.search(r'id="([^"]*)"', line).group(1)
                elif line.startswith("name="):
                    current_animation["name"] = re.search(r'name="([^"]*)"', line).group(1)
                elif line.startswith("tags="):
                    current_animation["tags"] = [tag.strip() for tag in re.search(r'tags="([^"]*)"', line).group(1).split(",")]
                elif line.startswith("sound="):
                    sound = re.search(r'sound="([^"]*)"', line)
                    if sound:
                        current_animation["sound"] = sound.group(1)
                elif actor_match := re.search(r'actor(\d+)=([^()]+)\(([^)]*)\)', line):
                    if current_actor_number and current_stage_params:
                        current_animation["actors"][f"a{current_actor_number}"][f"a{current_actor_number}_stage_params"] = parse_stage_params(current_stage_params)
                    parse_actor(line, current_animation)
                    current_actor_number = actor_match.group(1)
                    current_stage_params = []
                else:
                    current_stage_params.append(line)

        if current_actor_number and current_stage_params:
            current_animation["actors"][f"a{current_actor_number}"][f"a{current_actor_number}_stage_params"] = parse_stage_params(current_stage_params)
        
        animations[metadata["anim_name_prefix"] + current_animation["name"]] = current_animation

    for filename in os.listdir(anim_source_dir):
        path = os.path.join(anim_source_dir, filename)
        ext = pathlib.Path(filename).suffix

        if os.path.isfile(path) and ext == ".txt":
            with open(path, "r") as file:
                parse_file(file)

    def parse_fnis_list(parent_dir, file):
        path = os.path.join(parent_dir, file)

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

    
    anim_dir = working_dir + '\\meshes\\actors'
    if os.path.exists(anim_dir):
        print("==============PARSING FNIS LISTS==============")
        for filename in os.listdir(anim_dir):
            path = os.path.join(anim_dir, filename)

            if os.path.isdir(path):
                iter_fnis_lists(path, parse_fnis_list)

    def process_stage(scene, stage):
        name = scene['name']
        
        source_anim_data = animations[name]

        tags = [tag.lower().strip() for tag in stage['tags']]

        if ('aggressive' in tags or 'aggressivedefault' in tags) and 'forced' not in tags:
            tags.append('forced')

        sub = False
        dead = False
        restraint = ''
        furn = ''

        maledom = False
        femdom = False

        maybe_femdom = False
        
        for i in range(len(tags)):
            tag = tags[i]

            if tag in sub_kwds:
                sub = True
                maledom = True

            if tag in restraint_keys:
                sub = True
                maledom = True
                restraint = restraints[tag]

            if tag in femdom_kwds:
                maybe_femdom = True

            if tag in dead_kwds:
                dead = True

            if tag.lower() == 'cunnilingius':
                tags[i] = 'Cunnilingus'

            if tag.lower() == 'guro':
                tags[i] = 'Gore'
            

        positions = stage['positions']        

        if sub and maybe_femdom:
            femdom = True
            maledom = False

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

            if sub:
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

            if dead and i == 0:
                pos['extra']['dead'] = True
                
            if pos['event'] and len(pos['event']) > 0:
                event = pos['event'][0].lower()
                if event in anim_data.keys():
                    data = anim_data[event]
                    pos['event'][0] = os.path.splitext(data['anim_file_name'])[0]
                    os.makedirs(os.path.dirname(os.path.join(out_dir, data['out_path'])), exist_ok=True)
                    shutil.copyfile(data['path'], os.path.join(out_dir, data['out_path']))
                
            source_actor_data = source_anim_data['actors']['a' + str(i + 1)]
            source_actor_args = source_actor_data['args']
            if 'object' in source_actor_args:
                pos['anim_obj'] = source_actor_args['object'].replace(' ', ',')
                
        stage['tags'] = tags

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
        
        if not args.no_build:
            output = subprocess.Popen(f"{slsb_path} build --in \"{edited_path}\" --out \"{out_dir}\"", stdout=subprocess.PIPE).stdout.read()

            shutil.copyfile(edited_path, out_dir + '/SKSE/Sexlab/Registry/Source/' + filename)

    def build_behaviour(parent_dir, list_name):
        list_path = os.path.join(parent_dir, list_name)

        if '_canine' in list_name.lower():
            return

        print('generating', list_path)


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

        behaviour_folder = 'behaviors' if '_wolf' not in list_name.lower() else 'behaviors wolf'

        behaviour_path = os.path.join(skyrim_path, 'data', *out_path[start_index:end_index], behaviour_folder, behavior_file_name)

        if os.path.exists(behaviour_path):
            out_behavior_dir = os.path.join(out_dir, *out_path[start_index:end_index], behaviour_folder)
            out_behaviour_path = os.path.join(out_behavior_dir, behavior_file_name)
            os.makedirs(out_behavior_dir, exist_ok=True)
            shutil.copyfile(behaviour_path, out_behaviour_path)
        else:
            print(f'WARNING: {behaviour_path} not found for {list_path} - please validate behaviour file')

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


for dir in os.listdir(parent_dir):
    mesh_dir = os.path.join(parent_dir, dir, 'meshes')
    slal_dir = os.path.join(parent_dir, dir, 'SLAnims')
    if os.path.exists(slal_dir):
        print('processing', dir)
        convert(parent_dir, dir)