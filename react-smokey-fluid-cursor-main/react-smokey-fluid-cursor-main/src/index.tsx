import React from "react";

import { initFluid } from "./smokey-fluid-cursor";

import { ISmokeyFluidConfig } from "./types";

const defaultConfig = {
  simResolution: 128,
  dyeResolution: 1440,
  captureResolution: 512,
  densityDissipation: 3.5,
  velocityDissipation: 2,
  pressure: 0.1,
  pressureIteration: 20,
  curl: 10,
  splatRadius: 0.5,
  splatForce: 6000,
  shading: true,
  colorUpdateSpeed: 10,
  paused: false,
  backColor: { r: 0, g: 0, b: 0 },
  transparent: true,
  id: "smokey-fluid-canvas",
};

const SmokeyFluidCursor: React.FC<{ config?: Partial<ISmokeyFluidConfig> }> = ({
  config: incomingConfig,
}) => {
  // Merge incoming config with defaults
  const config: ISmokeyFluidConfig = { ...defaultConfig, ...incomingConfig };

  React.useEffect(() => {
    if (document) {
      const style = document.createElement("style");

      style.textContent = `
        #${config.id} {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -9999;
        }
      `;

      document.head.appendChild(style);

      initFluid(config);
    }
  }, []);

  return <canvas id={config.id}></canvas>;
};

export { SmokeyFluidCursor };
