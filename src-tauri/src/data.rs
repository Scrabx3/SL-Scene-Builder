use once_cell::sync::Lazy;
use std::sync::Mutex;

use crate::define;

#[derive(Debug)]
#[repr(C)]
pub struct Scene
{
	stages: Vec<define::Stage>,
	// graph	TODO: define
}
pub static DATA: Lazy<Mutex<Scene>> = Lazy::new(|| {
  let s = Scene {
    stages: vec![]
  };
  Mutex::new(s)
});

impl Scene {
    pub fn get_stage(&self, id: u64) -> Option<&define::Stage> {
      let w = self.find(id);
      if w.is_none() {
        None
      } else {
        let ret = &self.stages[w.unwrap()];
        Some(ret)
      }
    }

    pub fn read_file(&self) -> Result<(), &'static str> {
      Ok(())
    }

    pub fn parse_file(&self) -> Result<(), &'static str> {
      Ok(())
    }

    pub fn add_stage(&mut self, stage: define::Stage) -> Result<&define::Stage, &'static str> {
      self.stages.push(stage);

      Ok(&self.stages.last().unwrap())
    }

    pub fn remove_stage(&mut self, stage: &define::Stage) -> Result<define::Stage, ()> {
      self.remove_stage_by_id(stage.get_id())
    }
    
    pub fn remove_stage_by_id(&mut self, id: u64) -> Result<define::Stage, ()>
    {
      let w = self.find(id);
      if w.is_none() {
        return Err(());
      }

      Ok(self.stages.swap_remove(w.unwrap()))
    }

    fn find(&self, id: u64) -> Option<usize> {
      self.stages.iter().position(|s| s.get_id() == id)
    }

}