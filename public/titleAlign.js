// Scripture reference → line its text up with the verse text under it.
//
// The reference keeps its own box (so a full-width title bar stays a
// full-width bar); only its alignment and left/right margins change, so the
// reference TEXT starts where the verse text starts (left), ends where it
// ends (right), or centres over it (centre). Without this the reference sat
// centred on the whole screen while a left-aligned or Fit-Width-narrowed
// verse sat somewhere else entirely.
//
// Shared by builder.js (main screen), buildProp.js (LED wall) and the
// in-app previews (loaded as a plain script there).
(function (root) {
  function titleAdvFollowingBody({ titleX, titleW, titleAdv, bodyX, bodyW, bodyAlign, bodyMarginLeft, bodyMarginRight }) {
    const align = bodyAlign === 'center' || bodyAlign === 'right' ? bodyAlign : 'left'; // justify reads as left
    const textL = bodyX + (bodyMarginLeft || 0);
    const textR = bodyX + bodyW - (bodyMarginRight || 0);
    const boxL = titleX, boxR = titleX + titleW;
    let left = 0, right = 0;
    if (align === 'left') left = textL - boxL;
    else if (align === 'right') right = boxR - textR;
    else {
      // Centre on the verse, using as much of the box as stays symmetric so
      // a long reference isn't squeezed into the verse's width.
      const c = (textL + textR) / 2;
      const half = Math.min(c - boxL, boxR - c);
      left = c - half - boxL;
      right = boxR - (c + half);
    }
    const r = n => Math.max(0, Math.round(n * 100) / 100);
    return { ...(titleAdv || {}), alignment: align, marginLeft: r(left), marginRight: r(right) };
  }
  // How the verse text actually sits: the row's Alignment when set, else what
  // rtfBody does on its own — an all-emphasis verse is centred, anything else
  // reads left.
  function bodyTextAlign(adv, spans) {
    if (adv && adv.alignment) return adv.alignment;
    return spans && spans.length && spans.every(s => s.alt) ? 'center' : 'left';
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { titleAdvFollowingBody, bodyTextAlign };
  else { root.titleAdvFollowingBody = titleAdvFollowingBody; root.bodyTextAlign = bodyTextAlign; }
})(this);
