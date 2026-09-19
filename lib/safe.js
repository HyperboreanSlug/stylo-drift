StyloDrift.applySafe = function (text, persona, rate, rng) {
  var out = text;
  var keys = Object.keys(StyloDrift.SAFE_PHRASES).sort(function (a, b) {
    return b.length - a.length;
  });
  var i;
  for (i = 0; i < keys.length; i++) {
    var from = keys[i];
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
