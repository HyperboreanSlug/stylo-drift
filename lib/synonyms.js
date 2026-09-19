StyloDrift.applySynonyms = function (text, persona, rate, rng) {
  var preferShort = persona.sent === 'short';
  var preferLong = persona.sent === 'long';
  return text.replace(/\b[A-Za-z']+\b/g, function (m) {
    if (m.length <= 5 && m === m.toUpperCase() && /[A-Z]/.test(m)) return m;
    var alts = StyloDrift.SYNONYMS[m.toLowerCase()];
    if (!alts) return m;
    if (rng() > rate) return m;
    var pick;
    if (preferShort && rng() < 0.7) {
      pick = alts.slice().sort(function (a, b) { return a.length - b.length; })[0];
    } else if (preferLong && rng() < 0.7) {
      pick = alts.slice().sort(function (a, b) { return b.length - a.length; })[0];
    } else {
      pick = StyloDrift.pick(rng, alts);
    }
    if (!pick) return m;
    return StyloDrift.matchCase(m, pick);
  });
};
