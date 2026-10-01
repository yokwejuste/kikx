use std::fmt;
use std::net::IpAddr;

use ipnet::IpNet;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum NetError {
    InvalidAddress(String),
    RangeNotAddress { value: String, address: IpAddr },
    InvalidRange(String),
    HostBitsSet { value: String, network: IpNet },
}

impl fmt::Display for NetError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidAddress(value) => {
                write!(f, "`{value}` is not an IPv4 or IPv6 address")
            }
            Self::RangeNotAddress { value, address } => write!(
                f,
                "`{value}` is a range, not a single address; use `{address}`"
            ),
            Self::InvalidRange(value) => write!(
                f,
                "`{value}` is not a CIDR range; write it as <address>/<prefix length>"
            ),
            Self::HostBitsSet { value, network } => write!(
                f,
                "`{value}` is not the start of its range; use `{network}`"
            ),
        }
    }
}

impl std::error::Error for NetError {}

pub fn parse_address(value: &str) -> Result<IpAddr, NetError> {
    let trimmed = value.trim();
    if trimmed.contains('/') {
        return match trimmed.parse::<IpNet>() {
            Ok(range) => Err(NetError::RangeNotAddress {
                value: trimmed.to_string(),
                address: range.addr(),
            }),
            Err(_) => Err(NetError::InvalidAddress(trimmed.to_string())),
        };
    }
    trimmed
        .parse::<IpAddr>()
        .map_err(|_| NetError::InvalidAddress(trimmed.to_string()))
}

pub fn parse_range(value: &str) -> Result<IpNet, NetError> {
    let trimmed = value.trim();
    let range = trimmed
        .parse::<IpNet>()
        .map_err(|_| NetError::InvalidRange(trimmed.to_string()))?;
    let network = range.trunc();
    if range != network {
        return Err(NetError::HostBitsSet {
            value: trimmed.to_string(),
            network,
        });
    }
    Ok(network)
}

pub fn range_contains(range: &IpNet, address: &IpAddr) -> bool {
    range.contains(address)
}

pub fn ranges_overlap(first: &IpNet, second: &IpNet) -> bool {
    first.contains(&second.network()) || second.contains(&first.network())
}
