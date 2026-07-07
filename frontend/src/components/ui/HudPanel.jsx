import React, { useRef, useEffect } from 'react';

/**
 * HudPanel — Cyberpunk hologram HUD wrapper with scanlines, corners, and scan beam
 */
const HudPanel = ({ children, className = '', color = 'cyan', title = null }) => {
  const colorMap = {
    cyan:   { border: 'rgba(0,240,255,0.35)',   glow: 'rgba(0,240,255,0.1)',   text: '#00f0ff', beam: 'rgba(0,240,255,0.8)' },
    violet: { border: 'rgba(139,92,246,0.35)',  glow: 'rgba(139,92,246,0.1)',  text: '#8b5cf6', beam: 'rgba(139,92,246,0.8)' },
    emerald:{ border: 'rgba(16,185,129,0.35)',  glow: 'rgba(16,185,129,0.1)',  text: '#10b981', beam: 'rgba(16,185,129,0.8)' },
    red:    { border: 'rgba(239,68,68,0.35)',   glow: 'rgba(239,68,68,0.1)',   text: '#ef4444', beam: 'rgba(239,68,68,0.8)' },
  };
  const c = colorMap[color] || colorMap.cyan;

  return (
    <div
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{
        border: `1px solid ${c.border}`,
        boxShadow: `0 0 20px ${c.glow}, inset 0 0 30px ${c.glow}`,
        background: `linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(10,14,39,0.8) 100%)`,
      }}
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${c.glow} 2px, ${c.glow} 4px)`,
          animation: 'scanlines-move 8s linear infinite',
          opacity: 0.6,
        }}
      />

      {/* Scan beam */}
      <div
        className="absolute left-0 right-0 h-[2px] pointer-events-none z-[2]"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.beam}, transparent)`,
          animation: 'hud-scan 3s linear infinite',
          boxShadow: `0 0 8px ${c.beam}`,
        }}
      />

      {/* Corner decorations */}
      {['tl','tr','bl','br'].map((pos) => (
        <div
          key={pos}
          className={`absolute w-4 h-4 z-[3] hud-corner hud-corner-${pos}`}
          style={{ borderColor: c.text }}
        />
      ))}

      {/* Optional title bar */}
      {title && (
        <div
          className="relative z-[4] px-4 py-2 border-b text-xs font-bold tracking-widest uppercase"
          style={{ borderColor: c.border, color: c.text, fontFamily: 'JetBrains Mono, monospace' }}
        >
          <span className="animate-pulse mr-2">▶</span>{title}
        </div>
      )}

      {/* Content */}
      <div className="relative z-[4]">
        {children}
      </div>
    </div>
  );
};

export default HudPanel;
