use serde::{Deserialize, Serialize};

use super::scene::Animation;

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pack_name: String,
    pack_author: String,

    scenes: Vec<Animation>,
}
