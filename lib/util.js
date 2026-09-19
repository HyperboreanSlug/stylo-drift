StyloDrift.escapeRe = function (s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

StyloDrift.matchCase = function (sample, replacement) {
  if (!sample) return replacement;
  if (sample === sample.toUpperCase()) return replacement.toUpperCase();
  if (sample === sample.toLowerCase()) return replacement.toLowerCase();
  if (sample[0] === sample[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
};

StyloDrift.replacePhrase = function (text, from, to) {
  var re = new RegExp(StyloDrift.escapeRe(from), 'gi');
  return text.replace(re, function (m) {
    return StyloDrift.matchCase(m, to);
  });
};

StyloDrift.replaceWord = function (text, from, to) {
  var re = new RegExp('\\b' + StyloDrift.escapeRe(from) + '\\b', 'gi');
  return text.replace(re, function (m) {
    return StyloDrift.matchCase(m, to);
  });
};

StyloDrift.replaceWordProb = function (text, from, to, rate, rng) {
  var re = new RegExp('\\b' + StyloDrift.escapeRe(from) + '\\b', 'gi');
  return text.replace(re, function (m) {
    if (rng() > rate) return m;
    var pick = Array.isArray(to) ? to[Math.floor(rng() * to.length)] : to;
    return StyloDrift.matchCase(m, pick);
  });
};

StyloDrift.wordCount = function (s) {
  var m = String(s).trim().match(/[A-Za-z0-9']+/g);
  return m ? m.length : 0;
};

StyloDrift.lowerStart = function (s) {
  if (!s) return s;
  if (/^I\b/.test(s)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
};
