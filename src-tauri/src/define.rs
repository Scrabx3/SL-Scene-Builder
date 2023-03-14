
#[repr(u8)]
enum Gender
{
	Female = 0,
	Male,
	Futa,

	CrtMale,
	CrtFemale
}

#[repr(u8)]
enum RaceKey
{
	Human = 0,
	AshHoppers,
	Bears,
	Boars,
	BoarsAny,
	BoarsMounted,
	Canines,
	Chaurus,
	Chaurushunters,
	Chaurusreapers,
	Chickens,
	Cows,
	Deers,
	Dogs,
	DragonPriests,
	Dragons,
	Draugrs,
	DwarvenBallistas,
	DwarvenCenturions,
	DwarvenSpheres,
	DwarvenSpiders,
	Falmers,
	FlameAtronach,
	Foxes,
	FrostAtronach,
	Gargoyles,
	Giants,
	Goats,
	Hagravens,
	Horkers,
	Horses,
	IceWraiths,
	Lurkers,
	Mammoths,
	Mudcrabs,
	Netches,
	Rabbits,
	Rieklings,
	Sabrecats,
	Seekers,
	Skeevers,
	SlaughterFishes,
	StormAtronach,
	Spiders,
	LargeSpiders,
	GiantSpiders,
	Spriggans,
	Trolls,
	VampireLords,
	Werewolves,
	Wispmothers,
	Wisps,
	Wolves,

	Total
}

#[repr(u8)]
enum PositionExtra
{
	Victim = 0,
	Vampire,
	AmputeeAR,
	AmputeeAL,
	AmputeeLR,
	AmputeeLL,
	Dead
}

pub struct Position
{
  genders: Vec<Gender>,
  race: RaceKey,

  extra: Vec<PositionExtra>
}

#[repr(u8)]
enum StageExtraType
{
	FixedLength,
	Orgasm
}

#[repr(C)]
union ExtraValue
{
	i: i8,
	b: bool
}

#[repr(C)]
pub struct StageExtraData
{
	tag: StageExtraType,
	v: ExtraValue
}

pub struct Stage
{
	positions: Vec<Position>,
	events: Vec<String>,
	// assert(events.length == positions.length)
	extra: Vec<StageExtraData>
}
