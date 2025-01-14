import { computed, effect, signal } from "@preact/signals";
import { animateNumber, EASING } from "animation";
import { documentHiddenSignal } from "/utils/document_visibility.js";
import { userActivationSignal } from "/utils/user_activation.js";

let playOneAtATime = true;
const fadeInDefaults = {
  duration: 600,
  easing: EASING.EASE_IN_EXPO,
};
const fadeOutDefaults = {
  duration: 1500,
  easing: EASING.EASE_OUT_EXPO,
};

const NO_OP = () => {};
const musicSet = new Set();

// global volume
const musicGlobalVolumeSignal = signal(1);
const musicGlobalVolumeAnimatedSignal = signal();
const musicGlobalCurrentVolumeSignal = computed(() => {
  const musicGlobalVolumeAnimated = musicGlobalVolumeAnimatedSignal.value;
  const musicGlobalVolume = musicGlobalVolumeSignal.value;
  const musicGlobalCurrentVolume =
    musicGlobalVolumeAnimated === undefined
      ? musicGlobalVolume
      : musicGlobalVolumeAnimated;
  return musicGlobalCurrentVolume;
});
export const useMusicGlobalVolume = () => {
  return musicGlobalVolumeSignal.value;
};
export const setMusicGlobalVolume = (value, { animate = true } = {}) => {
  cancelGlobalVolumeAnimation();
  if (!animate) {
    musicGlobalVolumeSignal.value = value;
    return;
  }
  const from = musicGlobalVolumeSignal.value;
  const to = value;
  animateMusicGlobalVolume({
    from,
    to,
    duration: 500,
    easing: to > from ? EASING.EASE_IN_EXPO : EASING.EASE_OUT_EXPO,
    onstart: () => {
      musicGlobalVolumeSignal.value = to;
    },
  });
};
let cancelGlobalVolumeAnimation = NO_OP;
const animateMusicGlobalVolume = (props) => {
  cancelGlobalVolumeAnimation();
  const globalVolumeAnimation = animateNumber({
    // when doc is hidden the browser won't let the animation run
    // and onfinish() won't be called -> audio won't pause
    canPlayWhenDocumentIsHidden: true,
    ...props,
    effect: (volumeValue) => {
      musicGlobalVolumeAnimatedSignal.value = volumeValue;
    },
    oncancel: () => {
      musicGlobalVolumeAnimatedSignal.value = undefined;
      cancelGlobalVolumeAnimation = NO_OP;
    },
    onfinish: () => {
      musicGlobalVolumeAnimatedSignal.value = undefined;
      cancelGlobalVolumeAnimation = NO_OP;
      props.onfinish?.();
    },
  });
  cancelGlobalVolumeAnimation = () => {
    globalVolumeAnimation.cancel();
  };
  return globalVolumeAnimation;
};

// muted/unmuted
const musicsAllMutedSignal = signal(false);
export const useMusicsAllMuted = () => {
  return musicsAllMutedSignal.value;
};
export const muteAllMusics = () => {
  musicsAllMutedSignal.value = true;
};
export const unmuteAllMusics = () => {
  musicsAllMutedSignal.value = false;
};

// playing/paused
const musicsAllPausedSignal = signal(false);
export const useMusicsAllPaused = () => {
  return musicsAllPausedSignal.value;
};
export const pauseAllMusics = () => {
  musicsAllPausedSignal.value = true;
};
export const playAllMusics = () => {
  musicsAllPausedSignal.value = false;
};

let activeMusic = null;
let previousActiveMusic = null;
export const music = ({
  name,
  url,
  startTime = 0,
  volume = 1,
  loop = true,
  autoplay = false,
  restartOnPlay,
  canPlayWhilePaused,
  muted,
  volumeAnimation = true,
  fadeIn = true,
  fadeOut = true,
}) => {
  if (fadeIn === true) {
    fadeIn = {};
  }
  if (fadeOut === true) {
    fadeOut = {};
  }
  const musicObject = {};

  const audio = new Audio(url);
  audio.loop = loop;
  if (startTime) {
    audio.currentTime = startTime;
  }

  init_volume: {
    const volumeAnimatedSignal = signal();
    const volumeSignal = signal(volume);
    const volumeCurrentSignal = computed(() => {
      const musicGlobalCurrentVolume = musicGlobalCurrentVolumeSignal.value;
      const volumeAnimated = volumeAnimatedSignal.value;
      const volume = volumeSignal.value;
      const volumeToSet =
        volumeAnimated === undefined ? volume : volumeAnimated;
      const volumeToSetResolved = volumeToSet * musicGlobalCurrentVolume;
      return volumeToSetResolved;
    });

    let cancelVolumeAnimation = NO_OP;
    const animateVolume = ({
      from = volumeCurrentSignal.peek(),
      to = volumeSignal.peek(),
      oncancel = NO_OP,
      onfinish = NO_OP,
      ...rest
    }) => {
      cancelVolumeAnimation();
      const volumeAnimation = animateNumber({
        // when doc is hidden the browser won't let the animation run
        // and onfinish() won't be called -> audio won't pause
        canPlayWhenDocumentIsHidden: true,
        ...rest,
        from,
        to,
        effect: (volumeValue) => {
          volumeAnimatedSignal.value = volumeValue;
        },
        oncancel: () => {
          volumeAnimatedSignal.value = undefined;
          cancelVolumeAnimation = NO_OP;
          oncancel();
        },
        onfinish: () => {
          cancelVolumeAnimation = NO_OP;
          volumeAnimatedSignal.value = undefined;
          onfinish();
        },
      });
      cancelVolumeAnimation = () => {
        volumeAnimation.cancel();
      };
      return volumeAnimation;
    };

    effect(() => {
      const volumeCurrent = volumeCurrentSignal.value;
      audio.volume = volumeCurrent;
    });
    const setVolume = (
      value,
      { animated = volumeAnimation, duration = 500 } = {},
    ) => {
      cancelVolumeAnimation();
      if (!animated) {
        volumeSignal.value = value;
        return;
      }
      const from = volumeCurrentSignal.value;
      const to = value;
      animateVolume({
        from,
        to,
        duration,
        easing: to > from ? EASING.EASE_IN_EXPO : EASING.EASE_OUT_EXPO,
        onstart: () => {
          volumeCurrentSignal.value = to;
        },
      });
    };

    Object.assign(musicObject, {
      setVolume,
      animateVolume,
      cancelVolumeAnimation: () => {
        cancelVolumeAnimation();
      },
    });
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
      const musicsAllMuted = musicsAllMutedSignal.value;
      const muteRequested = muteRequestedSignal.value;
      const shouldMute = musicsAllMuted || muteRequested;
      if (shouldMute) {
        audio.muted = true;
      } else {
        audio.muted = false;
      }
    });
    Object.assign(musicObject, {
      muteRequestedSignal,
      mute,
      unmute,
    });
  }

  init_paused: {
    let volumeFadeoutThenPauseAnimation = null;
    const handleShouldBePaused = () => {
      if (audio.paused) {
        return;
      }
      if (!fadeOut) {
        audio.pause();
        return;
      }
      // volume fadeout then pause
      volumeFadeoutThenPauseAnimation = musicObject.animateVolume({
        ...fadeOutDefaults,
        ...fadeOut,
        from: undefined,
        to: 0,
        oncancel: () => {
          volumeFadeoutThenPauseAnimation = null;
          audio.pause();
        },
        onfinish: () => {
          volumeFadeoutThenPauseAnimation = null;
          audio.pause();
        },
      });
    };
    const handleShouldBePlaying = async () => {
      if (playOneAtATime && playRequestedSignal.value) {
        if (activeMusic && activeMusic !== musicObject) {
          const musicToReplace = activeMusic;
          musicToReplace.pauseRequestedByActiveMusicSignal.value = true;
          previousActiveMusic = musicToReplace;
        }
        activeMusic = musicObject;
      }

      if (volumeFadeoutThenPauseAnimation) {
        volumeFadeoutThenPauseAnimation.cancel();
      }
      if (!audio.paused) {
        return;
      }
      if (restartOnPlay) {
        audio.currentTime = startTime;
      }
      if (!fadeIn) {
        try {
          await audio.play();
        } catch {}
        return;
      }
      musicObject.animateVolume({
        ...fadeInDefaults,
        ...fadeIn,
        from: 0,
        to: undefined,
        onstart: async () => {
          try {
            await audio.play();
          } catch {}
        },
      });
    };

    const playRequestedSignal = signal(autoplay);
    const pauseRequestedByActiveMusicSignal = signal(false);
    effect(() => {
      const documentHidden = documentHiddenSignal.value;
      const userActivation = userActivationSignal.value;
      const musicsAllPaused = musicsAllPausedSignal.value;
      const playRequested = playRequestedSignal.value;
      const pauseRequestedByActiveMusic =
        pauseRequestedByActiveMusicSignal.value;
      const shouldPlay =
        playRequested &&
        !documentHidden &&
        userActivation !== "inactive" &&
        !musicsAllPaused &&
        !pauseRequestedByActiveMusic;

      if (shouldPlay) {
        handleShouldBePlaying();
      } else {
        handleShouldBePaused();
      }
    });

    const play = () => {
      playRequestedSignal.value = true;
      pauseRequestedByActiveMusicSignal.value = false;
    };
    const pause = () => {
      playRequestedSignal.value = false;
      if (playOneAtATime) {
        if (musicObject === activeMusic) {
          activeMusic = null;
          if (previousActiveMusic) {
            const musicToReplay = previousActiveMusic;
            previousActiveMusic = null;
            musicToReplay.pauseRequestedByActiveMusicSignal.value = false;
          }
        } else if (musicObject === previousActiveMusic) {
          previousActiveMusic = null;
        }
      }
    };

    Object.assign(musicObject, {
      playRequestedSignal,
      pauseRequestedByActiveMusicSignal,
      play,
      pause,
    });
  }

  Object.assign(musicObject, {
    audio,
    canPlayWhilePaused,
    name,
    url,
    volumeAtStart: volume,
  });
  musicSet.add(musicObject);
  return musicObject;
};

export const useReasonsToBeMuted = (music) => {
  const reasons = [];
  const musicsAllMuted = musicsAllMutedSignal.value;
  const muteRequested = music.mutedRequestedSignal.value;
  if (musicsAllMuted) {
    reasons.push("globally_muted");
  }
  if (muteRequested) {
    reasons.push("mute_requested");
  }
  return reasons;
};
export const useReasonsToBePaused = (music) => {
  const reasons = [];
  const documentHidden = documentHiddenSignal.value;
  const userActivation = userActivationSignal.value;
  const musicAllPaused = musicsAllPausedSignal.value;
  const playRequested = music.playRequestedSignal.value;
  if (documentHidden) {
    reasons.push("document_hidden");
  }
  if (!userActivation) {
    reasons.push("user_inactive");
  }
  if (!playRequested) {
    reasons.push("play_not_requested");
  }
  if (musicAllPaused) {
    reasons.push("globally_paused");
  }
  return reasons;
};

// const pauseMusicUrl = import.meta.resolve("./pause.mp3");
// const pauseMusic = music({
//   name: "pause",
//   url: pauseMusicUrl,
//   volume: 0.2,
//   restartOnPlay: true,
//   canPlayWhilePaused: true,
// });
// pauseMusic.play();
// effect(() => {
//   if (audioPausedSignal.value) {
//     pauseMusic.play();
//   } else {
//     pauseMusic.pause();
//   }
// });
