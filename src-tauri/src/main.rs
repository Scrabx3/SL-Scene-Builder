#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod define;
mod furniture;
mod racekeys;

use define::{position::Position, project::Project, scene::Scene, stage::Stage, NanoID};
use log::{error, info};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};
use tauri::{
    api::shell::open, CustomMenuItem, Manager, Menu, MenuItem, Runtime, Submenu, WindowBuilder,
};

const DEFAULT_MAINWINDOW_TITLE: &str = "SexLab Scene Builder";

pub static PROJECT: Lazy<Mutex<Project>> = Lazy::new(|| {
    let prjct = Project::new();
    Mutex::new(prjct)
});

static EDITED: AtomicBool = AtomicBool::new(false);
#[inline]
fn set_edited(val: bool) -> () {
    EDITED.store(val, Ordering::Relaxed)
}
#[inline]
fn get_edited() -> bool {
    EDITED.load(Ordering::Relaxed)
}

fn setup_logger() -> Result<(), fern::InitError> {
    fern::Dispatch::new()
        .format(|out, message, record| out.finish(format_args!("[{}] {}", record.level(), message)))
        .level(log::LevelFilter::Info)
        .chain(std::io::stdout())
        .chain(fern::log_file("SceneBuilder.log")?)
        .apply()?;
    Ok(())
}

/// MAIN
fn main() {
    setup_logger().expect("Unable to initialize logger");
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            request_project_update,
            get_race_keys,
            create_blank_scene,
            save_scene,
            delete_scene,
            open_stage_editor,
            open_stage_editor_from,
            stage_save_and_close,
            make_position,
        ])
        .setup(|app| {
            let window = WindowBuilder::new(
                app,
                "main_window".to_string(),
                tauri::WindowUrl::App("./index.html".into()),
            )
            .title(DEFAULT_MAINWINDOW_TITLE)
            .menu(
                Menu::new().add_submenu(Submenu::new(
                    "File",
                    Menu::new()
                        .add_item(
                            CustomMenuItem::new("new_prjct", "New Project")
                                .accelerator("cmdOrControl+N"),
                        )
                        .add_item(
                            CustomMenuItem::new("open_prjct", "Open Project")
                                .accelerator("cmdOrControl+O"),
                        )
                        .add_item(
                            CustomMenuItem::new("open_slal", "Import SLAL File")
                        )
                        .add_native_item(MenuItem::Separator)
                        .add_item(
                            CustomMenuItem::new("save", "Save")
                                .accelerator("cmdOrControl+S"),
                        )
                        .add_item(
                            CustomMenuItem::new("save_as", "Save As...")
                                .accelerator("cmdOrControl+Shift+S"),
                        )
                        .add_item(
                            CustomMenuItem::new("build", "Export")
                                .accelerator("cmdOrControl+B"),
                        )
                        .add_native_item(MenuItem::Separator)
                        .add_native_item(MenuItem::Quit),
                ))
                .add_submenu(Submenu::new(
                    "Help", Menu::new()
                        .add_item(CustomMenuItem::new("open_docs", "Open Wiki"))
                        .add_native_item(MenuItem::Separator)
                        .add_item(CustomMenuItem::new("discord", "Discord"))
                        .add_item(CustomMenuItem::new("patreon", "Patreon"))
                        .add_item(CustomMenuItem::new("kofi", "Ko-Fi"))
                )),
            )
            .build()
            .expect("Failed to create main window");
            let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: 1024,
                height: 768,
            }));
            let menu_handle = app.app_handle();
            window.on_menu_event(move |event| match event.menu_item_id() {
                "new_prjct" | "open_prjct" | "open_slal" => {
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
                    } else if event.menu_item_id() == "open_slal" {
                        if let Err(e) = prjct.load_slal() {
                            error!("{}", e);
                        } else {
                            set_edited(true);
                            let _ = window.set_title(format!("{} - {}", DEFAULT_MAINWINDOW_TITLE, prjct.pack_name).as_str());
                        }
                    } else {
                        if let Err(e) = prjct.load_project() {
                            error!("{}", e);
                        } else {
                            let _ = window.set_title(format!("{} - {}", DEFAULT_MAINWINDOW_TITLE, prjct.pack_name).as_str());
                        }
                    }
                    window.emit("on_project_update", &prjct.scenes).unwrap();
                }
                "save" | "save_as" => {
                    let mut prjct = PROJECT.lock().unwrap();
                    let r = prjct
                        .save_project(event.menu_item_id() == "save_as");
                    if let Err(e) = r {
                        error!("{}", e);
                        return;
                    }
                    set_edited(false);
                    let window = menu_handle.get_window("main_window").unwrap();
                    let _ = window.set_title(format!("{} - {}", DEFAULT_MAINWINDOW_TITLE, prjct.pack_name).as_str());
                }
                "build" => {
                    let r = PROJECT.lock().unwrap().build();
                    if let Err(e) = r {
                        error!("{}", e);
                    }
                }
                "open_docs" => {
                    let _ = open(&menu_handle.shell_scope(), "https://github.com/Scrabx3/SexLab/wiki/Scene-Builder", None);
                }
                "discord" => {
                    let _ = open(&menu_handle.shell_scope(), "https://discord.gg/mycaxFPSeV", None);
                }
                "patreon" => {
                    let _ = open(&menu_handle.shell_scope(), "https://www.patreon.com/ScrabJoseline", None);
                }
                "kofi" => {
                    let _ = open(&menu_handle.shell_scope(), "https://ko-fi.com/scrab", None);
                }
                _ => {error!("Unrecognized command: {}", event.menu_item_id())}
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

#[tauri::command]
async fn request_project_update<R: Runtime>(window: tauri::Window<R>) -> () {
    let prjct = PROJECT.lock().unwrap();
    window.emit("on_project_update", &prjct.scenes).unwrap();
}

#[tauri::command]
async fn get_race_keys() -> Vec<String> {
    racekeys::get_race_keys_string()
}

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
fn delete_scene<R: Runtime>(window: tauri::Window<R>, id: NanoID) -> Result<Scene, String> {
    let ret = PROJECT.lock().unwrap().discard_scene(&id).ok_or_else(|| {
        let msg = format!("Invalid Scene ID: {}", id);
        error!("{}", msg);
        msg
    });

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

#[derive(Debug, Serialize, Deserialize, Clone)]
struct EditorPayload {
    pub stage: Stage,
    pub control: Option<Stage>,
}

fn open_stage_editor_impl<R: Runtime>(app: &tauri::AppHandle<R>, payload: EditorPayload) -> () {
    let ref stage = payload.stage;
    info!("Opening Stage {}", stage.id);
    let window = tauri::WindowBuilder::new(
        app,
        format!("stage_editor_{}", stage.id),
        tauri::WindowUrl::App("./stage.html".into()),
    )
    .title(if stage.name.is_empty() {
        "Stage Editor [Untitled]".into()
    } else {
        format!("Stage Editor [{}]", stage.name.as_str())
    })
    .build()
    .unwrap();
    let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
        width: 1024,
        height: 768,
    }));
    let _ = window.set_resizable(false);
    window.clone().once("on_request_data", move |_event| {
        window.emit("on_data_received", payload).unwrap();
    });
}

#[tauri::command]
async fn open_stage_editor<R: Runtime>(
    app: tauri::AppHandle<R>,
    stage: Option<Stage>,
    control: Option<Stage>,
) -> () {
    let stage = stage.unwrap_or(Stage::from_count(
        control
            .as_ref()
            .and_then(|stage| Some(stage.positions.len()))
            .unwrap_or(1),
    ));
    open_stage_editor_impl(&app, EditorPayload { stage, control });
}

#[tauri::command]
async fn open_stage_editor_from<R: Runtime>(app: tauri::AppHandle<R>, control: Stage) -> () {
    let mut stage = Stage::from_count(control.positions.len());
    stage.tags = control.tags.clone();
    let payload = EditorPayload {
        stage,
        control: Some(control),
    };
    open_stage_editor_impl(&app, payload);
}

#[tauri::command]
async fn stage_save_and_close<R: Runtime>(
    app: tauri::AppHandle<R>,
    window: tauri::Window<R>,
    stage: Stage,
) -> () {
    // IDEA: make give this event some unique id to allow
    // front end distinguish the timings at which some stage editor has been opened
    info!("Saving Stage {}", stage.id);
    app.emit_to("main_window", "on_stage_saved", stage).unwrap();
    let _ = window.close();
}

/* Position related */

#[tauri::command]
fn make_position() -> Position {
    Position::default()
}
