use serde::{Deserialize, Serialize};
use std::{collections::HashMap, mem::size_of};
use uuid::Uuid;

use super::{serialize::EncodeBinary, stage::Stage};

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Scene {
    pub id: Uuid,
    pub name: String,

    pub stages: Vec<Stage>,
    pub root: Uuid,
    pub graph: HashMap<Uuid, Node>,
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Node {
    dest: Vec<Uuid>,
    x: f32,
    y: f32,
}

impl Scene {
    pub fn get_stage(&self, id: &Uuid) -> Option<&Stage> {
        for it in &self.stages {
            if &it.id == id {
                return Some(it);
            }
        }

        None
    }

    // pub fn get_shared_tags(&self) -> Option<Vec<String>> {
    //     self.stages
    //         .first()
    //         .and_then(|stage| Some(stage.tags.clone()))
    //         .and_then(|mut tags| {
    //             for it in &self.stages {
    //                 if it == self.stages.first().unwrap() {
    //                     continue;
    //                 }
    //                 let mut i = 0;
    //                 while i < tags.len() {
    //                     if !it.tags.contains(&tags[i]) {
    //                         tags.swap_remove(i);
    //                     } else {
    //                         i += 1;
    //                     }
    //                 }
    //             }
    //             Some(tags)
    //         })
    // }
}

impl EncodeBinary for Scene {
    fn get_byte_size(&self) -> usize {
        let mut ret = self.name.len()
            + 1                         // name
            + 2 * size_of::<u128>()     // id + root
            + 3 * size_of::<usize>()    // container size
            + self.graph.len() * size_of::<u128>();
        for (_, node) in &self.graph {
            ret += node.dest.len() * size_of::<u128>();
        }
        for stage in &self.stages {
            ret += stage.get_byte_size();
        }

        ret
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        // name
        buf.extend_from_slice(self.name.as_bytes());
        buf.push(0);
        // id
        buf.extend_from_slice(self.id.as_bytes());
        // root
        buf.extend_from_slice(self.root.as_bytes());
        // graph
        buf.extend_from_slice(&self.graph.len().to_be_bytes());
        for (key, value) in &self.graph {
            buf.extend_from_slice(key.as_bytes());
            buf.extend_from_slice(&value.dest.len().to_be_bytes());
            for node in &value.dest {
                buf.extend_from_slice(node.as_bytes());
            }
        }
        // stages
        buf.extend_from_slice(&self.stages.len().to_be_bytes());
        for stage in &self.stages {
            stage.write_byte(buf);
        }
    }
}

impl Default for Scene {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4(),
            name: Default::default(),
            stages: Default::default(),
            root: Default::default(),
            graph: Default::default(),
        }
    }
}
