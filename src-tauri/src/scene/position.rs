use serde::{Deserialize, Serialize};

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
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
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Extra {
    submissive: bool,
    optional: bool,
    vampire: bool,
    climax: bool,
    dead: bool,
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Offset {
    x: f32,
    y: f32,
    z: f32,
    r: u8,
}

// impl Position {
//     pub fn default() -> Position {
//         Position {
//             sex: Sex::default(),
//             race: "Human".into(),
//             event: "".into(),
//             extra: Extra::default(),
//             offset: Offset::default(),
//         }
//     }
// }

// impl Sex {
//     pub fn default() -> Sex {
//         Sex {
//             male: true,
//             female: false,
//             futa: false,
//         }
//     }
// }

// impl Extra {
//     pub fn default() -> Extra {
//         Extra {
//             submissive: false,
//             optional: false,
//             vampire: false,
//             climax: false,
//             dead: false,
//         }
//     }
// }

// impl Offset {
//     pub fn default() -> Offset {
//         Offset {
//             x: 0.0,
//             y: 0.0,
//             z: 0.0,
//             r: 0,
//         }
//     }
// }
