use serde::{Serialize, Deserialize};
use rand::{self, Rng};

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Stage
{
	id: u64,
	name: String,

	positions: Vec<Position>,
	offset: Vec<f32>,
	extra: Vec<Value>,
	tags: Vec<String>
}

impl Stage {
	pub fn default() -> Stage {
		Stage{ 
			id: 0,
			name: String::from(""),
			positions: vec![Position::default()],
			offset: vec![0.0, 0.0, 0.0, 0.0],
			extra: vec![],
			tags: vec![]
		}
	}

	pub fn make_id(mut self) -> Stage {
		let rng = rand::thread_rng().gen_range(1..=u64::MAX);
		self.id = rng;

		self
	}

	pub fn get_id(&self) -> u64 {
		self.id
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

  extra: Vec<String>
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

#[repr(C)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Value
{
	tag: String,
	v: f32
}
