use std::net::IpAddr;

use kikx_core::net::{parse_address, parse_range, range_contains, ranges_overlap, NetError};
use kikx_core::registry::FieldFormat;

fn ip(value: &str) -> IpAddr {
    value.parse().unwrap()
}

#[test]
fn parses_ipv4_and_ipv6_addresses() {
    assert_eq!(parse_address("10.0.0.5"), Ok(ip("10.0.0.5")));
    assert_eq!(parse_address(" 2001:db8::1 "), Ok(ip("2001:db8::1")));
    assert_eq!(
        parse_address("2001:0db8:0000::0001").map(|a| a.to_string()),
        Ok("2001:db8::1".to_string())
    );
}

#[test]
fn rejects_malformed_addresses() {
    for value in [
        "",
        "10.0.0",
        "10.0.0.256",
        "010.0.0.1",
        "web-1",
        "2001:db8:::1",
    ] {
        assert!(
            matches!(parse_address(value), Err(NetError::InvalidAddress(_))),
            "{value}"
        );
    }
}

#[test]
fn a_range_in_place_of_an_address_suggests_the_address() {
    let err = parse_address("10.0.0.5/24").unwrap_err();
    assert_eq!(
        err,
        NetError::RangeNotAddress {
            value: "10.0.0.5/24".to_string(),
            address: ip("10.0.0.5"),
        }
    );
    assert!(err.to_string().contains("use `10.0.0.5`"));
}

#[test]
fn parses_and_normalises_ranges() {
    assert_eq!(
        parse_range("10.10.0.0/16").unwrap().to_string(),
        "10.10.0.0/16"
    );
    assert_eq!(
        parse_range("2001:0db8::/32").unwrap().to_string(),
        "2001:db8::/32"
    );
}

#[test]
fn rejects_ranges_that_do_not_start_on_their_boundary() {
    let err = parse_range("10.0.0.5/24").unwrap_err();
    assert!(matches!(err, NetError::HostBitsSet { .. }));
    assert!(err.to_string().contains("use `10.0.0.0/24`"));
}

#[test]
fn rejects_malformed_ranges() {
    for value in [
        "10.0.0.0",
        "10.0.0.0/33",
        "10.0.0.0/",
        "/16",
        "a.b.c.d/8",
        "2001:db8::/129",
    ] {
        assert!(
            matches!(parse_range(value), Err(NetError::InvalidRange(_))),
            "{value}"
        );
    }
}

#[test]
fn checks_containment() {
    let range = parse_range("10.10.0.0/16").unwrap();
    assert!(range_contains(&range, &ip("10.10.255.1")));
    assert!(!range_contains(&range, &ip("10.11.0.1")));
    assert!(!range_contains(&range, &ip("::1")));
}

#[test]
fn checks_overlap() {
    let wide = parse_range("10.0.0.0/8").unwrap();
    let inner = parse_range("10.20.0.0/16").unwrap();
    let other = parse_range("192.168.0.0/16").unwrap();
    let v6 = parse_range("fd00::/8").unwrap();
    assert!(ranges_overlap(&wide, &inner));
    assert!(ranges_overlap(&inner, &wide));
    assert!(ranges_overlap(&inner, &inner));
    assert!(!ranges_overlap(&inner, &other));
    assert!(!ranges_overlap(&wide, &v6));
    assert!(!ranges_overlap(
        &parse_range("10.0.0.0/24").unwrap(),
        &parse_range("10.0.1.0/24").unwrap()
    ));
}

#[test]
fn field_formats_normalise_their_values() {
    assert_eq!(
        FieldFormat::Ip.normalize("2001:0db8::0001"),
        Ok("2001:db8::1".to_string())
    );
    assert_eq!(
        FieldFormat::Cidr.normalize(" 10.10.0.0/16 "),
        Ok("10.10.0.0/16".to_string())
    );
    assert!(FieldFormat::Cidr.normalize("10.10.0.0").is_err());
    assert!(FieldFormat::Ip.normalize("10.10.0.0/16").is_err());
}
