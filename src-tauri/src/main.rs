#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

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

fn main()
{
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      stage_creator])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
