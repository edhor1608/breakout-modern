export class InputState {
  private readonly keys = new Set<string>();

  constructor() {
    window.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      this.keys.add(event.code);
    });
    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });
  }

  pressed(code: string): boolean {
    return this.keys.has(code);
  }
}
