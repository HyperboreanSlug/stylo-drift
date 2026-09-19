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

StyloDrift.isVisible = function (el) {
  if (!el || !el.getBoundingClientRect) return false;
  var r = el.getBoundingClientRect();
  return r.width > 1 && r.height > 1;
};

StyloDrift.composeScope = function () {
  var dialogs = document.querySelectorAll('[role="dialog"]');
  var i;
  for (i = 0; i < dialogs.length; i++) {
    var d = dialogs[i];
    if (d.querySelector('[data-testid^="tweetTextarea_"], [role="textbox"][contenteditable="true"]')) {
      return d;
    }
  }
  return document;
};

StyloDrift.findComposers = function (root) {
  var base = root || StyloDrift.composeScope();
  var sel =
    '[data-testid^="tweetTextarea_"], [data-testid="dmComposerTextInput"], ' +
    '[aria-label="Post text"], [aria-label="Tweet text"], [aria-label="Reply"], ' +
    '[aria-label="Add a comment"], [aria-label="Quote"], [aria-label="What is happening?!"], ' +
    '[aria-label="What\'s happening?"], [aria-label="Add another post"]';
  var nodes = base.querySelectorAll(sel);
  var out = [];
  var i;
  function add(el) {
    var ed = StyloDrift.composerEl(el);
    if (!ed || !StyloDrift.isVisible(ed)) return;
    if (ed.closest && ed.closest('[data-testid="SearchBox_Search_Input"]')) return;
    if (out.indexOf(ed) === -1) out.push(ed);
  }
  for (i = 0; i < nodes.length; i++) add(nodes[i]);
  var boxes = base.querySelectorAll('[role="textbox"][contenteditable="true"]');
  for (i = 0; i < boxes.length; i++) add(boxes[i]);
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

StyloDrift._lastComposer = null;

StyloDrift.trackComposer = function (el) {
  var ed = StyloDrift.composerEl(el);
  if (ed && StyloDrift.isVisible(ed)) StyloDrift._lastComposer = ed;
};

StyloDrift.activeComposer = function () {
  var last = StyloDrift._lastComposer;
  if (last && last.isConnected && StyloDrift.isVisible(last)) return last;
  var a = document.activeElement;
  if (a && a.closest) {
    var box = a.closest('[data-testid^="tweetTextarea_"], [role="textbox"][contenteditable="true"]');
    if (box) {
      var ed = StyloDrift.composerEl(box);
      if (ed && StyloDrift.isVisible(ed)) return ed;
    }
  }
  var list = StyloDrift.findComposers();
  var i;
  for (i = 0; i < list.length; i++) {
    if (StyloDrift.readComposer(list[i]).trim()) return list[i];
  }
  return list.length ? list[0] : null;
};
