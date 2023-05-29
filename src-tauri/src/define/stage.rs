use std::{mem::size_of, vec};

use nanoid::nanoid;
use serde::{Deserialize, Serialize};

use super::{position::Position, serialize::EncodeBinary, NanoID, NANOID_ALPHABET, NANOID_LENGTH};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Stage {
    pub id: NanoID,
    pub name: String,

    pub positions: Vec<Position>,
    pub tags: Vec<String>,
    pub extra: Extra,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Extra {
    pub fixed_len: f32,
    pub nav_text: String,
    pub allow_bed: bool,
    // TODO: furniture definition
}

impl Stage {
    pub fn from_count(count: usize) -> Self {
        let mut ret = Self::default();
        ret.positions = vec![Default::default(); count];

        ret
    }
}

impl EncodeBinary for Stage {
    fn get_byte_size(&self) -> usize {
        let mut ret = NANOID_LENGTH
            + 2 * size_of::<u64>()
            + size_of::<i32>()
            + self.extra.nav_text.len()
            + self.tags.len()
            + 2;
        for tag in &self.tags {
            ret += tag.len() + 1;
        }
        for position in &self.positions {
            ret += position.get_byte_size();
        }

        ret
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        // positions
        buf.extend_from_slice(&(self.positions.len() as u64).to_le_bytes());
        for position in &self.positions {
            position.write_byte(buf);
        }
        // id
        buf.extend_from_slice(self.id.as_bytes());
        buf.push(0);
        // extra
        let l_ = (self.extra.fixed_len * 1000.0).round() as i32;
        buf.extend_from_slice(&l_.to_le_bytes());
        buf.extend_from_slice(self.extra.nav_text.as_bytes());
        buf.push(0);
        // tags
        buf.extend_from_slice(&(self.tags.len() as u64).to_le_bytes());
        for tag in &self.tags {
            buf.extend_from_slice(tag.as_bytes());
            buf.push(0);
        }
    }
}

impl PartialEq for Stage {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

impl Default for Stage {
    fn default() -> Self {
        Self {
            id: nanoid!(NANOID_LENGTH, &NANOID_ALPHABET),
            name: Default::default(),
            positions: vec![Position::default()],
            tags: Default::default(),
            extra: Default::default(),
        }
    }
}
