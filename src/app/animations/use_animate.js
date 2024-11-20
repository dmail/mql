import { useSignalEffect } from "@preact/signals";
import { useCallback, useEffect, useRef } from "preact/hooks";
import { pausedSignal } from "../signals.js";

const noop = () => {};

export const useAnimate = ({
  animate,
  onStart = noop,
  onCancel = noop,
  onFinish = noop,
}) => {
  const animationRef = useRef();

  const play = useCallback(() => {
    const animation = animate();
    animationRef.current = animation;
    animation.oncancel = () => {
      animationRef.current = null;
      onCancel();
    };
    animation.onfinish = onFinish;
    onStart();
  }, [animate, onStart, onCancel, onFinish]);
  const pause = useCallback(() => {
    const animation = animationRef.current;
    if (!animation) {
      return;
    }
    animation.pause();
  }, []);
  const cancel = useCallback(() => {
    const animation = animationRef.current;
    if (!animation) {
      return;
    }
    if (animation.playState !== "finished") {
      animation.cancel();
    }
  }, []);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  useSignalEffect(() => {
    const paused = pausedSignal.value;
    if (paused) {
      console.log("pausing");
      pause();
    } else {
      // play();
    }
  });

  return [play, cancel, pause];
};
