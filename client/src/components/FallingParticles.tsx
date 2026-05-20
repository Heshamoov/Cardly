import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  opacity: number;
  symbol: string;
  type: "flower" | "star";
  wobble: number;
  wobbleSpeed: number;
  wobbleOffset: number;
}

const FLOWERS = ["🌸", "🌺", "🌼", "🌹", "💮", "🏵️"];
const STARS = ["✨", "⭐", "💫", "🌟"];

function createParticle(canvasWidth: number): Particle {
  const isFlower = Math.random() > 0.35;
  const symbols = isFlower ? FLOWERS : STARS;
  return {
    x: Math.random() * canvasWidth,
    y: -40,
    vx: (Math.random() - 0.5) * 0.6,
    vy: 0.4 + Math.random() * 0.8,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 1.5,
    size: isFlower ? 14 + Math.random() * 10 : 10 + Math.random() * 8,
    opacity: 0.55 + Math.random() * 0.45,
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    type: isFlower ? "flower" : "star",
    wobble: 0,
    wobbleSpeed: 0.02 + Math.random() * 0.02,
    wobbleOffset: Math.random() * Math.PI * 2,
  };
}

interface FallingParticlesProps {
  /** Maximum particles alive at once. Default 28. */
  maxParticles?: number;
  /** Spawn rate: new particles per frame. Default 0.15. */
  spawnRate?: number;
}

export default function FallingParticles({ maxParticles = 28, spawnRate = 0.15 }: FallingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas to parent container size
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    let frame = 0;

    const tick = () => {
      animRef.current = requestAnimationFrame(tick);
      frame++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles
      if (particlesRef.current.length < maxParticles && Math.random() < spawnRate) {
        particlesRef.current.push(createParticle(canvas.width));
      }

      // Update & draw
      particlesRef.current = particlesRef.current.filter((p) => {
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble + p.wobbleOffset) * 0.4;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade out near bottom
        const fadeStart = canvas.height * 0.8;
        if (p.y > fadeStart) {
          p.opacity = Math.max(0, p.opacity - 0.015);
        }

        if (p.y > canvas.height + 20 || p.opacity <= 0) return false;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();

        return true;
      });
    };

    tick();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [maxParticles, spawnRate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
}
