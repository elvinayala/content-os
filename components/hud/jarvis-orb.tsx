"use client";

import { useEffect, useRef } from "react";

// El orbe de Jarvis: red de partículas con glow cyan neón (mismo branding que
// el Command Center). Canvas liviano.
// estado: "idle" respira lento · "pensando" acelera y brilla.
export function JarvisOrb({ estado }: { estado: "idle" | "pensando" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const N = 42;
    const R = 70;
    const particulas = Array.from({ length: N }, () => {
      const ang = Math.random() * Math.PI * 2;
      const rad = R * (0.35 + Math.random() * 0.65);
      return {
        ang,
        rad,
        vel: 0.002 + Math.random() * 0.006,
        osc: Math.random() * Math.PI * 2,
      };
    });

    let frame = 0;
    let rafId = 0;

    const dibujar = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const pensando = estadoRef.current === "pensando";
      const mult = pensando ? 3 : 1;
      frame++;

      const puntos = particulas.map((p) => {
        p.ang += p.vel * mult;
        const wobble = Math.sin(frame * 0.02 * mult + p.osc) * 8;
        return {
          x: cx + Math.cos(p.ang) * (p.rad + wobble),
          y: cy + Math.sin(p.ang) * (p.rad + wobble) * 0.85,
        };
      });

      // conexiones
      ctx.lineWidth = 0.5;
      for (let i = 0; i < puntos.length; i++) {
        for (let j = i + 1; j < puntos.length; j++) {
          const dx = puntos[i].x - puntos[j].x;
          const dy = puntos[i].y - puntos[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 2600) {
            ctx.strokeStyle = `oklch(0.8 0.13 195 / ${pensando ? 0.38 : 0.2})`;
            ctx.beginPath();
            ctx.moveTo(puntos[i].x, puntos[i].y);
            ctx.lineTo(puntos[j].x, puntos[j].y);
            ctx.stroke();
          }
        }
      }
      // partículas
      for (const p of puntos) {
        ctx.fillStyle = `oklch(0.85 0.13 195 / ${pensando ? 0.95 : 0.72})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pensando ? 1.8 : 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // núcleo con glow
      const pulso = 1 + Math.sin(frame * (pensando ? 0.08 : 0.025)) * 0.15;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 34 * pulso);
      grad.addColorStop(0, `oklch(0.82 0.14 198 / ${pensando ? 0.5 : 0.3})`);
      grad.addColorStop(1, "oklch(0.8 0.13 195 / 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 34 * pulso, 0, Math.PI * 2);
      ctx.fill();

      rafId = requestAnimationFrame(dibujar);
    };
    rafId = requestAnimationFrame(dibujar);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-44 w-full"
      aria-label="Jarvis"
      role="img"
    />
  );
}
