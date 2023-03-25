#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu, WindowBuilder, Manager};
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
      save_stage])
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
fn save_stage(window: tauri::Window, mut stage: define::Stage)
{
  let id = get_window_stage_id(&window);
  if id == 0 {
    stage = stage.make_id();
  }
  data::DATA.lock().unwrap()
    .add_stage(stage)
    .expect("Failed to add stage");

  window.close().expect("Failed to close window");
}

/// UTILITY

fn get_window_stage_id(window: &tauri::Window) -> u64 {
  // "stage_window_<id>"
  let label = window.label();
  let str_id = label.substring(label.rfind('_').unwrap() + 1, label.len());
  println!("str_id = {}", str_id);
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
