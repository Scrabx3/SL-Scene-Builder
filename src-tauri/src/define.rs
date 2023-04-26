use serde::{Serialize, Deserialize};
use uuid::Uuid;
use std::collections::BTreeMap;

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Animation
{
	name: String,
	
	start_animation: Uuid,
	graph: BTreeMap<Uuid, Vec<Uuid>>
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Stage
{
	pub id: Uuid,
	pub name: String,

	positions: Vec<Position>,
	tags: Vec<String>,

	extra: Vec<Value>
}

impl Stage {
	pub fn default() -> Stage {
		Stage{
			id: Uuid::nil(),
			name: "".into(),
			positions: vec![Position::default()],
			tags: vec![],
			extra: vec![]
		}
	}

	pub fn from(origin: &Stage) -> Stage {
		let mut positions = vec![];
		for p in &origin.positions {
				positions.push(Position::from(p));
		}
		Stage{
			id: Uuid::nil(),
			name: format!("{} - {}", origin.name, "COPY"),
			positions,
			tags: origin.tags.clone(),
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
			offset: Offset { x: 0.0, y: 0.0, z: 0.0, rot: 0.0 }
		}
	}

	pub fn from(origin: &Position) -> Position {
		Position {
			genders: origin.genders.clone(),
			race: origin.race.clone(),
			event: String::from(""),
			extra: origin.extra.clone(),
			offset: origin.offset.clone()
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
	rot: f32
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Value
{
	tag: String,
	v: String
}
