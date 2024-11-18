import { fromTransformations } from "matrix";
import { useLayoutEffect } from "preact/hooks";
import { useImage } from "../hooks/use_image.js";
import { useCanvasRef } from "./use_canvas_ref.jsx";

export const SpriteSheet = ({
  name,
  className = "sprite",
  url,
  transparentColor,
  x,
  y,
  width,
  height,
  mirrorX,
  mirrorY,
}) => {
  const canvasRef = useCanvasRef();

  const [image] = useImage(url);
  useLayoutEffect(() => {
    if (!image) {
      return;
    }
    let source = image;
    if (transparentColor) {
      source = replaceColorWithTransparentPixels(image, transparentColor);
    }
    const transformations = {
      ...(mirrorX || mirrorY
        ? {
            flip: {
              x: mirrorX,
              y: mirrorY,
            },
            translate: {
              x: mirrorX ? -parseInt(width) : 0,
              y: mirrorY ? -parseInt(height) : 0,
            },
          }
        : {}),
    };
    const canvas = canvasRef.current;
    const hasTransformations = Object.keys(transformations).length > 0;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    if (hasTransformations) {
      context.save();
      const matrix = fromTransformations(transformations);
      context.setTransform(...matrix);
      //  context.setTransform(-1, 0, 0, 1, parseInt(width), 0);
    }
    context.drawImage(
      source,
      parseInt(x),
      parseInt(y),
      parseInt(width),
      parseInt(height),
      0,
      0,
      canvas.offsetWidth,
      canvas.offsetHeight,
    );
    if (hasTransformations) {
      context.restore();
    }
  }, [image, transparentColor, x, y, width, height]);

  return <canvas name={name} className={className} ref={canvasRef} />;
};

const replaceColorWithTransparentPixels = (image, color) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const pixels = imageData.data;

  let shouldReplace;
  const [first] = color;
  if (typeof first === "object") {
    shouldReplace = (r, g, b) => {
      return color.some((c) => {
        return r === c[0] && g === c[1] && b === c[2];
      });
    };
  } else {
    const rToReplace = parseInt(color[0]);
    const gToReplace = parseInt(color[1]);
    const bToReplace = parseInt(color[2]);
    shouldReplace = (r, g, b) => {
      return r === rToReplace && g === gToReplace && b === bToReplace;
    };
  }

  for (let i = 0, n = pixels.length; i < n; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (shouldReplace(r, g, b)) {
      pixels[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

// const mapPixels = (imageData, callback) => {
//   let modified = false;
//   const pixels = imageData.data;
//   for (let i = 0, n = pixels.length; i < n; i += 4) {
//     const r = pixels[i];
//     const g = pixels[i + 1];
//     const b = pixels[i + 2];
//     const result = callback(r, g, b);
//     if (!result) {
//       continue;
//     }
//     const [r2, g2, b2] = result;
//     if (r2 !== r) {
//       modified = true;
//       pixels[i] = r2;
//     }
//     if (g2 !== g) {
//       modified = true;
//       pixels[i + 1] = g2;
//     }
//     if (b2 !== b) {
//       modified = true;
//       pixels[i + 2] = b2;
//     }
//   }
//   if (modified) {
//     context.putImageData(imageData, 0, 0);
//   }
// };
