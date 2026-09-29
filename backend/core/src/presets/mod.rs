mod manifest;
mod resolve;
mod templates;

pub use manifest::{PresetComponent, PresetManifest, PresetProject};
pub use resolve::resolve_preset;
pub use templates::{template, templates};
