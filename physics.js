// Flag Rally World Cup - Physics Engine (Horizontal Track Version)
// Handles 2D rigid-body dynamics, collisions, special zones, and altitude simulation

class PhysicsEngine {
  constructor() {
    this.forwardForce = 0.023;
    this.baseDamping = 0.993;
    this.nudgeForce = 0.2;

    this.obstacleZoneTracker = {}; // tracks balls per obstacle zone for anti-jam
    this.reliefActive = false;
    this.reliefX = 0;
    this.reliefTimer = 0;
    this._isGlacier = false;
  }

  update(balls, track, dt = 1) {
    this._timeNowSeconds = (this._timeNowSeconds || 0) + dt / 60;

    // Reset collision event flags for sound triggering
    balls.forEach(b => {
      b._hitWallThisFrame = false;
      b._hitPegThisFrame = false;
      b._hitBallThisFrame = false;
      b._hitBarrierThisFrame = false;
      b._hitSpinnerThisFrame = false;
      b._hitMeteorThisFrame = false;
      b._hitSweepArmThisFrame = false;
      b._hitPunchFistThisFrame = false;

      b._hitHammerThisFrame = false;
      b._hitCBumperThisFrame = false;
      b._usedPortalThisFrame = false;
      b._usedLaunchThisFrame = false;
      b._enteredBoostThisFrame = false;
      b._enteredSlowThisFrame = false;
      b._exitedSlowThisFrame = false;
      b._enteredMudPuddleThisFrame = false;
      b._enteredLavaPoolThisFrame = false;
      b._hitCollapsingPillarThisFrame = false;
    });

    // Anti-jam: track balls in obstacle zones and detect jams
    if (track && track.obstacles) {
      this.updateAntiJamSystem(balls, track, dt);
    }

    // 1. Apply forward force, damping, and AI assistance
    balls.forEach(ball => {
      if (ball.finished || ball._capturedByVine) return;

      // Handle vertical altitude (Z-axis) for jumps
      if (ball.z > 0 || ball.vz !== 0) {
        ball.vz -= 0.25 * dt;
        ball.z += ball.vz * dt;
        if (ball.z <= 0) {
          ball.z = 0;
          ball.vz = 0;
          // Small landing recovery — NOT a speed boost
          const speed = Math.hypot(ball.vx, ball.vy);
          if (speed > 0 && speed < 2) {
            ball.vx += (ball.vx / speed) * 0.5;
            ball.vy += (ball.vy / speed) * 0.5;
          }
        }
      }

      // NaN/Infinity guard — reset to last valid position
      if (!isFinite(ball.x) || !isFinite(ball.y)) {
        ball.x = ball._lastValidX != null ? ball._lastValidX : 50;
        ball.y = ball._lastValidY != null ? ball._lastValidY : this.getTrackCenterY(50, track);
        ball.vx = 0;
        ball.vy = 0;
      } else {
        ball._lastValidX = ball.x;
        ball._lastValidY = ball.y;
      }
      if (!isFinite(ball.vx) || !isFinite(ball.vy) || !isFinite(ball.vz)) {
        ball.vx = 0;
        ball.vy = 0;
        ball.vz = 0;
      }

      const MAX_SPEED = 7.5;

      // Check current zones (boost, sand, ice, shortcut)
      let currentDamping = this.baseDamping;
      let inIce = false;
      let inSand = false;
      let inBoost = false;
      ball._wasInBoost = ball._wasInBoost || false;
      ball._wasInSlow = ball._wasInSlow || false;
      ball._wasInLavaPool = ball._wasInLavaPool || false;
      ball._wasInMudPuddle = ball._wasInMudPuddle || false;

      track.zones.forEach(zone => {
        // Portal zones use circle-rectangle overlap for reliable entry (ball center need not be inside tiny 50×50 zone)
        if (zone.type === 'portal') {
          const cx = Math.max(zone.x, Math.min(ball.x, zone.x + zone.width));
          const cy = Math.max(zone.y, Math.min(ball.y, zone.y + zone.height));
          const dx = ball.x - cx;
          const dy = ball.y - cy;
          if (dx * dx + dy * dy < ball.radius * ball.radius && !ball._portalCooldown) {
            const pair = track.zones.find(z => z !== zone && z.type === 'portal' && z.pairId === zone.pairId);
            if (pair) {
              ball.x = pair.x + pair.width / 2;
              ball.y = pair.y + pair.height / 2;
              ball._portalCooldown = 30;
              ball._usedPortalThisFrame = true;
            }
          }
          return; // portal uses its own collision — skip AABB
        }

        if (
          ball.x >= zone.x && ball.x <= zone.x + zone.width &&
          ball.y >= zone.y && ball.y <= zone.y + zone.height
        ) {
          if (zone.type === 'boost') {
            if (!inBoost) {
              ball._enteredBoostThisFrame = true;
            }
            inBoost = true;
            if (ball.z === 0 && !ball._wasInBoost) {
              const boostMult = 1.7 + Math.random() * 0.3;
              ball.vx *= boostMult;
              ball.vy *= boostMult;
              ball._wasInBoost = true;
            }
          } else if (zone.type === 'slow' || zone.type === 'sand' || zone.type === 'lava_pool' || zone.type === 'mud_puddle') {
            if (ball.z === 0 && !ball._wasInSlow && (zone.type === 'slow' || zone.type === 'lava_pool' || zone.type === 'mud_puddle')) {
              if (!this._isGlacier && zone.type === 'slow') {
                ball.vx *= 0.7;
              }
              if (zone.type === 'mud_puddle') {
                // Store original speed and decelerate to 0.3x on entry
                const speed = Math.hypot(ball.vx, ball.vy);
                ball._mudOriginalSpeed = speed > 0 ? speed : 1;
                ball._mudOriginalVx = ball.vx;
                ball._mudOriginalVy = ball.vy;
                const targetSpeed = speed * 0.3;
                if (speed > 0) {
                  ball.vx = (ball.vx / speed) * targetSpeed;
                  ball.vy = (ball.vy / speed) * targetSpeed;
                }
                currentDamping = 0.92;
              }
              ball._wasInSlow = true;
              ball._enteredSlowThisFrame = true;
              if (zone.type === 'lava_pool') {
                ball._enteredLavaPoolThisFrame = true;
                ball._wasInLavaPool = true;
              } else if (zone.type === 'mud_puddle') {
                ball._enteredMudPuddleThisFrame = true;
                ball._wasInMudPuddle = true;
              } else {
                ball._wasInLavaPool = false;
                ball._wasInMudPuddle = false;
              }
            }
            // Continuous mud damping while in puddle
            if (zone.type === 'mud_puddle' && ball.z === 0) {
              currentDamping = 0.92;
            }
            if (zone.type === 'sand') inSand = true;
          } else if (zone.type === 'ice') {
            inIce = true;
            currentDamping = 0.998;
          } else if (zone.type === 'oil') {
            currentDamping = 0.97;
            ball.vy += (Math.random() - 0.5) * 0.08;
          } else if (zone.type === 'launch' && ball.z === 0 && !ball._launchCooldown) {
            // Bounce pad: launch upward and boost forward
            ball.vz = -5;
            ball.vx *= 1.4;
            ball._launchCooldown = 30;
            ball._usedLaunchThisFrame = true;
          } else if (zone.type === 'shortcutEntry' && !ball._shortcutCooldown) {
            ball._inShortcut = true;
            ball._shortcutExitX = zone.x + zone.shortcutLen + 20;
            ball._shortcutDist = zone.teleportDist || 0;
            ball._shortcutRouteDir = zone.routeDir || 0;
            ball._shortcutOffsetY = zone.offsetY || 0;
            boostAppliedThisFrame = true;
            ball.vx += zone.force * ball.attributes.acceleration * 0.6 * dt;
            ball._shortcutCooldown = 15;
          } else if (zone.type === 'shortcutExit' && ball._inShortcut) {
            ball._inShortcut = false;
            const dist = ball._shortcutDist || 100;
            ball.x = Math.min(ball.x + dist, track.length - 500);
            ball.vx += 1.2;
            ball._shortcutCooldown = 30;
            ball.z = 1;
            ball.vz = 2;
          }
        }
      });

      // Reset zone visit flags (only when outside the respective zones)
      if (!inBoost) ball._wasInBoost = false;
      const slowZones = track.zones.filter(z => z.type === 'slow' || z.type === 'lava_pool' || z.type === 'mud_puddle');
      const wasInMud = ball._wasInMudPuddle;
      if (slowZones.every(z => !(ball.x >= z.x && ball.x <= z.x + z.width && ball.y >= z.y && ball.y <= z.y + z.height))) {
        if (ball._wasInSlow) {
          ball._exitedSlowThisFrame = true;
          // Restore original speed when exiting mud puddle
          if (wasInMud && ball._mudOriginalSpeed !== undefined) {
            const currentSpeed = Math.hypot(ball.vx, ball.vy);
            if (currentSpeed > 0 && ball._mudOriginalSpeed > currentSpeed * 1.5) {
              // Restore to original speed
              ball.vx = ball._mudOriginalVx || ball.vx;
              ball.vy = ball._mudOriginalVy || ball.vy;
            }
            delete ball._mudOriginalSpeed;
            delete ball._mudOriginalVx;
            delete ball._mudOriginalVy;
          }
        }
        ball._wasInSlow = false;
        ball._wasInLavaPool = false;
        ball._wasInMudPuddle = false;
      }
      // Decrement portal cooldown
      if (ball._portalCooldown > 0) {
        ball._portalCooldown -= dt;
        if (ball._portalCooldown < 0) ball._portalCooldown = 0;
      }
      if (ball._launchCooldown > 0) {
        ball._launchCooldown -= dt;
        if (ball._launchCooldown < 0) ball._launchCooldown = 0;
      }
      if (ball._shortcutCooldown > 0) {
        ball._shortcutCooldown -= dt;
        if (ball._shortcutCooldown < 0) ball._shortcutCooldown = 0;
      }

      // Normal forward force
      ball.vx += this.forwardForce * dt;

      // 5% AI Assistance: steer toward track center Y
      if (ball.z === 0) {
        const trackCenterY = this.getTrackCenterY(ball.x, track);
        const steerForce = (trackCenterY - ball.y) * 0.0003 * ball.attributes.speed;
        ball.vy += steerForce;

        // Curve negotiation: when the track curves, strong nations handle it slightly better
        const curveFactor = this.getCurveFactor(ball.x, track);
        ball.vx -= curveFactor * 0.01 * dt;
        ball.vy += curveFactor * 0.02 * ball.attributes.consistency * dt;

        // Apply World Cup mode football nations bonus
        if (ball.isWCBonus) {
          ball.vx += 0.026 * dt;
          ball.vy *= 1 + 0.002 * dt;
        }
      }

      // Damping (Friction)
      ball.vx *= Math.pow(currentDamping, dt);
      ball.vy *= Math.pow(currentDamping, dt);

      // Catch-up: trailing balls get passive speed advantage to keep field competitive
      if (ball.z === 0 && balls.length > 1) {
        const leaderX = Math.max(...balls.filter(b => !b.finished).map(b => b.x));
        const gapToLeader = leaderX - ball.x;
        if (gapToLeader > 80) {
          const catchUpFactor = Math.min(0.35, 0.05 + gapToLeader * 0.0003);
          ball.vx += this.forwardForce * catchUpFactor * dt * 20;
        }
        if (gapToLeader < -80) {
          const leadDrag = Math.min(0.015, Math.abs(gapToLeader) * 0.00002);
          ball.vx *= (1 - leadDrag * dt);
        }
      }

      // Global speed cap: soft limit - gently reduce if over limit
      let spd = Math.hypot(ball.vx, ball.vy);
      if (spd > MAX_SPEED && spd > 0) {
        const excess = spd - MAX_SPEED;
        const reduction = 1 - (excess / spd) * 0.3; // Only reduce excess by 30%
        ball.vx *= reduction;
        ball.vy *= reduction;
      }

      // Apply position updates with NaN guard
      if (isFinite(ball.vx)) ball.x += ball.vx * dt;
      if (isFinite(ball.vy)) ball.y += ball.vy * dt;

      // Force wall boundary clamping (top/bottom walls instead of left/right)
      const boundaries = this.getWallBoundaries(ball.x, track);
      if (ball.y < boundaries.topY + ball.radius) {
        ball.y = boundaries.topY + ball.radius;
        ball.vy = Math.abs(ball.vy) * 0.4;
      } else if (ball.y > boundaries.bottomY - ball.radius) {
        ball.y = boundaries.bottomY - ball.radius;
        ball.vy = -Math.abs(ball.vy) * 0.4;
      }

      // Keep track of maximum speed
      const currentSpeed = Math.hypot(ball.vx, ball.vy);
      if (currentSpeed > ball.maxSpeed) {
        ball.maxSpeed = currentSpeed;
      }

      // ------------- ANTI-STUCK RESCUE -------------
      // Speed < 0.2 for 2s → Level 1 (hop), for 3.5s → Level 2 (teleport)
      if (!ball.stuckTime) ball.stuckTime = 0;
      if (!ball.antiStuckLevel) ball.antiStuckLevel = 0;

      if (ball.z === 0) {
        const speed = Math.hypot(ball.vx, ball.vy);
        if (speed < 0.2) {
          ball.stuckTime += dt / 60;
        } else {
          ball.stuckTime = Math.max(0, ball.stuckTime - dt / 30);
          ball.antiStuckLevel = 0;
        }

        // Level 1: after 2s, forward hop + velocity nudge
        if (ball.stuckTime >= 2.0 && ball.antiStuckLevel < 1) {
          ball.antiStuckLevel = 1;
          const targetY = this.getTrackCenterY(ball.x, track) + (Math.random() - 0.5) * 10;
          ball.vx += 2.0;
          ball.vy += (targetY - ball.y) * 0.03;
          ball.vz = 1.5;
          ball.z = 0.3;
        }

        // Level 2: after 3.5s, teleport forward + disable obstacles nearby
        if (ball.stuckTime >= 3.5 && ball.antiStuckLevel < 2) {
          ball.antiStuckLevel = 2;
          const forwardNudge = 40 + Math.random() * 40;
          const newX = ball.x + forwardNudge;
          const boundsAtNewX = track ? this.getWallBoundaries(newX, track) : null;
          if (boundsAtNewX) {
            const margin = ball.radius + 2;
            const preferredY = this.getTrackCenterY(newX, track);
            ball.y = Math.max(boundsAtNewX.topY + margin, Math.min(boundsAtNewX.bottomY - margin, preferredY));
          }
          ball.x = newX;
          ball.vx = 2.0 + Math.random() * 1.0;
          ball.vy += (Math.random() - 0.5) * 0.8;
          ball.z = 0;
          ball.vz = 0;
          ball.stuckTime = 0;
          ball.antiStuckLevel = 0;
          if (track && Array.isArray(track.obstacles)) {
            track.obstacles.forEach(obs => {
              if (obs._remove) return;
              const d = Math.hypot(ball.x - obs.x, ball.y - (obs.y || 0));
              if (d < 150) {
                obs._collisionOffUntil = (this._timeNowSeconds || 0) + 1.0;
              }
            });
          }
        }
      } else {
        // While in air, don't accumulate stuck timer
        ball.stuckTime = 0;
      }

      // Process obstacle disabled-by-time in collision loops via a timestamp check
      // (no timer decrement needed here; time is checked during collision)
      // Add to trail
      if (!ball.trail) ball.trail = [];
      ball.trail.push({ x: ball.x, y: ball.y, z: ball.z });
      if (ball.trail.length > 15) {
        ball.trail.shift();
      }
    });


    // Reset obstacle hit flag for boost multiplier cancellation
    balls.forEach(b => { b._hitLargeObstacle = false; });

    // 2. Ball vs Wall collisions (culled by distance)
    balls.forEach(ball => {
      if (ball.finished || ball._capturedByVine) return;
      track.walls.forEach(wall => {
        if (Math.abs(wall.p1.x - ball.x) > 300) return;
        const prevVx = ball.vx, prevVy = ball.vy;
        this.resolveBallLineCollision(ball, wall);
        if (Math.hypot(ball.vx - prevVx, ball.vy - prevVy) > 0.5) {
          ball._hitWallThisFrame = true;
        }
      });
    });

    // 3. Ball vs Peg collisions (culled by distance)
    balls.forEach(ball => {
      if (ball.finished || ball.z > 0 || ball._capturedByVine) return;
      track.pegs.forEach(peg => {
        if (Math.abs(peg.x - ball.x) > 250) return;
        if (Math.abs(peg.y - ball.y) > 150) return;
        const prevVx = ball.vx, prevVy = ball.vy;
        this.resolveBallPegCollision(ball, peg);
        if (Math.hypot(ball.vx - prevVx, ball.vy - prevVy) > 0.3) {
          ball._hitPegThisFrame = true;
        }
      });
    });

    // 4. Ball vs Moving Obstacles (culled by distance)
    balls.forEach(ball => {
      if (ball.finished || ball.z > 0 || ball._capturedByVine) return;
      track.obstacles.forEach(obs => {
        // Skip obstacles temporarily disabled by anti-stuck system (Layer 2: 0.5s)
        if (typeof obs._collisionOffUntil === 'number' && this._timeNowSeconds < obs._collisionOffUntil) return;
        // Backward compatibility: also respect older _disabled flag if present
        if (obs._disabled) return;

        if (obs.type === 'spinner') {
          // Rectangular arm collision: 4 edges of the rotated rectangle
          const halfLen = obs.length / 2;
          const barW = 12;
          const cosA = Math.cos(obs.angle);
          const sinA = Math.sin(obs.angle);
          // 4 corners of the rotated rectangle
          const corners = [
            { x: obs.x + (-barW/2)*cosA - (-halfLen)*sinA, y: obs.y + (-barW/2)*sinA + (-halfLen)*cosA },
            { x: obs.x + (barW/2)*cosA - (-halfLen)*sinA, y: obs.y + (barW/2)*sinA + (-halfLen)*cosA },
            { x: obs.x + (barW/2)*cosA - (halfLen)*sinA, y: obs.y + (barW/2)*sinA + (halfLen)*cosA },
            { x: obs.x + (-barW/2)*cosA - (halfLen)*sinA, y: obs.y + (-barW/2)*sinA + (halfLen)*cosA }
          ];
          // Collide with each edge of the rectangle
          const edgeSegs = [
            { p1: corners[0], p2: corners[1] },
            { p1: corners[1], p2: corners[2] },
            { p1: corners[2], p2: corners[3] },
            { p1: corners[3], p2: corners[0] }
          ];
          let spinnerHit = false;
          for (let e = 0; e < edgeSegs.length; e++) {
            const prevVx = ball.vx, prevVy = ball.vy;
            this.resolveBallLineCollision(ball, edgeSegs[e]);
            if (Math.hypot(ball.vx - prevVx, ball.vy - prevVy) > 0.3) spinnerHit = true;
          }
          if (spinnerHit) ball._hitSpinnerThisFrame = true;
          // Center ring collision (orange/yellow ring)
          const ringDist = Math.hypot(ball.x - obs.x, ball.y - obs.y);
          const ringMinDist = ball.radius + 10;
          if (ringDist < ringMinDist && ringDist > 0) {
            const nx = (ball.x - obs.x) / ringDist;
            const ny = (ball.y - obs.y) / ringDist;
            ball.x += nx * (ringMinDist - ringDist);
            ball.y += ny * (ringMinDist - ringDist);
            const rvx = -ball.vx;
            const rvy = -ball.vy;
            const velAlongNormal = rvx * nx + rvy * ny;
            if (velAlongNormal < 0) {
              const j = -(1 + ball.restitution) * velAlongNormal;
              ball.vx += j * nx;
              ball.vy += j * ny;
            }
          }
          // Additional rotating pin collision (existing logic, kept for smooth tangent flow)
          obs.pins.forEach(pin => {
            const mover = {
              x: pin.x, y: pin.y,
              radius: pin.radius + 2,
              vx: pin.vx * 0.3, vy: pin.vy * 0.3
            };
            const dx = ball.x - mover.x;
            const dy = ball.y - mover.y;
            const dist = Math.hypot(dx, dy);
            const minDist = ball.radius + mover.radius;
            if (dist < minDist && dist > 0) {
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;
              ball.x += nx * overlap;
              ball.y += ny * overlap;
              const rvx = mover.vx - ball.vx;
              const rvy = mover.vy - ball.vy;
              const velAlongNormal = rvx * nx + rvy * ny;
              if (velAlongNormal < 0) {
                const j = -(1 + ball.restitution) * velAlongNormal;
                ball.vx += j * nx * 0.8;
                ball.vy += j * ny * 0.8;
                ball.vx += mover.vx * 0.3;
                ball.vy += mover.vy * 0.3;
              }
              // Redirect ball along spinner tangent (smooth flow, not a trap)
              const tx = -ny;
              const ty = nx;
              const tangVel = ball.vx * tx + ball.vy * ty;
              ball.vx += tangVel * tx * 0.15;
              ball.vy += tangVel * ty * 0.15;
            }
          });
        } else if (obs.type === 'barrier') {
          const halfGap = (obs.currentGap != null ? obs.currentGap : 100) / 2;
          const halfW = obs.width / 2;
          const midY = obs.y;
          // Top gate half — centred on obs.x, flush against gap (matches rendering box)
          const topBox = { x: obs.x - halfW, y: midY - halfGap - obs.height, width: obs.width, height: obs.height };
          this.resolveBallBoxCollision(ball, topBox);
          // Bottom gate half — centred on obs.x, flush against gap (matches rendering box)
          const botBox = { x: obs.x - halfW, y: midY + halfGap, width: obs.width, height: obs.height };
          this.resolveBallBoxCollision(ball, botBox);
          ball._hitBarrierThisFrame = true;
        } else if (obs.type === 'flap') {
          // Flap is a rotating/hinged blocker. Approximate it as a rotated line segment.
          // When isOpen=true (blocking): angle=PI/2, horizontal across track
          // When isOpen=false (passable): angle=0, vertical along track
          // Only collide when actually blocking (angle > PI/4)
          if ((obs.angle || 0) < Math.PI / 4) return;

          const plateW = obs.plateWidth || 60;
          const plateH = obs.plateHeight || 70;
          const halfLen = Math.max(plateW, plateH) / 2;
          const ang = obs.angle || 0;

          const p1 = { x: obs.x - Math.cos(ang) * halfLen, y: obs.y - Math.sin(ang) * halfLen };
          const p2 = { x: obs.x + Math.cos(ang) * halfLen, y: obs.y + Math.sin(ang) * halfLen };

          const abx = p2.x - p1.x;
          const aby = p2.y - p1.y;
          const acx = ball.x - p1.x;
          const acy = ball.y - p1.y;
          const abLenSq = abx * abx + aby * aby;
          if (abLenSq !== 0) {
            let t = (acx * abx + acy * aby) / abLenSq;
            t = Math.max(0, Math.min(1, t));
            const cpx = p1.x + t * abx;
            const cpy = p1.y + t * aby;
            const ddx = ball.x - cpx;
            const ddy = ball.y - cpy;
            const dist = Math.hypot(ddx, ddy);
            if (dist < ball.radius && dist > 0) {
              const overlap = ball.radius - dist;
              const nx = ddx / dist;
              const ny = ddy / dist;
              ball.x += nx * overlap;
              ball.y += ny * overlap;

              // impulse reversal approximation
              const vn = ball.vx * nx + ball.vy * ny;
              if (vn < 0) {
                const j = -(1 + ball.restitution) * vn;
                ball.vx += j * nx;
                ball.vy += j * ny;
              }
            }
          }
        } else if (obs.type === 'rock') {
          const prevVx = ball.vx, prevVy = ball.vy;
          this.resolveBallMovingCircleCollision(ball, obs);
          if (Math.hypot(ball.vx - prevVx, ball.vy - prevVy) > 0.5) {
            ball._hitMeteorThisFrame = true;
          }
          // Meteor boundary enforcement: keep ball within track walls
          if (obs.isMeteor && ball.z === 0 && !ball.finished) {
            const bounds = this.getWallBoundaries(ball.x, track);
            const margin = ball.radius + 4;
            if (ball.y < bounds.topY + margin) { ball.y = bounds.topY + margin; ball.vy = Math.abs(ball.vy) * 0.5; }
            if (ball.y > bounds.bottomY - margin) { ball.y = bounds.bottomY - margin; ball.vy = -Math.abs(ball.vy) * 0.5; }
          }
        } else if (obs.type === 'trapdoor') {
          // Wall switcher: panel blocks top or bottom portion of track
          const bounds = this.getWallBoundaries(obs.x, track);
          const trackH = bounds.bottomY - bounds.topY;
          const gapH = 80;
          // Calculate panel height based on open/closed state
          const targetPanelH = obs.isOpen ? gapH : trackH;
          const panelH = gapH + (targetPanelH - gapH) * obs._slide;
          const panelTop = bounds.topY; // Fixed top edge
          const halfW = obs.width / 2;
          // Standard AABB collision with the panel
          const closestX = Math.max(obs.x - halfW, Math.min(ball.x, obs.x + halfW));
          const closestY = Math.max(panelTop, Math.min(ball.y, panelTop + panelH));
          const dx = ball.x - closestX;
          const dy = ball.y - closestY;
          const dist = Math.hypot(dx, dy);
          if (dist < ball.radius) {
            const overlap = ball.radius - dist;
            const nx = dist > 0.001 ? dx / dist : (Math.random() - 0.5);
            const ny = dist > 0.001 ? dy / dist : 0;
            ball.x += nx * overlap;
            ball.y += ny * overlap;
            const vn = ball.vx * nx + ball.vy * ny;
            if (vn < 0) {
              ball.vx -= vn * nx * 0.5;
              ball.vy -= vn * ny * 0.5;
            }
          }
        } else if (obs.type === 'sweep_arm') {
          // Jungle vine collision - match the curved visual vine
          const isJungle = obs._isJungle === true; // only true on jungle map
          const armLen = obs.length || 120;
          const angle = obs.angle || 0;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);
          
          if (isJungle) {
            // Use same curved segments as visual rendering
            const segments = 8;
            const time = Date.now() * 0.001;
            const swayPhase = (obs.x + obs.y) * 0.01;
            const swayAmount = Math.sin(time * 0.5 + swayPhase) * 3;
            
            // Check collision against each curved segment
            let prevX = obs.x;
            let prevY = obs.y;
            
            for (let s = 1; s <= segments; s++) {
              const t = s / segments;
              // Same curve math as visual
              const curveLocalX = Math.sin(t * Math.PI * 1.5 + time * 0.3 + swayPhase) * swayAmount * t;
              const curveLocalY = t * armLen + Math.sin(t * Math.PI * 2 + time * 0.2) * 2;
              
              // Rotate curve to arm angle
              const curveX = obs.x + cosA * curveLocalY - sinA * curveLocalX;
              const curveY = obs.y + sinA * curveLocalY + cosA * curveLocalX;
              
              // Check ball vs this segment
              const dx = curveX - prevX;
              const dy = curveY - prevY;
              const lenSq = dx * dx + dy * dy;
              if (lenSq > 0.01) {
                const segT = Math.max(0, Math.min(1, ((ball.x - prevX) * dx + (ball.y - prevY) * dy) / lenSq));
                const closestX = prevX + segT * dx;
                const closestY = prevY + segT * dy;
                const dist = Math.hypot(ball.x - closestX, ball.y - closestY);
                
                // Vine width tapers from 8 to ~3, use avg ~6 + ball radius
                const widthAtT = 8 * (1 - t * 0.4);
                const collisionRadius = ball.radius + widthAtT * 0.5 + 2;
                
                if (dist < collisionRadius) {
                  const nx = (ball.x - closestX) / (dist || 1);
                  const ny = (ball.y - closestY) / (dist || 1);
                  if (dist > 0.001) {
                    ball.x = closestX + nx * collisionRadius;
                    ball.y = closestY + ny * collisionRadius;
                  }
                  const physicsSpeed = obs.physicsSpeed || obs.speed || 0.07;
                  const tipVx = -sinA * physicsSpeed * armLen * obs.direction;
                  const tipVy = cosA * physicsSpeed * armLen * obs.direction;
                  const armVelocityAtContact = t;
                  const PUSH_STRENGTH = 0.8;
                  ball.vx += tipVx * armVelocityAtContact * PUSH_STRENGTH;
                  ball.vy += tipVy * armVelocityAtContact * PUSH_STRENGTH;
                  ball._hitSweepArmThisFrame = true;
                  return; // Exit after first hit
                }
              }
              prevX = curveX;
              prevY = curveY;
            }
          } else {
            // Original straight arm collision for other themes
            const ex = obs.x + cosA * armLen;
            const ey = obs.y + sinA * armLen;
            const dx = ex - obs.x;
            const dy = ey - obs.y;
            const lenSq = dx * dx + dy * dy;
            if (lenSq < 0.01) return;
            const t = Math.max(0, Math.min(1, ((ball.x - obs.x) * dx + (ball.y - obs.y) * dy) / lenSq));
            const closestX = obs.x + t * dx;
            const closestY = obs.y + t * dy;
            const dist = Math.hypot(ball.x - closestX, ball.y - closestY);
            if (dist < ball.radius + 14) {
              const nx = (ball.x - closestX) / dist;
              const ny = (ball.y - closestY) / dist;
              if (dist > 0.001) {
                ball.x = closestX + nx * (ball.radius + 14);
                ball.y = closestY + ny * (ball.radius + 14);
              }
              const physicsSpeed = obs.physicsSpeed || obs.speed || 0.07;
              const tipVx = -sinA * physicsSpeed * armLen * obs.direction;
              const tipVy = cosA * physicsSpeed * armLen * obs.direction;
              const armVelocityAtContact = t;
              const PUSH_STRENGTH = 0.8;
              ball.vx += tipVx * armVelocityAtContact * PUSH_STRENGTH;
              ball.vy += tipVy * armVelocityAtContact * PUSH_STRENGTH;
              ball._hitSweepArmThisFrame = true;
            }
          }
        } else if (obs.type === 'c_bumper') {
          // Rotating C-bumper — semicircular arc collision with tangential spin push
          const R = obs.radius || 70;
          const rot = obs.rotation || 0;
          const count = 8;
          const cosA = Math.cos(rot);
          const sinA = Math.sin(rot);
          const rotPt = (lx, ly) => ({ x: obs.x + lx * cosA - ly * sinA, y: obs.y + lx * sinA + ly * cosA });
          for (let i = 0; i < count; i++) {
            const a1 = -Math.PI * 0.5 + (i / count) * Math.PI;
            const a2 = -Math.PI * 0.5 + ((i + 1) / count) * Math.PI;
            const p1 = rotPt(R * Math.cos(a1), R * Math.sin(a1));
            const p2 = rotPt(R * Math.cos(a2), R * Math.sin(a2));
            this.resolveBallLineCollision(ball, { p1, p2 });
          }
          // Tangential push from spin (only within bumper influence zone)
          if (!ball.finished && ball.z === 0) {
            const dx = ball.x - obs.x;
            const dy = ball.y - obs.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < R * 2 + ball.radius) {
              const tx = -dy / dist;
              const ty = dx / dist;
              const distFactor = 1 - dist / (R * 2 + ball.radius);
              const pushForce = obs.spinSpeed * 2.0 * distFactor;
              ball.vx += tx * pushForce * dt;
              ball.vy += ty * pushForce * dt;
              ball._hitCBumperThisFrame = true;
            }
          }
        } else if (obs.type === 'boost_pipe') {
          // Collidable top and bottom walls with thickness — ball passes through the middle
          const halfW = obs.width / 2;
          const wallThick = 6;
          const topY = obs.y - halfW;
          const botY = obs.y + halfW;
          // Top wall: thick rectangle
          this.resolveBallBoxCollision(ball, {
            x: obs.x, y: topY - wallThick / 2,
            width: obs.length, height: wallThick
          });
          // Bottom wall: thick rectangle
          this.resolveBallBoxCollision(ball, {
            x: obs.x, y: botY - wallThick / 2,
            width: obs.length, height: wallThick
          });
        } else if (obs.type === 'hammer') {
          ball._hitLargeObstacle = true;
          ball._hitHammerThisFrame = true;
          const hR = obs.headRadius || 25;
          const hdx = ball.x - obs.headX;
          const hdy = ball.y - obs.headY;
          const hDist = Math.hypot(hdx, hdy);
          const hMinDist = ball.radius + hR;
          if (hDist < hMinDist && hDist > 0) {
            const hnx = hdx / hDist, hny = hdy / hDist;
            ball.x += hnx * (hMinDist - hDist);
            ball.y += hny * (hMinDist - hDist);
            ball._hitObstacleThisFrame = true;
            const hVx = obs.headVx || 0;
            const hVy = obs.headVy || 0;
            ball.vx += hVx * 3.0;
            ball.vy += hVy * 3.0;
          }
        } else if (obs.type === 'punchfist') {
          if (obs.state !== 'extending' && obs.state !== 'hold') return;
          const pR = obs.punchRadius || 30;
          const dx = ball.x - obs.punchX;
          const dy = ball.y - obs.punchY;
          const dist = Math.hypot(dx, dy);
          const minDist = ball.radius + pR + 2;
          if (dist < minDist && dist > 0) {
            const nx = dx / dist, ny = dy / dist;
            const overlap = minDist - dist;
            ball.x += nx * overlap;
            ball.y += ny * overlap;
            ball._hitObstacleThisFrame = true;
            ball._hitPunchFistThisFrame = true;
            ball.vx += (obs.punchVx || 0) * 1.2;
            ball.vy += (obs.punchVy || 0) * 1.2;
          }
        } else if (obs.type === 'lava_geyser') {
          // Magma Crater exclusive: Lava Geyser eruption collision
          // Only collide when geyser is in eruption state
          if (obs._state !== 'erupting') return;
          
          // Check horizontal overlap with eruption column
          const columnHalfWidth = (obs._eruptionWidth || 30) / 2;
          const dx = ball.x - obs.x;
          const absDx = Math.abs(dx);
          if (absDx > columnHalfWidth + ball.radius) return;
          
          // Check vertical overlap with eruption column (extends upward from crack)
          const crackY = obs.y;
          const eruptionHeight = obs._eruptionHeight || 200;
          const columnTop = crackY - eruptionHeight;
          const columnBottom = crackY;
          
          // Ball overlaps with eruption column
          if (ball.y > columnTop - ball.radius && ball.y < columnBottom + ball.radius) {
            ball._hitObstacleThisFrame = true;
            ball._hitLavaGeyserThisFrame = true;
            
            // Launch ball slightly upward and apply horizontal knockback
            const upwardForce = 2.5;
            const knockbackForce = (Math.random() - 0.5) * 3.0;
            ball.vy -= upwardForce;
            ball.vx += knockbackForce;
            
            // Apply burn effect (handled in game.js updateSimulation)
            // Prevent stacking with existing burn effects
            if (!ball._geyserBurnActive && !ball._lavaBurnActive) {
              ball._geyserBurnActive = true;
              ball._geyserBurnTimer = 120; // 2 seconds at 60fps
              ball._geyserBurnExitSpeed = Math.hypot(ball.vx, ball.vy);
            }
          }
        } else if (obs.type === 'collapsing_pillar') {
          // Collapsing Rock Pillar — only collides when fallen
          if (obs._state !== 'fallen') return;

          const pSide = obs._wallSide || 'top';
          const fw = obs._fallenWidth || 70;
          const fh = obs._fallenHeight || 30;

          // Rectangle collision: pillar extends from wall into lane
          let rectX, rectY, rectW, rectH;
          if (pSide === 'top') {
            rectX = obs.x - fw / 2;
            rectY = obs.y;
            rectW = fw;
            rectH = fh;
          } else {
            rectX = obs.x - fw / 2;
            rectY = obs.y - fh;
            rectW = fw;
            rectH = fh;
          }

          // Closest point on rectangle to ball center
          const cx = Math.max(rectX, Math.min(ball.x, rectX + rectW));
          const cy = Math.max(rectY, Math.min(ball.y, rectY + rectH));
          const dx = ball.x - cx;
          const dy = ball.y - cy;
          const dist = Math.hypot(dx, dy);

          if (dist < ball.radius) {
            // Collision detected
            ball._hitObstacleThisFrame = true;
            ball._hitCollapsingPillarThisFrame = true;

            // Push ball out
            const overlap = ball.radius - dist;
            if (dist > 0.001) {
              const nx = dx / dist;
              const ny = dy / dist;
              ball.x += nx * overlap;
              ball.y += ny * overlap;

              // Bounce response: reflect velocity and reduce slightly
              const dot = ball.vx * nx + ball.vy * ny;
              if (dot < 0) {
                ball.vx -= dot * nx * 1.2;
                ball.vy -= dot * ny * 1.2;
                // Small forward momentum loss (no debuff)
                const speedLoss = 0.92;
                ball.vx *= speedLoss;
                ball.vy *= speedLoss;
              }
            } else {
              // Ball is exactly at center, push downward
              ball.y += ball.radius;
            }

            // No burning, no slowdown, no stun, no freezing — pure physical bounce
          }
} else if (obs.type === 'carnivorous_vine') {
          // Carnivorous Vine — thin wire extending from wall with 2 capture voids
          // Wire acts as solid barrier; balls hitting wire get caught in void or slide around
          
          const wireLen = obs.length || 120; // wire length from wall inward
          const wireW = 6; // thin wire width (physical collision)
          const wireX = obs.x;
          const wireY = obs.y; // position at wall
          const wallDir = obs.wallSide === 'top' ? 1 : -1; // top=1 (extends down), bottom=-1 (extends up)
          
          // Wire vertical bounds (extends from wall inward)
          const wireTop = wallDir === 1 ? wireY : wireY - wireLen;
          const wireBot = wallDir === 1 ? wireY + wireLen : wireY;
          
          // Two capture voids: one at ~1/3 and one at ~2/3 along wire (within wire length)
          // Each void is ~40px tall, positioned along the wire
          const voidHeight = 40;
          const void1Top = wireTop + wireLen * 0.2; // first void at 20% from wall
          const void1Bot = void1Top + voidHeight;
          const void2Top = wireTop + wireLen * 0.6; // second void at 60% from wall
          const void2Bot = void2Top + voidHeight;
          
          // Check if ball is at ground level and horizontally overlapping wire
          if (ball.z === 0 && ball.x > wireX - wireW/2 && ball.x < wireX + wireW/2) {
            const ballTop = ball.y - ball.radius;
            const ballBot = ball.y + ball.radius;
            const ballCenterY = ball.y;
            
            // Check if ball vertically overlaps with wire (solid barrier)
            const overlapsWire = ballBot > wireTop && ballTop < wireBot;
            
            if (overlapsWire) {
              // Ball hits the solid wire - check which void it's closer to
              const distToVoid1 = Math.abs(ballCenterY - (void1Top + void1Bot) * 0.5);
              const distToVoid2 = Math.abs(ballCenterY - (void2Top + void2Bot) * 0.5);
              const targetVoid = distToVoid1 < distToVoid2 ? 1 : 2;
              
              const capturedBalls = obs.capturedBalls || [];
              const void1Occupied = capturedBalls.some(id => {
                const b = this.balls?.find(ball => ball.id === id);
                return b && b._vineVoid === 1;
              });
              const void2Occupied = capturedBalls.some(id => {
                const b = this.balls?.find(ball => ball.id === id);
                return b && b._vineVoid === 2;
              });
              const targetOccupied = targetVoid === 1 ? void1Occupied : void2Occupied;
              
              if (!targetOccupied && capturedBalls.length < 2) {
                // CAPTURE: trap ball in the void for 2 seconds
                obs.captureState = 'capturing';
                obs.captureBallId = ball.id;
                obs.captureTimer = 0;
                obs.captureProgress = 0;
                if (!obs.capturedBallIds) obs.capturedBallIds = new Set();
                obs.capturedBallIds.add(ball.id);
                ball._capturedByVine = true;
                ball._vineVoid = targetVoid;
                ball._vineCaptureVx = ball.vx;
                ball._vineCaptureVy = ball.vy;
                ball._vineCaptureX = ball.x;
                ball._vineCaptureY = ball.y;
                ball.vx = 0;
                ball.vy = 0;
                ball._vineCaptured = true;
                
                if (!obs.capturedBalls) obs.capturedBalls = [];
                obs.capturedBalls.push(ball.id);
              } else {
                // WIRE FULL or void occupied - SLIDE around wire
                // Push ball horizontally out of wire first
                const overlapX = wireW/2 - Math.abs(ball.x - wireX) + 2;
                if (overlapX > 0) {
                  const pushX = ball.x > wireX ? overlapX : -overlapX;
                  ball.x += pushX;
                }
                
                // Slide along wall: top wire -> push DOWN, bottom wire -> push UP
                const slideForce = wallDir * 3;
                ball.vy += slideForce;
                ball.vx *= 0.6;
}
            }
          }
        }
      });
    });

    balls.forEach(b => {
      b._hitLargeObstacle = false;
    });

    // 5. Ball vs Ball collisions (spatially filtered - skip distant pairs)
    const activeBallCount = balls.filter(b => !b.finished && b.z <= 0 && !b._capturedByVine).length;
    if (activeBallCount > 1) {
      for (let i = 0; i < balls.length; i++) {
        const b1 = balls[i];
        if (b1.finished || b1.z > 0 || b1._capturedByVine) continue;
        for (let j = i + 1; j < balls.length; j++) {
          const b2 = balls[j];
          if (b2.finished || b2.z > 0 || b2._capturedByVine) continue;
          if (Math.abs(b1.x - b2.x) > 200) continue; // skip far-apart pairs
          if (Math.abs(b1.y - b2.y) > 120) continue;
          const prevVx1 = b1.vx, prevVy1 = b1.vy;
          const prevVx2 = b2.vx, prevVy2 = b2.vy;
          this.resolveBallBallCollision(b1, b2);
          if (Math.hypot(b1.vx - prevVx1, b1.vy - prevVy1) > 0.3 || Math.hypot(b2.vx - prevVx2, b2.vy - prevVy2) > 0.3) {
            b1._hitBallThisFrame = true;
            b2._hitBallThisFrame = true;
          }
        }
      }
    }

    // 5b. Stationary ball escape: only nudge after 10+ seconds of near-zero velocity
    if (track) {
      balls.forEach(ball => {
        if (ball.finished || ball.z > 0 || ball._capturedByVine) return;
        const speed = Math.hypot(ball.vx, ball.vy);
        if (speed < 0.1) {
          ball._stationaryTime = (ball._stationaryTime || 0) + dt;
          if (ball._stationaryTime > 600) { // 10 seconds at 60fps
            // Gentle random nudge in a physically plausible direction
            const angle = Math.random() * Math.PI * 2;
            const force = 0.3 + Math.random() * 0.3;
            ball.vx += Math.cos(angle) * force;
            ball.vy += Math.sin(angle) * force;
            ball._stationaryTime = 500; // reset to near-threshold to avoid instant re-trigger
          }
        } else {
          ball._stationaryTime = 0;
        }
      });
    }

    // 6. Final safety clamp: force every ball to stay inside track walls
    if (track) {
      balls.forEach(ball => {
        if (ball.finished || ball.z > 0) return;
        const bounds = this.getWallBoundaries(ball.x, track);
        const margin = 2;
        if (ball.y < bounds.topY + ball.radius + margin) {
          ball.y = bounds.topY + ball.radius + margin;
          ball.vy = Math.abs(ball.vy) * 0.2;
        }
        if (ball.y > bounds.bottomY - ball.radius - margin) {
          ball.y = bounds.bottomY - ball.radius - margin;
          ball.vy = -Math.abs(ball.vy) * 0.2;
        }
      });
    }
  }

  // Elastic collision between two balls
  resolveBallBallCollision(b1, b2) {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.hypot(dx, dy);
    const minDist = b1.radius + b2.radius;
    // Soft repulsion when close but not yet overlapping (prevents tight clumping)
    if (dist < minDist * 1.4 && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      const closeness = 1 - dist / (minDist * 1.4);
      const softForce = closeness * closeness * 0.15;
      b1.vx -= nx * softForce;
      b1.vy -= ny * softForce;
      b2.vx += nx * softForce;
      b2.vy += ny * softForce;
    }
    if (dist < minDist && dist > 0) {
      const overlap = minDist - dist;
      const nx = dx / dist;
      const ny = dy / dist;
      const m1 = b1.mass;
      const m2 = b2.mass;
      const totalMass = m1 + m2;
      b1.x -= nx * overlap * (m2 / totalMass);
      b1.y -= ny * overlap * (m2 / totalMass);
      b2.x += nx * overlap * (m1 / totalMass);
      b2.y += ny * overlap * (m1 / totalMass);
      const rvx = b2.vx - b1.vx;
      const rvy = b2.vy - b1.vy;
      const velAlongNormal = rvx * nx + rvy * ny;
      if (velAlongNormal < 0) {
        const e = Math.min(b1.restitution, b2.restitution);
        let j = -(1 + e) * velAlongNormal;
        j /= (1 / m1) + (1 / m2);
        const impulseX = j * nx;
        const impulseY = j * ny;
        const p1 = b1.attributes.collisionPower;
        const p2 = b2.attributes.collisionPower;
        b1.vx -= (1 / m1) * impulseX * (1 - p1 * 0.1);
        b1.vy -= (1 / m1) * impulseY * (1 - p1 * 0.1);
        b2.vx += (1 / m2) * impulseX * (1 - p2 * 0.1);
        b2.vy += (1 / m2) * impulseY * (1 - p2 * 0.1);
        const tx = -ny;
        const ty = nx;
        const velAlongTangent = rvx * tx + rvy * ty;
        b1.vx += velAlongTangent * tx * 0.05;
        b1.vy += velAlongTangent * ty * 0.05;
        b2.vx -= velAlongTangent * tx * 0.05;
        b2.vy -= velAlongTangent * ty * 0.05;
      }
    }
  }

  // Ball vs Static Wall Segment
  resolveBallBoxCollision(ball, box) {
    // AABB collision: push ball out of a rectangular box
    const closestX = Math.max(box.x, Math.min(ball.x, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(ball.y, box.y + box.height));
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const dist = Math.hypot(dx, dy);
    if (dist < ball.radius && dist > 0) {
      const overlap = ball.radius - dist;
      const nx = dx / dist;
      const ny = dy / dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;
      const velAlongNormal = ball.vx * nx + ball.vy * ny;
      if (velAlongNormal < 0) {
        const j = -(1 + ball.restitution) * velAlongNormal;
        ball.vx += j * nx;
        ball.vy += j * ny;
      }
    } else if (dist === 0) {
      // Ball center is exactly at a corner; push upward
      ball.y -= ball.radius;
    }
  }

  resolveBallLineCollision(ball, line) {
    if (!line || !line.p1 || !line.p2) return;
    if (!isFinite(ball.x) || !isFinite(ball.y)) return;
    const abx = line.p2.x - line.p1.x;
    const aby = line.p2.y - line.p1.y;
    const acx = ball.x - line.p1.x;
    const acy = ball.y - line.p1.y;
    const abLenSq = abx * abx + aby * aby;
    if (abLenSq === 0) return;
    let t = (acx * abx + acy * aby) / abLenSq;
    t = Math.max(0, Math.min(1, t));
    const cpx = line.p1.x + t * abx;
    const cpy = line.p1.y + t * aby;
    const dx = ball.x - cpx;
    const dy = ball.y - cpy;
    const dist = Math.hypot(dx, dy);
    if (dist < ball.radius && dist > 0) {
      const overlap = ball.radius - dist;
      const nx = dx / dist;
      const ny = dy / dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;
      const velAlongNormal = ball.vx * nx + ball.vy * ny;
      if (velAlongNormal < 0) {
        const j = -(1 + ball.restitution) * velAlongNormal;
        ball.vx += j * nx;
        ball.vy += j * ny;
        const tx = -ny;
        const ty = nx;
        const velAlongTangent = ball.vx * tx + ball.vy * ty;
        ball.vx -= velAlongTangent * tx * 0.12;
        ball.vy -= velAlongTangent * ty * 0.12;
      }
    }
  }

  // Ball vs Static Peg
  resolveBallPegCollision(ball, peg) {
    const dx = ball.x - peg.x;
    const dy = ball.y - peg.y;
    const dist = Math.hypot(dx, dy);
    const minDist = ball.radius + peg.radius;
    if (dist < minDist && dist > 0) {
      const overlap = minDist - dist;
      const nx = dx / dist;
      const ny = dy / dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;
      const velAlongNormal = ball.vx * nx + ball.vy * ny;
      if (velAlongNormal < 0) {
        const pegBounciness = peg.bouncy ? 1.35 : 0.75;
        const j = -(1 + ball.restitution * pegBounciness) * velAlongNormal;
        ball.vx += j * nx;
        ball.vy += j * ny;
      }
    }
  }

  // Ball vs Moving Circle
  resolveBallMovingCircleCollision(ball, mover) {
    const dx = ball.x - mover.x;
    const dy = ball.y - mover.y;
    const dist = Math.hypot(dx, dy);
    const minDist = ball.radius + mover.radius;
    if (dist < minDist && dist > 0) {
      ball._hitObstacleThisFrame = true;
      const overlap = minDist - dist;
      const nx = dx / dist;
      const ny = dy / dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;
      const rvx = mover.vx - ball.vx;
      const rvy = mover.vy - ball.vy;
      const velAlongNormal = rvx * nx + rvy * ny;
      if (velAlongNormal < 0) {
        const e = ball.restitution;
        const j = -(1 + e) * velAlongNormal;
        ball.vx += j * nx;
        ball.vy += j * ny;
        ball.vx += mover.vx * 0.4;
        ball.vy += mover.vy * 0.4;
      }
    }
  }

  // Ball vs Moving Line Segment
  resolveBallMovingLineCollision(ball, barrier) {
    const line = {
      p1: { x: barrier.x - barrier.width / 2, y: barrier.y },
      p2: { x: barrier.x + barrier.width / 2, y: barrier.y }
    };
    const abx = line.p2.x - line.p1.x;
    const aby = line.p2.y - line.p1.y;
    const acx = ball.x - line.p1.x;
    const acy = ball.y - line.p1.y;
    const abLenSq = abx * abx + aby * aby;
    if (abLenSq === 0) return;
    let t = (acx * abx + acy * aby) / abLenSq;
    t = Math.max(0, Math.min(1, t));
    const cpx = line.p1.x + t * abx;
    const cpy = line.p1.y + t * aby;
    const dx = ball.x - cpx;
    const dy = ball.y - cpy;
    const dist = Math.hypot(dx, dy);
    if (dist < ball.radius && dist > 0) {
      const overlap = ball.radius - dist;
      const nx = dx / dist;
      const ny = dy / dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;
      // Push ball toward nearest open route (track center)
      const trackCenter = this.getTrackCenterY(ball.x, { topPoints: barrier._topPoints, bottomPoints: barrier._bottomPoints });
      if (trackCenter) {
        const dirToCenter = trackCenter - ball.y > 0 ? 1 : -1;
        ball.vy += dirToCenter * 1.5;
      } else {
        ball.vy += ny * 2;
      }
      ball.vx += 0.5;
      const rvx = barrier.vx - ball.vx;
      const rvy = 0 - ball.vy;
      const velAlongNormal = rvx * nx + rvy * ny;
      if (velAlongNormal < 0) {
        const e = ball.restitution;
        const j = -(1 + e) * velAlongNormal;
        ball.vx += j * nx * 0.6;
        ball.vy += j * ny * 0.6;
      }
    }
  }

  // Anti-jam: detect if >5 balls are stuck in same obstacle zone for >2s, then activate relief
  updateAntiJamSystem(balls, track, dt) {
    const BALL_DIAMETER = 30;
    const JAM_THRESHOLD = 5;
    const JAM_TIME = 2.0;
    const RELIEF_DURATION = 1.0;

    // Reset tracker for this frame
    this.obstacleZoneTracker = {};

    // Group balls by obstacle zone
    balls.forEach(ball => {
      if (ball.finished || ball.eliminated || ball._capturedByVine) return;
      track.obstacles.forEach((obs, idx) => {
        if (obs._remove || obs.broken) return;
        const dx = ball.x - obs.x;
        const dy = ball.y - obs.y;
        const dist = Math.hypot(dx, dy);
        const zoneRadius = Math.max(80, obs.width || 60);
        if (dist < zoneRadius) {
          const key = idx + '_' + obs.type;
          if (!this.obstacleZoneTracker[key]) {
            this.obstacleZoneTracker[key] = { count: 0, stuckTime: 0, obsIdx: idx };
          }
          this.obstacleZoneTracker[key].count++;
        }
      });
    });

    let jamDetected = false;
    let jamObsIdx = -1;

    Object.keys(this.obstacleZoneTracker).forEach(key => {
      const data = this.obstacleZoneTracker[key];
      if (data.count >= JAM_THRESHOLD) {
        data.stuckTime += dt / 60;
        if (data.stuckTime >= JAM_TIME) {
          jamDetected = true;
          jamObsIdx = data.obsIdx;
        }
      } else {
        data.stuckTime = Math.max(0, data.stuckTime - dt / 60);
      }
    });

    if (jamDetected && !this.reliefActive) {
      this.reliefActive = true;
      this.reliefTimer = RELIEF_DURATION * 60;
      this.reliefX = track.obstacles[jamObsIdx] ? track.obstacles[jamObsIdx].x : 0;

      // Activate relief on the jammed obstacle
      if (track.obstacles[jamObsIdx]) {
        const obs = track.obstacles[jamObsIdx];
        obs._reliefMode = true;
        obs._reliefTimer = RELIEF_DURATION * 60;

        // Push all nearby balls away from the jam
        balls.forEach(ball => {
          if (ball.finished || ball._capturedByVine) return;
          const dx = ball.x - obs.x;
          const dy = ball.y - obs.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120) {
            const nx = dist > 0 ? dx / dist : 1;
            const ny = dist > 0 ? dy / dist : 0;
            ball.vx += nx * 3 + 1.5;
            ball.vy += ny * 2;
            ball.z = 2;
            ball.vz = 3;
          }
        });
      }
    }

    // Manage active relief: gradually expire
    if (this.reliefActive) {
      this.reliefTimer -= dt;
      if (this.reliefTimer <= 0) {
        this.reliefActive = false;
        // Deactivate relief on all obstacles
        track.obstacles.forEach(obs => {
          obs._reliefMode = false;
          obs._reliefTimer = 0;
        });
      }
    }

    // Expire individual obstacle relief timers
    track.obstacles.forEach(obs => {
      if (obs._reliefMode && obs._reliefTimer !== undefined) {
        obs._reliefTimer -= dt;
        if (obs._reliefTimer <= 0) {
          obs._reliefMode = false;
          obs._reliefTimer = 0;
        }
      }
    });
  }

  // Get track center Y at a given X position by interpolating walls
  getTrackCenterY(x, track) {
    if (!track || !track.topPoints || track.topPoints.length === 0) {
      return 250;
    }
    const boundaries = this.getWallBoundaries(x, track);
    return (boundaries.topY + boundaries.bottomY) / 2;
  }

  // NEW: Get curve factor (rate of change of center Y) at given X
  getCurveFactor(x, track) {
    if (!track || !track.topPoints || track.topPoints.length < 2) return 0;
    const center1 = this.getTrackCenterY(x, track);
    const center2 = this.getTrackCenterY(x + 10, track);
    return (center2 - center1) / 10; // Approximate derivative
  }

  // NEW: Get top and bottom wall Y boundaries at a given X position
  getWallBoundaries(x, track) {
    if (!track || !track.topPoints || track.topPoints.length === 0) {
      return { topY: 50, bottomY: 550 };
    }
    const step = 30; // wall points every 30px
    const idx = Math.floor(x / step);
    const idx0 = Math.max(0, Math.min(idx, track.topPoints.length - 1));
    const idx1 = Math.max(0, Math.min(idx + 1, track.topPoints.length - 1));
    if (idx0 === idx1) {
      return {
        topY: track.topPoints[idx0].y,
        bottomY: track.bottomPoints[idx0].y
      };
    }
    const t = (x - idx0 * step) / step;
    const topY = track.topPoints[idx0].y + (track.topPoints[idx1].y - track.topPoints[idx0].y) * t;
    const bottomY = track.bottomPoints[idx0].y + (track.bottomPoints[idx1].y - track.bottomPoints[idx0].y) * t;
    return { topY, bottomY };
  }

  // Find the nearest open path Y direction for a stuck ball to escape
  findNearestOpenPathY(x, y, track) {
    if (!track || !track.topPoints || track.topPoints.length === 0) {
      return { targetY: 300, direction: 0 };
    }
    const bounds = this.getWallBoundaries(x, track);
    const centerY = (bounds.topY + bounds.bottomY) / 2;
    const distUp = Math.abs(y - bounds.topY);
    const distDown = Math.abs(y - bounds.bottomY);
    if (distUp < distDown) {
      return { targetY: bounds.topY + 20, direction: -1 };
    } else {
      return { targetY: bounds.bottomY - 20, direction: 1 };
    }
  }

  // Find the nearest collidable obstacle near a ball position
  findNearestCollidableObstacle(x, y, track) {
    if (!track || !track.obstacles) return null;
    let nearest = null;
    let nearestDist = Infinity;
    track.obstacles.forEach(obs => {
      if (obs._remove || obs.broken) return;
      const dx = x - obs.x;
      const dy = y - obs.y;
      const dist = Math.hypot(dx, dy);
      if (dist < nearestDist && dist < 100) {
        nearestDist = dist;
        nearest = obs;
      }
    });
    return nearest;
  }

  // Distance squared from point (px, py) to line segment (ax, ay)-(bx, by)
  static _distToSegmentSq(px, py, ax, ay, bx, by) {
    const abx = bx - ax, aby = by - ay;
    const apx = px - ax, apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    if (ab2 === 0) return (px - ax) * (px - ax) + (py - ay) * (py - ay);
    let t = (apx * abx + apy * aby) / ab2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * abx, cy = ay + t * aby;
    const dx = px - cx, dy = py - cy;
    return dx * dx + dy * dy;
  }
}
