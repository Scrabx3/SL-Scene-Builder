use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use super::stage::Stage;

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Animation {
    pub id: Uuid,
    pub name: String,

    pub stages: Vec<Stage>,
    pub root: u64,
    pub graph: HashMap<u64, Node>,
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Node {
    edge_dest: Uuid,
    x: f32,
    y: f32,
}
