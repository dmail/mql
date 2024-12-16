import { useLayoutEffect, useRef, useState } from "preact/hooks";

export const MultiBorder = ({ borders }) => {
  borders = [borders[0], borders[1]];
  const svgRef = useRef();
  let fullSize = borders.reduce((acc, border) => acc + border.size, 0);
  const deps = [];
  for (const border of borders) {
    deps.push(border.size, border.color, border.radius);
  }
  const [svgChildren, svgChildrenSetter] = useState([]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const svgParentNode = svg.parentNode;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const availableWidth = svg.parentNode.offsetWidth;
      const availableHeight = svg.parentNode.offsetHeight;
      svg.setAttribute("width", availableWidth);
      svg.setAttribute("height", availableHeight);

      let xConsumed = 0;
      let yConsumed = 0;
      let rightConsumed = 0;
      let bottomConsumed = 0;
      let widthConsumed = 0;
      let heightConsumed = 0;
      let remainingWidth = availableWidth;
      let remainingHeight = availableHeight;
      let previousRadius;
      let previousSize;
      const corners = [];
      for (const border of borders) {
        const borderSize = border.size;
        const borderRadius = border.radius || 0;
        let borderWidthRaw = border.width;
        if (borderWidthRaw === undefined) borderWidthRaw = "50%";
        const borderWidth =
          typeof borderWidthRaw === "string"
            ? (parseInt(borderWidthRaw) / 100) * availableWidth
            : borderWidthRaw;
        let borderHeightRaw = border.height;
        if (borderHeightRaw === undefined) borderHeightRaw = "50%";
        const borderHeight =
          typeof borderHeightRaw === "string"
            ? (parseInt(borderHeightRaw) / 100) * availableHeight
            : borderHeightRaw;
        let radius;
        if (previousRadius === undefined) {
          radius = borderRadius;
        } else {
          radius = previousRadius - previousSize / 2 - borderSize / 2;
        }
        corners.push(
          <Corners
            rectangleWidth={remainingWidth}
            rectangleHeight={remainingHeight}
            x={xConsumed}
            y={yConsumed}
            width={borderWidth - rightConsumed}
            height={borderHeight - bottomConsumed}
            size={borderSize}
            radius={radius}
            color={border.color}
            opacity={border.opacity}
          />,
        );
        xConsumed += borderSize;
        yConsumed += borderSize;
        rightConsumed += borderSize;
        bottomConsumed += borderSize;
        previousSize = borderSize;
        previousRadius = radius;
        widthConsumed += borderSize;
        heightConsumed += borderSize;
        remainingWidth = availableWidth - widthConsumed;
        remainingHeight = availableHeight - heightConsumed;
      }
      svgChildrenSetter(corners);
    });
    observer.observe(svgParentNode);
    return () => {
      observer.disconnect();
    };
  }, deps);

  return (
    <div
      style={{
        position: "absolute",
        inset: `-${fullSize}px`,
      }}
    >
      <svg ref={svgRef} style={{ overflow: "visible" }}>
        {svgChildren}
      </svg>
    </div>
  );
};

const Corners = ({
  rectangleWidth,
  rectangleHeight,
  x,
  y,
  width,
  height,
  size,
  radius,
  color,
  opacity,
}) => {
  return (
    <>
      <TopLeftCorner
        x={x}
        y={y}
        width={width}
        height={height}
        size={size}
        radius={radius}
        color={color}
        opacity={opacity}
      />
      <TopRightCorner
        x={rectangleWidth}
        y={y}
        width={width}
        height={height}
        size={size}
        radius={radius}
        color={color}
        opacity={opacity}
      />
      <BottomRightCorner
        x={rectangleWidth}
        y={rectangleHeight}
        width={width}
        height={height}
        size={size}
        radius={radius}
        color={color}
        opacity={opacity}
      />
      <BottomLeftCorner
        x={x}
        y={rectangleHeight}
        width={width}
        height={height}
        size={size}
        radius={radius}
        color={color}
        opacity={opacity}
      />
    </>
  );
};

const TopLeftCorner = ({
  x,
  y,
  width,
  height,
  size,
  radius,
  color,
  opacity,
}) => {
  let d;
  if (radius <= 0) {
    d = [
      `M ${x - width},${y + size / 2}`,
      `h ${width}`,
      `M ${size / 2 - x},${y + size}`,
      `v ${height - size}`,
    ];
  } else {
    d = [
      `M ${x + size / 2},${y + height}`,
      `v -${height - size / 2 - radius}`,
      `a ${radius},${radius} 0 0 1 ${radius},-${radius}`,
      `h ${width - size / 2 - radius}`,
    ];
  }
  return (
    <path
      d={d.join(" ")}
      fill="none"
      stroke={color}
      stroke-width={size}
      opacity={opacity}
    />
  );
};
const TopRightCorner = ({
  x,
  y,
  width,
  height,
  size,
  radius,
  color,
  opacity,
}) => {
  let d;
  if (radius <= 0) {
    d = [
      `M ${x - width},${y + size / 2}`,
      `h ${width}`,
      `M ${size / 2 - x},${y + size}`,
      `v ${height - size}`,
    ];
  } else {
    d = [
      `M ${x - width},${y + size / 2}`,
      `h ${width - size / 2 - radius}`,
      `a ${radius},${radius} 0 0 1 ${radius},${radius}`,
      `v ${height - size / 2 - radius}`,
    ];
  }

  return (
    <path
      d={d.join(" ")}
      fill="none"
      stroke={color}
      stroke-width={size}
      opacity={opacity}
    />
  );
};
const BottomRightCorner = ({
  x,
  y,
  width,
  height,
  size,
  radius,
  color,
  opacity,
}) => {
  let d;
  if (radius <= 0) {
    d = [
      `M ${x - width},${y + size / 2}`,
      `h ${width}`,
      `M ${size / 2 - x},${y + size}`,
      `v ${height - size}`,
    ];
  } else {
    d = [
      `M ${x - size / 2},${y - height}`,
      `v ${width - size / 2 - radius}`,
      `a ${radius},${radius} 0 0 1 -${radius},${radius}`,
      `h -${width - size / 2 - radius}`,
    ];
  }

  return (
    <path
      d={d.join(" ")}
      fill="none"
      stroke={color}
      stroke-width={size}
      opacity={opacity}
    />
  );
};
const BottomLeftCorner = ({
  x,
  y,
  width,
  height,
  size,
  radius,
  color,
  opacity,
}) => {
  let d;
  if (radius <= 0) {
    d = [
      `M ${x - width},${y + size / 2}`,
      `h ${width}`,
      `M ${size / 2 - x},${y + size}`,
      `v ${height - size}`,
    ];
  } else {
    d = [
      `M ${x + width},${y - size / 2}`,
      `h -${width - size / 2 - radius}`,
      `a ${radius},${radius} 0 0 1 -${radius},-${radius}`,
      `v -${height - size / 2 - radius}`,
    ];
  }

  return (
    <path
      d={d.join(" ")}
      fill="none"
      stroke={color}
      stroke-width={size}
      opacity={opacity}
    />
  );
};
