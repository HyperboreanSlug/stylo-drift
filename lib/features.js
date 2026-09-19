StyloDrift.FUNC_KEYS = [
  'the', 'of', 'and', 'to', 'a', 'in', 'that', 'it', 'is', 'was',
  'for', 'on', 'with', 'as', 'be', 'at', 'by', 'this', 'have', 'from',
  'or', 'an', 'but', 'not', 'are', 'were', 'which', 'you', 'his', 'they',
  'i', 'we', 'their', 'if', 'would', 'there', 'what', 'so', 'when', 'who',
  'about', 'been', 'has', 'more', 'can', 'than', 'its', 'into', 'just', 'also',
  'because', 'however', 'therefore', 'though', 'while', 'very', 'really', 'maybe'
];

StyloDrift._ngrams = function (s, n) {
  var t = String(s).toLowerCase();
  var set = {};
  var i;
  for (i = 0; i <= t.length - n; i++) set[t.slice(i, i + n)] = 1;
  return set;
};

StyloDrift._pinc = function (src, dst, n) {
  var a = StyloDrift._ngrams(src, n);
  var b = StyloDrift._ngrams(dst, n);
  var neu = 0;
  var total = 0;
  var k;
  for (k in b) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) continue;
    total += 1;
    if (!a[k]) neu += 1;
  }
  return total ? neu / total : 0;
};

StyloDrift._funcVec = function (s) {
  var lower = ' ' + String(s).toLowerCase().replace(/[^a-z']+/g, ' ') + ' ';
  var vec = [];
  var i;
  for (i = 0; i < StyloDrift.FUNC_KEYS.length; i++) {
    var w = StyloDrift.FUNC_KEYS[i];
    var re = new RegExp('\\b' + w + '\\b', 'g');
    var m = lower.match(re);
    vec.push(m ? m.length : 0);
  }
  return vec;
};

StyloDrift._l1 = function (a, b) {
  var n = 0;
  var d = 0;
  var i;
  for (i = 0; i < a.length; i++) {
    n += Math.abs(a[i] - b[i]);
    d += a[i] + b[i];
  }
  return d ? n / d : 0;
};

StyloDrift.score = function (src, dst) {
  return {
    pinc3: Math.round(StyloDrift._pinc(src, dst, 3) * 100),
    pinc1w: Math.round(StyloDrift._pinc(src.split(/\s+/).join(' '), dst.split(/\s+/).join(' '), 5) * 100),
    func: Math.round(StyloDrift._l1(StyloDrift._funcVec(src), StyloDrift._funcVec(dst)) * 100)
  };
};
