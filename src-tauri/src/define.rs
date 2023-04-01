use serde::{Serialize, Deserialize};
use std::collections::BTreeMap;

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Animation
{
	pub name: String,
	pub graph: BTreeMap<u64, Vec<u64>>
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Stage
{
	pub id: u64,
	name: String,

	positions: Vec<Position>,
	tags: Vec<String>,

	extra: Vec<Value>
}

impl Stage {
	pub fn default() -> Stage {
		Stage{
			id: 0,
			name: String::from(""),
			positions: vec![Position::default()],
			tags: vec![],
			extra: vec![]
		}
	}
}

impl PartialEq for Stage {
  fn eq(&self, other: &Self) -> bool {
    self.id == other.id
  }
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position
{
  genders: Vec<String>,
  race: String,
	event: String,

  extra: Vec<String>,
	offset: Offset
}

impl Position {
	pub fn default() -> Position {
		Position {
			genders: vec![String::from("Male")],
			race: String::from("Human"),
			event: String::from(""),
			extra: vec![],
			offset: Offset { x: 0.0, y: 0.0, z: 0.0, angle: 0.0 }
		}
	}
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Offset
{
	x: f32,
	y: f32,
	z: f32,
	angle: f32
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Value
{
	tag: String,
	v: f32
}
