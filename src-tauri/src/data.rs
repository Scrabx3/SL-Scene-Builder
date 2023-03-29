use once_cell::sync::Lazy;
use rand::Rng;
use std::sync::Mutex;
use std::collections::HashMap;

use crate::define;

#[repr(C)]
#[derive(Debug)]
pub struct Scene
{
  author: String,

  animations: Vec<define::Animation>,
  stages: HashMap<u64, define::Stage>
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
    pub fn get_stage(&self, id: u64) -> Option<&define::Stage> {
      self.stages.get(&id)
    }

    pub fn read_file(&self) -> Result<(), &'static str> {
      Ok(())
    }

    pub fn parse_file(&self) -> Result<(), &'static str> {
      Ok(())
    }
    
    pub fn insert_stage(&mut self, mut stage: define::Stage) -> &define::Stage {
      if stage.id == 0 {
        return self.add_new_stage(stage);
      }
      let id = stage.id;
      self.stages.insert(id, stage);
      self.stages.get(&id).unwrap()
    }

    fn add_new_stage(&mut self, mut stage: define::Stage) -> &define::Stage {
      if self.stages.len() == (u64::MAX - 1) as usize {
        panic!("Maximum number of stages reached");
      }
      let mut rng = rand::thread_rng();
      let mut id: u64;
      while {
        // E(X) = 1
        id = rng.gen_range(1..=u64::MAX);

        self.stages.contains_key(&id)
      } {}
      stage.id = id;
      self.stages.insert(id, stage);
      self.stages.get(&id).unwrap()
    }

    pub fn remove_stage(&mut self, stage: &define::Stage) -> Result<define::Stage, ()> {
      self.remove_stage_by_id(&stage.id)
    }
    
    pub fn remove_stage_by_id(&mut self, id: &u64) -> Result<define::Stage, ()>
    {
      let res = self.stages.remove(id);
      
      if res.is_none() {
        return Err(());
      }
      Ok(res.unwrap())
    }

    fn make_unique_id(&self) -> u64 {
      if self.stages.len() == (u64::MAX - 1) as usize {
        panic!("Maximum number of stages reached");
      }
      let mut rng = rand::thread_rng();
      let mut id: u64;
      while {
        // E(X) = 1
        id = rng.gen_range(1..=u64::MAX);

        self.stages.contains_key(&id)
      } {}

      id
    }

}