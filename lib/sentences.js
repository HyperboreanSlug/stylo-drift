StyloDrift.splitSentences = function (text) {
  var raw = String(text).replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n');
  var parts = raw.split(/([.!?]+["']?\s+|\n+)/);
  var sents = [];
  var buf = '';
  for (var i = 0; i < parts.length; i++) {
    buf += parts[i];
    if (/[.!?]+["']?\s+$/.test(parts[i]) || /^\n+$/.test(parts[i]) || i === parts.length - 1) {
      var t = buf.trim();
      if (t) sents.push(t);
      buf = '';
    }
  }
  if (!sents.length && raw.trim()) sents.push(raw.trim());
  return sents;
};

StyloDrift.joinSentences = function (sents) {
  var out = [];
  for (var i = 0; i < sents.length; i++) {
    var s = sents[i].trim();
    if (!s) continue;
    if (!/[.!?…]$/.test(s) && !/\n$/.test(s)) s += '.';
    out.push(s);
  }
  return out.join(' ');
};
