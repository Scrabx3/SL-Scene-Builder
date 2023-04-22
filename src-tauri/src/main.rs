#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
use std::fmt::format;

use substring::Substring;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu, WindowBuilder, Manager, Runtime};
use uuid::Uuid;

mod define;
mod data;

/// MAIN
fn main()
{
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      stage_creator,
      stage_creator_from,
      get_stage,
      save_stage,
      make_position])
    .setup(|app| {
      let window = WindowBuilder::new(
          app,
          "main_window".to_string(),
          tauri::WindowUrl::App("index.html".into()),
        )
        .title("SexLab Scene Builder")
        .menu(tauri::Menu::new()
          .add_submenu(tauri::Submenu::new("File", tauri::Menu::new()
              .add_item(tauri::CustomMenuItem::new("new_prjct", "New Project").accelerator("cmdOrControl+N"))
          ))
        )
        .build()
        .expect("Failed to create main window");
      window.on_window_event(|event| match event {
        tauri::WindowEvent::CloseRequested {
          api, ..
        } => {
          println!("on_window_event CloseRequest");
          std::process::exit(0);
        }
        _ => {}
      });
      Ok(())
    })
    .on_page_load(|window, _| {
      if window.label().starts_with("stage_builder") {

      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

/// COMMANDS

const STAGE_EDITOR_LABEL: &str = "stage_editor";

/* State related */

#[tauri::command]
async fn stage_creator<R: Runtime>(app: tauri::AppHandle<R>, id: Option<Uuid>)
{
  let id = id.unwrap_or(Uuid::nil());
  let label = format!("{}{}", STAGE_EDITOR_LABEL, id);
  if let Some(window) = app.get_window(&label) {
    if window.unminimize().is_ok() && window.set_focus().is_ok() {
      return;
    }
    window.close().expect(format!("Stage editor window {} does not react", label).as_str());
  }
  let name = data::DATA.lock().unwrap()
    .get_stage(&id)
    .and_then(|stage| { Some(stage.name.clone()) })
    .unwrap_or(String::from("UNTITLED"));
  tauri::WindowBuilder::new(
      &app,
      label,
      tauri::WindowUrl::App("./stage.html".into())
    )
    .title(format!("Stage Editor [{}]", name))
    .build()
    .unwrap();
}

#[tauri::command]
async fn stage_creator_from<R: Runtime>(app: tauri::AppHandle<R>, _window: tauri::Window<R>, id: Uuid) -> Result<(), String> {
  let mut data = data::DATA.lock().unwrap();
  let original = data.get_stage(&id);
  match original {
    None => { return Err("Invalid id".into()); }
    Some(stage) => {
      let tmp = define::Stage::from(stage);
      let res = data.insert_stage(tmp);
      tauri::WindowBuilder::new(
            &app,
            format!("{}{}", STAGE_EDITOR_LABEL, res.id),
            tauri::WindowUrl::App("./stage.html".into())
          )
          .title(format!("Stage Editor [{}]", res.name))
          .build()
          .unwrap();
    }
  }
  Ok(())
} 

#[tauri::command]
fn get_stage<R: Runtime>(_app: tauri::AppHandle<R>, window: tauri::Window<R>) -> define::Stage {
  let label = window.label();
  Uuid::parse_str(label.substring(STAGE_EDITOR_LABEL.len(), label.len()))
    .and_then(|id| {
      if !id.is_nil() {
        let data = data::DATA.lock().unwrap();
        let somestage = data.get_stage(&id);
        match somestage {
          Some(it) => {return Ok(it.clone());},
          None => {println!("Invalid Stage ID: {}", id)},
        }
      }
      Ok(define::Stage::default())
    })
    .unwrap_or_else(|e| {print!("{}", e); define::Stage::default()})
}

#[tauri::command]
async fn save_stage<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::Window<R>, stage: define::Stage) -> () {
  let mut data = data::DATA.lock().unwrap();
  let stage_ref = data.insert_stage(stage);

  app.get_window("main_window")
    .expect("Unable to get main window")
    .emit("save_stage", stage_ref)
    .expect("Failed to send callback event to main window");

  window.close().expect("Failed to close stage builder window");
}

/* Position related */

// IDEA: allow copy initialize a new position on front end?
// #[tauri::command]
// async fn make_position_from<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::Window<R>, from: define::Position) -> Result<(), String> {
//   Ok(())
// }

#[tauri::command]
fn make_position<R: Runtime>(_app: tauri::AppHandle<R>, _window: tauri::Window<R>) -> define::Position {
  define::Position::default()
}
