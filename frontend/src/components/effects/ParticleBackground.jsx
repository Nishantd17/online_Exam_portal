import { useId, useCallback, useState, useEffect, useMemo } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const ParticleBackground = ({ className = '' }) => {
  const id = useId();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Only check screen size on mount to determine mobile mode
    // Ignoring dynamic resize listeners prevents keyboard popups from altering the state
    setIsMobile(window.innerWidth < 768);
  }, []);

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const options = useMemo(() => {
    return {
      fpsLimit: 60,
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: isMobile ? 25 : 55, density: { enable: true } },
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
          distance: isMobile ? 100 : 140,
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
          onHover: { enable: !isMobile, mode: 'grab' },
          onClick: { enable: true, mode: 'push' },
          resize: !isMobile // Ignore window resize on mobile to prevent virtual keyboard crashes
        },
        modes: {
          grab: { distance: 160, links: { opacity: 0.5 } },
          push: { quantity: 3 },
          repulse: { distance: 100 }
        }
      },
      detectRetina: !isMobile // Turn off retina scaling on mobile to save GPU memory
    };
  }, [isMobile]);

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
