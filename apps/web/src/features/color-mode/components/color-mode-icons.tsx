import type { JSX } from 'react';
import type { ColorMode } from '@kanji/core';

/** An icon's size in px: 16 in the colour mode menu (FEAT5), 18 on the start page tiles (FEAT5_1). */
type IconProps = { size?: number };

const iconProps = (size: number) =>
  ({
    'aria-hidden': true,
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'shrink-0',
  }) as const;

export function SunIcon({ size = 16 }: IconProps) {
  return (
    <svg {...iconProps(size)} data-icon="sun">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon({ size = 16 }: IconProps) {
  return (
    <svg {...iconProps(size)} data-icon="moon">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  );
}

export function TickIcon({ size = 16 }: IconProps) {
  return (
    <svg {...iconProps(size)} strokeWidth={2.5} data-icon="tick">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Each mode's icon: a sun for Light, a moon for Dark. */
export const MODE_ICONS: Record<ColorMode, (props: IconProps) => JSX.Element> = {
  light: SunIcon,
  dark: MoonIcon,
};
