fn main() {
    println!("cargo:rerun-if-changed=assets/kikx.ico");
    #[cfg(windows)]
    {
        let mut resource = winresource::WindowsResource::new();
        resource.set_icon("assets/kikx.ico");
        resource.set("ProductName", "kikx");
        resource
            .compile()
            .expect("failed to embed the Windows icon");
    }
}
