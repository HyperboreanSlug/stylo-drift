StyloDrift.CONTRACTIONS = [
  ["don't", 'do not'],
  ["doesn't", 'does not'],
  ["didn't", 'did not'],
  ["isn't", 'is not'],
  ["aren't", 'are not'],
  ["wasn't", 'was not'],
  ["weren't", 'were not'],
  ["can't", 'cannot'],
  ["couldn't", 'could not'],
  ["shouldn't", 'should not'],
  ["wouldn't", 'would not'],
  ["won't", 'will not'],
  ["haven't", 'have not'],
  ["hasn't", 'has not'],
  ["hadn't", 'had not'],
  ["I'm", 'I am'],
  ["I've", 'I have'],
  ["I'll", 'I will'],
  ["I'd", 'I would'],
  ["you're", 'you are'],
  ["you've", 'you have'],
  ["you'll", 'you will'],
  ["you'd", 'you would'],
  ["we're", 'we are'],
  ["we've", 'we have'],
  ["we'll", 'we will'],
  ["we'd", 'we would'],
  ["they're", 'they are'],
  ["they've", 'they have'],
  ["they'll", 'they will'],
  ["they'd", 'they would'],
  ["that's", 'that is'],
  ["there's", 'there is'],
  ["here's", 'here is'],
  ["what's", 'what is'],
  ["who's", 'who is'],
  ["it's", 'it is'],
  ["let's", 'let us'],
  ['gonna', 'going to'],
  ['wanna', 'want to'],
  ['gotta', 'got to'],
  ["y'all", 'you all']
];

StyloDrift.applyContractions = function (text, persona, rate, rng) {
  var want = persona.contraction;
  var out = text;
  for (var i = 0; i < StyloDrift.CONTRACTIONS.length; i++) {
    var short = StyloDrift.CONTRACTIONS[i][0];
    var full = StyloDrift.CONTRACTIONS[i][1];
    if (rng() > rate) continue;
    if (rng() < want) {
      out = StyloDrift.replacePhrase(out, full, short);
    } else {
      out = StyloDrift.replacePhrase(out, short, full);
    }
  }
  return out;
};
