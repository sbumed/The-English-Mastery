
import React from 'react';

export const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="stop3d_grad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EF4444" />
        <stop offset="1" stopColor="#B91C1C" />
      </linearGradient>
      <filter id="stop3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#stop3d_shadow)">
        <rect x="25" y="25" width="50" height="50" rx="12" fill="url(#stop3d_grad)" stroke="#FECACA" strokeWidth="2" />
        <rect x="35" y="35" width="30" height="30" rx="4" fill="white" fillOpacity="0.9" />
    </g>
  </svg>
);
