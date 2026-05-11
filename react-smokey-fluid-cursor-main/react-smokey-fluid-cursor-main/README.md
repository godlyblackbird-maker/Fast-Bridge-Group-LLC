<h1 align="center">💨 React Smokey Fluid Cursor</h1>

<p align="center">
A beautiful, interactive fluid simulation that creates stunning visual effects following your cursor movements for your React and Next.js application on web. Built with WebGL for high-performance real-time fluid dynamics.
</p>

![npm version](https://img.shields.io/npm/v/react-smokey-fluid-cursor.svg)
![package size minified](https://img.shields.io/bundlephobia/min/react-smokey-fluid-cursor?style=plastic)
[![Badge](https://data.jsdelivr.com/v1/package/npm/react-smokey-fluid-cursor/badge)](https://www.jsdelivr.com/package/npm/react-smokey-fluid-cursor)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

![total downloads](https://img.shields.io/npm/dt/react-smokey-fluid-cursor.svg)
![total downloads per year](https://img.shields.io/npm/dy/react-smokey-fluid-cursor.svg)
![total downloads per week](https://img.shields.io/npm/dw/react-smokey-fluid-cursor.svg)
![total downloads per month](https://img.shields.io/npm/dm/react-smokey-fluid-cursor.svg)
![download-image](https://img.shields.io/npm/dm/react-smokey-fluid-cursor.svg)

[![react-smokey-fluid-cursor](https://nodei.co/npm/react-smokey-fluid-cursor.png)](https://npmjs.org/package/react-smokey-fluid-cursor)

---

## 📦 Installation

```bash
npm i react-smokey-fluid-cursor

yarn add react-smokey-fluid-cursor

pnpm i react-smokey-fluid-cursor

bun add react-smokey-fluid-cursor
```

---

## 📸 Demo

Checkout demo here: [Demo](https://react-smokey-fluid-cursor.vercel.app/)

Also see more details in [Example](https://github.com/faraasat/react-smokey-fluid-cursor/tree/main/example):

![Demo](https://github.com/faraasat/react-smokey-fluid-cursor/blob/main/images/demo.gif)

---

## 🚀 Quick Start

### **React (CRA)**

```tsx
// src/App.tsx|jsx
import React from "react";

import { SmokeyFluidCursor } from "react-smokey-fluid-cursor";

function App() {
  return (
    <div className="App">
      {/* Place observer once globally */}
      <SmokeyFluidCursor />
    </div>
  );
}
```

### **Vite + React**

```tsx
// src/main.tsx|jsx
import React from "react";

import { SmokeyFluidCursor } from "react-smokey-fluid-cursor";

function Main() {
  return (
    <>
      <SmokeyFluidCursor />
    </>
  );
}

export default Main;
```

### **Next.js Pages Router**

```tsx
// pages/_app.tsx|jsx
import type { AppProps } from "next/app";

import { SmokeyFluidCursor } from "react-smokey-fluid-cursor";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Global ad observer */}
      <SmokeyFluidCursor />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
```

### **Next.js (App Router)**

```tsx
// app/layout.tsx|jsx
import "./globals.css";

import { SmokeyFluidCursor } from "react-smokey-fluid-cursor";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SmokeyFluidCursor />
        {children}
      </body>
    </html>
  );
}
```

---

## ⚙️ Configuration Options

Customize the fluid simulation with these configuration options:

| Property              | Default Value                 | Description                                    |
| --------------------- | ----------------------------- | ---------------------------------------------- |
| `id`                  | `"react-smokey-fluid-cursor"` | Canvas element ID                              |
| `simResolution`       | `128`                         | Simulation resolution (higher = more detailed) |
| `dyeResolution`       | `512`                         | Dye/color resolution                           |
| `densityDissipation`  | `0.98`                        | How quickly colors fade (0–1)                  |
| `velocityDissipation` | `0.98`                        | How quickly movement slows down                |
| `pressureIteration`   | `10`                          | Pressure solver iterations                     |
| `curl`                | `30`                          | Vorticity/swirl intensity                      |
| `splatRadius`         | `0.25`                        | Size of cursor splats                          |
| `splatForce`          | `6000`                        | Force of cursor movements                      |
| `shading`             | `true`                        | Enable 3D lighting effects                     |
| `colorUpdateSpeed`    | `0.5`                         | Speed of color transitions                     |
| `transparent`         | `false`                       | Transparent background                         |

---

## 🌟 Features

- **Real-time Fluid Dynamics**: Physics-based simulation using Navier-Stokes equations
- **WebGL Accelerated**: High-performance rendering for smooth 60fps
- **Interactive**: Responds to mouse and touch movements
- **Customizable**: Extensive configuration options
- **Mobile Support**: Touch-optimized interactions
- **Auto-scaling**: Adapts to screen size and pixel ratio
- **Color Cycling**: Dynamic, evolving color palettes
- **3D Lighting**: Optional shading for depth perception

---

## 🎯 Use Cases

- **Website Backgrounds**: Immersive animated backgrounds
- **Cursor Effects**: Enhanced user interaction feedback
- **Data Visualization**: Fluid-based data representations
- **Art Installations**: Digital art and creative coding
- **Game Effects**: Atmospheric and UI effects
- **Product Demos**: Eye-catching technology showcases

---

## 🧑‍💻 Author

Built and maintained by [**Farasat Ali**](https://www.farasat.me)

- Website: [www.farasat.me](https://www.farasat.me)
- LinkedIn: [linkedin.com/in/faraasat](https://linkedin.com/in/faraasat)
- GitHub: [github.com/faraasat](https://github.com/faraasat)
