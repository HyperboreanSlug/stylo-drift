StyloDrift.makeRng = function (seed) {
  var a = (seed >>> 0) || 1;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

StyloDrift.pick = function (rng, list) {
  if (!list || !list.length) return null;
  return list[Math.floor(rng() * list.length)];
};

StyloDrift.chance = function (rng, p) {
  return rng() < p;
};
