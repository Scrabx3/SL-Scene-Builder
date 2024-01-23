use serde::de::{self};
use serde::Deserializer;
use serde::{Deserialize, Serialize};
use std::mem::size_of;
use std::{fmt, vec};

use super::serialize::{EncodeBinary, Offset};
use crate::racekeys::get_race_key_bytes;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position {
    pub sex: Sex,
    pub race: String,
    #[serde(deserialize_with = "deserialize_vec_or_string")]
    pub event: Vec<String>,

    pub scale: f32,
    pub extra: Extra,
    pub offset: Offset,
    pub anim_obj: String,
    pub strip_data: Stripping,
}

struct DeserializeVecOrString;
impl<'de> de::Visitor<'de> for DeserializeVecOrString {
    type Value = Vec<String>;

    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("a vector or a string")
    }

    fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
    where
        A: de::SeqAccess<'de>,
    {
        let mut ret = Vec::new();
        while let Some(data) = seq.next_element()? {
            ret.push(data);
        }
        Ok(ret)
    }

    fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
    where
        E: de::Error,
    {
        Ok(vec![v.to_string()])
    }
}
fn deserialize_vec_or_string<'de, D>(deserializer: D) -> Result<Vec<String>, D::Error>
where
    D: Deserializer<'de>,
{
    deserializer.deserialize_any(DeserializeVecOrString)
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
    #[serde(skip_serializing, default)]
    pub optional: bool, // Unused
    pub vampire: bool,
    pub climax: bool,
    pub dead: bool,

    #[serde(default)]
    pub custom: Vec<String>,
    // Using string vector instead for more dynamic application
    #[serde(skip_serializing, default)]
    pub handshackles: bool,
    #[serde(skip_serializing, default)]
    pub yoke: bool,
    #[serde(skip_serializing, default)]
    pub armbinder: bool,
    #[serde(skip_serializing, default)]
    pub legbinder: bool,
    #[serde(skip_serializing, default)]
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
        let mut ret =
            size_of::<u64>() + size_of::<i32>() + self.extra.custom.len() * size_of::<u64>() + 3;
        for tag in &self.extra.custom {
            ret += tag.len() + 1;
        }
        ret
    }

    pub fn write_byte_meta(&self, buf: &mut Vec<u8>) -> () {
        // race
        let racebyte = get_race_key_bytes(&self.race).unwrap();
        buf.push(racebyte);
        // sex
        if !self.sex.male && !self.sex.female && !self.sex.futa {
            panic!("Position missing sex option");
        }
        buf.push(self.sex.male as u8 + 2 * self.sex.female as u8 + 4 * self.sex.futa as u8);
        // scale
        let s_ = (self.scale * 1000.0).round() as i32;
        buf.extend_from_slice(&s_.to_be_bytes());
        // extra
        buf.push(
            self.extra.submissive as u8 + 4 * self.extra.vampire as u8 + 8 * self.extra.dead as u8,
        );
        buf.extend_from_slice(&(self.extra.custom.len() as u64).to_be_bytes());
        for tag in &self.extra.custom {
            let tmp: String = tag.chars().filter(|c| !c.is_whitespace()).collect();
            let tmp = tmp.to_lowercase();
            buf.extend_from_slice(&(tmp.len() as u64).to_be_bytes());
            buf.extend_from_slice(tmp.as_bytes());
        }
    }

    pub fn import_offset(&mut self, yaml_obj: &serde_yaml::Mapping) -> Result<(), String> {
        let loc = yaml_obj[&"Location".into()]
            .as_sequence()
            .ok_or("Location is not a sequence")?
            .iter()
            .fold(vec![], |mut acc, it| {
                if let Some(float) = it.as_f64() {
                    acc.push(float);
                }
                acc
            });
        if loc.len() != 3 {
            return Err(format!(
                "Invalid location vector, expected length 3 but got {}",
                loc.len()
            ));
        }
        let rot = yaml_obj[&"Rotation".into()]
            .as_f64()
            .ok_or("Rotation is not a float")?;

        self.offset.x = loc[0] as f32;
        self.offset.y = loc[1] as f32;
        self.offset.z = loc[2] as f32;
        self.offset.r = rot as f32;

        Ok(())
    }
}

impl EncodeBinary for Position {
    fn get_byte_size(&self) -> usize {
        let mut ret =
            size_of::<u64>() + self.offset.get_byte_size() + self.strip_data.get_byte_size() + 1; // climax
        for e in &self.event {
            ret += e.len();
        }
        ret
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        // event
        buf.extend_from_slice(&(self.event[0].len() as u64).to_be_bytes());
        buf.extend_from_slice(self.event[0].as_bytes());
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
