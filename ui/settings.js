StyloDrift.DEFAULTS = {
  enabled: true,
  auto: true,
  intensity: 5,
  persona: 'rotate',
  showScore: true
};

StyloDrift._storeGet = function (key, fallback) {
  try {
    if (typeof GM !== 'undefined' && GM.getValue) {
      return Promise.resolve(GM.getValue(key, fallback));
    }
  } catch (e1) {}
  try {
    if (typeof GM_getValue === 'function') {
      return Promise.resolve(GM_getValue(key, fallback));
    }
  } catch (e2) {}
  try {
    var v = localStorage.getItem(key);
    return Promise.resolve(v ? JSON.parse(v) : fallback);
  } catch (e3) {
    return Promise.resolve(fallback);
  }
};

StyloDrift._storeSet = function (key, value) {
  try {
    if (typeof GM !== 'undefined' && GM.setValue) {
      return Promise.resolve(GM.setValue(key, value));
    }
  } catch (e1) {}
  try {
    if (typeof GM_setValue === 'function') {
      GM_setValue(key, value);
      return Promise.resolve();
    }
  } catch (e2) {}
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e3) {}
  return Promise.resolve();
};

StyloDrift.settings = Object.assign({}, StyloDrift.DEFAULTS);

StyloDrift.loadSettings = function () {
  return StyloDrift._storeGet('sd-settings', StyloDrift.DEFAULTS).then(function (raw) {
    var s = raw && typeof raw === 'object' ? raw : {};
    StyloDrift.settings = Object.assign({}, StyloDrift.DEFAULTS, s);
    return StyloDrift.settings;
  });
};

StyloDrift.saveSettings = function () {
  return StyloDrift._storeSet('sd-settings', StyloDrift.settings);
};
