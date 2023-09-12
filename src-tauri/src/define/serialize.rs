use std::mem::size_of;

use serde::{Deserialize, Serialize};

pub trait EncodeBinary {
    fn get_byte_size(&self) -> usize;
    fn write_byte(&self, buf: &mut Vec<u8>) -> ();
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Offset {
    x: f32,
    y: f32,
    z: f32,
    r: f32,
}

impl EncodeBinary for Offset {
    fn get_byte_size(&self) -> usize {
        4 * size_of::<f32>()
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        let x_ = (self.x * 1000.0).round() as i32;
        buf.extend_from_slice(&x_.to_be_bytes());
        let y_ = (self.y * 1000.0).round() as i32;
        buf.extend_from_slice(&y_.to_be_bytes());
        let z_ = (self.z * 1000.0).round() as i32;
        buf.extend_from_slice(&z_.to_be_bytes());
        let r_ = (self.r * 1000.0).round() as i32;
        buf.extend_from_slice(&r_.to_be_bytes());
    }
}

pub fn map_race_to_folder(race: &str) -> Result<String, ()> {
    match race {
        "Human" => Ok("character".into()),
        "Ash Hopper" => Ok("dlc02\\scrib".into()),
        "Bear" => Ok("brear".into()),
        "Boar" | "Boar (Any)" | "Boar (Mounted)" => Ok("boarriekling".into()),
        "Canine" | "Dog" | "Wolf" | "Fox" => Ok("canine".into()),
        "Chaurus" | "Chaurus Reaper" => Ok("chaurus".into()),
        "Chaurushunter" => Ok("dlc01\\chaurusflyer".into()),
        "Chicken" => Ok("ambient\\chicken".into()),
        "Cow" => Ok("cow".into()),
        "Deer" => Ok("deer".into()),
        "Dragon Priest" => Ok("dragonpriest".into()),
        "Dragon" => Ok("dragon".into()),
        "Draugr" => Ok("draugr".into()),
        "Dwarven Ballista" => Ok("dlc02\\dwarvenballistacenturion".into()),
        "Dwarven Centurion" => Ok("dwarvensteamcenturion".into()),
        "Dwarven Sphere" => Ok("dwarvenspherecenturion".into()),
        "Dwarven Spider" => Ok("dwarvenspider".into()),
        "Falmer" => Ok("falmer".into()),
        "Flame Atronach" => Ok("atronachflame".into()),
        "Frost Atronach" => Ok("atronachfrost".into()),
        "Storm Atronach" => Ok("atronachstorm".into()),
        "Gargoyle" => Ok("dlc01\\vampirebrute".into()),
        "Giant" => Ok("giant".into()),
        "Goat" => Ok("goat".into()),
        "Hagraven" => Ok("hagraven".into()),
        "Horker" => Ok("horker".into()),
        "Horse" => Ok("horse".into()),
        "Ice Wraith" => Ok("icewraith".into()),
        "Lurker" => Ok("dlc02\\benthiclurker".into()),
        "Mammoth" => Ok("mammoth".into()),
        "Mudcrab" => Ok("mudcrab".into()),
        "Netch" => Ok("dlc02\\netch".into()),
        "Rabbit" => Ok("ambient\\hare".into()),
        "Riekling" => Ok("dlc02\\riekling".into()),
        "Sabrecat" => Ok("sabrecat".into()),
        "Seeker" => Ok("dlc02\\hmdaedra".into()),
        "Skeever" => Ok("skeever".into()),
        "Slaughterfish" => Ok("slaughterfish".into()),
        "Spider" | "Large Spider" | "Giant Spider" => Ok("frostbitespider".into()),
        "Spriggan" => Ok("spriggan".into()),
        "Troll" => Ok("troll".into()),
        "Vampire Lord" => Ok("vampirelord".into()),
        "Werewolf" => Ok("werewolfbeast".into()),
        "Wispmother" => Ok("wisp".into()),
        "Wisp" => Ok("witchlight".into()),
        _ => Err(()),
    }
}

pub fn make_fnis_lines(
    events: &Vec<String>,
    hash: &str,
    fixed_len: Option<bool>,
    anim_obj: Option<&str>,
) -> Vec<String> {
    if events.len() == 1 {
        return vec![make_fnis_line(
            &events[0],
            hash,
            anim_obj,
            fixed_len.is_none(),
            "b",
        )];
    }
    let mut ret = vec![];
    let mut first = false;
    for e in events {
        ret.push(make_fnis_line(
            e,
            hash,
            anim_obj,
            true,
            if first {
                first = false;
                "s"
            } else {
                "+"
            },
        ));
    }
    ret
}

fn make_fnis_line(
    event: &str,
    hash: &str,
    anim_obj: Option<&str>,
    repeat: bool,
    prefix: &str,
) -> String {
    format!(
        "{} -{}{}Tn {}{} {}.hkx {}",
        prefix,
        if repeat { "" } else { "a," },
        anim_obj
            .and_then(|obj| if obj.is_empty() { None } else { Some("o,") })
            .unwrap_or(""),
        hash,
        event,
        event,
        anim_obj.unwrap_or(""),
    )
}
