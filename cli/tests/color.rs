use assert_cmd::Command;
use predicates::str::contains;

fn kikx() -> Command {
    Command::cargo_bin("kikx").unwrap()
}

fn has_escape_codes(bytes: &[u8]) -> bool {
    bytes.contains(&0x1b)
}

#[test]
fn piped_output_has_no_escape_codes() {
    for args in [vec!["list"], vec!["presets"], vec!["--help"]] {
        let output = kikx()
            .args(&args)
            .env("COLORTERM", "truecolor")
            .env_remove("CLICOLOR_FORCE")
            .output()
            .unwrap();
        assert!(!has_escape_codes(&output.stdout), "{args:?}");
    }
}

#[test]
fn no_color_wins_over_clicolor_force() {
    let output = kikx()
        .arg("list")
        .env("NO_COLOR", "1")
        .env("CLICOLOR_FORCE", "1")
        .output()
        .unwrap();
    assert!(!has_escape_codes(&output.stdout));
}

#[test]
fn forced_colour_uses_truecolor_volt_when_supported() {
    kikx()
        .arg("presets")
        .env_remove("NO_COLOR")
        .env("CLICOLOR_FORCE", "1")
        .env("COLORTERM", "truecolor")
        .assert()
        .success()
        .stdout(contains("\x1b[38;2;200;240;49m"));
}

#[test]
fn forced_colour_falls_back_to_ansi256_volt() {
    kikx()
        .arg("presets")
        .env_remove("NO_COLOR")
        .env_remove("COLORTERM")
        .env("CLICOLOR_FORCE", "1")
        .assert()
        .success()
        .stdout(contains("\x1b[38;5;191m"));
}
