import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Logo = ({ light = false, to = '/', className = '', size = 'md' }) => {
  const emblemDimensions = {
    sm: 'w-11 h-11',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl sm:text-[22px]',
    lg: 'text-3xl',
  };

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-3.5 group select-none ${className}`}
    >
      {/* High-Detail Full-Bleed Emblem (Exact match to Option 1 Final) */}
      <div
        className={`relative ${emblemDimensions[size] || emblemDimensions.md} shrink-0 flex items-center justify-center`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 200"
          className="w-full h-full overflow-visible drop-shadow-[0_0_10px_rgba(20,184,166,0.32)]"
        >
          <defs>
            {/* Metallic Gear Gradient */}
            <linearGradient id="ssGearMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#99F6E4" />
              <stop offset="45%" stopColor="#2DD4BF" />
              <stop offset="100%" stopColor="#1E3A5F" />
            </linearGradient>

            {/* Glowing Sea Glass & Cyan Gradient */}
            <linearGradient id="ssCyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="50%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#0891B2" />
            </linearGradient>

            {/* Deep Obsidian Dial Fill */}
            <radialGradient id="ssDialCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#134E4A" stopOpacity="0.65" />
              <stop offset="75%" stopColor="#0B1324" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#070B14" stopOpacity="1" />
            </radialGradient>

            {/* Arrow Sweep Gradient */}
            <linearGradient id="ssSweepArrow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.35" />
              <stop offset="65%" stopColor="#2DD4BF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#99F6E4" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* 1. LEFT-SIDE CIRCUIT DATA TRACES & NODES */}
          <g stroke="#2DD4BF" strokeWidth="2.4" fill="none" strokeLinecap="round">
            <polyline points="42,56 30,56 22,72" />
            <circle cx="44" cy="56" r="4.2" fill="#0B1324" stroke="#5EEAD4" strokeWidth="2.4" />
            <circle cx="21" cy="75" r="3.6" fill="#2DD4BF" />

            <polyline points="32,84 18,84 10,94" />
            <circle cx="34" cy="84" r="4" fill="#0B1324" stroke="#22D3EE" strokeWidth="2.4" />
            <circle cx="7" cy="94" r="2.6" fill="#5EEAD4" stroke="none" />

            <polyline points="35,114 20,114 14,126" />
            <circle cx="37" cy="114" r="4" fill="#0B1324" stroke="#2DD4BF" strokeWidth="2.4" />
            <circle cx="28" cy="134" r="3.2" fill="#22D3EE" stroke="none" />
          </g>

          {/* 2. TOP & BOTTOM SWEEPING SYNC ARROWS */}
          <motion.g
            animate={{ rotate: [0, 4, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '94px 100px' }}
          >
            {/* Top Sweeping Thick Sync Arrow */}
            <path
              d="M 42,46 A 68,68 0 0,1 114,32"
              stroke="url(#ssSweepArrow)"
              strokeWidth="8.5"
              fill="none"
              strokeLinecap="round"
            />
            <polygon points="110,20 132,35 107,43" fill="#67E8F9" />

            {/* Right Outer Arc */}
            <path
              d="M 156,64 A 68,68 0 0,1 142,148"
              stroke="url(#ssCyanGlow)"
              strokeWidth="7.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Bottom Sweeping Thick Sync Arrow */}
            <path
              d="M 134,154 A 68,68 0 0,1 48,148"
              stroke="url(#ssSweepArrow)"
              strokeWidth="8.5"
              fill="none"
              strokeLinecap="round"
            />
            <polygon points="54,137 33,136 42,158" fill="#22D3EE" />
          </motion.g>

          {/* 3. LEFT-SIDE MECHANICAL GEAR TEETH (13 Gear Precision) */}
          <g fill="url(#ssGearMetal)" stroke="#090D16" strokeWidth="1.6">
            {[180, 210, 240, 270, 300, 330, 0, 150].map((deg) => (
              <path
                key={deg}
                d="M 86,33 L 102,33 L 105,45 L 83,45 Z"
                transform={`rotate(${deg} 94 100)`}
              />
            ))}
          </g>

          {/* Gear Outer Bevel Ring */}
          <circle
            cx="94"
            cy="100"
            r="56"
            fill="#0F172A"
            stroke="url(#ssGearMetal)"
            strokeWidth="7"
          />

          {/* 4. TILTED MATRIX GRID + CHECKMARK + EMBEDDED '10' (Top-Right) */}
          <g transform="translate(115, 26)">
            {/* Angled Schedule Grid Card */}
            <polygon
              points="18,0 52,24 30,54 -4,30"
              fill="#0B1324"
              stroke="#5EEAD4"
              strokeWidth="2.6"
            />
            {/* Grid Internal Cell Lines */}
            <line x1="11" y1="10" x2="45" y2="34" stroke="#2DD4BF" strokeWidth="1.4" opacity="0.65" />
            <line x1="4" y1="20" x2="38" y2="44" stroke="#2DD4BF" strokeWidth="1.4" opacity="0.65" />
            <line x1="29" y1="8" x2="7" y2="38" stroke="#2DD4BF" strokeWidth="1.4" opacity="0.65" />
            <line x1="40" y1="16" x2="18" y2="46" stroke="#2DD4BF" strokeWidth="1.4" opacity="0.65" />

            {/* Crisp Glowing Checkmark */}
            <polyline
              points="12,21 22,30 48,6"
              fill="none"
              stroke="#99F6E4"
              strokeWidth="4.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Clearly Visible '10' Inside Grid Bottom Corner */}
            <rect x="13" y="34" width="19" height="12" rx="2.5" fill="#090D16" />
            <text
              x="22.5"
              y="43.5"
              textAnchor="middle"
              fill="#67E8F9"
              fontSize="11"
              fontWeight="900"
              fontFamily="monospace"
            >
              10
            </text>
          </g>

          {/* 5. INNER CHRONO DIAL + TICK MARKS */}
          <circle
            cx="94"
            cy="100"
            r="46"
            fill="url(#ssDialCore)"
            stroke="#67E8F9"
            strokeWidth="2.8"
          />
          <g stroke="#99F6E4" strokeLinecap="round">
            {[...Array(24)].map((_, i) => {
              const isMajor = i % 2 === 0;
              return (
                <line
                  key={i}
                  x1="94"
                  y1="57"
                  x2="94"
                  y2={isMajor ? '64' : '61'}
                  strokeWidth={isMajor ? '2' : '1.1'}
                  opacity={isMajor ? '0.9' : '0.5'}
                  transform={`rotate(${i * 15} 94 100)`}
                />
              );
            })}
          </g>

          {/* Clock Hand Accent */}
          <line
            x1="94"
            y1="100"
            x2="122"
            y2="82"
            stroke="#99F6E4"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* 6. CENTRAL CYBERNETIC HOURGLASS */}
          <g fill="none" stroke="#67E8F9" strokeWidth="3.2" strokeLinejoin="round">
            {/* Top & Bottom Caps */}
            <line x1="74" y1="68" x2="114" y2="68" strokeWidth="3.8" strokeLinecap="round" />
            <line x1="74" y1="132" x2="114" y2="132" strokeWidth="3.8" strokeLinecap="round" />
            {/* Glass Bulbs */}
            <path d="M 77,69 C 77,85 90,94 94,100 C 98,94 111,85 111,69 Z" />
            <path d="M 77,131 C 77,115 90,106 94,100 C 98,106 111,115 111,131 Z" />
          </g>
          {/* Glowing Sand Inside Hourglass */}
          <path d="M 83,76 L 105,76 L 94,94 Z" fill="#2DD4BF" opacity="0.7" />
          <path d="M 80,129 C 82,120 90,116 94,116 C 98,116 106,120 108,129 Z" fill="#5EEAD4" opacity="0.85" />
          <circle cx="94" cy="103" r="1.8" fill="#FFFFFF" />
          <circle cx="94" cy="110" r="1.6" fill="#67E8F9" />

          {/* 7. CLEARLY VISIBLE '4' ON LOWER-RIGHT DIAL */}
          <text
            x="114"
            y="112"
            fill="#99F6E4"
            fontSize="15"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            4
          </text>

          {/* 8. BOTTOM-RIGHT BRANCHING NETWORK NODES + '10' BADGE NODE */}
          <g stroke="#5EEAD4" strokeWidth="2.6" strokeLinecap="round">
            <line x1="126" y1="102" x2="148" y2="118" />
            <line x1="148" y1="102" x2="126" y2="118" />
            <line x1="126" y1="118" x2="122" y2="140" />
            <line x1="148" y1="118" x2="148" y2="146" />
            <line x1="122" y1="140" x2="148" y2="146" />
            <line x1="126" y1="118" x2="112" y2="132" />
          </g>

          {/* Node Circles */}
          <circle cx="126" cy="102" r="5.5" fill="#2DD4BF" stroke="#090D16" strokeWidth="1.5" />
          <circle cx="148" cy="102" r="5.5" fill="#5EEAD4" stroke="#090D16" strokeWidth="1.5" />
          <circle cx="126" cy="118" r="5.5" fill="#2DD4BF" stroke="#090D16" strokeWidth="1.5" />
          <circle cx="148" cy="118" r="5.5" fill="#67E8F9" stroke="#090D16" strokeWidth="1.5" />
          <circle cx="112" cy="132" r="5.5" fill="#99F6E4" stroke="#090D16" strokeWidth="1.5" />
          <circle cx="122" cy="140" r="5.5" fill="#2DD4BF" stroke="#090D16" strokeWidth="1.5" />

          {/* Bottom-Right Large Node Containing '10' */}
          <circle
            cx="148"
            cy="146"
            r="10.5"
            fill="#0B1324"
            stroke="#5EEAD4"
            strokeWidth="2.4"
          />
          <text
            x="148"
            y="149.5"
            textAnchor="middle"
            fill="#99F6E4"
            fontSize="9.5"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            10
          </text>
        </svg>
      </div>

      {/* 9. OPTION 1 KINETIC WORDMARK (Speed Lines + Chevrons + SLOTSYNC + Glow Underline) */}
      <div className="flex flex-col leading-none">
        {/* Top Kinetic Speed Lines & Double Chevrons */}
        <div className="flex items-center justify-end gap-1.5 mb-1 pr-1">
          <div className="flex flex-col gap-[2.5px]">
            <span className="h-[2px] w-12 rounded-full bg-gradient-to-r from-transparent via-teal-400 to-cyan-300" />
            <span className="h-[1.5px] w-8 ml-4 rounded-full bg-gradient-to-r from-transparent to-teal-300/80" />
          </div>
          <motion.span
            animate={{ x: [0, 2.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[11px] font-black leading-none text-teal-300 tracking-tighter"
          >
            »
          </motion.span>
        </div>

        {/* Bold Architectural SLOTSYNC Title */}
        <div
          className={`flex items-center font-black tracking-[0.06em] uppercase ${
            titleSizes[size] || titleSizes.md
          }`}
        >
          <span className={light ? 'text-white' : 'text-navy-900'}>SLOT</span>
          <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(45,212,191,0.35)]">
            SYNC
          </span>
        </div>

        {/* Bottom Sea Glass Glow Bar */}
        <div className="mt-1.5 flex items-center gap-1">
          <span className="h-[2.5px] w-full rounded-full bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-500/40 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
        </div>
      </div>
    </Link>
  );
};

export default Logo;