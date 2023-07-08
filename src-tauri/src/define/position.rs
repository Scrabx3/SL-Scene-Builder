use serde::{Deserialize, Serialize};
use std::mem::size_of;

use super::serialize::{EncodeBinary, Offset};
use crate::racekeys::get_race_key_bytes;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position {
    pub sex: Sex,
    pub race: String,
    pub event: String,

    pub scale: f32,
    pub extra: Extra,
    pub offset: Offset,
    pub anim_obj: String,
    pub strip_data: Stripping,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Sex {
    pub male: bool,
    pub female: bool,
    pub futa: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Extra {
    pub submissive: bool,
    pub optional: bool,
    pub vampire: bool,
    pub climax: bool,
    pub dead: bool,

    pub yoke: bool,
    pub armbinder: bool,
    pub legbinder: bool,
    pub petsuit: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Stripping {
    default: bool,

    everything: bool,
    nothing: bool,
    helmet: bool,
    gloves: bool,
    boots: bool,
}

impl Position {
    pub fn get_byte_size_meta(&self) -> usize {
        size_of::<u64>() + size_of::<i32>() + 3
    }

    pub fn write_byte_meta(&self, buf: &mut Vec<u8>) -> () {
        // race
        let racebyte = get_race_key_bytes(&self.race).unwrap();
        buf.push(racebyte);
        // sex
        buf.push(self.sex.male as u8 + 2 * self.sex.female as u8 + 4 * self.sex.futa as u8);
        // scale
        let s_ = (self.scale * 1000.0).round() as i32;
        buf.extend_from_slice(&s_.to_be_bytes());
        // extra
        buf.push(
            self.extra.submissive as u8
                + 2 * self.extra.optional as u8
                + 4 * self.extra.vampire as u8
                + 8 * self.extra.dead as u8
                + 16 * self.extra.yoke as u8
                + 32 * self.extra.armbinder as u8
                + 64 * self.extra.legbinder as u8
                + 128 * self.extra.petsuit as u8,
        );
    }
}

impl EncodeBinary for Position {
    fn get_byte_size(&self) -> usize {
        self.event.len()
            + size_of::<u64>()
            + self.offset.get_byte_size()
            + self.strip_data.get_byte_size()
            + 1 // climax
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        // event
        buf.extend_from_slice(&(self.event.len() as u64).to_be_bytes());
        buf.extend_from_slice(self.event.as_bytes());
        // climax
        buf.push(self.extra.climax as u8);
        // offset
        self.offset.write_byte(buf);
        // stripping
        self.strip_data.write_byte(buf);
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
            strip_data: Default::default(),
        }
    }
}

impl EncodeBinary for Stripping {
    fn get_byte_size(&self) -> usize {
        size_of::<u8>()
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        if self.default {
            buf.push(1 << 7);
        } else if self.everything {
            buf.push(u8::MAX);
        } else if self.nothing {
            buf.push(u8::MIN);
        } else {
            buf.push(self.helmet as u8 + 2 * self.gloves as u8 + 4 * self.boots as u8);
        }
    }
}

impl Default for Stripping {
    fn default() -> Self {
        Self {
            default: true,
            everything: Default::default(),
            nothing: Default::default(),
            helmet: Default::default(),
            gloves: Default::default(),
            boots: Default::default(),
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
