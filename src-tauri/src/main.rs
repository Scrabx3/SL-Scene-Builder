#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod define;

use define::{position::Position, project::Project, scene::Scene, stage::Stage};
use once_cell::sync::Lazy;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};
use tauri::{CustomMenuItem, Manager, Menu, MenuItem, Runtime, Submenu, WindowBuilder};
use uuid::Uuid;

const DEFAULT_MAINWINDOW_TITLE: &str = "SexLab Scene Builder";

pub static PROJECT: Lazy<Mutex<Project>> = Lazy::new(|| {
    let prjct = Project::new();
    Mutex::new(prjct)
});

static EDITED: AtomicBool = AtomicBool::new(false);
fn set_edited(val: bool) -> () {
    EDITED.store(val, Ordering::Relaxed)
}
fn get_edited() -> bool {
    EDITED.load(Ordering::Relaxed)
}

// TODO: setup logger

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
            .title(DEFAULT_MAINWINDOW_TITLE)
            .menu(
                tauri::Menu::new().add_submenu(tauri::Submenu::new(
                    "File",
                    tauri::Menu::new()
                        .add_item(
                            tauri::CustomMenuItem::new("new_prjct", "New Project")
                                .accelerator("cmdOrControl+N"),
                        )
                        .add_item(
                            tauri::CustomMenuItem::new("open_prjct", "Open Project")
                                .accelerator("cmdOrControl+O"),
                        )
                        .add_native_item(MenuItem::Separator)
                        .add_item(
                            tauri::CustomMenuItem::new("save", "Save")
                                .accelerator("cmdOrControl+S"),
                        )
                        .add_item(
                            tauri::CustomMenuItem::new("save_as", "Save As...")
                                .accelerator("cmdOrControl+Shift+S"),
                        )
                        .add_item(
                            tauri::CustomMenuItem::new("build", "Export")
                                .accelerator("cmdOrControl+B"),
                        )
                        .add_native_item(MenuItem::Separator)
                        .add_native_item(MenuItem::Quit),
                )),
            )
            .build()
            .expect("Failed to create main window");
            let menu_handle = app.app_handle();
            window.on_menu_event(move |event| match event.menu_item_id() {
                "new_prjct" | "open_prjct" => {
                    let window = menu_handle.get_window("main_window").unwrap();
                    let mut prjct = PROJECT.lock().unwrap();
                    if get_edited() {
                        let ask_handle = menu_handle.app_handle();
                        tauri::api::dialog::ask(
                            Some(&window),
                            if event.menu_item_id() == "new_prjct" {"New Project"} else {"Open Project"},
                            "There are unsaved changes. Loading a new project will cause these changes to be lost.\nContinue?", {move |r| {
                                if !r {
                                    return;
                                }
                                let window = ask_handle.get_window("main_window").unwrap();
                                let mut prjct = PROJECT.lock().unwrap();
                                if event.menu_item_id() == "new_prjct" {
                                    prjct.reset();
                                    let _ = window.set_title(DEFAULT_MAINWINDOW_TITLE);
                                } else {
                                    prjct.load_project().unwrap();
                                    let _ = window.set_title(format!("{} - {}", DEFAULT_MAINWINDOW_TITLE, prjct.pack_name).as_str());
                                }
                                window.emit("on_project_update", &prjct.scenes).unwrap();
                                set_edited(false);
                            }});
                        return;
                    }
                    if event.menu_item_id() == "new_prjct" {
                        prjct.reset();
                        let _ = window.set_title(DEFAULT_MAINWINDOW_TITLE);
                    } else {
                        prjct.load_project().unwrap();
                        let _ = window.set_title(format!("{} - {}", DEFAULT_MAINWINDOW_TITLE, prjct.pack_name).as_str());
                    }
                    window.emit("on_project_update", &prjct.scenes).unwrap();
                }
                "save" | "save_as" => {
                    let mut prjct = PROJECT.lock().unwrap();
                    let r = prjct
                        .save_project(event.menu_item_id() == "save_as");
                    if let Err(e) = r {
                        println!("{}", e);
                        return;
                    }
                    set_edited(false);
                    let window = menu_handle.get_window("main_window").unwrap();
                    let _ = window.set_title(format!("{} - {}", DEFAULT_MAINWINDOW_TITLE, prjct.pack_name).as_str());
                }
                "build" => {
                    let r = PROJECT.lock().unwrap().build();
                    if let Err(e) = r {
                        println!("{}", e);
                    }
                }
                _ => {}
            });
            window.on_window_event(|event| match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    if get_edited() {
                        let do_close = tauri::api::dialog::blocking::MessageDialogBuilder::new(
                            "Close",
                            "There are unsaved changes. Are you sure you want to close?")
                        .buttons(tauri::api::dialog::MessageDialogButtons::YesNo)
                        .kind(tauri::api::dialog::MessageDialogKind::Warning)
                        .show();
                        if !do_close {
                            api.prevent_close();
                            return;
                        }
                    }
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
fn save_scene<R: Runtime>(window: tauri::Window<R>, scene: Scene) -> () {
    set_edited(true);
    if let Ok(title) = window.title() {
        if !title.ends_with('*') {
            window.set_title(format!("{}*", title).as_str()).unwrap();
        }
    }
    PROJECT.lock().unwrap().save_scene(scene);
}

#[tauri::command]
fn delete_scene<R: Runtime>(window: tauri::Window<R>, id: Uuid) -> Result<Scene, String> {
    let ret = PROJECT.lock().unwrap().discard_scene(&id).ok_or(format!(
        "Given id [{}] does not represent an existing scene",
        id.to_string()
    ));

    if ret.is_ok() {
        set_edited(true);
        if let Ok(title) = window.title() {
            if !title.ends_with('*') {
                window.set_title(format!("{}*", title).as_str()).unwrap();
            }
        }
    }

    ret
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
    // app.get_window("main_window").expect("Unable to get main window").emit(event, payload)

    app.emit_to("main_window", "on_stage_saved", stage).unwrap();

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
