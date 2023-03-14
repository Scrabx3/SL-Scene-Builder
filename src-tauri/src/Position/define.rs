macro_rules! enumeration_string {
    (enum $name:ident {
        $($variant:ident = $val:expr),*,
    }) => {
        enum $name {
            $($variant = $val),*
        }

        impl $name {
            fn name(&self) -> &'static str {
                match self {
                    $($name::$variant => stringify!($variant)),*
                }
            }
        }
    };
}

enumeration_string! {
  enum Gender
  {
    Female,
    Male,
    Futa,

    CrtMale,
    CrtFemale
  }

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

  enum Extra
  {
    Victim,
    Vampire,
    AmputeeAR,
    AmputeeAL,
    AmputeeLR,
    AmputeeLL,
    Dead
  }
}

pub struct Position
{
  Genders: vec<Gender>,
  Race: RaceKey,

  ExtraData: vec<Extra>
}
