import { useId } from "react";
import { cn } from "@/lib/utils";

type Stat3DIconType = "audience" | "goals" | "ideas" | "calendar";

type Stat3DIconProps = {
  type: Stat3DIconType;
  className?: string;
};

export function Stat3DIcon({ type, className }: Stat3DIconProps) {
  const uid = useId().replace(/:/g, "");

  if (type === "audience") {
    return (
      <svg viewBox="0 0 160 160" className={cn("overflow-visible", className)} role="img" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-audience-orb`} cx="34%" cy="22%" r="76%">
            <stop stopColor="#F8FCFF" />
            <stop offset="0.36" stopColor="#9FD3FF" />
            <stop offset="0.72" stopColor="#4395FF" />
            <stop offset="1" stopColor="#1F4AD8" />
          </radialGradient>
          <linearGradient id={`${uid}-audience-platform`} x1="35" y1="127" x2="132" y2="87" gradientUnits="userSpaceOnUse">
            <stop stopColor="#B8C7DD" />
            <stop offset="0.45" stopColor="#EDF6FF" />
            <stop offset="1" stopColor="#83A7D8" />
          </linearGradient>
          <linearGradient id={`${uid}-audience-platform-side`} x1="42" y1="131" x2="133" y2="105" gradientUnits="userSpaceOnUse">
            <stop stopColor="#536174" />
            <stop offset="1" stopColor="#A9BED8" />
          </linearGradient>
          <linearGradient id={`${uid}-audience-line`} x1="38" y1="98" x2="133" y2="37" gradientUnits="userSpaceOnUse">
            <stop stopColor="#BFE8FF" />
            <stop offset="0.45" stopColor="#5EA4FF" />
            <stop offset="1" stopColor="#B7FFCE" />
          </linearGradient>
          <linearGradient id={`${uid}-audience-bar`} x1="58" y1="108" x2="96" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C9D8EF" />
            <stop offset="0.46" stopColor="#87B8FF" />
            <stop offset="1" stopColor="#F9FDFF" />
          </linearGradient>
          <filter id={`${uid}-audience-shadow`} x="-25%" y="-20%" width="150%" height="155%">
            <feDropShadow dx="0" dy="18" stdDeviation="12" floodColor="#081A36" floodOpacity="0.34" />
          </filter>
          <filter id={`${uid}-audience-soft-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.20 0 0 0 0 0.58 0 0 0 0 1 0 0 0 0.42 0"
            />
          </filter>
        </defs>
        <g filter={`url(#${uid}-audience-shadow)`}>
          <ellipse cx="83" cy="127" rx="47" ry="13" fill="#101C33" opacity="0.22" />
          <path d="M37 103.5c0-6.2 5-11.2 11.2-11.2h76.3c6.2 0 11.2 5 11.2 11.2v12.2c0 6.2-5 11.2-11.2 11.2H48.2c-6.2 0-11.2-5-11.2-11.2v-12.2Z" fill={`url(#${uid}-audience-platform-side)`} />
          <path d="M41 94.5c2.8-5.2 9.1-8.5 16.2-8.5h71.2c7.2 0 10.1 4.8 6.4 10.5l-15.7 24.1c-2.6 4-8.6 6.6-15.1 6.6H32.8c-7.5 0-10.8-5.3-7.1-11.5L41 94.5Z" fill={`url(#${uid}-audience-platform)`} />
          <path d="M43 96.5c2.4-4 7.5-6.5 13.1-6.5h68.1c4.2 0 6.1 2.7 4 6.1l-13.6 21.8c-2.2 3.6-7.2 5.8-12.7 5.8H35.1c-4.8 0-6.9-3.3-4.4-7.2L43 96.5Z" fill="#F6FBFF" opacity="0.72" />

          <rect x="55" y="69" width="13" height="43" rx="6.5" fill={`url(#${uid}-audience-bar)`} transform="rotate(18 61.5 90.5)" />
          <rect x="77" y="52" width="13" height="58" rx="6.5" fill={`url(#${uid}-audience-bar)`} transform="rotate(18 83.5 81)" opacity="0.95" />
          <rect x="100" y="35" width="13" height="76" rx="6.5" fill={`url(#${uid}-audience-bar)`} transform="rotate(18 106.5 73)" opacity="0.9" />

          <path d="M38 96 64.6 73.5 84.6 84.7 126 40" fill="none" stroke="#244A7C" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" opacity="0.18" />
          <path d="M38 93 64.6 70.5 84.6 81.7 126 37" fill="none" stroke={`url(#${uid}-audience-line)`} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M119 36h16v16" fill="none" stroke="#C9FFD4" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />

          <circle cx="39" cy="93" r="10" fill={`url(#${uid}-audience-orb)`} />
          <circle cx="65" cy="70" r="11" fill={`url(#${uid}-audience-orb)`} />
          <circle cx="85" cy="82" r="11" fill={`url(#${uid}-audience-orb)`} />
          <circle cx="126" cy="37" r="10" fill="#D7FFE3" />
          <circle cx="35" cy="89" r="4" fill="#FFFFFF" opacity="0.78" />
          <circle cx="61" cy="66" r="4" fill="#FFFFFF" opacity="0.78" />
          <circle cx="81" cy="78" r="4" fill="#FFFFFF" opacity="0.68" />
        </g>
        <circle cx="97" cy="31" r="20" fill="#60A5FA" opacity="0.22" filter={`url(#${uid}-audience-soft-glow)`} />
        <circle cx="44" cy="52" r="13" fill="#B7FFCE" opacity="0.16" filter={`url(#${uid}-audience-soft-glow)`} />
      </svg>
    );
  }

  if (type === "goals") {
    return (
      <svg viewBox="0 0 160 160" className={cn("overflow-visible", className)} role="img" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-goal-face`} cx="42%" cy="34%" r="72%">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.46" stopColor="#EEE8FF" />
            <stop offset="1" stopColor="#A98AFF" />
          </radialGradient>
          <linearGradient id={`${uid}-goal-side`} x1="48" y1="124" x2="118" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7251D2" />
            <stop offset="1" stopColor="#C8B6FF" />
          </linearGradient>
          <filter id={`${uid}-goal-shadow`} x="-25%" y="-20%" width="150%" height="155%">
            <feDropShadow dx="0" dy="17" stdDeviation="12" floodColor="#2D1B5C" floodOpacity="0.2" />
          </filter>
        </defs>
        <g filter={`url(#${uid}-goal-shadow)`}>
          <ellipse cx="80" cy="118" rx="46" ry="13" fill="#D6D4E8" opacity="0.7" />
          <circle cx="83" cy="76" r="48" fill={`url(#${uid}-goal-side)`} />
          <circle cx="77" cy="70" r="48" fill={`url(#${uid}-goal-face)`} />
          <circle cx="77" cy="70" r="32" fill="none" stroke="#7C4DFF" strokeWidth="9" />
          <circle cx="77" cy="70" r="17" fill="none" stroke="#9D7BFF" strokeWidth="8" />
          <circle cx="77" cy="70" r="7" fill="#641BFF" />
          <path d="M111 39 127 23M118 36h16M114 44v-16" stroke="#9FFF8A" strokeWidth="7" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  if (type === "ideas") {
    return (
      <svg viewBox="0 0 160 160" className={cn("overflow-visible", className)} role="img" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-bulb-glow`} cx="42%" cy="24%" r="76%">
            <stop stopColor="#FFF7C2" />
            <stop offset="0.47" stopColor="#FFD66B" />
            <stop offset="1" stopColor="#F59E0B" />
          </radialGradient>
          <linearGradient id={`${uid}-bulb-base`} x1="58" y1="105" x2="102" y2="132" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF7ED" />
            <stop offset="0.54" stopColor="#B8C0CA" />
            <stop offset="1" stopColor="#667085" />
          </linearGradient>
          <filter id={`${uid}-bulb-shadow`} x="-25%" y="-25%" width="155%" height="160%">
            <feDropShadow dx="0" dy="15" stdDeviation="12" floodColor="#74410A" floodOpacity="0.22" />
          </filter>
        </defs>
        <g filter={`url(#${uid}-bulb-shadow)`}>
          <ellipse cx="80" cy="126" rx="34" ry="10" fill="#DBD4C2" opacity="0.62" />
          <path d="M44 64c0-22.1 17.1-40 38.2-40 20.4 0 36.8 16.9 36.8 38 0 15.7-8.5 25.2-18 33.7-5.9 5.3-8.5 9.2-9.4 16.3H67.3c-1.1-7.2-3.7-11.2-9.9-16.8C50 88.5 44 79.2 44 64Z" fill={`url(#${uid}-bulb-glow)`} />
          <path d="M64 111h34v11c0 6.1-5 11-11 11H75c-6.1 0-11-4.9-11-11v-11Z" fill={`url(#${uid}-bulb-base)`} />
          <path d="M65 116h32M66 124h29" stroke="#7A8798" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
          <path d="M73 94c0-14 15-14 15-28M88 94c0-12-14-12-14-24" stroke="#FFF9DA" strokeWidth="6" strokeLinecap="round" opacity="0.75" />
          <path d="M34 47 23 41M127 47l11-7M82 12V0M42 22l-8-9M120 22l8-9" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 160 160" className={cn("overflow-visible", className)} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-calendar-body`} x1="44" y1="116" x2="112" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A7F3D0" />
          <stop offset="0.52" stopColor="#34D399" />
          <stop offset="1" stopColor="#ECFDF5" />
        </linearGradient>
        <linearGradient id={`${uid}-calendar-page`} x1="49" y1="51" x2="111" y2="119" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DFF8EC" />
        </linearGradient>
        <filter id={`${uid}-calendar-shadow`} x="-25%" y="-20%" width="150%" height="155%">
          <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#0E5F47" floodOpacity="0.2" />
        </filter>
      </defs>
      <g filter={`url(#${uid}-calendar-shadow)`}>
        <ellipse cx="82" cy="123" rx="42" ry="12" fill="#CDE7DD" opacity="0.65" />
        <rect x="39" y="36" width="86" height="92" rx="18" fill={`url(#${uid}-calendar-body)`} />
        <rect x="49" y="55" width="66" height="61" rx="11" fill={`url(#${uid}-calendar-page)`} />
        <path d="M39 57h86" stroke="#079669" strokeWidth="12" strokeLinecap="round" opacity="0.78" />
        <path d="M61 29v22M103 29v22" stroke="#F8FFFB" strokeWidth="10" strokeLinecap="round" />
        <g fill="#10B981">
          <rect x="61" y="70" width="11" height="11" rx="3" />
          <rect x="78" y="70" width="11" height="11" rx="3" />
          <rect x="95" y="70" width="11" height="11" rx="3" />
          <rect x="61" y="88" width="11" height="11" rx="3" />
          <rect x="78" y="88" width="11" height="11" rx="3" />
          <rect x="95" y="88" width="11" height="11" rx="3" />
        </g>
      </g>
    </svg>
  );
}

export type { Stat3DIconType };
