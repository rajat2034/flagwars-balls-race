// Flag Rally World Cup - Game Manager & UI Coordinate
// Manages menus, state transitions, procedural track creation, particles, game loop, and UI updates

const MAP_THEMES = {
  desert: {
    name: "Sahara Desert",
    bgGrad: ["#e59866", "#d35400"],
    wallColor: "#ba4a00",
    pegColor: "#e59866",
    pegBouncyColor: "#d35400",
    particleColor: "#f5b041",
    particleType: "sand",
    forwardForce: 0.025,
    density: 1.0
  },
  snow: {
    name: "Glacier Summit",
    bgGrad: ["#ebf5fb", "#a9cce3"],
    wallColor: "#2e86c1",
    pegColor: "#d6eaf8",
    pegBouncyColor: "#5dade2",
    particleColor: "#ffffff",
    particleType: "snow",
    forwardForce: 0.022,
    density: 1.0
  },
  jungle: {
    name: "Amazon Canopy",
    bgGrad: ["#196f3d", "#145a32"],
    wallColor: "#114f24",
    pegColor: "#229954",
    pegBouncyColor: "#f4d03f",
    particleColor: "#58d68d",
    particleType: "leaf",
    forwardForce: 0.025,
    density: 1.0
  },
  volcano: {
    name: "Magma Crater",
    bgGrad: ["#2c3e50", "#1a252f"],
    wallColor: "#e74c3c",
    pegColor: "#566573",
    pegBouncyColor: "#ff5733",
    particleColor: "#ff5733",
    particleType: "ember",
    forwardForce: 0.028,
    density: 1.05
  },
  ocean: {
    name: "Mariana Depths",
    bgGrad: ["#1f618d", "#1b4f72"],
    wallColor: "#17a2b8",
    pegColor: "#5dade2",
    pegBouncyColor: "#48c9b0",
    particleColor: "#a9dfbf",
    particleType: "bubble",
    forwardForce: 0.018,
    density: 0.9
  },
  space: {
    name: "Nebula Cosmos",
    bgGrad: ["#0b0c10", "#1f2833"],
    wallColor: "#66fcf1", // Neon blue
    pegColor: "#c5c6c7",
    pegBouncyColor: "#45a29e",
    particleColor: "#66fcf1",
    particleType: "star",
    forwardForce: 0.014,
    density: 0.8
  }
};

// Web Audio API Synthesizer — countdown + winner sounds only
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playFinish() {
    if (!this.enabled) return;
    this.init();
    const playTone = (freq, start, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + start);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + start + duration);
      osc.start(this.ctx.currentTime + start);
      osc.stop(this.ctx.currentTime + start + duration);
    };
    playTone(392, 0, 0.15);
    playTone(523.25, 0.12, 0.15);
    playTone(659.25, 0.24, 0.35);
  }
  playCountdown() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.003, this.ctx.currentTime + 0.12);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
  playGo() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(660, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.002, this.ctx.currentTime + 0.3);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

class GameEngine {

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Engine Subsystems
    this.physics = new PhysicsEngine();
    this.sounds = new SoundSynth();

    // Core Game Data
    this.countryDatabase = [];
    this.selectedCountries = [];
    this.gameMode = 'world_cup_2026'; // world_cup_2026, grand_prix, knockout, custom

    this.currentThemeKey = 'desert';
    this.currentTheme = MAP_THEMES.desert;
    this.track = null;
    this.balls = [];

    // Simulation Controls
    this.isRunning = false;
    this.isPaused = false;
    this.simSpeed = 1.0; // 1x, 1.5x, 2x
    this.slowMoTimer = 0; // slow motion countdown after winner crosses
    this.raceLength = 100000; // ~3-4 min race
    this.obstacleDensity = 'high'; // low, medium, high

    // Camera
    this.cameraX = 0;
    this.cameraZoom = 0.8;
    this.userZoomMultiplier = 1.0;
    this.trackOffset = 0;

    // Particles
    this.particles = [];
    this.selectedBallId = null;
    this._meteorTimer = 30; // first meteor shower in 30 seconds
    this._meteorShowerActive = false;
    this._meteorShowerDuration = 0;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartCamX = 0;
    this.isShiftDown = false;
    this.panningOverride = false;
    this.bounceAnim = 0;

    // Race States
    this.state = 'menu'; // menu, setup, countdown, racing, finished, champion_screen
    this.countdownSeconds = 3;
    this.countdownTimer = null;
    this.raceTimer = 0; // in seconds
    this.lastTime = 0;

    // Visual Effects
    this.particles = [];
    this.fireworks = [];
    this.confetti = [];
    this.activeEvent = null;
    this.eventTimer = 0;
    this.eventCount = 0;
    this.maxEvents = 2; // based on user settings
    this.leaderboard = [];
    this.lastKnockoutCycle = 0;

    // Image pattern cache for country flags
    this.flagCache = {};

    // Football image for meteor obstacles
    this.footballImg = null;

    // Anti-jam system state
    this.obstacleReliefActive = false;
    this.obstacleZoneOccupancy = {};

    // Window Events
    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();
  }

  init(db) {
    this.countryDatabase = db;
    this.preloadFlags(db);
    this.preloadFootballImage();
    this.startBackgroundLoop();
    this.setupClickToFocus();
  }

  preloadFootballImage() {
    const img = new Image();
    img.src = 'football_image-preview.png';
    img.onload = () => { this.footballImg = img; };
    img.onerror = () => { this.footballImg = 'failed'; };
  }

  // Pre-load flags asynchronously in the background
  preloadFlags(db) {
    db.forEach(c => {
      const img = new Image();
      // Using FlagCDN (w80 size is ideal for small rendering but high DPI screen)
      img.src = `https://flagcdn.com/w80/${c.code}.png`;
      img.onload = () => {
        this.flagCache[c.code] = img;
      };
      img.onerror = () => {
        this.flagCache[c.code] = 'failed';
      };
    });
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // Generates procedurally built tracks, barriers, and hazards
  generateProceduralTrack(themeKey, length, densityStr) {
    const theme = MAP_THEMES[themeKey];
    this.currentThemeKey = themeKey;
    this.currentTheme = theme;
    this.physics.forwardForce = theme.forwardForce * 0.65;

    const track = {
      length: length,
      walls: [],
      pegs: [],
      zones: [],
      obstacles: [],
      topPoints: [],
      bottomPoints: [],
      centerPoints: []
    };

    let densityVal = 0.35;
    if (densityStr === 'low') densityVal = 0.25;
    if (densityStr === 'high') densityVal = 0.75;

    // Generate center line with multi-directional sections
    const numSteps = Math.ceil(length / 30);
    let baseWidth = 250;
    let currentWidth = baseWidth;

    // Multi-directional track waypoints defining the path's overall direction
    // Track snakes: right → down-right → right → up-right → right → down-right → finish
    const waypoints = [
      { t: 0.00, y: 280 },
      { t: 0.10, y: 300 },
      { t: 0.25, y: 520 },  // Descend (track goes down-right)
      { t: 0.38, y: 180 },  // Ascend (track goes up-right)  
      { t: 0.55, y: 350 },
      { t: 0.70, y: 520 },  // Descend again
      { t: 0.85, y: 200 },  // Ascend 
      { t: 1.00, y: 300 },
    ];

    for (let i = 0; i <= numSteps; i++) {
      const x = i * 30;
      const t = x / length; // normalized position along track

      // Interpolate base Y from waypoints
      let baseY = 300;
      for (let w = 0; w < waypoints.length - 1; w++) {
        const t0 = waypoints[w].t;
        const t1 = waypoints[w + 1].t;
        if (t >= t0 && t <= t1) {
          const segmentFrac = (t - t0) / (t1 - t0);
          baseY = waypoints[w].y + (waypoints[w + 1].y - waypoints[w].y) * segmentFrac;
          break;
        }
      }

      // Sine wave variations on top of the base path for natural curves
      const curveY = Math.sin(x * 0.0008) * 80
        + Math.sin(x * 0.002) * 50
        + Math.sin(x * 0.005) * 25;

      // Determine section type for width variation
      const sectionPhase = Math.sin(x * 0.0005);
      let targetWidth = baseWidth + sectionPhase * 80;

      // Narrow sections (funnels) - more frequent for pack compression
      if (Math.abs(Math.sin(x * 0.0015)) > 0.82) {
        targetWidth = baseWidth * 0.70;
      }
      // Extra tight choke points (every ~15% of track)
      if (Math.abs(Math.sin(x * 0.0006)) > 0.90) {
        targetWidth = baseWidth * 0.60;
      }
      // Wide sections
      if (Math.abs(Math.sin(x * 0.001 + 1)) > 0.85) {
        targetWidth = baseWidth * 1.4;
      }

      // Smooth width transition
      currentWidth += (targetWidth - currentWidth) * 0.05;

      // Center Y = base path + sine wave curves
      const centerY = baseY + curveY;

      track.centerPoints.push({ x, y: centerY });
      track.topPoints.push({ x, y: centerY - currentWidth / 2 });
      track.bottomPoints.push({ x, y: centerY + currentWidth / 2 });

    }

    // Generate wall segments from top/bottom points
    for (let i = 0; i < track.topPoints.length - 1; i++) {
      track.walls.push({ p1: track.topPoints[i], p2: track.topPoints[i + 1] });
      track.walls.push({ p1: track.bottomPoints[i], p2: track.bottomPoints[i + 1] });
    }

    // Finish line zone - always visible at end of track
    const finishX = length - 400;
    track.zones.push({ type: 'finish', x: finishX, y: 0, width: 80, height: 700 });
    track.finishLineX = finishX;

    // Zone-based obstacle placement
    const getBounds = (x) => this.physics.getWallBoundaries(x, track);
    const clampY = (y, bounds, margin = 30) => {
      return Math.min(Math.max(y, bounds.topY + margin), bounds.bottomY - margin);
    };
    const clampHalf = (y, bounds, half) => {
      return Math.min(Math.max(y, bounds.topY + half + 8), bounds.bottomY - half - 8);
    };

    // 6-phase obstacle zones — all types distributed evenly across all phases
    const allTypes = ['c_bumper', 'spinner', 'breakdoor', 'barrier', 'hammer', 'barrel', 'cardboard', 'punchfist', 'peg', 'boost', 'slow', 'wind', 'portal', 'launch'];
    const phases = [
      { start: 600, end: length * 0.18, spacing: 180, types: [...allTypes] },
      { start: length * 0.18, end: length * 0.34, spacing: 160, types: [...allTypes] },
      { start: length * 0.34, end: length * 0.50, spacing: 150, types: [...allTypes] },
      { start: length * 0.50, end: length * 0.66, spacing: 140, types: [...allTypes] },
      { start: length * 0.66, end: length * 0.82, spacing: 130, types: [...allTypes] },
      { start: length * 0.82, end: length - 1500, spacing: 120, types: [...allTypes] }
    ];

    // Track last placed x per type to avoid clustering
    const lastX = {};

    // Obstacle validation: ensures every obstacle has an escape route, doesn't fully block track
    const validatePlacement = (obsBottom, obsTop, availH) => {
      const gapTop = obsTop - bounds.topY;
      const gapBottom = bounds.bottomY - obsBottom;
      const minGap = ballR * 2.5; // ~2.5 ball diameters clearance
      const maxBlockRatio = 0.70; // never block more than 70% of track height
      const blockedRatio = (obsBottom - obsTop) / availH;
      if (blockedRatio > maxBlockRatio) return false;
      if (gapTop < minGap && gapBottom < minGap) return false;
      return true;
    };

    for (const phase of phases) {
      for (let x = phase.start; x < phase.end; x += phase.spacing + Math.random() * 100) {
        const type = phase.types[Math.floor(Math.random() * phase.types.length)];
        const bounds = getBounds(x);
        if (!bounds) continue;
        const centerY = (bounds.topY + bounds.bottomY) / 2;
        const availH = bounds.bottomY - bounds.topY;
        const halfH = availH / 2;

        // Avoid same-type clustering
        if (lastX[type] && x - lastX[type] < 200) continue;
        lastX[type] = x;

        if (type === 'c_bumper') {
          // 75% chance of rotating C-bumper, 25% chance of boost pipe
          if (Math.random() < 0.75) {
            const midY = clampY(centerY, bounds, 50);
            const radius = 65 + Math.random() * 15; // ~2.2-2.7 ball diameters
            const spinSpeed = (0.05 + Math.random() * 0.05) * (Math.random() < 0.5 ? -1 : 1); // ±3-6 deg/s (slower)
            track.obstacles.push({
              type: 'c_bumper', x, y: midY, radius, thickness: 8,
              rotation: Math.random() * Math.PI * 2, spinSpeed
            });
          } else {
            // Boost pipe — horizontal corridor with exit boost
            const pipeLen = 160 + Math.random() * 80; // 5.3–8 ball diameters
            const pipeH = 46 + Math.random() * 10;   // 1.5–1.9 ball diameters
            // Place pipe in upper or lower half of track with 50px wall gap
            const onTop = Math.random() < 0.5;
            const topBound = bounds.topY + 50;
            const botBound = bounds.bottomY - 50;
            const pipeY = onTop
              ? clampY(topBound + pipeH / 2, bounds)
              : clampY(botBound - pipeH / 2, bounds);
            track.obstacles.push({
              type: 'boost_pipe', x, y: pipeY,
              length: pipeLen, width: pipeH,
              boostMultiplier: 1.3 + Math.random() * 0.3
            });
            // Boost zone covering entire pipe
            track.zones.push({
              type: 'boost',
              x: x,
              y: pipeY - pipeH / 2,
              width: pipeLen,
              height: pipeH,
              force: 0.40
            });
          }
          } else if (type === 'boost') {
          track.zones.push({ type: 'boost', x: x - 37, y: clampY(centerY - halfH * 0.35, bounds) - 22, width: 75, height: 45, force: 0.20 });
        } else if (type === 'slow') {
          track.zones.push({ type: 'slow', x: x - 30, y: clampY(centerY + halfH * 0.3, bounds) - 22, width: 60, height: 45 });
        } else if (type === 'wind') {
          track.zones.push({ type: 'wind', x: x - 25, y: clampY(centerY - 35, bounds), width: 50, height: Math.min(70, availH * 0.6), force: (Math.random() - 0.5) * 0.08 });
        } else if (type === 'punchfist') {
          const fistDir = Math.random() < 0.5 ? 1 : -1;
          track.obstacles.push({ type: 'punchfist', x, y: clampY(centerY + (Math.random() - 0.5) * 30, bounds), direction: fistDir, extendDist: 120, fistRadius: 32, phase: Math.random(), cycleDuration: 60, fired: false, fistX: x, fistY: centerY });
        } else if (type === 'portal') {
            // Portal pair, ~800-1200px apart (20-30m)
            const pairId = Math.random().toString(36).slice(2);
            const distAhead = 800 + Math.random() * 400;
            const portalSize = 50;
            track.zones.push({ type: 'portal', x: x - portalSize / 2, y: clampY(centerY - portalSize / 2, bounds), width: portalSize, height: portalSize, pairId, radius: portalSize / 2 });
            const x2 = Math.min(x + distAhead, phase.end - 100);
            if (x2 > x + 200) {
              track.zones.push({ type: 'portal', x: x2 - portalSize / 2, y: clampY(centerY - portalSize / 2, bounds), width: portalSize, height: portalSize, pairId, radius: portalSize / 2 });
              lastX['portal'] = x2;
            }
          } else if (type === 'launch') {
            // Bounce pad at bottom of track: launches ball upward
            const padW = 50;
            track.zones.push({ type: 'launch', x: x - padW / 2, y: bounds.bottomY - 20, width: padW, height: 20 });
          } else if (type === 'barrier') {
            // Vertical moving gate: purple/blue, narrow, slow movement
            const bw = 16 + Math.random() * 6; // ~16-22px wide
            const bh = 80 + Math.random() * 40; // ~80-120px tall
            const bY = clampY(centerY + (Math.random() - 0.5) * availH * 0.3, bounds);
            // Movement range: at least barrier height total (half each direction)
            const travelRange = Math.max(bh, (bounds.bottomY - bounds.topY) * 0.35);
            const minY = clampY(bY - travelRange / 2, bounds);
            const maxY = clampY(bY + travelRange / 2, bounds);
            track.obstacles.push({
              type: 'barrier', x, y: bY,
              width: bw, height: bh,
              isVertical: true,
              direction: Math.random() < 0.5 ? 1 : -1,
              speed: 0.3 + Math.random() * 0.3, // 0.3-0.6 px/frame (slow)
              minY, maxY
            });
          } else if (type === 'spinner') {
            // Rotating bar with variable speed
            const barLen = 80 + Math.random() * 40;
            // Speed distribution: 25% each of 100%, 80%, 70%, 50%
            const speedRoll = Math.random();
            let speedPct;
            if (speedRoll < 0.25) speedPct = 1.0;
            else if (speedRoll < 0.50) speedPct = 0.8;
            else if (speedRoll < 0.75) speedPct = 0.7;
            else speedPct = 0.5;
            const baseSpeed = 0.07;
            const spinSpeed = baseSpeed * speedPct * (Math.random() < 0.5 ? 1 : -1);
            track.obstacles.push({
              type: 'spinner', x, y: clampY(centerY, bounds, 30),
              length: barLen,
              angle: Math.random() * Math.PI * 2,
              speed: spinSpeed,
              pins: []
            });
          } else if (type === 'breakdoor') {
            // Breakable barrier: red/orange with HP 3-5
            const doorW = 30 + Math.random() * 10;
            const doorH = 80 + Math.random() * 40;
            const hp = 3 + Math.floor(Math.random() * 3); // 3-5 HP
            const dY = clampY(centerY, bounds);
            track.obstacles.push({
              type: 'breakdoor', x, y: dY,
              width: doorW, height: doorH,
              hp, maxHp: hp,
              broken: false, _hitCooldown: 0,
              _crackLevel: 0
            });
          } else if (type === 'peg') {
            // Small white circular blockers in vertical stacks of 2-3
            if (!track.pegs) track.pegs = [];
            const pegR = 4 + Math.random() * 2;
            const count = 2 + Math.floor(Math.random() * 2); // 2-3 per stack
            const spacing = 40 + Math.random() * 10;
            const startY = clampY(centerY - (count - 1) * spacing / 2 + (Math.random() - 0.5) * availH * 0.4, bounds);
            const pegX = x + (Math.random() - 0.5) * 20;
            for (let pi = 0; pi < count; pi++) {
              track.pegs.push({
                x: pegX + (Math.random() - 0.5) * 6,
                y: startY + pi * spacing,
                radius: pegR,
                bouncy: true
              });
            }
          }
      }
    }

    // Post-generation validation: remove obstacles that fully block the track or trap racers
    const ballR = 15; // average ball radius
    track.obstacles = track.obstacles.filter(obs => {
      if (obs.type === 'c_bumper') {
        const top = obs.y - obs.radius;
        const bot = obs.y + obs.radius;
        const bounds = getBounds(obs.x);
        if (!bounds) return false;
        const gapTop = top - bounds.topY;
        const gapBot = bounds.bottomY - bot;
        return gapTop > ballR * 2 && gapBot > ballR * 2;
      }
      if (obs.type === 'barrier' || obs.type === 'breakdoor') {
        const halfH = (obs.height || 60) / 2;
        const top = obs.y - halfH;
        const bot = obs.y + halfH;
        const bounds = getBounds(obs.x);
        if (!bounds) return false;
        const availH = bounds.bottomY - bounds.topY;
        const blockedRatio = (bot - top) / availH;
        const gapTop = top - bounds.topY;
        const gapBot = bounds.bottomY - bot;
        return blockedRatio < 0.70 && (gapTop > ballR * 2.5 || gapBot > ballR * 2.5);
      }
      if (obs.type === 'spinner') {
        const halfLen = obs.length / 2;
        const top = obs.y - halfLen;
        const bot = obs.y + halfLen;
        const bounds = getBounds(obs.x);
        if (!bounds) return false;
        const availH = bounds.bottomY - bounds.topY;
        const gapTop = top - bounds.topY;
        const gapBot = bounds.bottomY - bot;
        return gapTop > ballR * 2.5 || gapBot > ballR * 2.5;
      }
      return true;
    });

    this.track = track;
  }

  // Update dynamic obstacles (punchfist extension, breakdoor fragments, meteor cleanup)
  updateDynamicObstacles(dt) {
    if (!this.track || !this.track.obstacles) return;
    this.track.obstacles.forEach(obs => {
      if (obs.type === 'punchfist') {
        obs.phase = (obs.phase || 0) + dt / (obs.cycleDuration || 60);
        if (obs.phase > 1) obs.phase -= 1;
        let t;
        if (obs.phase < 0.3) {
          t = 0;
          obs.fired = false;
        } else if (obs.phase < 0.45) {
          t = (obs.phase - 0.3) / 0.15;
          obs.fired = true;
        } else {
          t = 1 - (obs.phase - 0.45) / 0.55;
          obs.fired = t > 0.1;
        }
        const extend = t * obs.extendDist;
        obs.fistX = obs.x + obs.direction * extend;
        obs.fistY = obs.y;
        obs.fistVx = obs.direction * 14;
      } else if (obs.type === 'c_bumper') {
        // Continuous rotation
        obs.rotation = (obs.rotation || 0) + (obs.spinSpeed || 0) * dt;
      } else if (obs.type === 'barrier') {
        // Smooth up/down movement within range (minY/maxY are center bounds)
        obs.y += obs.direction * obs.speed * dt;
        if (obs.y < obs.minY) { obs.y = obs.minY; obs.direction = 1; }
        if (obs.y > obs.maxY) { obs.y = obs.maxY; obs.direction = -1; }
        obs.vy = obs.direction * obs.speed;
      } else if (obs.type === 'spinner') {
        // Continuous 360 rotation
        obs.angle = (obs.angle || 0) + (obs.speed || 0.03) * dt;
      } else if (obs.type === 'trapdoor') {
        // Toggle open/close every 60 frames
        obs._trapTimer = (obs._trapTimer || 0) + dt;
        if (obs._trapTimer > 60) {
          obs._trapTimer = 0;
          obs.isOpen = !obs.isOpen;
          obs._warningFlash = true;
        } else if (obs._trapTimer > 50) {
          obs._warningFlash = false;
        }
        // Animate slide
        const slideDuration = 20;
        if (obs.isOpen) {
          obs._slide = Math.min(1, (obs._slide || 0) + dt / slideDuration);
        } else {
          obs._slide = Math.max(0, (obs._slide || 0) - dt / slideDuration);
        }
      } else if (obs.type === 'rock') {
        // Meteor/rock movement: fall from sky like rain
        obs.x += (obs.vx || 0) * dt;
        obs.vy = (obs.vy || 0) + 0.15 * dt; // gravity acceleration
        obs.y += obs.vy * dt;
      } else if (obs.type === 'breakdoor') {
        if (obs.broken) {
          if (obs._fragments) {
            let allDead = true;
            obs._fragments.forEach(f => {
              f.x += f.vx * dt;
              f.y += f.vy * dt;
              f.vy += 0.2 * dt;
              f.life -= dt;
              f.rotation += f.rotSpeed * dt;
              if (f.life > 0) allDead = false;
            });
            if (allDead) obs._remove = true;
          }
        } else {
          const ratio = obs.hp / obs.maxHp;
          if (ratio <= 0.2) obs._crackLevel = 4;
          else if (ratio <= 0.4) obs._crackLevel = 3;
          else if (ratio <= 0.6) obs._crackLevel = 2;
          else if (ratio <= 0.8) obs._crackLevel = 1;
          else obs._crackLevel = 0;
        }
      }
    });

    // Remove old off-camera falling rocks/meteors and broken walls
    if (this.track.obstacles.length > 0) {
      this.track.obstacles = this.track.obstacles.filter(obs => {
        if (obs._remove) return false;
        if (obs.type === 'rock' && obs.y > this.canvas.height / this.cameraZoom + 200) {
          return false;
        }
        return true;
      });
    }
  }

  // Spawn a meteor/rock obstacle falling from above
  spawnMeteor() {
    if (!this.track || !this.balls.length) return;
    const leadBall = [...this.balls].filter(b => !b.finished).sort((a, b) => b.x - a.x)[0];
    if (!leadBall) return;
    const spawnX = leadBall.x + (Math.random() - 0.5) * 400;
    const bounds = this.physics.getWallBoundaries(spawnX, this.track);
    if (!bounds) return;
    const spawnY = bounds.topY + 10;
    this.track.obstacles.push({
      type: 'rock', isMeteor: true,
      x: spawnX, y: spawnY,
      radius: 14 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 4 + Math.random() * 4,
      mass: 3
    });
  }

  // Trigger a random race event (meteor shower, gravity flip, etc.)
  triggerRandomEvent() {
    if (this.activeEvent) return;
    const events = [
      { name: 'GRAVITY FLIP', key: 'gravity_flip', duration: 240 },
      { name: 'SPEED BOOM', key: 'speed_boom', duration: 180 }
    ];
    const evt = events[Math.floor(Math.random() * events.length)];
    this.activeEvent = evt;
    this.eventTimer = evt.duration;
    this.eventCount++;
  }

  // Update random event continuous effects
  updateRandomEvents(dt) {
    if (!this.activeEvent) return;
    this.eventTimer -= dt;
    if (this.eventTimer <= 0) {
      if (this.activeEvent.key === 'gravity_flip') {
        this.physics.forwardForce = this.currentTheme.forwardForce * 0.65;
      }
      this.activeEvent = null;
      return;
    }
    if (this.activeEvent.key === 'gravity_flip') {
      this.physics.forwardForce = -this.currentTheme.forwardForce * 0.4;
      this.balls.forEach(ball => {
        if (!ball.finished && ball.z === 0) {
          ball.vy += (Math.random() - 0.5) * 0.05 * dt;
        }
      });
    } else if (this.activeEvent.key === 'speed_boom') {
      this.balls.forEach(ball => {
        if (!ball.finished) {
          ball.vx *= 1 + 0.001 * dt;
        }
      });
    }
  }

  // Setup race balls from selected countries
  setupRaceBalls() {
    this.balls = [];
    this.selectedCountries.forEach((country, idx) => {
      const ball = {
        id: idx,
        code: country.code,
        name: country.name,
        attributes: { ...country.attributes },
        stats: { ...country.stats },
        isWorldCup: !!country.isWorldCup,
        isWCBonus: !!country.isWorldCup,
        isStrongFootball: !!country.isStrongFootball,
        color: `hsl(${Math.random() * 360}, 85%, 60%)`,
        primaryColorRGB: `${40 + Math.floor(Math.random() * 60)}, ${100 + Math.floor(Math.random() * 100)}, ${150 + Math.floor(Math.random() * 100)}`,
        x: 50 + idx * 4,
        y: 300 + (idx % 2 === 0 ? -15 : 15),
        vx: 0,
        vy: 0,
        vz: 0,
        z: 0,
        radius: 15,
        mass: 0.8 + Math.random() * 0.4,
        restitution: 0.3,
        finished: false,
        eliminated: false,
        finishTime: 0,
        maxSpeed: 0,
        rank: 0,
        trail: []
      };
      this.balls.push(ball);
    });
  }

  // Central racing simulation cycle
  tick(timestamp) {
    if (!this.isRunning) return;

    if (!this.lastTime) this.lastTime = timestamp;
    let delta = (timestamp - this.lastTime) / 16.666; // Normalized to 60 FPS
    this.lastTime = timestamp;

    // Clamp delta to avoid massive teleports on lag spikes
    delta = Math.min(delta, 3.0);

    if (!this.isPaused) {
      let effectiveSpeed = this.simSpeed;
      // Slow motion when winner crosses
      if (this.slowMoTimer > 0) {
        this.slowMoTimer -= delta;
        effectiveSpeed = 0.15; // slow motion
        if (this.slowMoTimer <= 0) {
          this.slowMoTimer = 0;
        }
      }
      // Multiply by simulation speed
      const dt = delta * effectiveSpeed;

      // Update timer if race is active
      if (this.state === 'racing') {
        this.raceTimer += (16.666 * dt) / 1000;

        // Random event trigger chance: every ~15s
        if (this.eventCount < this.maxEvents && this.activeEvent === null) {
          const nextEventChance = 0.0012 * dt; // increased chance
          if (Math.random() < nextEventChance && this.raceTimer > 10) {
            this.triggerRandomEvent();
          }
        }

        // Periodic meteor shower every 25 seconds
        this._meteorTimer -= dt / 60;
        if (this._meteorTimer <= 0 && this.state === 'racing') {
          this._meteorShowerActive = true;
          this._meteorShowerDuration = 300; // 5 seconds (300 frames at 60fps)
          this._meteorTimer = 30;
        }
        if (this._meteorShowerActive) {
          this._meteorShowerDuration -= dt;
          if (this._meteorShowerDuration <= 0) {
            this._meteorShowerActive = false;
          }
        }
      }

      // Watchdog timer: skip physics if previous frame took >100ms
      if (this._watchdogSkipNext) {
        this._watchdogSkipNext = false;
        console.warn('[Watchdog] Skipping physics frame to recover');
      } else {
        const _ws = performance.now();
        try {
          this.updateSimulation(dt);
        } catch (e) {
          console.warn('[Watchdog] Physics crash caught:', e.message);
        }
        const _elapsed = performance.now() - _ws;
        if (_elapsed > 100) {
          console.warn('[Watchdog] Frame took ' + _elapsed.toFixed(1) + 'ms, forcing render-only');
          this._watchdogSkipNext = true;
        }
      }
    }

    // Render Frame
    this.render();

    requestAnimationFrame((t) => this.tick(t));
  }

  updateSimulation(dt) {
    if (this.state === 'racing') {
      // Step physics
      this.physics.update(this.balls, this.track, dt);

      // Reset forward force parameter if gravity flip event ended
      if (!this.activeEvent || this.activeEvent.key !== 'gravity_flip') {
        this.physics.forwardForce = this.currentTheme.forwardForce * 0.65;
      }

      // Fast ball particle trails (visual quality)
      this.balls.forEach(ball => {
        if (ball.finished || ball.eliminated) return;
        const speed = Math.hypot(ball.vx, ball.vy);
        if (speed > 3 && Math.random() < 0.15) {
          this.particles.push({
            type: 'sparkle',
            x: ball.x + (Math.random() - 0.5) * 6,
            y: ball.y + (Math.random() - 0.5) * 6,
            vx: ball.vx * 0.1 + (Math.random() - 0.5) * 0.5,
            vy: ball.vy * 0.1 + (Math.random() - 0.5) * 0.5,
            alpha: 0.5 + Math.random() * 0.3,
            size: Math.random() * 2 + 1,
            life: 15 + Math.floor(Math.random() * 10),
            color: ball.primaryColorRGB ? `rgba(${ball.primaryColorRGB}, 0.3)` : '#ffffff'
          });
        }
      });

      // Update dynamic obstacles
      this.updateDynamicObstacles(dt);

      // Update random event continuous forces
      this.updateRandomEvents(dt);

      // Periodic meteor shower spawning
      if (this._meteorShowerActive && this.state === 'racing') {
        if (Math.random() < 0.06 * dt) {
          this.spawnMeteor();
        }
      }

      // Check for jumps zones trigger
      this.balls.forEach(ball => {
        if (ball.finished) return;
        this.track.zones.forEach(zone => {
          if (
            zone.type === 'jump' && ball.z === 0 &&
            ball.x >= zone.x && ball.x <= zone.x + zone.width &&
            ball.y >= zone.y && ball.y <= zone.y + zone.height
          ) {
            ball.vz = 5.2; // catapult upwards!
            ball.z = 2;
            // Launch cloud particles
            for (let p = 0; p < 5; p++) {
              this.particles.push({
                type: 'jump_smoke',
                x: ball.x + (Math.random() - 0.5) * 15,
                y: ball.y + (Math.random() - 0.5) * 15,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2,
                alpha: 0.8,
                size: Math.random() * 6 + 4
              });
            }
          }
        });
        // Boost sparkles
        if (ball._inBoost && Math.random() < 0.3) {
          this.particles.push({
            type: 'sparkle',
            x: ball.x + (Math.random() - 0.5) * 10,
            y: ball.y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 2 - 1,
            alpha: 1,
            size: Math.random() * 3 + 2,
            life: 20 + Math.floor(Math.random() * 15)
          });
        }
      });

      // Resolve finishes
      const finishDetectX = this.track ? this.track.finishLineX : (this.track ? this.track.length - 400 : 0);
      this.balls.forEach(ball => {
        if (!ball.finished && ball.x >= finishDetectX) {
          ball.finished = true;
          ball.finishTime = this.raceTimer;
          this.sounds.playFinish();

          // Show winner overlay immediately on first finish (race continues for others)
          if (!this._championOverlayShown) {
            this._championOverlayShown = true;
            this._championWinner = ball;
            this._winnerFlagReady = false;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => { this._winnerFlagReady = true; };
            img.src = `https://flagcdn.com/h240/${ball.code}.png`;
            this._championFlagImg = img;
            this.triggerConfettiExplosion(ball.x, ball.y);
            // Slow motion for 1 second
            this.slowMoTimer = 60; // ~1 second at 60fps
            // Focus camera on winner
            this.selectedBallId = ball.id;
            // Trigger crowd cheer sound
            this.sounds.playFinish();
          }

          // Confetti explosion at finish coordinates
          this.triggerConfettiExplosion(ball.x, ball.y);

          // Print debug/status in console
          console.log(`[FINISH] ${ball.name} crossed the line at ${ball.finishTime.toFixed(2)}s`);
        }
      });

      // Handle Knockout Mode special rules:
      // Last-place ball is eliminated every 10 seconds.
      if (this.gameMode === 'knockout') {
        const checkCycle = 10; // 10 seconds
        const currentCycle = Math.floor(this.raceTimer / checkCycle);
        if (!this.lastKnockoutCycle) this.lastKnockoutCycle = 0;

        if (currentCycle > this.lastKnockoutCycle) {
          this.lastKnockoutCycle = currentCycle;
          this.eliminateLastPlaceBall();
        }
      }

      // Live Leaderboard calculation
      this.calculateLiveLeaderboard();

      // Check end game criteria
      const activeUnfinished = this.balls.filter(b => !b.finished);
      if (activeUnfinished.length === 0 || (this.gameMode === 'knockout' && this.balls.filter(b => !b.finished).length === 1)) {
        // If knockout mode, mark remaining ball as winner!
        if (this.gameMode === 'knockout' && activeUnfinished.length === 1) {
          const lastStanding = activeUnfinished[0];
          lastStanding.finished = true;
          lastStanding.finishTime = this.raceTimer;
          this.triggerConfettiExplosion(lastStanding.x, lastStanding.y);
        }

        this.endRace();
      }
    }

    // Update Camera Target position (lerping)
    this.updateCameraController(dt);

    // Update decorative particles
    this.updateParticles(dt);
    this.updateWinnerVisuals(dt);
  }

  eliminateLastPlaceBall() {
    // Get all balls that haven't finished and are not yet marked as 'eliminated'
    const activeBalls = this.balls.filter(b => !b.finished && !b.eliminated);
    if (activeBalls.length > 1) {
      // Sort ascending by position: smallest x is trailing (behind everyone else)
      activeBalls.sort((a, b) => a.x - b.x);
      const target = activeBalls[0];
      target.eliminated = true;
      target.finished = true; // treated as finished/dead
      target.finishTime = 999.99; // DNF

      // Spark/fade particles at target coordinates
      for (let p = 0; p < 15; p++) {
        this.particles.push({
          type: 'spark',
          x: target.x,
          y: target.y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          color: '#e74c3c',
          alpha: 1,
          size: Math.random() * 4 + 2
        });
      }

      console.log(`[KNOCKOUT] ${target.name} eliminated!`);
    }
  }

  calculateLiveLeaderboard() {
    // Score ranking:
    // Finished balls are ordered by finishTime (ascending)
    // Active balls are ordered by vertical distance y (descending - largest y is leading)
    // Eliminated DNF balls are placed last

    const finishedBalls = this.balls.filter(b => b.finished && !b.eliminated).sort((a, b) => a.finishTime - b.finishTime);
    const racingBalls = this.balls.filter(b => !b.finished).sort((a, b) => b.x - a.x);
    const eliminatedBalls = this.balls.filter(b => b.eliminated).sort((a, b) => a.id - b.id);

    this.leaderboard = [...finishedBalls, ...racingBalls, ...eliminatedBalls];

    // Assign numerical ranks
    this.leaderboard.forEach((b, idx) => {
      b.rank = idx + 1;
    });
  }

  setupClickToFocus() {
    // Mouse wheel zoom: scroll down = zoom out, scroll up = zoom in
    window.addEventListener('wheel', (e) => {
      if (this.state !== 'racing' && this.state !== 'finished') return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.25 : 0.25;
      this.userZoomMultiplier = Math.max(0.15, Math.min(3.0, this.userZoomMultiplier + delta));
    }, { passive: false });

    // Shift+click to focus on ball
    this.canvas.addEventListener('click', (e) => {
      if (this.state !== 'racing') return;
      if (e.shiftKey) return; // let shift be for panning
      const rect = this.canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - this.trackOffset) / this.cameraZoom + this.cameraX;
      const clickY = (e.clientY - rect.top) / this.cameraZoom;

      let closestDist = Infinity;
      let closestBall = null;
      this.balls.forEach(ball => {
        if (ball.finished) return;
        const dist = Math.hypot(clickX - ball.x, clickY - ball.y);
        if (dist < closestDist && dist < 30) {
          closestDist = dist;
          closestBall = ball;
        }
      });

      if (closestBall) {
        this.selectedBallId = this.selectedBallId === closestBall.id ? 'leader' : closestBall.id;
      }
    });

    // Shift+drag panning
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.shiftKey && (this.state === 'racing' || this.state === 'finished')) {
        this.isPanning = true;
        this.panStartX = e.clientX;
        this.panStartCamX = this.cameraX;
        this.canvas.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        const dx = (this.panStartX - e.clientX) / this.cameraZoom;
        const maxCamX = this.track ? Math.max(0, this.track.length - this.canvas.width / this.cameraZoom) : 0;
        this.cameraX = Math.max(0, Math.min(maxCamX, this.panStartCamX + dx));
        // Temporarily disable auto-follow while panning
        this.panningOverride = true;
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.canvas.style.cursor = 'default';
        // Re-enable auto-follow after a short delay
        setTimeout(() => { this.panningOverride = false; }, 2000);
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') this.isShiftDown = true;
      if (e.key === '=' || e.key === '+') {
        if (this.state === 'racing' || this.state === 'finished') {
          this.userZoomMultiplier = Math.min(3.0, this.userZoomMultiplier + 0.15);
        }
      }
      if (e.key === '-') {
        if (this.state === 'racing' || this.state === 'finished') {
          this.userZoomMultiplier = Math.max(0.15, this.userZoomMultiplier - 0.15);
        }
      }
      // R key to reset camera zoom
      if (e.key === 'r' || e.key === 'R') {
        if (this.state === 'racing' || this.state === 'finished') {
          this.userZoomMultiplier = 1.0;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') this.isShiftDown = false;
    });

    // Double-click to reset camera zoom
    this.canvas.addEventListener('dblclick', (e) => {
      if (this.state === 'racing' || this.state === 'finished') {
        this.userZoomMultiplier = 1.0;
      }
    });
  }

  zoomIn() {
    this.userZoomMultiplier = Math.min(3.0, this.userZoomMultiplier + 0.2);
  }

  zoomOut() {
    this.userZoomMultiplier = Math.max(0.15, this.userZoomMultiplier - 0.2);
  }

  focusOnCountry(code) {
    if (code === 'leader') {
      this.selectedBallId = 'leader';
      return;
    }
    if (!code) {
      this.selectedBallId = null;
      return;
    }
    const ball = this.balls.find(b => b.code === code);
    if (ball) {
      this.selectedBallId = ball.id;
    }
  }

  // Smooth lerp camera tracking the leader ball dynamically (switches on overtake)
  updateCameraController(dt) {
    if (this.balls.length === 0) return;

    let targetX = 0;

    if (this.state === 'countdown' || this.state === 'menu') {
      targetX = 0;
    } else {
      if (this.panningOverride) return;

      const activeRacers = this.balls.filter(b => !b.finished);

      if (activeRacers.length > 0) {
        if (this.selectedBallId === 'leader' || this.selectedBallId === null) {
          // Find current leader (ball with highest x position)
          const leader = activeRacers.reduce((a, b) => a.x > b.x ? a : b);
          // Position camera so the leader appears at ~30% from the left edge
          // This shows trailing balls on the left and track ahead on the right
          const screenWorldWidth = this.canvas.width / this.cameraZoom;
          targetX = leader.x - screenWorldWidth * 0.3;
        } else {
          const selected = this.balls.find(b => b.id === this.selectedBallId);
          if (selected) {
            targetX = selected.x - this.canvas.width / (2 * this.cameraZoom);
          } else {
            this.selectedBallId = 'leader';
            return this.updateCameraController(dt);
          }
        }
      } else {
        const finishedList = this.balls.filter(b => !b.eliminated).sort((a, b) => a.finishTime - b.finishTime);
        if (finishedList.length > 0) {
          targetX = finishedList[0].x - this.canvas.width / (2 * this.cameraZoom);
        }
      }
    }

    const maxCamX = this.track ? Math.max(0, this.track.length - this.canvas.width / this.cameraZoom) : 0;
    targetX = Math.max(0, Math.min(targetX, maxCamX));

    // Smooth lerp — faster response for overtakes (0.08 vs 0.05)
    const lerpSpeed = 0.08 * dt;
    this.cameraX += (targetX - this.cameraX) * lerpSpeed;
    this.cameraX = Math.max(0, this.cameraX);

    // Enforce finish line always visible on screen when any ball is near it
    if (this.track && this.track.finishLineX && this.balls.some(b => b.x > this.track.finishLineX - 1200 && !b.finished)) {
      const fX = this.track.finishLineX;
      const margin = 40;
      const rightEdge = this.cameraX + this.canvas.width / this.cameraZoom;
      if (fX > rightEdge - margin) {
        this.cameraX = fX - this.canvas.width / this.cameraZoom + margin;
      }
      if (fX < this.cameraX + margin) {
        this.cameraX = Math.max(0, fX - margin);
      }
      this.cameraX = Math.max(0, this.cameraX);
    }
  }

  // Updates particles (weather effects, trails, sparks)
  updateParticles(dt) {
    // 1. Process existing particles
    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'wind' || p.type === 'dust') {
        p.alpha -= 0.003 * dt;
      } else if (p.type === 'spark' || p.type === 'confetti' || p.type === 'jump_smoke') {
        p.vy += 0.08 * dt; // fall under gravity
        p.alpha -= 0.015 * dt;
      } else if (p.type === 'bubble' || p.type === 'ember') {
        p.alpha -= 0.005 * dt;
      } else if (p.type === 'text') {
        p.alpha -= 0.01 * dt;
        p.y -= 0.5 * dt; // drift upward
      } else if (p.type === 'sparkle') {
        p.vy += 0.02 * dt; // slight drift
        p.alpha -= 0.01 * dt;
        p.life = (p.life || 20) - dt;
        p.size *= 0.98; // shrink
      }
    });

    // Remove expired particles
    this.particles = this.particles.filter(p => p.alpha > 0 && (p.life === undefined || p.life > 0));
    // Hard cap: discard oldest particles if over limit
    if (this.particles.length > 500) {
      this.particles = this.particles.slice(this.particles.length - 500);
    }

    // 2. Generate new weather/ambient particles based on map theme
    if (!this.track) return;

    const count = this.currentTheme.particleType === 'star' ? 1.0 : 0.4;
    if (Math.random() < count * dt) {
      const pType = this.currentTheme.particleType;
      const col = this.currentTheme.particleColor;

      const spawnX = Math.random() * this.canvas.width;
      // Spawn at the top of track
      const spawnY = -20;

      if (pType === 'snow') {
        this.particles.push({
          type: 'dust',
          x: spawnX,
          y: spawnY + Math.random() * this.canvas.height, // spawn scattered throughout screen height initially
          vx: (Math.random() - 0.5) * 1 + 0.5, // drift right slightly
          vy: 1.2 + Math.random() * 1.0,
          color: col,
          alpha: 0.6 + Math.random() * 0.4,
          size: Math.random() * 4 + 1.5
        });
      } else if (pType === 'bubble') {
        // Ocean: bubbles rise upwards from bottom of track
        this.particles.push({
          type: 'bubble',
          x: Math.random() * 500, // within track
          y: 620,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -1.0 - Math.random() * 1.5, // float up
          color: 'rgba(173, 216, 230, 0.4)',
          alpha: 0.8,
          size: Math.random() * 5 + 2
        });
      } else if (pType === 'leaf') {
        this.particles.push({
          type: 'dust',
          x: spawnX,
          y: spawnY,
          vx: Math.sin(Date.now() * 0.001) * 1.2, // swaying
          vy: 1.0 + Math.random() * 1.2,
          color: `hsl(${100 + Math.random() * 40}, 70%, ${30 + Math.random() * 20}%)`,
          alpha: 0.8,
          size: Math.random() * 6 + 3
        });
      } else if (pType === 'ember') {
        // Volcano: embers rise from bottom lava grids
        this.particles.push({
          type: 'ember',
          x: Math.random() * 500,
          y: 620,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -1.5 - Math.random() * 2.0,
          color: `rgb(255, ${Math.round(100 + Math.random() * 100)}, 0)`,
          alpha: 0.9,
          size: Math.random() * 4 + 1
        });
      } else if (pType === 'sand') {
        this.particles.push({
          type: 'wind',
          x: -20,
          y: Math.random() * 600,
          vx: 4 + Math.random() * 4, // strong wind drift
          vy: 0.5,
          color: col,
          alpha: 0.4,
          size: Math.random() * 3 + 1
        });
      } else if (pType === 'star') {
        // Space cosmic stars drifting slowly up (showing down motion)
        this.particles.push({
          type: 'dust',
          x: spawnX,
          y: spawnY,
          vx: 0,
          vy: 0.2, // very slow
          color: '#ffffff',
          alpha: Math.random() * 0.5 + 0.3,
          size: Math.random() * 2 + 0.5
        });
      }
    }
  }

  // Celebratory particles
  triggerConfettiExplosion(x, y) {
    const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22'];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        type: 'confetti',
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: -4 - Math.random() * 8, // blast up
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        size: Math.random() * 6 + 4
      });
    }
  }

  // fireworks & confetti engine loop for champion screens
  updateWinnerVisuals(dt) {
    if (this.state !== 'champion_screen' && this.state !== 'finished') return;

    // Confetti rain
    if (Math.random() < 0.25 * dt) {
      const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22'];
      this.confetti.push({
        x: Math.random() * this.canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * 360,
        spin: (Math.random() - 0.5) * 10,
        size: Math.random() * 8 + 5,
        alpha: 1.0
      });
    }

    this.confetti.forEach(c => {
      c.x += c.vx * dt;
      c.vy += 0.08 * dt;
      c.y += c.vy * dt;
      c.angle += c.spin * dt;
    });
    this.confetti = this.confetti.filter(c => c.y < this.canvas.height);

    // Fireworks
    if (Math.random() < 0.02 * dt) {
      const fx = Math.random() * this.canvas.width;
      const fy = this.canvas.height * 0.2 + Math.random() * (this.canvas.height * 0.4);
      const colors = ['#ff2a6d', '#05d9e8', '#01012b', '#f5b041', '#2ecc71', '#f1c40f'];
      const col = colors[Math.floor(Math.random() * colors.length)];

      // Explosion sparks
      const sparks = [];
      const sparkCount = 35 + Math.floor(Math.random() * 20);
      for (let s = 0; s < sparkCount; s++) {
        const theta = (s / sparkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
        const speed = 2 + Math.random() * 6;
        sparks.push({
          x: fx,
          y: fy,
          vx: Math.cos(theta) * speed,
          vy: Math.sin(theta) * speed,
          alpha: 1.0,
          color: col
        });
      }
      this.fireworks.push({ sparks: sparks });
    }

    this.fireworks.forEach(f => {
      f.sparks.forEach(s => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 0.08 * dt; // gravity drag
        s.alpha -= 0.015 * dt;
      });
      f.sparks = f.sparks.filter(s => s.alpha > 0);
    });
    this.fireworks = this.fireworks.filter(f => f.sparks.length > 0);
  }

  // Draw background peg grid and rolling marbles for menu backdrop
  startBackgroundLoop() {
    if (this.bgLoopId) {
      cancelAnimationFrame(this.bgLoopId);
      this.bgLoopId = null;
    }
    this.bgBalls = [];
    const db = getCountryDatabase();
    for (let i = 0; i < 15; i++) {
      const country = db[Math.floor(Math.random() * db.length)];
      this.bgBalls.push({
        code: country.code,
        name: country.name,
        color: `hsl(${Math.random() * 360}, 85%, 60%)`,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.5 + Math.random() * 1.5,
        radius: 20
      });
    }

    const drawBg = () => {
      if (this.state !== 'menu' && this.state !== 'setup') {
        this.bgLoopId = null;
        return;
      }

      this.ctx.fillStyle = '#0b0c10';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Background pegs
      this.ctx.fillStyle = 'rgba(102, 252, 241, 0.05)';
      const spacing = 120;
      for (let x = 0; x < this.canvas.width; x += spacing) {
        for (let y = 0; y < this.canvas.height; y += spacing) {
          this.ctx.beginPath();
          this.ctx.arc(x + (Math.floor(y / spacing) % 2) * spacing / 2, y, 6, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      // Roll backdrop balls
      this.bgBalls.forEach(ball => {
        ball.y += ball.vy;
        ball.x += ball.vx;

        if (ball.y > this.canvas.height + 40) {
          ball.y = -30;
          ball.x = Math.random() * this.canvas.width;
        }
        if (ball.x < -30 || ball.x > this.canvas.width + 30) {
          ball.vx *= -1;
        }

        // Render
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.clip();

        const img = this.flagCache[ball.code];
        if (img && img !== 'failed' && img.complete) {
          this.ctx.drawImage(img, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
        } else {
          this.ctx.fillStyle = ball.color;
          this.ctx.fillRect(ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
        }

        // 3D Glass overlay
        const grad = this.ctx.createRadialGradient(
          ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.1,
          ball.x, ball.y, ball.radius
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });

      this.bgLoopId = requestAnimationFrame(drawBg);
    };

    drawBg();
  }

  // Primary rendering cycle (scales and draws track, particles, UI overlays)
  render() {
    // 1. Clear screen
    const screenW = this.canvas.width;
    const screenH = this.canvas.height;

    // Map theme backgrounds
    const grad = this.ctx.createLinearGradient(0, 0, 0, screenH);
    grad.addColorStop(0, this.currentTheme.bgGrad[0]);
    grad.addColorStop(1, this.currentTheme.bgGrad[1]);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, screenW, screenH);

    // Draw dynamic background elements (map-specific atmospheric effects)
    this.renderDynamicBackground(screenW, screenH);

    // Calculate scaling coordinates based on aspect ratio
    let baseZoom = 1;
    let trackOffset = 0;

    if (screenW / screenH > 1.2) {
      // Landscape: Center the track
      baseZoom = screenH / 800; // fit full virtual height
      trackOffset = (screenW - 500 * baseZoom) / 2;
    } else {
      // Vertical / Shorts: Scale track width to fit canvas width
      baseZoom = screenW / 500;
      trackOffset = 0;
    }

    // Combine base zoom with user's zoom multiplier (buttons/wheel/keyboard)
    const zoom = baseZoom * this.userZoomMultiplier;
    this.cameraZoom = zoom;
    this.trackOffset = trackOffset;

    // Draw environment/background grid lines in space theme across full width
    if (this.currentThemeKey === 'space') {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(102, 252, 241, 0.04)';
      this.ctx.lineWidth = 1;
      const gridSpacing = 40 * zoom;
      const offsetScroll = -(this.cameraX * zoom) % gridSpacing;
      for (let x = offsetScroll; x < screenW; x += gridSpacing) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, screenH);
        this.ctx.stroke();
      }
      for (let y = 0; y < screenH; y += gridSpacing) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(screenW, y);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // 2. Render track contents (Walls, Pegs, Boosts, Balls) inside scaled wrapper
    this.ctx.save();
    this.ctx.translate(trackOffset, 0);
    this.ctx.scale(zoom, zoom);

    const camX = this.cameraX;

    if (this.track) {
      // Draw Zones (boost pads, ice zones, finish checkered area)
      this.track.zones.forEach(zone => {
        // Draw offset relative to camera (scroll on X axis)
        const zX = zone.x - camX;
        const zoneCullBuffer = Math.max(400, 500 / this.userZoomMultiplier);
        if (zX + zone.width < -zoneCullBuffer || zX > screenW / zoom + zoneCullBuffer) return; // offscreen cull

        if (zone.type === 'boost') {
          // Boost zone — green fill, forward arrows
          this.ctx.save();
          this.ctx.fillStyle = 'rgba(46,204,113,0.25)';
          this.ctx.fillRect(zX, zone.y, zone.width, zone.height);
          this.ctx.strokeStyle = '#2ecc71';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(zX, zone.y, zone.width, zone.height);
          // Forward arrows (right)
          const animOffset = (Date.now() / 6) % 30;
          this.ctx.strokeStyle = 'rgba(46,204,113,0.50)';
          this.ctx.lineWidth = 2.5;
          for (let ax = zX + animOffset; ax < zX + zone.width; ax += 30) {
            const acy = zone.y + zone.height / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(ax - 10, acy - 8);
            this.ctx.lineTo(ax, acy);
            this.ctx.lineTo(ax - 10, acy + 8);
            this.ctx.stroke();
          }
          // label
          this.ctx.fillStyle = '#2ecc71';
          this.ctx.font = 'bold 14px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('BOOST', zX + zone.width / 2, zone.y + zone.height / 2);
          this.ctx.restore();
        } else if (zone.type === 'slow' || zone.type === 'sand') {
          // Slow zone — red/grey fill, backward arrows
          this.ctx.save();
          this.ctx.fillStyle = 'rgba(231,76,60,0.18)';
          this.ctx.fillRect(zX, zone.y, zone.width, zone.height);
          this.ctx.strokeStyle = '#c0392b';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(zX, zone.y, zone.width, zone.height);
          // Backward arrows (left)
          const animOff2 = (Date.now() / 6) % 30;
          this.ctx.strokeStyle = 'rgba(231,76,60,0.45)';
          this.ctx.lineWidth = 2.5;
          for (let ax = zX + animOff2; ax < zX + zone.width; ax += 30) {
            const acy = zone.y + zone.height / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(ax + 10, acy - 8);
            this.ctx.lineTo(ax, acy);
            this.ctx.lineTo(ax + 10, acy + 8);
            this.ctx.stroke();
          }
          this.ctx.fillStyle = '#c0392b';
          this.ctx.font = 'bold 14px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('SLOW', zX + zone.width / 2, zone.y + zone.height / 2);
          this.ctx.restore();
        } else if (zone.type === 'ice') {
          // Ice zone — label only
          this.ctx.fillStyle = 'rgba(100,200,255,0.2)';
          this.ctx.font = 'bold 11px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('ICE', zX + zone.width / 2, zone.y + zone.height / 2);
        } else if (zone.type === 'oil') {
          // Oil zone — label only
          this.ctx.fillStyle = 'rgba(100,80,60,0.2)';
          this.ctx.font = 'bold 11px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('OIL', zX + zone.width / 2, zone.y + zone.height / 2);
        } else if (zone.type === 'finish') {
          const finishX = zone.x - camX;
          const finishMidX = finishX + zone.width / 2;
          const bounds = this.physics.getWallBoundaries(zone.x, this.track);
          const fTop = bounds ? bounds.topY : 50;
          const fBot = bounds ? bounds.bottomY : 550;
          const fH = fBot - fTop;
          const time = Date.now() * 0.003;

          // Checkered strip (full track height, narrow)
          const cs = 12;
          for (let by = fTop; by < fBot; by += cs) {
            for (let bx = 0; bx < zone.width; bx += cs) {
              const isWhite = ((bx / cs) + (Math.floor((by - fTop) / cs))) % 2 === 0;
              this.ctx.fillStyle = isWhite ? '#ffffff' : '#1a1a1a';
              this.ctx.fillRect(finishX + bx, by, cs, cs);
            }
          }

          // Gold shimmer overlay
          this.ctx.save();
          this.ctx.shadowColor = '#ffd700';
          this.ctx.shadowBlur = 40;
          this.ctx.fillStyle = `rgba(255,215,0,${0.15 + Math.sin(time) * 0.05})`;
          this.ctx.fillRect(finishX, fTop, zone.width, fH);
          this.ctx.shadowBlur = 0;
          this.ctx.restore();

          // Pole on left side
          this.ctx.save();
          const poleX = finishX - 6;
          this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
          this.ctx.shadowBlur = 8;
          const poleGrad = this.ctx.createLinearGradient(poleX, 0, poleX + 6, 0);
          poleGrad.addColorStop(0, '#2c3e50');
          poleGrad.addColorStop(0.5, '#95a5a6');
          poleGrad.addColorStop(1, '#2c3e50');
          this.ctx.fillStyle = poleGrad;
          this.ctx.fillRect(poleX, fTop - 20, 6, fH + 40);
          // Gold cap
          this.ctx.fillStyle = '#ffd700';
          this.ctx.shadowColor = '#ffd700';
          this.ctx.shadowBlur = 20;
          this.ctx.fillRect(poleX - 1, fTop - 24, 8, 6);
          this.ctx.shadowBlur = 0;
          this.ctx.restore();

          // Pole on right side
          this.ctx.save();
          const poleX2 = finishX + zone.width;
          this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
          this.ctx.shadowBlur = 8;
          const poleGrad2 = this.ctx.createLinearGradient(poleX2, 0, poleX2 + 6, 0);
          poleGrad2.addColorStop(0, '#2c3e50');
          poleGrad2.addColorStop(0.5, '#95a5a6');
          poleGrad2.addColorStop(1, '#2c3e50');
          this.ctx.fillStyle = poleGrad2;
          this.ctx.fillRect(poleX2, fTop - 20, 6, fH + 40);
          // Gold cap
          this.ctx.fillStyle = '#ffd700';
          this.ctx.shadowColor = '#ffd700';
          this.ctx.shadowBlur = 20;
          this.ctx.fillRect(poleX2 - 1, fTop - 24, 8, 6);
          this.ctx.shadowBlur = 0;
          this.ctx.restore();

          // Checkered flag on left pole
          this.ctx.save();
          const flagW = 32;
          const flagH = 24;
          const flagX = poleX + 6;
          const flagY = fTop - 20;
          for (let fy = 0; fy < flagH; fy += 6) {
            for (let fx = 0; fx < flagW; fx += 6) {
              const isWhite = ((fx / 6) + (Math.floor(fy / 6))) % 2 === 0;
              this.ctx.fillStyle = isWhite ? '#ffffff' : '#1a1a1a';
              this.ctx.fillRect(flagX + fx, flagY + fy, 6, 6);
            }
          }
          this.ctx.restore();

          // Checkered flag on right pole
          this.ctx.save();
          const flagX2 = poleX2 - flagW;
          for (let fy = 0; fy < flagH; fy += 6) {
            for (let fx = 0; fx < flagW; fx += 6) {
              const isWhite = ((fx / 6) + (Math.floor(fy / 6))) % 2 === 0;
              this.ctx.fillStyle = isWhite ? '#ffffff' : '#1a1a1a';
              this.ctx.fillRect(flagX2 + fx, flagY + fy, 6, 6);
            }
          }
          this.ctx.restore();

          // FINISH banner between poles
          this.ctx.save();
          const bannerH = 40;
          const bannerY = fTop + (fH - bannerH) / 2;
          this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
          this.ctx.shadowBlur = 12;
          const bGrad = this.ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerH);
          bGrad.addColorStop(0, '#e74c3c');
          bGrad.addColorStop(0.5, '#c0392b');
          bGrad.addColorStop(1, '#e74c3c');
          this.ctx.fillStyle = bGrad;
          this.ctx.fillRect(finishX + 4, bannerY, zone.width - 8, bannerH);
          this.ctx.shadowBlur = 0;
          this.ctx.strokeStyle = '#ffd700';
          this.ctx.lineWidth = 3;
          this.ctx.shadowColor = '#ffd700';
          this.ctx.shadowBlur = 8;
          this.ctx.strokeRect(finishX + 4, bannerY, zone.width - 8, bannerH);
          this.ctx.shadowBlur = 0;
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 28px Outfit, Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
          this.ctx.shadowBlur = 6;
          this.ctx.fillText('FINISH', finishX + zone.width / 2, bannerY + bannerH / 2);
          this.ctx.shadowBlur = 0;
          this.ctx.restore();
        } else if (zone.type === 'wind') {
          // Wind zone — semi-transparent fill with directional arrows and flow animation
          const t = Date.now() * 0.005;
          const isRight = zone.force > 0;
          const arrowChar = isRight ? '\u2192' : '\u2190';
          const scrollDir = isRight ? 1 : -1;
          // Zone fill
          this.ctx.save();
          this.ctx.fillStyle = isRight ? 'rgba(46,204,113,0.12)' : 'rgba(231,76,60,0.12)';
          this.ctx.fillRect(zX, zone.y, zone.width, zone.height);
          // Flow lines (animated dots moving in wind direction)
          this.ctx.fillStyle = isRight ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.3)';
          for (let ay = zone.y + 14; ay < zone.y + zone.height - 6; ay += 30) {
            const ax = zX + (((t * 50 * scrollDir + ay * 0.5) % zone.width) + zone.width) % zone.width;
            this.ctx.beginPath();
            this.ctx.arc(ax, ay, 3, 0, Math.PI * 2);
            this.ctx.fill();
          }
          // Arrow direction indicators
          this.ctx.fillStyle = isRight ? 'rgba(46,204,113,0.5)' : 'rgba(231,76,60,0.5)';
          this.ctx.font = 'bold 14px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          for (let ay = zone.y + 20; ay < zone.y + zone.height; ay += 28) {
            const ax = zX + (((t * 40 * scrollDir + ay * 0.4) % zone.width) + zone.width) % zone.width;
            this.ctx.fillText(arrowChar, ax, ay);
          }
          // Direction label
          this.ctx.fillStyle = isRight ? 'rgba(46,204,113,0.6)' : 'rgba(231,76,60,0.6)';
          this.ctx.font = 'bold 10px Montserrat, sans-serif';
          this.ctx.fillText(isRight ? 'WIND +' : 'WIND -', zX + zone.width / 2, zone.y + zone.height / 2);
          this.ctx.restore();
        } else if (zone.type === 'portal') {
          // Portal — purple vortex, direction-agnostic
          this.ctx.save();
          const cx = zX + zone.width / 2;
          const cy = zone.y + zone.height / 2;
          const r = zone.radius || 20;
          const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.08;
          const pr = r * pulse;
          // Purple accretion disk
          const diskGrad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, pr * 1.6);
          diskGrad.addColorStop(0, 'rgba(0,0,0,0)');
          diskGrad.addColorStop(0.5, 'rgba(80,0,80,0.4)');
          diskGrad.addColorStop(0.8, 'rgba(120,0,120,0.2)');
          diskGrad.addColorStop(1, 'rgba(0,0,0,0)');
          this.ctx.fillStyle = diskGrad;
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, pr * 1.6, 0, Math.PI * 2);
          this.ctx.fill();
          // Dark inner hole
          const holeGrad = this.ctx.createRadialGradient(cx - pr * 0.2, cy - pr * 0.2, 0, cx, cy, pr);
          holeGrad.addColorStop(0, '#000000');
          holeGrad.addColorStop(0.7, '#1a0a1a');
          holeGrad.addColorStop(1, '#300030');
          this.ctx.fillStyle = holeGrad;
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, pr, 0, Math.PI * 2);
          this.ctx.fill();
          // Glow ring (purple)
          const portalAlpha = 0.4 + Math.sin(Date.now() * 0.008) * 0.15;
          this.ctx.strokeStyle = 'rgba(155,89,182,' + portalAlpha + ')';
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, pr + 3, 0, Math.PI * 2);
          this.ctx.stroke();
          // Swirl effect lines
          this.ctx.strokeStyle = 'rgba(155,89,182,0.25)';
          this.ctx.lineWidth = 1;
          const swirlPhase = Date.now() * 0.003;
          for (let s = 0; s < 3; s++) {
            this.ctx.beginPath();
            for (let a = 0; a < Math.PI * 1.5; a += 0.1) {
              const sr = pr * 0.9 + Math.sin(a * 3 + swirlPhase + s * 2) * pr * 0.3;
              const sx = cx + Math.cos(a + swirlPhase + s * 2) * sr;
              const sy = cy + Math.sin(a + swirlPhase + s * 2) * sr;
              if (a === 0) this.ctx.moveTo(sx, sy);
              else this.ctx.lineTo(sx, sy);
            }
            this.ctx.stroke();
          }
          // Portal label
          this.ctx.fillStyle = 'rgba(155,89,182,0.8)';
          this.ctx.font = 'bold 10px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('PORTAL', cx, cy + pr + 16);
          this.ctx.restore();
        } else if (zone.type === 'shortcutEntry') {
          // Removed shortcut label — replaced with wind zone logic
        } else if (zone.type === 'shortcutExit') {
          // Removed shortcut label — replaced with wind zone logic
        } else if (zone.type === 'bottleneck') {
          // Narrow corridor zone — subtle wall indicators
          this.ctx.save();
          this.ctx.fillStyle = 'rgba(231,76,60,0.08)';
          this.ctx.fillRect(zX, zone.y, zone.width, zone.height);
          this.ctx.strokeStyle = 'rgba(231,76,60,0.25)';
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([4, 6]);
          this.ctx.strokeRect(zX, zone.y, zone.width, zone.height);
          this.ctx.setLineDash([]);
          this.ctx.fillStyle = 'rgba(231,76,60,0.15)';
          this.ctx.font = 'bold 9px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('MERGE', zX + zone.width / 2, zone.y + zone.height / 2);
          this.ctx.restore();
        } else if (zone.type === 'jump') {
          // Jump zone — upward arrow and light fill
          this.ctx.save();
          this.ctx.fillStyle = 'rgba(155,89,182,0.15)';
          this.ctx.fillRect(zX, zone.y, zone.width, zone.height);
          this.ctx.fillStyle = 'rgba(155,89,182,0.6)';
          this.ctx.font = 'bold 14px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          const bounce = Math.sin(Date.now() * 0.006) * 3;
          this.ctx.fillText('\u2191', zX + zone.width / 2, zone.y + zone.height / 2 + bounce);
          this.ctx.restore();
        } else if (zone.type === 'launch') {
          // Bounce pad — upward launch zone
          this.ctx.save();
          const bounceY = Math.sin(Date.now() * 0.01) * 2;
          this.ctx.fillStyle = 'rgba(46,204,113,0.25)';
          this.ctx.fillRect(zX, zone.y + bounceY, zone.width, zone.height);
          this.ctx.fillStyle = 'rgba(46,204,113,0.7)';
          this.ctx.font = 'bold 12px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('\u21E7', zX + zone.width / 2, zone.y + zone.height / 2 + bounceY);
          this.ctx.restore();
        }
      });

      // Draw Static Pegs (Bumpers) — white, shiny, glossy
      this.track.pegs.forEach(peg => {
        const pegX = peg.x - camX;
        const pegCullBuffer = Math.max(200, 300 / this.userZoomMultiplier);
        if (pegX + peg.radius < -pegCullBuffer || pegX - peg.radius > screenW / zoom + pegCullBuffer) return;

        this.ctx.save();
        // White base with glossy radial gradient
        const pGrad = this.ctx.createRadialGradient(
          pegX - peg.radius * 0.3, peg.y - peg.radius * 0.3, peg.radius * 0.1,
          pegX, peg.y, peg.radius
        );
        pGrad.addColorStop(0, '#ffffff');
        pGrad.addColorStop(0.5, '#e8e8e8');
        pGrad.addColorStop(1, '#b0b0b0');
        this.ctx.fillStyle = pGrad;
        this.ctx.beginPath();
        this.ctx.arc(pegX, peg.y, peg.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Shinier outer ring
        this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(pegX, peg.y, peg.radius - 1, 0, Math.PI * 2);
        this.ctx.stroke();

        // Specular highlight dot
        this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
        this.ctx.beginPath();
        this.ctx.arc(pegX - peg.radius * 0.25, peg.y - peg.radius * 0.3, peg.radius * 0.2, 0, Math.PI * 2);
        this.ctx.fill();

        // Outer glow ring for bouncy bumpers
        if (peg.bouncy) {
          this.ctx.shadowColor = '#ffffff';
          this.ctx.shadowBlur = 14;
          this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(pegX, peg.y, peg.radius + 3, 0, Math.PI * 2);
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
        }
        this.ctx.restore();

        // Draw special peg markers
        if (peg.isWindMarker) {
          this.ctx.save();
          this.ctx.strokeStyle = 'rgba(155, 89, 182, 0.5)';
          this.ctx.lineWidth = 2;
          this.ctx.setLineDash([3, 3]);
          this.ctx.beginPath();
          this.ctx.moveTo(pegX - 15, peg.y);
          this.ctx.lineTo(pegX + 15, peg.y);
          this.ctx.stroke();
          this.ctx.restore();
        }
        if (peg.isLoopMarker) {
          this.ctx.save();
          this.ctx.strokeStyle = '#f39c12';
          this.ctx.lineWidth = 8;
          this.ctx.shadowColor = 'rgba(243,156,18,0.5)';
          this.ctx.shadowBlur = 14;
          this.ctx.beginPath();
          this.ctx.arc(pegX + 20, peg.y, 50, Math.PI * 0.75, Math.PI * 0.25, true);
          this.ctx.stroke();
          // Glow arc behind
          this.ctx.shadowBlur = 24;
          this.ctx.strokeStyle = 'rgba(243,156,18,0.2)';
          this.ctx.lineWidth = 12;
          this.ctx.beginPath();
          this.ctx.arc(pegX + 20, peg.y, 50, Math.PI * 0.75, Math.PI * 0.25, true);
          this.ctx.stroke();
          this.ctx.restore();
        }
      });

      // Draw Obstacles (moving barriers, spinner anchors, meteors/rocks)
      this.track.obstacles.forEach(obs => {
        const obsX = obs.x - camX;
        const obsCullBuffer = Math.max(300, 400 / this.userZoomMultiplier);
        if (obsX + 200 < -obsCullBuffer || obsX - 200 > screenW / zoom + obsCullBuffer) return;

        if (obs.type === 'spinner') {
          // Fall Guys whirlygig-style colorful rotating VERTICAL bar
          this.ctx.save();
          // Neon glow behind spinner
          this.ctx.shadowColor = '#6c5ce7';
          this.ctx.shadowBlur = 30;
          this.ctx.fillStyle = 'rgba(108,92,231,0.04)';
          this.ctx.fillRect(obsX - 4, obs.y - obs.length / 2, 8, obs.length);
          this.ctx.shadowBlur = 0;
          // Rotate spinner
          this.ctx.translate(obsX, obs.y);
          this.ctx.rotate(obs.angle);
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 6;
          const barWidth = 12;
          const halfLen = obs.length / 2;
          // Neon stripes (no red)
          const colors = ['#74b9ff', '#a29bfe', '#6c5ce7', '#0984e3', '#74b9ff'];
          const segW = obs.length / colors.length;
          for (let c = 0; c < colors.length; c++) {
            this.ctx.fillStyle = colors[c];
            this.ctx.fillRect(-barWidth / 2, -halfLen + c * segW, barWidth, segW);
          }
          this.ctx.restore();
          // Center anchor
          this.ctx.save();
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 4;
          this.ctx.beginPath();
          this.ctx.arc(obsX, obs.y, barWidth / 2 + 2, 0, Math.PI * 2);
          this.ctx.fillStyle = '#2c3e50';
          this.ctx.fill();
          this.ctx.strokeStyle = '#f39c12';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          this.ctx.restore();
        } else if (obs.type === 'barrier') {
          // Fall Guys-style colorful moving block with neon glow
          this.ctx.save();
          // Outer neon glow
          this.ctx.shadowColor = '#0984e3';
          this.ctx.shadowBlur = 25;
          this.ctx.fillStyle = 'rgba(9,132,227,0.05)';
          if (obs.isVertical) {
            this.ctx.fillRect(obsX - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
          } else {
            this.ctx.fillRect(obsX - obs.width / 2, obs.y, obs.width, obs.height);
          }
          this.ctx.shadowBlur = 0;
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 8;
          this.ctx.shadowOffsetY = 2;
          if (obs.isVertical) {
            // Vertical barrier: tall thin column
            const bGrad = this.ctx.createLinearGradient(obsX, obs.y - obs.height / 2, obsX, obs.y + obs.height / 2);
            bGrad.addColorStop(0, '#74b9ff');
            bGrad.addColorStop(0.5, '#0984e3');
            bGrad.addColorStop(1, '#0652DD');
            this.ctx.fillStyle = bGrad;
            this.ctx.fillRect(obsX - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
            // Yellow warning stripes (horizontal instead of vertical)
            this.ctx.fillStyle = '#ffeaa7';
            const stripeH = 8;
            for (let sy = obs.y - obs.height / 2 + 5; sy < obs.y + obs.height / 2; sy += stripeH * 2) {
              this.ctx.fillRect(obsX - obs.width / 2 + 2, sy, obs.width - 4, stripeH);
            }
            // Top/bottom caps
            this.ctx.fillStyle = '#2d3436';
            this.ctx.fillRect(obsX - obs.width / 2 - 2, obs.y - obs.height / 2 - 2, obs.width + 4, 4);
            this.ctx.fillRect(obsX - obs.width / 2 - 2, obs.y + obs.height / 2 - 2, obs.width + 4, 4);
          } else {
            // Horizontal barrier (original)
            const bGrad = this.ctx.createLinearGradient(obsX, obs.y, obsX, obs.y + obs.height);
            bGrad.addColorStop(0, '#74b9ff');
            bGrad.addColorStop(0.5, '#0984e3');
            bGrad.addColorStop(1, '#0652DD');
            this.ctx.fillStyle = bGrad;
            this.ctx.fillRect(obsX - obs.width / 2, obs.y, obs.width, obs.height);
            // Yellow warning stripes with angle
            this.ctx.fillStyle = '#ffeaa7';
            const stripeW = 8;
            for (let sx = obsX - obs.width / 2 + 5; sx < obsX + obs.width / 2; sx += stripeW * 2) {
              this.ctx.beginPath();
              this.ctx.moveTo(sx, obs.y);
              this.ctx.lineTo(sx + stripeW, obs.y);
              this.ctx.lineTo(sx + stripeW - 4, obs.y + obs.height);
              this.ctx.lineTo(sx - 4, obs.y + obs.height);
              this.ctx.fill();
            }
            // Rivets
            this.ctx.fillStyle = '#2d3436';
            [
              [obsX - obs.width / 2 + 6, obs.y + 4],
              [obsX + obs.width / 2 - 6, obs.y + 4],
              [obsX - obs.width / 2 + 6, obs.y + obs.height - 4],
              [obsX + obs.width / 2 - 6, obs.y + obs.height - 4]
            ].forEach(([rx, ry]) => {
              this.ctx.beginPath();
              this.ctx.arc(rx, ry, 2, 0, Math.PI * 2);
              this.ctx.fill();
            });
          }
          this.ctx.restore();
        } else if (obs.type === 'breakdoor') {
          if (obs.broken) {
            // Render fragments if still alive
            if (obs._fragments) {
              obs._fragments.forEach(f => {
                if (f.life <= 0) return;
                const alpha = Math.max(0, f.life / f.maxLife);
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.translate(f.x - camX, f.y);
                this.ctx.rotate(f.rotation);
                this.ctx.fillStyle = f.color;
                this.ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size);
                this.ctx.restore();
              });
            }
            return;
          }
          this.ctx.save();
          const dW = obs.width;
          const dH = obs.height;
          const dX = obsX;
          const dY = obs.y;
          // Red/orange breakable barrier body
          const doorGrad = this.ctx.createLinearGradient(dX - dW / 2, dY, dX + dW / 2, dY);
          doorGrad.addColorStop(0, '#c0392b');
          doorGrad.addColorStop(0.3, '#e74c3c');
          doorGrad.addColorStop(0.5, '#ff6b6b');
          doorGrad.addColorStop(0.7, '#e74c3c');
          doorGrad.addColorStop(1, '#c0392b');
          this.ctx.fillStyle = doorGrad;
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 6;
          this.ctx.fillRect(dX - dW / 2, dY - dH / 2, dW, dH);
          this.ctx.shadowBlur = 0;
          // Cream/yellow border
          this.ctx.strokeStyle = '#f1c40f';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(dX - dW / 2, dY - dH / 2, dW, dH);
          // Display HITS count
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 11px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
          this.ctx.shadowBlur = 4;
          this.ctx.fillText('HITS ' + obs.hp, dX, dY);
          this.ctx.shadowBlur = 0;
          // Crack overlay based on damage level
          if (obs._crackLevel >= 1) {
            this.ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(dX - dW * 0.3, dY - dH * 0.35);
            this.ctx.lineTo(dX + dW * 0.1, dY - dH * 0.1);
            this.ctx.lineTo(dX - dW * 0.2, dY + dH * 0.15);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(dX + dW * 0.2, dY - dH * 0.3);
            this.ctx.lineTo(dX + dW * 0.35, dY + dH * 0.05);
            this.ctx.stroke();
          }
          if (obs._crackLevel >= 2) {
            this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(dX - dW * 0.25, dY - dH * 0.1);
            this.ctx.lineTo(dX + dW * 0.3, dY + dH * 0.25);
            this.ctx.lineTo(dX - dW * 0.1, dY + dH * 0.4);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(dX + dW * 0.1, dY - dH * 0.2);
            this.ctx.lineTo(dX - dW * 0.15, dY + dH * 0.3);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(dX + dW * 0.3, dY + dH * 0.1);
            this.ctx.lineTo(dX - dW * 0.05, dY - dH * 0.15);
            this.ctx.stroke();
          }
          if (obs._crackLevel >= 3) {
            this.ctx.strokeStyle = 'rgba(0,0,0,0.7)';
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.moveTo(dX - dW * 0.4, dY - dH * 0.2);
            this.ctx.lineTo(dX + dW * 0.4, dY + dH * 0.3);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(dX + dW * 0.35, dY - dH * 0.15);
            this.ctx.lineTo(dX - dW * 0.3, dY + dH * 0.35);
            this.ctx.stroke();
          }
          if (obs._crackLevel >= 4) {
            this.ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(dX - dW * 0.2, dY - dH * 0.4);
            this.ctx.lineTo(dX + dW * 0.15, dY + dH * 0.45);
            this.ctx.stroke();
          }
          this.ctx.restore();
        } else if (obs.type === 'cardboard') {
          if (obs.broken) return;
          this.ctx.save();
          const cW = obs.width;
          const cH = obs.height;
          const cX = obsX;
          const cY = obs.y;
          // Cardboard body — pink/yellow gradient tint
          const cbGrad = this.ctx.createLinearGradient(cX - cW / 2, cY, cX + cW / 2, cY);
          cbGrad.addColorStop(0, '#ff7675');
          cbGrad.addColorStop(0.3, '#fd79a8');
          cbGrad.addColorStop(0.5, '#fdcb6e');
          cbGrad.addColorStop(0.7, '#ffeaa7');
          cbGrad.addColorStop(1, '#fd79a8');
          this.ctx.fillStyle = cbGrad;
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 6;
          this.ctx.fillRect(cX - cW / 2, cY - cH / 2, cW, cH);
          this.ctx.shadowBlur = 0;
          // Dark border frame
          this.ctx.strokeStyle = '#2d3436';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(cX - cW / 2, cY - cH / 2, cW, cH);
          // Window cross (+ sign)
          this.ctx.strokeStyle = '#2d3436';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(cX - cW / 2 + 5, cY);
          this.ctx.lineTo(cX + cW / 2 - 5, cY);
          this.ctx.moveTo(cX, cY - cH / 2 + 5);
          this.ctx.lineTo(cX, cY + cH / 2 - 5);
          this.ctx.stroke();
          // Corner brackets
          this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          this.ctx.lineWidth = 1;
          const bracket = (x, y, flipX, flipY) => {
            this.ctx.beginPath();
            this.ctx.moveTo(x + (flipX ? -4 : 4), y);
            this.ctx.lineTo(x, y);
            this.ctx.lineTo(x, y + (flipY ? -4 : 4));
            this.ctx.stroke();
          };
          bracket(cX - cW / 2 + 3, cY - cH / 2 + 3, false, false);
          bracket(cX + cW / 2 - 3, cY - cH / 2 + 3, true, false);
          bracket(cX - cW / 2 + 3, cY + cH / 2 - 3, false, true);
          bracket(cX + cW / 2 - 3, cY + cH / 2 - 3, true, true);
          this.ctx.restore();
        } else if (obs.type === 'c_bumper') {
          // Rotating C-bumper — small semicircular arc like a pinball bumper
          const R = obs.radius || 70;
          const rot = obs.rotation || 0;
          const lw = obs.thickness || 8;
          this.ctx.save();
          this.ctx.translate(obsX, obs.y);
          this.ctx.rotate(rot);
          // Outer glow ring
          this.ctx.shadowColor = 'rgba(46,204,113,0.4)';
          this.ctx.shadowBlur = 20;
          this.ctx.strokeStyle = 'rgba(46,204,113,0.15)';
          this.ctx.lineWidth = lw + 6;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, R, -Math.PI * 0.5, Math.PI * 0.5);
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
          // Main bumper arc (green/amber like pinball)
          this.ctx.shadowColor = 'rgba(46,204,113,0.3)';
          this.ctx.shadowBlur = 10;
          const grad = this.ctx.createLinearGradient(-R, 0, R, 0);
          grad.addColorStop(0, '#2ecc71');
          grad.addColorStop(0.5, '#f1c40f');
          grad.addColorStop(1, '#2ecc71');
          this.ctx.strokeStyle = grad;
          this.ctx.lineWidth = lw;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, R, -Math.PI * 0.5, Math.PI * 0.5);
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
          // Highlight line
          this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, R - lw * 0.3, -Math.PI * 0.4, Math.PI * 0.1);
          this.ctx.stroke();
          // Center axle dot
          this.ctx.fillStyle = '#ecf0f1';
          this.ctx.shadowColor = 'rgba(46,204,113,0.5)';
          this.ctx.shadowBlur = 12;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
          // Open end markers
          for (const endAngle of [-Math.PI * 0.5, Math.PI * 0.5]) {
            const ex = Math.cos(endAngle) * R;
            const ey = Math.sin(endAngle) * R;
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.beginPath();
            this.ctx.arc(ex, ey, 3, 0, Math.PI * 2);
            this.ctx.fill();
          }
          this.ctx.restore();
        } else if (obs.type === 'boost_pipe') {
          // Yellow hazard-stripe pipe (same material as C-bumpers)
          const halfW = obs.width / 2;
          const topY = obs.y - halfW;
          const botY = obs.y + halfW;
          this.ctx.save();
          // Channel background fill (amber)
          const bgGrad = this.ctx.createLinearGradient(obsX, topY, obsX, botY);
          bgGrad.addColorStop(0, 'rgba(243,156,18,0.12)');
          bgGrad.addColorStop(0.5, 'rgba(243,156,18,0.20)');
          bgGrad.addColorStop(1, 'rgba(243,156,18,0.12)');
          this.ctx.fillStyle = bgGrad;
          this.ctx.fillRect(obsX, topY, obs.length, obs.width);
          // Top wall — yellow hazard stripe
          this.ctx.strokeStyle = '#f39c12';
          this.ctx.lineWidth = 6;
          this.ctx.shadowColor = 'rgba(243,156,18,0.4)';
          this.ctx.shadowBlur = 10;
          this.ctx.beginPath();
          this.ctx.moveTo(obsX, topY);
          this.ctx.lineTo(obsX + obs.length, topY);
          this.ctx.stroke();
          // Bottom wall
          this.ctx.beginPath();
          this.ctx.moveTo(obsX, botY);
          this.ctx.lineTo(obsX + obs.length, botY);
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
          // Black hazard stripes along top and bottom walls
          this.ctx.strokeStyle = '#2c3e50';
          this.ctx.lineWidth = 4;
          this.ctx.setLineDash([12, 12]);
          this.ctx.beginPath();
          this.ctx.moveTo(obsX, topY);
          this.ctx.lineTo(obsX + obs.length, topY);
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.moveTo(obsX, botY);
          this.ctx.lineTo(obsX + obs.length, botY);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
          // Entrance markers (vertical yellow bars)
          this.ctx.strokeStyle = 'rgba(243,156,18,0.6)';
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.moveTo(obsX, topY);
          this.ctx.lineTo(obsX, botY);
          this.ctx.stroke();
          // Exit glow (yellow pulse)
          const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.2;
          this.ctx.fillStyle = `rgba(243,156,18,${0.12 * pulse})`;
          this.ctx.shadowColor = 'rgba(243,156,18,0.3)';
          this.ctx.shadowBlur = 25;
          this.ctx.fillRect(obsX + obs.length - 55, topY + 2, 50, obs.width - 4);
          this.ctx.shadowBlur = 0;
          // Direction arrows (amber)
          this.ctx.fillStyle = `rgba(243,156,18,${0.4 + 0.15 * pulse})`;
          this.ctx.font = 'bold 16px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          const arrowX = obsX + obs.length * 0.4;
          for (let ay = topY + 14; ay < botY - 8; ay += 20) {
            this.ctx.fillText('\u2192', arrowX, ay);
          }
          this.ctx.restore();
        } else if (obs.type === 'rock') {
          this.ctx.save();
          const r = obs.radius;
          const cx = obsX, cy = obs.y;
          if (obs.isMeteor) {
            const trailLen = Math.abs(obs.vy) * 4;
            const trailGrad = this.ctx.createLinearGradient(obsX, obs.y - trailLen, obsX, obs.y);
            trailGrad.addColorStop(0, 'rgba(0,0,0,0)');
            trailGrad.addColorStop(0.4, 'rgba(100,100,100,0.15)');
            trailGrad.addColorStop(0.8, 'rgba(200,200,200,0.3)');
            trailGrad.addColorStop(1, 'rgba(255,255,255,0.5)');
            this.ctx.fillStyle = trailGrad;
            this.ctx.beginPath();
            this.ctx.moveTo(cx - r * 0.6, cy);
            this.ctx.lineTo(cx + r * 0.6, cy);
            this.ctx.lineTo(cx + r * 0.1, cy - trailLen);
            this.ctx.lineTo(cx - r * 0.1, cy - trailLen);
            this.ctx.closePath();
            this.ctx.fill();
          }
          // Draw football from image
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
          this.ctx.clip();
          const footImg = this.footballImg;
          if (footImg && footImg !== 'failed' && footImg.complete && footImg.naturalWidth > 0) {
            this.ctx.drawImage(footImg, cx - r, cy - r, r * 2, r * 2);
          } else {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            this.ctx.fill();
          }
          if (obs.isMeteor) {
            this.ctx.shadowColor = 'rgba(255,255,255,0.4)';
            this.ctx.shadowBlur = 30;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255,255,255,0.03)';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
          }
          this.ctx.restore();
        } else if (obs.type === 'flap') {
          // Door-style: opens to block (horizontal), closes to allow (vertical)
          // angle=0: vertical along track (OPEN/passable)
          // angle=PI/2: horizontal across track (CLOSED/blocking)
          this.ctx.save();
          this.ctx.shadowColor = 'rgba(0,0,0,0.35)';
          this.ctx.shadowBlur = 10;

          const plateW = obs.plateWidth || 60;
          const plateH = obs.plateHeight || 70;
          const hingeX = obsX;
          const hingeY = obs.y;

          this.ctx.translate(hingeX, hingeY);
          this.ctx.rotate(obs.angle || 0);

          // Fall Guys-style colorful door
          const g = this.ctx.createLinearGradient(-plateW / 2, -plateH / 2, plateW / 2, plateH / 2);
          g.addColorStop(0, '#fd79a8');
          g.addColorStop(0.5, '#e84393');
          g.addColorStop(1, '#b71540');
          this.ctx.fillStyle = g;

          // Door body
          this.ctx.fillRect(-plateW / 2, -plateH / 2, plateW, plateH);

          // Safety stripes on one face
          this.ctx.fillStyle = 'rgba(241,196,15,0.9)';
          const stripe = Math.max(6, plateW * 0.12);
          for (let sx = -plateW / 2 + 4; sx < plateW / 2 - 4; sx += stripe) {
            this.ctx.fillRect(sx, -plateH / 2 + 6, stripe * 0.55, plateH - 12);
          }

          // Hinge pin
          this.ctx.fillStyle = '#2c3e50';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        } else if (obs.type === 'barrel') {
          // Fall Guys-style colorful rolling barrel
          this.ctx.save();
          this.ctx.translate(obsX, obs.y);
          this.ctx.rotate(obs.spin);
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 6;
          this.ctx.shadowOffsetY = 2;
          // Neon candy stripes
          const stripColors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'];
          const stripH = obs.radius * 1.4 / stripColors.length;
          for (let s = 0; s < stripColors.length; s++) {
            this.ctx.fillStyle = stripColors[s];
            this.ctx.fillRect(-obs.radius, -obs.radius * 0.7 + s * stripH, obs.radius * 2, stripH);
          }
          // Bands
          this.ctx.fillStyle = '#ffffff';
          this.ctx.fillRect(-obs.radius, -obs.radius * 0.65, obs.radius * 2, 3);
          this.ctx.fillRect(-obs.radius, obs.radius * 0.65 - 3, obs.radius * 2, 3);
          // Rims
          this.ctx.strokeStyle = '#2d3436';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(-obs.radius, -obs.radius * 0.7, obs.radius * 2, obs.radius * 1.4);
          // Center circle
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        } else if (obs.type === 'hammer') {
          // Big rotating hammer (no chain) — Fall Guys whirlygig style
          this.ctx.save();
          const hx = obs.headX - camX;
          // Thick metal arm from pivot to head
          const dx = obs.headX - obs.x;
          const dy = obs.headY - obs.y;
          const armLen = Math.hypot(dx, dy) || 1;
          const armAngle = Math.atan2(dy, dx);
          this.ctx.save();
          this.ctx.translate(obsX, obs.y);
          this.ctx.rotate(armAngle);
          this.ctx.fillStyle = '#95a5a6';
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 4;
          this.ctx.fillRect(0, -4, armLen, 8);
          this.ctx.shadowBlur = 0;
          this.ctx.restore();
          // Hammer head (angular hammer head, not round)
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 8;
          this.ctx.shadowOffsetY = 2;
          const hSize = obs.headRadius;
          const hw = hSize * 0.9;
          const hh = hSize * 0.5;
          const hGrad = this.ctx.createLinearGradient(hx - hw, obs.headY - hh, hx + hw, obs.headY + hh);
          hGrad.addColorStop(0, '#ffda79');
          hGrad.addColorStop(0.4, '#ff9ff3');
          hGrad.addColorStop(0.7, '#f368e0');
          hGrad.addColorStop(1, '#be2edd');
          this.ctx.fillStyle = hGrad;
          // Angular hammer head (wide rectangle with sharp corners)
          this.ctx.beginPath();
          this.ctx.moveTo(hx - hw, obs.headY - hh);
          this.ctx.lineTo(hx + hw, obs.headY - hh);
          this.ctx.lineTo(hx + hw, obs.headY + hh);
          this.ctx.lineTo(hx - hw, obs.headY + hh);
          this.ctx.closePath();
          this.ctx.fill();
          // Dark angular outline
          this.ctx.strokeStyle = '#8e44ad';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          // White stripe highlight
          this.ctx.fillStyle = 'rgba(255,255,255,0.25)';
          this.ctx.fillRect(hx - hw * 0.8, obs.headY - hh * 0.6, hw * 1.6, hh * 0.3);
          this.ctx.shadowBlur = 0;
          this.ctx.restore();
        } else if (obs.type === 'punchfist') {
          // Boxing glove on a chain (strikes horizontally)
          this.ctx.save();
          const fX = obs.fistX - camX;
          const chainLen = Math.abs(fX - obsX);
          const chainAngle = Math.atan2(obs.fistY - obs.y, fX - obsX);
          // Chain links between anchor and fist
          if (chainLen > 10) {
            this.ctx.strokeStyle = '#7f8c8d';
            this.ctx.lineWidth = 3;
            const numLinks = Math.max(3, Math.floor(chainLen / 12));
            for (let li = 0; li < numLinks; li++) {
              const t = (li + 0.5) / numLinks;
              const lx = obsX + (fX - obsX) * t;
              const ly = obs.y + (obs.fistY - obs.y) * t;
              this.ctx.save();
              this.ctx.translate(lx, ly);
              this.ctx.rotate(chainAngle);
              this.ctx.beginPath();
              // Draw an oval link
              this.ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
              this.ctx.stroke();
              this.ctx.restore();
            }
          }
          // Base anchor plate (wall mount)
          this.ctx.fillStyle = '#566573';
          this.ctx.fillRect(obsX - 14, obs.y - 16, 28, 32);
          this.ctx.strokeStyle = '#2c3e50';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(obsX - 14, obs.y - 16, 28, 32);
          // Boxing glove
          const fr = obs.fistRadius;
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 10;
          this.ctx.shadowOffsetY = 3;
          // Main glove body (red)
          const gGrad = this.ctx.createRadialGradient(fX - 4, obs.fistY - 4, 3, fX, obs.fistY, fr);
          gGrad.addColorStop(0, '#e74c3c');
          gGrad.addColorStop(0.6, '#c0392b');
          gGrad.addColorStop(1, '#922b21');
          this.ctx.fillStyle = gGrad;
          this.ctx.beginPath();
          this.ctx.arc(fX, obs.fistY, fr, 0, Math.PI * 2);
          this.ctx.fill();
          // Thumb (small circle on side)
          this.ctx.fillStyle = '#c0392b';
          this.ctx.beginPath();
          this.ctx.arc(fX - obs.direction * fr * 0.5, obs.fistY + fr * 0.2, fr * 0.3, 0, Math.PI * 2);
          this.ctx.fill();
          // White stripe across glove
          this.ctx.fillStyle = '#ffffff';
          this.ctx.globalAlpha = 0.2;
          this.ctx.beginPath();
          this.ctx.arc(fX, obs.fistY, fr * 0.5, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.globalAlpha = 1;
          // Highlight
          this.ctx.shadowBlur = 0;
          this.ctx.fillStyle = 'rgba(255,255,255,0.25)';
          this.ctx.beginPath();
          this.ctx.arc(fX - fr * 0.2, obs.fistY - fr * 0.25, fr * 0.2, 0, Math.PI * 2);
          this.ctx.fill();
          // Impact lines when fired
          if (obs.fired && chainLen > 20) {
            this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
              const lx = fX + obs.direction * (fr + 4 + i * 10);
              const ly = obs.fistY + (i - 1.5) * 7;
              this.ctx.beginPath();
              this.ctx.moveTo(lx, ly);
              this.ctx.lineTo(lx + obs.direction * 12, ly);
          this.ctx.stroke();
        }
      }
      this.ctx.restore();
        } else if (obs.type === 'trapdoor') {
          // Wall switcher: panel slides between blocking top and bottom
          const bounds = this.physics.getWallBoundaries(obs.x, this.track);
          const trackH = bounds.bottomY - bounds.topY;
          const gapH = 80; // 2.67× ball diameter open gap
          // Calculate panel height based on open/closed state
          const targetPanelH = obs.isOpen ? gapH : trackH;
          const panelH = gapH + (targetPanelH - gapH) * obs._slide;
          const panelTop = bounds.topY; // Fixed top edge, panel grows downward
          const halfW = obs.width / 2;
          // Glowing edges
          this.ctx.shadowColor = 'rgba(231,76,60,0.3)';
          this.ctx.shadowBlur = 8;
          this.ctx.fillStyle = '#2d3436';
          this.ctx.fillRect(obsX - halfW, panelTop, obs.width, panelH);
          this.ctx.shadowBlur = 0;
          // Border
          this.ctx.strokeStyle = '#e74c3c';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(obsX - halfW, panelTop, obs.width, panelH);
          // Cross-hatch pattern
          this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          this.ctx.lineWidth = 0.5;
          for (let y = panelTop + 6; y < panelTop + panelH - 6; y += 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(obsX - halfW + 4, y);
            this.ctx.lineTo(obsX + halfW - 4, y);
            this.ctx.stroke();
          }
          // Warning flash during transition
          if (obs._warningFlash) {
            this.ctx.fillStyle = 'rgba(255,50,50,0.4)';
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 25;
            this.ctx.fillRect(obsX - halfW, panelTop, obs.width, panelH);
            this.ctx.shadowBlur = 0;
          }
          this.ctx.restore();
        }
      });

      // Draw Track Surface as filled shape with thin boundaries
      const wallAlpha = 0.35;
      const wallRgba = this.currentTheme.wallColor;
      this.ctx.save();
      // Fill track surface (connects top and bottom boundaries)
      if (this.track.topPoints.length > 1) {
        const cullBuf = 600;
        const virtRight = screenW / zoom;
        // Use only visible wall points to build a filled polygon
        const visibleTop = [];
        const visibleBot = [];
        for (let i = 0; i < this.track.topPoints.length; i++) {
          const wx = this.track.topPoints[i].x - camX;
          if (wx > -cullBuf && wx < virtRight + cullBuf) {
            visibleTop.push({ x: wx, y: this.track.topPoints[i].y });
            visibleBot.push({ x: wx, y: this.track.bottomPoints[i].y });
          }
        }
        if (visibleTop.length > 1) {
          // Surface fill (semi-transparent version of wall color)
          const hexToRgba = (hex, a) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
          this.ctx.fillStyle = hexToRgba(wallRgba, 0.06);
          this.ctx.beginPath();
          this.ctx.moveTo(visibleTop[0].x, visibleTop[0].y);
          for (let i = 1; i < visibleTop.length; i++) this.ctx.lineTo(visibleTop[i].x, visibleTop[i].y);
          for (let i = visibleBot.length - 1; i >= 0; i--) this.ctx.lineTo(visibleBot[i].x, visibleBot[i].y);
          // Close polygon explicitly (no closePath() to avoid diagonal line from last bottom point to first top)
          this.ctx.lineTo(visibleTop[0].x, visibleTop[0].y);
          this.ctx.fill();
          // Thin top boundary line
          this.ctx.strokeStyle = wallRgba;
          this.ctx.lineWidth = 3;
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';
          this.ctx.globalAlpha = wallAlpha;
          this.ctx.beginPath();
          for (let i = 0; i < visibleTop.length; i++) {
            if (i === 0) this.ctx.moveTo(visibleTop[i].x, visibleTop[i].y);
            else this.ctx.lineTo(visibleTop[i].x, visibleTop[i].y);
          }
          this.ctx.stroke();
          // Thin bottom boundary line
          this.ctx.beginPath();
          for (let i = 0; i < visibleBot.length; i++) {
            if (i === 0) this.ctx.moveTo(visibleBot[i].x, visibleBot[i].y);
            else this.ctx.lineTo(visibleBot[i].x, visibleBot[i].y);
          }
          this.ctx.stroke();
        }
      }
      this.ctx.restore();

      // Draw Flag Balls (racing + collector for finished)
      const finishLineX = this.track ? (this.track.finishLineX || this.track.length - 400) : 0;
      let collectorIdx = 0;

      this.balls.forEach(ball => {
        const bX = ball.x - camX;

        if (ball.finished) {
          // Collector: stack finished balls below the finish line
          const collectedY = (this.track ? this.physics.getWallBoundaries(finishLineX, this.track).bottomY : 500) + 30 + collectorIdx * 28;
          const collectedX = finishLineX - camX + (collectorIdx % 2 === 0 ? 20 : -20);
          collectorIdx++;

          this.ctx.save();
          this.ctx.globalAlpha = 0.7;
          this.ctx.beginPath();
          this.ctx.arc(collectedX, collectedY, ball.radius * 0.7, 0, Math.PI * 2);
          this.ctx.clip();

          const img = this.flagCache[ball.code];
          if (img && img !== 'failed' && img.complete) {
            this.ctx.drawImage(
              img,
              collectedX - ball.radius * 0.7,
              collectedY - ball.radius * 0.7,
              ball.radius * 1.4,
              ball.radius * 1.4
            );
          } else {
            this.ctx.fillStyle = ball.color;
            this.ctx.fillRect(collectedX - ball.radius * 0.7, collectedY - ball.radius * 0.7, ball.radius * 1.4, ball.radius * 1.4);
          }

          this.ctx.restore();

          // Finish time label
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 10px Montserrat, sans-serif';
          this.ctx.textAlign = 'left';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(`${ball.name}: ${(ball.finishTime || 0).toFixed(2)}s`, collectedX + ball.radius * 0.7 + 4, collectedY);

          return;
        }

        // Cull if offscreen
        if (bX + ball.radius < -100 || bX - ball.radius > screenW / zoom + 100) return;

        // 1) Draw speed trail (premium visual glow)
        if (ball.trail && ball.trail.length > 1) {
          this.ctx.save();
          this.ctx.lineWidth = ball.radius * 0.9;
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';

          const trailGrad = this.ctx.createLinearGradient(ball.trail[0].x - camX, ball.trail[0].y, bX, ball.y);
          trailGrad.addColorStop(0, `rgba(${ball.primaryColorRGB}, 0.0)`);
          trailGrad.addColorStop(1, `rgba(${ball.primaryColorRGB}, 0.35)`);
          this.ctx.strokeStyle = trailGrad;

          this.ctx.beginPath();
          this.ctx.moveTo(ball.trail[0].x - camX, ball.trail[0].y);
          for (let k = 1; k < ball.trail.length; k++) {
            this.ctx.lineTo(ball.trail[k].x - camX, ball.trail[k].y);
          }
          this.ctx.stroke();
          this.ctx.restore();
        }

        // 2) Shadows for jump altitude (Z-axis)
        if (ball.z > 0) {
          this.ctx.save();
          this.ctx.shadowColor = 'rgba(0,0,0,0.35)';
          this.ctx.shadowBlur = 6 + ball.z * 1.0;
          this.ctx.shadowOffsetX = 3 + ball.z * 0.5;
          this.ctx.shadowOffsetY = 4 + ball.z * 0.8;
        }

        // 3) Flag ball body
        this.ctx.save();
        this.ctx.beginPath();

        const renderRadius = ball.radius * (1 + ball.z * 0.05);
        this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
        this.ctx.clip();

        const img = this.flagCache[ball.code];
        if (img && img !== 'failed' && img.complete) {
          this.ctx.drawImage(img, bX - renderRadius, ball.y - renderRadius, renderRadius * 2, renderRadius * 2);
        } else {
          this.ctx.fillStyle = ball.color;
          this.ctx.fillRect(bX - renderRadius, ball.y - renderRadius, renderRadius * 2, renderRadius * 2);

          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 12px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(ball.code.toUpperCase().substring(0, 3), bX, ball.y);
        }

        // glossy overlay
        const radialGrad = this.ctx.createRadialGradient(
          bX - renderRadius * 0.3,
          ball.y - renderRadius * 0.3,
          renderRadius * 0.1,
          bX,
          ball.y,
          renderRadius
        );
        radialGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        radialGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        radialGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.12)');
        radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        this.ctx.fillStyle = radialGrad;
        this.ctx.beginPath();
        this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();

        if (ball.z > 0) {
          this.ctx.restore(); // restore jump shadow
        }

        // 4) Country label
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 4;
        this.ctx.font = 'bold 9px Montserrat, sans-serif';
        this.ctx.textAlign = 'center';

        if (ball.eliminated) {
          this.ctx.fillStyle = '#e74c3c';
          this.ctx.fillText('ELIMINATED', bX, ball.y + renderRadius + 11);
        } else {
          let labelName = ball.name;
          if (labelName.length > 12) labelName = labelName.substring(0, 10) + '..';
          const displayLabel = `${ball.rank}. ${labelName}`;
          this.ctx.fillText(displayLabel, bX, ball.y + renderRadius + 11);
        }

        this.ctx.restore();
      });

      // Draw track particles (dust/smoke/sparks)
      this.particles.forEach(p => {
        const pX = (p.type === 'wind' || p.type === 'dust' || p.type === 'text' || p.type === 'jump_smoke' || p.type === 'bubble') ? p.x - camX : p.x;

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;

        if (p.type === 'text') {
          this.ctx.fillStyle = p.color;
          this.ctx.font = `bold ${p.size}px Montserrat, sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.fillText(p.text, p.x - camX, p.y);
        } else if (p.type === 'jump_smoke') {
          this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
          this.ctx.beginPath();
          this.ctx.arc(p.x - camX, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (p.type === 'sparkle') {
          this.ctx.globalAlpha = p.alpha;
          this.ctx.fillStyle = '#ffd700';
          this.ctx.shadowColor = '#ffd700';
          this.ctx.shadowBlur = 8;
          this.ctx.beginPath();
          this.ctx.arc(p.x - camX, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        } else if (p.type === 'bubble') {
          this.ctx.strokeStyle = p.color;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.arc(p.x - camX, p.y, p.size, 0, Math.PI * 2);
          this.ctx.stroke();
        } else {
          this.ctx.fillStyle = p.color || '#fff';
          this.ctx.beginPath();
          this.ctx.arc(pX, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.restore();
      });

      this.ctx.restore(); // restore translate and scale zoom

      // Full screen UI overlays (canvas overlay space)
      this.renderScreenOverlays(screenW, screenH);
    }
  }

    // Draw map-specific animated background elements
    renderDynamicBackground(screenW, screenH) {
      // Removed: no falling particles/dots. Clean scenic background only.
      const ctx = this.ctx;
      const theme = this.currentThemeKey;
      if (!theme) return;
      const time = Date.now() / 1000;

      if (theme === 'desert') {
        ctx.save();
        ctx.fillStyle = 'rgba(186, 74, 0, 0.08)';
        for (let i = 0; i < 5; i++) {
          const dx = (i * screenW / 4 + Math.sin(time * 0.02 + i) * 30) % screenW;
          const dh = 80 + Math.sin(i * 2.1 + time * 0.1) * 30;
          ctx.beginPath();
          ctx.moveTo(dx - 120, screenH);
          ctx.quadraticCurveTo(dx, screenH - dh, dx + 120, screenH);
          ctx.fill();
        }
        ctx.restore();
      } else if (theme === 'snow') {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        for (let i = 0; i < 4; i++) {
          const mx = i * screenW / 3 + Math.sin(time * 0.01 + i * 1.5) * 20;
          ctx.beginPath();
          ctx.moveTo(mx - 100, screenH);
          ctx.lineTo(mx - 30, screenH * 0.4);
          ctx.lineTo(mx + 30, screenH * 0.35);
          ctx.lineTo(mx + 100, screenH);
          ctx.fill();
        }
        ctx.restore();
      } else if (theme === 'volcano') {
        ctx.save();
        const lavaGlow = 0.08 + Math.sin(time * 0.5) * 0.04;
        ctx.globalAlpha = lavaGlow;
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(0, screenH * 0.85, screenW, screenH * 0.15);
        ctx.restore();
      } else if (theme === 'ocean') {
        ctx.save();
        ctx.strokeStyle = 'rgba(173, 216, 230, 0.04)';
        ctx.lineWidth = 2;
        for (let w = 0; w < 5; w++) {
          ctx.beginPath();
          const wy = screenH * (0.3 + w * 0.1);
          for (let wx = 0; wx < screenW; wx += 10) {
            const wyOff = Math.sin(wx * 0.01 + time * 0.5 + w * 1.7) * 8;
            if (wx === 0) ctx.moveTo(wx, wy + wyOff);
            else ctx.lineTo(wx, wy + wyOff);
          }
          ctx.stroke();
        }
        ctx.restore();
      } else if (theme === 'space') {
        ctx.save();
        ctx.globalAlpha = 0.03;
        const grad = ctx.createRadialGradient(
          screenW * 0.3 + Math.sin(time * 0.05) * 100, screenH * 0.4, 10,
          screenW * 0.3, screenH * 0.4, 300
        );
        grad.addColorStop(0, '#9b59b6');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, screenW, screenH);
        ctx.restore();
      } else if (theme === 'jungle') {
        ctx.save();
        ctx.globalAlpha = 0.04;
        for (let i = 0; i < 4; i++) {
          const rx = (i * screenW / 4 + Math.sin(time * 0.05 + i) * 20) % screenW;
          ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
          ctx.beginPath();
          ctx.moveTo(rx - 10, 0);
          ctx.lineTo(rx + 15, 0);
          ctx.lineTo(rx + 50, screenH);
          ctx.lineTo(rx - 40, screenH);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    renderScreenOverlays(screenW, screenH) {
      // A. Flag Wars watermark (fixed top-right corner, screen-space, no scroll)
      this.ctx.save();
      this.ctx.globalAlpha = 0.12;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 24px Montserrat, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText('FLAG WARS', screenW - 20, 15);
      this.ctx.globalAlpha = 0.06;
      this.ctx.font = '11px Montserrat, sans-serif';
      this.ctx.fillText('RALLY WORLD CUP', screenW - 20, 44);
      this.ctx.restore();

      // AA. Champion announcement overlay (on-canvas, cinematic)
      const championTriggered = this._championOverlayShown && this._championWinner;
      const championScreen = (this.state === 'finished' || this.state === 'champion_screen') && this.leaderboard && this.leaderboard[0];
      const champion = championTriggered ? this._championWinner : (championScreen ? this.leaderboard[0] : null);
      if (champion && !champion.eliminated) {
        this.ctx.save();
        // Semi-transparent dark backdrop with vignette
        const vignette = this.ctx.createRadialGradient(screenW / 2, screenH / 2, screenH * 0.1, screenW / 2, screenH / 2, screenH * 0.8);
        vignette.addColorStop(0, 'rgba(0,0,0,0.7)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.95)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, screenW, screenH);

        const cx = screenW / 2;
        const cy = screenH / 2 - 30;
        const ts = Math.min(screenW, screenH) / 800;

        // ---- TROPHY ----
        this.ctx.save();
        const trophyCx = cx;
        const trophyCy = cy - 90 * ts;
        this.ctx.translate(trophyCx, trophyCy);
        this.ctx.scale(ts * 1.1, ts * 1.1);

        // Trophy gold gradient with more depth
        const goldGrad = this.ctx.createLinearGradient(-45, -120, 45, 100);
        goldGrad.addColorStop(0, '#fff8dc');
        goldGrad.addColorStop(0.15, '#ffd700');
        goldGrad.addColorStop(0.4, '#f5b041');
        goldGrad.addColorStop(0.7, '#daa520');
        goldGrad.addColorStop(1, '#b8860b');
        const goldDark = this.ctx.createLinearGradient(-45, -120, 45, 100);
        goldDark.addColorStop(0, '#f5b041');
        goldDark.addColorStop(0.5, '#b8860b');
        goldDark.addColorStop(1, '#8b6914');

        // Shadow under trophy
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 30;
        this.ctx.shadowOffsetY = 10;

        // Green malachite base (5 layered rectangles like real trophy)
        const baseColors = ['#1b5e20', '#2e7d32', '#388e3c', '#43a047', '#4caf50'];
        for (let i = 0; i < 5; i++) {
          this.ctx.fillStyle = baseColors[i];
          const bw = 70 - i * 8;
          const bh = 7;
          const bx = -bw / 2;
          const by = 85 + i * 6;
          this.ctx.fillRect(bx, by, bw, bh);
          // Subtle light border
          this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          this.ctx.lineWidth = 0.5;
          this.ctx.strokeRect(bx, by, bw, bh);
        }

        // Gold ring above base
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = goldGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 65, 38, 7, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#2d1f14';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 65, 34, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Left figure - curved athlete holding globe (FIFA-inspired)
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = goldGrad;
        this.ctx.strokeStyle = 'rgba(139,105,20,0.4)';
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(-28, 65);
        this.ctx.quadraticCurveTo(-38, 35, -32, 8);
        this.ctx.quadraticCurveTo(-28, -10, -14, -18);
        this.ctx.quadraticCurveTo(-6, -20, -12, -10);
        this.ctx.quadraticCurveTo(-22, 0, -28, 12);
        this.ctx.quadraticCurveTo(-32, 5, -22, -2);
        this.ctx.quadraticCurveTo(-12, -8, -4, -2);
        this.ctx.quadraticCurveTo(0, 0, 0, 18);
        this.ctx.quadraticCurveTo(-2, 28, -10, 38);
        this.ctx.quadraticCurveTo(-18, 48, -24, 58);
        this.ctx.quadraticCurveTo(-28, 65, -28, 65);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Right figure
        this.ctx.beginPath();
        this.ctx.moveTo(28, 65);
        this.ctx.quadraticCurveTo(38, 35, 32, 8);
        this.ctx.quadraticCurveTo(28, -10, 14, -18);
        this.ctx.quadraticCurveTo(6, -20, 12, -10);
        this.ctx.quadraticCurveTo(22, 0, 28, 12);
        this.ctx.quadraticCurveTo(32, 5, 22, -2);
        this.ctx.quadraticCurveTo(12, -8, 4, -2);
        this.ctx.quadraticCurveTo(0, 0, 0, 18);
        this.ctx.quadraticCurveTo(2, 28, 10, 38);
        this.ctx.quadraticCurveTo(18, 48, 24, 58);
        this.ctx.quadraticCurveTo(28, 65, 28, 65);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Connecting arch between figures
        this.ctx.strokeStyle = goldGrad;
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.shadowColor = 'rgba(255,215,0,0.3)';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.moveTo(-14, -8);
        this.ctx.quadraticCurveTo(0, -22, 14, -8);
        this.ctx.stroke();

        // Globe at top - larger, with continents feel
        this.ctx.shadowBlur = 15;
        const globeGrad = this.ctx.createRadialGradient(-12, -70, 5, 0, -55, 38);
        globeGrad.addColorStop(0, '#7ec8f0');
        globeGrad.addColorStop(0.3, '#4a90d9');
        globeGrad.addColorStop(0.7, '#2e6db8');
        globeGrad.addColorStop(1, '#1a4a7a');
        this.ctx.fillStyle = globeGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, -55, 36, 0, Math.PI * 2);
        this.ctx.fill();

        // Globe continents (abstract green shapes)
        this.ctx.fillStyle = 'rgba(46,204,113,0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(-8, -65, 10, 14, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(10, -50, 8, 12, 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(5, -70, 6, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Globe highlight/shine
        const shineGrad = this.ctx.createRadialGradient(-16, -68, 0, -16, -68, 20);
        shineGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
        shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.fillStyle = shineGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(-14, -70, 14, 9, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Globe meridians
        this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.ellipse(0, -55, 36, 10, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.ellipse(0, -55, 10, 36, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(0, -91);
        this.ctx.quadraticCurveTo(0, -73, 0, -55);
        this.ctx.quadraticCurveTo(0, -37, 0, -19);
        this.ctx.stroke();

        // Top decorative ring
        this.ctx.strokeStyle = goldGrad;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.ellipse(0, -94, 38, 7, 0, 0, Math.PI * 2);
        this.ctx.stroke();

        // Side handles/scrolls
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = goldGrad;
        this.ctx.shadowBlur = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(-48, -35);
        this.ctx.quadraticCurveTo(-58, -48, -52, -62);
        this.ctx.quadraticCurveTo(-46, -72, -32, -72);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(48, -35);
        this.ctx.quadraticCurveTo(58, -48, 52, -62);
        this.ctx.quadraticCurveTo(46, -72, 32, -72);
        this.ctx.stroke();

        this.ctx.restore();

        // ---- WINNER FLAG ----
        const flagY = cy + 10 * ts;
        const flagW = 160 * ts;
        const flagH = 100 * ts;
        const flagImg = this._championFlagImg;
        if (flagImg && flagImg.complete && flagImg.naturalWidth > 0) {
          // Gold glow behind flag
          this.ctx.shadowColor = '#ffd700';
          this.ctx.shadowBlur = 40;
          this.ctx.fillStyle = 'rgba(255,215,0,0.15)';
          this.ctx.fillRect(cx - flagW / 2 - 8, flagY - 8, flagW + 16, flagH + 16);
          this.ctx.shadowBlur = 0;
          this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
          this.ctx.shadowBlur = 15;
          this.ctx.drawImage(flagImg, cx - flagW / 2, flagY, flagW, flagH);
          this.ctx.shadowBlur = 0;
          // Gold border
          this.ctx.strokeStyle = '#ffd700';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(cx - flagW / 2, flagY, flagW, flagH);
        } else {
          this.ctx.fillStyle = '#2d3436';
          this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
          this.ctx.shadowBlur = 15;
          this.ctx.fillRect(cx - flagW / 2, flagY, flagW, flagH);
          this.ctx.shadowBlur = 0;
          this.ctx.strokeStyle = '#ffd700';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(cx - flagW / 2, flagY, flagW, flagH);
        }

        // ---- COUNTRY NAME ----
        const nameY = flagY + flagH + 30 * ts;
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = `bold ${Math.round(42 * ts)}px Montserrat, sans-serif`;
        this.ctx.shadowColor = 'rgba(0,0,0,0.9)';
        this.ctx.shadowBlur = 20;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(champion.name.toUpperCase(), cx, nameY);

        // ---- "ARE THE CHAMPIONS!" ----
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${Math.round(22 * ts)}px Montserrat, sans-serif`;
        this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('ARE THE CHAMPIONS!', cx, nameY + 36 * ts);
        this.ctx.shadowBlur = 0;

        // ---- TOP 3 MEDALS ----
        const podiumTop3 = this.leaderboard ? this.leaderboard.slice(0, 3) : [];
        if (podiumTop3.length > 0) {
          const podiumY = nameY + 80 * ts;
          const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
          const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

          this.ctx.save();
          const itemW = 200 * ts;
          const totalW = podiumTop3.length * itemW;
          const startX = cx - totalW / 2 + itemW / 2;

          podiumTop3.forEach((b, idx) => {
            const px = startX + idx * itemW;

            // Medal emoji
            this.ctx.font = `${Math.round(28 * ts)}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(medals[idx], px, podiumY);

            // Country name below medal
            this.ctx.fillStyle = medalColors[idx];
            this.ctx.font = `bold ${Math.round(16 * ts)}px Montserrat, sans-serif`;
            this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = 6;
            this.ctx.fillText(b.name.toUpperCase(), px, podiumY + 34 * ts);
            // Finish time
            this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
            this.ctx.font = `${Math.round(12 * ts)}px Montserrat, sans-serif`;
            this.ctx.shadowBlur = 0;
            this.ctx.fillText(b.finished ? b.finishTime.toFixed(2) + 's' : '-', px, podiumY + 56 * ts);
          });
          this.ctx.restore();
        }

        // ---- SUBTLE FOOTER ----
        this.ctx.fillStyle = 'rgba(255,215,0,0.3)';
        this.ctx.font = `${Math.round(11 * ts)}px Montserrat, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('FLAG RALLY WORLD CUP', cx, screenH - 20);

        this.ctx.restore();
      }

      // B. Draw countdown overlay
      if (this.state === 'countdown') {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        this.ctx.fillRect(0, 0, screenW, screenH);

        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#66fcf1';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 15;

        // Growing size animation
        const scale = 1 + (Date.now() % 1000) / 1000 * 0.3;
        const size = Math.round(90 * scale);
        this.ctx.font = `bold ${size}px Montserrat, sans-serif`;

        const secondsLabel = this.countdownSeconds > 0 ? this.countdownSeconds : "GO!";
        this.ctx.fillText(secondsLabel, screenW / 2, screenH / 2);
        this.ctx.restore();
      }

      // B. Draw fireworks (Winner cinematic)
      this.fireworks.forEach(f => {
        f.sparks.forEach(s => {
          this.ctx.save();
          this.ctx.globalAlpha = s.alpha;
          this.ctx.fillStyle = s.color;
          this.ctx.beginPath();
          this.ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        });
      });

      // C. Draw confetti rain (Winner cinematic)
      this.confetti.forEach(c => {
        this.ctx.save();
        this.ctx.globalAlpha = c.alpha;
        this.ctx.fillStyle = c.color;
        this.ctx.translate(c.x, c.y);
        this.ctx.rotate((c.angle * Math.PI) / 180);
        // rectangular confetti
        this.ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        this.ctx.restore();
      });
    }

    // Prepares data and starts countdown
    startRace() {
      if (this.selectedCountries.length === 0) {
        alert("Please select countries first!");
        return;
      }

      // Clear screen overlays
      this.confetti = [];
      this.fireworks = [];
      this.particles = [];
      this.activeEvent = null;
      this.eventCount = 0;
      this._championOverlayShown = false;
      this._championWinner = null;
      this._championFlagImg = null;

      this.raceTimer = 0;
      this.countdownSeconds = 3;
      this.state = 'countdown';
      this.isRunning = true;
      this.isPaused = false;
      this.lastTime = 0;
      this.lastKnockoutCycle = 0;

      // Always default camera focus to current leader (auto-switch on overtakes)
      this.selectedBallId = 'leader';

      // Procedural generation
      this.generateProceduralTrack(this.currentThemeKey, this.raceLength, this.obstacleDensity);


      // Balls layout
      this.setupRaceBalls();
      this.calculateLiveLeaderboard();

      // Update camera immediately to start grid
      this.cameraX = 0;

      // Trigger countdown loop
      if (this.countdownTimer) clearInterval(this.countdownTimer);

      this.sounds.playCountdown();

      this.countdownTimer = setInterval(() => {
        this.countdownSeconds--;
        if (this.countdownSeconds > 0) {
          this.sounds.playCountdown();
        } else if (this.countdownSeconds === 0) {
          this.sounds.playGo();
        }

        if (this.countdownSeconds < 0) {
          clearInterval(this.countdownTimer);
          this.state = 'racing';

          // Fire start physics bump to start moving
          this.balls.forEach(ball => {
            ball.vx = 1.0 + Math.random() * 1.5;
            ball.vy = (Math.random() - 0.5) * 1.5;
          });
        }
      }, 1000);

      // Initialize HTML DOM states
      document.getElementById('main-menu').classList.add('hidden');
      document.getElementById('setup-menu').classList.add('hidden');
      document.getElementById('race-hud').classList.remove('hidden');
      document.getElementById('winner-screen').classList.add('hidden');
      document.getElementById('wc-champion-screen').classList.add('hidden');

      // Start central animation tick
      requestAnimationFrame((t) => this.tick(t));

      // Update live HUD overlays continuously
      this.hudUpdateTimer = setInterval(() => this.updateHUD(), 150);
    }

    // Live HUD updater (HTML elements)
    updateHUD() {
      if (this.state !== 'racing' && this.state !== 'countdown') {
        clearInterval(this.hudUpdateTimer);
        return;
      }

      // Update timer text
      document.getElementById('hud-timer').innerText = this.raceTimer.toFixed(1) + "s";

      // Update map name (still update but hidden)
      const mapEl = document.getElementById('hud-map-name');
      if (mapEl) mapEl.innerText = this.currentTheme.name;

      // Update event panel
      const eventText = document.getElementById('hud-event-name');
      if (this.activeEvent) {
        eventText.innerText = this.activeEvent.name;
        eventText.parentElement.classList.remove('hidden');
        eventText.parentElement.classList.add('alert-active');
      } else {
        eventText.parentElement.classList.add('hidden');
        eventText.parentElement.classList.remove('alert-active');
      }

      // Populate country camera selector dropdown
      const camSelect = document.getElementById('hud-camera-select');
      if (camSelect) {
        const currentVal = camSelect.value;
        camSelect.innerHTML = '<option value="leader">🎯 Auto-Follow Leader</option>';
        this.leaderboard.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b.code;
          opt.textContent = `${b.code.toUpperCase()} - ${b.name}`;
          if (b.finished) opt.textContent += ' ✓';
          if (b.code === currentVal) opt.selected = true;
          camSelect.appendChild(opt);
        });
      }

      // Podium — show top 3 racers at bottom
      const podiumContainer = document.getElementById('hud-podium-list');
      if (podiumContainer) {
        podiumContainer.innerHTML = '';
        const top3 = this.leaderboard.slice(0, 3);
        top3.forEach((b, idx) => {
          const entry = document.createElement('div');
          entry.className = 'podium-entry';
          const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
          entry.innerHTML = `
            <span class="podium-rank">${medals[idx] || '#' + (idx + 1)}</span>
            <img class="podium-flag-icon" src="https://flagcdn.com/w40/${b.code}.png" alt="${b.name}" onerror="this.style.display='none'">
            <span>${b.name.slice(0, 18)}</span>
            <span style="color:rgba(255,255,255,0.5);font-size:0.65rem">${b.finished ? b.finishTime.toFixed(2) + 's' : ''}</span>
          `;
          podiumContainer.appendChild(entry);
        });
      }

      // Leaderboard list (Show top 5)
      const listContainer = document.getElementById('hud-leader-list');
      listContainer.innerHTML = '';

      // Grab top 5
      const top5 = this.leaderboard.slice(0, 5);
      top5.forEach((b, index) => {
        const row = document.createElement('div');
        row.className = 'leader-row';
        if (b.finished) row.classList.add('racer-finished');
        if (b.eliminated) row.classList.add('racer-eliminated');

        const gapText = b.finished
          ? `${b.finishTime.toFixed(2)}s`
          : (index === 0 ? "LEADER" : `-${Math.round((top5[0].x - b.x) / 10)}m`);

        row.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="rank-badge">${b.rank}</span>
          <img class="hud-flag-icon" src="https://flagcdn.com/w40/${b.code}.png" alt="${b.name}" onerror="this.style.display='none'">
          <span class="hud-country-name">${b.name}</span>
        </div>
        <span class="gap-badge">${b.finished ? gapText + ' ✓' : gapText}</span>
      `;
        listContainer.appendChild(row);
      });
    }

    endRace() {
      this.state = 'finished';
      this.isPaused = false;

      // Stop HUD update intervals
      clearInterval(this.hudUpdateTimer);

      // Sort leaderboard final
      this.calculateLiveLeaderboard();

      // Hide HUD, trigger Winner Screens
      document.getElementById('race-hud').classList.add('hidden');

      const winner = this.leaderboard[0];
      const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
      const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

      // Trigger big confetti burst for winner celebration
      for (let b = 0; b < 3; b++) {
        this.triggerConfettiExplosion(
          this.canvas.width * (0.3 + b * 0.2),
          this.canvas.height * (0.2 + Math.random() * 0.3)
        );
      }

      // Build top 3 HTML
      const buildTop3 = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        const top3 = this.leaderboard.slice(0, 3);
        top3.forEach((b, idx) => {
          const item = document.createElement('div');
          item.className = 'winner-top3-item';
          item.innerHTML = `
            <div class="winner-top3-medal">${medals[idx]}</div>
            <div class="winner-top3-name" style="color:${medalColors[idx]}">${b.name.toUpperCase()}</div>
            <div class="winner-top3-time">${b.finished ? b.finishTime.toFixed(2) + 's' : '-'}</div>
          `;
          container.appendChild(item);
        });
      };

      // Determine screen style: World Cup Mode has a custom fireworks overlay
      if (this.gameMode === 'world_cup_2026') {
        this.state = 'champion_screen'; // trigger cinematic

        document.getElementById('wc-flag').src = `https://flagcdn.com/h240/${winner.code}.png`;
        document.getElementById('wc-country').innerText = winner.name.toUpperCase();
        buildTop3('wc-top3');

        document.getElementById('wc-champion-screen').classList.remove('hidden');
      } else {
        document.getElementById('winner-flag').src = `https://flagcdn.com/h120/${winner.code}.png`;
        document.getElementById('winner-name').innerText = winner.name;
        buildTop3('winner-top3');

        document.getElementById('winner-screen').classList.remove('hidden');
      }
    }

    pauseRace() {
      this.isPaused = true;
    }

    resumeRace() {
      this.isPaused = false;
    }

    resetRace() {
      if (this.countdownTimer) clearInterval(this.countdownTimer);
      this.startRace();
    }

    stopRace() {
      this.isRunning = false;
      this.state = 'menu';

      if (this.countdownTimer) clearInterval(this.countdownTimer);
      clearInterval(this.hudUpdateTimer);

      this._championOverlayShown = false;
      this._championWinner = null;
      this._championFlagImg = null;

      // Show Main Menu, hide panels
      document.getElementById('main-menu').classList.remove('hidden');
      document.getElementById('setup-menu').classList.add('hidden');
      document.getElementById('race-hud').classList.add('hidden');
      document.getElementById('winner-screen').classList.add('hidden');
      document.getElementById('wc-champion-screen').classList.add('hidden');

      this.startBackgroundLoop();
    }

    // Helper: draw a filled pentagon centered at (cx, cy) with given size and rotation
    drawPentagon(cx, cy, size, rotation) {
      this.ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = rotation + (i * Math.PI * 2 / 5) - Math.PI / 2;
        const x = cx + Math.cos(a) * size;
        const y = cy + Math.sin(a) * size;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.fill();
    }
  }
