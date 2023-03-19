use serde::Serialize;

#[repr(C)]
#[derive(Debug, Serialize)]
pub struct Value
{
	tag: String,
	v: f32
}

#[repr(C)]
#[derive(Debug, Serialize)]
pub struct Position
{
  genders: Vec<String>,
  race: String,
	event: String,

  extra: Vec<String>
}

#[repr(C)]
#[derive(Debug, Serialize)]
pub struct Stage
{
	id: String,
	name: String,

	positions: Vec<Position>,
	offset: Vec<f32>,
	extra: Vec<Value>,
	tags: Vec<String>
}

impl Position {
	pub fn default() -> Position {
		Position {
			genders: vec![String::from("Male")],
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
			id: String::from(""),
			name: String::from(""),
			positions: vec![Position::default()],
			offset: vec![0.0, 0.0, 0.0, 0.0],
			extra: vec![],
			tags: vec![]
		}
	}
}
