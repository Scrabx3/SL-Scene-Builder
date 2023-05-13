use std::vec;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::position::Position;

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Stage {
    pub id: Uuid,
    pub name: String,

    pub positions: Vec<Position>,
    pub tags: Vec<String>,
    pub extra: Extra,
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Extra {
    pub fixed_len: f32,
    pub nav_text: String,
}

impl Default for Stage {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4(),
            name: Default::default(),
            positions: vec![Position::default()],
            tags: Default::default(),
            extra: Default::default(),
        }
    }
}
