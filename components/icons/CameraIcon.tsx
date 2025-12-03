import React from 'react';

export const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="cam3d_body" x1="10" y1="20" x2="90" y2="80" gradientUnits="userSpaceOnUse">
        <stop stopColor="#475569" />
        <stop offset="1" stopColor="#1E293B" />
      </linearGradient>
      <radialGradient id="cam3d_lens" cx="50" cy="55" r="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="1" stopColor="#0C4A6E" />
      </radialGradient>
      <filter id="cam3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#cam3d_shadow)">
        {/* Top Part */}
        <rect x="30" y="25" width="40" height="15" rx="4" fill="#64748B" />
        <rect x="60" y="22" width="8" height="5" rx="1" fill="#EF4444" />
        {/* Main Body */}
        <rect x="15" y="35" width="70" height="50" rx="10" fill="url(#cam3d_body)" />
        {/* Stripe */}
        <rect x="15" y="45" width="70" height="8" fill="#334155" />
        {/* Lens Outer */}
        <circle cx="50" cy="60" r="20" fill="#E2E8F0" />
        {/* Lens Inner */}
        <circle cx="50" cy="60" r="16" fill="url(#cam3d_lens)" />
        {/* Reflection */}
        <circle cx="55" cy="55" r="5" fill="white" fillOpacity="0.4" />
        {/* Flash */}
        <circle cx="75" cy="45" r="4" fill="#FDE047" />
    </g>
  </svg>
);
