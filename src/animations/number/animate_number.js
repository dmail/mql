import { signal } from "@preact/signals";
import { animateRatio } from "../ratio/animate_ratio.js";
import { applyRatioToDiff } from "../utils/apply_ratio_to_diff.js";

export const animateNumber = (
  from,
  to,
  {
    // step = 0.0000001, // TODO
    effect,
    onstart,
    onpause,
    onremove,
    onfinish,
  } = {},
) => {
  const valueSignal = signal(from);
  const numberAnimation = animateRatio({
    type: "number_animation",
    props: {
      valueSignal,
    },
    onstart,
    onpause,
    onremove,
    onfinish,
    effect: (ratio) => {
      const value = applyRatioToDiff(from, to, ratio);
      valueSignal.value = value;
      if (effect) {
        effect(value);
      }
    },
  });
  return numberAnimation;
};
