use once_cell::sync::Lazy;
use uuid::Uuid;
use std::sync::Mutex;
use std::collections::HashMap;

use crate::define;

#[repr(C)]
#[derive(Debug)]
pub struct Scene
{
  author: String,

  animations: Vec<define::Animation>,
  stages: HashMap<Uuid, define::Stage>
}
pub static DATA: Lazy<Mutex<Scene>> = Lazy::new(|| {
  let s = Scene {
    author: String::from(""),

    animations: Vec::new(),
    stages: HashMap::new()
  };
  Mutex::new(s)
});

impl Scene {
  pub fn get_stage(&self, id: &Uuid) -> Option<&define::Stage> {
    self.stages.get(id)
  }

  pub fn insert_stage(&mut self, mut stage: define::Stage) -> &define::Stage{
    if stage.id.is_nil() {
      stage.id = Uuid::new_v4();
      if stage.name.is_empty() {
        stage.name = "UNTITLED".into();
      }
      println!("Inserted new stage with id: {}", stage.id.to_string());
    }
    let id = stage.id;
    self.stages.insert(id, stage);

    self.stages.get(&id).unwrap()
  }

  pub fn remove_stage(&mut self, id: &Uuid) -> Result<define::Stage, ()>
  {
    let res = self.stages.remove(id);
    
    if res.is_none() {
      return Err(());
    }
    Ok(res.unwrap())
  }
  
  // TODO: write these. one should read a json file and associated data to populate, the other print the same files out from data here
  // pub fn read_file(&self) -> Result<(), &'static str> {
  //   Ok(())
  // }

  // pub fn parse_file(&self) -> Result<(), &'static str> {
  //   Ok(())
  // }
  

}