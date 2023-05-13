#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod define;

use define::{position::Position, project::Project, scene::Scene, stage::Stage};
use once_cell::sync::Lazy;
use std::{collections::HashMap, sync::Mutex};
use tauri::{CustomMenuItem, Manager, Menu, MenuItem, Runtime, Submenu, WindowBuilder};
use uuid::Uuid;

pub static PROJECT: Lazy<Mutex<Project>> = Lazy::new(|| {
    let prjct = Project {
        pack_name: "".into(),
        pack_author: "".into(),
        scenes: HashMap::new(),
    };
    Mutex::new(prjct)
});

/// MAIN
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_blank_scene,
            save_scene,
            delete_scene,
            open_stage_editor,
            // stage_creator_from,
            stage_save_and_close,
            make_position
        ])
        .setup(|app| {
            let window = WindowBuilder::new(
                app,
                "main_window".to_string(),
                tauri::WindowUrl::App("index.html".into()),
            )
            .title("SexLab Scene Builder")
            .menu(
                tauri::Menu::new().add_submenu(tauri::Submenu::new(
                    "File",
                    tauri::Menu::new().add_item(
                        tauri::CustomMenuItem::new("new_prjct", "New Project")
                            .accelerator("cmdOrControl+N"),
                    ),
                )),
            )
            .build()
            .expect("Failed to create main window");
            window.on_window_event(|event| match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
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

/* Scene */

#[tauri::command]
fn create_blank_scene() -> Scene {
    Scene::default()
}

#[tauri::command]
fn save_scene(scene: Scene) -> Scene {
    PROJECT.lock().unwrap().save_scene(scene).clone()
}

#[tauri::command]
fn delete_scene(id: Uuid) -> Result<Scene, String> {
    PROJECT.lock().unwrap().discard_scene(&id).ok_or(format!(
        "Given id [{}] does not represent an existing scene",
        id.to_string()
    ))
}

/* Stage */

fn get_stage_label(id: &Uuid) -> String {
    format!("stage_editor_{}", id.to_string())
}

fn open_stage_window<R: Runtime>(app: &tauri::AppHandle<R>, stage: Stage) -> () {
    let window = tauri::WindowBuilder::new(
        app,
        get_stage_label(&stage.id),
        tauri::WindowUrl::App("./stage.html".into()),
    )
    .title(format!(
        "Stage Editor [{}]",
        if stage.name.is_empty() {
            "Untitled"
        } else {
            stage.name.as_str()
        }
    ))
    .build()
    .unwrap();
    if let Err(e) = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
        width: 1024,
        height: 768,
    })) {
        println!("Failed to set window size: {}", e);
        return;
    }
    if let Err(e) = window.set_resizable(false) {
        println!("Failed to disable resize on window: {}", e);
        return;
    }
    window.clone().once("on_request_data", move |_event| {
        println!("Received request data event");
        window.emit("on_data_received", stage).unwrap();
    });
}

#[tauri::command]
async fn open_stage_editor<R: Runtime>(app: tauri::AppHandle<R>, stage: Option<Stage>) -> () {
    let arg = stage.unwrap_or_default();
    open_stage_window(&app, arg);
}

// #[tauri::command]
// async fn stage_creator_from<R: Runtime>(
//     app: tauri::AppHandle<R>,
//     _window: tauri::Window<R>,
//     id: Uuid,
// ) -> Result<(), String> {
//     let mut data = data::DATA.lock().unwrap();
//     let original = data.get_stage(&id);
//     match original {
//         None => {
//             return Err("Invalid id".into());
//         }
//         Some(stage) => {
//             let tmp = define::Stage::from(stage);
//             let res = data.insert_stage(tmp);
//             open_stage_window(
//                 app,
//                 &format!("{}{}", STAGE_EDITOR_LABEL, res.id),
//                 &res.name,
//                 res.clone(),
//             );
//         }
//     }
//     Ok(())
// }

#[tauri::command]
async fn stage_save_and_close<R: Runtime>(
    app: tauri::AppHandle<R>,
    window: tauri::Window<R>,
    stage: Stage,
) -> () {
    app.emit_to("main_window", "on_satage_saved", stage)
        .unwrap();

    // IDEA: send some custom callback with window as label?
    // app.emit_all(window.label(), stage);

    window
        .close()
        .expect("Failed to close stage builder window");
}

/* Position related */

#[tauri::command]
fn make_position() -> Position {
    Position::default()
}
