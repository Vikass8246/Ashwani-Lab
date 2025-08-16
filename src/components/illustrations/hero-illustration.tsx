import type { SVGProps } from 'react';

export function HeroIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 512 384"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0 }} />
        </linearGradient>
         <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="512" height="384" fill="transparent" />
      <circle cx="400" cy="100" r="120" fill="url(#grad1)" />
      <path d="M 50 50 C 50 150, 150 150, 150 50 S 250 50, 250 150" stroke="hsl(var(--border))" fill="transparent" strokeWidth="4" strokeLinecap="round" />
      <rect x="280" y="200" width="150" height="100" rx="10" ry="10" fill="hsla(var(--card), 0.5)" stroke="hsl(var(--border))" strokeWidth="2" />
      <circle cx="310" cy="250" r="10" fill="hsl(var(--primary))" opacity="0.6" />
      <circle cx="355" cy="250" r="10" fill="hsl(var(--primary))" opacity="0.6" />
      <circle cx="400" cy="250" r="10" fill="hsl(var(--primary))" opacity="0.6" />
      
      <path d="M 80 300 L 180 200 L 220 240 L 280 180" stroke="url(#grad2)" fill="transparent" strokeWidth="8" strokeLinecap="round" />
      
      <circle cx="80" cy="300" r="12" fill="hsl(var(--background))" stroke="hsl(var(--accent))" strokeWidth="4" />
      <circle cx="180" cy="200" r="12" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="4" />
      <circle cx="220" cy="240" r="12" fill="hsl(var(--background))" stroke="hsl(var(--accent))" strokeWidth="4" />
      <circle cx="280" cy="180" r="12" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="4" />
    </svg>
  );
}
