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
    density: 1.0,
    isDark: false
  },
  snow: {
    name: "Glacier Summit",
    bgGrad: ["#4a6b8a", "#2a4560"],
    wallColor: "#1f5280",
    pegColor: "#6a95b0",
    pegBouncyColor: "#3a8aaa",
    particleColor: "#b8d4e4",
    particleType: "snow",
    forwardForce: 0.022,
    density: 1.0,
    isDark: false
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
    density: 1.0,
    isDark: true
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
    density: 1.05,
    isDark: true
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
    density: 0.9,
    isDark: true
  },
  space: {
    name: "Nebula Cosmos",
    bgGrad: ["#040308", "#0a0e1a"],
    wallColor: "#66fcf1",
    pegColor: "#8ab4f8",
    pegBouncyColor: "#c084fc",
    particleColor: "#66fcf1",
    particleType: "cosmic",
    forwardForce: 0.014,
    density: 0.8,
    isDark: true
  }
};

// Data-driven obstacle registry ??? add new obstacles here; UI auto-populates
const OBSTACLE_REGISTRY = [
  { type: 'portal', name: 'Portal', category: 'core', map: null },
  { type: 'boost', name: 'Boost Pad', category: 'core', map: null },
  { type: 'slow', name: 'Slow Pad', category: 'core', map: null },
  { type: 'spinner', name: 'Spinner', category: 'core', map: null },
  { type: 'punchfist', name: 'Punch', category: 'core', map: null },
  { type: 'barrier', name: 'Moving Gate', category: 'core', map: null },
  { type: 'hammer', name: 'Swinging Hammer', category: 'core', map: null },
  { type: 'sweep_arm', name: 'Rotating Arm', category: 'core', map: null },
  { type: 'c_bumper', name: 'C-Bumper', category: 'core', map: null },
  { type: 'launch', name: 'Launch Pad', category: 'core', map: null },
  { type: 'boost_pipe', name: 'Boost Pipe', category: 'core', map: null },
  { type: 'peg', name: 'Bouncy Pegs', category: 'core', map: null },
  // Space
  { type: 'gravity_well', name: 'Gravity Well', category: 'signature', map: 'space' },
  { type: 'energy_ring', name: 'Energy Ring', category: 'signature', map: 'space' },
  { type: 'meteor_gate', name: 'Meteor Gate', category: 'signature', map: 'space' },
  // Glacier
  { type: 'ice', name: 'Ice Patch', category: 'signature', map: 'snow' },
  { type: 'ice_cannon', name: 'Ice Cannon', category: 'signature', map: 'snow' },
  { type: 'icicle', name: 'Animated Icicle', category: 'signature', map: 'snow' },
  { type: 'icicle_drop', name: 'Icicle Drop', category: 'signature', map: 'snow' },
  // Magma
  { type: 'lava_pool', name: 'Lava Pool', category: 'signature', map: 'volcano' },
  { type: 'lava_geyser', name: 'Lava Geyser', category: 'signature', map: 'volcano' },
  { type: 'rolling_boulder', name: 'Rolling Boulder', category: 'signature', map: 'volcano' },
  { type: 'flame_jet', name: 'Flame Jet', category: 'signature', map: 'volcano' },
  { type: 'collapsing_pillar', name: 'Collapsing Rock Pillar', category: 'signature', map: 'volcano' },
  // Amazon
  { type: 'carnivorous_vine', name: 'Carnivorous Vine', category: 'signature', map: 'jungle' },
  { type: 'swinging_vine', name: 'Swinging Vine', category: 'signature', map: 'jungle' },
  { type: 'rolling_log', name: 'Rolling Log', category: 'signature', map: 'jungle' },
  { type: 'carnivorous_plant', name: 'Carnivorous Plant', category: 'signature', map: 'jungle' },
  { type: 'mud_puddle', name: 'Mud Puddle', category: 'signature', map: 'jungle' },
  // Mariana
  { type: 'whirlpool', name: 'Whirlpool', category: 'signature', map: 'ocean' },
  { type: 'jellyfish', name: 'Jellyfish', category: 'signature', map: 'ocean' },
  { type: 'crab_claw', name: 'Crab Claw', category: 'signature', map: 'ocean' },
  { type: 'sea_mine', name: 'Sea Mine', category: 'signature', map: 'ocean' },
  // Sahara
  { type: 'quicksand', name: 'Quicksand', category: 'signature', map: 'desert' },
  { type: 'sand_geyser', name: 'Sand Geyser', category: 'signature', map: 'desert' },
  { type: 'rolling_tumbleweed', name: 'Rolling Tumbleweed', category: 'signature', map: 'desert' },
  { type: 'moving_dune', name: 'Moving Dune', category: 'signature', map: 'desert' },
];

const EVENT_REGISTRY = [
  { key: 'football_shower', name: 'Football Shower', implemented: true },
  { key: 'gravity_flip', name: 'Gravity Flip', implemented: true },
  { key: 'speed_surge', name: 'Speed Surge', implemented: true },
  { key: 'blackout', name: 'Blackout', implemented: true },
  { key: 'teleportation', name: 'Teleport Swap', implemented: true },
  { key: 'meteor_storm', name: 'Meteor Storm', implemented: false },
  { key: 'blizzard', name: 'Blizzard', implemented: true },
  { key: 'aurora_borealis', name: 'Aurora Borealis', implemented: true },
  { key: 'volcanic_eruption', name: 'Volcanic Eruption', implemented: true },
  { key: 'firestorm', name: 'Firestorm', implemented: true },
  { key: 'lava_shower', name: 'Lava Shower', implemented: true },
  { key: 'sandstorm', name: 'Sandstorm', implemented: false },
  { key: 'jungle_stampede', name: 'Jungle Stampede', implemented: false },
];

// Text contrast helper ??? returns appropriate colors based on map brightness
function getThemeColors(themeKey) {
  const theme = MAP_THEMES[themeKey];
  if (!theme) return { primary: '#ffffff', secondary: '#a0a5b5', accent: '#ffd700' };
  if (theme.isDark) {
    return {
      primary: '#ffffff',
      secondary: '#8ab4f8',
      accent: '#ffd700',
      label: '#e0e0e0',
      highlight: '#66fcf1'
    };
  }
  return {
    primary: '#1a1a2e',
    secondary: '#2c3e50',
    accent: '#8B4513',
    label: '#333333',
    highlight: '#1a5276'
  };
}

// Web Audio API Synthesizer ??? countdown + winner sounds only
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
  playIceWhoosh() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.15);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.15);
  }
  playIceCrack() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.5);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.Q.setValueAtTime(1.5, now);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.08);
  }
  startBlizzardWind() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 3);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.35;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.018, now + 0.5);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(250, now + 2);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    this._blizzardWindNoise = noise;
    this._blizzardWindGain = gain;
  }
  stopBlizzardWind() {
    if (!this._blizzardWindGain) return;
    const now = this.ctx.currentTime;
    this._blizzardWindGain.gain.linearRampToValueAtTime(0, now + 1);
    if (this._blizzardWindNoise) {
      this._blizzardWindNoise.stop(now + 1.05);
    }
    this._blizzardWindNoise = null;
    this._blizzardWindGain = null;
  }
  playBlizzardCrack() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.4);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(4000, now);
    filter.Q.setValueAtTime(2, now);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.12);
  }
  startAuroraAmbient() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Gentle wind noise
    const bufferSize = Math.floor(ctx.sampleRate * 4);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.006, now + 2);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(150, now + 3);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    this._auroraAmbientNoise = noise;
    this._auroraAmbientGain = gain;
    // High shimmer tone
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.linearRampToValueAtTime(1800, now + 4);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.004, now + 2);
    oscGain.gain.setValueAtTime(0.004, now + 5);
    oscGain.gain.linearRampToValueAtTime(0.001, now + 9);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 10);
    this._auroraOsc = osc;
    this._auroraOscGain = oscGain;
  }
  stopAuroraAmbient() {
    if (this._auroraAmbientGain) {
      const now = this.ctx.currentTime;
      this._auroraAmbientGain.gain.linearRampToValueAtTime(0, now + 1);
      if (this._auroraAmbientNoise) {
        this._auroraAmbientNoise.stop(now + 1.05);
      }
      this._auroraAmbientNoise = null;
      this._auroraAmbientGain = null;
    }
    if (this._auroraOscGain) {
      const now = this.ctx.currentTime;
      this._auroraOscGain.gain.linearRampToValueAtTime(0, now + 0.5);
      this._auroraOsc = null;
      this._auroraOscGain = null;
    }
  }
}

// Dynamic Commentary System ??? generates race event messages and manages Match Events panel
class Commentary {
  constructor() {
    this.entries = [];
    this.maxEntries = 20;
    this.lastLeaderCode = null;
    this.lastTop3Hash = '';
    this._lastCommentaryTime = 0;
  }

  add(message, type = 'info') {
    this.entries.unshift({
      message,
      type,
      time: performance.now()
    });
    if (this.entries.length > this.maxEntries) this.entries.pop();
    this.updateMatchEventsPanel();
  }

  getRecent(count = 5) {
    return this.entries.slice(0, count);
  }

  updateMatchEventsPanel() {
    const container = document.getElementById('hud-match-events-list');
    if (!container) return;
    const recent = this.getRecent(5);
    container.innerHTML = '';
    recent.forEach((entry, idx) => {
      const el = document.createElement('div');
      el.className = 'match-event-row';
      const scale = 1 - idx * 0.12;
      const opacity = 1 - idx * 0.18;
      el.style.transform = `scale(${Math.max(0.5, scale)})`;
      el.style.opacity = Math.max(0.3, opacity);
      el.style.transformOrigin = 'right center';
      const typeColors = {
        leader: '#ffd700',
        crash: '#e74c3c',
        portal: '#9b59b6',
        boost: '#2ecc71',
        comeback: '#f39c12',
        info: '#a0a5b5'
      };
      el.style.color = typeColors[entry.type] || typeColors.info;
      el.textContent = entry.message;
      container.appendChild(el);
    });
  }

  clear() {
    this.entries = [];
    this.updateMatchEventsPanel();
  }
}

// Global Event Banner ??? queue-based animated banner displayed on canvas near lower-center
class GlobalEventBanner {
  constructor(engine) {
    this._engine = engine || null;
    this.queue = [];
    this.current = null;
    this._startTime = 0;
    this._holdDuration = 2500;
    this._fadeIn = 300;
    this._fadeOut = 400;
  }

  show(eventName, description, duration = 2500) {
    // Backwards compatibility: if description is a number, it's duration
    if (typeof description === 'number') {
      duration = description;
      description = '';
    }
    this.queue.push({ eventName, description, duration });
    if (!this.current) this._next();
  }

  _next() {
    if (this.queue.length === 0) {
      this.current = null;
      return;
    }
    this.current = this.queue.shift();
    this._startTime = performance.now();
    this._holdDuration = this.current.duration;
  }

  update() {
    if (!this.current) return;
    const elapsed = performance.now() - this._startTime;
    if (elapsed > this._holdDuration + this._fadeIn + this._fadeOut) {
      this.current = null;
      this._next();
    }
  }

  render(ctx, screenW, screenH) {
    if (!this.current) return;
    const elapsed = performance.now() - this._startTime;
    let alpha = 1;
    let scale = 1;
    // Fade in
    if (elapsed < this._fadeIn) {
      const t = elapsed / this._fadeIn;
      alpha = t;
      scale = 0.8 + t * 0.2;
    }
    // Hold
    else if (elapsed < this._fadeIn + this._holdDuration) {
      alpha = 1;
      scale = 1;
    }
    // Fade out
    else if (elapsed < this._fadeIn + this._holdDuration + this._fadeOut) {
      const t = (elapsed - this._fadeIn - this._holdDuration) / this._fadeOut;
      alpha = 1 - t;
      scale = 1 - t * 0.1;
    }
    // Zoom animation during hold
    const holdElapsed = Math.max(0, elapsed - this._fadeIn);
    const zoom = 1 + Math.sin(holdElapsed * 0.002) * 0.02;

    ctx.save();
    ctx.globalAlpha = alpha;

    const titleFont = 'bold 30px Montserrat, sans-serif';
    const descFont = '14px Montserrat, sans-serif';

    ctx.font = titleFont;
    const titleWidth = ctx.measureText(this.current.eventName).width;
    ctx.font = descFont;
    const descWidth = ctx.measureText(this.current.description).width;

    const maxTextWidth = Math.max(titleWidth, descWidth);
    const bannerW = Math.max(400, maxTextWidth + 80);
    const bannerH = 90;
    const by = screenH * 0.72 - bannerH / 2;

    ctx.translate(screenW / 2, by + bannerH / 2);
    ctx.scale(scale * zoom, scale * zoom);

    // Background pill
    ctx.shadowColor = 'rgba(255, 200, 0, 0.4)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.beginPath();
    ctx.roundRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 28);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glow ring
    ctx.strokeStyle = `rgba(255, 200, 0, ${0.2 + Math.sin(holdElapsed * 0.005) * 0.15})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-bannerW / 2 - 3, -bannerH / 2 - 3, bannerW + 6, bannerH + 6, 31);
    ctx.stroke();

    // Event name (large, bold) ??? always on dark pill, use white
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 200, 0, 0.3)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.font = titleFont;
    ctx.fillText(this.current.eventName, 0, -18);

    // Description (smaller, below)
    ctx.shadowBlur = 6;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = descFont;
    ctx.fillText(this.current.description, 0, 20);

    ctx.restore();
  }

  clear() {
    this.queue = [];
    this.current = null;
  }
}

// Race Director ??? TV-style producer that watches the race and presents exciting moments
// Does NOT change gameplay, physics, or race balance
class RaceDirector {
  constructor() {
    this._queue = [];
    this._events = [];
    this._eventIdCounter = 0;
    this._eventElements = new Map();
    this._currentRaceTimer = 0;
    this._cooldowns = {};
    this._prevPositions = {};
    this._lastMessages = {};
    this._lastLeaderCode = null;
    this._prevTop3Hash = '';
    this._boostCounts = {};
    this._lastHitTimes = {};
    this._raceLength = 0;
    this._started = false;
    this._observeInterval = 0;
    this._observeCounter = 0;

    // Priority levels (lower = more important)
    this.PRIORITY = {
      WINNER: 0, PHOTO_FINISH: 0, FINAL_SPRINT: 0, ELIMINATION: 0,
      LEADER_CHANGE: 1, LARGE_COMEBACK: 1,
      HAMMER: 2, PORTAL: 2, BOOST_CHAIN: 2,
      SPINNER: 3, NEAR_MISS: 3, LUCKY_ESCAPE: 3,
      POSITION_GAIN: 4, POSITION_LOSS: 4, AMBIENT: 5
    };

    this._eventColors = {
      leaderChange: '#ffd700',
      positionGainLarge: '#ffffff',
      positionGain: '#ffffff',
      positionLossLarge: '#ffffff',
      positionLoss: '#ffffff',
      top3Entry: '#ffd700',
      top10Entry: '#ffffff',
      hammer: '#e74c3c',
      portal: '#9b59b6',
      boost: '#00bcd4',
      boostChain: '#00bcd4',
      spinner: '#ffffff',
      luckyEscape: '#2ecc71',
      nearMiss: '#ffffff',
      bigOvertake: '#ffffff',
      comeback: '#ffd700',
      multiCollision: '#e74c3c',
      airtime: '#ffffff',
      finalSprint: '#ffd700',
      photoFinish: '#ffd700',
      elimination: '#c0392b',
      chaosStart: '#f39c12'
    };

    this._messageDB = {
      leaderChange: {
        priority: 1, duration: 3500, messages: [
          '\u{1F451} {name} takes the lead!',
          '\u{1F451} {name} storms into 1st!',
          '\u{1F451} {name} seizes control!',
          '\u{1F451} {name} powers to the front!',
          '\u{1F451} {name} surges ahead!',
          '\u{1F451} {name} moves to the front!'
        ]
      },
      positionGainLarge: {
        priority: 4, duration: 3000, messages: [
          '\u{1F525} {name} charges into {pos}th!',
          '\u{1F525} {name} storms through the field!',
          '\u{1F525} {name} on a massive charge!',
          '\u{1F525} {name} rockets up to {pos}th!',
          '\u{1F525} {name} blazing through!',
          '\u{1F525} {name} making moves!'
        ]
      },
      positionGain: {
        priority: 4, duration: 2500, messages: [
          '\u{1F680} {name} gains {delta} positions!',
          '\u{1F680} {name} on the move!',
          '\u{1F680} {name} climbing the standings!'
        ]
      },
      positionLoss: {
        priority: 4, duration: 2500, messages: [
          '\u{1F631} {name} drops {delta} spots!',
          '\u{1F631} {name} is falling back!',
          '\u{1F631} {name} loses ground!',
          '\u{1F631} Trouble for {name}!'
        ]
      },
      positionLossLarge: {
        priority: 4, duration: 3000, messages: [
          '\u{1F631} {name} is in trouble!',
          '\u{1F631} Disaster for {name}!',
          '\u{1F631} {name} is falling apart!',
          '\u{1F631} {name} loses big!'
        ]
      },
      top3Entry: {
        priority: 3, duration: 3000, messages: [
          '\u{1F3C6} {name} breaks into the top 3!',
          '\u{1F3C6} {name} reaches podium contention!'
        ]
      },
      top10Entry: {
        priority: 4, duration: 2500, messages: [
          '\u{1F4C8} {name} enters the top 10!',
          '\u{1F4C8} {name} cracks the top 10!'
        ]
      },
      hammer: {
        priority: 2, duration: 3000, messages: [
          '\u{1F4A5} {name} gets absolutely launched!',
          '\u{1F4A5} Disaster for {name}!',
          '\u{1F4A5} {name}\'s race just took a huge hit!',
          '\u{1F4A5} {name} smashed by the hammer!',
          '\u{1F4A5} Crushing blow for {name}!',
          '\u{1F4A5} {name} sent flying!'
        ]
      },
      portal: {
        priority: 2, duration: 3000, messages: [
          '\u{26A1} {name} disappears into a portal!',
          '\u{26A1} {name} takes the portal gamble!',
          '\u{26A1} {name} warps through!',
          '\u{26A1} {name} vanishes!',
          '\u{26A1} Portal magic for {name}!'
        ]
      },
      boost: {
        priority: 3, duration: 2500, messages: [
          '\u{1F680} {name} finds incredible speed!',
          '\u{1F680} {name} hits the boost!',
          '\u{1F680} {name} accelerates away!',
          '\u{1F680} {name} rockets forward!',
          '\u{1F680} Speed boost for {name}!'
        ]
      },
      boostChain: {
        priority: 2, duration: 3000, messages: [
          '\u{1F680} {name} on a boost chain!',
          '\u{1F680} {name} chaining boosts together!',
          '\u{1F680} Unstoppable {name}!'
        ]
      },
      spinner: {
        priority: 3, duration: 2500, messages: [
          '\u{1F300} {name} gets spun around!',
          '\u{1F300} {name} caught in the spinner!',
          '\u{1F300} {name} spun out!',
          '\u{1F300} The spinner catches {name}!'
        ]
      },
      luckyEscape: {
        priority: 3, duration: 2500, messages: [
          '\u{1F340} {name} somehow survives!',
          '\u{1F340} Lucky escape for {name}!',
          '\u{1F340} {name} dodges disaster!',
          '\u{1F340} {name} lives to race another corner!'
        ]
      },
      nearMiss: {
        priority: 3, duration: 2500, messages: [
          '\u{1F62E} {name} narrowly avoids disaster!',
          '\u{1F62E} Close call for {name}!',
          '\u{1F62E} {name} dodges by inches!',
          '\u{1F62E} That was close for {name}!'
        ]
      },
      bigOvertake: {
        priority: 3, duration: 3000, messages: [
          '\u{1F525} {name} makes a big overtake!',
          '\u{1F525} {name} passes multiple racers!',
          '\u{1F525} {name} slicing through the pack!'
        ]
      },
      comeback: {
        priority: 1, duration: 3500, messages: [
          '\u{1F525} {name} fights back into contention!',
          '\u{1F525} What a comeback from {name}!',
          '\u{1F525} {name} refuses to give up!',
          '\u{1F525} {name} storms back!'
        ]
      },
      multiCollision: {
        priority: 3, duration: 3000, messages: [
          '\u{1F4A5} {name} caught in a pile-up!',
          '\u{1F4A5} {name} in the middle of chaos!',
          '\u{1F4A5} Multi-racer collision for {name}!'
        ]
      },
      airtime: {
        priority: 3, duration: 2500, messages: [
          '\u{1F4F8} {name} gets big air!',
          '\u{1F4F8} {name} flying high!',
          '\u{1F4F8} Airborne {name}!'
        ]
      },
      finalSprint: {
        priority: 0, duration: 3500, messages: [
          '\u{1F3C1} Final Sprint! Anyone can still win!',
          '\u{1F3C1} Down to the wire!',
          '\u{1F3C1} It\'s not over yet!',
          '\u{1F3C1} Final push to the line!'
        ]
      },
      photoFinish: {
        priority: 0, duration: 4000, messages: [
          '\u{1F4F7} Photo finish! It\'s incredibly close!',
          '\u{1F4F7} Too close to call!'
        ]
      },
      elimination: {
        priority: 0, duration: 3500, messages: [
          '\u{1F480} {name} eliminated!',
          '\u{1F480} {name} is out of the race!'
        ]
      },
      chaosStart: {
        priority: 1, duration: 3500, messages: [
          '\u{1F4A5} Chaos event triggered!',
          '\u{1F4A5} The track just got dangerous!'
        ]
      }
    };
  }

  startRace(raceLength) {
    this._queue = [];
    this._events = [];
    this._eventIdCounter = 0;
    this._eventElements.forEach((el) => { if (el.parentNode) el.parentNode.removeChild(el); });
    this._eventElements.clear();
    this._cooldowns = {};
    this._prevPositions = {};
    this._lastMessages = {};
    this._lastLeaderCode = null;
    this._prevTop3Hash = '';
    this._boostCounts = {};
    this._lastHitTimes = {};
    this._raceLength = raceLength;
    this._finalSprintAnnounced = false;
    this._started = true;
    this._observeCounter = 0;
    this._currentRaceTimer = 0;
  }

  // Called every simulation frame to observe race state
  observe(balls, leaderboard, raceTimer, track) {
    if (!this._started) return;
    this._observeCounter++;
    this._currentRaceTimer = raceTimer;

    // Obstacle events need per-frame checking (collision flags reset each frame)
    this._detectObstacleEvents(balls);

    // Position-based events checked at ~6Hz to accumulate meaningful deltas
    if (this._observeCounter % 10 === 0) {
      this._detectLeaderChanges(leaderboard);
      this._detectPositionChanges(balls, leaderboard);
      this._detectFinalSprint(leaderboard, raceTimer, track);
    }
  }

  // Process queue and update feed (called every frame)
  update(dt) {
    if (!this._started) return;

    // Pull events from queue into the persistent feed
    if (this._queue.length > 0) {
      const next = this._queue.shift();
      next.raceTime = this._currentRaceTimer;
      this._addToFeed(next);
    }
  }

  _detectLeaderChanges(leaderboard) {
    if (leaderboard.length === 0) return;
    const leader = leaderboard[0];
    if (!leader || leader.finished) return;

    if (this._lastLeaderCode && this._lastLeaderCode !== leader.code) {
      this._enqueue('leaderChange', leader.name, leader.code, {});
    }
    this._lastLeaderCode = leader.code;

    // Top 3 changes
    const top3 = leaderboard.slice(0, 3).map(b => b.code).join(',');
    if (top3 !== this._prevTop3Hash && this._prevTop3Hash !== '') {
      // Check if someone new entered top 3
      const prevCodes = this._prevTop3Hash ? this._prevTop3Hash.split(',') : [];
      const currentCodes = top3.split(',');
      for (const code of currentCodes) {
        if (!prevCodes.includes(code)) {
          const racer = leaderboard.find(b => b.code === code);
          if (racer) {
            this._enqueue('top3Entry', racer.name, racer.code, {});
            break;
          }
        }
      }
    }
    this._prevTop3Hash = top3;
  }

  _detectPositionChanges(balls, leaderboard) {
    balls.forEach(ball => {
      if (ball.finished || ball.eliminated) return;
      const prevRank = this._prevPositions[ball.code];
      const currentRank = ball.rank;
      if (prevRank === undefined) {
        this._prevPositions[ball.code] = currentRank;
        return;
      }

      const delta = prevRank - currentRank; // positive = gained positions
      if (Math.abs(delta) >= 5) {
        if (delta > 0) {
          this._enqueue('positionGainLarge', ball.name, ball.code, { pos: currentRank });
        } else if (delta <= -3) {
          this._enqueue('positionLossLarge', ball.name, ball.code, { pos: currentRank });
        }
      } else if (Math.abs(delta) >= 3) {
        if (delta > 0) {
          this._enqueue('positionGain', ball.name, ball.code, { delta });
        } else {
          this._enqueue('positionLoss', ball.name, ball.code, { delta: Math.abs(delta) });
        }
      }

      // Detect big comebacks: racer was outside top 10, now inside top 5
      if (prevRank > 10 && currentRank <= 5) {
        this._enqueue('comeback', ball.name, ball.code, {});
      }

      this._prevPositions[ball.code] = currentRank;
    });
  }

  _detectObstacleEvents(balls) {
    balls.forEach(ball => {
      if (ball.finished || ball.eliminated) return;

      const now = performance.now();

      // Hammer hit
      if (ball._hitHammerThisFrame) {
        this._enqueue('hammer', ball.name, ball.code, {});
        this._lastHitTimes[ball.code + '_hammer'] = now;
      }

      // Portal use
      if (ball._usedPortalThisFrame) {
        this._enqueue('portal', ball.name, ball.code, {});
        this._lastHitTimes[ball.code + '_portal'] = now;
      }

      // Boost entry
      if (ball._enteredBoostThisFrame) {
        this._boostCounts[ball.code] = (this._boostCounts[ball.code] || 0) + 1;
        if (this._boostCounts[ball.code] >= 3) {
          this._enqueue('boostChain', ball.name, ball.code, {});
          this._boostCounts[ball.code] = 0;
        } else {
          this._enqueue('boost', ball.name, ball.code, {});
        }
      } else {
        this._boostCounts[ball.code] = 0;
      }

      // Spinner hit
      if (ball._hitSpinnerThisFrame) {
        this._enqueue('spinner', ball.name, ball.code, {});
      }
    });
  }

  _detectFinalSprint(leaderboard, raceTimer, track) {
    if (!track || !track.finishLineX) return;
    const leader = leaderboard[0];
    if (!leader || leader.finished) return;

    const finishX = track.finishLineX;
    const distToFinish = finishX - leader.x;

    // Final sprint: within 100m (10000px) of finish
    if (distToFinish > 0 && distToFinish < 10000 && !this._finalSprintAnnounced) {
      this._finalSprintAnnounced = true;
      this._enqueue('finalSprint', '', '', {});
    }

    // Photo finish: leader within 200px of finish and second within 100px
    if (distToFinish > 0 && distToFinish < 200 && leaderboard.length > 1) {
      const second = leaderboard[1];
      if (second && !second.finished && leader.x - second.x < 100) {
        this._enqueue('photoFinish', '', '', {});
      }
    }
  }

  _enqueue(eventType, racerName, racerCode, extra) {
    const template = this._messageDB[eventType];
    if (!template) return;

    // Check cooldown
    const cdKey = eventType + '_' + racerCode;
    const now = performance.now();
    if (this._cooldowns[cdKey] && now < this._cooldowns[cdKey]) return;

    // Ignore same-type events within 1s
    const globalCdKey = 'global_' + eventType;
    if (this._cooldowns[globalCdKey] && now < this._cooldowns[globalCdKey]) return;

    const message = this._pickMessage(eventType, racerName, extra);

    // Don't add if same as last queued message
    if (this._queue.length > 0 && this._queue[this._queue.length - 1].message === message) return;
    // Don't add if same as last event in feed
    if (this._events.length > 0 && this._events[this._events.length - 1].message === message) return;

    const event = {
      type: eventType,
      message,
      priority: template.priority,
      duration: template.duration,
      racerCode
    };

    // High-priority events preempt the queue
    if (template.priority <= 1) {
      this._queue = this._queue.filter(e => e.priority > template.priority);
      this._queue.unshift(event);
    } else {
      this._queue.push(event);
    }

    // Cap queue length
    if (this._queue.length > 10) this._queue.splice(10);

    // Set cooldown
    this._setCooldown(cdKey, template.duration * 2);
    this._setCooldown(globalCdKey, 800);
  }

  _pickMessage(eventType, racerName, extra) {
    const template = this._messageDB[eventType];
    if (!template) return '';

    const candidates = template.messages.filter(m => m !== this._lastMessages[eventType]);
    const pool = candidates.length > 0 ? candidates : template.messages;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    this._lastMessages[eventType] = chosen;

    let msg = chosen.replace('{name}', racerName);
    if (extra.pos) msg = msg.replace('{pos}', extra.pos);
    if (extra.delta) msg = msg.replace('{delta}', extra.delta);
    return msg;
  }

  _setCooldown(key, duration) {
    this._cooldowns[key] = performance.now() + duration;
  }

  _addToFeed(event) {
    event.id = ++this._eventIdCounter;
    this._events.push(event);

    // Render the new event as a DOM element
    this._renderNewEntry(event);

    // If we exceed 6 visible, fade-out the oldest
    if (this._events.length > 6) {
      const oldest = this._events.shift();
      this._fadeOutEntry(oldest.id);
    }
  }

  _renderNewEntry(event) {
    const list = document.getElementById('rd-feed-list');
    if (!list) return;

    const el = document.createElement('div');
    el.className = 'rd-entry';
    el.dataset.id = event.id;

    const color = this._eventColors[event.type] || '#ffffff';
    const ts = this._formatTimestamp(event.raceTime || 0);

    el.innerHTML = `<span class="rd-ts" style="color:${color}">${ts}</span><span class="rd-msg" style="color:${color}">${event.message}</span>`;
    el.style.borderLeftColor = color;

    // Insert at top (newest)
    if (list.firstChild) {
      list.insertBefore(el, list.firstChild);
    } else {
      list.appendChild(el);
    }

    this._eventElements.set(event.id, el);
  }

  _fadeOutEntry(id) {
    const el = this._eventElements.get(id);
    if (!el) return;
    el.classList.add('rd-removing');
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
      this._eventElements.delete(id);
    }, 400);
  }

  _formatTimestamp(seconds) {
    if (seconds == null || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  stop() {
    this._started = false;
    this._queue = [];
    this._events = [];
    this._eventElements.forEach((el) => { if (el.parentNode) el.parentNode.removeChild(el); });
    this._eventElements.clear();
  }
}

// Broadcast Director ??? professional state-machine camera orchestration
// Decides WHAT the camera should watch and at what zoom.
// Camera simply executes the shots with smooth cinematic movement.
// Follows a strict state machine: only one state active at any time.
// States: LEADER_FOLLOW (default, ~85-90%), EVENT_FOCUS, CHAOS_OVERVIEW,
//         ELIMINATION, FINISH_MODE.
// Shot locking ensures no nervous re-decisions once a state begins.
// Manual mode disables the director when the user selects a racer.
class BroadcastDirector {
  static STATE = Object.freeze({
    LEADER_FOLLOW: 0,
    EVENT_FOCUS: 1,
    CHAOS_OVERVIEW: 2,
    ELIMINATION: 3,
    FINISH_MODE: 4,
  });

  constructor(engine) {
    this._engine = engine;
    this._state = BroadcastDirector.STATE.LEADER_FOLLOW;
    this._stateTimer = 0;
    this._cooldownTimer = 0;
    this._eventThreshold = 5; // 1-10 ??? only events >= threshold trigger EVENT_FOCUS
    this._targetBallId = 'leader';
    this._targetZoom = 1.0;
    this._manualOverride = false;

    // Detection state
    this._lastRanks = new Map();
    this._lastActiveEvent = null;
    this._boostCounts = {};
  }

  get state() { return this._state; }
  get targetBallId() { return this._manualOverride ? this._engine.selectedBallId : this._targetBallId; }
  get targetZoom() { return this._targetZoom; }
  get isManualMode() { return this._manualOverride; }
  get isFinalSprint() { return this._state === BroadcastDirector.STATE.FINISH_MODE; }

  reset() {
    this._state = BroadcastDirector.STATE.LEADER_FOLLOW;
    this._stateTimer = 0;
    this._cooldownTimer = 0;
    this._targetBallId = 'leader';
    this._targetZoom = 1.0;
    this._manualOverride = false;
    this._lastRanks.clear();
    this._lastActiveEvent = null;
    this._boostCounts = {};
  }

  update(dt) {
    // Decay state timer (only non-leader states have timers)
    if (this._state !== BroadcastDirector.STATE.LEADER_FOLLOW) {
      this._stateTimer -= dt;
      if (this._stateTimer <= 0) {
        this._transitionTo(BroadcastDirector.STATE.LEADER_FOLLOW);
      }
    }

    // Decay event cooldown
    if (this._cooldownTimer > 0) {
      this._cooldownTimer -= dt;
    }
  }

  observe(balls, leaderboard, raceTimer, track, gameMode, activeEvent) {
    if (!track || balls.length === 0) return;
    if (this._engine.state !== 'racing') return;

    // --- Manual mode ---
    // If user clicked a specific ball, disable director entirely
    if (this._engine.selectedBallId !== 'leader' && this._engine.selectedBallId !== null) {
      this._manualOverride = true;
      // If we were in a cut, abort it
      if (this._state !== BroadcastDirector.STATE.LEADER_FOLLOW) {
        this._state = BroadcastDirector.STATE.LEADER_FOLLOW;
        this._stateTimer = 0;
      }
      this._targetBallId = 'leader'; // reset target for when manual mode ends
      return;
    }
    this._manualOverride = false;

    // --- FINISH MODE (highest priority, can override any locked shot) ---
    const nearFinish = balls.some(b => !b.finished && !b.eliminated && b.x > track.length - 100);
    if (nearFinish) {
      if (this._state !== BroadcastDirector.STATE.FINISH_MODE) {
        this._transitionTo(BroadcastDirector.STATE.FINISH_MODE);
      }
      return;
    }

    // --- ELIMINATION (can override EVENT_FOCUS / CHAOS_OVERVIEW) ---
    if (gameMode === 'knockout') {
      const remaining = balls.filter(b => !b.eliminated && !b.finished);
      if (remaining.length <= 2 && remaining.length > 0) {
        const lastPlace = remaining.sort((a, b) => a.x - b.x)[0];
        if (this._state !== BroadcastDirector.STATE.ELIMINATION || this._targetBallId !== lastPlace.id) {
          this._targetBallId = lastPlace.id;
          this._transitionTo(BroadcastDirector.STATE.ELIMINATION);
        }
        return;
      }
    }

    // If shot is locked (EVENT_FOCUS / CHAOS_OVERVIEW active), no new events
    if (this._isShotLocked()) return;

    // --- CHAOS OVERVIEW ---
    if (activeEvent && this._lastActiveEvent !== activeEvent) {
      const target = this._pickNonLeaderBall(balls);
      if (target !== null) {
        this._targetBallId = target;
        this._transitionTo(BroadcastDirector.STATE.CHAOS_OVERVIEW);
        this._lastActiveEvent = activeEvent;
        return;
      }
    }
    this._lastActiveEvent = activeEvent;

    // --- EVENT FOCUS (only if cooldown has expired) ---
    if (this._cooldownTimer <= 0) {
      for (const ball of balls) {
        if (ball.finished || ball.eliminated) continue;

        let excitement = 0;

        // Collision events
        if (ball._hitHammerThisFrame || ball._hitPunchFistThisFrame) {
          const speed = Math.hypot(ball.vx, ball.vy);
          if (speed > 15) excitement = 9;
          else if (speed > 10) excitement = 7;
          else if (speed > 6) excitement = 5;
          else excitement = 3;
        }
        if (ball._usedPortalThisFrame) {
          excitement = Math.max(excitement, 6);
        }
        if (ball._enteredBoostThisFrame) {
          // Track sequential boosts for chain detection
          this._boostCounts[ball.code] = (this._boostCounts[ball.code] || 0) + 1;
          if (this._boostCounts[ball.code] >= 3) {
            excitement = Math.max(excitement, 8);
          } else {
            excitement = Math.max(excitement, 3);
          }
        }

        if (excitement >= this._eventThreshold) {
          this._targetBallId = ball.id;
          this._transitionTo(BroadcastDirector.STATE.EVENT_FOCUS);
          return;
        }
      }

      // Reset boost counts for balls that didn't boost this frame
      const boostedCodes = new Set();
      balls.forEach(b => { if (b._enteredBoostThisFrame) boostedCodes.add(b.code); });
      for (const code in this._boostCounts) {
        if (!boostedCodes.has(code)) this._boostCounts[code] = 0;
      }

      // Large rank swings (5+ positions gained or lost)
      if (leaderboard.length > 0) {
        const currentRanks = new Map();
        leaderboard.forEach((entry, idx) => {
          const ball = balls.find(b => b.code === entry.code);
          if (ball) currentRanks.set(ball.id, idx + 1);
        });

        for (const [ballId, currentRank] of currentRanks) {
          const prevRank = this._lastRanks.get(ballId);
          if (prevRank !== undefined) {
            const gain = prevRank - currentRank;
            if (gain >= 5) {
              this._targetBallId = ballId;
              this._transitionTo(BroadcastDirector.STATE.EVENT_FOCUS);
              this._lastRanks = currentRanks;
              return;
            }
            if (gain <= -5) {
              this._targetBallId = ballId;
              this._transitionTo(BroadcastDirector.STATE.EVENT_FOCUS);
              this._lastRanks = currentRanks;
              return;
            }
          }
        }
        this._lastRanks = currentRanks;
      }
    }
  }

  _transitionTo(newState) {
    // LEADER_FOLLOW is always reachable (e.g., state timer expired)
    // FINISH_MODE and ELIMINATION can override any locked shot
    if (this._isShotLocked() &&
        newState !== BroadcastDirector.STATE.LEADER_FOLLOW &&
        newState !== BroadcastDirector.STATE.FINISH_MODE &&
        newState !== BroadcastDirector.STATE.ELIMINATION) {
      return;
    }

    const prevState = this._state;
    this._state = newState;

    switch (newState) {
      case BroadcastDirector.STATE.LEADER_FOLLOW:
        this._stateTimer = 0;
        this._targetBallId = 'leader';
        this._targetZoom = 1.0;
        if (prevState === BroadcastDirector.STATE.EVENT_FOCUS) {
          this._cooldownTimer = 8; // 8s cooldown after event
        }
        break;

      case BroadcastDirector.STATE.EVENT_FOCUS:
        this._stateTimer = 2.0;
        this._targetZoom = 1.0;
        break;

      case BroadcastDirector.STATE.CHAOS_OVERVIEW:
        this._stateTimer = 2.0;
        this._targetZoom = 0.92;
        break;

      case BroadcastDirector.STATE.ELIMINATION:
        this._stateTimer = 2.5;
        this._targetZoom = 1.0;
        break;

      case BroadcastDirector.STATE.FINISH_MODE:
        this._stateTimer = 0; // persists until race ends or no ball is within 100m
        this._targetBallId = 'leader';
        this._targetZoom = 0.95;
        break;
    }
  }

  _isShotLocked() {
    // LEADER_FOLLOW is never locked
    if (this._state === BroadcastDirector.STATE.LEADER_FOLLOW) return false;
    // FINISH_MODE is always locked (can only be overridden by itself)
    if (this._state === BroadcastDirector.STATE.FINISH_MODE) return true;
    // ELIMINATION is locked while timer > 0
    if (this._state === BroadcastDirector.STATE.ELIMINATION) return this._stateTimer > 0;
    // EVENT_FOCUS and CHAOS_OVERVIEW are locked while timer > 0
    return this._stateTimer > 0;
  }

  _pickNonLeaderBall(balls) {
    const active = balls.filter(b => !b.finished && !b.eliminated);
    if (active.length <= 1) return null;
    const sorted = [...active].sort((a, b) => a.x - b.x);
    const idx = 1 + Math.floor(Math.random() * Math.max(1, sorted.length - 2));
    return sorted[Math.min(idx, sorted.length - 1)].id;
  }
}

// Story Engine ??? continuously observes race data, identifies memorable narratives
// Never changes gameplay. Produces Story Events for the Match Events UI.
// Max one story per ~15-20s. Higher-priority stories override in a given frame.
// Priority order: LeaderCrash > Comeback > Rivalry > Dominance > Underdog > Collapse
class StoryEngine {
  constructor(engine) {
    this._engine = engine;
    this._lastStoryTime = 0;
    this._frameCounter = 0;
    this._storyCooldown = 18; // seconds between stories
    this._typeCooldowns = {};
    this._typeCooldownDuration = {
      dominance: 50,
      comeback: 40,
      collapse: 40,
      rivalry: 80,
      underdog: 100,
      survival: 50,
      leaderCrash: 50,
      recordRun: 160,
    };

    // Detection state
    this._dominanceStart = null; // { code, startTime }
    this._currentLeaderCode = null;
    this._prevPositions = {};
    this._prevRanks = {};
    this._rivalryCounts = {};
    this._prevBottomTwo = [];
    this._maxGainThisRace = 0;
    this._prevRecordGain = 0;
    this._initialOrder = [];
    this._bottomThirdIds = new Set();
    this._leaderHitTimestamps = [];
    this._leaderBeforeFrame = null;
    this._messagesUsed = {};

    // DOM elements we injected into the feed
    this._storyElements = [];
    this._storyIdCounter = 0;
  }

  reset() {
    this._lastStoryTime = 0;
    this._frameCounter = 0;
    this._typeCooldowns = {};
    this._dominanceStart = null;
    this._currentLeaderCode = null;
    this._prevPositions = {};
    this._prevRanks = {};
    this._rivalryCounts = {};
    this._prevBottomTwo = [];
    this._maxGainThisRace = 0;
    this._prevRecordGain = 0;
    this._initialOrder = [];
    this._bottomThirdIds = new Set();
    this._leaderHitTimestamps = [];
    this._leaderBeforeFrame = null;
    this._messagesUsed = {};
    this._clearStoryElements();
  }

  observe(balls, leaderboard, raceTimer, track, gameMode) {
    if (!track || balls.length < 2 || this._engine.state !== 'racing') return;
    if (this._initialOrder.length === 0) this._captureInitialOrder(balls);

    // Track collisions every frame (flags are per-frame, can't be throttled)
    this._trackCollisions(balls);

    // Throttle detection to ~5Hz (every ~10 frames at 60fps)
    this._frameCounter++;
    if (this._frameCounter % 10 !== 0) return;

    const active = balls.filter(b => !b.finished && !b.eliminated);
    if (active.length < 2) return;

    // Snapshot leader code before any detection runs (for leader crash check)
    this._leaderBeforeFrame = active.reduce((a, b) => a.x > b.x ? a : b).code;

    // Collect candidate stories this frame
    const candidates = [];

    // 1. DOMINANCE ??? same country leading for > 30s continuous
    this._detectDominance(active, candidates);

    // 2. COMEBACK ??? gain >= 8 positions
    this._detectComeback(active, leaderboard, candidates);

    // 3. COLLAPSE ??? lose >= 7 positions
    this._detectCollapse(active, leaderboard, candidates);

    // 4. RIVALRY ??? same pair exchange 3+ times
    this._detectRivalry(active, leaderboard, candidates);

    // 5. UNDERDOG ??? bottom-third racer enters top 5
    this._detectUnderdog(active, leaderboard, candidates);

    // 6. SURVIVAL ??? escapes bottom 2 in elimination mode
    if (gameMode === 'knockout') {
      this._detectSurvival(active, candidates);
    }

    // 7. LEADER CRASH ??? leader hit by obstacle then loses lead
    this._detectLeaderCrash(active, candidates);

    // 8. RECORD RUN ??? new max position gain
    this._detectRecordRun(active, leaderboard, candidates);

    // Update saved positions for next frame
    this._prevPositions = {};
    leaderboard.forEach((entry, idx) => {
      this._prevPositions[entry.code] = idx + 1;
    });

    // Update rank order for rivalry exchange detection
    this._prevRanks = {};
    leaderboard.forEach((entry, idx) => {
      this._prevRanks[entry.code] = idx + 1;
    });

    // Choose the best candidate and publish it
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.priority - a.priority);
      const best = candidates[0];
      this._publishStory(best.type, best.racerName, best.racerCode);
    }
  }

  // Track collision hits every frame (flags reset each frame, can't throttle)
  _trackCollisions(balls) {
    const now = performance.now();
    for (const ball of balls) {
      if (ball.finished || ball.eliminated) continue;
      if (ball._hitHammerThisFrame || ball._hitPunchFistThisFrame || ball._hitMeteorThisFrame) {
        this._leaderHitTimestamps.push({ code: ball.code, time: now });
      }
    }
    // Prune entries older than 2s
    this._leaderHitTimestamps = this._leaderHitTimestamps.filter(h => now - h.time < 2000);
  }

  // ---- Detection Methods ----

  _detectDominance(active, candidates) {
    const leader = active.reduce((a, b) => a.x > b.x ? a : b);
    const code = leader.code;
    const raceTime = this._engine.raceTimer;

    if (this._currentLeaderCode !== code) {
      this._currentLeaderCode = code;
      this._dominanceStart = { code, startTime: raceTime };
    } else if (this._dominanceStart && (raceTime - this._dominanceStart.startTime) > 30) {
      if (this._canStoryType('dominance')) {
        candidates.push({
          type: 'dominance',
          racerName: leader.name,
          racerCode: code,
          priority: 4,
        });
      }
      // Reset to avoid re-triggering every frame
      this._dominanceStart.startTime = raceTime;
    }
  }

  _detectComeback(active, leaderboard, candidates) {
    if (!this._canStoryType('comeback')) return;
    for (const ball of active) {
      const prev = this._prevPositions[ball.code];
      if (prev === undefined) continue;
      const current = leaderboard.findIndex(e => e.code === ball.code) + 1;
      if (current <= 0) continue;
      const gain = prev - current;
      if (gain >= 8) {
        candidates.push({ type: 'comeback', racerName: ball.name, racerCode: ball.code, priority: 6 });
        return; // one per frame
      }
    }
  }

  _detectCollapse(active, leaderboard, candidates) {
    if (!this._canStoryType('collapse')) return;
    for (const ball of active) {
      const prev = this._prevPositions[ball.code];
      if (prev === undefined) continue;
      const current = leaderboard.findIndex(e => e.code === ball.code) + 1;
      if (current <= 0) continue;
      const loss = current - prev;
      if (loss >= 7) {
        candidates.push({ type: 'collapse', racerName: ball.name, racerCode: ball.code, priority: 2 });
        return;
      }
    }
  }

  _detectRivalry(active, leaderboard, candidates) {
    if (!this._canStoryType('rivalry')) return;
    if (leaderboard.length < 2) return;

    // Count actual position exchanges: when two racers swap order between frames
    const ranks = {};
    leaderboard.forEach((entry, idx) => { ranks[entry.code] = idx + 1; });

    for (const code1 in ranks) {
      for (const code2 in ranks) {
        if (code1 >= code2) continue;
        const r1 = ranks[code1];
        const r2 = ranks[code2];
        const pr1 = this._prevRanks[code1];
        const pr2 = this._prevRanks[code2];
        if (pr1 === undefined || pr2 === undefined) continue;
        // Exchange: one was ahead, now the other is ahead
        if ((r1 < r2 && pr1 > pr2) || (r1 > r2 && pr1 < pr2)) {
          const key = code1 < code2 ? code1 + '|' + code2 : code2 + '|' + code1;
          this._rivalryCounts[key] = (this._rivalryCounts[key] || 0) + 1;
        }
      }
    }

    // Check if any pair has exchanged 3+ times
    for (const [key, count] of Object.entries(this._rivalryCounts)) {
      if (count >= 3) {
        const [code1, code2] = key.split('|');
        const b1 = active.find(b => b.code === code1);
        const b2 = active.find(b => b.code === code2);
        if (b1 && b2) {
          candidates.push({
            type: 'rivalry',
            racerName: b1.name + ' and ' + b2.name,
            racerCode: code1 + ',' + code2,
            priority: 5,
          });
          this._rivalryCounts[key] = 0;
          return;
        }
      }
    }
  }

  _detectUnderdog(active, leaderboard, candidates) {
    if (!this._canStoryType('underdog')) return;
    for (const ball of active) {
      if (!this._bottomThirdIds.has(ball.id)) continue;
      const rank = leaderboard.findIndex(e => e.code === ball.code) + 1;
      if (rank > 0 && rank <= 5) {
        candidates.push({ type: 'underdog', racerName: ball.name, racerCode: ball.code, priority: 3 });
        return;
      }
    }
  }

  _detectSurvival(active, candidates) {
    if (!this._canStoryType('survival')) return;
    const sorted = [...active].sort((a, b) => a.x - b.x);
    const currentBottom = sorted.slice(0, 2).map(b => b.id);

    // Check if someone escaped the bottom
    for (const prevId of this._prevBottomTwo) {
      if (!currentBottom.includes(prevId)) {
        const racer = active.find(b => b.id === prevId);
        if (racer) {
          candidates.push({ type: 'survival', racerName: racer.name, racerCode: racer.code, priority: 1 });
          this._prevBottomTwo = currentBottom;
          return;
        }
      }
    }
    this._prevBottomTwo = currentBottom;
  }

  _detectLeaderCrash(active, candidates) {
    if (!this._canStoryType('leaderCrash')) return;
    if (this._leaderHitTimestamps.length === 0) return;

    // Check if the pre-frame leader (who was hit) has lost the lead
    const currentLeaderCode = active.reduce((a, b) => a.x > b.x ? a : b).code;
    for (const hit of this._leaderHitTimestamps) {
      if (hit.code !== currentLeaderCode && hit.code === this._leaderBeforeFrame) {
        const racer = active.find(b => b.code === hit.code);
        if (racer) {
          candidates.push({ type: 'leaderCrash', racerName: racer.name, racerCode: racer.code, priority: 7 });
          this._leaderHitTimestamps = []; // clear to avoid re-trigger
          return;
        }
      }
    }
  }

  _detectRecordRun(active, leaderboard, candidates) {
    if (!this._canStoryType('recordRun')) return;
    for (const ball of active) {
      const initialIdx = this._initialOrder.indexOf(ball.id);
      if (initialIdx === -1) continue;
      const current = leaderboard.findIndex(e => e.code === ball.code) + 1;
      if (current <= 0) continue;
      const initialPosition = initialIdx + 1;
      const gain = initialPosition - current;
      if (gain > this._maxGainThisRace) {
        this._maxGainThisRace = gain;
        if (gain >= 6 && gain > this._prevRecordGain) {
          this._prevRecordGain = gain;
          candidates.push({ type: 'recordRun', racerName: ball.name, racerCode: ball.code, priority: 0 });
          return;
        }
      }
    }
  }

  _captureInitialOrder(balls) {
    this._initialOrder = balls.map(b => b.id);
    const n = balls.length;
    const third = Math.max(1, Math.floor(n / 3));
    this._bottomThirdIds = new Set(balls.slice(-third).map(b => b.id));
  }

  // ---- Publishing ----

  _publishStory(type, racerName, racerCode) {
    const now = performance.now();
    if (now - this._lastStoryTime < this._storyCooldown * 1000) return;
    this._lastStoryTime = now;

    // Pick a message
    const msg = this._pickMessage(type, racerName);

    // Show on canvas banner
    this._engine.eventBanner.show(msg, 3200);

    // Add to the DOM feed
    this._addToDomFeed(type, msg, racerCode);

    // Set type cooldown
    this._typeCooldowns[type] = now + (this._typeCooldownDuration[type] || 45) * 1000;
  }

  _pickMessage(type, racerName) {
    const templates = STORY_TEMPLATES[type];
    if (!templates) return racerName + ' makes a move!';
    const available = templates.filter(t => {
      const key = type + ':' + t[1];
      return !this._messagesUsed[key];
    });
    const pool = available.length > 0 ? available : templates;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const key = type + ':' + picked[1];
    this._messagesUsed[key] = true;
    // Replace {name} with the racer name
    const text = picked[1].replace(/\{name\}/g, racerName);
    return picked[0] + ' ' + text;
  }

  _addToDomFeed(type, message, racerCode) {
    const list = document.getElementById('rd-feed-list');
    if (!list) return;
    const el = document.createElement('div');
    el.className = 'rd-entry story-entry';
    const color = STORY_COLORS[type] || '#ffd700';
    const id = ++this._storyIdCounter;
    el.dataset.id = 'story-' + id;
    el.innerHTML = `<span class="rd-ts" style="color:${color}">??? STORY</span><span class="rd-msg" style="color:${color}">${message}</span>`;
    el.style.borderLeftColor = color;

    if (list.firstChild) {
      list.insertBefore(el, list.firstChild);
    } else {
      list.appendChild(el);
    }
    this._storyElements.push({ id, el });

    // Enforce max 6 entries total in the feed (including RaceDirector entries)
    const allEntries = list.querySelectorAll('.rd-entry');
    for (let i = 6; i < allEntries.length; i++) {
      const old = allEntries[i];
      if (!old.classList.contains('rd-removing')) {
        old.classList.add('rd-removing');
        setTimeout(() => {
          if (old.parentNode) old.parentNode.removeChild(old);
        }, 400);
      }
    }

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (el.parentNode) {
        el.classList.add('rd-removing');
        setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 400);
      }
      this._storyElements = this._storyElements.filter(s => s.id !== id);
    }, 8000);
  }

  _clearStoryElements() {
    this._storyElements.forEach(s => {
      if (s.el.parentNode) s.el.parentNode.removeChild(s.el);
    });
    this._storyElements = [];
    this._storyIdCounter = 0;
  }

  _canStoryType(type) {
    const cooldownUntil = this._typeCooldowns[type] || 0;
    return performance.now() >= cooldownUntil;
  }
}

// Story message templates ??? each with an emoji prefix
const STORY_TEMPLATES = {
  dominance: [
    ['????', '{name} is dominating this race!'],
    ['????', '{name} refuses to give up the lead!'],
    ['????', '{name} is in complete control!'],
    ['????', 'Nobody can catch {name} today!'],
    ['????', '{name} makes it look easy!'],
    ['????', '{name} is untouchable at the front!'],
  ],
  comeback: [
    ['????', 'Incredible comeback by {name}!'],
    ['????', '{name} is charging through the field!'],
    ['???', '{name} stages an amazing recovery!'],
    ['????', '{name} rockets up the standings!'],
    ['????', 'What a fightback from {name}!'],
    ['???', '{name} defies the odds!'],
  ],
  collapse: [
    ['????', "{name}'s race is falling apart!"],
    ['????', '{name} loses control!'],
    ['????', '{name} is tumbling down the order!'],
    ['????', 'Disaster for {name}!'],
    ['????', '{name} is in deep trouble!'],
    ['????', 'Things go from bad to worse for {name}!'],
  ],
  rivalry: [
    ['???', '{name} are battling for every position!'],
    ['????', '{name} refuse to back down!'],
    ['???', '{name} are locked in battle!'],
    ['????', '{name} are trading places!'],
    ['???', '{name} won\'t give an inch!'],
  ],
  underdog: [
    ['???', '{name} shocks the field!'],
    ['????', '{name} joins the front runners!'],
    ['???', '{name} is climbing the ranks!'],
    ['????', '{name} is making a name for themselves!'],
    ['???', '{name} rises to the occasion!'],
  ],
  survival: [
    ['????', '{name} survives elimination!'],
    ['????', '{name} escapes at the last second!'],
    ['????', '{name} cheats elimination!'],
    ['????', 'Lucky escape for {name}!'],
    ['????', '{name} clings on!'],
  ],
  leaderCrash: [
    ['????', 'The leader has been taken down!'],
    ['????', 'Massive upset at the front!'],
    ['????', 'The leader is hit!'],
    ['????', 'Chaos at the front of the race!'],
    ['????', 'The leader is in trouble!'],
  ],
  recordRun: [
    ['????', 'Biggest comeback of today\'s stream by {name}!'],
    ['????', '{name} sets a new record climb!'],
    ['????', '{name} makes history with this charge!'],
    ['????', 'Unbelievable run from {name}!'],
  ],
};

const STORY_COLORS = {
  dominance: '#ffd700',
  comeback: '#00e676',
  collapse: '#ff5252',
  rivalry: '#ff9100',
  underdog: '#00bcd4',
  survival: '#69f0ae',
  leaderCrash: '#ff1744',
  recordRun: '#d500f9',
};

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
    this._dynamicZoom = 1.0;

// Particles
    this.particles = [];
    this.selectedBallId = null;
    this._footballShowerActive = false;
    this._lavaShowerActive = false;
    this._lavaChunks = [];
    this._lavaShowerSkyDim = 0;
    this._speedSurgeActive = false;
    this._speedSurgeMultipliers = new Map();
    this._blackoutActive = false;
    this._blackoutFadeLevel = 0;
    this._blackoutFlickerTimer = 0;
    this._blackoutDuration = 0;
    this._blackoutPhase = null;
    this._teleportState = null;
    this._teleportTimer = 0;
    this._teleportPairs = [];
    this._teleportPostPairs = [];
    this._whiteFlashAlpha = 0;
    this._meteorTimer = 600 + Math.random() * 600;
    this._activeMeteors = [];
    this._asteroidTimer = 1800 + Math.random() * 600;
    this._activeAsteroid = null;
    this._spaceObjects = [];
    this._blizzardActive = false;
    this._blizzardSnowParticles = [];
    this._blizzardFogParticles = [];
    this._blizzardCrackTimer = 0;
    this._auroraActive = false;
    this._auroraRibbonTime = 0;
    this._auroraStars = [];
    this._auroraFadePhase = null;
    this._auroraFadeProgress = 0;
    this._auroraPulseTimer = 0;
    this._auroraPulseValue = 0;
    this._auroraDominantColor = { r: 75, g: 235, b: 140 };
    this._auroraArcticParticles = [];
    this._auroraSnowGusts = [];
    this._auroraGustTimer = 0;
    this._auroraBackgroundFog = [];
    this._auroraSceneBrightness = 1.0;

    // Volcano eruption state (Magma Crater)
    this._volcanoEruptionActive = false;
    this._volcanoEruptionTimer = 0;
    this._volcanoEruptionX = 0;
    this._volcanoEruptionParticles = [];
    this._volcanoNextEruptionTime = 1200 + Math.random() * 1200; // 20-40 seconds in frames
    this._volcanoAshParticles = [];
    this._volcanoEmberParticles = [];
    this._volcanoSmokeColumns = [];

    // Volcanic Eruption global event state
    this._volcanicEruptionActive = false;
    this._volcanicEruptionPhase = null; // 'warning', 'eruption', 'ending'
    this._volcanicEruptionTimer = 0;
    this._volcanicEruptionFadeProgress = 0;
    this._volcanicEruptionBombs = [];
    this._volcanicEruptionSkyDarkness = 0;
    this._volcanicEruptionGlowIntensity = 0;
    this._volcanicEruptionAshParticles = [];
    this._volcanicEruptionSmokeParticles = [];
    this._volcanicEruptionEmberParticles = [];
    this._volcanicEruptionFountainParticles = [];
    this._volcanicEruptionBombSpawnCounter = 0;
    this._volcanicEruptionScreenFlash = 0;

    // Firestorm event state
    this._firestormActive = false;
    this._firestormPhase = null; // 'build_up', 'active', 'fade_out'
    this._firestormTimer = 0;
    this._firestormFadeProgress = 0;
    this._firestormSkyDarkness = 0;
    this._firestormGlowIntensity = 0;
    this._firestormEmbers = [];
    this._firestormAsh = [];
    this._firestormWindStreaks = [];
    this._firestormSparks = [];
    this._firestormLargeClouds = [];
    this._firestormWhirls = [];
    this._firestormWhirlTimer = 0;
    this._firestormSkyTint = 0;

    // Jungle theme state
    this._jungleGiantTrees = [];
    this._jungleRoots = [];
    this._jungleWaterfalls = [];
    this._jungleSunRays = [];
    this._jungleBirds = [];
    this._jungleButterflies = [];
    this._jungleMonkeys = [];
    this._jungleDragonflies = [];
    this._jungleLeaves = [];
    this._jungleMistParticles = [];
    this._jungleFlowers = [];
    this._jungleWildlife = [];
    this._jungleFireflies = [];
    this._jungleAmbientParticles = [];
    this._jungleRiver = [];
    this._jungleCrossVines = [];

    this.directorMode = null;
    this._directorInput = '';
    this._directorSuggestions = [];
    this._directorSelectedIndex = 0;
    this._directorFlashBalls = [];
    this._directorRemoveButtons = [];
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
    this.hudUpdateTimer = null;
    this._rafId = null;
    this.raceTimer = 0; // in seconds
    this.lastTime = 0;

    // Visual Effects
    this.fireworks = [];
    this.confetti = [];
    this.activeEvent = null;
    this.eventTimer = 0;
    this.eventCount = 0;
    this.maxEvents = 2; // based on user settings
    this._eventIntensityCfg = { base: 20, variation: 3, maxEvents: 18 };
    this.leaderboard = [];
    this.lastKnockoutCycle = 0;

    // Image pattern cache for country flags
    this.flagCache = {};

    // Football image for meteor obstacles
    this.footballImg = null;

    // Commentary & Event systems
    this.commentary = new Commentary();
    this.eventBanner = new GlobalEventBanner(this);
    this.raceDirector = new RaceDirector();
    this.broadcastDirector = new BroadcastDirector(this);
    this.storyEngine = new StoryEngine(this);

    // Anti-jam system state
    this.obstacleReliefActive = false;
    this.obstacleZoneOccupancy = {};

    // Camera Shake
    // Easing helper
    this.easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    this.easeOutExpo = (t) => (t === 1) ? 1 : 1 - Math.pow(2, -10 * t);
    this.easeOutBack = (t) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

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
  generateProceduralTrack(themeKey, length, densityStr, enabledObstacles, obstacleFreqs, densityPct) {
    const theme = MAP_THEMES[themeKey];
    this.currentThemeKey = themeKey;
    this.currentTheme = theme;
    this.physics._isGlacier = themeKey === 'snow';
    this.physics.forwardForce = theme.forwardForce * 0.65;

    // Build enabled set for obstacle filtering
    const enabledSet = enabledObstacles
      ? new Set(enabledObstacles)
      : new Set(OBSTACLE_REGISTRY.filter(o => o.category === 'core' || o.map === themeKey).map(o => o.type));

    // Magma Crater: replace Slow Ramp with Lava Pool entirely
    if (themeKey === 'volcano') {
      enabledSet.delete('slow');
    }

    // Build frequency weight map (1???1, 2???3, 3???5, 4???10, 5???20)
    const freqWeights = {};
    if (obstacleFreqs) {
      OBSTACLE_REGISTRY.forEach(o => {
        const f = obstacleFreqs[o.type] || 3;
        const w = f <= 1 ? 1 : f === 2 ? 3 : f === 3 ? 5 : f === 4 ? 10 : 20;
        freqWeights[o.type] = w;
      });
    }

    // Magma Crater: significantly boost Lava Pool spawn rate to match Boost Pad count
    if (themeKey === 'volcano' && freqWeights.lava_pool) {
      freqWeights.lava_pool = Math.max(freqWeights.lava_pool, 15); // High weight ~same as boost
    }

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
    // Track snakes: right ??? down-right ??? right ??? up-right ??? right ??? down-right ??? finish
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
    const finishX = length - 670;
    track.zones.push({ type: 'finish', x: finishX, y: 0, width: 120, height: 700 });
    track.finishLineX = finishX;

    // Filter ZONE_CONFIG, COMBINATIONS, TEMPLATES by enabled obstacle set
    const _filterTypes = (typesArr) => typesArr.filter(t => enabledSet.has(t));
    const _allEnabled = (typesArr) => typesArr.every(t => enabledSet.has(t));

    // Zone-based obstacle placement
    const getBounds = (x) => this.physics.getWallBoundaries(x, track);
    const clampY = (y, bounds, margin = 30) => {
      return Math.min(Math.max(y, bounds.topY + margin), bounds.bottomY - margin);
    };

    const ballR = 15; // average ball radius

    // Spacing configuration for all obstacles and zones
    const SPACING_CONFIG = {
      boost: { min: 180, preferred: 260, recovery: 100, safeLanding: 120 },
      boost_pipe: { min: 220, preferred: 320, recovery: 150, safeLanding: 120 },
      portal: { min: 250, preferred: 350, recovery: 200, safeLanding: 200 },
      hammer: { min: 280, preferred: 380, recovery: 250, safeLanding: 120 },
      spinner: { min: 150, preferred: 220, recovery: 120, safeLanding: 80 },
      sweep_arm: { min: 150, preferred: 220, recovery: 120, safeLanding: 80 },
      c_bumper: { min: 160, preferred: 240, recovery: 130, safeLanding: 80 },
      punchfist: { min: 180, preferred: 260, recovery: 130, safeLanding: 80 },
      barrier: { min: 140, preferred: 200, recovery: 100, safeLanding: 80 },

peg: { min: 100, preferred: 150, recovery: 60, safeLanding: 40 },
      slow: { min: 100, preferred: 160, recovery: 80, safeLanding: 60 },
      lava_pool: { min: 80, preferred: 120, recovery: 60, safeLanding: 40 },
      lava_geyser: { min: 180, preferred: 300, recovery: 200, safeLanding: 100 },
      launch: { min: 120, preferred: 180, recovery: 80, safeLanding: 120 },
      ice_cannon: { min: 200, preferred: 320, recovery: 150, safeLanding: 120 }
    };

    // Zone-based pacing configuration (t = x / length) ??? higher density, intentional rhythm
    const ZONE_CONFIG = [
      { start: 0.00, end: 0.20, density: 0.45,
        types: _filterTypes(['boost', 'spinner', 'barrier', 'peg', 'c_bumper', 'hammer', 'punchfist', 'sweep_arm', 'lava_pool', 'lava_geyser']) },
      { start: 0.20, end: 0.60, density: 0.35,
        types: _filterTypes(['spinner', 'sweep_arm', 'barrier', 'hammer', 'punchfist', 'c_bumper', 'boost', 'portal', 'ice_cannon', 'lava_pool', 'lava_geyser']) },
      { start: 0.60, end: 0.85, density: 0.40,
        types: _filterTypes(['portal', 'launch', 'barrier', 'boost', 'sweep_arm', 'spinner', 'hammer', 'punchfist', 'ice_cannon', 'lava_pool', 'lava_geyser']) },
      { start: 0.85, end: 1.00, density: 0.45,
        types: _filterTypes(['boost', 'barrier', 'hammer', 'sweep_arm', 'peg', 'punchfist', 'spinner', 'lava_pool', 'lava_geyser']) }
    ];

    // Weighted obstacle combinations for memorable race moments
    const COMBINATIONS = [
      { weight: 5, types: ['boost', 'hammer'], gap: 45 },
      { weight: 5, types: ['spinner', 'hammer'], gap: 45 },
      { weight: 5, types: ['hammer', 'boost'], gap: 45 },
      { weight: 4, types: ['boost', 'spinner'], gap: 40 },
      { weight: 4, types: ['barrier', 'hammer'], gap: 40 },
      { weight: 3, types: ['boost', 'portal'], gap: 50 },
      { weight: 3, types: ['hammer', 'spinner'], gap: 45 },
      { weight: 3, types: ['sweep_arm', 'hammer'], gap: 40 },
      { weight: 2, types: ['portal', 'boost'], gap: 50 },
      { weight: 2, types: ['barrier', 'boost'], gap: 40 },
      { weight: 2, types: ['boost', 'sweep_arm'], gap: 40 },
      { weight: 2, types: ['boost', 'punchfist'], gap: 40 },
      { weight: 2, types: ['spinner', 'punchfist'], gap: 40 },
      { weight: 2, types: ['punchfist', 'hammer'], gap: 40 },
      { weight: 1, types: ['hammer', 'portal'], gap: 50 },
      { weight: 1, types: ['c_bumper', 'spinner'], gap: 40 },
      // Magma Crater: Lava Pool combinations (replace slow ramp combos)
      { weight: 4, types: ['boost', 'lava_pool'], gap: 40 },
      { weight: 3, types: ['lava_pool', 'hammer'], gap: 40 },
      { weight: 3, types: ['spinner', 'lava_pool'], gap: 40 },
      { weight: 2, types: ['lava_pool', 'boost'], gap: 40 },
      { weight: 2, types: ['barrier', 'lava_pool'], gap: 40 },
      { weight: 2, types: ['lava_pool', 'sweep_arm'], gap: 40 },
      { weight: 1, types: ['lava_pool', 'punchfist'], gap: 40 },
      // Magma Crater: Lava Geyser combinations
      { weight: 3, types: ['boost', 'lava_geyser'], gap: 50 },
      { weight: 3, types: ['spinner', 'lava_geyser'], gap: 50 },
      { weight: 2, types: ['lava_geyser', 'hammer'], gap: 50 },
      { weight: 2, types: ['barrier', 'lava_geyser'], gap: 50 },
      { weight: 2, types: ['lava_geyser', 'sweep_arm'], gap: 50 },
      { weight: 1, types: ['lava_geyser', 'punchfist'], gap: 50 },
      { weight: 1, types: ['lava_geyser', 'portal'], gap: 60 },
    ].filter(c => _allEnabled(c.types));

    // 3-obstacle templates that shuffle per race for variety
    const TEMPLATES = [
      ['boost', 'spinner', 'hammer'],
      ['boost', 'hammer', 'portal'],
      ['hammer', 'boost', 'barrier'],
      ['barrier', 'hammer', 'sweep_arm'],
      ['boost', 'spinner', 'punchfist'],
      ['portal', 'hammer', 'boost'],
      ['sweep_arm', 'hammer', 'spinner'],
      ['barrier', 'boost', 'sweep_arm'],
      ['portal', 'boost', 'spinner'],
      ['hammer', 'barrier', 'boost'],
      ['hammer', 'hammer', 'hammer'],
      // Magma Crater: Lava Pool templates
      ['boost', 'lava_pool', 'hammer'],
      ['lava_pool', 'spinner', 'hammer'],
      ['barrier', 'lava_pool', 'boost'],
      ['hammer', 'lava_pool', 'sweep_arm'],
      // Magma Crater: Lava Geyser templates
      ['boost', 'lava_geyser', 'hammer'],
      ['lava_geyser', 'spinner', 'barrier'],
      ['hammer', 'lava_geyser', 'sweep_arm'],
      ['portal', 'lava_geyser', 'boost'],
    ].filter(t => _allEnabled(t));
    // Shuffle templates once per race
    const shuffledTemplates = TEMPLATES.map(t => [...t]).sort(() => Math.random() - 0.5);
    let templateIndex = 0;

    // Per-race combo budget: 4-7 memorable sequences
    let comboCount = 0;
    const MAX_COMBOS = 3 + Math.floor(Math.random() * 3);
    let usedCombos = [];

    // Helper to get bounding box for validation
    const getBB = (obs) => {
      if (!obs || !obs.x || !obs.y) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
      let minX = obs.x;
      let maxX = obs.x;
      let minY = obs.y || 300;
      let maxY = obs.y || 300;

      const w = obs.width || obs.length || (obs.radius * 2) || 40;
      const h = obs.height || (obs.radius * 2) || 40;

        if (obs.type === 'c_bumper' || obs.type === 'rock' || obs.type === 'peg') {
        const r = obs.radius || 20;
        minX = obs.x - r;
        maxX = obs.x + r;
        minY = obs.y - r;
        maxY = obs.y + r;
      } else if (obs.type === 'spinner') {
        const halfLen = obs.length / 2;
        minX = obs.x - halfLen;
        maxX = obs.x + halfLen;
        minY = obs.y - halfLen;
        maxY = obs.y + halfLen;
      } else if (obs.type === 'sweep_arm') {
        const len = obs.length || 100;
        minX = obs.x - len;
        maxX = obs.x + len;
        minY = obs.y - len;
        maxY = obs.y + len;
      } else if (obs.type === 'hammer') {
        const armLen = obs.armLength || 100;
        const r = obs.headRadius || 25;
        minX = obs.x - armLen - r;
        maxX = obs.x + armLen + r;
        minY = obs.y - armLen - r;
        maxY = obs.y + armLen + r;
      } else if (obs.type === 'punchfist') {
        const ext = obs.extendDist || 120;
        const r = obs.punchRadius || 30;
        const angle = obs.angle || 0;
        const tipX = obs.x + Math.cos(angle) * ext;
        const tipY = obs.y + Math.sin(angle) * ext;
        minX = Math.min(obs.x, tipX) - r;
        maxX = Math.max(obs.x, tipX) + r;
        minY = Math.min(obs.y, tipY) - r;
        maxY = Math.max(obs.y, tipY) + r;
      } else if (obs.type === 'barrier') {
        const hw = (obs.width || 18) / 2;
        const hh = (obs.height || 80) / 2;
        const maxGap = obs.gapMax || 200;
        minX = obs.x - hw;
        maxX = obs.x + hw;
        minY = (obs.y || 300) - maxGap / 2 - hh;
        maxY = (obs.y || 300) + maxGap / 2 + hh;
      } else if (obs.type === 'portal') {
        const r = obs.radius || 25;
        minX = obs.x - r;
        maxX = obs.x + r;
        minY = obs.y - r;
        maxY = obs.y + r;
      } else if (obs.type === 'lava_geyser') {
        // Lava geyser: crack in ground with vertical eruption column
        const crackW = obs.crackWidth || 30;
        const crackH = obs.crackHeight || 60;
        const eruptionH = obs.eruptionHeight || 200;
        minX = obs.x - crackW / 2;
        maxX = obs.x + crackW / 2;
        minY = obs.y - crackH / 2;
        maxY = obs.y + crackH / 2 + eruptionH;
      } else if (obs.type === 'carnivorous_vine') {
        if (!obs || !obs.x || !obs.y) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        const vineR = 30;
        minX = obs.x - vineR;
        maxX = obs.x + vineR;
        minY = obs.y - vineR * 2;
        maxY = obs.y + vineR;
      } else if (obs.type === 'collapsing_pillar') {
        if (obs._state === 'fallen' || obs._state === 'disappearing') {
          const fw = obs._fallenWidth || 80;
          const fh = obs._fallenHeight || 35;
          minX = obs.x - fw / 2;
          maxX = obs.x + fw / 2;
          if (obs._wallSide === 'top') {
            minY = obs.y;
            maxY = obs.y + fh;
          } else {
            minY = obs.y - fh;
            maxY = obs.y;
          }
        } else {
          const pw = obs._pillarWidth || 20;
          const ph = obs._pillarHeight || 80;
          minX = obs.x - pw / 2;
          maxX = obs.x + pw / 2;
          if (obs._wallSide === 'top') {
            minY = obs.y;
            maxY = obs.y + ph;
          } else {
            minY = obs.y - ph;
            maxY = obs.y;
          }
        }
      } else {
        const halfW = w / 2;
        const halfH = h / 2;
        minX = obs.x - halfW;
        maxX = obs.x + halfW;
        minY = obs.y - halfH;
        maxY = obs.y + halfH;
      }
      return { minX, maxX, minY, maxY };
    };

    // Helper: checks if two bounding boxes overlap
    const boxesOverlap = (b1, b2, buffer = 10) => {
      return !(
        b1.maxX + buffer < b2.minX ||
        b1.minX - buffer > b2.maxX ||
        b1.maxY + buffer < b2.minY ||
        b1.minY - buffer > b2.maxY
      );
    };

    // Validation pass for a specific segment range
    const validateSegment = (startX, endX) => {
      let errors = 0;

      // Extract all elements in this segment
      const segmentObstacles = track.obstacles.filter(o => o.x >= startX && o.x < endX);
      const segmentZones = track.zones.filter(z => z.x >= startX && z.x < endX && z.type !== 'finish');
      const segmentPegs = track.pegs ? track.pegs.filter(p => p.x >= startX && p.x < endX) : [];

      const elements = [];
      segmentObstacles.forEach(o => elements.push({ item: o, isZone: false }));
      segmentZones.forEach(z => elements.push({ item: z, isZone: true }));

      // 1. Outside track boundaries check
      for (const el of elements) {
        const obs = el.item;
        const bb = getBB(obs);
        const steps = [bb.minX, (bb.minX + bb.maxX) / 2, bb.maxX];
        for (const cx of steps) {
          const bounds = getBounds(cx);
          if (!bounds || bb.minY < bounds.topY - 4 || bb.maxY > bounds.bottomY + 4) {
            errors++;
            break;
          }
        }
      }

      // 2. Overlap checks
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const el1 = elements[i];
          const el2 = elements[j];

          // Exceptions:
          if (el1.item.type === 'boost_pipe' && el2.item.type === 'boost' && Math.abs(el1.item.x - el2.item.x) < 5) continue;
          if (el2.item.type === 'boost_pipe' && el1.item.type === 'boost' && Math.abs(el1.item.x - el2.item.x) < 5) continue;
          if (el1.item.type === 'portal' && el2.item.type === 'portal' && el1.item.pairId === el2.item.pairId) continue;

          const bb1 = getBB(el1.item);
          const bb2 = getBB(el2.item);

          if (boxesOverlap(bb1, bb2, 10)) {
            errors++;
          }
        }
      }

      // 3. Portal checks (paired distance + exit obstacle check + chain/cycle detection)
      const allPortals = segmentZones.filter(z => z.type === 'portal');
      const allTrackPortals = track.zones.filter(z => z.type === 'portal');
      for (const p1 of allPortals) {
        const p2 = allTrackPortals.find(p => p !== p1 && p.type === 'portal' && p.pairId === p1.pairId);
        if (!p2) {
          errors++;
          continue;
        }
        const dist = Math.abs(p1.x - p2.x);
        if (dist < 250) errors++; // Portal exits must be at least 250px away

        // Portal exit must not overlap any obstacle
        const exitBB = getBB(p2);
        for (const el of elements) {
          if (el.item.type === 'portal' && el.item.pairId === p1.pairId) continue;
          if (el.item === p2) continue;
          const elBB = getBB(el.item);
          if (boxesOverlap(exitBB, elBB, 15)) {
            errors++;
          }
        }
      }

      // 3b. Portal chain/cycle detection: check if portal exit leads into another portal entry
      // Build adjacency: portal pair A -> B if A's exit is within B's entry radius
      const portalPairs = [];
      const seenPairIds = new Set();
      for (const p of allTrackPortals) {
        if (!seenPairIds.has(p.pairId)) {
          seenPairIds.add(p.pairId);
          const entry = p;
          const exit = allTrackPortals.find(q => q !== p && q.pairId === p.pairId);
          if (entry && exit) portalPairs.push({ entry, exit, pairId: p.pairId });
        }
      }
      // Build graph: pair A's exit position vs pair B's entry zone
      const adj = {};
      for (let i = 0; i < portalPairs.length; i++) {
        const a = portalPairs[i];
        const exitCenterX = a.exit.x + a.exit.width / 2;
        const exitCenterY = a.exit.y + a.exit.height / 2;
        for (let j = 0; j < portalPairs.length; j++) {
          if (i === j) continue;
          const b = portalPairs[j];
          const entryCenterX = b.entry.x + b.entry.width / 2;
          const entryCenterY = b.entry.y + b.entry.height / 2;
          const dx = exitCenterX - entryCenterX;
          const dy = exitCenterY - entryCenterY;
          const entryRadius = b.entry.width / 2 + 10; // trigger radius
          if (dx * dx + dy * dy < entryRadius * entryRadius) {
            if (!adj[i]) adj[i] = [];
            adj[i].push(j);
          }
        }
      }
      // Detect cycles using DFS
      const visited = new Set();
      const recStack = new Set();
      const dfs = (node) => {
        if (recStack.has(node)) return true; // cycle found
        if (visited.has(node)) return false;
        visited.add(node);
        recStack.add(node);
        const neighbors = adj[node] || [];
        for (const n of neighbors) {
          if (dfs(n)) return true;
        }
        recStack.delete(node);
        return false;
      };
      for (let i = 0; i < portalPairs.length; i++) {
        if (dfs(i)) {
          errors++;
          break;
        }
      }

      // 4. Blocked boost check
      const boosts = [];
      segmentZones.forEach(z => { if (z.type === 'boost') boosts.push(z); });
      segmentObstacles.forEach(o => { if (o.type === 'boost_pipe') boosts.push(o); });

      boosts.forEach(b => {
        const bbBoost = getBB(b);
        const checkXStart = bbBoost.maxX;
        const checkXEnd = bbBoost.maxX + 220;

        segmentObstacles.forEach(obs => {
          if (obs.type === 'boost_pipe') return;
          const bbObs = getBB(obs);
          if (bbObs.minX >= checkXStart && bbObs.minX <= checkXEnd) {
            // direct vertical alignment check
            if (!(bbObs.maxY < bbBoost.minY || bbObs.minY > bbBoost.maxY)) {
              errors++;
            }
          }
        });
      });

      // 5. Dead end detection: check if obstacles fully block the lane at any X
      const scanStep = 40;
      for (let sx = startX + scanStep; sx < endX - scanStep; sx += scanStep) {
        const bounds = getBounds(sx);
        if (!bounds) continue;
        const laneTop = bounds.topY;
        const laneBottom = bounds.bottomY;
        const laneHeight = laneBottom - laneTop;

        // Collect all obstacles spanning this X
        const covering = [];
        for (const el of elements) {
          const bb = getBB(el.item);
          if (bb.minX <= sx && bb.maxX >= sx) {
            covering.push({ minY: bb.minY, maxY: bb.maxY });
          }
        }
        // Merge intervals
        covering.sort((a, b) => a.minY - b.minY);
        let merged = [];
        for (const c of covering) {
          if (merged.length === 0) {
            merged.push({ minY: c.minY, maxY: c.maxY });
          } else {
            const last = merged[merged.length - 1];
            if (c.minY <= last.maxY + 5) {
              last.maxY = Math.max(last.maxY, c.maxY);
            } else {
              merged.push({ minY: c.minY, maxY: c.maxY });
            }
          }
        }
        // Calculate total blocked height
        let blocked = 0;
        for (const m of merged) {
          blocked += Math.min(m.maxY, laneBottom) - Math.max(m.minY, laneTop);
        }
        if (blocked > laneHeight * 0.88 && laneHeight > 50) {
          errors++;
          break;
        }
      }

      // 6. Bouncing trap detection: opposing obstacles with narrow gap
      for (let i = 0; i < segmentObstacles.length; i++) {
        for (let j = i + 1; j < segmentObstacles.length; j++) {
          const o1 = segmentObstacles[i];
          const o2 = segmentObstacles[j];
          const bb1 = getBB(o1);
          const bb2 = getBB(o2);
          // X overlap
          if (bb1.maxX < bb2.minX - 10 || bb2.maxX < bb1.minX - 10) continue;
          // One near top, one near bottom
          const bounds = getBounds((bb1.minX + bb1.maxX) / 2);
          if (!bounds) continue;
          const laneMid = (bounds.topY + bounds.bottomY) / 2;
          const o1Above = bb1.maxY < laneMid;
          const o2Above = bb2.maxY < laneMid;
          if ((o1Above && o2Above) || (!o1Above && !o2Above)) continue; // both same side, skip
          // Check gap
          const topMaxY = o1Above ? bb1.maxY : bb2.maxY;
          const bottomMinY = o1Above ? bb2.minY : bb1.minY;
          const gap = bottomMinY - topMaxY;
          if (gap < 55 && gap > 0) {
            errors++;
          }
        }
      }

      return errors;
    };

    // Helper: generates standard structured layout inside a segment
    const generateSegmentObstacles = (segStart, segEnd) => {
      let x = segStart + 50 + Math.random() * 50;
      let lastPlacedType = null;
      let secondLastPlacedType = null;
      let thirdLastPlacedType = null;
      let recoveryRemaining = 0;
      let clusterRemaining = 0;
      let gapUntil = x;
      const segObstaclePositions = [];

      // Density slider (20-100%): higher = more obstacles, tighter spacing
      // multiplier: 1.8 at 20% ??? 0.5 at 100% (3.6x range)
      const pct = densityPct || 80;
      const densityMult = 1.8 - (pct / 100) * 1.3;
      // Cap to avoid division by zero / negative
      let densityFactor = Math.max(0.35, densityMult);

      const MAJOR_OBSTACLES = _filterTypes(['hammer', 'spinner', 'c_bumper', 'portal', 'punchfist', 'sweep_arm', 'barrier']);

      const FORBIDDEN_NEXT = {};
      [
        ['hammer', ['portal', 'hammer']],
        ['portal', ['hammer', 'punchfist', 'spinner', 'portal']],
        ['spinner', ['hammer', 'portal']],
        ['punchfist', ['hammer', 'portal']],
        ['sweep_arm', ['hammer', 'portal']],
        ['barrier', ['portal', 'hammer']],
        ['boost', ['slow', 'boost']],
        ['slow', ['boost', 'slow']]
      ].forEach(([key, vals]) => {
        if (enabledSet.has(key)) {
          const filtered = vals.filter(v => enabledSet.has(v));
          if (filtered.length) FORBIDDEN_NEXT[key] = filtered;
        }
      });

      let comboNextType = null;
      let comboNextType2 = null;
      let consecutiveClusters = 0;
      let _lastPunchHigh = false;
      let _lastHammerTop = false;
      let _hammerCorridorRemaining = 0;
      let _hammerCorridorsUsed = 0;
      const MAX_HAMMER_CORRIDORS = 1 + Math.floor(Math.random() * 3);

      let _safety = 0;
      while (x < segEnd - 150) {
        if (++_safety > 500) { console.log('INFINITE LOOP in generateSegmentObstacles'); break; }
        let forceSafe = recoveryRemaining > 0;

        // Hammer corridor mode: place alternating hammers directly
        if (_hammerCorridorRemaining > 0) {
          const cBounds = getBounds(x);
          if (!cBounds) { x += 200; continue; }
          const cAvail = cBounds.bottomY - cBounds.topY;
          if (cAvail < 160) { _hammerCorridorRemaining = 0; x += 200; continue; }
          const cArmLen = Math.min(70 + Math.random() * 20, cAvail * 0.45);
          const cHeadRad = 22 + Math.random() * 6;
          const cTop = !_lastHammerTop;
          _lastHammerTop = cTop;
          const cPY = cTop ? cBounds.topY + 8 : cBounds.bottomY - 8;
          const cAngle = Math.random() * Math.PI * 2;
          track.obstacles.push({
            type: 'hammer', x, y: cPY, armLength: cArmLen, headRadius: cHeadRad,
            angle: cAngle, speed: 0.160 + Math.random() * 0.040,
            direction: Math.random() < 0.5 ? 1 : -1, pivotTop: cTop,
            headX: x + Math.cos(cAngle) * cArmLen,
            headY: cPY + Math.sin(cAngle) * cArmLen
          });
          segObstaclePositions.push(x);
          _hammerCorridorRemaining--;
          x += 140 + Math.random() * 30;
          if (_hammerCorridorRemaining > 0) continue;
        }

        const t = x / length;

        // Determine current pacing zone
        const currentZone = ZONE_CONFIG.find(z => t >= z.start && t < z.end) || ZONE_CONFIG[ZONE_CONFIG.length - 1];
        let allowedTypes = currentZone.types;
        const zoneDensity = currentZone.density;

        // Cluster/gap alternation: if in a gap, skip ahead until gap ends
        if (gapUntil > x && !comboNextType) {
          x += Math.min(gapUntil - x, 200);
          if (x < gapUntil) continue;
        }

        // Combo sequence: if a combo partner is queued, force it
        let type;
        if (comboNextType) {
          type = comboNextType;
          comboNextType = comboNextType2;
          comboNextType2 = null;
        } else {
          // No 3 identical obstacles in a row
          let filtered = allowedTypes.filter(t => t !== lastPlacedType || t !== secondLastPlacedType || t !== thirdLastPlacedType);
          if (filtered.length === 0) filtered = allowedTypes.filter(t => t !== lastPlacedType);

          // Forbidden sequence prevention
          if (lastPlacedType && FORBIDDEN_NEXT[lastPlacedType]) {
            filtered = filtered.filter(t => !FORBIDDEN_NEXT[lastPlacedType].includes(t));
            if (filtered.length === 0) filtered = allowedTypes.filter(t => t !== lastPlacedType);
          }

          // Forced safe types during recovery period
          if (forceSafe) {
            const safeTypes = filtered.filter(t => !MAJOR_OBSTACLES.includes(t));
            if (safeTypes.length > 0) filtered = safeTypes;
            recoveryRemaining -= 1;
          }

          // Weighted random selection based on obstacle frequency
          const weights = filtered.map(t => freqWeights[t] || 5);
          const totalW = weights.reduce((a, b) => a + b, 0);
          let rw = Math.random() * totalW;
          type = filtered[filtered.length - 1];
          for (let wi = 0; wi < filtered.length; wi++) {
            if (rw < weights[wi]) { type = filtered[wi]; break; }
            rw -= weights[wi];
          }
        }

        const bounds = getBounds(x);
        if (!bounds) {
          x += 200;
          continue;
        }

        const centerY = (bounds.topY + bounds.bottomY) / 2;
        const availH = bounds.bottomY - bounds.topY;
        const halfH = availH / 2;

        // Skip hammer & punchfist in narrow track sections
        if ((type === 'hammer' || type === 'punchfist') && availH < 160) {
          x += 200;
          continue;
        }

        // Skip placement near restricted zones (barrier gaps, rotating circles)
        let nearRestricted = false;
        for (const _r of track.obstacles) {
          if (_r.type === 'barrier' && Math.abs(x - _r.x) < 100) { nearRestricted = true; break; }
          if (_r.type === 'c_bumper' && Math.abs(x - _r.x) < (_r.radius || 55) + 50) { nearRestricted = true; break; }
        }
        if (nearRestricted) {
          if (type === 'peg' || type === 'barrier' || type === 'spinner' || type === 'hammer' || type === 'punchfist' || type === 'sweep_arm' || type === 'c_bumper') {
            x += 80;
            continue;
          }
        }

        // Start Alternating Hammer Corridor?
        if (_hammerCorridorsUsed < MAX_HAMMER_CORRIDORS && type === 'hammer' && !forceSafe && t >= 0.20 && t < 0.85 && segEnd - x > 700 && Math.random() < 0.18) {
          _hammerCorridorRemaining = 5 + Math.floor(Math.random() * 4);
          _hammerCorridorsUsed++;
        }

        const cfg = SPACING_CONFIG[type] || { min: 150, preferred: 200, recovery: 0, safeLanding: 0 };
        const _prevObsLen = track.obstacles.length;
        const _prevZoneLen = track.zones.length;

        // 1. Position details & dynamic sizing based on available lane height
        if (type === 'c_bumper') {
          // 70% chance rotating C-bumper, 30% chance boost pipe corridor
          if (Math.random() < 0.70) {
            const radius = Math.min(65 + Math.random() * 15, availH * 0.40);
            const midY = clampY(centerY + (Math.random() - 0.5) * 20, bounds, radius + 8);
            const spinSpeed = (0.04 + Math.random() * 0.04) * (Math.random() < 0.5 ? -1 : 1);
            track.obstacles.push({
              type: 'c_bumper', x, y: midY, radius, thickness: 8,
              rotation: Math.random() * Math.PI * 2, spinSpeed
            });
          } else {
            const pipeLen = 150 + Math.random() * 70;
            const pipeH = 46 + Math.random() * 8;
            const onTop = Math.random() < 0.5;
            const pipeY = onTop
              ? clampY(bounds.topY + 50 + pipeH / 2, bounds, pipeH / 2 + 5)
              : clampY(bounds.bottomY - 50 - pipeH / 2, bounds, pipeH / 2 + 5);

            track.obstacles.push({
              type: 'boost_pipe', x, y: pipeY,
              length: pipeLen, width: pipeH,
              boostMultiplier: 1.35 + Math.random() * 0.2
            });

            track.zones.push({
              type: 'boost', x: x, y: pipeY - pipeH / 2,
              width: pipeLen, height: pipeH, force: 0.38
            });
          }
        } else if (type === 'boost') {
          const boostClose = track.zones.some(z => (z.type === 'slow' || z.type === 'mud_puddle || lava_pool') && Math.abs(z.x + z.width / 2 - x) < 400);
          if (boostClose) { x += 200; continue; }
          const w = 75;
          const h = 45;
          track.zones.push({
            type: 'boost', x: x - w / 2,
            y: clampY(centerY + (Math.random() - 0.5) * halfH * 0.5, bounds, h / 2 + 5) - h / 2,
            width: w, height: h, force: 0.20
          });
        } else if (type === 'lava_pool') {
          // Magma Crater: Lava Pool (replaces Slow Ramp)
          const slowClose = track.zones.some(z => z.type === 'boost' && Math.abs(z.x + z.width / 2 - x) < 400);
          if (slowClose) { x += 200; continue; }
          const w = themeKey === 'jungle' ? 135 : 60;
          const h = themeKey === 'jungle' ? 101 : 45;
          const zoneType = themeKey === 'jungle' ? 'mud_puddle || lava_pool' : 'slow';
          track.zones.push({
            type: zoneType, x: x - w / 2,
            y: clampY(centerY + (Math.random() - 0.5) * halfH * 0.5, bounds, h / 2 + 5) - h / 2,
            width: w, height: h
          });
        } else if (type === 'slow') {
          // Standard Slow Ramp (non-volcano maps only)
          const slowClose = track.zones.some(z => z.type === 'boost' && Math.abs(z.x + z.width / 2 - x) < 400);
            if (slowClose) { x += 200; continue; }
            const w = 60;
            const h = 45;
            track.zones.push({
              type: 'slow', x: x - w / 2,
              y: clampY(centerY + (Math.random() - 0.5) * halfH * 0.5, bounds, h / 2 + 5) - h / 2,
              width: w, height: h
            });
        } else if (type === 'punchfist') {
          const punchAngle = Math.random() * Math.PI * 2;
          const punchRadius = 28 + Math.random() * 6;
          if (lastPlacedType === 'punchfist') _lastPunchHigh = !_lastPunchHigh;
          else _lastPunchHigh = Math.random() < 0.5;
          const punchY = _lastPunchHigh
            ? clampY(centerY - availH * 0.25, bounds, punchRadius + 10)
            : clampY(centerY + availH * 0.25, bounds, punchRadius + 10);
          track.obstacles.push({
            type: 'punchfist', x, y: punchY,
            angle: punchAngle, extendDist: 90 + Math.random() * 30,
            punchRadius, state: 'retracted', stateTimer: 0,
            extendSpeed: 12 + Math.random() * 6,
            retractSpeed: 6 + Math.random() * 3,
            holdDuration: 5 + Math.floor(Math.random() * 10),
            waitDuration: 10 + Math.floor(Math.random() * 15),
            punchX: x, punchY: centerY
          });
        } else if (type === 'portal') {
          const pairId = Math.random().toString(36).slice(2);
          const distAhead = 750 + Math.random() * 350;
          const portalSize = 50;
          const p1Y = clampY(centerY + (Math.random() - 0.5) * 30, bounds, portalSize / 2 + 8);
          
          // Exit portal ??? must be placeable for the pair to exist
          const x2 = Math.min(x + distAhead, segEnd - 100);
          const bounds2 = getBounds(x2);
          if (bounds2 && x2 > x + 250) {
            const p2Y = clampY((bounds2.topY + bounds2.bottomY) / 2, bounds2, portalSize / 2 + 10);
            // Both portals confirmed ??? push entry then exit
            track.zones.push({
              type: 'portal', x: x - portalSize / 2, y: p1Y - portalSize / 2,
              width: portalSize, height: portalSize, pairId, radius: portalSize / 2
            });
            track.zones.push({
              type: 'portal', x: x2 - portalSize / 2, y: p2Y - portalSize / 2,
              width: portalSize, height: portalSize, pairId, radius: portalSize / 2
            });
            // Skip spacing offset forward
            x = x2 + 50;
          }
        } else if (type === 'launch') {
          const padW = 50;
          track.zones.push({
            type: 'launch', x: x - padW / 2, y: bounds.bottomY - 20,
            width: padW, height: 20
          });
        } else if (type === 'barrier') {
          const gateW = 18 + Math.random() * 4;
          const gateH = Math.min(80 + Math.random() * 20, availH * 0.55);
          const gapMax = availH * 0.55;
          track.obstacles.push({
            type: 'barrier', x, y: centerY, width: gateW, height: gateH,
            isVertical: true, gapMin: 0, gapMax,
            state: 'opening', stateTimer: 0,
            openDuration: 20 + Math.floor(Math.random() * 20),
            closeDuration: 15 + Math.floor(Math.random() * 15),
            currentGap: 0, slideSpeed: 6.0 + Math.random() * 2.0,
            topY: bounds.topY, bottomY: bounds.bottomY
          });
        } else if (type === 'spinner') {
          const barLen = Math.min(80 + Math.random() * 35, availH * 0.55); // Scaled
          const baseSpeed = 0.065;
          const speedPct = [1.0, 0.8, 0.7, 0.5][Math.floor(Math.random() * 4)];
          const spinSpeed = baseSpeed * speedPct * (Math.random() < 0.5 ? 1 : -1);
          track.obstacles.push({
            type: 'spinner', x, y: clampY(centerY, bounds, barLen / 2 + 6),
            length: barLen, angle: Math.random() * Math.PI * 2,
            speed: spinSpeed, pins: []
          });
        } else if (type === 'sweep_arm') {
          const armLen = Math.min(90 + Math.random() * 40, availH * 0.60);
          const slowSpeed = 0.090 + Math.random() * 0.035;
          track.obstacles.push({
            type: 'sweep_arm', x, y: clampY(centerY, bounds, 20),
            length: armLen, angle: Math.random() * Math.PI * 2,
            speed: slowSpeed * 0.3, physicsSpeed: slowSpeed,
            direction: Math.random() < 0.5 ? 1 : -1
          });
        } else if (type === 'hammer') {
          const armLen = Math.min(75 + Math.random() * 25, availH * 0.50);
          const headRadius = 22 + Math.random() * 6;
          let topPivot;
          if (lastPlacedType === 'hammer') topPivot = !_lastHammerTop;
          else topPivot = Math.random() < 0.5;
          _lastHammerTop = topPivot;
          const pivotY = topPivot ? bounds.topY + 8 : bounds.bottomY - 8;
          const startAngle = Math.random() * Math.PI * 2;
          track.obstacles.push({
            type: 'hammer', x, y: pivotY, armLength: armLen, headRadius,
            angle: startAngle,
            speed: 0.140 + Math.random() * 0.060,
            direction: Math.random() < 0.5 ? 1 : -1,
            pivotTop: topPivot,
            headX: x + Math.cos(startAngle) * armLen,
            headY: pivotY + Math.sin(startAngle) * armLen
          });

        } else if (type === 'peg') {
          if (!track.pegs) track.pegs = [];
          const pegR = 4 + Math.random() * 2;
          const count = 2 + Math.floor(Math.random() * 2);
          const spacing = 40 + Math.random() * 8;
          const startY = clampY(centerY - (count - 1) * spacing / 2 + (Math.random() - 0.5) * availH * 0.35, bounds, spacing / 2 + 5);
          const pegX = x + (Math.random() - 0.5) * 15;
          for (let pi = 0; pi < count; pi++) {
            track.pegs.push({
              x: pegX + (Math.random() - 0.5) * 4,
              y: startY + pi * spacing,
              radius: pegR, bouncy: true
            });
          }
        } else if (type === 'ice_cannon') {
          const cannonH = 50;
          const barrelLen = 40;
          const cannonY = clampY(centerY + (Math.random() - 0.5) * availH * 0.15, bounds, cannonH * 0.5 + 10);
          track.obstacles.push({
            type: 'ice_cannon', x, y: cannonY,
            cannonHeight: cannonH, barrelLength: barrelLen,
            _lastFireTime: Math.floor(Math.random() * 120), _fireInterval: 120,
            _projectiles: [], _splashEffects: []
          });
        } else if (type === 'lava_geyser') {
          // Magma Crater exclusive: Lava Geyser - periodic eruption from ground crack
          const geyserY = clampY(centerY + (Math.random() - 0.5) * availH * 0.4, bounds, 20);
          track.obstacles.push({
            type: 'lava_geyser', x, y: geyserY,
            // Cycle timing (in frames at 60fps)
            _hiddenDuration: 180 + Math.floor(Math.random() * 180), // 3-6 seconds hidden
            _warningDuration: 30, // 0.5 seconds warning
            _eruptionDuration: 60, // 1 second eruption
            _cycleTimer: Math.floor(Math.random() * 420), // Random start offset
            _state: 'hidden', // 'hidden' | 'warning' | 'erupting'
            // Visual properties
            _crackWidth: 8 + Math.random() * 6, // 8-14px crack width
            crackHeight: 60 + Math.random() * 20, // 60-80px crack height
            _eruptionHeight: 180 + Math.random() * 60, // 180-240px lava column height
            _eruptionWidth: 24 + Math.random() * 12, // 24-36px column width
            _seed: Math.random() * 1000 // For deterministic particle positions
          });
        }

        // Track last 3 types to prevent triplicates
        thirdLastPlacedType = secondLastPlacedType;
        secondLastPlacedType = lastPlacedType;
        lastPlacedType = type;

        if (clusterRemaining > 0) clusterRemaining--;
        segObstaclePositions.push(x);

        // Overlap prevention: check new elements against ALL existing obstacle/zone BBs
        let _overlap = false;
        for (let _oi = _prevObsLen; _oi < track.obstacles.length && !_overlap; _oi++) {
          const _newBB = getBB(track.obstacles[_oi]);
          for (let _oj = 0; _oj < _prevObsLen; _oj++) {
            if (boxesOverlap(_newBB, getBB(track.obstacles[_oj]), 40)) { _overlap = true; break; }
          }
          if (!_overlap) {
            for (let _zj = 0; _zj < _prevZoneLen; _zj++) {
              if (boxesOverlap(_newBB, getBB(track.zones[_zj]), 40)) { _overlap = true; break; }
            }
          }
        }
        for (let _zi = _prevZoneLen; _zi < track.zones.length && !_overlap; _zi++) {
          const _newBB = getBB(track.zones[_zi]);
          for (let _oj = 0; _oj < _prevObsLen; _oj++) {
            if (boxesOverlap(_newBB, getBB(track.obstacles[_oj]), 40)) { _overlap = true; break; }
          }
          if (!_overlap) {
            for (let _zj = 0; _zj < _prevZoneLen; _zj++) {
              if (boxesOverlap(_newBB, getBB(track.zones[_zj]), 40)) { _overlap = true; break; }
            }
          }
        }
        if (_overlap) {
          while (track.obstacles.length > _prevObsLen) track.obstacles.pop();
          while (track.zones.length > _prevZoneLen) track.zones.pop();
          lastPlacedType = secondLastPlacedType;
          secondLastPlacedType = thirdLastPlacedType;
          continue;
        }

        const isDifficult = MAJOR_OBSTACLES.includes(type);
        let nextSpacing = cfg.preferred;
        if (type === 'boost' || isDifficult) nextSpacing += cfg.recovery;
        if (type === 'boost') nextSpacing += 120;
        if (type === 'portal') nextSpacing += cfg.safeLanding;

        const xBeforeAdvance = x;

        // Dynamic density: variable spacing creates organic feel
        const variability = 0.75 + Math.random() * 0.25;
        const normalAdvance = Math.max(cfg.min, nextSpacing * densityFactor * zoneDensity * variability);
        x += normalAdvance;

        // Attempt to start a combo or template (clusters of 2-3)
        const clusterComboChance = consecutiveClusters >= 2 ? 0.40 : 0.75;
        if (!comboNextType && !forceSafe && comboCount < MAX_COMBOS && lastPlacedType && Math.random() < clusterComboChance) {
          consecutiveClusters++;
          if (templateIndex < shuffledTemplates.length && Math.random() < 0.4) {
            const template = shuffledTemplates[templateIndex];
            if (template[0] === lastPlacedType && currentZone.types.includes(template[1]) && currentZone.types.includes(template[2])) {
              comboNextType = template[1];
              comboNextType2 = template[2];
              x = Math.max(xBeforeAdvance + 80, xBeforeAdvance + 100);
              comboCount++;
              templateIndex++;
              clusterRemaining = 2;
            }
          }
          if (!comboNextType) {
            const compatible = COMBINATIONS.filter(c =>
              c.types[0] === lastPlacedType &&
              !usedCombos.includes(c) &&
              currentZone.types.includes(c.types[1])
            );
            if (compatible.length > 0) {
              const totalWeight = compatible.reduce((s, c) => s + c.weight, 0);
              let roll = Math.random() * totalWeight;
              for (const combo of compatible) {
                roll -= combo.weight;
                if (roll <= 0) {
                  comboNextType = combo.types[1];
                  x = Math.max(xBeforeAdvance + 80, xBeforeAdvance + combo.gap * 2);
                  usedCombos.push(combo);
                  comboCount++;
                  clusterRemaining = 1;
                  break;
                }
              }
            }
          }
          // If no compatible combo found, revert the consecutive counter
          if (!comboNextType) consecutiveClusters--;
        }

        // If not in a combo and cluster done, schedule next gap
        if (!comboNextType && clusterRemaining <= 0) {
          const gapLen = consecutiveClusters > 0
            ? 120 + Math.random() * 160
            : 80 + Math.random() * 100;
          consecutiveClusters = 0;
          lastPlacedType = null;
          secondLastPlacedType = null;
          thirdLastPlacedType = null;
          gapUntil = x + gapLen;
        }

        if (isDifficult) {
          recoveryRemaining = Math.max(recoveryRemaining, 3);
        } else {
          recoveryRemaining = Math.max(0, recoveryRemaining - 1);
        }
      }

      // Dead-space validation: fill excessive gaps based on density
      // Higher density = lower threshold (fill even moderate gaps)
      const maxGap = Math.round(1100 - (pct / 100) * 900); // e.g. 1100px at 20%, 200px at 100%
      if (segObstaclePositions.length > 1) {
        for (let i = 1; i < segObstaclePositions.length; i++) {
          const gap = segObstaclePositions[i] - segObstaclePositions[i - 1];
          if (gap > maxGap) {
            const insX = segObstaclePositions[i - 1] + gap / 2;
            if (insX < segEnd - 150) {
              const ib = getBounds(insX);
              if (ib) {
                const icY = (ib.topY + ib.bottomY) / 2;
                const iAvail = ib.bottomY - ib.topY;
                // Only use enabled obstacles for gap filling
                const fb = ['boost', 'spinner', 'barrier'].filter(t => enabledSet.has(t));
                if (fb.length === 0) continue;
                const ft = fb[Math.floor(Math.random() * fb.length)];
                if (ft === 'boost') {
                  const bClose = track.zones.some(z => (z.type === 'slow' || z.type === 'lava_pool') && Math.abs(z.x + z.width / 2 - insX) < 400);
                  if (bClose) continue;
                  track.zones.push({ type: 'boost', x: insX - 37, y: clampY(icY - 22, ib, 27), width: 75, height: 45, force: 0.20 });
                } else if (ft === 'spinner') {
                  track.obstacles.push({ type: 'spinner', x: insX, y: clampY(icY, ib, 40), length: Math.min(80, iAvail * 0.4), angle: 0, speed: 0.04, pins: [] });
                } else if (ft === 'barrier') {
                  track.obstacles.push({ type: 'barrier', x: insX, y: icY, width: 18, height: Math.min(80, iAvail * 0.5), isVertical: true, gapMin: 0, gapMax: iAvail * 0.5, state: 'opening', stateTimer: 0, openDuration: 100, closeDuration: 100, currentGap: 0, slideSpeed: 6.0 + Math.random() * 2.25, topY: ib.topY, bottomY: ib.bottomY });
                }
              }
            }
          }
        }
      }
    };

    // Helper: generates a safe backup layout when regeneration retries exhaust
    const generateSparseSegment = (trackObj, startX, endX) => {
      let x = startX + 150;
      while (x < endX - 150) {
        const bounds = getBounds(x);
        if (bounds) {
          const centerY = (bounds.topY + bounds.bottomY) / 2;
          // Simple launch pad or peg stack
          if (Math.random() < 0.5) {
            trackObj.zones.push({
              type: 'launch', x: x - 25, y: bounds.bottomY - 20,
              width: 50, height: 20
            });
          } else {
            if (!trackObj.pegs) trackObj.pegs = [];
            trackObj.pegs.push({ x, y: centerY - 30, radius: 5, bouncy: true });
            trackObj.pegs.push({ x, y: centerY + 30, radius: 5, bouncy: true });
          }
        }
        x += 400; // very wide spacing
      }
    };

    // Segment partition and loop (leave last 1000px before finish obstacle-free)
    const numSegments = 10;
    const segmentWidth = (finishX - 1800) / numSegments;

    for (let s = 0; s < numSegments; s++) {
      const segStart = 800 + s * segmentWidth;
      const segEnd = segStart + segmentWidth;

      let retries = 0;
      let valid = false;

      while (retries < 10 && !valid) {
        // Clear old items inside this segment range
        track.obstacles = track.obstacles.filter(o => o.x < segStart || o.x >= segEnd);
        track.zones = track.zones.filter(z => z.x < segStart || z.x >= segEnd || z.type === 'finish');
        if (track.pegs) track.pegs = track.pegs.filter(p => p.x < segStart || p.x >= segEnd);

        // Generate segment contents
        generateSegmentObstacles(segStart, segEnd);

        // Run validation pass
        const errors = validateSegment(segStart, segEnd);
        if (errors === 0) {
          valid = true;
        } else {
          retries++;
        }
      }

      // If segment keeps failing, fall back to safe spacing sparse layout
      if (!valid) {
        track.obstacles = track.obstacles.filter(o => o.x < segStart || o.x >= segEnd);
        track.zones = track.zones.filter(z => z.x < segStart || z.x >= segEnd || z.type === 'finish');
        if (track.pegs) track.pegs = track.pegs.filter(p => p.x < segStart || p.x >= segEnd);
        generateSparseSegment(track, segStart, segEnd);
      }
    }
    
    // Ensure minimum counts: at least 30 of each major type per race (only enabled types)
    const MIN_COUNT = 30;
    const TYPE_COUNTS = {};
    ['hammer', 'spinner', 'barrier', 'sweep_arm', 'punchfist',
     'c_bumper', 'boost', 'slow', 'portal', 'launch', 'ice_cannon', 'mud_puddle', 'lava_geyser']
      .filter(t => enabledSet.has(t))
      .forEach(t => { TYPE_COUNTS[t] = 0; });
    track.obstacles.forEach(o => { if (TYPE_COUNTS[o.type] !== undefined) TYPE_COUNTS[o.type]++; });
    track.zones.forEach(z => { if (z.type !== 'finish' && TYPE_COUNTS[z.type] !== undefined) TYPE_COUNTS[z.type]++; });
    const underTypes = Object.keys(TYPE_COUNTS).filter(t => TYPE_COUNTS[t] < MIN_COUNT);
    const _isRestricted = (px) => {
      if (Math.abs(px - finishX) < 1000) return true;
      for (const _r of track.obstacles) {
        if (_r.type === 'barrier' && Math.abs(px - _r.x) < 100) return true;
        if (_r.type === 'c_bumper' && Math.abs(px - _r.x) < (_r.radius || 55) + 50) return true;
      }
      return false;
    };
    for (const ut of underTypes) {
      const needed = MIN_COUNT - TYPE_COUNTS[ut];
      for (let n = 0; n < needed; n++) {
        let tryX = 800 + Math.random() * (finishX - 1800);
        let _attempts = 0;
        while (_isRestricted(tryX) && _attempts < 20) { tryX = 800 + Math.random() * (finishX - 1800); _attempts++; }
        if (_attempts >= 20) continue;
        const b = getBounds(tryX);
        if (!b) continue;
        const cY = (b.topY + b.bottomY) / 2;
        const aH = b.bottomY - b.topY;
        if (ut === 'hammer') {
          const topPivot = Math.random() < 0.5;
          const startAngle = Math.random() * Math.PI * 2;
          const armLen = 60 + Math.random() * 30;
          track.obstacles.push({
            type: 'hammer', x: tryX, y: topPivot ? b.topY + 8 : b.bottomY - 8,
            armLength: armLen, headRadius: 22 + Math.random() * 6,
            angle: startAngle, speed: 0.140 + Math.random() * 0.060,
            direction: Math.random() < 0.5 ? 1 : -1, pivotTop: topPivot,
            headX: tryX + Math.cos(startAngle) * armLen,
            headY: (topPivot ? b.topY + 8 : b.bottomY - 8) + Math.sin(startAngle) * armLen
          });
        } else if (ut === 'spinner') {
          track.obstacles.push({
            type: 'spinner', x: tryX, y: clampY(cY, b, 45),
            length: Math.min(80, aH * 0.5), angle: 0, speed: 0.04 + Math.random() * 0.03, pins: []
          });
        } else if (ut === 'barrier') {
          track.obstacles.push({
            type: 'barrier', x: tryX, y: cY, width: 18, height: Math.min(80, aH * 0.5),
            isVertical: true, gapMin: 0, gapMax: aH * 0.5,
            state: 'opening', stateTimer: 0,
            openDuration: 20, closeDuration: 15,
            currentGap: 0, slideSpeed: 6.0 + Math.random() * 2.25, topY: b.topY, bottomY: b.bottomY
          });
        } else if (ut === 'sweep_arm') {
          track.obstacles.push({
            type: 'sweep_arm', x: tryX, y: clampY(cY, b, 20),
            length: 80 + Math.random() * 30, angle: 0,
            speed: 0.030, physicsSpeed: 0.090 + Math.random() * 0.035,
            direction: Math.random() < 0.5 ? 1 : -1
          });
        } else if (ut === 'punchfist') {
          const pAngle = Math.random() * Math.PI * 2;
          track.obstacles.push({
            type: 'punchfist', x: tryX, y: clampY(cY, b, 35),
            angle: pAngle, extendDist: 100,
            punchRadius: 30, state: 'retracted', stateTimer: 0,
            extendSpeed: 12, retractSpeed: 6,
            holdDuration: 8, waitDuration: 15,
            punchX: tryX, punchY: cY
          });
        } else if (ut === 'c_bumper') {
          track.obstacles.push({
            type: 'c_bumper', x: tryX, y: clampY(cY, b, 35),
            radius: Math.min(55, aH * 0.35), thickness: 8,
            rotation: 0, spinSpeed: 0.04
          });

        } else if (ut === 'boost') {
          const tooClose = track.zones.some(z => (z.type === 'slow' || z.type === 'mud_puddle || lava_pool') && Math.abs(z.x + z.width / 2 - tryX) < 400);
          if (tooClose) continue;
          track.zones.push({
            type: 'boost', x: tryX - 37, y: clampY(cY - 22, b, 27),
            width: 75, height: 45, force: 0.20
          });
        } else if (ut === 'lava_pool') {
          // Magma Crater: Lava Pool (replaces Slow Ramp)
          const tooClose = track.zones.some(z => z.type === 'boost' && Math.abs(z.x + z.width / 2 - tryX) < 400);
          if (tooClose) continue;
          track.zones.push({
            type: 'lava_pool', x: tryX - 35, y: clampY(cY - 25, b, 25),
            width: 70, height: 50
          });
        } else if (ut === 'lava_geyser') {
          // Magma Crater: Lava Geyser (exclusive to volcano)
          track.obstacles.push({
            type: 'lava_geyser', x: tryX, y: clampY(cY, b, 40),
            crackWidth: 25 + Math.random() * 10,
            crackHeight: 60 + Math.random() * 20,
            eruptionHeight: 150 + Math.random() * 80,
            // Cycle timing
            _state: 'hidden', // 'hidden' | 'warning' | 'erupting'
            _stateTimer: 0,
            _cycleTimer: 0,
            _cycleDuration: (180 + Math.floor(Math.random() * 180)) * (60 / 60), // 3-6 seconds at 60fps
            _warningDuration: 30, // 0.5 seconds at 60fps
            _eruptionDuration: 60, // 1 second at 60fps
            // Visual
            _warningGlow: 0,
            _eruptionParticles: []
          });
        } else if (ut === 'slow') {
          // Standard Slow Ramp (non-volcano maps only)
          const tooClose = track.zones.some(z => z.type === 'boost' && Math.abs(z.x + z.width / 2 - tryX) < 400);
          if (tooClose) continue;
          const zoneType = themeKey === 'jungle' ? 'mud_puddle' : 'slow';
          const w = themeKey === 'jungle' ? 135 : 60;
          const h = themeKey === 'jungle' ? 101 : 45;
          track.zones.push({
            type: zoneType, x: tryX - w / 2, y: clampY(cY - h / 2, b, h / 2 + 5),
            width: w, height: h
          });

        } else if (ut === 'launch') {
          track.zones.push({
            type: 'launch', x: tryX - 25, y: b.bottomY - 20,
            width: 50, height: 20
          });
        } else if (ut === 'portal') {
          const portalSize = 50;
          const p2x = Math.min(tryX + 800 + Math.random() * 300, finishX - 100);
          const b2 = getBounds(p2x);
          if (!b2 || p2x <= tryX + 250) continue;
          const pairId = Math.random().toString(36).slice(2);
          track.zones.push({
            type: 'portal', x: tryX - portalSize / 2,
            y: clampY(cY, b, portalSize / 2 + 8) - portalSize / 2,
            width: portalSize, height: portalSize, pairId, radius: portalSize / 2
          });
          track.zones.push({
            type: 'portal', x: p2x - portalSize / 2,
            y: clampY((b2.topY + b2.bottomY) / 2, b2, portalSize / 2 + 10) - portalSize / 2,
            width: portalSize, height: portalSize, pairId, radius: portalSize / 2
          });
        } else if (ut === 'ice_cannon') {
          track.obstacles.push({
            type: 'ice_cannon', x: tryX, y: clampY(cY, b, 35),
            cannonHeight: 50, barrelLength: 40,
            _lastFireTime: Math.floor(Math.random() * 120), _fireInterval: 120,
            _projectiles: [], _splashEffects: []
          });
        }
      }
    }

    // Remove obstacles/pegs in restricted zones (near finish, barrier gaps, rotating circles)
    {
      const _restrictedObs = new Set();
      track.obstacles.forEach((o, i) => {
        if (Math.abs(o.x - finishX) < 1000) { _restrictedObs.add(i); return; }
        for (const _r of track.obstacles) {
          if (_r === o) continue;
          if (_r.type === 'barrier' && Math.abs(o.x - _r.x) < 100) { _restrictedObs.add(i); break; }
          if (_r.type === 'c_bumper' && Math.abs(o.x - _r.x) < (_r.radius || 55) + 50) { _restrictedObs.add(i); break; }
        }
      });
      if (track.pegs) {
        track.pegs = track.pegs.filter(p => {
          if (Math.abs(p.x - finishX) < 1000) return false;
          for (const _r of track.obstacles) {
            if (_r.type === 'barrier' && Math.abs(p.x - _r.x) < 100) return false;
            if (_r.type === 'c_bumper' && Math.abs(p.x - _r.x) < (_r.radius || 55) + 50) return false;
          }
          return true;
        });
      }
      if (_restrictedObs.size > 0) track.obstacles = track.obstacles.filter((_, i) => !_restrictedObs.has(i));
    }

    // Final overlap cleanup: remove later elements that overlap earlier ones
    {
      const _removeObs = new Set(), _removeZone = new Set();
      for (let i = 0; i < track.obstacles.length; i++) {
        if (_removeObs.has(i)) continue;
        const bbI = getBB(track.obstacles[i]);
        for (let j = i + 1; j < track.obstacles.length; j++) {
          if (_removeObs.has(j)) continue;
          if (boxesOverlap(bbI, getBB(track.obstacles[j]), 25)) _removeObs.add(j);
        }
        for (let j = 0; j < track.zones.length; j++) {
          if (_removeZone.has(j)) continue;
          if (track.zones[j].type === 'finish') continue;
          // Skip intentional overlaps: boost_pipe + boost zone
          if (track.obstacles[i].type === 'boost_pipe' && track.zones[j].type === 'boost' && Math.abs(track.obstacles[i].x - track.zones[j].x) < 5) continue;
          if (boxesOverlap(bbI, getBB(track.zones[j]), 25)) _removeZone.add(j);
        }
      }
      for (let i = 0; i < track.zones.length; i++) {
        if (_removeZone.has(i)) continue;
        if (track.zones[i].type === 'finish') continue;
        const bbI = getBB(track.zones[i]);
        for (let j = i + 1; j < track.zones.length; j++) {
          if (_removeZone.has(j)) continue;
          if (track.zones[j].type === 'finish') continue;
          // Skip portal pairs
          if (track.zones[i].type === 'portal' && track.zones[j].type === 'portal' && track.zones[i].pairId === track.zones[j].pairId) continue;
          if (boxesOverlap(bbI, getBB(track.zones[j]), 25)) _removeZone.add(j);
        }
      }
      if (_removeObs.size > 0) track.obstacles = track.obstacles.filter((_, i) => !_removeObs.has(i));
      if (_removeZone.size > 0) track.zones = track.zones.filter((_, i) => !_removeZone.has(i) || track.zones[i].type === 'finish');
    }

    // Remove orphan portal zones (no matching pair ??? entry whose exit couldn't be placed)
    {
      const portalCounts = new Map();
      track.zones.filter(z => z.type === 'portal').forEach(z => portalCounts.set(z.pairId, (portalCounts.get(z.pairId) || 0) + 1));
      track.zones = track.zones.filter(z => z.type !== 'portal' || (portalCounts.get(z.pairId) || 0) >= 2);
    }

    // Generate decorative celestial objects for space theme
    this._initSpaceObjects(track);

    // Generate Retractable Wall Icicles for Glacier Summit
    if (enabledSet.has('icicle')) {
      const _numIcicles = 120 + Math.floor(Math.random() * 41);
      const _ballR = 15;
      const _baseLen = _ballR * 3;
      const _baseW = _ballR * 1.2;
      const _snapFrames = 6;
      const _cycleConfigs = [
        { outDur: 60, inDur: 60 },
        { outDur: 120, inDur: 120 },
        { outDur: 180, inDur: 180 }
      ];
      for (let _ii = 0; _ii < _numIcicles; _ii++) {
        const _ix = 200 + Math.random() * (finishX - 400);
        if (Math.abs(_ix - finishX) < 600) continue;
        const _ib = this.physics.getWallBoundaries(_ix, track);
        if (!_ib || _ib.bottomY - _ib.topY < 120) continue;
        const _onTop = Math.random() < 0.5;
        const _len = _baseLen * (0.85 + Math.random() * 0.3);
        const _bw = _baseW * (0.85 + Math.random() * 0.3);
        const _cfg = _cycleConfigs[Math.floor(Math.random() * 3)];
        const _totalFrames = _cfg.outDur + _cfg.inDur;
        const _phase = Math.floor(Math.random() * _totalFrames);
        let _overlap = false;
        for (const _o of track.obstacles) {
          if (_o.type === 'icicle') continue;
          if (Math.abs(_o.x - _ix) < 100) { _overlap = true; break; }
        }
        if (_overlap) continue;
        const _wallY = _onTop ? _ib.topY : _ib.bottomY;
        track.obstacles.push({
          type: 'icicle', x: _ix,
          y: _wallY,
          length: _len, baseWidth: _bw,
          wallSide: _onTop ? 'top' : 'bottom',
          _outDur: _cfg.outDur, _inDur: _cfg.inDur,
          _snapFrames: _snapFrames,
          _totalFrames: _totalFrames,
          _phaseOffset: _phase,
          _timer: _phase,
          _irregularity: (Math.random() - 0.5) * 3
        });
      }
    }

    // Generate Carnivorous Vines for Amazon Canopy
    if (enabledSet.has('carnivorous_vine') && themeKey === 'jungle') {
      const _numVines = 30 + Math.floor(Math.random() * 11); // 30-40 vines
      const _minSpacing = 350; // Minimum spacing between vines
      const _restrictedZones = [
        { start: 0, end: 1500 }, // Start area
        { start: finishX - 1500, end: finishX } // Finish area
      ];
      const _existingPositions = [];

      for (let _vi = 0; _vi < _numVines; _vi++) {
        let _attempts = 0;
        let _placed = false;
        
        while (_attempts < 50 && !_placed) {
          _attempts++;
          const _vx = 1500 + Math.random() * (finishX - 3000);
          
          // Check restricted zones
          let _inRestricted = false;
          for (const _rz of _restrictedZones) {
            if (_vx >= _rz.start && _vx <= _rz.end) { _inRestricted = true; break; }
          }
          if (_inRestricted) continue;
          
          // Check spacing from other vines
          let _tooClose = false;
          for (const _ep of _existingPositions) {
            if (Math.abs(_vx - _ep) < _minSpacing) { _tooClose = true; break; }
          }
          if (_tooClose) continue;
          
          // Check spacing from other obstacles
          let _obstacleConflict = false;
          for (const _o of track.obstacles) {
            if (Math.abs(_o.x - _vx) < _minSpacing) { _obstacleConflict = true; break; }
          }
          if (_obstacleConflict) continue;
          
          // Check zones (boost, portal, etc.)
          let _zoneConflict = false;
          for (const _z of track.zones) {
            if (_z.type !== 'finish' && Math.abs((_z.x + _z.width / 2) - _vx) < _minSpacing) {
              _zoneConflict = true; break;
            }
          }
          if (_zoneConflict) continue;
          
          const _vb = this.physics.getWallBoundaries(_vx, track);
          if (!_vb || _vb.bottomY - _vb.topY < 100) continue;
          
          const _onTop = Math.random() < 0.5;
          const _wallY = _onTop ? _vb.topY : _vb.bottomY;
          const _length = 80 + Math.random() * 120; // 80-200px length
          const _baseWidth = 8 + Math.random() * 6; // 8-14px base width
          const _curvature = (Math.random() - 0.5) * 1.5; // slight curve
          const _leafCount = 6 + Math.floor(Math.random() * 8); // 6-13 leaves
          const _thornCount = 3 + Math.floor(Math.random() * 5); // 3-7 thorns
          const _swayPhase = Math.random() * Math.PI * 2;
          const _swaySpeed = 0.3 + Math.random() * 0.3; // 0.3-0.6 rad/s
          const _breathPhase = Math.random() * Math.PI * 2;
          
          _existingPositions.push(_vx);
          
          track.obstacles.push({
            type: 'carnivorous_vine',
            x: _vx,
            y: _wallY,
            wallSide: _onTop ? 'top' : 'bottom',
            length: _length,
            baseWidth: _baseWidth,
            curvature: _curvature,
            leafCount: _leafCount,
            thornCount: _thornCount,
            swayPhase: _swayPhase,
            swaySpeed: _swaySpeed,
            breathPhase: _breathPhase,
            // Capture state
            captureState: 'idle', // idle, capturing, capturing_hold, releasing
            captureTimer: 0,
            captureBallId: null,
            captureProgress: 0,
            wrapSegments: [],
            // Visual
            leafOffsets: Array(_leafCount).fill(0).map(() => Math.random() * Math.PI * 2),
            thornOffsets: Array(_thornCount).fill(0).map(() => Math.random() * Math.PI * 2),
            particles: [],
            // Capture history - prevents infinite retrigger
            capturedBallIds: new Set()
          });
        }
      }
    }

    // Generate Collapsing Rock Pillars for Magma Crater
    if (enabledSet.has('collapsing_pillar')) {
      const numPillars = 12 + Math.floor(Math.random() * 5); // 12-16
      let lastSide = 'bottom';
      let lastX = -1000;
      let pillarPositions = [];

      // Scan from start to finish collecting valid placement candidates
      for (let px = 400; px < finishX - 600; px += 80) {
        if (Math.abs(px - finishX) < 800) continue;
        const pb = this.physics.getWallBoundaries(px, track);
        if (!pb || pb.bottomY - pb.topY < 160) continue;

        // Check overlap with existing obstacles and zones
        let overlap = false;
        for (const _o of track.obstacles) {
          if (Math.abs(_o.x - px) < 120) { overlap = true; break; }
        }
        if (overlap) continue;
        for (const _z of track.zones) {
          if (_z.type === 'finish') continue;
          if (Math.abs(_z.x + _z.width / 2 - px) < 120) { overlap = true; break; }
        }
        if (overlap) continue;
        if (track.pegs) {
          for (const _p of track.pegs) {
            if (Math.abs(_p.x - px) < 80) { overlap = true; break; }
          }
        }
        if (overlap) continue;

        pillarPositions.push({ x: px, bounds: pb });
      }

      // Select positions with alternating sides, avoiding direct opposites
      let selected = [];
      let lastSelectedSide = null;
      for (let i = 0; i < pillarPositions.length && selected.length < numPillars; i++) {
        const pos = pillarPositions[i];
        const side = (selected.length % 2 === 0) ? 'top' : 'bottom';

        // Avoid placing directly opposite another pillar
        let opposite = false;
        for (const s of selected) {
          if (Math.abs(s.x - pos.x) < 60 && s.side !== side) {
            opposite = true;
            break;
          }
        }
        if (opposite) continue;

        // Ensure minimum spacing
        let tooClose = false;
        for (const s of selected) {
          if (Math.abs(s.x - pos.x) < 200) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        const wallY = side === 'top' ? pos.bounds.topY - 5 : pos.bounds.bottomY + 5;
        selected.push({ x: pos.x, y: wallY, side: side });
      }

      // Create pillar obstacles
      for (const sp of selected) {
        const pillarHeight = 65 + Math.random() * 25;
        const pillarWidth = 18 + Math.random() * 7;
        const wallSide = sp.side;
        track.obstacles.push({
          type: 'collapsing_pillar',
          x: sp.x,
          y: sp.y,
          _wallSide: wallSide,
          _state: 'standing',
          _stateTimer: 0,
          _standingDuration: 480 + Math.floor(Math.random() * 420),
          _warningDuration: 60,
          _fallenDuration: 240 + Math.floor(Math.random() * 60),
          _disappearDuration: 30,
          _pillarHeight: pillarHeight,
          _pillarWidth: pillarWidth,
          _fallenWidth: 55 + Math.random() * 20,
          _fallenHeight: 28 + Math.random() * 8,
          _seed: Math.random() * 1000,
          _shakePhase: Math.random() * Math.PI * 2,
          _fallDirection: wallSide === 'top' ? 1 : -1,
          _fallProgress: 0,
          _crumbleProgress: 0,
          _dustOverlay: null
        });
      }
    }

    this.track = track;
  }

  // Update dynamic obstacles (punchfist, hammer, barrier, spinner, sweep_arm, meteor cleanup)
  updateDynamicObstacles(dt) {
    this.track.obstacles.forEach(obs => {
      if (obs.type === 'punchfist') {
        obs.stateTimer = (obs.stateTimer || 0) + dt;
        const angle = obs.angle || 0;
        if (obs.state === 'retracted') {
          if (obs.stateTimer > (obs.waitDuration || 15)) {
            obs.state = 'extending';
            obs.stateTimer = 0;
          }
        } else if (obs.state === 'extending') {
          const extend = Math.min(obs.stateTimer * obs.extendSpeed, obs.extendDist);
          obs.punchX = obs.x + Math.cos(angle) * extend;
          obs.punchY = obs.y + Math.sin(angle) * extend;
          if (extend >= obs.extendDist) {
            obs.state = 'hold';
            obs.stateTimer = 0;
          }
        } else if (obs.state === 'hold') {
          if (obs.stateTimer > (obs.holdDuration || 8)) {
            obs.state = 'retracting';
            obs.stateTimer = 0;
          }
        } else if (obs.state === 'retracting') {
          const extend = Math.max(obs.extendDist - obs.stateTimer * obs.retractSpeed, 0);
          obs.punchX = obs.x + Math.cos(angle) * extend;
          obs.punchY = obs.y + Math.sin(angle) * extend;
          if (extend <= 0) {
            obs.punchX = obs.x;
            obs.punchY = obs.y;
            obs.state = 'retracted';
            obs.stateTimer = 0;
          }
        }
        obs.punchVx = Math.cos(angle) * (obs.state === 'extending' || obs.state === 'hold' ? obs.extendSpeed * 4 : 0);
        obs.punchVy = Math.sin(angle) * (obs.state === 'extending' || obs.state === 'hold' ? obs.extendSpeed * 4 : 0);
      } else if (obs.type === 'c_bumper') {
        // Continuous rotation
        obs.rotation = (obs.rotation || 0) + (obs.spinSpeed || 0) * dt;
      } else if (obs.type === 'barrier') {
        obs.stateTimer = (obs.stateTimer || 0) + dt;
        if (obs.state === 'opening') {
          obs.currentGap = Math.min(obs.currentGap + obs.slideSpeed * dt, obs.gapMax);
          if (obs.currentGap >= obs.gapMax) {
            obs.currentGap = obs.gapMax;
            obs.state = 'open';
            obs.stateTimer = 0;
          }
        } else if (obs.state === 'open') {
          if (obs.stateTimer > (obs.openDuration || 30)) {
            obs.state = 'closing';
            obs.stateTimer = 0;
          }
        } else if (obs.state === 'closing') {
          obs.currentGap = Math.max(obs.currentGap - obs.slideSpeed * dt, obs.gapMin);
          if (obs.currentGap <= obs.gapMin) {
            obs.currentGap = obs.gapMin;
            obs.state = 'closed';
            obs.stateTimer = 0;
          }
        } else if (obs.state === 'closed') {
          if (obs.stateTimer > (obs.closeDuration || 20)) {
            obs.state = 'opening';
            obs.stateTimer = 0;
          }
        }
      } else if (obs.type === 'spinner') {
        // Continuous 360 rotation
        obs.angle = (obs.angle || 0) + (obs.speed || 0.03) * dt;
      } else if (obs.type === 'sweep_arm') {
        // Rotate using physicsSpeed for consistent collision force, speed for visual
        const physicsSpeed = obs.physicsSpeed || obs.speed || 0.07;
        obs.angle = (obs.angle || 0) + physicsSpeed * obs.direction * dt;
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
        // Footballs pass through walls (no bounce), but still have lifespan
        if (obs._lifetime > 0) {
          obs._lifetime -= dt;
          if (obs._lifetime <= 0) obs._remove = true;
        }
        // Stopped detection: remove footballs that stop moving
        if (obs._lifetime > 0 || obs._stoppedTimer !== undefined) {
          const speed = Math.hypot(obs.vx || 0, obs.vy || 0);
          if (speed < 0.3) {
            obs._stoppedTimer = (obs._stoppedTimer || 0) + dt;
            if (obs._stoppedTimer > 120) obs._remove = true;
          } else {
            obs._stoppedTimer = 0;
          }
        }
      } else if (obs.type === 'rain_drop') {
        // Rain drop movement: fall from sky
        obs.x += (obs.vx || 0) * dt;
        obs.vy = (obs.vy || 0) + 0.15 * dt; // gravity acceleration
        obs.y += obs.vy * dt;
        // Rain drops pass through walls
        if (obs._lifetime > 0) {
          obs._lifetime -= dt;
          if (obs._lifetime <= 0) obs._remove = true;
        }
        // Remove rain drops that hit the ground
        const bounds = this.physics.getWallBoundaries(obs.x, this.track);
        if (bounds && obs.y > bounds.bottomY + 50) {
          obs._remove = true;
        }
      } else if (obs.type === 'hammer') {
        const armLen = obs.armLength || 80;
        const speed = obs.speed || 0.03;
        obs.angle = (obs.angle || 0) + speed * (obs.direction || 1) * dt;
        obs.headX = obs.x + Math.cos(obs.angle) * armLen;
        obs.headY = obs.y + Math.sin(obs.angle) * armLen;
        obs.headVx = (obs.headX - (obs._prevHeadX || obs.headX)) / Math.max(dt, 1);
        obs.headVy = (obs.headY - (obs._prevHeadY || obs.headY)) / Math.max(dt, 1);
        obs._prevHeadX = obs.headX;
        obs._prevHeadY = obs.headY;
      } else if (obs.type === 'ice_cannon') {
        if (!obs._projectiles) obs._projectiles = [];
        if (obs._lastFireTime === undefined) obs._lastFireTime = 0;
        if (obs._fireInterval === undefined) obs._fireInterval = 120;
        if (obs._splashEffects === undefined) obs._splashEffects = [];

        obs._lastFireTime += dt;
        if (obs._lastFireTime >= obs._fireInterval) {
          obs._lastFireTime = 0;
          const barrelLen = obs.barrelLength || 40;
          const barrelY = obs.y - (obs.cannonHeight || 50) * 0.2;
          const muzzleX = obs.x - barrelLen;
          obs._projectiles.push({
            x: muzzleX, y: barrelY, radius: 6 + Math.random() * 2,
            speed: 12 + Math.random() * 1.5,
            maxDistance: 1200 + Math.random() * 800,
            distanceTraveled: 0, splashRadius: 35,
            _trailPhase: Math.random() * 100, _removed: false
          });
        }

        for (let pi = obs._projectiles.length - 1; pi >= 0; pi--) {
          const proj = obs._projectiles[pi];
          if (proj._removed) { obs._projectiles.splice(pi, 1); continue; }

          const moveAmount = proj.speed * dt;
          proj.x -= moveAmount * 0.5;
          proj.distanceTraveled += moveAmount;

          // Remove when past max range or off-screen
          if (proj.distanceTraveled >= proj.maxDistance || proj.x < this.cameraX - 100) {
            proj._removed = true;
            obs._projectiles.splice(pi, 1);
            continue;
          }

          let hitBall = false;
          if (this.balls) {
            for (const ball of this.balls) {
              if (ball.finished) continue;
              const dx = ball.x - proj.x, dy = ball.y - proj.y;
              if (Math.hypot(dx, dy) < ball.radius + proj.radius) {
                this._applyIceSplash(proj.x, proj.y, proj.splashRadius);
                if (obs._splashEffects) obs._splashEffects.push({ x: proj.x, y: proj.y, radius: proj.splashRadius, _timer: 0, _duration: 20 });
                proj._removed = true;
                obs._projectiles.splice(pi, 1);
                hitBall = true;
                break;
              }
            }
          }
          if (hitBall) continue;
        }

        if (obs._splashEffects) {
          for (let si = obs._splashEffects.length - 1; si >= 0; si--) {
            const spl = obs._splashEffects[si];
            spl._timer += dt;
            if (spl._timer > spl._duration) obs._splashEffects.splice(si, 1);
          }
        }
      } else if (obs.type === 'icicle') {
        if (obs._outDur === undefined) { obs._outDur = 60; obs._inDur = 60; obs._snapFrames = 6; obs._totalFrames = 120; obs._phaseOffset = 0; obs._timer = 0; obs._irregularity = 0; }
        obs._timer = (obs._timer + dt) % obs._totalFrames;
        const _t = (obs._timer + obs._phaseOffset) % obs._totalFrames;
        const _outDur = obs._outDur;
        const _snap = obs._snapFrames || 6;
        let _iProgress = 0;
        if (_t < _snap) {
          _iProgress = _t / _snap;
        } else if (_t < _outDur) {
          _iProgress = 1;
        } else if (_t < _outDur + _snap) {
          _iProgress = 1 - (_t - _outDur) / _snap;
        }
        // Particle effects on snap-out / snap-in transitions
        const _prevP = obs._prevProgress !== undefined ? obs._prevProgress : 0;
        if (this.particles) {
          if (_prevP < 0.05 && _iProgress > 0.05) {
            // Snap-out: snow burst
            for (let _p = 0; _p < 4; _p++) {
              const _a = Math.random() * Math.PI * 2;
              this.particles.push({
                type: 'sparkle',
                x: obs.x + (Math.random() - 0.5) * 6,
                y: (obs.wallSide === 'top' ? obs.y + obs.length * 0.2 : obs.y - obs.length * 0.2) + (Math.random() - 0.5) * 4,
                vx: Math.cos(_a) * (0.5 + Math.random()),
                vy: Math.sin(_a) * (0.5 + Math.random()),
                alpha: 0.6, size: 1 + Math.random() * 2,
                life: 8 + Math.floor(Math.random() * 8),
                color: '#ffffff'
              });
            }
          } else if (_prevP > 0.95 && _iProgress < 0.95) {
            // Snap-in: ice fragments
            for (let _p = 0; _p < 3; _p++) {
              const _a = Math.random() * Math.PI * 2;
              this.particles.push({
                type: 'sparkle',
                x: obs.x + (Math.random() - 0.5) * 8,
                y: (obs.wallSide === 'top' ? obs.y + obs.length * 0.3 : obs.y - obs.length * 0.3) + (Math.random() - 0.5) * 4,
                vx: Math.cos(_a) * (0.2 + Math.random() * 0.5),
                vy: 0.3 + Math.random() * 0.8,
                alpha: 0.5, size: 0.8 + Math.random() * 1.5,
                life: 12 + Math.floor(Math.random() * 10),
                color: '#c0e8ff'
              });
            }
          }
        }
        obs._prevProgress = _iProgress;
        // Collision ??? only when extended
        if (this.balls && _iProgress > 0.5) {
          const _iLen = obs.length || 45;
          const _iDir = obs.wallSide === 'top' ? 1 : -1;
          const _iBaseY = obs.y;
          const _iTipX = obs.x;
          const _iTipY = _iBaseY + _iDir * _iLen * 0.8 * _iProgress;
          for (const ball of this.balls) {
            if (ball.finished) continue;
            const _dx = ball.x - _iTipX;
            const _dy = ball.y - _iTipY;
            if (Math.hypot(_dx, _dy) < ball.radius + 8) {
              const _pushDir = obs.wallSide === 'top' ? 1 : -1;
              ball.vy += _pushDir * 2;
              const _spd = Math.hypot(ball.vx, ball.vy);
              const _newSpd = _spd * (0.85 - Math.random() * 0.05);
              const _angle = Math.atan2(ball.vy, ball.vx);
              ball.vx = Math.cos(_angle) * _newSpd;
              ball.vy = Math.sin(_angle) * _newSpd;
              if (this.particles) {
                for (let _p = 0; _p < 5; _p++) {
                  const _a = Math.random() * Math.PI * 2;
                  this.particles.push({
                    type: 'sparkle',
                    x: ball.x + (Math.random() - 0.5) * 4,
                    y: ball.y + (Math.random() - 0.5) * 4,
                    vx: Math.cos(_a) * (0.3 + Math.random()),
                    vy: Math.sin(_a) * (0.3 + Math.random()),
                    alpha: 0.7, size: 1.5 + Math.random() * 2,
                    life: 6 + Math.floor(Math.random() * 6),
                    color: '#d0ecff'
                  });
                }
              }
              break;
            }
          }
        }
      } else if (obs.type === 'carnivorous_vine') {
        // ===== CARNIVOROUS VINE UPDATE =====
        const time = Date.now() * 0.001;
        
        // Sway animation
        const swayAmount = Math.sin(time * obs.swaySpeed + obs.swayPhase) * 0.15;
        const breathAmount = Math.sin(time * 0.8 + obs.breathPhase) * 0.02;
        
        // Update leaf/ thorn phase offsets
        if (!obs.leafOffsets) obs.leafOffsets = Array(obs.leafCount || 8).fill(0).map(() => Math.random() * Math.PI * 2);
        if (!obs.thornOffsets) obs.thornOffsets = Array(obs.thornCount || 5).fill(0).map(() => Math.random() * Math.PI * 2);
        
// Capture state machine
        if (obs.captureState === 'idle') {
          // Check for ball entering trigger zone
          if (this.balls) {
            const triggerRadius = Math.max(obs.baseWidth * 3, 30);
            const triggerX = obs.x + swayAmount * obs.length * 0.5;
            const triggerY = obs.y + (obs.wallSide === 'top' ? obs.length * 0.5 : -obs.length * 0.5);
            
            // Count currently captured balls for this vine
            const capturedBalls = obs.capturedBalls || [];
            
            for (const ball of this.balls) {
              if (ball.finished || ball.eliminated) continue;
              // Check if ball is already captured by another vine
              const alreadyCaptured = this.track.obstacles.some(o => 
                o.type === 'carnivorous_vine' && o.captureState !== 'idle' && o.captureBallId === ball.id
              );
              // Check if THIS vine has already captured this ball before (permanent memory)
              if (obs.capturedBallIds && obs.capturedBallIds.has(ball.id)) continue;

              if (alreadyCaptured) continue;
              
              const dx = ball.x - triggerX;
              const dy = ball.y - triggerY;
              const dist = Math.hypot(dx, dy);
              
              if (dist < triggerRadius + ball.radius && capturedBalls.length < 2) {
                // Capture this ball
                obs.captureState = 'capturing';
                obs.captureTimer = 0;
                obs.captureBallId = ball.id;
                // Record this ball as captured by this vine (permanent memory)
                if (!obs.capturedBallIds) obs.capturedBallIds = new Set();
                obs.capturedBallIds.add(ball.id);
                obs.captureProgress = 0;
                obs.wrapSegments = [];
                
                // Pause ball physics - store original velocity
                ball._vineCaptured = true;
                ball._vineCaptureVx = ball.vx;
                ball._vineCaptureVy = ball.vy;
                ball._vineCaptureX = ball.x;
                ball._vineCaptureY = ball.y;
                ball.vx = 0;
                ball.vy = 0;
                
                // Add to captured balls list
                if (!obs.capturedBalls) obs.capturedBalls = [];
                obs.capturedBalls.push(ball.id);
                
                // Generate wrap segments
                const segments = 8 + Math.floor(Math.random() * 4);
                for (let s = 0; s < segments; s++) {
                  obs.wrapSegments.push({
                    progress: s / segments,
                    angle: Math.random() * Math.PI * 2,
                    radius: 0.5 + Math.random() * 0.5,
                    phase: Math.random() * Math.PI * 2
                  });
                }
                
                // Initial capture particles
                if (this.particles) {
                  for (let p = 0; p < 12; p++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 1 + Math.random() * 2;
                    this.particles.push({
                      type: 'sparkle',
                      x: ball.x,
                      y: ball.y,
                      vx: Math.cos(angle) * speed,
                      vy: Math.sin(angle) * speed,
                      alpha: 0.8,
                      size: 2 + Math.random() * 3,
                      life: 15 + Math.floor(Math.random() * 10),
                      color: '#2a5e2a'
                    });
                  }
                }
              }
            }
          }
        } else if (obs.captureState === 'capturing') {
          obs.captureTimer += dt;
          obs.captureProgress = Math.min(obs.captureTimer / 15, 1); // 15 frames to fully capture (~0.25s at 60fps)
          
          if (this.balls) {
            const ball = this.balls.find(b => b.id === obs.captureBallId);
            if (ball) {
              // Move ball toward vine center during capture
              const vineCenterX = obs.x + swayAmount * obs.length * 0.5;
              const vineCenterY = obs.y + (obs.wallSide === 'top' ? obs.length * 0.4 : -obs.length * 0.4);
              const lerpT = obs.captureProgress * 0.8;
              ball.x = ball.x + (vineCenterX - ball.x) * lerpT;
              ball.y = ball.y + (vineCenterY - ball.y) * lerpT;
              ball.vx = 0;
              ball.vy = 0;
              
              // Capture particles
              if (this.particles && Math.random() < 0.3) {
                const angle = Math.random() * Math.PI * 2;
                this.particles.push({
                  type: 'sparkle',
                  x: ball.x + (Math.random() - 0.5) * 6,
                  y: ball.y + (Math.random() - 0.5) * 6,
                  vx: Math.cos(angle) * 0.5,
                  vy: Math.sin(angle) * 0.5,
                  alpha: 0.6,
                  size: 1 + Math.random() * 2,
                  life: 8 + Math.floor(Math.random() * 6),
                  color: '#1f4a1f'
                });
              }
            }
          }
          
          if (obs.captureProgress >= 1) {
            obs.captureState = 'capturing_hold';
            obs.captureTimer = 0;
          }
        } else if (obs.captureState === 'capturing_hold') {
          obs.captureTimer += dt;
          
          if (this.balls) {
            const ball = this.balls.find(b => b.id === obs.captureBallId);
            if (ball) {
              // Hold ball at vine center with gentle sway
              const vineCenterX = obs.x + swayAmount * obs.length * 0.5;
              const vineCenterY = obs.y + (obs.wallSide === 'top' ? obs.length * 0.4 : -obs.length * 0.4);
              ball.x = vineCenterX + Math.sin(time * 2 + obs.breathPhase) * 2;
              ball.y = vineCenterY + Math.cos(time * 1.5 + obs.breathPhase) * 1.5;
              ball.vx = 0;
              ball.vy = 0;
              
              // Subtle held particles
              if (this.particles && Math.random() < 0.05) {
                this.particles.push({
                  type: 'sparkle',
                  x: ball.x + (Math.random() - 0.5) * 4,
                  y: ball.y + (Math.random() - 0.5) * 4,
                  vx: (Math.random() - 0.5) * 0.3,
                  vy: (Math.random() - 0.5) * 0.3,
                  alpha: 0.4,
                  size: 1 + Math.random() * 1.5,
                  life: 10 + Math.floor(Math.random() * 8),
                  color: '#2d6b2d'
                });
              }
            }
          }
          
          // Hold for 2 seconds (120 frames at 60fps)
          if (obs.captureTimer >= 120) {
            obs.captureState = 'releasing';
            obs.captureTimer = 0;
            obs.captureProgress = 1;
          }
        } else if (obs.captureState === 'releasing') {
          obs.captureTimer += dt;
          obs.captureProgress = Math.max(0, 1 - obs.captureTimer / 10); // 10 frames to release
          
          if (this.balls) {
            const ball = this.balls.find(b => b.id === obs.captureBallId);
            if (ball) {
              // Gentle release - restore physics
              if (obs.captureProgress <= 0) {
                ball._vineCaptured = false;
                ball.vx = ball._vineCaptureVx || 0;
                ball.vy = ball._vineCaptureVy || 0;
                delete ball._vineCaptureVx;
                delete ball._vineCaptureVy;
                delete ball._vineCaptureX;
                delete ball._vineCaptureY;
                
                // Release particles
                if (this.particles) {
                  for (let p = 0; p < 10; p++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 1 + Math.random() * 2;
                    this.particles.push({
                      type: 'sparkle',
                      x: ball.x,
                      y: ball.y,
                      vx: Math.cos(angle) * speed,
                      vy: Math.sin(angle) * speed,
                      alpha: 0.7,
                      size: 2 + Math.random() * 3,
                      life: 12 + Math.floor(Math.random() * 8),
                      color: '#3a7a3a'
                    });
                  }
                }
                
                obs.captureState = 'idle';
                obs.captureBallId = null;
                obs.wrapSegments = [];
              } else {
                // Still releasing - keep ball near vine but let it start moving
                const vineCenterX = obs.x + swayAmount * obs.length * 0.5;
                const vineCenterY = obs.y + (obs.wallSide === 'top' ? obs.length * 0.4 : -obs.length * 0.4);
                const lerpT = obs.captureProgress * 0.5;
                ball.x = vineCenterX + (ball.x - vineCenterX) * (1 - lerpT);
                ball.y = vineCenterY + (ball.y - vineCenterY) * (1 - lerpT);
              }
            }
          }
        }
        
        // Update particles
        if (obs.particles) {
          for (let pi = obs.particles.length - 1; pi >= 0; pi--) {
            const pt = obs.particles[pi];
            pt.life--;
            if (pt.life <= 0) {
              obs.particles.splice(pi, 1);
}
            }
            this.ctx.restore();
          }
        }
          

      });

    // Lava Geyser state machine update (Magma Crater exclusive)
    if (this.currentThemeKey === 'volcano') {
      this.track.obstacles.forEach(obs => {
        if (obs.type !== 'lava_geyser') return;
        
        // Initialize if needed
        if (obs._state === undefined) {
          obs._state = 'hidden';
          obs._stateTimer = 0;
          obs._cycleTimer = 0;
          obs._cycleDuration = obs._hiddenDuration || (180 + Math.floor(Math.random() * 180)); // 3-6 seconds
          obs._warningDuration = obs._warningDuration || 30; // 0.5 seconds
          obs._eruptionDuration = obs._eruptionDuration || 60; // 1 second
          obs._eruptionHeight = obs._eruptionHeight || (180 + Math.random() * 60);
          obs._eruptionWidth = obs._eruptionWidth || (24 + Math.random() * 12);
          obs._crackWidth = obs._crackWidth || (8 + Math.random() * 6);
        }
        
        // Advance cycle timer
        obs._cycleTimer += dt;
        
        // State machine
        if (obs._state === 'hidden') {
          // Wait for cycle to complete
          if (obs._cycleTimer >= obs._cycleDuration) {
            obs._state = 'warning';
            obs._stateTimer = 0;
            obs._cycleTimer = 0;
            // Warning particles
            for (let i = 0; i < 3; i++) {
              this.particles.push({
                type: 'sparkle',
                x: obs.x + (Math.random() - 0.5) * 8,
                y: obs.y + (Math.random() - 0.5) * 4,
                vx: (Math.random() - 0.5) * 1,
                vy: -1 - Math.random() * 2,
                alpha: 0.8,
                size: 2 + Math.random() * 2,
                life: 15 + Math.floor(Math.random() * 10),
                color: '#ff8800'
              });
            }
          }
        } else if (obs._state === 'warning') {
          obs._stateTimer += dt;
          // Intensify glow
          obs._warningGlow = Math.min(1, obs._stateTimer / obs._warningDuration);
          
          // Warning particles
          if (Math.random() < 0.3 * dt) {
            this.particles.push({
              type: 'sparkle',
              x: obs.x + (Math.random() - 0.5) * (obs._crackWidth || 12),
              y: obs.y - 2 - Math.random() * 10,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -1 - Math.random() * 2,
              alpha: 0.6,
              size: 1 + Math.random() * 2,
              life: 10 + Math.floor(Math.random() * 8),
              color: '#ffaa00'
            });
          }
          
          if (obs._stateTimer >= obs._warningDuration) {
            obs._state = 'erupting';
            obs._stateTimer = 0;
            // Eruption burst particles
            for (let i = 0; i < 20; i++) {
              const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.6;
              const speed = 2 + Math.random() * 4;
              this.particles.push({
                type: 'sparkle',
                x: obs.x,
                y: obs.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                size: 3 + Math.random() * 5,
                life: 20 + Math.floor(Math.random() * 15),
                color: ['#ff3300', '#ff6600', '#ff9900', '#ffcc00'][Math.floor(Math.random() * 4)]
              });
            }
          }
        } else if (obs._state === 'erupting') {
          obs._stateTimer += dt;
          
          // Continuous eruption particles
          if (Math.random() < 0.5 * dt) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.5;
            const speed = 1.5 + Math.random() * 3;
            this.particles.push({
              type: 'sparkle',
              x: obs.x + (Math.random() - 0.5) * (obs._eruptionWidth || 30) * 0.5,
              y: obs.y - Math.random() * (obs._eruptionHeight || 200) * 0.3,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 1,
              alpha: 0.8 + Math.random() * 0.2,
              size: 2 + Math.random() * 4,
              life: 15 + Math.floor(Math.random() * 10),
              color: ['#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffaa00'][Math.floor(Math.random() * 5)]
            });
          }
          
          // Smoke particles
          if (Math.random() < 0.2 * dt) {
            this.particles.push({
              type: 'dust',
              x: obs.x + (Math.random() - 0.5) * (obs._eruptionWidth || 30) * 0.8,
              y: obs.y - (obs._eruptionHeight || 200) * (0.5 + Math.random() * 0.5),
              vx: (Math.random() - 0.5) * 0.5,
              vy: -0.5 - Math.random() * 0.5,
              alpha: 0.15 + Math.random() * 0.15,
              size: 8 + Math.random() * 12,
              color: ['#332211', '#221100', '#442211'][Math.floor(Math.random() * 3)],
              life: 30 + Math.floor(Math.random() * 30)
            });
          }
          
          if (obs._stateTimer >= obs._eruptionDuration) {
            obs._state = 'hidden';
            obs._stateTimer = 0;
            obs._cycleTimer = 0;
            // New random cycle duration (3-6 seconds)
            obs._cycleDuration = 180 + Math.floor(Math.random() * 180);
          }
        }
      });
    }

    // Carnivorous Vine state machine (Amazon Canopy exclusive)
    try {
      if (this.currentThemeKey === 'jungle' && this.track && this.track.obstacles) {
        this.track.obstacles.forEach(obs => {
          if (obs.type !== 'carnivorous_vine') return;

          // Initialize vine animation properties
          if (obs._animState === undefined) {
            obs._animState = 'idle';        // idle, wrapping, holding, releasing, cooldown
            obs._animFrame = 0;             // current frame in animation
            obs._animTimer = 0;             // frame timer
            obs._phase = Math.random() * Math.PI * 2;
            obs._wigglePhase = Math.random() * Math.PI * 2;
            obs._capturedBall = null;
            obs._holdTimer = 0;
          }

          const dt60 = dt * 60; // normalize to 60fps frames

          // Animation frame durations (at 60fps)
          const WRAP_FRAMES = 18;       // 0.3s wrap animation
          const HOLD_FRAMES = 120;      // 2s hold
          const RELEASE_FRAMES = 24;    // 0.4s release animation
          const COOLDOWN_FRAMES = 120;  // 2s cooldown

          if (obs._animState === 'idle') {
            // Idle: gentle sway, check for ball in trigger radius (45px)
            obs._animTimer += dt60;
            for (const ball of this.balls) {
              if (ball.finished || ball.z > 0 || ball._capturedByVine) continue;
              const dx = ball.x - obs.x;
              const dy = ball.y - obs.y;
              const dist = Math.hypot(dx, dy);
              if (dist < 45) {
                // Trigger wrap animation
                obs._animState = 'wrapping';
                obs._animFrame = 0;
                obs._animTimer = 0;
                obs._capturedBall = ball;
                ball._capturedByVine = obs;
                ball.vx = 0;
                ball.vy = 0;
                // Subtle grab particles
                for (let p = 0; p < 4; p++) {
                  const a = Math.random() * Math.PI * 2;
                  this.particles.push({
                    type: 'sparkle', x: ball.x, y: ball.y,
                    vx: Math.cos(a) * 0.5, vy: Math.sin(a) * 0.5,
                    alpha: 0.5, size: 2 + Math.random() * 1.5, life: 12 + Math.floor(Math.random() * 8),
                    color: '#3a7a3a'
                  });
                }
                break;
              }
            }
          } else if (obs._animState === 'wrapping') {
            // Wrap animation: vine rapidly coils around ball (18 frames)
            obs._animTimer += dt60;
            obs._animFrame = Math.min(Math.floor(obs._animTimer / (WRAP_FRAMES / 6)), 5); // 6 key frames over 18 frames

            if (obs._capturedBall) {
              // Ball follows vine center during wrap
              const progress = obs._animTimer / WRAP_FRAMES;
              const wiggle = Math.sin(obs._wigglePhase + obs._animTimer * 0.3) * (1 - progress) * 2;
              obs._capturedBall.x = obs.x + wiggle;
              obs._capturedBall.y = obs.y + wiggle;
              obs._capturedBall.vx = 0;
              obs._capturedBall.vy = 0;
            }

            // Wrap particles
            if (Math.floor(obs._animTimer) % 3 === 0 && obs._capturedBall) {
              for (let p = 0; p < 2; p++) {
                const a = Math.random() * Math.PI * 2;
                this.particles.push({
                  type: 'sparkle', x: obs._capturedBall.x, y: obs._capturedBall.y,
                  vx: Math.cos(a) * 0.3, vy: Math.sin(a) * 0.3,
                  alpha: 0.4, size: 1.5 + Math.random(), life: 10 + Math.floor(Math.random() * 6),
                  color: '#4a8a3a'
                });
              }
            }

            if (obs._animTimer >= WRAP_FRAMES) {
              obs._animState = 'holding';
              obs._animFrame = 0;
              obs._animTimer = 0;
              obs._holdTimer = 0;
            }
          } else if (obs._animState === 'holding') {
            // Hold: ball trapped for 2 seconds, vine breathes
            obs._animTimer += dt60;
            obs._holdTimer += dt60;
            obs._animFrame = Math.floor((obs._animTimer % 30) / 5); // 6-frame breathing loop

            if (obs._capturedBall) {
              // Gentle squeeze motion
              const squeeze = Math.sin(obs._animTimer * 0.15) * 1.5;
              const breathe = Math.cos(obs._animTimer * 0.1) * 1;
              obs._capturedBall.x = obs.x + squeeze;
              obs._capturedBall.y = obs.y + breathe;
              obs._capturedBall.vx = 0;
              obs._capturedBall.vy = 0;
            }

            // Ambient hold particles (dust, leaf fragments)
            if (Math.floor(obs._animTimer) % 15 === 0 && obs._capturedBall) {
              for (let p = 0; p < 2; p++) {
                const a = Math.random() * Math.PI * 2;
                this.particles.push({
                  type: 'sparkle', x: obs._capturedBall.x, y: obs._capturedBall.y,
                  vx: Math.cos(a) * 0.2, vy: Math.sin(a) * 0.2 + 0.15,
                  alpha: 0.3, size: 1 + Math.random(), life: 18 + Math.floor(Math.random() * 12),
                  color: '#2a5a2a'
                });
              }
            }

            if (obs._holdTimer >= HOLD_FRAMES) {
              obs._animState = 'releasing';
              obs._animFrame = 0;
              obs._animTimer = 0;
            }
          } else if (obs._animState === 'releasing') {
            // Release: coils unwind naturally (24 frames)
            obs._animTimer += dt60;
            obs._animFrame = Math.min(Math.floor(obs._animTimer / (RELEASE_FRAMES / 6)), 5);

            if (obs._capturedBall) {
              const progress = obs._animTimer / RELEASE_FRAMES;
              // Ball stays until halfway through release, then eases out
              if (progress < 0.5) {
                const squeeze = Math.sin(obs._animTimer * 0.2) * (1 - progress * 2) * 1.5;
                const breathe = Math.cos(obs._animTimer * 0.15) * (1 - progress * 2) * 1;
                obs._capturedBall.x = obs.x + squeeze;
                obs._capturedBall.y = obs.y + breathe;
                obs._capturedBall.vx = 0;
                obs._capturedBall.vy = 0;
              } else {
                // Smooth release with gentle velocity
                if (progress === 0.5 || obs._animFrame === 3) {
                  obs._capturedBall._capturedByVine = null;
                  const angle = Math.random() * Math.PI * 2;
                  const force = 2.5 + Math.random() * 1.5; // Gentle release
                  obs._capturedBall.vx = Math.cos(angle) * force;
                  obs._capturedBall.vy = Math.sin(angle) * force;
                  obs._launchVx = obs._capturedBall.vx;
                  obs._launchVy = obs._capturedBall.vy;
                  // Release leaf burst
                  for (let p = 0; p < 12; p++) {
                    const a = Math.random() * Math.PI * 2;
                    this.particles.push({
                      type: 'sparkle', x: obs.x, y: obs.y,
                      vx: Math.cos(a) * (1.5 + Math.random() * 2), vy: Math.sin(a) * (1.5 + Math.random() * 2),
                      alpha: 0.5, size: 1.5 + Math.random() * 2, life: 20 + Math.floor(Math.random() * 15),
                      color: '#3a7a3a'
                    });
                  }
                }
              }
            }

            if (obs._animTimer >= RELEASE_FRAMES) {
              obs._animState = 'cooldown';
              obs._animFrame = 0;
              obs._animTimer = 0;
              obs._capturedBall = null;
            }
          } else if (obs._animState === 'cooldown') {
            // Cooldown: vine settles back to idle (2s)
            obs._animTimer += dt60;
            obs._animFrame = Math.floor((obs._animTimer % 60) / 10); // Slow settle

            if (obs._animTimer >= COOLDOWN_FRAMES) {
              obs._animState = 'idle';
              obs._animFrame = 0;
              obs._animTimer = 0;
              obs._grabProgress = 0;
            }
          }
        });
      }
    } catch (e) {
      console.warn('Carnivorous vine state machine error:', e.message);
    }

    // Collapsing Rock Pillar state machine (Magma Crater exclusive)
    if (this.currentThemeKey === 'volcano' && this.track && this.track.obstacles) {
      this.track.obstacles.forEach(obs => {
        if (obs.type !== 'collapsing_pillar') return;

        // Initialize if needed
        if (obs._state === undefined) {
          obs._state = 'standing';
          obs._stateTimer = 0;
          obs._standingDuration = obs._standingDuration || (480 + Math.floor(Math.random() * 420));
          obs._warningDuration = obs._warningDuration || 60;
          obs._fallenDuration = obs._fallenDuration || (240 + Math.floor(Math.random() * 60));
          obs._disappearDuration = obs._disappearDuration || 30;
          obs._pillarHeight = obs._pillarHeight || (65 + Math.random() * 25);
          obs._pillarWidth = obs._pillarWidth || (18 + Math.random() * 7);
          obs._fallenWidth = obs._fallenWidth || (55 + Math.random() * 20);
          obs._fallenHeight = obs._fallenHeight || (28 + Math.random() * 8);
          obs._seed = obs._seed || (Math.random() * 1000);
          obs._shakePhase = obs._shakePhase || (Math.random() * Math.PI * 2);
          obs._fallProgress = obs._fallProgress || 0;
          obs._crumbleProgress = obs._crumbleProgress || 0;
        }

        obs._stateTimer += dt;

        if (obs._state === 'standing') {
          if (obs._stateTimer >= obs._standingDuration) {
            obs._state = 'warning';
            obs._stateTimer = 0;
            // Dust puffs at base when warning starts
            for (let i = 0; i < 4; i++) {
              this.particles.push({
                type: 'dust',
                x: obs.x + (Math.random() - 0.5) * 20,
                y: obs.y + (obs._wallSide === 'top' ? 5 : -5) + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (obs._wallSide === 'top' ? 0.3 : -0.3) + (Math.random() - 0.5) * 0.3,
                alpha: 0.5,
                size: 4 + Math.random() * 6,
                life: 20 + Math.floor(Math.random() * 15),
                color: '#665544'
              });
            }
          }
        } else if (obs._state === 'warning') {
          // Shake intensity increases
          const warnProgress = obs._stateTimer / obs._warningDuration;
          obs._shakeOffset = Math.sin(obs._stateTimer * 0.5 + obs._shakePhase) * (2 + warnProgress * 6);

          // Falling tiny rocks
          if (Math.random() < 0.3 * dt) {
            this.particles.push({
              type: 'dust',
              x: obs.x + (Math.random() - 0.5) * (obs._pillarWidth || 20) * 0.8,
              y: obs.y - (obs._wallSide === 'top' ? 1 : -1) * (obs._pillarHeight || 80) * 0.3 * (Math.random()),
              vx: (Math.random() - 0.5) * 0.3,
              vy: (obs._wallSide === 'top' ? 0.5 : -0.5) + Math.random() * 0.5,
              alpha: 0.6,
              size: 1.5 + Math.random() * 2,
              life: 15 + Math.floor(Math.random() * 10),
              color: '#554433'
            });
          }

          // Dust at base
          if (Math.random() < 0.2 * dt) {
            this.particles.push({
              type: 'dust',
              x: obs.x + (Math.random() - 0.5) * 15,
              y: obs.y + (obs._wallSide === 'top' ? 3 : -3) + (Math.random() - 0.5) * 4,
              vx: (Math.random() - 0.5) * 0.4,
              vy: (obs._wallSide === 'top' ? 0.2 : -0.2),
              alpha: 0.3 + warnProgress * 0.3,
              size: 3 + Math.random() * 4,
              life: 15 + Math.floor(Math.random() * 10),
              color: '#776655'
            });
          }

          // Rising embers
          if (Math.random() < 0.25 * dt) {
            this.particles.push({
              type: 'sparkle',
              x: obs.x + (Math.random() - 0.5) * 12,
              y: obs.y + (obs._wallSide === 'top' ? 1 : -1) * 5 + (Math.random() - 0.5) * 5,
              vx: (Math.random() - 0.5) * 0.3,
              vy: (obs._wallSide === 'top' ? -1 : 1) * (0.3 + Math.random() * 0.5),
              alpha: 0.5 + Math.random() * 0.3,
              size: 1.5 + Math.random() * 2,
              life: 20 + Math.floor(Math.random() * 15),
              color: '#ff6600'
            });
          }

          if (obs._stateTimer >= obs._warningDuration) {
            obs._state = 'fallen';
            obs._stateTimer = 0;
            obs._fallProgress = 0;

            // Collapse burst particles
            for (let i = 0; i < 20; i++) {
              const angle = (obs._wallSide === 'top' ? 1 : -1) * (Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.6);
              const speed = 1.5 + Math.random() * 4;
              this.particles.push({
                type: 'dust',
                x: obs.x + (Math.random() - 0.5) * 15,
                y: obs.y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 0.6 + Math.random() * 0.3,
                size: 3 + Math.random() * 6,
                life: 25 + Math.floor(Math.random() * 20),
                color: ['#554433', '#665544', '#776655', '#887766', '#998877'][Math.floor(Math.random() * 5)]
              });
            }

            // Dust cloud particles
            for (let i = 0; i < 12; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 0.5 + Math.random() * 2;
              this.particles.push({
                type: 'dust',
                x: obs.x + (Math.random() - 0.5) * 20,
                y: obs.y + (obs._wallSide === 'top' ? 1 : -1) * 10 + (Math.random() - 0.5) * 8,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed * 0.5,
                alpha: 0.25 + Math.random() * 0.2,
                size: 8 + Math.random() * 10,
                life: 30 + Math.floor(Math.random() * 20),
                color: '#554433'
              });
            }

            // Glowing ember burst
            for (let i = 0; i < 8; i++) {
              const angle = (obs._wallSide === 'top' ? 1 : -1) * (Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.4);
              const speed = 1 + Math.random() * 3;
              this.particles.push({
                type: 'sparkle',
                x: obs.x + (Math.random() - 0.5) * 10,
                y: obs.y + (Math.random() - 0.5) * 8,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 0.8,
                size: 2 + Math.random() * 3,
                life: 20 + Math.floor(Math.random() * 15),
                color: ['#ff4400', '#ff6600', '#ff8800', '#ffaa00'][Math.floor(Math.random() * 4)]
              });
            }

            // Brief screen dust overlay (visual only, no camera shake)
            if (this._dustOverlay === undefined) this._dustOverlay = 0;
            this._dustOverlay = 15;
          }
        } else if (obs._state === 'fallen') {
          // Fall animation: pillar rotates into lane
          if (obs._fallProgress < 1) {
            obs._fallProgress += dt / 15; // Complete fall in ~0.25s at 60fps
            if (obs._fallProgress > 1) obs._fallProgress = 1;
          }

          // Smoke from fallen pillar
          if (Math.random() < 0.15 * dt) {
            this.particles.push({
              type: 'dust',
              x: obs.x + (Math.random() - 0.5) * (obs._fallenWidth || 60) * 0.5,
              y: obs.y + (obs._wallSide === 'top' ? 1 : -1) * (obs._fallenHeight || 30) * 0.3 + (Math.random() - 0.5) * 5,
              vx: (Math.random() - 0.5) * 0.2,
              vy: (obs._wallSide === 'top' ? -0.3 : 0.3),
              alpha: 0.15 + Math.random() * 0.1,
              size: 6 + Math.random() * 8,
              life: 25 + Math.floor(Math.random() * 15),
              color: '#333333'
            });
          }

          // Occasional embers from broken rocks
          if (Math.random() < 0.1 * dt) {
            this.particles.push({
              type: 'sparkle',
              x: obs.x + (Math.random() - 0.5) * (obs._fallenWidth || 60) * 0.4,
              y: obs.y + (obs._wallSide === 'top' ? 1 : -1) * (obs._fallenHeight || 30) * 0.5,
              vx: (Math.random() - 0.5) * 0.4,
              vy: (obs._wallSide === 'top' ? -0.5 : 0.5) - Math.random() * 0.3,
              alpha: 0.4 + Math.random() * 0.3,
              size: 1.5 + Math.random() * 2,
              life: 15 + Math.floor(Math.random() * 10),
              color: '#ff8800'
            });
          }

          if (obs._stateTimer >= obs._fallenDuration) {
            obs._state = 'disappearing';
            obs._stateTimer = 0;
            obs._crumbleProgress = 0;

            // Crumble particles
            for (let i = 0; i < 15; i++) {
              this.particles.push({
                type: 'dust',
                x: obs.x + (Math.random() - 0.5) * (obs._fallenWidth || 60),
                y: obs.y + (obs._wallSide === 'top' ? 1 : -1) * (obs._fallenHeight || 30) * (0.2 + Math.random() * 0.6),
                vx: (Math.random() - 0.5) * 1.5,
                vy: (obs._wallSide === 'top' ? -0.5 : 0.5) + (Math.random() - 0.5) * 0.8,
                alpha: 0.5 + Math.random() * 0.3,
                size: 3 + Math.random() * 5,
                life: 25 + Math.floor(Math.random() * 20),
                color: '#554433'
              });
            }

            // Dust cloud
            for (let i = 0; i < 8; i++) {
              this.particles.push({
                type: 'dust',
                x: obs.x + (Math.random() - 0.5) * 25,
                y: obs.y + (obs._wallSide === 'top' ? 1 : -1) * 10 + (Math.random() - 0.5) * 8,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (obs._wallSide === 'top' ? -0.3 : 0.3) + (Math.random() - 0.5) * 0.5,
                alpha: 0.3 + Math.random() * 0.2,
                size: 7 + Math.random() * 8,
                life: 30 + Math.floor(Math.random() * 20),
                color: '#665544'
              });
            }
          }
        } else if (obs._state === 'disappearing') {
          obs._crumbleProgress += dt / obs._disappearDuration;
          // Fade out
          if (obs._crumbleProgress >= 1) {
            obs._state = 'standing';
            obs._stateTimer = 0;
            obs._crumbleProgress = 0;
            obs._standingDuration = 480 + Math.floor(Math.random() * 420);
          }
        }
      });
    }

    // Dust overlay timer
    if (this._dustOverlay && this._dustOverlay > 0) {
      this._dustOverlay -= dt;
      if (this._dustOverlay < 0) this._dustOverlay = 0;
    }

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
    const isFootball = this._footballShowerActive;
    const range = isFootball ? 800 : 400;
    const spawnX = leadBall.x + (Math.random() - 0.5) * range;
    const bounds = this.physics.getWallBoundaries(spawnX, this.track);
    if (!bounds) return;
    const spawnY = bounds.topY + 10;
    const isFoot = isFootball;
    this.track.obstacles.push({
      type: 'rock', isMeteor: true,
      x: spawnX, y: spawnY,
      radius: isFoot ? 20 + Math.random() * 11 : 14 + Math.random() * 8,
      vx: (Math.random() - 0.5) * (isFoot ? 3 : 0.5),
      vy: isFoot ? 2 + Math.random() * 6 : 4 + Math.random() * 4,
      mass: isFoot ? 5 : 3,
      bounce: 0, // footballs pass through walls, only collide with balls
      _lifetime: isFoot ? 300 + Math.random() * 200 : 0,
      _stoppedTimer: 0
    });
  }

  // Spawn a rain drop for tropical rainstorm event (Amazon Canopy only)
  spawnRainDrop() {
    if (!this.track || !this.balls.length) return;
    const leadBall = [...this.balls].filter(b => !b.finished).sort((a, b) => b.x - a.x)[0];
    if (!leadBall) return;
    const range = 1000;
    const spawnX = leadBall.x + (Math.random() - 0.5) * range;
    const bounds = this.physics.getWallBoundaries(spawnX, this.track);
    if (!bounds) return;
    const spawnY = bounds.topY - 50; // spawn above track
    this.track.obstacles.push({
      type: 'rain_drop',
      x: spawnX, y: spawnY,
      radius: 3 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 1,
      vy: 8 + Math.random() * 4,
      mass: 0.5,
      bounce: 0,
      _lifetime: 200 + Math.random() * 100,
      _isRainDrop: true
    });
  }

  // Apply ice splash: freeze all unfrozen balls within splashRadius
  _applyIceSplash(sx, sy, splashRadius) {
    if (!this.balls) return;
    for (const ball of this.balls) {
      if (ball.finished || ball.eliminated) continue;
      if (ball._frozen) continue;
      const dx = ball.x - sx, dy = ball.y - sy;
      if (Math.hypot(dx, dy) < splashRadius + ball.radius) {
        ball._frozen = true;
        ball._frozenTimer = 240;
        ball._frozenSpeedMult = 0.10;
        ball._origVx = ball.vx;
        ball._origVy = ball.vy;
        ball.vx *= ball._frozenSpeedMult;
        ball.vy *= ball._frozenSpeedMult;
        // Hit flash particles - white burst around the frozen ball
        if (this.particles) {
          for (let p = 0; p < 12; p++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 1 + Math.random() * 3;
            this.particles.push({
              type: 'sparkle',
              x: ball.x + (Math.random() - 0.5) * 6,
              y: ball.y + (Math.random() - 0.5) * 6,
              vx: Math.cos(a) * spd,
              vy: Math.sin(a) * spd,
              alpha: 0.9,
              size: 2 + Math.random() * 4,
              life: 10 + Math.floor(Math.random() * 8),
              color: '#ffffff'
            });
          }
          for (let r = 0; r < 6; r++) {
            const a = Math.random() * Math.PI * 2;
            this.particles.push({
              type: 'sparkle',
              x: ball.x,
              y: ball.y,
              vx: Math.cos(a) * (2 + Math.random() * 2),
              vy: Math.sin(a) * (2 + Math.random() * 2),
              alpha: 0.7,
              size: 4 + Math.random() * 3,
              life: 6 + Math.floor(Math.random() * 6),
              color: '#a0d8ef'
            });
          }
        }
      }
    }
  }

// Trigger alternate race events (football shower, gravity flip, speed surge, blackout, teleportation)
  triggerRandomEvent() {
    if (this.activeEvent) return;

    // Filter events by loadout if set, otherwise use all implemented events
    const enabledEventKeys = this._loadout && this._loadout.events
      ? new Set(this._loadout.events)
      : null;

    // Build frequency-weighted event list
    const eventFreqs = (this._loadout && this._loadout.eventFreqs) || {};
    const freqToWeight = (f) => f <= 1 ? 1 : f === 2 ? 3 : f === 3 ? 5 : f === 4 ? 10 : 20;

    const isVolcano = this.currentThemeKey === 'volcano';

    const events = [
      { name: '\u{26BD} FOOTBALL SHOWER!', key: 'football_shower', duration: 420, description: 'Footballs rain across the track, creating unpredictable collisions.' },
      { name: 'GRAVITY FLIP', key: 'gravity_flip', duration: 240, description: 'Gravity reverses, sending racers soaring upside down.' },
      { name: '\u{26A1} SPEED SURGE', key: 'speed_surge', duration: 360, description: 'Every racer receives a different random speed multiplier.' },
      { name: '\u{26A1} BLACKOUT', key: 'blackout', duration: 0, description: 'Stadium lights have gone out. Anything can happen...' },
      { name: '\u{26A1} TELEPORTATION', key: 'teleportation', duration: 360, description: 'Ten countries suddenly swapped positions!' },
      { name: '\u{2744} BLIZZARD', key: 'blizzard', duration: 300, description: 'A freezing storm slows every racer.' },
      { name: 'AURORA BOREALIS', key: 'aurora_borealis', duration: 480, description: 'The northern lights dance across the frozen sky.' },
      { name: '\uD83C\uDF0B VOLCANIC ERUPTION', key: 'volcanic_eruption', duration: 480, description: 'The volcano has awakened. The entire crater becomes unstable!' },
      { name: '\uD83D\uDD25 FIRESTORM', key: 'firestorm', duration: 360, description: 'Scorching volcanic winds sweep across the crater!' },
      { name: '\uD83C\uDF2B LAVA SHOWER', key: 'lava_shower', duration: 360, description: 'Molten rocks rain from the volcano above!' },
    ]
      .filter(e => !enabledEventKeys || enabledEventKeys.has(e.key))
      .filter(e => e.key !== 'blizzard' || this.currentThemeKey === 'snow')
      .filter(e => e.key !== 'gravity_flip' || (this.currentThemeKey !== 'snow' && !isVolcano))
      .filter(e => e.key !== 'volcanic_eruption' || isVolcano)
      .filter(e => e.key !== 'blackout' || (this.currentThemeKey !== 'snow' && !isVolcano))
      .filter(e => e.key !== 'firestorm' || isVolcano)
      .filter(e => e.key !== 'aurora_borealis' || this.currentThemeKey === 'snow')
      .filter(e => e.key !== 'football_shower' || !isVolcano)
      .filter(e => e.key !== 'lava_shower' || isVolcano)
      .map(e => ({ ...e, weight: freqToWeight(eventFreqs[e.key] || 3) }));

    // Weighted random selection using frequencies
    const totalWeight = events.reduce((sum, e) => sum + e.weight, 0);
    let rand = Math.random() * totalWeight;
    let evt = events[events.length - 1]; // fallback
    for (const e of events) {
      if (rand < e.weight) { evt = e; break; }
      rand -= e.weight;
    }

    this.activeEvent = evt;
    this.eventTimer = evt.duration;

    if (evt.key === 'football_shower') {
      this._footballShowerActive = true;
    } else if (evt.key === 'lava_shower') {
      this._lavaShowerActive = true;
      // Initialize lava chunk pool
      this._lavaChunks = [];
      // Darken sky slightly
      this._lavaShowerSkyDim = 0;
    } else if (evt.key === 'speed_surge') {
      this._speedSurgeActive = true;
      this._speedSurgeMultipliers.clear();
      this.balls.forEach(ball => {
        if (!ball.finished && !ball.eliminated) {
          const mult = 0.85 + Math.random() * 0.55;
          this._speedSurgeMultipliers.set(ball.id, mult);
          // Apply multiplier ONCE at event start
          ball.vx *= mult;
          ball.vy *= mult;
        }
      });
    } else if (evt.key === 'blackout') {
      this._blackoutActive = true;
      this._blackoutFadeLevel = 0;
      this._blackoutFlickerTimer = 0;
      this._blackoutDuration = 180 + Math.random() * 120;
      this._blackoutPhase = 'active';
      this.eventTimer = this._blackoutDuration + 60;
    } else if (evt.key === 'teleportation') {
      const activeBalls = this.balls.filter(b => !b.finished && !b.eliminated);
      if (activeBalls.length >= 10) {
        const sortedByPos = [...activeBalls].sort((a, b) => b.x - a.x);
        const top5 = sortedByPos.slice(0, 5);
        const rest = sortedByPos.slice(5);
        const leaders = top5.sort(() => Math.random() - 0.5).slice(0, 2);
        const others = [...top5.filter(b => !leaders.includes(b)), ...rest].sort(() => Math.random() - 0.5);
        const remaining = others.slice(0, 8);
        const selected = [...leaders, ...remaining];
        this._teleportPairs = [];
        for (let i = 0; i < 5; i++) {
          this._teleportPairs.push({ ball1: selected[i], ball2: selected[i + 5] });
        }
        this._teleportState = 'warning';
        this._teleportTimer = 48;
        this._teleportPostPairs = [];
        this._teleportPairs.forEach(pair => {
          this.commentary.add(pair.ball1.name + ' switched with ' + pair.ball2.name + '!', 'info');
        });
      } else {
        this.activeEvent = null;
        return;
      }
    } else if (evt.key === 'blizzard') {
      this._blizzardActive = true;
      this._blizzardCrackTimer = 120 + Math.random() * 60;
      // Initialize snow particle pool
      this._blizzardSnowParticles = [];
      for (let i = 0; i < 45; i++) {
        this._blizzardSnowParticles.push({
          x: Math.random(),
          y: Math.random(),
          size: 1.5 + Math.random() * 2.5,
          speedX: -0.3 - Math.random() * 0.6,
          speedY: 0.1 + Math.random() * 0.3,
          alpha: 0.3 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2
        });
      }
      // Initialize fog particle pool
      this._blizzardFogParticles = [];
      for (let i = 0; i < 12; i++) {
        this._blizzardFogParticles.push({
          x: Math.random(),
          y: Math.random(),
          size: 80 + Math.random() * 120,
          speedX: -0.05 - Math.random() * 0.08,
          alpha: 0.04 + Math.random() * 0.06,
          phase: Math.random() * Math.PI * 2
        });
      }
      // Apply 20% speed to all active balls
      this.balls.forEach(ball => {
        if (!ball.finished && !ball.eliminated) {
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ball._blizzardCapSpeed = speed * 0.2;
          const ratio = 0.2;
          ball.vx *= ratio;
          ball.vy *= ratio;
        }
      });
      // Start wind audio
      this.sounds.startBlizzardWind();
    } else if (evt.key === 'aurora_borealis') {
      this._auroraActive = true;
      this._auroraRibbonTime = 0;
      this._auroraFadePhase = 'fade_in';
      this._auroraFadeProgress = 0;
      this._auroraPulseTimer = 180 + Math.random() * 120;
      this._auroraPulseValue = 0;
      this._auroraDominantColor = { r: 75, g: 235, b: 140 };
      this._auroraSceneBrightness = 1.0;
      this.eventTimer = 480 + 120; // 8s active + 2s fade-in buffer
      // Generate star field (105 stars for enhanced visibility)
      this._auroraStars = [];
      for (let i = 0; i < 105; i++) {
        this._auroraStars.push({
          x: Math.random(),
          y: 0.015 + Math.random() * 0.38,
          size: 0.6 + Math.random() * 2.2,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.4 + Math.random() * 1.6
        });
      }
      // Initialize arctic wind particles (soft drifting snow)
      this._auroraArcticParticles = [];
      for (let i = 0; i < 60; i++) {
        this._auroraArcticParticles.push({
          x: Math.random(), y: Math.random(),
          size: 0.5 + Math.random() * 1.5,
          speedX: -0.1 - Math.random() * 0.2,
          speedY: 0.02 + Math.random() * 0.05,
          alpha: 0.1 + Math.random() * 0.25,
          phase: Math.random() * Math.PI * 2,
          auroraGlow: Math.random() > 0.7 ? Math.random() : 0
        });
      }
      // Tiny ice crystals
      for (let i = 0; i < 25; i++) {
        this._auroraArcticParticles.push({
          x: Math.random(), y: Math.random(),
          size: 0.3 + Math.random() * 0.6,
          speedX: 0.05 + Math.random() * 0.08,
          speedY: -0.03 - Math.random() * 0.04,
          alpha: 0.15 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
          auroraGlow: 0.3 + Math.random() * 0.7
        });
      }
      // Slow wind streaks
      for (let i = 0; i < 15; i++) {
        this._auroraArcticParticles.push({
          x: Math.random(), y: Math.random(),
          size: 1.5 + Math.random() * 3,
          speedX: -0.3 - Math.random() * 0.4,
          speedY: 0,
          alpha: 0.02 + Math.random() * 0.05,
          phase: Math.random() * Math.PI * 2,
          auroraGlow: 0.1 + Math.random() * 0.3
        });
      }
      // Initialize background fog layers for depth
      this._auroraBackgroundFog = [];
      for (let i = 0; i < 6; i++) {
        this._auroraBackgroundFog.push({
          x: Math.random() * 1.2 - 0.1,
          y: 0.35 + Math.random() * 0.45,
          size: 100 + Math.random() * 150,
          speedX: -0.02 - Math.random() * 0.03,
          alpha: 0.02 + Math.random() * 0.04,
          colorShift: Math.random() * 0.5
        });
      }
      this._auroraGustTimer = 120 + Math.random() * 120;
      this._auroraSnowGusts = [];
      // Start ambient audio
      this.sounds.startAuroraAmbient();
    } else if (evt.key === 'volcanic_eruption') {
      this._volcanicEruptionActive = true;
      this._volcanicEruptionPhase = 'warning';
      this._volcanicEruptionTimer = 60; // 1 second warning phase
      this._volcanicEruptionFadeProgress = 0;
      this._volcanicEruptionBombs = [];
      this._volcanicEruptionSkyDarkness = 0;
      this._volcanicEruptionGlowIntensity = 0;
      this._volcanicEruptionAshParticles = [];
      this._volcanicEruptionSmokeParticles = [];
      this._volcanicEruptionEmberParticles = [];
      this._volcanicEruptionFountainParticles = [];
      this._volcanicEruptionBombSpawnCounter = 6 + Math.floor(Math.random() * 5);
      this._volcanicEruptionScreenFlash = 0;
      // Total duration is 480 frames
      this.eventTimer = 480;
    } else if (evt.key === 'firestorm') {
      this._firestormActive = true;
      this._firestormPhase = 'build_up';
      this._firestormTimer = 60; // 1 second build-up
      this._firestormFadeProgress = 0;
      this._firestormSkyDarkness = 0;
      this._firestormGlowIntensity = 0;
      this._firestormEmbers = [];
      this._firestormAsh = [];
      this._firestormWindStreaks = [];
      this._firestormSparks = [];
      this._firestormLargeClouds = [];
      this._firestormWhirls = [];
      this._firestormWhirlTimer = 60;

      // Apply 0.3x speed to all active balls
      this.balls.forEach(ball => {
        if (!ball.finished && !ball.eliminated) {
          const speed = Math.hypot(ball.vx, ball.vy);

          // Always store original speed for cap calculation
          ball._firestormOriginalSpeed = speed;
          ball._firestormActiveSlow = true;

          // Apply slow instantly
          ball.vx *= 0.3;
          ball.vy *= 0.3;

          // Apply firestorm burn visual only if no other burn is active
          if (!ball._lavaBurnActive && !ball._geyserBurnActive && !ball._showerBurnActive) {
            ball._firestormBurnActive = true;
            ball._firestormBurnTimer = 300; // 5 seconds (covers build-up + active)
          }
        }
      });

      // Total duration 360 frames = 6 seconds
      this.eventTimer = 360;
    }

    this.eventCount++;
    this.commentary.add(evt.name + ' triggered!', 'info');
    this.eventBanner.show(evt.name, evt.description, 2500);
  }

  // Update random event continuous effects
  updateRandomEvents(dt) {
    if (!this.activeEvent) return;
    this.eventTimer -= dt;
    if (this.eventTimer <= 0) {
      if (this.activeEvent.key === 'gravity_flip') {
        this.physics.forwardForce = this.currentTheme.forwardForce * 0.65;
      }
      if (this.activeEvent.key === 'football_shower') {
        this._footballShowerActive = false;
      }
      if (this.activeEvent.key === 'lava_shower') {
        this._lavaShowerActive = false;
        this._lavaShowerSkyDim = 0;
        this._lavaChunks = [];
      }
      if (this.activeEvent.key === 'speed_surge') {
      this._speedSurgeActive = false;
      this._speedSurgeMultipliers.clear();
    }
      if (this.activeEvent.key === 'blackout') {
        this._blackoutFadeLevel = 0;
        this._blackoutActive = false;
        this._blackoutPhase = null;
      }
      if (this.activeEvent.key === 'teleportation') {
        this._teleportState = null;
        this._teleportPairs = [];
        this._teleportPostPairs = [];
      }
      if (this.activeEvent.key === 'volcanic_eruption') {
        this._volcanicEruptionActive = false;
        this._volcanicEruptionPhase = null;
        this._volcanicEruptionTimer = 0;
        this._volcanicEruptionFadeProgress = 0;
        this._volcanicEruptionBombs = [];
        this._volcanicEruptionSkyDarkness = 0;
        this._volcanicEruptionGlowIntensity = 0;
        this._volcanicEruptionAshParticles = [];
        this._volcanicEruptionSmokeParticles = [];
        this._volcanicEruptionEmberParticles = [];
        this._volcanicEruptionFountainParticles = [];
        this._volcanicEruptionBombSpawnCounter = 0;
        this._volcanicEruptionScreenFlash = 0;
      }
      if (this.activeEvent.key === 'firestorm') {
        this._firestormActive = false;
        this._firestormPhase = null;
        this._firestormTimer = 0;
        this._firestormFadeProgress = 0;
        this._firestormSkyDarkness = 0;
        this._firestormGlowIntensity = 0;
        this._firestormEmbers = [];
        this._firestormAsh = [];
        this._firestormWindStreaks = [];
        this._firestormSparks = [];
        this._firestormLargeClouds = [];
        this._firestormWhirls = [];
        this._firestormWhirlTimer = 0;
        this._firestormSkyTint = 0;
        this.balls.forEach(ball => {
          delete ball._firestormOriginalSpeed;
          ball._firestormActiveSlow = false;
          ball._firestormBurnActive = false;
          ball._firestormBurnTimer = 0;
        });
      }
      if (this.activeEvent.key === 'blizzard') {
        this._blizzardActive = false;
        this.balls.forEach(ball => {
          delete ball._blizzardCapSpeed;
        });
        this.sounds.stopBlizzardWind();
      }
      if (this.activeEvent.key === 'aurora_borealis') {
        this._auroraActive = false;
        this._auroraFadePhase = null;
        this._auroraFadeProgress = 0;
        this._auroraStars = [];
        this._auroraArcticParticles = [];
        this._auroraSnowGusts = [];
        this._auroraBackgroundFog = [];
        this._auroraSceneBrightness = 1.0;
        this.sounds.stopAuroraAmbient();
      }
      this.activeEvent = null;
      return;
    }
    if (this.activeEvent.key === 'gravity_flip') {
      this.physics.forwardForce = -this.currentTheme.forwardForce * 0.3;
      this.balls.forEach(ball => {
        if (!ball.finished && ball.z === 0) {
          const bounds = this.physics.getWallBoundaries(ball.x, this.track);
          if (bounds) {
            const trackTop = bounds.topY + 15;
            const distanceToTop = ball.y - trackTop;
            // Strong upward force toward top boundary
            ball.vy -= 0.08 * dt;
            // Gentle horizontal drift
            ball.vx += (Math.random() - 0.5) * 0.02 * dt;
            // Slight slowdown when near top (less aggressive)
            if (distanceToTop < 30) {
              ball.vy *= 0.98;
              ball.vx *= 0.995;
            }
            // Keep within bounds - elastic bounce
            if (ball.y < trackTop) {
              ball.y = trackTop;
              ball.vy = Math.abs(ball.vy) * 0.9;
            }
          }
        }
      });
    } else if (this.activeEvent.key === 'speed_surge') {
      // Multiplier already applied at event start in triggerRandomEvent
      // No continuous application needed - velocity naturally decays via physics
    } else if (this.activeEvent.key === 'blackout') {
      if (this.eventTimer > 60) {
        this._blackoutPhase = 'active';
      } else if (this._blackoutPhase === 'active') {
        this._blackoutPhase = 'fade_out';
      }
      if (this._blackoutPhase === 'active') {
        this._blackoutFlickerTimer += dt;
        const flickerInterval = 30 + Math.random() * 42;
        if (this._blackoutFlickerTimer > flickerInterval) {
          this._blackoutFlickerTimer = 0;
        }
        const targetFade = 0.99;
        this._blackoutFadeLevel += (targetFade - this._blackoutFadeLevel) * 0.02 * dt;
      } else {
        this._blackoutFadeLevel *= 0.97;
        if (this._blackoutFadeLevel < 0.01) this._blackoutFadeLevel = 0;
      }
    } else if (this.activeEvent.key === 'teleportation') {
      if (this._teleportState === 'warning') {
        this._teleportTimer -= dt;
        this._teleportPairs.forEach(pair => {
          if (Math.random() < 0.2 * dt) {
            this.particles.push({
              type: 'sparkle',
              x: pair.ball1.x + (Math.random() - 0.5) * 30,
              y: pair.ball1.y + (Math.random() - 0.5) * 30,
              vx: (Math.random() - 0.5) * 2,
              vy: -1 - Math.random() * 2,
              alpha: 0.8,
              size: 2 + Math.random() * 3,
              life: 15 + Math.random() * 15,
              color: '#88ccff'
            });
            this.particles.push({
              type: 'sparkle',
              x: pair.ball2.x + (Math.random() - 0.5) * 30,
              y: pair.ball2.y + (Math.random() - 0.5) * 30,
              vx: (Math.random() - 0.5) * 2,
              vy: -1 - Math.random() * 2,
              alpha: 0.8,
              size: 2 + Math.random() * 3,
              life: 15 + Math.random() * 15,
              color: '#88ccff'
            });
          }
        });
        if (this._teleportTimer <= 0) {
          this._teleportState = 'swap';
        }
      } else if (this._teleportState === 'swap') {
        this._teleportPairs.forEach(pair => {
          const swapMessages = [
            pair.ball1.name + ' suddenly disappears!',
            pair.ball2.name + ' appears out of nowhere!',
            pair.ball1.name + ' just switched with ' + pair.ball2.name + '!'
          ];
          this.commentary.add(swapMessages[Math.floor(Math.random() * swapMessages.length)], 'info');
          const bx1 = pair.ball1.x;
          const by1 = pair.ball1.y;
          const bx2 = pair.ball2.x;
          const by2 = pair.ball2.y;
          pair.ball1.x = bx2;
          pair.ball1.y = by2;
          pair.ball2.x = bx1;
          pair.ball2.y = by1;
          this._teleportPostPairs.push({
            ball: pair.ball1,
            name: pair.ball2.name,
            timer: 300
          });
          this._teleportPostPairs.push({
            ball: pair.ball2,
            name: pair.ball1.name,
            timer: 300
          });
          for (let i = 0; i < 10; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 20 + Math.random() * 15;
            this.particles.push({
              type: 'sparkle', x: bx1 + Math.cos(a) * r, y: by1 + Math.sin(a) * r,
              vx: Math.cos(a) * (1 + Math.random() * 2), vy: Math.sin(a) * (1 + Math.random() * 2),
              alpha: 1, size: 3 + Math.random() * 3, life: 20 + Math.random() * 10, color: '#88ccff'
            });
            this.particles.push({
              type: 'sparkle', x: bx2 + Math.cos(a) * r, y: by2 + Math.sin(a) * r,
              vx: Math.cos(a) * (1 + Math.random() * 2), vy: Math.sin(a) * (1 + Math.random() * 2),
              alpha: 1, size: 3 + Math.random() * 3, life: 20 + Math.random() * 10, color: '#88ccff'
            });
          }
        });
        this._whiteFlashAlpha = 1;
        this._teleportState = 'post';
        this._teleportTimer = 300;
      } else if (this._teleportState === 'post') {
        this._teleportTimer -= dt;
        this._teleportPostPairs.forEach(p => { p.timer -= dt; });
        this._teleportPostPairs = this._teleportPostPairs.filter(p => p.timer > 0);
        if (this._teleportTimer <= 0) {
          this._teleportState = null;
          this._teleportPairs = [];
          this._teleportPostPairs = [];
        }
      }
    } else if (this.activeEvent.key === 'blizzard') {
      // Update snow particle positions (screen-space, normalized 0-1)
      const time = Date.now() * 0.001;
      for (const sp of this._blizzardSnowParticles) {
        sp.x += sp.speedX * dt * 0.008;
        sp.y += sp.speedY * dt * 0.008 + Math.sin(time + sp.phase) * 0.0003 * dt;
        if (sp.x < -0.05) sp.x = 1.05;
        if (sp.x > 1.05) sp.x = -0.05;
        if (sp.y < -0.05) sp.y = 1.05;
        if (sp.y > 1.05) sp.y = -0.05;
      }
      // Update fog particle positions
      for (const fp of this._blizzardFogParticles) {
        fp.x += fp.speedX * dt * 0.008;
        if (fp.x < -0.1) fp.x = 1.1;
        if (fp.x > 1.1) fp.x = -0.1;
      }
      // Random ice crack sounds
      this._blizzardCrackTimer -= dt;
      if (this._blizzardCrackTimer <= 0) {
        this.sounds.playBlizzardCrack();
        this._blizzardCrackTimer = 120 + Math.random() * 60;
      }
    } else if (this.activeEvent.key === 'firestorm') {
      if (!this._firestormActive) return;

      const totalFrames = 360;
      const buildUpEnd = totalFrames - 60;
      const activeEnd = 60;
      const timeLeft = this.eventTimer;
      const now = Date.now();

      // Consistent wind direction that slowly shifts
      const windAngle = Math.sin(now * 0.0003) * Math.PI * 0.3;
      const windDirX = Math.cos(windAngle);
      const windStr = 0.5 + Math.abs(Math.sin(now * 0.0004)) * 0.5;

      // ---- Phase Management ----
      if (timeLeft > buildUpEnd) {
        // Phase 1: Build-up (1 second)
        this._firestormPhase = 'build_up';
        const progress = 1 - (timeLeft - buildUpEnd) / 60;
        this._firestormFadeProgress = progress;
        this._firestormSkyDarkness = progress * 0.28;
        this._firestormGlowIntensity = progress * 0.6;
        this._firestormSkyTint = progress * 0.25;

        // Wind streaks building
        if (Math.random() < 0.1 * dt && this._firestormWindStreaks.length < 8) {
          const startEdge = windDirX > 0 ? -0.15 : 1.15;
          this._firestormWindStreaks.push({
            x: startEdge,
            y: 0.05 + Math.random() * 0.65,
            vx: windDirX * 0.004 * (0.6 + Math.random() * 0.8),
            vy: (Math.random() - 0.5) * 0.0004,
            width: 4 + Math.random() * 6,
            length: 0.08 + Math.random() * 0.15,
            alpha: 0.04 + Math.random() * 0.04,
            life: 1.0,
            phase: Math.random() * Math.PI * 2
          });
        }

        // Ash drifting with wind
        if (Math.random() < 0.1 * dt && this._firestormAsh.length < 20) {
          const startEdge = windDirX > 0 ? -0.08 : 1.08;
          this._firestormAsh.push({
            x: startEdge,
            y: 0.05 + Math.random() * 0.6,
            vx: windDirX * 0.0015 * (0.5 + Math.random() * 0.8),
            vy: (Math.random() - 0.5) * 0.0005 + 0.0002,
            size: 6 + Math.random() * 10,
            alpha: 0.06 + Math.random() * 0.06,
            color: ['#3a3028', '#4a3a30', '#2a2218', '#5a4a3a'][Math.floor(Math.random() * 4)],
            life: 1.0,
            swirlPhase: Math.random() * Math.PI * 2
          });
        }

        // Small embers carried by wind
        if (Math.random() < 0.15 * dt && this._firestormEmbers.length < 40) {
          const startEdge = windDirX > 0 ? -0.08 : 1.08;
          this._firestormEmbers.push({
            x: startEdge,
            y: 0.05 + Math.random() * 0.65,
            vx: windDirX * 0.003 * (0.8 + Math.random()),
            vy: (Math.random() - 0.5) * 0.002 - 0.001,
            size: 1.5 + Math.random() * 2.5,
            alpha: 0.2 + Math.random() * 0.3,
            color: ['#ff4400', '#ff6600', '#ff8800', '#ffaa00'][Math.floor(Math.random() * 4)],
            life: 1.0
          });
        }

      } else if (timeLeft > activeEnd) {
        // Phase 2: Active Firestorm (4 seconds)
        this._firestormPhase = 'active';
        this._firestormFadeProgress = 1.0;
        this._firestormSkyDarkness = 0.28 + 0.04 * Math.sin(now * 0.003);
        this._firestormGlowIntensity = 0.6 + 0.1 * Math.sin(now * 0.002);
        this._firestormSkyTint = 0.25 + 0.05 * Math.sin(now * 0.0025);

        // ---- 1. Heat Gusts (continuous hot wind ribbons) ----
        if (Math.random() < 0.15 * dt && this._firestormWindStreaks.length < 20) {
          const startEdge = windDirX > 0 ? -0.2 : 1.2;
          this._firestormWindStreaks.push({
            x: startEdge,
            y: 0.02 + Math.random() * 0.7,
            vx: windDirX * 0.005 * (0.6 + Math.random() * windStr),
            vy: (Math.random() - 0.5) * 0.0005,
            width: 2 + Math.random() * 7,
            length: 0.06 + Math.random() * 0.18,
            alpha: 0.03 + Math.random() * 0.05,
            life: 1.0,
            phase: Math.random() * Math.PI * 2
          });
        }

        // ---- 2. Ember Storm (directional streaks carried by wind) ----
        if (Math.random() < 0.35 * dt && this._firestormEmbers.length < 120) {
          const startEdge = windDirX > 0 ? -0.1 : 1.1;
          this._firestormEmbers.push({
            x: startEdge,
            y: 0.02 + Math.random() * 0.7,
            vx: windDirX * 0.004 * (0.8 + Math.random() * 1.5 * windStr),
            vy: (Math.random() - 0.5) * 0.002 - 0.001,
            size: 1.5 + Math.random() * 3.5,
            alpha: 0.3 + Math.random() * 0.5,
            color: Math.random() < 0.08
              ? '#ffcc00'
              : (Math.random() < 0.3 ? '#ff4400' : (Math.random() < 0.5 ? '#ff6600' : '#ff8800')),
            life: 1.0,
            trail: true
          });
        }

        // ---- 3. Burning Ash (swirling, more density) ----
        if (Math.random() < 0.2 * dt && this._firestormAsh.length < 50) {
          const startEdge = windDirX > 0 ? -0.1 : 1.1;
          this._firestormAsh.push({
            x: startEdge,
            y: 0.02 + Math.random() * 0.65,
            vx: windDirX * 0.002 * (0.5 + Math.random() * 0.8),
            vy: (Math.random() - 0.5) * 0.0008 + 0.0003,
            size: 8 + Math.random() * 16,
            alpha: 0.06 + Math.random() * 0.08,
            color: ['#3a3028', '#4a3a30', '#2a2218', '#5a4a3a', '#6a5a4a'][Math.floor(Math.random() * 5)],
            life: 1.0,
            swirlPhase: Math.random() * Math.PI * 2
          });
        }

        // ---- 4. Orange sparks (rapid, small, bright) ----
        if (Math.random() < 0.3 * dt && this._firestormSparks.length < 35) {
          const startEdge = windDirX > 0 ? -0.08 : 1.08;
          this._firestormSparks.push({
            x: startEdge,
            y: 0.03 + Math.random() * 0.6,
            vx: windDirX * 0.008 * (0.5 + Math.random()),
            vy: (Math.random() - 0.5) * 0.004,
            size: 0.8 + Math.random() * 1.5,
            alpha: 0.5 + Math.random() * 0.5,
            color: ['#ffcc00', '#ffaa00', '#ff8800'][Math.floor(Math.random() * 3)],
            life: 1.0
          });
        }

        // ---- 5. Large Ash Clouds (slow drifting translucent masses) ----
        if (Math.random() < 0.04 * dt && this._firestormLargeClouds.length < 6) {
          const startEdge = windDirX > 0 ? -0.3 : 1.3;
          this._firestormLargeClouds.push({
            x: startEdge,
            y: 0.02 + Math.random() * 0.5,
            vx: windDirX * 0.0003 * (0.5 + Math.random()),
            vy: (Math.random() - 0.5) * 0.0001,
            width: 0.25 + Math.random() * 0.4,
            height: 0.1 + Math.random() * 0.15,
            alpha: 0.12 + Math.random() * 0.08,
            color: Math.random() < 0.3
              ? ['#4a3a30', '#5a4a3a'][Math.floor(Math.random() * 2)]
              : ['#2a2218', '#3a3028', '#1e1814'][Math.floor(Math.random() * 3)],
            life: 1.0,
            phase: Math.random() * Math.PI * 2
          });
        }

        // ---- 6. Fire Whirls (every 2-3 seconds) ----
        this._firestormWhirlTimer -= dt;
        if (this._firestormWhirlTimer <= 0 && this._firestormWhirls.length < 3) {
          this._firestormWhirlTimer = 120 + Math.floor(Math.random() * 60); // 2-3 seconds
          this._firestormWhirls.push({
            x: 0.1 + Math.random() * 0.8,
            y: 0.15 + Math.random() * 0.5,
            life: 1.0,
            maxLife: 1.0,
            phase: Math.random() * Math.PI * 2,
            height: 0.08 + Math.random() * 0.08,
            width: 0.015 + Math.random() * 0.015
          });
        }

        // ---- 7. Boost volcano ambient emissions ----
        if (this.currentThemeKey === 'volcano') {
          if (Math.random() < 0.04 * dt) {
            this._volcanoAshParticles.push({
              x: 0.3 + Math.random() * 0.4,
              y: 0.85 + Math.random() * 0.10,
              vx: (Math.random() - 0.5) * 0.0015,
              vy: -0.002 - Math.random() * 0.004,
              size: 4 + Math.random() * 5,
              alpha: 0.2 + Math.random() * 0.2,
              color: ['#3a3028', '#2a2218', '#4a3a30'][Math.floor(Math.random() * 3)],
              life: 1.0
            });
          }
          if (Math.random() < 0.06 * dt) {
            this._volcanoEmberParticles.push({
              x: 0.3 + Math.random() * 0.4,
              y: 0.78 + Math.random() * 0.17,
              vx: (Math.random() - 0.5) * 0.002,
              vy: -0.003 - Math.random() * 0.006,
              size: 2 + Math.random() * 3,
              alpha: 0.3 + Math.random() * 0.25,
              color: ['#ff6600', '#ff8800', '#ffaa00', '#ff4400'][Math.floor(Math.random() * 4)],
              life: 1.0
            });
          }
        }

      } else {
        // Phase 3: Fade-out (1 second)
        this._firestormPhase = 'fade_out';
        const endingProgress = timeLeft / 60;
        this._firestormFadeProgress = endingProgress;
        this._firestormSkyDarkness = 0.28 * endingProgress;
        this._firestormGlowIntensity = 0.6 * endingProgress;
        this._firestormSkyTint = 0.25 * endingProgress;

        // Smoothly fade all particle types
        for (const p of this._firestormEmbers) { p.alpha *= 0.95; p.vx *= 0.97; }
        for (const p of this._firestormAsh) { p.alpha *= 0.94; p.vx *= 0.97; }
        for (const p of this._firestormWindStreaks) { p.alpha *= 0.93; p.vx *= 0.96; }
        for (const p of this._firestormSparks) { p.alpha *= 0.94; p.vx *= 0.96; }
        for (const p of this._firestormLargeClouds) { p.alpha *= 0.96; p.vx *= 0.98; }
        for (const p of this._firestormWhirls) { p.life -= dt * 0.03; p.alpha = Math.max(0, p.life * 0.8); }
      }

      // ---- Common Particle Updates ----
      for (const p of this._firestormEmbers) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 0.003;
        p.alpha = Math.max(0, p.life * 0.7);
      }
      this._firestormEmbers = this._firestormEmbers.filter(p => p.life > 0 && p.alpha > 0.01 && p.y > -0.15 && p.y < 1.15);

      for (const p of this._firestormAsh) {
        const swirl = Math.sin(p.swirlPhase + now * 0.001) * 0.0006;
        p.x += (p.vx + swirl) * dt;
        p.y += p.vy * dt;
        p.life -= dt * 0.002;
        p.alpha = Math.max(0, p.life * 0.14);
        p.size += 0.02 * dt;
      }
      this._firestormAsh = this._firestormAsh.filter(p => p.life > 0 && p.alpha > 0.005);

      for (const p of this._firestormWindStreaks) {
        p.x += p.vx * dt;
        p.y += p.vy * dt + Math.sin(p.phase + now * 0.002) * 0.0003 * dt;
        p.life -= dt * 0.003;
        p.alpha = Math.max(0, p.life * 0.08);
        p.width *= 0.997;
        p.length *= 0.998;
      }
      this._firestormWindStreaks = this._firestormWindStreaks.filter(p => p.life > 0 && p.alpha > 0.005);

      for (const p of this._firestormSparks) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 0.004;
        p.alpha = Math.max(0, p.life * 0.9);
      }
      this._firestormSparks = this._firestormSparks.filter(p => p.life > 0 && p.alpha > 0.01);

      for (const p of this._firestormLargeClouds) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 0.001;
        p.alpha = Math.max(0, p.life * 0.18);
        p.width += 0.0002 * dt;
        p.height += 0.00005 * dt;
      }
      this._firestormLargeClouds = this._firestormLargeClouds.filter(p => p.life > 0 && p.alpha > 0.01);

      for (const p of this._firestormWhirls) {
        p.life -= dt * 0.008;
        p.alpha = Math.max(0, p.life * 0.8);
        p.width *= 1.002;
        p.height *= 1.003;
      }
      this._firestormWhirls = this._firestormWhirls.filter(p => p.life > 0 && p.alpha > 0.02);

      // ---- Update firestorm speed cap and burn timer ----
      if (this.balls) {
        for (const ball of this.balls) {
          if (ball.finished || ball.eliminated) continue;

          // Decrement burn timer for balls with firestorm burn
          if (ball._firestormBurnActive) {
            ball._firestormBurnTimer -= dt;
            if (ball._firestormBurnTimer <= 0) {
              ball._firestormBurnActive = false;
              ball._firestormBurnTimer = 0;
            }
          }

          if (!ball._firestormActiveSlow) continue;

          // Determine speed cap based on event phase
          let speedCapRatio;
          if (this._firestormPhase === 'active') {
            // Full effect: 0.3x
            speedCapRatio = 0.3;
          } else if (this._firestormPhase === 'fade_out') {
            // Gradual recovery: 0.3x -> 1.0x over 1 second
            const ft = this._firestormFadeProgress;
            speedCapRatio = 0.3 + (1 - ft) * 0.7;
          } else {
            // Build-up: already at 0.3x
            speedCapRatio = 0.3;
          }

          // Enforce speed cap (based on original speed at activation)
          const currentSpeed = Math.hypot(ball.vx, ball.vy);
          const cappedSpeed = (ball._firestormOriginalSpeed || currentSpeed) * speedCapRatio;
          if (currentSpeed > 0 && currentSpeed > cappedSpeed) {
            const ratio = cappedSpeed / currentSpeed;
            ball.vx *= ratio;
            ball.vy *= ratio;
          }

          // End firestorm slow at end of fade-out
          if (this._firestormPhase === 'fade_out' && this._firestormFadeProgress < 0.01) {
            ball._firestormActiveSlow = false;
            delete ball._firestormOriginalSpeed;
          }
        }
      }

    } else if (this.activeEvent.key === 'volcanic_eruption') {
      if (!this._volcanicEruptionActive) return;

      const totalEventFrames = 480;
      const warningEnd = totalEventFrames - 60;
      const eruptionEnd = 60;
      const timeLeft = this.eventTimer;

      // ---- Phase Management ----
      if (timeLeft > warningEnd) {
        // Phase 1: Warning (1 second)
        this._volcanicEruptionPhase = 'warning';
        const warningProgress = 1 - (timeLeft - warningEnd) / 60;
        this._volcanicEruptionFadeProgress = warningProgress;
        this._volcanicEruptionSkyDarkness = warningProgress * 0.18;
        this._volcanicEruptionGlowIntensity = warningProgress * 0.3;

        // More embers during warning
        if (Math.random() < 0.1 * dt && this._volcanicEruptionEmberParticles.length < 40) {
          this._volcanicEruptionEmberParticles.push({
            x: Math.random() * 0.9 + 0.05,
            y: 0.85 + Math.random() * 0.15,
            vx: (Math.random() - 0.5) * 0.001,
            vy: -0.002 - Math.random() * 0.004,
            size: 2 + Math.random() * 3,
            alpha: 0.3 + Math.random() * 0.3,
            color: ['#ff6600', '#ff8800', '#ffaa00', '#ff4400'][Math.floor(Math.random() * 4)],
            life: 1.0
          });
        }

        // Tremor glow on volcano background (just intensifies existing glow)

      } else if (timeLeft > eruptionEnd) {
        // Phase 2: Main Eruption (6 seconds)
        this._volcanicEruptionPhase = 'eruption';
        const eruptionProgress = 1 - (timeLeft - eruptionEnd) / (warningEnd - eruptionEnd);
        this._volcanicEruptionFadeProgress = 1.0;
        this._volcanicEruptionSkyDarkness = 0.18 + 0.02 * Math.sin(Date.now() * 0.003);
        this._volcanicEruptionGlowIntensity = 0.3 + 0.1 * Math.sin(Date.now() * 0.002);

        // Lava fountain particles (behind gameplay layer)
        if (Math.random() < 0.3 * dt && this._volcanicEruptionFountainParticles.length < 50) {
          const fx = 0.3 + Math.random() * 0.4;
          const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.4;
          const speed = 2 + Math.random() * 3;
          this._volcanicEruptionFountainParticles.push({
            x: fx,
            y: 0.15 + Math.random() * 0.05,
            vx: Math.cos(angle) * speed * 0.004,
            vy: Math.sin(angle) * speed * 0.003 - 0.005,
            size: 5 + Math.random() * 10,
            alpha: 0.6 + Math.random() * 0.4,
            color: ['#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ff5500'][Math.floor(Math.random() * 5)],
            life: 1.0,
            gravity: 0.00008
          });
        }

        // Thick black smoke
        if (Math.random() < 0.15 * dt && this._volcanicEruptionSmokeParticles.length < 25) {
          this._volcanicEruptionSmokeParticles.push({
            x: 0.3 + Math.random() * 0.4,
            y: 0.12 + Math.random() * 0.06,
            vx: (Math.random() - 0.5) * 0.002,
            vy: -0.001 - Math.random() * 0.002,
            size: 20 + Math.random() * 30,
            alpha: 0.15 + Math.random() * 0.15,
            color: ['#1a1410', '#2a2018', '#0e0c0a'][Math.floor(Math.random() * 3)],
            life: 1.0
          });
        }

        // Ash particles drifting across arena
        if (Math.random() < 0.12 * dt && this._volcanicEruptionAshParticles.length < 30) {
          this._volcanicEruptionAshParticles.push({
            x: (Math.random() < 0.5) ? -0.05 : 1.05,
            y: 0.1 + Math.random() * 0.5,
            vx: (Math.random() < 0.5 ? 0.001 : -0.001) * (1 + Math.random()),
            vy: -0.0003 - Math.random() * 0.0005,
            size: 8 + Math.random() * 12,
            alpha: 0.06 + Math.random() * 0.08,
            color: ['#3a3028', '#2a2218', '#4a3a30', '#1e1814'][Math.floor(Math.random() * 4)],
            life: 1.0
          });
        }

        // More embers during eruption
        if (Math.random() < 0.2 * dt && this._volcanicEruptionEmberParticles.length < 60) {
          this._volcanicEruptionEmberParticles.push({
            x: Math.random() * 0.9 + 0.05,
            y: 0.75 + Math.random() * 0.25,
            vx: (Math.random() - 0.5) * 0.0015,
            vy: -0.003 - Math.random() * 0.005,
            size: 2 + Math.random() * 4,
            alpha: 0.3 + Math.random() * 0.4,
            color: ['#ff6600', '#ff8800', '#ffaa00', '#ff4400', '#ff7700'][Math.floor(Math.random() * 5)],
            life: 1.0
          });
        }

        // Occasional bright flash near volcano
        if (Math.random() < 0.01 * dt) {
          this._volcanicEruptionScreenFlash = 0.3 + Math.random() * 0.2;
        }

        // ---- Spawn Volcanic Bombs ----
        if (this._volcanicEruptionBombSpawnCounter > 0 && Math.random() < 0.015 * dt) {
          const bomb = {
            x: Math.random() * 0.7 + 0.15,
            y: 0.05 + Math.random() * 0.08,
            vx: (Math.random() - 0.5) * 0.004,
            vy: 0.004 + Math.random() * 0.006,
            size: 12 + Math.random() * 8,
            alpha: 1,
            glow: 5 + Math.random() * 5,
            crackPhase: Math.random() * Math.PI * 2,
            hasLanded: false,
            landTimer: 0,
            trailParticles: [],
            dustParticles: []
          };
          this._volcanicEruptionBombs.push(bomb);
          this._volcanicEruptionBombSpawnCounter--;
        }

        // ---- Update Volcanic Bombs ----
        const screenH = this.canvas ? this.canvas.height : 800;
        for (let bi = this._volcanicEruptionBombs.length - 1; bi >= 0; bi--) {
          const bomb = this._volcanicEruptionBombs[bi];
          if (!bomb.hasLanded) {
            bomb.x += bomb.vx * dt;
            bomb.y += bomb.vy * dt;
            bomb.vy += 0.00005 * dt; // gravity
            bomb.alpha = Math.min(1, bomb.alpha + 0.02 * dt);
            bomb.glow = Math.min(12, bomb.glow + 0.1 * dt);

            // Check if bomb hit track level (y > 0.65)
            if (bomb.y > 0.60 + Math.random() * 0.05) {
              bomb.hasLanded = true;
              bomb.landTimer = 30;

              // Create dust cloud effect
              for (let di = 0; di < 12; di++) {
                const a = Math.random() * Math.PI * 2;
                const spd = 1 + Math.random() * 2;
                this.particles.push({
                  type: 'dust',
                  x: bomb.x * screenW + (Math.random() - 0.5) * 20,
                  y: bomb.y * screenH + (Math.random() - 0.5) * 10,
                  vx: Math.cos(a) * spd,
                  vy: Math.sin(a) * spd - 1,
                  alpha: 0.5 + Math.random() * 0.3,
                  size: 5 + Math.random() * 8,
                  color: '#665544',
                  life: 20 + Math.floor(Math.random() * 15)
                });
              }

              // Create small lava splash
              for (let si = 0; si < 6; si++) {
                const a = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI;
                const spd = 1 + Math.random() * 3;
                this.particles.push({
                  type: 'sparkle',
                  x: bomb.x * screenW + (Math.random() - 0.5) * 10,
                  y: bomb.y * screenH,
                  vx: Math.cos(a) * spd,
                  vy: Math.sin(a) * spd,
                  alpha: 0.8,
                  size: 2 + Math.random() * 3,
                  life: 12 + Math.floor(Math.random() * 8),
                  color: ['#ff3300', '#ff6600', '#ff9900'][Math.floor(Math.random() * 3)]
                });
              }

              // Bounce nearby balls using existing physics
              this.balls.forEach(ball => {
                if (ball.finished || ball.eliminated) return;
                const bombX = bomb.x * screenW;
                const bombY = bomb.y * screenH;
                const dx = ball.x - bombX;
                const dy = ball.y - bombY;
                const dist = Math.hypot(dx, dy);
                if (dist < 120) {
                  const force = 3 * (1 - dist / 120);
                  const nx = dx / (dist || 1);
                  const ny = dy / (dist || 1);
                  ball.vx += nx * force;
                  ball.vy += ny * force;
                  ball._hitMeteorThisFrame = true;
                }
              });
            }
          } else {
            bomb.landTimer -= dt;
            bomb.alpha *= 0.97;
            bomb.glow *= 0.95;
            if (bomb.landTimer <= 0 || bomb.alpha < 0.01) {
              this._volcanicEruptionBombs.splice(bi, 1);
            }
          }
        }

        // ---- Boost Lava Geyser frequency ----
        if (this.currentThemeKey === 'volcano' && this.track) {
          this.track.obstacles.forEach(obs => {
            if (obs.type !== 'lava_geyser') return;
            if (obs._state === 'hidden') {
              // Reduce cycle duration by 30%
              obs._cycleDuration = Math.max(60, (obs._hiddenDuration || 180) * 0.7);
            }
          });
        }

        // Screen flash decay
        if (this._volcanicEruptionScreenFlash > 0) {
          this._volcanicEruptionScreenFlash *= 0.92;
          if (this._volcanicEruptionScreenFlash < 0.01) this._volcanicEruptionScreenFlash = 0;
        }

      } else {
        // Phase 3: Ending (1 second smooth fade-out)
        this._volcanicEruptionPhase = 'ending';
        const endingProgress = timeLeft / 60; // 1 -> 0
        this._volcanicEruptionFadeProgress = endingProgress;
        this._volcanicEruptionSkyDarkness = 0.18 * endingProgress;
        this._volcanicEruptionGlowIntensity = 0.3 * endingProgress;

        // Fade out particles
        for (const p of this._volcanicEruptionFountainParticles) {
          p.alpha *= 0.98;
          p.vy *= 0.98;
        }
        for (const p of this._volcanicEruptionSmokeParticles) {
          p.alpha *= 0.97;
        }
        for (const p of this._volcanicEruptionEmberParticles) {
          p.alpha *= 0.97;
          p.vy *= 0.97;
        }
        for (const p of this._volcanicEruptionAshParticles) {
          p.alpha *= 0.96;
        }

        // Screen flash decay
        if (this._volcanicEruptionScreenFlash > 0) {
          this._volcanicEruptionScreenFlash *= 0.95;
          if (this._volcanicEruptionScreenFlash < 0.01) this._volcanicEruptionScreenFlash = 0;
        }

        // Stop spawning new particles
      }

      // ---- Common Updates ----
      // Update ember particles
      for (const p of this._volcanicEruptionEmberParticles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 0.002;
        p.alpha = Math.max(0, p.alpha - dt * 0.001);
      }
      this._volcanicEruptionEmberParticles = this._volcanicEruptionEmberParticles.filter(p => p.life > 0 && p.alpha > 0.01 && p.y > 0);

      // Update fountain particles
      for (const p of this._volcanicEruptionFountainParticles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.life -= dt * 0.003;
        p.alpha = Math.max(0, p.life * 0.8);
        p.size *= 0.998;
      }
      this._volcanicEruptionFountainParticles = this._volcanicEruptionFountainParticles.filter(p => p.life > 0 && p.size > 0.5);

      // Update smoke particles
      for (const p of this._volcanicEruptionSmokeParticles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 0.002;
        p.alpha = Math.max(0, p.life * 0.25);
        p.size += 0.05 * dt;
      }
      this._volcanicEruptionSmokeParticles = this._volcanicEruptionSmokeParticles.filter(p => p.life > 0 && p.alpha > 0.01);

      // Update ash particles
      for (const p of this._volcanicEruptionAshParticles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 0.001;
        p.alpha = Math.max(0, p.life * 0.12);
        p.size += 0.02 * dt;
      }
      this._volcanicEruptionAshParticles = this._volcanicEruptionAshParticles.filter(p => p.life > 0 && p.alpha > 0.005);

    } else if (this.activeEvent.key === 'aurora_borealis') {
      // ---- Aurora fade phase management ----
      const fadeFrames = 120;
      if (this.eventTimer > 480) {
        this._auroraFadePhase = 'fade_in';
        this._auroraFadeProgress = Math.min(1, (this.eventTimer - 480) / fadeFrames);
      } else if (this.eventTimer > fadeFrames) {
        this._auroraFadePhase = 'active';
        this._auroraFadeProgress = 1.0;
      } else {
        this._auroraFadePhase = 'fade_out';
        this._auroraFadeProgress = Math.max(0, this.eventTimer / fadeFrames);
      }

      // Scene brightness: darken 23% at full effect
      this._auroraSceneBrightness = 1.0 - this._auroraFadeProgress * 0.23;

      // Gentle light pulse (10% brightness change every 3-5s)
      this._auroraPulseTimer -= dt;
      if (this._auroraPulseTimer <= 0) {
        this._auroraPulseTimer = 180 + Math.random() * 120;
      }
      const pulsePhase = this._auroraPulseTimer;
      this._auroraPulseValue = pulsePhase < 60
        ? (60 - pulsePhase) / 60 * 0.10
        : pulsePhase > 120
          ? 0
          : (120 - pulsePhase) / 60 * 0.10;

      // Update dominant aurora color (cycles through palette for reflections)
      const aurTime = Date.now() * 0.0003;
      const pal = [
        { r: 75, g: 235, b: 140 }, { r: 60, g: 220, b: 205 },
        { r: 85, g: 185, b: 255 }, { r: 155, g: 130, b: 250 },
        { r: 220, g: 125, b: 210 }
      ];
      const t = (aurTime * 0.5 + 0.5) % 1;
      const idx1 = Math.floor(t * (pal.length - 1));
      const idx2 = Math.min(idx1 + 1, pal.length - 1);
      const lt = (t * (pal.length - 1)) - idx1;
      const pc = pal[idx1], nc = pal[idx2];
      this._auroraDominantColor = {
        r: pc.r + (nc.r - pc.r) * lt,
        g: pc.g + (nc.g - pc.g) * lt,
        b: pc.b + (nc.b - pc.b) * lt
      };

      // Update arctic wind particles
      const arcticTime = Date.now() * 0.001;
      for (const p of this._auroraArcticParticles) {
        p.x += p.speedX * dt * 0.01;
        p.y += p.speedY * dt * 0.01 + Math.sin(arcticTime + p.phase) * 0.00012 * dt;
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;
        if (p.y < -0.05) p.y = 1.05;
        if (p.y > 1.05) p.y = -0.05;
      }

      // Update background fog layers
      for (const fog of this._auroraBackgroundFog) {
        fog.x += fog.speedX * dt * 0.008;
        if (fog.x < -0.2) fog.x = 1.2;
        if (fog.x > 1.2) fog.x = -0.2;
      }

      // Snow gust management
      if (this._auroraFadeProgress > 0) {
        this._auroraGustTimer -= dt;
        if (this._auroraGustTimer <= 0) {
          const gustY = 0.2 + Math.random() * 0.5;
          const gustParticles = [];
          const pCount = 12 + Math.floor(Math.random() * 10);
          for (let i = 0; i < pCount; i++) {
            gustParticles.push({
              ox: (Math.random() - 0.5) * 0.3,
              oy: (Math.random() - 0.5) * 0.12,
              size: 0.5 + Math.random() * 1.5,
              alpha: 0.1 + Math.random() * 0.2,
              phase: Math.random() * Math.PI * 2,
              auroraGlow: Math.random() > 0.5 ? 0.2 + Math.random() * 0.5 : 0
            });
          }
          this._auroraSnowGusts.push({
            x: 1.15,
            y: gustY,
            speed: -0.5 - Math.random() * 0.3,
            life: 80 + Math.random() * 40,
            maxLife: 120,
            particles: gustParticles
          });
          this._auroraGustTimer = 180 + Math.random() * 180;
        }
      }
      // Update existing gusts
      for (let gi = this._auroraSnowGusts.length - 1; gi >= 0; gi--) {
        const gust = this._auroraSnowGusts[gi];
        gust.life -= dt;
        gust.x += gust.speed * dt * 0.01;
        if (gust.life <= 0 || gust.x < -0.2) {
          this._auroraSnowGusts.splice(gi, 1);
        }
      }
    } else if (this.activeEvent.key === 'lava_shower') {
      // Sky dimming at 10%
      this._lavaShowerSkyDim = Math.min(0.10, this._lavaShowerSkyDim + 0.005 * dt);

      // Spawn lava chunks
      if (this.state === 'racing' && Math.random() < 0.12 * dt) {
        this._spawnLavaChunk();
      }

      // Update existing lava chunks
      if (this._lavaChunks) {
        for (let ci = this._lavaChunks.length - 1; ci >= 0; ci--) {
          const chunk = this._lavaChunks[ci];
          chunk.vy += 0.12 * dt;
          chunk.x += chunk.vx * dt;
          chunk.y += chunk.vy * dt;
          chunk.life -= dt;

          // Ember trail particles
          if (Math.random() < 0.35 * dt) {
            this.particles.push({
              type: 'sparkle',
              x: chunk.x + (Math.random() - 0.5) * chunk.radius * 0.6,
              y: chunk.y + (Math.random() - 0.5) * chunk.radius * 0.6,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -0.5 - Math.random() * 1,
              alpha: 0.6,
              size: 1.5 + Math.random() * 2,
              life: 8 + Math.floor(Math.random() * 8),
              color: ['#ff4400', '#ff6600', '#ff8800', '#ffaa00'][Math.floor(Math.random() * 4)]
            });
          }

          // Chunks pass through everything ??? only removed when off-screen or expired
          if (chunk.life <= 0 || chunk.y > this.canvas.height / this.cameraZoom + 200) {
            // Recycle chunk
            this._lavaChunks.splice(ci, 1);
          }
        }
      }

      // Increase ambient ember particles
      if (Math.random() < 0.08 * dt && this.particles.length < 300) {
        this.particles.push({
          type: 'sparkle',
          x: Math.random() * this.canvas.width / this.cameraZoom + (this.cameraX || 0),
          y: (Math.random() - 0.5) * 200,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.3 - Math.random() * 0.5,
          alpha: 0.15 + Math.random() * 0.15,
          size: 1 + Math.random() * 2,
          life: 30 + Math.floor(Math.random() * 20),
          color: '#ff6600'
        });
      }

      // Ash streaks
      if (Math.random() < 0.04 * dt) {
        this.particles.push({
          type: 'dust',
          x: (Math.random() * 1.2 - 0.1) * this.canvas.width / this.cameraZoom + (this.cameraX || 0),
          y: -10,
          vx: (Math.random() - 0.5) * 0.3,
          vy: 1 + Math.random() * 2,
          alpha: 0.08 + Math.random() * 0.08,
          size: 2 + Math.random() * 3,
          life: 40 + Math.floor(Math.random() * 20),
          color: '#333333'
        });
      }
    }
  }

  // Spawn a molten lava chunk for Lava Shower event
  _spawnLavaChunk() {
    const leadBall = [...this.balls].filter(b => !b.finished).sort((a, b) => b.x - a.x)[0];
    if (!leadBall) return;

    const screenW = this.canvas.width;
    const camX = this.cameraX || 0;
    const spawnX = camX + Math.random() * (screenW / this.cameraZoom);
    const spawnY = -30 - Math.random() * 60;
    const radius = 22 + Math.random() * 10;

    if (!this._lavaChunks) this._lavaChunks = [];
    this._lavaChunks.push({
      x: spawnX,
      y: spawnY,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 3 + Math.random() * 4,
      radius: radius,
      type: 'lava_chunk',
      life: 120 + Math.floor(Math.random() * 60),
      _landed: false,
      _seed: Math.random() * 1000,
      _collidedBalls: new Set()
    });
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
        color: ['#e74c3c','#3498db','#ffd700','#2ecc71','#9b59b6','#f39c12'][idx % 6],
        primaryColorRGB: ['200,60,60','50,120,220','220,180,50','46,204,113','155,89,182','243,156,18'][idx % 6],
        x: 50 + idx * 4,
        y: 300 + (idx % 2 === 0 ? -15 : 15),
        vx: 0,
        vy: 0,
        vz: 0,
        z: 0,
        radius: 15,
        mass: 0.8 + Math.random() * 0.4,
        restitution: 0.3,
        _capturedByVine: null,
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

        // Event scheduling ??? uses config computed once in startRace()
        const evtCfg = this._eventIntensityCfg || { base: 20, variation: 3, maxEvents: 18 };
        if (this.maxEvents > 0 && this.activeEvent === null && this.raceTimer > 10 && this.raceTimer >= this._nextEventRaceTime) {
          this.triggerRandomEvent();
          // Next event: base interval ?? random variation
          const offset = (Math.random() - 0.5) * 2 * evtCfg.variation;
          this._nextEventRaceTime += evtCfg.base + offset;
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

      // Winner flash ??? champion overlay transition
      if (this._winnerFlashActive && this._winnerFlashBall) {
        if (performance.now() - this._winnerFlashStart >= 2000) {
          this._championOverlayShown = true;
          this._championWinner = this._winnerFlashBall;
          this._winnerFlagReady = false;
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => { this._winnerFlagReady = true; };
          img.src = `https://flagcdn.com/h240/${this._winnerFlashBall.code}.png`;
          this._championFlagImg = img;
          this._winnerFlashActive = false;
          this._winnerFlashBall = null;
          this._winnerFlashStart = 0;
        }
      }
    }

    // Render Frame
    this.render();

    this._rafId = requestAnimationFrame((t) => this.tick(t));
  }

  updateSimulation(dt) {
    if (this.state === 'racing') {
      // Step physics
      this.physics.update(this.balls, this.track, dt);

      // Reset forward force parameter if gravity flip event ended
      if (!this.activeEvent || this.activeEvent.key !== 'gravity_flip') {
        this.physics.forwardForce = this.currentTheme.forwardForce * 0.65;
      }

      // Meteor/football collision particles
      this.balls.forEach(b => {
        if (b._hitMeteorThisFrame && !b.finished) {
          const isFootballHit = this._footballShowerActive;
          const count = isFootballHit ? 12 + Math.floor(Math.random() * 8) : 4 + Math.floor(Math.random() * 4);
          for (let p = 0; p < count; p++) {
            const a = Math.random() * Math.PI * 2;
            const spd = isFootballHit ? 2 + Math.random() * 4 : 1 + Math.random() * 2;
            this.particles.push({
              type: 'sparkle',
              x: b.x + (Math.random() - 0.5) * 10,
              y: b.y + (Math.random() - 0.5) * 10,
              vx: Math.cos(a) * spd,
              vy: Math.sin(a) * spd,
              alpha: 1,
              size: isFootballHit ? 3 + Math.random() * 4 : 1 + Math.random() * 2,
              life: isFootballHit ? 20 + Math.floor(Math.random() * 15) : 10 + Math.floor(Math.random() * 10),
              color: isFootballHit ? '#ffffff' : '#ff8800'
            });
          }
          if (isFootballHit) {
            for (let p = 0; p < 3; p++) {
              this.particles.push({
                type: 'sparkle',
                x: b.x + (Math.random() - 0.5) * 6,
                y: b.y + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                alpha: 0.8,
                size: 2 + Math.random() * 3,
                life: 8 + Math.floor(Math.random() * 6),
                color: '#ffdd00'
              });
            }
          }
        }
      });

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

      // Freeze effect management: clamp velocity every frame, decrement timer, thaw when expired
      if (this.balls) {
        for (const ball of this.balls) {
          if (ball.finished || !ball._frozen) continue;
          ball.vx = ball._origVx * ball._frozenSpeedMult;
          ball.vy = ball._origVy * ball._frozenSpeedMult;
          ball._frozenTimer -= dt;
          if (ball._frozenTimer <= 0) {
            ball._frozen = false;
            ball._frozenTimer = 0;
            ball.vx = ball._origVx || ball.vx;
            ball.vy = ball._origVy || ball.vy;
            for (let p = 0; p < 8; p++) {
              const a = Math.random() * Math.PI * 2;
              this.particles.push({
                type: 'sparkle',
                x: ball.x + (Math.random() - 0.5) * 12,
                y: ball.y + (Math.random() - 0.5) * 12,
                vx: Math.cos(a) * (1 + Math.random() * 2),
                vy: Math.sin(a) * (1 + Math.random() * 2),
                alpha: 0.8,
                size: 2 + Math.random() * 3,
                life: 15 + Math.floor(Math.random() * 10),
                color: '#a0d8ef'
              });
            }
          }
        }
      }

      // Ice Ramp freeze management (Glacier Summit slow zones ??? speed cap on exit)
      if (this.balls) {
        for (const ball of this.balls) {
          if (ball.finished) continue;

          // Sound effects
          if (ball._enteredSlowThisFrame && this.currentThemeKey === 'snow') {
            this.sounds.playIceWhoosh();
          }
          if (ball._exitedSlowThisFrame && this.currentThemeKey === 'snow') {
            this.sounds.playIceCrack();
          }
          
          // Mud Puddle entry/exit effects (Amazon Canopy)
          if (ball._enteredMudPuddleThisFrame && this.currentThemeKey === 'jungle') {
            // Small mud splash particles
            if (this.particles) {
              for (let p = 0; p < 5; p++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2;
                this.particles.push({
                  type: 'sparkle',
                  x: ball.x,
                  y: ball.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  alpha: 0.7,
                  size: 2 + Math.random() * 3,
                  life: 15 + Math.floor(Math.random() * 10),
                  color: '#3A2618'
                });
              }
            }
          }
          if (ball._exitedSlowThisFrame && this.currentThemeKey === 'jungle' && ball._wasInMudPuddle) {
            // Smooth acceleration back to normal - handled in physics
            // Scatter some mud/dirt particles
            if (this.particles) {
              for (let p = 0; p < 4; p++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.5 + Math.random() * 1.5;
                this.particles.push({
                  type: 'sparkle',
                  x: ball.x,
                  y: ball.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  alpha: 0.5,
                  size: 1.5 + Math.random() * 2,
                  life: 10 + Math.floor(Math.random() * 8),
                  color: '#2D1E14'
                });
              }
            }
          }

          // Apply new freeze on exit from slow zone (ice ramp)
          if (ball._exitedSlowThisFrame && this.currentThemeKey === 'snow') {
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball._iceRampExitSpeed = speed;
            ball._iceRampFrozen = true;
            ball._iceRampFreezeTimer = 210; // 210 dt ??? 3.5s at 60fps
          }

          // Speed cap while frozen
          if (ball._iceRampFrozen) {
            ball._iceRampFreezeTimer -= dt;

            let speedCapRatio;
            if (ball._iceRampFreezeTimer > 90) {
              // Phase 1: full freeze at 50% for first ~2s
              speedCapRatio = 0.5;
            } else if (ball._iceRampFreezeTimer > 0) {
              // Phase 2: gradual recovery from 0.5???1.0 over ~1.5s
              const recoveryProgress = 1 - (ball._iceRampFreezeTimer / 90);
              speedCapRatio = 0.5 + recoveryProgress * 0.5;
            } else {
              speedCapRatio = 1.0;
              ball._iceRampFrozen = false;
              // Thaw particles
              for (let p = 0; p < 6; p++) {
                const a = Math.random() * Math.PI * 2;
                this.particles.push({
                  type: 'sparkle',
                  x: ball.x + (Math.random() - 0.5) * 12,
                  y: ball.y + (Math.random() - 0.5) * 12,
                  vx: Math.cos(a) * (1 + Math.random() * 2),
                  vy: Math.sin(a) * (1 + Math.random() * 2),
                  alpha: 0.7,
                  size: 2 + Math.random() * 2,
                  life: 12 + Math.floor(Math.random() * 8),
                  color: '#b0e0ff'
                });
              }
            }

            if (ball._iceRampFrozen) {
              const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
              if (currentSpeed > 0) {
                const cappedSpeed = ball._iceRampExitSpeed * speedCapRatio;
                if (currentSpeed > cappedSpeed) {
                  const ratio = cappedSpeed / currentSpeed;
                  ball.vx *= ratio;
                  ball.vy *= ratio;
                }
              }
            }
          }
        }
      }

      // Lava Pool burn effect (Magma Crater exclusive ??? applies on exit from lava pool)
      if (this.currentThemeKey === 'volcano' && this.balls) {
        for (const ball of this.balls) {
          if (ball.finished || ball.eliminated) continue;

          // Apply burn effect on exit from lava pool
          if (ball._exitedSlowThisFrame && ball._wasInLavaPool) {
            // Prevent stacking: ignore if already burned (by lava pool or geyser)
            if (!ball._lavaBurnActive && !ball._geyserBurnActive && !ball._showerBurnActive) {
              ball._lavaBurnActive = true;
              ball._lavaBurnTimer = 120; // 2 seconds at 60fps
              ball._lavaBurnExitSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            }
            ball._wasInLavaPool = false; // reset flag
          }

          // Burn effect: speed cap at 0.5x with smooth gradual recovery
          if (ball._lavaBurnActive) {
            ball._lavaBurnTimer -= dt;

            let speedCapRatio;
            if (ball._lavaBurnTimer > 90) {
              // Phase 1: full burn at 50% for first ~0.5s
              speedCapRatio = 0.5;
            } else if (ball._lavaBurnTimer > 0) {
              // Phase 2: smooth recovery from 0.5???1.0 over ~1.5s (ease-out)
              const progress = 1 - (ball._lavaBurnTimer / 90);
              const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
              speedCapRatio = 0.5 + eased * 0.5;
            } else {
              speedCapRatio = 1.0;
              ball._lavaBurnActive = false;
              // Recovery particles
              for (let p = 0; p < 12; p++) {
                const a = Math.random() * Math.PI * 2;
                this.particles.push({
                  type: 'sparkle',
                  x: ball.x + (Math.random() - 0.5) * 12,
                  y: ball.y + (Math.random() - 0.5) * 12,
                  vx: Math.cos(a) * (1.5 + Math.random() * 3),
                  vy: Math.sin(a) * (1.5 + Math.random() * 3),
                  alpha: 0.9,
                  size: 2 + Math.random() * 3,
                  life: 20 + Math.floor(Math.random() * 15),
                  color: '#ffaa00'
                });
              }
            }

            if (ball._lavaBurnActive) {
              const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
              if (currentSpeed > 0) {
                const cappedSpeed = ball._lavaBurnExitSpeed * speedCapRatio;
                if (currentSpeed > cappedSpeed) {
                  const ratio = cappedSpeed / currentSpeed;
                  ball.vx *= ratio;
                  ball.vy *= ratio;
                }
              }
            }
          }
        }
      }

      // Lava Geyser burn effect (Magma Crater exclusive)
      if (this.currentThemeKey === 'volcano' && this.balls) {
        for (const ball of this.balls) {
          if (ball.finished || ball.eliminated) continue;

          // Burn effect applied by physics collision
          if (ball._geyserBurnActive) {
            ball._geyserBurnTimer -= dt;

            let speedCapRatio;
            if (ball._geyserBurnTimer > 90) {
              // Phase 1: full burn at 50% for first ~0.5s
              speedCapRatio = 0.5;
            } else if (ball._geyserBurnTimer > 0) {
              // Phase 2: smooth recovery from 0.5???1.0 over ~1.5s (ease-out)
              const progress = 1 - (ball._geyserBurnTimer / 90);
              const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
              speedCapRatio = 0.5 + eased * 0.5;
            } else {
              speedCapRatio = 1.0;
              ball._geyserBurnActive = false;
              // Recovery particles
              for (let p = 0; p < 12; p++) {
                const a = Math.random() * Math.PI * 2;
                this.particles.push({
                  type: 'sparkle',
                  x: ball.x + (Math.random() - 0.5) * 12,
                  y: ball.y + (Math.random() - 0.5) * 12,
                  vx: Math.cos(a) * (1.5 + Math.random() * 3),
                  vy: Math.sin(a) * (1.5 + Math.random() * 3),
                  alpha: 0.9,
                  size: 2 + Math.random() * 3,
                  life: 20 + Math.floor(Math.random() * 15),
                  color: '#ffaa00'
                });
              }
            }

            if (ball._geyserBurnActive) {
              const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
              if (currentSpeed > 0) {
                const cappedSpeed = ball._geyserBurnExitSpeed * speedCapRatio;
                if (currentSpeed > cappedSpeed) {
                  const ratio = cappedSpeed / currentSpeed;
                  ball.vx *= ratio;
                  ball.vy *= ratio;
                }
              }
            }
          }
        }
      }

      // Blizzard speed cap: enforce 20% of original speed every frame
      if (this._blizzardActive && this.balls) {
        for (const ball of this.balls) {
          if (ball.finished || ball.eliminated || ball._blizzardCapSpeed === undefined) continue;
          const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          if (currentSpeed > 0 && currentSpeed > ball._blizzardCapSpeed) {
            const ratio = ball._blizzardCapSpeed / currentSpeed;
            ball.vx *= ratio;
            ball.vy *= ratio;
          }
        }
      }

      // Lava Shower burn effect (Magma Crater exclusive event)
      if (this._lavaShowerActive && this.balls) {
        for (const ball of this.balls) {
          if (ball.finished || ball.eliminated) continue;

          if (ball._showerBurnActive) {
            ball._showerBurnTimer -= dt;

            let speedCapRatio;
            if (ball._showerBurnTimer > 120) {
              // Phase 1: full burn at 40% for first ~2s
              speedCapRatio = 0.4;
            } else if (ball._showerBurnTimer > 0) {
              // Phase 2: smooth recovery from 0.4???1.0 over ~1s (ease-out)
              const progress = 1 - (ball._showerBurnTimer / 120);
              const eased = 1 - Math.pow(1 - progress, 3);
              speedCapRatio = 0.4 + eased * 0.6;
            } else {
              speedCapRatio = 1.0;
              ball._showerBurnActive = false;
              // Recovery particles
              for (let p = 0; p < 10; p++) {
                const a = Math.random() * Math.PI * 2;
                this.particles.push({
                  type: 'sparkle',
                  x: ball.x + (Math.random() - 0.5) * 12,
                  y: ball.y + (Math.random() - 0.5) * 12,
                  vx: Math.cos(a) * (1 + Math.random() * 2),
                  vy: Math.sin(a) * (1 + Math.random() * 2),
                  alpha: 0.8,
                  size: 2 + Math.random() * 3,
                  life: 15 + Math.floor(Math.random() * 10),
                  color: '#ff8800'
                });
              }
            }

            if (ball._showerBurnActive) {
              const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
              if (currentSpeed > 0) {
                const cappedSpeed = ball._showerBurnExitSpeed * speedCapRatio;
                if (currentSpeed > cappedSpeed) {
                  const ratio = cappedSpeed / currentSpeed;
                  ball.vx *= ratio;
                  ball.vy *= ratio;
                }
              }

              // Small flame particles while burning
              if (Math.random() < 0.1 * dt) {
                this.particles.push({
                  type: 'sparkle',
                  x: ball.x + (Math.random() - 0.5) * ball.radius * 1.2,
                  y: ball.y + (Math.random() - 0.5) * ball.radius * 1.2,
                  vx: (Math.random() - 0.5) * 0.5,
                  vy: -1 - Math.random() * 1.5,
                  alpha: 0.5 + Math.random() * 0.3,
                  size: 1.5 + Math.random() * 2,
                  life: 10 + Math.floor(Math.random() * 8),
                  color: '#ff6600'
                });
              }
            }
          }
        }
      }

      // Lava Shower chunk-ball collision
      if (this._lavaShowerActive && this._lavaChunks && this.balls) {
        for (const chunk of this._lavaChunks) {
          for (const ball of this.balls) {
            if (ball.finished || ball.eliminated || ball.z > 0) continue;
            const dx = ball.x - chunk.x;
            const dy = ball.y - chunk.y;
            const dist = Math.hypot(dx, dy);
            const minDist = ball.radius + chunk.radius;
            if (dist < minDist) {
              // Hit! Apply burn effect (prevent stacking with other burns)
              if (!ball._showerBurnActive && !ball._lavaBurnActive && !ball._geyserBurnActive) {
                ball._showerBurnActive = true;
                ball._showerBurnTimer = 180; // 3 seconds at 60fps
                ball._showerBurnExitSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
              }

              // Impact particles
              for (let i = 0; i < 10; i++) {
                const a = Math.random() * Math.PI * 2;
                const spd = 1.5 + Math.random() * 3;
                this.particles.push({
                  type: 'sparkle',
                  x: ball.x + (Math.random() - 0.5) * 8,
                  y: ball.y + (Math.random() - 0.5) * 8,
                  vx: Math.cos(a) * spd,
                  vy: Math.sin(a) * spd,
                  alpha: 0.8,
                  size: 2 + Math.random() * 3,
                  life: 15 + Math.floor(Math.random() * 10),
                  color: ['#ff4400', '#ff6600', '#ff8800'][Math.floor(Math.random() * 3)]
                });
              }

              // Small smoke puff on hit
              for (let i = 0; i < 3; i++) {
                this.particles.push({
                  type: 'dust',
                  x: ball.x + (Math.random() - 0.5) * 10,
                  y: ball.y + (Math.random() - 0.5) * 10,
                  vx: (Math.random() - 0.5) * 0.5,
                  vy: -0.3 - Math.random() * 0.5,
                  alpha: 0.25,
                  size: 4 + Math.random() * 4,
                  life: 15 + Math.floor(Math.random() * 10),
                  color: '#554433'
                });
              }

              // Destroy the chunk on impact (it splatters)
              chunk.life = 0;
              break;
            }
          }
        }
      }

      // Volcano eruption system (Magma Crater)
      if (this.currentThemeKey === 'volcano' && this.state === 'racing') {
        // Update eruption timer and trigger random eruptions
        this._volcanoNextEruptionTime -= dt;
        if (!this._volcanoEruptionActive && this._volcanoNextEruptionTime <= 0) {
          this._volcanoEruptionActive = true;
          this._volcanoEruptionTimer = 240; // 4 seconds at 60fps
          this._volcanoEruptionX = Math.random() * 0.8 + 0.1; // 10-90% across screen
          // Spawn eruption particles (lava burst, ash cloud, glowing rocks)
          this._volcanoEruptionParticles = [];
          const eruptionColors = ['#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ff5500', '#ff2200'];
          for (let i = 0; i < 60; i++) {
            const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.8;
            const speed = 1.5 + Math.random() * 4;
            this._volcanoEruptionParticles.push({
              x: this._volcanoEruptionX + (Math.random() - 0.5) * 0.04,
              y: 0.22 + Math.random() * 0.06,
              vx: Math.cos(angle) * speed * 0.005,
              vy: -Math.sin(angle) * speed * 0.004 - 0.003,
              size: 4 + Math.random() * 8,
              alpha: 0.7 + Math.random() * 0.3,
              color: eruptionColors[Math.floor(Math.random() * eruptionColors.length)],
              life: 1.0,
              gravity: 0.00015
            });
          }
          // Ash cloud particles (larger, more spread)
          for (let i = 0; i < 30; i++) {
            this._volcanoEruptionParticles.push({
              x: this._volcanoEruptionX + (Math.random() - 0.5) * 0.2,
              y: 0.18 + Math.random() * 0.12,
              vx: (Math.random() - 0.5) * 0.005,
              vy: -0.0008 - Math.random() * 0.002,
              size: 12 + Math.random() * 18,
              alpha: 0.20 + Math.random() * 0.15,
              color: ['#2a2018', '#3a3028', '#1e1814'][Math.floor(Math.random() * 3)],
              life: 1.0,
              gravity: 0
            });
          }
          this._volcanoNextEruptionTime = 800 + Math.random() * 1200; // 13-33 seconds
        }

        // Update active eruption
        if (this._volcanoEruptionActive) {
          this._volcanoEruptionTimer -= dt;
          for (const p of this._volcanoEruptionParticles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.life -= dt * 0.004;
            p.alpha = p.life * 0.8;
            p.size *= 0.998;
          }
          this._volcanoEruptionParticles = this._volcanoEruptionParticles.filter(p => p.life > 0 && p.size > 0.5);
          if (this._volcanoEruptionTimer <= 0 || this._volcanoEruptionParticles.length === 0) {
            this._volcanoEruptionActive = false;
            this._volcanoEruptionParticles = [];
          }
        }

        // Update ambient ash particles ??? 5 emitters across full viewport, rising from bottom
        const ashEmitters = [0.05, 0.25, 0.5, 0.75, 0.95];
        const ashColors = ['#3a3028', '#2a2218', '#4a3a30', '#1e1814', '#332a22'];
        for (const ax of ashEmitters) {
          if (Math.random() < 0.008 * dt) {
            this._volcanoAshParticles.push({
              x: ax + (Math.random() - 0.5) * 0.2,
              y: 0.90 + Math.random() * 0.10,
              vx: (Math.random() - 0.5) * 0.0006,
              vy: -0.0008 - Math.random() * 0.0012,
              size: 2 + Math.random() * 3,
              alpha: 0.10 + Math.random() * 0.10,
              color: ashColors[Math.floor(Math.random() * ashColors.length)],
              life: 1.0
            });
          }
        }
        for (const p of this._volcanoAshParticles) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt * 0.0006;
          p.alpha = p.life * 0.20;
        }
        this._volcanoAshParticles = this._volcanoAshParticles.filter(p => p.life > 0 && p.y > 0);

        // Update ambient ember particles ??? 5 emitters across full viewport, rising from bottom
        const emberEmitters = [0.05, 0.25, 0.5, 0.75, 0.95];
        const emberColors = ['#ff6600', '#ff8800', '#ffaa00', '#ff4400', '#ff7700'];
        for (const ex of emberEmitters) {
          if (Math.random() < 0.005 * dt) {
            this._volcanoEmberParticles.push({
              x: ex + (Math.random() - 0.5) * 0.2,
              y: 0.85 + Math.random() * 0.15,
              vx: (Math.random() - 0.5) * 0.0008,
              vy: -0.0015 - Math.random() * 0.004,
              size: 1.5 + Math.random() * 2,
              alpha: 0.20 + Math.random() * 0.15,
              color: emberColors[Math.floor(Math.random() * emberColors.length)],
              life: 1.0
            });
          }
        }
        for (const p of this._volcanoEmberParticles) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt * 0.0010;
          p.alpha = p.life * 0.30;
        }
        this._volcanoEmberParticles = this._volcanoEmberParticles.filter(p => p.life > 0 && p.y > 0);

        // Update smoke columns
        if (this._volcanoSmokeColumns.length < 4 && Math.random() < 0.003 * dt) {
          this._volcanoSmokeColumns.push({
            x: Math.random() * 0.8 + 0.1,
            y: 0.85,
            baseY: 0.85,
            height: 0.15 + Math.random() * 0.1,
            size: 150 + Math.random() * 100, // size in pixels for rendering
            alpha: 0.03 + Math.random() * 0.04,
            driftPhase: Math.random() * Math.PI * 2,
            driftSpeed: 0.0005 + Math.random() * 0.001
          });
        }
        for (const s of this._volcanoSmokeColumns) {
          s.y -= 0.00015 * dt;
          s.driftPhase += s.driftSpeed * dt;
          s.x += Math.sin(s.driftPhase) * 0.00008 * dt;
          if (s.y < 0.3) {
            s.y = s.baseY;
            s.x = Math.random() * 0.8 + 0.1;
            s.driftPhase = Math.random() * Math.PI * 2;
          }
        }
      }

      // Update random event continuous forces
      this.updateRandomEvents(dt);

      // Football shower spawning
      if (this._footballShowerActive && this.state === 'racing') {
        if (Math.random() < 0.18 * dt) {
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

          // Finish line celebration confetti
          for (let p = 0; p < 12; p++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 1 + Math.random() * 3;
            this.confetti.push({
              x: ball.x + (Math.random() - 0.5) * 30,
              y: ball.y + (Math.random() - 0.5) * 20,
              vx: Math.cos(a) * spd,
              vy: Math.sin(a) * spd - 2,
              color: ['#ffd700','#ff2a6d','#45f0f0','#2ecc71','#f5c842','#ff6b35'][Math.floor(Math.random() * 6)],
              alpha: 1,
              size: 4 + Math.random() * 4,
              angle: Math.random() * 360,
              life: 40 + Math.floor(Math.random() * 30)
            });
          }

          // Winner flash sequence (delayed champion overlay)
          if (!this._winnerFlashActive && !this._championOverlayShown) {
            this._winnerFlashActive = true;
            this._winnerFlashBall = ball;
            this._winnerFlashStart = performance.now();
            this.triggerConfettiExplosion(ball.x, ball.y);
            this.slowMoTimer = 60;
            this.selectedBallId = ball.id;
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

      // Commentary: detect leader changes (immediate DOM feed)
      if (this.leaderboard.length > 0) {
        const currentLeader = this.leaderboard[0];
        if (currentLeader && !currentLeader.finished) {
          if (this.commentary.lastLeaderCode && this.commentary.lastLeaderCode !== currentLeader.code) {
            this.commentary.add(currentLeader.name.toUpperCase() + ' takes the lead!', 'leader');
          }
          this.commentary.lastLeaderCode = currentLeader.code;
        }
      }

      // Sustained leader tracking for event banner (avoids queue buildup from rapid changes)
      {
        const now = performance.now();
        const leadLeader = this.leaderboard.length > 0 ? this.leaderboard[0] : null;
        if (leadLeader && !leadLeader.finished) {
          if (this._sustainedLeaderCode !== leadLeader.code) {
            this._sustainedLeaderCode = leadLeader.code;
            this._sustainedLeaderStartTime = now;
            this._sustainedLeaderBannerShown = false;
          } else if (!this._sustainedLeaderBannerShown) {
            if ((now - this._sustainedLeaderStartTime) >= 5000) {
              this.eventBanner.clear();
              this.eventBanner.show('\u{1F3C6} ' + leadLeader.name.toUpperCase() + ' LEADING!', 3500);
              this._sustainedLeaderBannerShown = true;
              this._sustainedLeaderLastBannerTime = now;
            }
          } else if ((now - this._sustainedLeaderLastBannerTime) >= 10000) {
            this.eventBanner.show('\u{1F3C6} ' + leadLeader.name.toUpperCase() + ' STILL LEADS!', 3500);
            this._sustainedLeaderLastBannerTime = now;
          }
        }
      }

      // Commentary: detect collisions and events
      this.balls.forEach(b => {
        if (b.finished || b.eliminated) return;
        if (b._hitSweepArmThisFrame && Math.random() < 0.15) {
          this.commentary.add(b.name + ' hit by sweep arm!', 'crash');
        }
        if (b._hitHammerThisFrame && Math.random() < 0.2) {
          this.commentary.add(b.name + ' smashed by hammer!', 'crash');
        }
        if (b._hitPunchFistThisFrame && Math.random() < 0.2) {
          this.commentary.add(b.name + ' punched!', 'crash');
        }
        if (b._hitGeyserThisFrame && Math.random() < 0.2) {
          this.commentary.add(b.name + ' erupted by lava geyser!', 'crash');
        }

        if (b._usedPortalThisFrame) {
          this.commentary.add(b.name + ' used a portal!', 'portal');
        }
        if (b._enteredBoostThisFrame && Math.random() < 0.3) {
          this.commentary.add(b.name + ' hit a boost!', 'boost');
        }
        if (b._hitMeteorThisFrame && Math.random() < 0.1) {
          this.commentary.add(b.name + ' struck by meteor!', 'crash');
        }
      });

      // Race Director observation
      this.raceDirector.observe(this.balls, this.leaderboard, this.raceTimer, this.track);

      // Update event systems
      this.eventBanner.update();
      this.raceDirector.update(dt);

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

    // Broadcast Director ??? observe and decide camera state
    this.broadcastDirector.observe(this.balls, this.leaderboard, this.raceTimer, this.track, this.gameMode, this.activeEvent);
    this.broadcastDirector.update(dt);

    // Story Engine ??? observe race data, produce narratives for the event feed
    this.storyEngine.observe(this.balls, this.leaderboard, this.raceTimer, this.track, this.gameMode);

    // Camera executes the Broadcast Director's shot with smooth movement
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

      // Dramatic elimination burst
      for (let p = 0; p < 25; p++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 5;
        this.particles.push({
          type: 'spark',
          x: target.x + (Math.random() - 0.5) * 10,
          y: target.y + (Math.random() - 0.5) * 10,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          color: Math.random() < 0.5 ? '#e74c3c' : '#ff6b35',
          alpha: 1,
          size: Math.random() * 4 + 2
        });
      }
      // Screen shake text
      this.particles.push({
        type: 'text',
        x: target.x,
        y: target.y - 20,
        text: 'ELIMINATED!',
        color: '#e74c3c',
        alpha: 1,
        size: 20
      });

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

      // Director Mode Remove button hit-test (screen-space)
      if (this.directorMode && this._directorRemoveButtons) {
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        for (const btn of this._directorRemoveButtons) {
          if (sx >= btn.x && sx <= btn.x + btn.w && sy >= btn.y && sy <= btn.y + btn.h) {
            this._removeCustomBall(btn.id);
            return;
          }
        }
      }

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
      // Director Mode takes full priority when active
      if (this.directorMode) {
        if (e.key === 'Escape') { this.directorMode = null; return; }
        if (e.key === 'Enter') { this._executeDirectorAction(); return; }
        if (e.key === 'ArrowUp') { this._directorSelectedIndex = Math.max(0, this._directorSelectedIndex - 1); return; }
        if (e.key === 'ArrowDown') { this._directorSelectedIndex = Math.min(this._directorSuggestions.length - 1, Math.max(0, this._directorSelectedIndex + 1)); return; }
        if (e.key === 'Backspace') { this._directorInput = this._directorInput.slice(0, -1); this._updateDirectorSuggestions(); return; }
        if (e.key.length === 1 && e.key.match(/[a-zA-Z -]/)) { this._directorInput += e.key; this._updateDirectorSuggestions(); return; }
        return;
      }

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
      // R key to open Director Mode (during racing)
      if (e.key === 'r' || e.key === 'R') {
        if (this.state === 'racing') {
          this.directorMode = true;
          this._directorInput = '';
          this._directorSuggestions = [];
          this._directorSelectedIndex = 0;
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

  // Smooth camera follow ??? leader-centered, lerp-based
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

    // Smooth camera follow ??? frame-rate independent lerp for buttery motion
    const lerpFactor = 1 - Math.pow(1 - 0.06, dt);
    this.cameraX += (targetX - this.cameraX) * lerpFactor;

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
        if (p.type === 'confetti' && p.life !== undefined) p.life -= dt;
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

    const count = this.currentTheme.particleType === 'star' || this.currentTheme.particleType === 'cosmic' ? 0.6 : 0.4;
    if (Math.random() < count * dt) {
      const pType = this.currentTheme.particleType;
      const col = this.currentTheme.particleColor;

      const spawnX = Math.random() * this.canvas.width;
      // Spawn at the top of track
      const spawnY = -20;

      if (pType === 'snow') {
        // Main snowfall ??? subtle, blue-tinted, smaller flakes
        if (Math.random() < 0.6) {
          const flakeSize = Math.random() * 3 + 0.5;
          this.particles.push({
            type: 'dust',
            x: spawnX,
            y: spawnY + Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.5 + 0.2,
            vy: 0.6 + Math.random() * 0.6 + (1 - flakeSize / 4) * 0.3,
            color: flakeSize > 2 ? 'rgba(180, 210, 230, 0.7)' : 'rgba(160, 200, 225, 0.5)',
            alpha: 0.3 + Math.random() * 0.3,
            size: flakeSize
          });
        }
        // Occasional ice crystal sparkles (8% chance)
        if (Math.random() < 0.08) {
          this.particles.push({
            type: 'sparkle',
            x: spawnX,
            y: spawnY + Math.random() * this.canvas.height * 0.5,
            vx: (Math.random() - 0.5) * 0.2,
            vy: 0.2 + Math.random() * 0.3,
            color: '#88cce8',
            alpha: 0.3 + Math.random() * 0.3,
            size: Math.random() * 1.5 + 0.3,
            life: 35 + Math.floor(Math.random() * 25)
          });
        }
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
      } else if (pType === 'ember' && this.currentThemeKey !== 'volcano') {
        // Volcano: embers rise from bottom lava grids
        // Skipped for Magma Crater ??? volcano-specific atmo overlay handles embers in the correct layer (behind track, obstacles, balls)
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
      } else if (pType === 'cosmic' || pType === 'star') {
        // Cosmic space dust ??? tiny, slow, ethereal
        this.particles.push({
          type: 'dust',
          x: spawnX,
          y: spawnY,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -0.1 - Math.random() * 0.15,
          color: ['#ffffff', '#a5d8ff', '#d8b4fe', '#99f6e4'][Math.floor(Math.random() * 4)],
          alpha: Math.random() * 0.25 + 0.1,
          size: Math.random() * 1.2 + 0.3
        });
      }
    }

    // Ambient floating dust / micro-particles for all themes
    if (Math.random() < 0.15 * dt) {
      this.particles.push({
        type: 'dust',
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        color: 'rgba(255,255,255,0.3)',
        alpha: 0.1 + Math.random() * 0.15,
        size: Math.random() * 1.5 + 0.5,
        life: 120 + Math.floor(Math.random() * 120)
      });
    }

    // Cold mist / drifting fog particles for snow theme (near ground, subtle)
    if (this.currentTheme && this.currentTheme.particleType === 'snow' && Math.random() < 0.04 * dt) {
      this.particles.push({
        type: 'dust',
        x: Math.random() * this.canvas.width,
        y: this.canvas.height * 0.7 + Math.random() * this.canvas.height * 0.25,
        vx: 0.1 + Math.random() * 0.3,
        vy: -0.03,
        color: 'rgba(100, 150, 190, 0.12)',
        alpha: 0.05 + Math.random() * 0.06,
        size: Math.random() * 5 + 2,
        life: 80 + Math.floor(Math.random() * 60)
      });
    }

    // Occasional wind gust (horizontal snow streaks) for snow theme
    if (this.currentTheme && this.currentTheme.particleType === 'snow' && Math.random() < 0.015 * dt) {
      const gustCount = 1 + Math.floor(Math.random() * 2);
      for (let g = 0; g < gustCount; g++) {
        this.particles.push({
          type: 'dust',
          x: Math.random() * this.canvas.width * 0.3,
          y: Math.random() * this.canvas.height * 0.6,
          vx: 2.5 + Math.random() * 3,
          vy: 0.1 + Math.random() * 0.2,
          color: 'rgba(140, 190, 220, 0.12)',
          alpha: 0.08 + Math.random() * 0.08,
          size: Math.random() * 1.5 + 0.3,
          life: 15 + Math.floor(Math.random() * 12)
        });
      }
    }

    // Extra sparkle crystals for snow theme (rare)
    if (this.currentTheme && this.currentTheme.particleType === 'snow' && Math.random() < 0.008 * dt) {
      this.particles.push({
        type: 'sparkle',
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 0.15,
        vy: 0.15 + Math.random() * 0.15,
        color: '#6ab8d8',
        alpha: 0.2 + Math.random() * 0.2,
        size: Math.random() * 1.2 + 0.2,
        life: 40 + Math.floor(Math.random() * 30)
      });
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
    try {
    // 0. Reset canvas transform to prevent corrupt state from carrying over
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

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
    // All volcano decorative effects (lava, smoke, embers, ash, eruption, heat shimmer)
    // are rendered inside renderDynamicBackground ??? nothing decorative above the track.
    // Wrapped in save/restore with try/finally to absorb any unbalanced ctx saves from
    // internal rendering errors ??? guarantees clean canvas state when background finishes.
    this.ctx.save();
    try {
      this.renderDynamicBackground(screenW, screenH);
    } finally {
      this.ctx.restore();
    }

    // Apply camera shake offset
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

    // Combine base zoom + user multiplier + dynamic zoom (from camera controller)
    const dynZoom = this._dynamicZoom || 1.0;
    const zoom = baseZoom * this.userZoomMultiplier * dynZoom;
    this.cameraZoom = zoom;
    this.trackOffset = trackOffset;

    // 2. Render track contents (Walls, Pegs, Boosts, Balls) inside scaled wrapper
    this.ctx.save();
    // Use try/finally to guarantee ctx.restore() even if rendering throws
    try {
    this.ctx.translate(trackOffset, 0);
    this.ctx.scale(zoom, zoom);

    const camX = this.cameraX;

    if (this.track) {
      // Draw Zones (boost pads, ice zones, finish checkered area)
      const renderTrackZones = () => {
      this.track.zones.forEach(zone => {
        // Draw offset relative to camera (scroll on X axis)
        const zX = zone.x - camX;
        const zoneCullBuffer = Math.max(400, 500 / this.userZoomMultiplier);
        if (zX + zone.width < -zoneCullBuffer || zX > screenW / zoom + zoneCullBuffer) return; // offscreen cull

        if (zone.type === 'boost') {
          // Boost zone ??? green fill, forward arrows
          this.ctx.save();
          this.ctx.fillStyle = 'rgba(46,204,113,0.25)';
          this.ctx.fillRect(zX, zone.y, zone.width, zone.height);
          const boostBorderAlpha = this.currentThemeKey === 'snow' ? 0.50 : 0.35;
          this.ctx.strokeStyle = `rgba(46,204,113,${boostBorderAlpha})`;
          this.ctx.lineWidth = 2.5;
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
          this.ctx.fillStyle = this.currentThemeKey === 'jungle' ? '#102A16' : '#2ecc71';
          this.ctx.strokeStyle = this.currentThemeKey === 'jungle' ? '#E5EBD9' : 'transparent';
          this.ctx.lineWidth = this.currentThemeKey === 'jungle' ? 3 : 0;
          this.ctx.font = this.currentThemeKey === 'jungle' ? 'bold 16px Montserrat, sans-serif' : 'bold 14px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          if (this.currentThemeKey === 'jungle') this.ctx.strokeText('BOOST', zX + zone.width / 2, zone.y + zone.height / 2);
          this.ctx.fillText('BOOST', zX + zone.width / 2, zone.y + zone.height / 2);
          this.ctx.restore();
        } else if (zone.type === 'mud_puddle || lava_pool') {
          // ===== MUD PUDDLE (Amazon Canopy only) =====
          if (this.currentThemeKey !== 'jungle') return;
          this.ctx.save();
          
          const time = Date.now() * 0.001;
          const baseAlpha = 0.7 + Math.sin(time * 2) * 0.1;
          
          // Generate organic blob shape for the puddle
          const centerX = zX + zone.width / 2;
          const centerY = zone.y + zone.height / 2;
          const baseRadiusX = zone.width / 2;
          const baseRadiusY = zone.height / 2;
          const numPoints = 12;
          const blobPoints = [];
          
          // Use deterministic noise based on zone position for consistent shape
          const seed = ((zone.x * 73856093) ^ (zone.y * 19349663)) & 0x7fffffff;
          let noiseState = seed;
          const noise = () => {
            noiseState = (noiseState * 1664525 + 1013904223) & 0xffffffff;
            return noiseState / 0xffffffff;
          };
          
          for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            // Add organic variation to radius - more dramatic for rough mud pit look
            const variation = 0.45 + noise() * 0.55;
            // Add pronounced asymmetry - real mud puddles are very irregular
            const asymX = 1.0 + (noise() - 0.5) * 0.35;
            const asymY = 1.0 + (noise() - 0.5) * 0.35;
            // Add random sharp indentations (erosion/cracks)
            const crack = noise() < 0.12 ? 0.3 + noise() * 0.25 : 1.0;
            const rx = baseRadiusX * variation * asymX * crack;
            const ry = baseRadiusY * variation * asymY * crack;
            blobPoints.push({
              x: centerX + Math.cos(angle) * rx,
              y: centerY + Math.sin(angle) * ry
            });
          }
          
          // Smooth the blob with curve interpolation
          this.ctx.beginPath();
          for (let i = 0; i < numPoints; i++) {
            const p1 = blobPoints[i];
            const p2 = blobPoints[(i + 1) % numPoints];
            const ctrlX = (p1.x + p2.x) / 2;
            const ctrlY = (p1.y + p2.y) / 2;
            if (i === 0) {
              this.ctx.moveTo(p1.x, p1.y);
            }
            this.ctx.quadraticCurveTo(p1.x, p1.y, ctrlX, ctrlY);
          }
          this.ctx.closePath();
          
          // Base mud puddle - dark brown water
          const mudGrad = this.ctx.createLinearGradient(
            centerX - baseRadiusX, centerY - baseRadiusY,
            centerX + baseRadiusX, centerY + baseRadiusY
          );
          mudGrad.addColorStop(0, `rgba(60, 40, 25, ${baseAlpha * 0.9})`);
          mudGrad.addColorStop(0.3, `rgba(45, 30, 18, ${baseAlpha})`);
          mudGrad.addColorStop(0.7, `rgba(55, 35, 22, ${baseAlpha * 0.95})`);
          mudGrad.addColorStop(1, `rgba(40, 28, 20, ${baseAlpha * 0.85})`);
          this.ctx.fillStyle = mudGrad;
          this.ctx.fill();
          
          // Glossy surface highlights (organic shapes)
          this.ctx.fillStyle = `rgba(90, 65, 45, ${0.2 + Math.sin(time * 3) * 0.1})`;
          for (let s = 0; s < 4; s++) {
            const angle = time * 0.8 + s * 1.5;
            const dist = (baseRadiusX * 0.3) * (0.5 + Math.sin(time * 1.2 + s) * 0.3);
            const sx = centerX + Math.cos(angle) * dist;
            const sy = centerY + Math.sin(angle) * dist * 0.7;
            const sw = baseRadiusX * 0.15 * (0.7 + Math.sin(time * 2 + s) * 0.3);
            const sh = baseRadiusY * 0.08 * (0.7 + Math.cos(time * 1.5 + s) * 0.3);
            const rot = angle + Math.sin(time + s) * 0.3;
            this.ctx.save();
            this.ctx.translate(sx, sy);
            this.ctx.rotate(rot);
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, sw, sh, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
          }
          
          // Wet muddy edges - organic stroke
          this.ctx.strokeStyle = `rgba(80, 55, 35, ${baseAlpha})`;
          this.ctx.lineWidth = 3;
          this.ctx.shadowColor = 'rgba(40, 25, 15, 0.5)';
          this.ctx.shadowBlur = 6;
          this.ctx.shadowOffsetY = 2;
          
          // Re-draw blob for stroke
          this.ctx.beginPath();
          for (let i = 0; i < numPoints; i++) {
            const p1 = blobPoints[i];
            const p2 = blobPoints[(i + 1) % numPoints];
            const ctrlX = (p1.x + p2.x) / 2;
            const ctrlY = (p1.y + p2.y) / 2;
            if (i === 0) {
              this.ctx.moveTo(p1.x, p1.y);
            }
            this.ctx.quadraticCurveTo(p1.x, p1.y, ctrlX, ctrlY);
          }
          this.ctx.closePath();
          this.ctx.stroke();
          
          this.ctx.shadowBlur = 0;
          this.ctx.shadowOffsetY = 0;
          
          // Small grass patches around edges
          this.ctx.fillStyle = '#1A3A1A';
          for (let g = 0; g < 6; g++) {
            const edgeAngle = (g / 6) * Math.PI * 2;
            const edgeDist = (baseRadiusX * 0.95) * (0.85 + noise() * 0.15);
            const gx = centerX + Math.cos(edgeAngle) * edgeDist + Math.sin(time + g) * 3;
            const gy = centerY + Math.sin(edgeAngle) * edgeDist * 0.8 + Math.cos(time * 0.7 + g) * 2;
            this.ctx.beginPath();
            this.ctx.arc(gx, gy, 3 + noise() * 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#245024';
            this.ctx.beginPath();
            this.ctx.arc(gx - 1, gy - 1, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#1A3A1A';
          }
          
          // Small ripples/bubbles
          this.ctx.strokeStyle = `rgba(100, 70, 50, ${0.15 + Math.sin(time * 4) * 0.08})`;
          this.ctx.lineWidth = 1;
          for (let r = 0; r < 3; r++) {
            const rippleAngle = time * 1.5 + r * 2.1;
            const rippleDist = baseRadiusX * 0.25 * (0.5 + Math.sin(time * 1.3 + r) * 0.4);
            const rx = centerX + Math.cos(rippleAngle) * rippleDist;
            const ry = centerY + Math.sin(rippleAngle) * rippleDist * 0.7;
            const rr = 4 + Math.sin(time * 3 + r) * 2;
            this.ctx.beginPath();
            this.ctx.arc(rx, ry, rr, 0, Math.PI * 2);
            this.ctx.stroke();
          }
          
          this.ctx.restore();
        } else if (zone.type === 'slow' || zone.type === 'sand') {
          if (zone.type === 'slow' && this.currentThemeKey === 'snow') {
            // Ice Ramp visual (Glacier Summit)
            this.ctx.save();
            const iceGrad = this.ctx.createLinearGradient(zX, zone.y, zX, zone.y + zone.height);
            iceGrad.addColorStop(0, 'rgba(160, 220, 255, 0.25)');
            iceGrad.addColorStop(0.5, 'rgba(200, 240, 255, 0.35)');
            iceGrad.addColorStop(1, 'rgba(120, 200, 240, 0.25)');
            this.ctx.fillStyle = iceGrad;
            this.ctx.fillRect(zX, zone.y, zone.width, zone.height);
            this.ctx.shadowColor = 'rgba(180, 230, 255, 0.6)';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = 'rgba(200, 240, 255, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(zX, zone.y, zone.width, zone.height);
            this.ctx.shadowBlur = 0;
            // Frost crack patterns
            const crackSeed = ((zone.x * 7 + zone.y * 13) % 100) / 100;
            this.ctx.strokeStyle = 'rgba(220, 245, 255, 0.4)';
            this.ctx.lineWidth = 1.5;
            for (let ci = 0; ci < 3; ci++) {
              const baseX = zX + zone.width * ((ci + 1) / 4 + crackSeed * 0.08);
              this.ctx.beginPath();
              this.ctx.moveTo(baseX + Math.sin(ci * 2) * 4, zone.y + 2);
              for (let j = 0; j < 4; j++) {
                const jx = baseX + Math.sin((ci + 1) * (j + 1) + crackSeed * 10) * 6;
                const jy = zone.y + 2 + (j + 1) * (zone.height - 4) / 4;
                this.ctx.lineTo(jx, jy);
              }
              this.ctx.stroke();
            }
            // Drifting snow particles inside zone
            const driftBase = (Date.now() * 0.02) % (zone.width + 20);
            this.ctx.fillStyle = 'rgba(220, 240, 255, 0.5)';
            for (let si = 0; si < 5; si++) {
              const sx = zX + ((driftBase + si * 18 + crackSeed * 10) % (zone.width + 10)) - 5;
              const sy = zone.y + 5 + (Math.sin(Date.now() * 0.003 + si * 2 + crackSeed * 6) * 0.5 + 0.5) * (zone.height - 10);
              this.ctx.beginPath();
              this.ctx.arc(sx, sy, 1.5 + Math.sin(Date.now() * 0.005 + si) * 0.5, 0, Math.PI * 2);
              this.ctx.fill();
            }
            // Label
            this.ctx.fillStyle = '#b0e0ff';
            this.ctx.font = 'bold 11px Montserrat, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('ICE', zX + zone.width / 2, zone.y + zone.height / 2);
            this.ctx.restore();
          } else {
            // Original slow/sand zone rendering (non-glacier or sand)
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(231,76,60,0.18)';
            this.ctx.fillRect(zX, zone.y, zone.width, zone.height);
            const slowBorderAlpha = this.currentThemeKey === 'snow' ? 0.50 : 0.35;
            this.ctx.strokeStyle = `rgba(192,57,43,${slowBorderAlpha})`;
            this.ctx.lineWidth = 2.5;
            this.ctx.strokeRect(zX, zone.y, zone.width, zone.height);
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
            this.ctx.fillStyle = this.currentThemeKey === 'jungle' ? '#102A16' : '#c0392b';
            this.ctx.strokeStyle = this.currentThemeKey === 'jungle' ? '#E5EBD9' : 'transparent';
            this.ctx.lineWidth = this.currentThemeKey === 'jungle' ? 3 : 0;
            this.ctx.font = this.currentThemeKey === 'jungle' ? 'bold 16px Montserrat, sans-serif' : 'bold 14px Montserrat, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            if (this.currentThemeKey === 'jungle') this.ctx.strokeText('SLOW', zX + zone.width / 2, zone.y + zone.height / 2);
            this.ctx.fillText('SLOW', zX + zone.width / 2, zone.y + zone.height / 2);
            this.ctx.restore();
          }
        } else if (zone.type === 'mud_puddle') {
          // ===== MUD PUDDLE (Amazon Canopy only) =====
          if (this.currentThemeKey !== 'jungle') return;
          this.ctx.save();
          
          const time = Date.now() * 0.001;
          
          // Dark brown muddy water base
          const mudGrad = this.ctx.createLinearGradient(zX, zone.y, zX, zone.y + zone.height);
          mudGrad.addColorStop(0, '#2D1B0E');
          mudGrad.addColorStop(0.3, '#1F150A');
          mudGrad.addColorStop(0.6, '#150D07');
          mudGrad.addColorStop(1, '#0D0804');
          this.ctx.fillStyle = mudGrad;
          this.ctx.fillRect(zX, zone.y, zone.width, zone.height);
          
          // Glossy surface reflection
          const glossAlpha = 0.15 + Math.sin(time * 3) * 0.05;
          const glossGrad = this.ctx.createLinearGradient(zX, zone.y, zX, zone.y + zone.height * 0.4);
          glossGrad.addColorStop(0, `rgba(80, 55, 30, ${glossAlpha})`);
          glossGrad.addColorStop(0.5, `rgba(60, 40, 20, ${glossAlpha * 0.5})`);
          glossGrad.addColorStop(1, 'rgba(40, 25, 15, 0)');
          this.ctx.fillStyle = glossGrad;
          this.ctx.fillRect(zX, zone.y, zone.width, zone.height * 0.4);
          
          // Wet muddy edges
          this.ctx.strokeStyle = '#3D2814';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(zX, zone.y, zone.width, zone.height);
          
          // Small grass patches around edges
          const grassSeed = ((zone.x * 11 + zone.y * 17) % 100) / 100;
          this.ctx.fillStyle = '#1A3A1A';
          for (let gp = 0; gp < 6; gp++) {
            const edgeX = zX + (gp % 3) * (zone.width / 2) + (Math.sin(gp * 2.1 + grassSeed * 10) * 8);
            const edgeY = zone.y + (gp < 3 ? 0 : zone.height) + Math.sin(gp * 1.7 + grassSeed * 8) * 3;
            const grassH = 6 + Math.sin(gp * 3.1 + grassSeed * 5) * 3;
            this.ctx.beginPath();
            this.ctx.moveTo(edgeX, edgeY);
            this.ctx.lineTo(edgeX - 3, edgeY - grassH);
            this.ctx.lineTo(edgeX + 3, edgeY - grassH);
            this.ctx.lineTo(edgeX + 6, edgeY);
            this.ctx.closePath();
            this.ctx.fill();
          }
          
          // Subtle ripples
          const rippleTime = time * 1.5;
          this.ctx.strokeStyle = 'rgba(60, 40, 20, 0.25)';
          this.ctx.lineWidth = 1;
          for (let r = 0; r < 3; r++) {
            const ry = zone.y + zone.height * (0.2 + r * 0.3) + Math.sin(rippleTime + r * 2) * 2;
            this.ctx.beginPath();
            for (let rx = zX; rx < zX + zone.width; rx += 5) {
              const ryOffset = Math.sin(rippleTime * 2 + rx * 0.1 + r * 1.5) * 1.5;
              if (rx === zX) this.ctx.moveTo(rx, ry + ryOffset);
              else this.ctx.lineTo(rx, ry + ryOffset);
            }
            this.ctx.stroke();
          }
          
          // Small bubbles
          const bubbleTime = time * 2;
          this.ctx.fillStyle = 'rgba(100, 70, 40, 0.35)';
          for (let b = 0; b < 4; b++) {
            const bx = zX + ((zone.x * 3 + b * 17 + bubbleTime * 5) % zone.width);
            const by = zone.y + zone.height * (0.2 + (b * 0.2 + Math.sin(bubbleTime + b * 1.5) * 0.1));
            const bSize = 1.5 + Math.sin(bubbleTime + b * 2) * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(bx, by, bSize, 0, Math.PI * 2);
            this.ctx.fill();
          }
          
          this.ctx.restore();
        } else if (zone.type === 'ice') {
          // Ice zone ??? label only
          const isJungle = this.currentThemeKey === 'jungle';
          this.ctx.fillStyle = isJungle ? '#102A16' : 'rgba(100,200,255,0.2)';
          this.ctx.strokeStyle = isJungle ? '#E5EBD9' : 'transparent';
          this.ctx.lineWidth = isJungle ? 2 : 0;
          this.ctx.font = isJungle ? 'bold 14px Montserrat, sans-serif' : 'bold 11px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          if (isJungle) this.ctx.strokeText('ICE', zX + zone.width / 2, zone.y + zone.height / 2);
          this.ctx.fillText('ICE', zX + zone.width / 2, zone.y + zone.height / 2);
        } else if (zone.type === 'oil') {
          // Oil zone ??? label only
          const isJungle = this.currentThemeKey === 'jungle';
          this.ctx.fillStyle = isJungle ? '#102A16' : 'rgba(100,80,60,0.2)';
          this.ctx.strokeStyle = isJungle ? '#E5EBD9' : 'transparent';
          this.ctx.lineWidth = isJungle ? 2 : 0;
          this.ctx.font = isJungle ? 'bold 14px Montserrat, sans-serif' : 'bold 11px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          if (isJungle) this.ctx.strokeText('OIL', zX + zone.width / 2, zone.y + zone.height / 2);
          this.ctx.fillText('OIL', zX + zone.width / 2, zone.y + zone.height / 2);
        } else if (zone.type === 'finish') {
          const finishX = zone.x - camX;
          const finishMidX = finishX + zone.width / 2;
          const bounds = this.physics.getWallBoundaries(zone.x, this.track);
          const fTop = bounds ? bounds.topY : 50;
          const fBot = bounds ? bounds.bottomY : 550;
          const fH = fBot - fTop;
          const time = Date.now() * 0.003;
          const isSnow = this.currentThemeKey === 'snow';
          const approachW = 150;

          // Approach zone ??? subtle gradient 150px before the finish line
          this.ctx.save();
          const approachGrad = this.ctx.createLinearGradient(finishX - approachW, 0, finishX, 0);
          if (isSnow) {
            approachGrad.addColorStop(0, 'rgba(180,220,250,0)');
            approachGrad.addColorStop(0.6, 'rgba(180,220,250,0.04)');
            approachGrad.addColorStop(1, 'rgba(180,220,250,0.10)');
          } else {
            approachGrad.addColorStop(0, 'rgba(255,215,0,0)');
            approachGrad.addColorStop(0.6, 'rgba(255,215,0,0.03)');
            approachGrad.addColorStop(1, 'rgba(255,215,0,0.08)');
          }
          this.ctx.fillStyle = approachGrad;
          this.ctx.fillRect(finishX - approachW, fTop, approachW, fH);
          this.ctx.restore();

          // "FINISH" painted on the track surface just before the checkered area
          this.ctx.save();
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillStyle = isSnow ? 'rgba(200, 230, 255, 0.18)' : 'rgba(255,255,255,0.12)';
          this.ctx.font = 'bold 72px Outfit, Montserrat, sans-serif';
          if (isSnow) {
            this.ctx.shadowColor = 'rgba(180, 220, 250, 0.3)';
            this.ctx.shadowBlur = 16;
          }
          this.ctx.fillText('FINISH', finishX - 60, fTop + fH / 2);
          this.ctx.shadowBlur = 0;
          this.ctx.restore();

          // White border behind checkered strip
          this.ctx.save();
          this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(finishX - 1, fTop - 1, zone.width + 2, fH + 2);
          this.ctx.restore();

          // Checkered strip (full track height, full zone width)
          const cs = 12;
          for (let by = fTop; by < fBot; by += cs) {
            for (let bx = 0; bx < zone.width; bx += cs) {
              const isWhite = ((bx / cs) + (Math.floor((by - fTop) / cs))) % 2 === 0;
              this.ctx.fillStyle = isWhite ? '#ffffff' : '#1a1a1a';
              this.ctx.fillRect(finishX + bx, by, cs, cs);
            }
          }

          // Glowing outline behind checkered strip
          this.ctx.save();
          this.ctx.shadowColor = isSnow ? '#8fcaf5' : '#ffd700';
          this.ctx.shadowBlur = 30;
          this.ctx.strokeStyle = isSnow ? 'rgba(180,220,250,0.35)' : 'rgba(255,215,0,0.3)';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(finishX - 2, fTop - 2, zone.width + 4, fH + 4);
          this.ctx.shadowBlur = 0;
          this.ctx.restore();

          // Ice shimmer overlay for snow, gold for others
          this.ctx.save();
          this.ctx.shadowColor = isSnow ? '#8fcaf5' : '#ffd700';
          this.ctx.shadowBlur = 40;
          const shimmerColor = isSnow
            ? `rgba(200,230,255,${0.15 + Math.sin(time) * 0.05})`
            : `rgba(255,215,0,${0.15 + Math.sin(time) * 0.05})`;
          this.ctx.fillStyle = shimmerColor;
          this.ctx.fillRect(finishX, fTop, zone.width, fH);
          this.ctx.shadowBlur = 0;
          this.ctx.restore();

          // Pole on left side
          this.ctx.save();
          const poleX = finishX - 6;
          this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
          this.ctx.shadowBlur = 8;
          const poleGrad = this.ctx.createLinearGradient(poleX, 0, poleX + 6, 0);
          if (isSnow) {
            poleGrad.addColorStop(0, '#6a8aaa');
            poleGrad.addColorStop(0.5, '#b0c8da');
            poleGrad.addColorStop(1, '#6a8aaa');
          } else {
            poleGrad.addColorStop(0, '#2c3e50');
            poleGrad.addColorStop(0.5, '#95a5a6');
            poleGrad.addColorStop(1, '#2c3e50');
          }
          this.ctx.fillStyle = poleGrad;
          this.ctx.fillRect(poleX, fTop - 20, 6, fH + 40);
          // Snow cap / top decoration
          this.ctx.fillStyle = isSnow ? '#e8f0f8' : '#ffd700';
          this.ctx.shadowColor = isSnow ? '#8fcaf5' : '#ffd700';
          this.ctx.shadowBlur = isSnow ? 12 : 20;
          this.ctx.fillRect(poleX - 1, fTop - 24, 8, 6);
          if (isSnow) {
            this.ctx.fillStyle = 'rgba(220, 235, 250, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(poleX + 3, fTop - 21, 5, 0, Math.PI * 2);
            this.ctx.fill();
          }
          this.ctx.shadowBlur = 0;
          this.ctx.restore();

          // Pole on right side
          this.ctx.save();
          const poleX2 = finishX + zone.width;
          this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
          this.ctx.shadowBlur = 8;
          const poleGrad2 = this.ctx.createLinearGradient(poleX2, 0, poleX2 + 6, 0);
          if (isSnow) {
            poleGrad2.addColorStop(0, '#6a8aaa');
            poleGrad2.addColorStop(0.5, '#b0c8da');
            poleGrad2.addColorStop(1, '#6a8aaa');
          } else {
            poleGrad2.addColorStop(0, '#2c3e50');
            poleGrad2.addColorStop(0.5, '#95a5a6');
            poleGrad2.addColorStop(1, '#2c3e50');
          }
          this.ctx.fillStyle = poleGrad2;
          this.ctx.fillRect(poleX2, fTop - 20, 6, fH + 40);
          // Snow cap / top decoration
          this.ctx.fillStyle = isSnow ? '#e8f0f8' : '#ffd700';
          this.ctx.shadowColor = isSnow ? '#8fcaf5' : '#ffd700';
          this.ctx.shadowBlur = isSnow ? 12 : 20;
          this.ctx.fillRect(poleX2 - 1, fTop - 24, 8, 6);
          if (isSnow) {
            this.ctx.fillStyle = 'rgba(220, 235, 250, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(poleX2 + 3, fTop - 21, 5, 0, Math.PI * 2);
            this.ctx.fill();
          }
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
          if (isSnow) {
            bGrad.addColorStop(0, '#2c6b9e');
            bGrad.addColorStop(0.5, '#1a4f7a');
            bGrad.addColorStop(1, '#2c6b9e');
          } else {
            bGrad.addColorStop(0, '#e74c3c');
            bGrad.addColorStop(0.5, '#c0392b');
            bGrad.addColorStop(1, '#e74c3c');
          }
          this.ctx.fillStyle = bGrad;
          this.ctx.fillRect(finishX + 4, bannerY, zone.width - 8, bannerH);
          this.ctx.shadowBlur = 0;
          this.ctx.strokeStyle = isSnow ? '#8fcaf5' : '#ffd700';
          this.ctx.lineWidth = 3;
          this.ctx.shadowColor = isSnow ? '#8fcaf5' : '#ffd700';
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

        } else if (zone.type === 'portal') {
          // Portal ??? purple vortex, direction-agnostic
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
          // Direction arrow ??? shows whether paired portal is ahead (???) or behind (???)
          const pairPortal = this.track.zones.find(z => z !== zone && z.type === 'portal' && z.pairId === zone.pairId);
          if (pairPortal) {
            const arrow = pairPortal.x > zone.x ? '???' : '???';
            this.ctx.fillStyle = this.currentThemeKey === 'jungle' ? '#1C3D24' : 'rgba(200,160,255,0.75)';
            this.ctx.strokeStyle = this.currentThemeKey === 'jungle' ? '#E5EBD9' : 'transparent';
            this.ctx.lineWidth = this.currentThemeKey === 'jungle' ? 3 : 0;
            this.ctx.font = this.currentThemeKey === 'jungle' ? 'bold 22px Montserrat, sans-serif' : 'bold 20px Montserrat, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            if (this.currentThemeKey === 'jungle') this.ctx.strokeText(arrow, cx, cy + pr + 16);
            this.ctx.fillText(arrow, cx, cy + pr + 16);
          }
          this.ctx.restore();
        } else if (zone.type === 'shortcutEntry') {
          // Removed shortcut label ??? replaced with wind zone logic
        } else if (zone.type === 'shortcutExit') {
          // Removed shortcut label ??? replaced with wind zone logic
        } else if (zone.type === 'bottleneck') {
          // Narrow corridor zone ??? subtle wall indicators
          this.ctx.save();
          this.ctx.fillStyle = 'rgba(231,76,60,0.08)';
          this.ctx.fillRect(zX, zone.y, zone.width, zone.height);
          this.ctx.strokeStyle = 'rgba(231,76,60,0.25)';
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([4, 6]);
          this.ctx.strokeRect(zX, zone.y, zone.width, zone.height);
          this.ctx.setLineDash([]);
          const isJungle = this.currentThemeKey === 'jungle';
          this.ctx.fillStyle = isJungle ? '#102A16' : 'rgba(231,76,60,0.15)';
          this.ctx.strokeStyle = isJungle ? '#E5EBD9' : 'transparent';
          this.ctx.lineWidth = isJungle ? 3 : 0;
          this.ctx.font = isJungle ? 'bold 12px Montserrat, sans-serif' : 'bold 9px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          if (isJungle) this.ctx.strokeText('MERGE', zX + zone.width / 2, zone.y + zone.height / 2);
          this.ctx.fillText('MERGE', zX + zone.width / 2, zone.y + zone.height / 2);
          this.ctx.restore();
        } else if (zone.type === 'jump') {
          // Jump zone ??? upward arrow and light fill
          this.ctx.save();
          this.ctx.fillStyle = 'rgba(155,89,182,0.15)';
          this.ctx.fillRect(zX, zone.y, zone.width, zone.height);
          const isJungle = this.currentThemeKey === 'jungle';
          this.ctx.fillStyle = isJungle ? '#102A16' : 'rgba(155,89,182,0.6)';
          this.ctx.strokeStyle = isJungle ? '#E5EBD9' : 'transparent';
          this.ctx.lineWidth = isJungle ? 2 : 0;
          this.ctx.font = isJungle ? 'bold 16px Montserrat, sans-serif' : 'bold 14px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          const bounce = Math.sin(Date.now() * 0.006) * 3;
          if (isJungle) this.ctx.strokeText('\u2191', zX + zone.width / 2, zone.y + zone.height / 2 + bounce);
          this.ctx.fillText('\u2191', zX + zone.width / 2, zone.y + zone.height / 2 + bounce);
          this.ctx.restore();
        } else if (zone.type === 'launch') {
          // Bounce pad ??? upward launch zone
          this.ctx.save();
          const bounceY = Math.sin(Date.now() * 0.01) * 2;
          this.ctx.fillStyle = 'rgba(46,204,113,0.25)';
          this.ctx.fillRect(zX, zone.y + bounceY, zone.width, zone.height);
          const isJungle = this.currentThemeKey === 'jungle';
          this.ctx.fillStyle = isJungle ? '#102A16' : 'rgba(46,204,113,0.7)';
          this.ctx.strokeStyle = isJungle ? '#E5EBD9' : 'transparent';
          this.ctx.lineWidth = isJungle ? 2 : 0;
          this.ctx.font = isJungle ? 'bold 15px Montserrat, sans-serif' : 'bold 12px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          if (isJungle) this.ctx.strokeText('\u21E7', zX + zone.width / 2, zone.y + zone.height / 2 + bounceY);
          this.ctx.fillText('\u21E7', zX + zone.width / 2, zone.y + zone.height / 2 + bounceY);
          this.ctx.restore();
        }
      });
      };
      if (this.currentThemeKey !== 'volcano') renderTrackZones();

      // Draw Static Pegs (Bumpers) ??? white, shiny, glossy
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
          if (this.currentThemeKey === 'snow') {
            this.ctx.shadowColor = '#2a5a7a';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = 'rgba(60, 140, 180, 0.35)';
            this.ctx.lineWidth = 2;
          } else {
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = 14;
            this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            this.ctx.lineWidth = 2;
          }
          this.ctx.beginPath();
          this.ctx.arc(pegX, peg.y, peg.radius + 3, 0, Math.PI * 2);
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
        }
        // Dark outline ring for all pegs in snow theme for track contrast
        if (this.currentThemeKey === 'snow') {
          this.ctx.strokeStyle = 'rgba(20, 40, 60, 0.40)';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(pegX, peg.y, peg.radius + 1, 0, Math.PI * 2);
          this.ctx.stroke();
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
          let surfAlpha = this.currentThemeKey === 'snow' ? 0.18 : 0.06;
          let surfaceColor = wallRgba;
          // Volcano: use dark metallic graphite instead of red wall color for track surface
          if (this.currentThemeKey === 'volcano') {
            surfaceColor = '#1a1612';
            surfAlpha = 0.85;
          }
          // Jungle: use semi-transparent natural pathway that lets the rainforest show through
          if (this.currentThemeKey === 'jungle') {
            surfaceColor = '#3a4a30';
            surfAlpha = 0.35;
          }
          this.ctx.fillStyle = hexToRgba(surfaceColor, surfAlpha);
          this.ctx.beginPath();
          this.ctx.moveTo(visibleTop[0].x, visibleTop[0].y);
          for (let i = 1; i < visibleTop.length; i++) this.ctx.lineTo(visibleTop[i].x, visibleTop[i].y);
          for (let i = visibleBot.length - 1; i >= 0; i--) this.ctx.lineTo(visibleBot[i].x, visibleBot[i].y);
          this.ctx.lineTo(visibleTop[0].x, visibleTop[0].y);
          this.ctx.fill();

          // Darker surface overlay for snow theme to separate track from background
          if (this.currentThemeKey === 'snow') {
            this.ctx.fillStyle = 'rgba(25, 40, 60, 0.10)';
            this.ctx.beginPath();
            this.ctx.moveTo(visibleTop[0].x, visibleTop[0].y);
            for (let i = 1; i < visibleTop.length; i++) this.ctx.lineTo(visibleTop[i].x, visibleTop[i].y);
            for (let i = visibleBot.length - 1; i >= 0; i--) this.ctx.lineTo(visibleBot[i].x, visibleBot[i].y);
            this.ctx.lineTo(visibleTop[0].x, visibleTop[0].y);
            this.ctx.fill();
          }
          // Jungle: subtle pathway overlay for track definition
          if (this.currentThemeKey === 'jungle') {
            this.ctx.fillStyle = 'rgba(60, 50, 40, 0.06)';
            this.ctx.beginPath();
            this.ctx.moveTo(visibleTop[0].x, visibleTop[0].y);
            for (let i = 1; i < visibleTop.length; i++) this.ctx.lineTo(visibleTop[i].x, visibleTop[i].y);
            for (let i = visibleBot.length - 1; i >= 0; i--) this.ctx.lineTo(visibleBot[i].x, visibleBot[i].y);
            this.ctx.lineTo(visibleTop[0].x, visibleTop[0].y);
            this.ctx.fill();
          }
          // Edge lighting ??? subtle gradient near track boundaries
          const topEdgeY = visibleTop[0].y;
          const botEdgeY = visibleBot[0].y;

          // Volcano: subtle molten glow along track edges
          if (this.currentThemeKey === 'volcano') {
            const edgeGlowTop = this.ctx.createLinearGradient(0, topEdgeY, 0, topEdgeY + 30);
            edgeGlowTop.addColorStop(0, 'rgba(255, 80, 0, 0.04)');
            edgeGlowTop.addColorStop(1, 'rgba(255, 80, 0, 0)');
            this.ctx.fillStyle = edgeGlowTop;
            this.ctx.fillRect(visibleTop[0].x - 10, topEdgeY, visibleTop[visibleTop.length - 1].x - visibleTop[0].x + 20, 30);
            const edgeGlowBot = this.ctx.createLinearGradient(0, botEdgeY - 30, 0, botEdgeY);
            edgeGlowBot.addColorStop(0, 'rgba(0,0,0,0)');
            edgeGlowBot.addColorStop(1, 'rgba(255, 80, 0, 0.05)');
            this.ctx.fillStyle = edgeGlowBot;
            this.ctx.fillRect(visibleBot[0].x - 10, botEdgeY - 30, visibleBot[visibleBot.length - 1].x - visibleBot[0].x + 20, 30);
          }
          const edgeLight = this.ctx.createLinearGradient(0, topEdgeY, 0, topEdgeY + 20);
          edgeLight.addColorStop(0, 'rgba(255,255,255,0.04)');
          edgeLight.addColorStop(1, 'rgba(255,255,255,0)');
          this.ctx.fillStyle = edgeLight;
          this.ctx.fillRect(visibleTop[0].x - 10, topEdgeY, visibleTop[visibleTop.length - 1].x - visibleTop[0].x + 20, 20);
          const botEdgeLight = this.ctx.createLinearGradient(0, botEdgeY - 20, 0, botEdgeY);
          botEdgeLight.addColorStop(0, 'rgba(0,0,0,0)');
          botEdgeLight.addColorStop(1, 'rgba(0,0,0,0.06)');
          this.ctx.fillStyle = botEdgeLight;
          this.ctx.fillRect(visibleBot[0].x - 10, botEdgeY - 20, visibleBot[visibleBot.length - 1].x - visibleBot[0].x + 20, 20);

          // Grass texture variation or ice cracks (theme-specific)
          if (this.currentThemeKey === 'snow') {
            // Ice crack patterns on the surface (more visible)
            this.ctx.strokeStyle = 'rgba(100, 180, 220, 0.10)';
            this.ctx.lineWidth = 1.2;
            const iceSeed = Math.floor(camX / 25);
            for (let c = 0; c < 8; c++) {
              const cx = visibleTop[0].x + ((iceSeed * 67 + c * 131) % (visibleTop[visibleTop.length - 1].x - visibleTop[0].x + 40));
              const cy = topEdgeY + 10 + ((iceSeed * 43 + c * 89) % (botEdgeY - topEdgeY - 20));
              this.ctx.beginPath();
              this.ctx.moveTo(cx, cy);
              this.ctx.lineTo(cx + 10 + (c * 13) % 20, cy + 5 + (c * 7) % 10);
              this.ctx.lineTo(cx + 20 + (c * 17) % 15, cy - 3 + (c * 11) % 8);
              this.ctx.stroke();
              this.ctx.beginPath();
              this.ctx.moveTo(cx + 5, cy + 2);
              this.ctx.lineTo(cx + 15 + (c * 19) % 12, cy - 8 + (c * 5) % 6);
              this.ctx.stroke();
            }
          } else if (this.currentThemeKey === 'volcano') {
            // Magma crack patterns on the volcanic surface
            this.ctx.strokeStyle = 'rgba(255, 100, 0, 0.05)';
            this.ctx.lineWidth = 1.2;
            const magmaSeed = Math.floor(camX / 25);
            for (let c = 0; c < 10; c++) {
              const cx = visibleTop[0].x + ((magmaSeed * 67 + c * 131) % (visibleTop[visibleTop.length - 1].x - visibleTop[0].x + 40));
              const cy = topEdgeY + 10 + ((magmaSeed * 43 + c * 89) % (botEdgeY - topEdgeY - 20));
              this.ctx.beginPath();
              this.ctx.moveTo(cx, cy);
              this.ctx.lineTo(cx + 12 + (c * 13) % 20, cy + 6 + (c * 7) % 10);
              this.ctx.lineTo(cx + 22 + (c * 17) % 15, cy - 4 + (c * 11) % 8);
              this.ctx.stroke();
              this.ctx.beginPath();
              this.ctx.moveTo(cx + 5, cy + 2);
              this.ctx.lineTo(cx + 18 + (c * 19) % 12, cy - 10 + (c * 5) % 6);
              this.ctx.stroke();
            }
          } else if (this.currentThemeKey === 'jungle') {
            // Jungle: mossy stone paver cracks instead of grass
            this.ctx.strokeStyle = 'rgba(50, 60, 40, 0.05)';
            this.ctx.lineWidth = 1;
            const paverSeed = Math.floor(camX / 20);
            for (let p = 0; p < 8; p++) {
              const px = visibleTop[0].x + ((paverSeed * 53 + p * 67) % (visibleTop[visibleTop.length - 1].x - visibleTop[0].x + 40));
              const py = topEdgeY + 6 + ((paverSeed * 31 + p * 89) % (botEdgeY - topEdgeY - 12));
              const pw = 6 + ((paverSeed * 41 + p * 53) % 12);
              this.ctx.beginPath();
              this.ctx.moveTo(px, py);
              this.ctx.lineTo(px + pw, py - 2 + ((p * 7) % 5));
              this.ctx.moveTo(px + pw * 0.3, py + 3);
              this.ctx.lineTo(px + pw * 0.7, py + 1);
              this.ctx.stroke();
            }
          } else {
            this.ctx.strokeStyle = 'rgba(46,204,113,0.03)';
            this.ctx.lineWidth = 1.5;
            const grassSeed = Math.floor(camX / 30);
            for (let g = 0; g < 12; g++) {
              const gx = visibleTop[0].x + ((grassSeed * 137 + g * 97) % (visibleTop[visibleTop.length - 1].x - visibleTop[0].x + 40));
              const gy = topEdgeY + 8 + ((grassSeed * 53 + g * 131) % (botEdgeY - topEdgeY - 16));
              const glen = 3 + ((grassSeed * 71 + g * 43) % 6);
              this.ctx.beginPath();
              this.ctx.moveTo(gx, gy);
              this.ctx.lineTo(gx + ((g * 29) % 7 - 3), gy - glen);
              this.ctx.stroke();
            }
          }

        // ===== TOP OF TRACK: Dense rainforest canopy wall =====
        if (this.currentThemeKey === 'jungle') {
          const ctx = this.ctx;
          const screenW = this.canvas.width;
          const screenH = this.canvas.height;
          const time = Date.now() * 0.001;
          const camX = this.cameraX || 0;
          const camY = this.cameraY || 0;

          ctx.save();

          // ===== TOP OF TRACK: Dense rainforest canopy wall =====
          const canopyTime = time * 0.03;

          // Layer 1: Far background trees (tall emergent layer - kapok/giant jungle trees)
          ctx.globalAlpha = 0.12;
          ctx.fillStyle = '#0d2818';
          const trunkW = 8;
          const trunkH = 120;
          for (let i = 0; i < 12; i++) {
            const tx = (i / 12) * screenW + Math.sin(i * 2.1 + canopyTime * 0.5) * 40;
            const canopyBaseY = screenH * 0.25;
            const canopyR = 80 + Math.sin(i * 2.3) * 25;
            ctx.fillRect(tx - trunkW / 2, canopyBaseY, trunkW, trunkH);
            for (let t = 0; t < 5; t++) {
              const ty = canopyBaseY + (t / 5) * trunkH;
              const lean = Math.sin(i * 1.3 + t * 2.1) * 8;
              ctx.beginPath();
              ctx.moveTo(tx - trunkW / 2 + lean, ty);
              ctx.lineTo(tx + trunkW / 2 + lean, ty);
              ctx.strokeStyle = '#1a3a20';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            // Massive canopy - layered for depth
            const canopyY = canopyBaseY - canopyR * 0.3;
            // Back canopy layer
            ctx.fillStyle = '#0a1f12';
            ctx.beginPath();
            ctx.ellipse(tx, canopyY, canopyR * 1.1, canopyR * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            // Mid canopy layer
            ctx.fillStyle = '#0d2818';
            ctx.beginPath();
            ctx.ellipse(tx, canopyY - 10, canopyR * 0.9, canopyR * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Front canopy layer
            ctx.fillStyle = '#103018';
            ctx.beginPath();
            ctx.ellipse(tx, canopyY - 18, canopyR * 0.75, canopyR * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Layer 2: Mid-ground trees (canopy layer - rubber trees, tall palms)
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = '#0e2a16';
          for (let i = 0; i < 16; i++) {
            const tx = ((i + 0.5) / 16) * screenW + Math.sin(i * 1.9 + canopyTime * 0.7) * 30;
            const canopyBaseY = screenH * 0.3;
            const canopyR = 65 + Math.sin(i * 1.7) * 20;
            const trunkW = 10;
            const trunkH = 100;
            ctx.fillRect(tx - trunkW / 2, canopyBaseY, trunkW, trunkH);
            const branchCount = 3 + Math.floor(Math.sin(i * 2.3) * 2);
            for (let b = 0; b < branchCount; b++) {
              const branchY = canopyBaseY + (b / branchCount) * trunkH * 0.6;
              const branchLen = 25 + Math.sin(i * 3 + b * 2) * 15;
              const branchAngle = (b / branchCount) * Math.PI * 1.5 - Math.PI * 0.75;
              ctx.beginPath();
              ctx.moveTo(tx + trunkW / 2, branchY);
              ctx.lineTo(
                tx + trunkW / 2 + Math.cos(branchAngle) * branchLen,
                branchY + Math.sin(branchAngle) * branchLen * 0.5
              );
              ctx.strokeStyle = '#1a3a20';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            // Canopy - irregular, layered
            const canopyY = canopyBaseY - canopyR * 0.4;
            ctx.fillStyle = '#0c2212';
            ctx.beginPath();
            ctx.ellipse(tx, canopyY, canopyR, canopyR * 0.65, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f2a16';
            ctx.beginPath();
            ctx.ellipse(tx, canopyY - 8, canopyR * 0.85, canopyR * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#12381a';
            ctx.beginPath();
            ctx.ellipse(tx + Math.sin(i * 2) * 8, canopyY - 15, canopyR * 0.7, canopyR * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Layer 3: Near canopy trees (lower canopy - diverse crown shapes)
          ctx.globalAlpha = 0.25;
          for (let i = 0; i < 20; i++) {
            const tx = (i / 20) * screenW + Math.sin(i * 2.7 + canopyTime) * 20;
            const canopyBaseY = screenH * 0.38;
            const canopyR = 50 + Math.sin(i * 2.1) * 18;
            const trunkW = 12;
            const trunkH = 80;
            const lean = Math.sin(i * 1.5) * 15;
            ctx.fillStyle = '#102814';
            ctx.beginPath();
            ctx.moveTo(tx - trunkW / 2, canopyBaseY + trunkH);
            ctx.lineTo(tx + trunkW / 2, canopyBaseY + trunkH);
            ctx.lineTo(tx + trunkW / 2 + lean, canopyBaseY);
            ctx.lineTo(tx - trunkW / 2 + lean, canopyBaseY);
            ctx.closePath();
            ctx.fill();
            // Canopy - varied shapes (rounded, irregular, some extending toward track)
            const canopyY = canopyBaseY - canopyR * 0.5;
            ctx.fillStyle = '#0a1e10';
            ctx.beginPath();
            ctx.ellipse(tx + lean * 0.3, canopyY, canopyR, canopyR * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0d2612';
            ctx.beginPath();
            ctx.ellipse(tx + lean * 0.3, canopyY, canopyR * 1.1, canopyR * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f2e14';
            ctx.beginPath();
            ctx.ellipse(tx + lean * 0.3 + 5, canopyY - 10, canopyR * 0.8, canopyR * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#113616';
            ctx.beginPath();
            ctx.ellipse(tx + lean * 0.3 - 3, canopyY - 18, canopyR * 0.65, canopyR * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // ===== BOTTOM OF TRACK: Dense foreground jungle layer =====
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = '#0a180c';
          for (let i = 0; i < 35; i++) {
            const tx = (i / 35) * screenW + Math.sin(i * 1.3 + canopyTime * 0.3) * 40;
            const trunkBaseY = screenH;
            const trunkH = 180 + Math.sin(i * 2.1) * 40;
            const trunkW = 15 + Math.sin(i * 1.7) * 8;
            const canopyR = 70 + Math.sin(i * 1.9) * 25;
            const canopyBaseY = trunkBaseY - trunkH * 0.1;

            // Trunk with roots
            const lean = Math.sin(i * 1.1) * 20;
            ctx.fillStyle = '#0d1a0a';
            ctx.beginPath();
            ctx.moveTo(tx - trunkW / 2, trunkBaseY);
            ctx.lineTo(tx + trunkW / 2, trunkBaseY);
            ctx.lineTo(tx + trunkW / 2 + lean, canopyBaseY);
            ctx.lineTo(tx - trunkW / 2 + lean, canopyBaseY);
            ctx.closePath();
            ctx.fill();

            // Trunk texture
            ctx.strokeStyle = '#1a3a14';
            ctx.lineWidth = 2;
            for (let t = 0; t < 6; t++) {
              const ty = trunkBaseY - (t / 6) * trunkH;
              const lx = Math.sin(i * 2.3 + t * 1.7) * trunkW * 0.3;
              ctx.beginPath();
              ctx.moveTo(tx - trunkW / 2 + lx, ty);
              ctx.lineTo(tx + trunkW / 2 + lx, ty);
              ctx.stroke();
            }

            // Large roots at base
            ctx.fillStyle = '#081006';
            for (let r = 0; r < 4; r++) {
              const rootAngle = (r / 4) * Math.PI * 2 + Math.sin(i * 2) * 0.5;
              const rootLen = 30 + Math.sin(i * 3 + r) * 15;
              const rx1 = tx + Math.cos(rootAngle) * (trunkW / 2);
              const ry1 = screenH;
              const rx2 = tx + Math.cos(rootAngle) * (trunkW / 2 + rootLen);
              const ry2 = screenH - Math.sin(rootAngle) * rootLen * 0.3;
              ctx.beginPath();
              ctx.moveTo(rx1, ry1);
              ctx.lineTo(rx2, ry2);
              ctx.lineTo(rx2 + 8, ry2 + 4);
              ctx.lineTo(rx1 + 8, ry1);
              ctx.closePath();
              ctx.fill();
            }

            // Dense canopy extending slightly toward track
            const canopyY = canopyBaseY - canopyR * 0.3;
            ctx.fillStyle = '#082010';
            ctx.beginPath();
            ctx.ellipse(tx, canopyY, canopyR * 1.15, canopyR * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0e3818';
            ctx.beginPath();
            ctx.ellipse(tx + 5, canopyY - 12, canopyR * 0.95, canopyR * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#145020';
            ctx.beginPath();
            ctx.ellipse(tx - 3, canopyY - 22, canopyR * 0.8, canopyR * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1a6528';
            ctx.beginPath();
            ctx.ellipse(tx + 8, canopyY - 30, canopyR * 0.6, canopyR * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Bushes, ferns, banana leaves, ground vegetation
          ctx.globalAlpha = 0.28;
          for (let i = 0; i < 35; i++) {
            const bx = (i / 35) * screenW + Math.sin(i * 3.1 + canopyTime * 1.2) * 50;
            const by = screenH * (0.55 + Math.sin(i * 2.7) * 0.2);
            const type = i % 5;
            const size = 15 + Math.sin(i * 1.7) * 10;

            if (type === 0) {
              // Bush - dark green rounded
              ctx.fillStyle = '#0d3015';
              ctx.beginPath();
              ctx.ellipse(bx, by, size * 1.2, size * 0.7, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#145020';
              ctx.beginPath();
              ctx.ellipse(bx + 3, by - 5, size * 0.9, size * 0.5, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#1a6528';
              ctx.beginPath();
              ctx.ellipse(bx - 2, by - 10, size * 0.7, size * 0.4, 0, 0, Math.PI * 2);
              ctx.fill();
            } else if (type === 1) {
              // Fern - arching fronds
              ctx.strokeStyle = '#104018';
              ctx.lineWidth = 2;
              for (let f = 0; f < 5; f++) {
                const angle = -Math.PI / 2 + (f / 4) * Math.PI * 0.7 - 0.2;
                const len = size * (0.6 + f * 0.1);
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.quadraticCurveTo(
                  bx + Math.cos(angle) * len * 0.5,
                  by + Math.sin(angle) * len * 0.5,
                  bx + Math.cos(angle) * len,
                  by + Math.sin(angle) * len
                );
                ctx.stroke();
                // Fern leaflets
                ctx.strokeStyle = '#185828';
                ctx.lineWidth = 1;
                for (let l = 0; l < 4; l++) {
                  const la = angle + (l - 1.5) * 0.15;
                  const ll = len * 0.25;
                  const lx = bx + Math.cos(angle) * len * (l / 4) * 0.7;
                  const ly = by + Math.sin(angle) * len * (l / 4) * 0.7;
                  ctx.beginPath();
                  ctx.moveTo(lx, ly);
                  ctx.lineTo(lx + Math.cos(la) * ll, ly + Math.sin(la) * ll);
                  ctx.stroke();
                }
                ctx.strokeStyle = '#104018';
                ctx.lineWidth = 2;
              }
            } else if (type === 2) {
              // Banana leaf - large paddle shape
              ctx.fillStyle = '#0e3816';
              const leafAngle = Math.sin(i * 2.1) * 0.5;
              ctx.save();
              ctx.translate(bx, by);
              ctx.rotate(leafAngle);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.quadraticCurveTo(size * 0.3, -size * 0.8, size, -size * 0.3);
              ctx.quadraticCurveTo(size * 0.3, size * 0.2, 0, size * 0.1);
              ctx.quadraticCurveTo(-size * 0.3, size * 0.5, -size * 0.5, 0);
              ctx.quadraticCurveTo(-size * 0.3, -size * 0.3, 0, 0);
              ctx.closePath();
              ctx.fill();
              ctx.fillStyle = '#165525';
              ctx.beginPath();
              ctx.moveTo(2, 0);
              ctx.quadraticCurveTo(size * 0.25, -size * 0.5, size * 0.7, -size * 0.1);
              ctx.quadraticCurveTo(size * 0.15, size * 0.15, 0, size * 0.05);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            } else if (type === 3) {
              // Broad leaf plant
              ctx.fillStyle = '#0d2812';
              for (let l = 0; l < 3; l++) {
                const angle = (l / 3) * Math.PI * 1.5 - Math.PI * 0.75;
                const len = size * (0.7 + l * 0.15);
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.quadraticCurveTo(
                  bx + Math.cos(angle) * len * 0.4,
                  by + Math.sin(angle) * len * 0.4,
                  bx + Math.cos(angle) * len,
                  by + Math.sin(angle) * len
                );
                ctx.quadraticCurveTo(
                  bx + Math.cos(angle) * len * 1.2,
                  by + Math.sin(angle) * len * 1.2,
                  bx,
                  by
                );
                ctx.fill();
              }
            } else {
              // Grass tuft
              ctx.strokeStyle = '#1a5828';
              ctx.lineWidth = 1.5;
              for (let g = 0; g < 4; g++) {
                const angle = -Math.PI / 2 + (g - 1.5) * 0.4;
                const len = size * (0.4 + g * 0.1);
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + Math.cos(angle) * len, by + Math.sin(angle) * len);
                ctx.stroke();
              }
            }
          }

          // ===== JUNGLE VINES: Connecting trees, hanging naturally =====
          ctx.globalAlpha = 0.18;
          ctx.strokeStyle = '#3a2510';
          ctx.lineWidth = 2;
          for (let v = 0; v < 15; v++) {
            const vx = (v / 15) * screenW + Math.sin(v * 1.7 + canopyTime * 0.4) * 30;
            const startY = screenH * (0.25 + Math.sin(v * 2.3) * 0.1);
            const endY = screenH * (0.45 + Math.sin(v * 1.9) * 0.15);
            const sway = Math.sin(canopyTime * 0.8 + v * 1.5) * 12;

            ctx.beginPath();
            ctx.moveTo(vx, startY);
            for (let seg = 0; seg < 4; seg++) {
              const sy = startY + (seg / 4) * (endY - startY);
              const sx = vx + sway * Math.sin(seg * 1.2);
              ctx.lineTo(sx, sy);
            }
            ctx.stroke();

            // Vine leaves
            ctx.fillStyle = '#1a4520';
            for (let seg = 0; seg < 4; seg++) {
              if (Math.sin(canopyTime + v * 2 + seg) > 0.3) {
                const sy = startY + (seg / 4) * (endY - startY) + Math.sin(canopyTime + v + seg) * 8;
                const sx = vx + sway * Math.sin(seg * 1.2);
                ctx.beginPath();
                ctx.ellipse(sx + 5, sy, 6, 3, Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(sx - 5, sy, 6, 3, -Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // ===== DISTANT RIVER/WATERFALL (subtle, background only) =====
          ctx.globalAlpha = 0.06;
          const riverX = screenW * 0.15 + Math.sin(canopyTime * 0.1) * 20;
          const riverY = screenH * 0.22;
          const riverW = 40;
          ctx.fillStyle = '#1a4a6a';
          ctx.beginPath();
          ctx.moveTo(riverX - riverW / 2, 0);
          for (let ry = 0; ry < screenH * 0.35; ry += 20) {
            const wobble = Math.sin(ry * 0.02 + canopyTime * 0.5) * 8;
            ctx.lineTo(riverX + wobble - riverW / 2 + Math.sin(ry * 0.03) * 3, ry);
          }
          ctx.lineTo(riverX + riverW / 2 + Math.sin(screenH * 0.35 * 0.03) * 3, screenH * 0.35);
          ctx.lineTo(riverX - riverW / 2, screenH * 0.35);
          ctx.closePath();
          ctx.fill();

          // Waterfall hint
          ctx.globalAlpha = 0.08;
          ctx.fillStyle = '#3a8ac8';
          const fallX = riverX + Math.sin(canopyTime * 0.3) * 5;
          ctx.beginPath();
          ctx.moveTo(fallX - 3, screenH * 0.18);
          ctx.lineTo(fallX + 3, screenH * 0.18);
          ctx.lineTo(fallX + 5, screenH * 0.35);
          ctx.lineTo(fallX - 5, screenH * 0.35);
          ctx.closePath();
          ctx.fill();

          // ===== GROUND FOG / ATMOSPHERIC DEPTH =====
          ctx.globalAlpha = 0.12;
          const fogGrad = ctx.createLinearGradient(0, screenH * 0.5, 0, screenH);
          fogGrad.addColorStop(0, 'rgba(10, 30, 15, 0)');
          fogGrad.addColorStop(0.4, 'rgba(10, 30, 15, 0.02)');
          fogGrad.addColorStop(0.7, 'rgba(10, 30, 15, 0.05)');
          fogGrad.addColorStop(1, 'rgba(10, 30, 15, 0.12)');
          ctx.fillStyle = fogGrad;
          ctx.fillRect(0, screenH * 0.5, screenW, screenH * 0.5);

          ctx.restore();
        }
        // Jungle: draw zones on top of track surface (like volcano)
        if (this.currentThemeKey === 'jungle') renderTrackZones();
          const lineY1 = topEdgeY + (botEdgeY - topEdgeY) * 0.15;
          const lineY2 = topEdgeY + (botEdgeY - topEdgeY) * 0.85;
          this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          this.ctx.lineWidth = 1.5;
          this.ctx.setLineDash([8, 12]);
          this.ctx.beginPath();
          this.ctx.moveTo(visibleTop[0].x, lineY1);
          this.ctx.lineTo(visibleTop[visibleTop.length - 1].x, lineY1);
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.moveTo(visibleTop[0].x, lineY2);
          this.ctx.lineTo(visibleTop[visibleTop.length - 1].x, lineY2);
          this.ctx.stroke();
          this.ctx.setLineDash([]);

          // Wear marks ??? subtle dark streaks
          this.ctx.strokeStyle = 'rgba(0,0,0,0.04)';
          this.ctx.lineWidth = 1;
          const wearSeed = Math.floor(camX / 20);
          for (let w = 0; w < 4; w++) {
            const wx = visibleTop[0].x + ((wearSeed * 61 + w * 113) % (visibleTop[visibleTop.length - 1].x - visibleTop[0].x + 40));
            const wy = topEdgeY + 15 + ((wearSeed * 43 + w * 79) % (botEdgeY - topEdgeY - 30));
            this.ctx.beginPath();
            this.ctx.moveTo(wx, wy);
            this.ctx.quadraticCurveTo(wx + 10 + (w * 17) % 15, wy + 2, wx + 25 + (w * 11) % 10, wy - 1);
            this.ctx.stroke();
          }

          // Small scattered pebbles or ice crystals (theme-specific)
          const pebSeed = Math.floor(camX / 15);
          if (this.currentThemeKey === 'snow') {
            // Ice crystal sparkles on the surface (more visible)
            this.ctx.fillStyle = 'rgba(120, 200, 240, 0.18)';
            for (let p = 0; p < 10; p++) {
              const px = visibleTop[0].x + ((pebSeed * 47 + p * 131) % (visibleTop[visibleTop.length - 1].x - visibleTop[0].x + 40));
              const py = topEdgeY + 5 + ((pebSeed * 73 + p * 89) % (botEdgeY - topEdgeY - 10));
              const ps = 0.8 + ((pebSeed * 59 + p * 37) % 3) * 0.6;
              this.ctx.beginPath();
              this.ctx.arc(px, py, ps, 0, Math.PI * 2);
              this.ctx.fill();
              // Tiny cross sparkle
              this.ctx.globalAlpha = 0.6;
              this.ctx.strokeStyle = 'rgba(220, 240, 255, 0.10)';
              this.ctx.lineWidth = 0.5;
              this.ctx.beginPath();
              this.ctx.moveTo(px - 3, py);
              this.ctx.lineTo(px + 3, py);
              this.ctx.moveTo(px, py - 3);
              this.ctx.lineTo(px, py + 3);
              this.ctx.stroke();
              this.ctx.globalAlpha = 0.6;
            }
          } else {
            this.ctx.fillStyle = 'rgba(180,170,160,0.06)';
            for (let p = 0; p < 8; p++) {
              const px = visibleTop[0].x + ((pebSeed * 47 + p * 131) % (visibleTop[visibleTop.length - 1].x - visibleTop[0].x + 40));
              const py = topEdgeY + 5 + ((pebSeed * 73 + p * 89) % (botEdgeY - topEdgeY - 10));
              const ps = 1 + ((pebSeed * 59 + p * 37) % 3);
              this.ctx.beginPath();
              this.ctx.arc(px, py, ps, 0, Math.PI * 2);
              this.ctx.fill();
            }
          }

          // Thin top boundary line
          if (this.currentThemeKey === 'snow') {
            this.ctx.strokeStyle = '#1a2a3a';
            this.ctx.globalAlpha = 0.55;
          } else if (this.currentThemeKey === 'jungle') {
            this.ctx.strokeStyle = '#4a5a3a'; // brownish-green for Amazon track boundaries
            this.ctx.globalAlpha = 0.85;
          } else {
            this.ctx.strokeStyle = wallRgba;
            this.ctx.globalAlpha = wallAlpha;
          }
          this.ctx.lineWidth = 3;
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';
          this.ctx.beginPath();
          for (let i = 0; i < visibleTop.length; i++) {
            if (i === 0) this.ctx.moveTo(visibleTop[i].x, visibleTop[i].y);
            else this.ctx.lineTo(visibleTop[i].x, visibleTop[i].y);
          }
          this.ctx.stroke();
          // Thin bottom boundary line
          if (this.currentThemeKey === 'snow') {
            this.ctx.strokeStyle = '#1a2a3a';
            this.ctx.globalAlpha = 0.55;
          } else if (this.currentThemeKey === 'jungle') {
            this.ctx.strokeStyle = '#4a5a3a';
            this.ctx.globalAlpha = 0.85;
          } else {
            this.ctx.strokeStyle = wallRgba;
            this.ctx.globalAlpha = wallAlpha;
          }
          this.ctx.beginPath();
          for (let i = 0; i < visibleBot.length; i++) {
            if (i === 0) this.ctx.moveTo(visibleBot[i].x, visibleBot[i].y);
            else this.ctx.lineTo(visibleBot[i].x, visibleBot[i].y);
          }
          this.ctx.stroke();
          // Decorative celestial objects + track glow + edge particles (space theme)
          if (this.currentThemeKey === 'space') {
            this._renderSpaceObjects(camX);
            // Subtle cyan energy pulse along wall boundaries
            this.ctx.save();
            const pulse = 0.12 + Math.sin(Date.now() * 0.003) * 0.06;
            this.ctx.strokeStyle = `rgba(102,252,241,${pulse})`;
            this.ctx.shadowColor = '#66fcf1';
            this.ctx.shadowBlur = 8;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            for (let i = 0; i < visibleTop.length; i++) {
              if (i === 0) this.ctx.moveTo(visibleTop[i].x, visibleTop[i].y);
              else this.ctx.lineTo(visibleTop[i].x, visibleTop[i].y);
            }
            this.ctx.stroke();
            this.ctx.beginPath();
            for (let i = 0; i < visibleBot.length; i++) {
              if (i === 0) this.ctx.moveTo(visibleBot[i].x, visibleBot[i].y);
              else this.ctx.lineTo(visibleBot[i].x, visibleBot[i].y);
            }
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            this.ctx.restore();
            // Tiny energy particles leaking from track edges
            const epTime = Date.now() * 0.002;
            const epCount = Math.floor(visibleTop.length * 0.15);
            for (let e = 0; e < epCount; e++) {
              const idx = Math.floor((e * 23 + Math.floor(epTime)) % visibleTop.length);
              if (Math.random() > 0.03) continue;
              const px = visibleTop[idx].x;
              const py = visibleTop[idx].y;
              this.ctx.save();
              this.ctx.fillStyle = e % 2 === 0 ? '#66fcf1' : '#a78bfa';
              this.ctx.globalAlpha = 0.15 + Math.random() * 0.15;
              this.ctx.beginPath();
              this.ctx.arc(px + (Math.random() - 0.5) * 6, py + Math.random() * 4, 0.8 + Math.random() * 0.8, 0, Math.PI * 2);
              this.ctx.fill();
              this.ctx.restore();
            }
          }
          // Icy glow on track boundaries for Glacier Summit
          if (this.currentThemeKey === 'snow') {
            this.ctx.save();
            const icePulse = 0.06 + Math.sin(Date.now() * 0.0025) * 0.03;
            this.ctx.strokeStyle = `rgba(100, 190, 240, ${icePulse})`;
            this.ctx.shadowColor = '#60b8e0';
            this.ctx.shadowBlur = 5;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            for (let i = 0; i < visibleTop.length; i++) {
              if (i === 0) this.ctx.moveTo(visibleTop[i].x, visibleTop[i].y);
              else this.ctx.lineTo(visibleTop[i].x, visibleTop[i].y);
            }
            this.ctx.stroke();
            this.ctx.beginPath();
            for (let i = 0; i < visibleBot.length; i++) {
              if (i === 0) this.ctx.moveTo(visibleBot[i].x, visibleBot[i].y);
              else this.ctx.lineTo(visibleBot[i].x, visibleBot[i].y);
            }
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            this.ctx.restore();
          }
          this.ctx.globalAlpha = 1;
        }
      }
      this.ctx.restore();      // Draw Obstacles (moving barriers, spinner anchors, meteors/rocks)

      // Volcano: draw zones on top of track (track is opaque for volcano, zones would be hidden underneath)
      if (this.currentThemeKey === 'volcano') renderTrackZones();
      // Jungle: draw zones on top of track (mud puddles would be hidden underneath track surface)
      if (this.currentThemeKey === 'jungle') renderTrackZones();

      this.track.obstacles.forEach(obs => {
        const obsX = obs.x - camX;
        const obsCullBuffer = Math.max(300, 400 / this.userZoomMultiplier);
        if (obsX + 200 < -obsCullBuffer || obsX - 200 > screenW / zoom + obsCullBuffer) return;

        // Soft ground shadow under obstacles for snow theme readability
        if (this.currentThemeKey === 'snow' && obs.type !== 'portal') {
          const bounds = this.physics.getWallBoundaries(obs.x, this.track);
          const shadowBase = bounds ? bounds.bottomY : (obs.y + 60);
          let sw = 50, sh = 14;
          if (obs.type === 'hammer' || obs.type === 'punchfist') { sw = 60; sh = 18; }
          else if (obs.type === 'barrier') { sw = 28; sh = 16; }
          else if (obs.type === 'flap') { sw = obs.plateWidth || 60; sh = 12; }
          else if (obs.type === 'sweep_arm') { sw = (obs.length || 120) * 0.6; sh = 10; }
          else if (obs.type === 'c_bumper') { sw = (obs.radius || 70) * 1.2; sh = 16; }
          else if (obs.type === 'spinner') { sw = 24; sh = (obs.length || 200) * 0.08 + 8; }
          else if (obs.type === 'rock') { sw = (obs.radius || 30) * 1.5; sh = 10; }
          else if (obs.type === 'trapdoor') { sw = obs.width || 40; sh = 14; }
          else if (obs.type === 'ice_cannon') { sw = 60; sh = 18; }
          else if (obs.type === 'icicle') { sw = 8; sh = 4; }
          this.ctx.save();
          this.ctx.fillStyle = 'rgba(10, 20, 35, 0.12)';
          this.ctx.beginPath();
          this.ctx.ellipse(obsX, shadowBase + 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }

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
          this.ctx.save();
          const halfGap = (obs.currentGap != null ? obs.currentGap : 100) / 2;
          const gw = obs.width || 18;
          const gh = obs.height || 80;
          const midY = obs.y;
          // Top gate half
          const topCenterY = midY - halfGap - gh / 2;
          const topGrad = this.ctx.createLinearGradient(obsX, topCenterY - gh / 2, obsX, topCenterY + gh / 2);
          topGrad.addColorStop(0, '#2c3e50');
          topGrad.addColorStop(0.4, '#5d6d7e');
          topGrad.addColorStop(1, '#2c3e50');
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 6;
          this.ctx.shadowOffsetY = 2;
          this.ctx.fillStyle = topGrad;
          this.ctx.fillRect(obsX - gw / 2, topCenterY - gh / 2, gw, gh);
          // Top yellow warning stripes
          this.ctx.fillStyle = '#f1c40f';
          for (let sy = topCenterY - gh / 2 + 6; sy < topCenterY + gh / 2; sy += 16) {
            this.ctx.fillRect(obsX - gw / 2 + 2, sy, gw - 4, 5);
          }
          // Top cap
          this.ctx.fillStyle = '#1a252f';
          this.ctx.fillRect(obsX - gw / 2 - 2, topCenterY - gh / 2 - 2, gw + 4, 4);
          // Bottom gate half
          const botCenterY = midY + halfGap + gh / 2;
          const botGrad = this.ctx.createLinearGradient(obsX, botCenterY - gh / 2, obsX, botCenterY + gh / 2);
          botGrad.addColorStop(0, '#2c3e50');
          botGrad.addColorStop(0.6, '#5d6d7e');
          botGrad.addColorStop(1, '#2c3e50');
          this.ctx.fillStyle = botGrad;
          this.ctx.fillRect(obsX - gw / 2, botCenterY - gh / 2, gw, gh);
          // Bottom yellow warning stripes
          this.ctx.fillStyle = '#f1c40f';
          for (let sy = botCenterY - gh / 2 + 6; sy < botCenterY + gh / 2; sy += 16) {
            this.ctx.fillRect(obsX - gw / 2 + 2, sy, gw - 4, 5);
          }
          // Bottom cap
          this.ctx.fillStyle = '#1a252f';
          this.ctx.fillRect(obsX - gw / 2 - 2, botCenterY + gh / 2 - 2, gw + 4, 4);
          // Guide rails (vertical lines)
          this.ctx.shadowBlur = 0;
          this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([3, 5]);
          this.ctx.beginPath();
          this.ctx.moveTo(obsX - gw / 2 - 6, obs.topY || midY - 200);
          this.ctx.lineTo(obsX - gw / 2 - 6, obs.bottomY || midY + 200);
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.moveTo(obsX + gw / 2 + 6, obs.topY || midY - 200);
          this.ctx.lineTo(obsX + gw / 2 + 6, obs.bottomY || midY + 200);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
          // State indicator light
          const lightOn = obs.state === 'open' || obs.state === 'opening';
          this.ctx.shadowColor = lightOn ? 'rgba(46,204,113,0.5)' : 'rgba(231,76,60,0.5)';
          this.ctx.shadowBlur = lightOn ? 10 : 8;
          this.ctx.fillStyle = lightOn ? '#2ecc71' : '#e74c3c';
          this.ctx.beginPath();
          this.ctx.arc(obsX, midY, 4, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
          this.ctx.restore();
        } else if (obs.type === 'sweep_arm') {
          this.ctx.save();
          const armLen = obs.length || 120;
          const armAngle = obs.angle || 0;
          this.ctx.translate(obsX, obs.y);
          this.ctx.rotate(armAngle);
          // Pivot hub
          this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
          this.ctx.shadowBlur = 8;
          this.ctx.fillStyle = '#34495e';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
          // Arm bar
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 6;
          const armGrad = this.ctx.createLinearGradient(0, -4, 0, 4);
          armGrad.addColorStop(0, '#e67e22');
          armGrad.addColorStop(0.5, '#f39c12');
          armGrad.addColorStop(1, '#d35400');
          this.ctx.fillStyle = armGrad;
          this.ctx.fillRect(0, -4, armLen, 8);
          this.ctx.shadowBlur = 0;
          // Stripe pattern on arm
          this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
          for (let s = 10; s < armLen; s += 20) {
            this.ctx.fillRect(s, -4, 6, 8);
          }
          // End cap
          this.ctx.fillStyle = '#c0392b';
          this.ctx.beginPath();
          this.ctx.arc(armLen, 0, 6, 0, Math.PI * 2);
          this.ctx.fill();
          // Glow at tip
          this.ctx.shadowColor = 'rgba(231,76,60,0.5)';
          this.ctx.shadowBlur = 15;
          this.ctx.fillStyle = 'rgba(231,76,60,0.2)';
          this.ctx.beginPath();
          this.ctx.arc(armLen, 0, 12, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        } else if (obs.type === 'c_bumper') {
          // Rotating C-bumper ??? small semicircular arc like a pinball bumper
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
          // Top wall ??? yellow hazard stripe
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

        } else if (obs.type === 'hammer') {
          this.ctx.save();
          const hx = obs.headX - camX;
          const dx = obs.headX - obs.x;
          const dy = obs.headY - obs.y;
          const armLen = Math.hypot(dx, dy) || 1;
          const armAngle = Math.atan2(dy, dx);
          // Industrial arm
          this.ctx.save();
          this.ctx.translate(obsX, obs.y);
          this.ctx.rotate(armAngle);
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 6;
          const armGrad = this.ctx.createLinearGradient(0, -6, 0, 6);
          armGrad.addColorStop(0, '#2c3e50');
          armGrad.addColorStop(0.5, '#7f8c8d');
          armGrad.addColorStop(1, '#2c3e50');
          this.ctx.fillStyle = armGrad;
          this.ctx.fillRect(0, -6, armLen, 12);
          this.ctx.shadowBlur = 0;
          this.ctx.restore();
          // Dark metallic head
          const hSize = obs.headRadius;
          const hw = hSize * 1.0;
          const hh = hSize * 0.65;
          this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
          this.ctx.shadowBlur = 10;
          this.ctx.shadowOffsetY = 3;
          const metalGrad = this.ctx.createLinearGradient(hx - hw, obs.headY - hh, hx + hw, obs.headY + hh);
          metalGrad.addColorStop(0, '#34495e');
          metalGrad.addColorStop(0.3, '#5d6d7e');
          metalGrad.addColorStop(0.6, '#2c3e50');
          metalGrad.addColorStop(1, '#1a252f');
          this.ctx.fillStyle = metalGrad;
          this.ctx.beginPath();
          this.ctx.moveTo(hx - hw, obs.headY - hh);
          this.ctx.lineTo(hx + hw, obs.headY - hh);
          this.ctx.lineTo(hx + hw + 4, obs.headY);
          this.ctx.lineTo(hx + hw, obs.headY + hh);
          this.ctx.lineTo(hx - hw, obs.headY + hh);
          this.ctx.lineTo(hx - hw - 4, obs.headY);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.strokeStyle = '#1a252f';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          // Yellow warning stripe on head
          this.ctx.fillStyle = 'rgba(241,196,15,0.4)';
          this.ctx.fillRect(hx - hw * 0.6, obs.headY - hh * 0.6, hw * 1.2, hh * 0.25);
          this.ctx.shadowBlur = 0;
          this.ctx.restore();
        } else if (obs.type === 'punchfist') {
          this.ctx.save();
          const pX = obs.punchX - camX;
          const pR = obs.punchRadius || 30;
          const angle = obs.angle || 0;
          // Square mechanical box body
          const boxW = 40;
          const boxH = 46;
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 8;
          this.ctx.shadowOffsetY = 2;
          const boxGrad = this.ctx.createLinearGradient(obsX - boxW / 2, obs.y - boxH / 2, obsX + boxW / 2, obs.y + boxH / 2);
          boxGrad.addColorStop(0, '#566573');
          boxGrad.addColorStop(0.5, '#7f8c8d');
          boxGrad.addColorStop(1, '#34495e');
          this.ctx.fillStyle = boxGrad;
          this.ctx.fillRect(obsX - boxW / 2, obs.y - boxH / 2, boxW, boxH);
          this.ctx.strokeStyle = '#2c3e50';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(obsX - boxW / 2, obs.y - boxH / 2, boxW, boxH);
          this.ctx.shadowBlur = 0;
          // Piston rod along angle
          const cosA = Math.cos(angle), sinA = Math.sin(angle);
          const rodLen = Math.hypot(pX - obsX, obs.punchY - obs.y);
          if (rodLen > 2) {
            this.ctx.strokeStyle = '#95a5a6';
            this.ctx.lineWidth = 8;
            this.ctx.beginPath();
            this.ctx.moveTo(obsX + cosA * boxW / 2, obs.y + sinA * boxH / 2);
            this.ctx.lineTo(pX - cosA * pR * 0.5, obs.punchY - sinA * pR * 0.5);
            this.ctx.stroke();
            this.ctx.strokeStyle = '#7f8c8d';
            this.ctx.lineWidth = 10;
            for (let seg = 0; seg < Math.floor(rodLen / 15); seg++) {
              const sx = obsX + cosA * (boxW / 2 + seg * 15);
              const sy = obs.y + sinA * (boxH / 2 + seg * 15);
              this.ctx.beginPath();
              this.ctx.moveTo(sx - sinA * 6, sy + cosA * 6);
              this.ctx.lineTo(sx + sinA * 6, sy - cosA * 6);
              this.ctx.stroke();
            }
          }
          // Round punch head
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 10;
          this.ctx.shadowOffsetY = 2;
          const punchGrad = this.ctx.createRadialGradient(pX - pR * 0.2, obs.punchY - pR * 0.2, 2, pX, obs.punchY, pR);
          punchGrad.addColorStop(0, '#e74c3c');
          punchGrad.addColorStop(0.5, '#c0392b');
          punchGrad.addColorStop(1, '#922b21');
          this.ctx.fillStyle = punchGrad;
          this.ctx.beginPath();
          this.ctx.arc(pX, obs.punchY, pR, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = '#7f8c8d';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
          this.ctx.beginPath();
          this.ctx.arc(pX - cosA * pR * 0.25, obs.punchY - sinA * pR * 0.25, pR * 0.35, 0, Math.PI * 2);
          this.ctx.fill();
          if ((obs.state === 'extending' || obs.state === 'hold') && rodLen > 20) {
            this.ctx.shadowColor = 'rgba(231,76,60,0.4)';
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
            this.ctx.beginPath();
            this.ctx.arc(pX + cosA * 8, obs.punchY + sinA * 8, pR * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
          }
          this.ctx.restore();
        } else if (obs.type === 'trapdoor') {
          // Wall switcher: panel slides between blocking top and bottom
          const bounds = this.physics.getWallBoundaries(obs.x, this.track);
          const trackH = bounds.bottomY - bounds.topY;
          const gapH = 80; // 2.67?? ball diameter open gap
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
        } else if (obs.type === 'ice_cannon') {
          this.ctx.save();
          const cannonH = obs.cannonHeight || 50;
          const barrelLen = obs.barrelLength || 40;
          const baseY = obs.y + cannonH * 0.4;
          const barrelY = obs.y - cannonH * 0.2;
          const time = Date.now() * 0.001;
          this.ctx.fillStyle = 'rgba(200, 220, 240, 0.30)';
          this.ctx.beginPath();
          this.ctx.ellipse(obsX + 8, baseY + 4, 28, 8, 0, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = 'rgba(180, 210, 235, 0.25)';
          this.ctx.beginPath();
          this.ctx.ellipse(obsX - 6, baseY + 6, 22, 6, 0, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = 'rgba(180, 230, 255, 0.35)';
          this.ctx.lineWidth = 1.5;
          for (let ci = 0; ci < 5; ci++) {
            const cx = obsX - 18 + ci * 10 + Math.sin(time + ci) * 2;
            const cy = baseY - 2 + Math.cos(time * 0.5 + ci * 1.5) * 1;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx - 4, cy - 7);
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + 4, cy - 5);
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + 1, cy - 9);
            this.ctx.stroke();
          }
          const baseGrad = this.ctx.createLinearGradient(obsX - 22, baseY - cannonH * 0.5, obsX + 22, baseY);
          baseGrad.addColorStop(0, '#8fb5d4');
          baseGrad.addColorStop(0.3, '#b0d0e8');
          baseGrad.addColorStop(0.6, '#7a9bb8');
          baseGrad.addColorStop(1, '#5a7a95');
          this.ctx.shadowColor = 'rgba(0,0,0,0.25)';
          this.ctx.shadowBlur = 6;
          this.ctx.shadowOffsetY = 2;
          this.ctx.fillStyle = baseGrad;
          this.ctx.beginPath();
          this.ctx.roundRect(obsX - 22, baseY - cannonH * 0.5, 44, cannonH * 0.5, 4);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
          this.ctx.shadowOffsetY = 0;
          this.ctx.strokeStyle = 'rgba(70, 110, 140, 0.20)';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(obsX - 22, baseY - cannonH * 0.5, 44, cannonH * 0.5);
          this.ctx.fillStyle = 'rgba(70, 110, 140, 0.08)';
          for (let bi = 0; bi < 3; bi++) {
            this.ctx.fillRect(obsX - 16 + bi * 14, baseY - cannonH * 0.4 + 4, 8, 6);
          }
          const barrelGrad = this.ctx.createLinearGradient(obsX - barrelLen, barrelY - 10, obsX, barrelY + 10);
          barrelGrad.addColorStop(0, '#c8e0f0');
          barrelGrad.addColorStop(0.3, '#e0f0ff');
          barrelGrad.addColorStop(0.7, '#a0c8e0');
          barrelGrad.addColorStop(1, '#7090b0');
          this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
          this.ctx.shadowBlur = 4;
          this.ctx.shadowOffsetY = 1;
          this.ctx.fillStyle = barrelGrad;
          this.ctx.beginPath();
          this.ctx.roundRect(obsX - barrelLen, barrelY - 10, barrelLen, 20, 3);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
          this.ctx.shadowOffsetY = 0;
          this.ctx.strokeStyle = 'rgba(100, 160, 200, 0.20)';
          this.ctx.lineWidth = 1;
          for (let ri = 0; ri < 3; ri++) {
            const rx = obsX - barrelLen + 8 + ri * 12;
            this.ctx.beginPath();
            this.ctx.moveTo(rx, barrelY - 10);
            this.ctx.lineTo(rx, barrelY + 10);
            this.ctx.stroke();
          }
          const muzzleX = obsX - barrelLen;
          this.ctx.fillStyle = '#1a2a3a';
          this.ctx.beginPath();
          this.ctx.ellipse(muzzleX, barrelY, 4, 10, 0, 0, Math.PI * 2);
          this.ctx.fill();
          const muzzlePulse = 0.3 + Math.sin(time * 3) * 0.15;
          this.ctx.shadowColor = 'rgba(100, 200, 255, 0.4)';
          this.ctx.shadowBlur = 15;
          this.ctx.fillStyle = `rgba(120, 210, 255, ${muzzlePulse})`;
          this.ctx.beginPath();
          this.ctx.ellipse(muzzleX, barrelY, 3, 8, 0, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
          this.ctx.strokeStyle = 'rgba(150, 190, 220, 0.25)';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(obsX - 4, barrelY - 11);
          this.ctx.lineTo(obsX - 4, barrelY + 11);
          this.ctx.stroke();
          if (Math.sin(time * 1.7) > 0.92) {
            this.ctx.fillStyle = 'rgba(180, 220, 255, 0.06)';
            this.ctx.beginPath();
            this.ctx.ellipse(muzzleX - 8 - Math.sin(time * 2) * 5, barrelY + Math.cos(time * 1.3) * 3, 10, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
          }
          const iceFallPhase = time * 2;
          for (let pi = 0; pi < 3; pi++) {
            const px = obsX - 10 + pi * 12 + Math.sin(iceFallPhase + pi * 2) * 4;
            const py = barrelY - 14 - (pi * 3 + (time * 1.5 + pi * 7) % 16);
            const pSize = 1.5 + Math.sin(iceFallPhase + pi * 3) * 0.5;
            this.ctx.fillStyle = 'rgba(200, 235, 255, 0.35)';
            this.ctx.beginPath();
            this.ctx.arc(px, py, pSize, 0, Math.PI * 2);
            this.ctx.fill();
          }
          this.ctx.restore();
          if (obs._projectiles) {
            for (const proj of obs._projectiles) {
              if (proj._removed) continue;
              const projX = proj.x - camX;
              this.ctx.save();
              this.ctx.shadowColor = 'rgba(100, 200, 255, 0.6)';
              this.ctx.shadowBlur = 20;
              const shellGrad = this.ctx.createRadialGradient(projX - 3, proj.y - 3, 1, projX, proj.y, proj.radius);
              shellGrad.addColorStop(0, '#ffffff');
              shellGrad.addColorStop(0.3, '#d0ecff');
              shellGrad.addColorStop(0.6, '#80c0e8');
              shellGrad.addColorStop(1, '#4090b0');
              this.ctx.fillStyle = shellGrad;
              this.ctx.beginPath();
              this.ctx.arc(projX, proj.y, proj.radius, 0, Math.PI * 2);
              this.ctx.fill();
              this.ctx.shadowBlur = 0;
              this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              this.ctx.beginPath();
              this.ctx.arc(projX - 1, proj.y - 1, proj.radius * 0.5, 0, Math.PI * 2);
              this.ctx.fill();
              // Outer glow ring
              this.ctx.strokeStyle = 'rgba(180, 230, 255, 0.4)';
              this.ctx.lineWidth = 2;
              this.ctx.beginPath();
              this.ctx.arc(projX, proj.y, proj.radius + 3, 0, Math.PI * 2);
              this.ctx.stroke();
              this.ctx.fillStyle = 'rgba(200, 240, 255, 0.4)';
              for (let ti = 0; ti < 6; ti++) {
                const tx = projX + ti * 7 + (proj._trailPhase || 0);
                const ty = proj.y - 4 + ti * 2 + Math.sin(time * 5 + ti) * 2;
                this.ctx.beginPath();
                this.ctx.arc(tx, ty, 3 + Math.sin(time * 3 + ti) * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
              }
              this.ctx.fillStyle = 'rgba(180, 220, 250, 0.15)';
              for (let vi = 0; vi < 8; vi++) {
                const vx = projX + vi * 6 + 2;
                const vy = proj.y - 6 + vi * 2.5 + Math.sin(time * 2.5 + vi) * 4;
                this.ctx.beginPath();
                this.ctx.ellipse(vx, vy, 6 + vi * 0.5, 4, 0, 0, Math.PI * 2);
                this.ctx.fill();
              }
              this.ctx.restore();
            }
          }

        } else if (obs.type === 'collapsing_pillar') {
          // Collapsing Rock Pillar ??? Magma Crater exclusive volcanic obstacle
          const pState = obs._state || 'standing';
          const pCamX = obs.x - camX;
          const pSide = obs._wallSide || 'top';
          const pSeed = obs._seed || 0;
          const pDir = pSide === 'top' ? 1 : -1;

          this.ctx.save();

          if (pState === 'standing' || pState === 'warning') {
            const ph = obs._pillarHeight || 75;
            const pw = obs._pillarWidth || 20;
            const shakeX = pState === 'warning' ? (obs._shakeOffset || 0) : 0;
            const shakeY = pState === 'warning' ? Math.sin((obs._stateTimer || 0) * 0.7 + pSeed) * 1.5 : 0;
            const glowIntensity = pState === 'warning' ? Math.min(1, (obs._stateTimer || 0) / (obs._warningDuration || 60)) : 0;

            const baseY = obs.y;
            const tipY = obs.y + pDir * ph;

            this.ctx.translate(pCamX + shakeX, baseY + shakeY);

            const rockGrad = this.ctx.createLinearGradient(0, 0, 0, pDir * ph);
            rockGrad.addColorStop(0, '#1a1a1a');
            rockGrad.addColorStop(0.2, '#2a2520');
            rockGrad.addColorStop(0.5, '#3a3530');
            rockGrad.addColorStop(0.8, '#2a2520');
            rockGrad.addColorStop(1, '#1a1a1a');
            this.ctx.fillStyle = rockGrad;
            this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
            this.ctx.shadowBlur = 6;
            this.ctx.shadowOffsetY = pDir * 2;

            const segments = 6;
            this.ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
              const t = i / segments;
              const jitterW = (Math.sin(pSeed * 13 + i * 2.7 + pSeed * 0.5) - 0.5) * pw * 0.4;
              const jitterH = (Math.sin(pSeed * 7 + i * 1.3) - 0.5) * ph * 0.03;
              const xOff = jitterW;
              const yOff = t * ph * pDir + jitterH;
              if (i === 0) this.ctx.moveTo(xOff, yOff);
              else this.ctx.lineTo(xOff, yOff);
            }
            for (let i = segments; i >= 0; i--) {
              const t = i / segments;
              const jitterW = (Math.sin(pSeed * 13 + i * 2.7 + 100) - 0.5) * pw * 0.4;
              const jitterH = (Math.sin(pSeed * 7 + i * 1.3 + 50) - 0.5) * ph * 0.03;
              const xOff = jitterW;
              const yOff = t * ph * pDir + jitterH;
              this.ctx.lineTo(xOff, yOff);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;

            this.ctx.strokeStyle = 'rgba(60, 50, 40, 0.6)';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            const crackAlpha = pState === 'warning' ? 0.4 + glowIntensity * 0.5 : 0.3;
            this.ctx.shadowColor = '#ff4400';
            this.ctx.shadowBlur = pState === 'warning' ? 6 + glowIntensity * 10 : 4;
            for (let c = 0; c < 4; c++) {
              const cx = (Math.sin(pSeed * 5 + c * 3.1) - 0.5) * pw * 0.7;
              const cy = (Math.sin(pSeed * 11 + c * 2.3) + 0.5) * ph * 0.6 * pDir * 0.5 + ph * pDir * 0.3;
              const clen = 4 + Math.sin(pSeed * 3 + c * 1.7) * 3;
              this.ctx.strokeStyle = `rgba(255, ${100 + glowIntensity * 80}, 0, ${crackAlpha})`;
              this.ctx.lineWidth = 1.5 + Math.sin(pSeed + c) * 0.5;
              this.ctx.beginPath();
              this.ctx.moveTo(cx, cy);
              this.ctx.lineTo(cx + (Math.sin(pSeed * 2 + c * 1.1) - 0.5) * clen, cy + Math.sin(c) * clen * 0.5);
              this.ctx.stroke();
            }
            this.ctx.shadowBlur = 0;

            const smokeAlpha = pState === 'warning' ? 0.08 + glowIntensity * 0.08 : 0.06;
            this.ctx.fillStyle = `rgba(150, 140, 130, ${smokeAlpha})`;
            for (let s = 0; s < 3; s++) {
              const sx = (Math.sin(pSeed * 3 + s * 2.1 + performance.now() * 0.0005) - 0.5) * pw * 1.5;
              const sy = (Math.sin(pSeed * 7 + s * 1.3 + performance.now() * 0.0003) + 0.5) * ph * 0.4 * pDir + ph * pDir * 0.4;
              const sr = 4 + Math.sin(pSeed * 5 + s * 1.7 + performance.now() * 0.001) * 2;
              this.ctx.beginPath();
              this.ctx.arc(sx, sy, sr, 0, Math.PI * 2);
              this.ctx.fill();
            }

            if (pState === 'warning') {
              const pulseAlpha = 0.15 + 0.2 * Math.sin(performance.now() * 0.008 + pSeed);
              this.ctx.fillStyle = `rgba(255, 100, 0, ${pulseAlpha})`;
              this.ctx.shadowColor = '#ff4400';
              this.ctx.shadowBlur = 15;
              this.ctx.beginPath();
              this.ctx.arc(0, 0, pw * 0.8 + pulseAlpha * 10, 0, Math.PI * 2);
              this.ctx.fill();
              this.ctx.shadowBlur = 0;
            }

          } else if (pState === 'fallen' || pState === 'disappearing') {
            const fw = obs._fallenWidth || 70;
            const fh = obs._fallenHeight || 30;
            const fallProgress = obs._fallProgress || 1;
            const crumble = pState === 'disappearing' ? obs._crumbleProgress || 0 : 0;

            const baseY = obs.y;
            const visualWidth = fw * (1 - crumble * 0.3);
            const visualHeight = fh * (1 - crumble * 0.4);
            const visualAlpha = 1 - crumble * 0.7;

            this.ctx.globalAlpha = visualAlpha;

            const px = pCamX;
            const py = pSide === 'top' ? baseY : baseY - visualHeight;

            const rockGrad2 = this.ctx.createLinearGradient(px, py, px, py + visualHeight);
            rockGrad2.addColorStop(0, '#2a2520');
            rockGrad2.addColorStop(0.3, '#3a3530');
            rockGrad2.addColorStop(0.6, '#2a2018');
            rockGrad2.addColorStop(1, '#1a1510');
            this.ctx.fillStyle = rockGrad2;
            this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
            this.ctx.shadowBlur = 6;

            this.ctx.beginPath();
            const rSegs = 8;
            for (let i = 0; i <= rSegs; i++) {
              const t = i / rSegs;
              const jx = (Math.sin(pSeed * 7 + i * 2.3) - 0.5) * visualWidth * 0.15;
              const x = px - visualWidth / 2 + t * visualWidth + jx;
              const y = i % 2 === 0 ? py : py + visualHeight + (Math.sin(pSeed * 5 + i * 1.7) - 0.5) * visualHeight * 0.2;
              if (i === 0) this.ctx.moveTo(x, py);
              else this.ctx.lineTo(x, y);
            }
            for (let i = rSegs; i >= 0; i--) {
              const t = i / rSegs;
              const jx = (Math.sin(pSeed * 7 + i * 2.3 + 50) - 0.5) * visualWidth * 0.15;
              const x = px - visualWidth / 2 + t * visualWidth + jx;
              const y = i % 2 === 0 ? py + visualHeight : py + (Math.sin(pSeed * 5 + i * 1.7 + 30) - 0.5) * visualHeight * 0.2;
              if (i === rSegs) this.ctx.lineTo(x, py + visualHeight);
              else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            this.ctx.shadowColor = '#ff4400';
            this.ctx.shadowBlur = 8;
            for (let g = 0; g < 3; g++) {
              const gx = px - visualWidth * 0.3 + g * visualWidth * 0.3;
              const gy = py + visualHeight * 0.2 + (Math.sin(pSeed * 3 + g * 2.1) + 0.3) * visualHeight * 0.3;
              const gr = 3 + Math.sin(pSeed * 5 + g * 1.3) * 1.5;
              this.ctx.fillStyle = `rgba(255, ${100 + g * 40}, 0, ${0.5 - crumble * 0.3})`;
              this.ctx.beginPath();
              this.ctx.arc(gx, gy, gr, 0, Math.PI * 2);
              this.ctx.fill();
            }
            this.ctx.shadowBlur = 0;

            for (let r = 0; r < 4; r++) {
              const rx = px - visualWidth * 0.4 + (Math.sin(pSeed * 11 + r * 3.7) + 0.5) * visualWidth * 0.6;
              const ry = py + visualHeight + (Math.sin(pSeed * 13 + r * 1.1) + 0.5) * visualHeight * 0.3;
              const rr = 2 + Math.sin(pSeed * 3 + r * 2.3) * 1;
              this.ctx.fillStyle = `rgba(50, 45, 40, ${0.5 - crumble * 0.3})`;
              this.ctx.beginPath();
              this.ctx.arc(rx, ry, rr, 0, Math.PI * 2);
              this.ctx.fill();
            }

            if (pState === 'fallen') {
              this.ctx.fillStyle = `rgba(100, 90, 80, 0.06)`;
              for (let s = 0; s < 3; s++) {
                const sx = px - visualWidth * 0.3 + s * visualWidth * 0.3 + Math.sin(performance.now() * 0.002 + pSeed + s) * 5;
                const sy = py + (pSide === 'top' ? -5 - s * 4 : visualHeight + 5 + s * 4) + Math.sin(performance.now() * 0.003 + pSeed + s) * 2;
                const sr = 6 + Math.sin(performance.now() * 0.001 + pSeed + s) * 2;
                this.ctx.beginPath();
                this.ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                this.ctx.fill();
              }
            }

            this.ctx.globalAlpha = 1;
          }

          this.ctx.restore();
        } else if (obs.type === 'carnivorous_vine') {
          // ===== CARNIVOROUS VINE BASE PLANT RENDERING =====
          if (this.currentThemeKey !== 'jungle') return;
          
          const time = Date.now() * 0.001;
          const swayAmount = Math.sin(time * obs.swaySpeed + obs.swayPhase) * 0.15;
          const breathAmount = Math.sin(time * 0.8 + obs.breathPhase) * 0.02;
          
          const baseY = obs.y;
          const wallDir = obs.wallSide === 'top' ? 1 : -1;
          const vineLength = 85;
          const baseWidth = 14;
          const curvature = obs.curvature || 0;
          const leafCount = 4;
          const thornCount = 8;
          const leafOffsets = obs.leafOffsets || Array(leafCount).fill(0).map(() => Math.random() * Math.PI * 2);
          const thornOffsets = obs.thornOffsets || Array(thornCount).fill(0).map(() => Math.random() * Math.PI * 2);
          
          const segments = 10;
          const pathPoints = [];
          for (let s = 0; s <= segments; s++) {
            const t = s / segments;
            const sway = swayAmount * Math.sin(t * Math.PI) * vineLength * 0.25;
            const curve = curvature * Math.sin(t * Math.PI * 1.5) * vineLength * 0.15;
            const x = obsX + sway + curve;
            const y = baseY + wallDir * t * vineLength * (1 + breathAmount);
            const width = baseWidth * (1 - t * 0.7) * (1 + breathAmount * 0.3);
            pathPoints.push({ x, y, width, t });
          }
          
          this.ctx.save();
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';
          
          this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
          this.ctx.shadowBlur = 8;
          this.ctx.shadowOffsetY = 3;
          
          const vineGrad = this.ctx.createLinearGradient(obsX, baseY, obsX, baseY + wallDir * vineLength);
          vineGrad.addColorStop(0, '#1B3A1B');
          vineGrad.addColorStop(0.3, '#163016');
          vineGrad.addColorStop(0.6, '#102510');
          vineGrad.addColorStop(1, '#0A1A0A');
          
          this.ctx.strokeStyle = vineGrad;
          this.ctx.lineWidth = pathPoints[0].width;
          this.ctx.beginPath();
          this.ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
          for (let s = 1; s < pathPoints.length; s++) {
            this.ctx.lineTo(pathPoints[s].x, pathPoints[s].y);
          }
          this.ctx.stroke();
          
          this.ctx.shadowBlur = 0;
          this.ctx.strokeStyle = '#0D200D';
          this.ctx.lineWidth = Math.max(1, pathPoints[0].width * 0.08);
          for (let s = 0; s < pathPoints.length - 1; s += 2) {
            const p = pathPoints[s];
            const nextP = pathPoints[Math.min(s + 2, pathPoints.length - 1)];
            const cx = (p.x + nextP.x) * 0.5;
            const cy = (p.y + nextP.y) * 0.5;
            const angle = Math.atan2(nextP.y - p.y, nextP.x - p.x) + Math.PI * 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(cx + Math.cos(angle) * p.width * 0.4, cy + Math.sin(angle) * p.width * 0.4);
            this.ctx.lineTo(cx - Math.cos(angle) * p.width * 0.4, cy - Math.sin(angle) * p.width * 0.4);
            this.ctx.stroke();
          }
          
          this.ctx.fillStyle = '#1A4A1A';
          for (let m = 0; m < 3 + Math.floor(Math.random() * 2); m++) {
            const mp = pathPoints[Math.floor(Math.random() * pathPoints.length)];
            const mx = mp.x + (Math.random() - 0.5) * mp.width * 0.6;
            const my = mp.y + (Math.random() - 0.5) * mp.width * 0.6;
            this.ctx.beginPath();
            this.ctx.arc(mx, my, 2 + Math.random() * 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#245A24';
            this.ctx.beginPath();
            this.ctx.arc(mx - 0.5, my - 0.5, 1 + Math.random() * 1, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#1A4A1A';
          }
          
          for (let l = 0; l < leafCount; l++) {
            const progress = (l / leafCount) * 0.85 + 0.08;
            const pi = Math.floor(progress * (pathPoints.length - 1));
            const p = pathPoints[pi];
            const leafAngle = Math.sin(time * 1.2 + leafOffsets[l]) * 0.4 + (Math.random() - 0.5) * 0.5;
            const leafSize = 6 + Math.sin(leafOffsets[l]) * 2;
            
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(leafAngle + (wallDir > 0 ? 0 : Math.PI));
            
            this.ctx.fillStyle = '#0F2A0F';
            this.ctx.beginPath();
            this.ctx.ellipse(1, 1, leafSize, leafSize * 0.4, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#184818';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, leafSize, leafSize * 0.4, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#206020';
            this.ctx.beginPath();
            this.ctx.ellipse(-1, -1, leafSize * 0.55, leafSize * 0.2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#0D250D';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(-leafSize * 0.6, 0);
            this.ctx.lineTo(leafSize * 0.6, 0);
            this.ctx.stroke();
            
            this.ctx.strokeStyle = '#0D250D';
            this.ctx.lineWidth = 0.8;
            for (let v = 1; v <= 2; v++) {
              const vo = leafSize * 0.22 * v;
              this.ctx.beginPath();
              this.ctx.moveTo(-leafSize * 0.35, -vo);
              this.ctx.lineTo(leafSize * 0.35, vo);
              this.ctx.stroke();
              this.ctx.beginPath();
              this.ctx.moveTo(-leafSize * 0.35, vo);
              this.ctx.lineTo(leafSize * 0.35, -vo);
              this.ctx.stroke();
            }
            
            this.ctx.restore();
          }
          
          this.ctx.fillStyle = '#080808';
          for (let t = 0; t < thornCount; t++) {
            const progress = (t / thornCount) * 0.88 + 0.06;
            const pi = Math.floor(progress * (pathPoints.length - 1));
            const p = pathPoints[pi];
            const thornAngle = Math.sin(time * 1.0 + thornOffsets[t]) * 0.3;
            const thornSize = 4 + Math.sin(thornOffsets[t]) * 2;
            const side = (t % 2 === 0 ? 1 : -1) * (wallDir > 0 ? 1 : -1);
            
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(thornAngle);
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(side * thornSize, -thornSize * 0.35);
            this.ctx.lineTo(side * thornSize * 0.55, thornSize * 0.18);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.fillStyle = '#0C0C0C';
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(side * thornSize * 0.35, -thornSize * 0.18);
            this.ctx.lineTo(side * thornSize * 0.18, 0);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
          }
          
          this.ctx.restore();
        }
      
      });


      // Lava Shower ??? render molten lava chunks
      if (this._lavaChunks && this._lavaChunks.length > 0) {
        for (const chunk of this._lavaChunks) {
          const cX = chunk.x - camX;
          const r = chunk.radius;
          this.ctx.save();

          // Ember trail glow while falling
          const trailLen = Math.abs(chunk.vy) * 3;
          const trailGrad = this.ctx.createLinearGradient(cX, chunk.y - trailLen, cX, chunk.y);
          trailGrad.addColorStop(0, 'rgba(255, 100, 0, 0)');
          trailGrad.addColorStop(0.5, 'rgba(255, 80, 0, 0.15)');
          trailGrad.addColorStop(1, 'rgba(255, 60, 0, 0.35)');
          this.ctx.fillStyle = trailGrad;
          this.ctx.beginPath();
          this.ctx.moveTo(cX - r * 0.4, chunk.y);
          this.ctx.lineTo(cX + r * 0.4, chunk.y);
          this.ctx.lineTo(cX + r * 0.1, chunk.y - trailLen);
          this.ctx.lineTo(cX - r * 0.1, chunk.y - trailLen);
          this.ctx.closePath();
          this.ctx.fill();

          // Outer glow
          this.ctx.shadowColor = '#ff4400';
          this.ctx.shadowBlur = 20;

          // Main lava chunk body
          const chunkGrad = this.ctx.createRadialGradient(cX - r * 0.2, chunk.y - r * 0.2, 1, cX, chunk.y, r);
          chunkGrad.addColorStop(0, '#ffcc44');
          chunkGrad.addColorStop(0.3, '#ff8800');
          chunkGrad.addColorStop(0.6, '#cc4400');
          chunkGrad.addColorStop(0.85, '#662200');
          chunkGrad.addColorStop(1, '#331100');
          this.ctx.fillStyle = chunkGrad;

          // Jagged irregular shape
          this.ctx.beginPath();
          const segs = 8;
          for (let i = 0; i <= segs; i++) {
            const a = (i / segs) * Math.PI * 2;
            const jitter = (Math.sin(chunk._seed * 10 + i * 3.7) - 0.5) * r * 0.25;
            const rr = r + jitter;
            const px = cX + Math.cos(a) * rr;
            const py = chunk.y + Math.sin(a) * rr;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
          }
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.shadowBlur = 0;

          // Darker crust edge
          this.ctx.strokeStyle = 'rgba(30, 15, 5, 0.5)';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();

          // Bright core highlight
          const coreGrad = this.ctx.createRadialGradient(cX - r * 0.15, chunk.y - r * 0.15, 0, cX, chunk.y, r * 0.4);
          coreGrad.addColorStop(0, 'rgba(255, 220, 100, 0.6)');
          coreGrad.addColorStop(0.5, 'rgba(255, 150, 0, 0.3)');
          coreGrad.addColorStop(1, 'rgba(200, 50, 0, 0)');
          this.ctx.fillStyle = coreGrad;
          this.ctx.beginPath();
          this.ctx.arc(cX, chunk.y, r * 0.4, 0, Math.PI * 2);
          this.ctx.fill();

          // Molten glow cracks on surface
          this.ctx.shadowColor = '#ff6600';
          this.ctx.shadowBlur = 4;
          for (let c = 0; c < 3; c++) {
            const ca = (Math.sin(chunk._seed * 3 + c * 2.1) + 1) * Math.PI;
            const cd = r * 0.3 + Math.sin(chunk._seed * 7 + c * 1.3) * r * 0.2;
            const cx = cX + Math.cos(ca) * cd;
            const cy = chunk.y + Math.sin(ca) * cd;
            const cl = 2 + Math.sin(chunk._seed * 5 + c * 0.7) * 1.5;
            const ca2 = ca + 0.5 + Math.sin(chunk._seed + c) * 0.5;
            this.ctx.strokeStyle = 'rgba(255, 200, 50, 0.4)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + Math.cos(ca2) * cl, cy + Math.sin(ca2) * cl);
            this.ctx.stroke();
          }
          this.ctx.shadowBlur = 0;

          this.ctx.restore();
        }
      }


      // Draw Retractable Wall Icicles ??? natural ice formations on track boundaries
      if (this.track && this.track.obstacles) {
        this.track.obstacles.forEach(obs => {
          if (obs.type !== 'icicle') return;
          const _iCamX = obs.x - camX;
          const _iCullBuf = 300;
          if (_iCamX + 200 < -_iCullBuf || _iCamX - 200 > screenW / zoom + _iCullBuf) return;
          const _iLen = obs.length || 45;
          const _iBaseW = obs.baseWidth || 10;
          const _outDur = obs._outDur || 60;
          const _inDur = obs._inDur || 60;
          const _snap = obs._snapFrames || 6;
          const _t = ((obs._timer || 0) + (obs._phaseOffset || 0)) % (_outDur + _inDur);
          let _iProgress = 0;
          if (_t < _snap) {
            _iProgress = _t / _snap;
          } else if (_t < _outDur) {
            _iProgress = 1;
          } else if (_t < _outDur + _snap) {
            _iProgress = 1 - (_t - _outDur) / _snap;
          }
          if (_iProgress < 0.05) return;
          const _iDir = obs.wallSide === 'top' ? 1 : -1;
          const _iBaseY = obs.y;
          const _iTipX = _iCamX;
          const _iTipY = _iBaseY + _iDir * _iLen * 0.8 * _iProgress;
          const _iCurW = _iBaseW * (1 - _iProgress * 0.5);
          const _irreg = obs._irregularity || 0;
          this.ctx.save();
          // Bright icy glow when extended
          if (_iProgress > 0.5) {
            this.ctx.shadowColor = 'rgba(180, 240, 255, 0.50)';
            this.ctx.shadowBlur = 16;
          }
          // Organic icicle shape with bezier curves
          const _halfW = _iCurW * 0.5;
          const _midY = (_iBaseY + _iTipY) * 0.5;
          const icicleGrad = this.ctx.createLinearGradient(_iTipX, _iBaseY, _iTipX, _iTipY);
          icicleGrad.addColorStop(0, 'rgba(200, 235, 255, 0.80)');
          icicleGrad.addColorStop(0.3, 'rgba(180, 225, 250, 0.70)');
          icicleGrad.addColorStop(0.7, 'rgba(210, 245, 255, 0.65)');
          icicleGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
          this.ctx.fillStyle = icicleGrad;
          this.ctx.beginPath();
          this.ctx.moveTo(_iTipX - _halfW, _iBaseY);
          this.ctx.quadraticCurveTo(_iTipX - _halfW * 1.15 + _irreg, _midY, _iTipX, _iTipY);
          this.ctx.quadraticCurveTo(_iTipX + _halfW * 1.15 + _irreg, _midY, _iTipX + _halfW, _iBaseY);
          this.ctx.closePath();
          this.ctx.fill();
          // White edge outline
          this.ctx.shadowBlur = 0;
          this.ctx.strokeStyle = 'rgba(220, 240, 255, 0.50)';
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();
          // Bright white reflection highlight on one side
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
          this.ctx.beginPath();
          this.ctx.moveTo(_iTipX - _halfW * 0.3 + _irreg * 0.5, _iBaseY - 2);
          this.ctx.quadraticCurveTo(_iTipX - _halfW * 0.2 + _irreg * 0.5, _midY, _iTipX - 1, _iTipY + 3);
          this.ctx.quadraticCurveTo(_iTipX + _halfW * 0.2 + _irreg * 0.5, _midY, _iTipX + _halfW * 0.3 + _irreg * 0.5, _iBaseY - 2);
          this.ctx.closePath();
          this.ctx.fill();
this.ctx.restore();
        });
      }
    }

      // Draw Lava Geysers ??? Magma Crater exclusive volcanic hazard
      if (this.currentThemeKey === 'volcano' && this.track && this.track.obstacles) {
        this.track.obstacles.forEach(obs => {
          if (obs.type !== 'lava_geyser') return;
          const gCamX = obs.x - camX;
          const gCullBuf = 300;
          if (gCamX + 200 < -gCullBuf || gCamX - 200 > screenW / zoom + gCullBuf) return;
          
          const state = obs._state || 'hidden';
          const crackWidth = obs._crackWidth || 12;
          const crackHeight = obs.crackHeight || 60;
          const eruptionHeight = obs._eruptionHeight || 200;
          const eruptionWidth = obs._eruptionWidth || 30;
          const warningGlow = obs._warningGlow || 0;
          
          this.ctx.save();
          
          // ===== CRACK IN GROUND (always visible) =====
          const crackGrad = this.ctx.createLinearGradient(
            gCamX - crackWidth / 2, obs.y,
            gCamX + crackWidth / 2, obs.y
          );
          crackGrad.addColorStop(0, '#1a1008');
          crackGrad.addColorStop(0.3, '#2a1505');
          crackGrad.addColorStop(0.5, warningGlow > 0 ? `rgba(255, 100, 0, ${0.3 + warningGlow * 0.4})` : '#3a1a05');
          crackGrad.addColorStop(0.7, '#2a1505');
          crackGrad.addColorStop(1, '#1a1008');
          
          this.ctx.fillStyle = crackGrad;
          this.ctx.beginPath();
          // Irregular crack shape
          const crackSegments = 8;
          for (let i = 0; i <= crackSegments; i++) {
            const t = i / crackSegments;
            const angle = t * Math.PI * 2 - Math.PI / 2;
            const baseR = crackWidth / 2;
            const jitter = (Math.sin((obs._seed || 0) * 10 + i * 1.5) - 0.5) * 4;
            const r = baseR + jitter;
            const px = gCamX + Math.cos(angle) * r;
            const py = obs.y + Math.sin(angle) * crackHeight * 0.5;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
          }
          // Bottom of crack
          for (let i = crackSegments; i >= 0; i--) {
            const t = i / crackSegments;
            const angle = t * Math.PI * 2 + Math.PI / 2;
            const baseR = crackWidth / 2;
            const jitter = (Math.sin((obs._seed || 0) * 10 + i * 1.5 + 100) - 0.5) * 4;
            const r = baseR + jitter;
            const px = gCamX + Math.cos(angle) * r;
            const py = obs.y + Math.sin(angle) * crackHeight * 0.5;
            this.ctx.lineTo(px, py);
          }
          this.ctx.closePath();
          this.ctx.fill();
          
          // Crack glow when warning/erupting
          if (state === 'warning' || state === 'erupting') {
            this.ctx.strokeStyle = `rgba(255, 140, 0, ${0.5 + warningGlow * 0.5})`;
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = '#ff8800';
            this.ctx.shadowBlur = 8;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
          }
          
          // ===== ERUPTION COLUMN =====
          if (state === 'erupting') {
            const eruptionProgress = (obs._stateTimer || 0) / (obs._eruptionDuration || 60);
            const currentHeight = eruptionHeight * eruptionProgress;
            const currentWidth = eruptionWidth * (0.8 + 0.4 * Math.sin(performance.now() * 0.01));
            
            // Outer glow
            this.ctx.save();
            const eruptionGrad = this.ctx.createLinearGradient(
              gCamX, obs.y,
              gCamX, obs.y - currentHeight
            );
            eruptionGrad.addColorStop(0, 'rgba(255, 80, 0, 0.9)');
            eruptionGrad.addColorStop(0.3, 'rgba(255, 140, 0, 0.7)');
            eruptionGrad.addColorStop(0.6, 'rgba(255, 200, 50, 0.5)');
            eruptionGrad.addColorStop(1, 'rgba(255, 255, 100, 0.2)');
            
            this.ctx.fillStyle = eruptionGrad;
            this.ctx.shadowColor = '#ff8800';
            this.ctx.shadowBlur = 30;
            
            // Main column
            this.ctx.beginPath();
            this.ctx.moveTo(gCamX - currentWidth / 2, obs.y);
            this.ctx.lineTo(gCamX - currentWidth / 2 * 0.9, obs.y - currentHeight * 0.3);
            this.ctx.lineTo(gCamX - currentWidth / 2 * 0.7, obs.y - currentHeight * 0.7);
            this.ctx.lineTo(gCamX, obs.y - currentHeight);
            this.ctx.lineTo(gCamX + currentWidth / 2 * 0.7, obs.y - currentHeight * 0.7);
            this.ctx.lineTo(gCamX + currentWidth / 2 * 0.9, obs.y - currentHeight * 0.3);
            this.ctx.lineTo(gCamX + currentWidth / 2, obs.y);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Bright core
            const coreGrad = this.ctx.createLinearGradient(
              gCamX, obs.y,
              gCamX, obs.y - currentHeight
            );
            coreGrad.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
            coreGrad.addColorStop(0.5, 'rgba(255, 255, 150, 0.7)');
            coreGrad.addColorStop(1, 'rgba(255, 255, 100, 0.3)');
            
            this.ctx.fillStyle = coreGrad;
            this.ctx.beginPath();
            const coreWidth = currentWidth * 0.35;
            this.ctx.moveTo(gCamX - coreWidth / 2, obs.y);
            this.ctx.lineTo(gCamX - coreWidth / 2, obs.y - currentHeight * 0.8);
            this.ctx.lineTo(gCamX + coreWidth / 2, obs.y - currentHeight * 0.8);
            this.ctx.lineTo(gCamX + coreWidth / 2, obs.y);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            this.ctx.restore();
            
            // Heat shimmer above eruption
            this.ctx.save();
            this.ctx.globalAlpha = 0.15;
            this.ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
            this.ctx.lineWidth = 1;
            for (let h = 0; h < 3; h++) {
              const shimmerY = obs.y - currentHeight - 10 - h * 8;
              this.ctx.beginPath();
              for (let x = gCamX - currentWidth; x <= gCamX + currentWidth; x += 4) {
                const yy = shimmerY + Math.sin(x * 0.02 + performance.now() * 0.008 + h * 1.5) * (2 + h);
                if (x === gCamX - currentWidth) this.ctx.moveTo(x, yy);
                else this.ctx.lineTo(x, yy);
              }
              this.ctx.stroke();
            }
            this.ctx.globalAlpha = 1;
            this.ctx.restore();
          }
          
          // ===== WARNING PHASE GLOW =====
          if (state === 'warning') {
            const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.02);
            this.ctx.save();
            this.ctx.globalAlpha = pulse * 0.6;
            this.ctx.fillStyle = 'rgba(255, 140, 0, 0.4)';
            this.ctx.shadowColor = '#ff8800';
            this.ctx.shadowBlur = 20;
            this.ctx.beginPath();
            this.ctx.arc(gCamX, obs.y, crackWidth + 10, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.restore();
          }
          
          this.ctx.restore();
        });
      }

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

        // Cull only when fully outside viewport (must match obstacle buffer)
        if (bX + ball.radius < -400 || bX - ball.radius > screenW / zoom + 400) return;

        const renderRadius = ball.radius * (1 + ball.z * 0.05);

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

        // 3) Flag ball body ??? redesigned with professional lighting
        this.ctx.save();

        // --- Antialiasing via sub-pixel offset ---
        const aaX = Math.round(bX) + 0.5 - bX;
        const aaY = Math.round(ball.y) + 0.5 - ball.y;

        // Light direction: top-left (global consistent source)
        const lx = -0.3;
        const ly = -0.35;

        // Ball body with sub-pixel offset for smoother edges
        this.ctx.translate(aaX, aaY);

        // Shadow on ground (consistent with global light)
        this.ctx.save();
        const shadowScale = 1 + ball.z * 0.08;
        this.ctx.globalAlpha = 0.25 - ball.z * 0.025;
        this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
        this.ctx.shadowColor = 'rgba(0,0,0,0.25)';
        this.ctx.shadowBlur = 10 + ball.z * 2;
        this.ctx.beginPath();
        this.ctx.ellipse(bX, ball.y + renderRadius * 0.85 + ball.z * 1.5, renderRadius * shadowScale * 1.05, renderRadius * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
        this.ctx.clip();

        // Flag body
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

        // Subtle ambient occlusion ??? darker near edges opposite light
        const aoGrad = this.ctx.createRadialGradient(
          bX + renderRadius * 0.25, ball.y + renderRadius * 0.25, 0,
          bX, ball.y, renderRadius * 1.1
        );
        aoGrad.addColorStop(0, 'rgba(0,0,0,0)');
        aoGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
        aoGrad.addColorStop(0.85, 'rgba(0,0,0,0.12)');
        aoGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
        this.ctx.fillStyle = aoGrad;
        this.ctx.beginPath();
        this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Rim light ??? thin bright edge on light-facing side
        const rimGrad = this.ctx.createRadialGradient(
          bX + renderRadius * lx * 0.5, ball.y + renderRadius * ly * 0.5, renderRadius * 0.55,
          bX, ball.y, renderRadius
        );
        rimGrad.addColorStop(0, 'rgba(255,255,255,0)');
        rimGrad.addColorStop(0.75, 'rgba(255,255,255,0.03)');
        rimGrad.addColorStop(0.92, 'rgba(255,255,255,0.15)');
        rimGrad.addColorStop(1, 'rgba(255,255,255,0.25)');
        this.ctx.fillStyle = rimGrad;
        this.ctx.beginPath();
        this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Very subtle glossy reflection (tone down from previous)
        const glossyGrad = this.ctx.createRadialGradient(
          bX - renderRadius * 0.3, ball.y - renderRadius * 0.3, renderRadius * 0.05,
          bX, ball.y, renderRadius
        );
        glossyGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
        glossyGrad.addColorStop(0.25, 'rgba(255,255,255,0.08)');
        glossyGrad.addColorStop(0.6, 'rgba(255,255,255,0.02)');
        glossyGrad.addColorStop(0.85, 'rgba(0,0,0,0.05)');
        glossyGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
        this.ctx.fillStyle = glossyGrad;
        this.ctx.beginPath();
        this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Subtle specular dot (tone down, move with light direction)
        this.ctx.fillStyle = 'rgba(255,255,255,0.18)';
        this.ctx.beginPath();
        this.ctx.ellipse(
          bX + renderRadius * lx * 0.4,
          ball.y + renderRadius * ly * 0.4,
          renderRadius * 0.2, renderRadius * 0.1,
          -0.5, 0, Math.PI * 2
        );
        this.ctx.fill();

        this.ctx.restore();

        // Frost overlay when frozen by Ice Cannon
        if (ball._frozen) {
          this.ctx.save();
          const frostGrad = this.ctx.createRadialGradient(bX, ball.y, 0, bX, ball.y, renderRadius);
          frostGrad.addColorStop(0, 'rgba(160, 220, 255, 0.35)');
          frostGrad.addColorStop(0.5, 'rgba(100, 190, 240, 0.45)');
          frostGrad.addColorStop(1, 'rgba(60, 150, 220, 0.55)');
          this.ctx.fillStyle = frostGrad;
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
          this.ctx.fill();
          const crystalTime = Date.now() * 0.002;
          this.ctx.strokeStyle = 'rgba(180, 230, 255, 0.7)';
          this.ctx.lineWidth = 2;
          for (let ci = 0; ci < 8; ci++) {
            const ca = crystalTime + ci * Math.PI / 4;
            const cx = bX + Math.cos(ca) * renderRadius;
            const cy = ball.y + Math.sin(ca) * renderRadius;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + Math.cos(ca + 0.5) * 8, cy + Math.sin(ca + 0.5) * 8);
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + Math.cos(ca - 0.5) * 8, cy + Math.sin(ca - 0.5) * 8);
            this.ctx.stroke();
          }
          this.ctx.fillStyle = 'rgba(200, 240, 255, 0.55)';
          for (let pi = 0; pi < 6; pi++) {
            const px = bX + Math.sin(crystalTime * 2 + pi * 2) * renderRadius * 0.5;
            const py = ball.y + Math.cos(crystalTime * 3 + pi * 3) * renderRadius * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 2.5 + Math.sin(crystalTime + pi) * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
          }
          this.ctx.restore();
        }

        // Ice Ramp frozen overlay (Glacier Summit slow zone freeze)
        if (ball._iceRampFrozen) {
          this.ctx.save();
          const frostGrad = this.ctx.createRadialGradient(bX, ball.y, 0, bX, ball.y, renderRadius);
          frostGrad.addColorStop(0, 'rgba(180, 230, 255, 0.30)');
          frostGrad.addColorStop(0.5, 'rgba(140, 210, 240, 0.40)');
          frostGrad.addColorStop(1, 'rgba(100, 180, 220, 0.50)');
          this.ctx.fillStyle = frostGrad;
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
          this.ctx.fill();
          const crystalTime = Date.now() * 0.002;
          this.ctx.strokeStyle = 'rgba(200, 240, 255, 0.6)';
          this.ctx.lineWidth = 1.5;
          for (let ci = 0; ci < 6; ci++) {
            const ca = crystalTime + ci * Math.PI / 3;
            const cx = bX + Math.cos(ca) * renderRadius * 0.8;
            const cy = ball.y + Math.sin(ca) * renderRadius * 0.8;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + Math.cos(ca + 0.4) * 6, cy + Math.sin(ca + 0.4) * 6);
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + Math.cos(ca - 0.4) * 6, cy + Math.sin(ca - 0.4) * 6);
            this.ctx.stroke();
          }
          this.ctx.fillStyle = 'rgba(220, 245, 255, 0.5)';
          for (let pi = 0; pi < 4; pi++) {
            const px = bX + Math.sin(crystalTime * 2 + pi * 2.5) * renderRadius * 0.6;
            const py = ball.y + Math.cos(crystalTime * 3 + pi * 3.1) * renderRadius * 0.6;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 2 + Math.sin(crystalTime + pi) * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
          }
          this.ctx.restore();
        }

        // Blizzard frost overlay on balls (global event)
        if (this._blizzardActive && !ball.finished && !ball.eliminated) {
          this.ctx.save();
          const frostGrad = this.ctx.createRadialGradient(bX, ball.y, 0, bX, ball.y, renderRadius);
          frostGrad.addColorStop(0, 'rgba(190, 230, 255, 0.25)');
          frostGrad.addColorStop(0.6, 'rgba(150, 210, 240, 0.35)');
          frostGrad.addColorStop(1, 'rgba(100, 180, 220, 0.45)');
          this.ctx.fillStyle = frostGrad;
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
          this.ctx.fill();
          // Ice crystals
          const crystalTime = Date.now() * 0.002;
          this.ctx.strokeStyle = 'rgba(200, 240, 255, 0.5)';
          this.ctx.lineWidth = 1.5;
          for (let ci = 0; ci < 6; ci++) {
            const ca = crystalTime + ci * Math.PI / 3;
            const cx = bX + Math.cos(ca) * renderRadius * 0.75;
            const cy = ball.y + Math.sin(ca) * renderRadius * 0.75;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + Math.cos(ca + 0.4) * 5, cy + Math.sin(ca + 0.4) * 5);
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + Math.cos(ca - 0.4) * 5, cy + Math.sin(ca - 0.4) * 5);
            this.ctx.stroke();
          }
          // Snow trail particles behind the ball
          for (let pi = 0; pi < 3; pi++) {
            const tOff = pi * 0.3;
            const px = bX - ball.vx * (3 + tOff * 5);
            const py = ball.y - ball.vy * (3 + tOff * 5);
            const pAlpha = 0.3 - pi * 0.08;
            if (pAlpha > 0) {
              this.ctx.globalAlpha = pAlpha;
              this.ctx.fillStyle = '#ffffff';
              this.ctx.beginPath();
              this.ctx.arc(px, py, 2 - pi * 0.5, 0, Math.PI * 2);
              this.ctx.fill();
            }
          }
          this.ctx.globalAlpha = 1;
          this.ctx.restore();
        }

        // Lava Pool burn effect / Firestorm burn (Magma Crater exclusive)
        if (ball._lavaBurnActive || ball._firestormBurnActive) {
          this.ctx.save();
          const time = Date.now() * 0.001;
          const burnIntensity = 0.5 + 0.3 * Math.sin(time * 8);
          
          // Heavy scorch - darken flag texture by ~25% (more visible)
          this.ctx.globalCompositeOperation = 'multiply';
          this.ctx.fillStyle = 'rgba(15, 10, 5, 0.25)';
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.globalCompositeOperation = 'source-over';
          
          // Intense orange/red glow aura (multi-layer)
          const burnGrad = this.ctx.createRadialGradient(bX, ball.y, 0, bX, ball.y, renderRadius * 1.6);
          burnGrad.addColorStop(0, 'rgba(255, 160, 0, 0)');
          burnGrad.addColorStop(0.3, `rgba(255, 120, 0, ${0.35 * burnIntensity})`);
          burnGrad.addColorStop(0.6, `rgba(255, 60, 0, ${0.45 * burnIntensity})`);
          burnGrad.addColorStop(0.85, `rgba(255, 30, 0, ${0.35 * burnIntensity})`);
          burnGrad.addColorStop(1, `rgba(200, 20, 0, ${0.15 * burnIntensity})`);
          this.ctx.fillStyle = burnGrad;
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius * 1.6, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Inner core glow
          const coreGrad = this.ctx.createRadialGradient(bX, ball.y, 0, bX, ball.y, renderRadius * 0.8);
          coreGrad.addColorStop(0, `rgba(255, 200, 50, ${0.4 * burnIntensity})`);
          coreGrad.addColorStop(0.5, `rgba(255, 100, 0, ${0.25 * burnIntensity})`);
          coreGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
          this.ctx.fillStyle = coreGrad;
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius * 0.8, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Heat shimmer distortion rings
          this.ctx.strokeStyle = `rgba(255, 180, 60, ${0.3 * burnIntensity})`;
          this.ctx.lineWidth = 2;
          for (let si = 0; si < 4; si++) {
            const shimmerPhase = time * 12 + si * 1.5;
            this.ctx.beginPath();
            for (let a = 0; a <= Math.PI * 2; a += Math.PI / 8) {
              const r = renderRadius * (1.15 + 0.12 * Math.sin(shimmerPhase + a * 2.5));
              const sx = bX + Math.cos(a) * r;
              const sy = ball.y + Math.sin(a) * r;
              if (a === 0) this.ctx.moveTo(sx, sy);
              else this.ctx.lineTo(sx, sy);
            }
            this.ctx.closePath();
            this.ctx.stroke();
          }
          
          // Rising ember trail (more particles, better physics)
          const trailCount = 6;
          for (let ti = 0; ti < trailCount; ti++) {
            const tAge = ti / trailCount;
            const px = bX - ball.vx * (3 + tAge * 10);
            const py = ball.y - ball.vy * (3 + tAge * 10) + Math.sin(time * 10 + ti * 2) * 4;
            const pAlpha = (1 - tAge * 0.7) * 0.8 * burnIntensity;
            const pSize = (2 + tAge * 2.5) * burnIntensity;
            this.ctx.globalAlpha = pAlpha;
            const emberColors = ['#ff3300', '#ff5500', '#ff7700', '#ff9900', '#ffaa00', '#ffcc00'];
            this.ctx.fillStyle = emberColors[Math.floor(Math.random() * emberColors.length)];
            this.ctx.shadowColor = '#ff3300';
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(px, py, pSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
          }
          
          // Frequent tiny sparks flying off
          if (Math.random() < 0.15) {
            const sparkCount = 1 + Math.floor(Math.random() * 2);
            for (let sc = 0; sc < sparkCount; sc++) {
              const sx = bX + (Math.random() - 0.5) * renderRadius * 1.8;
              const sy = ball.y + (Math.random() - 0.5) * renderRadius * 1.8;
              this.ctx.globalAlpha = 1;
              this.ctx.fillStyle = '#fff8cc';
              this.ctx.shadowColor = '#ff6600';
              this.ctx.shadowBlur = 6;
              this.ctx.beginPath();
              this.ctx.arc(sx, sy, 1.5 + Math.random() * 1.5, 0, Math.PI * 2);
              this.ctx.fill();
              this.ctx.shadowBlur = 0;
            }
          }
          
          // Occasional larger flame burst
          if (Math.random() < 0.03) {
            for (let i = 0; i < 3; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = renderRadius * (0.8 + Math.random() * 0.6);
              const fx = bX + Math.cos(angle) * dist;
              const fy = ball.y + Math.sin(angle) * dist;
              this.ctx.globalAlpha = 0.7;
              this.ctx.fillStyle = '#ffaa00';
              this.ctx.shadowColor = '#ff4400';
              this.ctx.shadowBlur = 10;
              this.ctx.beginPath();
              this.ctx.arc(fx, fy, 3 + Math.random() * 2, 0, Math.PI * 2);
              this.ctx.fill();
              this.ctx.shadowBlur = 0;
            }
          }
          
          this.ctx.globalAlpha = 1;
          this.ctx.restore();
        }

        // Lava Geyser burn effect / Firestorm burn (Magma Crater exclusive)
        if (ball._geyserBurnActive || ball._firestormBurnActive) {
          this.ctx.save();
          const time = Date.now() * 0.001;
          const burnIntensity = 0.5 + 0.3 * Math.sin(time * 8);
          
          // Heavy scorch - darken flag texture by ~25% (more visible)
          this.ctx.globalCompositeOperation = 'multiply';
          this.ctx.fillStyle = 'rgba(15, 10, 5, 0.25)';
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.globalCompositeOperation = 'source-over';
          
          // Intense orange/red glow aura (multi-layer)
          const burnGrad = this.ctx.createRadialGradient(bX, ball.y, 0, bX, ball.y, renderRadius * 1.6);
          burnGrad.addColorStop(0, 'rgba(255, 160, 0, 0)');
          burnGrad.addColorStop(0.3, `rgba(255, 120, 0, ${0.35 * burnIntensity})`);
          burnGrad.addColorStop(0.6, `rgba(255, 60, 0, ${0.45 * burnIntensity})`);
          burnGrad.addColorStop(0.85, `rgba(255, 30, 0, ${0.35 * burnIntensity})`);
          burnGrad.addColorStop(1, `rgba(200, 20, 0, ${0.15 * burnIntensity})`);
          this.ctx.fillStyle = burnGrad;
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius * 1.6, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Inner core glow
          const coreGrad = this.ctx.createRadialGradient(bX, ball.y, 0, bX, ball.y, renderRadius * 0.8);
          coreGrad.addColorStop(0, `rgba(255, 200, 50, ${0.4 * burnIntensity})`);
          coreGrad.addColorStop(0.5, `rgba(255, 100, 0, ${0.25 * burnIntensity})`);
          coreGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
          this.ctx.fillStyle = coreGrad;
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius * 0.8, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Heat shimmer distortion rings
          this.ctx.strokeStyle = `rgba(255, 180, 60, ${0.3 * burnIntensity})`;
          this.ctx.lineWidth = 2;
          for (let si = 0; si < 4; si++) {
            const shimmerPhase = time * 12 + si * 1.5;
            this.ctx.beginPath();
            for (let a = 0; a <= Math.PI * 2; a += Math.PI / 8) {
              const r = renderRadius * (1.15 + 0.12 * Math.sin(shimmerPhase + a * 2.5));
              const sx = bX + Math.cos(a) * r;
              const sy = ball.y + Math.sin(a) * r;
              if (a === 0) this.ctx.moveTo(sx, sy);
              else this.ctx.lineTo(sx, sy);
            }
            this.ctx.closePath();
            this.ctx.stroke();
          }
          
          // Rising ember trail (more particles, better physics)
          const trailCount = 6;
          for (let ti = 0; ti < trailCount; ti++) {
            const tAge = ti / trailCount;
            const px = bX - ball.vx * (3 + tAge * 10);
            const py = ball.y - ball.vy * (3 + tAge * 10) + Math.sin(time * 10 + ti * 2) * 4;
            const pAlpha = (1 - tAge * 0.7) * 0.8 * burnIntensity;
            const pSize = (2 + tAge * 2.5) * burnIntensity;
            this.ctx.globalAlpha = pAlpha;
            const emberColors = ['#ff3300', '#ff5500', '#ff7700', '#ff9900', '#ffaa00', '#ffcc00'];
            this.ctx.fillStyle = emberColors[Math.floor(Math.random() * emberColors.length)];
            this.ctx.shadowColor = '#ff3300';
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(px, py, pSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
          }
          
          // Frequent tiny sparks flying off
          if (Math.random() < 0.15) {
            const sparkCount = 1 + Math.floor(Math.random() * 2);
            for (let sc = 0; sc < sparkCount; sc++) {
              const sx = bX + (Math.random() - 0.5) * renderRadius * 1.8;
              const sy = ball.y + (Math.random() - 0.5) * renderRadius * 1.8;
              this.ctx.globalAlpha = 1;
              this.ctx.fillStyle = '#fff8cc';
              this.ctx.shadowColor = '#ff6600';
              this.ctx.shadowBlur = 6;
              this.ctx.beginPath();
              this.ctx.arc(sx, sy, 1.5 + Math.random() * 1.5, 0, Math.PI * 2);
              this.ctx.fill();
              this.ctx.shadowBlur = 0;
            }
          }
          
          // Occasional larger flame burst
          if (Math.random() < 0.03) {
            for (let i = 0; i < 3; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = renderRadius * (0.8 + Math.random() * 0.6);
              const fx = bX + Math.cos(angle) * dist;
              const fy = ball.y + Math.sin(angle) * dist;
              this.ctx.globalAlpha = 0.7;
              this.ctx.fillStyle = '#ffaa00';
              this.ctx.shadowColor = '#ff4400';
              this.ctx.shadowBlur = 10;
              this.ctx.beginPath();
              this.ctx.arc(fx, fy, 3 + Math.random() * 2, 0, Math.PI * 2);
              this.ctx.fill();
              this.ctx.shadowBlur = 0;
            }
          }
          
          this.ctx.globalAlpha = 1;
          this.ctx.restore();
        }

        // Lava Shower burn effect / Firestorm burn
        if (ball._showerBurnActive || ball._firestormBurnActive) {
          this.ctx.save();
          const time = Date.now() * 0.001;
          const burnIntensity = 0.5 + 0.3 * Math.sin(time * 8);

          // Scorched appearance - darken flag texture
          this.ctx.globalCompositeOperation = 'multiply';
          this.ctx.fillStyle = 'rgba(20, 10, 5, 0.30)';
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.globalCompositeOperation = 'source-over';

          // Orange/red glow aura
          const burnGrad = this.ctx.createRadialGradient(bX, ball.y, 0, bX, ball.y, renderRadius * 1.6);
          burnGrad.addColorStop(0, 'rgba(255, 140, 0, 0)');
          burnGrad.addColorStop(0.3, `rgba(255, 120, 0, ${0.30 * burnIntensity})`);
          burnGrad.addColorStop(0.6, `rgba(255, 50, 0, ${0.40 * burnIntensity})`);
          burnGrad.addColorStop(0.85, `rgba(200, 20, 0, ${0.30 * burnIntensity})`);
          burnGrad.addColorStop(1, `rgba(150, 10, 0, ${0.12 * burnIntensity})`);
          this.ctx.fillStyle = burnGrad;
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius * 1.6, 0, Math.PI * 2);
          this.ctx.fill();

          // Inner glow
          const coreGrad = this.ctx.createRadialGradient(bX, ball.y, 0, bX, ball.y, renderRadius * 0.8);
          coreGrad.addColorStop(0, `rgba(255, 180, 30, ${0.35 * burnIntensity})`);
          coreGrad.addColorStop(0.5, `rgba(255, 80, 0, ${0.20 * burnIntensity})`);
          coreGrad.addColorStop(1, 'rgba(200, 30, 0, 0)');
          this.ctx.fillStyle = coreGrad;
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius * 0.8, 0, Math.PI * 2);
          this.ctx.fill();

          // Rising embers
          const trailCount = 4;
          for (let ti = 0; ti < trailCount; ti++) {
            const tAge = ti / trailCount;
            const px = bX - ball.vx * (2 + tAge * 8);
            const py = ball.y - ball.vy * (2 + tAge * 8) + Math.sin(time * 10 + ti * 2) * 3;
            const pAlpha = (1 - tAge * 0.7) * 0.7 * burnIntensity;
            const pSize = (1.5 + tAge * 2) * burnIntensity;
            this.ctx.globalAlpha = pAlpha;
            this.ctx.fillStyle = ['#ff4400', '#ff6600', '#ff8800'][ti % 3];
            this.ctx.shadowColor = '#ff4400';
            this.ctx.shadowBlur = 6;
            this.ctx.beginPath();
            this.ctx.arc(px, py, pSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
          }

          // Tiny sparks
          if (Math.random() < 0.12) {
            const sx = bX + (Math.random() - 0.5) * renderRadius * 1.5;
            const sy = ball.y + (Math.random() - 0.5) * renderRadius * 1.5;
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = '#ffcc44';
            this.ctx.shadowColor = '#ff6600';
            this.ctx.shadowBlur = 5;
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, 1 + Math.random() * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
          }

          this.ctx.globalAlpha = 1;
          this.ctx.restore();
        }

        // Aurora Borealis faint reflection on balls
        if (this._auroraActive && !ball.finished && !ball.eliminated) {
          const fade = this._auroraFadeProgress;
          const dc = this._auroraDominantColor;
          this.ctx.save();
          this.ctx.globalAlpha = 0.15 * fade;
          this.ctx.fillStyle = `rgba(${dc.r|0},${dc.g|0},${dc.b|0},0.15)`;
          this.ctx.shadowColor = `rgba(${dc.r|0},${dc.g|0},${dc.b|0},${0.25 * fade})`;
          this.ctx.shadowBlur = 18;
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }

        // Winner glow during flash sequence
        if (this._winnerFlashActive && this._winnerFlashBall && ball.id === this._winnerFlashBall.id) {
          this.ctx.save();
          const pulseAlpha = 0.2 + 0.15 * Math.sin(performance.now() * 0.008);
          this.ctx.shadowColor = '#ffd700';
          this.ctx.shadowBlur = 50;
          this.ctx.fillStyle = `rgba(255,215,0,${pulseAlpha})`;
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius + 12, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }

        // 4) Country label (with auto text contrast)
        this.ctx.save();
        const tColors = getThemeColors(this.currentThemeKey);
        this.ctx.font = 'bold 9px Montserrat, sans-serif';
        this.ctx.textAlign = 'center';

        if (ball.eliminated) {
          this.ctx.fillStyle = '#e74c3c';
          this.ctx.shadowColor = '#000000';
          this.ctx.shadowBlur = 4;
          this.ctx.lineWidth = 2.5;
          this.ctx.strokeStyle = '#000000';
          this.ctx.strokeText('ELIMINATED', bX, ball.y + renderRadius + 11);
          this.ctx.fillText('ELIMINATED', bX, ball.y + renderRadius + 11);
        } else {
          let labelName = ball.name;
          if (labelName.length > 12) labelName = labelName.substring(0, 10) + '..';
          const displayLabel = `${ball.rank}. ${labelName}`;
          if (ball.isCustom) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 6;
            this.ctx.lineWidth = 2.5;
            this.ctx.strokeStyle = '#000000';
            this.ctx.strokeText(displayLabel, bX, ball.y + renderRadius + 11);
          } else {
            this.ctx.fillStyle = tColors.primary;
            this.ctx.shadowColor = this.currentThemeKey && MAP_THEMES[this.currentThemeKey].isDark ? '#000000' : 'rgba(255,255,255,0.5)';
            this.ctx.shadowBlur = 4;
            this.ctx.lineWidth = 2.5;
            this.ctx.strokeStyle = this.currentThemeKey && MAP_THEMES[this.currentThemeKey].isDark ? '#000000' : 'transparent';
            this.ctx.strokeText(displayLabel, bX, ball.y + renderRadius + 11);
          }
          this.ctx.fillText(displayLabel, bX, ball.y + renderRadius + 11);
        }

        this.ctx.restore();

        // 5) Top-3 colored ring (position indicator)
        if (ball.rank <= 3 && !ball.finished) {
          this.ctx.save();
          const ringColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
          this.ctx.strokeStyle = ringColors[ball.rank - 1];
          this.ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.004 + ball.rank) * 0.1;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(bX, ball.y, renderRadius + 3, 0, Math.PI * 2);
          this.ctx.stroke();
          this.ctx.restore();
        }

        // 6) Leader crown ??? gold star above 1st place
        if (ball.rank === 1 && !ball.finished) {
          this.ctx.save();
          const crownY = ball.y - renderRadius - 18;
          const pulse = Math.sin(Date.now() * 0.005) * 0.08 + 0.92;
          this.ctx.translate(bX, crownY);
          this.ctx.scale(pulse, pulse);
          this.ctx.shadowColor = '#ffd700';
          this.ctx.shadowBlur = 20;
          // Gold star shape
          this.ctx.fillStyle = '#ffd700';
          this.ctx.beginPath();
          const spikes = 5;
          const outerR = 9;
          const innerR = 4;
          for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            i === 0 ? this.ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r) : this.ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.restore();
        }
});
      
      // ===== CARNIVOROUS VINE WRAPPING PASS (renders ABOVE balls) =====
      if (this.currentThemeKey === 'jungle' && this.track && this.track.obstacles) {
        this.track.obstacles.forEach(obs => {
          if (obs.type !== 'carnivorous_vine') return;
          if (obs.captureState !== 'capturing' && obs.captureState !== 'capturing_hold' && obs.captureState !== 'releasing') return;
          
          const obsX = obs.x - camX;
          const obsCullBuffer = Math.max(300, 400 / this.userZoomMultiplier);
          if (obsX + 200 < -obsCullBuffer || obsX - 200 > screenW / zoom + obsCullBuffer) return;
          
          const ball = this.balls ? this.balls.find(b => b.id === obs.captureBallId) : null;
          if (!ball) return;
          
          const time = Date.now() * 0.001;
          const ballX = ball.x - camX;
          const ballY = ball.y;
          const ballR = ball.radius;
          const baseX = obsX;
          const baseY = obs.y;
          const wallDir = obs.wallSide === 'top' ? 1 : -1;
          const vineLength = obs.length || 120;
          const baseWidth = obs.baseWidth || 10;
          const swayAmount = Math.sin(time * obs.swaySpeed + obs.swayPhase) * 0.15;
          const vineCenterX = baseX + swayAmount * vineLength * 0.5;
          const vineCenterY = baseY + wallDir * vineLength * 0.4;
          const progress = obs.captureProgress || 0;
          const holdProgress = obs.captureState === 'capturing_hold' ? 1 : progress;
          
          this.ctx.save();
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';
          
          // Main wrapping vines - thick, dark, visible
          const segments = obs.wrapSegments || [];
          const maxLayers = obs.captureState === 'capturing_hold' ? 5 : Math.max(2, Math.floor(holdProgress * 5));
          
          for (let s = 0; s < segments.length; s++) {
            const seg = segments[s];
            const segProgress = holdProgress * seg.progress;
            const wrapAngle = seg.angle + time * 4 * (1 - holdProgress * 0.3) + seg.phase;
            const currentRadius = ballR * (0.75 + holdProgress * 0.5) * (1 - segProgress * 0.25);
            
            for (let layer = 0; layer < maxLayers; layer++) {
              const layerOffset = (layer / maxLayers) * Math.PI * 2;
              const radius = currentRadius * (0.8 + layer * 0.08);
              const startAngle = wrapAngle + layerOffset;
              const endAngle = startAngle + Math.PI * 1.8 * holdProgress;
              
              // Vine colors - opaque, visible
              const vineColors = ['#5A3A22', '#4A2E18', '#3A2414', '#2A1A0E', '#1A120A'];
              this.ctx.strokeStyle = vineColors[Math.min(layer, vineColors.length - 1)];
              this.ctx.lineWidth = Math.max(3, baseWidth * (0.7 - layer * 0.1) * holdProgress);
              this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
              this.ctx.shadowBlur = 8;
              
              this.ctx.beginPath();
              this.ctx.arc(ballX, ballY, radius, startAngle, endAngle);
              this.ctx.stroke();
              
              // Leaves on wraps (only during hold)
              if (obs.captureState === 'capturing_hold' && Math.random() < 0.4) {
                this.ctx.fillStyle = '#154D22';
                const leafAngle = (startAngle + endAngle) * 0.5 + (Math.random() - 0.5) * 0.3;
                const lx = ballX + Math.cos(leafAngle) * radius;
                const ly = ballY + Math.sin(leafAngle) * radius;
                this.ctx.beginPath();
                this.ctx.ellipse(lx, ly, 5, 2.5, leafAngle, 0, Math.PI * 2);
                this.ctx.fill();
              }
              
              // Thorns on wraps
              if (obs.captureState === 'capturing_hold' && Math.random() < 0.2) {
                this.ctx.fillStyle = '#0A0A0A';
                const thornAngle = (startAngle + endAngle) * 0.5 + Math.random() * 0.2;
                const tx = ballX + Math.cos(thornAngle) * radius;
                const ty = ballY + Math.sin(thornAngle) * radius;
                this.ctx.beginPath();
                this.ctx.moveTo(tx, ty);
                this.ctx.lineTo(tx + Math.cos(thornAngle) * 6, ty + Math.sin(thornAngle) * 6);
                this.ctx.stroke();
              }
            }
          }
          
          // Squeeze overlay on ball
          if (obs.captureState === 'capturing_hold') {
            // Dark vine squeeze
            this.ctx.fillStyle = 'rgba(26, 30, 18, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(ballX, ballY, ballR * 0.92, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Pulsing highlight
            const squeezeAlpha = 0.2 + Math.sin(time * 5) * 0.1;
            this.ctx.fillStyle = `rgba(70, 90, 45, ${squeezeAlpha})`;
            this.ctx.beginPath();
            this.ctx.arc(ballX, ballY, ballR * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Tightening ring
            this.ctx.strokeStyle = '#3A2A14';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(ballX, ballY, ballR * 0.95 + Math.sin(time * 4) * 1.5, 0, Math.PI * 2);
            this.ctx.stroke();
          }
          
          // Release unwind animation
          if (obs.captureState === 'releasing') {
            this.ctx.strokeStyle = '#4A2E18';
            this.ctx.lineWidth = Math.max(2, baseWidth * 0.6 * progress);
            this.ctx.globalAlpha = progress;
            
            for (let layer = 0; layer < 3; layer++) {
              const layerOffset = (layer / 3) * Math.PI * 2;
              const radius = ballR * (0.9 + layer * 0.1) * progress;
              const startAngle = time * 2 + layerOffset;
              const endAngle = startAngle + Math.PI * 1.5 * progress;
              
              this.ctx.beginPath();
              this.ctx.arc(ballX, ballY, radius, startAngle, endAngle);
              this.ctx.stroke();
            }
            
            // Falling leaf particles
            this.ctx.fillStyle = '#1E5C2A';
            for (let p = 0; p < 10; p++) {
              const angle = (p / 10) * Math.PI * 2 + time * 3;
              const dist = ballR + (1 - progress) * 40;
              const px = ballX + Math.cos(angle) * dist;
              const py = ballY + Math.sin(angle) * dist;
              this.ctx.beginPath();
              this.ctx.arc(px, py, 2.5 + Math.random() * 2, 0, Math.PI * 2);
              this.ctx.fill();
            }
            
            this.ctx.globalAlpha = 1;
          }
          
          this.ctx.restore();
        });
      }

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
          const sparkColor = p.color || '#ffd700';
          this.ctx.fillStyle = sparkColor;
          this.ctx.shadowColor = sparkColor;
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

      // Director Mode teleport flash on balls
      if (this._directorFlashBalls.length > 0) {
        this._directorFlashBalls = this._directorFlashBalls.filter(f => f.timer > 0);
        this._directorFlashBalls.forEach(f => {
          const ball = this.balls.find(b => b.id === f.id);
          if (!ball) return;
          const bx = ball.x - camX;
          const by = ball.y;
          const alpha = f.timer / 18;
          this.ctx.save();
          this.ctx.globalAlpha = alpha * 0.6;
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          this.ctx.arc(bx, by, ball.radius * 1.2, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.globalAlpha = alpha * 0.3;
          this.ctx.shadowColor = '#60a5fa';
          this.ctx.shadowBlur = 20;
          this.ctx.beginPath();
          this.ctx.arc(bx, by, ball.radius * 0.8, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
          this.ctx.restore();
          f.timer -= 1;
        });
      }

      // Teleportation warning glow on selected balls
      if (this._teleportState === 'warning') {
        this._teleportPairs.forEach(pair => {
          [pair.ball1, pair.ball2].forEach(ball => {
            const bx = ball.x - camX;
            const by = ball.y;
            // White glow ring
            const glowAlpha = 0.3 + 0.3 * Math.sin(performance.now() * 0.008);
            this.ctx.save();
            this.ctx.shadowColor = '#88ccff';
            this.ctx.shadowBlur = 25;
            this.ctx.strokeStyle = `rgba(136, 204, 255, ${glowAlpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(bx, by, ball.radius + 6, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            // "SWITCHING..." text
            this.ctx.fillStyle = '#88ccff';
            this.ctx.font = 'bold 11px Montserrat, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText('SWITCHING...', bx, by - ball.radius - 10);
            this.ctx.restore();
          });
        });
      }

      } finally { this.ctx.restore(); }

      // Full screen UI overlays (canvas overlay space)
      // Wrapped in save/restore with try/finally to absorb any unbalanced ctx saves
      this.ctx.save();
      try {
        this.renderScreenOverlays(screenW, screenH);
      } finally {
        this.ctx.restore();
      }

      // Director Mode overlay (tiny, bottom-left, semi-transparent)
      if (this.directorMode) {
        this._renderDirectorOverlay(screenW, screenH);
      }
    } catch (e) {
      console.warn('Render error:', e.message);
    }}

    // Draw map-specific animated background elements ??? parallax stadium scene
    renderDynamicBackground(screenW, screenH) {
      const ctx = this.ctx;
      const theme = this.currentThemeKey;
      if (!theme) return;
      const time = Date.now() / 1000;

      // ---- LAYER 1: Deep background gradient (ambient light) ----
      // Skipped for jungle ??? no fullscreen overlays; background uses individual elements only
      if (theme !== 'jungle') {
        ctx.save();
        const ambGrad = ctx.createRadialGradient(screenW * 0.5, screenH * 0.3, 0, screenW * 0.5, screenH * 0.3, screenH * 1.2);
        ambGrad.addColorStop(0, 'rgba(255,255,255,0.03)');
        ambGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ambGrad;
        ctx.fillRect(0, 0, screenW, screenH);
        ctx.restore();
      }

      // ---- LAYER 2: Crowd silhouettes (low contrast, support the race, never compete) ----
      ctx.save();
      ctx.globalAlpha = 0.07;
      const crowdWave = Math.sin(time * 0.8) * 2;
      ctx.fillStyle = '#050508';
      for (let i = 0; i < 30; i++) {
        const cx = (i / 30) * screenW + Math.sin(time * 0.5 + i * 1.2) * 4;
        const cy = screenH - 40 + Math.sin(time * 0.6 + i * 0.7) * 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy + crowdWave, 10, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(cx - 6, cy + 2, 12, 12);
      }
      ctx.globalAlpha = 0.04;
      for (let i = 0; i < 25; i++) {
        const cx = ((i + 0.5) / 25) * screenW + Math.sin(time * 0.4 + i * 1.5) * 3;
        const cy = screenH - 68 + Math.sin(time * 0.5 + i * 0.9) * 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(cx - 5, cy + 2, 10, 10);
      }
      ctx.restore();

      // ---- LAYER 3: Focus gradient ??? saturate near track, darken edges ----
      // Skipped for jungle ??? no fullscreen overlays
      if (theme !== 'jungle') {
        ctx.save();
        const focusGrad = ctx.createRadialGradient(screenW * 0.5, screenH * 0.5, screenH * 0.15, screenW * 0.5, screenH * 0.5, screenH * 0.7);
        focusGrad.addColorStop(0, 'rgba(0,0,0,0)');
        focusGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
        focusGrad.addColorStop(0.85, 'rgba(0,0,0,0.04)');
        focusGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.fillStyle = focusGrad;
        ctx.fillRect(0, 0, screenW, screenH);
        ctx.restore();
      }

      // ---- LAYER 4: Map-specific atmospheric effects (reduced opacity) ----
      if (theme === 'desert') {
        ctx.save();
        ctx.fillStyle = 'rgba(186, 74, 0, 0.04)';
        for (let i = 0; i < 5; i++) {
          const dx = (i * screenW / 5 + Math.sin(time * 0.015 + i) * 30) % screenW;
          const dh = 50 + Math.sin(i * 2.1 + time * 0.08) * 20;
          ctx.beginPath();
          ctx.moveTo(dx - 140, screenH);
          ctx.quadraticCurveTo(dx, screenH - dh, dx + 140, screenH);
          ctx.fill();
        }
        ctx.restore();
      } else if (theme === 'snow') {
        // ========== AURORA BOREALIS EVENT: Full-sky aurora curtain ==========
        if (this._auroraActive) {
          const fade = this._auroraFadeProgress;
          const pulse = this._auroraPulseValue;
          const totalAlpha = fade * (1 + pulse);
          const dc = this._auroraDominantColor;

          // Darken upper sky (deep Arctic night)
          ctx.save();
          const skyGrad = ctx.createLinearGradient(0, 0, 0, screenH * 0.55);
          skyGrad.addColorStop(0, `rgba(3, 6, 20, ${0.60 * fade})`);
          skyGrad.addColorStop(0.4, `rgba(5, 10, 30, ${0.30 * fade})`);
          skyGrad.addColorStop(0.7, `rgba(8, 15, 35, ${0.10 * fade})`);
          skyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = skyGrad;
          ctx.fillRect(0, 0, screenW, screenH * 0.55);
          ctx.restore();

          // Stars with enhanced visibility
          for (const star of this._auroraStars) {
            const sx = star.x * screenW;
            const sy = star.y * screenH;
            const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
            ctx.globalAlpha = (0.45 + 0.55 * twinkle) * fade;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
            ctx.fill();
            if (twinkle > 0.9) {
              ctx.globalAlpha = (twinkle - 0.9) * 0.30 * fade;
              ctx.shadowColor = '#ffffff';
              ctx.shadowBlur = 12;
              ctx.beginPath();
              ctx.arc(sx, sy, star.size * 2.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }
          ctx.globalAlpha = 1;

          // Aurora curtain layers
          const auroraTime = time * 0.15;
          const colorStops = [
            { pos: 0.00, r: 75, g: 235, b: 140 },
            { pos: 0.20, r: 60, g: 220, b: 205 },
            { pos: 0.40, r: 85, g: 185, b: 255 },
            { pos: 0.60, r: 155, g: 130, b: 250 },
            { pos: 0.80, r: 220, g: 125, b: 210 },
            { pos: 1.00, r: 75, g: 235, b: 140 },
          ];
          const makeGradient = (alpha) => {
            const g = ctx.createLinearGradient(0, 0, screenW, 0);
            for (const cs of colorStops) {
              g.addColorStop(cs.pos, `rgba(${cs.r},${cs.g},${cs.b},${alpha * totalAlpha})`);
            }
            return g;
          };

          const curtains = [
            { baseY: 0.30, amp1: 50, f1: 0.003, s1: 0.020, amp2: 30, f2: 0.007, s2: 0.030, amp3: 20, f3: 0.012, s3: 0.040, drift: 90, df: 0.0012, ds: 0.008, alpha: 0.07 },
            { baseY: 0.36, amp1: 45, f1: 0.004, s1: 0.028, amp2: 28, f2: 0.008, s2: 0.038, amp3: 18, f3: 0.014, s3: 0.048, drift: 110, df: 0.0015, ds: 0.010, alpha: 0.14 },
            { baseY: 0.40, amp1: 48, f1: 0.005, s1: 0.032, amp2: 32, f2: 0.009, s2: 0.042, amp3: 22, f3: 0.015, s3: 0.052, drift: 100, df: 0.0018, ds: 0.012, alpha: 0.18 },
            { baseY: 0.34, amp1: 38, f1: 0.0035, s1: 0.024, amp2: 24, f2: 0.0065, s2: 0.034, amp3: 15, f3: 0.011, s3: 0.044, drift: 85, df: 0.001, ds: 0.009, alpha: 0.12 },
            { baseY: 0.26, amp1: 35, f1: 0.006, s1: 0.036, amp2: 20, f2: 0.011, s2: 0.046, amp3: 14, f3: 0.018, s3: 0.056, drift: 70, df: 0.002, ds: 0.014, alpha: 0.22 },
          ];

          for (const curtain of curtains) {
            ctx.save();
            const by = screenH * curtain.baseY;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let x = 0; x <= screenW; x += 3) {
              const w1 = Math.sin(x * curtain.f1 + auroraTime * curtain.s1) * curtain.amp1;
              const w2 = Math.sin(x * curtain.f2 + auroraTime * curtain.s2) * curtain.amp2;
              const w3 = Math.sin(x * curtain.f3 + auroraTime * curtain.s3) * curtain.amp3;
              const w4 = Math.sin(x * curtain.df + auroraTime * curtain.ds) * curtain.drift;
              const y = Math.max(5, by + w1 + w2 + w3 + w4);
              ctx.lineTo(x, y);
            }
            ctx.lineTo(screenW, 0);
            ctx.closePath();
            ctx.fillStyle = makeGradient(curtain.alpha);
            ctx.fill();
            ctx.restore();
          }

          // Vertical fade mask
          ctx.save();
          const fadeGrad = ctx.createLinearGradient(0, screenH * 0.15, 0, screenH * 0.50);
          fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
          fadeGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
          fadeGrad.addColorStop(0.8, `rgba(0,0,0,${0.08 * fade})`);
          fadeGrad.addColorStop(1, `rgba(0,0,0,${0.20 * fade})`);
          ctx.fillStyle = fadeGrad;
          ctx.fillRect(0, screenH * 0.15, screenW, screenH * 0.35);
          ctx.restore();

          // Atmospheric glow
          ctx.save();
          const glowGrad = ctx.createRadialGradient(screenW * 0.5, screenH * 0.15, 10, screenW * 0.5, screenH * 0.15, screenH * 0.5);
          const glowT = (Math.sin(auroraTime * 0.7) * 0.5 + 0.5) * 0.4 + 0.3;
          glowGrad.addColorStop(0, `rgba(${80 + glowT * 60}, ${200 + glowT * 40}, ${160 + glowT * 60}, ${0.06 * totalAlpha})`);
          glowGrad.addColorStop(0.5, `rgba(${120 + glowT * 40}, ${170 + glowT * 30}, ${200 + glowT * 40}, ${0.03 * totalAlpha})`);
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glowGrad;
          ctx.fillRect(0, 0, screenW, screenH * 0.55);
          ctx.restore();

          ctx.globalAlpha = 1;
        }

        // ========== FAR LAYER: Distant mountain silhouettes ==========
        ctx.save();
        ctx.fillStyle = 'rgba(15, 35, 60, 0.12)';
        ctx.beginPath();
        ctx.moveTo(0, screenH);
        for (let x = 0; x <= screenW; x += 4) {
          const m1 = Math.sin(x * 0.0012 + time * 0.002) * 75;
          const m2 = Math.sin(x * 0.0035 + time * 0.004) * 50;
          const m3 = Math.sin(x * 0.007 + time * 0.006) * 28;
          ctx.lineTo(x, screenH * 0.28 + m1 * 0.4 + m2 * 0.3 + m3 * 0.25);
        }
        ctx.lineTo(screenW, screenH);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // ========== MID-FAR LAYER: Glacier mountain range with icy blue snow caps ==========
        ctx.save();
        ctx.fillStyle = 'rgba(25, 65, 110, 0.14)';
        ctx.beginPath();
        ctx.moveTo(0, screenH);
        for (let x = 0; x <= screenW; x += 3) {
          const m1 = Math.sin(x * 0.0025 + time * 0.003 + 1) * 85;
          const m2 = Math.sin(x * 0.006 + time * 0.005 + 2) * 55;
          const m3 = Math.sin(x * 0.012 + time * 0.003 + 3) * 30;
          ctx.lineTo(x, screenH * 0.32 + m1 * 0.35 + m2 * 0.25 + m3 * 0.2);
        }
        ctx.lineTo(screenW, screenH);
        ctx.closePath();
        ctx.fill();
        // Snow caps
        ctx.fillStyle = 'rgba(40, 120, 175, 0.16)';
        ctx.beginPath();
        ctx.moveTo(0, screenH);
        for (let x = 0; x <= screenW; x += 3) {
          const m1 = Math.sin(x * 0.0025 + time * 0.003 + 1) * 85;
          const m2 = Math.sin(x * 0.006 + time * 0.005 + 2) * 55;
          const m3 = Math.sin(x * 0.012 + time * 0.003 + 3) * 30;
          const peakY = screenH * 0.32 + m1 * 0.35 + m2 * 0.25 + m3 * 0.2;
          const capY = peakY - 28 - Math.sin(x * 0.005 + time * 0.001) * 10;
          ctx.lineTo(x, Math.min(peakY + 3, capY));
        }
        ctx.lineTo(screenW, screenH);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // ========== MID LAYER: Aurora borealis (skip during aurora event ??? enhanced version renders above) ==========
        if (!this._auroraActive) {
          ctx.save();
          const aurAlpha = 0.07 + Math.sin(time * 0.07) * 0.05;
          ctx.globalAlpha = aurAlpha;
          const aurY = screenH * 0.20;
          const aurGrad = ctx.createRadialGradient(screenW * 0.3, aurY, 5, screenW * 0.3, aurY, screenW * 0.45);
          aurGrad.addColorStop(0, '#80f0b0');
          aurGrad.addColorStop(0.25, '#50d0ff');
          aurGrad.addColorStop(0.5, '#3080d0');
          aurGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = aurGrad;
          ctx.fillRect(0, screenH * 0.06, screenW, screenH * 0.28);
          ctx.restore();
          ctx.save();
          ctx.globalAlpha = 0.045 + Math.sin(time * 0.09 + 1.5) * 0.035;
          const aurGrad2 = ctx.createRadialGradient(screenW * 0.7, aurY + 12, 5, screenW * 0.7, aurY + 12, screenW * 0.35);
          aurGrad2.addColorStop(0, '#a0f8c0');
          aurGrad2.addColorStop(0.3, '#60d0ff');
          aurGrad2.addColorStop(1, 'transparent');
          ctx.fillStyle = aurGrad2;
          ctx.fillRect(0, screenH * 0.06, screenW, screenH * 0.28);
          ctx.restore();
        }

        // ========== MID-FRONT LAYER: Dense pine forest (back row) ==========
        ctx.save();
        ctx.fillStyle = 'rgba(18, 38, 60, 0.14)';
        for (let i = 0; i < 28; i++) {
          const tx = (i / 28) * screenW + Math.sin(i * 3.7 + time * 0.006) * 35;
          const th = 64 + Math.sin(i * 2.3) * 18;
          const tb = screenH * 0.56 + Math.sin(i * 1.7 + time * 0.003) * 5;
          ctx.beginPath();
          ctx.moveTo(tx, tb - th);
          ctx.lineTo(tx - 14, tb);
          ctx.lineTo(tx + 14, tb);
          ctx.closePath();
          ctx.fill();
        }
        // Snow on back trees
        ctx.fillStyle = 'rgba(70, 140, 200, 0.10)';
        for (let i = 0; i < 28; i++) {
          const tx = (i / 28) * screenW + Math.sin(i * 3.7 + time * 0.006) * 35;
          const th = 64 + Math.sin(i * 2.3) * 18;
          const tb = screenH * 0.56 + Math.sin(i * 1.7 + time * 0.003) * 5;
          ctx.beginPath();
          ctx.moveTo(tx, tb - th + 8);
          ctx.lineTo(tx - 8, tb - th * 0.5);
          ctx.lineTo(tx + 8, tb - th * 0.5);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // ========== MID-FRONT LAYER: Pine forest (front row, offset for depth) ==========
        ctx.save();
        ctx.fillStyle = 'rgba(12, 28, 50, 0.16)';
        for (let i = 0; i < 18; i++) {
          const tx = ((i + 0.5) / 18) * screenW + Math.sin(i * 2.5 + time * 0.004) * 25;
          const th = 80 + Math.sin(i * 3.1) * 22;
          const tb = screenH * 0.64 + Math.sin(i * 1.3 + time * 0.002) * 4;
          ctx.beginPath();
          ctx.moveTo(tx, tb - th);
          ctx.lineTo(tx - 20, tb);
          ctx.lineTo(tx + 20, tb);
          ctx.closePath();
          ctx.fill();
        }
        // Snow on front trees
        ctx.fillStyle = 'rgba(70, 140, 200, 0.11)';
        for (let i = 0; i < 18; i++) {
          const tx = ((i + 0.5) / 18) * screenW + Math.sin(i * 2.5 + time * 0.004) * 25;
          const th = 80 + Math.sin(i * 3.1) * 22;
          const tb = screenH * 0.64 + Math.sin(i * 1.3 + time * 0.002) * 4;
          ctx.beginPath();
          ctx.moveTo(tx, tb - th + 10);
          ctx.lineTo(tx - 10, tb - th * 0.55);
          ctx.lineTo(tx + 10, tb - th * 0.55);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // ========== MID-FRONT LAYER: Frozen lake ==========
        ctx.save();
        const lakeCx = screenW * 0.72 + Math.sin(time * 0.003) * 10;
        const lakeCy = screenH * 0.62;
        ctx.fillStyle = 'rgba(35, 95, 155, 0.08)';
        ctx.beginPath();
        ctx.ellipse(lakeCx, lakeCy, 85, 28, 0.15, 0, Math.PI * 2);
        ctx.fill();
        // Ice reflection lines
        ctx.strokeStyle = 'rgba(40, 120, 175, 0.055)';
        ctx.lineWidth = 1.5;
        for (let r = 0; r < 5; r++) {
          const rx = lakeCx - 55 + r * 30 + Math.sin(time * 0.003 + r) * 7;
          ctx.beginPath();
          ctx.moveTo(rx, lakeCy - 14 + r * 5);
          ctx.lineTo(rx + 22, lakeCy - 5 + r * 3);
          ctx.stroke();
        }
        ctx.restore();

        // ========== FRONT LAYER: Landmarks ==========
        ctx.save();
        const windowGlow = 0.15 + Math.sin(time * 0.5) * 0.06;

        // Watchtower (1.5x)
        const wtX = screenW * 0.12 + Math.sin(time * 0.004) * 7;
        const wtBase = screenH * 0.60;
        ctx.strokeStyle = 'rgba(55, 42, 32, 0.16)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(wtX - 8, wtBase);
        ctx.lineTo(wtX - 8, wtBase - 57);
        ctx.moveTo(wtX + 8, wtBase);
        ctx.lineTo(wtX + 8, wtBase - 57);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wtX - 8, wtBase - 21);
        ctx.lineTo(wtX + 8, wtBase - 21);
        ctx.moveTo(wtX - 8, wtBase - 42);
        ctx.lineTo(wtX + 8, wtBase - 42);
        ctx.stroke();
        ctx.fillStyle = 'rgba(55, 42, 32, 0.16)';
        ctx.fillRect(wtX - 11, wtBase - 60, 22, 6);
        ctx.fillStyle = 'rgba(70, 140, 200, 0.12)';
        ctx.fillRect(wtX - 12, wtBase - 62, 24, 5);

        // Large cabin (1.5x) with warm window glow
        const cab1X = 30 + Math.sin(time * 0.004) * 6;
        const cab1Y = screenH * 0.73;
        ctx.fillStyle = 'rgba(55, 42, 32, 0.18)';
        ctx.fillRect(cab1X, cab1Y, 42, 30);
        ctx.fillStyle = 'rgba(68, 54, 42, 0.22)';
        ctx.beginPath();
        ctx.moveTo(cab1X - 6, cab1Y);
        ctx.lineTo(cab1X + 21, cab1Y - 24);
        ctx.lineTo(cab1X + 48, cab1Y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(70, 140, 200, 0.14)';
        ctx.beginPath();
        ctx.moveTo(cab1X - 5, cab1Y - 2);
        ctx.lineTo(cab1X + 21, cab1Y - 22);
        ctx.lineTo(cab1X + 47, cab1Y - 2);
        ctx.lineTo(cab1X + 43, cab1Y - 3);
        ctx.lineTo(cab1X + 21, cab1Y - 20);
        ctx.lineTo(cab1X - 1, cab1Y - 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgba(240, 200, 80, ${windowGlow})`;
        ctx.fillRect(cab1X + 8, cab1Y + 6, 9, 9);
        ctx.fillRect(cab1X + 25, cab1Y + 6, 9, 9);

        // Snowman (1.5x) - 3 balls, hat, eyes, stick arms
        const smX = screenW * 0.38;
        const smY = screenH * 0.72;
        ctx.fillStyle = 'rgba(70, 140, 200, 0.12)';
        ctx.beginPath();
        ctx.arc(smX, smY + 21, 16.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(75, 150, 210, 0.14)';
        ctx.beginPath();
        ctx.arc(smX, smY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(85, 160, 220, 0.16)';
        ctx.beginPath();
        ctx.arc(smX, smY - 13.5, 9, 0, Math.PI * 2);
        ctx.fill();
        // Hat
        ctx.fillStyle = 'rgba(55, 42, 32, 0.14)';
        ctx.fillRect(smX - 8, smY - 26, 16, 6);
        ctx.fillRect(smX - 5, smY - 33, 10, 9);
        // Eyes
        ctx.fillStyle = 'rgba(20, 20, 30, 0.16)';
        ctx.beginPath();
        ctx.arc(smX - 3, smY - 15, 1.8, 0, Math.PI * 2);
        ctx.arc(smX + 3, smY - 15, 1.8, 0, Math.PI * 2);
        ctx.fill();
        // Stick arms
        ctx.strokeStyle = 'rgba(55, 42, 32, 0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(smX - 18, smY - 8);
        ctx.lineTo(smX - 8, smY - 5);
        ctx.moveTo(smX + 8, smY - 5);
        ctx.lineTo(smX + 18, smY - 8);
        ctx.stroke();

        // Second cabin (1.3x)
        const cab2X = screenW - 145 + Math.sin(time * 0.005 + 2) * 8;
        const cab2Y = screenH * 0.69;
        ctx.fillStyle = 'rgba(55, 42, 32, 0.16)';
        ctx.fillRect(cab2X, cab2Y, 29, 21);
        ctx.fillStyle = 'rgba(65, 50, 40, 0.20)';
        ctx.beginPath();
        ctx.moveTo(cab2X - 5, cab2Y);
        ctx.lineTo(cab2X + 14.5, cab2Y - 17);
        ctx.lineTo(cab2X + 34, cab2Y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(70, 140, 200, 0.12)';
        ctx.beginPath();
        ctx.moveTo(cab2X - 4, cab2Y - 1);
        ctx.lineTo(cab2X + 14.5, cab2Y - 16);
        ctx.lineTo(cab2X + 33, cab2Y - 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgba(240, 200, 80, ${windowGlow * 0.8})`;
        ctx.fillRect(cab2X + 5, cab2Y + 4, 7, 7);
        ctx.fillRect(cab2X + 17, cab2Y + 4, 7, 7);

        // Camp site (2 tents, larger)
        const campX = screenW * 0.55 + Math.sin(time * 0.003) * 10;
        const campY = screenH * 0.69;
        ctx.fillStyle = 'rgba(55, 65, 78, 0.12)';
        ctx.beginPath();
        ctx.moveTo(campX - 13, campY + 10);
        ctx.lineTo(campX, campY - 16);
        ctx.lineTo(campX + 13, campY + 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(70, 140, 200, 0.09)';
        ctx.beginPath();
        ctx.moveTo(campX - 10, campY + 5);
        ctx.lineTo(campX, campY - 10);
        ctx.lineTo(campX + 10, campY + 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(50, 60, 72, 0.11)';
        ctx.beginPath();
        ctx.moveTo(campX + 10, campY + 12);
        ctx.lineTo(campX + 20, campY - 8);
        ctx.lineTo(campX + 30, campY + 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(70, 140, 200, 0.08)';
        ctx.beginPath();
        ctx.moveTo(campX + 12, campY + 6);
        ctx.lineTo(campX + 20, campY - 4);
        ctx.lineTo(campX + 28, campY + 6);
        ctx.closePath();
        ctx.fill();

        // Snow-covered fence posts (more visible)
        for (let f = 0; f < 14; f++) {
          const fx = (f / 14) * screenW + Math.sin(f * 2.3 + time * 0.002) * 22;
          const fy = screenH * 0.78 + Math.sin(f * 1.7) * 4;
          ctx.fillStyle = 'rgba(55, 42, 32, 0.14)';
          ctx.fillRect(fx - 2, fy - 9, 4, 18);
          ctx.fillStyle = 'rgba(70, 140, 200, 0.12)';
          ctx.fillRect(fx - 3, fy - 10, 8, 4);
        }

        // Broken bridge remnants (larger)
        const bbX = screenW * 0.85 + Math.sin(time * 0.004) * 7;
        const bbY = screenH * 0.68;
        ctx.strokeStyle = 'rgba(55, 42, 32, 0.14)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bbX - 22, bbY + 8);
        ctx.lineTo(bbX - 3, bbY - 6);
        ctx.lineTo(bbX + 15, bbY + 3);
        ctx.stroke();
        ctx.fillStyle = 'rgba(70, 140, 200, 0.09)';
        ctx.fillRect(bbX - 24, bbY + 6, 48, 5);

        ctx.restore();

        // ========== FRONT LAYER: Snowdrifts and ice crystals (darker tones) ==========
        ctx.save();
        for (let s = 0; s < 12; s++) {
          const sx = (s / 12) * screenW + Math.sin(s * 3.7 + time * 0.003) * 30;
          const sy = screenH * 0.80 + Math.sin(s * 2.1) * 4;
          const sw = 45 + Math.sin(s * 1.3) * 22;
          const sh = 9 + Math.sin(s * 2.7) * 4;
          ctx.fillStyle = 'rgba(25, 65, 110, 0.08)';
          ctx.beginPath();
          ctx.ellipse(sx, sy, sw, sh, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // Ice crystal sparkles
        ctx.fillStyle = 'rgba(40, 120, 175, 0.10)';
        for (let c = 0; c < 14; c++) {
          const cx = (c / 14) * screenW + Math.sin(c * 5.1 + time * 0.005) * 18;
          const cy = screenH * 0.82 + Math.sin(c * 3.3) * 5;
          ctx.beginPath();
          ctx.arc(cx, cy, 1.5 + Math.sin(c * 2.1) * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // ========== GROUND FOG (dark blue-grey) ==========
        ctx.save();
        const fogGrad = ctx.createLinearGradient(0, screenH * 0.55, 0, screenH);
        fogGrad.addColorStop(0, 'rgba(15, 35, 60, 0)');
        fogGrad.addColorStop(0.4, 'rgba(15, 35, 60, 0.03)');
        fogGrad.addColorStop(0.75, 'rgba(15, 35, 60, 0.06)');
        fogGrad.addColorStop(1, 'rgba(15, 35, 60, 0.10)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, screenH * 0.55, screenW, screenH * 0.45);
        ctx.restore();

        // ========== DRIFTING CLOUDS (dark blue-grey) ==========
        ctx.save();
        ctx.fillStyle = 'rgba(20, 50, 80, 0.04)';
        for (let i = 0; i < 4; i++) {
          const cx = ((time * 5 + i * 260) % (screenW + 350)) - 175;
          const cy = screenH * (0.12 + i * 0.08) + Math.sin(time * 0.035 + i * 2.3) * 18;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 80 + Math.sin(time * 0.015 + i * 1.1) * 14, 11 + i * 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (theme === 'volcano') {
        ctx.save();
        const t = time * 0.4;

        // ========== LAYER 1: Distant volcano silhouettes (5 individual cones) ==========
        const volcanoes = [
          { pos: 0.10, height: 0.18, width: 0.13, alpha: 0.18, phase: 0, skew: 0.05 },
          { pos: 0.27, height: 0.26, width: 0.11, alpha: 0.16, phase: 1.4, skew: -0.03 },
          { pos: 0.50, height: 0.32, width: 0.15, alpha: 0.22, phase: 2.8, skew: 0.02 },
          { pos: 0.70, height: 0.22, width: 0.12, alpha: 0.17, phase: 4.2, skew: -0.04 },
          { pos: 0.90, height: 0.14, width: 0.09, alpha: 0.13, phase: 5.6, skew: 0.03 },
        ];
        for (const v of volcanoes) {
          const vx = screenW * v.pos;
          const baseY = screenH * (0.68 + Math.sin(t * 0.002 + v.phase) * 0.015);
          const vh = screenH * v.height;
          const vw = screenW * v.width;
          // Deep orange glow behind each volcano (localized, not global)
          ctx.save();
          ctx.globalAlpha = 0.07;
          const volcGlow = ctx.createRadialGradient(
            vx, baseY - vh * 0.5, 5,
            vx, baseY - vh * 0.3, vw * 0.8
          );
          volcGlow.addColorStop(0, 'rgba(220, 80, 0, 0.35)');
          volcGlow.addColorStop(0.4, 'rgba(160, 50, 0, 0.12)');
          volcGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = volcGlow;
          ctx.beginPath();
          ctx.arc(vx, baseY - vh * 0.3, vw * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          // Dark silhouette with slight asymmetry
          ctx.save();
          ctx.globalAlpha = v.alpha;
          ctx.fillStyle = '#0a0806';
          ctx.beginPath();
          ctx.moveTo(vx - vw * 1.1, baseY);
          const peakX = vx + v.skew * vw * 0.5;
          const peakY = baseY - vh;
          const leftBulge = vw * (0.25 + Math.sin(v.phase) * 0.08);
          const rightBulge = vw * (0.25 - Math.sin(v.phase + 1) * 0.08);
          ctx.quadraticCurveTo(vx - vw * 0.4, baseY - vh * 0.55, peakX - leftBulge, baseY - vh * 0.7);
          ctx.quadraticCurveTo(peakX - vw * 0.06, baseY - vh * 0.95, peakX, peakY);
          ctx.quadraticCurveTo(peakX + vw * 0.06, baseY - vh * 0.95, peakX + rightBulge, baseY - vh * 0.7);
          ctx.quadraticCurveTo(vx + vw * 0.4, baseY - vh * 0.55, vx + vw * 1.1, baseY);
          // Crater
          ctx.lineTo(peakX + vw * 0.04, peakY + vh * 0.06);
          ctx.lineTo(peakX - vw * 0.04, peakY + vh * 0.04);
          ctx.lineTo(vx - vw * 1.1, baseY);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          // Crater glow
          ctx.save();
          ctx.shadowColor = '#ff6600';
          ctx.shadowBlur = 8;
          ctx.globalAlpha = 0.08 + 0.05 * Math.sin(t * 0.15 + v.phase);
          ctx.fillStyle = '#ff6600';
          ctx.beginPath();
          ctx.arc(peakX, peakY + vh * 0.04, vw * 0.04, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
        }

        // ========== LAYER 2: Dark volcanic rock ground (fills the lower 70%) ==========
        ctx.save();
        ctx.fillStyle = '#0e0c0a';
        ctx.fillRect(0, screenH * 0.35, screenW, screenH * 0.65);
        // Textured rock variation
        ctx.globalAlpha = 0.04;
        for (let i = 0; i < 20; i++) {
          const rx = Math.sin(i * 37.7 + t * 0.002) * screenW * 0.5 + screenW * 0.5;
          const ry = screenH * (0.40 + Math.sin(i * 23.3) * 0.15);
          const rr = 30 + Math.sin(i * 17.1) * 15;
          ctx.fillStyle = '#1a1410';
          ctx.beginPath();
          ctx.arc(rx, ry, rr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // ========== LAYER 3: Dark basalt mountain ridges (mid ground) ==========
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = '#14100c';
        ctx.beginPath();
        ctx.moveTo(0, screenH);
        for (let x = 0; x <= screenW; x += 2) {
          const r1 = Math.sin(x * 0.002 + t * 0.005 + 0.3) * 45;
          const r2 = Math.sin(x * 0.005 + t * 0.003 + 1.4) * 28;
          const r3 = Math.sin(x * 0.010 + t * 0.002 + 2.7) * 14;
          const y = screenH * 0.42 + r1 * 0.35 + r2 * 0.25 + r3 * 0.2;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(screenW, screenH);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // ========== LAYER 4: Winding lava rivers through cracked rock ==========
        // Each river uses multiple segments to create a winding channel look
        const riverSegments = [
          { y: 0.55, alpha: 0.20, amp: 12, freq1: 0.004, freq2: 0.010, speed1: 0.015, speed2: 0.008, color1: '#ff6b00', color2: '#ff8c00', color3: '#ffaa00' },
          { y: 0.68, alpha: 0.22, amp: 14, freq1: 0.005, freq2: 0.012, speed1: 0.018, speed2: 0.010, color1: '#ff5a00', color2: '#ff8800', color3: '#ffaa00' },
          { y: 0.82, alpha: 0.18, amp: 10, freq1: 0.006, freq2: 0.014, speed1: 0.020, speed2: 0.012, color1: '#cc4400', color2: '#ff6600', color3: '#ff8800' },
          { y: 0.52, alpha: 0.12, amp: 8, freq1: 0.007, freq2: 0.015, speed1: 0.022, speed2: 0.014, color1: '#ff4400', color2: '#ff7700', color3: '#ffaa00' },
          { y: 0.75, alpha: 0.14, amp: 9, freq1: 0.005, freq2: 0.011, speed1: 0.016, speed2: 0.009, color1: '#ff5500', color2: '#ff9900', color3: '#ffcc00' },
        ];
        const riverYs = [];
        for (const seg of riverSegments) {
          const baseY = screenH * seg.y;
          riverYs.push(baseY);
          // Lava fill
          ctx.save();
          ctx.globalAlpha = seg.alpha;
          const grad = ctx.createLinearGradient(0, 0, screenW, 0);
          grad.addColorStop(0, seg.color1);
          grad.addColorStop(0.3, seg.color2);
          grad.addColorStop(0.6, seg.color3);
          grad.addColorStop(1, seg.color1);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, screenH);
          for (let x = 0; x <= screenW; x += 3) {
            const w1 = Math.sin(x * seg.freq1 + t * seg.speed1) * seg.amp;
            const w2 = Math.sin(x * seg.freq2 + t * seg.speed2 + 1.5) * seg.amp * 0.5;
            const y = baseY + w1 + w2;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(screenW, screenH);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          // Dark crust edges (darker basalt borders)
          ctx.save();
          ctx.globalAlpha = seg.alpha * 0.35;
          ctx.strokeStyle = '#0a0806';
          ctx.lineWidth = 4;
          ctx.beginPath();
          for (let x = 0; x <= screenW; x += 3) {
            const w1 = Math.sin(x * seg.freq1 + t * seg.speed1) * seg.amp;
            const w2 = Math.sin(x * seg.freq2 + t * seg.speed2 + 1.5) * seg.amp * 0.5;
            const y = baseY + w1 + w2 - 2;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.beginPath();
          for (let x = 0; x <= screenW; x += 3) {
            const w1 = Math.sin(x * seg.freq1 + t * seg.speed1) * seg.amp;
            const w2 = Math.sin(x * seg.freq2 + t * seg.speed2 + 1.5) * seg.amp * 0.5;
            const y = baseY + w1 + w2 + 2;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
        }

        // ========== LAYER 5: Thin glowing magma fissures (cracks across rock) ==========
        for (let crackSet = 0; crackSet < 4; crackSet++) {
          const baseAlpha = 0.06 + crackSet * 0.025;
          const pulse = 0.85 + 0.15 * Math.sin(t * 0.25 + crackSet * 1.2);
          ctx.save();
          ctx.globalAlpha = baseAlpha * pulse;
          ctx.shadowColor = '#ff6600';
          ctx.shadowBlur = 3;
          ctx.strokeStyle = crackSet === 0 ? '#ff8800' : (crackSet === 1 ? '#ff5500' : (crackSet === 2 ? '#ffaa00' : '#ff3300'));
          ctx.lineWidth = 1 + (crackSet % 2) * 0.5;
          const numCracks = 6 + crackSet * 2;
          for (let i = 0; i < numCracks; i++) {
            const cx = ((i + Math.sin(crackSet * 2.3)) / numCracks) * screenW + Math.sin(t * 0.04 + i * 1.1 + crackSet) * 20;
            const startY = screenH * (0.45 + crackSet * 0.08 + Math.sin(i * 0.7) * 0.03);
            ctx.beginPath();
            ctx.moveTo(cx, startY);
            let segX = cx, segY = startY;
            const numSeg = 3 + crackSet;
            for (let s = 0; s < numSeg; s++) {
              segY = startY + (s + 1) * (25 + crackSet * 5) + Math.sin(t * 0.06 + i * 0.7 + s * 1.3) * 10;
              segX = cx + Math.sin(t * 0.05 + i * 0.9 + s * 0.8 + crackSet) * (8 + crackSet * 3);
              // Branch occasionally
              ctx.lineTo(segX, segY);
              if (s > 0 && Math.sin(i * 3.7 + s * 5.1 + crackSet) > 0.7) {
                const bx = segX + Math.sin(t * 0.07 + i * 1.3 + s * 2.1) * 10;
                const by = segY + Math.sin(t * 0.08 + i * 1.1 + s * 1.7) * 8;
                ctx.moveTo(segX, segY);
                ctx.lineTo(bx, by);
                ctx.moveTo(segX, segY);
              }
            }
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
          ctx.restore();
        }

        // ========== LAYER 6: Lava bubble effects on rivers ==========
        ctx.save();
        ctx.globalAlpha = 0.08;
        for (let i = 0; i < 25; i++) {
          const ri = i % riverYs.length;
          const bx = (i / 25) * screenW + Math.sin(t * 0.025 + i * 1.3 + ri) * 30;
          const by = riverYs[ri] + Math.sin(t * 0.04 + i * 0.6 + ri) * 14;
          const size = 1.5 + Math.sin(t * 0.08 + i * 0.9 + ri) * 1.2;
          const pulseA = 0.4 + 0.6 * Math.sin(t * 0.15 + i * 0.7 + ri);
          ctx.fillStyle = `rgba(255, 180, 50, ${0.35 * pulseA})`;
          ctx.beginPath();
          ctx.arc(bx, by, Math.max(0.5, size), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // ========== LAYER 7: Soft background smoke columns from distant vents ==========
        ctx.save();
        ctx.globalAlpha = 0.04;
        for (let i = 0; i < 8; i++) {
          const sx = (i / 8) * screenW + 40 * Math.sin(t * 0.012 + i * 1.3);
          const sy = screenH * (0.45 + i * 0.05);
          const driftX = Math.sin(t * 0.015 + i * 0.6) * 20;
          const riseY = Math.sin(t * 0.008 + i * 0.4) * 15;
          const smokeGrad = ctx.createRadialGradient(
            sx + driftX, sy - 90 + riseY, 5,
            sx + driftX * 0.5, sy - 80 + riseY, 120
          );
          smokeGrad.addColorStop(0, 'rgba(55, 45, 38, 0.08)');
          smokeGrad.addColorStop(0.5, 'rgba(45, 38, 32, 0.04)');
          smokeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = smokeGrad;
          ctx.beginPath();
          ctx.ellipse(
            sx + driftX, sy - 50 + riseY,
            50 + Math.sin(t * 0.01 + i * 0.5) * 15,
            80 + Math.sin(t * 0.007 + i * 0.3) * 20,
            0, 0, Math.PI * 2
          );
          ctx.fill();
        }
        ctx.restore();

        // ========== LAYER 8a: Rising ash curtain (subtle gradient from bottom) ==========
        ctx.save();
        const ashCurtainAlpha = 0.035 + 0.015 * Math.sin(t * 0.01);
        const ashCurtain = ctx.createLinearGradient(0, screenH * 0.75, 0, screenH);
        ashCurtain.addColorStop(0, 'rgba(30, 22, 16, 0)');
        ashCurtain.addColorStop(0.4, `rgba(40, 30, 24, ${ashCurtainAlpha * 0.5})`);
        ashCurtain.addColorStop(0.7, `rgba(30, 22, 16, ${ashCurtainAlpha * 0.8})`);
        ashCurtain.addColorStop(0.9, `rgba(20, 14, 10, ${ashCurtainAlpha})`);
        ashCurtain.addColorStop(1, `rgba(10, 8, 6, ${ashCurtainAlpha * 0.6})`);
        ctx.fillStyle = ashCurtain;
        ctx.fillRect(0, screenH * 0.75, screenW, screenH * 0.25);
        ctx.restore();

        // ========== LAYER 8b: Ash particles (dark volcanic dust, rising from below) ==========
        if (this.state === 'racing') {
          ctx.save();
          for (const p of this._volcanoAshParticles) {
            const a = Math.min(p.alpha * 0.8, 0.25);
            if (a <= 0) continue;
            ctx.globalAlpha = a;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x * screenW, p.y * screenH, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          ctx.restore();
        }

        // ========== LAYER 9: Ember particles (orange, full width, rising from bottom) ==========
        if (this.state === 'racing') {
          ctx.save();
          for (const p of this._volcanoEmberParticles) {
            const a = p.alpha;
            if (a <= 0) continue;
            ctx.globalAlpha = a;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 4;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x * screenW, p.y * screenH, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          ctx.globalAlpha = 1;
          ctx.restore();
        }

        // ========== LAYER 10: Active eruption effects (small bursts only) ==========
        if (this._volcanoEruptionActive && this._volcanoEruptionParticles.length > 0) {
          ctx.save();
          for (const p of this._volcanoEruptionParticles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            if (p.color.startsWith('#ff') || p.color.startsWith('#cc')) {
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 4;
            }
            ctx.beginPath();
            ctx.arc(p.x * screenW, p.y * screenH, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          ctx.restore();
        }

        // ========== LAYER 11: Localized lava glow (only near rivers) ==========
        for (let ri = 0; ri < riverYs.length; ri++) {
          const baseY = riverYs[ri];
          ctx.save();
          const glowX = screenW * (0.2 + ri * 0.15);
          const glowR = 120 + ri * 20;
          const g = ctx.createRadialGradient(glowX, baseY, 5, glowX, baseY, glowR);
          const gp = 0.85 + 0.15 * Math.sin(t * 0.35 + ri * 0.8);
          g.addColorStop(0, `rgba(255, 120, 0, ${0.05 * gp})`);
          g.addColorStop(0.5, `rgba(200, 80, 0, ${0.025 * gp})`);
          g.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(glowX - glowR, baseY - 80, glowR * 2, 160);
          ctx.restore();
        }

        // ========== LAYER 12: Heat shimmer only above lava rivers ==========
        ctx.save();
        ctx.globalAlpha = 0.012;
        for (let ri = 0; ri < riverYs.length; ri++) {
          const baseY = riverYs[ri];
          for (let i = 0; i < 4; i++) {
            const shimmerY = baseY - 30 + i * 20;
            ctx.strokeStyle = 'rgba(255, 200, 150, 0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x <= screenW; x += 5) {
              const yy = shimmerY + Math.sin(x * 0.01 + t * 0.12 + i * 0.8 + ri * 1.5) * 3;
              if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
            }
            ctx.stroke();
          }
        }
        ctx.restore();

        // ========== LAYER 13: Tiny drifting sparks near lava edges ==========
        ctx.save();
        ctx.globalAlpha = 0.04;
        for (let i = 0; i < 15; i++) {
          const sx = ((i + Math.sin(t * 0.02 + i * 0.5)) / 15) * screenW;
          const sy = riverYs[i % riverYs.length] - 15 + Math.sin(t * 0.03 + i * 0.7) * 20;
          const sparkSize = 0.8 + Math.sin(t * 0.1 + i * 1.1) * 0.5;
          ctx.fillStyle = '#ffaa44';
          ctx.beginPath();
          ctx.arc(sx, sy, sparkSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // ========== VOLCANIC ERUPTION EVENT RENDERING ==========
        if (this._volcanicEruptionActive) {
          const ed = this._volcanicEruptionFadeProgress;

          // Sky darkening overlay
          if (this._volcanicEruptionSkyDarkness > 0.005) {
            ctx.save();
            ctx.fillStyle = `rgba(5, 3, 2, ${this._volcanicEruptionSkyDarkness})`;
            ctx.fillRect(0, 0, screenW, screenH);
            ctx.restore();
          }

          // Orange glow from below
          if (this._volcanicEruptionGlowIntensity > 0.005) {
            ctx.save();
            const glowGrad = ctx.createRadialGradient(
              screenW * 0.5, screenH, 0,
              screenW * 0.5, screenH, screenH * 0.8
            );
            glowGrad.addColorStop(0, `rgba(255, 100, 0, ${0.12 * this._volcanicEruptionGlowIntensity})`);
            glowGrad.addColorStop(0.5, `rgba(200, 60, 0, ${0.06 * this._volcanicEruptionGlowIntensity})`);
            glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(0, 0, screenW, screenH);
            ctx.restore();
          }

          // Screen flash
          if (this._volcanicEruptionScreenFlash > 0.005) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 200, 100, ${this._volcanicEruptionScreenFlash * 0.3})`;
            ctx.fillRect(0, 0, screenW, screenH);
            ctx.restore();
          }

          // Lava fountain particles
          if (this._volcanicEruptionFountainParticles.length > 0) {
            ctx.save();
            for (const p of this._volcanicEruptionFountainParticles) {
              if (p.alpha <= 0.01) continue;
              ctx.globalAlpha = p.alpha;
              ctx.fillStyle = p.color;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.arc(p.x * screenW, p.y * screenH, p.size, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
            ctx.globalAlpha = 1;
            ctx.restore();
          }

          // Smoke particles
          if (this._volcanicEruptionSmokeParticles.length > 0) {
            ctx.save();
            for (const p of this._volcanicEruptionSmokeParticles) {
              if (p.alpha <= 0.005) continue;
              ctx.globalAlpha = p.alpha;
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(p.x * screenW, p.y * screenH, p.size, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.restore();
          }

          // Ash particles
          if (this._volcanicEruptionAshParticles.length > 0) {
            ctx.save();
            for (const p of this._volcanicEruptionAshParticles) {
              if (p.alpha <= 0.005) continue;
              ctx.globalAlpha = p.alpha;
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(p.x * screenW, p.y * screenH, p.size, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.restore();
          }

          // Ember particles
          if (this._volcanicEruptionEmberParticles.length > 0) {
            ctx.save();
            for (const p of this._volcanicEruptionEmberParticles) {
              if (p.alpha <= 0.01) continue;
              ctx.globalAlpha = p.alpha;
              ctx.fillStyle = p.color;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 3;
              ctx.beginPath();
              ctx.arc(p.x * screenW, p.y * screenH, p.size, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
            ctx.globalAlpha = 1;
            ctx.restore();
          }

          // Volcanic bombs
          if (this._volcanicEruptionBombs.length > 0) {
            ctx.save();
            for (const bomb of this._volcanicEruptionBombs) {
              if (bomb.alpha <= 0.01) continue;

              // Smoke trail
              if (!bomb.hasLanded) {
                for (let ti = 0; ti < 3; ti++) {
                  const tOff = ti * 0.15;
                  const tx = bomb.x - bomb.vx * tOff * 20 + (Math.random() - 0.5) * 0.01;
                  const ty = bomb.y - bomb.vy * tOff * 20 + (Math.random() - 0.5) * 0.01;
                  const ta = Math.max(0, bomb.alpha * (1 - tOff) * 0.15);
                  ctx.globalAlpha = ta;
                  ctx.fillStyle = '#554433';
                  ctx.beginPath();
                  ctx.arc(tx * screenW, ty * screenH, bomb.size * (0.5 + tOff), 0, Math.PI * 2);
                  ctx.fill();
                }
              }

              // Bomb body
              ctx.globalAlpha = bomb.alpha;

              // Dark core
              ctx.shadowColor = '#ff4400';
              ctx.shadowBlur = bomb.glow;
              ctx.fillStyle = '#2a2018';
              ctx.beginPath();
              ctx.arc(bomb.x * screenW, bomb.y * screenH, bomb.size, 0, Math.PI * 2);
              ctx.fill();

              // Molten cracks
              const crackAngle = Date.now() * 0.005 + bomb.crackPhase;
              ctx.shadowBlur = 0;
              ctx.strokeStyle = '#ff6600';
              ctx.lineWidth = 2;
              for (let ci = 0; ci < 3; ci++) {
                const ca = crackAngle + ci * Math.PI * 2 / 3;
                const cr = bomb.size * 0.6;
                ctx.beginPath();
                ctx.moveTo(bomb.x * screenW, bomb.y * screenH);
                ctx.lineTo(
                  bomb.x * screenW + Math.cos(ca) * cr,
                  bomb.y * screenH + Math.sin(ca) * cr
                );
                ctx.stroke();
              }

              // Orange glow highlight
              ctx.shadowColor = '#ff6600';
              ctx.shadowBlur = bomb.glow * 0.5;
              ctx.fillStyle = 'rgba(255, 120, 0, 0.3)';
              ctx.beginPath();
              ctx.arc(bomb.x * screenW, bomb.y * screenH, bomb.size * 0.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
            ctx.globalAlpha = 1;
            ctx.restore();
          }
        }

        // ========== FIRESTORM EVENT RENDERING ==========
        if (this._firestormActive) {
          const fd = this._firestormFadeProgress;

          // ---- 1. Sky darkening overlay (heavy volcanic clouds, ~28%) ----
          if (this._firestormSkyDarkness > 0.005) {
            ctx.save();
            ctx.fillStyle = `rgba(8, 4, 2, ${this._firestormSkyDarkness})`;
            ctx.fillRect(0, 0, screenW, screenH);
            ctx.restore();
          }

          // ---- 2. Animated Orange Sky Tint ----
          if (this._firestormSkyTint > 0.005) {
            ctx.save();
            const tintPhase = Date.now() * 0.0005;
            const skyGrad = ctx.createLinearGradient(0, 0, 0, screenH * 0.6);
            skyGrad.addColorStop(0, `rgba(180, 60, 10, ${0.20 * this._firestormSkyTint})`);
            skyGrad.addColorStop(0.3, `rgba(140, 40, 5, ${0.14 * this._firestormSkyTint})`);
            skyGrad.addColorStop(0.6, `rgba(100, 30, 0, ${0.08 * this._firestormSkyTint})`);
            skyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, screenW, screenH);
            ctx.restore();
          }

          // ---- 3. Volcanic Glow (stronger, from beneath) ----
          if (this._firestormGlowIntensity > 0.005) {
            ctx.save();
            const glowGrad = ctx.createRadialGradient(
              screenW * 0.5, screenH * 1.05, 0,
              screenW * 0.5, screenH * 1.05, screenH * 0.85
            );
            glowGrad.addColorStop(0, `rgba(255, 50, 0, ${0.22 * this._firestormGlowIntensity})`);
            glowGrad.addColorStop(0.2, `rgba(220, 40, 0, ${0.14 * this._firestormGlowIntensity})`);
            glowGrad.addColorStop(0.5, `rgba(160, 30, 0, ${0.07 * this._firestormGlowIntensity})`);
            glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(0, 0, screenW, screenH);
            ctx.restore();
          }

          // ---- 4. Background desaturation (mute non-warm colors) ----
          if (this._firestormFadeProgress > 0.05) {
            ctx.save();
            ctx.globalAlpha = 0.20 * this._firestormFadeProgress;
            ctx.fillStyle = '#1a120e';
            ctx.fillRect(0, 0, screenW, screenH);
            ctx.restore();
          }

          // ---- 5. Heat distortion (continuous shimmering waves) ----
          if (this._firestormFadeProgress > 0.05) {
            ctx.save();
            const alpha = (this._firestormPhase === 'active' ? 0.03 : 0.015) * this._firestormFadeProgress;
            ctx.globalAlpha = alpha;
            for (let hi = 0; hi < 12; hi++) {
              const hy = screenH * (0.10 + hi * 0.07);
              const speed = 0.10 + hi * 0.025;
              const freq = 0.005 + hi * 0.002;
              const amp = 2.5 + hi * 0.6;
              ctx.strokeStyle = hi % 3 === 0 ? 'rgba(255, 200, 120, 0.04)' : (hi % 2 === 0 ? 'rgba(255, 160, 80, 0.03)' : 'rgba(255, 100, 40, 0.02)');
              ctx.lineWidth = 1;
              ctx.beginPath();
              for (let x = 0; x <= screenW; x += 6) {
                const yy = hy + Math.sin(x * freq + time * speed + hi * 1.5) * amp
                          + Math.sin(x * freq * 0.5 + time * speed * 0.7 + hi * 2.3) * amp * 0.4;
                if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
              }
              ctx.stroke();
            }
            ctx.restore();
          }

          // ---- 6. Heat Gusts (translucent flowing wind ribbons) ----
          if (this._firestormWindStreaks.length > 0) {
            ctx.save();
            for (const p of this._firestormWindStreaks) {
              if (p.alpha <= 0.005) continue;
              ctx.globalAlpha = p.alpha;
              const cx = p.x * screenW;
              const cy = p.y * screenH;
              const halfLen = p.length * screenW * 0.5;
              const sw = p.width;
              const grad = ctx.createLinearGradient(cx - halfLen, cy, cx + halfLen, cy);
              grad.addColorStop(0, 'rgba(255, 140, 40, 0)');
              grad.addColorStop(0.25, 'rgba(255, 180, 80, 0.5)');
              grad.addColorStop(0.5, 'rgba(255, 220, 120, 0.7)');
              grad.addColorStop(0.75, 'rgba(255, 180, 80, 0.5)');
              grad.addColorStop(1, 'rgba(255, 140, 40, 0)');
              ctx.fillStyle = grad;
              ctx.shadowColor = '#ff8800';
              ctx.shadowBlur = 3;
              ctx.beginPath();
              ctx.ellipse(cx, cy, halfLen, sw, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
            ctx.globalAlpha = 1;
            ctx.restore();
          }

          // ---- 7. Large Ash Clouds (slowly drifting dark masses) ----
          if (this._firestormLargeClouds.length > 0) {
            ctx.save();
            for (const p of this._firestormLargeClouds) {
              if (p.alpha <= 0.01) continue;
              ctx.globalAlpha = p.alpha;
              const cx = p.x * screenW;
              const cy = p.y * screenH;
              const cw = p.width * screenW;
              const ch = p.height * screenH;
              // Soft-edged cloud with radial gradient
              const cloudGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cw, ch) * 0.7);
              cloudGrad.addColorStop(0, p.color);
              cloudGrad.addColorStop(0.6, p.color);
              cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = cloudGrad;
              ctx.beginPath();
              ctx.ellipse(cx, cy, cw * 0.5, ch * 0.5, 0, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.restore();
          }

          // ---- 8. Fire Whirls (brief swirling ember columns) ----
          if (this._firestormWhirls.length > 0) {
            ctx.save();
            for (const p of this._firestormWhirls) {
              if (p.alpha <= 0.02) continue;
              ctx.globalAlpha = p.alpha * 0.5;
              const cx = p.x * screenW;
              const cy = p.y * screenH;
              const wh = p.height * screenH;
              const ww = p.width * screenW;
              // Swirling column of embers
              const steps = 8;
              for (let i = 0; i < steps; i++) {
                const t = i / steps;
                const swirlX = Math.sin(t * Math.PI * 4 + p.phase + Date.now() * 0.005) * ww;
                const swirlY = -t * wh + wh * 0.5;
                const size = 1.0 + t * 1.5;
                const alpha = (1 - t) * 0.6;
                ctx.fillStyle = i % 2 === 0 ? '#ff8800' : '#ffaa00';
                ctx.shadowColor = '#ff6600';
                ctx.shadowBlur = 3;
                ctx.beginPath();
                ctx.arc(cx + swirlX, cy + swirlY, size, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.shadowBlur = 0;
            }
            ctx.globalAlpha = 1;
            ctx.restore();
          }

          // ---- 9. Ember Storm (directional glowing streaks) ----
          if (this._firestormEmbers.length > 0) {
            ctx.save();
            const emberPhase = Date.now() * 0.003;
            for (const p of this._firestormEmbers) {
              if (p.alpha <= 0.01) continue;
              ctx.globalAlpha = p.alpha;
              ctx.fillStyle = p.color;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = p.size > 2.5 ? 6 : 3;
              // Stretch into directional streaks
              const px = p.x * screenW;
              const py = p.y * screenH;
              const streakLen = Math.min(p.size * 2.5, 10);
              const angle = Math.atan2(p.vy, p.vx);
              ctx.beginPath();
              ctx.ellipse(px, py, streakLen, p.size, angle, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
            ctx.globalAlpha = 1;
            ctx.restore();
          }

          // ---- 10. Burning Ash (dark swirling volcanic particles) ----
          if (this._firestormAsh.length > 0) {
            ctx.save();
            for (const p of this._firestormAsh) {
              if (p.alpha <= 0.005) continue;
              ctx.globalAlpha = p.alpha;
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(p.x * screenW, p.y * screenH, p.size, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.restore();
          }

          // ---- 11. Orange sparks (rapid, small, bright) ----
          if (this._firestormSparks.length > 0) {
            ctx.save();
            for (const p of this._firestormSparks) {
              if (p.alpha <= 0.01) continue;
              ctx.globalAlpha = p.alpha;
              ctx.fillStyle = p.color;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 2;
              ctx.beginPath();
              ctx.arc(p.x * screenW, p.y * screenH, p.size, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
            ctx.globalAlpha = 1;
            ctx.restore();
          }
        }

        ctx.globalAlpha = 1;
        ctx.restore();
      } else if (theme === 'ocean') {
        ctx.save();
        ctx.strokeStyle = 'rgba(173, 216, 230, 0.04)';
        ctx.lineWidth = 2;
        for (let w = 0; w < 6; w++) {
          ctx.beginPath();
          const wy = screenH * (0.25 + w * 0.08);
          for (let wx = 0; wx < screenW; wx += 10) {
            const wyOff = Math.sin(wx * 0.008 + time * 0.4 + w * 1.7) * 10;
            if (wx === 0) ctx.moveTo(wx, wy + wyOff);
            else ctx.lineTo(wx, wy + wyOff);
          }
          ctx.stroke();
        }
        ctx.restore();
      } else if (theme === 'space') {
        // ---- LAYER 4a: Deep nebula clouds (slowly drifting) ----
        ctx.save();
        ctx.globalAlpha = 0.035;
        const nebTime = time * 0.02;
        const neb1 = ctx.createRadialGradient(
          screenW * 0.25 + Math.sin(nebTime * 0.7) * 80, screenH * 0.3 + Math.cos(nebTime * 0.5) * 50, 10,
          screenW * 0.25, screenH * 0.3, 400
        );
        neb1.addColorStop(0, '#7c3aed');
        neb1.addColorStop(0.4, '#6d28d9');
        neb1.addColorStop(1, 'transparent');
        ctx.fillStyle = neb1;
        ctx.fillRect(0, 0, screenW, screenH);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.025;
        const neb2 = ctx.createRadialGradient(
          screenW * 0.7 + Math.sin(nebTime * 0.6 + 2) * 100, screenH * 0.6 + Math.cos(nebTime * 0.4 + 1) * 60, 10,
          screenW * 0.7, screenH * 0.6, 350
        );
        neb2.addColorStop(0, '#a855f7');
        neb2.addColorStop(0.5, '#7c3aed');
        neb2.addColorStop(1, 'transparent');
        ctx.fillStyle = neb2;
        ctx.fillRect(0, 0, screenW, screenH);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.015;
        const neb3 = ctx.createRadialGradient(
          screenW * 0.5 + Math.sin(nebTime * 0.4 + 4) * 60, screenH * 0.2 + Math.cos(nebTime * 0.3 + 2) * 40, 10,
          screenW * 0.5, screenH * 0.2, 500
        );
        neb3.addColorStop(0, '#06b6d4');
        neb3.addColorStop(0.4, '#0891b2');
        neb3.addColorStop(1, 'transparent');
        ctx.fillStyle = neb3;
        ctx.fillRect(0, 0, screenW, screenH);
        ctx.restore();

        // ---- LAYER 4b: Distant galaxies (3, more visible, color-matched to nebula) ----
        const galTime = time * 0.008;
        for (let g = 0; g < 3; g++) {
          ctx.save();
          ctx.globalAlpha = 0.05 + Math.sin(galTime * 0.5 + g * 2) * 0.015;
          const gx = screenW * (0.15 + g * 0.35) + Math.sin(galTime + g * 1.5) * 30;
          const gy = screenH * (0.25 + (g % 2) * 0.4);
          const gRad = 130 + g * 50;
          const galGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gRad);
          const galColors = ['#7c3aed', '#3b82f6', '#a855f7'];
          galGrad.addColorStop(0, galColors[g] + '55');
          galGrad.addColorStop(0.3, galColors[g] + '33');
          galGrad.addColorStop(0.6, galColors[g] + '18');
          galGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = galGrad;
          ctx.beginPath();
          ctx.ellipse(gx, gy, gRad, gRad * 0.3, 0.3 + g * 0.5, 0, Math.PI * 2);
          ctx.fill();
          // Spiral arms (more visible)
          ctx.strokeStyle = galColors[g] + '30';
          ctx.lineWidth = 1.5;
          for (let a = 0; a < 2; a++) {
            ctx.beginPath();
            for (let r = 5; r < gRad * 0.8; r += 3) {
              const sa = r * 0.018 + a * Math.PI + galTime * 0.1;
              const sx = gx + Math.cos(sa) * r;
              const sy = gy + Math.sin(sa) * r * 0.3;
              if (r === 5) ctx.moveTo(sx, sy);
              else ctx.lineTo(sx, sy);
            }
            ctx.stroke();
          }
          // Brighter core
          ctx.globalAlpha = 0.08;
          ctx.fillStyle = galColors[g];
          ctx.beginPath();
          ctx.arc(gx, gy, gRad * 0.08, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // ---- LAYER 4c: Faint cosmic light rays (diagonal, slow drift) ----
        ctx.save();
        ctx.globalAlpha = 0.015;
        for (let r = 0; r < 4; r++) {
          const rx = ((r * screenW * 0.25 + Math.sin(time * 0.02 + r * 2) * 60) % screenW);
          const rayGrad = ctx.createLinearGradient(rx, 0, rx + 80, screenH);
          rayGrad.addColorStop(0, 'rgba(168,85,247,0)');
          rayGrad.addColorStop(0.3, 'rgba(168,85,247,0.02)');
          rayGrad.addColorStop(0.5, 'rgba(6,182,212,0.025)');
          rayGrad.addColorStop(0.7, 'rgba(168,85,247,0.02)');
          rayGrad.addColorStop(1, 'rgba(168,85,247,0)');
          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(rx, 0);
          ctx.lineTo(rx + 40, 0);
          ctx.lineTo(rx - 40, screenH);
          ctx.lineTo(rx - 80, screenH);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // ---- LAYER 4d: Deep star field (200+ tiny stars with parallax twinkle) ----
        const starSeed = Math.floor(this.cameraX * 0.01);
        ctx.save();
        for (let i = 0; i < 160; i++) {
          const sx = ((i * 137.5 + starSeed * 3) % screenW);
          const sy = ((i * 97.3 + 50) % (screenH * 0.85));
          const twinkle = 0.4 + Math.sin(time * (1.5 + (i % 5) * 0.3) + i * 2.7) * 0.3;
          const size = 0.5 + (i % 3) * 0.4;
          ctx.globalAlpha = twinkle * 0.25;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // ---- LAYER 4e: Mid-field brighter stars (sparse, more twinkle) ----
        ctx.save();
        for (let i = 0; i < 40; i++) {
          const sx = ((i * 211.7 + starSeed * 7 + 100) % screenW);
          const sy = ((i * 173.5 + 80) % (screenH * 0.7));
          const twinkle = 0.3 + Math.sin(time * (2 + (i % 4) * 0.4) + i * 3.1) * 0.35;
          const size = 0.8 + (i % 5) * 0.5;
          ctx.globalAlpha = twinkle * 0.5;
          ctx.fillStyle = i % 3 === 0 ? '#a5d8ff' : i % 3 === 1 ? '#d8b4fe' : '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // ---- LAYER 4f: Meteors (tiny bright head, thin colorful trail, very fast, every 10-20s) ----
        this._meteorTimer -= 1;
        if (this._meteorTimer <= 0) {
          this._meteorTimer = 600 + Math.random() * 600;
          const count = Math.random() > 0.35 ? 1 : 2;
          this._activeMeteors = [];
          const meteorColors = ['#22d3ee', '#60a5fa', '#f472b6', '#c084fc', '#4ade80', '#ffffff'];
          for (let m = 0; m < count; m++) {
            const fromLeft = Math.random() > 0.5;
            this._activeMeteors.push({
              x: fromLeft ? -30 : screenW + 30,
              y: Math.random() * screenH * 0.55 + screenH * 0.05,
              vx: fromLeft ? 18 + Math.random() * 12 : -(18 + Math.random() * 12),
              vy: (5 + Math.random() * 7) * (Math.random() > 0.5 ? 1 : -1),
              life: 12 + Math.random() * 12,
              age: 0,
              color: meteorColors[Math.floor(Math.random() * meteorColors.length)],
            });
          }
        }
        this._activeMeteors = this._activeMeteors.filter(m => m.age < m.life);
        for (const m of this._activeMeteors) {
          ctx.save();
          const mf = Math.max(0, 1 - m.age / m.life);
          ctx.globalAlpha = mf * 0.4;
          ctx.strokeStyle = m.color;
          ctx.lineWidth = 0.8 + mf * 0.5;
          ctx.shadowColor = m.color;
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - m.vx * 4, m.y - m.vy * 4);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = mf * 0.8;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
          m.x += m.vx;
          m.y += m.vy;
          m.age += 1;
          ctx.restore();
        }

        // ---- LAYER 4g: Asteroid (large flaming rock, every 30-40s) ----
        this._asteroidTimer -= 1;
        if (this._asteroidTimer <= 0) {
          this._asteroidTimer = 1800 + Math.random() * 600;
          const fromLeft = Math.random() > 0.5;
          const size = 12 + Math.random() * 8;
          this._activeAsteroid = {
            x: fromLeft ? -200 : screenW + 200,
            y: screenH * 0.05 + Math.random() * screenH * 0.5,
            vx: fromLeft ? 1 + Math.random() * 0.7 : -(1 + Math.random() * 0.7),
            vy: 0.3 + Math.random() * 0.5,
            trail: [],
            maxTrail: 45,
            life: 180 + Math.random() * 80,
            age: 0,
            size,
            sparks: [],
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.015,
            verts: this._generateAsteroidShape(7 + Math.floor(Math.random() * 4)),
            sparkTimer: 0,
          };
        }
        if (this._activeAsteroid && this._activeAsteroid.age < this._activeAsteroid.life) {
          const a = this._activeAsteroid;
          a.rot += a.rotSpeed;
          a.trail.push({ x: a.x, y: a.y });
          if (a.trail.length > a.maxTrail) a.trail.shift();
          ctx.save();
          // --- Draw trail (segments: blue-grey smoke ??? white ??? yellow ??? orange) ---
          if (a.trail.length > 2) {
            for (let t = 1; t < a.trail.length; t++) {
              const tf = t / a.trail.length;
              const alpha = tf * 0.3;
              const width = 1 + tf * a.size * 0.25;
              let r, g, b;
              if (tf < 0.25) { r = 148; g = 163; b = 184; }
              else if (tf < 0.5) { r = 255; g = 255; b = 255; }
              else if (tf < 0.75) { r = 251; g = 191; b = 36; }
              else { r = 249; g = 115; b = 22; }
              ctx.globalAlpha = alpha;
              ctx.strokeStyle = `rgb(${r},${g},${b})`;
              ctx.lineWidth = width;
              ctx.beginPath();
              ctx.moveTo(a.trail[t - 1].x, a.trail[t - 1].y);
              ctx.lineTo(a.trail[t].x, a.trail[t].y);
              ctx.stroke();
            }
          }
          // --- Sparks breaking from trail ---
          a.sparkTimer++;
          if (a.sparkTimer % 4 === 0 && a.trail.length > 5) {
            const idx = Math.floor(a.trail.length * (0.5 + Math.random() * 0.3));
            const sp = a.trail[idx];
            a.sparks.push({
              x: sp.x + (Math.random() - 0.5) * 6,
              y: sp.y + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              life: 15 + Math.random() * 10,
              age: 0,
              size: 1 + Math.random() * 0.8,
            });
          }
          a.sparks = a.sparks.filter(s => s.age < s.life);
          for (const s of a.sparks) {
            const sf = 1 - s.age / s.life;
            ctx.globalAlpha = sf * 0.35;
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * sf, 0, Math.PI * 2);
            ctx.fill();
            s.x += s.vx;
            s.y += s.vy;
            s.age += 1;
          }
          // --- Orange glow around asteroid ---
          ctx.globalAlpha = 0.15;
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 25;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.size * 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          // --- Fiery front (world space, always points in travel direction) ---
          const fAng = Math.atan2(a.vy, a.vx);
          const fx = a.x + Math.cos(fAng) * a.size * 0.7;
          const fy = a.y + Math.sin(fAng) * a.size * 0.7;
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(fx, fy, a.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.arc(fx, fy, a.size * 0.25, 0, Math.PI * 2);
          ctx.fill();
          // --- Rocky body (local space, rotating) ---
          ctx.translate(a.x, a.y);
          ctx.rotate(a.rot);
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = '#57534e';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 3;
          ctx.beginPath();
          for (let v = 0; v < a.verts.length; v++) {
            const px = Math.cos(a.verts[v].a) * a.size * a.verts[v].r;
            const py = Math.sin(a.verts[v].a) * a.size * a.verts[v].r;
            if (v === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
          a.x += a.vx;
          a.y += a.vy;
          a.age += 1;
          if (a.age >= a.life) this._activeAsteroid = null;
        }

        // ---- LAYER 4i: Distant aurora-like light band ----
        ctx.save();
        ctx.globalAlpha = 0.02 + Math.sin(time * 0.008) * 0.008;
        const auroraGrad = ctx.createLinearGradient(0, screenH * 0.05, 0, screenH * 0.35);
        auroraGrad.addColorStop(0, 'rgba(0,0,0,0)');
        auroraGrad.addColorStop(0.3, 'rgba(6,182,212,0.03)');
        auroraGrad.addColorStop(0.5, 'rgba(168,85,247,0.04)');
        auroraGrad.addColorStop(0.7, 'rgba(6,182,212,0.03)');
        auroraGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = auroraGrad;
        ctx.fillRect(0, 0, screenW, screenH);
        ctx.restore();
      } else if (theme === 'jungle') {
        try {
        const camParallax = (this.cameraX || 0) * 0.02;

        // ================================================================
        // DEPTH LAYER 1 ??? VERY FAR BACKGROUND (sky, mountains, silhouettes, fog)
        // Parallax: 0.02???0.08x. Deepest atmospheric backdrop.
        // ================================================================

        // 1a. Sky ??? pale morning sky through canopy gap
        ctx.save();
        const skyGrad = ctx.createLinearGradient(0, 0, 0, screenH * 0.5);
        skyGrad.addColorStop(0, 'rgba(70, 100, 120, 0.12)');
        skyGrad.addColorStop(0.3, 'rgba(60, 95, 100, 0.08)');
        skyGrad.addColorStop(0.6, 'rgba(50, 85, 75, 0.04)');
        skyGrad.addColorStop(1, 'rgba(30, 60, 45, 0)');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, screenW, screenH * 0.5);
        ctx.restore();

        // 1b. Distant rainforest mountains (3 overlapping layers)
        ctx.save();
        const mountOffset = camParallax * 0.02;
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#1a3a2a';
        ctx.beginPath();
        ctx.moveTo(0, screenH);
        for (let x = 0; x <= screenW; x += 3) {
          const m1 = Math.sin((x + mountOffset) * 0.001 + time * 0.001) * 50;
          const m2 = Math.sin((x + mountOffset) * 0.003 + time * 0.0015 + 1.5) * 30;
          const m3 = Math.sin((x + mountOffset) * 0.006 + time * 0.0008 + 3.0) * 18;
          ctx.lineTo(x, screenH * 0.30 + m1 + m2 * 0.5 + m3 * 0.3);
        }
        ctx.lineTo(screenW, screenH);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.09;
        ctx.fillStyle = '#2a4a38';
        ctx.beginPath();
        ctx.moveTo(0, screenH);
        for (let x = 0; x <= screenW; x += 3) {
          const m1 = Math.sin((x + mountOffset) * 0.0015 + time * 0.0008 + 0.5) * 42;
          const m2 = Math.sin((x + mountOffset) * 0.004 + time * 0.0012 + 2.0) * 25;
          ctx.lineTo(x, screenH * 0.27 + m1 + m2 * 0.5);
        }
        ctx.lineTo(screenW, screenH);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#3a5a3a';
        ctx.beginPath();
        ctx.moveTo(0, screenH);
        for (let x = 0; x <= screenW; x += 3) {
          const m1 = Math.sin((x + mountOffset * 1.3) * 0.002 + time * 0.001 + 1.2) * 35;
          ctx.lineTo(x, screenH * 0.24 + m1);
        }
        ctx.lineTo(screenW, screenH);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 1c. Atmospheric haze / soft morning fog (very top)
        ctx.save();
        const hazeGrad = ctx.createLinearGradient(0, 0, 0, screenH * 0.35);
        hazeGrad.addColorStop(0, 'rgba(180, 210, 200, 0.06)');
        hazeGrad.addColorStop(0.4, 'rgba(160, 200, 190, 0.04)');
        hazeGrad.addColorStop(1, 'rgba(140, 180, 170, 0)');
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(0, 0, screenW, screenH * 0.35);
        ctx.restore();

        // 1d. Distant jungle silhouette (noise-based continuous strip)
        ctx.save();
        const silOffset = camParallax * 0.04;
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#0d2a18';
        ctx.beginPath();
        ctx.moveTo(0, screenH);
        for (let x = 0; x <= screenW; x += 2) {
          const n1 = Math.sin((x + silOffset) * 0.004 + time * 0.0005) * 18;
          const n2 = Math.sin((x + silOffset) * 0.009 + time * 0.0008 + 1.7) * 12;
          const n3 = Math.sin((x + silOffset) * 0.015 + time * 0.001 + 4.2) * 7;
          ctx.lineTo(x, screenH * 0.35 + n1 + n2 + n3);
        }
        ctx.lineTo(screenW, screenH);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // ================================================================
        // DEPTH LAYER 2 ??? FAR BACKGROUND CONTINUOUS CANOPY
        // Parallax: 0.08???0.20x. Blended thousands of crowns ??? aerial view.
        // ================================================================

        ctx.save();
        const canopyBaseX = camParallax * 0.10;
        const canopyLayers = [
          { y: 0.34, amp: 35, freq1: 0.003, freq2: 0.007, alpha: 0.22, color: '#0d3b1c', offset: 0 },
          { y: 0.30, amp: 30, freq1: 0.0035, freq2: 0.008, alpha: 0.18, color: '#1a5e2a', offset: 0.7 },
          { y: 0.27, amp: 26, freq1: 0.004, freq2: 0.009, alpha: 0.14, color: '#2d6a30', offset: 1.5 },
          { y: 0.24, amp: 22, freq1: 0.0045, freq2: 0.01, alpha: 0.11, color: '#4a7a3a', offset: 2.2 },
          { y: 0.21, amp: 18, freq1: 0.005, freq2: 0.011, alpha: 0.08, color: '#6a8a3a', offset: 3.0 }
        ];
        for (const cl of canopyLayers) {
          const cx = canopyBaseX * (1 + cl.offset * 0.1);
          ctx.globalAlpha = cl.alpha;
          ctx.fillStyle = cl.color;
          ctx.beginPath();
          ctx.moveTo(0, screenH);
          for (let x = 0; x <= screenW; x += 2) {
            const w1 = Math.sin((x + cx) * cl.freq1 + time * 0.0006 + cl.offset) * cl.amp;
            const w2 = Math.sin((x + cx) * cl.freq2 + time * 0.001 + cl.offset * 1.3) * cl.amp * 0.5;
            ctx.lineTo(x, screenH * cl.y + w1 + w2);
          }
          ctx.lineTo(screenW, screenH);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // ================================================================
        // DEPTH LAYER 3 ??? MIDDLE BACKGROUND (individual Amazon trees)
        // Parallax: 0.25???0.50x. Kapok, rubber, palm ??? massive trunks & crowns.
        // ================================================================

        ctx.save();
        const midTreeOff = camParallax * 0.50;
        for (const t of this._jungleGiantTrees) {
          const tx = t.x * screenW + midTreeOff * t.parallax;
          const baseY = t.baseY * screenH;
          const trunkW = t.trunkW;
          const trunkH = t.trunkH * screenH;
          const sway = Math.sin(time * 0.001 + t.phase) * 2;
          const leanX = t.lean || 0;
          const crownCY = baseY - trunkH + (t.crownY || -0.06) * screenH;
          const cw = t.crownW || 25;
          const ch = t.crownH || 16;

          // Bark texture ??? vertical stripes on trunk
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = t.barkColor;
          ctx.beginPath();
          ctx.moveTo(tx - trunkW * 0.5 + sway + leanX, baseY);
          ctx.lineTo(tx - trunkW * 0.35 + sway + leanX, baseY - trunkH);
          ctx.lineTo(tx + trunkW * 0.35 + sway, baseY - trunkH);
          ctx.lineTo(tx + trunkW * 0.5 + sway, baseY);
          ctx.closePath();
          ctx.fill();
          // Bark texture lines
          ctx.globalAlpha = 0.06;
          ctx.strokeStyle = '#0d1a10';
          ctx.lineWidth = 0.5;
          for (let bt = 0; bt < 5; bt++) {
            const bx = tx + sway + leanX * (1 - bt * 0.15) + (bt - 2) * trunkW * 0.12;
            ctx.beginPath();
            ctx.moveTo(bx, baseY);
            ctx.lineTo(bx, baseY - trunkH * 0.9);
            ctx.stroke();
          }

          // Crown ??? deep shadow layer (back)
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = t.crownColor || '#0d3b1c';
          const cPhase1 = Math.sin(t.phase + time * 0.0005) * cw * 0.15;
          const cPhase2 = Math.cos(t.phase * 0.7 + time * 0.0008) * ch * 0.12;
          ctx.beginPath();
          ctx.ellipse(tx + cPhase1 + leanX + sway, crownCY + cPhase2, cw, ch, 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(tx - cw * 0.35 + cPhase1 * 0.5 + leanX * 0.5 + sway, crownCY + ch * 0.15, cw * 0.7, ch * 0.65, -0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(tx + cw * 0.3 - cPhase1 * 0.5 + sway, crownCY - ch * 0.1, cw * 0.6, ch * 0.7, 0.15, 0, Math.PI * 2);
          ctx.fill();

          // Crown ??? main dome
          ctx.globalAlpha = 0.20;
          ctx.fillStyle = t.crownHighlight || '#1a5e2a';
          ctx.beginPath();
          ctx.ellipse(tx + sway + leanX * 0.3, crownCY, cw * 0.9, ch * 0.85, 0, 0, Math.PI * 2);
          ctx.fill();

          // Crown ??? sunlit top highlight
          ctx.globalAlpha = 0.08;
          ctx.fillStyle = '#3a7a3a';
          ctx.beginPath();
          ctx.ellipse(tx - cw * 0.1 + sway + leanX * 0.2, crownCY - ch * 0.2, cw * 0.35, ch * 0.28, -0.15, 0, Math.PI * 2);
          ctx.fill();

          // Leaf cluster bumps around crown edge
          ctx.globalAlpha = 0.12;
          ctx.fillStyle = t.crownColor || '#0d3b1c';
          const bumpCount = 5 + (t.species === 'kapok' ? 2 : 0);
          for (let bi = 0; bi < bumpCount; bi++) {
            const ba = bi * (Math.PI * 2 / bumpCount) + t.phase * 0.3;
            const bx = tx + sway + leanX * 0.3 + Math.cos(ba) * cw * 0.7;
            const by = crownCY + Math.sin(ba) * ch * 0.6;
            const bw = cw * 0.25 + Math.sin(t.phase + bi * 1.3) * cw * 0.05;
            const bh = ch * 0.30 + Math.cos(t.phase * 0.5 + bi * 0.7) * ch * 0.04;
            ctx.beginPath();
            ctx.ellipse(bx, by, bw, bh, Math.sin(bi + t.phase) * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }

          // Smaller leaf detail clusters (lighter green dots)
          ctx.globalAlpha = 0.06;
          ctx.fillStyle = '#4a8a3a';
          for (let li = 0; li < 6; li++) {
            const la = li * 1.05 + t.phase;
            const lx = tx + sway + leanX * 0.3 + Math.cos(la) * cw * 0.5 + Math.sin(time * 0.0008 + li) * 3;
            const ly = crownCY + Math.sin(la) * ch * 0.4 + Math.cos(time * 0.001 + li) * 2;
            ctx.beginPath();
            ctx.arc(lx, ly, 2 + Math.sin(t.phase + li) * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Branches extending outward
          ctx.globalAlpha = 0.12;
          ctx.strokeStyle = t.barkColor;
          ctx.lineWidth = trunkW * 0.12;
          const branchCount = 3 + ((t.species === 'rubber') ? 1 : 0);
          for (let b = 0; b < branchCount; b++) {
            const ba = -0.7 + b * 0.45 + Math.sin(t.phase + b) * 0.2;
            const bStartY = baseY - trunkH * (0.45 + b * 0.15);
            const bLen = trunkH * (0.12 + Math.sin(t.phase + b * 1.3) * 0.04);
            const bEndX = tx + sway + leanX * (1 - b * 0.15) + Math.cos(ba) * bLen;
            const bEndY = bStartY + Math.sin(ba) * bLen * 0.3;
            ctx.beginPath();
            ctx.moveTo(tx + sway + leanX * (1 - b * 0.15), bStartY);
            ctx.quadraticCurveTo(tx + sway + leanX * (1 - b * 0.15) + Math.cos(ba) * bLen * 0.5, bStartY - bLen * 0.1, bEndX, bEndY);
            ctx.stroke();
            // Small leaf cluster at branch tip
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#2a6a2a';
            ctx.beginPath();
            ctx.ellipse(bEndX, bEndY, 4, 3, ba, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.12;
          }

          // Buttress roots (kapok-style)
          if (t.species === 'kapok' || t.hasButtress) {
            ctx.globalAlpha = 0.16;
            ctx.fillStyle = t.barkColor;
            ctx.beginPath();
            ctx.moveTo(tx - trunkW * 1.0 + sway + leanX, baseY);
            ctx.quadraticCurveTo(tx - trunkW * 0.3 + sway + leanX * 0.5, baseY + 8, tx + sway + leanX * 0.3, baseY + 4);
            ctx.quadraticCurveTo(tx + trunkW * 0.3 + sway, baseY + 8, tx + trunkW * 1.0 + sway, baseY);
            ctx.fill();
            // Second buttress layer
            ctx.globalAlpha = 0.10;
            ctx.beginPath();
            ctx.moveTo(tx - trunkW * 1.3 + sway + leanX, baseY);
            ctx.quadraticCurveTo(tx - trunkW * 0.4 + sway + leanX * 0.3, baseY + 12, tx + sway + leanX * 0.3, baseY + 6);
            ctx.quadraticCurveTo(tx + trunkW * 0.4 + sway, baseY + 12, tx + trunkW * 1.3 + sway, baseY);
            ctx.fill();
          }

          // Moss patches on trunk
          ctx.globalAlpha = 0.07;
          for (let m = 0; m < 3; m++) {
            const my = baseY - trunkH * (0.25 + m * 0.3);
            const mw = trunkW * (0.3 + Math.sin(t.phase + m * 2.0) * 0.15);
            ctx.fillStyle = '#2a5a28';
            ctx.beginPath();
            ctx.ellipse(tx + sway + leanX * (1 - m * 0.1) + Math.sin(t.phase + m * 1.5) * trunkW * 0.2, my, mw, mw * 0.3, 0.2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Vines wrapped around trunk
          ctx.globalAlpha = 0.05;
          ctx.strokeStyle = '#3a4a38';
          ctx.lineWidth = 0.8;
          const vineWrapCount = 2 + (t.species === 'rubber' ? 1 : 0);
          for (let vw = 0; vw < vineWrapCount; vw++) {
            const vwStart = baseY - trunkH * (0.3 + vw * 0.25);
            ctx.beginPath();
            for (let vwy = 0; vwy < trunkH * 0.25; vwy += 2) {
              const vwx = tx + sway + leanX * (1 - vw * 0.1) + Math.sin(vwy * 0.08 + time * 0.0005 + t.phase + vw) * trunkW * 0.4;
              const vwy2 = vwStart - vwy;
              if (vwy === 0) ctx.moveTo(vwx, vwy2);
              else ctx.lineTo(vwx, vwy2);
            }
            ctx.stroke();
          }
        }
        ctx.restore();

        // ================================================================
        // DEPTH LAYER 3b ??? MIDDLE BACKGROUND (distant waterfalls)
        // Parallax: 0.15???0.30x. Soft, semi-transparent, behind everything.
        // ================================================================

        ctx.save();
        for (const wf of this._jungleWaterfalls) {
          const wfx = wf.x * screenW + camParallax * wf.parallax;
          const wfy = wf.y * screenH;
          const wfw = wf.width;
          const wfh = wf.height * screenH;
          ctx.globalAlpha = 0.07 + 0.02 * Math.sin(time * 0.002 + wf.phase);
          const waterGrad = ctx.createLinearGradient(wfx - wfw * 0.5, wfy, wfx + wfw * 0.5, wfy);
          waterGrad.addColorStop(0, 'rgba(200, 230, 255, 0)');
          waterGrad.addColorStop(0.2, 'rgba(200, 235, 255, 0.08)');
          waterGrad.addColorStop(0.5, 'rgba(220, 240, 255, 0.12)');
          waterGrad.addColorStop(0.8, 'rgba(200, 235, 255, 0.08)');
          waterGrad.addColorStop(1, 'rgba(200, 230, 255, 0)');
          ctx.fillStyle = waterGrad;
          ctx.fillRect(wfx - wfw * 0.5, wfy, wfw, wfh);
          // Waterfall strands
          ctx.globalAlpha = 0.04;
          ctx.fillStyle = 'rgba(220, 240, 255, 0.08)';
          for (let s = 0; s < 4; s++) {
            const sx = wfx - wfw * 0.3 + s * wfw * 0.2 + Math.sin(time * 0.003 + s + wf.phase) * 2;
            ctx.fillRect(sx, wfy + Math.sin(s * 2.0 + time * 0.004 + wf.phase) * 5, 1.5, wfh * 0.7);
          }
          // Mist at base
          ctx.globalAlpha = 0.05;
          const mistGrad = ctx.createRadialGradient(wfx, wfy + wfh, 0, wfx, wfy + wfh, wfw * 2.5);
          mistGrad.addColorStop(0, 'rgba(200, 230, 240, 0.07)');
          mistGrad.addColorStop(1, 'rgba(200, 230, 240, 0)');
          ctx.fillStyle = mistGrad;
          ctx.beginPath();
          ctx.arc(wfx, wfy + wfh, wfw * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // ================================================================
        // DEPTH LAYER 3c ??? AMAZON RIVER (winding, behind trees)
        // Parallax: 0.20???0.30x. Muddy water visible through canopy openings.
        // ================================================================

        if (this._jungleRiver && this._jungleRiver.segments) {
          ctx.save();
          const segments = this._jungleRiver.segments;
          const riverParallax = this._jungleRiver.parallax || 0.25;
          const riverOffset = camParallax * riverParallax;
          ctx.beginPath();
          const pts = segments.map((s, i) => ({
            x: s.x * screenW + riverOffset,
            y: s.y * screenH + Math.sin(time * 0.0006 + s.phase) * 4,
            w: s.width + Math.sin(time * 0.0008 + s.phase * 0.7) * 1.5
          }));
          ctx.moveTo(pts[0].x, pts[0].y - pts[0].w);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y - pts[i].w);
          }
          for (let i = pts.length - 1; i >= 0; i--) {
            ctx.lineTo(pts[i].x, pts[i].y + pts[i].w);
          }
          ctx.closePath();
          ctx.globalAlpha = 0.10;
          ctx.fillStyle = '#4a5a3a';
          ctx.fill();
          ctx.globalAlpha = 0.03;
          ctx.strokeStyle = '#6a7a5a';
          ctx.lineWidth = 1;
          for (let r = 0; r < 4; r++) {
            const rippleY = 0.38 + r * 0.05 + Math.sin(time * 0.001 + r * 1.3) * 0.015;
            ctx.beginPath();
            for (let i = 0; i < pts.length; i++) {
              const rx = pts[i].x;
              const ry = rippleY * screenH + Math.sin(time * 0.002 + r * 2.0 + i * 0.5) * 2;
              if (i === 0) ctx.moveTo(rx, ry);
              else ctx.lineTo(rx + Math.sin(time * 0.0015 + r + i) * 3, ry);
            }
            ctx.stroke();
          }
          // Tiny river reflections (light glints on water)
          ctx.globalAlpha = 0.02;
          ctx.fillStyle = 'rgba(200, 220, 180, 0.3)';
          for (let ri = 0; ri < 5; ri++) {
            const riX = pts[ri * 2 < pts.length ? ri * 2 : pts.length - 1].x + Math.sin(time * 0.002 + ri * 2) * 8;
            const riY = pts[ri * 2 < pts.length ? ri * 2 : pts.length - 1].y + Math.sin(time * 0.003 + ri * 1.5) * 5;
            ctx.beginPath();
            ctx.ellipse(riX, riY, 3, 1.5, Math.sin(time * 0.001 + ri) * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // ================================================================
        // DEPTH LAYER 4 ??? FOREGROUND BACKGROUND (roots, logs, bushes, ferns, bamboo)
        // Parallax: 0.50???0.60x. Near track level but strictly behind gameplay.
        // ================================================================

        // 4a. Tree roots and fallen logs
        ctx.save();
        const rootOff = camParallax * 0.55;
        for (const r of this._jungleRoots) {
          const rx = r.x * screenW + rootOff * r.parallax;
          const ry = r.y * screenH;
          const rLen = r.len;
          const rWid = r.width;
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = '#2a1f18';
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.quadraticCurveTo(rx + r.dirX * rLen * 0.5, ry - rLen * 0.3, rx + r.dirX * rLen, ry - rLen * 0.6);
          ctx.quadraticCurveTo(rx + r.dirX * rLen * 0.7, ry - rLen * 0.4, rx + r.dirX * rLen * 0.3, ry);
          ctx.closePath();
          ctx.fill();
          if (r.wrapRock) {
            ctx.globalAlpha = 0.10;
            ctx.fillStyle = '#3a3a30';
            ctx.beginPath();
            ctx.ellipse(rx + r.dirX * rLen * 0.4, ry - rLen * 0.35, rWid * 0.8, rWid * 0.5, r.dirX * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

        // 4b. Foreground bushes (broad leaf clusters near track edges)
        ctx.save();
        const bushOff = camParallax * 0.60;
        for (let i = 0; i < 8; i++) {
          const seed = i * 73.1;
          const bx = ((i / 8) * screenW + Math.sin(seed + time * 0.0005) * 15 + bushOff * (0.5 + Math.sin(seed * 0.3) * 0.1)) % (screenW + 20) - 10;
          const by = screenH * (0.72 + Math.sin(seed * 1.7) * 0.06);
          const bushSize = 10 + Math.sin(seed * 0.9) * 4;
          const sway2 = Math.sin(time * 0.0006 + seed) * 2;
          ctx.globalAlpha = 0.10 + Math.sin(seed * 0.5) * 0.03;
          // Main bush mass
          ctx.fillStyle = '#1a4a28';
          ctx.beginPath();
          ctx.ellipse(bx + sway2, by, bushSize, bushSize * 0.6, 0.2, 0, Math.PI * 2);
          ctx.fill();
          // Lighter highlight
          ctx.globalAlpha *= 0.6;
          ctx.fillStyle = '#2a6a3a';
          ctx.beginPath();
          ctx.ellipse(bx + sway2 - bushSize * 0.2, by - bushSize * 0.15, bushSize * 0.5, bushSize * 0.35, -0.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // 4c. Ferns near ground
        ctx.save();
        const fernOff = camParallax * 0.55;
        for (let i = 0; i < 6; i++) {
          const seed = i * 53.7;
          const fx = ((i / 6) * screenW * 1.1 - screenW * 0.05 + fernOff * (0.4 + Math.sin(seed * 0.2) * 0.1)) % (screenW + 10);
          const fy = screenH * (0.75 + Math.sin(seed * 2.1) * 0.05);
          const fLen = 15 + Math.sin(seed) * 5;
          const fSway = Math.sin(time * 0.0007 + seed) * 2;
          ctx.globalAlpha = 0.08;
          ctx.strokeStyle = '#2a5a2a';
          ctx.lineWidth = 0.8;
          // Fern fronds radiating from base
          for (let fr = 0; fr < 4; fr++) {
            const fAngle = -0.6 + fr * 0.4 + Math.sin(seed + fr) * 0.1;
            ctx.beginPath();
            ctx.moveTo(fx + fSway, fy);
            for (let fl = 0; fl < fLen; fl += 2) {
              const fdx = Math.cos(fAngle) * fl + Math.sin(fl * 0.2 + time * 0.001 + seed + fr) * 1.5;
              const fdy = -Math.sin(fAngle) * fl * 0.4;
              ctx.lineTo(fx + fSway + fdx, fy + fdy);
            }
            ctx.stroke();
          }
        }
        ctx.restore();

        // 4d. Bamboo clusters
        ctx.save();
        const bambooOff = camParallax * 0.52;
        for (let i = 0; i < 4; i++) {
          const seed = i * 97.3;
          const bx = ((i / 4) * screenW * 1.0 + bambooOff * 0.6) % (screenW + 20);
          const by = screenH * 0.78;
          const bSway = Math.sin(time * 0.0008 + seed) * 2;
          ctx.globalAlpha = 0.09;
          ctx.strokeStyle = '#3a5a2a';
          ctx.lineWidth = 1.2;
          for (let bc = 0; bc < 4; bc++) {
            const bOffX = (bc - 1.5) * 3 + bSway;
            const bH = 25 + Math.sin(seed + bc * 1.5) * 6;
            ctx.beginPath();
            ctx.moveTo(bx + bOffX, by);
            ctx.lineTo(bx + bOffX + Math.sin(time * 0.0005 + seed + bc) * 1.5, by - bH);
            ctx.stroke();
            // Bamboo nodes
            ctx.fillStyle = '#4a6a3a';
            for (let bn = 0; bn < 3; bn++) {
              const ny = by - bH * (0.2 + bn * 0.25);
              ctx.beginPath();
              ctx.ellipse(bx + bOffX + Math.sin(time * 0.0005 + seed + bc) * 1.5, ny, 1.5, 0.5, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        ctx.restore();

        // ================================================================
        // DEPTH LAYER 5 ??? UPPER BORDER (branches, vines, leaves from above)
        // Parallax: 0.45???0.55x. Surrounds the race from above ??? behind gameplay.
        // ================================================================

        // 5a. Hanging vines from upper canopy (increased density)
        ctx.save();
        const vineOff = camParallax * 0.50;
        for (let i = 0; i < 28; i++) {
          const vx = ((i / 28) * screenW + Math.sin(i * 2.3 + time * 0.002) * 30 + vineOff) % (screenW + 25) - 12;
          const vineLen = 50 + Math.sin(i * 3.7 + time * 0.001) * 25 + (i % 5) * 15;
          const topY = screenH * (0.25 + Math.sin(i * 1.3) * 0.08);
          ctx.globalAlpha = 0.05 + (i % 4) * 0.015;
          ctx.strokeStyle = i % 3 === 0 ? '#2a3a28' : (i % 3 === 1 ? '#3a4a38' : '#4a5a3a');
          ctx.lineWidth = 0.6 + (i % 5) * 0.25;
          ctx.beginPath();
          ctx.moveTo(vx, topY);
          for (let vy = 0; vy < vineLen; vy += 2) {
            const sway = Math.sin(vy * 0.04 + time * 0.0006 + i * 2.0) * (2 + (i % 4));
            ctx.lineTo(vx + sway, topY + vy);
          }
          ctx.stroke();
          // Leaf or bud at vine tip for some vines
          if (i % 4 === 0) {
            ctx.fillStyle = '#3a5a38';
            ctx.globalAlpha = 0.04;
            const endX = vx + Math.sin(vineLen * 0.04 + time * 0.0006 + i * 2.0) * (2 + (i % 4));
            const endY = topY + vineLen;
            ctx.beginPath();
            ctx.ellipse(endX, endY, 2.5, 1.5, 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

        // 5b. Cross-vines connecting upper tree branches
        if (this._jungleCrossVines) {
          ctx.save();
          const crossVineOff = camParallax * 0.48;
          for (const cv of this._jungleCrossVines) {
            const x1 = cv.x1 * screenW + crossVineOff;
            const y1 = cv.y1 * screenH;
            const x2 = cv.x2 * screenW + crossVineOff;
            const y2 = cv.y2 * screenH;
            const sag = cv.sag + Math.sin(time * 0.0006 + cv.phase) * 3;
            ctx.globalAlpha = 0.05;
            ctx.strokeStyle = '#2a3a28';
            ctx.lineWidth = cv.width;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 + sag;
            ctx.quadraticCurveTo(mx + Math.sin(time * 0.0005 + cv.phase) * 5, my, x2, y2);
            ctx.stroke();
            // Thin secondary strand
            ctx.globalAlpha = 0.03;
            ctx.strokeStyle = '#3a4a38';
            ctx.lineWidth = cv.width * 0.3;
            ctx.beginPath();
            ctx.moveTo(x1 + 3, y1 + 2);
            const mx2 = mx + Math.sin(time * 0.0007 + cv.phase + 1) * 4;
            ctx.quadraticCurveTo(mx2, my + 2, x2 + 3, y2 + 2);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 5c. Upper border branches (extending from top of screen downward)
        ctx.save();
        const brOff = camParallax * 0.50;
        for (let i = 0; i < 5; i++) {
          const seed = i * 83.2;
          const bx = ((i / 5) * screenW + brOff * 0.7 + Math.sin(time * 0.0003 + seed) * 15) % (screenW + 10);
          const branchLen = 40 + Math.sin(seed * 1.5) * 15;
          const angle = 0.3 + Math.sin(seed * 0.7) * 0.15;
          ctx.globalAlpha = 0.08;
          ctx.strokeStyle = '#2a1f18';
          ctx.lineWidth = 4 + Math.sin(seed) * 1.5;
          ctx.beginPath();
          ctx.moveTo(bx, 0);
          ctx.quadraticCurveTo(bx + Math.cos(angle) * branchLen * 0.5, branchLen * 0.5, bx + Math.cos(angle) * branchLen, branchLen);
          ctx.stroke();
          // Thinner sub-branches
          ctx.lineWidth = 1.5;
          for (let sb = 0; sb < 2; sb++) {
            const sbAngle = angle + (-0.2 + sb * 0.4) + Math.sin(seed + sb) * 0.1;
            const sbStart = branchLen * (0.3 + sb * 0.2);
            const sbLen = 15 + Math.sin(seed + sb * 2) * 5;
            ctx.beginPath();
            ctx.moveTo(bx + Math.cos(angle) * sbStart, sbStart);
            ctx.quadraticCurveTo(bx + Math.cos(angle) * sbStart + Math.cos(sbAngle) * sbLen * 0.5, sbStart - sbLen * 0.3, bx + Math.cos(angle) * sbStart + Math.cos(sbAngle) * sbLen, sbStart - sbLen);
            ctx.stroke();
          }
          // Leaf clusters at branch ends
          ctx.globalAlpha = 0.05;
          ctx.fillStyle = '#1a4a28';
          const leafX = bx + Math.cos(angle) * branchLen;
          const leafY = branchLen;
          ctx.beginPath();
          ctx.ellipse(leafX + Math.sin(time * 0.0005 + seed) * 2, leafY, 7, 4, angle - 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2a6a3a';
          ctx.beginPath();
          ctx.ellipse(leafX + 4 + Math.sin(time * 0.0006 + seed + 1) * 2, leafY - 3, 5, 3, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // ================================================================
        // DEPTH LAYER 6 ??? LOWER BORDER (river banks, rocks, vegetation near bottom)
        // Parallax: 0.55???0.70x. Surrounds the race from below.
        // ================================================================

        // 6a. River banks and exposed roots near water
        ctx.save();
        const bankOff = camParallax * 0.60;
        for (let i = 0; i < 6; i++) {
          const seed = i * 67.4;
          const bx = ((i / 6) * screenW * 1.1 - screenW * 0.05 + bankOff * 0.7 + Math.sin(seed + time * 0.0003) * 10) % (screenW + 15);
          const by = screenH * (0.80 + Math.sin(seed * 1.3) * 0.04);
          ctx.globalAlpha = 0.12;
          // Mud bank
          ctx.fillStyle = '#3a3a28';
          ctx.beginPath();
          ctx.ellipse(bx, by, 20 + Math.sin(seed) * 5, 6 + Math.sin(seed * 0.7) * 2, 0.3, 0, Math.PI * 2);
          ctx.fill();
          // Roots emerging from bank
          ctx.globalAlpha = 0.10;
          ctx.strokeStyle = '#2a1f18';
          ctx.lineWidth = 1.5 + Math.sin(seed * 0.5) * 0.5;
          for (let ri = 0; ri < 2; ri++) {
            const rAngle = 0.5 + ri * 0.8 + Math.sin(seed + ri) * 0.15;
            const rLen = 10 + Math.sin(seed + ri * 2) * 4;
            ctx.beginPath();
            ctx.moveTo(bx + (ri - 0.5) * 8, by);
            ctx.quadraticCurveTo(bx + (ri - 0.5) * 8 + Math.cos(rAngle) * rLen * 0.5, by - rLen * 0.3, bx + (ri - 0.5) * 8 + Math.cos(rAngle) * rLen, by - rLen * 0.5);
            ctx.stroke();
          }
        }
        ctx.restore();

        // 6b. Rocks near river edge
        ctx.save();
        const rockOff = camParallax * 0.62;
        for (let i = 0; i < 5; i++) {
          const seed = i * 43.9;
          const rx = ((i / 5) * screenW + rockOff * 0.6 + Math.sin(seed + time * 0.0002) * 8) % (screenW + 10);
          const ry = screenH * (0.82 + Math.sin(seed * 2.1) * 0.04);
          const rSize = 5 + Math.sin(seed) * 2;
          ctx.globalAlpha = 0.12;
          ctx.fillStyle = '#3a3a30';
          ctx.beginPath();
          ctx.ellipse(rx, ry, rSize, rSize * 0.6, Math.sin(seed * 0.3) * 0.2, 0, Math.PI * 2);
          ctx.fill();
          // Highlight
          ctx.globalAlpha = 0.04;
          ctx.fillStyle = '#5a5a50';
          ctx.beginPath();
          ctx.ellipse(rx - rSize * 0.2, ry - rSize * 0.2, rSize * 0.4, rSize * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // 6c. Lower border ferns and broad leaves
        ctx.save();
        const lowerOff = camParallax * 0.58;
        for (let i = 0; i < 7; i++) {
          const seed = i * 61.5;
          const lx = ((i / 7) * screenW * 1.15 - screenW * 0.07 + lowerOff * 0.65 + Math.sin(seed * 0.5 + time * 0.0004) * 12) % (screenW + 15);
          const ly = screenH * (0.84 + Math.sin(seed * 1.9) * 0.03);
          const lSway = Math.sin(time * 0.0005 + seed) * 2;
          ctx.globalAlpha = 0.09;
          // Broad tropical leaf
          ctx.fillStyle = '#1a4a2a';
          ctx.beginPath();
          ctx.ellipse(lx + lSway, ly, 12 + Math.sin(seed) * 3, 5 + Math.sin(seed * 0.7) * 1.5, 0.4 + Math.sin(seed) * 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2a6a3a';
          ctx.beginPath();
          ctx.ellipse(lx + lSway - 3, ly - 2, 6 + Math.sin(seed * 0.5) * 2, 3, 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // ================================================================
        // SUN RAYS (soft light filtering through canopy, between layers 3-5)
        // Parallax: 0.10x. Gentle golden shafts.
        // ================================================================

        ctx.save();
        const rayPhase = Math.sin(time * 0.015) * 0.2 + 0.8;
        for (let i = 0; i < this._jungleSunRays.length; i++) {
          const sr = this._jungleSunRays[i];
          const rx = sr.x * screenW + camParallax * sr.parallax + Math.sin(time * 0.008 + i * 1.5) * 20;
          const pulse = rayPhase * (0.7 + 0.3 * Math.sin(time * 0.01 + sr.phase));
          ctx.globalAlpha = 0.025 * pulse;
          const grad = ctx.createLinearGradient(rx, 0, rx + sr.width * 0.3, screenH * 0.5);
          grad.addColorStop(0, 'rgba(240, 220, 170, 0.10)');
          grad.addColorStop(0.5, 'rgba(230, 210, 160, 0.05)');
          grad.addColorStop(1, 'rgba(220, 200, 150, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(rx - sr.width * 0.3, 0);
          ctx.lineTo(rx + sr.width * 0.3, 0);
          ctx.lineTo(rx + sr.width * 0.3, screenH * 0.50);
          ctx.lineTo(rx - sr.width * 0.3, screenH * 0.50);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // ================================================================
        // ATMOSPHERIC MIST (low fog, drifts across scene, behind gameplay)
        // ================================================================

        ctx.save();
        for (const m of this._jungleMistParticles) {
          const mx = (m.x * screenW + camParallax * 0.15 + Math.sin(time * 0.0008 + m.phase) * 25) % (screenW + 40) - 20;
          const my = m.y * screenH + Math.sin(time * 0.001 + m.phase * 0.7) * 8;
          ctx.globalAlpha = m.alpha * (0.7 + 0.3 * Math.sin(time * 0.002 + m.phase));
          const mistGrad = ctx.createRadialGradient(mx, my, 0, mx, my, m.size);
          mistGrad.addColorStop(0, 'rgba(190, 220, 200, 0.05)');
          mistGrad.addColorStop(0.5, 'rgba(180, 210, 190, 0.03)');
          mistGrad.addColorStop(1, 'rgba(170, 200, 180, 0)');
          ctx.fillStyle = mistGrad;
          ctx.beginPath();
          ctx.arc(mx, my, m.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // ================================================================
        // AMBIENT WILDLIFE & PARTICLES (tiny, sparse, very slow)
        // Strictly behind gameplay, low opacity.
        // ================================================================

        // Distant birds (parrots, toucans flying across)
        ctx.save();
        for (const b of this._jungleBirds) {
          const elapsed = (time * 60 - b.delay) % b.interval;
          const progress = Math.min(elapsed / (b.interval * 0.6), 1);
          if (progress <= 0 || progress >= 1) continue;
          const bx = (b.startX * screenW + progress * screenW * 1.5 + camParallax * 0.08) % (screenW + 100) - 50;
          const by = b.y * screenH + Math.sin(progress * Math.PI + b.phase) * 10;
          ctx.globalAlpha = 0.10 * (1 - Math.abs(progress - 0.5) * 0.6);
          ctx.fillStyle = b.color || '#1a1a2a';
          ctx.beginPath();
          ctx.ellipse(bx, by, 5, 2.5, -0.1, 0, Math.PI * 2);
          ctx.fill();
          const wingUp = Math.sin(progress * 20 + b.phase) * 0.3;
          ctx.beginPath();
          ctx.moveTo(bx - 3, by - 1);
          ctx.lineTo(bx - 7, by - 3 - wingUp * 3);
          ctx.lineTo(bx - 1, by - 1);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(bx + 3, by - 1);
          ctx.lineTo(bx + 7, by - 3 - wingUp * 3);
          ctx.lineTo(bx + 1, by - 1);
          ctx.fill();
          if (b.hasLongTail) {
            ctx.fillStyle = b.tailColor || '#1a1a2a';
            ctx.beginPath();
            ctx.moveTo(bx + 4, by + 2);
            ctx.lineTo(bx + 8, by + 8);
            ctx.lineTo(bx + 5, by + 2);
            ctx.fill();
          }
        }
        ctx.restore();

        // Butterflies (blue, orange, yellow, tiny)
        ctx.save();
        for (const b of this._jungleButterflies) {
          const bx = (b.x * screenW + camParallax * 0.15 + Math.sin(time * b.speed + b.phase) * 30) % (screenW + 20) - 10;
          const by = b.y * screenH + Math.sin(time * b.drift + b.phase * 0.7) * 15;
          const flap = 0.3 + 0.7 * Math.abs(Math.sin(time * 0.005 + b.phase));
          ctx.globalAlpha = 0.10 * flap;
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.ellipse(bx - b.size * 0.4, by, b.size * 0.7, b.size * 0.5 * flap, -0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(bx + b.size * 0.4, by, b.size * 0.7, b.size * 0.5 * flap, 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.05;
          ctx.fillStyle = '#2a3a2a';
          ctx.beginPath();
          ctx.arc(bx, by, b.size * 0.15, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Monkeys (tiny silhouettes)
        ctx.save();
        for (const mk of this._jungleMonkeys) {
          const elapsed = (time * 60 - mk.delay) % mk.interval;
          const progress = Math.min(elapsed / (mk.interval * 0.5), 1);
          if (progress <= 0 || progress >= 1) continue;
          const mkx = mk.x * screenW + camParallax * 0.6 + Math.sin(time * 0.001 + mk.phase) * 3;
          const mky = mk.y * screenH + (progress < 0.5 ? -progress * 20 : -(1 - progress) * 20);
          ctx.globalAlpha = 0.07 * (1 - Math.abs(progress - 0.5) * 0.6);
          ctx.fillStyle = '#1a1a1a';
          ctx.beginPath();
          ctx.ellipse(mkx, mky, 4, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(mkx, mky - 3, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(mkx - 2, mky + 2);
          ctx.quadraticCurveTo(mkx - 6, mky + 8, mkx - 3, mky + 12);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(mkx + 3, mky - 1);
          ctx.lineTo(mkx + 7, mky - 5);
          ctx.stroke();
        }
        ctx.restore();

        // Falling leaves (varied colors, sizes)
        ctx.save();
        for (const l of this._jungleLeaves) {
          const lx = (l.x * screenW + camParallax * 0.3 + Math.sin(time * l.sway + l.phase) * 15) % (screenW + 20) - 10;
          const ly = (l.y * screenH + l.fall * time * 0.005) % (screenH * 1.1);
          const rot = l.rotation + time * 0.002 * l.rotSpeed;
          ctx.globalAlpha = l.alpha * (0.7 + 0.3 * Math.sin(time * 0.003 + l.phase));
          ctx.fillStyle = l.color;
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, l.size, l.size * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        // Tropical flowers (orchids, heliconias near edges)
        ctx.save();
        for (const f of this._jungleFlowers) {
          const sway = Math.sin(f.phase + time * f.swaySpeed) * 2;
          const fx = f.x * screenW + sway;
          const fy = f.y * screenH + Math.sin(f.phase + time * 0.002) * 2;
          ctx.globalAlpha = 0.12 + 0.03 * Math.sin(f.phase + time * 0.002);
          ctx.fillStyle = f.color;
          for (let p = 0; p < (f.isHeliconia ? 3 : (f.isOrchid ? 5 : 4)); p++) {
            const a = (p / (f.isHeliconia ? 3 : (f.isOrchid ? 5 : 4))) * Math.PI * 2 + Math.sin(time * 0.001 + f.phase) * 0.1;
            const px = fx + Math.cos(a) * f.size * (f.isHeliconia ? 0.5 : 0.7);
            const py = fy + Math.sin(a) * f.size * (f.isHeliconia ? 0.5 : 0.7);
            ctx.beginPath();
            if (f.isHeliconia) {
              ctx.ellipse(px, py, f.size * 0.8, f.size * 0.2, a, 0, Math.PI * 2);
            } else {
              ctx.ellipse(px, py, f.size * 0.5, f.size * 0.3, a, 0, Math.PI * 2);
            }
            ctx.fill();
          }
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = '#f1c40f';
          ctx.beginPath();
          ctx.arc(fx, fy, f.size * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Dragonflies (tiny, near water)
        ctx.save();
        for (const d of this._jungleDragonflies) {
          const dx = (d.x * screenW + camParallax * 0.3 + Math.sin(time * d.speed + d.phase) * 30) % (screenW + 20) - 10;
          const dy = d.y * screenH + Math.sin(time * 0.003 + d.phase * 0.5) * 5;
          const wingPulse = 0.3 + 0.7 * Math.sin(time * 0.01 + d.phase);
          ctx.globalAlpha = 0.12 * wingPulse;
          ctx.fillStyle = '#4a7a8a';
          ctx.beginPath();
          ctx.arc(dx, dy, d.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(180, 220, 240, 0.08)';
          ctx.beginPath();
          ctx.ellipse(dx - d.size * 0.5, dy - d.size * 0.2, d.size * 0.8, d.size * 0.15 * wingPulse, -0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(dx + d.size * 0.5, dy - d.size * 0.2, d.size * 0.8, d.size * 0.15 * wingPulse, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Tiny wildlife (frogs, lizards near forest floor)
        ctx.save();
        for (const w of this._jungleWildlife) {
          const wx = w.x * screenW + camParallax * 0.5;
          const wy = w.y * screenH + Math.sin(time * 0.002 + w.phase) * 1;
          ctx.globalAlpha = 0.07;
          if (w.type === 'frog') {
            ctx.fillStyle = '#4a8a4a';
            ctx.beginPath();
            ctx.ellipse(wx, wy, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(wx - 1.5, wy - 1.5, 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(wx + 1.5, wy - 1.5, 1.2, 0, Math.PI * 2);
            ctx.fill();
          } else if (w.type === 'lizard') {
            ctx.fillStyle = '#5a7a4a';
            ctx.beginPath();
            ctx.ellipse(wx, wy, 4, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(wx + 4, wy);
            ctx.lineTo(wx + 8, wy - 1);
            ctx.strokeStyle = '#5a7a4a';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
        ctx.restore();

        // Fireflies (subtle glowing dots)
        ctx.save();
        for (const f of this._jungleFireflies) {
          const fx = (f.x * screenW + camParallax * 0.1 + Math.sin(time * 0.001 + f.phase) * 5) % screenW;
          const fy = f.y * screenH + Math.sin(time * 0.0015 + f.phase * 0.7) * 3;
          const blink = Math.max(0, Math.sin(time * f.speed + f.phase));
          if (blink < 0.1) continue;
          ctx.globalAlpha = f.alpha * blink;
          ctx.fillStyle = 'rgba(210, 230, 140, 0.5)';
          ctx.beginPath();
          ctx.arc(fx, fy, f.size * (0.5 + 0.5 * blink), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = f.alpha * blink * 0.3;
          ctx.beginPath();
          ctx.arc(fx, fy, f.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Ambient particles (pollen, dust, tiny seeds)
        ctx.save();
        for (const p of this._jungleAmbientParticles) {
          const px = (p.x * screenW + camParallax * 0.1 + Math.sin(time * p.speed + p.phase) * 25) % (screenW + 20) - 10;
          const py = p.y * screenH + Math.sin(time * p.drift + p.phaseY) * 12;
          ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(time * 0.002 + p.phase));
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        } catch (e) { console.warn('Jungle render error:', e); }
      }
    }

    // Generate decorative celestial objects for Nebula Cosmos ??? no collisions, pure atmosphere
    _generateAsteroidShape(numVerts) {
      const verts = [];
      for (let i = 0; i < numVerts; i++) {
        const a = (i / numVerts) * Math.PI * 2;
        const r = 0.7 + Math.random() * 0.3;
        verts.push({ a, r });
      }
      return verts;
    }

    _initSpaceObjects(track) {
      this._spaceObjects = [];
      if (this.currentThemeKey !== 'space' || !track) return;
      const length = track.length || 10000;
      const types = ['asteroid', 'large_asteroid', 'meteorite', 'debris', 'debris_field', 'beacon', 'ancient_probe', 'asteroid', 'debris', 'asteroid'];
      for (let i = 0; i < 30; i++) {
        const t = types[i % types.length];
        const x = (i / 30) * length + Math.random() * 400;
        const side = Math.random() > 0.5 ? 1 : -1;
        this._spaceObjects.push({
          type: t,
          x,
          trackOffset: (Math.random() - 0.5) * 600,
          yOffset: side * (200 + Math.random() * 300),
          parallax: 0.02 + Math.random() * 0.08,
          size: t === 'large_asteroid' ? 10 + Math.random() * 10 : t === 'meteorite' ? 5 + Math.random() * 6 : 2 + Math.random() * 5,
          phase: Math.random() * 100,
          color: t === 'beacon' ? '#fbbf24' : t === 'ancient_probe' ? '#94a3b8' : ['#64748b', '#475569', '#94a3b8', '#78716c', '#57534e', '#a8a29e'][i % 6],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
          vertices: t === 'asteroid' || t === 'large_asteroid' || t === 'meteorite' ? this._generateAsteroidShape(5 + Math.floor(Math.random() * 4)) : null,
        });
      }
    }

    // Safe decoration init ??? called after gameplay starts, never blocks the race
    _initDecorationsForTheme() {
      try {
        if (this.currentThemeKey === 'jungle') {
          this._initJungleObjects();
        }
      } catch (e) {
        console.warn('Decoration init failed for', this.currentThemeKey, ':', e.message);
      }
    }

    // Generate decorative jungle wildlife and atmosphere objects for Amazon Canopy
    _initJungleObjects() {
      this._jungleGiantTrees = [];
      const species = [
        { name: 'kapok', trunkScale: 1.3, crownScale: 1.2, buttress: true, branchCount: 4, leanRange: 0.04 },
        { name: 'rubber', trunkScale: 1.1, crownScale: 1.0, buttress: false, branchCount: 4, leanRange: 0.02 },
        { name: 'palm', trunkScale: 0.7, crownScale: 0.8, buttress: false, branchCount: 2, leanRange: 0.06 },
        { name: 'kapok', trunkScale: 1.2, crownScale: 1.3, buttress: true, branchCount: 5, leanRange: 0.03 },
        { name: 'rubber', trunkScale: 1.0, crownScale: 1.1, buttress: false, branchCount: 3, leanRange: 0.01 },
        { name: 'palm', trunkScale: 0.8, crownScale: 0.9, buttress: false, branchCount: 2, leanRange: 0.05 },
        { name: 'kapok', trunkScale: 1.4, crownScale: 1.1, buttress: true, branchCount: 4, leanRange: 0.02 },
        { name: 'rubber', trunkScale: 1.2, crownScale: 0.9, buttress: false, branchCount: 3, leanRange: 0.03 },
        { name: 'cedro', trunkScale: 1.0, crownScale: 0.9, buttress: false, branchCount: 3, leanRange: 0.04 },
        { name: 'palm', trunkScale: 0.6, crownScale: 0.7, buttress: false, branchCount: 2, leanRange: 0.07 }
      ];
      const crownColors = ['#0d3b1c', '#1a5e2a', '#2d6a30', '#3a7a3a', '#1e4e28', '#0f4a20', '#2a6a30', '#1a5a2a', '#3a6a2a', '#4a7a3a'];
      const crownHighlights = ['#1a5e2a', '#3a7a3a', '#4a8a48', '#5a9a50', '#2a6a30', '#1a5e2a', '#4a8a48', '#3a7a3a', '#5a8a4a', '#6a9a5a'];
      for (let i = 0; i < species.length; i++) {
        const sp = species[i];
        const tScale = sp.trunkScale;
        const cScale = sp.crownScale;
        this._jungleGiantTrees.push({
          x: 0.02 + (i / species.length) * 0.96 + Math.random() * 0.04,
          baseY: 0.60 + Math.random() * 0.18,
          trunkW: 5 * tScale + Math.random() * 3,
          trunkH: (0.20 + Math.random() * 0.10) * tScale,
          crownW: 25 * cScale + Math.random() * 15,
          crownH: 16 * cScale + Math.random() * 10,
          crownY: -0.10 + Math.random() * -0.04,
          crownColor: crownColors[i % crownColors.length],
          crownHighlight: crownHighlights[i % crownHighlights.length],
          species: sp.name,
          lean: (Math.random() - 0.5) * sp.leanRange * 2,
          hasButtress: sp.buttress,
          branchCount: sp.branchCount,
          parallax: 0.25 + Math.random() * 0.20,
          phase: Math.random() * Math.PI * 2,
          barkColor: ['#1a2a20', '#2a3a28', '#1f2f22', '#2f3f2a', '#253525', '#2f4030', '#1d2d1d', '#2a3a2a', '#1e2e1e', '#2b3b2b'][i]
        });
      }
      this._jungleRoots = [];
      for (let i = 0; i < 5; i++) {
        this._jungleRoots.push({
          x: Math.random() * 0.9 + 0.05,
          y: 0.72 + Math.random() * 0.12,
          len: 30 + Math.random() * 25,
          width: 4 + Math.random() * 3,
          dirX: Math.random() > 0.5 ? 1 : -1,
          parallax: 0.55 + Math.random() * 0.15,
          wrapRock: Math.random() > 0.5
        });
      }
      this._jungleWaterfalls = [];
      for (let i = 0; i < 4; i++) {
        this._jungleWaterfalls.push({
          x: 0.1 + i * 0.25 + Math.random() * 0.05,
          y: 0.15 + Math.random() * 0.10,
          width: Math.random() * 8 + 4,
          height: 0.25 + Math.random() * 0.15,
          parallax: 0.3 + Math.random() * 0.15,
          phase: Math.random() * Math.PI * 2
        });
      }
      this._jungleSunRays = [];
      for (let i = 0; i < 5; i++) {
        this._jungleSunRays.push({
          x: 0.1 + i * 0.18 + Math.random() * 0.04,
          width: 12 + Math.random() * 15,
          parallax: 0.1 + Math.random() * 0.1,
          phase: Math.random() * Math.PI * 2
        });
      }
      // Amazon river ??? winding muddy path visible through tree openings
      this._jungleRiver = { segments: [] };
      for (let i = 0; i < 12; i++) {
        this._jungleRiver.segments.push({
          x: i / 11,
          y: 0.45 + Math.sin(i * 1.1) * 0.12 + Math.sin(i * 0.4) * 0.06,
          width: 8 + Math.sin(i * 0.7) * 3 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2
        });
      }
      this._jungleRiver.parallax = 0.25;
      // Cross-vines connecting between tree positions
      this._jungleCrossVines = [];
      for (let i = 0; i < 6; i++) {
        this._jungleCrossVines.push({
          x1: Math.random() * 0.7 + 0.05,
          y1: 0.25 + Math.random() * 0.15,
          x2: Math.random() * 0.7 + 0.2,
          y2: 0.35 + Math.random() * 0.20,
          sag: 15 + Math.random() * 20,
          phase: Math.random() * Math.PI * 2,
          width: 0.8 + Math.random() * 0.6
        });
      }
      this._jungleBirds = [];
      const birdSpecies = [
        { color: '#c0392b', tailColor: '#8b0000', hasLongTail: true },
        { color: '#2ecc71', tailColor: '#1a6b3a', hasLongTail: false },
        { color: '#f39c12', tailColor: '#d4880f', hasLongTail: false },
        { color: '#3498db', tailColor: '#1a5f8a', hasLongTail: true },
        { color: '#9b59b6', tailColor: '#6a3f7a', hasLongTail: true },
        { color: '#e67e22', tailColor: '#a05515', hasLongTail: false },
        { color: '#1abc9c', tailColor: '#0f7a6a', hasLongTail: false }
      ];
      for (let i = 0; i < 7; i++) {
        const sp = birdSpecies[i % birdSpecies.length];
        this._jungleBirds.push({
          startX: Math.random() * 0.3 + (i % 2 === 0 ? -0.15 : 0.85),
          y: 0.06 + Math.random() * 0.18,
          interval: 1200 + Math.random() * 800,
          phase: Math.random() * Math.PI * 2,
          delay: i * 200 + Math.random() * 300,
          color: sp.color,
          tailColor: sp.tailColor,
          hasLongTail: sp.hasLongTail,
          size: 4 + Math.random() * 3
        });
      }
      this._jungleButterflies = [];
      const butterflyColors = ['#3498db', '#e74c3c', '#f39c12', '#2ecc71', '#9b59b6', '#f1c40f', '#1abc9c', '#e67e22', '#ff6b9d', '#4a9eff', '#7bed9f', '#ffa502'];
      for (let i = 0; i < 10; i++) {
        this._jungleButterflies.push({
          x: Math.random() * 1.2 - 0.1,
          y: 0.10 + Math.random() * 0.45,
          speed: 0.0003 + Math.random() * 0.0005,
          drift: 0.0004 + Math.random() * 0.0004,
          size: 3 + Math.random() * 2.5,
          phase: Math.random() * Math.PI * 2,
          color: butterflyColors[i % butterflyColors.length]
        });
      }
      this._jungleMonkeys = [];
      for (let i = 0; i < 3; i++) {
        this._jungleMonkeys.push({
          x: 0.1 + i * 0.3 + Math.random() * 0.1,
          y: 0.20 + Math.random() * 0.15,
          interval: 2000 + Math.random() * 1500,
          phase: Math.random() * Math.PI * 2,
          delay: i * 500 + Math.random() * 400
        });
      }
      this._jungleDragonflies = [];
      for (let i = 0; i < 4; i++) {
        this._jungleDragonflies.push({
          x: Math.random() * 1.2 - 0.1,
          y: 0.60 + Math.random() * 0.20,
          speed: 0.0004 + Math.random() * 0.0005,
          size: 2 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2
        });
      }
      this._jungleLeaves = [];
      const leafColors = ['#6b8e23', '#556b2f', '#8fbc8f', '#228b22', '#3a6b2a', '#7a9e4a', '#5a7a3a', '#9acd32'];
      for (let i = 0; i < 10; i++) {
        this._jungleLeaves.push({
          x: Math.random() * 1.2 - 0.1,
          y: Math.random() * 0.3 + 0.02,
          fall: 0.2 + Math.random() * 0.4,
          sway: 0.0003 + Math.random() * 0.0004,
          size: 3 + Math.random() * 4,
          alpha: 0.05 + Math.random() * 0.06,
          phase: Math.random() * Math.PI * 2,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: 0.5 + Math.random() * 0.5,
          color: leafColors[i % leafColors.length]
        });
      }
      this._jungleMistParticles = [];
      for (let i = 0; i < 20; i++) {
        this._jungleMistParticles.push({
          x: Math.random() * 1.2 - 0.1,
          y: 0.55 + Math.random() * 0.30,
          size: 12 + Math.random() * 25,
          alpha: 0.02 + Math.random() * 0.03,
          phase: Math.random() * Math.PI * 2
        });
      }
      this._jungleFlowers = [];
      const flowerColors = ['#e74c3c', '#f39c12', '#f1c40f', '#e67e22', '#9b59b6', '#ff6b6b', '#ff4757', '#ffa502', '#7bed9f', '#ff6b9d'];
      for (let i = 0; i < 10; i++) {
        this._jungleFlowers.push({
          x: Math.random() * 0.9 + 0.05,
          y: 0.55 + Math.random() * 0.30,
          size: 3 + Math.random() * 4,
          color: flowerColors[i % flowerColors.length],
          phase: Math.random() * Math.PI * 2,
          swaySpeed: 0.002 + Math.random() * 0.003,
          isOrchid: Math.random() > 0.6,
          isHeliconia: Math.random() > 0.7
        });
      }
      this._jungleWildlife = [];
      for (let i = 0; i < 4; i++) {
        this._jungleWildlife.push({
          x: Math.random() * 0.9 + 0.05,
          y: 0.70 + Math.random() * 0.15,
          type: i < 2 ? 'frog' : 'lizard',
          phase: Math.random() * Math.PI * 2
        });
      }
      this._jungleFireflies = [];
      for (let i = 0; i < 14; i++) {
        this._jungleFireflies.push({
          x: Math.random() * 1.0 + 0.0,
          y: 0.40 + Math.random() * 0.30,
          size: 1 + Math.random() * 1.5,
          alpha: 0.08 + Math.random() * 0.10,
          speed: 0.002 + Math.random() * 0.003,
          phase: Math.random() * Math.PI * 2
        });
      }
      this._jungleAmbientParticles = [];
      for (let i = 0; i < 20; i++) {
        this._jungleAmbientParticles.push({
          x: Math.random() * 1.2 - 0.1,
          y: Math.random() * 0.7 + 0.05,
          speed: 0.00015 + Math.random() * 0.00025,
          drift: 0.00015 + Math.random() * 0.00025,
          size: 0.8 + Math.random() * 1.2,
          alpha: 0.04 + Math.random() * 0.06,
          phase: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          color: ['rgba(255,255,200,0.3)', 'rgba(200,255,200,0.3)', 'rgba(255,200,200,0.3)', 'rgba(200,200,255,0.3)',
                   'rgba(255,240,180,0.3)', 'rgba(210,255,210,0.3)'][i % 6]
        });
      }
    }

    // Render celestial objects with parallax ??? called inside scaled draw section (virtual coordinates)
    _renderSpaceObjects(camX) {
      if (this.currentThemeKey !== 'space' || !this._spaceObjects) return;
      const ctx = this.ctx;
      const time = Date.now() / 1000;
      for (const obj of this._spaceObjects) {
        const vx = (obj.x - camX) * obj.parallax;
        const vy = obj.yOffset;
        if (vx < -400 || vx > 800) continue;
        ctx.save();
        obj.rotation = (obj.rotation || 0) + (obj.rotSpeed || 0);
        const rot = obj.rotation || 0;
        ctx.translate(vx, vy);
        ctx.rotate(rot);
        ctx.globalAlpha = 0.3 + Math.sin(time * 0.15 + obj.phase) * 0.08;
        if (obj.type === 'asteroid' || obj.type === 'large_asteroid' || obj.type === 'meteorite') {
          // Irregular rocky shape using pre-generated vertices
          const verts = obj.vertices;
          if (verts) {
            ctx.fillStyle = obj.color;
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 3;
            ctx.beginPath();
            for (let v = 0; v < verts.length; v++) {
              const x = Math.cos(verts[v].a) * obj.size * verts[v].r;
              const y = Math.sin(verts[v].a) * obj.size * verts[v].r;
              if (v === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            // Surface highlight
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha *= 0.08;
            ctx.beginPath();
            ctx.arc(-obj.size * 0.15, -obj.size * 0.15, obj.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Meteorite tail hint
            if (obj.type === 'meteorite') {
              ctx.globalAlpha = 0.15;
              ctx.strokeStyle = '#f97316';
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(obj.size * 0.5, 0);
              ctx.lineTo(obj.size * 1.8, -obj.size * 0.3);
              ctx.stroke();
            }
          }
        } else if (obj.type === 'debris') {
          // Tiny irregular fragment
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          for (let d = 0; d < 4; d++) {
            const da = (d / 4) * Math.PI * 2;
            const dr = obj.size * (0.7 + (d % 2) * 0.3);
            const dx = Math.cos(da) * dr;
            const dy = Math.sin(da) * dr;
            if (d === 0) ctx.moveTo(dx, dy);
            else ctx.lineTo(dx, dy);
          }
          ctx.closePath();
          ctx.fill();
        } else if (obj.type === 'debris_field') {
          // Scattered debris: several tiny fragments
          for (let d = 0; d < 5; d++) {
            const da = d * 1.3 + obj.phase;
            const dr = obj.size * (0.3 + (d % 3) * 0.2);
            ctx.fillStyle = ['#94a3b8', '#64748b', '#475569', '#78716c', '#a8a29e'][d];
            ctx.globalAlpha = 0.15 + Math.sin(time * 0.5 + da) * 0.05;
            ctx.beginPath();
            ctx.arc(Math.cos(da) * dr, Math.sin(da) * dr, 0.8 + (d % 3) * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (obj.type === 'beacon') {
          // Alien beacon: pulsing diamond shape
          const bp = 0.3 + Math.sin(time * 1.5 + obj.phase) * 0.3;
          ctx.fillStyle = obj.color;
          ctx.globalAlpha = 0.2 + bp * 0.3;
          ctx.shadowColor = obj.color;
          ctx.shadowBlur = 10 + bp * 8;
          ctx.beginPath();
          ctx.moveTo(0, -obj.size);
          ctx.lineTo(obj.size, 0);
          ctx.lineTo(0, obj.size);
          ctx.lineTo(-obj.size, 0);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (obj.type === 'ancient_probe') {
          // Broken probe: irregular shape with blinking light
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(-obj.size * 0.3, obj.size * 0.2, obj.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#475569';
          ctx.fillRect(-obj.size * 0.1, -obj.size * 0.5, obj.size * 0.4, obj.size * 0.8);
          ctx.fillStyle = '#fbbf24';
          ctx.globalAlpha = 0.3 + Math.sin(time * 2.5 + obj.phase) * 0.3;
          ctx.beginPath();
          ctx.arc(obj.size * 0.2, -obj.size * 0.4, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // ---- Director Mode Methods (hidden developer overlay) ----

    _updateDirectorSuggestions() {
      if (!this._directorInput || !this.countryDatabase) {
        this._directorSuggestions = [];
        this._directorSelectedIndex = 0;
        return;
      }
      const dashIdx = this._directorInput.indexOf('-');
      const query = dashIdx !== -1 ? this._directorInput.substring(0, dashIdx).trim() : this._directorInput;
      if (!query) {
        this._directorSuggestions = [];
        this._directorSelectedIndex = 0;
        return;
      }
      const input = query.toLowerCase();
      this._directorSuggestions = this.countryDatabase
        .filter(c => c.name.toLowerCase().includes(input))
        .slice(0, 4)
        .map(c => ({ code: c.code, name: c.name }));
      this._directorSelectedIndex = 0;
    }

    _executeDirectorAction() {
      if (this._directorSuggestions.length === 0) return;
      const selected = this._directorSuggestions[this._directorSelectedIndex];
      if (!selected) return;

      const dashIdx = this._directorInput.indexOf('-');
      if (dashIdx !== -1) {
        const customName = this._directorInput.substring(dashIdx + 1).trim();
        if (customName) {
          this._spawnNewRacer(selected.code, selected.name, true, customName.toUpperCase());
          this.directorMode = null;
          return;
        }
      }

      const existingBall = this.balls && this.balls.find(b => b.code === selected.code && !b.isCustom);
      if (existingBall) {
        this._teleportRacer(existingBall);
      } else {
        this._spawnNewRacer(selected.code, selected.name);
      }
      this.directorMode = null;
    }

    _teleportRacer(ball) {
      const camCenter = this._getCameraCenterWorld();
      const safePos = this._findSafePositionNear(camCenter.x, camCenter.y);
      ball.x = safePos.x;
      ball.y = safePos.y;

      this._directorFlashBalls.push({ id: ball.id, timer: 18 });
      if (this.particles) {
        for (let i = 0; i < 12; i++) {
          this.particles.push({
            type: 'spark', x: ball.x, y: ball.y,
            vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
            life: 20 + Math.random() * 10, age: 0, size: 2 + Math.random() * 2,
            color: `hsl(210, 100%, ${50 + Math.random() * 30}%)`,
          });
        }
      }
    }

    _spawnNewRacer(code, name, isCustom = false, customName = '') {
      const country = this.countryDatabase.find(c => c.code === code);
      if (!country) return;

      const camCenter = this._getCameraCenterWorld();
      const safePos = this._findSafePositionNear(camCenter.x, camCenter.y);

      const newId = this.balls ? this.balls.reduce((max, b) => Math.max(max, b.id), -1) + 1 : 0;
      const idx = this.balls ? this.balls.length : 0;

      // Normalize attributes like the game does (see countries.js getCountryDatabase)
      const rawSpeed = (country.stats ? (country.stats.gdp || 50) / 100 : 0.5);
      const rawAcc = (country.stats ? (country.stats.hap || 50) / 100 : 0.5);
      const rawColl = (country.stats ? (country.stats.mil || 50) / 100 : 0.5);

      const ball = {
        id: newId,
        code: country.code,
        name: isCustom ? customName : country.name,
        isCustom,
        customName: isCustom ? customName : '',
        attributes: {
          speed: 0.5 + rawSpeed * 0.5,
          acceleration: 0.3 + rawAcc * 0.45,
          collisionPower: 0.3 + rawColl * 0.7,
          recovery: 0.5,
          consistency: 0.5,
        },
        stats: country.stats ? { ...country.stats } : { pop: 50, gdp: 50, mil: 50, tour: 50, hap: 50, luck: 50 },
        isWorldCup: false,
        isWCBonus: false,
        isStrongFootball: false,
        color: ['#e74c3c', '#3498db', '#ffd700', '#2ecc71', '#9b59b6', '#f39c12'][idx % 6],
        primaryColorRGB: ['200,60,60', '50,120,220', '220,180,50', '46,204,113', '155,89,182', '243,156,18'][idx % 6],
        x: safePos.x,
        y: safePos.y,
        vx: 2 + Math.random() * 2,
        vy: (Math.random() - 0.5) * 1,
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
        trail: [],
      };

      this.balls.push(ball);
      this.calculateLiveLeaderboard();

      // Ensure flag is preloaded
      if (this.flagCache && !this.flagCache[code]) {
        const img = new Image();
        img.src = `https://flagcdn.com/w80/${code}.png`;
        img.onload = () => { this.flagCache[code] = img; };
        img.onerror = () => { this.flagCache[code] = 'failed'; };
      }

      // Spawn portal particles
      if (this.particles) {
        for (let i = 0; i < 20; i++) {
          const ang = (i / 20) * Math.PI * 2;
          this.particles.push({
            type: 'spark', x: ball.x + Math.cos(ang) * 18, y: ball.y + Math.sin(ang) * 18,
            vx: Math.cos(ang) * (1 + Math.random() * 2), vy: Math.sin(ang) * (1 + Math.random() * 2),
            life: 25 + Math.random() * 15, age: 0, size: 2 + Math.random() * 2,
            color: `hsl(180, 100%, ${50 + Math.random() * 30}%)`,
          });
        }
      }

      this._directorFlashBalls.push({ id: ball.id, timer: 30 });
    }

    _getCameraCenterWorld() {
      const screenW = this.canvas ? this.canvas.width : 500;
      const screenH = this.canvas ? this.canvas.height : 400;
      const zoom = this.cameraZoom || 1;
      const trackOff = this.trackOffset || 0;
      return {
        x: (screenW / 2 - trackOff) / zoom + this.cameraX,
        y: screenH / (2 * zoom),
      };
    }

    _findSafePositionNear(cx, cy) {
      const radius = 30;
      let x = cx;
      let y = cy;
      for (let attempt = 0; attempt < 10; attempt++) {
        let occupied = false;
        if (this.balls) {
          for (const b of this.balls) {
            if (Math.hypot(b.x - x, b.y - y) < radius) {
              occupied = true;
              break;
            }
          }
        }
        if (!occupied) return { x, y };
        x = cx + (Math.random() - 0.5) * 60;
        y = cy + (Math.random() - 0.5) * 60;
      }
      return { x, y };
    }

    _removeCustomBall(id) {
      if (!this.balls) return;
      const idx = this.balls.findIndex(b => b.id === id && b.isCustom);
      if (idx === -1) return;
      this.balls.splice(idx, 1);
      this.calculateLiveLeaderboard();
    }

    _renderDirectorOverlay(screenW, screenH) {
      const ctx = this.ctx;
      const customBalls = this.balls ? this.balls.filter(b => b.isCustom) : [];
      const customSectionH = customBalls.length > 0 ? 18 + customBalls.length * 18 : 0;
      const oh = 108 + customSectionH;
      const oy = screenH - oh - 12;
      const ox = 10;
      const ow = 220;

      ctx.save();
      // Background
      ctx.fillStyle = 'rgba(10,10,20,0.85)';
      ctx.strokeStyle = 'rgba(6,182,212,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ox, oy, ow, oh, 4);
      ctx.fill();
      ctx.stroke();

      // Title
      ctx.fillStyle = 'rgba(6,182,212,0.6)';
      ctx.font = 'bold 11px Montserrat, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('DIRECTOR MODE', ox + 8, oy + 6);

      // Input label
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px Montserrat, sans-serif';
      ctx.fillText('Country:', ox + 8, oy + 24);

      // Input field
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(ox + 8, oy + 36, ow - 16, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '11px Montserrat, sans-serif';
      ctx.fillText(this._directorInput + (Date.now() % 1000 < 500 ? '|' : ' '), ox + 11, oy + 38);

      // Suggestions
      this._directorRemoveButtons = [];
      let sy = oy + 56;
      this._directorSuggestions.forEach((s, i) => {
        const isSelected = i === this._directorSelectedIndex;
        const existing = this.balls && this.balls.find(b => b.code === s.code && !b.isCustom);
        if (isSelected) {
          ctx.fillStyle = 'rgba(6,182,212,0.2)';
          ctx.fillRect(ox + 8, sy, ow - 16, 14);
        }
        ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)';
        ctx.font = '10px Montserrat, sans-serif';
        ctx.fillText(s.name, ox + 11, sy + 2);
        if (existing) {
          ctx.fillStyle = 'rgba(6,182,212,0.4)';
          ctx.font = '8px Montserrat, sans-serif';
          ctx.fillText('TELEPORT', ox + ow - 43, sy + 3);
        } else {
          ctx.fillStyle = 'rgba(251,191,36,0.4)';
          ctx.font = '8px Montserrat, sans-serif';
          ctx.fillText('SPAWN', ox + ow - 35, sy + 3);
        }
        sy += 15;
      });

      // Custom Balls section
      if (customBalls.length > 0) {
        sy += 4;
        ctx.fillStyle = 'rgba(255,215,0,0.5)';
        ctx.font = 'bold 10px Montserrat, sans-serif';
        ctx.fillText('CUSTOM BALLS', ox + 8, sy);
        sy += 16;
        customBalls.forEach((b, i) => {
          if (i >= 5) return;
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '10px Montserrat, sans-serif';
          ctx.fillText(b.customName || b.name, ox + 11, sy + 1);
          const rmvX = ox + ow - 48;
          const rmvY = sy;
          const rmvW = 38;
          const rmvH = 14;
          ctx.fillStyle = 'rgba(231,76,60,0.3)';
          ctx.beginPath();
          ctx.roundRect(rmvX, rmvY, rmvW, rmvH, 3);
          ctx.fill();
          ctx.fillStyle = 'rgba(231,76,60,0.7)';
          ctx.font = '8px Montserrat, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Remove', rmvX + rmvW / 2, rmvY + 4);
          ctx.textAlign = 'left';
          this._directorRemoveButtons.push({ id: b.id, x: rmvX, y: rmvY, w: rmvW, h: rmvH });
          sy += 18;
        });
      }

      // Info line
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '8px Montserrat, sans-serif';
      ctx.fillText('ENTER=Execute  ESC=Close', ox + 8, oy + oh - 12);
      ctx.restore();
    }

    renderScreenOverlays(screenW, screenH) {
      // A0. Vignette overlay around screen edges (skipped for jungle ??? no fullscreen overlays)
      if ((this.state === 'racing' || this.state === 'finished' || this.state === 'champion_screen') && this.currentThemeKey !== 'jungle') {
        this.ctx.save();
        const vigGrad = this.ctx.createRadialGradient(
          screenW / 2, screenH / 2, screenH * 0.3,
          screenW / 2, screenH / 2, screenH * 0.9
        );
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(0.85, 'rgba(0,0,0,0.15)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
        this.ctx.fillStyle = vigGrad;
        this.ctx.fillRect(0, 0, screenW, screenH);
        this.ctx.restore();
      }

      // Dust overlay from collapsing pillars
      if (this._dustOverlay && this._dustOverlay > 0) {
        this.ctx.save();
        const dustAlpha = Math.min(0.25, this._dustOverlay / 15 * 0.25);
        const dustGrad = this.ctx.createRadialGradient(
          screenW / 2, screenH / 2, 0,
          screenW / 2, screenH / 2, screenH * 0.7
        );
        dustGrad.addColorStop(0, `rgba(180, 140, 100, ${dustAlpha * 0.3})`);
        dustGrad.addColorStop(0.4, `rgba(160, 120, 80, ${dustAlpha * 0.5})`);
        dustGrad.addColorStop(0.7, `rgba(120, 90, 60, ${dustAlpha * 0.3})`);
        dustGrad.addColorStop(1, 'rgba(80, 60, 40, 0)');
        this.ctx.fillStyle = dustGrad;
        this.ctx.fillRect(0, 0, screenW, screenH);
        this.ctx.restore();
      }

      // A0a. Blackout visual overlay
      if (this._blackoutActive && this.state === 'racing') {
        this.ctx.save();
        const darkAlpha = Math.min(0.99, this._blackoutFadeLevel);
        // Enhanced vignette darkness
        const vig = this.ctx.createRadialGradient(
          screenW / 2, screenH / 2, screenH * 0.15,
          screenW / 2, screenH / 2, screenH * 0.9
        );
        vig.addColorStop(0, `rgba(0,0,0,${darkAlpha * 0.3})`);
        vig.addColorStop(0.3, `rgba(0,0,0,${darkAlpha * 0.5})`);
        vig.addColorStop(0.7, `rgba(0,0,0,${darkAlpha * 0.75})`);
        vig.addColorStop(1, `rgba(0,0,0,${darkAlpha})`);
        this.ctx.fillStyle = vig;
        this.ctx.fillRect(0, 0, screenW, screenH);
        // Random subtle flicker
        if (this._blackoutFlickerTimer > 20 && Math.random() < 0.4) {
          this.ctx.fillStyle = `rgba(255,255,200,${0.02 + Math.random() * 0.04})`;
          this.ctx.fillRect(0, 0, screenW, screenH);
        }
this.ctx.restore();
      }

      // A0ab. Blizzard visual overlay (Glacier Summit global event)
      if (this._blizzardActive && this.state === 'racing') {
        this.ctx.save();
        // Blue tint overlay (12% opacity)
        this.ctx.fillStyle = 'rgba(140, 200, 255, 0.12)';
        this.ctx.fillRect(0, 0, screenW, screenH);
        // Frost vignette
        const vigGrad = this.ctx.createRadialGradient(screenW / 2, screenH / 2, screenH * 0.1, screenW / 2, screenH / 2, screenH * 0.8);
        vigGrad.addColorStop(0, 'rgba(200, 230, 255, 0)');
        vigGrad.addColorStop(0.5, 'rgba(180, 220, 255, 0)');
        vigGrad.addColorStop(0.8, 'rgba(160, 210, 255, 0.06)');
        vigGrad.addColorStop(1, 'rgba(140, 200, 255, 0.15)');
        this.ctx.fillStyle = vigGrad;
        this.ctx.fillRect(0, 0, screenW, screenH);
        // Snow particles (screen-space)
        for (const sp of this._blizzardSnowParticles) {
          const sx = sp.x * screenW;
          const sy = sp.y * screenH;
          this.ctx.globalAlpha = sp.alpha;
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          this.ctx.arc(sx, sy, sp.size, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        // Fog particles
        for (const fp of this._blizzardFogParticles) {
          const fx = fp.x * screenW;
          const fy = fp.y * screenH;
          this.ctx.globalAlpha = fp.alpha;
          const fogGrad = this.ctx.createRadialGradient(fx, fy, 0, fx, fy, fp.size);
          fogGrad.addColorStop(0, 'rgba(200, 230, 255, 0.5)');
          fogGrad.addColorStop(1, 'rgba(200, 230, 255, 0)');
          this.ctx.fillStyle = fogGrad;
          this.ctx.beginPath();
          this.ctx.arc(fx, fy, fp.size, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        this.ctx.restore();
      }

      // A0ac. Lava Shower sky dimming overlay (Magma Crater global event)
      if (this._lavaShowerActive && this._lavaShowerSkyDim > 0 && this.state === 'racing') {
        this.ctx.save();
        // Warm dark overlay ??? darkens sky while adding faint amber tone
        const dim = this._lavaShowerSkyDim;
        const vig = this.ctx.createRadialGradient(
          screenW / 2, screenH * 0.4, screenH * 0.05,
          screenW / 2, screenH * 0.4, screenH * 0.8
        );
        vig.addColorStop(0, `rgba(60, 30, 10, ${dim * 0.6})`);
        vig.addColorStop(0.5, `rgba(40, 20, 10, ${dim * 0.8})`);
        vig.addColorStop(1, `rgba(20, 10, 5, ${dim})`);
        this.ctx.fillStyle = vig;
        this.ctx.fillRect(0, 0, screenW, screenH);
        this.ctx.restore();
      }

      // A0aa. Aurora Borealis ??? comprehensive atmospheric overlay
      if (this._auroraActive && this.state === 'racing') {
        const fade = this._auroraFadeProgress;
        const pulse = this._auroraPulseValue;
        const dc = this._auroraDominantColor;
        const totalA = fade * (1 + pulse);
        this.ctx.save();

        // 1. Environment darkening (20-25% reduction, using fade progress)
        const darkA = fade * 0.23;
        this.ctx.fillStyle = `rgba(3, 6, 20, ${darkA})`;
        this.ctx.fillRect(0, 0, screenW, screenH);

        // 2. Aurora colored haze extending downward from sky
        const hazeGrad = this.ctx.createLinearGradient(0, 0, 0, screenH);
        const hazeA = totalA * 0.08;
        hazeGrad.addColorStop(0, `rgba(${dc.r|0},${dc.g|0},${dc.b|0},${hazeA})`);
        hazeGrad.addColorStop(0.30, `rgba(${dc.r|0},${dc.g|0},${dc.b|0},${hazeA * 0.6})`);
        hazeGrad.addColorStop(0.55, `rgba(${dc.r|0},${dc.g|0},${dc.b|0},${hazeA * 0.25})`);
        hazeGrad.addColorStop(0.80, `rgba(${dc.r|0},${dc.g|0},${dc.b|0},${hazeA * 0.08})`);
        hazeGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = hazeGrad;
        this.ctx.fillRect(0, 0, screenW, screenH);

        // 3. Dynamic snow/ground reflection (matches dominant aurora color)
        const refGrad = this.ctx.createLinearGradient(0, screenH * 0.40, 0, screenH);
        refGrad.addColorStop(0, 'rgba(0,0,0,0)');
        refGrad.addColorStop(0.3, `rgba(${dc.r|0},${dc.g|0},${dc.b|0},${totalA * 0.035})`);
        refGrad.addColorStop(0.6, `rgba(${dc.r|0},${dc.g|0},${dc.b|0},${totalA * 0.025})`);
        refGrad.addColorStop(0.85, `rgba(${dc.r|0},${dc.g|0},${dc.b|0},${totalA * 0.015})`);
        refGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = refGrad;
        this.ctx.fillRect(0, 0, screenW, screenH);

        // 4. Faint track coloured sheen (ice reflecting aurora)
        const trackGrad = this.ctx.createLinearGradient(0, screenH * 0.45, 0, screenH * 0.75);
        trackGrad.addColorStop(0, 'rgba(0,0,0,0)');
        trackGrad.addColorStop(0.5, `rgba(${dc.r|0},${dc.g|0},${dc.b|0},${totalA * 0.02})`);
        trackGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = trackGrad;
        this.ctx.fillRect(0, screenH * 0.45, screenW, screenH * 0.30);
        this.ctx.restore();

        // 5. Background depth: distant snowy mist and icy fog layers
        this.ctx.save();
        for (const fog of this._auroraBackgroundFog) {
          const fx = fog.x * screenW;
          const fy = fog.y * screenH;
          const fAlpha = fog.alpha * fade;
          if (fAlpha <= 0) continue;
          const fogGrad = this.ctx.createRadialGradient(fx, fy, 0, fx, fy, fog.size);
          const cr = Math.min(255, dc.r + 40);
          const cg = Math.min(255, dc.g + 30);
          const cb = Math.min(255, dc.b + 50);
          fogGrad.addColorStop(0, `rgba(${cr},${cg},${cb},${fAlpha})`);
          fogGrad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          this.ctx.fillStyle = fogGrad;
          this.ctx.beginPath();
          this.ctx.arc(fx, fy, fog.size, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();

        // 6. Arctic wind particles (drifting snow, ice crystals, wind streaks)
        this.ctx.save();
        for (const p of this._auroraArcticParticles) {
          const a = p.alpha * fade;
          if (a <= 0) continue;
          const px = p.x * screenW;
          const py = p.y * screenH;
          this.ctx.globalAlpha = a;
          if (p.auroraGlow > 0) {
            const gA = p.auroraGlow * 0.5;
            this.ctx.fillStyle = `rgba(${dc.r|0},${dc.g|0},${dc.b|0},${gA})`;
          } else {
            this.ctx.fillStyle = 'rgba(220, 240, 255, 0.6)';
          }
          if (p.size > 1.5) {
            // Wind streak (elongated)
            this.ctx.fillRect(px - p.size * 3, py, p.size * 6, 0.5);
          } else {
            this.ctx.beginPath();
            this.ctx.arc(px, py, p.size, 0, Math.PI * 2);
            this.ctx.fill();
          }
        }
        this.ctx.globalAlpha = 1;
        this.ctx.restore();

        // 7. Snow gusts with aurora-colored reflections
        this.ctx.save();
        for (const gust of this._auroraSnowGusts) {
          const gustLife = gust.life / gust.maxLife;
          const gustA = Math.min(1, gustLife * 2) * fade * 0.6;
          if (gustA <= 0) continue;
          const gx = gust.x * screenW;
          const gy = gust.y * screenH;
          for (const gp of gust.particles) {
            const gpx = gx + gp.ox * screenW;
            const gpy = gy + gp.oy * screenH;
            this.ctx.globalAlpha = gp.alpha * gustA * Math.min(1, gustLife * 2);
            if (gp.auroraGlow > 0) {
              this.ctx.fillStyle = `rgba(${dc.r|0},${dc.g|0},${dc.b|0},${gp.auroraGlow})`;
            } else {
              this.ctx.fillStyle = 'rgba(230, 245, 255, 0.5)';
            }
            this.ctx.beginPath();
            this.ctx.arc(gpx, gpy, gp.size, 0, Math.PI * 2);
            this.ctx.fill();
          }
        }
        this.ctx.globalAlpha = 1;
        this.ctx.restore();
      }

      // A0b. Teleportation white flash
      if (this._whiteFlashAlpha > 0) {
        this.ctx.save();
        this.ctx.fillStyle = `rgba(255,255,255,${this._whiteFlashAlpha})`;
        this.ctx.fillRect(0, 0, screenW, screenH);
        this._whiteFlashAlpha -= 0.05;
        if (this._whiteFlashAlpha < 0) this._whiteFlashAlpha = 0;
        this.ctx.restore();
      }

      // A0c. Teleportation "SWAPPED WITH" text (screen-space)
      if (this._teleportState === 'post' && this._teleportPostPairs.length > 0) {
        this.ctx.save();
        const zoom = this.cameraZoom;
        const trackOff = this.trackOffset;
        this._teleportPostPairs.forEach(p => {
          const bx = trackOff + (p.ball.x - this.cameraX) * zoom;
          const by = p.ball.y * zoom;
          const alpha = Math.min(1, p.timer / 30);
          this.ctx.globalAlpha = alpha;
          this.ctx.fillStyle = '#88ccff';
          this.ctx.font = 'bold 10px Montserrat, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.shadowColor = '#88ccff';
          this.ctx.shadowBlur = 10;
          this.ctx.fillText('SWAPPED WITH', bx, by - 25);
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 13px Montserrat, sans-serif';
          this.ctx.fillText(p.name.toUpperCase(), bx, by - 10);
          this.ctx.shadowBlur = 0;
        });
        this.ctx.restore();
      }

      // A. Broadcast bug (top-right corner, TV-style)
      this.ctx.save();
      const bugW = 130;
      const bugH = 36;
      const bugX = screenW - bugW - 12;
      const bugY = 10;
      // Dark pill background
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.beginPath();
      this.ctx.roundRect(bugX, bugY, bugW, bugH, 6);
      this.ctx.fill();
      // Text
      this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
      this.ctx.font = 'bold 13px Montserrat, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('FLAG WARS', bugX + 10, bugY + 13);
      this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
      this.ctx.font = '9px Montserrat, sans-serif';
      this.ctx.fillText('RALLY WORLD CUP', bugX + 10, bugY + 27);
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
        const cdText = this.countdownSeconds > 0 ? String(this.countdownSeconds) : "GO!";
        const isGo = this.countdownSeconds <= 0;
        const raw = (Date.now() % 1000) / 1000;
        const eased = this.easeOutBack(raw);
        const scale = 1 + eased * 0.4;
        const size = Math.round(isGo ? 110 * scale : 95 * scale);
        const flashAlpha = isGo ? Math.max(0, 1 - raw * 2) : 0;

        // Dark overlay
        this.ctx.fillStyle = `rgba(0, 0, 0, ${isGo ? 0.3 : 0.45})`;
        this.ctx.fillRect(0, 0, screenW, screenH);

        // GO! white flash
        if (flashAlpha > 0) {
          this.ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.3})`;
          this.ctx.fillRect(0, 0, screenW, screenH);
        }

        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 15;

        // Color: gold for "GO!", cyan for numbers
        this.ctx.fillStyle = isGo ? '#ffd700' : '#66fcf1';
        this.ctx.font = `bold ${size}px Montserrat, sans-serif`;
        this.ctx.shadowBlur = isGo ? 30 : 15;
        this.ctx.shadowColor = isGo ? 'rgba(255,215,0,0.6)' : '#000000';
        this.ctx.fillText(cdText, screenW / 2, screenH / 2);

        // Sub-label under GO!
        if (isGo) {
          this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
          this.ctx.font = 'bold 24px Montserrat, sans-serif';
          this.ctx.shadowBlur = 0;
          this.ctx.fillText('RACE START', screenW / 2, screenH / 2 + 70);
        }
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

      // F. Winner Flash ??? shown for 2 seconds before champion overlay activates
      if (this._winnerFlashActive && this._winnerFlashBall) {
        this.ctx.save();
        const flashElapsed = performance.now() - this._winnerFlashStart;
        const t = Math.min(1, flashElapsed / 500);
        const flashAlpha = t;
        const flashScale = 1 + (1 - t) * 0.25;

        this.ctx.globalAlpha = flashAlpha;

        // Dark background strip behind text
        const stripH = 120;
        const stripY = screenH / 2 - stripH / 2;
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.shadowColor = 'rgba(255,215,0,0.4)';
        this.ctx.shadowBlur = 30;
        this.ctx.fillRect(0, stripY, screenW, stripH);
        this.ctx.shadowBlur = 0;

        // Trophy emoji
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '48px Montserrat, sans-serif';
        this.ctx.fillText('\u{1F3C6}', screenW / 2, stripY + 35);

        // "WINNER" label
        this.ctx.font = 'bold 64px Outfit, Montserrat, sans-serif';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.shadowColor = 'rgba(255,215,0,0.8)';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('WINNER', screenW / 2, stripY + stripH / 2);

        // Country name below
        this.ctx.font = 'bold 28px Montserrat, sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(this._winnerFlashBall.name.toUpperCase(), screenW / 2, stripY + stripH - 20);

        this.ctx.shadowBlur = 0;
        this.ctx.restore();
      }

      // D. Global Event Banner (animated near lower-center) ??? hide after race ends or when champion overlay shown
      if (this.state === 'racing' && !this._championOverlayShown) {
        this.eventBanner.render(this.ctx, screenW, screenH);
      }

      // E. Top-Middle Event Capsule ??? prominent active event display below timer
      if ((this.state === 'racing' || this.state === 'finished') && !this._championOverlayShown) {
        if (this.activeEvent) {
          this.ctx.save();
          const eventText = this.activeEvent.name;
          const textWidth = this.ctx.measureText(eventText).width;
          const capsuleW = Math.max(420, textWidth + 80);
          const capsuleH = 56;
          const cx = screenW / 2;
          const cy = screenH * 0.10;
          const pulse = 0.6 + 0.4 * Math.sin(this.raceTimer * 4);

          // Outer glow
          this.ctx.shadowColor = 'rgba(255, 200, 0, 0.5)';
          this.ctx.shadowBlur = 25 * pulse;

          // Background pill
          this.ctx.fillStyle = 'rgba(20, 10, 0, 0.85)';
          this.ctx.beginPath();
          this.ctx.roundRect(cx - capsuleW / 2, cy - capsuleH / 2, capsuleW, capsuleH, 28);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;

          // Pulsing gold border
          this.ctx.strokeStyle = 'rgba(255, 200, 0, ' + (0.5 * pulse) + ')';
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.roundRect(cx - capsuleW / 2 - 3, cy - capsuleH / 2 - 3, capsuleW + 6, capsuleH + 6, 30);
          this.ctx.stroke();

          // Inner highlight line
          this.ctx.strokeStyle = 'rgba(255, 220, 80, ' + (0.2 * pulse) + ')';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.roundRect(cx - capsuleW / 2, cy - capsuleH / 2, capsuleW, capsuleH, 28);
          this.ctx.stroke();

          // Text with glow
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillStyle = '#ffd700';
          this.ctx.font = 'bold 22px Montserrat, sans-serif';
          this.ctx.shadowColor = 'rgba(255, 200, 0, 0.6)';
          this.ctx.shadowBlur = 12;
          this.ctx.fillText(eventText, cx, cy);

          this.ctx.restore();
        }
      }
    }

    // Prepares data and starts countdown
    startRace(loadout) {
      if (this.selectedCountries.length === 0) {
        alert("Please select countries first!");
        return;
      }

      // ?????? Guard against duplicate loops ??????
      if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
      if (this.hudUpdateTimer) { clearInterval(this.hudUpdateTimer); this.hudUpdateTimer = null; }
      if (this.countdownTimer) { clearInterval(this.countdownTimer); this.countdownTimer = null; }

      // Store loadout for obstacle generation and event filtering
      this._loadout = loadout || null;

      // Clear all race transient state
      this.balls = [];
      this.particles = [];
      this.fireworks = [];
      this.confetti = [];
      this.leaderboard = [];
      this._activeMeteors = [];
      this._activeAsteroid = null;
      this._spaceObjects = [];
      this._directorFlashBalls = [];
      this._directorRemoveButtons = [];
      this._speedSurgeMultipliers = new Map();
      this._teleportPairs = [];
      this._teleportPostPairs = [];
      this.activeEvent = null;
      this.eventCount = 0;
      this._championOverlayShown = false;
      this._championWinner = null;
      this._championFlagImg = null;
      this._winnerFlashActive = false;
      this._winnerFlashBall = null;
      this._winnerFlashStart = 0;
      this._footballShowerActive = false;
      this._lavaShowerActive = false;
      this._lavaChunks = [];
      this._lavaShowerSkyDim = 0;
      this._speedSurgeActive = false;
      this._speedSurgeMultipliers = new Map();
      this._blackoutActive = false;
      this._blackoutFadeLevel = 0;
      this._blackoutPhase = null;
      this._teleportState = null;
      this._teleportPairs = [];
      this._teleportPostPairs = [];
      this._whiteFlashAlpha = 0;
      this._blizzardActive = false;
      this._blizzardSnowParticles = [];
      this._blizzardFogParticles = [];
      this._blizzardCrackTimer = 0;
      this._auroraActive = false;
      this._auroraStars = [];
      this._auroraFadePhase = null;
      this._auroraFadeProgress = 0;
      this._auroraArcticParticles = [];
      this._auroraSnowGusts = [];
      this._auroraBackgroundFog = [];
      this._auroraSceneBrightness = 1.0;

      // Jungle theme init
      this._jungleGiantTrees = [];
      this._jungleRoots = [];
      this._jungleWaterfalls = [];
      this._jungleSunRays = [];
      this._jungleBirds = [];
      this._jungleButterflies = [];
      this._jungleMonkeys = [];
      this._jungleDragonflies = [];
      this._jungleLeaves = [];
      this._jungleMistParticles = [];
      this._jungleFlowers = [];
      this._jungleWildlife = [];
      this._jungleFireflies = [];
      this._jungleAmbientParticles = [];
      this._jungleRiver = [];
      this._jungleCrossVines = [];
      // Volcano eruption state reset
      this._volcanoEruptionActive = false;
      this._volcanoEruptionTimer = 0;
      this._volcanoEruptionX = 0;
      this._volcanoEruptionParticles = [];
      this._volcanoNextEruptionTime = 1200 + Math.random() * 1200;
      this._volcanoAshParticles = [];
      this._volcanoEmberParticles = [];
      this._volcanoSmokeColumns = [];

      // Volcanic Eruption event reset
      this._volcanicEruptionActive = false;
      this._volcanicEruptionPhase = null;
      this._volcanicEruptionTimer = 0;
      this._volcanicEruptionFadeProgress = 0;
      this._volcanicEruptionBombs = [];
      this._volcanicEruptionSkyDarkness = 0;
      this._volcanicEruptionGlowIntensity = 0;
      this._volcanicEruptionAshParticles = [];
      this._volcanicEruptionSmokeParticles = [];
      this._volcanicEruptionEmberParticles = [];
      this._volcanicEruptionFountainParticles = [];
      this._volcanicEruptionBombSpawnCounter = 0;
      this._volcanicEruptionScreenFlash = 0;

      // Firestorm event reset
      this._firestormActive = false;
      this._firestormPhase = null;
      this._firestormTimer = 0;
      this._firestormFadeProgress = 0;
      this._firestormSkyDarkness = 0;
      this._firestormGlowIntensity = 0;
      this._firestormEmbers = [];
      this._firestormAsh = [];
      this._firestormWindStreaks = [];
      this._firestormSparks = [];
      this._firestormLargeClouds = [];
      this._firestormWhirls = [];
      this._firestormWhirlTimer = 0;
      this._firestormSkyTint = 0;

      this.sounds.stopBlizzardWind();
      this.sounds.stopAuroraAmbient();
      this.commentary.clear();
      this.commentary.lastLeaderCode = null;
      this.eventBanner.clear();
      this._sustainedLeaderCode = null;
      this._sustainedLeaderStartTime = 0;
      this._sustainedLeaderBannerShown = false;
      this._sustainedLeaderLastBannerTime = 0;
      this.raceDirector.startRace(this.raceLength);
      this.broadcastDirector.reset();
      this.storyEngine.reset();

      this._eventToggle = false;

      // Event intensity config ??? computed once, consumed by tick()
      const evtIntensity = (this._loadout && this._loadout.eventIntensity) || 'medium';
      const evtCfg = {
        low: { base: 60, variation: 5, maxEvents: 6 },
        medium: { base: 30, variation: 3, maxEvents: 12 },
        high: { base: 20, variation: 3, maxEvents: 18 },
        chaos: { base: 10, variation: 2, maxEvents: 40 }
      };
      this._eventIntensityCfg = evtCfg[evtIntensity] || evtCfg.high;
      this.maxEvents = this._eventIntensityCfg.maxEvents;
      this._nextEventRaceTime = 20;
      this.raceTimer = 0;
      this.countdownSeconds = 3;
      this.state = 'countdown';
      this.isRunning = true;
      this.isPaused = false;
      this.lastTime = 0;
      this.lastKnockoutCycle = 0;

      // Always default camera focus to current leader (auto-switch on overtakes)
      this.selectedBallId = 'leader';

      // Procedural generation (respect loadout: obstacles, frequencies, density)
      const enabledObs = this._loadout ? this._loadout.obstacles : null;
      const obsFreqs = this._loadout ? this._loadout.obstacleFreqs : null;
      const densityPct = this._loadout ? this._loadout.density : 80;
      this.generateProceduralTrack(this.currentThemeKey, this.raceLength, this.obstacleDensity, enabledObs, obsFreqs, densityPct);


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

      // Initialize HTML DOM states with fade transition
      this.fadeTransition(() => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('setup-menu').classList.add('hidden');
        document.getElementById('race-hud').classList.remove('hidden');
        document.getElementById('winner-screen').classList.add('hidden');
        document.getElementById('wc-champion-screen').classList.add('hidden');
      });

      // Start central animation tick
      this._rafId = requestAnimationFrame((t) => this.tick(t));

      // Load background decorations after gameplay is running
      this._initDecorationsForTheme();

      // Update live HUD overlays continuously
      this.hudUpdateTimer = setInterval(() => this.updateHUD(), 150);
    }

    // Live HUD updater (HTML elements)
    updateHUD() {
      if (this.state !== 'racing' && this.state !== 'countdown') {
        clearInterval(this.hudUpdateTimer);
        return;
      }

      // Broadcast-style timer: M:SS.T
      const mins = Math.floor(this.raceTimer / 60);
      const secs = (this.raceTimer % 60).toFixed(1);
      document.getElementById('hud-timer').innerText = mins > 0
        ? `${mins}:${secs.padStart(4, '0')}`
        : `${secs}s`;

      // Update map name (still update but hidden)
      const mapEl = document.getElementById('hud-map-name');
      if (mapEl) mapEl.innerText = this.currentTheme.name;



      // Populate country camera selector dropdown
      const camSelect = document.getElementById('hud-camera-select');
      if (camSelect) {
        const currentVal = camSelect.value;
        camSelect.innerHTML = '<option value="leader">???? Auto-Follow Leader</option>';
        this.leaderboard.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b.code;
          opt.textContent = `${b.code.toUpperCase()} - ${b.name}`;
          if (b.finished) opt.textContent += ' ???';
          if (b.code === currentVal) opt.selected = true;
          camSelect.appendChild(opt);
        });
      }

      // Podium ??? show top 3 racers at bottom
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

        const gapPx = top5[0].x - b.x;
        const gapTime = gapPx / 20; // rough time-in-seconds approximation
        let gapText, gapColor;
        if (b.finished) {
          gapText = `${b.finishTime.toFixed(2)}s`;
          gapColor = 'rgba(255,255,255,0.6)';
        } else if (index === 0) {
          gapText = 'LEADER';
          gapColor = '#ffd700';
        } else if (gapTime < 0.5) {
          gapText = `+${gapTime.toFixed(2)}s`;
          gapColor = '#2ecc71'; // green ??? close
        } else if (gapTime < 2) {
          gapText = `+${gapTime.toFixed(2)}s`;
          gapColor = '#f5c842'; // yellow ??? mid
        } else {
          gapText = `+${gapTime.toFixed(2)}s`;
          gapColor = '#e74c3c'; // red ??? far
        }

        row.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="rank-badge rank-${b.rank <= 3 ? 'top' + b.rank : 'other'}">${b.rank}</span>
          <img class="hud-flag-icon" src="https://flagcdn.com/w40/${b.code}.png" alt="${b.name}" onerror="this.style.display='none'">
          <span class="hud-country-name">${b.name}</span>
        </div>
        <span class="gap-badge" style="color:${gapColor}">${b.finished ? gapText + ' ???' : gapText}</span>
      `;
        listContainer.appendChild(row);
      });
    }

    endRace() {
      this.state = 'finished';
      this.isPaused = false;

      // Stop Race Director
      this.raceDirector.stop();

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
      // ?????? Full cleanup before restart ??????
      // Kill RAF loop immediately so no duplicate loops accumulate
      if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
      this.isRunning = false;
      // Clear all timers
      if (this.countdownTimer) { clearInterval(this.countdownTimer); this.countdownTimer = null; }
      if (this.hudUpdateTimer) { clearInterval(this.hudUpdateTimer); this.hudUpdateTimer = null; }
      // Blank all transient arrays/state leftover from previous race
      this.balls = [];
      this.particles = [];
      this.fireworks = [];
      this.confetti = [];
      this.leaderboard = [];
      this._activeMeteors = [];
      this._activeAsteroid = null;
      this._spaceObjects = [];
      this._directorFlashBalls = [];
      this._directorRemoveButtons = [];
      this._speedSurgeMultipliers = new Map();
      this._teleportPairs = [];
      this._teleportPostPairs = [];
      this.activeEvent = null;
      this.eventCount = 0;
      this._meteorTimer = 600 + Math.random() * 600;
      this._asteroidTimer = 1800 + Math.random() * 600;
      this._whiteFlashAlpha = 0;
      this._footballShowerActive = false;
      this._lavaShowerActive = false;
      this._lavaChunks = [];
      this._lavaShowerSkyDim = 0;
      this._speedSurgeActive = false;
      this._blackoutActive = false;
      this._blackoutPhase = null;
      this._blackoutFadeLevel = 0;
      this._teleportState = null;
      this.directorMode = null;
      this.obstacleReliefActive = false;
      this.obstacleZoneOccupancy = {};
      this.commentary.clear();
      this.eventBanner.clear();
      this.broadcastDirector.reset();
      this.storyEngine.reset();
      this.raceDirector.stop();
      // Now safe to restart ??? preserve current loadout so settings persist
      this.startRace(this._loadout);
    }

    fadeTransition(callback) {
      const el = document.getElementById('race-transition');
      if (!el) { if (callback) callback(); return; }
      el.style.transition = 'opacity 0.5s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        if (callback) callback();
      }, 500);
    }

    stopRace() {
      // ?????? Full cleanup ??????
      if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
      this.isRunning = false;
      this.state = 'menu';
      this.raceDirector.stop();
      this.broadcastDirector.reset();
      this.storyEngine.reset();

      if (this.countdownTimer) { clearInterval(this.countdownTimer); this.countdownTimer = null; }
      if (this.hudUpdateTimer) { clearInterval(this.hudUpdateTimer); this.hudUpdateTimer = null; }

      // Clear all transient race data
      this.balls = [];
      this.particles = [];
      this.fireworks = [];
      this.confetti = [];
      this.leaderboard = [];
      this._activeMeteors = [];
      this._activeAsteroid = null;
      this._spaceObjects = [];
      this._directorFlashBalls = [];
      this._speedSurgeMultipliers = new Map();
      this._teleportPairs = [];
      this._teleportPostPairs = [];
      this.activeEvent = null;
      this.eventCount = 0;
      this._footballShowerActive = false;
      this._lavaShowerActive = false;
      this._lavaChunks = [];
      this._lavaShowerSkyDim = 0;
      this._speedSurgeActive = false;
      this._blackoutActive = false;
      this._blackoutPhase = null;
      this._volcanicEruptionActive = false;
      this._volcanicEruptionPhase = null;
      this._volcanicEruptionBombs = [];
      this._volcanicEruptionAshParticles = [];
      this._volcanicEruptionSmokeParticles = [];
      this._volcanicEruptionEmberParticles = [];
      this._volcanicEruptionFountainParticles = [];
      this._volcanicEruptionSkyDarkness = 0;
      this._volcanicEruptionGlowIntensity = 0;
      this._volcanicEruptionScreenFlash = 0;
      this._firestormActive = false;
      this._firestormPhase = null;
      this._firestormTimer = 0;
      this._firestormFadeProgress = 0;
      this._firestormSkyDarkness = 0;
      this._firestormGlowIntensity = 0;
      this._firestormEmbers = [];
      this._firestormAsh = [];
      this._firestormWindStreaks = [];
      this._firestormSparks = [];
      this._firestormLargeClouds = [];
      this._firestormWhirls = [];
      this._firestormWhirlTimer = 0;
      this._firestormSkyTint = 0;
      this._jungleGiantTrees = [];
      this._jungleRoots = [];
      this._jungleWaterfalls = [];
      this._jungleSunRays = [];
      this._jungleBirds = [];
      this._jungleButterflies = [];
      this._jungleMonkeys = [];
      this._jungleDragonflies = [];
      this._jungleLeaves = [];
      this._jungleMistParticles = [];
      this._jungleFlowers = [];
      this._jungleWildlife = [];
      this._jungleFireflies = [];
      this._jungleAmbientParticles = [];
      this._jungleRiver = [];
      this._jungleCrossVines = [];
      this.directorMode = null;
      this.obstacleZoneOccupancy = {};
      this.commentary.clear();
      this.eventBanner.clear();

      this._championOverlayShown = false;
      this._championWinner = null;
      this._championFlagImg = null;

      if (document.getElementById('race-hud').classList.contains('hidden') === false) {
        this.fadeTransition(() => {
          // Show Main Menu, hide panels
          document.getElementById('main-menu').classList.remove('hidden');
          document.getElementById('setup-menu').classList.add('hidden');
          document.getElementById('race-hud').classList.add('hidden');
          document.getElementById('winner-screen').classList.add('hidden');
          document.getElementById('wc-champion-screen').classList.add('hidden');
          this.startBackgroundLoop();
        });
      } else {
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('setup-menu').classList.add('hidden');
        document.getElementById('race-hud').classList.add('hidden');
        document.getElementById('winner-screen').classList.add('hidden');
        document.getElementById('wc-champion-screen').classList.add('hidden');
        this.startBackgroundLoop();
      }
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

    // Auto-simulation harness: generates N tracks and validates them, reporting statistics
    // Run in console via: game.runTrackGenerationValidation(300)
    runTrackGenerationValidation(numTracks = 300) {
      const themes = Object.keys(MAP_THEMES);
      const densities = ['low', 'medium', 'high'];
      const totalStats = {
        generated: 0,
        succeeded: 0,
        portalLoops: 0,
        outsideTrack: 0,
        blockedBoosts: 0,
        overlapping: 0,
        deadEnds: 0,
        bouncingTraps: 0,
        errorsPerTrack: []
      };

      const trackKey = this.currentThemeKey;

      for (let i = 0; i < numTracks; i++) {
        const theme = themes[i % themes.length];
        const density = densities[i % densities.length];
        const length = 80000 + Math.floor(Math.random() * 40000);

        this.currentThemeKey = theme;
        this.currentTheme = MAP_THEMES[theme];

        try {
          this.generateProceduralTrack(theme, length, density);
          totalStats.generated++;

          if (!this.track || !this.track.obstacles) {
            totalStats.errorsPerTrack.push({ track: i, error: 'No track generated' });
            continue;
          }

          // Independent validation on the generated track
          const tErrors = this._validateGeneratedTrack(length);
          if (tErrors === 0) {
            totalStats.succeeded++;
          } else {
            totalStats.errorsPerTrack.push({ track: i, errors: tErrors, theme, density });
          }
        } catch (e) {
          totalStats.errorsPerTrack.push({ track: i, error: e.message });
        }
      }

      // Aggregate error types
      for (const entry of totalStats.errorsPerTrack) {
        if (entry.errors) {
          if (entry.errors.portalLoop) totalStats.portalLoops++;
          if (entry.errors.outsideTrack) totalStats.outsideTrack++;
          if (entry.errors.blockedBoost) totalStats.blockedBoosts++;
          if (entry.errors.overlap) totalStats.overlapping++;
          if (entry.errors.deadEnd) totalStats.deadEnds++;
          if (entry.errors.bouncingTrap) totalStats.bouncingTraps++;
        }
      }

      // Restore track key
      this.currentThemeKey = trackKey;
      this.currentTheme = MAP_THEMES[trackKey];

      const report = [
        `=== Track Generation Validation Report ===`,
        `Tracks generated: ${totalStats.generated}`,
        `Clean tracks: ${totalStats.succeeded}`,
        `Tracks with errors: ${totalStats.generated - totalStats.succeeded}`,
        `Critical failures:`,
        `  Portal loops: ${totalStats.portalLoops}`,
        `  Outside-track obstacles: ${totalStats.outsideTrack}`,
        `  Blocked boosts: ${totalStats.blockedBoosts}`,
        `  Overlapping obstacles: ${totalStats.overlapping}`,
        `  Dead ends: ${totalStats.deadEnds}`,
        `  Bouncing traps: ${totalStats.bouncingTraps}`,
        `=== End Report ===`
      ];

      console.log(report.join('\n'));
      console.log('Detailed errors:', totalStats.errorsPerTrack.filter(e => e.errors || e.error));

      // Return stats for programmatic inspection
      return totalStats;
    }

    // Validates a generated track from outside generateProceduralTrack (standalone check)
    _validateGeneratedTrack(length) {
      const track = this.track;
      if (!track) return null;
      const errors = { portalLoop: 0, outsideTrack: 0, blockedBoost: 0, overlap: 0, deadEnd: 0, bouncingTrap: 0 };

      const getBounds = (x) => this.physics.getWallBoundaries(x, track);

      const getBB = (obs) => {
        let minX = obs.x, maxX = obs.x, minY = obs.y || 300, maxY = obs.y || 300;
        const w = obs.width || obs.length || (obs.radius * 2) || 40;
        const h = obs.height || (obs.radius * 2) || 40;
      if (obs.type === 'c_bumper' || obs.type === 'rock' || obs.type === 'peg') {
          const r = obs.radius || 20;
          minX = obs.x - r; maxX = obs.x + r;
          minY = obs.y - r; maxY = obs.y + r;
        } else if (obs.type === 'spinner' || obs.type === 'sweep_arm') {
          const halfLen = (obs.length || 80) / 2;
          minX = obs.x - halfLen; maxX = obs.x + halfLen;
          minY = obs.y - halfLen; maxY = obs.y + halfLen;
        } else if (obs.type === 'hammer') {
          const armLen = obs.armLength || 100;
          const r = obs.headRadius || 25;
          minX = obs.x - armLen - r; maxX = obs.x + armLen + r;
          minY = obs.y - armLen - r; maxY = obs.y + armLen + r;
        } else if (obs.type === 'punchfist') {
          const ext = obs.extendDist || 120;
          const r = obs.punchRadius || 30;
          const angle = obs.angle || 0;
          const tipX = obs.x + Math.cos(angle) * ext;
          const tipY = obs.y + Math.sin(angle) * ext;
          minX = Math.min(obs.x, tipX) - r;
          maxX = Math.max(obs.x, tipX) + r;
          minY = Math.min(obs.y, tipY) - r;
          maxY = Math.max(obs.y, tipY) + r;
        } else if (obs.type === 'barrier') {
          const hw = (obs.width || 18) / 2;
          const hh = (obs.height || 80) / 2;
          const maxGap = obs.gapMax || 200;
          minX = obs.x - hw; maxX = obs.x + hw;
          minY = (obs.y || 300) - maxGap / 2 - hh;
          maxY = (obs.y || 300) + maxGap / 2 + hh;
        } else if (obs.type === 'portal') {
          const r = obs.radius || 25;
          minX = obs.x - r; maxX = obs.x + r;
          minY = obs.y - r; maxY = obs.y + r;
        } else {
          const halfW = w / 2, halfH = h / 2;
          minX = obs.x - halfW; maxX = obs.x + halfW;
          minY = obs.y - halfH; maxY = obs.y + halfH;
        }
        return { minX, maxX, minY, maxY };
      };

      const boxesOverlap = (b1, b2, buffer = 10) => {
        return !(b1.maxX + buffer < b2.minX || b1.minX - buffer > b2.maxX ||
                 b1.maxY + buffer < b2.minY || b1.minY - buffer > b2.maxY);
      };

      const elements = [];
      track.obstacles.forEach(o => elements.push({ item: o, isZone: false }));
      track.zones.forEach(z => { if (z.type !== 'finish') elements.push({ item: z, isZone: true }); });
      if (track.pegs) track.pegs.forEach(p => elements.push({ item: p, isZone: false }));

      // Outside track
      for (const el of elements) {
        const bb = getBB(el.item);
        const steps = [bb.minX, (bb.minX + bb.maxX) / 2, bb.maxX];
        for (const cx of steps) {
          const bounds = getBounds(cx);
          if (!bounds || bb.minY < bounds.topY - 4 || bb.maxY > bounds.bottomY + 4) {
            errors.outsideTrack++;
            break;
          }
        }
      }

      // Overlap
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const el1 = elements[i], el2 = elements[j];
          if (el1.item.type === 'boost_pipe' && el2.item.type === 'boost' && Math.abs(el1.item.x - el2.item.x) < 5) continue;
          if (el2.item.type === 'boost_pipe' && el1.item.type === 'boost' && Math.abs(el1.item.x - el2.item.x) < 5) continue;
          if (el1.item.type === 'portal' && el2.item.type === 'portal' && el1.item.pairId === el2.item.pairId) continue;
          if (boxesOverlap(getBB(el1.item), getBB(el2.item), 10)) errors.overlap++;
        }
      }

      // Portal checks
      const allPortals = track.zones.filter(z => z.type === 'portal');
      for (const p1 of allPortals) {
        const p2 = allPortals.find(p => p !== p1 && p.pairId === p1.pairId);
        if (!p2) { errors.portalLoop++; continue; }
        if (Math.abs(p1.x - p2.x) < 250) errors.portalLoop++;
        // Portal exit overlap check
        const exitBB = getBB(p2);
        for (const el of elements) {
          if (el.item === p2 || (el.item.type === 'portal' && el.item.pairId === p1.pairId)) continue;
          if (boxesOverlap(exitBB, getBB(el.item), 15)) { errors.portalLoop++; break; }
        }
      }
      // Portal chain/cycle
      const portalPairs = [];
      const seen = new Set();
      for (const p of allPortals) {
        if (!seen.has(p.pairId)) {
          seen.add(p.pairId);
          const exit = allPortals.find(q => q !== p && q.pairId === p.pairId);
          if (p && exit) portalPairs.push({ entry: p, exit });
        }
      }
      const adj = {};
      for (let i = 0; i < portalPairs.length; i++) {
        const a = portalPairs[i];
        const exCX = a.exit.x + a.exit.width / 2, exCY = a.exit.y + a.exit.height / 2;
        for (let j = 0; j < portalPairs.length; j++) {
          if (i === j) continue;
          const b = portalPairs[j];
          const enCX = b.entry.x + b.entry.width / 2, enCY = b.entry.y + b.entry.height / 2;
          const dx = exCX - enCX, dy = exCY - enCY;
          const entryR = b.entry.width / 2 + 10;
          if (dx * dx + dy * dy < entryR * entryR) {
            if (!adj[i]) adj[i] = [];
            adj[i].push(j);
          }
        }
      }
      const dfs = (node, vis, rec) => {
        if (rec.has(node)) return true;
        if (vis.has(node)) return false;
        vis.add(node); rec.add(node);
        for (const n of (adj[node] || [])) { if (dfs(n, vis, rec)) return true; }
        rec.delete(node);
        return false;
      };
      for (let i = 0; i < portalPairs.length; i++) {
        if (dfs(i, new Set(), new Set())) { errors.portalLoop++; break; }
      }

      // Blocked boost
      const boosts = [];
      track.zones.forEach(z => { if (z.type === 'boost') boosts.push(z); });
      track.obstacles.forEach(o => { if (o.type === 'boost_pipe') boosts.push(o); });
      for (const b of boosts) {
        const bbB = getBB(b);
        for (const obs of track.obstacles) {
          if (obs.type === 'boost_pipe') continue;
          const bbO = getBB(obs);
          if (bbO.minX >= bbB.maxX && bbO.minX <= bbB.maxX + 220) {
            if (!(bbO.maxY < bbB.minY || bbO.minY > bbB.maxY)) {
              errors.blockedBoost++;
            }
          }
        }
      }

      // Dead end
      for (let sx = 800; sx < length - 500; sx += 80) {
        const bounds = getBounds(sx);
        if (!bounds) continue;
        const lh = bounds.bottomY - bounds.topY;
        if (lh < 50) continue;
        const covering = [];
        for (const el of elements) {
          const bb = getBB(el.item);
          if (bb.minX <= sx && bb.maxX >= sx) covering.push({ minY: bb.minY, maxY: bb.maxY });
        }
        covering.sort((a, b) => a.minY - b.minY);
        const merged = [];
        for (const c of covering) {
          if (merged.length === 0) merged.push({ minY: c.minY, maxY: c.maxY });
          else {
            const last = merged[merged.length - 1];
            if (c.minY <= last.maxY + 5) last.maxY = Math.max(last.maxY, c.maxY);
            else merged.push({ minY: c.minY, maxY: c.maxY });
          }
        }
        let blocked = 0;
        for (const m of merged) blocked += Math.min(m.maxY, bounds.bottomY) - Math.max(m.minY, bounds.topY);
        if (blocked > lh * 0.88) { errors.deadEnd++; break; }
      }

      // Bouncing trap
      for (let i = 0; i < track.obstacles.length; i++) {
        for (let j = i + 1; j < track.obstacles.length; j++) {
          const o1 = track.obstacles[i], o2 = track.obstacles[j];
          const bb1 = getBB(o1), bb2 = getBB(o2);
          if (bb1.maxX < bb2.minX - 10 || bb2.maxX < bb1.minX - 10) continue;
          const bounds = getBounds((bb1.minX + bb1.maxX) / 2);
          if (!bounds) continue;
          const mid = (bounds.topY + bounds.bottomY) / 2;
          const o1A = bb1.maxY < mid, o2A = bb2.maxY < mid;
          if ((o1A && o2A) || (!o1A && !o2A)) continue;
          const gap = (o1A ? bb2.minY : bb1.minY) - (o1A ? bb1.maxY : bb2.maxY);
          if (gap < 55 && gap > 0) errors.bouncingTrap++;
        }
      }

      const total = errors.portalLoop + errors.outsideTrack + errors.blockedBoost + errors.overlap + errors.deadEnd + errors.bouncingTrap;
      return total === 0 ? 0 : errors;
    }
  }
