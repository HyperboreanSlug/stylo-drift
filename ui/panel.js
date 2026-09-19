StyloDrift.injectCss = function () {
  if (document.getElementById('sd-style')) return;
  var css = document.createElement('style');
  css.id = 'sd-style';
  css.textContent = [
    '.sd-btn{background:transparent;border:1px solid #1d9bf0;color:#1d9bf0;border-radius:9999px;padding:2px 10px;font-size:13px;font-weight:700;cursor:pointer;margin-right:8px;line-height:24px;font-family:inherit}',
    '.sd-btn:hover{background:rgba(29,155,240,0.1)}',
    '.sd-score{font-size:11px;color:#8b98a5;margin-right:8px;white-space:nowrap}',
    '.sd-wrap{display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin:4px 8px}',
    '#sd-hud{position:fixed;right:16px;bottom:72px;z-index:2147483646;display:flex;flex-wrap:wrap;align-items:center;gap:6px;max-width:min(420px,calc(100vw - 24px));background:#15202b;color:#e7e9ea;border:1px solid #1d9bf0;border-radius:12px;padding:8px 10px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,0.45)}',
    '#sd-hud strong{margin-right:4px}',
    '.sd-panel{position:fixed;right:16px;bottom:16px;z-index:2147483647;width:280px;background:#15202b;color:#e7e9ea;border:1px solid #38444d;border-radius:12px;padding:14px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,0.4)}',
    '.sd-panel h2{margin:0 0 10px;font-size:16px}',
    '.sd-panel label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0;flex-wrap:wrap}',
    '.sd-panel select,.sd-panel input[type=range]{flex:1;min-width:120px}',
    '.sd-panel .sd-row{color:#8b98a5;font-size:12px;margin-top:8px}',
    '.sd-panel button{margin-top:8px;background:#1d9bf0;border:0;color:#fff;border-radius:9999px;padding:6px 12px;font-weight:700;cursor:pointer}'
  ].join('');
  document.documentElement.appendChild(css);
};

StyloDrift.togglePanel = function () {
  var existing = document.getElementById('sd-panel');
  if (existing) {
    existing.remove();
    return;
  }
  var s = StyloDrift.settings;
  var panel = document.createElement('div');
  panel.id = 'sd-panel';
  panel.className = 'sd-panel';
  panel.innerHTML =
    '<h2>Stylo Drift</h2>' +
    '<label>Enabled <input id="sd-en" type="checkbox"' + (s.enabled ? ' checked' : '') + '></label>' +
    '<label>Rewrite on Post <input id="sd-auto" type="checkbox"' + (s.auto ? ' checked' : '') + '></label>' +
    '<label>Intensity <input id="sd-int" type="range" min="1" max="5" step="1" value="' + s.intensity + '"></label>' +
    '<div class="sd-row" id="sd-intv">Level ' + s.intensity + '</div>' +
    '<label>Persona <select id="sd-per"></select></label>' +
    '<label>Show score <input id="sd-sc" type="checkbox"' + (s.showScore ? ' checked' : '') + '></label>' +
    '<div class="sd-row">Compute: this tab, no server.</div>' +
    '<button type="button" id="sd-close">Close</button>';
  document.body.appendChild(panel);
  var sel = panel.querySelector('#sd-per');
  var ids = ['rotate'].concat(StyloDrift.PERSONA_IDS);
  var i;
  for (i = 0; i < ids.length; i++) {
    var opt = document.createElement('option');
    opt.value = ids[i];
    opt.textContent = ids[i];
    if (ids[i] === s.persona) opt.selected = true;
    sel.appendChild(opt);
  }
  function sync() {
    StyloDrift.settings.enabled = panel.querySelector('#sd-en').checked;
    StyloDrift.settings.auto = panel.querySelector('#sd-auto').checked;
    StyloDrift.settings.intensity = parseInt(panel.querySelector('#sd-int').value, 10);
    StyloDrift.settings.persona = panel.querySelector('#sd-per').value;
    StyloDrift.settings.showScore = panel.querySelector('#sd-sc').checked;
    panel.querySelector('#sd-intv').textContent = 'Level ' + StyloDrift.settings.intensity;
    StyloDrift.saveSettings();
  }
  panel.addEventListener('change', sync);
  panel.addEventListener('input', sync);
  panel.querySelector('#sd-close').addEventListener('click', function () {
    panel.remove();
  });
};
