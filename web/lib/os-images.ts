export const OS_IMAGES: Record<"digitalocean" | "hetzner", { label: string; slug: string }[]> = {
  digitalocean: [
    { label: "Ubuntu 24.04", slug: "ubuntu-24-04-x64" },
    { label: "Ubuntu 22.04", slug: "ubuntu-22-04-x64" },
    { label: "Debian 13", slug: "debian-13-x64" },
    { label: "Fedora 44", slug: "fedora-44-x64" },
    { label: "Rocky Linux 9", slug: "rockylinux-9-x64" },
    { label: "AlmaLinux 9", slug: "almalinux-9-x64" },
  ],
  hetzner: [
    { label: "Ubuntu 24.04", slug: "ubuntu-24.04" },
    { label: "Ubuntu 22.04", slug: "ubuntu-22.04" },
    { label: "Debian 12", slug: "debian-12" },
    { label: "Fedora 44", slug: "fedora-44" },
    { label: "Rocky Linux 9", slug: "rocky-9" },
    { label: "AlmaLinux 9", slug: "alma-9" },
  ],
};
