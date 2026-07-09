// Flag Rally World Cup - App Controller
// Manages HTML panel visibility, custom country registry, presets, and integrates HTML form nodes with GameEngine

class AppController {
  constructor() {
    this.engine = null;

    // Complete country database (standard UN + subdivision extensions + custom)
    this.countries = [];
    // Currently active map choice
    this.selectedMapKey = 'desert';
    this.selectedMode = 'world_cup';

    // Custom countries database key
    this.STORAGE_CUSTOM_KEY = 'flag_rally_custom_nations';
  }

  init() {
    const canvas = document.getElementById('gameCanvas');
    this.engine = new GameEngine(canvas);

    // 1. Load Country DB
    const baseDb = getCountryDatabase();
    this.countries = baseDb;
    this.loadCustomCountriesFromStorage();

    this.engine.init(this.countries);

    // 2. Load settings from storage
    this.loadSettings();

    // 3. Render country grid checklist
    this.renderCountriesGrid();

    // 4. Default Preset (World Cup 48 nations initially selected)
    this.loadPresetFIFA();

    // 5. Initial Map Highlight
    this.selectMap(this.selectedMapKey);

    // 6. Bind UI Events
    window.addEventListener('resize', () => this.handleAspectResize());
    this.handleAspectResize();

    // Bind custom flag preview loader
    document.getElementById('cust-code').addEventListener('input', (e) => {
      const code = e.target.value.toLowerCase().trim();
      const preview = document.getElementById('cust-flag-preview');
      if (code.length >= 2) {
        preview.style.backgroundImage = `url(https://flagcdn.com/w80/${code}.png)`;
        preview.innerText = '';
      } else {
        preview.style.backgroundImage = 'none';
        preview.innerText = '?';
      }
    });
  }

  // Load custom country additions saved from past sessions
  loadCustomCountriesFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_CUSTOM_KEY);
      if (stored) {
        const customs = JSON.parse(stored);
        customs.forEach(c => {
          // Verify no duplicate code exists
          if (!this.countries.find(x => x.code === c.code)) {
            this.countries.push(c);
          }
        });
      }
    } catch (e) {
      console.error("Failed loading custom nations from storage", e);
    }
  }

  // Save list of custom additions to localStorage
  saveCustomCountryToStorage(c) {
    try {
      const stored = localStorage.getItem(this.STORAGE_CUSTOM_KEY);
      let customs = stored ? JSON.parse(stored) : [];
      customs.push(c);
      localStorage.setItem(this.STORAGE_CUSTOM_KEY, JSON.stringify(customs));
    } catch (e) {
      console.error("Failed saving custom nation to storage", e);
    }
  }

  loadSettings() {
    // SFX
    const soundVal = localStorage.getItem('setting-sound') !== 'false';
    document.getElementById('setting-sound').checked = soundVal;
    this.engine.sounds.enabled = soundVal;

    // Simulation Speed
    const speedVal = localStorage.getItem('setting-speed') || '1.0';
    document.getElementById('setting-speed').value = speedVal;
    this.engine.simSpeed = parseFloat(speedVal);
    document.getElementById('btn-hud-speed').innerText = speedVal + "x";

    // Camera Mode
    const camVal = localStorage.getItem('setting-camera') || 'lead';
    document.getElementById('setting-camera').value = camVal;
    this.engine.cameraMode = camVal;

    // Aspect Ratio Preview
    const aspectVal = localStorage.getItem('setting-aspect') || 'auto';
    document.getElementById('setting-aspect').value = aspectVal;
  }

  saveSettingSFX() {
    const val = document.getElementById('setting-sound').checked;
    localStorage.setItem('setting-sound', val);
    this.engine.sounds.enabled = val;
  }

  saveSettingSpeed() {
    const val = document.getElementById('setting-speed').value;
    localStorage.setItem('setting-speed', val);
    this.engine.simSpeed = parseFloat(val);
    document.getElementById('btn-hud-speed').innerText = val + "x";
  }

  saveSettingCamera() {
    const val = document.getElementById('setting-camera').value;
    localStorage.setItem('setting-camera', val);
    this.engine.cameraMode = val;
  }

  saveSettingAspect() {
    const val = document.getElementById('setting-aspect').value;
    localStorage.setItem('setting-aspect', val);
    this.handleAspectResize();
  }

  cycleSimSpeed() {
    let speed = this.engine.simSpeed;
    if (speed === 1.0) speed = 1.5;
    else if (speed === 1.5) speed = 2.0;
    else speed = 1.0;

    this.engine.simSpeed = speed;
    document.getElementById('setting-speed').value = speed.toFixed(1);
    document.getElementById('btn-hud-speed').innerText = speed.toFixed(1) + "x";
    localStorage.setItem('setting-speed', speed.toString());
  }

  // Forces matching Aspect Ratio layout sizes on canvas DOM
  handleAspectResize() {
    const canvas = document.getElementById('gameCanvas');
    const width = window.innerWidth;
    const height = window.innerHeight;

    const aspect = localStorage.getItem('setting-aspect') || 'auto';
    canvas.className = ''; // reset classes

    if (aspect === '16-9') {
      canvas.classList.add('force-landscape');
      const ratio = 16 / 9;
      if (width / height > ratio) {
        canvas.style.height = '100vh';
        canvas.style.width = (height * ratio) + 'px';
      } else {
        canvas.style.width = '100vw';
        canvas.style.height = (width / ratio) + 'px';
      }
    } else if (aspect === '9-16') {
      canvas.classList.add('force-vertical');
      const ratio = 9 / 16;
      if (width / height > ratio) {
        canvas.style.height = '100vh';
        canvas.style.width = (height * ratio) + 'px';
      } else {
        canvas.style.width = '100vw';
        canvas.style.height = (width / ratio) + 'px';
      }
    } else {
      // Auto full screen
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
    }

    this.engine.resizeCanvas();
  }

  // Populate checklist grid container
  renderCountriesGrid() {
    const container = document.getElementById('countries-list');
    container.innerHTML = '';

    // Sort alphabetically
    const sorted = [...this.countries].sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach(c => {
      const item = document.createElement('div');
      item.className = 'country-item';
      item.id = `item-${c.code}`;
      item.onclick = () => this.toggleCountrySelection(c.code);

      // Determine if custom
      const isCustom = c.custom ? `<span class="cust-badge">CUSTOM</span>` : '';

      item.innerHTML = `
        <img class="item-flag" src="https://flagcdn.com/w40/${c.code}.png" alt="${c.name}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2226%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%232c3e50%22/><text x=%2250%25%22 y=%2260%25%22 fill=%22white%22 font-size=%2210%22 text-anchor=%22middle%22>${c.code.toUpperCase()}</text></svg>'">
        <span class="item-name">${c.name}</span>
        ${isCustom}
      `;

      container.appendChild(item);
    });
  }

  toggleCountrySelection(code) {
    const target = this.countries.find(x => x.code === code);
    if (!target) return;

    const idx = this.engine.selectedCountries.findIndex(x => x.code === code);
    const itemNode = document.getElementById(`item-${code}`);

    if (idx >= 0) {
      // Deselect
      this.engine.selectedCountries.splice(idx, 1);
      if (itemNode) itemNode.classList.remove('selected');
    } else {
      // Select
      this.engine.selectedCountries.push(target);
      if (itemNode) itemNode.classList.add('selected');
    }

    this.updateSelectedCountText();
  }

  updateSelectedCountText() {
    document.getElementById('selected-count').innerText = `${this.engine.selectedCountries.length} Selected`;
  }

  filterCountriesList() {
    const query = document.getElementById('country-search').value.toLowerCase().trim();
    const items = document.getElementsByClassName('country-item');

    for (let i = 0; i < items.length; i++) {
      const node = items[i];
      const name = node.getElementsByClassName('item-name')[0].innerText.toLowerCase();
      const code = node.id.replace('item-', '').toLowerCase();

      if (name.includes(query) || code.includes(query)) {
        node.classList.remove('hidden');
      } else {
        node.classList.add('hidden');
      }
    }
  }

  togglePanel(id) {
    document.getElementById(id).classList.toggle('hidden');
  }

  // Action presets
  loadPresetFIFA() {
    this.clearCountriesSelection();

    // World Cup Mode uses the official 2026 48-team set.
    const preset = (this.engine && (this.engine.gameMode === 'world_cup' || this.engine.gameMode === 'world_cup_2026'))
      ? (typeof getWorldCup2026Preset === 'function' ? getWorldCup2026Preset(this.countries) : getWorldCup48Preset(this.countries))
      : getWorldCup48Preset(this.countries);

    preset.forEach(c => {
      this.engine.selectedCountries.push(c);
      const itemNode = document.getElementById(`item-${c.code}`);
      if (itemNode) itemNode.classList.add('selected');
    });

    this.updateSelectedCountText();
  }

  selectCountriesAll() {
    this.clearCountriesSelection();
    this.countries.forEach(c => {
      this.engine.selectedCountries.push(c);
      const itemNode = document.getElementById(`item-${c.code}`);
      if (itemNode) itemNode.classList.add('selected');
    });
    this.updateSelectedCountText();
  }

  clearCountriesSelection() {
    this.engine.selectedCountries = [];
    const items = document.getElementsByClassName('country-item');
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove('selected');
    }
    this.updateSelectedCountText();
  }

  selectCountriesRandom(num) {
    this.clearCountriesSelection();
    const shuffled = [...this.countries].sort(() => 0.5 - Math.random());
    const count = Math.min(num, shuffled.length);

    for (let i = 0; i < count; i++) {
      const c = shuffled[i];
      this.engine.selectedCountries.push(c);
      const itemNode = document.getElementById(`item-${c.code}`);
      if (itemNode) itemNode.classList.add('selected');
    }
    this.updateSelectedCountText();
  }

  selectMap(themeKey) {
    this.selectedMapKey = themeKey;

    // Clear old active map classes
    const cards = document.getElementsByClassName('map-card');
    for (let i = 0; i < cards.length; i++) {
      cards[i].classList.remove('active');
    }

    document.getElementById(`map-${themeKey}`).classList.add('active');
    this.engine.currentThemeKey = themeKey;
    this.engine.currentTheme = MAP_THEMES[themeKey];
  }

  randomizeMap() {
    const keys = Object.keys(MAP_THEMES);
    const randKey = keys[Math.floor(Math.random() * keys.length)];
    this.selectMap(randKey);
  }

  showSetup(modeKey) {
    this.selectedMode = modeKey;
    this.engine.gameMode = modeKey;

    // Hide main menu, show setup
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('setup-menu').classList.remove('hidden');

    // Setup titles details
    const titleNode = document.getElementById('setup-title');
    const badgeNotice = document.getElementById('mode-badge-rule');
    const ruleText = document.getElementById('mode-rule-text');
    const customSec = document.getElementById('custom-settings-sec');
    const fifaBtn = document.getElementById('btn-fifa-preset');

    // Set custom text descriptions
    if (modeKey === 'world_cup') {
      titleNode.innerText = "World Cup Mode Setup";
      ruleText.innerText = "ONLY in World Cup Mode, top football nations receive moderately higher stats.";
      badgeNotice.classList.remove('hidden');
      customSec.classList.add('hidden');
      fifaBtn.classList.remove('hidden');

      // Auto force load World Cup Preset nations if not loaded
      if (this.engine.selectedCountries.length !== 48) {
        this.loadPresetFIFA();
      }
    } else if (modeKey === 'grand_prix') {
      titleNode.innerText = "Grand Prix Mode Setup";
      badgeNotice.classList.add('hidden');
      customSec.classList.add('hidden');
      fifaBtn.classList.add('hidden');
    } else if (modeKey === 'knockout') {
      titleNode.innerText = "Knockout Setup";
      ruleText.innerText = "Knockout Rule: Every 10 seconds, the nation in last place is eliminated!";
      badgeNotice.classList.remove('hidden');
      customSec.classList.add('hidden');
      fifaBtn.classList.add('hidden');
    } else {
      // custom mode
      titleNode.innerText = "Custom Mode Setup";
      badgeNotice.classList.add('hidden');
      customSec.classList.remove('hidden');
      fifaBtn.classList.add('hidden');
    }
  }

  showMainMenu() {
    // Hide panels
    document.getElementById('setup-menu').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    this.engine.stopRace();
  }

  // Create custom marble ball properties
  saveCustomCountry() {
    const name = document.getElementById('cust-name').value.trim();
    const code = document.getElementById('cust-code').value.trim().toLowerCase();
    const pop = parseFloat(document.getElementById('cust-pop').value) || 50;
    const gdp = parseFloat(document.getElementById('cust-gdp').value) || 50;
    const mil = parseFloat(document.getElementById('cust-mil').value) || 50;
    const tour = parseFloat(document.getElementById('cust-tour').value) || 50;
    const luck = parseFloat(document.getElementById('cust-luck').value) || 50;

    if (!name || !code) {
      alert("Name and ISO code are required!");
      return;
    }

    if (this.countries.find(c => c.code === code)) {
      alert("Country code already exists! Choose another (e.g. 'zz').");
      return;
    }

    // Map stats from 1-100 to physics ratings (same formula as getCountryDatabase)
    const scaledGdp = gdp * 40; // match database scale
    const rawRec = (Math.min(scaledGdp, 2000) / 2000) * 0.5 + ((luck / 10 - 2.5) / 5.5) * 0.5;
    const rawCons = (Math.min(scaledGdp, 5000) / 5000) * 0.6 + (mil / 100) * 0.4;
    const newCountry = {
      code: code,
      name: name,
      stats: {
        pop: pop,
        gdp: scaledGdp,
        mil: mil,
        tour: tour,
        hap: luck / 10,
        luck: luck
      },
      attributes: {
        speed: 0.5 + (tour / 100) * 0.5,
        acceleration: 0.4 + (luck / 100) * 0.6,
        collisionPower: 0.3 + (mil / 100) * 0.7,
        recovery: 0.4 + rawRec * 0.6,
        consistency: 0.5 + rawCons * 0.5
      },
      isWorldCup: false,
      isStrongFootball: false,
      custom: true
    };

    // Append to local memory database
    this.countries.push(newCountry);
    this.saveCustomCountryToStorage(newCountry);

    // Add to flag preloader
    const img = new Image();
    img.src = `https://flagcdn.com/w80/${code}.png`;
    img.onload = () => { this.engine.flagCache[code] = img; };
    img.onerror = () => { this.engine.flagCache[code] = 'failed'; };

    // Refresh grid list
    this.renderCountriesGrid();

    // Clear inputs and toggle
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-code').value = '';
    this.togglePanel('custom-country-creator');

    // Select the new country automatically
    this.toggleCountrySelection(code);
  }

  // Simulation controls bindings
  startRace() {
    // Read custom overrides if in custom mode
    if (this.selectedMode === 'custom') {
      const length = parseInt(document.getElementById('custom-track-length').value);
      const density = document.getElementById('custom-obstacles').value;
      const events = parseInt(document.getElementById('custom-events').value);

      this.engine.raceLength = length;
      this.engine.obstacleDensity = density;
      this.engine.maxEvents = events;
    } else {
      // defaults - 2.5-4 minute competitive race
      const isWorldCup = this.engine.gameMode === 'world_cup' || this.engine.gameMode === 'world_cup_2026';
      this.engine.raceLength = isWorldCup ? 80000 : 65000;
      this.engine.obstacleDensity = 'medium';
      this.engine.maxEvents = 2;
    }

    this.engine.startRace();
  }

  onCameraSelectChange() {
    const val = document.getElementById('hud-camera-select').value;
    this.engine.focusOnCountry(val === 'leader' ? 'leader' : val);
  }

  togglePauseRace() {
    const btn = document.getElementById('btn-hud-pause');
    if (this.engine.isPaused) {
      this.engine.resumeRace();
      btn.innerText = '⏸';
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-secondary');
    } else {
      this.engine.pauseRace();
      btn.innerText = '▶';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');
    }
  }

  resetRace() {
    this.engine.resetRace();
  }

  exitRace() {
    this.engine.stopRace();
    this.showSetup(this.selectedMode);
  }

  startDiagnostics() {
    if (!this.diagnostics) {
      this.diagnostics = new TrackDiagnostics(this);
    }
    
    // UI elements update
    document.getElementById('btn-diag-start').classList.add('hidden');
    document.getElementById('btn-diag-cancel').classList.remove('hidden');
    document.getElementById('diag-verdict').style.display = 'none';
    
    const fill = document.getElementById('diag-progress-fill');
    const pct = document.getElementById('diag-progress-pct');
    const status = document.getElementById('diag-status-text');
    
    fill.style.width = '0%';
    pct.innerText = '0%';
    status.innerText = 'Simulating tracks...';
    
    this.diagnostics.runSuite(
      (res, current, total) => {
        // Progress callback
        const percent = Math.round((current / total) * 100);
        fill.style.width = `${percent}%`;
        pct.innerText = `${percent}%`;
        status.innerText = `Simulating track ${current} / ${total}...`;

        document.getElementById('diag-val-runs').innerText = `${current} / ${total}`;
        document.getElementById('diag-val-failures').innerText = res.failures;
        document.getElementById('diag-val-loops').innerText = res.portalLoops;
        document.getElementById('diag-val-outside').innerText = res.outsideTrack;
        document.getElementById('diag-val-blocked').innerText = res.blockedBoosts;
        document.getElementById('diag-val-overlaps').innerText = res.overlapping;
        document.getElementById('diag-val-stuck').innerText = res.stuckRacers;
      },
      (res) => {
        // Completion callback
        document.getElementById('btn-diag-start').classList.remove('hidden');
        document.getElementById('btn-diag-cancel').classList.add('hidden');
        
        const verdict = document.getElementById('diag-verdict');
        const verdictText = document.getElementById('diag-verdict-text');
        
        verdict.style.display = 'block';
        if (res.failures === 0 && res.stuckRacers === 0) {
          status.innerText = 'Completed successfully!';
          verdict.style.background = 'rgba(46, 204, 113, 0.15)';
          verdict.style.borderColor = '#2ecc71';
          verdictText.style.color = '#2ecc71';
          verdictText.innerText = 'Target achieved: ZERO critical failures!';
        } else {
          status.innerText = 'Completed with issues.';
          verdict.style.background = 'rgba(231, 76, 60, 0.15)';
          verdict.style.borderColor = '#e74c3c';
          verdictText.style.color = '#e74c3c';
          verdictText.innerText = `Finished. Found ${res.failures} failure tracks.`;
        }
      }
    );
  }

  cancelDiagnostics() {
    if (this.diagnostics) {
      this.diagnostics.cancel();
    }
    document.getElementById('btn-diag-start').classList.remove('hidden');
    document.getElementById('btn-diag-cancel').classList.add('hidden');
    document.getElementById('diag-status-text').innerText = 'Cancelled.';
  }

  closeDiagnostics() {
    this.cancelDiagnostics();
    this.togglePanel('diagnostic-panel');
  }
}

// Global entry initialization
let app;
window.onload = () => {
  app = new AppController();
  app.init();
};
