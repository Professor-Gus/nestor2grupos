import React from "react";
import {
  X,
  Cpu,
  Sparkles,
  Activity,
  Feather,
  Sliders,
  Trees,
  Waves,
} from "lucide-react";
import { ThemeDefinition, ThemeId, THEME_LIST } from "../themes";

interface SmartEcosystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeDefinition;
  onSelectTheme: (id: ThemeId) => void;
  onOpenSettings: () => void;
}

export const SmartEcosystemModal: React.FC<SmartEcosystemModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  const renderIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case "Waves":
        return <Waves className={className} />;
      case "Trees":
      default:
        return <Trees className={className} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ecosystem-title"
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 flex flex-col shadow-2xl relative transition-all duration-300"
        style={{
          backgroundColor: theme.colors.bgSurface,
          borderColor: theme.colors.borderMain,
          boxShadow: `0 0 35px ${theme.glowColor}`,
        }}
      >
        {/* Header with Biome Background Banner */}
        <div
          className="relative h-44 sm:h-52 overflow-hidden rounded-t-[22px] border-b"
          style={{ borderColor: theme.colors.borderSubtle }}
        >
          <img
            src={theme.bgImage}
            alt={theme.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
            aria-label="Fechar painel do bioma"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner Metadata & Title */}
          <div className="absolute bottom-3 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-200 mb-1">
                <span>Ambientes Inteligentes</span>
                <span aria-hidden="true">·</span>
                <span>{theme.biome}</span>
              </div>
              <h2
                id="ecosystem-title"
                className="text-xl sm:text-2xl font-display font-bold text-white tracking-wide flex items-center gap-2"
              >
                {renderIcon(theme.iconName, "w-6 h-6 text-emerald-400")}
                <span>
                  {theme.name} — {theme.environmentTitle}
                </span>
              </h2>
            </div>

            <div className="text-[11px] font-mono text-zinc-200 flex items-center gap-1.5 shrink-0">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>5 Sensores IoT · 5 Espécies</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Quick Theme Switcher Bar (Strictly 2 official themes: Pantanal & Amazônia) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span
                className="text-xs font-mono font-semibold uppercase tracking-wider"
                style={{ color: theme.colors.textMuted }}
              >
                Tema Visual (Visual Apenas — Não altera vídeos do grupo)
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="text-xs font-mono font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                style={{ color: theme.colors.primary }}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Abrir Configurações</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_LIST.map((th) => {
                const isActive = th.id === theme.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => onSelectTheme(th.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? "ring-2 shadow-md"
                        : "opacity-80 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: isActive
                        ? th.colors.bgElevated
                        : th.colors.bgCard,
                      borderColor: isActive
                        ? th.colors.borderMain
                        : th.colors.borderSubtle,
                      // @ts-ignore
                      "--tw-ring-color": th.colors.primary,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: th.colors.primary,
                          color: th.colors.primaryText,
                        }}
                      >
                        {renderIcon(th.iconName, "w-4 h-4")}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-sm font-bold truncate leading-tight"
                          style={{ color: th.colors.textPrimary }}
                        >
                          {th.name}
                        </div>
                        <div
                          className="text-[11px] font-mono truncate"
                          style={{ color: th.colors.textMuted }}
                        >
                          {th.environmentTitle}
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold uppercase shrink-0"
                      style={{ color: th.colors.primary }}
                    >
                      {isActive ? "Ativo" : "Aplicar"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: Dispositivos Inteligentes & Telemetria */}
          <div className="space-y-3">
            <div
              className="flex items-center justify-between border-b pb-2"
              style={{ borderColor: theme.colors.borderSubtle }}
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4" style={{ color: theme.colors.primary }} />
                <h3
                  className="text-sm font-display font-bold tracking-wide"
                  style={{ color: theme.colors.textPrimary }}
                >
                  Dispositivos Inteligentes e Sensores IoT
                </h3>
              </div>
              <span
                className="text-xs font-mono"
                style={{ color: theme.colors.textMuted }}
              >
                5 Unidades Conectadas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {theme.smartDevices.map((device, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border flex flex-col justify-between gap-2"
                  style={{
                    backgroundColor: theme.colors.bgCard,
                    borderColor: theme.colors.borderSubtle,
                  }}
                >
                  <div>
                    <div
                      className="text-xs font-bold leading-snug"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {device.name}
                    </div>
                    <div
                      className="text-[11px] font-mono mt-0.5"
                      style={{ color: theme.colors.textMuted }}
                    >
                      {device.type}
                    </div>
                  </div>

                  <div
                    className="pt-2 border-t text-[11px] font-mono flex items-center justify-between gap-2"
                    style={{ borderColor: theme.colors.borderSubtle }}
                  >
                    <span className="text-zinc-400">Leitura:</span>
                    <span
                      className="font-semibold text-right"
                      style={{ color: theme.colors.accent }}
                    >
                      {device.telemetry}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Fauna Característica */}
          <div className="space-y-3">
            <div
              className="flex items-center justify-between border-b pb-2"
              style={{ borderColor: theme.colors.borderSubtle }}
            >
              <div className="flex items-center gap-2">
                <Feather className="w-4 h-4" style={{ color: theme.colors.primary }} />
                <h3
                  className="text-sm font-display font-bold tracking-wide"
                  style={{ color: theme.colors.textPrimary }}
                >
                  Fauna Característica do Ecossistema
                </h3>
              </div>
              <span
                className="text-xs font-mono"
                style={{ color: theme.colors.textMuted }}
              >
                5 Espécies Catalogadas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {theme.animals.map((animal, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border flex flex-col justify-between gap-1.5"
                  style={{
                    backgroundColor: theme.colors.bgCard,
                    borderColor: theme.colors.borderSubtle,
                  }}
                >
                  <div>
                    <div
                      className="text-xs font-bold"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {animal.name}
                    </div>
                    <div
                      className="text-[11px] italic font-serif"
                      style={{ color: theme.colors.textMuted }}
                    >
                      {animal.scientificName} · {animal.category}
                    </div>
                  </div>

                  <div
                    className="pt-1.5 border-t text-[11px] font-mono"
                    style={{
                      borderColor: theme.colors.borderSubtle,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {animal.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div
            className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{
              backgroundColor: theme.colors.bgElevated,
              borderColor: theme.colors.borderSubtle,
            }}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 shrink-0" style={{ color: theme.colors.primary }} />
              <div>
                <div
                  className="text-xs font-bold"
                  style={{ color: theme.colors.textPrimary }}
                >
                  Ambiente Visual: {theme.name}
                </div>
                <div
                  className="text-[11px] font-mono"
                  style={{ color: theme.colors.textMuted }}
                >
                  {theme.colorsDescription}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-mono font-bold text-xs cursor-pointer border transition-transform hover:scale-105 active:scale-95 shrink-0"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.primaryText,
                borderColor: theme.colors.borderMain,
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
