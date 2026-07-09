import { useId, useCallback, useState, useEffect, useMemo } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const ParticleBackground = ({ className = '' }) => {
  const id = useId();
  const [isMobile, setIsMobile] = useState(false);
  const [height, setHeight] = useState('100%');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (mobile) {
      setHeight(`${window.innerHeight}px`);
    }
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
        number: { value: isMobile ? 22 : 55, density: { enable: true } },
        color: { value: ['#00f0ff', '#8b5cf6', '#06b6d4', '#ec4899'] },
        shape: { type: 'circle' },
        opacity: {
          value: { min: 0.2, max: 0.6 },
          animation: { enable: true, speed: 0.8, sync: false }
        },
        size: {
          value: isMobile ? { min: 1.2, max: 2.8 } : { min: 1.5, max: 3.5 },
          animation: { enable: true, speed: 2, sync: false }
        },
        links: {
          enable: true,
          distance: isMobile ? 110 : 140,
          color: '#00f0ff',
          opacity: 0.16,
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
          resize: !isMobile // Disable canvas resizing on mobile viewports to prevent virtual keyboard crashes
        },
        modes: {
          grab: { distance: 160, links: { opacity: 0.5 } },
          push: { quantity: 3 },
          repulse: { distance: 100 }
        }
      },
      detectRetina: !isMobile // Disable high-DPI retina rendering on mobile to save GPU memory
    };
  }, [isMobile]);

  if (!initialized) return null;

  return (
    <div 
      className={`absolute inset-0 z-0 overflow-hidden ${className}`} 
      style={{ height: isMobile ? height : '100%' }}
    >
      <ParticlesProvider init={particlesInit}>
        <Particles
          id={id}
          className="absolute inset-0 w-full h-full"
          options={options}
        />
      </ParticlesProvider>
    </div>
  );
};

export default ParticleBackground;
