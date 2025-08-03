import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export type SoundType = 'taskComplete' | 'levelUp' | 'error' | 'achievement' | 'coin';

class SoundService {
  private static instance: SoundService;
  private sounds: Map<SoundType, Audio.Sound> = new Map();
  private isEnabled = true;
  private volume = 0.7;

  // URLs de sons gratuitos e dopaminérgicos
  private soundUrls: Record<SoundType, string> = {
    taskComplete: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    levelUp: 'https://opengameart.org/sites/default/files/audio_preview/0/0/0000.ogg',
    error: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav', 
    achievement: 'https://www.soundjay.com/misc/sounds/magic-chime-02.wav',
    coin: 'https://opengameart.org/sites/default/files/coin-03.wav'
  };

  private constructor() {
    this.initializeAudio();
  }

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  private async initializeAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
    }
  }

  private async loadSound(type: SoundType): Promise<Audio.Sound | null> {
    try {
      if (this.sounds.has(type)) {
        return this.sounds.get(type)!;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: this.soundUrls[type] },
        { 
          volume: this.volume,
          shouldPlay: false,
          isLooping: false 
        }
      );

      this.sounds.set(type, sound);
      return sound;
    } catch (error) {
      console.warn(`Failed to load sound ${type}:`, error);
      return null;
    }
  }

  public async playSound(type: SoundType, withHaptics = true): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Haptic feedback primeiro (mais rápido)
      if (withHaptics) {
        switch (type) {
          case 'taskComplete':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'levelUp':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'achievement':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          case 'coin':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
        }
      }

      // Som em paralelo
      const sound = await this.loadSound(type);
      if (sound) {
        await sound.setVolumeAsync(this.volume);
        await sound.replayAsync();
      }
    } catch (error) {
      console.warn(`Failed to play sound ${type}:`, error);
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  public getVolume(): number {
    return this.volume;
  }

  // Limpar sons da memória
  public async cleanup(): Promise<void> {
    const soundEntries = Array.from(this.sounds.entries());
    for (const [type, sound] of soundEntries) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.warn(`Failed to unload sound ${type}:`, error);
      }
    }
    this.sounds.clear();
  }

  // Sons específicos para diferentes situações
  public async playTaskComplete(): Promise<void> {
    await this.playSound('taskComplete');
  }

  public async playLevelUp(): Promise<void> {
    await this.playSound('levelUp');
  }

  public async playAchievement(): Promise<void> {
    await this.playSound('achievement');
  }

  public async playError(): Promise<void> {
    await this.playSound('error');
  }

  public async playCoin(): Promise<void> {
    await this.playSound('coin');
  }
}

export default SoundService;