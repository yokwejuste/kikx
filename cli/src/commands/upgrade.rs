use anyhow::{bail, Context, Result};
use self_update::backends::github::Update;
use self_update::cargo_crate_version;

use crate::cli::UpgradeArgs;

const PLATFORM: Option<&str> = if cfg!(all(target_os = "macos", target_arch = "aarch64")) {
    Some("macos-arm64")
} else if cfg!(all(target_os = "macos", target_arch = "x86_64")) {
    Some("macos-x64")
} else if cfg!(all(target_os = "linux", target_arch = "x86_64")) {
    Some("linux-x64")
} else if cfg!(all(target_os = "linux", target_arch = "aarch64")) {
    Some("linux-arm64")
} else if cfg!(all(target_os = "windows", target_arch = "x86_64")) {
    Some("windows-x64")
} else {
    None
};

fn repository() -> Result<(String, String)> {
    let url = env!("CARGO_PKG_REPOSITORY");
    let path = url
        .trim_end_matches('/')
        .trim_end_matches(".git")
        .rsplitn(3, '/')
        .collect::<Vec<_>>();
    match path.as_slice() {
        [name, owner, _] => Ok((owner.to_string(), name.to_string())),
        _ => bail!("cannot read the repository from {url}"),
    }
}

pub fn run(args: UpgradeArgs) -> Result<()> {
    let platform = PLATFORM.context("no kikx release is published for this platform")?;
    let (owner, name) = repository()?;
    let current = cargo_crate_version!();
    let wanted = args
        .version
        .as_deref()
        .map(|v| v.trim_start_matches('v').to_string());

    let mut builder = Update::configure();
    builder
        .repo_owner(&owner)
        .repo_name(&name)
        .bin_name("kikx")
        .target(platform)
        .asset_identifier(platform)
        .bin_path_in_archive("kikx-{{ version }}-{{ target }}/{{ bin }}")
        .current_version(current)
        .show_download_progress(true)
        .no_confirm(true);
    if let Some(version) = &wanted {
        builder.release_tag(format!("v{version}"));
    }
    let updater = builder.build().context("failed to prepare the upgrade")?;

    let target = match &wanted {
        Some(version) => Some(version.clone()),
        None => updater
            .is_update_available()
            .context("failed to read the kikx releases")?
            .map(|release| release.version().to_string()),
    };
    let Some(target) = target else {
        println!("kikx {current} is the latest version.");
        return Ok(());
    };
    if target == current {
        println!("kikx {current} is already installed.");
        return Ok(());
    }
    if args.check {
        println!(
            "kikx {target} is available (you have {current}). Run `kikx upgrade` to install it."
        );
        return Ok(());
    }

    println!("Upgrading kikx {current} to {target}");
    let status = updater.update().context("the upgrade failed")?;
    println!("kikx is now {}.", status.version());
    Ok(())
}
