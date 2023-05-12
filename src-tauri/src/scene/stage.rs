use serde::{Deserialize, Serialize};

use super::position::Position;

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Stage {
    pub id: u64,
    pub name: String,

    pub positions: Vec<Position>,
    pub tags: Vec<String>,
    pub extra: Extra,
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Extra {
    pub fixed_len: f32,
    pub nav_text: String,
}
