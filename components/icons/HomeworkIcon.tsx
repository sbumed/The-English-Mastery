
import React from 'react';

export const HomeworkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="hw3d_board" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A855F7" />
        <stop offset="1" stopColor="#7E22CE" />
      </linearGradient>
      <linearGradient id="hw3d_paper" x1="20" y1="20" x2="80" y2="80">
        <stop stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#F1F5F9" />
      </linearGradient>
      <filter id="hw3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2" />
      </filter>
    </defs>
    <g filter="url(#hw3d_shadow)">
        {/* Clip Board Body */}
        <rect x="15" y="15" width="70" height="80" rx="8" fill="url(#hw3d_board)" />
        
        {/* Paper */}
        <rect x="25" y="25" width="50" height="60" rx="2" fill="url(#hw3d_paper)" />
        
        {/* Lines on Paper */}
        <rect x="30" y="35" width="20" height="4" rx="1" fill="#CBD5E1" />
        <rect x="30" y="45" width="40" height="4" rx="1" fill="#E2E8F0" />
        <rect x="30" y="55" width="35" height="4" rx="1" fill="#E2E8F0" />
        <rect x="30" y="65" width="30" height="4" rx="1" fill="#E2E8F0" />

        {/* Metal Clip */}
        <rect x="35" y="10" width="30" height="12" rx="2" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
        
        {/* Checkmark/Grade */}
        <path d="M60 60 L70 85 L95 50" stroke="#22C55E" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);
