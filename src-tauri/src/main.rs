#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod define;

#[tauri::command]
async fn stage_creator(handle: tauri::AppHandle)
{
  println!("Invoked stage_creator");
  let _stage = tauri::WindowBuilder::new(
    &handle,
    "stage_window",
    tauri::WindowUrl::App("./stage.html".into())
  ).build().unwrap();
}

#[tauri::command]
fn get_stage() -> define::Stage
{
  println!("Invoked get_stage");
  // TODO: this should return a new default initialized stage object OR a preloaded one for editing
  define::Stage::default()
}

#[tauri::command]
fn make_position() -> define::Position
{
  define::Position::default()
}

fn main()
{
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      stage_creator,
      get_stage,
      make_position])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
