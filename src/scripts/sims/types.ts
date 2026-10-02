// The contract between the runner in SimPlate.astro and each simulation.
// A simulation owns its physics and its drawing; the runner owns the
// canvas, the loop, visibility, reduced motion and the theme.

export type RGB = [number, number, number];

export interface Palette {
  accent: RGB;
  ink: RGB;
  pencil: RGB;
  muted: RGB;
  plate: RGB;
}

export interface Sim {
  /** Advance by one animation frame's worth of steps. */
  step(): void;
  /** Draw onto a canvas whose CSS size is w x h (already scaled for DPR). */
  draw(ctx: CanvasRenderingContext2D, palette: Palette, w: number, h: number): void;
  /** The page's single control changed. */
  set(value: number): void;
  /** One line shown beside the control. */
  readout(): string;
  /**
   * False while the simulation is still in a start-up transient worth
   * hiding. The runner keeps the drawing up and keeps stepping until true.
   */
  ready?(): boolean;
}

export type Create = (initial: number) => Sim;

export const rgba = ([r, g, b]: RGB, a = 1) => `rgba(${r},${g},${b},${a})`;
