/*
 * TODO: lorsqu'on met en pause la musique ne fond ne repdrends pas correctement
 * je comprends pas bien ce qu'il se passe
 *
 * a priori je peux m'en sortir avec un truc fait différement
 *
 *
 */

import { effect } from "@preact/signals";
import { animateNumber, EASING } from "animation";
import { audioPausedSignal, mutedSignal } from "./audio_signals.js";

let debug = true;
let debugFade = false;
const { userActivation } = window.navigator;

const createAudio = ({
  url,
  startTime = 0,
  volume = 1,
  loop,
  autoplay,
  restartOnPlay,
  muted = mutedSignal.value,
  fading,
  fadingDuration = 500,
}) => {
  const audio = new Audio(url);
  audio.volume = volume;
  audio.loop = loop;
  audio.autoplay = autoplay;
  audio.muted = muted;
  if (startTime) {
    audio.currentTime = startTime;
  }

  let playing = false;
  audio.addEventListener("ended", () => {
    playing = false;
  });
  audio.addEventListener("abort", () => {});

  const destroy = () => {
    audio.removeEventListener("ended", () => {
      playing = false;
    });
    audio.pause();
  };

  let playRequested = false;
  const play = () => {
    const canPlaySound =
      userActivation.hasBeenActive || userActivation.isActive;
    playRequested = true;
    if (!canPlaySound) {
      return null;
    }
    if (!audio.paused) {
      return null;
    }
    if (restartOnPlay) {
      audio.currentTime = startTime;
    }
    if (fading) {
      audio.volume = 0;
      audio.play();
      const volumeFadein = fadeInVolume(audio, volume, {
        duration: fadingDuration,
      });
      return volumeFadein.finished;
    }
    audio.play();
    return null;
  };
  const pause = () => {
    if (!playRequested) {
      return null;
    }
    playRequested = false;
    if (audio.paused) {
      return null;
    }
    if (fading) {
      const volumeFadeout = fadeOutVolume(audio, {
        onfinish: () => {
          audio.pause();
        },
        duration: fadingDuration,
      });
      return volumeFadeout.finished;
    }
    audio.pause();
    return null;
  };

  const mute = () => {
    audio.muted = true;
  };
  const unmute = () => {
    audio.muted = false;
  };

  effect(() => {
    const muted = mutedSignal.value;
    if (muted) {
      mute();
    } else {
      unmute();
      if (playRequested) {
        play();
      }
    }
  });

  return {
    audio,
    getPlayRequested: () => playRequested,
    play,
    pause,
    playing,
    mute,
    unmute,
    destroy,
  };
};
const fadeInVolume = (audio, volume, props) => {
  return animateNumber({
    from: 0,
    to: volume,
    duration: 500,
    easing: EASING.EASE_IN_EXPO,
    effect: (volume) => {
      if (debugFade) {
        console.log(`fadein ${audio.src} volume to ${volume}`);
      }
      audio.volume = volume;
    },
    ...props,
  });
};
const fadeOutVolume = (audio, props) => {
  return animateNumber({
    from: audio.volume,
    to: 0,
    duration: 500,
    easing: EASING.EASE_OUT_EXPO,
    effect: (volume) => {
      if (debugFade) {
        console.log(`fadeout ${audio.src} volume to ${volume}`);
      }
      audio.volume = volume;
    },
    ...props,
  });
};

export const sound = (props) => {
  const sound = createAudio({
    restartOnPlay: true,
    ...props,
  });
  return sound;
};

let musicPausedByGame = null;
let musicPausedByAnOther = null;
let currentMusic = null;

const PAUSED_BY_GAME = {};
const PAUSED_BY_OTHER = {};

export const music = (
  { volume = 1, loop = true, fading = true, ...props },
  { playWhilePaused } = {},
) => {
  const media = createAudio({ volume, loop, fading, ...props });

  let playRequested = false;
  const music = {
    ...media,
    src: media.audio.src,
    play: async () => {
      if (!media.audio.paused) {
        return;
      }
      playRequested = true;
      if (currentMusic && currentMusic !== music) {
        if (debug) {
          console.log(
            "about to play",
            music.src,
            `-> stop current music (${currentMusic.src}) and store as music stopped by an other`,
          );
        }
        musicPausedByAnOther = currentMusic;
        currentMusic.pause(PAUSED_BY_OTHER);
      }
      if (debug) {
        console.log(`play ${music.src}`);
      }
      currentMusic = music;
      window.currentMusic = music;
      await media.play();
    },
    pause: async (reason) => {
      if (media.audio.paused) {
        return;
      }
      if (reason !== PAUSED_BY_GAME && reason !== PAUSED_BY_OTHER) {
        playRequested = false;
      }
      if (debug) {
        console.log("stop", music.src);
      }
      await media.pause(reason);
      if (reason === PAUSED_BY_GAME) {
        musicPausedByGame = music;
        if (debug) {
          console.log(`store ${music.src} at stopped by game`);
        }
      }
      if (music === currentMusic && musicPausedByAnOther) {
        currentMusic = null;
        const musicToPlay = musicPausedByAnOther;
        musicPausedByAnOther = null;
        if (debug) {
          console.log(
            `(${music.src}) has stopped -> resume ${musicToPlay.src}`,
          );
        }
        musicToPlay.play();
      } else {
        currentMusic = null;
      }
    },
  };

  effect(() => {
    const audioPaused = audioPausedSignal.value;
    if (playWhilePaused) {
      if (audioPaused) {
        music.play();
      } else {
        music.pause();
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (audioPaused) {
        console.log("pausing", music.src);
        music.pause(PAUSED_BY_GAME);
      } else if (musicPausedByGame && music && playRequested) {
        music.play();
      }
    }
  });

  return music;
};

// const pauseMusicUrl = import.meta.resolve("./pause.mp3");
// music(
//   {
//     url: pauseMusicUrl,
//     volume: 0.2,
//     restartOnPlay: true,
//   },
//   {
//     playWhilePaused: true,
//   },
// );
