use bitflags::bitflags;

bitflags! {
    #[derive(Default, Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct Furniture: u32 {
        const None = 0;

        const BedRoll = 1 << 0;
        const BedSingle = 1 << 1;
        const BedDouble = 1 << 2;

        const Wall = 1 << 3;
        const Railing = 1 << 4;

        const CraftCookingPot = 1 << 5;
        const CraftAlchemy = 1 << 6;
        const CraftEnchanting = 1 << 7;
        const CraftSmithing = 1 << 8;
        const CraftWorkbench = 1 << 9;

        const Table = 1 << 10;
        const TableCounter = 1 << 11;

        const Chair = 1 << 12;      // No arm; high back (Common Wooden chair)
        const ChairBar = 1 << 13;   // No Arm; no back
        const ChairArm = 1 << 14;   // Arm; low back
        const ChairWing = 1 << 15;  // Arm; high back
        const ChairNoble = 1 << 16; // Noble Chair

        const Bench = 1 << 17;
        const BenchNoble = 1 << 18;

        const Throne = 1 << 19;
        const ThroneRiften = 1 << 20;
        const ThroneNordic = 1 << 21;

        const XCross = 1 << 22;
        const Pillory = 1 << 23;
    }
}

pub fn as_furnitre(list: &Vec<String>) -> Furniture {
    let mut ret = Furniture::default();
    for furnistr in list {
        match furnistr.as_str() {
            "None" => return Furniture::default(),
            "BedRoll" => ret |= Furniture::BedRoll,
            "BedSingle" => ret |= Furniture::BedSingle,
            "BedDouble" => ret |= Furniture::BedDouble,
            "Wall" => ret |= Furniture::Wall,
            "Railing" => ret |= Furniture::Railing,
            "CraftCookingPot" => ret |= Furniture::CraftCookingPot,
            "CraftAlchemy" => ret |= Furniture::CraftAlchemy,
            "CraftEnchanting" => ret |= Furniture::CraftEnchanting,
            "CraftSmithing" => ret |= Furniture::CraftSmithing,
            "CraftWorkbench" => ret |= Furniture::CraftWorkbench,
            "Table" => ret |= Furniture::Table,
            "TableCounter" => ret |= Furniture::TableCounter,
            "Chair" => ret |= Furniture::Chair,
            "ChairBar" => ret |= Furniture::ChairBar,
            "ChairArm" => ret |= Furniture::ChairArm,
            "ChairWing" => ret |= Furniture::ChairWing,
            "ChairNoble" => ret |= Furniture::ChairNoble,
            "Bench" => ret |= Furniture::Bench,
            "BenchNoble" => ret |= Furniture::BenchNoble,
            "Throne" => ret |= Furniture::Throne,
            "ThroneRiften" => ret |= Furniture::ThroneRiften,
            "ThroneNordic" => ret |= Furniture::ThroneNordic,
            "XCross" => ret |= Furniture::XCross,
            "Pillory" => ret |= Furniture::Pillory,
            _ => {}
        }
    }
    ret
}
