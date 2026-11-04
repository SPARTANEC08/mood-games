import React, { useEffect, useRef } from 'react';
import { Particle, CellColor } from '../types';

const COLOR_MAP: Record<CellColor, string> = {
  yellow: '#ffd32a',
  orange: '#ff793f',
  cyan: '#00d2d3',
  purple: '#a55eea',
  green: '#2ed573',
  red: '#ff4757',
  blue: '#3867d6',
  magenta: '#e056fd',
};

export function createParticlesForCells(
  cells: { row: number; col: number; color: CellColor }[],
  boardRect: DOMRect
): Particle[] {
  const cellSize = boardRect.width / 8;
  const particles: Particle[] = [];
  let pId = Date.now();

  cells.forEach((cell) => {
    const centerX = boardRect.left + cell.col * cellSize + cellSize / 2;
    const centerY = boardRect.top + cell.row * cellSize + cellSize / 2;
    const hex = COLOR_MAP[cell.color] || '#ffd32a';

    // 4 crisp particles per cell for maximum performance
    const count = 4;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const speed = 2.5 + Math.random() * 4;
      particles.push({
        id: ++pId,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 4 + Math.random() * 5,
        color: hex,
        alpha: 1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
      });
    }
  });

  return particles;
}

export const ParticleLayer: React.FC<{
  particlesRef: React.MutableRefObject<Particle[]>;
}> = ({ particlesRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const list = particlesRef.current;
      if (list.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animId = null;
        return; // Stop animation loop when idle to eliminate 60fps GPU idle burn
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.97;
        p.rotation += p.vRot;
        p.alpha -= 0.035; // clean fast fade

        if (p.alpha <= 0) {
          list.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        // Draw crisp diamond/square without expensive shadowBlur
        const s = p.size;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    // Check periodically if particles were added to restart render loop
    const checkInterval = setInterval(() => {
      if (particlesRef.current.length > 0 && animId === null) {
        animId = requestAnimationFrame(render);
      }
    }, 50);

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      clearInterval(checkInterval);
      window.removeEventListener('resize', resize);
    };
  }, [particlesRef]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
};
