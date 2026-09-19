StyloDrift.SMALL_NUMS = {
  '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
  '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten'
};

StyloDrift.applyPunctuation = function (text, persona, rate, rng) {
  var out = text;
  if (rng() < rate) {
    if (persona.oxford) {
      out = out.replace(/(\w+), (\w+) and (\w+)/g, '$1, $2, and $3');
    } else {
      out = out.replace(/(\w+), (\w+), and (\w+)/g, '$1, $2 and $3');
    }
  }
  if (rng() < rate) {
    if (persona.dash === 'em') {
      out = out.replace(/\s+-\s+/g, ' — ').replace(/\s+–\s+/g, ' — ');
    } else if (persona.dash === 'en') {
      out = out.replace(/\s+-\s+/g, ' – ').replace(/\s+—\s+/g, ' – ');
    } else if (persona.dash === 'hyphen') {
      out = out.replace(/\s+[—–]\s+/g, ' - ');
    } else if (persona.dash === 'semicolon') {
      out = out.replace(/\s+[—–]\s+/g, '; ');
    }
  }
  if (rng() < rate) {
    if (persona.quotes === 'single') {
      out = out.replace(/"([^"]+)"/g, "'$1'");
    } else {
      out = out.replace(/'([^']+)'/g, '"$1"');
    }
  }
  if (rng() < rate * 0.6) {
    if (persona.numbers === 'words') {
      out = out.replace(/\b([1-9]|10)\b/g, function (m) {
        return StyloDrift.SMALL_NUMS[m] || m;
      });
    } else {
      var words = {
        one: '1', two: '2', three: '3', four: '4', five: '5',
        six: '6', seven: '7', eight: '8', nine: '9', ten: '10'
      };
      out = out.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/gi, function (m) {
        return words[m.toLowerCase()] || m;
      });
    }
  }
  if (persona.formality === 'casual' && rng() < rate * 0.25) {
    out = out.replace(/\.(\s+)([A-Z])/g, function (m, sp, ch, offset, full) {
      if (rng() < 0.3) return '!' + sp + ch;
      return m;
    });
  }
  if (persona.formality === 'formal' && rng() < rate * 0.4) {
    out = out.replace(/!+/g, '.');
  }
  return out;
};
