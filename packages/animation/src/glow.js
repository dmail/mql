import { animate } from "./animate.js";
import { animationSequence } from "./animation_sequence.js";
import { EASING } from "./easing.js";

const COLORS = {
  black: [0, 0, 0],
  white: [255, 255, 255],
};

export const glow = (
  canvas,
  {
    fromColor = "black",
    toColor = "white",
    duration = 300,
    iterations = 2,
    x = 0,
    y = 0,
    width = canvas.width,
    height = canvas.height,
  } = {},
) => {
  if (typeof fromColor === "string") fromColor = COLORS[fromColor];
  if (typeof toColor === "string") toColor = COLORS[toColor];
  const [rFrom, gFrom, bFrom] = fromColor;
  let r = rFrom;
  let g = gFrom;
  let b = bFrom;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = context.getImageData(x, y, width, height);
  const allColors = imageData.data;
  const pixelIndexes = [];
  for (let i = 0, n = allColors.length; i < n; i += 4) {
    const rCandidate = allColors[i];
    const gCandidate = allColors[i + 1];
    const bCandidate = allColors[i + 2];
    if (rCandidate === rFrom && gCandidate === gFrom && bCandidate === bFrom) {
      pixelIndexes.push(i);
    }
  }
  const updateColor = () => {
    for (const pixelIndex of pixelIndexes) {
      allColors[pixelIndex] = r;
      allColors[pixelIndex + 1] = g;
      allColors[pixelIndex + 2] = b;
    }
    // context.clearRect(0, 0, width, height);
    context.putImageData(imageData, 0, 0);
  };

  const glowStepDuration = duration / (iterations * 2);
  const animateColor = (toColor) => {
    const [rTo, gTo, bTo] = toColor;
    const colorAnimation = animate({
      onprogress: () => {
        r = (rTo - rFrom) * colorAnimation.progressRatio;
        g = (gTo - gFrom) * colorAnimation.progressRatio;
        b = (bTo - bFrom) * colorAnimation.progressRatio;
        updateColor();
      },
      duration: glowStepDuration,
      easing: EASING.EASE_OUT_EXPO,
    });
    return colorAnimation;
  };

  const animationExecutors = [];
  let i = 0;
  while (i < iterations) {
    i++;
    animationExecutors.push(() => animateColor(toColor));
    animationExecutors.push(() => animateColor(fromColor));
  }
  return animationSequence(animationExecutors);
};
