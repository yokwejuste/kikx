export function siteHeaderBottom(): number {
  return document.querySelector("[data-site-header]")?.getBoundingClientRect().bottom ?? 0;
}
