StyloDrift._slotTok = function (i) {
  return '\uE000' + String.fromCharCode(0xE001 + i) + '\uE000';
};

StyloDrift.protect = function (text) {
  var slots = [];
  var out = String(text);
  var patterns = [
    /https?:\/\/[^\s]+/g,
    /www\.[^\s]+/g,
    /@[A-Za-z0-9_]{1,15}/g,
    /#[A-Za-z0-9_]+/g,
    /\$[A-Za-z]{1,6}\b/g
  ];
  function mask(m) {
    var i = slots.length;
    slots.push(m);
    return StyloDrift._slotTok(i);
  }
  for (var i = 0; i < patterns.length; i++) {
    out = out.replace(patterns[i], mask);
  }
  out = out.replace(/\b[A-Z][a-z]+\b/g, function (m, offset, full) {
    if (m === 'I') return m;
    if (offset === 0) return m;
    var before = full.slice(0, offset);
    if (/(^|[.!?]\s+)$/.test(before)) return m;
    return mask(m);
  });
  return { text: out, slots: slots };
};

StyloDrift.unprotect = function (text, slots) {
  var out = String(text);
  for (var i = 0; i < slots.length; i++) {
    out = out.split(StyloDrift._slotTok(i)).join(slots[i]);
  }
  return out;
};
