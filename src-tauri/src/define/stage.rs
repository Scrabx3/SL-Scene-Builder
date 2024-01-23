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
}

impl Stage {
    pub fn from_count(count: usize) -> Self {
        let mut ret = Self::default();
        ret.positions = vec![Default::default(); count];

        ret
    }

    pub fn import_offset(&mut self, yaml_obj: &serde_yaml::Sequence) -> Result<(), String> {
        let list: Vec<_> = yaml_obj
            .iter()
            .map_while(|obj| {
                obj.as_mapping().and_then(|mapping| {
                    mapping
                        .get(&"transform".into())
                        .and_then(|obj| obj.as_mapping())
                })
            })
            .collect();
        if list.len() != self.positions.len() {
            return Err(format!(
                "Invalid position length, got {} but exepcted {}",
                list.len(),
                self.positions.len(),
            ));
        }
        for (i, pos_obj) in list.iter().enumerate() {
            self.positions[i].import_offset(*pos_obj)?;
        }

        Ok(())
    }
}

impl EncodeBinary for Stage {
    fn get_byte_size(&self) -> usize {
        let mut ret = NANOID_LENGTH
            + 3 * size_of::<u64>()
            + self.tags.len() * size_of::<u64>()
            + size_of::<i32>()
            + self.extra.nav_text.len();
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
        // positions
        buf.extend_from_slice(&(self.positions.len() as u64).to_be_bytes());
        for position in &self.positions {
            position.write_byte(buf);
        }
        // extra
        let l_ = (self.extra.fixed_len * 1000.0).round() as i32;
        buf.extend_from_slice(&l_.to_be_bytes());
        buf.extend_from_slice(&(self.extra.nav_text.len() as u64).to_be_bytes());
        buf.extend_from_slice(self.extra.nav_text.as_bytes());
        // tags
        buf.extend_from_slice(&(self.tags.len() as u64).to_be_bytes());
        for tag in &self.tags {
            let tmp: String = tag.chars().filter(|c| !c.is_whitespace()).collect();
            let tmp = tmp.to_lowercase();
            buf.extend_from_slice(&(tmp.len() as u64).to_be_bytes());
            buf.extend_from_slice(tmp.as_bytes());
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
