import React from 'react';

export const ChatIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="chat3d_grad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#6D28D9" />
      </linearGradient>
      <radialGradient id="chat3d_highlight" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(35 35) rotate(45) scale(40)">
        <stop stopColor="white" stopOpacity="0.4" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <filter id="chat3d_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#chat3d_shadow)">
        {/* Main Bubble Body */}
        <path d="M20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50C80 66.5685 66.5685 80 50 80C44.6 80 39.5 78.5 35 76L22 82L25 70C21.8 64.5 20 57.5 20 50Z" fill="url(#chat3d_grad)" />
        {/* Highlight */}
        <path d="M20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50C80 66.5685 66.5685 80 50 80C44.6 80 39.5 78.5 35 76L22 82L25 70C21.8 64.5 20 57.5 20 50Z" fill="url(#chat3d_highlight)" />
        {/* Chat Lines */}
        <rect x="35" y="42" width="30" height="6" rx="3" fill="white" fillOpacity="0.9" />
        <rect x="35" y="54" width="20" height="6" rx="3" fill="white" fillOpacity="0.9" />
    </g>
  </svg>
);
