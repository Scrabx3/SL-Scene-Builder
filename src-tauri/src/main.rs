#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
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

#[tauri::command]
async fn stage_creator(handle: tauri::AppHandle, id: Option<Uuid>)
{
  let id = id.unwrap_or(Uuid::nil());
  let label = format!("{}{}", STAGE_EDITOR_LABEL, id);
  let window = handle.get_window(&label);
  if window.is_some() {
    let w = window.unwrap();
    w.unminimize().expect("Unable to maximize window");
    match w.set_focus() {
      Ok(_) => { return; }
      Err(_) => { w.close().expect("Unable to close window"); },
    }
  }
  let name = data::DATA.lock().unwrap()
    .get_stage(&id)
    .and_then(|stage| {Some(stage.name.clone())})
    .unwrap_or(String::from("UNTITLED"));
  tauri::WindowBuilder::new(
      &handle,
      label,
      tauri::WindowUrl::App("./stage.html".into())
    )
    .title(format!("Stage Editor [{}]", name))
    .build()
    .unwrap();
}

#[tauri::command]
fn make_position<R: Runtime>(_app: tauri::AppHandle<R>, _window: tauri::Window<R>) -> define::Position {
  define::Position::default()
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

// IDEA: allow copy initialize a new position on front end?
// #[tauri::command]
// async fn make_position_from<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::Window<R>, from: define::Position) -> Result<(), String> {
//   Ok(())
// }

#[tauri::command]
async fn save_stage(window: tauri::Window, app_handle: tauri::AppHandle, stage: define::Stage) -> () {
  let copy = data::DATA.lock().unwrap()
    .insert_stage(stage)
    .expect("Failed to save stage. ID corrupted?")
    .clone();

  match app_handle.get_window("main_window") {
    Some(window) => {
      window.emit("save_stage", copy).unwrap();
    },
    None => {
      panic!("Cannot find main window");
    },
  }

  window.close().expect("Failed to close stage builder window");
}
