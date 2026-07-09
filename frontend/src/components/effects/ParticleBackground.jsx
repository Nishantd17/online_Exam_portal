import { useId, useCallback } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const particlesOptions = {
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

const ParticleBackground = ({ className = '' }) => {
  const id = useId();

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <ParticlesProvider init={particlesInit}>
      <Particles
        id={id}
        className={`absolute inset-0 z-0 ${className}`}
        options={particlesOptions}
      />
    </ParticlesProvider>
  );
};

export default ParticleBackground;
