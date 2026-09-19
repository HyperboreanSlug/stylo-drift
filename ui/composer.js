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
