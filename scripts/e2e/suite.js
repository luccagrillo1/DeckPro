// Runs inside the DeckPro page (injected by scripts/e2e/run.js). Uses the
// real UI — clicks buttons, types into the editors — and checks the app's
// state after each step. Returns { results, exportExpect } for run.js, which
// then decodes what Export actually wrote.
async function deckproE2E(opts) {
  const results = [];
  const errors = [];
  window.addEventListener('error', e => errors.push(e.message));
  window.addEventListener('unhandledrejection', e => errors.push('unhandled: ' + (e.reason?.message || e.reason)));
  window.confirm = () => true;           // "Add speaker?" etc. — say yes
  window.alert = () => {};
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];
  const waitFor = async (fn, ms = 5000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { try { const v = fn(); if (v) return v; } catch (_) {} await sleep(50); }
    return null;
  };
  const click = async (sel) => {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (!el) throw new Error(`no element ${sel}`);
    el.scrollIntoView?.({ block: 'center' });
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.click();
    await sleep(60);
    return el;
  };
  const type = async (sel, text, { clear = true } = {}) => {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (!el) throw new Error(`no element ${sel}`);
    el.focus();
    if (el.isContentEditable) {
      if (clear) { document.execCommand('selectAll'); document.execCommand('delete'); }
      document.execCommand('insertText', false, text);
    } else {
      if (clear) el.value = '';
      el.value += text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await sleep(60);
    return el;
  };
  const step = async (name, fn) => {
    const before = errors.length;
    try {
      const detail = await fn();
      const newErr = errors.slice(before);
      results.push({ name, ok: newErr.length === 0, detail: newErr.length ? newErr.join(' | ') : (detail || '') });
    } catch (e) {
      results.push({ name, ok: false, detail: String(e?.message || e) });
    }
  };
  const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
  const slidesOf = type => state.slides.filter(s => s.type === type);
  const active = () => state.slides.find(s => s.id === state.activeId);
  const styleScheme = () => state.styleSchemes.find(s => s.id === state.activeSchemeId);

  // ── Boot ────────────────────────────────────────────────────────────────
  await step('boot: app loaded', async () => {
    expect(typeof state === 'object' && typeof render === 'function', 'app globals missing');
    const skip = await waitFor(() => $$('button').find(b => /Skip for now/.test(b.textContent) && b.offsetParent), 3000);
    if (skip) await click(skip);
    Object.assign(state.config, {
      autoManagePro7: false, icloudSync: false,
      pro7RootFolder: opts.pro7Root, pro7LibraryFolder: opts.libDir,
    });
    saveState();
    await waitFor(() => typeof _fontFamilyMap === 'object' && _fontFamilyMap && Object.keys(_fontFamilyMap).length, 20000);
    return `${Object.keys(_fontFamilyMap || {}).length} font families`;
  });

  // ── Deck library: create a deck through the UI ────────────────────────────
  await step('decks: create a new deck', async () => {
    await click('#btn-decks');
    expect(await waitFor(() => $('#decks-modal.open')), 'Deck Library did not open');
    await click('#btn-new-deck');
    await type('#nd-series', 'E2E Series');
    await type('#nd-title', 'Testing Everything');
    await type('#nd-speaker', 'Test Speaker');
    await click('#btn-nd-create');
    expect(await waitFor(() => state.config.seriesName === 'E2E Series', 5000), `series is "${state.config.seriesName}"`);
    expect(state.slides.some(s => s.type === 'start') && state.slides.some(s => s.type === 'end'), 'new deck missing Start/End');
    return `${state.slides.length} slides`;
  });

  // ── Add one of every item ───────────────────────────────────────────────
  await step('sidebar: add every item type', async () => {
    for (const t of ['scripture', 'point', 'scripture', 'point', 'blank', 'image', 'custom', 'qrmarker']) {
      await click(`#btn-add-${t}`);
    }
    const types = state.slides.map(s => s.type);
    expect(types[0] === 'start' && types[types.length - 1] === 'end', 'Start/End not at the ends: ' + types.join(','));
    for (const t of ['scripture', 'point', 'blank', 'image', 'custom', 'qrmarker']) expect(types.includes(t), `no ${t} added`);
    expect($$('#slide-queue .slide-item').length >= state.slides.length - 2, 'sidebar did not render the new slides');
    return types.join(',');
  });

  // ── Scripture editor ──────────────────────────────────────────────────────
  let scr1;
  await step('scripture: label, reference, typed body, bold', async () => {
    scr1 = slidesOf('scripture')[0];
    selectSlide(scr1.id); await sleep(150);
    await type('#f-reference', 'John 3:16');
    await type('#f-body-0', 'For God so loved the world that he gave his one and only Son');
    expect((scr1.bodies[0] || []).map(s => s.text).join('').includes('loved the world'), 'typed text not saved');
    // Bold "one and only Son" with the toolbar button
    const ed = $('#f-body-0');
    const node = [...ed.childNodes].find(n => n.textContent.includes('one and only Son')) || ed.firstChild;
    const tn = node.nodeType === 3 ? node : node.firstChild;
    const i = tn.textContent.indexOf('one and only Son');
    const r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + 'one and only Son'.length);
    getSelection().removeAllRanges(); getSelection().addRange(r);
    await click('#f-body-0-bold');
    ed.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(80);
    const spans = scr1.bodies[0];
    expect(spans.some(s => s.bold && s.text.includes('only Son')), 'bold not saved: ' + JSON.stringify(spans));
    return JSON.stringify(spans).slice(0, 120);
  });

  await step('scripture: preview shows the typed verse', async () => {
    const t = await waitFor(() => $('.slp-preview .tp-el[data-row=body1]')?.textContent.includes('loved the world'), 2000);
    expect(t, 'preview did not update: ' + ($('.slp-preview')?.textContent || 'no preview').slice(0, 80));
    expect($('.slp-preview .tp-el[data-row=title1]')?.textContent.includes('John 3:16'), 'preview title not the reference');
  });

  await step('scripture: split into a second slide + Fit Width toggle', async () => {
    const before = scr1.bodies.length;
    await click('#btn-split-body');
    expect(active().bodies.length === before + 1, `bodies ${before} → ${active().bodies.length}`);
    const fit = scr1.fitWidth;
    await click('#btn-fit-width');
    expect(active().fitWidth === !fit, 'Fit Width did not toggle');
    await click('#btn-fit-width');
    expect(active().fitWidth === fit, 'Fit Width did not toggle back');
  });

  await step('scripture: blank-before + QR toggles', async () => {
    const bb = active().blankBefore;
    await click('#bb-toggle');
    expect(active().blankBefore === !bb, 'blank-before did not toggle');
    if (!active().blankBefore) await click('#bb-toggle');
    const qrWrap = $('#qr-toggle');
    if (qrWrap) {
      const q = effectiveQR(active());
      await click('#qr-toggle');
      expect(effectiveQR(active()) === !q, 'QR toggle did not change');
    }
  });

  // ── Point editor: all three modes ──────────────────────────────────────────
  await step('point: single, split and revealing modes', async () => {
    const pt = slidesOf('point')[0];
    selectSlide(pt.id); await sleep(150);
    await type('#f-bodyText', 'Love shows up first');
    expect(pt.bodyText === 'Love shows up first', `single text "${pt.bodyText}"`);
    await click('#mode-split'); await sleep(100);
    expect(active().mode === 'split', 'split mode not set');
    await type('#f-propBodyText', 'LOVE FIRST');
    expect(active().propBodyText === 'LOVE FIRST', 'LED text not saved');
    await click('#mode-revealing'); await sleep(100);
    expect(active().mode === 'revealing', 'revealing not set');
    await type('#f-title', 'Three things');
    const bullet0 = $('#bullet-rich-0');
    if (bullet0) await type(bullet0, 'Love shows up');
    await click('#btn-add-bullet'); await sleep(100);
    const b1 = $('#bullet-rich-1'); if (b1) await type(b1, 'Love stays');
    expect((active().bullets || []).length >= 2, 'bullet not added');
    await click('#mode-single'); await sleep(100);
    expect(active().mode === 'single', 'back to single failed');
    expect(active().bodyText === 'Love shows up first', 'single text lost after mode switching');
  });

  await step('point: second point with text (for export)', async () => {
    const pt = slidesOf('point')[1];
    selectSlide(pt.id); await sleep(150);
    await type('#f-bodyText', 'Love tells the truth');
    expect(pt.bodyText === 'Love tells the truth', 'not saved');
  });

  await step('image, custom, blank: labels save', async () => {
    for (const t of ['image', 'custom', 'blank']) {
      const s = slidesOf(t)[0];
      selectSlide(s.id); await sleep(120);
      await type('#f-label', `E2E ${t}`);
      expect(s.label === `E2E ${t}`, `${t} label "${s.label}"`);
    }
  });

  await step('questions marker editor renders', async () => {
    selectSlide(slidesOf('qrmarker')[0].id); await sleep(120);
    expect($('.qm-info'), 'no marker info');
  });

  // ── Undo / redo ───────────────────────────────────────────────────────────
  await step('undo/redo: one Undo reverts the last edit', async () => {
    const s = slidesOf('custom')[0];
    selectSlide(s.id); await sleep(150);
    await type('#f-label', 'Before');
    await sleep(50);
    await type('#f-label', 'After');
    expect(s.label === 'After', 'precondition');
    await click('#btn-undo'); await sleep(150);
    const now = state.slides.find(x => x.id === s.id).label;
    expect(now !== 'After', `first Undo did nothing (label still "${now}")`);
    await click('#btn-redo'); await sleep(150);
    expect(state.slides.find(x => x.id === s.id).label === 'After', 'Redo did not restore');
  });

  // ── Sidebar reorder (real drag events) and context menu ───────────────────────
  await step('sidebar: drag to reorder', async () => {
    const items = $$('#slide-queue .slide-item[data-id]').filter(e => e.draggable);
    const from = items[items.length - 1], to = items[0];
    const movedId = from.dataset.id;
    const dt = new DataTransfer();
    from.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    const r = to.getBoundingClientRect();
    to.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt, clientY: r.top + 2 }));
    to.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt, clientY: r.top + 2 }));
    from.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
    await sleep(150);
    expect(state.slides[1].id === movedId, 'slide did not move to the top: ' + state.slides.map(s => s.type).join(','));
    await click('#btn-undo'); await sleep(150);
    expect(state.slides[1].id !== movedId, 'Undo did not revert the reorder');
  });

  await step('sidebar: right-click duplicate and delete', async () => {
    const n = state.slides.length;
    const item = $$('#slide-queue .slide-item[data-id]').find(e => state.slides.find(s => s.id === e.dataset.id)?.type === 'image');
    item.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }));
    await sleep(80);
    const dup = $$('button, .ctx-item, [role=menuitem]').find(b => /Duplicate/i.test(b.textContent) && b.offsetParent);
    expect(dup, 'no Duplicate in context menu');
    await click(dup); await sleep(120);
    expect(state.slides.length === n + 1, `duplicate: ${n} → ${state.slides.length}`);
    const copy = state.slides.filter(s => s.type === 'image').pop();
    const item2 = $(`#slide-queue .slide-item[data-id="${copy.id}"]`);
    item2.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }));
    await sleep(80);
    const del = $$('button, .ctx-item, [role=menuitem]').find(b => /Delete/i.test(b.textContent) && b.offsetParent);
    expect(del, 'no Delete in context menu');
    await click(del); await sleep(150);
    const confirmBtn = $$('button').find(b => /^(Delete|Remove|Confirm)$/i.test(b.textContent.trim()) && b.offsetParent);
    if (confirmBtn) { await click(confirmBtn); await sleep(120); }
    expect(state.slides.length === n, `delete: back to ${state.slides.length}, wanted ${n}`);
  });

  // ── Styles: every tab, real controls ───────────────────────────────────────
  const openStyles = async tab => {
    state.activeId = 'style'; _styleTab = tab; render(); await sleep(150);
  };
  await step('styles: new style, every tab renders', async () => {
    await openStyles('text');
    await click('#btn-scheme-new'); await sleep(150);
    expect(styleScheme().name, 'no new style');
    for (const t of ['palette', 'text', 'layout', 'motion', 'macros', 'stage', 'responseCard', 'qr']) {
      await click(`.style-tab[data-tab="${t}"]`);
      expect($(`#style-tab-${t}`)?.style.display !== 'none', `${t} tab not shown`);
    }
  });

  await step('styles/text: controls change the export style', async () => {
    await openStyles('text');
    await click('#style-tab-text .tp-list-item[data-row="title1"]');
    await click('#style-tab-text .tp-insp .sg-tog[data-field="italic"]');
    expect(styleForExport(styleScheme()).titleFontAdv.italic === true, 'italic not applied');
    const sz = $('#style-tab-text #ss-titleSize'); sz.value = '72'; sz.dispatchEvent(new Event('input', { bubbles: true }));
    expect(styleForExport(styleScheme()).titleSize === 72, 'size not applied');
  });

  await step('styles/style: slot font + colour', async () => {
    await openStyles('palette');
    await click('.pt-slot[data-slot="colorNeutral"]');
    const pk = $('#palette-color-colorNeutral'); pk.value = '#ff8800';
    pk.dispatchEvent(new Event('input', { bubbles: true })); pk.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(100);
    expect(styleForExport(styleScheme()).bodyFontAdv.color === '#ff8800', 'neutral colour did not reach Body');
  });

  await step('styles/layout: typed position + snap', async () => {
    await openStyles('layout');
    await click('#style-tab-layout .lt-item[data-el="body"]');
    const x = $('#style-tab-layout .lt-num[data-f="bodyW"]'); x.value = '1400';
    x.dispatchEvent(new Event('input', { bubbles: true })); x.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(100);
    await click('#style-tab-layout .lt-align[data-align="center"]');
    const pv = styleForExport(styleScheme());
    expect(pv.bodyW === 1400 && Math.abs(pv.bodyX - 260) < 1, `bodyX ${pv.bodyX} bodyW ${pv.bodyW}`);
  });

  await step('styles/motion: transition + build step', async () => {
    await openStyles('motion');
    await click('#style-tab-motion .mo-item[data-mo="slide"]');
    await click('#style-tab-motion .mo-trans[data-val="dissolve"]');
    expect(styleForExport(styleScheme()).transitionType === 'dissolve', 'transition not set');
    await click('#style-tab-motion .mo-item[data-mo="point"]');
    await click('#bo-add-btn'); await sleep(100);
    expect((styleScheme().buildOrders?.point || []).length === 1, 'build step not added');
    await click('#style-tab-motion .mo-play'); await sleep(300);
  });

  await step('styles/response card: add, edit, remove element', async () => {
    await openStyles('responseCard');
    const before = (styleScheme().rcElements ?? ensureGlobalRcElements()).length;
    await click('#scheme-rc-tab .rc-add'); await sleep(100);
    await type('#scheme-rc-tab .rc-txt[data-fld="text"]', 'Text us');
    expect(styleScheme().rcElements.at(-1).text === 'Text us', 'custom text not saved');
    await click('#scheme-rc-tab .rc-del'); await sleep(100);
    expect(styleScheme().rcElements.length === before, 'not removed');
  });

  await step('styles: Global view renders read-only', async () => {
    await openStyles('text');
    const sel = $('#style-scheme-select'); const keep = sel.value;
    sel.value = '__global__'; sel.dispatchEvent(new Event('change', { bubbles: true })); await sleep(200);
    expect($('#g-tab-text .tp-list-item'), 'Global text tab empty');
    state.activeSchemeId = keep; render(); await sleep(100);
  });

  // ── Preferences ─────────────────────────────────────────────────────────────
  await step('preferences: display name + update channel', async () => {
    await click('#mm-settings'); await sleep(150);
    await type('#cfg-dn-ledWall', 'Big Wall');
    expect((state.config.displayNames || {}).ledWall === 'Big Wall', 'display name not saved');
    const beta = $('#cfg-update-channel button[data-val="beta"]');
    if (beta) { await click(beta); expect(state.config.updateChannel === 'beta', 'channel not saved'); await click('#cfg-update-channel button[data-val="stable"]'); }
    await type('#cfg-dn-ledWall', 'LED Wall');
  });

  // ── Menus and modals ─────────────────────────────────────────────────────────
  await step('menus: help, what\'s new, export history, theme', async () => {
    for (const id of ['mm-help', 'mm-changelog', 'mm-gen-history']) {
      await click('#' + id); await sleep(150);
      $$('.open').forEach(m => { if (/modal/.test(m.className)) m.classList.remove('open'); });
    }
    const dark = document.body.classList.contains('dark');
    await click('#mm-theme'); await click('#mm-theme');
    expect(document.body.classList.contains('dark') === dark, 'theme toggle not reversible');
  });

  // ── Export ───────────────────────────────────────────────────────────────────
  let exportExpect = null;
  await step('export: Export button delivers to the (fake) library', async () => {
    selectSlide(scr1.id); await sleep(100);
    const histBefore = (state.config.genHistory || state.genHistory || []).length;
    await click('#btn-generate');
    // A warnings dialog may appear (e.g. empty slides) — continue through it.
    const go = await waitFor(() => $$('button').find(b => /Export anyway|Continue|Export$/i.test(b.textContent.trim()) && b.closest('[class*=modal], [class*=dialog]') && b.offsetParent), 3000);
    if (go) await click(go);
    const done = await waitFor(() => $('#gen-modal.open, .gen-modal.open') || $$('.toast').find(t => /Export failed|Export error/.test(t.textContent)), 30000);
    expect(done && !/failed|error/i.test(done.textContent || ''), 'export did not finish: ' + (done?.textContent || 'timeout').slice(0, 160));
    exportExpect = {
      minCues: 8,
      expectLabels: ['Start of Notes', 'John 3:16', 'John 3:16 (2)', 'Love tells the truth', 'E2E image', 'Keyboard test', 'Response Card', 'End of Notes'],
      expectText: ['loved the world', 'Love tells the truth'],
      expectProps: ['John 3:16'],
      slideCount: state.slides.length,
    };
    $$('.open').forEach(m => { if (/modal/.test(m.className)) m.classList.remove('open'); });
  });

  // ── Deck switching keeps both decks intact ─────────────────────────────────
  await step('decks: switch away and back, deck intact', async () => {
    const id = state.currentDeckId, n = state.slides.length;
    await click('#btn-decks'); await sleep(200);
    await click('#btn-new-deck');
    await type('#nd-series', 'Second Deck');
    await click('#btn-nd-create'); await sleep(400);
    expect(state.currentDeckId !== id, 'did not switch to the new deck');
    await click('#btn-decks'); await sleep(300);
    const open = $$(`#decks-modal [data-deck-id="${id}"] button, #decks-modal [data-id="${id}"] button`).find(b => /Open/.test(b.textContent))
      || $$('#decks-modal button').find(b => /Open/.test(b.textContent) && b.closest('[data-deck-id], [data-id]')?.textContent.includes('E2E Series'));
    expect(open, 'no Open button for the first deck');
    await click(open);
    expect(await waitFor(() => state.currentDeckId === id, 4000), 'did not reopen the first deck');
    expect(state.slides.length === n, `slides ${state.slides.length} vs ${n}`);
    if (exportExpect) exportExpect.slideCount = state.slides.length;
  });

  // ── Batch 2: the rest of the features ─────────────────────────────────────
  const openDeckMenu = async (id, act) => {
    for (let i = 0; i < 2 && !$('#decks-modal.open'); i++) { await click('#btn-decks'); await sleep(300); }
    expect($('#decks-modal.open'), 'Deck Library would not open');
    const btn = await waitFor(() => $(`#decks-modal .btn-deck-menu[data-id="${id}"]`), 3000);
    expect(btn, `no ⋯ menu for deck ${id.slice(0, 8)} — filter=${_deckFilter} search="${_deckSearch}" ready=${_libReady} inCache=${!!(_libCache || []).find(d => d.id === id)} status=${(_libCache || []).find(d => d.id === id)?.status} cache=${JSON.stringify((_libCache || []).map(d => [d.id.slice(0, 8), d.title, d.status, d.is_template]))} rows=${$$('#decks-list .deck-item').map(r => r.dataset.id.slice(0, 8)).join(',')} list="${($('#decks-list')?.textContent || '').trim().slice(0, 80)}"`);
    await click(btn); await sleep(100);
    const item = await waitFor(() => $(`#decks-modal .deck-menu-item[data-act="${act}"][data-id="${id}"]`), 2000);
    expect(item, `no "${act}" in deck menu`);
    await click(item); await sleep(400);
  };
  const setFilter = async f => { await click(`.deck-filter-btn[data-filter="${f}"]`); await sleep(250); };
  const libRow = id => (_libCache || []).find(d => d.id === id);

  await step('decks: duplicate, template, archive, trash, restore', async () => {
    const id = state.currentDeckId;
    const n = (_libCache || []).length;
    await openDeckMenu(id, 'duplicate');
    expect(await waitFor(() => (_libCache || []).length === n + 1, 4000), `duplicate: ${n} → ${(_libCache || []).length}`);
    const copy = (_libCache || []).find(d => d.id !== id && /E2E Series/.test(d.series_name || d.series || d.title || JSON.stringify(d)));
    expect(copy, 'duplicate not found in library');
    await openDeckMenu(copy.id, 'template');
    expect(await waitFor(() => libRow(copy.id)?.is_template, 3000), 'not marked as template');
    await setFilter('templates');
    expect($(`#decks-modal [data-id="${copy.id}"]`), 'template not listed under Templates');
    await openDeckMenu(copy.id, 'template'); // Remove from Templates
    expect(await waitFor(() => !libRow(copy.id)?.is_template, 3000), 'not removed from templates');
    await setFilter('active');
    await openDeckMenu(copy.id, 'archive');
    expect(await waitFor(() => libRow(copy.id)?.status === 'archived', 3000), 'not archived');
    await setFilter('archived');
    await openDeckMenu(copy.id, 'unarchive');
    expect(await waitFor(() => libRow(copy.id)?.status !== 'archived', 3000), 'not unarchived');
    await setFilter('active');
    await openDeckMenu(copy.id, 'trash');
    expect(await waitFor(() => libRow(copy.id)?.status === 'deleted', 3000), 'not moved to Trash: ' + libRow(copy.id)?.status);
    await setFilter('deleted');
    await openDeckMenu(copy.id, 'restore');
    expect(await waitFor(() => libRow(copy.id)?.status === 'active', 3000), 'not restored: ' + libRow(copy.id)?.status);
    await setFilter('active');
    await openDeckMenu(copy.id, 'trash');
    await setFilter('deleted');
    await openDeckMenu(copy.id, 'purge');
    const cb = $$('button').find(b => /Delete Forever|Delete$/.test(b.textContent.trim()) && b.offsetParent && !b.classList.contains('deck-menu-item'));
    if (cb) { await click(cb); await sleep(300); }
    expect(await waitFor(() => !libRow(copy.id), 3000), 'not deleted forever');
    await setFilter('active');
    $('#decks-modal')?.classList.remove('open');
    expect(state.currentDeckId === id, 'current deck changed during library actions');
  });

  await step('sidebar: create an alias of a scripture', async () => {
    const src = slidesOf('scripture')[0];
    const item = $(`#slide-queue .slide-item[data-id="${src.id}"]`);
    item.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }));
    await sleep(80);
    await click('#ctx-alias-slide'); await sleep(150);
    const al = slidesOf('alias')[0];
    expect(al, 'no alias created');
    selectSlide(al.id); await sleep(150);
    expect($('#f-alias-source'), 'alias editor missing');
  });

  await step('scripture: per-slide transition override', async () => {
    const sc = slidesOf('scripture')[0];
    selectSlide(sc.id); await sleep(150);
    const seg = $$('[id$="-trans-seg"]')[0];
    expect(seg, 'no transition override control');
    await click(seg.querySelector('button[data-val="cut"]'));
    expect(['cut'].includes(active().transition?.type || active().propTransition?.type), 'override not saved: ' + JSON.stringify([active().transition, active().propTransition]));
    await click(seg.querySelector('button[data-val="default"]'));
  });

  if (opts.bibleKey) {
    await step('bible lookup: fetches a verse with the saved key', async () => {
      Object.assign(state.config, { bibleApiKey: opts.bibleKey, bibleId: opts.bibleId || state.config.bibleId });
      saveState();
      await click('#btn-add-scripture');
      const sc = active();
      selectSlide(sc.id); await sleep(150);
      await type('#f-reference', 'John 11:35');
      await click('#btn-bible-lookup');
      const ok = await waitFor(() => (active().bodies?.[0] || []).map(x => x.text).join('').toLowerCase().includes('wept'), 15000);
      expect(ok, 'verse not filled: ' + JSON.stringify(active().bodies?.[0]).slice(0, 120));
      return (active().bodies[0] || []).map(x => x.text).join('').slice(0, 60);
    });
  }

  await step('response card item: edit a response', async () => {
    selectSlide('rc'); await sleep(150);
    const r1 = $$('#main-panel input, #main-panel textarea').find(i => /r1|response-1|rc-r1/i.test(i.id + i.name + (i.dataset.key || '')));
    expect(r1, 'no Response 1 field');
    await type(r1, 'I said yes today');
    expect(state.config.responses.r1 === 'I said yes today', 'response not saved: ' + state.config.responses.r1);
  });

  await step('styles: duplicate + lock blocks editing', async () => {
    state.activeId = 'style'; _styleTab = 'text'; render(); await sleep(150);
    const n = state.styleSchemes.length;
    await click('#btn-scheme-dupe'); await sleep(150);
    expect(state.styleSchemes.length === n + 1, 'style not duplicated');
    await click('#btn-scheme-lock'); await sleep(150);
    expect(styleScheme().isLocked, 'not locked');
    expect($('#style-tab-text .sg-size')?.disabled !== false, 'controls still enabled while locked');
    await click('#btn-scheme-lock'); await sleep(150);
    expect(!styleScheme().isLocked, 'not unlocked');
  });

  await step('keyboard: ⌘Z undoes outside text fields', async () => {
    const s0 = slidesOf('custom')[0];
    selectSlide(s0.id); await sleep(150);
    await type('#f-label', 'Keyboard test');
    await sleep(1100);
    document.activeElement?.blur();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true }));
    await sleep(150);
    expect(state.slides.find(x => x.id === s0.id).label !== 'Keyboard test', '⌘Z did nothing');
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, shiftKey: true, bubbles: true }));
    await sleep(150);
    expect(state.slides.find(x => x.id === s0.id).label === 'Keyboard test', '⇧⌘Z did not redo');
  });

  await step('export: QR on + paired export writes both files', async () => {
    Object.assign(state.config, { qrCode: true, qrExportPair: true });
    saveState();
    const before = (await (await fetch('/api/state')).json()).state ? 0 : 0;
    await click('#btn-generate');
    const go = await waitFor(() => $$('button').find(b => /Export anyway|Continue|Export$/i.test(b.textContent.trim()) && b.closest('[class*=modal], [class*=dialog]') && b.offsetParent), 3000);
    if (go) await click(go);
    const done = await waitFor(() => $('#gen-modal.open, .gen-modal.open') || $$('.toast').find(t => /Export failed|Export error/.test(t.textContent)), 30000);
    expect(done && !/failed|error/i.test(done.textContent || ''), 'paired export failed: ' + (done?.textContent || 'timeout').slice(0, 160));
    $$('.open').forEach(m => { if (/modal/.test(m.className)) m.classList.remove('open'); });
    Object.assign(state.config, { qrCode: false, qrExportPair: false });
    saveState();
    if (exportExpect) { exportExpect.expectSat = true; exportExpect.slideCount = state.slides.length; }
  });

  await step('no JavaScript errors during the run', async () => {
    expect(errors.length === 0, errors.slice(0, 5).join(' | '));
  });

  await sleep(800); // let the last save reach the server
  return { results, exportExpect };
}
