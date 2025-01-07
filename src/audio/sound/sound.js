import { effect, signal } from "@preact/signals";

const muteRequestedGloballySignal = signal(false);
export const useSoundsAllMuted = () => {
  return muteRequestedGloballySignal.value;
};
export const muteAllSounds = () => {
  muteRequestedGloballySignal.value = true;
};
export const unmuteAllSounds = () => {
  muteRequestedGloballySignal.value = false;
};
const soundSet = new Set();

export const sound = ({
  name,
  url,
  startTime = 0,
  volume = 1,
  restartOnPlay = true,
  muted,
}) => {
  const soundObject = {};
  const audio = new Audio(url);
  audio.volume = volume;
  if (startTime) {
    audio.currentTime = startTime;
  }

  init_muted: {
    const muteRequestedSignal = signal(muted);
    const mute = () => {
      muteRequestedSignal.value = true;
    };
    const unmute = () => {
      muteRequestedSignal.value = false;
    };
    effect(() => {
      const muteRequested = muteRequestedSignal.value;
      const mutedRequestedGlobally = muteRequestedGloballySignal.value;
      const shouldMute = muteRequested || mutedRequestedGlobally;
      if (shouldMute) {
        audio.muted = true;
      } else {
        audio.muted = false;
      }
    });
    Object.assign(soundObject, {
      mute,
      unmute,
    });
  }

  init_paused: {
    const playRequestedSignal = signal(false);
    const play = () => {
      playRequestedSignal.value = true;
    };
    const pause = () => {
      playRequestedSignal.value = false;
    };
    effect(() => {
      const playRequested = playRequestedSignal.value;
      if (playRequested) {
        if (restartOnPlay) {
          audio.currentTime = startTime;
        }
        audio.play();
      } else {
        audio.pause();
      }
    });
    Object.assign(soundObject, {
      play,
      pause,
    });
  }

  Object.assign(soundObject, {
    audio,
    name,
    url,
    volumeAtStart: volume,
  });
  soundSet.add(soundObject);
  return soundObject;
};
