StyloDrift.qualityOk = function (src, dst) {
  var s = String(src || '');
  var d = String(dst || '').trim();
  if (!d) return false;
  if (/\bthe the\b/i.test(d)) return false;
  if (/\bthe public\b/i.test(d) && !/\bthe public\b/i.test(s)) return false;
  if (/\bthe crowd\b/i.test(d) && !/\bthe crowd\b/i.test(s)) return false;
  if (/^[a-z]/.test(d) && /^[A-Z]/.test(s.trim())) return false;
  if (d.length < 400 && /\b(in a sense|more or less|to be fair|arguably),/i.test(d) &&
      !/\b(in a sense|more or less|to be fair|arguably),/i.test(s)) {
    return false;
  }
  if (/\bWhite\b/.test(s) && !/\bWhite\b/.test(d)) return false;
  if (/\bpeople\b/i.test(s) && !/\b(people|folks)\b/i.test(d)) return false;
  if (/\bthinking\b/i.test(s) && !/\bthinking\b/i.test(d)) return false;
  if (/\bleaders\b/i.test(s) && !/\bleaders\b/i.test(d)) return false;
  return true;
};
