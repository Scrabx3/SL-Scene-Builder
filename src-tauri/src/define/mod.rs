// A collection of scenes and various meta data, such as author of the project
pub mod project;

// A directed, tree-like graph connecting stages into one large dynamic animation
pub mod scene;

// A set of n actors being animated by a single animation under specified constraints
pub mod stage;

// A single position representing some actor to animate
pub mod position;

pub type NanoID = String;

mod serialize;
const NANOID_ALPHABET: [char; 36] = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's',
    't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
];
const PREFIX_HASH_LEN: usize = 4;
const NANOID_LENGTH: usize = 8;
