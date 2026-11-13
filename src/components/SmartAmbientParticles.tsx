import React, { useEffect, useRef } from "react";

interface SmartAmbientParticlesProps {
  particleType: "fireflies" | "ripples";
  glowColor?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  alphaSpeed: number;
  color: string;
  maxSize?: number;
}

export const SmartAmbientParticles: React.FC<SmartAmbientParticlesProps> = ({
  particleType,
  glowColor = "rgba(16, 185, 129, 0.4)",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particleColors = {
      fireflies: ["#34d399", "#10b981", "#4ade80", "#38bdf8"],
      ripples: ["#22d3ee", "#38bdf8", "#2dd4bf", "#67e8f9"],
    };

    const currentPalette = particleColors[particleType] || particleColors.fireflies;
    const count = particleType === "ripples" ? 16 : 32;
    const particles: Particle[] = [];

    const initParticle = (p?: Partial<Particle>): Particle => {
      const color = currentPalette[Math.floor(Math.random() * currentPalette.length)];
      if (particleType === "fireflies") {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.3,
          size: 1.5 + Math.random() * 2.2,
          alpha: 0.15 + Math.random() * 0.65,
          alphaSpeed: (Math.random() * 0.018 + 0.006) * (Math.random() > 0.5 ? 1 : -1),
          color,
          ...p,
        };
      }
      return {
        x: Math.random() * width,
        y: height * 0.45 + Math.random() * (height * 0.55),
        vx: (Math.random() - 0.5) * 0.1,
        vy: 0,
        size: 4 + Math.random() * 8,
        maxSize: 32 + Math.random() * 28,
        alpha: 0.6,
        alphaSpeed: -0.007 - Math.random() * 0.005,
        color,
        ...p,
      };
    };

    for (let i = 0; i < count; i++) {
      particles.push(initParticle());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (particleType === "fireflies") {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha += p.alphaSpeed;

          if (p.alpha > 0.85 || p.alpha < 0.15) {
            p.alphaSpeed = -p.alphaSpeed;
          }

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.5);
          radGrad.addColorStop(0, p.color);
          radGrad.addColorStop(0.35, p.color);
          radGrad.addColorStop(1, "rgba(0,0,0,0)");

          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          p.size += 0.42;
          p.alpha += p.alphaSpeed;

          if (p.alpha <= 0 || (p.maxSize && p.size >= p.maxSize)) {
            particles[i] = initParticle({
              x: Math.random() * width,
              y: height * 0.45 + Math.random() * (height * 0.55),
              size: 4 + Math.random() * 5,
              alpha: 0.6,
            });
          } else {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.size * 1.8, p.size * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleType, glowColor]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] select-none"
      aria-hidden="true"
    />
  );
};
