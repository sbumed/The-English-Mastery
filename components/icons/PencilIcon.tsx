
import React from 'react';

export const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="pencil3d_body" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FBBF24" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
      <filter id="pencil3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2" />
      </filter>
    </defs>
    <g filter="url(#pencil3d_shadow)" transform="rotate(-45 50 50)">
        {/* Eraser */}
        <rect x="40" y="10" width="20" height="15" rx="2" fill="#F472B6" />
        {/* Metal Band */}
        <rect x="40" y="25" width="20" height="8" fill="#94A3B8" />
        {/* Body */}
        <rect x="40" y="33" width="20" height="45" fill="url(#pencil3d_body)" />
        {/* Tip Wood */}
        <path d="M40 78 L50 90 L60 78 Z" fill="#FDE68A" />
        {/* Lead */}
        <path d="M47 86 L50 90 L53 86 Z" fill="#1F2937" />
        {/* Highlight */}
        <rect x="44" y="33" width="4" height="45" fill="white" fillOpacity="0.3" />
    </g>
  </svg>
);
