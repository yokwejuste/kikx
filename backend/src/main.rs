use anyhow::Context;
use axum::http::HeaderValue;
use clap::Parser;
use kikx_backend::http;

#[derive(Parser)]
#[command(name = "kikx-backend", about = "Local HTTP API for the kikx dashboard")]
struct Args {
    #[arg(
        long,
        env = "KIKX_PORT",
        default_value_t = 4000,
        help = "Port to listen on"
    )]
    port: u16,

    #[arg(
        long,
        env = "KIKX_BIND",
        default_value = "127.0.0.1",
        help = "Address to bind"
    )]
    bind: String,

    #[arg(
        long = "allow-origin",
        help = "Browser origins allowed to call the API (default: any loopback origin)",
        env = "KIKX_ALLOWED_ORIGINS",
        value_delimiter = ','
    )]
    allow_origin: Vec<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    let args = Args::parse();

    let origins: Vec<&str> = args
        .allow_origin
        .iter()
        .map(|origin| origin.trim())
        .filter(|origin| !origin.is_empty())
        .collect();
    let allowed_origins = if origins.is_empty() {
        http::AllowedOrigins::Loopback
    } else {
        http::AllowedOrigins::List(
            origins
                .into_iter()
                .map(|origin| {
                    HeaderValue::from_str(origin)
                        .with_context(|| format!("invalid --allow-origin value `{origin}`"))
                })
                .collect::<anyhow::Result<Vec<_>>>()?,
        )
    };

    let router = http::build_router(allowed_origins);

    let addr = format!("{}:{}", args.bind, args.port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .with_context(|| format!("failed to bind {addr}"))?;

    println!("kikx-backend listening on http://{addr}");

    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .context("server error")?;

    Ok(())
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
}
