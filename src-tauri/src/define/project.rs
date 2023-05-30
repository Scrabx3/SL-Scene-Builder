use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    io::{BufReader, BufWriter, ErrorKind, Write},
    mem::size_of,
    path::PathBuf,
    vec,
};
use tauri::api::dialog::blocking::FileDialogBuilder;

use crate::define::serialize::{make_fnis_line, map_race_to_folder};

use super::{
    scene::Scene, serialize::EncodeBinary, stage::Stage, NanoID, NANOID_ALPHABET, PREFIX_HASH_LEN,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    #[serde(skip)]
    pub pack_path: PathBuf,

    pub pack_name: String,
    pub pack_author: String,
    pub prefix_hash: String,
    pub scenes: HashMap<NanoID, Scene>,
}

impl Project {
    pub fn new() -> Self {
        Self {
            pack_path: Default::default(),

            pack_name: Default::default(),
            pack_author: "Unknown".into(),
            prefix_hash: nanoid!(PREFIX_HASH_LEN, &NANOID_ALPHABET),
            scenes: HashMap::new(),
        }
    }

    pub fn reset(&mut self) -> &Self {
        *self = Self::new();

        self
    }

    pub fn save_scene(&mut self, scene: Scene) -> &Scene {
        let id = scene.id.clone();
        self.scenes.insert(id.clone(), scene);
        self.scenes.get(&id).unwrap()
    }

    pub fn discard_scene(&mut self, id: &NanoID) -> Option<Scene> {
        self.scenes.remove(id)
    }

    pub fn get_scene(&self, id: &NanoID) -> Option<&Scene> {
        self.scenes.get(id)
    }

    pub fn get_stage(&self, id: &NanoID) -> Option<&Stage> {
        for (_, scene) in &self.scenes {
            let stage = scene.get_stage(id);
            if stage.is_some() {
                return stage;
            }
        }
        None
    }

    pub fn load_project(&mut self) -> Result<(), String> {
        let path = FileDialogBuilder::new()
            .add_filter("SL Project File", vec!["slsb.json"].as_slice())
            .pick_file();
        if path.is_none() {
            return Err("User cancel".into());
        }
        let path = path.unwrap();
        // let file = fs::read(&path).map_err(|e| e.to_string())?;
        // let value = postcard::from_bytes(&file).map_err(|e| e.to_string())?;
        let file = fs::File::open(&path).map_err(|e| e.to_string())?;
        let value = serde_json::from_reader(BufReader::new(file)).map_err(|e| e.to_string())?;

        *self = value;
        self.set_project_name_from_path(&path);
        self.pack_path = path;

        Ok(())
    }

    pub fn save_project(&mut self, save_as: bool) -> Result<(), String> {
        let path = if save_as || !self.pack_path.exists() || self.pack_path.is_dir() {
            let f = FileDialogBuilder::new()
                .set_file_name(&self.pack_name)
                .add_filter("SL Project File", vec!["slsb.json"].as_slice())
                .save_file();
            if f.is_none() {
                return Err("User Cancel".into());
            }
            f.unwrap()
        } else {
            self.pack_path.clone()
        };
        let file = fs::File::create(&path).map_err(|e| e.to_string())?;
        serde_json::to_writer(file, self).map_err(|e| e.to_string())?;
        // let bin = postcard::to_vec(self);

        self.set_project_name_from_path(&path);
        Ok(())
    }

    pub fn build(&self) -> Result<(), std::io::Error> {
        let path = FileDialogBuilder::new().pick_folder();
        if path.is_none() {
            return Err(std::io::Error::from(ErrorKind::Interrupted));
        }
        let root_dir = path.unwrap();
        // Write binary
        {
            let target_dir = root_dir.join("SKSE\\SexLab\\");
            let mut buf: Vec<u8> = Vec::new();
            buf.reserve(self.get_byte_size());
            self.write_byte(&mut buf);
            fs::create_dir_all(&target_dir)?;
            let mut file = fs::File::create(target_dir.join(format!(
                "{}.slr",
                if self.pack_name.is_empty() {
                    &self.prefix_hash
                } else {
                    &self.pack_name
                }
            )))?;
            file.write_all(&buf)?;
        }
        // Write FNIS files
        {
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
                let path = root_dir.join(format!(
                    "meshes\\actor\\{}\\animations\\{}",
                    target_folder, self.pack_name
                ));
                let crt = &target_folder[target_folder
                    .find('\\')
                    .and_then(|w| Some(w + 1))
                    .unwrap_or(0)..];
                fs::create_dir_all(&path)?;

                let create = |file_path| -> Result<(), std::io::Error> {
                    let file = fs::File::create(file_path)?;
                    let mut file = BufWriter::new(file);
                    for anim_event in anim_events {
                        writeln!(file, "{}", anim_event)?;
                    }
                    Ok(())
                };
                return match crt {
                    "character" => create(path.join(format!("FNIS_{}_List.txt", self.pack_name))),
                    "canine" => {
                        create(path.join(format!("FNIS_{}_canine_List.txt", self.pack_name)))?;
                        create(path.join(format!("FNIS_{}_wolf_List.txt", self.pack_name)))?;
                        create(path.join(format!("FNIS_{}_dog_List.txt", self.pack_name)))
                    }
                    _ => create(path.join(format!("FNIS_{}_{}_List.txt", self.pack_name, crt))),
                };
            }
        }

        Ok(())
    }

    fn set_project_name_from_path(&mut self, path: &PathBuf) -> () {
        self.pack_name = String::from(
            path.file_name() // ...\\{project.slsb.json}
                .and_then(|name| name.to_str())
                .and_then(|str| {
                    let ret = &str[0..str.find(".slsb.json").unwrap_or(str.len())];
                    Some(ret)
                })
                .unwrap_or_default(),
        );
    }
}

impl EncodeBinary for Project {
    fn get_byte_size(&self) -> usize {
        let mut ret = self.pack_author.len()
            + self.pack_name.len()
            + 3 * size_of::<u64>()
            + PREFIX_HASH_LEN
            + 1;
        for (_, value) in &self.scenes {
            ret += value.get_byte_size();
        }

        ret
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        // version
        let version: u8 = 1;
        buf.push(version);
        // name
        buf.extend_from_slice(&(self.pack_name.len() as u64).to_be_bytes());
        buf.extend_from_slice(self.pack_name.as_bytes());
        // author
        buf.extend_from_slice(&(self.pack_author.len() as u64).to_be_bytes());
        buf.extend_from_slice(self.pack_author.as_bytes());
        // hash
        buf.extend_from_slice(self.prefix_hash.as_bytes());
        // scenes
        buf.extend_from_slice(&(self.scenes.len() as u64).to_be_bytes());
        for (_, scene) in &self.scenes {
            if scene.stages.len() > 0 {
                scene.write_byte(buf);
            }
        }
    }
}
