StyloDrift.HEDGES = [
  'I think',
  'I guess',
  'I mean',
  'it seems',
  'it appears',
  'arguably',
  'frankly',
  'honestly',
  'basically',
  'pretty much',
  'sort of',
  'kind of',
  'clearly',
  'obviously',
  'to be fair',
  'in a sense',
  'more or less'
];

StyloDrift.applyHedges = function (text, persona, rate, rng) {
  var out = text;
  var want = persona.hedge;
  var i;
  if (want < 0.2) {
    for (i = 0; i < StyloDrift.HEDGES.length; i++) {
      if (rng() > rate) continue;
      var re = new RegExp('\\b' + StyloDrift.escapeRe(StyloDrift.HEDGES[i]) + '\\b[, ]*', 'gi');
      out = out.replace(re, '');
    }
    out = out.replace(/\s{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1');
    return out;
  }
  if (rng() < rate * want) {
    var sents = StyloDrift.splitSentences(out);
    if (sents.length) {
      var idx = Math.floor(rng() * sents.length);
      var h = StyloDrift.pick(rng, StyloDrift.HEDGES);
      var s = sents[idx];
      if (!new RegExp('\\b' + StyloDrift.escapeRe(h) + '\\b', 'i').test(s)) {
        sents[idx] = h.charAt(0).toUpperCase() + h.slice(1) + ', ' + StyloDrift.lowerStart(s);
        out = StyloDrift.joinSentences(sents);
      }
    }
  }
  return out;
};
