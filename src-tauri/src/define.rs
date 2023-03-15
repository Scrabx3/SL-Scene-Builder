// use aws_sdk_dynamodb::model::TableDescription;

// --- Gender
// Female = 0,
// Male,
// Futa,
// CrtMale,
// CrtFemale

// --- PositionExtra
// Victim = 0,
// Vampire,
// AmputeeAR,
// AmputeeAL,
// AmputeeLR,
// AmputeeLL,
// Dead

// --- StageExtraType
// FixedLength,
// Orgasm

use serde::Serialize;

#[repr(C)]
#[derive(Debug, Serialize)]
pub struct Value
{
	tag: String,
	v: i32
}

#[repr(C)]
#[derive(Debug, Serialize)]
pub struct Position
{
  genders: Vec<Value>,
  race: String,
	event: String,

  extra: Vec<Value>
}

#[repr(C)]
#[derive(Debug, Serialize)]
pub struct Stage
{
	id: String,
	name: String,

	positions: Vec<Position>,
	extra: Vec<Value>
}

impl Value {
	pub fn new(tag: String, v: i32) -> Value {
		Value{ tag, v }
	}
}

impl Position {
	pub fn default() -> Position {
		Position {
			genders: vec![
				Value::new(String::from("Male"), 0),
				Value::new(String::from("Female"), 0),
				Value::new(String::from("Futa"), 0),
				Value::new(String::from("Female Creature"), 0),
				Value::new(String::from("Male Creature"), 0),
			],
			race: String::from("Human"),
			event: String::from(""),
			extra: vec![]
		}
	}
}

impl Stage {
	pub fn default() -> Stage {
		// TODO: ids should be default initialized into some unique id for the current project
		Stage{ 
			id: String::from("someid"), 
			name: String::from("NO NAME"),
			positions: vec![Position::default()], 
			extra: vec![] 
		}
	}
}
