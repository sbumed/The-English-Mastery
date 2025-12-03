import React from 'react';

export const MicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="mic3d_head" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E2E8F0" />
        <stop offset="1" stopColor="#94A3B8" />
      </linearGradient>
      <linearGradient id="mic3d_body" x1="40" y1="0" x2="60" y2="0">
        <stop stopColor="#64748B" />
        <stop offset="0.5" stopColor="#94A3B8" />
        <stop offset="1" stopColor="#64748B" />
      </linearGradient>
      <filter id="mic3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2" />
      </filter>
    </defs>
    <g filter="url(#mic3d_shadow)">
        {/* Handle */}
        <rect x="42" y="55" width="16" height="35" rx="4" fill="url(#mic3d_body)" />
        {/* Neck */}
        <rect x="40" y="50" width="20" height="5" rx="1" fill="#475569" />
        {/* Head */}
        <rect x="32" y="15" width="36" height="40" rx="18" fill="url(#mic3d_head)" stroke="#CBD5E1" strokeWidth="2" />
        {/* Grille Lines */}
        <line x1="32" y1="25" x2="68" y2="25" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="32" y1="35" x2="68" y2="35" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="32" y1="45" x2="68" y2="45" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="50" y1="15" x2="50" y2="55" stroke="#CBD5E1" strokeWidth="1" />
    </g>
  </svg>
);
