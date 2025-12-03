import React from 'react';

export const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="img3d_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F472B6" />
        <stop offset="1" stopColor="#DB2777" />
      </linearGradient>
      <linearGradient id="img3d_sun" x1="0" y1="0" x2="100" y2="100">
        <stop stopColor="#FEF08A" />
        <stop offset="1" stopColor="#FACC15" />
      </linearGradient>
      <filter id="img3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2" />
      </filter>
    </defs>
    <g filter="url(#img3d_shadow)">
        {/* Back Card */}
        <rect x="25" y="20" width="60" height="60" rx="6" transform="rotate(10 55 50)" fill="white" stroke="#E5E7EB" strokeWidth="1" />
        <rect x="30" y="25" width="50" height="50" rx="4" transform="rotate(10 55 50)" fill="#E0F2FE" />
        
        {/* Front Card */}
        <rect x="15" y="25" width="60" height="60" rx="6" fill="white" transform="rotate(-5 45 55)" />
        {/* Inner Image Area */}
        <rect x="20" y="30" width="50" height="50" rx="4" fill="url(#img3d_bg)" transform="rotate(-5 45 55)" />
        
        {/* Mountains */}
        <g transform="rotate(-5 45 55)">
            <circle cx="30" cy="40" r="6" fill="url(#img3d_sun)" />
            <path d="M20 80 L35 50 L50 80 Z" fill="#BE185D" />
            <path d="M40 80 L55 60 L70 80 Z" fill="#9D174D" />
        </g>
    </g>
  </svg>
);
