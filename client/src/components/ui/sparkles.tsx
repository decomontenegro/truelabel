"use client";
import React, { useId, useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { Container, Engine } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

interface SparklesCoreProps {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
}

export const SparklesCore: React.FC<SparklesCoreProps> = ({
  id,
  className,
  background = "#0d47a1",
  minSize = 1,
  maxSize = 3,
  speed = 4,
  particleColor = "#ffffff",
  particleDensity = 120,
}) => {
  const [init, setInit] = useState(false);
  const generatedId = useId();
  const particlesId = id || generatedId;

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log(container);
  };

  const options = useMemo(
    () => ({
      background: {
        color: {
          value: background,
        },
      },
      fullScreen: {
        enable: false,
        zIndex: 1,
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
          onHover: {
            enable: false,
            mode: "repulse",
          },
          resize: true,
        },
        modes: {
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: particleColor,
        },
        links: {
          enable: false,
        },
        move: {
          direction: "none" as const,
          enable: true,
          outModes: {
            default: "out" as const,
          },
          random: true,
          speed: speed,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: particleDensity,
        },
        opacity: {
          value: 1,
          animation: {
            enable: true,
            speed: 1,
            minimumValue: 0,
            sync: false,
          },
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: minSize, max: maxSize },
          animation: {
            enable: true,
            speed: 5,
            minimumValue: 0.1,
            sync: false,
          },
        },
      },
      detectRetina: true,
    }),
    [background, particleColor, speed, particleDensity, minSize, maxSize]
  );

  if (!init) {
    return null;
  }

  return (
    <Particles
      id={particlesId}
      className={className}
      particlesLoaded={particlesLoaded}
      options={options}
    />
  );
};
