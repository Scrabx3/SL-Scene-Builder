#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu, WindowBuilder, Manager, Runtime};
use substring::Substring;

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
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

/// COMMANDS

#[tauri::command]
async fn stage_creator(handle: tauri::AppHandle, id: i64)
{
  let label = format!("{}{}", "stage_window_", id);
  let window = handle.get_window(&label);
  if window.is_some() {
    let w = window.unwrap();
    w.unminimize().expect("Unable to maximize window");
    match w.set_focus() {
      Ok(_) => { return }
      Err(_) => { w.close().expect("Unable to close window"); },
    }
  }

  tauri::WindowBuilder::new(
      &handle,
      label,
      tauri::WindowUrl::App("./stage.html".into())
    )
    .title(format!("Stage Editor [{}]", id))
    .build()
    .unwrap();
}

#[tauri::command]
fn get_stage(window: tauri::Window) -> define::Stage
{
  let id = get_window_stage_id(&window);
  if id != 0 {
    let d = data::DATA.lock().unwrap();
    let r = d.get_stage(id);

    if r.is_some() {
      return r.unwrap().clone()
    }
  }

  define::Stage::default()
}

#[tauri::command]
fn make_position<R: Runtime>(_app: tauri::AppHandle<R>, _window: tauri::Window<R>) -> define::Position {
  define::Position::default()
}

// IDEA: allow copy initialize a new position on front end?
// #[tauri::command]
// async fn make_position_from<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::Window<R>, from: define::Position) -> Result<(), String> {
//   Ok(())
// }

#[tauri::command]
async fn save_stage(window: tauri::Window, app_handle: tauri::AppHandle, mut stage: define::Stage)
{
  stage.id = get_window_stage_id(&window);
  let mut data = data::DATA.lock().unwrap();
  let insert = data.insert_stage(stage);

  match app_handle.get_window("main_window") {
    Some(window) => {
      window.emit("save_stage", insert.clone()).unwrap();
    },
    None => {
      panic!("Cannot find main window");
    },
  }

  window.close().expect("Failed to close stage builder window");
}

/// UTILITY

fn get_window_stage_id(window: &tauri::Window) -> u64 {
  // "stage_window_<id>"
  let label = window.label();
  let str_id = label.substring(label.rfind('_').unwrap() + 1, label.len());
  let result = str_id.parse::<u64>();
  match result {
    Ok(_) => {
      return result.unwrap()
    }
    Err(_) => {
      println!("{:?}", result);
      return 0
    }
  }
}
