import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

type IconProps = {
  kind: 'home' | 'heatmap' | 'sun' | 'moon' | 'close' | 'plus' | 'minus';
  color: string;
  size?: number;
};

const STROKE_WIDTH = 2.2;

/** [x, y, width, height] of each heatmap block. */
const HEATMAP_BLOCKS = [
  [3, 3, 6, 6],
  [15, 3, 6, 4],
  [3, 15, 10, 6],
  [15, 11, 6, 10],
] as const;

/** [x1, y1, x2, y2] of each sun ray. */
const SUN_RAYS = [
  [12, 1.5, 12, 4.2],
  [12, 19.8, 12, 22.5],
  [1.5, 12, 4.2, 12],
  [19.8, 12, 22.5, 12],
  [4.1, 4.1, 6.1, 6.1],
  [17.9, 17.9, 19.9, 19.9],
  [4.1, 19.9, 6.1, 17.9],
  [17.9, 6.1, 19.9, 4.1],
] as const;

function IconShapes({ kind, color }: Omit<IconProps, 'size'>) {
  switch (kind) {
    case 'home':
      return (
        <Path
          d="M3 10.5L12 3L21 10.5V19.5C21 20.33 20.33 21 19.5 21H14V14H10V21H4.5C3.67 21 3 20.33 3 19.5V10.5Z"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'heatmap':
      return (
        <>
          {HEATMAP_BLOCKS.map(([x, y, width, height]) => (
            <Rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={width}
              height={height}
              rx={1.5}
              stroke={color}
              strokeWidth={STROKE_WIDTH}
            />
          ))}
        </>
      );
    case 'sun':
      return (
        <>
          <Circle
            cx="12"
            cy="12"
            r="4.5"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
          />
          {SUN_RAYS.map(([x1, y1, x2, y2]) => (
            <Line
              key={`${x1}-${y1}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />
          ))}
        </>
      );
    case 'moon':
      return (
        <Path
          d="M18.5 15.5C17.2 16.6 15.6 17.2 13.9 17.2C9.7 17.2 6.2 13.7 6.2 9.5C6.2 7.8 6.8 6.2 7.9 4.9C5.8 5.6 4.2 7.6 4.2 10C4.2 14.2 7.7 17.7 11.9 17.7C14.3 17.7 16.3 16.8 18.5 15.5Z"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'close':
      return (
        <>
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
          <Path
            d="M8 8L16 16M16 8L8 16"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
        </>
      );
    case 'plus':
      return (
        <Path
          d="M5 12H19M12 5V19"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
      );
    case 'minus':
      return (
        <Path
          d="M5 12H19"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
      );
  }
}

/** Shared 24x24 stroke icon set (tab bar, theme switcher, modal close, expand/collapse). */
export function Icon({ kind, color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <IconShapes kind={kind} color={color} />
    </Svg>
  );
}
