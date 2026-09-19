StyloDrift.applySafe = function (text, persona, rate, rng) {
  var original = String(text);
  var out = original;
  var keys = Object.keys(StyloDrift.SAFE_PHRASES).sort(function (a, b) {
    return b.length - a.length;
  });
  var i;
  for (i = 0; i < keys.length; i++) {
    var from = keys[i];
    if (original.toLowerCase().indexOf(from) === -1) continue;
    var alts = StyloDrift.SAFE_PHRASES[from];
    var re = new RegExp(StyloDrift.escapeRe(from), 'gi');
    out = out.replace(re, function (m) {
      if (rng() > rate) return m;
      var prefer = persona.prefer && persona.prefer[from];
      var pick = prefer && alts.indexOf(prefer) !== -1 && rng() < 0.7
        ? prefer
        : StyloDrift.pick(rng, alts);
      if (!pick || pick.toLowerCase() === m.toLowerCase()) return m;
      return StyloDrift.matchCase(m, pick);
    });
  }
  out = out.replace(/\b[A-Za-z']+\b/g, function (m) {
    var key = m.toLowerCase();
    var alts = StyloDrift.SAFE_WORDS[key];
    if (!alts) return m;
    if (rng() > rate) return m;
    var prefer = persona.prefer && persona.prefer[key];
    var pick = prefer && alts.indexOf(prefer) !== -1 && rng() < 0.7
      ? prefer
      : StyloDrift.pick(rng, alts);
    if (!pick) return m;
    return StyloDrift.matchCase(m, pick);
  });
  return out;
};

StyloDrift.forceStyle = function (text, persona, rng) {
  var src = String(text);
  var out = StyloDrift.applyContractions(src, persona, 1, rng);
  if (out !== src) return out;
  out = StyloDrift.applySafe(src, persona, 1, rng);
  if (out !== src) return out;
  var sents = StyloDrift.splitSentences(src);
  if (sents.length >= 2) {
    return sents[0].replace(/[.!?]+$/, '') + ' — ' + StyloDrift.lowerStart(sents[1]);
  }
  if (/^I\b/.test(src) && !/^Honestly,/i.test(src) && !/^I honestly\b/i.test(src)) {
    return 'Honestly, ' + StyloDrift.lowerStart(src);
  }
  if (!/^Look,/i.test(src)) return 'Look, ' + StyloDrift.lowerStart(src);
  return src;
};
