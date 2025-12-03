import React from 'react';

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="sparkle3d_grad" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FACC15" />
        <stop offset="1" stopColor="#CA8A04" />
      </linearGradient>
      <filter id="sparkle3d_glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <g filter="url(#sparkle3d_glow)">
        {/* Main Star */}
        <path d="M50 15 L58 42 L85 50 L58 58 L50 85 L42 58 L15 50 L42 42 L50 15Z" fill="url(#sparkle3d_grad)" stroke="#FEF08A" strokeWidth="2" />
        {/* Small Star Top Right */}
        <path d="M80 20 L82 28 L90 30 L82 32 L80 40 L78 32 L70 30 L78 28 L80 20Z" fill="#FDE047" />
        {/* Small Star Bottom Left */}
        <path d="M20 70 L22 78 L30 80 L22 82 L20 90 L18 82 L10 80 L18 78 L20 70Z" fill="#FDE047" />
    </g>
  </svg>
);
