StyloDrift.applyClosedClass = function (text, persona, rate, rng) {
  var out = text;
  var verbs =
    'think|thinks|thought|say|says|said|know|knows|knew|believe|believes|believed|' +
    'claim|claims|claimed|show|shows|shown|hope|hopes|hoped|feel|feels|felt|' +
    'argue|argues|argued|admit|admits|admitted|see|sees|saw|find|finds|found';
  out = out.replace(new RegExp('\\b(' + verbs + ')\\s+that\\b', 'gi'), function (m, v) {
    if (rng() < rate) return v;
    return m;
  });
  out = out.replace(/\bthe (\w{3,14}) of (\w{3,14})\b/gi, function (m, x, y) {
    if (/^(the|and|for|not|but|with|from|this|that|they|them|have|been|were|this|those|these)$/i.test(y)) return m;
    if (rng() > rate) return m;
    return y + "'s " + x;
  });
  out = out.replace(/,?\s+and\s+/gi, function (m) {
    if (rng() > rate * 0.42) return m;
    return StyloDrift.pick(rng, [' as well as ', ' plus ', ' along with ', '; ', ' and ']);
  });
  out = out.replace(/\bin the\b/gi, function (m) {
    if (rng() > rate * 0.5) return m;
    return StyloDrift.matchCase(m, StyloDrift.pick(rng, ['within the', 'inside the', 'in the']));
  });
  out = out.replace(/\bon the\b/gi, function (m) {
    if (rng() > rate * 0.45) return m;
    return StyloDrift.matchCase(m, StyloDrift.pick(rng, ['upon the', 'on the']));
  });
  out = out.replace(/\bout of\b/gi, function (m) {
    if (rng() > rate) return m;
    return StyloDrift.matchCase(m, 'from');
  });
  out = out.replace(/\bwith the\b/gi, function (m) {
    if (rng() > rate * 0.4) return m;
    return StyloDrift.matchCase(m, StyloDrift.pick(rng, ['using the', 'via the', 'with the']));
  });
  out = out.replace(/\bby the\b/gi, function (m) {
    if (rng() > rate * 0.4) return m;
    return StyloDrift.matchCase(m, StyloDrift.pick(rng, ['via the', 'through the', 'by the']));
  });
  out = out.replace(/\bfrom the\b/gi, function (m) {
    if (rng() > rate * 0.35) return m;
    return StyloDrift.matchCase(m, StyloDrift.pick(rng, ['out of the', 'from the']));
  });
  out = out.replace(/\bthe\b/gi, function (m) {
    if (rng() > rate * 0.38) return m;
    return StyloDrift.matchCase(m, StyloDrift.pick(rng, ['this', 'that', 'the']));
  });
  out = out.replace(/\ba\b/gi, function (m) {
    if (rng() > rate * 0.18) return m;
    return StyloDrift.matchCase(m, 'one');
  });
  out = out.replace(
    /\b(is|are|was|were)\s+(not\s+)?(important|clear|true|wrong|right|hard|easy|good|bad|likely|possible|necessary|common|serious)\b/gi,
    function (m, cop, notp, adj) {
      if (rng() > rate) return m;
      var alts = {
        is: ['remains', 'stays', 'looks'],
        are: ['remain', 'stay', 'look'],
        was: ['remained', 'stayed', 'looked'],
        were: ['remained', 'stayed', 'looked']
      };
      var pick = StyloDrift.pick(rng, alts[cop.toLowerCase()] || [cop]);
      return pick + ' ' + (notp || '') + adj;
    }
  );
  out = out.replace(/\bto ([A-Za-z']+)\b/g, function (m, v) {
    if (/^(the|a|an|this|that|these|those|my|your|his|her|its|our|their|me|him|us|them|be|being|been|do|have|not|and|or|but|if|as|so)$/i.test(v)) return m;
    if (rng() > rate * 0.22) return m;
    return StyloDrift.pick(rng, ['to ' + v, 'so as to ' + v, 'in order to ' + v]);
  });
  out = out.replace(/\bwhich\b/gi, function (m) {
    if (rng() > rate) return m;
    return StyloDrift.matchCase(m, 'that');
  });
  out = out.replace(/\bthat\b/gi, function (m) {
    if (rng() > rate * 0.28) return m;
    return StyloDrift.matchCase(m, 'which');
  });
  return out;
};
