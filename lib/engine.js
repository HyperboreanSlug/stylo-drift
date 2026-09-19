StyloDrift.LIMIT_SHORT = 280;
StyloDrift.LIMIT_LONG = 25000;

StyloDrift.maxLenFor = function (raw, opts) {
  if (opts && opts.maxLen) return opts.maxLen;
  return raw.length > StyloDrift.LIMIT_SHORT ? StyloDrift.LIMIT_LONG : StyloDrift.LIMIT_SHORT;
};

StyloDrift.fitLength = function (text, maxLen, persona, rng) {
  var out = text;
  if (out.length <= maxLen) return out;
  out = StyloDrift.applyContractions(out, { contraction: 1 }, 1, rng);
  if (out.length <= maxLen) return out;
  var i;
  for (i = 0; i < StyloDrift.HEDGES.length; i++) {
    out = out.replace(new RegExp('\\b' + StyloDrift.escapeRe(StyloDrift.HEDGES[i]) + '\\b[, ]*', 'gi'), '');
  }
  out = out.replace(/\s{2,}/g, ' ').trim();
  if (out.length <= maxLen) return out;
  if (maxLen >= StyloDrift.LIMIT_LONG) return out.slice(0, maxLen);
  return out.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…';
};

StyloDrift.driftChunk = function (chunk, persona, rates, rng) {
  var masked = StyloDrift.protect(chunk);
  var body = masked.text;
  var pass;
  for (pass = 0; pass < rates.passes; pass++) {
    body = StyloDrift.applyPhrases(body, persona, rates.phrase, rng);
    body = StyloDrift.applyClosedClass(body, persona, rates.closed, rng);
    body = StyloDrift.applySyntax(body, persona, rates.syntax, rng);
    body = StyloDrift.applyFunctionWords(body, persona, rates.func, rng);
    body = StyloDrift.applySynonyms(body, persona, rates.syn, rng);
    body = StyloDrift.applyOrthography(body, persona, rates.ortho, rng);
    body = StyloDrift.applySpelling(body, persona, rates.spell, rng);
    body = StyloDrift.applyContractions(body, persona, rates.contr, rng);
    body = StyloDrift.applyPunctuation(body, persona, rates.punct, rng);
    body = StyloDrift.applyHedges(body, persona, rates.hedge, rng);
  }
  body = StyloDrift.unprotect(body, masked.slots);
  body = body.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/ {2,}/g, ' ');
  body = body.replace(/,\s*;/g, ';').replace(/;\s*,/g, ';').replace(/,\s*,/g, ',');
  return body.trim();
};

StyloDrift.driftOnce = function (raw, persona, rates, rng, maxLen) {
  var parts = String(raw).split(/(\n+)/);
  var out = [];
  var i;
  for (i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    if (/^\n+$/.test(parts[i])) out.push(parts[i]);
    else out.push(StyloDrift.driftChunk(parts[i], persona, rates, rng));
  }
  return StyloDrift.fitLength(out.join(''), maxLen, persona, rng);
};

StyloDrift.drift = function (text, opts) {
  opts = opts || {};
  var raw = String(text || '');
  if (!raw.trim()) {
    return { text: raw, persona: null, scores: { pinc3: 0, pinc1w: 0, func: 0 } };
  }
  var intensity = opts.intensity || 5;
  if (intensity < 1) intensity = 1;
  if (intensity > 5) intensity = 5;
  var seed = opts.seed == null ? Date.now() : opts.seed;
  var persona = StyloDrift.pickPersona(opts.persona, StyloDrift.makeRng(seed));
  var rates = StyloDrift.RATES[intensity];
  var maxLen = StyloDrift.maxLenFor(raw, opts);
  var a = StyloDrift.driftOnce(raw, persona, rates, StyloDrift.makeRng(seed), maxLen);
  var b = StyloDrift.driftOnce(raw, persona, rates, StyloDrift.makeRng(seed + 10007), maxLen);
  var sa = StyloDrift.score(raw, a);
  var sb = StyloDrift.score(raw, b);
  var useB = sb.pinc3 + sb.func * 1.3 > sa.pinc3 + sa.func * 1.3;
  var body = useB ? b : a;
  var scores = useB ? sb : sa;
  return { text: body, persona: persona.id, scores: scores, seed: seed };
};
