use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, mem::size_of, vec};

use super::{
    serialize::{EncodeBinary, Offset},
    stage::Stage,
    NanoID, NANOID_ALPHABET, NANOID_LENGTH,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Scene {
    pub id: NanoID,
    pub name: String,

    pub stages: Vec<Stage>,
    pub root: NanoID,
    pub graph: HashMap<NanoID, Node>,
    pub furniture: FurnitureData,
    pub private: bool,

    #[serde(default)] // addition 1.1
    pub has_warnings: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FurnitureData {
    pub furni_types: Vec<String>,
    pub allow_bed: bool,
    pub offset: Offset,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Node {
    pub dest: Vec<NanoID>,
    pub x: f32,
    pub y: f32,
}

impl EncodeBinary for FurnitureData {
    fn get_byte_size(&self) -> usize {
        1 + self.offset.get_byte_size() + size_of::<u32>()
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        let furni_bytes = crate::furniture::as_furnitre(&self.furni_types);
        buf.extend_from_slice(&furni_bytes.bits().to_be_bytes());
        buf.push(self.allow_bed as u8);
        self.offset.write_byte(buf);
    }
}

impl Scene {
    pub fn get_stage(&self, id: &NanoID) -> Option<&Stage> {
        for it in &self.stages {
            if &it.id == id {
                return Some(it);
            }
        }

        None
    }

    pub fn get_stage_mut(&mut self, id: &NanoID) -> Option<&mut Stage> {
        for it in &mut self.stages {
            if &it.id == id {
                return Some(it);
            }
        }

        None
    }

    pub fn import_offset(&mut self, yaml_obj: &serde_yaml::Mapping) -> Result<(), String> {
        for (scene_id_v, scene_obj) in yaml_obj {
            let scene_id = scene_id_v
                .as_str()
                .ok_or(format!("Expected Stage id for Scene {}", self.id))?;
            if scene_id == "enabled" {
                continue;
            }
            let id = self.id.clone();
            if let Some(stage) = self.get_stage_mut(&scene_id.to_string()) {
                let arg = scene_obj.as_sequence().ok_or(format!(
                    "Expecting sequence in scene {} for stage {}",
                    id, stage.id
                ))?;
                stage.import_offset(arg)?;
            }
        }

        Ok(())
    }
}

impl EncodeBinary for Scene {
    fn get_byte_size(&self) -> usize {
        let mut ret = self.name.len()
            + 5 * size_of::<u64>()
            + 2 * NANOID_LENGTH
            + self.graph.len() * NANOID_LENGTH
            + self.furniture.get_byte_size()
            + 1;
        ret += self.stages[0].positions[0].get_byte_size_meta();
        for (_, node) in &self.graph {
            ret += node.dest.len() * NANOID_LENGTH;
        }
        for stage in &self.stages {
            ret += stage.get_byte_size();
        }

        ret
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        // id
        buf.extend_from_slice(self.id.as_bytes());
        // name
        buf.extend_from_slice(&(self.name.len() as u64).to_be_bytes());
        buf.extend_from_slice(self.name.as_bytes());
        // Stage meta
        buf.extend_from_slice(&(self.stages[0].positions.len() as u64).to_be_bytes());
        for position in &self.stages[0].positions {
            position.write_byte_meta(buf);
        }
        // root
        buf.extend_from_slice(self.root.as_bytes());
        // stages
        buf.extend_from_slice(&(self.stages.len() as u64).to_be_bytes());
        for stage in &self.stages {
            stage.write_byte(buf);
        }
        // graph
        buf.extend_from_slice(&(self.graph.len() as u64).to_be_bytes());
        for (key, value) in &self.graph {
            buf.extend_from_slice(key.as_bytes());
            buf.extend_from_slice(&(value.dest.len() as u64).to_be_bytes());
            for node in &value.dest {
                buf.extend_from_slice(node.as_bytes());
            }
        }
        // furniture
        self.furniture.write_byte(buf);
        // private
        buf.push(self.private as u8)
    }
}

impl Default for Scene {
    fn default() -> Self {
        Self {
            id: nanoid!(NANOID_LENGTH, &NANOID_ALPHABET),
            name: Default::default(),
            stages: Default::default(),
            root: Default::default(),
            graph: Default::default(),
            furniture: Default::default(),
            private: Default::default(),
            has_warnings: Default::default(),
        }
    }
}

impl Default for FurnitureData {
    fn default() -> Self {
        Self {
            furni_types: vec!["None".into()],
            allow_bed: Default::default(),
            offset: Default::default(),
        }
    }
}

impl Default for Node {
    fn default() -> Self {
        Self {
            dest: Default::default(),
            x: 40.0,
            y: 40.0,
        }
    }
}
