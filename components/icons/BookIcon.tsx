import React from 'react';

export const BookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="book3d_cover" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F97316" />
        <stop offset="1" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="book3d_pages" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF" />
        <stop offset="1" stopColor="#E2E8F0" />
      </linearGradient>
      <filter id="book3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2" />
      </filter>
    </defs>
    <g filter="url(#book3d_shadow)">
        {/* Back Cover */}
        <path d="M20 25 L80 25 L85 30 L85 85 L25 85 L20 80 Z" fill="#C2410C" />
        {/* Pages Block */}
        <path d="M25 25 L80 25 L80 80 L25 80 Z" fill="url(#book3d_pages)" />
        <path d="M80 25 L85 30 L85 85 L80 80 Z" fill="#CBD5E1" />
        <path d="M25 80 L80 80 L85 85 L30 85 Z" fill="#94A3B8" />
        {/* Front Cover */}
        <path d="M15 20 L75 20 C77 20 79 22 79 24 L75 80 L15 80 C13 80 11 78 11 76 L11 24 C11 22 13 20 15 20Z" fill="url(#book3d_cover)" />
        {/* Spine/Fold Detail */}
        <path d="M20 20 L20 80" stroke="#C2410C" strokeWidth="2" />
        {/* Cover Decoration */}
        <rect x="30" y="35" width="30" height="6" rx="2" fill="white" fillOpacity="0.6" />
        <rect x="30" y="45" width="20" height="6" rx="2" fill="white" fillOpacity="0.6" />
    </g>
  </svg>
);
