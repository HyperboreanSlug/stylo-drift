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
