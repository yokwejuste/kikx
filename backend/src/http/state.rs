use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

use super::dto::ProjectBundleDto;

#[derive(Clone, Default)]
pub struct AppState {
    projects: Arc<Mutex<HashMap<String, ProjectBundleDto>>>,
}

impl AppState {
    pub fn publish(&self, bundle: ProjectBundleDto) -> String {
        let id = generate_id();
        self.projects
            .lock()
            .expect("project store lock poisoned")
            .insert(id.clone(), bundle);
        id
    }

    pub fn get(&self, id: &str) -> Option<ProjectBundleDto> {
        self.projects
            .lock()
            .expect("project store lock poisoned")
            .get(id)
            .cloned()
    }
}

fn generate_id() -> String {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock before unix epoch")
        .as_nanos() as u64;
    let count = COUNTER.fetch_add(1, Ordering::Relaxed);
    let mixed = nanos ^ count.wrapping_mul(0x9E37_79B9_7F4A_7C15) ^ (std::process::id() as u64);
    format!("{mixed:x}")
}
