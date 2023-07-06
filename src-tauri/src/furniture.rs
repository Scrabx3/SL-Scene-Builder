use bitflags::bitflags;

bitflags! {
    #[derive(Default, Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct Furnitures: u32 {
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
