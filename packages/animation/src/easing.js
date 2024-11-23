export const EASING = {
  EASE_OUT_EXPO: (x) => {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  },
  EASE_OUT_ELASTIC: (x) => {
    const c4 = (2 * Math.PI) / 3;
    if (x === 0) {
      return 0;
    }
    if (x === 1) {
      return 1;
    }
    return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  },
};
