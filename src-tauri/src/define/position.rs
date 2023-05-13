use serde::{Deserialize, Serialize};

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Position {
    pub sex: Sex,
    pub race: String,
    pub event: String,

    pub extra: Extra,
    pub offset: Offset,
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Sex {
    male: bool,
    female: bool,
    futa: bool,
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Extra {
    submissive: bool,
    optional: bool,
    vampire: bool,
    climax: bool,
    dead: bool,
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Offset {
    x: f32,
    y: f32,
    z: f32,
    r: u8,
}

impl Default for Sex {
    fn default() -> Self {
        Self {
            male: true,
            female: false,
            futa: false,
        }
    }
}
