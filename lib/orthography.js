StyloDrift.ORTHO = [
  ['anymore', 'any more'],
  ['alright', 'all right'],
  ['into', 'in to'],
  ['onto', 'on to'],
  ['cannot', 'can not'],
  ['everyone', 'every one'],
  ['anyone', 'any one'],
  ['someone', 'some one'],
  ['altogether', 'all together'],
  ['awhile', 'a while'],
  ['anytime', 'any time'],
  ['sometime', 'some time'],
  ['everyday', 'every day'],
  ['wherever', 'where ever'],
  ['whatever', 'what ever'],
  ['whenever', 'when ever'],
  ['nonetheless', 'none the less'],
  ['insofar', 'in so far'],
  ['inasmuch', 'in as much']
];

StyloDrift.applyOrthography = function (text, persona, rate, rng) {
  var compact = persona.contraction >= 0.5;
  var out = text;
  var i;
  for (i = 0; i < StyloDrift.ORTHO.length; i++) {
    var a = StyloDrift.ORTHO[i][0];
    var b = StyloDrift.ORTHO[i][1];
    if (rng() > rate) continue;
    if (compact) out = StyloDrift.replacePhrase(out, b, a);
    else out = StyloDrift.replacePhrase(out, a, b);
  }
  return out;
};
