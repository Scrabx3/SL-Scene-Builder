use std::mem::size_of;

use serde::{Deserialize, Serialize};

use super::serialize::EncodeBinary;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position {
    pub sex: Sex,
    pub race: String,
    pub event: String,

    pub scale: f32,
    pub extra: Extra,
    pub offset: Offset,
    pub anim_obj: String,
    // TODO: stripping
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Sex {
    male: bool,
    female: bool,
    futa: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Extra {
    submissive: bool,
    optional: bool,
    vampire: bool,
    climax: bool,
    dead: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Offset {
    x: f32,
    y: f32,
    z: f32,
    r: u8,
}

impl EncodeBinary for Position {
    fn get_byte_size(&self) -> usize {
        3 * size_of::<u8>() // 2 bitflag + offset
            + 4 * size_of::<f32>()  // 3 Offset + Scale
            + self.race.len()
            + self.event.len()
            + self.anim_obj.len()
            + 3 // 3 strings
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        // event
        buf.extend_from_slice(self.event.as_bytes());
        buf.push(0);
        // race
        buf.extend_from_slice(self.race.as_bytes());
        buf.push(0);
        // sex
        buf.push(self.sex.male as u8 + 2 * self.sex.female as u8 + 4 * self.sex.futa as u8);
        // scale
        buf.extend_from_slice(&self.scale.to_be_bytes());
        // extra
        buf.push(
            self.extra.submissive as u8
                + 2 * self.extra.optional as u8
                + 4 * self.extra.vampire as u8
                + 8 * self.extra.climax as u8
                + 16 * self.extra.dead as u8,
        );
        // offset
        buf.extend_from_slice(&self.offset.x.to_be_bytes());
        buf.extend_from_slice(&self.offset.y.to_be_bytes());
        buf.extend_from_slice(&self.offset.z.to_be_bytes());
        buf.push(self.offset.r);
        // anim obj
        buf.extend_from_slice(self.anim_obj.as_bytes());
        buf.push(0);
    }
}

impl Default for Position {
    fn default() -> Self {
        Self {
            sex: Default::default(),
            race: "Human".into(),
            event: Default::default(),
            scale: 1.0,
            extra: Default::default(),
            offset: Default::default(),
            anim_obj: Default::default(),
        }
    }
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
