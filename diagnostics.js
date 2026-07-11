// Flag Rally World Cup - Automated Track Diagnostics Suite
// Headless physics runner, layout validator, and statistic reporter

class TrackDiagnostics {
  constructor(appController) {
    this.app = appController;
    this.results = {
      runs: 0,
      failures: 0,
      portalLoops: 0,
      outsideTrack: 0,
      blockedBoosts: 0,
      stuckRacers: 0,
      overlapping: 0,
      validationFailures: 0
    };
    this.activeRun = false;
    this.cancelRequested = false;
  }

  // Get the 2D bounding box of an obstacle or zone for overlap/boundary checks
  getBB(obs) {
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
      const r = obs.punchRadius || 30;
      if (d > 0) {
        minX = obs.x - r;
        maxX = obs.x + ext + r;
      } else {
        minX = obs.x - ext - r;
        maxX = obs.x + r;
      }
      minY = obs.y - r;
      maxY = obs.y + r;
    } else if (obs.type === 'barrier') {
      const hw = (obs.width || 18) / 2;
      const hh = (obs.height || 80) / 2;
      const maxGap = obs.gapMax || 200;
      minX = obs.x - hw; maxX = obs.x + hw;
      minY = (obs.y || 300) - maxGap / 2 - hh;
      maxY = (obs.y || 300) + maxGap / 2 + hh;
    } else if (obs.type === 'portal') {
      const r = obs.radius || 25;
      minX = obs.x - r;
      maxX = obs.x + r;
      minY = obs.y - r;
      maxY = obs.y + r;
    } else {
      // standard box / zone
      const halfW = w / 2;
      const halfH = h / 2;
      minX = obs.x - halfW;
      maxX = obs.x + halfW;
      minY = obs.y - halfH;
      maxY = obs.y + halfH;
    }

    return { minX, maxX, minY, maxY };
  }

  // Check if two bounding boxes overlap with an optional buffer
  boxesOverlap(b1, b2, buffer = 8) {
    return !(
      b1.maxX + buffer < b2.minX ||
      b1.minX - buffer > b2.maxX ||
      b1.maxY + buffer < b2.minY ||
      b1.minY - buffer > b2.maxY
    );
  }

  // Validate a track's constraints
  validateTrack(track) {
    const physics = new PhysicsEngine();
    const errors = {
      portalLoops: 0,
      outsideTrack: 0,
      blockedBoosts: 0,
      overlapping: 0,
      validationFailures: 0
    };

    // Combine obstacles and zones for testing
    const elements = [];
    if (track.obstacles) track.obstacles.forEach(o => elements.push({ item: o, isZone: false }));
    if (track.zones) track.zones.forEach(z => elements.push({ item: z, isZone: true }));

    // 1. Check for outside-track obstacles
    elements.forEach(el => {
      const obs = el.item;
      // Skip the finish zone or special oil/decorations that are meant to span full height
      if (obs.type === 'finish' || obs.type === 'shortcutExit' || obs.type === 'shortcutEntry') return;

      const bb = this.getBB(obs);
      const steps = [bb.minX, (bb.minX + bb.maxX) / 2, bb.maxX];

      for (const cx of steps) {
        const bounds = physics.getWallBoundaries(cx, track);
        if (!bounds) {
          errors.outsideTrack++;
          errors.validationFailures++;
          break;
        }
        const margin = 2; // small threshold
        if (bb.minY < bounds.topY - margin || bb.maxY > bounds.bottomY + margin) {
          errors.outsideTrack++;
          errors.validationFailures++;
          break;
        }
      }
    });

    // 2. Check for overlapping obstacles (excluding peg to peg overlaps inside peg stacks, and boost pipe boost zones)
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const el1 = elements[i];
        const el2 = elements[j];

        // Skip checking boost pipe zone with its own boost pipe box
        if (el1.item.type === 'boost_pipe' && el2.item.type === 'boost' && Math.abs(el1.item.x - el2.item.x) < 5) continue;
        if (el2.item.type === 'boost_pipe' && el1.item.type === 'boost' && Math.abs(el1.item.x - el2.item.x) < 5) continue;
        // Skip checking portal entries inside the same portal pair
        if (el1.item.type === 'portal' && el2.item.type === 'portal' && el1.item.pairId === el2.item.pairId) continue;

        const bb1 = this.getBB(el1.item);
        const bb2 = this.getBB(el2.item);

        if (this.boxesOverlap(bb1, bb2, 10)) {
          errors.overlapping++;
          errors.validationFailures++;
        }
      }
    }

    // 3. Check for portal loops and dangerous exits
    const portals = track.zones.filter(z => z.type === 'portal');
    portals.forEach(p1 => {
      // Find its pair
      const p2 = portals.find(p => p !== p1 && p.pairId === p1.pairId);
      if (!p2) {
        errors.portalLoops++;
        errors.validationFailures++;
        return;
      }

      // Check distance (loops can happen if entry/exit are way too close)
      const dist = Math.abs(p1.x - p2.x);
      if (dist < 200) {
        errors.portalLoops++;
        errors.validationFailures++;
      }

      // Check if exit overlaps another portal
      portals.forEach(other => {
        if (other.pairId === p1.pairId) return;
        const bbExit = this.getBB(p2);
        const bbOther = this.getBB(other);
        // Exits must never spawn inside or immediately next to another portal
        if (this.boxesOverlap(bbExit, bbOther, 100)) {
          errors.portalLoops++;
          errors.validationFailures++;
        }
      });
    });

    // 4. Check for blocked boosts
    // Boost pads/pipes must have a clean acceleration zone
    const boosts = [];
    track.zones.forEach(z => { if (z.type === 'boost') boosts.push(z); });
    track.obstacles.forEach(o => { if (o.type === 'boost_pipe') boosts.push(o); });

    boosts.forEach(b => {
      const bbBoost = this.getBB(b);
      // Look for obstacles directly ahead of the boost
      const checkXStart = bbBoost.maxX;
      const checkXEnd = bbBoost.maxX + 250;

      track.obstacles.forEach(obs => {
        if (obs.type === 'boost_pipe') return; // skip other boost corridors
        const bbObs = this.getBB(obs);
        if (bbObs.minX >= checkXStart && bbObs.minX <= checkXEnd) {
          // If the obstacle lies directly in the vertical path of the boost
          if (!(bbObs.maxY < bbBoost.minY || bbObs.minY > bbBoost.maxY)) {
            errors.blockedBoosts++;
            errors.validationFailures++;
          }
        }
      });
    });

    return errors;
  }

  // Fast headless simulation to run racers through the track
  simulateRacerFlow(track) {
    const physics = new PhysicsEngine();
    // Default desert theme parameters for consistency
    physics.forwardForce = MAP_THEMES.desert.forwardForce * 0.65;

    // Spawn 3 virtual test balls
    const balls = [];
    for (let i = 0; i < 3; i++) {
      balls.push({
        id: i,
        x: 50 + i * 5,
        y: 300 + (i % 2 === 0 ? -15 : 15),
        vx: 1.5,
        vy: 0,
        vz: 0,
        z: 0,
        radius: 15,
        mass: 1.0,
        restitution: 0.3,
        finished: false,
        eliminated: false,
        finishTime: 0,
        attributes: { speed: 1.0, acceleration: 1.0, collisionPower: 1.0, recovery: 1.0, consistency: 1.0 }
      });
    }

    const finishDetectX = track.finishLineX || track.length - 400;
    let ticks = 0;
    const maxTicks = 3500; // ample time for a clean run, but traps will timeout

    while (ticks < maxTicks && balls.some(b => !b.finished)) {
      physics.update(balls, track, 1.2); // slight step size increase for speed

      // Manually process finishes
      balls.forEach(b => {
        if (!b.finished && b.x >= finishDetectX) {
          b.finished = true;
        }
      });

      ticks++;
    }

    // Stuck check: did any racer fail to cross the finish line?
    const stuck = balls.filter(b => !b.finished).length;
    return {
      ticks,
      stuckCount: stuck,
      success: stuck === 0
    };
  }

  // Main runner to simulate 300 tracks asynchronously
  async runSuite(onProgress, onComplete) {
    if (this.activeRun) return;
    this.activeRun = true;
    this.cancelRequested = false;

    // Reset results
    this.results = {
      runs: 0,
      failures: 0,
      portalLoops: 0,
      outsideTrack: 0,
      blockedBoosts: 0,
      stuckRacers: 0,
      overlapping: 0,
      validationFailures: 0
    };

    const targetRuns = 300;
    const themes = Object.keys(MAP_THEMES);
    const densities = ['low', 'medium', 'high'];

    for (let r = 0; r < targetRuns; r++) {
      if (this.cancelRequested) break;

      const theme = themes[r % themes.length];
      const density = densities[r % densities.length];
      const length = 60000 + Math.random() * 40000; // 60k - 100k px track

      // 1. Generate the track
      // Make a dummy GameEngine to run procedural generation
      const dummyEngine = new GameEngine(document.createElement('canvas'));
      dummyEngine.generateProceduralTrack(theme, length, density);
      const track = dummyEngine.track;

      // 2. Validate Layout
      const layoutErrors = this.validateTrack(track);
      this.results.portalLoops += layoutErrors.portalLoops;
      this.results.outsideTrack += layoutErrors.outsideTrack;
      this.results.blockedBoosts += layoutErrors.blockedBoosts;
      this.results.overlapping += layoutErrors.overlapping;
      this.results.validationFailures += layoutErrors.validationFailures;

      // 3. Headless Flow Simulation
      const simResult = this.simulateRacerFlow(track);
      if (!simResult.success) {
        this.results.stuckRacers += simResult.stuckCount;
      }

      if (layoutErrors.validationFailures > 0 || !simResult.success) {
        this.results.failures++;
      }

      this.results.runs++;

      // Trigger UI callback
      onProgress(this.results, r + 1, targetRuns);

      // Yield thread to keep page responsive
      await new Promise(resolve => requestAnimationFrame(resolve));
    }

    this.activeRun = false;
    onComplete(this.results);
  }

  cancel() {
    this.cancelRequested = true;
  }
}
