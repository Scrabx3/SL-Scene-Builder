use serde::de::{self};
use serde::Deserializer;
use serde::{Deserialize, Serialize};
use std::mem::{size_of, size_of_val};
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
    #[serde(default)]
    pub schlong: i8,
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
        size_of::<Option<u8>>() //  get_race_key_bytes()
            + size_of::<u8>()   // size_of sex byte
            + size_of_val(&self.scale)
            + size_of::<u8>()   // sizeof extra byte
            + size_of_val(&self.extra.custom.len())
            + size_of_val(&self.extra.custom)
            + self.extra.custom.iter().fold(0, |acc, x| acc + &x.len())
    }

    pub fn write_byte_meta(&self, buf: &mut Vec<u8>) -> () {
        buf.push(get_race_key_bytes(&self.race).unwrap());
        if !self.sex.male && !self.sex.female && !self.sex.futa {
            panic!("Position missing sex option");
        }
        buf.push(self.sex.male as u8 + 2 * self.sex.female as u8 + 4 * self.sex.futa as u8);
        buf.extend_from_slice(&((self.scale * 1000.0).round() as i32).to_be_bytes());
        buf.push(
            self.extra.submissive as u8 + 4 * self.extra.vampire as u8 + 8 * self.extra.dead as u8,
        );
        buf.extend_from_slice(&(self.extra.custom.len() as u64).to_be_bytes());
        for tag in &self.extra.custom {
            let tmp = tag
                .chars()
                .filter(|c| !c.is_whitespace())
                .collect::<String>()
                .to_lowercase();
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
        size_of_val(&self.event[0].len())
            + size_of_val(&self.event[0])
            + self.offset.get_byte_size()
            + self.strip_data.get_byte_size()
            + size_of_val(&self.extra.climax)
            + size_of_val(&self.schlong)
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        // Only save initial event, all others are called by Havok
        buf.extend_from_slice(&(self.event[0].len() as u64).to_be_bytes());
        buf.extend_from_slice(self.event[0].as_bytes());
        buf.push(self.extra.climax as u8);
        self.offset.write_byte(buf);
        self.strip_data.write_byte(buf);
        buf.push(self.schlong as u8);
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
            schlong: Default::default(),
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
