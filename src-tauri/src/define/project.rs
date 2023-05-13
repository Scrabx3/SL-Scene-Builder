use std::collections::HashMap;
use uuid::Uuid;

use super::scene::Scene;

#[repr(C)]
#[derive(Debug)]
pub struct Project {
    pub pack_name: String,
    pub pack_author: String,

    pub scenes: HashMap<Uuid, Scene>,
}

impl Project {
    pub fn save_scene(&mut self, scene: Scene) -> &Scene {
        let id = scene.id;
        self.scenes.insert(id, scene);
        self.scenes.get(&id).unwrap()
    }

    pub fn get_scene(&self, id: &Uuid) -> Option<&Scene> {
        self.scenes.get(id)
    }

    pub fn discard_scene(&mut self, id: &Uuid) -> Option<Scene> {
        self.scenes.remove(id)
    }
}
