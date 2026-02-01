import { Audio } from 'expo-av';

// Sound manager for game audio
class SoundManager {
  private sounds: Map<string, Audio.Sound> = new Map();
  private enabled: boolean = true;

  async initialize() {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  // Play a synthetic beep sound (no external assets needed)
  async playTone(frequency: number, duration: number) {
    if (!this.enabled) return;
    // Note: expo-av doesn't support tone generation directly
    // We'll use this as a placeholder - in production, use actual sound files
    console.log(`[Sound] Playing tone: ${frequency}Hz for ${duration}ms`);
  }

  async playCut() {
    if (!this.enabled) return;
    console.log('[Sound] Rope cut!');
  }

  async playCollectStar() {
    if (!this.enabled) return;
    console.log('[Sound] Star collected!');
  }

  async playWin() {
    if (!this.enabled) return;
    console.log('[Sound] You won!');
  }

  async playLose() {
    if (!this.enabled) return;
    console.log('[Sound] You lost!');
  }

  async playChomp() {
    if (!this.enabled) return;
    console.log('[Sound] Om nom nom!');
  }

  async playPop() {
    if (!this.enabled) return;
    console.log('[Sound] Pop!');
  }

  async cleanup() {
    for (const sound of this.sounds.values()) {
      await sound.unloadAsync();
    }
    this.sounds.clear();
  }
}

export const soundManager = new SoundManager();
