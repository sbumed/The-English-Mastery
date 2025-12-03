
import React from 'react';

export const PrintIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="print3d_body" x1="50" y1="40" x2="50" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F1F5F9" />
        <stop offset="1" stopColor="#CBD5E1" />
      </linearGradient>
       <filter id="print3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2" />
      </filter>
    </defs>
    <g filter="url(#print3d_shadow)">
        {/* Paper Input */}
        <path d="M30 40 L35 15 L65 15 L70 40 Z" fill="white" stroke="#E2E8F0" />
        
        {/* Main Body */}
        <rect x="15" y="40" width="70" height="40" rx="6" fill="url(#print3d_body)" />
        <rect x="15" y="40" width="70" height="15" rx="6" fill="#94A3B8" fillOpacity="0.2" />
        
        {/* Paper Output */}
        <path d="M30 65 L30 90 L70 90 L70 65 Z" fill="white" />
        <line x1="35" y1="75" x2="65" y2="75" stroke="#CBD5E1" strokeWidth="2" />
        <line x1="35" y1="82" x2="55" y2="82" stroke="#CBD5E1" strokeWidth="2" />

        {/* Button/Light */}
        <circle cx="75" cy="50" r="3" fill="#22C55E" />
    </g>
  </svg>
);
