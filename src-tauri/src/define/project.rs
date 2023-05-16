use nanoid::nanoid;
use std::{
    collections::HashMap,
    fs,
    io::{BufWriter, Write},
    mem::size_of,
    vec,
};
use uuid::Uuid;

use crate::define::serialize::{make_fnis_line, map_race_to_folder};

use super::{scene::Scene, serialize::EncodeBinary};

const NANOID_ALPHABET: [char; 36] = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's',
    't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
];
const PREFIX_HASH_LEN: usize = 4;

#[repr(C)]
#[derive(Debug)]
pub struct Project {
    pub pack_name: String,
    pub pack_author: String,
    pub prefix_hash: String,

    pub scenes: HashMap<Uuid, Scene>,
}

impl Project {
    pub fn new() -> Self {
        Self {
            pack_name: "MyAnimPack".into(),
            pack_author: "Unknown".into(),
            prefix_hash: nanoid!(PREFIX_HASH_LEN, &NANOID_ALPHABET),
            scenes: HashMap::new(),
        }
    }

    pub fn save_scene(&mut self, scene: Scene) -> &Scene {
        let id = scene.id;
        self.scenes.insert(id, scene);
        self.scenes.get(&id).unwrap()
    }

    pub fn get_scene(&self, id: &Uuid) -> Option<&Scene> {
        self.scenes.get(id)
    }

    pub fn discard_scene(&mut self, id: &Uuid) -> Option<Scene> {
        self.scenes.remove(id)
    }

    pub fn write_binary_file(&self) -> std::io::Result<()> {
        const ROOT_PATH: &str = "dist";
        // Write binary
        let mut buf: Vec<u8> = Vec::new();
        buf.reserve(self.get_byte_size());
        self.write_byte(&mut buf);

        fs::create_dir_all(format!("{}\\SKSE\\SexLab\\", ROOT_PATH))?;
        let mut file = fs::File::create(format!(
            "{}\\SKSE\\SexLab\\{}.slr",
            ROOT_PATH, self.pack_name
        ))?;
        file.write_all(&buf)?;
        // Write FNIS files
        let mut events: HashMap<&str, Vec<String>> = HashMap::new(); // map<RaceKey, Events[]>
        for (_, scene) in &self.scenes {
            for stage in &scene.stages {
                for position in &stage.positions {
                    let line = make_fnis_line(
                        &position.event,
                        &self.prefix_hash,
                        Some(stage.extra.fixed_len > 0.0),
                        Some(&position.anim_obj),
                    );
                    let it = events.get_mut(position.race.as_str());
                    if let Some(vec) = it {
                        vec.push(line);
                    } else {
                        println!("Inserting key: {}", position.race);
                        events.insert(position.race.as_str(), vec![line]);
                    }
                }
            }
        }

        for (racekey, anim_events) in &events {
            let target_folder = map_race_to_folder(*racekey)
                .expect(format!("Cannot find folder for RaceKey {}", racekey).as_str());
            let crt = &target_folder[target_folder
                .find('\\')
                .and_then(|w| Some(w + 1))
                .unwrap_or(0)..];
            let path = format!(
                "{}\\meshes\\actor\\{}\\animations\\{}",
                ROOT_PATH, target_folder, self.pack_name
            );
            fs::create_dir_all(&path)?;
            let file = fs::File::create(format!(
                "{}\\FNIS_{}_{}_List.txt",
                path, self.pack_name, crt
            ))?;
            let mut file = BufWriter::new(file);
            for anim_event in anim_events {
                writeln!(file, "{}", anim_event)?;
            }
        }

        Ok(())
    }
}

impl EncodeBinary for Project {
    fn get_byte_size(&self) -> usize {
        let mut ret = self.pack_author.len() + 1 // name
            + size_of::<usize>() // num scenes
            + PREFIX_HASH_LEN;
        for (_, value) in &self.scenes {
            ret += value.get_byte_size();
        }

        ret
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        // hash
        buf.extend_from_slice(self.prefix_hash.as_bytes());
        // author
        buf.extend_from_slice(self.pack_author.as_bytes());
        buf.push(0);
        // scenes
        buf.extend_from_slice(&self.scenes.len().to_be_bytes());
        for (_, scene) in &self.scenes {
            scene.write_byte(buf);
        }
    }
}
