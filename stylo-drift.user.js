// ==UserScript==
// @name         Stylo Drift
// @namespace    local.stylo-drift
// @version      1.3.0
// @description  Rewrite compose text on X to shift writing-style features
// @match        https://x.com/*
// @match        https://www.x.com/*
// @match        https://mobile.x.com/*
// @match        https://twitter.com/*
// @match        https://www.twitter.com/*
// @match        https://mobile.twitter.com/*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
'use strict';
var StyloDrift = {};

/* --- lib/util.js --- */
StyloDrift.escapeRe = function (s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

StyloDrift.matchCase = function (sample, replacement) {
  if (!sample) return replacement;
  if (sample === sample.toUpperCase()) return replacement.toUpperCase();
  if (sample === sample.toLowerCase()) return replacement.toLowerCase();
  if (sample[0] === sample[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
};

StyloDrift.replacePhrase = function (text, from, to) {
  var re = new RegExp(StyloDrift.escapeRe(from), 'gi');
  return text.replace(re, function (m) {
    return StyloDrift.matchCase(m, to);
  });
};

StyloDrift.replaceWord = function (text, from, to) {
  var re = new RegExp('\\b' + StyloDrift.escapeRe(from) + '\\b', 'gi');
  return text.replace(re, function (m) {
    return StyloDrift.matchCase(m, to);
  });
};

StyloDrift.replaceWordProb = function (text, from, to, rate, rng) {
  var re = new RegExp('\\b' + StyloDrift.escapeRe(from) + '\\b', 'gi');
  return text.replace(re, function (m) {
    if (rng() > rate) return m;
    var pick = Array.isArray(to) ? to[Math.floor(rng() * to.length)] : to;
    return StyloDrift.matchCase(m, pick);
  });
};

StyloDrift.wordCount = function (s) {
  var m = String(s).trim().match(/[A-Za-z0-9']+/g);
  return m ? m.length : 0;
};

StyloDrift.lowerStart = function (s) {
  if (!s) return s;
  if (/^I\b/.test(s)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
};

/* --- lib/rng.js --- */
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

/* --- lib/protect.js --- */
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

/* --- lib/sentences.js --- */
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

/* --- data/phrases.js --- */
StyloDrift.PHRASES = {
  'due to the fact that': ['because', 'since', 'as'],
  'in order to': ['to', 'so as to'],
  'a large number of': ['many', 'numerous', 'lots of'],
  'a small number of': ['few', 'a handful of'],
  'at this point in time': ['now', 'at present'],
  'at this point': ['now', 'here'],
  'in the event that': ['if', 'should'],
  'for the most part': ['mostly', 'mainly', 'largely'],
  'in spite of the fact that': ['although', 'even though'],
  'as a matter of fact': ['in fact', 'actually'],
  'with regard to': ['about', 'on', 'concerning'],
  'in relation to': ['about', 'for'],
  'on the other hand': ['then again', 'by contrast'],
  'on the one hand': ['first', 'for one thing'],
  'as well as': ['and', 'plus'],
  'in addition to': ['besides', 'along with'],
  'a lot of': ['many', 'plenty of', 'lots of'],
  'lots of': ['many', 'a lot of', 'plenty of'],
  'kind of': ['somewhat', 'rather', 'sort of'],
  'sort of': ['somewhat', 'kind of', 'rather'],
  'a bit of': ['some', 'a little'],
  'a couple of': ['two', 'a few'],
  'going to': ['about to', 'set to', 'gonna'],
  'want to': ['wish to', 'mean to', 'wanna'],
  'have to': ['must', 'need to', 'gotta'],
  'need to': ['must', 'have to', 'ought to'],
  'able to': ['can', 'fit to'],
  'trying to': ['aiming to', 'out to'],
  'supposed to': ['meant to', 'to'],
  'used to': ['once did', 'would'],
  'of course': ['clearly', 'naturally', 'sure'],
  'in fact': ['actually', 'indeed'],
  'by the way': ['incidentally', 'also'],
  'at least': ['anyway', 'at any rate'],
  'as well': ['too', 'also'],
  'no one': ['nobody', 'not a soul'],
  'any one': ['anyone', 'anybody'],
  'every one': ['everyone', 'everybody'],
  'a few': ['several', 'some', 'a handful of'],
  'a bit': ['slightly', 'somewhat'],
  'right now': ['now', 'at present', 'currently'],
  'these days': ['now', 'lately', 'currently'],
  'over time': ['eventually', 'gradually'],
  'in the long run': ['eventually', 'over time'],
  'the fact that': ['that', 'how'],
  'it is important to': ['one should', 'you should'],
  'i do not think': ['i doubt', 'i question'],
  "i don't think": ['i doubt', 'i question'],
  'i think that': ['i figure', 'my take is'],
  'i think': ['i figure', 'i reckon', 'to me'],
  'i believe': ['i hold', 'i figure'],
  'i feel like': ['it seems', 'looks like'],
  'it seems like': ['looks like', 'seems'],
  'it seems': ['looks', 'appears'],
  'there is': ['you have', 'we have'],
  'there are': ['you have', 'we have'],
  'has been': ['was', 'stayed'],
  'have been': ['were', 'stayed'],
  'is going to': ['will', 'shall'],
  'are going to': ['will', 'shall'],
  'more and more': ['increasingly', 'ever more'],
  'less and less': ['decreasingly', 'ever less'],
  'again and again': ['repeatedly', 'over and over'],
  'over and over': ['repeatedly', 'again and again'],
  'first of all': ['first', 'to start'],
  'all of a sudden': ['suddenly', 'abruptly'],
  'once in a while': ['sometimes', 'occasionally'],
  'from time to time': ['occasionally', 'sometimes'],
  'in my opinion': ['to me', 'as i see it'],
  'to be honest': ['frankly', 'honestly'],
  'at the end of the day': ['in the end', 'ultimately'],
  'the vast majority of': ['most', 'nearly all'],
  'a number of': ['several', 'some'],
  'in terms of': ['for', 'on'],
  'prior to': ['before', 'ahead of'],
  'subsequent to': ['after', 'following'],
  'in light of': ['given', 'after'],
  'with respect to': ['about', 'on'],
  'as far as': ['for', 'on'],
  'talk about': ['discuss', 'cover', 'raise'],
  'talking about': ['discussing', 'covering'],
  'look at': ['check', 'view', 'examine'],
  'looking at': ['checking', 'viewing', 'examining'],
  'think about': ['consider', 'weigh'],
  'thinking about': ['considering', 'weighing']
};

/* --- data/safe-swaps.js --- */
StyloDrift.SAFE_PHRASES = {
  "i really don't know": [
    "i honestly don't know",
    "i don't really know",
    "i truly don't know"
  ],
  'i really do not know': [
    'i honestly do not know',
    'i do not really know',
    'i truly do not know'
  ],
  "i don't know": ["i do not know", "i have no idea", "i've no idea"],
  'i do not know': ["i don't know", 'i have no idea'],
  'it seems like': ['it looks like', 'it appears that'],
  'it seems that': ['it looks like', 'it appears that'],
  'it seems': ['it appears', 'it looks'],
  'seems like': ['looks like', 'appears that'],
  'fully focused': ['completely focused', 'entirely focused'],
  'these days': ['lately', 'recently'],
  'at the moment': ['right now', 'just now'],
  'a lot of': ['plenty of', 'lots of'],
  'lots of': ['a lot of', 'plenty of'],
  'kind of': ['sort of', 'somewhat'],
  'sort of': ['kind of', 'somewhat'],
  'going to': ['about to'],
  'have to': ['need to'],
  'need to': ['have to'],
  'in order to': ['to'],
  'due to the fact that': ['because'],
  'at this point': ['now'],
  'as well': ['too']
};

StyloDrift.SAFE_WORDS = {
  really: ['honestly', 'truly', 'actually'],
  actually: ['really', 'in fact'],
  honestly: ['truly', 'really'],
  lately: ['recently'],
  recently: ['lately'],
  fully: ['completely', 'entirely'],
  completely: ['fully', 'entirely'],
  entirely: ['fully', 'completely'],
  seems: ['appears'],
  appears: ['seems'],
  maybe: ['perhaps', 'possibly'],
  perhaps: ['maybe', 'possibly'],
  possibly: ['perhaps', 'maybe'],
  these: ['those'],
  those: ['these'],
  towards: ['toward'],
  toward: ['towards'],
  among: ['amongst'],
  amongst: ['among'],
  while: ['whilst'],
  whilst: ['while'],
  because: ['since'],
  since: ['because'],
  although: ['though', 'even though'],
  though: ['although'],
  however: ['still', 'even so']
};

/* --- data/function-alts.js --- */
StyloDrift.FUNCTION_ALTS = {
  however: ['still', 'even so', 'that said', 'nevertheless', 'though'],
  nevertheless: ['still', 'even so', 'however', 'all the same'],
  nonetheless: ['still', 'even so', 'however'],
  therefore: ['so', 'thus', 'hence', 'as a result'],
  thus: ['so', 'hence', 'therefore', 'that way'],
  hence: ['so', 'thus', 'therefore'],
  consequently: ['so', 'as a result', 'therefore'],
  although: ['though', 'even though', 'while'],
  though: ['although', 'even so', 'while'],
  because: ['since', 'as', 'given that'],
  since: ['because', 'as', 'given that'],
  while: ['whilst', 'whereas', 'as'],
  whilst: ['while', 'whereas'],
  whereas: ['while', 'though'],
  moreover: ['also', 'plus', 'furthermore', 'besides'],
  furthermore: ['also', 'moreover', 'plus'],
  additionally: ['also', 'plus', 'besides'],
  besides: ['also', 'anyway', 'plus'],
  meanwhile: ['in the meantime', 'at the same time'],
  otherwise: ['or else', 'if not'],
  unless: ['if not', 'except if'],
  until: ['till', 'up to when'],
  till: ['until', 'up to'],
  whether: ['if'],
  perhaps: ['maybe', 'possibly'],
  maybe: ['perhaps', 'possibly', 'could be'],
  possibly: ['perhaps', 'maybe'],
  probably: ['likely', 'most likely', 'odds are'],
  actually: ['in fact', 'really', 'as it happens'],
  really: ['actually', 'truly', 'genuinely'],
  very: ['quite', 'rather', 'pretty', 'highly'],
  quite: ['rather', 'fairly', 'pretty'],
  rather: ['quite', 'fairly', 'pretty'],
  pretty: ['quite', 'fairly', 'rather'],
  fairly: ['quite', 'rather', 'pretty'],
  extremely: ['highly', 'deeply', 'seriously'],
  highly: ['very', 'greatly', 'deeply'],
  slightly: ['a little', 'somewhat'],
  somewhat: ['rather', 'a bit', 'fairly'],
  simply: ['just', 'merely', 'only'],
  merely: ['just', 'only', 'simply'],
  almost: ['nearly', 'about', 'close to'],
  nearly: ['almost', 'about', 'close to'],
  among: ['amongst', 'amid'],
  amongst: ['among', 'amid'],
  toward: ['towards'],
  towards: ['toward'],
  upon: ['on'],
  within: ['inside'],
  without: ['minus', 'lacking'],
  through: ['via'],
  via: ['through', 'by'],
  during: ['through', 'over'],
  before: ['ahead of', 'prior to'],
  after: ['following'],
  despite: ['in spite of', 'even with'],
  except: ['aside from'],
  yet: ['still', 'even so'],
  also: ['too', 'as well', 'plus'],
  again: ['once more', 'anew'],
  further: ['moreover'],
  indeed: ['in fact', 'truly'],
  instead: ['rather', 'in lieu'],
  several: ['a few', 'a number of', 'various'],
  various: ['several', 'assorted', 'a few'],
  many: ['numerous', 'a lot of', 'plenty of'],
  numerous: ['many', 'a host of'],
  often: ['frequently', 'repeatedly'],
  frequently: ['often', 'regularly'],
  always: ['every time', 'invariably'],
  never: ['not once', 'not ever'],
  sometimes: ['occasionally', 'at times'],
  occasionally: ['sometimes', 'now and then'],
  already: ['by now', 'previously'],
  still: ['yet', 'even now', 'all the same'],
  cannot: ["can't"],
  could: ['might'],
  would: ['might'],
  should: ['ought to'],
  must: ['have to', 'need to'],
  might: ['may', 'could'],
  shall: ['will'],
  just: ['simply', 'merely', 'only'],
  only: ['just', 'solely', 'merely'],
  even: ['still', 'yet'],
  actually: ['in fact', 'as it happens', 'really'],
  currently: ['now', 'at present', 'presently'],
  recently: ['lately', 'of late'],
  usually: ['normally', 'typically', 'as a rule'],
  generally: ['broadly', 'in the main']
};

/* --- data/synonyms.js --- */
StyloDrift.SYNONYMS = {
  think: ['figure', 'reckon', 'believe', 'suspect'],
  thinking: ['figuring', 'reckoning', 'weighing'],
  thought: ['figured', 'reckoned', 'believed'],
  people: ['folks', 'the public', 'others'],
  person: ['individual', 'someone', 'a body'],
  thing: ['matter', 'piece', 'item'],
  things: ['matters', 'pieces', 'items'],
  stuff: ['material', 'gear', 'things'],
  issue: ['matter', 'problem', 'question'],
  issues: ['matters', 'problems', 'questions'],
  problem: ['issue', 'snag', 'trouble'],
  problems: ['issues', 'snags', 'troubles'],
  idea: ['notion', 'take', 'thought'],
  ideas: ['notions', 'takes', 'thoughts'],
  point: ['claim', 'bit', 'spot'],
  important: ['serious', 'key', 'major'],
  big: ['large', 'major', 'huge'],
  small: ['tiny', 'minor', 'slight'],
  good: ['solid', 'fine', 'sound'],
  bad: ['poor', 'rough', 'ugly'],
  great: ['strong', 'excellent', 'major'],
  better: ['stronger', 'improved', 'preferable'],
  worse: ['poorer', 'uglier', 'rougher'],
  best: ['top', 'finest', 'strongest'],
  worst: ['lowest', 'ugliest', 'poorest'],
  new: ['fresh', 'recent', 'novel'],
  old: ['prior', 'former', 'aged'],
  real: ['actual', 'genuine', 'true'],
  true: ['accurate', 'real', 'correct'],
  false: ['wrong', 'untrue', 'bogus'],
  right: ['correct', 'proper', 'accurate'],
  wrong: ['incorrect', 'off', 'mistaken'],
  hard: ['tough', 'difficult', 'steep'],
  easy: ['simple', 'straightforward', 'light'],
  difficult: ['hard', 'tough', 'steep'],
  simple: ['plain', 'easy', 'bare'],
  clear: ['plain', 'obvious', 'evident'],
  obvious: ['clear', 'plain', 'evident'],
  sure: ['certain', 'confident', 'positive'],
  maybe: ['perhaps', 'possibly'],
  happen: ['occur', 'take place', 'come about'],
  happening: ['occurring', 'going on'],
  happened: ['occurred', 'took place'],
  make: ['create', 'form', 'build'],
  made: ['created', 'formed', 'built'],
  making: ['creating', 'forming', 'building'],
  get: ['obtain', 'gain', 'pick up'],
  got: ['obtained', 'gained', 'picked up'],
  getting: ['obtaining', 'gaining'],
  give: ['offer', 'hand', 'provide'],

  take: ['grab', 'pull', 'accept'],
  took: ['grabbed', 'pulled', 'accepted'],
  keep: ['hold', 'retain', 'stay with'],
  kept: ['held', 'retained'],
  show: ['display', 'reveal', 'indicate'],
  shown: ['displayed', 'revealed'],
  find: ['locate', 'spot', 'uncover'],
  found: ['located', 'spotted', 'uncovered'],
  look: ['glance', 'appear', 'check'],
  looking: ['glancing', 'appearing', 'checking'],
  see: ['view', 'notice', 'observe'],
  seen: ['viewed', 'noticed', 'observed'],
  know: ['recognize', 'grasp', 'follow'],
  known: ['recognized', 'grasped'],
  say: ['state', 'note', 'remark'],
  said: ['stated', 'noted', 'remarked'],
  saying: ['stating', 'noting'],
  tell: ['inform', 'report', 'relay'],
  told: ['informed', 'reported'],
  ask: ['request', 'raise', 'pose'],
  asked: ['requested', 'raised', 'posed'],
  talk: ['speak', 'discuss', 'chat'],
  talking: ['speaking', 'discussing'],
  call: ['term', 'name', 'phone'],
  called: ['termed', 'named'],
  use: ['apply', 'employ', 'run'],
  used: ['applied', 'employed', 'ran'],
  using: ['applying', 'employing'],
  work: ['function', 'operate', 'run'],
  working: ['functioning', 'operating'],
  worked: ['functioned', 'operated'],
  try: ['attempt', 'aim', 'test'],
  tried: ['attempted', 'aimed'],
  trying: ['attempting', 'aiming'],
  help: ['aid', 'assist', 'back'],
  helped: ['aided', 'assisted'],
  start: ['begin', 'open', 'launch'],
  started: ['began', 'opened', 'launched'],
  stop: ['halt', 'end', 'drop'],
  stopped: ['halted', 'ended', 'dropped'],
  change: ['shift', 'alter', 'adjust'],
  changed: ['shifted', 'altered', 'adjusted'],
  need: ['require', 'want', 'call for'],
  needed: ['required', 'wanted'],
  want: ['wish', 'seek', 'prefer'],
  wanted: ['wished', 'sought'],
  feel: ['sense', 'read', 'find'],
  feeling: ['sensing', 'reading'],
  felt: ['sensed', 'read'],
  seem: ['appear', 'look', 'read as'],
  seems: ['appears', 'looks', 'reads as'],
  come: ['arrive', 'show up', 'turn up'],
  came: ['arrived', 'showed up'],
  leave: ['exit', 'drop', 'go'],
  left: ['exited', 'dropped', 'went'],
  put: ['place', 'set', 'lay'],
  set: ['place', 'put', 'fix'],
  run: ['operate', 'go', 'drive'],
  ran: ['operated', 'went', 'drove'],
  turn: ['shift', 'spin', 'become'],
  turned: ['shifted', 'became'],
  mean: ['imply', 'intend', 'spell'],
  means: ['implies', 'spells', 'equals'],
  meant: ['implied', 'intended'],
  claim: ['assert', 'argue', 'hold'],
  claimed: ['asserted', 'argued'],
  argue: ['claim', 'contend', 'hold'],
  argued: ['claimed', 'contended'],
  support: ['back', 'bolster', 'stand behind'],
  supported: ['backed', 'bolstered'],
  attack: ['hit', 'go after', 'assail'],
  fail: ['fall short', 'miss', 'flop'],
  failed: ['fell short', 'missed', 'flopped'],
  win: ['prevail', 'take it', 'come out ahead'],
  lose: ['drop', 'fall', 'give up'],
  pay: ['cover', 'fund', 'settle'],
  paid: ['covered', 'funded'],
  cost: ['price', 'toll', 'outlay'],
  money: ['cash', 'funds', 'capital'],
  news: ['report', 'coverage', 'word'],
  story: ['account', 'report', 'piece'],
  post: ['note', 'write-up', 'item'],
  tweet: ['post', 'note', 'item'],
  video: ['clip', 'footage', 'reel'],
  photo: ['picture', 'shot', 'image'],
  picture: ['photo', 'image', 'shot'],
  data: ['figures', 'numbers', 'evidence'],
  number: ['figure', 'count', 'total'],
  numbers: ['figures', 'counts', 'totals'],
  report: ['account', 'brief', 'write-up'],
  question: ['query', 'issue', 'point'],
  answer: ['reply', 'response', 'take'],
  reason: ['cause', 'grounds', 'basis'],
  result: ['outcome', 'effect', 'product'],
  effect: ['impact', 'result', 'outcome'],
  impact: ['effect', 'hit', 'mark'],
  power: ['control', 'clout', 'force'],
  control: ['command', 'grip', 'hold'],
  system: ['setup', 'structure', 'machine'],
  process: ['procedure', 'course', 'method'],
  method: ['approach', 'process', 'route'],
  way: ['route', 'manner', 'path']
};

/* --- data/synonyms-more.js --- */
Object.assign(StyloDrift.SYNONYMS, {
  time: ['moment', 'period', 'stretch'],
  times: ['occasions', 'moments', 'stretches'],
  day: ['date', 'session', 'stretch'],
  year: ['twelvemonth', 'season'],
  world: ['globe', 'scene', 'field'],
  country: ['nation', 'state'],
  government: ['state', 'administration', 'regime'],
  public: ['people', 'the crowd', 'civic'],
  private: ['personal', 'closed', 'in-house'],
  free: ['open', 'unbound', 'clear'],
  open: ['free', 'unsealed', 'public'],
  closed: ['shut', 'sealed', 'private'],
  current: ['present', 'ongoing', 'live'],
  recent: ['late', 'fresh', 'new'],
  past: ['prior', 'earlier', 'former'],
  currently: ['now', 'at present', 'presently'],
  recently: ['lately', 'of late', 'not long ago'],
  quickly: ['fast', 'rapidly', 'swiftly'],
  slowly: ['gradually', 'at a crawl', 'unhurriedly'],
  suddenly: ['abruptly', 'all at once', 'sharply'],
  clearly: ['plainly', 'obviously', 'evidently'],
  obviously: ['clearly', 'plainly', 'evidently'],
  honestly: ['frankly', 'truly', 'candidly'],
  basically: ['essentially', 'largely', 'in the main'],
  literally: ['actually', 'truly', 'plainly'],
  definitely: ['certainly', 'surely', 'for sure'],
  certainly: ['surely', 'definitely', 'no doubt'],
  completely: ['fully', 'entirely', 'totally'],
  totally: ['fully', 'entirely', 'completely'],
  entirely: ['fully', 'wholly', 'completely'],
  seriously: ['badly', 'genuinely', 'in earnest'],
  especially: ['particularly', 'above all', 'notably'],
  particularly: ['especially', 'notably', 'in particular'],
  generally: ['broadly', 'in the main', 'overall'],
  specifically: ['in particular', 'namely', 'precisely'],
  exactly: ['precisely', 'just', 'dead-on'],
  usually: ['normally', 'typically', 'as a rule'],
  normally: ['usually', 'typically', 'as a rule'],
  typical: ['usual', 'standard', 'ordinary'],
  weird: ['odd', 'strange', 'off'],
  strange: ['odd', 'weird', 'curious'],
  crazy: ['wild', 'nuts', 'mad'],
  stupid: ['dumb', 'foolish', 'dense'],
  smart: ['sharp', 'clever', 'bright'],
  funny: ['comic', 'amusing', 'odd'],
  interesting: ['striking', 'notable', 'curious'],
  boring: ['dull', 'flat', 'tedious'],
  amazing: ['striking', 'remarkable', 'wild'],
  terrible: ['awful', 'dreadful', 'grim'],
  awful: ['terrible', 'dreadful', 'grim'],
  huge: ['massive', 'vast', 'enormous'],
  tiny: ['minute', 'slight', 'mini'],
  fast: ['quick', 'rapid', 'swift'],
  slow: ['gradual', 'unhurried', 'sluggish'],
  late: ['delayed', 'overdue', 'belated'],
  early: ['ahead of time', 'premature', 'prompt'],
  next: ['following', 'coming', 'later'],
  last: ['final', 'prior', 'latest'],
  first: ['initial', 'opening', 'earliest'],
  whole: ['entire', 'full', 'complete'],
  entire: ['whole', 'full', 'complete'],
  different: ['other', 'distinct', 'separate'],
  same: ['identical', 'matching', 'equal'],
  similar: ['alike', 'comparable', 'close'],
  possible: ['feasible', 'doable', 'viable'],
  impossible: ['not feasible', 'out of reach'],
  available: ['on hand', 'open', 'ready'],
  necessary: ['needed', 'required', 'essential'],
  likely: ['probable', 'odds-on', 'expected'],
  unlikely: ['improbable', 'doubtful', 'slim'],
  common: ['usual', 'widespread', 'ordinary'],
  rare: ['uncommon', 'scarce', 'infrequent'],
  serious: ['grave', 'major', 'earnest'],
  dangerous: ['risky', 'unsafe', 'perilous'],
  safe: ['secure', 'unharmed', 'sound'],
  strong: ['solid', 'robust', 'firm'],
  weak: ['frail', 'feeble', 'thin'],
  long: ['lengthy', 'extended', 'drawn-out'],
  short: ['brief', 'compact', 'tight'],
  high: ['elevated', 'steep', 'tall'],
  low: ['slight', 'modest', 'sunken'],
  full: ['packed', 'complete', 'loaded'],
  empty: ['bare', 'vacant', 'blank'],
  young: ['youthful', 'junior', 'new'],
  human: ['person', 'someone'],
  group: ['set', 'cluster', 'body'],
  part: ['piece', 'section', 'share'],
  place: ['spot', 'site', 'location'],
  case: ['instance', 'matter', 'situation'],
  fact: ['point', 'datum', 'detail'],
  information: ['detail', 'material', 'word'],
  evidence: ['proof', 'signs', 'backing'],
  example: ['instance', 'case', 'sample'],
  comment: ['remark', 'note', 'aside'],
  message: ['note', 'word', 'dispatch'],
  thread: ['chain', 'string', 'run'],
  account: ['profile', 'handle', 'record'],
  follower: ['subscriber', 'backer'],
  source: ['origin', 'cite', 'feed'],
  article: ['piece', 'write-up', 'story'],
  research: ['study', 'inquiry', 'work'],
  study: ['research', 'inquiry', 'paper'],
  paper: ['study', 'write-up', 'sheet'],
  law: ['statute', 'rule', 'act'],
  rule: ['law', 'norm', 'order'],
  policy: ['rule', 'stance', 'line'],
  decision: ['call', 'ruling', 'choice'],
  choice: ['pick', 'option', 'call'],
  option: ['choice', 'pick', 'route'],
  plan: ['scheme', 'design', 'outline'],
  goal: ['aim', 'target', 'end'],
  target: ['aim', 'mark', 'goal'],
  risk: ['hazard', 'chance', 'threat'],
  threat: ['risk', 'danger', 'menace'],
  fight: ['clash', 'struggle', 'bout'],
  war: ['conflict', 'fight', 'campaign'],
  peace: ['calm', 'quiet', 'truce'],
  crime: ['offense', 'wrongdoing', 'felony'],
  police: ['cops', 'officers', 'force'],
  court: ['tribunal', 'bench', 'hearing'],
  judge: ['bench', 'magistrate'],
  trial: ['hearing', 'case', 'proceeding'],
  vote: ['ballot', 'poll', 'tally'],
  election: ['vote', 'poll', 'race'],
  campaign: ['drive', 'push', 'race'],
  leader: ['head', 'chief', 'figure'],
  official: ['officer', 'authority', 'staffer'],
  company: ['firm', 'outfit', 'business'],
  market: ['trade', 'exchange', 'arena'],
  job: ['role', 'gig', 'posting'],
  worker: ['employee', 'staffer', 'laborer'],
  customer: ['client', 'buyer', 'patron'],
  product: ['item', 'offering', 'good'],
  service: ['offering', 'help', 'desk'],
  price: ['cost', 'rate', 'tag'],
  deal: ['pact', 'bargain', 'arrangement'],
  contract: ['pact', 'agreement', 'deal'],
  agreement: ['pact', 'deal', 'accord'],
  statement: ['remark', 'release', 'note'],
  interview: ['talk', 'sit-down', 'q&a'],
  meeting: ['session', 'sit-down', 'huddle'],
  event: ['affair', 'occasion', 'happening'],
  situation: ['setup', 'spot', 'scene'],
  moment: ['instant', 'point', 'spell'],
  period: ['stretch', 'spell', 'interval'],
  history: ['record', 'past', 'chronicle'],
  today: ['this day', 'now'],
  tonight: ['this evening', 'this night'],
  tomorrow: ['the next day', 'the coming day'],
  yesterday: ['the day before', 'the prior day']
});

/* --- lib/phrases.js --- */
StyloDrift.applyPhrases = function (text, persona, rate, rng) {
  var keys = Object.keys(StyloDrift.PHRASES).sort(function (a, b) {
    return b.length - a.length;
  });
  var out = text;
  for (var i = 0; i < keys.length; i++) {
    var from = keys[i];
    var alts = StyloDrift.PHRASES[from].slice();
    var prefer = persona.prefer && persona.prefer[from];
    if (prefer) alts.unshift(prefer);
    var re = new RegExp(StyloDrift.escapeRe(from), 'gi');
    out = out.replace(re, function (m) {
      if (rng() > rate) return m;
      var pick = StyloDrift.pick(rng, alts);
      if (!pick || pick.toLowerCase() === m.toLowerCase()) return m;
      return StyloDrift.matchCase(m, pick);
    });
  }
  return out;
};

/* --- lib/safe.js --- */
StyloDrift.applySafe = function (text, persona, rate, rng) {
  var out = text;
  var keys = Object.keys(StyloDrift.SAFE_PHRASES).sort(function (a, b) {
    return b.length - a.length;
  });
  var i;
  for (i = 0; i < keys.length; i++) {
    var from = keys[i];
    var alts = StyloDrift.SAFE_PHRASES[from];
    var re = new RegExp(StyloDrift.escapeRe(from), 'gi');
    out = out.replace(re, function (m) {
      if (rng() > rate) return m;
      var prefer = persona.prefer && persona.prefer[from];
      var pick = prefer && alts.indexOf(prefer) !== -1 && rng() < 0.7
        ? prefer
        : StyloDrift.pick(rng, alts);
      if (!pick || pick.toLowerCase() === m.toLowerCase()) return m;
      return StyloDrift.matchCase(m, pick);
    });
  }
  out = out.replace(/\b[A-Za-z']+\b/g, function (m) {
    var key = m.toLowerCase();
    var alts = StyloDrift.SAFE_WORDS[key];
    if (!alts) return m;
    if (rng() > rate) return m;
    var prefer = persona.prefer && persona.prefer[key];
    var pick = prefer && alts.indexOf(prefer) !== -1 && rng() < 0.7
      ? prefer
      : StyloDrift.pick(rng, alts);
    if (!pick) return m;
    return StyloDrift.matchCase(m, pick);
  });
  return out;
};

/* --- lib/quality.js --- */
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

/* --- lib/function-words.js --- */
StyloDrift.applyFunctionWords = function (text, persona, rate, rng) {
  return text.replace(/\b[A-Za-z']+\b/g, function (m) {
    var key = m.toLowerCase();
    if (key.length < 2) return m;
    var alts = StyloDrift.FUNCTION_ALTS[key];
    if (!alts) return m;
    if (rng() > rate) return m;
    var prefer = persona.prefer && persona.prefer[key];
    var pick = prefer && rng() < 0.7 ? prefer : StyloDrift.pick(rng, alts);
    if (!pick) return m;
    return StyloDrift.matchCase(m, pick);
  });
};

/* --- lib/synonyms.js --- */
StyloDrift.applySynonyms = function (text, persona, rate, rng) {
  var preferShort = persona.sent === 'short';
  var preferLong = persona.sent === 'long';
  return text.replace(/\b[A-Za-z']+\b/g, function (m) {
    if (m.length <= 5 && m === m.toUpperCase() && /[A-Z]/.test(m)) return m;
    var alts = StyloDrift.SYNONYMS[m.toLowerCase()];
    if (!alts) return m;
    if (rng() > rate) return m;
    var pick;
    if (preferShort && rng() < 0.7) {
      pick = alts.slice().sort(function (a, b) { return a.length - b.length; })[0];
    } else if (preferLong && rng() < 0.7) {
      pick = alts.slice().sort(function (a, b) { return b.length - a.length; })[0];
    } else {
      pick = StyloDrift.pick(rng, alts);
    }
    if (!pick) return m;
    return StyloDrift.matchCase(m, pick);
  });
};

/* --- lib/closed-class.js --- */
StyloDrift.applyClosedClass = function (text, persona, rate, rng) {
  var out = text;
  var verbs =
    'think|thinks|thought|say|says|said|know|knows|knew|believe|believes|believed|' +
    'claim|claims|claimed|show|shows|shown|hope|hopes|hoped|feel|feels|felt|' +
    'argue|argues|argued|admit|admits|admitted|see|sees|saw|find|finds|found';
  out = out.replace(new RegExp('\\b(' + verbs + ')\\s+that\\b', 'gi'), function (m, v) {
    if (rng() < rate) return v;
    return m;
  });
  out = out.replace(/\bthe (\w{3,14}) of (\w{3,14})\b/gi, function (m, x, y) {
    if (/^(the|and|for|not|but|with|from|this|that|they|them|have|been|were|this|those|these)$/i.test(y)) return m;
    if (rng() > rate) return m;
    return y + "'s " + x;
  });
  out = out.replace(/,?\s+and\s+/gi, function (m) {
    if (rng() > rate * 0.42) return m;
    return StyloDrift.pick(rng, [' as well as ', ' plus ', ' along with ', '; ', ' and ']);
  });
  out = out.replace(/\bin the\b/gi, function (m) {
    if (rng() > rate * 0.5) return m;
    return StyloDrift.matchCase(m, StyloDrift.pick(rng, ['within the', 'inside the', 'in the']));
  });
  out = out.replace(/\bon the\b/gi, function (m) {
    if (rng() > rate * 0.45) return m;
    return StyloDrift.matchCase(m, StyloDrift.pick(rng, ['upon the', 'on the']));
  });
  out = out.replace(/\bout of\b/gi, function (m) {
    if (rng() > rate) return m;
    return StyloDrift.matchCase(m, 'from');
  });
  out = out.replace(/\bwith the\b/gi, function (m) {
    if (rng() > rate * 0.4) return m;
    return StyloDrift.matchCase(m, StyloDrift.pick(rng, ['using the', 'via the', 'with the']));
  });
  out = out.replace(/\bby the\b/gi, function (m) {
    if (rng() > rate * 0.4) return m;
    return StyloDrift.matchCase(m, StyloDrift.pick(rng, ['via the', 'through the', 'by the']));
  });
  out = out.replace(/\bfrom the\b/gi, function (m) {
    if (rng() > rate * 0.35) return m;
    return StyloDrift.matchCase(m, StyloDrift.pick(rng, ['out of the', 'from the']));
  });
  out = out.replace(/\bthe\b/gi, function (m) {
    if (rng() > rate * 0.38) return m;
    return StyloDrift.matchCase(m, StyloDrift.pick(rng, ['this', 'that', 'the']));
  });
  out = out.replace(/\ba\b/gi, function (m) {
    if (rng() > rate * 0.18) return m;
    return StyloDrift.matchCase(m, 'one');
  });
  out = out.replace(
    /\b(is|are|was|were)\s+(not\s+)?(important|clear|true|wrong|right|hard|easy|good|bad|likely|possible|necessary|common|serious)\b/gi,
    function (m, cop, notp, adj) {
      if (rng() > rate) return m;
      var alts = {
        is: ['remains', 'stays', 'looks'],
        are: ['remain', 'stay', 'look'],
        was: ['remained', 'stayed', 'looked'],
        were: ['remained', 'stayed', 'looked']
      };
      var pick = StyloDrift.pick(rng, alts[cop.toLowerCase()] || [cop]);
      return pick + ' ' + (notp || '') + adj;
    }
  );
  out = out.replace(/\bto ([A-Za-z']+)\b/g, function (m, v) {
    if (/^(the|a|an|this|that|these|those|my|your|his|her|its|our|their|me|him|us|them|be|being|been|do|have|not|and|or|but|if|as|so)$/i.test(v)) return m;
    if (rng() > rate * 0.22) return m;
    return StyloDrift.pick(rng, ['to ' + v, 'so as to ' + v, 'in order to ' + v]);
  });
  out = out.replace(/\bwhich\b/gi, function (m) {
    if (rng() > rate) return m;
    return StyloDrift.matchCase(m, 'that');
  });
  out = out.replace(/\bthat\b/gi, function (m) {
    if (rng() > rate * 0.28) return m;
    return StyloDrift.matchCase(m, 'which');
  });
  return out;
};

/* --- lib/orthography.js --- */
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

/* --- lib/contractions.js --- */
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

/* --- lib/spelling.js --- */
StyloDrift.SPELLING = [
  ['color', 'colour'],
  ['honor', 'honour'],
  ['behavior', 'behaviour'],
  ['favor', 'favour'],
  ['humor', 'humour'],
  ['labor', 'labour'],
  ['neighbor', 'neighbour'],
  ['rumor', 'rumour'],
  ['center', 'centre'],
  ['theater', 'theatre'],
  ['meter', 'metre'],
  ['fiber', 'fibre'],
  ['liter', 'litre'],
  ['defense', 'defence'],
  ['offense', 'offence'],
  ['license', 'licence'],
  ['organize', 'organise'],
  ['organized', 'organised'],
  ['organizing', 'organising'],
  ['realize', 'realise'],
  ['realized', 'realised'],
  ['analyze', 'analyse'],
  ['analyzed', 'analysed'],
  ['recognize', 'recognise'],
  ['recognized', 'recognised'],
  ['traveling', 'travelling'],
  ['traveled', 'travelled'],
  ['canceled', 'cancelled'],
  ['canceling', 'cancelling'],
  ['aging', 'ageing'],
  ['gray', 'grey'],
  ['toward', 'towards'],
  ['among', 'amongst'],
  ['while', 'whilst'],
  ['fulfill', 'fulfil'],
  ['skillful', 'skilful'],
  ['modeling', 'modelling'],
  ['dialog', 'dialogue'],
  ['catalog', 'catalogue']
];

StyloDrift.applySpelling = function (text, persona, rate, rng) {
  var uk = persona.spelling === 'uk';
  var out = text;
  for (var i = 0; i < StyloDrift.SPELLING.length; i++) {
    var us = StyloDrift.SPELLING[i][0];
    var gb = StyloDrift.SPELLING[i][1];
    if (rng() > rate) continue;
    if (uk) out = StyloDrift.replaceWord(out, us, gb);
    else out = StyloDrift.replaceWord(out, gb, us);
  }
  return out;
};

/* --- lib/syntax.js --- */
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

/* --- lib/punctuation.js --- */
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
  if (persona.formality === 'formal' && rng() < rate * 0.4) {
    out = out.replace(/!+/g, '.');
  }
  return out;
};

/* --- lib/hedges.js --- */
StyloDrift.HEDGES = [
  'I think',
  'I guess',
  'I mean',
  'it seems',
  'it appears',
  'arguably',
  'frankly',
  'honestly',
  'basically',
  'pretty much',
  'sort of',
  'kind of',
  'clearly',
  'obviously',
  'to be fair',
  'in a sense',
  'more or less'
];

StyloDrift.applyHedges = function (text, persona, rate, rng) {
  var out = text;
  var want = persona.hedge;
  var i;
  if (want < 0.2) {
    for (i = 0; i < StyloDrift.HEDGES.length; i++) {
      if (rng() > rate) continue;
      var re = new RegExp('\\b' + StyloDrift.escapeRe(StyloDrift.HEDGES[i]) + '\\b[, ]*', 'gi');
      out = out.replace(re, '');
    }
    out = out.replace(/\s{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1');
    return out;
  }
  if (rng() < rate * want) {
    var sents = StyloDrift.splitSentences(out);
    if (sents.length) {
      var idx = Math.floor(rng() * sents.length);
      var h = StyloDrift.pick(rng, StyloDrift.HEDGES);
      var s = sents[idx];
      if (!new RegExp('\\b' + StyloDrift.escapeRe(h) + '\\b', 'i').test(s)) {
        sents[idx] = h.charAt(0).toUpperCase() + h.slice(1) + ', ' + StyloDrift.lowerStart(s);
        out = StyloDrift.joinSentences(sents);
      }
    }
  }
  return out;
};

/* --- lib/personas.js --- */
StyloDrift.PERSONAS = {
  brisk: {
    id: 'brisk',
    contraction: 0.92,
    spelling: 'us',
    oxford: false,
    dash: 'hyphen',
    sent: 'short',
    sentTarget: 8,
    formality: 'casual',
    hedge: 0.06,
    quotes: 'double',
    numbers: 'digits',
    prefer: {
      however: 'still',
      therefore: 'so',
      although: 'though',
      because: 'cause',
      very: 'super',
      really: 'honestly',
      perhaps: 'maybe'
    }
  },
  clerk: {
    id: 'clerk',
    contraction: 0.05,
    spelling: 'uk',
    oxford: true,
    dash: 'semicolon',
    sent: 'medium',
    sentTarget: 18,
    formality: 'formal',
    hedge: 0.12,
    quotes: 'single',
    numbers: 'words',
    prefer: {
      however: 'nevertheless',
      therefore: 'therefore',
      although: 'although',
      because: 'because',
      very: 'exceedingly',
      really: 'truly',
      perhaps: 'perhaps'
    }
  },
  radio: {
    id: 'radio',
    contraction: 0.55,
    spelling: 'us',
    oxford: false,
    dash: 'em',
    sent: 'medium',
    sentTarget: 14,
    formality: 'casual',
    hedge: 0.2,
    quotes: 'double',
    numbers: 'digits',
    prefer: {
      however: 'that said',
      therefore: 'so',
      although: 'even though',
      because: 'since',
      very: 'really',
      really: 'actually',
      perhaps: 'maybe'
    }
  },
  memo: {
    id: 'memo',
    contraction: 0.08,
    spelling: 'us',
    oxford: true,
    dash: 'en',
    sent: 'long',
    sentTarget: 22,
    formality: 'formal',
    hedge: 0.1,
    quotes: 'double',
    numbers: 'digits',
    prefer: {
      however: 'however',
      therefore: 'therefore',
      although: 'although',
      because: 'given that',
      very: 'highly',
      really: 'truly',
      perhaps: 'possibly'
    }
  },
  slack: {
    id: 'slack',
    contraction: 0.88,
    spelling: 'us',
    oxford: false,
    dash: 'hyphen',
    sent: 'short',
    sentTarget: 9,
    formality: 'casual',
    hedge: 0.45,
    quotes: 'double',
    numbers: 'digits',
    prefer: {
      however: 'still',
      therefore: 'so',
      although: 'though',
      because: 'cause',
      very: 'pretty',
      really: 'honestly',
      perhaps: 'maybe'
    }
  },
  column: {
    id: 'column',
    contraction: 0.2,
    spelling: 'uk',
    oxford: true,
    dash: 'em',
    sent: 'long',
    sentTarget: 20,
    formality: 'formal',
    hedge: 0.18,
    quotes: 'single',
    numbers: 'words',
    prefer: {
      however: 'however',
      therefore: 'thus',
      although: 'whilst',
      because: 'since',
      very: 'rather',
      really: 'honestly',
      perhaps: 'perhaps'
    }
  },
  blunt: {
    id: 'blunt',
    contraction: 0.35,
    spelling: 'us',
    oxford: false,
    dash: 'hyphen',
    sent: 'short',
    sentTarget: 7,
    formality: 'casual',
    hedge: 0.02,
    quotes: 'double',
    numbers: 'digits',
    prefer: {
      however: 'but',
      therefore: 'so',
      although: 'though',
      because: 'because',
      very: 'very',
      really: 'really',
      perhaps: 'maybe'
    }
  },
  wander: {
    id: 'wander',
    contraction: 0.45,
    spelling: 'us',
    oxford: true,
    dash: 'em',
    sent: 'medium',
    sentTarget: 16,
    formality: 'casual',
    hedge: 0.35,
    quotes: 'double',
    numbers: 'words',
    prefer: {
      however: 'even so',
      therefore: 'hence',
      although: 'even though',
      because: 'as',
      very: 'fairly',
      really: 'actually',
      perhaps: 'possibly'
    }
  }
};

StyloDrift.PERSONA_IDS = Object.keys(StyloDrift.PERSONAS);

StyloDrift.pickPersona = function (name, rng) {
  if (name && name !== 'rotate' && StyloDrift.PERSONAS[name]) {
    return StyloDrift.PERSONAS[name];
  }
  return StyloDrift.PERSONAS[StyloDrift.pick(rng, StyloDrift.PERSONA_IDS)];
};

StyloDrift.RATES = {
  1: { safe: 0.45, spell: 0.2, contr: 0.55, punct: 0.2, hedge: 0, syntax: 0 },
  2: { safe: 0.65, spell: 0.35, contr: 0.7, punct: 0.3, hedge: 0, syntax: 0.1 },
  3: { safe: 0.8, spell: 0.5, contr: 0.85, punct: 0.4, hedge: 0.05, syntax: 0.15 },
  4: { safe: 0.92, spell: 0.65, contr: 0.95, punct: 0.5, hedge: 0.08, syntax: 0.2 },
  5: { safe: 1, spell: 0.8, contr: 1, punct: 0.55, hedge: 0.1, syntax: 0.25 }
};

/* --- lib/features.js --- */
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

/* --- lib/engine.js --- */
StyloDrift.LIMIT_SHORT = 280;
StyloDrift.LIMIT_LONG = 25000;

StyloDrift.maxLenFor = function (raw, opts) {
  if (opts && opts.maxLen) return opts.maxLen;
  return raw.length > StyloDrift.LIMIT_SHORT ? StyloDrift.LIMIT_LONG : StyloDrift.LIMIT_SHORT;
};

StyloDrift.fitLength = function (text, maxLen, persona, rng) {
  var out = text;
  if (out.length <= maxLen) return out;
  out = StyloDrift.applyContractions(out, { contraction: 1 }, 1, rng);
  if (out.length <= maxLen) return out;
  return out.length > maxLen ? out.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…' : out;
};

StyloDrift.driftChunk = function (chunk, persona, rates, rng) {
  var masked = StyloDrift.protect(chunk);
  var body = masked.text;
  var wc = StyloDrift.wordCount(chunk);
  body = StyloDrift.applySafe(body, persona, rates.safe, rng);
  body = StyloDrift.applyContractions(body, persona, rates.contr, rng);
  body = StyloDrift.applySpelling(body, persona, rates.spell, rng);
  body = StyloDrift.applyPunctuation(body, persona, rates.punct, rng);
  if (wc > 55) body = StyloDrift.applySyntax(body, persona, rates.syntax * 0.35, rng);
  if (wc > 90) body = StyloDrift.applyHedges(body, persona, rates.hedge * 0.4, rng);
  body = StyloDrift.unprotect(body, masked.slots);
  body = body.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/ {2,}/g, ' ');
  body = body.replace(/,\s*;/g, ';').replace(/;\s*,/g, ';').replace(/,\s*,/g, ',');
  return body.trim();
};

StyloDrift.driftOnce = function (raw, persona, rates, rng, maxLen) {
  var parts = String(raw).split(/(\n+)/);
  var out = [];
  var i;
  for (i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    if (/^\n+$/.test(parts[i])) out.push(parts[i]);
    else out.push(StyloDrift.driftChunk(parts[i], persona, rates, rng));
  }
  return StyloDrift.fitLength(out.join(''), maxLen, persona, rng);
};

StyloDrift.drift = function (text, opts) {
  opts = opts || {};
  var raw = String(text || '');
  if (!raw.trim()) {
    return { text: raw, persona: null, scores: { pinc3: 0, pinc1w: 0, func: 0 } };
  }
  var intensity = opts.intensity || 5;
  if (intensity < 1) intensity = 1;
  if (intensity > 5) intensity = 5;
  var seed = opts.seed == null ? Date.now() : opts.seed;
  var persona = StyloDrift.pickPersona(opts.persona, StyloDrift.makeRng(seed));
  var rates = StyloDrift.RATES[intensity];
  var maxLen = StyloDrift.maxLenFor(raw, opts);
  var body = StyloDrift.driftOnce(raw, persona, rates, StyloDrift.makeRng(seed), maxLen);
  if (!StyloDrift.qualityOk(raw, body)) {
    var mild = Object.assign({}, rates, { safe: 1, contr: 1, spell: 0.5, punct: 0, syntax: 0, hedge: 0 });
    body = StyloDrift.driftOnce(raw, persona, mild, StyloDrift.makeRng(seed + 3), maxLen);
  }
  if (!StyloDrift.qualityOk(raw, body)) body = raw;
  return { text: body, persona: persona.id, scores: StyloDrift.score(raw, body), seed: seed };
};

/* --- ui/settings.js --- */
StyloDrift.DEFAULTS = {
  enabled: true,
  auto: true,
  intensity: 5,
  persona: 'rotate',
  showScore: true
};

StyloDrift._storeGet = function (key, fallback) {
  try {
    if (typeof GM !== 'undefined' && GM.getValue) {
      return Promise.resolve(GM.getValue(key, fallback));
    }
  } catch (e1) {}
  try {
    if (typeof GM_getValue === 'function') {
      return Promise.resolve(GM_getValue(key, fallback));
    }
  } catch (e2) {}
  try {
    var v = localStorage.getItem(key);
    return Promise.resolve(v ? JSON.parse(v) : fallback);
  } catch (e3) {
    return Promise.resolve(fallback);
  }
};

StyloDrift._storeSet = function (key, value) {
  try {
    if (typeof GM !== 'undefined' && GM.setValue) {
      return Promise.resolve(GM.setValue(key, value));
    }
  } catch (e1) {}
  try {
    if (typeof GM_setValue === 'function') {
      GM_setValue(key, value);
      return Promise.resolve();
    }
  } catch (e2) {}
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e3) {}
  return Promise.resolve();
};

StyloDrift.settings = Object.assign({}, StyloDrift.DEFAULTS);

StyloDrift.loadSettings = function () {
  var loaded = StyloDrift._storeGet('sd-settings', StyloDrift.DEFAULTS).then(function (raw) {
    var s = raw && typeof raw === 'object' ? raw : {};
    StyloDrift.settings = Object.assign({}, StyloDrift.DEFAULTS, s);
    return StyloDrift.settings;
  }).catch(function () {
    return StyloDrift.settings;
  });
  return Promise.race([
    loaded,
    new Promise(function (resolve) {
      setTimeout(function () { resolve(StyloDrift.settings); }, 300);
    })
  ]);
};

StyloDrift.saveSettings = function () {
  return StyloDrift._storeSet('sd-settings', StyloDrift.settings);
};

/* --- ui/composer.js --- */
StyloDrift.pageWin = function () {
  try {
    if (typeof unsafeWindow !== 'undefined' && unsafeWindow) return unsafeWindow;
  } catch (e) {}
  return window;
};

StyloDrift.composerEl = function (node) {
  if (!node) return null;
  if (node.getAttribute && node.getAttribute('contenteditable') === 'true') return node;
  var inner = node.querySelector && node.querySelector('[contenteditable="true"]');
  return inner || node;
};

StyloDrift.findComposers = function (root) {
  var base = root || document;
  var sel =
    '[data-testid^="tweetTextarea_"], [data-testid="dmComposerTextInput"], ' +
    '[aria-label="Post text"], [aria-label="Tweet text"], [aria-label="Reply"]';
  var nodes = base.querySelectorAll(sel);
  var out = [];
  var i;
  for (i = 0; i < nodes.length; i++) {
    var el = StyloDrift.composerEl(nodes[i]);
    if (el && out.indexOf(el) === -1) out.push(el);
  }
  var boxes = base.querySelectorAll('[role="textbox"][contenteditable="true"]');
  for (i = 0; i < boxes.length; i++) {
    var b = boxes[i];
    if (b.closest && b.closest('[data-testid="SearchBox_Search_Input"]')) continue;
    if (b.getAttribute('data-testid') && /search/i.test(b.getAttribute('data-testid'))) continue;
    if (out.indexOf(b) === -1) out.push(b);
  }
  return out;
};

StyloDrift.readComposer = function (el) {
  var ed = StyloDrift.composerEl(el);
  if (!ed) return '';
  return (ed.innerText || ed.textContent || '').replace(/\u00a0/g, ' ').replace(/\n+$/, '');
};

StyloDrift._selectAll = function (ed) {
  var win = StyloDrift.pageWin();
  var doc = ed.ownerDocument;
  ed.focus();
  try {
    var sel = (win.getSelection && win.getSelection()) || doc.getSelection();
    var range = doc.createRange();
    range.selectNodeContents(ed);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (e) {}
  try {
    doc.execCommand('selectAll', false, null);
  } catch (e2) {}
};

StyloDrift.writeComposer = function (el, text) {
  var ed = StyloDrift.composerEl(el);
  if (!ed) return;
  var win = StyloDrift.pageWin();
  var doc = ed.ownerDocument;
  StyloDrift._selectAll(ed);
  var ok = false;
  try {
    ok = doc.execCommand('insertText', false, text);
  } catch (e) {}
  var now = StyloDrift.readComposer(ed);
  if (ok && now && now.replace(/\s+/g, ' ').indexOf(String(text).slice(0, 24).replace(/\s+/g, ' ')) !== -1) return;
  try {
    var DT = win.DataTransfer || DataTransfer;
    var CE = win.ClipboardEvent || ClipboardEvent;
    var dt = new DT();
    dt.setData('text/plain', text);
    var ev = new CE('paste', { bubbles: true, cancelable: true });
    try {
      Object.defineProperty(ev, 'clipboardData', { value: dt });
    } catch (e2) {}
    ed.dispatchEvent(ev);
  } catch (e3) {}
  now = StyloDrift.readComposer(ed);
  if (now && now.replace(/\s+/g, ' ').indexOf(String(text).slice(0, 24).replace(/\s+/g, ' ')) !== -1) return;
  try {
    ed.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true, cancelable: true, inputType: 'insertText', data: text
    }));
    ed.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
  } catch (e4) {}
  now = StyloDrift.readComposer(ed);
  if (now && now.replace(/\s+/g, ' ').indexOf(String(text).slice(0, 24).replace(/\s+/g, ' ')) !== -1) return;
  while (ed.firstChild) ed.removeChild(ed.firstChild);
  ed.appendChild(doc.createTextNode(text));
  ed.dispatchEvent(new Event('input', { bubbles: true }));
};

StyloDrift.composerRoot = function (el) {
  var n = el;
  var i;
  for (i = 0; i < 16 && n; i++) {
    if (n.querySelector && n.querySelector('[data-testid="toolBar"]')) return n;
    n = n.parentElement;
  }
  return el.parentElement || el;
};

StyloDrift._state = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

StyloDrift.getState = function (el) {
  if (!StyloDrift._state) return null;
  return StyloDrift._state.get(el) || null;
};

StyloDrift.setState = function (el, st) {
  if (StyloDrift._state) StyloDrift._state.set(el, st);
};

StyloDrift.activeComposer = function () {
  var a = document.activeElement;
  if (a) {
    var box = a.closest && a.closest('[data-testid^="tweetTextarea_"], [contenteditable="true"]');
    if (box) return StyloDrift.composerEl(box);
  }
  var list = StyloDrift.findComposers(document);
  return list.length ? list[0] : null;
};

/* --- ui/panel.js --- */
StyloDrift.injectCss = function () {
  if (document.getElementById('sd-style')) return;
  var css = document.createElement('style');
  css.id = 'sd-style';
  css.textContent = [
    '.sd-btn{background:transparent;border:1px solid #1d9bf0;color:#1d9bf0;border-radius:9999px;padding:2px 10px;font-size:13px;font-weight:700;cursor:pointer;margin-right:8px;line-height:24px;font-family:inherit}',
    '.sd-btn:hover{background:rgba(29,155,240,0.1)}',
    '.sd-score{font-size:11px;color:#8b98a5;margin-right:8px;white-space:nowrap}',
    '.sd-wrap{display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin:4px 8px}',
    '#sd-hud{position:fixed;right:16px;bottom:72px;z-index:2147483646;display:flex;flex-wrap:wrap;align-items:center;gap:6px;max-width:min(420px,calc(100vw - 24px));background:#15202b;color:#e7e9ea;border:1px solid #1d9bf0;border-radius:12px;padding:8px 10px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,0.45)}',
    '#sd-hud strong{margin-right:4px}',
    '.sd-panel{position:fixed;right:16px;bottom:16px;z-index:2147483647;width:280px;background:#15202b;color:#e7e9ea;border:1px solid #38444d;border-radius:12px;padding:14px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,0.4)}',
    '.sd-panel h2{margin:0 0 10px;font-size:16px}',
    '.sd-panel label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0;flex-wrap:wrap}',
    '.sd-panel select,.sd-panel input[type=range]{flex:1;min-width:120px}',
    '.sd-panel .sd-row{color:#8b98a5;font-size:12px;margin-top:8px}',
    '.sd-panel button{margin-top:8px;background:#1d9bf0;border:0;color:#fff;border-radius:9999px;padding:6px 12px;font-weight:700;cursor:pointer}'
  ].join('');
  document.documentElement.appendChild(css);
};

StyloDrift.togglePanel = function () {
  var existing = document.getElementById('sd-panel');
  if (existing) {
    existing.remove();
    return;
  }
  var s = StyloDrift.settings;
  var panel = document.createElement('div');
  panel.id = 'sd-panel';
  panel.className = 'sd-panel';
  panel.innerHTML =
    '<h2>Stylo Drift</h2>' +
    '<label>Enabled <input id="sd-en" type="checkbox"' + (s.enabled ? ' checked' : '') + '></label>' +
    '<label>Rewrite on Post <input id="sd-auto" type="checkbox"' + (s.auto ? ' checked' : '') + '></label>' +
    '<label>Intensity <input id="sd-int" type="range" min="1" max="5" step="1" value="' + s.intensity + '"></label>' +
    '<div class="sd-row" id="sd-intv">Level ' + s.intensity + '</div>' +
    '<label>Persona <select id="sd-per"></select></label>' +
    '<label>Show score <input id="sd-sc" type="checkbox"' + (s.showScore ? ' checked' : '') + '></label>' +
    '<div class="sd-row">Compute: this tab, no server.</div>' +
    '<button type="button" id="sd-close">Close</button>';
  document.body.appendChild(panel);
  var sel = panel.querySelector('#sd-per');
  var ids = ['rotate'].concat(StyloDrift.PERSONA_IDS);
  var i;
  for (i = 0; i < ids.length; i++) {
    var opt = document.createElement('option');
    opt.value = ids[i];
    opt.textContent = ids[i];
    if (ids[i] === s.persona) opt.selected = true;
    sel.appendChild(opt);
  }
  function sync() {
    StyloDrift.settings.enabled = panel.querySelector('#sd-en').checked;
    StyloDrift.settings.auto = panel.querySelector('#sd-auto').checked;
    StyloDrift.settings.intensity = parseInt(panel.querySelector('#sd-int').value, 10);
    StyloDrift.settings.persona = panel.querySelector('#sd-per').value;
    StyloDrift.settings.showScore = panel.querySelector('#sd-sc').checked;
    panel.querySelector('#sd-intv').textContent = 'Level ' + StyloDrift.settings.intensity;
    StyloDrift.saveSettings();
  }
  panel.addEventListener('change', sync);
  panel.addEventListener('input', sync);
  panel.querySelector('#sd-close').addEventListener('click', function () {
    panel.remove();
  });
};

/* --- ui/hud.js --- */
StyloDrift.injectHud = function () {
  if (document.getElementById('sd-hud')) return;
  var hud = document.createElement('div');
  hud.id = 'sd-hud';
  hud.innerHTML =
    '<strong>Stylo Drift</strong>' +
    '<button type="button" class="sd-btn" id="sd-hud-drift">Drift</button>' +
    '<button type="button" class="sd-btn" id="sd-hud-undo">Undo</button>' +
    '<button type="button" class="sd-btn" id="sd-hud-cfg">Settings</button>' +
    '<span class="sd-score" id="sd-hud-score">on</span>';
  document.documentElement.appendChild(hud);
  function swallow(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
  hud.addEventListener('mousedown', swallow, true);
  hud.addEventListener('pointerdown', swallow, true);
  function stop(e) {
    e.preventDefault();
    swallow(e);
  }
  document.getElementById('sd-hud-drift').addEventListener('click', function (e) {
    stop(e);
    var el = StyloDrift.activeComposer();
    if (!el) {
      document.getElementById('sd-hud-score').textContent = 'no composer';
      return;
    }
    var res = StyloDrift.driftComposer(el);
    document.getElementById('sd-hud-score').textContent = res
      ? StyloDrift._formatScore(res)
      : 'empty box';
  });
  document.getElementById('sd-hud-undo').addEventListener('click', function (e) {
    stop(e);
    var el = StyloDrift.activeComposer();
    if (el) StyloDrift.undoComposer(el);
    document.getElementById('sd-hud-score').textContent = 'undone';
  });
  document.getElementById('sd-hud-cfg').addEventListener('click', function (e) {
    stop(e);
    StyloDrift.togglePanel();
  });
};

StyloDrift.updateHud = function (msg) {
  var el = document.getElementById('sd-hud-score');
  if (!el) return;
  if (msg) el.textContent = msg;
  else el.textContent = StyloDrift.settings.enabled ? 'on' : 'off';
};

/* --- ui/toolbar.js --- */
StyloDrift._formatScore = function (res) {
  if (!res || !res.scores) return '';
  return res.persona + ' · n-gram ' + res.scores.pinc3 + '% · func ' + res.scores.func + '%';
};

StyloDrift.driftComposer = function (el, forceSeed) {
  var original = StyloDrift.readComposer(el);
  if (!original.trim()) return null;
  var prev = StyloDrift.getState(el);
  var src = original;
  if (prev && prev.drifted === original && prev.original) src = prev.original;
  var res = StyloDrift.drift(src, {
    intensity: StyloDrift.settings.intensity,
    persona: StyloDrift.settings.persona,
    seed: forceSeed
  });
  StyloDrift.writeComposer(el, res.text);
  StyloDrift.setState(el, { original: src, drifted: res.text, scores: res.scores, persona: res.persona });
  return res;
};

StyloDrift.undoComposer = function (el) {
  var prev = StyloDrift.getState(el);
  if (!prev || !prev.original) return;
  StyloDrift.writeComposer(el, prev.original);
  StyloDrift.setState(el, { original: prev.original, drifted: null, scores: null, persona: null });
};

StyloDrift.injectToolbar = function (composer) {
  var root = StyloDrift.composerRoot(composer);
  if (!root) return;
  var bar = root.querySelector('[data-testid="toolBar"]');
  if (!bar) return;
  if (bar.querySelector('.sd-wrap')) return;
  var wrap = document.createElement('div');
  wrap.className = 'sd-wrap';
  var driftBtn = document.createElement('button');
  driftBtn.type = 'button';
  driftBtn.className = 'sd-btn';
  driftBtn.textContent = 'Drift';
  var undoBtn = document.createElement('button');
  undoBtn.type = 'button';
  undoBtn.className = 'sd-btn';
  undoBtn.textContent = 'Undo';
  var score = document.createElement('span');
  score.className = 'sd-score';
  wrap.appendChild(driftBtn);
  wrap.appendChild(undoBtn);
  wrap.appendChild(score);
  bar.insertBefore(wrap, bar.firstChild);
  function stop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
  wrap.addEventListener('mousedown', stop, true);
  wrap.addEventListener('pointerdown', stop, true);
  driftBtn.addEventListener('click', function (e) {
    stop(e);
    if (!StyloDrift.settings.enabled) return;
    var res = StyloDrift.driftComposer(composer);
    if (res && StyloDrift.settings.showScore) score.textContent = StyloDrift._formatScore(res);
    if (res) StyloDrift.updateHud(StyloDrift._formatScore(res));
  });
  undoBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    StyloDrift.undoComposer(composer);
    score.textContent = '';
  });
};

StyloDrift.scan = function () {
  StyloDrift.injectCss();
  StyloDrift.injectHud();
  var list = StyloDrift.findComposers(document);
  var i;
  for (i = 0; i < list.length; i++) StyloDrift.injectToolbar(list[i]);
};

/* --- ui/intercept.js --- */
StyloDrift._posting = false;

StyloDrift._isPostButton = function (el) {
  if (!el || !el.closest) return null;
  return el.closest('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');
};

StyloDrift.rewriteAllOpen = function () {
  var list = StyloDrift.findComposers(document);
  var i;
  var last = null;
  for (i = 0; i < list.length; i++) {
    var el = list[i];
    var text = StyloDrift.readComposer(el);
    if (!text.trim()) continue;
    var st = StyloDrift.getState(el);
    if (st && st.drifted === text) continue;
    last = StyloDrift.driftComposer(el);
  }
  return last;
};

StyloDrift._guardPost = function (e) {
  if (StyloDrift._posting) return false;
  if (!StyloDrift.settings.enabled || !StyloDrift.settings.auto) return false;
  var btn = StyloDrift._isPostButton(e.target);
  if (!btn) return false;
  if (btn.getAttribute('aria-disabled') === 'true') return false;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  StyloDrift.rewriteAllOpen();
  StyloDrift._posting = true;
  setTimeout(function () {
    btn.click();
    setTimeout(function () {
      StyloDrift._posting = false;
    }, 500);
  }, 80);
  return true;
};

StyloDrift.armIntercept = function () {
  document.addEventListener('click', StyloDrift._guardPost, true);
  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    StyloDrift._guardPost(e);
  }, true);

  document.addEventListener('keydown', function (e) {
    if (StyloDrift._posting) return;
    if (!StyloDrift.settings.enabled) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (!StyloDrift.settings.auto) return;
      var active = document.activeElement;
      if (!active || !active.closest('[data-testid^="tweetTextarea_"]')) return;
      e.preventDefault();
      e.stopPropagation();
      StyloDrift.rewriteAllOpen();
      StyloDrift._posting = true;
      var btn = document.querySelector('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
      setTimeout(function () {
        if (btn) btn.click();
        setTimeout(function () { StyloDrift._posting = false; }, 400);
      }, 40);
    }
    if (e.altKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      var el = document.activeElement;
      var box = el && el.closest && el.closest('[data-testid^="tweetTextarea_"]');
      if (box) {
        e.preventDefault();
        StyloDrift.driftComposer(StyloDrift.composerEl(box));
      }
    }
  }, true);
};

/* --- ui/main.js --- */
StyloDrift.start = function () {
  if (StyloDrift._started) return;
  StyloDrift._started = true;
  StyloDrift.injectCss();
  StyloDrift.injectHud();
  StyloDrift.armIntercept();
  StyloDrift.scan();
  var t = 0;
  var obs = new MutationObserver(function () {
    if (t) return;
    t = 1;
    setTimeout(function () {
      t = 0;
      StyloDrift.scan();
    }, 80);
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  StyloDrift.loadSettings().then(function () {
    StyloDrift.updateHud();
    StyloDrift.scan();
  });
  try {
    var menu = typeof GM !== 'undefined' && GM.registerMenuCommand
      ? GM.registerMenuCommand
      : (typeof GM_registerMenuCommand === 'function' ? GM_registerMenuCommand : null);
    if (menu) {
      menu('Stylo Drift: settings', StyloDrift.togglePanel);
      menu('Stylo Drift: toggle auto', function () {
        StyloDrift.settings.auto = !StyloDrift.settings.auto;
        StyloDrift.saveSettings();
        StyloDrift.updateHud(StyloDrift.settings.auto ? 'auto on' : 'auto off');
      });
    }
  } catch (e) {}
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', StyloDrift.start);
  } else {
    StyloDrift.start();
  }
}

})();
