import React from 'react';

export const SpeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="spk3d_cone" x1="30" y1="50" x2="80" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22D3EE" />
        <stop offset="1" stopColor="#0891B2" />
      </linearGradient>
      <filter id="spk3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2" />
      </filter>
    </defs>
    <g filter="url(#spk3d_shadow)">
        {/* Box */}
        <path d="M20 35 L20 65 L35 65 L35 35 Z" fill="#475569" />
        {/* Cone */}
        <path d="M35 35 L35 65 L75 85 L75 15 Z" fill="url(#spk3d_cone)" />
        {/* Inner Cone Detail */}
        <ellipse cx="75" cy="50" rx="5" ry="35" fill="#0E7490" />
        {/* Sound Waves */}
        <path d="M85 35 C90 40 90 60 85 65" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
        <path d="M92 25 C100 35 100 65 92 75" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
    </g>
  </svg>
);
