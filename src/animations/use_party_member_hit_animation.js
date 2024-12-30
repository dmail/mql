import { animateElement, animateSequence, EASING } from "animation";
import { useCallback } from "preact/hooks";
import { useAnimate } from "./use_animate.js";

export const usePartyMemberHitAnimation = ({
  elementRef,
  duration,
  ...props
}) => {
  const animate = useCallback(() => {
    return animatePartyMemberHit(elementRef.current, { duration });
  }, [duration]);

  return useAnimate({
    animate,
    ...props,
  });
};

const animatePartyMemberHit = (element, { duration }) => {
  let from = 0;
  const interval = (to) => {
    const stepDuration = (to - from) * duration;
    from = to;
    return stepDuration;
  };
  const relativeToElementHeight = (ratio) => {
    return element.clientHeight * ratio;
  };
  const verticalMoves = [
    { y: relativeToElementHeight(0.5), duration: interval(0.4) },
    { y: relativeToElementHeight(0.3), duration: interval(0.6) },
    { y: relativeToElementHeight(0.2), duration: interval(0.8) },
    { y: relativeToElementHeight(0.1), duration: interval(1) },
  ];
  const steps = [];
  for (const { y, duration } of verticalMoves) {
    steps.push(() => {
      return animateElement({
        element,
        to: { y },
        duration: duration / 2,
        easing: EASING.EASE,
      });
    });
    steps.push(() => {
      return animateElement({
        element,
        to: { y: 0 },
        duration: duration / 2,
        easing: EASING.EASE,
      });
    });
  }
  return animateSequence(steps);
};