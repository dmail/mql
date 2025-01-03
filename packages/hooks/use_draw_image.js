import { useLayoutEffect } from "preact/hooks";

export const useDrawImage = (
  canvas,
  source,
  { x = 0, y = 0, width, height, opacity = 1, onDraw, debug } = {},
) => {
  const draw = () => {
    if (!canvas) return;
    if (typeof source === "function") source = source();
    if (!source) return;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (width === undefined) {
      width = canvas.width;
    }
    if (height === undefined) {
      height = canvas.height;
    }
    if (debug) {
      console.log("draw image", {
        sx: x,
        sy: y,
        sWidth: width,
        sHeight: height,
        dx: 0,
        dy: 0,
        dWidth: canvas.width,
        dHeight: canvas.height,
      });
    }
    context.globalAlpha = opacity;
    context.drawImage(
      source,
      x,
      y,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    if (onDraw) {
      onDraw();
    }
  };

  useLayoutEffect(() => {
    draw();
  }, [canvas, source, x, y, width, height, opacity, onDraw]);

  return draw;
};
