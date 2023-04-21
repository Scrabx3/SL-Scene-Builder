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

  pub fn read_file(&self) -> Result<(), &'static str> {
    Ok(())
  }

  pub fn parse_file(&self) -> Result<(), &'static str> {
    Ok(())
  }
  
  pub fn insert_stage(&mut self, mut stage: define::Stage) -> Result<&define::Stage, &'static str> {
    if stage.id.is_nil() {
      println!("Adding a new stage into scene");
      stage.id = Uuid::new_v4();
      if stage.name.is_empty() {
          stage.name = stage.id.to_string();
      }
      println!("Inserted new stage with id: {}", stage.id.to_string());
    } else if !self.stages.contains_key(&stage.id) {
      return Err("Given stage uses an invalid key");
    }
    let id = stage.id;
    self.stages.insert(id, stage);
    Ok(self.stages.get(&id).unwrap())
  }

  pub fn remove_stage(&mut self, stage: &define::Stage) -> Result<define::Stage, ()> {
    self.remove_stage_by_id(&stage.id)
  }
  
  pub fn remove_stage_by_id(&mut self, id: &Uuid) -> Result<define::Stage, ()>
  {
    let res = self.stages.remove(id);
    
    if res.is_none() {
      return Err(());
    }
    Ok(res.unwrap())
  }

}