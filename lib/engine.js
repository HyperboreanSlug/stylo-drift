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
  return out.length > maxLen ? out.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…' : out;
};

StyloDrift.driftChunk = function (chunk, persona, rates, rng) {
  var masked = StyloDrift.protect(chunk);
  var body = masked.text;
  var wc = StyloDrift.wordCount(chunk);
  body = StyloDrift.applySafe(body, persona, rates.safe, rng);
  body = StyloDrift.applyContractions(body, persona, rates.contr, rng);
  body = StyloDrift.applySpelling(body, persona, rates.spell, rng);
  body = StyloDrift.applyPunctuation(body, persona, rates.punct, rng);
  if (wc > 55) body = StyloDrift.applySyntax(body, persona, rates.syntax * 0.35, rng);
  if (wc > 90) body = StyloDrift.applyHedges(body, persona, rates.hedge * 0.4, rng);
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
  var body = StyloDrift.driftOnce(raw, persona, rates, StyloDrift.makeRng(seed), maxLen);
  if (!StyloDrift.qualityOk(raw, body)) {
    var mild = Object.assign({}, rates, { safe: 1, contr: 1, spell: 0.5, punct: 0, syntax: 0, hedge: 0 });
    body = StyloDrift.driftOnce(raw, persona, mild, StyloDrift.makeRng(seed + 3), maxLen);
  }
  if (!StyloDrift.qualityOk(raw, body)) body = raw;
  return { text: body, persona: persona.id, scores: StyloDrift.score(raw, body), seed: seed };
};
