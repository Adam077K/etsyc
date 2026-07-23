/**
 * dock/undock ride --spring-video ("stiffness damping mass" — design-system
 * §1.5), realised as a CSS linear() timing function sampled from the
 * closed-form damped-spring solution. No animation library: the FLIP is
 * still one CSS transition; the spring is only its curve. Engines without
 * linear() keep the --ease-cinematic fallback set immediately before it.
 */

export const SPRING_VIDEO_FALLBACK: readonly [number, number, number] = [210, 26, 1];

/** Read --spring-video off :root; fall back where CSS isn't computed. */
export function readSpringVideoParams(): readonly [number, number, number] {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") {
    return SPRING_VIDEO_FALLBACK;
  }
  const [stiffness, damping, mass] = getComputedStyle(document.documentElement)
    .getPropertyValue("--spring-video")
    .trim()
    .split(/\s+/)
    .map(Number);
  if (
    stiffness !== undefined &&
    damping !== undefined &&
    mass !== undefined &&
    [stiffness, damping, mass].every((n) => Number.isFinite(n) && n > 0)
  ) {
    return [stiffness, damping, mass];
  }
  return SPRING_VIDEO_FALLBACK;
}

/**
 * Sample spring progress over `durationMs` into a linear() easing.
 * x(t) solves m·x″ + c·x′ + k·x = 0 with x(0)=1, x′(0)=0; progress is
 * 1 − x(t) and may overshoot 1 (that IS the spring settle — linear()
 * supports it). The 440ms --dur-dock token is the settle window for
 * 210/26/1. The last stop is pinned to exactly 1 so the FLIP lands.
 */
export function springLinearEasing(
  [stiffness, damping, mass]: readonly [number, number, number],
  durationMs: number,
  samples = 24,
): string {
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const stops: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const t = (u * durationMs) / 1000;
    let x: number;
    if (zeta < 1) {
      const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
      x =
        Math.exp(-zeta * omega0 * t) *
        (Math.cos(omegaD * t) + ((zeta * omega0) / omegaD) * Math.sin(omegaD * t));
    } else {
      // critically / over-damped — no oscillation term
      x = Math.exp(-omega0 * t) * (1 + omega0 * t);
    }
    if (i === 0) {
      stops.push("0");
    } else if (i === samples) {
      stops.push("1");
    } else {
      const progress = Math.round((1 - x) * 1000) / 1000;
      stops.push(`${progress} ${Math.round(u * 1000) / 10}%`);
    }
  }
  return `linear(${stops.join(", ")})`;
}
