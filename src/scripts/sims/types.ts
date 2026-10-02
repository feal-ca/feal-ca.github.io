// The contract between the runner in SimPlate.astro and each simulation.
// A simulation owns its physics and its drawing; the runner owns the
// canvas, the loop, visibility, reduced motion, the theme, the controls,
// and reset (it simply creates the simulation again).

export type RGB = [number, number, number];

export interface Palette {
  accent: RGB;
  ink: RGB;
  pencil: RGB;
  muted: RGB;
  plate: RGB;
}

/** Pointer position in canvas fractions: x and y both run 0..1, y down. */
export interface SimPointer {
  type: "down" | "move" | "up";
  x: number;
  y: number;
}

export type Params = Record<string, number>;

export interface Sim {
  /** Advance by one animation frame's worth of steps. */
  step(): void;
  /** Draw onto a canvas whose CSS size is w x h (already scaled for DPR). */
  draw(ctx: CanvasRenderingContext2D, palette: Palette, w: number, h: number): void;
  /** A named control changed. */
  set(name: string, value: number): void;
  /** A named button was pressed (anything other than play and reset). */
  action?(name: string): void;
  /** Pointer input. Return true while the sim is using it (a drag). */
  pointer?(p: SimPointer): boolean;
  /** CSS cursor for a hover position, so draggable things look draggable. */
  cursor?(x: number, y: number): string;
  /** One line shown in the control bar. */
  readout(): string;
  /**
   * False while the simulation is still in a start-up transient worth
   * hiding. The runner keeps the drawing up and keeps stepping until true.
   */
  ready?(): boolean;
}

export type Create = (params: Params) => Sim;

export const rgba = ([r, g, b]: RGB, a = 1) => `rgba(${r},${g},${b},${a})`;

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
