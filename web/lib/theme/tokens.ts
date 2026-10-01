export const TOKENS = {
  glideEase: "--motion-glide",
  glideDuration: "--motion-glide-duration",
  fadeDuration: "--motion-fade-duration",
  cardEnterDuration: "--motion-card-enter-duration",
  cardEnterOffset: "--motion-card-enter-offset",
  teachPointerStart: "--teach-pointer-start",
  teachRingPadding: "--teach-ring-padding",
  teachArrowInset: "--teach-arrow-inset",
  teachCardGap: "--teach-card-gap",
  teachCardMargin: "--teach-card-margin",
  teachCardHeader: "--teach-card-header",
  tourStagePadding: "--tour-stage-padding",
  tourStageRadius: "--tour-stage-radius",
  tourCardWidth: "--tour-card-width",
  tourCardGap: "--tour-card-gap",
  tourOverlayOpacity: "--tour-overlay-opacity",
} as const;

export type Token = (typeof TOKENS)[keyof typeof TOKENS];

export function cssVar(token: Token): string {
  return `var(${token})`;
}

export function readToken(token: Token): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

export function readNumber(token: Token): number {
  return Number.parseFloat(readToken(token));
}
