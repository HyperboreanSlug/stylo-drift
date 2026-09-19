StyloDrift.injectHud = function () {
  if (document.getElementById('sd-hud')) return;
  var hud = document.createElement('div');
  hud.id = 'sd-hud';
  hud.innerHTML =
    '<strong>Stylo Drift</strong>' +
    '<button type="button" class="sd-btn" id="sd-hud-drift">Drift</button>' +
    '<button type="button" class="sd-btn" id="sd-hud-undo">Undo</button>' +
    '<button type="button" class="sd-btn" id="sd-hud-cfg">Settings</button>' +
    '<span class="sd-score" id="sd-hud-score">on</span>';
  document.documentElement.appendChild(hud);
  function swallow(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
  hud.addEventListener('mousedown', swallow, true);
  hud.addEventListener('pointerdown', swallow, true);
  function stop(e) {
    e.preventDefault();
    swallow(e);
  }
  document.getElementById('sd-hud-drift').addEventListener('click', function (e) {
    stop(e);
    var el = StyloDrift.activeComposer();
    if (!el) {
      document.getElementById('sd-hud-score').textContent = 'no composer';
      return;
    }
    var res = StyloDrift.driftComposer(el);
    document.getElementById('sd-hud-score').textContent = res
      ? StyloDrift._formatScore(res)
      : 'empty box';
  });
  document.getElementById('sd-hud-undo').addEventListener('click', function (e) {
    stop(e);
    var el = StyloDrift.activeComposer();
    if (el) StyloDrift.undoComposer(el);
    document.getElementById('sd-hud-score').textContent = 'undone';
  });
  document.getElementById('sd-hud-cfg').addEventListener('click', function (e) {
    stop(e);
    StyloDrift.togglePanel();
  });
};

StyloDrift.updateHud = function (msg) {
  var el = document.getElementById('sd-hud-score');
  if (!el) return;
  if (msg) el.textContent = msg;
  else el.textContent = StyloDrift.settings.enabled ? 'on' : 'off';
};
