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

  animations: HashMap<Uuid, define::Animation>,
  stages: HashMap<Uuid, define::Stage>
}
pub static DATA: Lazy<Mutex<Scene>> = Lazy::new(|| {
  let s = Scene {
    author: String::from(""),

    animations: HashMap::new(),
    stages: HashMap::new()
  };
  Mutex::new(s)
});

impl Scene {
  pub fn get_stage(&self, id: &Uuid) -> Option<&define::Stage> {
    self.stages.get(id)
  }

  pub fn insert_stage(&mut self, mut stage: define::Stage) -> &define::Stage {
    if stage.id.is_nil() {
      stage.id = Uuid::new_v4();
      println!("Inserted new stage with id: {}", stage.id.to_string());
    }
    let id = stage.id;
    self.stages.insert(id, stage);

    self.stages.get(&id).unwrap()
  }

  pub fn remove_stage(&mut self, id: &Uuid) -> Option<define::Stage> {
    self.stages.remove(id)
  }

  pub fn get_stage_usage_count(&self, id: &Uuid) -> u32 {
    let mut ret = 0;
    for (_, value) in &self.animations {
      for (key, _) in &value.graph {
        if key == id {
          ret += 1;
        }
      }
    }

    ret
  }

  // pub fn get_animation(&self, id: &Uuid) -> Option<&define::Animation> {
    // self.animations.get(id)
  // }

  pub fn insert_animation(&mut self, mut scene: define::Animation) -> &define::Animation {
    if scene.id.is_nil() {
      scene.id = Uuid::new_v4();
      println!("Inserted new stage with id: {}", scene.id.to_string());
    }
    let id = scene.id;
    self.animations.insert(id, scene);

    self.animations.get(&id).unwrap()
  }

  pub fn remove_animation(&mut self, id: &Uuid) -> Option<define::Animation> {
    self.animations.remove(id)
  }
  
  // TODO: write these. one should read a json file and associated data to populate, the other print the same files out from data here
  // pub fn read_file(&self) -> Result<(), &'static str> {
  //   Ok(())
  // }

  // pub fn parse_file(&self) -> Result<(), &'static str> {
  //   Ok(())
  // }
  

}