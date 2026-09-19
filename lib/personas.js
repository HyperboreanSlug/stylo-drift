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
      really: 'pretty',
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
      really: 'indeed',
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
      really: 'in fact',
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
      really: 'kinda',
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
      really: 'quite',
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
  1: { phrase: 0.25, func: 0.2, syn: 0.12, spell: 0.25, contr: 0.4, punct: 0.3, hedge: 0.12, syntax: 0.18, closed: 0.2, ortho: 0.2, passes: 1 },
  2: { phrase: 0.4, func: 0.35, syn: 0.22, spell: 0.4, contr: 0.55, punct: 0.45, hedge: 0.2, syntax: 0.3, closed: 0.35, ortho: 0.35, passes: 1 },
  3: { phrase: 0.6, func: 0.55, syn: 0.4, spell: 0.55, contr: 0.75, punct: 0.6, hedge: 0.3, syntax: 0.5, closed: 0.55, ortho: 0.5, passes: 1 },
  4: { phrase: 0.85, func: 0.8, syn: 0.62, spell: 0.75, contr: 0.92, punct: 0.75, hedge: 0.45, syntax: 0.7, closed: 0.75, ortho: 0.7, passes: 2 },
  5: { phrase: 1, func: 0.95, syn: 0.85, spell: 0.9, contr: 0.98, punct: 0.9, hedge: 0.6, syntax: 0.9, closed: 0.92, ortho: 0.88, passes: 2 }
};
