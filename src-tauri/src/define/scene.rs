use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use super::stage::Stage;

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
    dest: Uuid,
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
