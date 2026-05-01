import { ASSETS } from "../core/constants";

type SoundName = keyof typeof ASSETS.sounds;

export class SoundPlayer {
  private readonly sounds = new Map<SoundName, HTMLAudioElement>();
  private music?: HTMLAudioElement;
  private enabled = true;

  constructor() {
    for (const [name, path] of Object.entries(ASSETS.sounds) as Array<[SoundName, string]>) {
      this.sounds.set(name, new Audio(path));
    }
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.music?.pause();
    } else {
      this.playMusic();
    }
    return this.enabled;
  }

  play(name: SoundName): void {
    if (!this.enabled) {
      return;
    }
    const sound = this.sounds.get(name);
    if (!sound) {
      return;
    }
    sound.currentTime = 0;
    void sound.play().catch(() => undefined);
  }

  playMusic(): void {
    if (!this.enabled) {
      return;
    }
    const music = this.sounds.get("background");
    if (!music) {
      return;
    }
    music.loop = true;
    music.volume = 0.28;
    this.music = music;
    void music.play().catch(() => undefined);
  }
}
