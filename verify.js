const fs = require('fs');
const content = fs.readFileSync('game.js', 'utf8');

const checks = [
  { name: 'Tropical Rainstorm in event list', check: content.includes('tropical_rainstorm') },
  { name: 'Jungle-only filter for rainstorm', check: content.includes("e.key !== 'tropical_rainstorm' || this.currentThemeKey === 'jungle'") },
  { name: 'Football shower removed from jungle', check: content.includes("e.key !== 'football_shower' || this.currentThemeKey !== 'jungle'") },
  { name: 'Rainstorm event handler', check: content.includes('_tropicalRainstormActive = true') },
  { name: 'Speed reduction 0.6x', check: content.includes('ball.vx *= 0.6') },
  { name: 'Original speeds stored', check: content.includes('_rainstormOriginalSpeeds') },
  { name: 'Speed restoration', check: content.includes('ball.vx = orig.vx') },
  { name: 'Rain particles init', check: content.includes('_rainstormParticles') },
  { name: 'Splash particles', check: content.includes('_rainstormSplashes') },
  { name: 'Lightning timer', check: content.includes('_rainstormLightningTimer') },
  { name: 'Rain visual rendering', check: content.includes('_tropicalRainstormActive') },
  { name: 'Cleanup on event end', check: content.includes('_rainstormOriginalSpeeds = null') },
];

checks.forEach(c => {
  console.log((c.check ? '✓' : '✗') + ' ' + c.name);
});