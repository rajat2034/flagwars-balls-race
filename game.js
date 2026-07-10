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

// Dynamic Commentary System — generates race event messages and manages Match Events panel
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

// Global Event Banner — queue-based animated banner displayed on canvas near lower-center
class GlobalEventBanner {
  constructor() {
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

    // Event name (large, bold)
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

// Race Director — TV-style producer that watches the race and presents exciting moments
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

// Broadcast Director — professional state-machine camera orchestration
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
    this._eventThreshold = 5; // 1-10 — only events >= threshold trigger EVENT_FOCUS
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

// Story Engine — continuously observes race data, identifies memorable narratives
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

    // 1. DOMINANCE — same country leading for > 30s continuous
    this._detectDominance(active, candidates);

    // 2. COMEBACK — gain >= 8 positions
    this._detectComeback(active, leaderboard, candidates);

    // 3. COLLAPSE — lose >= 7 positions
    this._detectCollapse(active, leaderboard, candidates);

    // 4. RIVALRY — same pair exchange 3+ times
    this._detectRivalry(active, leaderboard, candidates);

    // 5. UNDERDOG — bottom-third racer enters top 5
    this._detectUnderdog(active, leaderboard, candidates);

    // 6. SURVIVAL — escapes bottom 2 in elimination mode
    if (gameMode === 'knockout') {
      this._detectSurvival(active, candidates);
    }

    // 7. LEADER CRASH — leader hit by obstacle then loses lead
    this._detectLeaderCrash(active, candidates);

    // 8. RECORD RUN — new max position gain
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
    el.innerHTML = `<span class="rd-ts" style="color:${color}">★ STORY</span><span class="rd-msg" style="color:${color}">${message}</span>`;
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

// Story message templates — each with an emoji prefix
const STORY_TEMPLATES = {
  dominance: [
    ['👑', '{name} is dominating this race!'],
    ['🔥', '{name} refuses to give up the lead!'],
    ['👑', '{name} is in complete control!'],
    ['🔥', 'Nobody can catch {name} today!'],
    ['👑', '{name} makes it look easy!'],
    ['🔥', '{name} is untouchable at the front!'],
  ],
  comeback: [
    ['🚀', 'Incredible comeback by {name}!'],
    ['🔥', '{name} is charging through the field!'],
    ['⭐', '{name} stages an amazing recovery!'],
    ['🚀', '{name} rockets up the standings!'],
    ['🔥', 'What a fightback from {name}!'],
    ['⭐', '{name} defies the odds!'],
  ],
  collapse: [
    ['💥', "{name}'s race is falling apart!"],
    ['😱', '{name} loses control!'],
    ['💥', '{name} is tumbling down the order!'],
    ['😱', 'Disaster for {name}!'],
    ['💥', '{name} is in deep trouble!'],
    ['😱', 'Things go from bad to worse for {name}!'],
  ],
  rivalry: [
    ['⚔', '{name} are battling for every position!'],
    ['🔥', '{name} refuse to back down!'],
    ['⚔', '{name} are locked in battle!'],
    ['🔥', '{name} are trading places!'],
    ['⚔', '{name} won\'t give an inch!'],
  ],
  underdog: [
    ['⭐', '{name} shocks the field!'],
    ['🚀', '{name} joins the front runners!'],
    ['⭐', '{name} is climbing the ranks!'],
    ['🚀', '{name} is making a name for themselves!'],
    ['⭐', '{name} rises to the occasion!'],
  ],
  survival: [
    ['😮', '{name} survives elimination!'],
    ['🍀', '{name} escapes at the last second!'],
    ['😮', '{name} cheats elimination!'],
    ['🍀', 'Lucky escape for {name}!'],
    ['😮', '{name} clings on!'],
  ],
  leaderCrash: [
    ['💥', 'The leader has been taken down!'],
    ['🚨', 'Massive upset at the front!'],
    ['💥', 'The leader is hit!'],
    ['🚨', 'Chaos at the front of the race!'],
    ['💥', 'The leader is in trouble!'],
  ],
  recordRun: [
    ['🏆', 'Biggest comeback of today\'s stream by {name}!'],
    ['🏆', '{name} sets a new record climb!'],
    ['🏆', '{name} makes history with this charge!'],
    ['🏆', 'Unbelievable run from {name}!'],
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

    // Commentary & Event systems
    this.commentary = new Commentary();
    this.eventBanner = new GlobalEventBanner();
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
    const finishX = length - 520;
    track.zones.push({ type: 'finish', x: finishX, y: 0, width: 120, height: 700 });
    track.finishLineX = finishX;

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
      spinner: { min: 220, preferred: 300, recovery: 180, safeLanding: 120 },
      sweep_arm: { min: 220, preferred: 300, recovery: 180, safeLanding: 120 },
      c_bumper: { min: 240, preferred: 340, recovery: 200, safeLanding: 120 },
      punchfist: { min: 200, preferred: 280, recovery: 150, safeLanding: 100 },
      barrier: { min: 200, preferred: 280, recovery: 150, safeLanding: 100 },
      breakdoor: { min: 160, preferred: 220, recovery: 100, safeLanding: 80 },
      barrel: { min: 160, preferred: 220, recovery: 100, safeLanding: 80 },
      peg: { min: 120, preferred: 180, recovery: 80, safeLanding: 50 },
      slow: { min: 140, preferred: 200, recovery: 100, safeLanding: 80 },
      wind: { min: 140, preferred: 200, recovery: 100, safeLanding: 80 },
      launch: { min: 160, preferred: 220, recovery: 100, safeLanding: 150 }
    };

    // Zone-based pacing configuration (t = x / length)
    const ZONE_CONFIG = [
      { start: 0.00, end: 0.20, density: 1.20, breathSpace: 0.10,
        types: ['peg', 'c_bumper'] },
      { start: 0.20, end: 0.60, density: 0.78, breathSpace: 0.03,
        types: ['spinner', 'sweep_arm', 'barrier', 'hammer', 'punchfist', 'barrel', 'c_bumper', 'breakdoor', 'slow', 'boost', 'wind'] },
      { start: 0.60, end: 0.85, density: 0.95, breathSpace: 0.08,
        types: ['portal', 'launch', 'slow', 'breakdoor', 'barrier', 'peg', 'boost', 'wind'] },
      { start: 0.85, end: 1.00, density: 1.30, breathSpace: 0.12,
        types: ['launch', 'barrier', 'breakdoor', 'peg', 'boost', 'wind'] }
    ];

    // Weighted obstacle combinations for memorable race moments
    const COMBINATIONS = [
      { weight: 4, types: ['boost', 'spinner'], gap: 30 },
      { weight: 3, types: ['spinner', 'boost'], gap: 40 },
      { weight: 3, types: ['boost', 'portal'], gap: 30 },
      { weight: 3, types: ['hammer', 'boost'], gap: 50 },
      { weight: 2, types: ['portal', 'spinner'], gap: 50 },
      { weight: 2, types: ['barrier', 'boost'], gap: 30 },
      { weight: 2, types: ['c_bumper', 'spinner'], gap: 40 },
      { weight: 2, types: ['boost', 'breakdoor'], gap: 20 },
      { weight: 1, types: ['punchfist', 'barrel'], gap: 20 },
    ];

    // Per-race combo budget: 2-4 memorable sequences
    let comboCount = 0;
    const MAX_COMBOS = 2 + Math.floor(Math.random() * 3);
    let usedCombos = [];

    // Helper to get bounding box for validation
    const getBB = (obs) => {
      let minX = obs.x;
      let maxX = obs.x;
      let minY = obs.y || 300;
      let maxY = obs.y || 300;

      const w = obs.width || obs.length || (obs.radius * 2) || 40;
      const h = obs.height || (obs.radius * 2) || 40;

      if (obs.type === 'c_bumper' || obs.type === 'barrel' || obs.type === 'rock' || obs.type === 'peg') {
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
        const d = obs.direction || 1;
        const ext = obs.extendDist || 120;
        const r = obs.fistRadius || 32;
        if (d > 0) {
          minX = obs.x - r;
          maxX = obs.x + ext + r;
        } else {
          minX = obs.x - ext - r;
          maxX = obs.x + r;
        }
        minY = obs.y - r;
        maxY = obs.y + r;
      } else if (obs.type === 'portal') {
        const r = obs.radius || 25;
        minX = obs.x - r;
        maxX = obs.x + r;
        minY = obs.y - r;
        maxY = obs.y + r;
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
      let recoveryRemaining = 0;

      let densityFactor = 1.0;
      if (densityStr === 'low') densityFactor = 1.3;
      if (densityStr === 'medium') densityFactor = 0.80;
      if (densityStr === 'high') densityFactor = 0.60;

      const MAJOR_OBSTACLES = ['hammer', 'spinner', 'c_bumper', 'portal', 'punchfist', 'sweep_arm', 'barrier'];

      const FORBIDDEN_NEXT = {
        hammer: ['portal', 'hammer'],
        portal: ['hammer', 'punchfist', 'spinner'],
        spinner: ['hammer', 'portal'],
        punchfist: ['hammer', 'portal'],
        sweep_arm: ['hammer', 'portal'],
        barrier: ['portal', 'hammer']
      };

      let comboNextType = null;

      let _safety = 0;
      while (x < segEnd - 150) {
        if (++_safety > 500) { console.log('INFINITE LOOP in generateSegmentObstacles'); break; }
        let forceSafe = recoveryRemaining > 0;

        const t = x / length;

        // Determine current pacing zone
        const currentZone = ZONE_CONFIG.find(z => t >= z.start && t < z.end) || ZONE_CONFIG[ZONE_CONFIG.length - 1];
        let allowedTypes = currentZone.types;
        const zoneDensity = currentZone.density;
        const breathSpaceChance = currentZone.breathSpace;

        // Breathing space: occasional obstacle-free gaps for contrast
        if (Math.random() < breathSpaceChance && !forceSafe && !comboNextType && lastPlacedType) {
          x += 350 + Math.random() * 500;
          lastPlacedType = null;
          secondLastPlacedType = null;
          continue;
        }

        // Combo sequence: if a combo partner is queued, force it
        let type;
        if (comboNextType) {
          type = comboNextType;
          comboNextType = null;
        } else {
          // Avoid immediate repeating or heavy clustering of same type
          let filtered = allowedTypes.filter(type => type !== lastPlacedType && type !== secondLastPlacedType);
          if (filtered.length === 0) filtered = allowedTypes;

          // Forbidden sequence prevention
          if (lastPlacedType && FORBIDDEN_NEXT[lastPlacedType]) {
            filtered = filtered.filter(type => !FORBIDDEN_NEXT[lastPlacedType].includes(type));
            if (filtered.length === 0) filtered = allowedTypes.filter(type => type !== lastPlacedType);
          }

          // Forced safe types during recovery period
          if (forceSafe) {
            const safeTypes = filtered.filter(type => !MAJOR_OBSTACLES.includes(type));
            if (safeTypes.length > 0) filtered = safeTypes;
            recoveryRemaining -= 1;
          }

          type = filtered[Math.floor(Math.random() * filtered.length)];
        }

        const bounds = getBounds(x);
        if (!bounds) {
          x += 200;
          continue;
        }

        const centerY = (bounds.topY + bounds.bottomY) / 2;
        const availH = bounds.bottomY - bounds.topY;
        const halfH = availH / 2;

        const cfg = SPACING_CONFIG[type] || { min: 150, preferred: 200, recovery: 0, safeLanding: 0 };

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
          const w = 75;
          const h = 45;
          track.zones.push({
            type: 'boost', x: x - w / 2,
            y: clampY(centerY + (Math.random() - 0.5) * halfH * 0.5, bounds, h / 2 + 5) - h / 2,
            width: w, height: h, force: 0.20
          });
        } else if (type === 'slow') {
          const w = 60;
          const h = 45;
          track.zones.push({
            type: 'slow', x: x - w / 2,
            y: clampY(centerY + (Math.random() - 0.5) * halfH * 0.5, bounds, h / 2 + 5) - h / 2,
            width: w, height: h
          });
        } else if (type === 'wind') {
          const w = 50;
          const h = Math.min(70, availH * 0.55);
          const forceDir = Math.random() < 0.5 ? 1 : -1;
          const forceMag = 0.018 + Math.random() * 0.018;
          track.zones.push({
            type: 'wind', x: x - w / 2,
            y: clampY(centerY, bounds, h / 2 + 5) - h / 2,
            width: w, height: h,
            force: forceDir * forceMag
          });
        } else if (type === 'punchfist') {
          const fistDir = Math.random() < 0.5 ? 1 : -1;
          const fistRadius = 32;
          track.obstacles.push({
            type: 'punchfist', x, y: clampY(centerY + (Math.random() - 0.5) * 20, bounds, fistRadius + 8),
            direction: fistDir, extendDist: 110, fistRadius, phase: Math.random(),
            cycleDuration: 60, fired: false, fistX: x, fistY: centerY
          });
        } else if (type === 'portal') {
          const pairId = Math.random().toString(36).slice(2);
          const distAhead = 750 + Math.random() * 350;
          const portalSize = 50;
          const p1Y = clampY(centerY + (Math.random() - 0.5) * 30, bounds, portalSize / 2 + 8);
          
          // Portal 1 (Entry)
          track.zones.push({
            type: 'portal', x: x - portalSize / 2, y: p1Y - portalSize / 2,
            width: portalSize, height: portalSize, pairId, radius: portalSize / 2
          });

          // Portal 2 (Exit) - Ensure inside track boundaries
          const x2 = Math.min(x + distAhead, segEnd - 100);
          const bounds2 = getBounds(x2);
          if (bounds2 && x2 > x + 250) {
            const p2Y = clampY((bounds2.topY + bounds2.bottomY) / 2, bounds2, portalSize / 2 + 10);
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
          const bw = 16 + Math.random() * 4;
          const bh = Math.min(75 + Math.random() * 30, availH * 0.55); // Dynamic size constraint
          const bY = clampY(centerY + (Math.random() - 0.5) * availH * 0.25, bounds, bh / 2 + 5);
          const travelRange = Math.max(bh, availH * 0.35);
          const minY = clampY(bY - travelRange / 2, bounds, bh / 2 + 5);
          const maxY = clampY(bY + travelRange / 2, bounds, bh / 2 + 5);
          track.obstacles.push({
            type: 'barrier', x, y: bY, width: bw, height: bh, isVertical: true,
            direction: Math.random() < 0.5 ? 1 : -1, speed: 0.35 + Math.random() * 0.25,
            minY, maxY
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
          const baseSpeed = 0.065;
          const speedPct = [1.0, 0.8, 0.7, 0.5][Math.floor(Math.random() * 4)];
          const physicsSpeed = baseSpeed * speedPct;
          track.obstacles.push({
            type: 'sweep_arm', x, y: clampY(centerY, bounds, 20),
            length: armLen, angle: Math.random() * Math.PI * 2,
            speed: physicsSpeed * 0.3, physicsSpeed,
            direction: Math.random() < 0.5 ? 1 : -1
          });
        } else if (type === 'breakdoor') {
          const doorW = 30 + Math.random() * 8;
          const doorH = Math.min(80 + Math.random() * 30, availH * 0.55);
          const hp = 5 + Math.floor(Math.random() * 6); // Set hp 5..10 as per TODO.md
          const dY = clampY(centerY, bounds, doorH / 2 + 5);
          track.obstacles.push({
            type: 'breakdoor', x, y: dY, width: doorW, height: doorH,
            hp, maxHp: hp, broken: false, _hitCooldown: 0, _crackLevel: 0
          });
        } else if (type === 'hammer') {
          const armLen = Math.min(75 + Math.random() * 25, availH * 0.50);
          const headRadius = 22 + Math.random() * 6;
          const speed = 0.035 + Math.random() * 0.03;
          const direction = Math.random() < 0.5 ? 1 : -1;
          const initialAngle = Math.random() * Math.PI * 2;
          const pivotChoice = Math.random();
          let pivotY;
          if (pivotChoice < 0.25) pivotY = bounds.topY + 12;
          else if (pivotChoice < 0.5) pivotY = bounds.bottomY - 12;
          else pivotY = centerY;

          track.obstacles.push({
            type: 'hammer', x, y: pivotY, armLength: armLen, headRadius,
            speed, direction, angle: initialAngle,
            headX: x + Math.cos(initialAngle) * armLen,
            headY: pivotY + Math.sin(initialAngle) * armLen
          });
        } else if (type === 'barrel') {
          const radius = 18 + Math.random() * 7;
          track.obstacles.push({
            type: 'barrel', x, y: clampY(centerY + (Math.random() - 0.5) * availH * 0.35, bounds, radius + 6),
            radius, mass: radius * 0.09, vx: 0, vy: 0,
            spin: Math.random() * Math.PI * 2, spinSpeed: 0
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
        }

        // Advance X by spacing values
        secondLastPlacedType = lastPlacedType;
        lastPlacedType = type;

        const isDifficult = MAJOR_OBSTACLES.includes(type);
        let nextSpacing = cfg.preferred;
        if (type === 'boost' || isDifficult) nextSpacing += cfg.recovery;

        if (type === 'portal') nextSpacing += cfg.safeLanding;

        // Zone density multiplier shapes per-zone pacing
        const xBeforeAdvance = x;
        const normalAdvance = Math.max(cfg.min, nextSpacing * densityFactor * zoneDensity);
        x += normalAdvance;

        // Attempt to start a weighted combo after non-trivial placements
        // If a combo starts, tighten the gap between the two paired obstacles
        if (!comboNextType && !forceSafe && comboCount < MAX_COMBOS && lastPlacedType && Math.random() < 0.08) {
          const compatible = COMBINATIONS.filter(c =>
            c.types[0] === lastPlacedType &&
            !usedCombos.includes(c) &&
            // Second type must be allowed in the current zone (or nearby future zone)
            (currentZone.types.includes(c.types[1]) ||
             ZONE_CONFIG.some(z => t + 0.02 >= z.start && t + 0.02 < z.end && z.types.includes(c.types[1])))
          );
          if (compatible.length > 0) {
            const totalWeight = compatible.reduce((s, c) => s + c.weight, 0);
            let roll = Math.random() * totalWeight;
            for (const combo of compatible) {
              roll -= combo.weight;
              if (roll <= 0) {
                comboNextType = combo.types[1];
                // Tighten x so second element lands close to the first
                x = Math.max(xBeforeAdvance + 10, xBeforeAdvance + combo.gap);
                usedCombos.push(combo);
                comboCount++;
                break;
              }
            }
          }
        }

        if (isDifficult) {
          recoveryRemaining = Math.max(recoveryRemaining, 2);
        } else {
          recoveryRemaining = Math.max(0, recoveryRemaining - 1);
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

    // Segment partition and loop
    const numSegments = 10;
    const segmentWidth = (finishX - 800) / numSegments;

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
    
    // (final stretch boost placement removed — only launch pads and boost_pipe remain)

    this.track = track;
  }

  // Update dynamic obstacles (punchfist extension, breakdoor fragments, meteor cleanup)
  updateDynamicObstacles(dt) {
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
      } else if (obs.type === 'hammer') {
        obs.angle = (obs.angle || 0) + (obs.speed || 0.03) * obs.direction * dt;
        obs.headX = obs.x + Math.cos(obs.angle) * (obs.armLength || 100);
        obs.headY = obs.y + Math.sin(obs.angle) * (obs.armLength || 100);
      } else if (obs.type === 'barrel') {
        obs.vx = obs.vx || 0;
        obs.vy = obs.vy || 0;
        obs.x += obs.vx * dt;
        obs.y += obs.vy * dt;
        obs.vx *= Math.pow(0.98, dt);
        obs.vy *= Math.pow(0.98, dt);
        const bounds = this.physics.getWallBoundaries(obs.x, this.track);
        if (bounds) {
          const r = obs.radius || 20;
          if (obs.y - r < bounds.topY) {
            obs.y = bounds.topY + r;
            obs.vy = Math.abs(obs.vy) * 0.6;
          } else if (obs.y + r > bounds.bottomY) {
            obs.y = bounds.bottomY - r;
            obs.vy = -Math.abs(obs.vy) * 0.6;
          }
        }
        obs.spin = (obs.spin || 0) + (obs.vx * 0.05) * dt;
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

// Trigger alternate race events (football shower, gravity flip, speed surge, blackout, teleportation)
  triggerRandomEvent() {
    if (this.activeEvent) return;

    const events = [
      { name: '\u26BD FOOTBALL SHOWER!', key: 'football_shower', duration: 420, description: 'Footballs rain across the track, creating unpredictable collisions.', weight: 0.25 },
      { name: 'GRAVITY FLIP', key: 'gravity_flip', duration: 240, description: 'Gravity reverses, sending racers soaring upside down.', weight: 0.15 },
      { name: '\u26A1 SPEED SURGE', key: 'speed_surge', duration: 360, description: 'Every racer receives a different random speed multiplier.', weight: 0.20 },
      { name: '\u26A1 BLACKOUT', key: 'blackout', duration: 0, description: 'Stadium lights have gone out. Anything can happen...', weight: 0.20 },
      { name: '\u26A1 TELEPORTATION', key: 'teleportation', duration: 360, description: 'Ten countries suddenly swapped positions!', weight: 0.20 },
    ];

    // Weighted random selection
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

        // Timed event trigger: every 20 race-seconds
        if (this.maxEvents > 0 && this.activeEvent === null && this.raceTimer > 10 && this.raceTimer >= this._nextEventRaceTime) {
          this.triggerRandomEvent();
          this._nextEventRaceTime += 20;
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

      // Winner flash → champion overlay transition
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
        if (b._hitBarrelThisFrame && Math.random() < 0.15) {
          this.commentary.add(b.name + ' hit a barrel!', 'crash');
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

    // Broadcast Director — observe and decide camera state
    this.broadcastDirector.observe(this.balls, this.leaderboard, this.raceTimer, this.track, this.gameMode, this.activeEvent);
    this.broadcastDirector.update(dt);

    // Story Engine — observe race data, produce narratives for the event feed
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

  // Smooth camera follow — leader-centered, lerp-based
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

    // Smooth camera follow — frame-rate independent lerp for buttery motion
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
          const approachW = 150;

          // Approach zone — subtle gradient 150px before the finish line
          this.ctx.save();
          const approachGrad = this.ctx.createLinearGradient(finishX - approachW, 0, finishX, 0);
          approachGrad.addColorStop(0, 'rgba(255,215,0,0)');
          approachGrad.addColorStop(0.6, 'rgba(255,215,0,0.03)');
          approachGrad.addColorStop(1, 'rgba(255,215,0,0.08)');
          this.ctx.fillStyle = approachGrad;
          this.ctx.fillRect(finishX - approachW, fTop, approachW, fH);
          this.ctx.restore();

          // "FINISH" painted on the track surface just before the checkered area
          this.ctx.save();
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillStyle = 'rgba(255,255,255,0.12)';
          this.ctx.font = 'bold 72px Outfit, Montserrat, sans-serif';
          this.ctx.fillText('FINISH', finishX - 60, fTop + fH / 2);
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
          this.ctx.shadowColor = '#ffd700';
          this.ctx.shadowBlur = 30;
          this.ctx.strokeStyle = 'rgba(255,215,0,0.3)';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(finishX - 2, fTop - 2, zone.width + 4, fH + 4);
          this.ctx.shadowBlur = 0;
          this.ctx.restore();

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
          this.ctx.lineTo(visibleTop[0].x, visibleTop[0].y);
          this.ctx.fill();

          // Edge lighting — subtle gradient near track boundaries
          const topEdgeY = visibleTop[0].y;
          const botEdgeY = visibleBot[0].y;
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

          // Grass texture variation — small subtle streaks
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

          // White painted boundary lines (at ~15% and ~85% of track width)
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

          // Wear marks — subtle dark streaks
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

          // Small scattered pebbles
          const pebSeed = Math.floor(camX / 15);
          this.ctx.fillStyle = 'rgba(180,170,160,0.06)';
          for (let p = 0; p < 8; p++) {
            const px = visibleTop[0].x + ((pebSeed * 47 + p * 131) % (visibleTop[visibleTop.length - 1].x - visibleTop[0].x + 40));
            const py = topEdgeY + 5 + ((pebSeed * 73 + p * 89) % (botEdgeY - topEdgeY - 10));
            const ps = 1 + ((pebSeed * 59 + p * 37) % 3);
            this.ctx.beginPath();
            this.ctx.arc(px, py, ps, 0, Math.PI * 2);
            this.ctx.fill();
          }

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
          this.ctx.globalAlpha = 1;
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

        // 3) Flag ball body — redesigned with professional lighting
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

        // Subtle ambient occlusion — darker near edges opposite light
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

        // Rim light — thin bright edge on light-facing side
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

        // 6) Leader crown — gold star above 1st place
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

      this.ctx.restore(); // restore translate and scale zoom

      // Full screen UI overlays (canvas overlay space)
      this.renderScreenOverlays(screenW, screenH);
    }
  }

    // Draw map-specific animated background elements — parallax stadium scene
    renderDynamicBackground(screenW, screenH) {
      const ctx = this.ctx;
      const theme = this.currentThemeKey;
      if (!theme) return;
      const time = Date.now() / 1000;

      // ---- LAYER 1: Deep background gradient (ambient light) ----
      ctx.save();
      const ambGrad = ctx.createRadialGradient(screenW * 0.5, screenH * 0.3, 0, screenW * 0.5, screenH * 0.3, screenH * 1.2);
      ambGrad.addColorStop(0, 'rgba(255,255,255,0.03)');
      ambGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ambGrad;
      ctx.fillRect(0, 0, screenW, screenH);
      ctx.restore();

      // ---- LAYER 2: Crowd silhouettes (low contrast — support the race, never compete) ----
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

      // ---- LAYER 3: Focus gradient — saturate near track, darken edges ----
      ctx.save();
      const focusGrad = ctx.createRadialGradient(screenW * 0.5, screenH * 0.5, screenH * 0.15, screenW * 0.5, screenH * 0.5, screenH * 0.7);
      focusGrad.addColorStop(0, 'rgba(0,0,0,0)');
      focusGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
      focusGrad.addColorStop(0.85, 'rgba(0,0,0,0.04)');
      focusGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
      ctx.fillStyle = focusGrad;
      ctx.fillRect(0, 0, screenW, screenH);
      ctx.restore();

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
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < 5; i++) {
          const mx = i * screenW / 4 + Math.sin(time * 0.01 + i * 1.5) * 30;
          ctx.beginPath();
          ctx.moveTo(mx - 120, screenH);
          ctx.lineTo(mx - 35, screenH * 0.35);
          ctx.lineTo(mx + 35, screenH * 0.3);
          ctx.lineTo(mx + 120, screenH);
          ctx.fill();
        }
        ctx.restore();
      } else if (theme === 'volcano') {
        ctx.save();
        const lavaGlow = 0.1 + Math.sin(time * 0.5) * 0.05;
        ctx.globalAlpha = lavaGlow;
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(0, screenH * 0.82, screenW, screenH * 0.18);
        // Lava cracks
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.15)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const lx = (i / 8) * screenW + Math.sin(time * 0.1 + i) * 20;
          ctx.beginPath();
          ctx.moveTo(lx, screenH * 0.88);
          ctx.quadraticCurveTo(lx + Math.sin(time + i) * 10, screenH * 0.9, lx + 15, screenH);
          ctx.stroke();
        }
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
        ctx.save();
        ctx.globalAlpha = 0.04;
        const grad = ctx.createRadialGradient(
          screenW * 0.3 + Math.sin(time * 0.05) * 120, screenH * 0.4, 10,
          screenW * 0.3, screenH * 0.4, 350
        );
        grad.addColorStop(0, '#9b59b6');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, screenW, screenH);
        // Twinkling stars
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 30; i++) {
          const sx = ((i * 137.5 + 50) % screenW);
          const sy = ((i * 97.3 + 20) % (screenH * 0.6));
          const s = 0.5 + Math.sin(time * 2 + i * 7) * 0.5;
          ctx.globalAlpha = s * 0.3;
          ctx.beginPath();
          ctx.arc(sx, sy, s * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (theme === 'jungle') {
        ctx.save();
        ctx.globalAlpha = 0.05;
        for (let i = 0; i < 5; i++) {
          const rx = (i * screenW / 4 + Math.sin(time * 0.05 + i) * 30) % screenW;
          ctx.fillStyle = 'rgba(241, 196, 15, 0.2)';
          ctx.beginPath();
          ctx.moveTo(rx - 15, 0);
          ctx.lineTo(rx + 20, 0);
          ctx.lineTo(rx + 60, screenH);
          ctx.lineTo(rx - 50, screenH);
          ctx.fill();
        }
        // Fireflies
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 12; i++) {
          const fx = ((i * 89.7 + 30) % screenW);
          const fy = ((i * 53.1 + 100) % (screenH * 0.7) + screenH * 0.15);
          const pulse = 0.3 + Math.sin(time * 1.5 + i * 2.3) * 0.3;
          ctx.fillStyle = `rgba(200, 255, 100, ${pulse * 0.5})`;
          ctx.beginPath();
          ctx.arc(fx, fy, 2 + pulse, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    renderScreenOverlays(screenW, screenH) {
      // A0. Vignette overlay around screen edges
      if (this.state === 'racing' || this.state === 'finished' || this.state === 'champion_screen') {
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

      // F. Winner Flash — shown for 2 seconds before champion overlay activates
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

      // D. Global Event Banner (animated near lower-center) — hide after race ends or when champion overlay shown
      if (this.state === 'racing' && !this._championOverlayShown) {
        this.eventBanner.render(this.ctx, screenW, screenH);
      }

      // E. Top-Middle Event Capsule — prominent active event display below timer
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
      this._winnerFlashActive = false;
      this._winnerFlashBall = null;
      this._winnerFlashStart = 0;
      this._footballShowerActive = false;
      this._speedSurgeActive = false;
      this._speedSurgeMultipliers = new Map();
      this._blackoutActive = false;
      this._blackoutFadeLevel = 0;
      this._blackoutPhase = null;
      this._teleportState = null;
      this._teleportPairs = [];
      this._teleportPostPairs = [];
      this._whiteFlashAlpha = 0;
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

      // Initialize HTML DOM states with fade transition
      this.fadeTransition(() => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('setup-menu').classList.add('hidden');
        document.getElementById('race-hud').classList.remove('hidden');
        document.getElementById('winner-screen').classList.add('hidden');
        document.getElementById('wc-champion-screen').classList.add('hidden');
      });

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
          gapColor = '#2ecc71'; // green — close
        } else if (gapTime < 2) {
          gapText = `+${gapTime.toFixed(2)}s`;
          gapColor = '#f5c842'; // yellow — mid
        } else {
          gapText = `+${gapTime.toFixed(2)}s`;
          gapColor = '#e74c3c'; // red — far
        }

        row.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="rank-badge rank-${b.rank <= 3 ? 'top' + b.rank : 'other'}">${b.rank}</span>
          <img class="hud-flag-icon" src="https://flagcdn.com/w40/${b.code}.png" alt="${b.name}" onerror="this.style.display='none'">
          <span class="hud-country-name">${b.name}</span>
        </div>
        <span class="gap-badge" style="color:${gapColor}">${b.finished ? gapText + ' ✓' : gapText}</span>
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
      if (this.countdownTimer) clearInterval(this.countdownTimer);
      this.startRace();
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
      this.isRunning = false;
      this.state = 'menu';
      this.broadcastDirector.reset();
      this.storyEngine.reset();

      if (this.countdownTimer) clearInterval(this.countdownTimer);
      clearInterval(this.hudUpdateTimer);

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
        if (obs.type === 'c_bumper' || obs.type === 'barrel' || obs.type === 'rock' || obs.type === 'peg') {
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
          const d = obs.direction || 1;
          const ext = obs.extendDist || 120;
          const r = obs.fistRadius || 32;
          if (d > 0) { minX = obs.x - r; maxX = obs.x + ext + r; }
          else { minX = obs.x - ext - r; maxX = obs.x + r; }
          minY = obs.y - r; maxY = obs.y + r;
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
