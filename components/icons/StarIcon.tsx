import React from 'react';

export const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="star3d_grad" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="1" stopColor="#EAB308" />
      </linearGradient>
      <linearGradient id="star3d_edge" x1="0" y1="0" x2="100" y2="100">
        <stop stopColor="#FACC15" />
        <stop offset="1" stopColor="#A16207" />
      </linearGradient>
      <filter id="star3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#star3d_shadow)">
        <path d="M50 10 L62 38 L92 41 L69 61 L76 90 L50 75 L24 90 L31 61 L8 41 L38 38 Z" fill="url(#star3d_edge)" />
        <path d="M50 15 L60 39 L86 42 L66 59 L72 84 L50 71 L28 84 L34 59 L14 42 L40 39 Z" fill="url(#star3d_grad)" />
        <path d="M50 15 L50 71 L28 84 L34 59 L14 42 L40 39 Z" fill="white" fillOpacity="0.2" />
    </g>
  </svg>
);
