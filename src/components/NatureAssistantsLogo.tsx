import React, { useId } from "react";

interface NatureAssistantsLogoProps {
  className?: string;
  size?: number;
}

/**
 * Logo oficial exclusiva: ASSISTENTES DA NATUREZA — ESCOLA NESTOR DE CAMARGO
 * Conceito:
 * - Folha/árvore central representando a natureza
 * - Circuitos eletrônicos integrados às nervuras e raízes (IoT & IA)
 * - Anel planetário/orbital envolvendo o símbolo
 * - Nós de monitoramento ambiental em verde-neon, verde natural e azul tecnológico
 * - Fundo transparente com brilho luminoso discreto
 */
export const NatureAssistantsLogo: React.FC<NatureAssistantsLogoProps> = ({
  className = "",
  size = 48,
}) => {
  const uid = useId().replace(/:/g, "");
  const leafGradId = `leafGrad-${uid}`;
  const ringGradId = `ringGrad-${uid}`;
  const circuitGradId = `circuitGrad-${uid}`;
  const glowFilterId = `glow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Logo Assistentes da Natureza — Escola Nestor de Camargo"
    >
      <defs>
        <linearGradient id={leafGradId} x1="34" y1="22" x2="86" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="55%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <linearGradient id={ringGradId} x1="12" y1="16" x2="108" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id={circuitGradId} x1="60" y1="30" x2="60" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>

        <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer Planetary / Globe Circle with Tech Arcs */}
      <circle
        cx="60"
        cy="60"
        r="50"
        stroke={`url(#${ringGradId})`}
        strokeWidth="2.5"
        strokeDasharray="12 5 40 5"
        opacity="0.92"
        filter={`url(#${glowFilterId})`}
      />

      {/* Subtle Planet Latitude/Monitoring Orbit Arc */}
      <ellipse
        cx="60"
        cy="62"
        rx="44"
        ry="15"
        transform="rotate(-14 60 62)"
        stroke="#38bdf8"
        strokeWidth="1.4"
        strokeDasharray="5 4"
        opacity="0.6"
      />

      {/* Inner Tech Sensor Reticle Arcs */}
      <path
        d="M22 44 A42 42 0 0 1 44 21"
        stroke="#4ade80"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M98 76 A42 42 0 0 1 76 99"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Orbital Environmental Sensor Nodes */}
      <circle cx="96" cy="28" r="3.4" fill="#38bdf8" filter={`url(#${glowFilterId})`} />
      <circle cx="96" cy="28" r="1.4" fill="#ffffff" />
      <circle cx="23" cy="88" r="3.2" fill="#4ade80" filter={`url(#${glowFilterId})`} />
      <circle cx="23" cy="88" r="1.3" fill="#ffffff" />
      <circle cx="15" cy="48" r="2.2" fill="#38bdf8" opacity="0.85" />
      <circle cx="105" cy="68" r="2.2" fill="#4ade80" opacity="0.85" />

      {/* Central Leaf / Tree Canopy Silhouette */}
      <path
        d="M60 21C76 31 85 45 85 59C85 73 74 82 60 82C46 82 35 73 35 59C35 45 44 31 60 21Z"
        fill={`url(#${leafGradId})`}
        fillOpacity="0.22"
        stroke={`url(#${leafGradId})`}
        strokeWidth="2.8"
        strokeLinejoin="round"
        filter={`url(#${glowFilterId})`}
      />

      {/* Electronic Circuit Traces Integrated Inside Leaf Veins */}
      <path
        d="M60 82V31"
        stroke={`url(#${circuitGradId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        filter={`url(#${glowFilterId})`}
      />
      {/* Left leaf circuit branches */}
      <path
        d="M60 64L48 55V48"
        stroke="#38bdf8"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M60 51L51 44"
        stroke="#4ade80"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Right leaf circuit branches */}
      <path
        d="M60 60L72 51V44"
        stroke="#38bdf8"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M60 47L69 40"
        stroke="#4ade80"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* IoT Nodes inside Leaf Veins */}
      <circle cx="60" cy="31" r="2.5" fill="#e0f2fe" />
      <circle cx="48" cy="48" r="2.4" fill="#38bdf8" />
      <circle cx="72" cy="44" r="2.4" fill="#38bdf8" />
      <circle cx="51" cy="44" r="2" fill="#4ade80" />
      <circle cx="69" cy="40" r="2" fill="#4ade80" />

      {/* Electronic Roots Integrating Tree & Circuitry */}
      <path
        d="M60 82V94"
        stroke="#4ade80"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M60 87L47 93L41 99"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M60 87L73 93L79 99"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M54 90L53 101"
        stroke="#4ade80"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M66 90L67 101"
        stroke="#4ade80"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Root Circuit Terminal Nodes */}
      <circle cx="60" cy="94" r="2.2" fill="#4ade80" />
      <circle cx="41" cy="99" r="2.1" fill="#38bdf8" />
      <circle cx="79" cy="99" r="2.1" fill="#38bdf8" />
      <circle cx="53" cy="101" r="1.8" fill="#4ade80" />
      <circle cx="67" cy="101" r="1.8" fill="#4ade80" />
    </svg>
  );
};
