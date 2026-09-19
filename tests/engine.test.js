var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.join(__dirname, '..');
var code = fs.readFileSync(path.join(root, 'engine-bundle.js'), 'utf8');
var ctx = { console: console };
vm.createContext(ctx);
vm.runInContext(code, ctx);
var SD = ctx.StyloDrift;

var fails = 0;
function assert(cond, msg) {
  if (!cond) {
    fails += 1;
    console.log('FAIL ' + msg);
  } else {
    console.log('ok   ' + msg);
  }
}

var sample =
  "I really think this is a pretty important issue because people never actually look at the data. " +
  "It's just the same thing every time, and I don't think that's acceptable. " +
  "Maybe we should talk about it more often.";

var tagged =
  "Look at https://example.com/x and ping @SomeUser about #OpenData and $TEST today.";

var long =
  sample +
  "\n\n" +
  "The report on the state of the market is clear that the public will have to look at the numbers " +
  "in the coming weeks, and I believe that this is the moment to act because the cost of waiting is high. " +
  "We have been through this before. Everyone already knows the story. " +
  "There is a lot of evidence in the record, and I think that we should go into the details.\n\n" +
  sample +
  " Meanwhile the same officials say that they will continue to work with the agencies on the plan. " +
  "I do not think that is enough. We need to see the process, not just the statement from the company.";

assert(long.length > 280, 'fixture longer than 280 (' + long.length + ')');

var res = SD.drift(sample, { intensity: 5, seed: 42, persona: 'clerk' });
assert(res.text.length > 0, 'non-empty output');
assert(res.text !== sample, 'output differs from input');
assert(res.scores.pinc3 >= 12, 'char 3-gram PINC >= 12 (got ' + res.scores.pinc3 + ')');
assert(res.scores.func >= 8, 'function-word shift >= 8 (got ' + res.scores.func + ')');
assert(res.persona === 'clerk', 'locked persona clerk');
assert(res.text.length <= 280, 'short post stays <= 280 (got ' + res.text.length + ')');

var prot = SD.drift(tagged, { intensity: 5, seed: 99, persona: 'brisk' });
assert(prot.text.indexOf('https://example.com/x') !== -1, 'URL survives');
assert(prot.text.indexOf('@SomeUser') !== -1, 'mention survives');
assert(prot.text.indexOf('#OpenData') !== -1, 'hashtag survives');
assert(prot.text.indexOf('$TEST') !== -1, 'cashtag survives');

var longRes = SD.drift(long, { intensity: 5, seed: 77, persona: 'memo' });
assert(longRes.text.length > 280, 'long post not clamped to 280 (got ' + longRes.text.length + ')');
assert(longRes.text.length <= 25000, 'long post under 25k (got ' + longRes.text.length + ')');
assert(longRes.text.indexOf('\n\n') !== -1, 'paragraph breaks kept');
assert(longRes.scores.pinc3 >= 8, 'long-post PINC >= 8 (got ' + longRes.scores.pinc3 + ')');
assert(longRes.scores.func >= 8, 'long-post function-word shift >= 8 (got ' + longRes.scores.func + ')');
assert(longRes.text.indexOf('…') === -1 || long.length > 25000, 'did not ellipsis-truncate long post');

var empty = SD.drift('   ', { intensity: 5, seed: 1 });
assert(empty.text.trim() === '', 'blank stays blank');

var a = SD.drift(sample, { intensity: 5, seed: 123, persona: 'blunt' });
var b = SD.drift(sample, { intensity: 5, seed: 123, persona: 'blunt' });
assert(a.text === b.text, 'same seed is repeatable');

var c = SD.drift(sample, { intensity: 5, seed: 124, persona: 'blunt' });
assert(c.text !== a.text, 'different seed rerolls');

var live =
  "I really don't know what all these european leaders are thinking lately. " +
  "It seems like they're fully focused on wiping out White people.";
var liveRes = SD.drift(live, { intensity: 5, seed: 9, persona: 'clerk' });
assert(liveRes.text !== live, 'live tweet changes');
assert(/\bWhite people\b/.test(liveRes.text), 'keeps White people (got: ' + liveRes.text + ')');
assert(/\bthinking\b/.test(liveRes.text), 'keeps thinking');
assert(/\bleaders\b/.test(liveRes.text), 'keeps leaders');
assert(!/weighing|figuring|the public|in a sense/i.test(liveRes.text), 'no junk swaps');
assert(SD.qualityOk(live, liveRes.text), 'quality gate');

console.log(JSON.stringify({
  sampleOut: res.text,
  sampleScores: res.scores,
  longLen: longRes.text.length,
  longScores: longRes.scores,
  longHead: longRes.text.slice(0, 280)
}, null, 2));

if (fails) {
  console.log(fails + ' failed');
  process.exit(1);
}
console.log('all passed');
