/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Server,
  HardDrive,
  Cpu,
  Boxes,
  Layers,
  Network,
  Split,
  Grid,
  Share2,
  Radio,
  Disc,
  Wifi,
  Router,
  Antenna,
  Cable,
} from 'lucide-react';
import {
  ItemAppearance,
  clampIconSize,
  clampTextSize,
  DEFAULT_ICON_SIZE,
  DEFAULT_TEXT_SIZE,
} from '../types';

export interface DeviceIconDefinition {
  id: string;
  label: string;
  component: React.ComponentType<any>;
}

export const MDF_ICON_STYLES: DeviceIconDefinition[] = [
  { id: 'server-rack', label: 'Server Rack', component: Server },
  { id: 'server-cabinet', label: 'Server Cabinet', component: HardDrive },
  { id: 'network-cabinet', label: 'Network Cabinet', component: Boxes },
  { id: 'server-unit', label: 'Server Unit', component: Cpu },
  { id: 'rack-frame', label: 'Server Frame', component: Layers },
];

export const IDF_ICON_STYLES: DeviceIconDefinition[] = [
  { id: 'network-switch', label: 'Network Switch', component: Network },
  { id: 'switch-hub', label: 'Switch Hub', component: Split },
  { id: 'network-rack', label: 'Network Rack', component: Grid },
  { id: 'distribution-cabinet', label: 'Dist. Cabinet', component: Share2 },
];

export const AP_ICON_STYLES: DeviceIconDefinition[] = [
  { id: 'standard-ap', label: 'Wireless AP', component: Radio },
  { id: 'ceiling-ap', label: 'Ceiling AP', component: Disc },
  { id: 'wall-ap', label: 'Wall AP', component: Wifi },
  { id: 'wireless-device', label: 'Router AP', component: Router },
  { id: 'antenna', label: 'High-Gain Antenna', component: Antenna },
];

export const CABLE_ICON_STYLES: DeviceIconDefinition[] = [
  { id: 'ethernet', label: 'Ethernet Cable', component: Cable },
  { id: 'network-cable', label: 'Network Cable', component: Cable },
];

export function getMdfIconComponent(style?: string): React.ComponentType<any> {
  const found = MDF_ICON_STYLES.find((s) => s.id === style);
  return found ? found.component : Server;
}

export function getIdfIconComponent(style?: string): React.ComponentType<any> {
  const found = IDF_ICON_STYLES.find((s) => s.id === style);
  return found ? found.component : Network;
}

export function getApIconComponent(style?: string): React.ComponentType<any> {
  const found = AP_ICON_STYLES.find((s) => s.id === style);
  return found ? found.component : Radio;
}

export function getCableIconComponent(style?: string): React.ComponentType<any> {
  return Cable;
}

export interface DeviceIconBoxProps {
  type: 'mdf' | 'idf' | 'ap' | 'cable';
  appearance?: ItemAppearance;
  overrideSize?: number;
  className?: string;
}

export const DeviceIconBox: React.FC<DeviceIconBoxProps> = ({
  type,
  appearance = {},
  overrideSize,
  className = '',
}) => {
  const size = clampIconSize(overrideSize ?? appearance.iconSize);
  const iconGraphicSize = Math.max(10, Math.round(size * 0.54));

  // Resolved colors
  const defaultColors: Record<string, { icon: string; border: string; bg: string }> = {
    mdf: { icon: '#60a5fa', border: '#3b82f6', bg: '#020617' },
    idf: { icon: '#2dd4bf', border: '#0d9488', bg: '#042f2e' },
    ap: { icon: '#ffffff', border: '#ffffff', bg: '#10b981' },
    cable: { icon: '#38bdf8', border: '#0284c7', bg: '#0f172a' },
  };

  const activeDefault = defaultColors[type] || defaultColors.mdf;
  const iconColor = appearance.iconColor || activeDefault.icon;
  const borderColor = appearance.borderColor || activeDefault.border;
  const hasBorder = appearance.enableBorder !== false;
  const borderWidth = hasBorder ? appearance.borderWidth || 2 : 0;

  // Background resolution
  let bgStyle: React.CSSProperties = {};
  let shapeClasses = 'rounded-xl';

  const bgType = appearance.iconBgType || (type === 'ap' ? 'custom' : 'dark-square');

  if (bgType === 'none') {
    bgStyle = { background: 'transparent' };
  } else if (bgType === 'transparent') {
    bgStyle = { background: 'transparent' };
  } else if (bgType === 'white-circle') {
    bgStyle = { backgroundColor: '#ffffff' };
    shapeClasses = 'rounded-full';
  } else if (bgType === 'white-square') {
    bgStyle = { backgroundColor: '#ffffff' };
    shapeClasses = 'rounded-xl';
  } else if (bgType === 'dark-square') {
    bgStyle = { backgroundColor: '#020617' };
    shapeClasses = 'rounded-xl';
  } else if (bgType === 'custom') {
    const rawBg = appearance.bgColor || activeDefault.bg;
    const opacity = (appearance.bgOpacity ?? 95) / 100;
    bgStyle = {
      backgroundColor: rawBg,
      opacity,
    };
    shapeClasses = type === 'ap' ? 'rounded-full' : 'rounded-xl';
  }

  // Pick component
  let IconComponent: React.ComponentType<any> = Server;
  if (type === 'mdf') IconComponent = getMdfIconComponent(appearance.iconStyle);
  else if (type === 'idf') IconComponent = getIdfIconComponent(appearance.iconStyle);
  else if (type === 'ap') IconComponent = getApIconComponent(appearance.iconStyle);
  else if (type === 'cable') IconComponent = getCableIconComponent(appearance.iconStyle);

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderWidth: borderWidth > 0 ? `${borderWidth}px` : undefined,
        borderStyle: borderWidth > 0 ? 'solid' : undefined,
        borderColor: borderWidth > 0 ? borderColor : undefined,
        ...bgStyle,
      }}
      className={`relative flex items-center justify-center shadow-lg transition-transform ${shapeClasses} ${className}`}
    >
      <IconComponent
        style={{
          width: `${iconGraphicSize}px`,
          height: `${iconGraphicSize}px`,
          color: type === 'ap' && bgType !== 'white-circle' && bgType !== 'white-square' && bgType !== 'transparent' ? '#ffffff' : iconColor,
        }}
      />
      {type === 'mdf' && (
        <>
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </>
      )}
      {type === 'idf' && (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-teal-300" />
      )}
    </div>
  );
};

export interface DeviceLabelBadgeProps {
  label: string;
  subLabel?: string;
  type: 'mdf' | 'idf' | 'ap' | 'cable' | 'signal';
  appearance?: ItemAppearance;
  overrideSize?: number;
  className?: string;
}

export const DeviceLabelBadge: React.FC<DeviceLabelBadgeProps> = ({
  label,
  subLabel,
  type,
  appearance = {},
  overrideSize,
  className = '',
}) => {
  const textSize = clampTextSize(overrideSize ?? appearance.textSize);
  const subTextSize = Math.max(7, Math.round(textSize * 0.72));

  const textColor = appearance.textColor || (type === 'signal' ? '#0f172a' : '#ffffff');
  const fontWeight =
    appearance.fontWeight === 'normal'
      ? 'font-normal'
      : appearance.fontWeight === 'medium'
      ? 'font-medium'
      : appearance.fontWeight === 'black'
      ? 'font-black'
      : 'font-bold';

  const hasShadow = appearance.textShadow !== false;
  const hasOutline = appearance.textOutline === true;

  let bgClass = 'bg-slate-950/90 text-white border-slate-700/60';
  let customStyle: React.CSSProperties = {};

  if (appearance.textBgType === 'transparent') {
    bgClass = 'bg-transparent border-transparent';
  } else if (appearance.textBgType === 'white-pill') {
    bgClass = 'bg-white/95 text-slate-900 border-slate-300 shadow-xs';
  } else if (appearance.textBgType === 'dark-pill') {
    bgClass = 'bg-slate-950/95 text-white border-slate-700 shadow-xs';
  } else if (appearance.textBgType === 'custom' && appearance.textBgColor) {
    customStyle.backgroundColor = appearance.textBgColor;
    if (appearance.textOpacity !== undefined) {
      customStyle.opacity = appearance.textOpacity / 100;
    }
  }

  return (
    <div
      style={customStyle}
      className={`mt-1 flex flex-col items-center rounded-md px-2 py-0.5 border shadow-md text-center backdrop-blur-xs select-none ${bgClass} ${className} ${
        hasShadow ? 'drop-shadow-md' : ''
      } ${hasOutline ? 'ring-1 ring-black/40' : ''}`}
    >
      <span
        style={{ fontSize: `${textSize}px`, color: textColor }}
        className={`font-mono leading-tight tracking-wider ${fontWeight}`}
      >
        {label}
      </span>
      {subLabel && (
        <span
          style={{ fontSize: `${subTextSize}px` }}
          className="font-extrabold tracking-tight uppercase leading-none opacity-80"
        >
          {subLabel}
        </span>
      )}
    </div>
  );
};
