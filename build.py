#!/usr/bin/env python3
"""Concat source modules into stylo-drift.user.js."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent

HEADER = """\
// ==UserScript==
// @name         Stylo Drift
// @namespace    local.stylo-drift
// @version      1.3.2
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
"""

ENGINE = [
    "lib/util.js",
    "lib/rng.js",
    "lib/protect.js",
    "lib/sentences.js",
    "data/phrases.js",
    "data/safe-swaps.js",
    "data/function-alts.js",
    "data/synonyms.js",
    "data/synonyms-more.js",
    "lib/phrases.js",
    "lib/safe.js",
    "lib/quality.js",
    "lib/function-words.js",
    "lib/synonyms.js",
    "lib/closed-class.js",
    "lib/orthography.js",
    "lib/contractions.js",
    "lib/spelling.js",
    "lib/syntax.js",
    "lib/punctuation.js",
    "lib/hedges.js",
    "lib/personas.js",
    "lib/features.js",
    "lib/engine.js",
]

UI = [
    "ui/settings.js",
    "ui/composer.js",
    "ui/panel.js",
    "ui/hud.js",
    "ui/toolbar.js",
    "ui/intercept.js",
    "ui/main.js",
]


def concat(paths):
    chunks = []
    for rel in paths:
        body = (ROOT / rel).read_text(encoding="utf-8")
        chunks.append("/* --- %s --- */\n%s" % (rel, body.rstrip()))
    return "\n\n".join(chunks) + "\n"


def main():
    engine = concat(ENGINE)
    full = (
        HEADER
        + "\n(function () {\n'use strict';\nvar StyloDrift = {};\n\n"
        + concat(ENGINE + UI)
        + "\n})();\n"
    )
    (ROOT / "stylo-drift.user.js").write_text(full, encoding="utf-8")
    (ROOT / "engine-bundle.js").write_text(
        "var StyloDrift = {};\n\n" + engine, encoding="utf-8"
    )
    print("wrote stylo-drift.user.js and engine-bundle.js")


if __name__ == "__main__":
    main()
