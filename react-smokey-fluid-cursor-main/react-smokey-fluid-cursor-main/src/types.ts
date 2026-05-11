export type GL = WebGLRenderingContext | WebGL2RenderingContext;

export type Uniforms = Record<string, WebGLUniformLocation>;

export interface GLFormat {
  internalFormat: number;
  format: number;
}

export interface GLExtInfo {
  /** Supported RGBA floating-point texture format */
  formatRGBA: GLFormat | null;

  /** Supported RG (two-channel) texture format (WebGL2 only) */
  formatRG: GLFormat | null;

  /** Supported R (single-channel) texture format (WebGL2 only) */
  formatR: GLFormat | null;

  /** GL constant for HALF_FLOAT type (e.g., gl.HALF_FLOAT_OES) */
  halfFloatTexType: number;

  /** Whether linear filtering (smooth interpolation) for float textures is available */
  supportLinearFiltering: boolean;

  /** True if running on WebGL2 (vs WebGL1 + extensions) */
  isWebGL2: boolean;
}

export interface FBO {
  /** GPU texture attached to the framebuffer */
  texture: WebGLTexture | null;

  /** The framebuffer object itself */
  fbo: WebGLFramebuffer | null;

  /** Width of the texture in pixels */
  width: number;

  /** Height of the texture in pixels */
  height: number;

  /** Normalized texel size (1 / width) */
  texelSizeX: number;

  /** Normalized texel size (1 / height) */
  texelSizeY: number;

  attach(id: number): number;
}
export interface DoubleFBO {
  /** Buffer width in pixels */
  width: number;

  /** Buffer height in pixels */
  height: number;

  /** Normalized texel size (1 / width) */
  texelSizeX: number;

  /** Normalized texel size (1 / height) */
  texelSizeY: number;

  /** Framebuffer currently used for reading */
  read: FBO;

  /** Framebuffer currently used for writing */
  write: FBO;

  /** Swaps read/write buffers for next iteration */
  swap(): void;
}

export interface ISmokeyFluidConfig {
  /** Simulation grid resolution for velocity/pressure fields (lower = faster but coarser) */
  simResolution: number;

  /** Visual color/dye buffer resolution (affects rendering detail) */
  dyeResolution: number;

  /** Resolution used for high-quality screenshots or recording */
  captureResolution: number;

  /** Rate at which color fades from the fluid (higher = faster fade) */
  densityDissipation: number;

  /** Rate at which velocity energy dissipates (higher = faster slowdown) */
  velocityDissipation: number;

  /** Initial pressure clear multiplier (affects stability of solver) */
  pressure: number;

  /** Number of Jacobi iterations when solving pressure (higher = more accurate but slower) */
  pressureIteration: number;

  /** Strength of vorticity confinement (adds swirling, curl-like motion) */
  curl: number;

  /** Base normalized radius of user splats (0–1 range relative to screen size) */
  splatRadius: number;

  /** Force multiplier applied when user interacts (e.g., mouse/touch input) */
  splatForce: number;

  /** Enable or disable lighting/shading effects for visual depth */
  shading: boolean;

  /** Speed at which the dynamic color palette rotates during simulation */
  colorUpdateSpeed: number;

  /** Multiplier for emitted fluid light intensity */
  brightness: number;

  /** If true, pauses the main simulation loop (used for debugging or static rendering) */
  paused: boolean;

  /**
   * Canvas background color (can be in 0–1 normalized range or 0–255)
   * Example: `{ r: 0, g: 0, b: 0 }` for black.
   */
  backColor: { r: number; g: number; b: number };

  /**
   * Determines whether the canvas should preserve alpha transparency.
   * If `true`, blending with HTML backgrounds is allowed.
   */
  transparent: boolean;

  /**
   * ID assigned to the canvas element.
   * Default is "smokey-fluid-canvas".
   */
  id: string;
}
