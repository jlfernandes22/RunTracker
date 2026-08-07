import { AccessibilityInfo, Vibration } from 'react-native';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

const cueFiles = {
  start: require('../../assets/audio/beep_start.wav'),
  pause: require('../../assets/audio/beep_pause.wav'),
  resume: require('../../assets/audio/beep_resume.wav'),
  lap: require('../../assets/audio/beep_lap.wav'),
  stop: require('../../assets/audio/beep_stop.wav'),
  notify: require('../../assets/audio/beep_notify.wav'),
} as const;

export type CueName = keyof typeof cueFiles;

let soundEnabled = true;
let vibrationEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function setVibrationEnabled(enabled: boolean) {
  vibrationEnabled = enabled;
}

let screenReaderOn = false;
AccessibilityInfo.isScreenReaderEnabled().then((v) => {
  screenReaderOn = v;
});
AccessibilityInfo.addEventListener('screenReaderChanged', (v) => {
  screenReaderOn = v;
});

export function isScreenReaderOn(): boolean {
  return screenReaderOn;
}

const players = new Map<CueName, AudioPlayer>();

function getPlayer(cue: CueName): AudioPlayer {
  let player = players.get(cue);
  if (!player) {
    player = createAudioPlayer(cueFiles[cue]);
    player.volume = 0.8;
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        player?.remove();
        players.delete(cue);
      }
    });
    players.set(cue, player);
  }
  return player;
}

export const audio = {
  play(cue: CueName) {
    try {
      const player = getPlayer(cue);
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.warn('sound play failed', e);
    }
  },

  vibrate(pattern: number | number[]) {
    Vibration.vibrate(pattern);
  },

  vibrateCue(cue: CueName) {
    switch (cue) {
      case 'start':
        this.vibrate(100);
        break;
      case 'pause':
        this.vibrate([60, 60, 60]);
        break;
      case 'resume':
        this.vibrate(60);
        break;
      case 'lap':
        this.vibrate([40, 50, 40]);
        break;
      case 'stop':
        this.vibrate([100, 60, 100]);
        break;
      case 'notify':
        this.vibrate([30, 30, 30, 30, 30]);
        break;
    }
  },

  cue(cue: CueName, withHaptic = true) {
    if (soundEnabled) this.play(cue);
    if (withHaptic && vibrationEnabled) this.vibrateCue(cue);
  },

  speak(text: string) {
    try {
      Speech.speak(text);
    } catch (e) {
      console.warn('speech failed', e);
    }
  },

  async stopSpeaking() {
    try {
      await Speech.stop();
    } catch {}
  },
};
