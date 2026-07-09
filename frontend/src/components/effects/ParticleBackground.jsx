import { useId, useCallback, useState, useEffect, useMemo } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const ParticleBackground = ({ className = '' }) => {
  const id = useId();
  const [isMobile, setIsMobile] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    setInitialized(true);
  }, []);

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const options = useMemo(() => {
    return {
      fpsLimit: 60,
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 55, density: { enable: true } },
        color: { value: ['#00f0ff', '#8b5cf6', '#06b6d4', '#ec4899'] },
        shape: { type: 'circle' },
        opacity: {
          value: { min: 0.2, max: 0.6 },
          animation: { enable: true, speed: 0.8, sync: false }
        },
        size: {
          value: { min: 1.5, max: 3.5 },
          animation: { enable: true, speed: 2, sync: false }
        },
        links: {
          enable: true,
          distance: 140,
          color: '#00f0ff',
          opacity: 0.18,
          width: 1,
          triangles: { enable: false }
        },
        move: {
          enable: true,
          speed: 0.8,
          direction: 'none',
          random: true,
          straight: false,
          outModes: { default: 'bounce' }
        }
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onHover: { enable: true, mode: 'grab' },
          onClick: { enable: true, mode: 'push' },
          resize: true
        },
        modes: {
          grab: { distance: 160, links: { opacity: 0.5 } },
          push: { quantity: 3 },
          repulse: { distance: 100 }
        }
      },
      detectRetina: true
    };
  }, []);

  if (!initialized) return null;

  if (isMobile) {
    return (
      <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none ${className}`}>
        <style>{`
          @keyframes floatMobile {
            0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
            33% { transform: translate(30px, -50px) scale(1.1); opacity: 0.6; }
            66% { transform: translate(-20px, -80px) scale(0.9); opacity: 0.4; }
            100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          }
        `}</style>
        {[...Array(15)].map((_, i) => {
          const size = Math.random() * 3 + 2; // 2px to 5px
          const delay = Math.random() * -20;
          const duration = Math.random() * 20 + 20; // 20s to 40s
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const colors = ['#00f0ff', '#8b5cf6', '#06b6d4', '#ec4899'];
          const color = colors[i % colors.length];

          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}, 0 0 16px ${color}`,
                left: `${left}%`,
                top: `${top}%`,
                animation: `floatMobile ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <ParticlesProvider init={particlesInit}>
      <Particles
        id={id}
        className={`absolute inset-0 z-0 ${className}`}
        options={options}
      />
    </ParticlesProvider>
  );
};

export default ParticleBackground;
