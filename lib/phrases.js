StyloDrift.applyPhrases = function (text, persona, rate, rng) {
  var keys = Object.keys(StyloDrift.PHRASES).sort(function (a, b) {
    return b.length - a.length;
  });
  var out = text;
  for (var i = 0; i < keys.length; i++) {
    var from = keys[i];
    var alts = StyloDrift.PHRASES[from].slice();
    var prefer = persona.prefer && persona.prefer[from];
    if (prefer) alts.unshift(prefer);
    var re = new RegExp(StyloDrift.escapeRe(from), 'gi');
    out = out.replace(re, function (m) {
      if (rng() > rate) return m;
      var pick = StyloDrift.pick(rng, alts);
      if (!pick || pick.toLowerCase() === m.toLowerCase()) return m;
      return StyloDrift.matchCase(m, pick);
    });
  }
  return out;
};
