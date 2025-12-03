
import React from 'react';

export const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="save3d_body" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
      <filter id="save3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2" />
      </filter>
    </defs>
    <g filter="url(#save3d_shadow)">
        {/* Main Body */}
        <rect x="15" y="15" width="70" height="70" rx="6" fill="url(#save3d_body)" />
        
        {/* Metal Slider Area */}
        <rect x="30" y="15" width="40" height="25" rx="2" fill="#E2E8F0" />
        <rect x="35" y="18" width="10" height="15" rx="1" fill="#94A3B8" />
        
        {/* Label Area */}
        <rect x="25" y="50" width="50" height="30" rx="2" fill="white" />
        <line x1="30" y1="60" x2="70" y2="60" stroke="#CBD5E1" strokeWidth="2" />
        <line x1="30" y1="70" x2="60" y2="70" stroke="#CBD5E1" strokeWidth="2" />
    </g>
  </svg>
);
