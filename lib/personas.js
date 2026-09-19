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
