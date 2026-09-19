StyloDrift._formatScore = function (res) {
  if (!res || !res.scores) return '';
  return res.persona + ' · n-gram ' + res.scores.pinc3 + '% · func ' + res.scores.func + '%';
};

StyloDrift.driftComposer = function (el, forceSeed) {
  var original = StyloDrift.readComposer(el);
  if (!original.trim()) return null;
  var prev = StyloDrift.getState(el);
  var src = original;
  if (prev && prev.drifted === original && prev.original) src = prev.original;
  var res = StyloDrift.drift(src, {
    intensity: StyloDrift.settings.intensity,
    persona: StyloDrift.settings.persona,
    seed: forceSeed
  });
  StyloDrift.writeComposer(el, res.text);
  StyloDrift.setState(el, { original: src, drifted: res.text, scores: res.scores, persona: res.persona });
  return res;
};

StyloDrift.undoComposer = function (el) {
  var prev = StyloDrift.getState(el);
  if (!prev || !prev.original) return;
  StyloDrift.writeComposer(el, prev.original);
  StyloDrift.setState(el, { original: prev.original, drifted: null, scores: null, persona: null });
};

StyloDrift.injectToolbar = function (composer) {
  var root = StyloDrift.composerRoot(composer);
  if (!root) return;
  var bar = root.querySelector('[data-testid="toolBar"]');
  if (!bar) return;
  if (bar.querySelector('.sd-wrap')) return;
  var wrap = document.createElement('div');
  wrap.className = 'sd-wrap';
  var driftBtn = document.createElement('button');
  driftBtn.type = 'button';
  driftBtn.className = 'sd-btn';
  driftBtn.textContent = 'Drift';
  var undoBtn = document.createElement('button');
  undoBtn.type = 'button';
  undoBtn.className = 'sd-btn';
  undoBtn.textContent = 'Undo';
  var score = document.createElement('span');
  score.className = 'sd-score';
  wrap.appendChild(driftBtn);
  wrap.appendChild(undoBtn);
  wrap.appendChild(score);
  bar.insertBefore(wrap, bar.firstChild);
  driftBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!StyloDrift.settings.enabled) return;
    var res = StyloDrift.driftComposer(composer);
    if (res && StyloDrift.settings.showScore) score.textContent = StyloDrift._formatScore(res);
  });
  undoBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    StyloDrift.undoComposer(composer);
    score.textContent = '';
  });
};

StyloDrift.scan = function () {
  StyloDrift.injectCss();
  var list = StyloDrift.findComposers(document);
  var i;
  for (i = 0; i < list.length; i++) StyloDrift.injectToolbar(list[i]);
};
