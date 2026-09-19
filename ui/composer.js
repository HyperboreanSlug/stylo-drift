StyloDrift.composerEl = function (node) {
  if (!node) return null;
  if (node.getAttribute && node.getAttribute('contenteditable') === 'true') return node;
  var inner = node.querySelector && node.querySelector('[contenteditable="true"]');
  return inner || node;
};

StyloDrift.findComposers = function (root) {
  var base = root || document;
  var nodes = base.querySelectorAll('[data-testid^="tweetTextarea_"]');
  var out = [];
  var i;
  for (i = 0; i < nodes.length; i++) {
    var el = StyloDrift.composerEl(nodes[i]);
    if (el && out.indexOf(el) === -1) out.push(el);
  }
  var dm = base.querySelectorAll('[data-testid="dmComposerTextInput"]');
  for (i = 0; i < dm.length; i++) {
    var d = StyloDrift.composerEl(dm[i]);
    if (d && out.indexOf(d) === -1) out.push(d);
  }
  return out;
};

StyloDrift.readComposer = function (el) {
  var ed = StyloDrift.composerEl(el);
  if (!ed) return '';
  return (ed.innerText || ed.textContent || '').replace(/\u00a0/g, ' ').replace(/\n+$/, '');
};

StyloDrift.writeComposer = function (el, text) {
  var ed = StyloDrift.composerEl(el);
  if (!ed) return;
  ed.focus();
  var sel = window.getSelection();
  var range = document.createRange();
  range.selectNodeContents(ed);
  sel.removeAllRanges();
  sel.addRange(range);
  var ok = false;
  try {
    ok = document.execCommand('insertText', false, text);
  } catch (e) {}
  if (!ok) {
    ed.textContent = text;
    ed.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
  }
};

StyloDrift.composerRoot = function (el) {
  var n = el;
  var i;
  for (i = 0; i < 14 && n; i++) {
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
