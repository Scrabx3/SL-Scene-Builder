use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, mem::size_of};

use super::{serialize::EncodeBinary, stage::Stage, NanoID, NANOID_ALPHABET, NANOID_LENGTH};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Scene {
    pub id: NanoID,
    pub name: String,

    pub stages: Vec<Stage>,
    pub root: NanoID,
    pub graph: HashMap<NanoID, Node>,
    #[serde(skip)]
    pub allow_bed: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Node {
    dest: Vec<NanoID>,
    x: f32,
    y: f32,
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
}

impl EncodeBinary for Scene {
    fn get_byte_size(&self) -> usize {
        let mut ret = self.name.len()
            + 5 * size_of::<u64>()
            + 2 * NANOID_LENGTH
            + self.graph.len() * NANOID_LENGTH
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
        buf.push(self.stages[0].extra.allow_bed as u8);
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
            allow_bed: Default::default(),
        }
    }
}
