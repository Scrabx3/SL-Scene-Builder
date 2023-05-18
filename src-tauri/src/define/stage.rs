use std::{mem::size_of, u128, vec};

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{position::Position, serialize::EncodeBinary};

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
    // TODO: furniture definition
}

impl EncodeBinary for Stage {
    fn get_byte_size(&self) -> usize {
        let mut ret = size_of::<u128>()
            + 2 * size_of::<usize>()
            + size_of::<f32>()
            + self.extra.nav_text.len()
            + self.tags.len()
            + 1;
        for tag in &self.tags {
            ret += tag.len() + 1;
        }
        for position in &self.positions {
            ret += position.get_byte_size();
        }

        ret
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        // id
        buf.extend_from_slice(self.id.as_bytes());
        // extra
        buf.extend_from_slice(&self.extra.fixed_len.to_be_bytes());
        buf.extend_from_slice(self.extra.nav_text.as_bytes());
        buf.push(0);
        // tags
        buf.extend_from_slice(&self.tags.len().to_be_bytes());
        for tag in &self.tags {
            buf.extend_from_slice(tag.as_bytes());
            buf.push(0);
        }
        // positions
        buf.extend_from_slice(&self.positions.len().to_be_bytes());
        for position in &self.positions {
            position.write_byte(buf);
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
            id: Uuid::new_v4(),
            name: Default::default(),
            positions: vec![Position::default()],
            tags: Default::default(),
            extra: Default::default(),
        }
    }
}
