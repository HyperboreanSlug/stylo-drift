StyloDrift.applyFunctionWords = function (text, persona, rate, rng) {
  return text.replace(/\b[A-Za-z']+\b/g, function (m) {
    var key = m.toLowerCase();
    if (key.length < 2) return m;
    var alts = StyloDrift.FUNCTION_ALTS[key];
    if (!alts) return m;
    if (rng() > rate) return m;
    var prefer = persona.prefer && persona.prefer[key];
    var pick = prefer && rng() < 0.7 ? prefer : StyloDrift.pick(rng, alts);
    if (!pick) return m;
    return StyloDrift.matchCase(m, pick);
  });
};
