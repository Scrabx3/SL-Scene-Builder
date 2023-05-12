// A collection of scenes and various meta data, such as author of the project
pub mod project;

// A directed, tree-like graph connecting stages into one large dynamic animation
mod scene;

// A set of n actors being animated by a single animation under specified constraints
mod stage;

// A single position representing some actor to animate
mod position;