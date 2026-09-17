import type { InputState } from "./types";

export class Keyboard {
  left = false;
  right = false;
  jump = false;

  constructor() {
    window.addEventListener("keydown", (e) => this.onKey(e, true));
    window.addEventListener("keyup", (e) => this.onKey(e, false));
  }

  snapshot(): InputState {
    return { left: this.left, right: this.right, jump: this.jump };
  }

  private onKey(e: KeyboardEvent, down: boolean): void {
    const k = e.key.toLowerCase();
    if (["arrowleft", "a"].includes(k)) this.left = down;
    if (["arrowright", "d"].includes(k)) this.right = down;
    if ([" ", "arrowup", "w", "k", "z"].includes(k)) {
      this.jump = down;
      e.preventDefault();
    }
  }
}
