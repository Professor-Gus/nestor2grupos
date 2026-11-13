export type ThemeId = "pantanal" | "amazonia";

export interface ThemeColors {
  bgApp: string;          // Main background
  bgSurface: string;      // Cards and main panels
  bgCard: string;         // Inner cards / sections
  bgElevated: string;     // Elevated popovers / sheets
  bgInput: string;        // Text inputs and chips
  borderMain: string;     // Primary structural borders
  borderSubtle: string;   // Secondary dividing borders
  primary: string;        // Main theme action color
  primaryHover: string;   // Hover state
  primaryText: string;    // Contrast text on primary button
  accent: string;         // Highlights, badges, pulse rings
  accentText: string;     // Text for accent badges
  textPrimary: string;    // Headings, titles
  textSecondary: string;  // Body text
  textMuted: string;      // Captions, subtitles, hints
  chipBg: string;         // Suggested / trigger chip bg
  chipHoverBg: string;    // Trigger hover bg
  glow: string;           // Shadows and glow highlights
}

export interface FaunaSpecies {
  name: string;
  scientificName: string;
  category: string;
  status: string;
}

export interface SmartDevice {
  name: string;
  type: string;
  status: "online" | "transmitting" | "monitoring" | "active";
  telemetry: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  environmentTitle: string;
  biome: string;
  colorsDescription: string;
  bgImage: string;
  particleType: "fireflies" | "ripples";
  glowColor: string;
  iconName: "Trees" | "Waves";
  swatches: [string, string, string, string];
  colors: ThemeColors;
  animals: FaunaSpecies[];
  smartDevices: SmartDevice[];
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  pantanal: {
    id: "pantanal",
    name: "Pantanal",
    environmentTitle: "Ecossistema Aquático Inteligente",
    biome: "Áreas Alagadas, Rios e Lagoas",
    colorsDescription: "Azul-turquesa, verde-água e tons naturais das planícies alagadas",
    bgImage: "/assets/images/pantanal_smart.jpg",
    particleType: "ripples",
    glowColor: "rgba(34, 211, 238, 0.38)",
    iconName: "Waves",
    swatches: ["#021617", "#0d9488", "#06b6d4", "#2dd4bf"],
    colors: {
      bgApp: "#010e0f",
      bgSurface: "#031c1e",
      bgCard: "#062c30",
      bgElevated: "#093b40",
      bgInput: "#021415",
      borderMain: "#06b6d4",
      borderSubtle: "#0a565d",
      primary: "#22d3ee",
      primaryHover: "#67e8f9",
      primaryText: "#021b1e",
      accent: "#2dd4bf",
      accentText: "#021b1e",
      textPrimary: "#ecfeff",
      textSecondary: "#a5f3fc",
      textMuted: "#99f6e4",
      chipBg: "#05292c",
      chipHoverBg: "#22d3ee",
      glow: "rgba(34, 211, 238, 0.25)",
    },
    animals: [
      { name: "Onça-pintada do Pantanal", scientificName: "Panthera onca palustris", category: "Maior Felino das Américas", status: "Margem do Rio Monitorada" },
      { name: "Capivara", scientificName: "Hydrochoerus hydrochaeris", category: "Maior Roedor do Planeta", status: "Família na Lagoa" },
      { name: "Jacaré-do-pantanal", scientificName: "Caiman yacare", category: "Réptil Aquático", status: "Banhando-se ao Sol" },
      { name: "Tuiuiú", scientificName: "Jabiru mycteria", category: "Símbolo Alado do Pantanal", status: "Ninho Ativo" },
      { name: "Ariranha", scientificName: "Pteronura brasiliensis", category: "Lontra Gigante Fluvial", status: "Natação em Cardume" },
    ],
    smartDevices: [
      { name: "Radares de Nível de Rio & Cheias", type: "Sensor Radar Fluvial 24GHz", status: "online", telemetry: "Nível: +2.84m • Estável" },
      { name: "Boias de Monitoramento da Água", type: "Sonda Multiparâmetro Flutuante", status: "transmitting", telemetry: "Turbidez 2.4 NTU • 24.8°C" },
      { name: "Câmeras Noturnas de Fauna Aquática", type: "Sensor Infravermelho", status: "monitoring", telemetry: "Fluxo Contínuo 60 fps" },
      { name: "Drones de Observação Aérea", type: "UAV Anfíbio de Longo Alcance", status: "active", telemetry: "Varredura 5.2 km² • 91%" },
      { name: "Sensores de Qualidade & Oxigênio", type: "Sonda Óptica de OD Dissolvido", status: "online", telemetry: "OD 7.3 mg/L • pH 6.9" },
    ],
  },
  amazonia: {
    id: "amazonia",
    name: "Amazônia",
    environmentTitle: "Floresta Tropical Inteligente",
    biome: "Floresta Tropical Densa & Rios Amazônicos",
    colorsDescription: "Verde-neon, verde-floresta, esmeralda e azul tecnológico",
    bgImage: "/assets/images/amazonia_smart.jpg",
    particleType: "fireflies",
    glowColor: "rgba(16, 185, 129, 0.38)",
    iconName: "Trees",
    swatches: ["#03140c", "#064e3b", "#10b981", "#38bdf8"],
    colors: {
      bgApp: "#020e07",
      bgSurface: "#05180f",
      bgCard: "#092418",
      bgElevated: "#0c3020",
      bgInput: "#03140b",
      borderMain: "#10b981",
      borderSubtle: "#0b432a",
      primary: "#10b981",
      primaryHover: "#34d399",
      primaryText: "#02170d",
      accent: "#38bdf8",
      accentText: "#02170d",
      textPrimary: "#f0fdf4",
      textSecondary: "#bbf7d0",
      textMuted: "#6ee7b7",
      chipBg: "#082518",
      chipHoverBg: "#10b981",
      glow: "rgba(16, 185, 129, 0.25)",
    },
    animals: [
      { name: "Onça-pintada", scientificName: "Panthera onca", category: "Predador de Topo", status: "Monitorada por IA" },
      { name: "Arara-vermelha", scientificName: "Ara chloropterus", category: "Avifauna do Dossel", status: "Em Revoada Ativa" },
      { name: "Tucano", scientificName: "Ramphastos toco", category: "Dispersor Florestal", status: "Avistado na Copa" },
      { name: "Bicho-preguiça", scientificName: "Bradypus tridactylus", category: "Mamífero Arborícola", status: "Movimento Tranquilo" },
      { name: "Macaco-aranha", scientificName: "Ateles paniscus", category: "Primata da Selva", status: "Bando Rastreado" },
    ],
    smartDevices: [
      { name: "Câmera de Monitoramento Florestal", type: "Visão Noturna AI 4K", status: "transmitting", telemetry: "30 fps • Detecção de Fauna" },
      { name: "Sensor de Umidade do Solo", type: "Sonda LoRaWAN Subsuperfície", status: "online", telemetry: "84.2% UR • pH 6.1" },
      { name: "Sensor de Temperatura de Copa", type: "Sensor Térmico de Dossel", status: "monitoring", telemetry: "27.4°C • Sensação 29°C" },
      { name: "Estação Meteorológica Inteligente", type: "Solar Telemetry Node", status: "online", telemetry: "1012 hPa • Chuva 12mm/h" },
      { name: "Drone de Monitoramento Ambiental", type: "Eco-UAV Autônomo", status: "active", telemetry: "Patrulha 2.4km • Bateria 94%" },
    ],
  },
};

export const THEME_LIST: ThemeDefinition[] = [
  THEMES.pantanal,
  THEMES.amazonia,
];

export function isValidThemeId(value: unknown): value is ThemeId {
  return value === "pantanal" || value === "amazonia";
}
