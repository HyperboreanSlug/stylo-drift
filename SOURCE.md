# SOURCE

Standalone Greasemonkey userscript. Rewrites compose/reply text on X so stylometric features drift. All work runs in the page; no server, no model.

Install artifact: `stylo-drift.user.js` (built by `build.py` from the modules below).

## Layout

```
data/          lookup tables (phrases, function-word alts, content synonyms)
lib/           rewrite engine
ui/            X.com composer hook, toolbar, post intercept, settings panel
lab/           offline paste-and-drift page
tests/         node engine checks
build.py       concatenates modules into stylo-drift.user.js
```

## data/

| File | Function | Purpose |
|------|----------|---------|
| `data/phrases.js` | Multi-word paraphrase pairs | Break word n-grams and function-word sequences |
| `data/function-alts.js` | Koppel-style function-word substitutes | Shift the strongest classical authorship features |
| `data/synonyms.js` | Content-word substitutes (A) | Shift character n-grams and vocabulary |
| `data/synonyms-more.js` | Content-word substitutes (B) | Rest of the synonym table |

## lib/

| File | Function | Purpose |
|------|----------|---------|
| `lib/util.js` | Case-preserving word/phrase replace | Shared string ops |
| `lib/rng.js` | Seeded RNG | Repeatable rerolls |
| `lib/protect.js` | Mask URLs, @, #, $ | Keep tweet mechanics intact |
| `lib/sentences.js` | Split/join sentences | Syntax layer input |
| `lib/phrases.js` | Apply phrase table | Lexical n-gram break |
| `lib/function-words.js` | Apply function-word table | Attribution-feature shift |
| `lib/synonyms.js` | Apply content synonyms | Vocabulary / char-n-gram shift |
| `lib/closed-class.js` | the/and/that/of/in/to patterned rewrites | Writeprints / Koppel function-word kill |
| `lib/orthography.js` | anymore/into/cannot spacing flips | Character n-gram break |
| `lib/contractions.js` | Expand or contract | Orthography + char n-grams |
| `lib/spelling.js` | US/UK spelling | Orthography fingerprint |
| `lib/syntax.js` | Split, merge, clause invert | Sentence-length and structure |
| `lib/punctuation.js` | Oxford comma, dashes, quotes, numbers | Punctuation fingerprint |
| `lib/hedges.js` | Insert or strip hedges | Discourse-marker fingerprint |
| `lib/personas.js` | Named style targets + rates | Imitation instead of random noise |
| `lib/features.js` | PINC and function-word distance | Score the rewrite |
| `lib/engine.js` | `StyloDrift.drift()` | Paragraph-safe pipeline; 280 or 25,000 cap |

## ui/

| File | Function | Purpose |
|------|----------|---------|
| `ui/settings.js` | Load/save options | Greasemonkey storage with fallbacks |
| `ui/composer.js` | Find, read, fill X editor | Lexical contenteditable I/O |
| `ui/panel.js` | Settings drawer | Intensity, persona, auto-on-post |
| `ui/hud.js` | Fixed overlay controls | Survives React wiping the compose toolbar |
| `ui/toolbar.js` | Drift / Undo on the compose bar | Manual reroll |
| `ui/intercept.js` | Rewrite before Post / Ctrl+Enter | Default path so style does not leak |
| `ui/main.js` | MutationObserver bootstrap | SPA-safe inject |

## lab/

| File | Function | Purpose |
|------|----------|---------|
| `lab/lab.html` | Paste text, run engine | Test without X |

## tests/

| File | Function | Purpose |
|------|----------|---------|
| `tests/engine.test.js` | Node assertions | Drift, protect, length |
