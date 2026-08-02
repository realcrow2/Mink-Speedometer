/**
 * mink_carhud - NUI script
 * Circular gauges + dashboard icons + settings (localStorage)
 */
(function () {
  const RESOURCE = 'https://mink_carhud';
  let gauges = { fuel: null, speed: null, rpm: null };
  let visible = false;
  let settingsOpen = false;
  let units = settings.gauges.units || 'MPH';

  function nui(name, data) {
    return fetch(`${RESOURCE}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(data || {}),
    }).catch(() => {});
  }

  function lerpColor(a, b, t) {
    const pah = a.replace('#', '');
    const pbh = b.replace('#', '');
    const ar = parseInt(pah.substring(0, 2), 16);
    const ag = parseInt(pah.substring(2, 4), 16);
    const ab = parseInt(pah.substring(4, 6), 16);
    const br = parseInt(pbh.substring(0, 2), 16);
    const bg = parseInt(pbh.substring(2, 4), 16);
    const bb = parseInt(pbh.substring(4, 6), 16);
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function gradientFromStops(stops, t) {
    if (!stops || !stops.length) return '#fff';
    if (stops.length === 1) return stops[0];
    const clamped = Math.max(0, Math.min(1, t));
    const seg = (stops.length - 1) * clamped;
    const i = Math.floor(seg);
    const f = seg - i;
    if (i >= stops.length - 1) return stops[stops.length - 1];
    return lerpColor(stops[i], stops[i + 1], f);
  }

  function applyLocales() {
    $('[data-locale]').each(function () {
      const key = $(this).attr('data-locale');
      if (LOCALE[key] !== undefined) $(this).html(LOCALE[key]);
    });
    $('#footer-copyright').text('mink_carhud');
  }

  // Clean arc gauges — start at top, no overlapping layout hacks
  const START_ANGLE = -Math.PI / 2;
  const TRACK_FILL = 'rgba(255,255,255,0.14)';
  const CLEAR = 'rgba(0,0,0,0)';

  function gaugeThickness(size) {
    return Math.max(7, Math.round(size * 0.075));
  }

  function makeTrack($el, size) {
    $el.empty().circleProgress({
      value: 1,
      size: size,
      thickness: gaugeThickness(size),
      startAngle: START_ANGLE,
      lineCap: 'round',
      fill: { color: TRACK_FILL },
      emptyFill: CLEAR,
      animation: false,
    });
  }

  function makeProgress($el, size, fill) {
    const duration = Math.max(50, Math.min(400, Number(settings.refresh) || 100));
    $el.empty().circleProgress({
      value: 0,
      size: size,
      thickness: gaugeThickness(size),
      startAngle: START_ANGLE,
      lineCap: 'round',
      fill: fill,
      emptyFill: CLEAR,
      animation: { duration: duration, easing: 'circleProgressEasing' },
    });
    return $el;
  }

  function initGauges() {
    const fuelSize = settings.size.fuel.base * settings.size.fuel.scale;
    const speedSize = settings.size.speed.base * settings.size.speed.scale;
    const rpmSize = settings.size.rpm.base * settings.size.rpm.scale;

    $('#speedMask').remove();

    makeTrack($(settings.gauges.elements.fuel_bg), fuelSize);
    makeTrack($(settings.gauges.elements.speed_bg), speedSize);
    makeTrack($(settings.gauges.elements.rpm_bg), rpmSize);

    gauges.fuel = makeProgress($(settings.gauges.elements.fuel), fuelSize, {
      color: settings.gauges.color.fuel[0] || '#f0a202',
    });
    gauges.speed = makeProgress($(settings.gauges.elements.speed), speedSize, {
      gradient: settings.gauges.color.speed,
      gradientAngle: Math.PI / 2,
    });
    gauges.rpm = makeProgress($(settings.gauges.elements.rpm), rpmSize, {
      gradient: settings.gauges.color.rpm,
      gradientAngle: Math.PI / 2,
    });

    updateFontSizes();
    applyDisplayFlags();
    applyPositions();
  }

  function setGaugeValue($gauge, value) {
    if (!$gauge || !$gauge.length) return;
    $gauge.circleProgress('value', Math.max(0, Math.min(1, value)));
  }

  function updateFontSizes() {
    const ss = settings.size.speed.scale;
    const rs = settings.size.rpm.scale;
    const fs = settings.size.fuel.scale;
    $('#speedNumberValue').css('font-size', settings.size.speed.font[0] * ss + 'px');
    $('#speedUnit').css('font-size', settings.size.speed.font[1] * ss + 'px');
    $('#rpmNumberValue').css('font-size', settings.size.rpm.font[0] * rs + 'px');
    $('#rpmUnit').css('font-size', settings.size.rpm.font[1] * rs + 'px');
    $('#fuelNumberValue').css('font-size', 15 * fs + 'px');
    $('#fuelValue .gauge-unit').css('font-size', 10 * fs + 'px');
    $('#streetNameActual').css('font-size', settings.size.street);
    const ds = settings.size.dashboard.scale;
    $('.displayIcon').css({
      width: settings.size.dashboard.base * ds + 'px',
      height: settings.size.dashboard.base * ds + 'px',
      padding: settings.size.dashboard.padding * ds + 'px',
    });
    const cs = settings.size.compass.scale;
    $('#compass-drag').css('transform', 'translateX(-50%) scale(' + cs + ')');
  }

  function applyDisplayFlags() {
    $('#fuel-wrapper').toggle(!!settings.gauges.display.fuel);
    $('#speed-wrapper').toggle(!!settings.gauges.display.speed);
    $('#rpm-wrapper').toggle(!!settings.gauges.display.rpm);
    $(settings.dashboard.elements.main).toggle(!!settings.dashboard.display);
    const ind = settings.dashboard.individual;
    $(settings.dashboard.elements.left).toggle(!!ind.left);
    $(settings.dashboard.elements.engine).toggle(!!ind.engine);
    $(settings.dashboard.elements.seatbelt).toggle(!!ind.seatbelt);
    $(settings.dashboard.elements.fuel).toggle(!!ind.fuel);
    $(settings.dashboard.elements.cruisecontrol).toggle(!!ind.cruisecontrol);
    $(settings.dashboard.elements.lowbeam).toggle(!!ind.lowbeam);
    $(settings.dashboard.elements.highbeam).toggle(!!ind.highbeam);
    $(settings.dashboard.elements.right).toggle(!!ind.right);
    $(settings.streetCompass.elements.street).toggle(!!settings.streetCompass.display.street);
    $(settings.streetCompass.elements.compass).closest('#compass-position').toggle(
      !!(settings.streetCompass.display.compass ||
        settings.streetCompass.display.heading ||
        settings.streetCompass.display.caret)
    );
    $(settings.streetCompass.elements.heading).toggle(!!settings.streetCompass.display.heading);
    $(settings.streetCompass.elements.caret).toggle(!!settings.streetCompass.display.caret);
    $(settings.streetCompass.elements.compass).toggle(!!settings.streetCompass.display.compass);
  }

  function applyPositions() {
    const map = {
      dashboard: '#dragCluster',
      street: '#dragStreet',
      compass: '#compass-drag',
    };
    Object.keys(map).forEach((key) => {
      const pos = settings.position[key];
      if (!pos) return;
      $(map[key]).css({
        position: 'relative',
        top: pos.top || '0px',
        left: pos.left || '0px',
      });
    });
  }

  function setIconActive($el, on, color) {
    const fill = on ? color || 'rgba(143,201,58,1)' : 'rgba(0,0,0,0.3)';
    $el.find('svg, svg path').css('fill', fill);
    $el.toggleClass('active', !!on);
  }

  // Blinker flash state (icons blink when indicators are on)
  let indLeft = false;
  let indRight = false;
  let blinkOn = true;
  setInterval(function () {
    blinkOn = !blinkOn;
    if (indLeft) {
      setIconActive($(settings.dashboard.elements.left), blinkOn, 'rgba(143,201,58,1)');
    }
    if (indRight) {
      setIconActive($(settings.dashboard.elements.right), blinkOn, 'rgba(143,201,58,1)');
    }
  }, 400);

  function updateSpeed(data) {
    units = settings.gauges.units || 'MPH';
    const speedVal = units === 'KMH' ? (data.speedKmh || data.speed * 1.60934) : data.speed;
    const maxMph = 300;
    const maxDisp = units === 'KMH' ? maxMph * 1.60934 : maxMph;
    const pct = Math.max(0, Math.min(1, (Number(speedVal) || 0) / maxDisp));
    $('#speedNumberValue').text(Math.round(Number(speedVal) || 0));
    $('#speedUnit').text(units);
    setGaugeValue(gauges.speed, pct);
  }

  function updateRPM(data) {
    // GTA RPM ~0.2 idle → ~1.0 redline
    const rpm = Math.max(0, Math.min(1, Number(data.rpm) || 0));
    $('#rpmNumberValue').text(Math.round(rpm * 8000));
    setGaugeValue(gauges.rpm, rpm);
  }

  function updateFuel(data) {
    let fuel = Number(data.fuel);
    if (isNaN(fuel)) fuel = 0;
    if (fuel > 0 && fuel <= 1.5) fuel = fuel * 100;
    fuel = Math.max(0, Math.min(100, fuel));
    setGaugeValue(gauges.fuel, fuel / 100);
    $('#fuelNumberValue').text(Math.round(fuel));
    const low = fuel <= (settings.dashboard.fuelAlert || 20);
    setIconActive($(settings.dashboard.elements.fuel), low, 'rgba(255,89,100,1)');
  }

  function updateDashboard(data) {
    indLeft = data.left === true || data.left === 1;
    indRight = data.right === true || data.right === 1;

    if (!indLeft) setIconActive($(settings.dashboard.elements.left), false);
    else setIconActive($(settings.dashboard.elements.left), blinkOn, 'rgba(143,201,58,1)');

    if (!indRight) setIconActive($(settings.dashboard.elements.right), false);
    else setIconActive($(settings.dashboard.elements.right), blinkOn, 'rgba(143,201,58,1)');

    setIconActive($(settings.dashboard.elements.lowbeam), !!(data.lowbeam === true || data.lowbeam === 1), 'rgba(143,201,58,1)');
    setIconActive($(settings.dashboard.elements.highbeam), !!(data.highbeam === true || data.highbeam === 1), 'rgba(66,160,255,1)');
    setIconActive($(settings.dashboard.elements.cruisecontrol), !!(data.cruise === true || data.cruise === 1), 'rgba(143,201,58,1)');

    const engineLow = (Number(data.engine) || 100) <= (settings.dashboard.engineAlert || 10);
    setIconActive($(settings.dashboard.elements.engine), engineLow, 'rgba(255,89,100,1)');

    if (data.hasSeatbelt === false) {
      setIconActive($(settings.dashboard.elements.seatbelt), false);
    } else if (data.seatbelt === true || data.seatbelt === 1) {
      setIconActive($(settings.dashboard.elements.seatbelt), true, 'rgba(143,201,58,1)');
    } else {
      setIconActive($(settings.dashboard.elements.seatbelt), true, 'rgba(255,89,100,1)');
    }
  }

  function updateStreet(data) {
    if (data.street) $('#streetNameActual').text(data.street);
  }

  function updateCompass(data) {
    const heading = Math.round(((data.heading % 360) + 360) % 360);
    $('#compass-current-number').text(heading);
    const bg =
      settings.compass.background_position -
      heading * settings.compass.movement_scale;
    $('#compass-wrapper').css('background-position', bg + 'px');
  }

  function showHud() {
    visible = true;
    $('#dashboard').show();
  }

  function hideHud() {
    visible = false;
    if (!settingsOpen) $('#dashboard').hide();
  }

  function openSettings() {
    settingsOpen = true;
    $('#dashboard').show();
    $('#mink-carhud-settings > .card').show();
    syncSettingsForm();
  }

  function closeSettings() {
    settingsOpen = false;
    $('#mink-carhud-settings > .card').hide();
    if (!visible) $('#dashboard').hide();
  }

  function syncSettingsForm() {
    $('#mink-carhud-settings-units').val(settings.gauges.units);
    setToggleBtn('#mink-carhud-settings-display-fuel', settings.gauges.display.fuel);
    setToggleBtn('#mink-carhud-settings-display-speed', settings.gauges.display.speed);
    setToggleBtn('#mink-carhud-settings-display-rpm', settings.gauges.display.rpm);
    $('#mink-carhud-settings-color-fuel').val(settings.gauges.color.fuel[0]);
    $('#mink-carhud-settings-color-lspeed').val(settings.gauges.color.speed[0]);
    $('#mink-carhud-settings-color-hspeed').val(settings.gauges.color.speed[settings.gauges.color.speed.length - 1]);
    $('#mink-carhud-settings-color-lrpm').val(settings.gauges.color.rpm[0]);
    $('#mink-carhud-settings-color-hrpm').val(settings.gauges.color.rpm[settings.gauges.color.rpm.length - 1]);
    $('#mink-carhud-settings-refresh').val(settings.refresh);
    $('#mink-carhud-settings-dashboard-engine-alert').val(settings.dashboard.engineAlert);
    $('#mink-carhud-settings-dashboard-fuel-alert').val(settings.dashboard.fuelAlert);
    setToggleBtn('#mink-settings-dashboard-display', settings.dashboard.display);
    setToggleBtn('#mink-settings-dashboard-left', settings.dashboard.individual.left);
    setToggleBtn('#mink-settings-dashboard-engine', settings.dashboard.individual.engine);
    setToggleBtn('#mink-settings-dashboard-seatbelt', settings.dashboard.individual.seatbelt);
    setToggleBtn('#mink-settings-dashboard-fuel', settings.dashboard.individual.fuel);
    setToggleBtn('#mink-settings-dashboard-cc', settings.dashboard.individual.cruisecontrol);
    setToggleBtn('#mink-settings-dashboard-lowbeam', settings.dashboard.individual.lowbeam);
    setToggleBtn('#mink-settings-dashboard-highbeam', settings.dashboard.individual.highbeam);
    setToggleBtn('#mink-settings-dashboard-right', settings.dashboard.individual.right);
    setToggleBtn('#mink-settings-street-compass-display-street', settings.streetCompass.display.street);
    setToggleBtn('#mink-settings-street-compass-display-compass-heading', settings.streetCompass.display.heading);
    setToggleBtn('#mink-settings-street-compass-display-compass-caret', settings.streetCompass.display.caret);
    setToggleBtn('#mink-settings-street-compass-display-compass', settings.streetCompass.display.compass);
    $('#mink-carhud-settings-size-fuel').val(Math.round(settings.size.fuel.scale * 100));
    $('#mink-carhud-settings-size-speed').val(Math.round(settings.size.speed.scale * 100));
    $('#mink-carhud-settings-size-rpm').val(Math.round(settings.size.rpm.scale * 100));
    $('#mink-carhud-settings-size-dashboard').val(Math.round(settings.size.dashboard.scale * 100));
    $('#mink-carhud-settings-size-compass').val(Math.round(settings.size.compass.scale * 100));
    $('#mink-settings-street-compass-street-size').val(settings.size.street);
    updateSizeLabels();
  }

  function setToggleBtn(sel, on) {
    const $b = $(sel);
    $b.attr('data-status', on ? 'true' : 'false');
    $b.toggleClass('btn-success', !!on).toggleClass('btn-dark', !on);
  }

  function readToggle($el) {
    return $el.attr('data-status') === 'true';
  }

  function updateSizeLabels() {
    $('#mink-carhud-percentage-fuel').text($('#mink-carhud-settings-size-fuel').val() + '%');
    $('#mink-carhud-percentage-speed').text($('#mink-carhud-settings-size-speed').val() + '%');
    $('#mink-carhud-percentage-rpm').text($('#mink-carhud-settings-size-rpm').val() + '%');
    $('#mink-carhud-percentage-dashboard').text($('#mink-carhud-settings-size-dashboard').val() + '%');
    $('#mink-carhud-percentage-compass').text($('#mink-carhud-settings-size-compass').val() + '%');
  }

  function collectSettingsFromForm() {
    settings.gauges.units = $('#mink-carhud-settings-units').val();
    settings.gauges.display.fuel = readToggle($('#mink-carhud-settings-display-fuel'));
    settings.gauges.display.speed = readToggle($('#mink-carhud-settings-display-speed'));
    settings.gauges.display.rpm = readToggle($('#mink-carhud-settings-display-rpm'));
    settings.gauges.color.fuel = [$('#mink-carhud-settings-color-fuel').val(), $('#mink-carhud-settings-color-fuel').val()];
    const ls = $('#mink-carhud-settings-color-lspeed').val();
    const hs = $('#mink-carhud-settings-color-hspeed').val();
    settings.gauges.color.speed = buildGradient(ls, hs, 10);
    const lr = $('#mink-carhud-settings-color-lrpm').val();
    const hr = $('#mink-carhud-settings-color-hrpm').val();
    settings.gauges.color.rpm = buildGradient(lr, hr, 5);
    settings.refresh = parseInt($('#mink-carhud-settings-refresh').val(), 10) || 100;
    settings.dashboard.engineAlert = parseInt($('#mink-carhud-settings-dashboard-engine-alert').val(), 10) || 10;
    settings.dashboard.fuelAlert = parseInt($('#mink-carhud-settings-dashboard-fuel-alert').val(), 10) || 20;
    settings.dashboard.display = readToggle($('#mink-settings-dashboard-display'));
    settings.dashboard.individual.left = readToggle($('#mink-settings-dashboard-left'));
    settings.dashboard.individual.engine = readToggle($('#mink-settings-dashboard-engine'));
    settings.dashboard.individual.seatbelt = readToggle($('#mink-settings-dashboard-seatbelt'));
    settings.dashboard.individual.fuel = readToggle($('#mink-settings-dashboard-fuel'));
    settings.dashboard.individual.cruisecontrol = readToggle($('#mink-settings-dashboard-cc'));
    settings.dashboard.individual.lowbeam = readToggle($('#mink-settings-dashboard-lowbeam'));
    settings.dashboard.individual.highbeam = readToggle($('#mink-settings-dashboard-highbeam'));
    settings.dashboard.individual.right = readToggle($('#mink-settings-dashboard-right'));
    settings.streetCompass.display.street = readToggle($('#mink-settings-street-compass-display-street'));
    settings.streetCompass.display.heading = readToggle($('#mink-settings-street-compass-display-compass-heading'));
    settings.streetCompass.display.caret = readToggle($('#mink-settings-street-compass-display-compass-caret'));
    settings.streetCompass.display.compass = readToggle($('#mink-settings-street-compass-display-compass'));
    settings.size.fuel.scale = ($('#mink-carhud-settings-size-fuel').val() || 100) / 100;
    settings.size.speed.scale = ($('#mink-carhud-settings-size-speed').val() || 100) / 100;
    settings.size.rpm.scale = ($('#mink-carhud-settings-size-rpm').val() || 100) / 100;
    settings.size.dashboard.scale = ($('#mink-carhud-settings-size-dashboard').val() || 100) / 100;
    settings.size.compass.scale = ($('#mink-carhud-settings-size-compass').val() || 100) / 100;
    settings.size.street = $('#mink-settings-street-compass-street-size').val();
  }

  function buildGradient(from, to, steps) {
    const out = [];
    for (let i = 0; i < steps; i++) {
      out.push(rgbToHex(lerpColor(from, to, i / (steps - 1))));
    }
    return out;
  }

  function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const m = rgb.match(/(\d+)/g);
    if (!m) return '#ffffff';
    return (
      '#' +
      m
        .slice(0, 3)
        .map((n) => ('0' + parseInt(n, 10).toString(16)).slice(-2))
        .join('')
    );
  }

  function saveSettings(persist) {
    collectSettingsFromForm();
    applyDisplayFlags();
    updateFontSizes();
    initGauges();
    if (persist) {
      try {
        localStorage.setItem('mink_carhud_settings_v2', JSON.stringify(settings));
      } catch (e) {}
      nui('saveSettings', { refresh: settings.refresh });
    } else {
      nui('applySettings', { refresh: settings.refresh });
    }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem('mink_carhud_settings_v2');
      if (raw) {
        const saved = JSON.parse(raw);
        settings = $.extend(true, {}, default_settings, saved);
      }
    } catch (e) {}
    // Force new clean layout sizes (ignore old overlapping layout saves)
    settings.size.fuel = JSON.parse(JSON.stringify(default_settings.size.fuel));
    settings.size.speed = JSON.parse(JSON.stringify(default_settings.size.speed));
    settings.size.rpm = JSON.parse(JSON.stringify(default_settings.size.rpm));
    settings.position.fuel = { top: '0px', left: '0px' };
    settings.position.speed = { top: '0px', left: '0px' };
    settings.position.rpm = { top: '0px', left: '0px' };
  }

  function resetDefaults() {
    settings = JSON.parse(JSON.stringify(default_settings));
    syncSettingsForm();
    saveSettings(false);
  }

  $(document).ready(function () {
    applyLocales();
    loadSettings();
    initGauges();

    // Draggable settings + HUD pieces
    $('#mink-carhud-drag-settings').draggable({
      handle: '#mink-carhud-drag-settings-handle',
      containment: 'window',
    });
    $('#fuel-wrapper, #speed-wrapper, #rpm-wrapper, #dragCluster, #dragStreet, #compass-drag').draggable({
      stop: function (e, ui) {
        const id = this.id;
        const keyMap = {
          'fuel-wrapper': 'fuel',
          'speed-wrapper': 'speed',
          'rpm-wrapper': 'rpm',
          dragCluster: 'dashboard',
          dragStreet: 'street',
          'compass-drag': 'compass',
        };
        const key = keyMap[id];
        if (key) {
          settings.position[key] = {
            top: ui.position.top + 'px',
            left: ui.position.left + 'px',
          };
        }
      },
    });

    $(document).on('click', '.mink-carhud-settings-display-button', function () {
      const on = $(this).attr('data-status') !== 'true';
      setToggleBtn(this, on);
    });

    $(document).on('click', '[data-dismiss="card"]', function () {
      closeSettings();
      nui('close');
    });

    $('#mink-settings-apply').on('click', function () {
      saveSettings(false);
    });

    $('#mink-settings-save').on('click', function () {
      saveSettings(true);
      closeSettings();
    });

    $('#mink-settings-default').on('click', function () {
      resetDefaults();
    });

    $('input[type=range]').on('input', updateSizeLabels);

    // Seatbelt audio helpers exposed via message
  });

  window.addEventListener('message', function (event) {
    const data = event.data || {};
    switch (data.action) {
      case 'show':
        showHud();
        break;
      case 'hide':
        hideHud();
        break;
      case 'update':
        if (!visible && !settingsOpen) showHud();
        updateSpeed(data);
        updateRPM(data);
        updateFuel(data);
        updateDashboard(data);
        updateStreet(data);
        updateCompass(data);
        break;
      case 'openSettings':
        openSettings();
        break;
      case 'closeSettings':
        closeSettings();
        break;
      case 'playSound':
        if (data.sound === 'seatbelt') {
          const a = document.getElementById('sounds-seatbelt');
          if (a) {
            a.currentTime = 0;
            a.play();
          }
        } else if (data.sound === 'seatbeltoff') {
          const a = document.getElementById('sounds-seatbelt-off');
          if (a) {
            a.currentTime = 0;
            a.play();
          }
        }
        break;
    }
  });
})();
