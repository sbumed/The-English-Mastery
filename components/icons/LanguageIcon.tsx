
import React from 'react';

export const LanguageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="globe3d_water" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="1" stopColor="#0284C7" />
      </linearGradient>
      <radialGradient id="globe3d_shine" cx="35" cy="35" r="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.5" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <filter id="globe3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#globe3d_shadow)">
        {/* Water Body */}
        <circle cx="50" cy="50" r="40" fill="url(#globe3d_water)" />
        
        {/* Landmasses */}
        <path d="M50 15 C60 15 75 25 80 40 C70 45 55 35 50 30 C45 35 30 40 20 35 C25 25 35 15 50 15Z" fill="#4ADE80" />
        <path d="M25 55 C35 60 45 55 55 60 C65 65 70 75 65 85 C55 80 45 85 35 80 C30 70 20 65 25 55Z" fill="#4ADE80" />
        
        {/* Shine/Reflection */}
        <circle cx="50" cy="50" r="40" fill="url(#globe3d_shine)" />
        
        {/* Atmosphere Ring */}
        <circle cx="50" cy="50" r="40" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
    </g>
  </svg>
);
