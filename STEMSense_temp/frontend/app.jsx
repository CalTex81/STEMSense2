const { useState } = React;

const StemSenseLogo = () => (
  <svg className="logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
    <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1" />
    <path d="M50 15 L50 25 M85 50 L75 50 M50 85 L50 75 M15 50 L25 50" stroke="currentColor" strokeWidth="2" />
    <text x="50" y="65" fontSize="40" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Inter">S</text>
  </svg>
);

/* ──────────────────────────────────────────
   Inline SVG science / everyday-object icons
   All drawn on transparent backgrounds
   ────────────────────────────────────────── */

const FlaskSvg = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 10 L28 45 L8 78 C5 84 9 92 16 92 L64 92 C71 92 75 84 72 78 L52 45 L52 10 Z"
      stroke="#2c8b8b" strokeWidth="3" fill="rgba(44,139,139,0.12)" strokeLinejoin="round" />
    <path d="M12 72 L68 72" stroke="#2c8b8b" strokeWidth="2" strokeDasharray="3 3" />
    <ellipse cx="40" cy="85" rx="18" ry="5" fill="rgba(44,139,139,0.25)" />
    <circle cx="30" cy="78" r="3" fill="rgba(44,139,139,0.5)" />
    <circle cx="50" cy="82" r="2" fill="rgba(44,139,139,0.4)" />
    <path d="M28 10 L52 10" stroke="#2c8b8b" strokeWidth="3" strokeLinecap="round" />
    <rect x="24" y="5" width="32" height="7" rx="3" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.1)" />
  </svg>
);

const MagnetSvg = () => (
  <svg viewBox="0 0 90 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 15 L10 52 C10 68 26 78 45 78 C64 78 80 68 80 52 L80 15"
      stroke="white" strokeWidth="10" strokeLinecap="round" fill="none" />
    <path d="M10 15 L10 52 C10 68 26 78 45 78 C64 78 80 68 80 52 L80 15"
      stroke="#c0392b" strokeWidth="6" strokeLinecap="round" fill="none" strokeDasharray="30 30" strokeDashoffset="0" />
    <path d="M10 15 L10 52 C10 68 26 78 45 78 C64 78 80 68 80 52 L80 15"
      stroke="#2980b9" strokeWidth="6" strokeLinecap="round" fill="none" strokeDasharray="30 30" strokeDashoffset="30" />
    <rect x="4" y="4" width="18" height="14" rx="3" fill="#c0392b" stroke="white" strokeWidth="1" />
    <rect x="68" y="4" width="18" height="14" rx="3" fill="#2980b9" stroke="white" strokeWidth="1" />
    <text x="7" y="15" fontSize="9" fill="white" fontWeight="bold" fontFamily="Inter">N</text>
    <text x="72" y="15" fontSize="9" fill="white" fontWeight="bold" fontFamily="Inter">S</text>
  </svg>
);

const RulerSvg = () => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="116" height="24" rx="3" fill="rgba(255,220,100,0.12)" stroke="rgba(255,220,100,0.8)" strokeWidth="2" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
      <line key={i} x1={12 + i * 10} y1="14" x2={12 + i * 10} y2={i % 5 === 0 ? 24 : 20}
        stroke="rgba(255,220,100,0.8)" strokeWidth="1.5" />
    ))}
    {[0, 2, 4, 6, 8, 10].map((i, idx) => (
      <text key={i} x={9 + i * 10} y="34" fontSize="7" fill="rgba(255,220,100,0.7)" fontFamily="Inter">{idx * 2}</text>
    ))}
  </svg>
);

const BatterySvg = () => (
  <svg viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="18" width="30" height="72" rx="6" fill="rgba(100,200,100,0.1)" stroke="rgba(100,200,100,0.8)" strokeWidth="2.5" />
    <rect x="22" y="10" width="16" height="10" rx="3" fill="rgba(100,200,100,0.6)" stroke="rgba(100,200,100,0.8)" strokeWidth="1.5" />
    <path d="M26 50 L34 50" stroke="rgba(100,200,100,0.9)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M30 46 L30 54" stroke="rgba(100,200,100,0.9)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M24 65 L36 65" stroke="rgba(100,200,100,0.9)" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="17" y="20" width="26" height="18" rx="4" fill="rgba(100,200,100,0.2)" />
  </svg>
);

const LightBulbSvg = () => (
  <svg viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 62 C28 72 52 72 52 62 L52 58 C52 50 60 44 60 36 C60 20 51 10 40 10 C29 10 20 20 20 36 C20 44 28 50 28 58 Z"
      fill="rgba(255,230,50,0.1)" stroke="rgba(255,230,50,0.85)" strokeWidth="2.5" />
    <path d="M32 72 L48 72" stroke="rgba(255,230,50,0.7)" strokeWidth="3" strokeLinecap="round" />
    <path d="M34 80 L46 80" stroke="rgba(255,230,50,0.7)" strokeWidth="3" strokeLinecap="round" />
    <rect x="34" y="88" width="12" height="12" rx="3" fill="rgba(255,230,50,0.2)" stroke="rgba(255,230,50,0.5)" strokeWidth="1.5" />
    <path d="M36 36 L38 42 L34 42 L42 52 L40 46 L44 46 Z" fill="rgba(255,230,50,0.9)" />
    <line x1="40" y1="6" x2="40" y2="2" stroke="rgba(255,230,50,0.5)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="58" y1="14" x2="61" y2="11" stroke="rgba(255,230,50,0.4)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="22" y1="14" x2="19" y2="11" stroke="rgba(255,230,50,0.4)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="64" y1="36" x2="68" y2="36" stroke="rgba(255,230,50,0.4)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="36" x2="12" y2="36" stroke="rgba(255,230,50,0.4)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MicroscopeSvg = () => (
  <svg viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="8" width="14" height="30" rx="5" stroke="white" strokeWidth="2.5" fill="rgba(255,255,255,0.08)" />
    <rect x="28" y="36" width="18" height="10" rx="3" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.08)" />
    <path d="M36 46 L36 60" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="36" cy="62" rx="10" ry="6" stroke="#2c8b8b" strokeWidth="2.5" fill="rgba(44,139,139,0.15)" />
    <line x1="16" y1="80" x2="56" y2="80" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path d="M20 80 L18 95 L54 95 L52 80" stroke="white" strokeWidth="2.5" fill="rgba(255,255,255,0.08)" strokeLinejoin="round" />
    <path d="M36 64 L36 72 L26 72" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="26" y="10" width="6" height="4" rx="2" stroke="#2c8b8b" strokeWidth="1.5" fill="rgba(44,139,139,0.3)" />
  </svg>
);

const CompassSvg = () => (
  <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="45" cy="45" r="38" stroke="white" strokeWidth="2.5" fill="rgba(255,255,255,0.05)" />
    <circle cx="45" cy="45" r="30" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="4 4" />
    <polygon points="45,12 48,45 45,38 42,45" fill="#c0392b" />
    <polygon points="45,78 48,45 45,52 42,45" fill="white" />
    <circle cx="45" cy="45" r="5" fill="white" stroke="#c0392b" strokeWidth="2" />
    <text x="43" y="10" fontSize="8" fill="rgba(255,255,255,0.7)" fontFamily="Inter">N</text>
    <text x="43" y="84" fontSize="8" fill="rgba(255,255,255,0.7)" fontFamily="Inter">S</text>
    <text x="72" y="49" fontSize="8" fill="rgba(255,255,255,0.7)" fontFamily="Inter">E</text>
    <text x="10" y="49" fontSize="8" fill="rgba(255,255,255,0.7)" fontFamily="Inter">W</text>
  </svg>
);

const AtomSvg = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="50" rx="42" ry="16" stroke="rgba(100,180,255,0.7)" strokeWidth="2" />
    <ellipse cx="50" cy="50" rx="42" ry="16" stroke="rgba(100,180,255,0.7)" strokeWidth="2" transform="rotate(60 50 50)" />
    <ellipse cx="50" cy="50" rx="42" ry="16" stroke="rgba(100,180,255,0.7)" strokeWidth="2" transform="rotate(120 50 50)" />
    <circle cx="50" cy="50" r="7" fill="rgba(100,180,255,0.8)" stroke="white" strokeWidth="1.5" />
    <circle cx="92" cy="50" r="4" fill="rgba(100,180,255,0.9)" />
    <circle cx="71" cy="20" r="4" fill="rgba(100,180,255,0.9)" transform="rotate(60 50 50)" />
  </svg>
);

const DNASvg = () => (
  <svg viewBox="0 0 50 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
      const y = 8 + i * 13;
      const phase = (i / 7) * Math.PI * 2;
      const x1 = 25 + Math.sin(phase) * 16;
      const x2 = 25 - Math.sin(phase) * 16;
      return <line key={i} x1={x1} y1={y} x2={x2} y2={y} stroke="rgba(160,100,255,0.5)" strokeWidth="2" strokeLinecap="round" />;
    })}
    <path d="M9 8 C9 20 41 30 41 50 C41 70 9 80 9 100" stroke="rgba(100,200,255,0.8)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M41 8 C41 20 9 30 9 50 C9 70 41 80 41 100" stroke="rgba(255,120,180,0.8)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);

const TestTubeSvg = () => (
  <svg viewBox="0 0 40 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="8" width="20" height="75" rx="10" fill="rgba(44,139,139,0.1)" stroke="rgba(44,139,139,0.8)" strokeWidth="2.5" />
    <path d="M10 68 Q20 85 30 68" fill="rgba(44,139,139,0.3)" stroke="none" />
    <ellipse cx="20" cy="68" rx="10" ry="4" fill="rgba(44,139,139,0.4)" />
    <path d="M8 8 L32 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="16" cy="55" r="2" fill="rgba(44,139,139,0.7)" />
    <circle cx="24" cy="62" r="1.5" fill="rgba(44,139,139,0.6)" />
  </svg>
);

const RocketSvg = () => (
  <svg viewBox="0 0 60 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 5 C30 5 48 30 48 60 L30 70 L12 60 C12 30 30 5 30 5 Z" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="2.5" />
    <circle cx="30" cy="45" r="8" stroke="#2c8b8b" strokeWidth="2" fill="rgba(44,139,139,0.2)" />
    <path d="M12 60 L6 78 L20 68 Z" fill="rgba(200,100,100,0.5)" stroke="rgba(200,100,100,0.8)" strokeWidth="1.5" />
    <path d="M48 60 L54 78 L40 68 Z" fill="rgba(200,100,100,0.5)" stroke="rgba(200,100,100,0.8)" strokeWidth="1.5" />
    <path d="M24 70 L24 85 Q30 95 36 85 L36 70" fill="rgba(255,150,50,0.3)" stroke="rgba(255,150,50,0.7)" strokeWidth="1.5" />
    <ellipse cx="30" cy="86" rx="8" ry="4" fill="rgba(255,100,50,0.3)" />
  </svg>
);

const GlobeSvg = () => (
  <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="45" cy="45" r="38" stroke="rgba(100,180,255,0.7)" strokeWidth="2.5" fill="rgba(100,180,255,0.08)" />
    <ellipse cx="45" cy="45" rx="18" ry="38" stroke="rgba(100,180,255,0.5)" strokeWidth="1.5" />
    <ellipse cx="45" cy="45" rx="38" ry="14" stroke="rgba(100,180,255,0.5)" strokeWidth="1.5" />
    <ellipse cx="45" cy="45" rx="38" ry="28" stroke="rgba(100,180,255,0.3)" strokeWidth="1" />
    <path d="M7 45 L83 45" stroke="rgba(100,180,255,0.5)" strokeWidth="1.5" />
  </svg>
);

const ThermometerSvg = () => (
  <svg viewBox="0 0 40 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="8" width="10" height="70" rx="5" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.05)" />
    <rect x="19" y="40" width="4" height="42" rx="2" fill="rgba(255,80,80,0.7)" />
    <circle cx="21" cy="90" r="10" stroke="white" strokeWidth="2" fill="rgba(255,80,80,0.3)" />
    <circle cx="21" cy="90" r="6" fill="rgba(255,80,80,0.8)" />
    {[30, 50, 65].map(y => (
      <line key={y} x1="26" y1={y} x2="31" y2={y} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
    ))}
  </svg>
);

const PrismSvg = () => (
  <svg viewBox="0 0 110 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="55,8 10,82 100,82" stroke="white" strokeWidth="2.5" fill="rgba(255,255,255,0.06)" />
    <line x1="5" y1="45" x2="38" y2="45" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <line x1="72" y1="55" x2="105" y2="38" stroke="rgba(255,80,80,0.8)" strokeWidth="2" strokeLinecap="round" />
    <line x1="72" y1="57" x2="105" y2="52" stroke="rgba(255,200,50,0.8)" strokeWidth="2" strokeLinecap="round" />
    <line x1="72" y1="59" x2="105" y2="66" stroke="rgba(80,200,255,0.8)" strokeWidth="2" strokeLinecap="round" />
    <line x1="72" y1="61" x2="105" y2="80" stroke="rgba(180,80,255,0.8)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const TelescopeSvg = () => (
  <svg viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 28 L90 14 L90 40 L10 50 Z" fill="rgba(44,139,139,0.12)" stroke="#2c8b8b" strokeWidth="2" />
    <rect x="88" y="18" width="20" height="18" rx="4" fill="rgba(44,139,139,0.2)" stroke="#2c8b8b" strokeWidth="2" />
    <line x1="50" y1="40" x2="50" y2="62" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="30" y1="62" x2="70" y2="62" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="30" y1="62" x2="42" y2="44" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <line x1="70" y1="62" x2="58" y2="44" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="99" cy="27" r="5" fill="rgba(44,139,139,0.4)" stroke="#2c8b8b" strokeWidth="1.5" />
  </svg>
);

const PipetteSvg = () => (
  <svg viewBox="0 0 40 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="18" rx="12" ry="14" fill="rgba(255,200,100,0.15)" stroke="rgba(255,200,100,0.7)" strokeWidth="2" />
    <rect x="16" y="30" width="8" height="55" rx="2" fill="rgba(255,200,100,0.1)" stroke="rgba(255,200,100,0.7)" strokeWidth="2" />
    <path d="M16 84 L20 100 L24 84" fill="rgba(255,200,100,0.3)" stroke="rgba(255,200,100,0.7)" strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="18" y="50" width="4" height="25" rx="2" fill="rgba(255,200,100,0.5)" />
  </svg>
);

const StopwatchSvg = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="58" r="34" stroke="white" strokeWidth="2.5" fill="rgba(255,255,255,0.05)" />
    <circle cx="40" cy="58" r="28" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="40" y1="58" x2="40" y2="34" stroke="#2c8b8b" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="40" y1="58" x2="58" y2="64" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="40" cy="58" r="4" fill="white" />
    <rect x="34" y="16" width="12" height="8" rx="3" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)" />
    <line x1="30" y1="20" x2="26" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <line x1="50" y1="20" x2="54" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
    {[0, 60, 120, 180, 240, 300].map(deg => {
      const rad = (deg - 90) * Math.PI / 180;
      return <line key={deg} x1={40 + Math.cos(rad) * 26} y1={58 + Math.sin(rad) * 26}
        x2={40 + Math.cos(rad) * 30} y2={58 + Math.sin(rad) * 30}
        stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />;
    })}
  </svg>
);

const CircuitSvg = () => (
  <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="84" height="64" rx="6" fill="rgba(0,180,100,0.08)" stroke="rgba(0,180,100,0.6)" strokeWidth="2" />
    <path d="M20 25 L40 25 L40 55 L60 55 L60 25 L80 25" stroke="rgba(0,220,120,0.7)" strokeWidth="2" fill="none" />
    <path d="M20 55 L30 55 L30 25" stroke="rgba(0,220,120,0.5)" strokeWidth="2" fill="none" />
    <path d="M70 55 L70 40 L80 40" stroke="rgba(0,220,120,0.5)" strokeWidth="2" fill="none" />
    <rect x="38" y="30" width="12" height="12" rx="2" fill="rgba(0,220,120,0.3)" stroke="rgba(0,220,120,0.8)" strokeWidth="1.5" />
    <circle cx="20" cy="25" r="3" fill="rgba(0,220,120,0.8)" />
    <circle cx="80" cy="25" r="3" fill="rgba(0,220,120,0.8)" />
    <circle cx="20" cy="55" r="3" fill="rgba(0,220,120,0.8)" />
    <circle cx="80" cy="40" r="3" fill="rgba(0,220,120,0.8)" />
  </svg>
);

const PetriDishSvg = () => (
  <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="40" rx="44" ry="14" fill="rgba(180,255,180,0.1)" stroke="rgba(180,255,180,0.6)" strokeWidth="2.5" />
    <ellipse cx="50" cy="40" rx="44" ry="14" stroke="rgba(180,255,180,0.3)" strokeWidth="10" fill="none" />
    <ellipse cx="50" cy="36" rx="40" ry="10" fill="rgba(100,220,100,0.15)" stroke="rgba(100,220,100,0.5)" strokeWidth="1.5" />
    <ellipse cx="42" cy="34" rx="6" ry="4" fill="rgba(100,220,100,0.35)" stroke="none" />
    <ellipse cx="58" cy="38" rx="5" ry="3" fill="rgba(180,255,100,0.3)" stroke="none" />
    <ellipse cx="50" cy="30" rx="4" ry="3" fill="rgba(100,255,150,0.3)" stroke="none" />
  </svg>
);

const SaturnSvg = () => (
  <svg viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="55" cy="40" rx="55" ry="12" stroke="rgba(200,160,80,0.5)" strokeWidth="2" fill="rgba(200,160,80,0.05)" />
    <circle cx="55" cy="40" r="22" fill="rgba(220,180,100,0.15)" stroke="rgba(220,180,100,0.8)" strokeWidth="2.5" />
    <path d="M33 40 Q55 32 77 40" stroke="rgba(200,160,80,0.4)" strokeWidth="6" fill="none" />
  </svg>
);

const ScissorsSvg = () => (
  <svg viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="72" r="12" stroke="rgba(200,200,200,0.7)" strokeWidth="2" fill="rgba(200,200,200,0.1)" />
    <circle cx="58" cy="72" r="12" stroke="rgba(200,200,200,0.7)" strokeWidth="2" fill="rgba(200,200,200,0.1)" />
    <path d="M30 64 L40 40 L70 8" stroke="rgba(200,200,200,0.8)" strokeWidth="3" strokeLinecap="round" />
    <path d="M50 64 L40 40 L10 8" stroke="rgba(200,200,200,0.8)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const FunnelSvg = () => (
  <svg viewBox="0 0 70 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 10 L65 10 L42 52 L42 88 L28 88 L28 52 Z"
      stroke="rgba(150,200,255,0.7)" strokeWidth="2.5" fill="rgba(150,200,255,0.1)" strokeLinejoin="round" />
    <line x1="5" y1="10" x2="65" y2="10" stroke="rgba(150,200,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
    <ellipse cx="35" cy="70" rx="7" ry="12" fill="rgba(150,200,255,0.2)" />
    <path d="M28 90 L28 100 M42 90 L42 100" stroke="rgba(150,200,255,0.5)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CalculatorSvg = () => (
  <svg viewBox="0 0 70 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="5" width="54" height="90" rx="8" fill="rgba(100,150,255,0.08)" stroke="rgba(100,150,255,0.7)" strokeWidth="2.5" />
    <rect x="14" y="12" width="42" height="22" rx="4" fill="rgba(100,150,255,0.2)" stroke="rgba(100,150,255,0.5)" strokeWidth="1.5" />
    <text x="44" y="28" fontSize="11" fill="rgba(100,150,255,0.9)" fontFamily="Inter" textAnchor="end">42</text>
    {[[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]].map(([c, r], i) => (
      <rect key={i} x={14 + c * 15} y={42 + r * 15} width="11" height="11" rx="2"
        fill="rgba(100,150,255,0.15)" stroke="rgba(100,150,255,0.5)" strokeWidth="1" />
    ))}
    <rect x="44" y="72" width="11" height="26" rx="2" fill="rgba(100,150,255,0.25)" stroke="rgba(100,150,255,0.6)" strokeWidth="1" />
  </svg>
);

const WindTurbineSvg = () => (
  <svg viewBox="0 0 90 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="45" y1="45" x2="45" y2="105" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <line x1="20" y1="110" x2="70" y2="110" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path d="M45 45 L45 10" stroke="rgba(100,200,255,0.8)" strokeWidth="4" strokeLinecap="round" />
    <path d="M45 45 L78 62" stroke="rgba(100,200,255,0.8)" strokeWidth="4" strokeLinecap="round" />
    <path d="M45 45 L12 62" stroke="rgba(100,200,255,0.8)" strokeWidth="4" strokeLinecap="round" />
    <circle cx="45" cy="45" r="6" fill="rgba(100,200,255,0.6)" stroke="white" strokeWidth="2" />
  </svg>
);

const SyringeSvg = () => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="14" width="60" height="14" rx="4" fill="rgba(150,220,255,0.1)" stroke="rgba(150,220,255,0.7)" strokeWidth="2" />
    <rect x="30" y="18" width="36" height="6" rx="2" fill="rgba(150,220,255,0.35)" />
    <path d="M90 14 L104 21 L90 28 Z" fill="rgba(150,220,255,0.3)" stroke="rgba(150,220,255,0.7)" strokeWidth="1.5" />
    <path d="M104 21 L116 21" stroke="rgba(150,220,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <rect x="22" y="12" width="8" height="18" rx="2" fill="rgba(150,220,255,0.2)" stroke="rgba(150,220,255,0.6)" strokeWidth="1.5" />
    <line x1="14" y1="8" x2="14" y2="34" stroke="rgba(150,220,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />
    {[0, 1, 2].map(i => (
      <line key={i} x1={48 + i * 14} y1="14" x2={48 + i * 14} y2="10" stroke="rgba(150,220,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
    ))}
  </svg>
);

const PendulumSvg = () => (
  <svg viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="8" x2="70" y2="8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="40" y1="8" x2="25" y2="85" stroke="rgba(255,200,100,0.7)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="25" cy="90" r="10" fill="rgba(255,200,100,0.2)" stroke="rgba(255,200,100,0.8)" strokeWidth="2.5" />
    <path d="M25 88 Q50 60 40 8" stroke="rgba(255,200,100,0.2)" strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
  </svg>
);

const SolarPanelSvg = () => (
  <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="90" height="55" rx="4" fill="rgba(50,100,200,0.12)" stroke="rgba(100,160,255,0.7)" strokeWidth="2" />
    {[0, 1, 2].map(r => [0, 1, 2].map(c => (
      <rect key={`${r}-${c}`} x={10 + c * 28} y={10 + r * 16} width="24" height="12" rx="2"
        fill="rgba(50,100,200,0.2)" stroke="rgba(100,160,255,0.4)" strokeWidth="1" />
    )))}
    <line x1="50" y1="60" x2="50" y2="74" stroke="rgba(100,160,255,0.6)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="30" y1="74" x2="70" y2="74" stroke="rgba(100,160,255,0.6)" strokeWidth="2.5" strokeLinecap="round" />
    {[30, 50, 70].map(x => (
      <line key={x} x1={x} y1="74" x2={x === 50 ? 50 : x < 50 ? x - 4 : x + 4} y2="80" stroke="rgba(100,160,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
    ))}
  </svg>
);

const EraserSvg = () => (
  <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="8" width="80" height="34" rx="6" fill="rgba(255,150,150,0.15)" stroke="rgba(255,150,150,0.7)" strokeWidth="2.5" />
    <rect x="10" y="8" width="34" height="34" rx="6" fill="rgba(255,150,150,0.25)" />
    <line x1="44" y1="8" x2="44" y2="42" stroke="rgba(255,150,150,0.7)" strokeWidth="2" />
    <line x1="20" y1="20" x2="34" y2="32" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MagnifyingGlassSvg = () => (
  <svg viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="35" cy="35" r="26" stroke="#2c8b8b" strokeWidth="3" fill="rgba(44,139,139,0.1)" />
    <circle cx="35" cy="35" r="19" stroke="rgba(44,139,139,0.3)" strokeWidth="1.5" />
    <line x1="53" y1="56" x2="74" y2="82" stroke="#2c8b8b" strokeWidth="5" strokeLinecap="round" />
    <path d="M26 26 Q35 20 44 26" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

/* ── Belt items list (30 unique objects) ── */
const beltItems = [
  { id: 'flask', Comp: FlaskSvg },
  { id: 'magnet', Comp: MagnetSvg },
  { id: 'ruler', Comp: RulerSvg },
  { id: 'battery', Comp: BatterySvg },
  { id: 'bulb', Comp: LightBulbSvg },
  { id: 'microscope', Comp: MicroscopeSvg },
  { id: 'compass', Comp: CompassSvg },
  { id: 'atom', Comp: AtomSvg },
  { id: 'dna', Comp: DNASvg },
  { id: 'testtube', Comp: TestTubeSvg },
  { id: 'rocket', Comp: RocketSvg },
  { id: 'globe', Comp: GlobeSvg },
  { id: 'thermometer', Comp: ThermometerSvg },
  { id: 'prism', Comp: PrismSvg },
  { id: 'telescope', Comp: TelescopeSvg },
  { id: 'pipette', Comp: PipetteSvg },
  { id: 'stopwatch', Comp: StopwatchSvg },
  { id: 'circuit', Comp: CircuitSvg },
  { id: 'petri', Comp: PetriDishSvg },
  { id: 'saturn', Comp: SaturnSvg },
  { id: 'scissors', Comp: ScissorsSvg },
  { id: 'funnel', Comp: FunnelSvg },
  { id: 'calculator', Comp: CalculatorSvg },
  { id: 'turbine', Comp: WindTurbineSvg },
  { id: 'syringe', Comp: SyringeSvg },
  { id: 'pendulum', Comp: PendulumSvg },
  { id: 'solarpanel', Comp: SolarPanelSvg },
  { id: 'eraser', Comp: EraserSvg },
  { id: 'magnifier', Comp: MagnifyingGlassSvg },
  { id: 'beaker', type: 'img', src: './images/beaker.png' },
];

/* Duplicate for seamless infinite loop */
const allItems = [...beltItems, ...beltItems];

const ObjectBelt = () => (
  <div className="belt-wrapper" aria-hidden="true">
    <div className="belt-track">
      {allItems.map((item, idx) => (
        <div className="belt-item" key={`${item.id}-${idx}`}>
          {item.type === 'img' ? (
            <img src={item.src} alt={item.id} className="belt-img" />
          ) : (
            <div className="belt-svg-wrap">
              <item.Comp />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const App = () => {
  return (
    <>
      <header className="header">
        <div className="logo-container">
          <StemSenseLogo />
          <span className="logo-text">StemSense</span>
        </div>
      </header>

      <main className="main-content">
        <h1 className="hero-title">
          FIND THE STEM<br />BEHIND EVERY ITEM
        </h1>
        <p className="hero-subtitle">
          Identify everyday objects to discover their STEM potential.
        </p>

        <ObjectBelt />

        <div className="scan-cta">
          <a href="scan.html" className="scan-btn" id="scan-your-object-btn">
            <i className="fa-solid fa-camera" style={{marginRight: '0.6rem'}}></i>
            Scan Your Object
          </a>
        </div>

        <div className="fab-container">
          <i className="fa-solid fa-sparkles sparkle-icon"></i>
          <a
            href="https://github.com/CalTex81/STEMSense"
            target="_blank"
            rel="noreferrer noopener"
            className="fab-btn"
            aria-label="View STEMSense on GitHub"
          >
            <div className="fab-inner"></div>
          </a>
        </div>
      </main>
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
