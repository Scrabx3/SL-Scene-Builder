use serde::{Serialize, Deserialize};
use uuid::Uuid;
use std::{collections::BTreeMap, vec};

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Animation
{
	pub id: Uuid,
	pub name: String,
	
	pub start_animation: Uuid,
	pub graph: BTreeMap<Uuid, GraphNode>
}

impl Animation
{
	pub fn default() -> Animation {
		Animation { 
			id: Uuid::nil(), 
			name: "".into(), 
			start_animation: Uuid::nil(), 
			graph: BTreeMap::new()
		}
	}
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GraphNode
{
	pub edges: Vec<Uuid>,
	pub x: f32,
	pub y: f32
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Stage
{
	pub id: Uuid,
	pub name: String,

	pub positions: Vec<Position>,
	pub tags: Vec<String>,
	pub extra: StageExtra
}

impl Stage {
	pub fn default() -> Stage {
		Stage{
			id: Uuid::nil(),
			name: "".into(),
			positions: vec![Position::default()],
			tags: vec![],
			extra: StageExtra::default(),
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
			extra: StageExtra::default(),
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
pub struct StageExtra
{
	pub fixed_len: f32,
	pub is_orgasm: bool,
	pub nav_text: String,
}

impl StageExtra {
	pub fn default() -> StageExtra {
		StageExtra { 
			fixed_len: 0.0, 
			is_orgasm: false, 
			nav_text: "".into()
		}
	}
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position
{
  pub sex: Sex,
  pub race: String,
	pub event: String,

  pub extra: PositionExtra,
	pub offset: Offset
}

impl Position {
	pub fn default() -> Position {
		Position {
			sex: Sex { male: true, female: false, futa: false },
			race: String::from("Human"),
			event: String::from(""),
			extra: PositionExtra { submissive: false, optional: false, vampire: false, dead: false },
			offset: Offset { x: 0.0, y: 0.0, z: 0.0, rot: 0.0 }
		}
	}

	pub fn from(origin: &Position) -> Position {
		Position {
			sex: origin.sex.clone(),
			race: origin.race.clone(),
			event: String::from(""),
			extra: origin.extra.clone(),
			offset: origin.offset.clone()
		}
	}
}

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PositionExtra
{
	submissive: bool,
	optional: bool,
	vampire: bool,
	dead: bool
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
pub struct Sex
{
	male: bool,
	female: bool,
	futa: bool
}
