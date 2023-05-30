use std::collections::HashMap;

pub type RaceKey = (RaceType, ExtraRace);

#[derive(Debug, Clone, Copy)]
pub enum RaceType {
    Human = 0,
    AshHopper,
    Bear,
    Boar,
    Canine,
    Chaurus,
    ChaurusHunter,
    ChaurusReaper,
    Chicken,
    Cow,
    Deer,
    DragonPriest,
    Dragon,
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
    Goat,
    Hagraven,
    Horker,
    Horse,
    IceWraith,
    Lurker,
    Mammoth,
    Mudcrab,
    Netch,
    Rabbit,
    Riekling,
    Sabrecat,
    Seeker,
    Skeever,
    Slaughterfish,
    StormAtronach,
    Spider,
    LargeSpider,
    GiantSpider,
    Spriggan,
    Troll,
    VampireLord,
    Werewolf,
    Wispmother,
    Wisp,
}

#[derive(Debug, Clone, Copy)]
pub enum ExtraRace {
    None,
    // base = canine
    Wolf,
    Dog,
    // base = boar
    BoarSingle,
    BoarMounted,
}

fn get_race_map() -> HashMap<String, RaceKey> {
    HashMap::from([
        ("Human".into(), (RaceType::Human, ExtraRace::None)),
        ("Ash Hopper".into(), (RaceType::AshHopper, ExtraRace::None)),
        ("Bear".into(), (RaceType::Bear, ExtraRace::None)),
        ("Boar".into(), (RaceType::Boar, ExtraRace::BoarSingle)),
        ("Boar (Any)".into(), (RaceType::Boar, ExtraRace::None)),
        (
            "Boar (Mounted)".into(),
            (RaceType::Boar, ExtraRace::BoarMounted),
        ),
        ("Canine".into(), (RaceType::Canine, ExtraRace::None)),
        ("Chaurus".into(), (RaceType::Chaurus, ExtraRace::None)),
        (
            "Chaurus Hunter".into(),
            (RaceType::ChaurusHunter, ExtraRace::None),
        ),
        (
            "Chaurus Reaper".into(),
            (RaceType::ChaurusReaper, ExtraRace::None),
        ),
        ("Chicken".into(), (RaceType::Chicken, ExtraRace::None)),
        ("Cow".into(), (RaceType::Cow, ExtraRace::None)),
        ("Deer".into(), (RaceType::Deer, ExtraRace::None)),
        ("Dog".into(), (RaceType::Canine, ExtraRace::Dog)),
        (
            "Dragon Priest".into(),
            (RaceType::DragonPriest, ExtraRace::None),
        ),
        ("Dragon".into(), (RaceType::Dragon, ExtraRace::None)),
        ("Draugr".into(), (RaceType::Draugr, ExtraRace::None)),
        (
            "Dwarven Ballista".into(),
            (RaceType::DwarvenBallista, ExtraRace::None),
        ),
        (
            "Dwarven Centurion".into(),
            (RaceType::DwarvenCenturion, ExtraRace::None),
        ),
        (
            "Dwarven Sphere".into(),
            (RaceType::DwarvenSphere, ExtraRace::None),
        ),
        (
            "Dwarven Spider".into(),
            (RaceType::DwarvenSpider, ExtraRace::None),
        ),
        ("Falmer".into(), (RaceType::Falmer, ExtraRace::None)),
        (
            "Flame Atronach".into(),
            (RaceType::FlameAtronach, ExtraRace::None),
        ),
        ("Fox".into(), (RaceType::Fox, ExtraRace::None)),
        (
            "Frost Atronach".into(),
            (RaceType::FrostAtronach, ExtraRace::None),
        ),
        ("Gargoyle".into(), (RaceType::Gargoyle, ExtraRace::None)),
        ("Giant".into(), (RaceType::Giant, ExtraRace::None)),
        ("Goat".into(), (RaceType::Goat, ExtraRace::None)),
        ("Hagraven".into(), (RaceType::Hagraven, ExtraRace::None)),
        ("Horker".into(), (RaceType::Horker, ExtraRace::None)),
        ("Horse".into(), (RaceType::Horse, ExtraRace::None)),
        ("Ice Wraith".into(), (RaceType::IceWraith, ExtraRace::None)),
        ("Lurker".into(), (RaceType::Lurker, ExtraRace::None)),
        ("Mammoth".into(), (RaceType::Mammoth, ExtraRace::None)),
        ("Mudcrab".into(), (RaceType::Mudcrab, ExtraRace::None)),
        ("Netch".into(), (RaceType::Netch, ExtraRace::None)),
        ("Rabbit".into(), (RaceType::Rabbit, ExtraRace::None)),
        ("Riekling".into(), (RaceType::Riekling, ExtraRace::None)),
        ("Sabrecat".into(), (RaceType::Sabrecat, ExtraRace::None)),
        ("Seeker".into(), (RaceType::Seeker, ExtraRace::None)),
        ("Skeever".into(), (RaceType::Skeever, ExtraRace::None)),
        (
            "Slaughterfish".into(),
            (RaceType::Slaughterfish, ExtraRace::None),
        ),
        (
            "Storm Atronach".into(),
            (RaceType::StormAtronach, ExtraRace::None),
        ),
        ("Spider".into(), (RaceType::Spider, ExtraRace::None)),
        (
            "Large Spider".into(),
            (RaceType::LargeSpider, ExtraRace::None),
        ),
        (
            "Giant Spider".into(),
            (RaceType::GiantSpider, ExtraRace::None),
        ),
        ("Spriggan".into(), (RaceType::Spriggan, ExtraRace::None)),
        ("Troll".into(), (RaceType::Troll, ExtraRace::None)),
        (
            "Vampire Lord".into(),
            (RaceType::VampireLord, ExtraRace::None),
        ),
        ("Werewolf".into(), (RaceType::Werewolf, ExtraRace::None)),
        ("Wispmother".into(), (RaceType::Wispmother, ExtraRace::None)),
        ("Wisp".into(), (RaceType::Wisp, ExtraRace::None)),
        ("Wolf".into(), (RaceType::Canine, ExtraRace::Wolf)),
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

pub fn get_race_key_bytes(race: &str) -> Option<[u8; 2]> {
    let map = get_race_map();
    if let Some(entry) = map.get(race) {
        return Some([entry.0 as u8, entry.1 as u8]);
    }
    None
}
