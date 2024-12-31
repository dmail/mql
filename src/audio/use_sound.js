import { useSignalEffect } from "@preact/signals";
import { useAudio } from "hooks/use_audio.js";
import { mutedSignal } from "./sound_signals.js";

export const useSound = (props) => {
  const { play, pause, mute, unmute } = useAudio({
    ...props,
    muted: mutedSignal.value,
  });

  useSignalEffect(() => {
    const muted = mutedSignal.value;
    if (muted) {
      mute();
    } else {
      unmute();
    }
  });

  return [play, pause];
};

export const useBackgroundMusic = (props) => {
  const { play, pause, mute, unmute } = useAudio({
    loop: true,
    autoplay: true,
    muted: mutedSignal.value,
    ...props,
  });

  useSignalEffect(() => {
    const muted = mutedSignal.value;
    if (muted) {
      mute();
    } else {
      unmute();
      play();
    }
  });

  return [play, pause];
};
