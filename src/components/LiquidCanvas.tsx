import React, { useEffect, useRef } from 'react';

export const LiquidCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Liquid organic blobs configuration
    const blobs = [
      {
        x: width * 0.25,
        y: height * 0.35,
        radius: Math.min(width, height) * 0.35,
        color1: 'rgba(139, 92, 246, 0.25)', // electric violet
        color2: 'rgba(236, 72, 153, 0.15)', // magenta
        speed: 0.0008,
        angle: 0,
        vx: 0.4,
        vy: 0.3,
      },
      {
        x: width * 0.75,
        y: height * 0.45,
        radius: Math.min(width, height) * 0.38,
        color1: 'rgba(56, 189, 248, 0.22)', // neon blue
        color2: 'rgba(124, 58, 237, 0.18)', // purple
        speed: 0.0006,
        angle: Math.PI / 3,
        vx: -0.3,
        vy: 0.4,
      },
      {
        x: width * 0.5,
        y: height * 0.75,
        radius: Math.min(width, height) * 0.42,
        color1: 'rgba(192, 38, 211, 0.20)', // fuchsia
        color2: 'rgba(14, 165, 233, 0.12)', // sky blue
        speed: 0.0007,
        angle: Math.PI,
        vx: 0.2,
        vy: -0.3,
      },
      {
        x: width * 0.85,
        y: height * 0.2,
        radius: Math.min(width, height) * 0.25,
        color1: 'rgba(168, 85, 247, 0.18)', // violet glow
        color2: 'rgba(244, 63, 94, 0.10)', // rose
        speed: 0.001,
        angle: Math.PI * 1.5,
        vx: -0.2,
        vy: 0.2,
      },
    ];

    let t = 0;

    const render = () => {
      t += 0.015;

      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Dark background fill
      ctx.fillStyle = '#050507';
      ctx.fillRect(0, 0, width, height);

      // Render organic glowing liquid blobs
      blobs.forEach((blob, i) => {
        const oscillationX = Math.sin(t * blob.speed * 80 + i) * 60;
        const oscillationY = Math.cos(t * blob.speed * 60 + i) * 60;

        const currentX = blob.x + oscillationX + (mouseX - width / 2) * 0.04 * (i + 1);
        const currentY = blob.y + oscillationY + (mouseY - height / 2) * 0.04 * (i + 1);

        const gradient = ctx.createRadialGradient(
          currentX,
          currentY,
          blob.radius * 0.1,
          currentX,
          currentY,
          blob.radius
        );

        gradient.addColorStop(0, blob.color1);
        gradient.addColorStop(0.5, blob.color2);
        gradient.addColorStop(1, 'rgba(5, 5, 7, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(currentX, currentY, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render flowing 3D liquid glass curves / ribbon reflections
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      for (let r = 0; r < 2; r++) {
        ctx.beginPath();
        const ribbonY = height * (0.35 + r * 0.3) + Math.sin(t * 0.8 + r) * 40;
        ctx.moveTo(0, ribbonY);

        for (let x = 0; x <= width; x += 40) {
          const wave1 = Math.sin(x * 0.002 + t * 0.9 + r) * 50;
          const wave2 = Math.cos(x * 0.004 - t * 0.5) * 30;
          const y = ribbonY + wave1 + wave2;
          ctx.lineTo(x, y);
        }

        ctx.lineWidth = 1.5;
        const ribbonGrad = ctx.createLinearGradient(0, 0, width, 0);
        ribbonGrad.addColorStop(0, 'rgba(139, 92, 246, 0)');
        ribbonGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.15)');
        ribbonGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.20)');
        ribbonGrad.addColorStop(0.8, 'rgba(236, 72, 153, 0.12)');
        ribbonGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');

        ctx.strokeStyle = ribbonGrad;
        ctx.stroke();
      }

      ctx.restore();

      // Subtle atmospheric noise / vignette overlay
      ctx.fillStyle = 'rgba(5, 5, 7, 0.12)';
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{ opacity: 0.95 }}
    />
  );
};
