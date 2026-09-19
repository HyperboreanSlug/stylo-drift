StyloDrift.start = function () {
  if (StyloDrift._started) return;
  StyloDrift._started = true;
  StyloDrift.injectCss();
  StyloDrift.injectHud();
  StyloDrift.armIntercept();
  document.addEventListener('focusin', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var box = t.closest('[data-testid^="tweetTextarea_"], [role="textbox"][contenteditable="true"]');
    if (box) StyloDrift.trackComposer(box);
  }, true);
  StyloDrift.scan();
  var t = 0;
  var obs = new MutationObserver(function () {
    if (t) return;
    t = 1;
    setTimeout(function () {
      t = 0;
      StyloDrift.scan();
    }, 80);
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  StyloDrift.loadSettings().then(function () {
    StyloDrift.updateHud();
    StyloDrift.scan();
  });
  try {
    var menu = typeof GM !== 'undefined' && GM.registerMenuCommand
      ? GM.registerMenuCommand
      : (typeof GM_registerMenuCommand === 'function' ? GM_registerMenuCommand : null);
    if (menu) {
      menu('Stylo Drift: settings', StyloDrift.togglePanel);
      menu('Stylo Drift: toggle auto', function () {
        StyloDrift.settings.auto = !StyloDrift.settings.auto;
        StyloDrift.saveSettings();
        StyloDrift.updateHud(StyloDrift.settings.auto ? 'auto on' : 'auto off');
      });
    }
  } catch (e) {}
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', StyloDrift.start);
  } else {
    StyloDrift.start();
  }
}
