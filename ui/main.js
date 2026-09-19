StyloDrift.start = function () {
  StyloDrift.loadSettings().then(function () {
    StyloDrift.injectCss();
    StyloDrift.armIntercept();
    StyloDrift.scan();
    var obs = new MutationObserver(function () {
      StyloDrift.scan();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    try {
      var menu = typeof GM !== 'undefined' && GM.registerMenuCommand
        ? GM.registerMenuCommand
        : (typeof GM_registerMenuCommand === 'function' ? GM_registerMenuCommand : null);
      if (menu) {
        menu('Stylo Drift: settings', StyloDrift.togglePanel);
        menu('Stylo Drift: toggle auto', function () {
          StyloDrift.settings.auto = !StyloDrift.settings.auto;
          StyloDrift.saveSettings();
        });
      }
    } catch (e) {}
  });
};

if (typeof document !== 'undefined' && document.documentElement) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', StyloDrift.start);
  } else {
    StyloDrift.start();
  }
}
