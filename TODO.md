# TODO - Flag Rally Ball race changes

## Step 1: Hits required UI + range + smaller text
- Update breakwall generation to set hp/maxHp to random integer 5..10
- Update breakwall draw label to use smaller font and less vertical space

## Step 2: Rotating yellow half-moon reflectors (arc_pair)
- Add angle + spinDir + spinSpeed fields when generating arc_pair obstacles
- Animate rotation each frame in updateDynamicObstacles
- Rotate drawing of arc_pair in game.js
- Update physics collision for arc_pair to respect rotation (world->local transform)
- Apply extra tangential push based on reflector rotation direction

## Step 3: Trapdoor “real door” timing (1s cover / 1s allow)
- Adjust trapdoor timer/slide logic to map to blocking vs allowing windows
- Ensure physics collision gate uses slide threshold where slide==1 during blocking

## Step 4: Smaller cardboard window (+ sign) structure
- Reduce cardboard obstacle cardW/cardH generation/clamps
- Verify drawing still looks correct

## Step 5: Finish line + winner trigger
- Ensure finish zone is not being culled; keep drawing visible
- Confirm winner overlay already triggers on first finish

## Step 6: FIFA World Cup 2026 trophy SVG update
- Replace wc-trophy-svg markup in index.html with a closer silhouette (self-contained)

## Done tracking
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3
- [ ] Step 4
- [ ] Step 5
- [ ] Step 6

