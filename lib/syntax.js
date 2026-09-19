StyloDrift._splitOnce = function (s) {
  var marks = ['; ', ' — ', ' – ', ', and ', ' and ', ' but ', ' so ', ' because ', ': '];
  var lower = s;
  for (var i = 0; i < marks.length; i++) {
    var idx = lower.indexOf(marks[i]);
    if (idx < 8) continue;
    var left = s.slice(0, idx).trim();
    var right = s.slice(idx + marks[i].length).trim();
    if (StyloDrift.wordCount(left) < 3 || StyloDrift.wordCount(right) < 3) continue;
    right = right.charAt(0).toUpperCase() + right.slice(1);
    if (!/[.!?]$/.test(left)) left += '.';
    return [left, right];
  }
  return null;
};

StyloDrift._invertBecause = function (s, rng) {
  var m = s.match(/^(.*?)\s+because\s+(.*)$/i);
  if (!m) return s;
  if (StyloDrift.wordCount(m[1]) < 3 || StyloDrift.wordCount(m[2]) < 3) return s;
  var head = m[2].replace(/[.!?]+$/, '');
  var tail = m[1].replace(/[.!?]+$/, '');
  var join = rng() < 0.5 ? 'Since' : 'Given that';
  return join + ' ' + StyloDrift.lowerStart(head) + ', ' +
    StyloDrift.lowerStart(tail) + '.';
};

StyloDrift._invertIf = function (s) {
  var m = s.match(/^If\s+(.*?),\s+(.*)$/i);
  if (!m) return s;
  var cond = m[1].replace(/[.!?]+$/, '');
  var then = m[2].replace(/[.!?]+$/, '');
  return then.charAt(0).toUpperCase() + then.slice(1) + ' if ' +
    StyloDrift.lowerStart(cond) + '.';
};

StyloDrift.applySyntax = function (text, persona, rate, rng) {
  var sents = StyloDrift.splitSentences(text);
  var target = persona.sentTarget || 14;
  var out = [];
  for (var i = 0; i < sents.length; i++) {
    var s = sents[i];
    var wc = StyloDrift.wordCount(s);
    if (wc > target + 4 && rng() < Math.min(1, rate + 0.25)) {
      var parts = StyloDrift._splitOnce(s);
      if (parts) {
        out.push(parts[0], parts[1]);
        continue;
      }
    }
    if (rng() < rate * 0.5) s = StyloDrift._invertBecause(s, rng);
    if (rng() < rate * 0.35) s = StyloDrift._invertIf(s);
    out.push(s);
  }
  if (persona.sent === 'long' || persona.sent === 'medium') {
    var merged = [];
    for (var j = 0; j < out.length; j++) {
      if (
        j < out.length - 1 &&
        StyloDrift.wordCount(out[j]) < 8 &&
        StyloDrift.wordCount(out[j + 1]) < 10 &&
        rng() < rate
      ) {
        var a = out[j].replace(/[.!?]+$/, '');
        var b = out[j + 1].charAt(0).toLowerCase() + out[j + 1].slice(1);
        var glue = rng() < 0.5 ? '; ' : ', and ';
        merged.push(a + glue + b);
        j += 1;
      } else {
        merged.push(out[j]);
      }
    }
    out = merged;
  }
  return StyloDrift.joinSentences(out);
};
