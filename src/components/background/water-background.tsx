"use client";

import { useEffect, useRef } from "react";

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentShaderSource = `
precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform vec2 u_velocity;
uniform float u_time;
uniform float u_activity;
uniform float u_scroll;
uniform float u_ambient;
uniform float u_theme;
uniform float u_enso_strength;
const int ENSO_TRAIL_COUNT = 16;
const int ENSO_RIPPLE_COUNT = 4;
uniform vec4 u_enso_trail[ENSO_TRAIL_COUNT];
uniform vec4 u_enso_ripples[ENSO_RIPPLE_COUNT];
uniform vec4 u_ripple_a;
uniform vec4 u_ripple_b;
uniform vec4 u_ripple_c;

float directionalWave(vec2 p, vec2 dir, float frequency, float speed, float amplitude, float t) {
  return sin(dot(p, normalize(dir)) * frequency + t * speed) * amplitude;
}

float ambientRipple(vec2 p, vec4 ripple, float t) {
  if (ripple.w <= 0.001) return 0.0;
  float age = t - ripple.z;
  if (age <= 0.0) return 0.0;

  vec2 delta = p - ripple.xy;
  float distanceToOrigin = length(delta);
  float front = age * mix(0.165, 0.205, ripple.w);
  float mainBand = exp(-pow(distanceToOrigin - front, 2.0) * 15.0);
  float trailOne = exp(-pow(distanceToOrigin - (front - 0.15), 2.0) * 13.5) * 0.58;
  float trailTwo = exp(-pow(distanceToOrigin - (front - 0.31), 2.0) * 11.5) * 0.34;
  float trailThree = exp(-pow(distanceToOrigin - (front - 0.48), 2.0) * 9.5) * 0.18;
  float wave = sin(distanceToOrigin * 24.0 - age * 5.0);
  float decay = exp(-age * mix(0.085, 0.070, ripple.w));
  return wave * (mainBand + trailOne + trailTwo + trailThree) * ripple.w * decay;
}

float pointerRipple(vec2 p, vec2 pointerWorld, float influence, float velocityStrength, float t) {
  float d = length(p - pointerWorld);
  float inner = sin(d * 28.0 - t * 3.8) * 0.010;
  float outer = sin(d * 17.0 - t * 2.6) * 0.005;
  return (inner + outer) * influence * (0.45 + velocityStrength * 0.9);
}

vec3 ensoWakeField(vec2 p, float t) {
  float disturbance = 0.0;
  vec2 gradient = vec2(0.0);

  for (int index = 0; index < ENSO_TRAIL_COUNT; index++) {
    vec4 sample = u_enso_trail[index];
    float age = t - sample.z;
    if (age > 0.0 && age < 8.4 && sample.w > 0.0) {
      vec2 delta = p - sample.xy;
      float distanceToWake = length(delta);
      float width = sample.w * (1.0 + age * 0.045);
      float body = exp(-pow(distanceToWake / width, 2.0) * 1.65);
      float edge = sin(distanceToWake * 54.0 - age * 4.1 + float(index) * 0.43);
      float arrival = smoothstep(0.10, 0.34, age);
      float decay = exp(-max(age - 3.25, 0.0) * 0.62);
      float shape = 0.64 + edge * 0.36;
      float amplitude = arrival * decay * 0.0150;
      disturbance += body * shape * amplitude;
      if (distanceToWake > 0.0001) {
        float bodySlope = body * (-3.3 * distanceToWake / (width * width));
        float shapeSlope = cos(distanceToWake * 54.0 - age * 4.1 + float(index) * 0.43) * 19.44;
        gradient += normalize(delta) * (bodySlope * shape + body * shapeSlope) * amplitude;
      }
    }
  }

  for (int index = 0; index < ENSO_RIPPLE_COUNT; index++) {
    vec4 ripple = u_enso_ripples[index];
    float age = t - ripple.z;
    if (age > 0.0 && age < 6.2 && ripple.w > 0.0) {
      vec2 delta = p - ripple.xy;
      float distanceToOrigin = length(delta);
      float front = age * 0.080;
      float primary = exp(-pow(distanceToOrigin - front, 2.0) * 360.0);
      float follower = exp(-pow(distanceToOrigin - (front - 0.070), 2.0) * 290.0) * 0.46;
      float wave = sin(distanceToOrigin * 49.0 - age * 4.4);
      float amplitude = ripple.w * exp(-age * 0.48);
      float bands = primary + follower;
      disturbance += wave * bands * amplitude;
      if (distanceToOrigin > 0.0001) {
        float primarySlope = primary * -720.0 * (distanceToOrigin - front);
        float followerSlope = follower * -580.0 * (distanceToOrigin - (front - 0.070));
        float waveSlope = cos(distanceToOrigin * 49.0 - age * 4.4) * 49.0;
        gradient += normalize(delta) * (waveSlope * bands + wave * (primarySlope + followerSlope)) * amplitude;
      }
    }
  }

  return vec3(disturbance, gradient) * u_enso_strength;
}

float baseSurfaceHeight(vec2 p, vec2 pointerWorld, float influence, float velocityStrength, float t) {
  float height = directionalWave(p, vec2(0.98, 0.14), 3.7, 0.25, 0.082, t);
  height += directionalWave(p, vec2(-0.66, 0.75), 5.2, -0.21, 0.050, t);
  height += directionalWave(p, vec2(0.18, 0.98), 6.8, 0.17, 0.031, t);
  height += directionalWave(p, vec2(-0.90, -0.22), 2.4, 0.13, 0.028, t);
  height += sin(p.x * 1.7 + p.y * 2.5 + t * 0.14) * 0.016;
  height += ambientRipple(p, u_ripple_a, t);
  height += ambientRipple(p, u_ripple_b, t);
  height += ambientRipple(p, u_ripple_c, t);
  height += pointerRipple(p, pointerWorld, influence, velocityStrength, t);
  return height;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 delta = (uv - u_pointer) * aspect;
  float distanceFromPointer = length(delta);
  float influence = exp(-distanceFromPointer * distanceFromPointer * 7.5) * u_activity;
  vec2 direction = normalize(delta + vec2(0.0001));
  float velocityStrength = min(length(u_velocity) * 30.0, 1.0);
  vec2 velocityDirection = normalize(u_velocity * vec2(1.0, -1.0) + vec2(0.0001));
  vec2 world = vec2(uv.x * aspect.x, uv.y - u_scroll * 0.00036);
  vec2 pointerWorld = vec2(u_pointer.x * aspect.x, u_pointer.y - u_scroll * 0.00036);

  float baseHeight = baseSurfaceHeight(world, pointerWorld, influence, velocityStrength, u_time);
  vec3 ensoField = ensoWakeField(world, u_time);
  float height = baseHeight + ensoField.x;
  float sampleOffset = 0.02;
  float heightX = baseSurfaceHeight(world + vec2(sampleOffset, 0.0), pointerWorld, influence, velocityStrength, u_time) - baseHeight;
  float heightY = baseSurfaceHeight(world + vec2(0.0, sampleOffset), pointerWorld, influence, velocityStrength, u_time) - baseHeight;
  vec2 normal = vec2(heightX, heightY) / sampleOffset + ensoField.yz;

  vec2 broadFlow = vec2(
    directionalWave(world, vec2(0.72, 0.22), 2.2, 0.13, 1.0, u_time),
    directionalWave(world, vec2(-0.36, 0.92), 2.0, -0.11, 1.0, u_time)
  ) * (0.0105 * u_ambient);
  vec2 pointerFlow = velocityDirection * influence * (0.026 + velocityStrength * 0.072);
  vec2 localRippleFlow = direction * influence * sin(distanceFromPointer * 18.0 - u_time * 3.4) * 0.013;
  vec2 refracted = world + broadFlow - normal * (0.112 * u_ambient) + pointerFlow + localRippleFlow;
  float refractedHeight = baseSurfaceHeight(refracted, pointerWorld, influence, velocityStrength, u_time);
  float lightField = directionalWave(refracted, vec2(0.84, 0.16), 3.2, 0.17, 0.95, u_time);
  lightField += directionalWave(refracted, vec2(-0.44, 0.90), 4.8, -0.13, 0.58, u_time);
  lightField += directionalWave(refracted, vec2(0.22, 0.98), 7.9, 0.10, 0.30, u_time);
  float caustic = sin(refracted.x * 7.8 + refractedHeight * 9.0 - u_time * 0.52);
  caustic *= sin(refracted.y * 6.1 - refractedHeight * 8.0 + u_time * 0.41);
  float shade = 0.5 + lightField * 0.31 + refractedHeight * 1.82 + caustic * 0.12 * u_ambient;
  vec3 oceanDeep = vec3(0.090, 0.090, 0.325);
  vec3 oceanBase = vec3(0.110, 0.110, 0.384);
  vec3 oceanSoft = vec3(0.133, 0.133, 0.424);
  vec3 oceanPale = vec3(0.310, 0.310, 0.690);
vec3 goldShadowDeep = vec3(0.745, 0.535, 0.220); 
vec3 goldShadow     = vec3(0.835, 0.635, 0.290); 
vec3 goldAmber      = vec3(0.902, 0.718, 0.365); 
  vec3 goldBase = vec3(0.925, 0.729, 0.337);
  vec3 goldBright = vec3(0.984, 0.841, 0.509);
  vec3 goldChampagne = vec3(1.000, 0.916, 0.686);
  vec3 goldHighlight = vec3(1.000, 0.964, 0.818);
  vec3 goldGlint = vec3(1.000, 0.988, 0.929);
  vec3 deep = mix(oceanDeep, goldShadowDeep, u_theme);
  vec3 base = mix(oceanBase, goldShadow, u_theme);
  vec3 soft = mix(oceanSoft, goldBase, u_theme);
  vec3 pale = mix(oceanPale, goldChampagne, u_theme);
  float body = smoothstep(0.16, 0.76, shade);
  float bright = smoothstep(0.58, 1.02, shade + dot(normal, vec2(-0.35, 0.7)) * 0.15);
  vec3 color = mix(deep, base, body);
  color = mix(color, soft, smoothstep(0.42, 0.92, shade) * 0.68);
  color = mix(color, pale, bright * 0.52);
  float goldShade = shade * 0.82 + 0.22 + height * 0.86 + refractedHeight * 0.64;
  float contour = abs(sin((refractedHeight + height) * 30.0 + lightField * 3.0));
  float ridge = smoothstep(0.42, 0.76, goldShade + dot(normal, vec2(-0.45, 0.72)) * 0.30);
  float causticLine = smoothstep(0.46, 0.86, abs(caustic) + contour * 0.38 + ridge * 0.16);
  float sunEdge = smoothstep(0.68, 0.98, goldShade + lightField * 0.26 + causticLine * 0.24);
  float glint = pow(max(0.0, goldShade + caustic * 0.38 + dot(normal, vec2(-0.72, 0.82)) * 0.30 - 0.88), 5.0) * 18.0;
  float trough = smoothstep(-0.06, 0.28, goldShade);
  vec3 liquidGold = mix(goldShadowDeep, goldShadow, trough);
  liquidGold = mix(liquidGold, goldAmber, smoothstep(0.16, 0.44, goldShade));
  liquidGold = mix(liquidGold, goldBase, smoothstep(0.34, 0.66, goldShade + lightField * 0.12));
  liquidGold = mix(liquidGold, goldBright, ridge * 0.72);
  liquidGold = mix(liquidGold, goldChampagne, causticLine * 0.46 + sunEdge * 0.18);
  liquidGold = mix(liquidGold, goldHighlight, smoothstep(0.74, 1.02, goldShade + causticLine * 0.30) * 0.40);
  liquidGold += goldGlint * clamp(glint, 0.0, 0.22);
  liquidGold *= 0.96 + ridge * 0.20 + sunEdge * 0.10;
  liquidGold = pow(liquidGold, vec3(0.82));
  color = mix(color, liquidGold, u_theme);
  color += mix(vec3(0.010, 0.018, 0.026), goldChampagne * 0.055, u_theme) * smoothstep(0.52, 1.02, shade);
  color += influence * mix(vec3(0.016, 0.032, 0.040), goldBright * 0.062, u_theme) * (0.62 + velocityStrength * 0.72);
  color *= 0.93 + smoothstep(-0.08, 0.12, height) * 0.11;
  gl_FragColor = vec4(color, 1.0);
}`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function WaterBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
    if (!canvas) return;

    const setWaterRenderer = (mode: "active" | "fallback") => {
      document.body.dataset.waterRenderer = mode;
    };

    if (reducedMotion.matches) {
      setWaterRenderer("fallback");
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      setWaterRenderer("fallback");
      return;
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) {
      setWaterRenderer("fallback");
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWaterRenderer("fallback");
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWaterRenderer("fallback");
      return;
    }

    const buffer = gl.createBuffer();
    const position = gl.getAttribLocation(program, "a_position");
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const pointer = gl.getUniformLocation(program, "u_pointer");
    const velocity = gl.getUniformLocation(program, "u_velocity");
    const time = gl.getUniformLocation(program, "u_time");
    const activity = gl.getUniformLocation(program, "u_activity");
    const scroll = gl.getUniformLocation(program, "u_scroll");
    const ambient = gl.getUniformLocation(program, "u_ambient");
    const theme = gl.getUniformLocation(program, "u_theme");
    const ensoStrength = gl.getUniformLocation(program, "u_enso_strength");
    const ensoTrail = gl.getUniformLocation(program, "u_enso_trail[0]");
    const ensoRipples = gl.getUniformLocation(program, "u_enso_ripples[0]");
    const rippleA = gl.getUniformLocation(program, "u_ripple_a");
    const rippleB = gl.getUniformLocation(program, "u_ripple_b");
    const rippleC = gl.getUniformLocation(program, "u_ripple_c");
    if (!buffer || position < 0 || !resolution || !pointer || !velocity || !time || !activity || !scroll || !ambient || !theme || !ensoStrength || !ensoTrail || !ensoRipples || !rippleA || !rippleB || !rippleC) {
      setWaterRenderer("fallback");
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(program);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    canvas.dataset.active = "true";
    setWaterRenderer("active");

    const target = { x: 0.5, y: 0.5 };
    const current = { x: 0.5, y: 0.5 };
    const last = { x: 0.5, y: 0.5 };
    const speed = { x: 0, y: 0 };
    let energy = 0;
    let targetScroll = window.scrollY;
    let currentScroll = window.scrollY;
    let frame = 0;
    let resizeTimer = 0;
    let visible = document.visibilityState === "visible";
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowPowerDevice =
      (typeof deviceMemory === "number" && deviceMemory <= 4) ||
      navigator.hardwareConcurrency <= 4;
    const prefersTouchProfile = () => !finePointer.matches;
    const compactViewport = () => window.innerWidth < 768;
    const tabletViewport = () => window.innerWidth < 1100;
    const performanceProfile = () => lowPowerDevice || prefersTouchProfile() || compactViewport();
    const summitGoldTheme = () => document.body.dataset.waterTheme === "summit-gold";
    const ambientStrength = performanceProfile() ? 0.56 : 1.14;
    const rippleCount = performanceProfile() ? 2 : 3;
    const rippleLife = performanceProfile() ? 11.5 : 17.5;
    const rippleEvents = [
      { x: 0, y: 0, start: -1000, strength: 0, onScreen: 0 },
      { x: 0, y: 0, start: -1000, strength: 0, onScreen: 0 },
      { x: 0, y: 0, start: -1000, strength: 0, onScreen: 0 },
    ];
    const ensoTrailCount = performanceProfile() ? 10 : 16;
    const ensoRippleCount = performanceProfile() ? 2 : 4;
    const ensoTrailData = new Float32Array(16 * 4);
    const ensoRippleData = new Float32Array(4 * 4);
    let teamHero: HTMLElement | null = null;
    let teamHeroTop = 0;
    let teamHeroHeight = 0;
    let ensoCycleStart = -1;
    let ensoDrawDuration = 4.2;
    let ensoDissipationDuration = 4.9;
    let ensoPauseDuration = 2.0;
    let ensoSamplesEmitted = 0;
    let ensoRipplesEmitted = 0;
    let nextAmbientRippleAt = 1.2 + Math.random() * 2.4;
    let lastFrameTime = 0;

    const clearEnsoBuffers = () => {
      ensoTrailData.fill(0);
      ensoRippleData.fill(0);
      for (let index = 0; index < 16; index += 1) ensoTrailData[index * 4 + 2] = -1000;
      for (let index = 0; index < 4; index += 1) ensoRippleData[index * 4 + 2] = -1000;
      ensoSamplesEmitted = 0;
      ensoRipplesEmitted = 0;
    };

    const measureTeamHero = () => {
      if (!teamHero) {
        teamHeroTop = 0;
        teamHeroHeight = 0;
        return;
      }
      const rect = teamHero.getBoundingClientRect();
      teamHeroTop = rect.top + window.scrollY;
      teamHeroHeight = rect.height;
    };

    const syncTeamHero = () => {
      const nextHero = document.querySelector<HTMLElement>("[data-team-hero]");
      if (nextHero !== teamHero) {
        teamHero = nextHero;
        ensoCycleStart = -1;
        clearEnsoBuffers();
      }
      measureTeamHero();
    };

    const startEnsoCycle = (nowSeconds: number) => {
      clearEnsoBuffers();
      ensoCycleStart = nowSeconds;
      ensoDrawDuration = 3.9 + Math.random() * 0.65;
      ensoDissipationDuration = 4.5 + Math.random() * 0.9;
      ensoPauseDuration = 1.6 + Math.random() * 1.0;
    };

    const emitEnsoSample = (sampleIndex: number, birthTime: number) => {
      const viewportWidth = Math.max(window.innerWidth, 1);
      const viewportHeight = Math.max(window.innerHeight, 1);
      const aspectRatio = viewportWidth / viewportHeight;
      const isMobile = compactViewport();
      const isTablet = !isMobile && tabletViewport();
      const centerX = aspectRatio * (isMobile ? 0.78 : isTablet ? 0.76 : 0.74);
      const heroCenterViewport = (teamHeroTop + teamHeroHeight * (isMobile ? 0.43 : 0.50) - currentScroll) / viewportHeight;
      const centerY = 1 - heroCenterViewport - worldScroll();
      const progress = sampleIndex / Math.max(ensoTrailCount - 1, 1);
      const startAngle = -0.38;
      const sweep = Math.PI * 2 - 0.96;
      const angle = startAngle + sweep * progress;
      const baseRadius = isMobile ? Math.min(0.18, aspectRatio * 0.34) : isTablet ? 0.255 : Math.min(0.34, aspectRatio * 0.19);
      const irregularity = 1
        + Math.sin(angle * 3.0 + 0.7) * 0.040
        + Math.sin(angle * 7.0 - 0.4) * 0.018;
      const radius = baseRadius * irregularity;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * (0.96 + Math.sin(angle * 2.0) * 0.025);
      const width = (isMobile ? 0.072 : 0.086)
        * (0.86 + 0.17 * Math.sin(progress * 9.0 + 0.8) + 0.08 * progress);
      const offset = sampleIndex * 4;

      ensoTrailData[offset] = x;
      ensoTrailData[offset + 1] = y;
      ensoTrailData[offset + 2] = birthTime;
      ensoTrailData[offset + 3] = width;

      const nextRippleThreshold = Math.round(
        ((ensoRipplesEmitted + 1) * ensoTrailCount) / (ensoRippleCount + 1),
      );
      if (ensoRipplesEmitted < ensoRippleCount && sampleIndex >= nextRippleThreshold) {
        const rippleOffset = ensoRipplesEmitted * 4;
        ensoRippleData[rippleOffset] = x;
        ensoRippleData[rippleOffset + 1] = y;
        ensoRippleData[rippleOffset + 2] = birthTime + 0.16;
        ensoRippleData[rippleOffset + 3] = (isMobile ? 0.0030 : 0.0042)
          * (0.84 + 0.16 * Math.sin(sampleIndex * 1.7));
        ensoRipplesEmitted += 1;
      }
    };

    const syncEnsoUniforms = (nowSeconds: number) => {
      if (!teamHero || teamHeroHeight <= 0) {
        gl.uniform1f(ensoStrength, 0);
        return;
      }

      const heroTopInViewport = teamHeroTop - window.scrollY;
      const heroVisible = heroTopInViewport < window.innerHeight * 0.92
        && heroTopInViewport + teamHeroHeight > window.innerHeight * 0.08;
      if (!heroVisible) {
        gl.uniform1f(ensoStrength, 0);
        return;
      }

      if (ensoCycleStart < 0) startEnsoCycle(nowSeconds + 0.8);
      const cycleAge = nowSeconds - ensoCycleStart;
      const cycleLength = ensoDrawDuration + ensoDissipationDuration + ensoPauseDuration;
      if (cycleAge >= cycleLength) startEnsoCycle(nowSeconds);

      const drawAge = nowSeconds - ensoCycleStart;
      if (drawAge >= 0 && drawAge <= ensoDrawDuration) {
        const easedProgress = Math.max(0, Math.min(1, drawAge / ensoDrawDuration));
        const shapedProgress = easedProgress * easedProgress * (3 - 2 * easedProgress);
        const targetSamples = Math.min(
          ensoTrailCount,
          Math.floor(shapedProgress * (ensoTrailCount - 1)) + 1,
        );
        while (ensoSamplesEmitted < targetSamples) {
          const sampleProgress = ensoSamplesEmitted / Math.max(ensoTrailCount - 1, 1);
          emitEnsoSample(ensoSamplesEmitted, ensoCycleStart + sampleProgress * ensoDrawDuration);
          ensoSamplesEmitted += 1;
        }
      }

      const strength = (performanceProfile() ? 0.68 : 1.0) * (compactViewport() ? 0.72 : 1.0);
      gl.uniform1f(ensoStrength, strength);
      gl.uniform4fv(ensoTrail, ensoTrailData);
      gl.uniform4fv(ensoRipples, ensoRippleData);
    };

    clearEnsoBuffers();

    const syncRippleUniforms = () => {
      const first = rippleEvents[0];
      const second = rippleCount > 1 ? rippleEvents[1] : { x: 0, y: 0, start: -1000, strength: 0 };
      const third = rippleCount > 2 ? rippleEvents[2] : { x: 0, y: 0, start: -1000, strength: 0 };
      gl.uniform4f(rippleA, first.x, first.y, first.start, first.strength);
      gl.uniform4f(rippleB, second.x, second.y, second.start, second.strength);
      gl.uniform4f(rippleC, third.x, third.y, third.start, third.strength);
    };

    const worldScroll = () => currentScroll * 0.00036;

    const spawnAmbientRipple = (nowSeconds: number) => {
      const slot = rippleEvents.findIndex((event, index) => index < rippleCount && event.strength <= 0.001);
      if (slot === -1) return;

      const aspectRatio = window.innerWidth / Math.max(window.innerHeight, 1);
      const scrollOffset = worldScroll();
      const activeOnScreenCount = rippleEvents.reduce((count, event, index) => {
        if (index >= rippleCount) return count;
        return count + (event.strength > 0.001 && event.onScreen > 0.5 ? 1 : 0);
      }, 0);
      const allowOnScreen = activeOnScreenCount < (lowPowerDevice ? 1 : 3);
      const onScreenChance = allowOnScreen
        ? summitGoldTheme()
          ? (lowPowerDevice ? 0.64 : 0.78)
          : (lowPowerDevice ? 0.42 : 0.54)
        : 0.0;
      const spawnOnScreen = Math.random() < onScreenChance;
      const strengthMultiplier = summitGoldTheme() ? 1.85 : 1;
      const strength = spawnOnScreen
        ? ((lowPowerDevice ? 0.022 : 0.029) + Math.random() * (lowPowerDevice ? 0.006 : 0.010)) * strengthMultiplier
        : ((lowPowerDevice ? 0.017 : 0.022) + Math.random() * (lowPowerDevice ? 0.005 : 0.007)) * strengthMultiplier;
      let x = 0;
      let y = 0;

      if (spawnOnScreen) {
        const zone = Math.floor(Math.random() * 9);
        const xRatio = [0.24, 0.36, 0.68, 0.78, 0.50, 0.56, 0.44, 0.18, 0.84][zone] + (Math.random() - 0.5) * 0.16;
        const yRatio = [0.30, 0.52, 0.46, 0.70, 0.26, 0.82, 0.58, 0.50, 0.18][zone] + (Math.random() - 0.5) * 0.18;
        x = aspectRatio * Math.min(0.92, Math.max(0.08, xRatio));
        y = scrollOffset + Math.min(0.92, Math.max(0.08, yRatio));
      } else {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) {
          x = -0.42 * aspectRatio;
          y = scrollOffset + 0.08 + Math.random() * 0.84;
        } else if (edge === 1) {
          x = aspectRatio * 1.42;
          y = scrollOffset + 0.08 + Math.random() * 0.84;
        } else if (edge === 2) {
          x = aspectRatio * (0.08 + Math.random() * 0.84);
          y = scrollOffset - 0.34;
        } else {
          x = aspectRatio * (0.08 + Math.random() * 0.84);
          y = scrollOffset + 1.34;
        }
      }

      rippleEvents[slot] = { x, y, start: nowSeconds, strength, onScreen: spawnOnScreen ? 1 : 0 };
    };

    const resize = () => {
      const renderScale = compactViewport()
        ? 0.32
        : tabletViewport()
          ? 0.42
          : window.innerWidth > 1600
            ? 0.55
            : 0.65;
      const pixelRatioCap = compactViewport() ? 1 : tabletViewport() ? 1.1 : 1.25;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, pixelRatioCap);
      const width = Math.max(1, Math.round(window.innerWidth * renderScale * pixelRatio));
      const height = Math.max(1, Math.round(window.innerHeight * renderScale * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        measureTeamHero();
        ensoCycleStart = -1;
        clearEnsoBuffers();
      }, 140);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches) return;
      target.x = event.clientX / window.innerWidth;
      target.y = 1 - event.clientY / window.innerHeight;
      const dx = target.x - last.x;
      const dy = target.y - last.y;
      speed.x = speed.x * 0.68 + dx * 0.32;
      speed.y = speed.y * 0.68 + dy * 0.32;
      energy = Math.min(1, energy + Math.hypot(dx, dy) * 14);
      last.x = target.x;
      last.y = target.y;
    };

    const onScroll = () => {
      targetScroll = window.scrollY;
    };

    const render = (now: number) => {
      if (!visible) return;
      const nowSeconds = now * 0.001;
      const frameInterval = compactViewport() ? 1000 / 24 : tabletViewport() ? 1000 / 28 : 1000 / 36;
      if (lastFrameTime && now - lastFrameTime < frameInterval) {
        frame = window.requestAnimationFrame(render);
        return;
      }
      lastFrameTime = now;

      if (!finePointer.matches) {
        const driftX = 0.5 + Math.sin(nowSeconds * 0.11) * 0.08;
        const driftY = 0.54 + Math.cos(nowSeconds * 0.08) * 0.06;
        target.x += (driftX - target.x) * 0.05;
        target.y += (driftY - target.y) * 0.05;
        energy = Math.max(energy, 0.1);
      }

      current.x += (target.x - current.x) * 0.065;
      current.y += (target.y - current.y) * 0.065;
      currentScroll += (targetScroll - currentScroll) * 0.075;
      speed.x *= 0.94;
      speed.y *= 0.94;
      energy *= 0.974;
      for (let index = 0; index < rippleCount; index += 1) {
        const ripple = rippleEvents[index];
        if (ripple.strength > 0 && nowSeconds - ripple.start > rippleLife) {
          rippleEvents[index] = { x: 0, y: 0, start: -1000, strength: 0, onScreen: 0 };
        }
      }
      if (ambientStrength > 0.4 && nowSeconds >= nextAmbientRippleAt) {
        spawnAmbientRipple(nowSeconds);
        nextAmbientRippleAt = summitGoldTheme()
          ? nowSeconds + 1.45 + Math.random() * 2.4
          : nowSeconds + 3 + Math.random() * 3;
      }

      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform2f(pointer, current.x, current.y);
      gl.uniform2f(velocity, speed.x, speed.y);
      gl.uniform1f(time, nowSeconds);
      gl.uniform1f(activity, energy);
      gl.uniform1f(scroll, currentScroll);
      gl.uniform1f(ambient, ambientStrength);
      gl.uniform1f(theme, document.body.dataset.waterTheme === "summit-gold" ? 1 : 0);
      syncEnsoUniforms(nowSeconds);
      syncRippleUniforms();
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = window.requestAnimationFrame(render);
    };

    const onVisibilityChange = () => {
      visible = document.visibilityState === "visible";
      if (visible && !frame) frame = window.requestAnimationFrame(render);
      if (!visible && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const teamHeroObserver = new MutationObserver(() => {
      syncTeamHero();
    });

    resize();
    syncTeamHero();
    teamHeroObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", onResize, { passive: true });
    if (finePointer.matches) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      teamHeroObserver.disconnect();
      delete canvas.dataset.active;
      delete document.body.dataset.waterRenderer;
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return <canvas ref={canvasRef} className="water-background" aria-hidden="true" />;
}
