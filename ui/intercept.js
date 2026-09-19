StyloDrift._posting = false;

StyloDrift._isPostButton = function (el) {
  if (!el || !el.closest) return null;
  return el.closest('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');
};

StyloDrift.rewriteAllOpen = function () {
  var list = StyloDrift.findComposers(document);
  var i;
  var last = null;
  for (i = 0; i < list.length; i++) {
    var el = list[i];
    var text = StyloDrift.readComposer(el);
    if (!text.trim()) continue;
    var st = StyloDrift.getState(el);
    if (st && st.drifted === text) continue;
    last = StyloDrift.driftComposer(el);
  }
  return last;
};

StyloDrift._guardPost = function (e) {
  if (StyloDrift._posting) return false;
  if (!StyloDrift.settings.enabled || !StyloDrift.settings.auto) return false;
  var btn = StyloDrift._isPostButton(e.target);
  if (!btn) return false;
  if (btn.getAttribute('aria-disabled') === 'true') return false;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  StyloDrift.rewriteAllOpen();
  StyloDrift._posting = true;
  setTimeout(function () {
    btn.click();
    setTimeout(function () {
      StyloDrift._posting = false;
    }, 500);
  }, 80);
  return true;
};

StyloDrift.armIntercept = function () {
  document.addEventListener('click', StyloDrift._guardPost, true);
  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    StyloDrift._guardPost(e);
  }, true);

  document.addEventListener('keydown', function (e) {
    if (StyloDrift._posting) return;
    if (!StyloDrift.settings.enabled) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (!StyloDrift.settings.auto) return;
      var active = document.activeElement;
      if (!active || !active.closest('[data-testid^="tweetTextarea_"]')) return;
      e.preventDefault();
      e.stopPropagation();
      StyloDrift.rewriteAllOpen();
      StyloDrift._posting = true;
      var btn = document.querySelector('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
      setTimeout(function () {
        if (btn) btn.click();
        setTimeout(function () { StyloDrift._posting = false; }, 400);
      }, 40);
    }
    if (e.altKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      var el = document.activeElement;
      var box = el && el.closest && el.closest('[data-testid^="tweetTextarea_"]');
      if (box) {
        e.preventDefault();
        StyloDrift.driftComposer(StyloDrift.composerEl(box));
      }
    }
  }, true);
};
