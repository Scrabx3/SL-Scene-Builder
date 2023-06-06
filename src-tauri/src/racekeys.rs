use std::collections::HashMap;

#[derive(Debug, Clone, Copy)]
pub enum RaceKey {
    Human = 0,

    AshHopper,
    Bear,
    Boar,
    BoarMounted,
    BoarSingle,
    Canine,
    Chaurus,
    ChaurusHunter,
    ChaurusReaper,
    Chicken,
    Cow,
    Deer,
    Dog,
    Dragon,
    DragonPriest,
    Draugr,
    DwarvenBallista,
    DwarvenCenturion,
    DwarvenSphere,
    DwarvenSpider,
    Falmer,
    FlameAtronach,
    Fox,
    FrostAtronach,
    Gargoyle,
    Giant,
    GiantSpider,
    Goat,
    Hagraven,
    Hare,
    Horker,
    Horse,
    IceWraith,
    LargeSpider,
    Lurker,
    Mammoth,
    Mudcrab,
    Netch,
    Riekling,
    Sabrecat,
    Seeker,
    Skeever,
    Slaughterfish,
    Spider,
    Spriggan,
    StormAtronach,
    Troll,
    VampireLord,
    Werewolf,
    Wisp,
    Wispmother,
    Wolf,
}

fn get_race_map() -> HashMap<String, RaceKey> {
    HashMap::from([
        ("Human".into(), RaceKey::Human),
        ("Ash Hopper".into(), RaceKey::AshHopper),
        ("Bear".into(), RaceKey::Bear),
        ("Boar".into(), RaceKey::BoarSingle),
        ("Boar (Any)".into(), RaceKey::Boar),
        ("Boar (Mounted)".into(), RaceKey::BoarMounted),
        ("Canine".into(), RaceKey::Canine),
        ("Chaurus".into(), RaceKey::Chaurus),
        ("Chaurus Hunter".into(), RaceKey::ChaurusHunter),
        ("Chaurus Reaper".into(), RaceKey::ChaurusReaper),
        ("Chicken".into(), RaceKey::Chicken),
        ("Cow".into(), RaceKey::Cow),
        ("Deer".into(), RaceKey::Deer),
        ("Dog".into(), RaceKey::Dog),
        ("Dragon Priest".into(), RaceKey::DragonPriest),
        ("Dragon".into(), RaceKey::Dragon),
        ("Draugr".into(), RaceKey::Draugr),
        ("Dwarven Ballista".into(), RaceKey::DwarvenBallista),
        ("Dwarven Centurion".into(), RaceKey::DwarvenCenturion),
        ("Dwarven Sphere".into(), RaceKey::DwarvenSphere),
        ("Dwarven Spider".into(), RaceKey::DwarvenSpider),
        ("Falmer".into(), RaceKey::Falmer),
        ("Flame Atronach".into(), RaceKey::FlameAtronach),
        ("Fox".into(), RaceKey::Fox),
        ("Frost Atronach".into(), RaceKey::FrostAtronach),
        ("Gargoyle".into(), RaceKey::Gargoyle),
        ("Giant".into(), RaceKey::Giant),
        ("Goat".into(), RaceKey::Goat),
        ("Hagraven".into(), RaceKey::Hagraven),
        ("Horker".into(), RaceKey::Horker),
        ("Horse".into(), RaceKey::Horse),
        ("Ice Wraith".into(), RaceKey::IceWraith),
        ("Lurker".into(), RaceKey::Lurker),
        ("Mammoth".into(), RaceKey::Mammoth),
        ("Mudcrab".into(), RaceKey::Mudcrab),
        ("Netch".into(), RaceKey::Netch),
        ("Rabbit".into(), RaceKey::Hare),
        ("Riekling".into(), RaceKey::Riekling),
        ("Sabrecat".into(), RaceKey::Sabrecat),
        ("Seeker".into(), RaceKey::Seeker),
        ("Skeever".into(), RaceKey::Skeever),
        ("Slaughterfish".into(), RaceKey::Slaughterfish),
        ("Storm Atronach".into(), RaceKey::StormAtronach),
        ("Spider".into(), RaceKey::Spider),
        ("Large Spider".into(), RaceKey::LargeSpider),
        ("Giant Spider".into(), RaceKey::GiantSpider),
        ("Spriggan".into(), RaceKey::Spriggan),
        ("Troll".into(), RaceKey::Troll),
        ("Vampire Lord".into(), RaceKey::VampireLord),
        ("Werewolf".into(), RaceKey::Werewolf),
        ("Wispmother".into(), RaceKey::Wispmother),
        ("Wisp".into(), RaceKey::Wisp),
        ("Wolf".into(), RaceKey::Wolf),
    ])
}

pub fn get_race_keys_string() -> Vec<String> {
    let map = get_race_map();
    let mut ret = vec![];
    for (key, _) in map {
        ret.push(key);
    }
    ret
}

pub fn get_race_key_bytes(race: &str) -> Option<u8> {
    let map = get_race_map();
    if let Some(entry) = map.get(race) {
        return Some(*entry as u8);
    }
    None
}
