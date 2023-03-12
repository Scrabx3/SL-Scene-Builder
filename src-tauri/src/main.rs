#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

// use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

// #[tauri::command]
// fn stage_creator()
// {
//   println!("Invoked stage_creator");
//   tauri::Builder::default()
//   .setup(|app| {
//     let docs_window = tauri::WindowBuilder::new(
//       app,
//       "external", /* the unique window label */
//       tauri::WindowUrl::External("https://tauri.app/".parse().unwrap())
//     ).build()?;
//     Ok(())
//   });
// }

fn main()
{
  tauri::Builder::default()
    // .invoke_handler(tauri::generate_handler![stage_creator])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
