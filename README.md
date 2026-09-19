# Stylo Drift

[Install Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/) → [**Install Stylo Drift**](../../raw/main/stylo-drift.user.js)

Firefox: Greasemonkey or Violentmonkey first, then the install link. The manager prompts automatically.

On `x.com` a **Stylo Drift** chip sits at the bottom right. If that chip is missing, the script is not running on the page (enable it for x.com in the monkey menu, then refresh). Type a post (including quote tweets and replies), click **Drift** on the chip.

Greasemonkey userscript. Rewrites compose/reply text on X so function-word rates, character n-grams, punctuation, contractions, spelling, and sentence length move away from your baseline.

Compute: the X tab’s JavaScript. No GPU, no API, no local model. A tweet rewrite is a few milliseconds of string passes.

## Install (about 2 minutes)

1. [Install Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/) (Violentmonkey also works).
2. Click **[Install Stylo Drift](../../raw/main/stylo-drift.user.js)** and confirm in the manager.
3. Open `https://x.com`, type a post, click **Post**. The script rewrites first.

Rebuild after source edits:

```
python3 build.py
```

Then reload the script in Greasemonkey.

## Controls

- **Drift** on the compose toolbar: rewrite now, keep original for Undo.
- **Undo**: restore the last original.
- **Alt+Shift+D**: rewrite the focused composer.
- Greasemonkey menu: settings (intensity 1–5, persona, auto-on-post).

Default: auto-on-post on, intensity 5, persona `rotate` (a different style target each rewrite).

URLs, `@mentions`, `#hashtags`, and `$cashtags` are left intact. Posts at or under 280 stay in that budget. Posts over 280 keep paragraph breaks and may run up to 25,000 characters (X long-form). If you already installed an older copy, set intensity to 5 in the Greasemonkey menu.

## Offline check

Open `lab/lab.html` and click Drift. Same engine, no X.

## Source

See `SOURCE.md` for the module map. `build.py` concatenates `lib/`, `data/`, and `ui/` into `stylo-drift.user.js`.

## Tests

```
python3 build.py
node tests/engine.test.js
```
