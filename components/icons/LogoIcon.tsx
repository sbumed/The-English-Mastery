import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="logo3d_main" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED" />
        <stop offset="1" stopColor="#C026D3" />
      </linearGradient>
      <linearGradient id="logo3d_highlight" x1="20" y1="20" x2="60" y2="60">
        <stop stopColor="white" stopOpacity="0.5" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
       <filter id="logo3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#logo3d_shadow)">
        {/* Bubble */}
        <path d="M20 50 C20 33.4 33.4 20 50 20 C66.6 20 80 33.4 80 50 C80 66.6 66.6 80 50 80 C45 80 40 78.5 36 76 L22 82 L26 68 C22 63 20 57 20 50 Z" fill="url(#logo3d_main)" />
        <path d="M20 50 C20 33.4 33.4 20 50 20 C66.6 20 80 33.4 80 50 C80 66.6 66.6 80 50 80 C45 80 40 78.5 36 76 L22 82 L26 68 C22 63 20 57 20 50 Z" fill="url(#logo3d_highlight)" />
        
        {/* Sparkles inside */}
        <path d="M50 35 L52 45 L62 47 L52 49 L50 59 L48 49 L38 47 L48 45 L50 35Z" fill="white" />
        <path d="M65 55 L66 60 L71 61 L66 62 L65 67 L64 62 L59 61 L64 60 L65 55Z" fill="white" fillOpacity="0.8" />
    </g>
  </svg>
);
