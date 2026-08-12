'use strict';

// ─── Version & Changelog ──────────────────────────────────────────────────────

const APP_VERSION = '4.26.1';

const CHANGELOG = [
  {
    version: '4.26.1',
    date: '2026-08-07',
    changes: [
      'Fixed: the "changed in ProPresenter" merge/override box could grow taller than the screen when there were a lot of changes — spilling the Merge/Override/Cancel buttons off the bottom with no way to scroll to them. The box is now capped to the window height, the list of changes scrolls inside it, and the buttons stay pinned and reachable no matter how many changes there are. (Same fix applies to the pre-export warnings box.)',
    ],
  },
  {
    version: '4.26.0',
    date: '2026-08-07',
    changes: [
      'Export waits much longer for ProPresenter to close before giving up — 60 seconds instead of 20. Closing Pro7 by hand (clicking through its own prompts, letting it flush) could take longer than the old window, and giving up early forced a needless retry.',
      'New: Cancel button on the export overlay. While DeckPro is waiting for ProPresenter to close, you can now stop the export instead of waiting it out — it bails cleanly before anything is written and leaves ProPresenter open. (Only available during that waiting phase, which is the only point where cancelling is safe; once files start writing it finishes to avoid a half-written config.)',
      'The QR-pair export success screen now labels its two "reveal in Finder" buttons "Find Standard Export in Finder" and "Find Alternate Export in Finder" (was "Reveal first/second in Finder"), so it\'s clear which is the plain version and which is the QR/Saturday one.',
    ],
  },
  {
    version: '4.25.3',
    date: '2026-08-07',
    changes: [
      'Fixed: a bolded word in your notes that ended with punctuation — like "No," at the start of a verse — didn\'t carry its bold onto the fetched scripture, while every other bolded word did. The trailing comma got baked into the match pattern, and a word-boundary can\'t sit after a comma, so that one phrase silently failed. Punctuation on a bolded phrase\'s outer edges is now trimmed before matching (inner apostrophes and accented letters are left alone), so "No," bolds the "No" just like the rest.',
    ],
  },
  {
    version: '4.25.2',
    date: '2026-08-07',
    changes: [
      'Raised the Speaker Notes Google Doc size limit from 8 MB to 50 MB. Google Docs inline their images as base64, which inflates the exported HTML well past the doc\'s visible length, so a big sermon doc with a few images could trip the old cap and refuse to load. (PDFs already had no size limit.)',
    ],
  },
  {
    version: '4.25.1',
    date: '2026-08-07',
    changes: [
      'Speaker Notes are now per-deck. Each deck already stored its own notes-doc link, but the panel was only built once when the app launched, so switching decks left the previous deck\'s notes pinned on screen — it looked like one notes doc shared across everything. Now opening a deck loads that deck\'s own notes (and clears the panel if it has none), and creating a new deck starts with a clean panel. (Dropped local PDFs still can\'t be restored — only a Google Doc/Drive link is saved with the deck — so a dropped PDF clears when you switch decks.)',
    ],
  },
  {
    version: '4.25.0',
    date: '2026-08-07',
    changes: [
      'Divine-pronoun capitalization reworked so it stops capitalizing the wrong ones. The old setting silently capitalized every He/Him/His/Himself at export — including pronouns that refer to someone other than God (e.g. Mark 1:40, where the man with leprosy says "he said") — and you never saw it, so you couldn\'t fix it. No translation on a normal api.bible key capitalizes these for you (the ones that do — NASB, Amplified, LSB, MEV — aren\'t in the catalog), and no rule can tell a divine "he" from a human one, so the caps now live in the visible body text instead: the Preferences toggle capitalizes He/Him/His/Himself right in the editor when you look up a verse, and a new "Capitalize divine pronouns in this deck now" button applies it across the whole deck for text you typed or pasted. Either way you can see the result and lowercase any that shouldn\'t be capitalized — and that edit sticks, because nothing re-applies behind your back. Export uses exactly what you see. (Whole-word only, so "this"/"history" are never touched.)',
      'Image slides now carry a placeholder prop instead of a Clear-props cue. Each Image slide gets its own reserved prop slot you can build out in Pro7, so the LED wall shows this deck\'s placeholder rather than clearing whatever the previous slide left up.',
      'Merge fix: when a QR-paired export finds a hand-edit on only one of the two files (say the no-QR file got resized in Pro7), choosing Merge now applies that change to BOTH files, not just the one it was found on — they\'re the same deck with/without the QR macro, so an edit to one is meant for both.',
    ],
  },
  {
    version: '4.24.0',
    date: '2026-08-05',
    changes: [
      'New: drag straight off the notes doc. Every paragraph/heading/list item in the Speaker Notes panel is now click-and-drag — no need to select text first. What happens depends on where you drop it: onto a text field (Scripture/Point body, reference, etc.), it drops in as rich text with bold preserved; onto the deck sidebar, DeckPro figures out what the dragged content actually is — a verse reference, a point, a response-card option — and creates the right kind of slide, fully filled in (reference + body + bold for a scripture, matching what "Add" already does from the Suggested Slides tray). Dragging a continuation block (verse text right after its reference, a bullet right after its heading) correctly finds the reference/heading it belongs to, same as the tray\'s own suggestions do. Plain text-selection dragging (select a phrase, then drag it) still works as before, unchanged.',
      'Fixed a real bug this surfaced: dragging bold text out of the notes doc missed bold applied via a CSS class (Google Docs\' actual export format) — only inline "style=" bold and literal <b>/<strong> tags were detected. Affects both the existing text-selection drag and the new whole-block drag.',
    ],
  },
  {
    version: '4.23.1',
    date: '2026-07-29',
    changes: [
      'Help Guide brought up to date: documented Merge/Override (Exporting section), the Gradient and Gradient (QR code version) macro fields (Macros & Stage, QR Code), the Build Order Start-option position constraint, Auto-manage\'s Accessibility permission prompt and quit-dialog handling, and corrected the QR Export pair naming (same _v{N}, QR file gets _SAT) and Build Order\'s stale mention of a "gradient" build element (the gradient is a Pro7 macro, not a buildable element).',
    ],
  },
  {
    version: '4.23.0',
    date: '2026-07-29',
    changes: [
      'New: Merge or Override for hand-edited presentations. If you tweak something directly in ProPresenter (resize a text box, retint a fill, retype a verse or point, tweak a macro) after DeckPro exported a deck, the next export now detects it and pauses before writing anything — showing exactly what changed (which file, slide, element, property, old → new) with two choices: Merge carries those Pro7 edits forward into the new version alongside whatever content changes you made in DeckPro; Override exports fresh from DeckPro and lets the Pro7 edits go. Works for anything a hand-edit could touch — position, size, color, font, macros, props, elements added or removed entirely in Pro7 — and text content is safely reconstructed (not just flagged) everywhere DeckPro puts real text on a slide: Scripture body and reference-bar text, Point body text, Response Card text, and Start/End banners, bold emphasis included everywhere it applies. (The one thing still out of reach: the revealing-point LED-wall list lives in the separate Props file, which this feature doesn\'t read yet.) Covers the QR-paired export too — the no-QR and QR files are tracked and merged independently, since either one (or both) could be hand-edited on its own. Detection needs a baseline from a prior export made under this version or later — it has nothing to compare a deck\'s first export, or one exported before this feature existed, against.',
    ],
  },
  {
    version: '4.22.1',
    date: '2026-07-29',
    changes: [
      'Fixed Smart Notes bold-highlight reapplication bolding random unrelated words (e.g. "you", "is", "me", "God") throughout a newly-added scripture. It matched bold status by flat word membership across the whole tracked notes text, so a common word bolded anywhere — even for an unrelated reason elsewhere — bolded every occurrence of that word in the fetched verse. It now matches whole bolded phrases (consecutive words) instead of individual words in isolation, and drops a lone bolded stop word (a word like "you"/"is"/"me" bolded by itself) entirely, since on its own it can\'t be told apart from any other occurrence of that word.',
      'Fixed: in Intelligent Notes mode, a multi-paragraph scripture (reference on one line, verse text with the actual bolded words on the next) only ever carried the reference line\'s bold words onto the Add suggestion — never the verse text\'s, since the auto-detection branch unconditionally reset its tracking before checking whether the next block was a continuation of the same highlighted passage.',
      'Fixed: in Intelligent Notes mode, a highlighted paragraph that wasn\'t a heading (or ran over 80 characters) was never surfaced as a point suggestion — only short headings were. Any highlighted block is now treated as a likely point regardless of its tag or length.',
      'Fixed: in Intelligent Notes mode with the highlight color mapped to "Content" or left on "Auto", a Response Card trigger line (the decision text) followed by its response options fell through to becoming a single point (using just the intro line, discarding the actual options) instead of filling the Response Card. It\'s now detected the same way the explicit "Response" color mapping already was.',
      'Fixed: the Build Order editor\'s first-item start option was labeled "With Slide" — not a real ProPresenter term. It\'s now labeled "After Transition", matching Pro7\'s own wording (the underlying value/behavior was already correct — only the label was wrong).',
      'Auto-manage ProPresenter on export now clicks through ProPresenter\'s "Are you sure you want to quit?" confirmation dialog if it appears, instead of the quit hanging until someone at the keyboard confirms it manually. DeckPro now proactively asks macOS for the Accessibility permission this needs — right when you turn on "Auto-manage ProPresenter on export" in Preferences (and once at launch if it was already on) — instead of silently needing it granted ahead of time in System Settings.',
    ],
  },
  {
    version: '4.22.0',
    date: '2026-07-29',
    changes: [
      'New: dedicated Gradient macros. The Macros tab now has a single "Gradient" macro field (fires on Scripture, Point, and Response Card content cues) separate from the general per-trigger macro lists. The QR Code tab has a matching "Gradient (QR code version)" field that fires instead of the normal one whenever that export\'s QR toggle is on — so the no-QR file and the QR file of a paired export can each use a different gradient treatment. Both are deck-wide (not per-style) and sync across your devices via iCloud Sync.',
    ],
  },
  {
    version: '4.21.1',
    date: '2026-07-29',
    changes: [
      'QR paired export naming: the no-QR and QR versions now share the SAME _v{N} number, with the QR file getting a _SAT suffix (e.g. Message_..._v7 / Message_..._v7_SAT), instead of consuming two different version numbers with no way to tell which was which.',
      'Fixed: the QR Code tab\'s macro assignment (and the "Export both versions when QR is on" preference) never synced across your devices via iCloud Sync — every other preference did, this one was missed. Setting a QR macro on one Mac now carries over to your others.',
      'Fixed: Fit Width for point slides could grow wider than the point box width you actually configured in Layout — it was deliberately capped to the full screen width instead of your palette\'s own point-width setting. It now respects your configured point width the same way scripture bodies already respect body width.',
    ],
  },
  {
    version: '4.21.0',
    date: '2026-07-29',
    changes: [
      'Removed the "Rollback to previous version" feature (··· menu, plus the backup app copy an update used to leave behind in /Applications). Check for Updates still works as before.',
    ],
  },
  {
    version: '4.20.0',
    date: '2026-07-29',
    changes: [
      'The Diagnostic Bundle (··· → Export Diagnostic Bundle) now includes a rolling log of the last 50 things the app showed you — every success/error/warning toast, plus any JS errors — each with a timestamp, instead of just JS errors. It\'s a "what just happened" trail you can hand over verbatim to describe a problem, not only a snapshot of current settings.',
    ],
  },
  {
    version: '4.19.5',
    date: '2026-07-29',
    changes: [
      'Fixed a gap in Auto-manage ProPresenter on export: if anything failed between ProPresenter quitting and the new file(s) being written (single or paired QR export), ProPresenter was left closed with no relaunch and no visible recovery — looking like the export silently did nothing. ProPresenter now always relaunches in that case, even when the export itself fails, so the underlying error still surfaces instead of just leaving the app closed.',
    ],
  },
  {
    version: '4.19.4',
    date: '2026-07-29',
    changes: [
      'Fixed: the sidebar QR indicator icon rendered orange instead of white.',
      'Fixed: Smart Notes\' bold-detection didn\'t recognize Google Docs\' actual bold export format (an inline font-weight style, not a <b>/<strong> tag), so bolded words in your notes silently failed to carry over as emphasis when added to a slide.',
      'Renamed "Palette"/"Palettes" to "Style"/"Styles" throughout the UI (labels, tooltips, toasts, warnings, Help Guide) — no change to the underlying data or file format.',
      'Fixed the Intelligent Notes mode\'s Response Card auto-fill: it only recognized bulleted list items, silently finding nothing when response options were typed as plain paragraphs (a common pattern); a second bug could then wipe out the single remaining candidate by over-aggressively matching it against the boilerplate decision line.',
      'Confirmed version-title generation has always used a lowercase "v" (e.g. "_v3") — no code change needed, called out here since it was flagged as a must-hold guarantee.',
      'Build Order editor now enforces ProPresenter\'s real constraint: the first build item in a list can only start "With Slide" or "On Click"; every item after that can only start "On Click", "With Previous", or "After Previous" (referencing the item directly above it). Reordering, deleting, or adding rows now auto-corrects any item whose start type becomes invalid for its new position. This also fixed a latent bug in the built-in default Scripture build order, which had its first item set to an invalid "After Previous."',
    ],
  },
  {
    version: '4.19.3',
    date: '2026-07-29',
    changes: [
      'Fixed more of the same class of bug as 4.19.2\'s Auto-manage fix — a recurring Speaker you added, or a change to your Global palette (fonts, layout, macros, stage displays, response-card elements), could also silently revert when you opened a different deck. The previous fix only covered machine/Pro7-connection settings; this extends it to every preference field: Speakers, Display Names, Book Names, Queue format, Bible verse-number formatting, Smart Notes style mapping, and — previously not preserved at all when opening an existing deck — your whole Global palette (Text, Layout, Motion, Macros, Stage, Response Card). Creating a deck from a Template still keeps that template\'s own saved style, as intended; only opening/creating a plain deck now correctly keeps your current preferences instead of whichever deck you happen to open.',
    ],
  },
  {
    version: '4.19.2',
    date: '2026-07-29',
    changes: [
      'Fixed: machine settings (Auto-manage ProPresenter on export, Pro7 connection/folders, Bible API key, output folder, QR macro, stage screen) could silently revert when you opened a different deck or started a new one. Every deck saves a full snapshot of your settings alongside its own content, and opening a deck was restoring THAT deck\'s old snapshot wholesale — so switching to (or duplicating from) a deck last saved before you turned a setting on would quietly turn it back off. These settings now always carry forward from your current session instead of coming from the deck being opened. If Auto-manage or your Pro7 connection ever seemed to "reset itself," this was why.',
      'Fixed: toggling "Blank slide before this one" off no longer requires clicking into the sidebar to see it update — the queue list now refreshes immediately when the toggle changes.',
    ],
  },
  {
    version: '4.19.1',
    date: '2026-07-29',
    changes: [
      'Internal housekeeping (no user-facing change): the GitHub repository moved from luccagrillo1-canvas/DeckPro to luccagrillo1/DeckPro. Updated package.json\'s repository field to the new canonical location so the in-app self-updater builds its download URL directly instead of relying on GitHub\'s redirect indefinitely.',
    ],
  },
  {
    version: '4.19.0',
    date: '2026-07-29',
    changes: [
      'New: QR Export pair. Turn on Preferences → QR Export → "Export both versions when QR is on" and, whenever the deck\'s QR toggle is enabled, pressing Export delivers TWO presentations to ProPresenter in one action — one without QR, one with — instead of just the QR-configured deck. Both reference the exact same prop collection (no duplicate props written), so it\'s a clean way to produce a Saturday/Sunday pair with identical content.',
      'Filenames now use one unified, sequential naming convention: every export gets a lowercase _v{N} suffix, starting at _v1 — including the very first export of a deck, which previously had no suffix at all. A plain re-export becomes _v2, _v3, and so on, and a QR-paired export consumes two numbers in the same sequence (e.g. _v1 no-QR / _v2 QR). The QR toggle no longer appends _SAT to the filename by itself — SAT decks and normal decks now share one version-number sequence instead of two different naming schemes.',
    ],
  },
  {
    version: '4.18.0',
    date: '2026-07-19',
    changes: [
      'You can now drag selected text out of the notes doc straight into any field — Reference, Body, Confidence Monitor, Response options, all of it — instead of copy-pasting. Bold text carries over as bold in rich-text fields.',
    ],
  },
  {
    version: '4.17.0',
    date: '2026-07-19',
    changes: [
      'Fixed: the QR Stop add-item button had no dark-mode variant, so it stayed a light peachy box even in dark mode — now matches the same dark-tinted-background pattern as every other add-item icon.',
      '"Show Blanks" moved out of the ⋯ menu and into the native app menu (View → Show Blanks, ⌘⇧B).',
      'Blanks that will fire the QR macro on export now show a small QR badge in the sidebar, next to the macro/stage badges.',
      'Standalone Blank slides get their own QR toggle — previously only blank-before cues (in front of scripture/point/image) could fire the QR macro; a Blank slide you add directly had no QR option at all.',
      'The Suggested Slides tray in Smart Notes is now vertically resizable, same drag-handle pattern as the sidebar and notes panel.',
    ],
  },
  {
    version: '4.14.0',
    date: '2026-07-19',
    changes: [
      'Smart Notes: scripture suggestions now warn when a reference\'s claimed verse range doesn\'t match what\'s actually quoted in the notes (e.g. it wants v1-2 but the notes only have v1) — pick "Conform Scripture to Reference" to fetch the full claimed range anyway, or "Conform Reference to Notes" to shrink the reference down to what\'s actually there.',
    ],
  },
  {
    version: '4.13.1',
    date: '2026-07-19',
    changes: [
      'Smart Notes: fixed a point\'s bullet list swallowing unrelated later bullets in a long list — collection now stops at a bullet that\'s been explicitly mapped to a different Style Map role, or that carries its own highlight color differing from the triggering block\'s, so it surfaces as its own suggestion instead of getting absorbed.',
      'Smart Notes: fixed a Style Map "Scripture" highlight color producing a bogus second suggestion when it also covered the verse-text paragraph right after a reference (or any other unrelated block) — a scripture-mapped block now only suggests when its text actually contains a Bible reference, and a same-highlight block immediately following a pushed reference is treated as its continuation instead of a new fabricated suggestion.',
      'Smart Notes: Response Card suggestions no longer let a "decided to follow Jesus" style boilerplate line crowd out real weekly response options — whichever single bullet overlaps the deck\'s decision text the most (pastors often write their own close paraphrase, not the exact string) is dropped, and the rest keep their original order before picking the first 3.',
    ],
  },
  {
    version: '4.13.0',
    date: '2026-07-19',
    changes: [
      'Smart Notes: fixed points getting swallowed into scripture suggestions — pairing a highlighted block with a nearby Bible reference now only fires when that reference sits alone on its own line, not whenever a reference is merely mentioned nearby.',
      'Smart Notes: new "Response" Style Map role — map a heading or highlight color to it and Smart Notes will suggest filling the Response Card\'s weekly options (Response 1/2/3) straight from your notes.',
    ],
  },
  {
    version: '4.12.0',
    date: '2026-07-19',
    changes: [
      'Building (revealing) points now unfurl in the Deck sidebar just like Response Card — expand to see one subitem per bullet, live-updating as you edit them.',
      'New Preferences → Book Names option: "Capitalize divine pronouns (He, Him, His, Himself)" — whole-word, applied at export to scripture/point/blank body text.',
      'Palettes toolbar: added Import and Export buttons to save a palette as a standalone JSON file, or load one back in as a new palette.',
    ],
  },
  {
    version: '4.11.3',
    date: '2026-07-19',
    changes: [
      'QR Stop add-item button now shows a hashtag (#) instead of the box-split glyph.',
    ],
  },
  {
    version: '4.11.2',
    date: '2026-07-19',
    changes: [
      'Fixed: scripture slide icons stayed white in dark mode — every other slide type had a dark-mode override, scripture was the one missing it.',
      'The sidebar\'s "Blanks" show/hide toggle moved into the ⋯ menu (next to Dark Mode); its spot next to "Deck" is now a QR toggle for this deck\'s default QR state.',
    ],
  },
  {
    version: '4.11.1',
    date: '2026-07-19',
    changes: [
      'QR Stop marker restyled: diagonal tick marks flanking the "QR STOP" label instead of a dashed-border pill — cleaner, and the striped background is gone from the whole bar (was competing with the sidebar\'s drag-reorder indicator).',
    ],
  },
  {
    version: '4.11.0',
    date: '2026-07-18',
    changes: [
      'ADD ITEM buttons (Scripture/Point/Blank/Image/Custom/QR Stop) are now just the colored square — no icon-plus-label — with the full description on hover as a tooltip. The row now wraps to more or fewer rows as you resize the sidebar narrower, and stays left-aligned at fixed size instead of stretching into oversized rectangles when the sidebar is wide — fixes the layout breaking at the sidebar\'s narrow end.',
      'Fixed a stray uppercase "V" in the DeckPro brand panel\'s version display (every other version display in the app already used lowercase, matching the "v4.11.0"-style release tags).',
      'Completely removed "Import from Pro7" and "Test Palette" from the Palette editor toolbar, and everything behind them (the Pro7-presentation picker/review screen, the sample-deck export-and-open flow).',
      'Completely removed the Outline panel — the right-side panel is Speaker Notes only now, no more tab switcher. (Along the way, found and fixed a shadowed duplicate of a span-rendering helper left over from that panel that was silently overriding a more complete version used elsewhere — verse-number/italic/underline formatting in a couple of spots is now handled correctly again.)',
    ],
  },
  {
    version: '4.10.1',
    date: '2026-07-18',
    changes: [
      'Clearer tooltip on a deck\'s QR toggle (Decks → edit a deck) — explains it\'s just the default for untouched blanks, not a forcing switch, since the QR Stop marker and each blank\'s own QR toggle still apply on top of it.',
    ],
  },
  {
    version: '4.10.0',
    date: '2026-07-18',
    changes: [
      'QR Code reworked: it\'s now a macro DeckPro fires, not an image it draws onto a slide. New "QR Code" tab in Palettes to pick which macro fires. A new "QR Stop" item in the sidebar (drag it anywhere) marks where auto QR-fill stops — blanks before it default to firing the macro when this deck\'s QR toggle is on, blanks at or after it default to not. A new per-slide QR toggle, right next to "Blank slide before this one" on scripture/point/image slides, lets you manually override any individual blank — and that choice sticks even if you move the marker or flip the deck\'s QR toggle later. Removed the old image-based QR element entirely.',
    ],
  },
  {
    version: '4.9.6',
    date: '2026-07-15',
    changes: [
      '"+ Display 2" (the LED-wall Fit Width sub-toggle added last release) is now on by default for new scripture and point slides, same as Fit Width itself — most slides want both. Turn it off per-slide wherever you\'ve hand-positioned that box for a specific screen or NDI feed and want it left alone.',
    ],
  },
  {
    version: '4.9.5',
    date: '2026-07-15',
    changes: [
      'Fixed: turning on Fit Width for a slide silently resized and recentered its Display 2 (LED wall) box too — introduced last release. For anyone with a hand-tuned custom Display 2 layout (a specific position/size for a particular screen or NDI feed), this broke it the moment Fit Width was turned on for the main screen, with no way to opt out. Display 2 is now back to never being touched by Fit Width by default — exactly like before. A new "+ Display 2" toggle (next to Fit Width, only shown while Fit Width is on) opts a specific slide into also fitting its Display 2 box, independently sized using Display 2\'s own font/canvas — for when you do want it.',
    ],
  },
  {
    version: '4.9.4',
    date: '2026-07-15',
    changes: [
      "Fixed: Auto Title Y (the reference bar's automatic vertical position, above the body text) was routinely off — sometimes leaving a big gap, sometimes crowding the body — because it independently re-guessed how many lines the body text would wrap into using a rough character-width estimate, which frequently disagreed with what Fit Width actually measured and rendered. It now uses Fit Width's real, DOM-measured line count directly when available, for both Display 1 and Display 2.",
      "Fixed: Auto Title Y on Display 2 (the LED wall) was positioning the reference bar hundreds of pixels too high on any multi-line verse — a leftover RTF half-point conversion was accidentally doubling the font size used for its own line-height math (a real-pixel calculation that should never have touched that conversion at all).",
    ],
  },
  {
    version: '4.9.3',
    date: '2026-07-15',
    changes: [
      "Fixed: Strip did nothing on export for plain (unformatted) scripture text — which is most scripture. The rich-text editor merges a line break into the surrounding text whenever the formatting matches on both sides, so the break usually isn't its own standalone entry the way Strip's old exact-match check expected; it's embedded inside a longer run of text instead. Strip now flattens embedded line breaks too, not just standalone ones.",
      "Fixed: Fit Width never reached Display 2 (the LED wall behind the stage) at all — it only ever sized the main screen's box, while the LED wall always fell back to the palette's static prop width regardless of what Fit Width computed. Since Display 2 renders at its own font size and box width, this could produce orphaned words and uneven lines there even when Display 1 looked perfect. Fit Width now runs its own search for Display 2 using Display 2's own metrics (font size, canvas, body width), for scripture, single points, and revealing points alike.",
    ],
  },
  {
    version: '4.9.2',
    date: '2026-07-15',
    changes: [
      "Fixed: settings (auto-manage ProPresenter on export, Machine Setup completion, Pro7 folder/library, palettes — everything saved locally) sometimes reset back to defaults on app launch. The packaged app's internal server bound to a random port each launch, and since the app window's local storage is tied to that exact port, a different random port than last time meant a completely empty, fresh storage. It now binds to a fixed, dedicated port so settings stay put across launches (falling back to a random port only if that one's somehow already taken, e.g. a second DeckPro instance already running).",
      'Stage display icon (sidebar dot, main-panel chip, and the Palette editor\'s Stage tab) changed from a paintbrush to a small monitor-on-a-stand glyph — reads more clearly as "stage display" at a glance.',
    ],
  },
  {
    version: '4.9.1',
    date: '2026-07-15',
    changes: [
      'Fixed: Single Prop Mode reverted back to off on every export. The real export path patches Pro7\'s Configuration/Props file directly at the byte level (rather than writing a fresh props file), and that binary patcher never wrote the Single Prop Mode bit at all — so re-exporting silently stripped it back to off even right after you\'d manually turned it on in ProPresenter. It\'s now written correctly on every export, and other prop groups\' own Single Prop Mode setting is preserved when DeckPro has to touch them (e.g. to remove a stale DeckPro slot reference).',
    ],
  },
  {
    version: '4.9.0',
    date: '2026-07-15',
    changes: [
      'Fixed: highlighted/emphasis text in scripture bodies was silently rendered with non-breaking spaces between every word, so ProPresenter could never wrap a line inside a highlighted phrase no matter what Fit Width computed. Long highlighted phrases now wrap normally like any other text.',
      'Fit Width and Strip are no longer mutually exclusive on scripture slides — turn both on to keep the LED wall\'s poetry line breaks while the main screen flows the stripped text as one block, sized to fit that flattened text.',
      'Fit Width scoring: scripture/body no longer penalizes uneven line widths across the whole block — it now only penalizes the last line landing under a third of the average width of the lines above it. Points keep the full evenness scoring (every line, including the last, close to the same length).',
      'Point slides get a Fit Width toggle again (above Point Text / Bullets), on by default. Revealing points now size their shared box off the widest bullet in the list — rather than just the first — so the box stays a static size across the whole reveal sequence instead of risking overflow on a later, longer bullet.',
    ],
  },
  {
    version: '4.8.5',
    date: '2026-07-10',
    changes: [
      'DeckPro now warns before export if a macro or stage display you picked has no triggers checked. Picking a real macro or stage layout from Pro7 but leaving every trigger chip unchecked looked identical in the Palette editor to a fully-configured entry — but it was silently excluded from the export with no warning anywhere. If you\'ve ever had a real stage display or macro sitting in your Palette that never seemed to fire, this was almost certainly why. The pre-export warning dialog now calls it out by name so you can check the trigger chips before exporting.',
    ],
  },
  {
    version: '4.8.4',
    date: '2026-07-10',
    changes: [
      'Fixed: stage-display layouts weren\'t taking effect in ProPresenter. The stage-layout cues were being written, but with an empty reference to the physical stage screen — so ProPresenter had no screen to apply the layout to and silently ignored them. DeckPro now includes the configured stage screen (name + UUID) on every stage-layout action, so scripture/point/blank/response-card stage layouts actually switch on export again. If your stage layouts stopped working at some point, this is why.',
    ],
  },
  {
    version: '4.8.3',
    date: '2026-07-10',
    changes: [
      'Fit Width for point slides no longer gets trapped in a tall, narrow stack. Point text was capped to the palette\'s body-box width, so a longer point in a narrow box couldn\'t widen enough to break at its natural punctuation and collapsed into a stack of short lines (sometimes stranding a single word on its own line). Points may now use the full screen width, so e.g. "Being filled isn\'t about your effort; it\'s about your availability." now lays out as two lines split at the semicolon instead of five. Short points still stay on one line, and scripture is unchanged (it keeps its palette body width, which you position deliberately).',
    ],
  },
  {
    version: '4.8.2',
    date: '2026-07-10',
    changes: [
      'Internal cleanup (no output change): the slide-builder\'s element-bounds fallbacks were scattered magic numbers (e.g. body y defaulted to 729.98 in three places). Consolidated the real defaults into one place (builder DEFAULT_STYLE, now including the live badge and queue sidebar) and made the make-functions\' inline fallbacks uniform neutral placeholders (x/y=0, w/h=100) that are never reached in a normal export. Verified byte-for-byte via the golden-master suite and a real encode — every element still lands at exactly the same position.',
    ],
  },
  {
    version: '4.8.1',
    date: '2026-07-10',
    changes: [
      'Guide fix: the Technical Reference "element bounds" list wrongly implied the body/title/live/queue positions are fixed constants and listed a bottom gradient DeckPro doesn\'t actually generate. Corrected — those bounds are the default palette\'s Layout values (editable per-palette; the builder only falls back to the literals), the QR image position is the one truly hardcoded element, and the gradient is driven by a Pro7 macro, not emitted by DeckPro.',
    ],
  },
  {
    version: '4.8.0',
    date: '2026-07-09',
    changes: [
      'The Help guide is now a full user manual. Rewrote it end to end into 22 sections covering everything: getting started, a map of the whole interface, every slide type and its options, scripture & Bible lookup, points and automatic line-breaking, blank/image/custom slides, slide notes & blank-before, per-slide overrides, the response card, the entire palette system (Global → Palette → Custom, Text/Layout/Motion/Macros/Stage/Response-Card tabs, LED-wall inheritance), Fit Width, the deck library, the export flow, Pro7 & machine setup, preferences, and troubleshooting — plus a full keyboard-shortcut list and a technical reference appendix (file format, RTF, the build pipeline, style resolution, Fit Width internals, tests) for developers. Added a search box that finds any term across the whole guide, tip/warning callouts, numbered walkthroughs, and cleaner formatting throughout. Open it from ··· → DeckPro Guide.',
    ],
  },
  {
    version: '4.7.18',
    date: '2026-07-09',
    changes: [
      'The Response Card text (RC Body / RC Title on the LED wall) now inherits the main Body / Title styling the same way everything else does — leave it alone and it follows your Body/Title look live; change any of its cells and it becomes its own override; right-click an overridden RC row for "Reset to Display 1" to hand it back. This extends the Display 2 inheritance from the last update to the Response Card rows too, so every LED-wall text style is now separable with a main-screen default. Existing palettes keep their current Response Card look untouched; only new palettes start out inheriting.',
    ],
  },
  {
    version: '4.7.17',
    date: '2026-07-09',
    changes: [
      'The LED wall (Display 2) now actually inherits the main screen (Display 1) styling when you leave it alone — and lets you override any of it per row, exactly like every other setting. Previously Display 2\'s advanced styling (colour, italic/underline, alignment, margins, stroke, shadow) was locked to blank factory defaults and never followed Display 1, even when untouched — the inheritance was silently broken and had been forever. Now: a Display 2 row you haven\'t touched shows and uses Display 1\'s look live; the moment you change one of its cells it becomes its own override (keeping whatever it was inheriting as the starting point, so nothing jumps); and right-clicking an overridden Display 2 row gives you "Reset to Display 1" to hand it back. Existing palettes are untouched — their Display 2 keeps its current look; only new palettes start out inheriting.',
    ],
  },
  {
    version: '4.7.16',
    date: '2026-07-09',
    changes: [
      'Point slides now split after punctuation. Fit Width can insert real line breaks into a point\'s on-screen text so it breaks cleanly after a comma, colon, or period instead of wherever the box edge happens to fall — e.g. "Create opportunities, build relationships, and share the good news." now lays out as three lines, one per comma. It only does this when the punctuation layout genuinely reads better; short points that fit on one line stay on one line, and it never forces a break just because a comma exists. The breaks apply to the main-screen point text only — the confidence-monitor notes, the queue sidebar, and the prop/LED-wall name keep the original unbroken wording.',
    ],
  },
  {
    version: '4.7.15',
    date: '2026-07-09',
    changes: [
      'Fit Width now avoids ending a line on a "runt" word — a short conjunction, article, or preposition like "and", "the", "of", "through". Ending a line on one of those (with no comma or period to justify it) reads awkwardly on screen, so the scorer now steers the break to land on a content word instead, whenever a layout that does so is achievable at some box width. Validated across a batch of real scripture and point text: breaks like "I can do all things through / Christ…" now become "I can do all things through Christ / who…". (Cases where the only alternative would need a wider box or an extra line are left as-is — those need manually inserted line breaks, which is a separate future option.)',
      'Fit Width\'s width search is finer (12px steps instead of 24px), so it no longer skips over a better line layout that only exists in a narrow window of box widths. Still runs in ~10ms per slide.',
    ],
  },
  {
    version: '4.7.14',
    date: '2026-07-09',
    changes: [
      'Fit Width rebuilt around a weighted scoring model instead of a single rigid rule. It now proposes many candidate box widths, reads how each one actually breaks the text into lines, and scores every option against tunable penalties — preferring fewer lines, avoiding a lone short word stranded on the last line (orphans), never splitting an emphasis/bold phrase across two lines, keeping line widths even, and — for point slides — breaking after punctuation (. ! ? … : ; ,) rather than mid-clause. The lowest-cost layout wins.',
      'Fixed: Fit Width could produce a box WIDER than the palette\'s body width for schemes that inherit their layout from Global — the width cap was silently falling back to the full 1920 canvas. It is now a hard limit against the resolved body width, so Fit Width can only ever shrink the box, never grow it.',
      'Fixed: point slides whose text fit on one line were sometimes forced onto three. Fit Width was measuring point text at the Body font size instead of the (usually larger) Point size, so it computed a box too small for the real glyphs. It now measures at the correct Point size and weight.',
    ],
  },
  {
    version: '4.7.13',
    date: '2026-07-09',
    changes: [
      'Global defaults now apply to Motion (transitions + build orders), Macros, Stage Displays, and Response Card — matching the existing Text/Layout behavior. Every scheme can inherit these from Global by default, or go Custom and override them individually. New schemes start out inheriting everything; existing schemes keep their current values until you explicitly click "Reset to Global" on a field. Each area shows a "Using Global" / "Custom" badge with Reset/Push buttons, and the Global tab (read-only) now has Motion/Macros/Stage/Response Card views alongside Text/Layout.',
    ],
  },
  {
    version: '4.7.12',
    date: '2026-07-08',
    changes: [
      'New: "Point Stacked" row in the Custom grid (Display 2, under Point). Revealing points on the LED wall show previously-revealed bullets stacked above the current one — those stacked bullets now have their own independent font, weight, size, and color instead of being locked to a fixed 82% of the active Point size with no color control of their own. Also fixed the "refPhrase" queue mode (Next Reference + First Phrase) showing the same text twice when a Point slide\'s title was auto-derived from its own body text — it now collapses to just the title in that case.',
    ],
  },
  {
    version: '4.7.11',
    date: '2026-07-08',
    changes: [
      'Fix: on a "Blank slide before this one," the queue (Next Reference / Next Reference + Phrase modes) now shows the slide AFTER its own content instead of repeating that content slide. A blank-before\'s Slide Notes already preview its own content slide on the confidence monitor ahead of time, so showing it again as "next" was redundant — the queue now correctly starts from the following slide. The content slide\'s own queue, and Full List mode, are unaffected.',
    ],
  },
  {
    version: '4.7.10',
    date: '2026-07-08',
    changes: [
      'Quotes are now uniformed live, as you type or paste — not just at export. Previously DeckPro silently converted curly quotes to straight ones only in the final exported file, so the editor itself could still show a mix (macOS auto-curly quotes while typing, curly quotes pasted from Bible sites or Word docs). Now every text field and body editor normalizes immediately, so what you see always matches what exports.',
    ],
  },
  {
    version: '4.7.9',
    date: '2026-07-08',
    changes: [
      'Fix: turning on ALL CAPS for the Bold/emphasis row (Display 1 or Display 2) now actually shows up. The emphasis-marked words within a scripture body were only ever getting the base row\'s capitalization at the rendering-critical layer — the Bold row\'s own capitalization setting never reached it. Each word now carries its own explicit capitalization based on which row actually applies to it.',
      'Renamed queue format "Reference only" → "Next Reference Only" (and "Reference + first phrase" → "Next Reference + First Phrase"). Fixed the matching bug: these modes were showing the entire remaining upcoming-slide list instead of just the next slide — that\'s what "Full List" is for. Full List is unaffected.',
      'Investigated and flagged (not fixed, needs a design call): Display 2 (LED wall) styling never actually falls back to Display 1 when left untouched — every scheme creates Display 2\'s advanced styling pre-filled with factory defaults, which silently defeats the fallback check. Explicitly setting a Display 2 row still works correctly; only the "inherit from Display 1 automatically" behavior is broken, and always has been.',
      'Investigated, confirmed already correct (no change made): quote-mismatch warning counts straight and curly quotes correctly; Display 1 Title capitalization already respects its own setting; a "_V2" file-naming convention was searched for and does not exist anywhere in the app — only in a changelog line describing a feature that was seemingly never built.',
    ],
  },
  {
    version: '4.7.8',
    date: '2026-07-08',
    changes: [
      'New: "Notes Alt" row in the Custom grid (Display 3 — right under Slide Notes). This is the confidence-monitor\'s own bold/emphasis font, matching the alt look scripture uses on the main screen — previously the field that controlled this had been silently deleted from the app, so alt-marked words on the monitor never looked different from regular text. Defaults to the palette\'s Bold font, independently overridable.',
      'Fix: Display 2 (LED wall / prop) text — body, title, and point — now exports capitalization (ALL CAPS etc.) and bold at the level ProPresenter actually reads for live rendering. It was only ever reaching the embedded RTF, which is why turning on ALL CAPS or Bold for Display 2 rows visibly did nothing.',
      'Fix: the same gap existed for the main-screen Body row (and Response Card Body, which shares it) — capitalization and bold toggles on that row now reach the same rendering-critical layer as every other row.',
      'Hardening: the export audit now checks bold and capitalization at the same layer ProPresenter renders from, not just the embedded RTF — this is what caught both fixes above, and stops this class of bug from shipping silently again.',
    ],
  },
  {
    version: '4.7.7',
    date: '2026-07-08',
    changes: [
      'Fix: text elements now export the custom font weight you pick instead of always forcing bold. This affected Utility (Start/End), Point, and both Title rows (scripture reference bar + Response Card) — the chosen weight (Medium, Light, ExtraBold, etc.) is now respected, and the Bold toggle still applies on top when you turn it on. Bold-heavy defaults look unchanged because the default fonts are already heavy weights.',
    ],
  },
  {
    version: '4.7.6',
    date: '2026-07-08',
    changes: [
      'Export fixes: generated filenames now use title-cased tokens like FruitOfTheSpirit, and smart quotes are normalized before writing Pro7 files.',
      'Scheme fixes: Display 2 Point now has its own layout controls, Display 1 Response Card has separate Body and Title controls, and bold/display-2 styling now carries through export.',
      'Setup fix: Machine Setup now saves Pro7 port and password changes when you finish setup, even if you do not press Check Pro7 first.',
    ],
  },
  {
    version: '4.7.5',
    date: '2026-07-08',
    changes: [
      'Removed the "Updated!" rollback popup that appeared on launch after an update. Rollback is still available any time from the ··· menu ("Rollback to vX.Y.Z…") — it just no longer nags on startup.',
    ],
  },
  {
    version: '4.7.4',
    date: '2026-07-08',
    changes: [
      'Custom grid toggles (Stroke, Shadow, Bold/Italic/Underline/Strike) now show the global default, matching the alignment buttons: blue = on and inheriting from global, orange = a custom override, and a dim-blue dot = global has it on while your custom setting forces it off — so a toggle can no longer look plain "off" when global actually has it enabled.',
    ],
  },
  {
    version: '4.7.3',
    date: '2026-07-08',
    changes: [
      'Fix: the two "Bold" font rows in the Custom grid (Display 1 and Display 2) were tied together — changing one changed the other because both wrote the single palette bold font. Each Bold row is now an independent per-field override (Display 1 → main-screen bold, Display 2 → LED/prop bold), matching every other row. Right-click a Bold cell to reset it back to the palette font.',
    ],
  },
  {
    version: '4.7.2',
    date: '2026-07-08',
    changes: [
      'Follow-up to the Custom color fix: confirmed custom font-color edits no longer write back into the palette (the palette-wide neutral/accent colors are only ever set from the Palette tab). Also fixed a related bug where editing a Palette-tab color left a stray hidden field on the scheme; existing schemes are cleaned up automatically on load.',
    ],
  },
  {
    version: '4.7.1',
    date: '2026-07-08',
    changes: [
      'Fix: changing a font color in the Custom grid (Text tab) now overrides only that one field. Previously it wrote the palette-wide neutral/accent color, so editing one row\'s color changed every row that shared it. Each row is now an independent per-field override; right-click a cell to reset it back to the palette color.',
    ],
  },
  {
    version: '4.7.0',
    date: '2026-07-08',
    changes: [
      'New: iCloud Sync (Preferences → iCloud Sync). Opt-in per machine — keeps your palettes and preferences (display names, feature visibility, Bible defaults, book names, speakers, response card, queue format, global typography/layout) in step across your Macs through iCloud Drive. Machine-specific settings (Pro7 paths & password, export folder, API keys, theme) and the current draft never leave the computer.',
      'Sync uses smart per-section and per-palette merging with deletion tombstones — editing a palette on one Mac and a different preference on another never clobbers either, and deleted palettes stay deleted. On a same-item conflict the newer edit wins.',
    ],
  },
  {
    version: '4.6.23',
    date: '2026-07-08',
    changes: [
      'Rollback to previous version is now accessible in the ··· menu ("Rollback to vX.Y.Z…") — hidden until a backup exists, then appears next to Check for Updates.',
    ],
  },
  {
    version: '4.6.22',
    date: '2026-07-07',
    changes: [
      'Version rollback: DeckPro now backs up the previous app version before installing an update. A "Rollback" banner appears on next launch so you can revert if needed.',
    ],
  },
  {
    version: '4.6.21',
    date: '2026-07-07',
    changes: [
      'Update popup now shows the release changelog — what\'s new in the update is visible in both the update banner and the install overlay so you can read while it downloads.',
    ],
  },
  {
    version: '4.6.20',
    date: '2026-07-07',
    changes: [
      'Scripture slides now support Stacking mode for the confidence monitor. When a scripture slide is split into multiple bodies, Sequential shows only the current verse; Stacking accumulates all previous verses above the active one (matching Point\'s revealing behavior).',
    ],
  },
  {
    version: '4.6.19',
    date: '2026-07-07',
    changes: [
      'Removed Preview tab from the Palettes panel tab row (was next to Motion) — the preview is accessible via the palette card directly.',
      'Machine Setup: clicking "Skip for now" now marks setup as complete so the dialog only appears on true first launch, not every time you dismiss it.',
    ],
  },
  {
    version: '4.6.18',
    date: '2026-07-07',
    changes: [
      'Text tab alignment buttons now always show the global default position with a blue highlight. Blue = inheriting from global; orange = custom override that differs from global; dim blue ghost = where global sits while you have an override active.',
    ],
  },
  {
    version: '4.6.17',
    date: '2026-07-07',
    changes: [
      'Palettes panel: removed "Custom" section label from the tab row. Removed inline ↺ / ↑ reset+push buttons from the Palette tab and the Custom section grid — these actions are now right-click only.',
    ],
  },
  {
    version: '4.6.16',
    date: '2026-07-07',
    changes: [
      'Custom section (Text / Layout / Motion) active-state circles and toggles now render orange to match the Custom label, keeping green reserved for the Palette tier.',
    ],
  },
  {
    version: '4.6.15',
    date: '2026-07-07',
    changes: [
      'Palettes panel: "Custom" section label in the tab row now renders in orange to distinguish it from the green Palette tab.',
    ],
  },
  {
    version: '4.6.14',
    date: '2026-07-07',
    changes: [
      "Renamed: \"Scheme\" → \"Palette\" everywhere in the UI. The three-tier style hierarchy is now Global → Palette → Custom. The Palette tab sets base colors & fonts that cascade to all fields; the Custom section (Text / Layout / Motion / Preview tabs) exposes per-field overrides. The Help guide, import review screen, Test button, lock banner, and menu item are all updated.",
    ],
  },
  {
    version: '4.6.13',
    date: '2026-07-07',
    changes: [
      'Bible / Scripture Tools: reference input now smart-autocompletes book names as you type — "gen" or "ge" fills in "Genesis", "1co" fills in "1 Corinthians", etc. Works for all 66 canonical books with common abbreviations and alternate spellings. Autocomplete only fires on forward typing (not on delete). Chapter/verse portion is preserved.',
    ],
  },
  {
    version: '4.6.12',
    date: '2026-07-01',
    changes: [
      'ALT button in the body text toolbar now has proper horizontal padding — no longer cramped.',
    ],
  },
  {
    version: '4.6.11',
    date: '2026-07-01',
    changes: [
      'Response Card Hold: title element text changed from "response CARD HOLD" to "Response Card Hold".',
    ],
  },
  {
    version: '4.6.10',
    date: '2026-07-01',
    changes: [
      'Start of Notes and End of Notes: title element now exports as "-" instead of the slide label.',
    ],
  },
  {
    version: '4.6.9',
    date: '2026-07-01',
    changes: [
      "Props: Single Prop Mode is now enabled by default on every export — ProPresenter will only allow one prop to be active at a time within the DeckPro prop collection.",
    ],
  },
  {
    version: '4.6.8',
    date: '2026-07-01',
    changes: [
      "Export naming: if the same deck has already been exported, the file is automatically named _V2, _V3, etc. — first export keeps the plain name, duplicates in history get the next version suffix.",
    ],
  },
  {
    version: '4.6.7',
    date: '2026-07-01',
    changes: [
      "Schemes Text tab: changing a font for one role now only affects that role — other roles keep their palette font. Each field stores an independent override in fontFields; a ↺ button appears on overridden rows to revert back to the palette value. Colors work the same way: setting a color on an individual field's Adv is preserved rather than being overwritten by the palette on every render.",
    ],
  },
  {
    version: '4.6.6',
    date: '2026-07-01',
    changes: [
      "Fix: exporting with no margins set in schemes no longer produces a 60pt body bottom margin. Root cause: margins stored as null (not set) fell through to a hardcoded 60pt default in builder.js — changed to 0. FONT_ADV_DEFAULTS now initialises margins to 0 so what you see in the UI is what you get in the export.",
    ],
  },
  {
    version: '4.6.5',
    date: '2026-07-01',
    changes: [
      "Schemes: font family select now correctly highlights the active font after picking one. Root cause: _fontFamilyMap uses display family names (e.g. 'Noto Sans') but parseFontPS derived PostScript-split names (e.g. 'NotoSans') — added fontFamilyOf() reverse-lookup so the selected option always matches.",
    ],
  },
  {
    version: '4.6.4',
    date: '2026-07-01',
    changes: [
      "Sidebar: macro dots are now completely static — no movement on hover. Hovering directly over a dot shows an instant CSS tooltip with the macro name.",
    ],
  },
  {
    version: '4.6.3',
    date: '2026-07-01',
    changes: [
      "Sidebar: duplicate and delete actions moved from hover buttons to right-click context menu — macro dots no longer shift position on hover.",
    ],
  },
  {
    version: '4.6.2',
    date: '2026-07-01',
    changes: [
      "Sidebar: Response Card unfurl arrow now renders correctly — fixed broken selector (.si-left → .slide-icon) so the chevron button appears and RC Blank / RC Content / RC Hold expand as expected.",
    ],
  },
  {
    version: '4.6.1',
    date: '2026-07-01',
    changes: [
      "buildProp.js: prop reference (title bar) element now defaults to SCALE_BEHAVIOR_SCALE_FONT_DOWN — parity with builder.js fix in 4.6.0.",
      "builder.js: point body yOffset reads pointFontAdv.yOffset first (with boldFontAdv fallback for compatibility) — matches buildProp.js behavior.",
      "Test suite: added buildProp.test.js (27 tests) for prop cue structure, scaleBehavior defaults/overrides, canvas size, and multi-spec output.",
      "Audit: full advFull sweep (17 checks each) now covers propBodyFontAdv, propTitleFontAdv, pointFontAdv, and startEndFontAdv. Added liveFontAdv and queueFontAdv checks. Total: 156 fields, 0 hard failures.",
      "Audit: queueX/Y/W/H promoted to hard check; notesFontAdv.color reclassified as confirmed-dead (rtfNotes hardcodes white colortbl).",
    ],
  },
  {
    version: '4.6.0',
    date: '2026-07-01',
    changes: [
      "Version bump: 4.5.x introduced enough new features (global layout/fontAdv baselines, sidebar resize, live preview sync, alignment SVG icons, macro override ring badges, start/end chips) to warrant a minor-version increment.",
      "buildProp.js: prop reference (title bar) element now inherits SCALE_BEHAVIOR_SCALE_FONT_DOWN by default, matching builder.js fix from 4.5.5 — parity between the two element builders.",
      "Test suite: added buildProp.test.js (27 tests) covering scripture/point/revealing/response-card prop structure, scaleBehavior defaults and overrides, canvas size inheritance, and multi-spec output. Suite now runs 100 tests across 7 test files + 300-deck fuzz.",
      "Audit: full advFull sweep (17 checks each) added for propBodyFontAdv, propTitleFontAdv, pointFontAdv, and startEndFontAdv — all major text-style objects now get full coverage. queueX/Y/W/H promoted to hard check (was soft). notesFontAdv.color reclassified as confirmed-dead (rtfNotes hardcodes white colortbl). Audit now covers 150 fields.",
      "builder.js: point body yOffset now reads pointFontAdv.yOffset first, falling back to boldFontAdv.yOffset for backwards compatibility — matches buildProp.js behavior.",
      "Audit: added liveFontAdv (color+RTF, marginLeft, marginTop) and queueFontAdv (color+RTF, marginLeft, marginTop) checks — these are user-facing scheme controls that previously had zero coverage. Audit now covers 156 fields.",
    ],
  },
  {
    version: '4.5.5',
    date: '2026-07-01',
    changes: [
      "Sidebar collapse/expand: new chevron button in the Add Item header collapses the sidebar; a floating tab on the left edge re-opens it.",
      "ALT format button now uses small-caps styling for a cleaner toolbar look.",
      "Macro Override ring badge: slides with a macroOverride now show a hollow ring dot in the sidebar (distinct from the filled macro-trigger dot).",
      "Notes mode button renamed from 'Auto' to 'Intelligent'.",
      "Start/End slides now show macro and stage chips in the form heading (matching all other slide types).",
      "Layout tab: position/size fields now update the canvas preview live without requiring a re-render.",
      "Text tab: clicking a row highlights the matching canvas preview region (row → preview, bi-directional with the existing preview → row click).",
      "Alignment icon buttons now use inline SVG icons instead of ○/● pseudo-elements, and show a grey tint on the button matching the global default value.",
    ],
  },
  {
    version: '4.5.4',
    date: '2026-06-30',
    changes: [
      "Global adv baseline: caps, scale, alignment, formatting (bold/italic/underline/strike), stroke, and shadow fields now all support \"Push to global\" and \"Reset to global\" — right-click any text-tab cell to manage overrides. Green highlight means the value differs from the global baseline.",
    ],
  },
  {
    version: '4.5.3',
    date: '2026-06-30',
    changes: [
      "Global layout baseline: layout fields (positions, sizes) now have a global default just like typography. New schemes inherit all layout from global. Right-click any layout cell to \"Push to global\" or \"Reset to global\" to manage overrides. The layout tab shows green only when a field differs from the global baseline.",
    ],
  },
  {
    version: '4.5.2',
    date: '2026-06-30',
    changes: [
      "Response Card display 1 now uses the scheme's body + title elements (just like a scripture slide) — the response text as body, \"Response N\" as title. The full grid layout is display 2 only.",
    ],
  },
  {
    version: '4.5.1',
    date: '2026-06-30',
    changes: [
      "Text tab override highlighting: cells now only show green when the scheme value actually differs from global — matching-global values (and null/inherited values) show no indicator.",
    ],
  },
  {
    version: '4.5.0',
    date: '2026-06-30',
    changes: [
      "Removed the protected \"Default\" scheme — all schemes are now equal; any can be renamed, deleted, or left unlocked.",
      "Global panel redesigned: now shows the same Text + Layout spreadsheet grids as a regular scheme, but read-only, so you can see exactly what your global defaults look like.",
    ],
  },
  {
    version: '4.4.9',
    date: '2026-06-30',
    changes: ["Layout tab redesigned as a spreadsheet grid matching the Text tab style — sticky headers, section rows, override highlighting (green tint + green text on values that differ from defaults), and right-click → Reset to default on any changed cell."],
  },
  {
    version: '4.4.8',
    date: '2026-06-30',
    changes: ["Text tab grid: scheme override cells now show a green tint + green border on the input/select inside, with no cell-level outline border."],
  },
  {
    version: '4.4.7',
    date: '2026-06-30',
    changes: ["Text tab grid: alignment button cells no longer show the green scheme-override border — the filled dot already indicates an active value."],
  },
  {
    version: '4.4.6',
    date: '2026-06-30',
    changes: ["Removed the 'Show element fills' toggle from the Text tab."],
  },
  {
    version: '4.4.5',
    date: '2026-06-29',
    changes: ["Text tab grid: row labels are now Title Case (Body, Bold, Title, Point, Live Badge)."],
  },
  {
    version: '4.4.4',
    date: '2026-06-29',
    changes: [
      "Text tab grid: scheme-overridden cells now show a green outline + subtle tint so you can see at a glance what's been customized vs. inheriting from Global.",
      "Right-click any grid cell to reset it to its global default or push its value up to global.",
    ],
  },
  {
    version: '4.4.3',
    date: '2026-06-29',
    changes: ["Text tab canvas preview widened to 700px."],
  },
  {
    version: '4.4.2',
    date: '2026-06-29',
    changes: [
      "Text tab grid: bold rows (Display 1 + Display 2) now show editable font family and weight selects — they route through the typography palette system (same as the Palette tab's Bold/ALT slot) so changes propagate correctly.",
    ],
  },
  {
    version: '4.4.1',
    date: '2026-06-29',
    changes: [
      "Text tab canvas preview resized to 530px — wider than the initial compact size but still leaves room for the grid below.",
    ],
  },
  {
    version: '4.4.0',
    date: '2026-06-29',
    changes: [
      "Text tab redesigned as a spreadsheet-style data grid: one row per element (Display 1 body/bold/title/point, Display 2 body/bold/title/point, Display 3 Slide Notes, Utility/Live/Queue), columns for font family, weight, color, size, B/I/U/S, capitalization, scale, H/V alignment, stroke, shadow, character spacing, line height, paragraph spacing, and margins. The layout canvas preview stays at the top and clicking a region highlights the matching row.",
      "Inherit icon buttons (↺ use-global, ↑ push-to-global) now embed directly inside the font family dropdown in the Palette tab — no separate row needed.",
      "Color picker in the Palette tab no longer closes mid-interaction when dragging within the picker.",
    ],
  },
  {
    version: '4.3.31',
    date: '2026-06-29',
    changes: [
      "Inherit system overhaul: typography now flows Global → Scheme → Custom. Every font/color/size field shows a Global (blue) or Scheme (green) badge so you can see exactly where each value comes from.",
      "New 'Palette' tab in Schemes: set Font 1 (body/regular), Font 2 (title/highlight), Bold, Neutral color, and Accent color — the 5 scheme-level slots that all text fields inherit from.",
      "'Global' view in the scheme selector: read-only view of your house-style defaults. Values only change when you push from a scheme.",
      "Push to Global now shows a confirmation dialog: how many schemes will pick up the change and how many have custom values that won't be touched.",
      "Renamed internal typography keys: regularFont → font1, highlightFont → font2, regularColor → colorNeutral, highlightColor → colorAccent. Existing saved data migrates automatically.",
      "Bold/ALT font is now its own palette slot (boldFont) independent of Font 1, with a global default of Montserrat-Black.",
    ],
  },
  {
    version: '4.3.30',
    date: '2026-06-27',
    changes: [
      "New Schemes → Response Card tab: full control over the LED wall (display 2) response card. Each element — Title, Decision, Response 1–3 — is editable: name, position (X/Y/W/H), font, size, colour, and alignment. Decision and Response 1–3 text still comes from the Response Card item in your deck; Title and custom text are set here.",
      "+ Add Element on the Response Card tab adds custom fields with their own name (also the ProPresenter object name), text, position, and styling — put whatever you want on the LED wall card.",
      "Empty font/size/colour on an element inherit your scheme's prop fonts, so existing response cards are unaffected until you tweak them.",
    ],
  },
  {
    version: '4.3.29',
    date: '2026-06-27',
    changes: [
      "Point text now uses the same multi-line editor as scripture (paste-friendly, supports line breaks) — just without the bold/italic formatting buttons, since point text is plain. The slide name and prop name stay single-line.",
    ],
  },
  {
    version: '4.3.28',
    date: '2026-06-27',
    changes: [
      "Preflight now warns about hard returns (blank lines) before or after the text on scripture and point slides — the kind of trailing empty lines that sneak in from a copy-paste and push the text off-center. Comes with a one-click Fix. Intentional line breaks inside the text are left alone.",
    ],
  },
  {
    version: '4.3.27',
    date: '2026-06-27',
    changes: [
      "Point text alignment now applies correctly on both the main screen and the LED wall prop. Center always worked, but Left/Right were ignored on the element (the box was hardcoded to center) — now the paragraph alignment matches the Advanced → Alignment you choose. Centered points are unchanged.",
    ],
  },
  {
    version: '4.3.26',
    date: '2026-06-27',
    changes: [
      "Schemes → Text now has Live badge and Queue cards — set the font, size, and color of the \"live\" confidence-monitor badge and the upcoming-slide queue strip, just like the other text roles. Defaults are unchanged, so existing decks export identically until you tweak them.",
    ],
  },
  {
    version: '4.3.25',
    date: '2026-06-27',
    changes: [
      "New Deck: the Speaker field is now a dropdown of your recurring speakers. Type a new name and on create you'll be asked \"Add as a permanent speaker?\" — say yes and it's remembered for next time.",
      "Preferences → Speakers: manage your permanent speaker list (add / remove).",
      "Removed the confusing \"Show on LED wall during blank\" toggle from the blank-before section. The Custom Confidence Monitor text box stays.",
    ],
  },
  {
    version: '4.3.24',
    date: '2026-06-27',
    changes: [
      "File names now use a 2-digit year (Message_26.06.24_… instead of 2026.06.24).",
      "Schemes → Motion: removed the retired ATEM gradient element from the build-order lists, and renamed \"this slide\" to \"body\" everywhere. Existing saved schemes are migrated automatically (gradient build steps dropped, \"this slide\" → \"body\").",
    ],
  },
  {
    version: '4.3.23',
    date: '2026-06-27',
    changes: [
      "Props (LED wall) now honor Advanced → Stroke and Advanced → Shadow, matching the fix made for the main screen. The prop text-element builder had its own hardcoded stroke/shadow that the previous fix didn't reach; it now uses the same text-level stroke width/color and shadow as the main presentation. Prop text color already worked via the shared RTF fix.",
    ],
  },
  {
    version: '4.3.22',
    date: '2026-06-26',
    changes: [
      "FIXED text stroke and shadow not applying in ProPresenter. The scheme's stroke (width/color) and shadow (color/offset/blur/opacity/angle) were being written to the element-level fields, but ProPresenter renders the TEXT outline and drop-shadow from different fields (text stroke width, stroke color in the RTF, and the text shadow). Now Advanced → Stroke and Advanced → Shadow on body, point, Start/End, and title text actually render. Verified end-to-end in ProPresenter (e.g. width-8 red stroke + offset-35 green shadow appear exactly as set).",
    ],
  },
  {
    version: '4.3.21',
    date: '2026-06-26',
    changes: [
      "FIXED the real cause of text colors not applying in ProPresenter. The RTF expanded color table was misaligned (it included an extra leading white entry), so ProPresenter — which prefers the expanded table — read the wrong color slot: text came out white with the chosen color landing on the stroke instead. Now point text, Start/End text, scripture body, titles, and revealing points all honor their Advanced → Color setting. Verified end-to-end in ProPresenter across every slide type.",
    ],
  },
  {
    version: '4.3.20',
    date: '2026-06-26',
    changes: [
      "Full scheme-field export audit (every field verified end-to-end via a new differential-export harness). Fixed several controls that were silently ignored on export:",
      "Point text color (Advanced → Color) now applies on the main screen and LED wall — was always white.",
      "Start/End (Utility) text color now applies — was always white.",
      "Revealing-points text color now applies — was always white.",
      "Title line height and 'spacing before' now apply to the reference bar — were ignored.",
      "Bold and Strikethrough toggles in the font Advanced panel now actually work on export — previously had no effect.",
      "Removed dead scheme fields with no export effect: titleText and titleShadow (title text color is controlled by Title → Advanced → Color), and the Bold-in-Body fonts (boldFont/propBoldFont) — emphasis renders as bold on the body font. Existing schemes are migrated automatically.",
    ],
  },
  {
    version: '4.3.19',
    date: '2026-06-26',
    changes: [
      "Start/End element now uses the scheme Utility font size instead of hardcoded 45.",
      "Response card body row now uses the scheme body font name and size.",
      "Response card body RTF default size corrected to 44 to match scheme default.",
    ],
  },
  {
    version: '4.3.18',
    date: '2026-06-26',
    changes: [
      "Body text color now respects the color field in Advanced — previously always white.",
      "Title bar fill now uses the scheme Title Fill color (when Fill is enabled) instead of always being transparent.",
      "Font Advanced margins now default to null so the Layout-tab body margins actually take effect on fresh schemes — previously the fontAdv 0 default silently shadowed them.",
      "Body element font size attribute now uses the scheme body size instead of a hardcoded 44.",
      "Title element font size attribute now uses the scheme title size instead of a hardcoded 40.",
      "Response card body rows now pass the active scheme to the RTF generator — previously used hardcoded defaults.",
    ],
  },
  {
    version: '4.3.17',
    date: '2026-06-26',
    changes: [
      "Removed dead scheme fields: notesBoldFont (never used), gradientX/Y/H (gradient handled by Pro7 macro since v4.0.2). No export behavior changes.",
    ],
  },
  {
    version: '4.3.16',
    date: '2026-06-24',
    changes: [
      "Body bottom margin now respects the DeckPro value instead of being hardcoded to 60.",
      "Point layout controls added to Schemes (was missing).",
      "Scheme colors no longer bleed into every other scheme — each scheme's color is now isolated.",
      "Queue mode now exports the selected option (reference-only vs list) instead of always using list.",
      "Reference Bar renamed to Title; Start / End renamed to Utility throughout.",
      "Response Card main slide now shows the title text 'Response Card'.",
      "Response Card title and body fonts now carry the scheme styles.",
      "Response Card title no longer gets accidental scaling.",
      "Response Card Hold now uses Utility formatting.",
      "Response Card prop now exports correctly.",
      "Queue and live element margins now respected from scheme values.",
    ],
  },
  {
    version: '4.3.15',
    date: '2026-06-24',
    changes: [
      "SLIDE # macro and stage display badges now appear on the blank-before row, not the content slide — matching where the trigger actually fires in the export.",
    ],
  },
  {
    version: '4.3.14',
    date: '2026-06-24',
    changes: [
      "SLIDE # triggers now number cues by their actual output position, so SLIDE #2 targets the 2nd exported cue (the blank-before, if present) — not the parent scripture or point slide.",
    ],
  },
  {
    version: '4.3.13',
    date: '2026-06-24',
    changes: [
      "Custom confidence-monitor text now appears as a clean Overrides-style disclosure instead of a bulky boxed field.",
    ],
  },
  {
    version: '4.3.12',
    date: '2026-06-24',
    changes: [
      "Removed the incorrect alternate name option for Revelation. DeckPro now keeps that one correct.",
    ],
  },
  {
    version: '4.3.11',
    date: '2026-06-24',
    changes: [
      "Preferences no longer shows the raw Live Macros from Pro7 UUID list. Macros are managed in Schemes → Macros, where the picker belongs.",
    ],
  },
  {
    version: '4.3.10',
    date: '2026-06-24',
    changes: [
      "Pro7 setup now has an Export Library dropdown, so teams with multiple ProPresenter libraries can choose exactly where DeckPro saves new .pro files. Auto-select still follows Pro7's active library.",
    ],
  },
  {
    version: '4.3.9',
    date: '2026-06-24',
    changes: [
      "Machine Setup Pro7 Folder card now hides Auto-detect and Browse once a folder is confirmed — only Clear is shown. Clicking Clear brings the controls back.",
    ],
  },
  {
    version: '4.3.8',
    date: '2026-06-24',
    changes: [
      "Machine Setup now has a Pro7 Folder field. Pick the folder that contains Configuration and Libraries, such as Documents/ProPresenter on machines with a custom ProPresenter library.",
      "Export now derives both Configuration/Props and the active library from that Pro7 Folder, with Export Library available when you want to choose the destination yourself.",
      "The Pro7 Folder card now has one Auto-detect button that scans, chooses the best ProPresenter folder, saves it, and turns the card green. Details shows the full path scan when you want reassurance.",
    ],
  },
  {
    version: '4.3.7',
    date: '2026-06-24',
    changes: [
      "Machine Setup: first-run setup modal for new computers covers Pro7 connection, Pro7 library folder, API.Bible, macros/stage displays, and a path scan. Reopen it anytime from the ··· menu.",
      "Settings persistence moved out of browser localStorage and into DeckPro's app-data state file, so API.Bible key, Pro7 port/password, speaker notes, and current deck state survive relaunches even though the app uses a private random local port.",
      "Diagnostic bundles now include the machine setup scan, showing DeckPro's data folder, saved-state status, deck library location, and detected Pro7 workspace folders.",
    ],
  },
  {
    version: '4.3.6',
    date: '2026-06-23',
    changes: [
      "Preferences → Pro7 Connection now has a Library Folder field. Click Browse to point DeckPro at the exact folder where Pro7 stores its library — no more auto-detection guesswork. Leave blank to keep using auto-detect.",
    ],
  },
  {
    version: '4.3.5',
    date: '2026-06-23',
    changes: [
      "Fix: export now scans all Pro7 workspace locations (UserWorkspaces and Workspaces, including UUID-named subfolders) to find the active library — files no longer fall back to ~/Documents/ProPresenter on machines with a non-standard Pro7 folder layout.",
    ],
  },
  {
    version: '4.3.4',
    date: '2026-06-23',
    changes: [
      "Fix: DeckPro now creates the UserWorkspaces folder automatically if it doesn't exist, so export works on machines where Pro7 hasn't created it yet.",
    ],
  },
  {
    version: '4.3.3',
    date: '2026-06-23',
    changes: [
      "Fix: export and prop injection now work on machines where Pro7 uses the older Workspaces folder instead of UserWorkspaces (different Pro7 install versions). DeckPro checks both locations automatically.",
    ],
  },
  {
    version: '4.3.2',
    date: '2026-06-23',
    changes: [
      "Fix: macro and stage display badges in the sidebar no longer change appearance (blue highlight / orange tint) when a deck item is selected.",
    ],
  },
  {
    version: '4.3.1',
    date: '2026-06-23',
    changes: [
      "Fix: the stage layout picker now uses the same full search modal as the macro picker — search box, name + UUID rows, Refresh, and multi-select Add N when adding new entries. The old tiny popover is gone.",
    ],
  },
  {
    version: '4.3.0',
    date: '2026-06-23',
    changes: [
      "Stage tab in Schemes is now a sandbox — no more hardcoded Screen / RC Layout / Message Layout roles. Click '+ Add Stage Display' to pick any Pro7 stage layout from the list, then assign it trigger types (same checkboxes as Macros) and/or specific Slide # positions. Each entry is fully independent with read-only name and UUID (Pick to change). Stage Screen (the physical target screen) is configurable via a single Pick row at the top of the tab.",
      "Stage display paintbrush badges in the sidebar and chips next to slide names now respect the new trigger-based system — they appear on exactly the slides whose type or position matches the configured triggers.",
      "Migration: existing role-based stage display entries (Message Layout / RC Layout) and the old global Stage Screen config are automatically converted to the new format on first load.",
    ],
  },
  {
    version: '4.2.5',
    date: '2026-06-23',
    changes: [
      "Fix: macro dots in the sidebar were crashing renderSidebar (a temporal-dead-zone bug in macroBadgeHTML caused any slide with assigned macros to throw, leaving the queue blank). Sidebar now stays stable after toggling macro triggers in Schemes.",
      "Slide # trigger: in Schemes → Macros, each macro now has a Slide # row below its type triggers. Type a slide number and press Enter to add it as a chip — that macro will fire whenever the deck reaches that exact slide position, regardless of type. Remove any chip with ×. The dot and chip badges in the sidebar and main panel both reflect position-based triggers.",
    ],
  },
  {
    version: '4.2.4',
    date: '2026-06-23',
    changes: [
      "Response Card in the sidebar is now an expandable group. Click the arrow to unfurl three sub-items — RC Blank, RC Content, and RC Hold — each showing their own macro dots and stage display paintbrush badges inline.",
      "Macro trigger 'Response Card' has been split into three separate triggers: RC Blank (slide 1), RC Content (slides 2–5), and RC Hold (slide 6). Existing macros assigned to Response Card are automatically migrated to RC Content.",
    ],
  },
  {
    version: '4.2.3',
    date: '2026-06-23',
    changes: [
      "Sidebar: a paintbrush icon now appears next to macro dots on any slide that has a stage display entry attached from the scheme — muted by default, orange when the slide is selected.",
      "Main panel: macro name chips and stage display chips (paintbrush + layout name, orange) appear inline next to the slide title when you open a slide — so you can see exactly what fires at a glance, without guessing from dots alone.",
    ],
  },
  {
    version: '4.2.2',
    date: '2026-06-23',
    changes: [
      "Stage Display moved from Preferences → Advanced IDs into Schemes → Stage tab. Each scheme now carries its own stage display entries (Screen, RC Layout, Message Layout) — the same card-row style as Macros, with Add / Remove and a Pick button for layouts. Your existing Stage Display values are automatically migrated to your default scheme.",
    ],
  },
  {
    version: '4.2.1',
    date: '2026-06-23',
    changes: [
      "Google Doc view: text is now readable — the document area uses a light paper background so black Google Doc text shows up clearly in DeckPro's dark UI.",
      "Google Doc zoom: use the + / − buttons in the notes header to resize the document text from 60% to 200%. Handy when skimming a long sermon doc.",
      "Speaker Notes tab is now the first tab in the notes panel (was Outline first).",
      "Fixed: the app no longer binds to port 3000, so a leftover dev server can never intercept the UI. The Electron app picks a free port at launch and loads its own private server.",
    ],
  },
  {
    version: '4.2.0',
    date: '2026-06-23',
    changes: [
      "Smart Notes: paste a Google Doc link and DeckPro now loads it as a real, readable document inside the Speaker Notes panel — your headings, bold, and highlight colors all come through — instead of a flat PDF. (PDFs still load as before.)",
      "Suggested Slides tray (Auto mode): DeckPro scans the doc and suggests Scripture slides (detected from references like “Ephesians 5:18”, “2 Corinthians 3:18”, even “Sirach 38:4”) and Point slides (from headings). A heading followed by a bullet list defaults to Single but keeps a Revealing option on the card. Each suggestion shows a type chip, confidence, and a “⚠ in deck” duplicate warning. Click Add (scripture runs your Bible lookup automatically) or Ignore.",
      "Manual mode (default): nothing is pulled automatically — select any text in the notes and choose Add as Scripture / Point / Confidence. Deterministic and fully under your control; the deck is never touched until you click Add.",
      "Style Map (⚙ in the notes header): map this doc's heading levels and highlight colors to slide types — e.g. blue highlight → Scripture, yellow → Confidence note, a heading style → Ignore. Auto-discovers whatever styles are in your doc, so it adapts to anyone's conventions; mappings persist and re-scan instantly.",
      "Style Map Content role: mark a highlight color as Content when you mean “this should become a slide.” DeckPro now figures out Scripture vs Point, and the new “Refs without highlight” option lets the Bible reference stay unhighlighted above the highlighted verse text.",
    ],
  },
  {
    version: '4.1.1',
    date: '2026-06-23',
    changes: [
      "Fixed: Export button could get permanently stuck at 'Exporting…' if any error occurred before the request was sent (e.g. a corrupted slide span). The error is now caught and shown as a toast, and the button always resets.",
    ],
  },
  {
    version: '4.1.0',
    date: '2026-06-22',
    changes: [
      "Macros are now per-scheme — add and remove macros in Schemes → Macros tab, not in Preferences. Each scheme carries its own macro list, so different looks can trigger different macros. Existing macros are automatically migrated to your default scheme.",
      "Stage Display (Preferences → Advanced IDs) redesigned to match the Macros card-row style — screen, RC layout, and message layout each appear as their own labeled card with editable name and UUID fields.",
    ],
  },
  {
    version: '4.0.9',
    date: '2026-06-22',
    changes: [
      "Tooltip delay increased from 320ms to 700ms — they no longer flash on accidental hover.",
      "Tooltip content centralized: all tooltip text now lives in a single TOOLTIPS object at the top of the source, making it easy to audit and edit everything in one place.",
      "Fixed Bold (B) tooltip — it previously said Montserrat-Black (that's the Emphasis/ALT button). Bold is the bold weight of the current scheme font.",
    ],
  },
  {
    version: '4.0.8',
    date: '2026-06-22',
    changes: [
      "Stage Display layouts can now be picked directly from Pro7 (Preferences → Stage Display). When connected, click Pick next to the RC Layout or Message Layout field to choose from live stage layouts — name and UUID fill in automatically. Screen name and UUID remain manual (they identify your physical display).",
    ],
  },
  {
    version: '4.0.7',
    date: '2026-06-21',
    changes: [
      "Feature Visibility (Preferences) is now an expandable section with grouped checkboxes under headers \u2014 Slide fields, Overrides, and Scripture tools \u2014 and gained new toggles: hide the whole Overrides section, the Fit Width / Strip buttons, and the Verses (Bible formatting) button. Hiding a field only simplifies the editor; it never changes exports.",
    ],
  },
  {
    version: '4.0.6',
    date: '2026-06-21',
    changes: [
      "Queue format options (Preferences \u2192 Queue). The upcoming-slide strip can now show: Reference only \u2014 e.g. \u201cEphesians 5:18\u201d (new default, cleaner than the old full labels); Reference + first phrase; or the Full label list. Scripture entries show the clean reference instead of the truncated slide name.",
    ],
  },
  {
    version: '4.0.5',
    date: '2026-06-21',
    changes: [
      "Tooltips everywhere (first pass): hover almost any control \u2014 Fit Width, Strip, Verses, the Overrides section, Prop Name, Blank Before, Show-during-blank, Stage Layout / Transition / Macro overrides, Point Single vs Revealing, the B / I / U / ALT buttons, Reference, and the scheme toolbar \u2014 to see a short title plus a plain-English explanation. More to come.",
    ],
  },
  {
    version: '4.0.4',
    date: '2026-06-21',
    changes: [
      "Response Card confidence-monitor notes are now a customizable template (Response Card panel \u2192 Notes). Write whatever you want and drop in merge tags \u2014 {decision}, {r1}, {r2}, {r3} \u2014 that auto-fill from your decision text and responses, mail-merge style. Defaults to the previous format; Reset to default restores it.",
    ],
  },
  {
    version: '4.0.3',
    date: '2026-06-21',
    changes: [
      "Macro Override (in a slide's Overrides) now lets you select from the macros you've already configured \u2014 a clean list with colored dots, like the Schemes macro list \u2014 instead of re-opening the Pro7 import picker. Pick one, or \u201cNone\u201d to clear.",
    ],
  },
  {
    version: '4.0.2',
    date: '2026-06-21',
    changes: [
      "The dark gradient overlay is no longer generated on any slide \u2014 it's handled by a Pro7 macro now, so DeckPro leaves it alone. Removed the matching Gradient row from the Layout tab.",
      "Schemes: the default scheme now re-locks automatically when you leave the Schemes panel, so it can't be changed by accident \u2014 unlock it again any time you need to edit.",
    ],
  },
  {
    version: '4.0.1',
    date: '2026-06-21',
    changes: [
      "The Start slide is now labelled \u201cStart of Notes\u201d to match \u201cEnd of Notes\u201d (existing decks migrate automatically).",
      "Schemes \u2192 Layout now uses your Display Names: the \u201cMain Canvas\u201d / \u201cProp Canvas\u201d section headers and preview labels show your Display 1 / Display 2 names instead.",
      "Help: keyboard shortcuts are no longer duplicated under Overview \u2014 they live in the dedicated Shortcuts tab (Overview now just points there).",
    ],
  },
  {
    version: '4.0.0',
    date: '2026-06-21',
    changes: [
      "DeckPro v4 \u2014 a stability and hardening milestone. Headlines below; everything from the 3.4x series is rolled in.",
      "Macros, reworked: a clean Macros section (import any macro from Pro7, no built-ins), triggers assigned per slide-type in Schemes, per-slide Macro Override, and sidebar dots that show every macro on a slide (hover for the name).",
      "Bible verse numbers: a Verses button adds the real verse number in front of each verse, superscript or inline \u2014 pulled from actual verse boundaries, so embedded numbers in the text are never mistaken for verse markers.",
      "Per-slide Overrides: stage layout, transition, prop transition, and macro override grouped in one collapsible section on every slide.",
      "Polish: hover-anywhere tooltips (no icons), insert-line drag-to-reorder, Response Card decision-text lock, generic input placeholders, Preferences-above-Schemes menu order.",
      "Export correctness fixes that were silently wrong before: per-slide macro overrides now actually fire; stage-layout override works on points; Custom slides export as a blank slot instead of vanishing; image slides honor blank-before; B/I/U buttons work.",
      "No silent failures: save/load/library/storage problems now warn you instead of failing quietly, and a corrupt saved deck is backed up rather than discarded.",
      "Under the hood: an automated test suite (RTF, builder, verse chain, protobuf round-trip, golden-master exports, and a fuzzer that throws hundreds of random decks at the pipeline) gates every build, plus Help \u2192 Export Diagnostic Bundle for troubleshooting. Verified end-to-end against real ProPresenter.",
    ],
  },
  {
    version: '3.49.0',
    date: '2026-06-21',
    changes: [
      "New: Help menu (···) → Export Diagnostic Bundle. Saves a JSON snapshot for troubleshooting \u2014 app version, platform, settings (with your API key and Pro7 password excluded; only a yes/no flag that they are set), deck and scheme summary, macro setup, Pro7/library status, recent export history, and the last captured errors. Hand it over when reporting a problem instead of screenshots.",
    ],
  },
  {
    version: '3.48.8',
    date: '2026-06-21',
    changes: [
      "Fix: image slides now honor the \u201cBlank slide before this one\u201d toggle. It was exposed in the UI and saved, but the export pipeline ignored it for images (it worked for scripture and point). Now an image with blank-before gets its blank cue.",
      "Added a fuzz tester to the suite \u2014 it pushes hundreds of random decks (weird punctuation, emoji, empty bodies, 100-slide decks, random overrides) through the export pipeline and asserts it never throws, never drops a slide, and always produces valid ProPresenter output.",
    ],
  },
  {
    version: '3.48.7',
    date: '2026-06-21',
    changes: [
      "No more silent failures on save: if local storage is full or blocked, DeckPro now warns you (once) that changes are not being saved \u2014 instead of quietly losing work.",
      "If a saved deck can't be read on startup, DeckPro now keeps a backup copy and tells you, rather than silently replacing it with a blank deck.",
      "Changing the library location now surfaces an error toast if it fails, instead of doing nothing.",
      "Added golden-master export tests (5 known-good decks compared field-by-field) to the npm test suite \u2014 release hardening so export regressions can't slip through unnoticed.",
    ],
  },
  {
    version: '3.48.6',
    date: '2026-06-21',
    changes: [
      "Fix: the B / I / U formatting buttons now work \u2014 clicking one no longer collapses your text selection before the format is applied. (The buttons were missing the focus guard the ALT button already had.) \u2318B/\u2318I/\u2318U keyboard shortcuts continue to work too.",
    ],
  },
  {
    version: '3.48.5',
    date: '2026-06-21',
    changes: [
      "Fix: sidebar macro indicators now show every macro assigned to a slide type, not just the first \u2014 a slide triggering multiple macros (e.g. message content + no logo + gradient on Scripture) now shows a colored dot for each. Hover a dot to see the macro name.",
    ],
  },
  {
    version: '3.48.4',
    date: '2026-06-21',
    changes: [
      "Fix (v4 audit pass 3): Response Card decision-text Unlock/Lock now works \u2014 it called a function that did not exist, so unlocking silently did nothing.",
      "Fix: picking or clearing a per-slide Macro Override now refreshes the editor immediately (same missing-function bug \u2014 the panel did not update after choosing a macro).",
      "Fix: editing a Start/End slide label now updates the deck sidebar live.",
    ],
  },
  {
    version: '3.48.3',
    date: '2026-06-21',
    changes: [
      "Fix (v4 audit pass 2): per-slide Macro Override now actually fires on export \u2014 it was being silently dropped before reaching ProPresenter for every slide type.",
      "Fix: Stage Layout Override on Point slides now exports (was dropped for points; scripture/blank/image already worked).",
      "Fix: Custom slides no longer vanish on export \u2014 they now export as a blank slide carrying their label, instead of being silently discarded at two layers.",
      "Added an automated regression test suite (builder, verse-number chain, protobuf round-trip) run via npm test to protect the export pipeline going forward.",
    ],
  },
  {
    version: '3.48.2',
    date: '2026-06-21',
    changes: [
      "Internal cleanup (v4 audit pass 1): removed dead code \u2014 unused functions (syncStyleButton, blankBeforeRow, spansToText, plainFromSpans, loadDecks, validateFont, and the unreachable download/output-mode dialog), the vestigial outputMode config, and orphaned CSS for UI that no longer exists. No behavior change.",
    ],
  },
  {
    version: '3.48.1',
    date: '2026-06-21',
    changes: [
      "··· menu: Preferences now appears above Schemes.",
      "View menu: renamed \u201cSettings\u201d to \u201cPreferences\u201d so it matches the rest of the app.",
    ],
  },
  {
    version: '3.48.0',
    date: '2026-06-21',
    changes: [
      "Bible formatting: new \u201cVerses\u201d button above the scripture body opens a popover to add verse numbers in front of each verse, with a superscript / inline toggle.",
      "Verse numbers are pulled from the real verse boundaries returned by API.Bible (not guessed per slide), so multi-verse slides number each verse correctly and embedded numbers in the text are left alone.",
      "Setting is a global default \u2014 set it once and every Bible lookup follows it. Toggling re-fetches the current verse; turning it off strips the numbers.",
      "Verse numbers render as superscript in the exported slide, prop, and slide notes; the digit-artifact warnings ignore intentional verse numbers.",
    ],
  },
  {
    version: '3.47.1',
    date: '2026-06-21',
    changes: [
      "Fix: app icon no longer appears blank in the Dock — the build now uses the complete DeckPro.icns (all sizes up to 1024px) instead of a broken Icon Composer .icon file whose only layer was hidden. Also removed the CFBundleIconName=AppIcon override that made macOS look for a non-existent asset-catalog icon.",
    ],
  },
  {
    version: '3.47.0',
    date: '2026-06-21',
    changes: [
      "Tooltips: hover any label with a tip to see a description (no extra icons — the label itself is the trigger).",
      "Drag to reorder: indicator is now an insertion line between slides rather than a highlighted target slot.",
      "Scripture slides: Verse # toggle prefixes each slide with its verse number (auto-extracted from reference). Sup toggle makes it superscript in the export.",
      "Overrides section: stage layout, transition, and macro override are now grouped in a collapsible Overrides disclosure at the bottom of each slide editor.",
      "Macro Override: each slide can fire a specific macro on advance, independent of scheme trigger settings.",
      "Response Card decision text is now locked by default. Click it to unlock with a confirmation prompt; a Lock button re-locks it.",
    ],
  },
  {
    version: '3.46.4',
    date: '2026-06-21',
    changes: [
      "Guide: added Keyboard Shortcuts tab listing all ⌘ shortcuts by category.",
      "Placeholder text in input fields is now generic (no sermon-specific examples).",
      "Scheme preview and Test Scheme now use Sirach 38:4 and Tobit 6:2-4 instead of John 3:16 / 2 Cor 3:18.",
    ],
  },
  {
    version: '3.46.2',
    date: '2026-06-21',
    changes: [
      'View menu: Settings (Preferences) now appears above Schemes.',
    ],
  },
  {
    version: '3.46.1',
    date: '2026-06-20',
    changes: [
      'Fix: macro color dots now show distinct colors per macro — uses stored Pro7 color, or falls back to a stable hash color derived from the macro UUID so every macro is visually distinct even when offline.',
      'Macro picker: multi-select — tick multiple macros then click "Add N" to import them all at once.',
      'Macro picker: colored dot per macro using Pro7 color, "added" badge for duplicates, stronger dark modal.',
      'Macros in Preferences and Schemes now show a colored dot icon matching the Pro7 macro color.',
      'Sidebar macro badges are now dynamic — only appear when a macro is actually assigned to that slide type in Schemes.',
      'No-duplicate enforcement on import — already-added macros are greyed out and skipped.',
      'Schemes → Macros tab has a vertical separator to show it is a global setting, not scheme-specific.',
      'Removed "connect above to import from Pro7" subtitle from the Macros heading.',
    ],
  },
  {
    version: '3.45.0',
    date: '2026-06-20',
    changes: [
      'Fix: macro picker now shows macro names correctly — Pro7 API nests the name at m.id.name, not m.name.',
    ],
  },
  {
    version: '3.44.0',
    date: '2026-06-20',
    changes: [
      'Macros overhaul: removed all built-in hardcoded macro UUIDs (Start, Content, Blank, Logo, No Logo) from Preferences and from the export pipeline.',
      'Preferences → Advanced IDs → Macros: clean slate — import any macro from Pro7 via "+ Add Macro". Name and UUID are auto-filled and read-only.',
      'Macro triggers are now assigned exclusively in the Schemes panel → Macros tab.',
      'Export: macros only fire if you\'ve configured them in Preferences and assigned triggers in Schemes — nothing fires by default.',
    ],
  },
  {
    version: '3.43.0',
    date: '2026-06-20',
    changes: [
      'Fix: Macro UUIDs section in Preferences → Advanced IDs now correctly shows "Content" again (was accidentally renamed to "Scripture" in v3.40.0).',
      'Fix: "+ Add Macro" picker now always opens — previously it silently added a blank row when Pro7 was not connected; now the picker appears with a "connect to Pro7 first" message.',
    ],
  },
  {
    version: '3.42.0',
    date: '2026-06-20',
    changes: [
      'Preferences → Display Names: labels changed to Display 1 / 2 / 3 — enter your custom name in the field next to each.',
    ],
  },
  {
    version: '3.41.0',
    date: '2026-06-20',
    changes: [
      'Fix: macro picker now correctly displays macro names — Pro7 REST API returns plain strings, not protobuf-wrapped objects; picker now handles both formats.',
      'Fix: Delay and Duration columns in Motion → Build Order are now legible — Duration column widened to fit decimal values like 0.6.',
    ],
  },
  {
    version: '3.40.0',
    date: '2026-06-20',
    changes: [
      'Point font now has independent size controls for Main Screen and LED Wall — set them in Schemes → Text → Point.',
      'Reference Bar font card split into Main Screen and LED Wall columns with separate font, weight, size, color, and Advanced per display.',
      'Motion build order tab renamed from "Content" to "Scripture".',
    ],
  },
  {
    version: '3.39.0',
    date: '2026-06-20',
    changes: [
      'Fix: clicking the ALT toolbar button now correctly toggles off ALT formatting on selected text — the button\'s mousedown no longer blurs the editor and collapses the selection before the toggle runs.',
      'Fix: color hex inputs (font color, stroke, shadow) now accept 6-digit hex without a leading # — swatch updates live as you type.',
    ],
  },
  {
    version: '3.38.0',
    date: '2026-06-20',
    changes: [
      'Schemes → Macros tab redesigned: instead of a duplicate macro editor, it now shows macros already configured in Preferences and lets you toggle which slide types trigger each one. Head to Preferences to add/remove macros, then assign triggers here.',
    ],
  },
  {
    version: '3.37.0',
    date: '2026-06-20',
    changes: [
      'Macro picker: "+ Add Macro" now opens a searchable list of macros pulled live from Pro7 — pick one and it\'s added with the correct name and UUID pre-filled. Refresh button re-pulls the list without leaving the picker.',
    ],
  },
  {
    version: '3.36.0',
    date: '2026-06-20',
    changes: [
      'Fix: ALT formatting can now be toggled off on scripture slides (and any slide) — ⌘+click on an already-formatted word correctly unwraps it instead of double-wrapping.',
    ],
  },
  {
    version: '3.35.0',
    date: '2026-06-20',
    changes: [
      'Fix: selected slide item in dark mode no longer shows a light background — active state now uses a subtle orange tint matching the app\'s dark palette.',
    ],
  },
  {
    version: '3.34.0',
    date: '2026-06-20',
    changes: [
      'Macros tab in Schemes: custom macros now live in a dedicated Macros tab alongside Text / Layout / Motion / Preview — add macros, assign slide type triggers, and see them at a glance without digging into Preferences. Changes apply globally.',
    ],
  },
  {
    version: '3.33.0',
    date: '2026-06-20',
    changes: [
      'Display Names: "Main Screen" added as a third configurable display name alongside LED Wall and Confidence Monitor — renames consistently across scheme panel, font tooltips, and all style cards.',
      'Blanks toggle: active state is now solid orange instead of blue.',
      'Stage Layout dropdown renamed to "Stage Layout Override".',
    ],
  },
  {
    version: '3.32.0',
    date: '2026-06-20',
    changes: [
      'Custom Macros: add any number of macros in Preferences → Advanced IDs → Custom Macros. Give each one a name, UUID, and choose which slide types it fires on (Start, End, Scripture, Point, Blank, Blank Before, Image, Response Card). Macros are appended to matching cues at export.',
    ],
  },
  {
    version: '3.31.0',
    date: '2026-06-19',
    changes: [
      'ALT fmt: orange brackets no longer persist after releasing the drag — they only show while painting words.',
    ],
  },
  {
    version: '3.30.0',
    date: '2026-06-19',
    changes: [
      'Display Names: rename "LED Wall" and "Confidence Monitor" to anything you like in Preferences → Display Names. Your names appear consistently everywhere — slide forms, scheme panel, feature toggles, help text.',
    ],
  },
  {
    version: '3.29.0',
    date: '2026-06-19',
    changes: [
      'ALT drag fix: drag now snaps word-by-word, selection highlight turns orange (no blue) as you paint, brackets track in real time.',
    ],
  },
  {
    version: '3.28.0',
    date: '2026-06-19',
    changes: [
      'ALT formatting: ⌘+click (no opt required) to toggle a word; hold and drag to paint across multiple words. Orange [brackets] in the editor mark alt-formatted text. Live bracket indicators follow your drag. Preflight: digit-prefix and digit-span warnings now have auto-fix buttons.',
    ],
  },
  {
    version: '3.27.0',
    date: '2026-06-19',
    changes: [
      'Fix: auto-manage ProPresenter now requires the toggle to be explicitly ON — it no longer activates for users whose saved state predates the setting. Renamed ··· menu item from "Settings" to "Preferences".',
    ],
  },
  {
    version: '3.26.0',
    date: '2026-06-19',
    changes: [
      'LED wall / prop display during blank: new toggle in the blank-before section — when on, the blank cue triggers NO LOGO + the following slide’s prop instead of LOGO, so the LED wall shows the coming content while the main screen is dark.',
      'Removed Fit Width button from point slides (kept on scripture).',
    ],
  },
  {
    version: '3.25.0',
    date: '2026-06-19',
    changes: [
      'Verse-number inline red highlight: digit artifacts now glow red inline in the editor. Detection extended to catch digit + curly-quote patterns (e.g. 25“You…).',
    ],
  },
  {
    version: '3.24.0',
    date: '2026-06-19',
    changes: [
      "Alternate (emphasis) formatting: new \"A\" button in the rich-text toolbar applies the scheme Bold-in-Body font (e.g. Montserrat-Black). Bold (B) is now plain bold weight on the body font. \u2318\u2325+click a word to toggle emphasis. Existing bold text auto-migrated to emphasis on first load.",
    ],
  },
  {
    version: '3.23.0',
    date: '2026-06-19',
    changes: [
      "Book Names: numbered-book prefix style — choose between 1 / First / 1st for books like 1 Corinthians, 2 Timothy, 3 John, etc.",
    ],
  },
  {
    version: '3.22.0',
    date: '2026-06-19',
    changes: [
      "Renamed confidence monitor mode \"Current bullet\" to \"Sequential\".",
    ],
  },
  {
    version: '3.21.0',
    date: '2026-06-19',
    changes: [
      "Book Names: added Psalm / Psalms option.",
    ],
  },
  {
    version: '3.20.0',
    date: '2026-06-19',
    changes: [
      "Raised long-scripture preflight threshold from 220 to 380 characters.",
    ],
  },
  {
    version: '3.19.0',
    date: '2026-06-19',
    changes: [
      "Removed click-to-jump from the RC entry in the Outline panel.",
    ],
  },
  {
    version: '3.18.0',
    date: '2026-06-18',
    changes: [
      "Cmd+click in any rich-text body editor now toggles bold on the clicked word — workaround for Chromium removing multi-range selection (which Pro7 supports natively via AppKit). Click a word with Cmd held to bold it; Cmd+click again to un-bold.",
    ],
  },
  {
    version: '3.17.0',
    date: '2026-06-18',
    changes: [
      "Live verse-number badge: the scripture body editor now shows a red warning inline when text starts with a digit (e.g. \"35 By this...\" from Bible copy-paste) or when any span is digit-only.",
    ],
  },
  {
    version: '3.16.0',
    date: '2026-06-18',
    changes: [
      "Preflight now detects likely verse-number artifacts in scripture body text: warns when any span contains only digits (e.g. \"1\" or \"14\" left over from Bible copy-paste) or when the body starts with a digit followed by a space.",
    ],
  },
  {
    version: '3.15.0',
    date: '2026-06-18',
    changes: [
      "Preflight dialog redesigned: each warning row now shows a \"Go to ↗\" button that closes the dialog, navigates directly to the problem slide, and focuses the relevant field. Warnings with an automatic fix (stray spaces on reference or point text, leading/trailing whitespace on scripture body) also show a \"Fix\" button — click it to resolve in place, or \"Fix all auto\" to clear every auto-fixable warning at once.",
    ],
  },
  {
    version: '3.14.0',
    date: '2026-06-18',
    changes: [
      "Point slides: \"Custom prop\" toggle — when enabled, DeckPro reserves the prop slot but generates a blank cue instead of overwriting it. Use this to build a one-off prop manually in ProPresenter while keeping the queue action wired up correctly.",
    ],
  },
  {
    version: '3.13.0',
    date: '2026-06-18',
    changes: [
      "Revealing points: Confidence monitor mode — \"Current bullet\" (default, same as before) shows only the active bullet in the speaker notes. \"Stacking\" accumulates all revealed bullets so the speaker sees a growing list; previous bullets appear in normal weight and the current bullet in bold.",
    ],
  },
  {
    version: '3.12.0',
    date: '2026-06-18',
    changes: [
      "Revealing points: \"Paste to reflow\" — expand the disclosure below the bullet list, paste a block of text (one bullet per line), click Split, and DeckPro populates all bullets at once instead of requiring copy-paste into each field individually.",
    ],
  },
  {
    version: '3.11.0',
    date: '2026-06-18',
    changes: [
      "Preferences → Book Names: choose a display form for ambiguous books — \"Acts\" can display as \"Acts of the Apostles\"; \"Song of Solomon\" and \"Song of Songs\" are interchangeable. The override applies at export and retroactively updates all scripture slides without changing what you typed in the reference field.",
    ],
  },
  {
    version: '3.10.0',
    date: '2026-06-15',
    changes: [
      "Google Drive notes doc now persists — the link you load is remembered and reopens automatically after a reload or redeploy (Clear forgets it).",
      "Response Card now appears in the Outline panel with its decision text and responses; click it to jump to the editor. (Its inputs live in the 'Response Card' item in the slide list.)",
      "Preflight now warns when a scripture slide is long enough to be worth splitting into two.",
      "Preflight now flags stray spaces at the start/end of a reference, scripture body, or point.",
      "Revealing-point deck label now uses the prop header title when set, falling back to the first bullet.",
    ],
  },
  {
    version: '3.9.0',
    date: '2026-06-15',
    changes: [
      "Scripture reference bar is now fully scheme-driven with no hard-coded styling: the rust background bar is gone (transparent), and the reference text colour comes from the Reference Bar 'Color' setting in Schemes (defaults to white) instead of being locked to gold. Anything the scheme doesn't set falls back to Arial.",
      "Import from Pro7 reads the reference text colour into the Reference Bar colour setting so imported schemes keep their look; it no longer imports the (now-removed) bar fill/shadow.",
    ],
  },
  {
    version: '3.8.3',
    date: '2026-06-15',
    changes: [
      "Removed the Fill / Text / Shadow colour editors from the Reference Bar card in Schemes — the reference bar keeps its standard look, the card is just less cluttered.",
    ],
  },
  {
    version: '3.8.2',
    date: '2026-06-15',
    changes: [
      "Fix: the Slide Notes / Confidence Monitor size field in Schemes now saves. Previously editing it had no effect (the input wasn't wired to the scheme).",
    ],
  },
  {
    version: '3.8.1',
    date: '2026-06-15',
    changes: [
      "Fix: point slides now render in the Point font (bold) you set in Schemes. Previously a plain point fell back to the body font, so the Point font had no visible effect on normal point slides — now it does, on both the main screen and the LED wall.",
    ],
  },
  {
    version: '3.8.0',
    date: '2026-06-15',
    changes: [
      "Import from Pro7 now shows a review screen before saving — see the detected text styles, layout sizes and slide transition, rename the scheme, and read clear warnings about anything that couldn't be inferred (e.g. prop/LED-wall styling, which lives in a separate file). Back returns to the picker; Save creates the scheme.",
      "Scheme import now detects the slide transition (type + duration) from the presentation.",
    ],
  },
  {
    version: '3.7.0',
    date: '2026-06-15',
    changes: [
      "Point text and bold-in-body text now have separate fonts. The old combined \"Point / Bold Text\" card is split into a \"Point\" card and a \"Bold in Body\" card, each with its own Main Screen and Prop / LED Wall font, weight and styling.",
      "Existing schemes are unchanged — point text keeps whatever the bold font was set to until you customize it.",
    ],
  },
  {
    version: '3.6.0',
    date: '2026-06-15',
    changes: [
      "Layout tab now has a visual preview — scaled Main Screen and Prop/LED-wall canvases showing each element's position and size as boxes. Click a box to highlight its row in the table below (and vice-versa), so it's clear what each number controls.",
    ],
  },
  {
    version: '3.5.0',
    date: '2026-06-15',
    changes: [
      "Schemes redesigned as a cleaner editor instead of one long settings form. Four focused tabs — Text, Layout, Motion, Preview — with Text and Layout as the primary creative areas.",
      "Text tab rebuilt as compact style cards (Body, Point/Bold, Reference Bar, Start/End, Slide Notes) with Main Screen and Prop/LED Wall settings shown side by side for easy comparison; advanced controls tuck into a per-card disclosure.",
      "Transitions and Build Order moved together under a new Motion tab (Transitions shown side by side; Build Order as a secondary sub-view).",
      "New Preview tab shows approximate Main Screen, Prop/LED Wall, Reference Bar, Start/End, and Slide Notes examples built from the scheme's own fonts, sizes, and colours.",
      "Compact scheme toolbar (selector · name · duplicate · delete · lock · Import from Pro7 · Test Scheme) replaces the old stacked header. \"Presentation Settings\" renamed to \"Preferences.\"",
    ],
  },
  {
    version: '3.4.1',
    date: '2026-06-15',
    changes: [
      "Fix: the update progress overlay said \"Delivering to ProPresenter / Don't switch to ProPresenter\" (the export wording) while installing an app update. It now correctly reads \"Updating DeckPro / Don't close the app until this completes.\"",
    ],
  },
  {
    version: '3.4.0',
    date: '2026-06-15',
    changes: [
      "Schemes panel made friendlier: a short intro explains what a scheme is, and the technical layout (element positions) and build-order (animation) controls are now tucked behind an \"Advanced\" toggle — so everyday users just see fonts, sizes, colours, and transitions.",
      "Every font slot now has a hover \"?\" explaining exactly what it controls (main screens vs LED-wall prop, reference bar, confidence-monitor notes, etc.), and size boxes are clearly marked in points (pt).",
      "Locked schemes now show a clear explainer banner with Duplicate and Unlock buttons, instead of just greying everything out — no more wondering why nothing is editable.",
    ],
  },
  {
    version: '3.3.0',
    date: '2026-06-15',
    changes: [
      "Import a scheme from Pro7 — new \"Import from Pro7\" button in the Schemes panel. Pick a presentation from your ProPresenter library (or browse for a .pro file) and DeckPro reads its fonts, sizes, colours, and element positions into a new scheme. Best workflow: export a deck, restyle it in Pro7 to taste, then import it back so your edits become a reusable scheme.",
      "The library picker lists your presentations automatically, hides Props files, and flags any that can't be read so you don't pick a dead end.",
    ],
  },
  {
    version: '3.2.0',
    date: '2026-06-15',
    changes: [
      "Dark mode: inputs in Settings (folder path, Pro7 port, password, API key, Bible translation dropdown) now correctly render with a dark background and light text",
      "Toggle accent consistency: all panel toggles (blank-before, auto-manage, feature visibility) now use a neutral grey track when off and the orange accent when on, instead of the dark-blue-grey that appeared in dark mode",
      "Slide preview feature removed from the codebase — it was already hidden from the UI; cleaned up dead code and CSS",
      "Redeploy dialog now warns to save your deck to the Library first so no work is lost on relaunch",
      "Spell check: language explicitly set to en-US in Electron so the system dictionary provides word suggestions on right-click",
    ],
  },
  {
    version: '3.1.1',
    date: '2026-06-10',
    changes: [
      "Bible lookup now preserves hard line breaks — poetry like the Psalms keeps its line structure on the slide, the prop, and the LED wall instead of being flattened into one paragraph.",
    ],
  },
  {
    version: '3.1.0',
    date: '2026-06-10',
    changes: [
      "Auto-manage ProPresenter on export — if Pro7 is open, DeckPro now quits it, writes your deck and props, then relaunches it automatically. Toggle in Settings under Pro7 Connection (on by default); turn it off to be warned instead.",
      "Pro7 config safety net — every export keeps a rolling backup (last 10) of ProPresenter's props configuration. Restore any of them with one click from Export history, in case an export ever goes sideways.",
      "Slide notes now have full formatting controls in Schemes — font, size, alignment, spacing and more for the confidence-monitor notes, separate from every other element.",
      "Renamed Generation history to Export history to match the rest of the app.",
    ],
  },
  {
    version: '3.0.1',
    date: '2026-06-10',
    changes: [
      'Export keyboard shortcut is now ⌘E (was ⌘G)',
    ],
  },
  {
    version: '3.0.0',
    date: '2026-06-09',
    changes: [
      'DeckPro now updates itself — when a new version is released, a banner appears in the app; click Update and Relaunch and it installs and restarts automatically',
      'Help menu: Check for Updates… for manual checks',
      'DeckPro is now distributed on GitHub — the team can download it from the Releases page',
    ],
  },
  {
    version: '2.17.0',
    date: '2026-06-09',
    changes: [
      'Fit Width is now capped at the scheme Layout body width — the text box can never grow wider than the bounds you set',
      'Fix: Fit Width and slide previews were reading an empty scheme object — they now use the active scheme (correct font size, canvas, and body bounds)',
      "New scheme font entry: Point — prop / LED wall — point text on the LED wall now has its own font and Advanced panel, separate from the main-screen bold font and from the scripture prop body font",
      'Existing schemes inherit the current bold font for the new entry, so nothing changes until you customize it',
    ],
  },
  {
    version: '2.16.1',
    date: '2026-06-09',
    changes: [
      'Fix: app stuck on the splash screen — the new library storage module was missing from the packaged build',
    ],
  },
  {
    version: '2.16.0',
    date: '2026-06-09',
    changes: [
      'Deck Library rebuilt as a real project system — decks now live in a local SQLite database with daily automatic backups, not browser storage',
      'Existing decks migrate automatically on first launch (a JSON backup is written first)',
      'Library: search by series/title/speaker/date, filter tabs (Decks / Templates / Archived / Trash), sort by date, series, or updated',
      'Deck actions menu: Edit Info (now with Speaker), Duplicate, Save as Template, Archive, Delete with Trash + Restore + Delete Forever, Reveal Last Export',
      'Templates: save any deck as a template and start new decks from it',
      'Each deck shows export status — when it was last exported and whether it was edited since',
      'Export history is recorded in the library database and linked to the deck',
      "Library location is configurable (Settings → Deck Library) — point it at iCloud Drive / Dropbox / a shared folder to use the same library on multiple computers; DeckPro joins an existing library if it finds one",
      'Conflict detection — if the same deck is changed on two machines, DeckPro asks which version to keep instead of silently overwriting',
    ],
  },
  {
    version: '2.15.6',
    date: '2026-06-09',
    changes: [
      'Export no longer writes a _Props.pro file to the Pro7 library — props go directly into Configuration/Props; old _Props.pro files are cleaned up automatically',
    ],
  },
  {
    version: '2.15.5',
    date: '2026-06-09',
    changes: [
      'Fix: clicking Export while Pro7 is open no longer locks the button — Pro7 check now runs before the button is disabled, so the warning modal shows cleanly and Export is immediately usable again',
    ],
  },
  {
    version: '2.15.4',
    date: '2026-06-09',
    changes: [
      'Help guide updated — all sections rewritten to reflect current features including Export flow, Props/DeckPro collection, Schemes & Layout alignment, Response Card, slide notes, quote warnings',
      'New Schemes section added to help guide',
    ],
  },
  {
    version: '2.15.3',
    date: '2026-06-09',
    changes: [
      'Layout tab: alignment buttons — center/middle takes priority over left/right when all match (full-width elements)',
      'Layout tab: alignment button highlights update live as you type in a value — no longer stale after manual edits',
    ],
  },
  {
    version: '2.15.2',
    date: '2026-06-09',
    changes: [
      'Layout tab: alignment buttons added to each element row — H-left/center/right and V-top/middle/bottom snap X or Y to canvas-relative positions',
    ],
  },
  {
    version: '2.15.1',
    date: '2026-06-09',
    changes: [
      'Export now always writes all 50 prop slots — unused slots get empty placeholders so the DeckPro collection is full and consistent from first export',
    ],
  },
  {
    version: '2.15.0',
    date: '2026-06-09',
    changes: [
      'Generate renamed to Export throughout — button, history, help, and settings',
      'Save to Folder and Download options removed — Export always goes directly to Pro7',
      'Settings Output section simplified — export mode is always Pro7 deliver',
    ],
  },
  {
    version: '2.14.8',
    date: '2026-06-09',
    changes: [
      'Fix: DeckPro collection now tracks all prop slots ever used, not just the current deck',
    ],
  },
  {
    version: '2.14.7',
    date: '2026-06-09',
    changes: [
      "Deliver mode now manages a \"DeckPro\" collection folder in Pro7's Props panel — all DeckPro prop slots are moved there automatically on every delivery; folder is created on first use",
    ],
  },
  {
    version: '2.14.6',
    date: '2026-06-09',
    changes: [
      'Deliver mode now patches Configuration/Props at the binary level — prop collections, folders, and all Pro7-internal metadata are preserved byte-for-byte',
    ],
  },
  {
    version: '2.14.5',
    date: '2026-06-09',
    changes: [
      'Deliver mode now backs up Configuration/Props to Configuration/Props.deckpro-backup before writing — restore it manually if something goes wrong',
    ],
  },
  {
    version: '2.14.4',
    date: '2026-06-09',
    changes: [
      'Expanded prop slots from 25 to 50',
    ],
  },
  {
    version: '2.14.3',
    date: '2026-06-09',
    changes: [
      'Expanded prop slots from 10 to 25 — large decks with many revealing-point bullets no longer hit the generation limit; new slots auto-register in Pro7 on first use',
    ],
  },
  {
    version: '2.14.2',
    date: '2026-06-09',
    changes: [
      'Revealing point bullets now support bold (⌘B) — no toolbar, keyboard shortcut only; data model updated from plain strings to spans',
    ],
  },
  {
    version: '2.14.1',
    date: '2026-06-09',
    changes: [
      "Pre-generate warning: detects mismatched curly double quotes (“”), curly single quotes (‘’), and odd-count straight double quotes in scripture and point body text",
    ],
  },
  {
    version: '2.14.0',
    date: '2026-05-27',
    changes: [
      'Slide notes: scripture slides now embed the full verse text in Pro7 notes (even when split across 2 slides); point, image, start, and end slides also get notes — feeds the confidence monitor without off-screen elements',
      'START and END slides: element renamed from "this slide" to "body"; live badge added so confidence monitor shows the active slide indicator',
      'Response Card package expanded to 6 slides: Blank → RC → R1 → R2 → R3 → Hold. RC Blank triggers the RESPONSE CARD stage layout; RC main slide triggers the message stage layout back',
      'Confidence monitor content on RC slides moved to slide notes — off-screen "this slide" element removed from RC package',
      'Stage layout actions: Settings → Stage Display section to configure screen name/UUID and layout names/UUIDs. Blank and image slides now have a Stage Layout dropdown to trigger any configured layout',
      'Build order "this slide" references migrated to "body" in existing saved schemes',
    ],
  },
  {
    version: '2.13.3',
    date: '2026-05-19',
    changes: [
      'Removed Cmd+R reload shortcut from the View menu',
    ],
  },
  {
    version: '2.13.2',
    date: '2026-05-19',
    changes: [
      'Layout tab: Header row now has an editable Y field — uncheck "Auto Y" to set a fixed title bar position',
      'Same for Prop header: uncheck "Auto Y" to set propTitleY directly',
    ],
  },
  {
    version: '2.13.1',
    date: '2026-05-19',
    changes: [
      'Font color picker moved out of Advanced and into the font row itself — visible without opening Advanced',
      'Vertical alignment buttons merged onto the same row as Alignment — one row instead of two',
      'Scaling dropdown added to Advanced panel (Default / Scale down / Text up or down / None)',
    ],
  },
  {
    version: '2.13.0',
    date: '2026-05-19',
    changes: [
      'All five font Advanced panels now include Stroke (width + color) and Shadow (opacity + color + angle + offset + blur) options, matching Pro7\'s element-level controls',
      'Style toggles (B / I / U / S) redesigned as a joined segmented-button strip — no longer stretch to fill width',
      'Stroke and shadow settings wired through to all element builders in encoder and prop generator',
    ],
  },
  {
    version: '2.12.9',
    date: '2026-05-19',
    changes: [
      'Font rows now two-line: family select full-width on top, style select + pt size input on second line — fixes size input expanding to 100% width',
      'Body Margins panel removed from Text tab (body margin fields remain in Layout tab)',
    ],
  },
  {
    version: '2.12.8',
    date: '2026-05-19',
    changes: [
      'Schemes Text tab: Sizes section merged into each Font row — size pt input lives inline with the family/style selectors; Reference bar row shows both main and prop sizes',
      'Schemes Text tab: Body fill moved into Body font Advanced; Reference bar fill, text color, and shadow moved into Reference bar font Advanced — Colors section removed',
      'Font Advanced: Y Offset / Char Spacing / Line Height / Para Spacing reorganized into a compact 2-column grid',
      'Font Advanced: Style (B/I/U/S) and Capitalization merged into one row',
      'Capitalization options renamed to None / All Caps / Title Case / Start Case / All Lower (Small Caps removed)',
      'Transitions tab: Slide and Prop transitions now display side-by-side instead of stacked',
    ],
  },
  {
    version: '2.12.7',
    date: '2026-05-19',
    changes: [
      'Test Scheme now uses a running index (SchemeTest_<Name>_001, _002, …) so filenames never collide across sessions',
      'Test Scheme respects the output mode setting (local / download / deliver) the same as regular generation',
      'Test Scheme results now appear in generation history with the same summary modal as a regular generate',
    ],
  },
  {
    version: '2.12.6',
    date: '2026-05-19',
    changes: [
      'All font Advanced panels now include Vertical Alignment (top / middle / bottom icons, matching Pro7) and Margins (L / T / R / B) — applies to Body, Prop body, Bold, Reference bar, and Start/End elements',
      'Vertical alignment and margins from the Advanced panel are wired through to the encoder and override element defaults when set',
    ],
  },
  {
    version: '2.12.5',
    date: '2026-05-19',
    changes: [
      'Generation history moved into the ··· menu — removed the standalone download button from the header toolbar',
    ],
  },
  {
    version: '2.12.4',
    date: '2026-05-19',
    changes: [
      'Body margins moved from Layout tab to Text tab — now a collapsible "Body Margins" panel (L / T / R / B) that lives alongside Colors, Fonts, and Sizes',
    ],
  },
  {
    version: '2.12.3',
    date: '2026-05-19',
    changes: [
      'Dark mode fix: number, password, and select inputs inside form fields now inherit dark background and text color — affects Pro7 connection, Bible lookup, transition duration, and color hex inputs',
      'Dark mode fix: bullet point inputs, color hex fields, and segmented control buttons now render correctly in dark mode',
      'Preview button removed from scripture and point slide forms (feature kept for later)',
    ],
  },
  {
    version: '2.12.2',
    date: '2026-05-19',
    changes: [
      'Layout tab: "Ref bar" renamed to "Header" and "Prop ref bar" renamed to "Prop header"',
      'Layout tab: Auto Title Y toggle and Gap moved inline to the Header and Prop header rows; checking Auto Y greys out the Y column to indicate it is auto-calculated',
      'Layout tab: Prop header now has its own Auto Title Y toggle + Gap, same as main Header',
    ],
  },
  {
    version: '2.12.1',
    date: '2026-05-19',
    changes: [
      'Scheme header: New, Dupe, Delete buttons replaced with icon buttons — + / copy / trash icons with tooltips',
    ],
  },
  {
    version: '2.12.0',
    date: '2026-05-19',
    changes: [
      'Removed Gap S / Gap L from scheme entirely — title position is fully handled by Auto Title Y; fallback when Auto Y is off defaults to 0',
      'Removed generation history notification badge from the download button',
    ],
  },
  {
    version: '2.11.9',
    date: '2026-05-19',
    changes: [
      'Layout tab: Gap S / Gap L hidden on Ref bar when Auto Title Y is enabled — they only show as fallback when Auto Y is off, reducing visual noise',
    ],
  },
  {
    version: '2.11.8',
    date: '2026-05-19',
    changes: [
      'Fix: Auto Title Y result is now rounded to a whole pixel — title was landing at fractional positions like 868.1 instead of a clean 868',
    ],
  },
  {
    version: '2.11.7',
    date: '2026-05-19',
    changes: [
      'Fix: Auto Title Y now accounts for body bottom margin when estimating text top edge — title was landing ~31px too low because the 60px margin was not subtracted from the text position calculation',
    ],
  },
  {
    version: '2.11.6',
    date: '2026-05-19',
    changes: [
      'Scheme Layout tab: Live element row added (X, Y, W, H) — confidence monitor badge position is now configurable per scheme; defaults to 1736×1096 (below main canvas)',
    ],
  },
  {
    version: '2.11.5',
    date: '2026-05-19',
    changes: [
      'Body margins added (L, T, R, B) — controls the text inset inside the body box for both scripture and point slides; default bottom margin is 60 (matching previous hardcoded value)',
    ],
  },
  {
    version: '2.11.4',
    date: '2026-05-19',
    changes: [
      'Renamed overlay and toast copy from "Rebuilding / Rebuild complete" to "Redeploying / Redeploy complete"',
    ],
  },
  {
    version: '2.11.3',
    date: '2026-05-19',
    changes: [
      'Renamed "Rebuild and Reinstall" to "Redeploy" in File menu and confirmation dialog',
    ],
  },
  {
    version: '2.11.2',
    date: '2026-05-19',
    changes: [
      'Rebuild success toast — new DeckPro instance shows a confirmation toast on launch when opened after a rebuild',
    ],
  },
  {
    version: '2.11.1',
    date: '2026-05-19',
    changes: [
      'Rebuild and Reinstall now shows a live progress overlay inside the app — steps tick off in real time so you always know what\'s happening',
      'Fix: replaced exec() with spawn() so stdout is streamed live; overlay shows each step as it starts and completes',
      'Fix: removed pkill (caused crash); app now quits cleanly via app.quit() after rebuild.sh finishes',
      'Rebuild now clears dist/ before building to force a fully fresh electron-builder pack',
      'Rebuild now flushes the macOS Launch Services cache so the new bundle is always seen by the OS',
      'Rebuild failure now shows error message inline in the overlay with a Close button instead of a system alert',
    ],
  },
  {
    version: '2.11.0',
    date: '2026-05-19',
    changes: [
      'Auto Title Y — title bar position now auto-calculated from body text height; configurable gap (default 16px) keeps consistent spacing between body text top and title bar bottom across all scripture slides regardless of verse length',
      'Layout tab: Auto Title Y toggle + Gap input added; Gap S / Gap L still used when Auto Y is off',
    ],
  },
  {
    version: '2.10.10',
    date: '2026-05-19',
    changes: [
      'Fix: Rebuild and Reinstall now runs via a dedicated rebuild.sh script with explicit PATH — bypasses all Electron shell env issues with node/npm not found',
    ],
  },
  {
    version: '2.10.9',
    date: '2026-05-19',
    changes: [
      'Fix: Rebuild and Reinstall now passes full PATH to exec — node was not found because Electron\'s shell env doesn\'t inherit user PATH',
    ],
  },
  {
    version: '2.10.8',
    date: '2026-05-19',
    changes: [
      'Scheme Layout tab: Queue row added (X, Y, W, H) — queue sidebar bounds are now configurable per scheme and wired through to the encoder',
    ],
  },
  {
    version: '2.10.7',
    date: '2026-05-19',
    changes: [
      'Fix: Rebuild and Reinstall now uses full npm path (/usr/local/bin/npm) — Electron shell doesn\'t inherit PATH so npm was not found',
    ],
  },
  {
    version: '2.10.6',
    date: '2026-05-19',
    changes: [
      'Test Scheme button restyled as a pill inline with the scheme controls — matches the Blanks toggle style',
    ],
  },
  {
    version: '2.10.5',
    date: '2026-05-19',
    changes: [
      'Generation history button now uses a download arrow icon instead of the clock — no longer conflicts with the What\'s New changelog icon',
    ],
  },
  {
    version: '2.10.4',
    date: '2026-05-19',
    changes: [
      'Fix: menu item renamed to "Rebuild and Reinstall" — symbols (& and +) were being dropped by macOS menu rendering',
    ],
  },
  {
    version: '2.10.3',
    date: '2026-05-19',
    changes: [
      'Fix: renamed "Rebuild & Reinstall" to "Rebuild + Reinstall" — & was being swallowed by macOS menu rendering',
    ],
  },
  {
    version: '2.10.2',
    date: '2026-05-19',
    changes: [
      'Fix: Rebuild & Reinstall used __dirname which points to the ASAR bundle in packaged app — hardcoded source path so it actually works',
    ],
  },
  {
    version: '2.10.1',
    date: '2026-05-19',
    changes: [
      'File menu: Rebuild & Reinstall (⌘⇧R) — builds a fresh app, replaces /Applications/DeckPro.app, and relaunches automatically',
    ],
  },
  {
    version: '2.10.0',
    date: '2026-05-19',
    changes: [
      'Permanent prop slots — props use 10 fixed slots (prop_1–prop_10) pre-created in Pro7; UUIDs are hardcoded, content updates in-place each generate, no registration step needed',
      'Test Scheme button — generates a download covering every slide type (short ref, long ref, multi-body, bold, point single, revealing, blank, image, response card) to verify the scheme in Pro7',
      '"Saved" indicator now sits left of the deck title; Pro7 connection status sits right with no pill',
    ],
  },
  {
    version: '2.8.0',
    date: '2026-05-18',
    changes: [
      'Deliver to Pro7 now requires ProPresenter to be closed first — prevents Pro7 from overwriting prop config on quit',
      'Clear modal if ProPresenter is running when you try to deliver',
      'Success modal for delivery now reads "Ready — open ProPresenter"',
    ],
  },
  {
    version: '2.7.0',
    date: '2026-05-18',
    changes: [
      '"Saved" indicator moved inside the Pro7 connection pill — shows inline as "● Connected · Saved"',
    ],
  },
  {
    version: '2.6.0',
    date: '2026-05-18',
    changes: [
      'Deliver to Pro7 props now actually work — prop cue UUIDs are coordinated between the presentation and Configuration/Props so Pro7 resolves them on startup',
      'Props write directly to the active Pro7 library in Application Support (not Documents folder which Pro7 ignores for prop documents)',
    ],
  },
  {
    version: '2.5.0',
    date: '2026-05-18',
    changes: [
      'Delivery overlay — full-screen blocking overlay with step-by-step progress during Deliver to Pro7',
      'Generation history — Safari-style history panel (clock button in header) with Reveal in Finder per entry',
      'Reload always available in View menu (not just dev mode)',
    ],
  },
  {
    version: '2.4.0',
    date: '2026-05-18',
    changes: [
      'Custom titlebar — thin dark bar holds traffic lights + version number; orange header sits below',
      'Native macOS About panel (DeckPro menu → About DeckPro) with icon and copyright',
      'New icon — macOS 26 layered .icon with dark/light/tinted variants built in Icon Composer',
      'Deliver to Pro7 — new generation mode that saves to Pro7 library and opens in ProPresenter',
      'Reveal in Finder — button in generation success modal',
      'package.json version synced to APP_VERSION',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-05-12',
    changes: [
      'Dark mode — toggle in ··· menu; respects system preference on first launch',
      'Slide type chips and status indicators adapt to dark mode',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-05-12',
    changes: [
      'Schemes "Style" tab renamed to "Text"',
      'Font Advanced: Bold (B) and Strikethrough toggles added alongside Italic and Underline',
      'Font Advanced: Justified alignment option added',
      'Font Advanced: full capitalization set — Normal, ALL CAPS, Small Caps, Title Case, All Lower',
      'Font Advanced: per-font color picker',
      'Sizes section now uses compact table layout (like Layout tab)',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-05-12',
    changes: [
      'Deck library redesigned — autosave, New Deck with scheme picker, Edit per deck, sort by date or series',
      'Header shows current deck series · title · date passively (click to open library)',
      'Draft mode — blank decks stay out of the library until they have content',
      'Current deck highlighted in library with "Current" badge; no more manual Save button',
    ],
  },
  {
    version: '2.0.3',
    date: '2026-05-12',
    changes: [
      'Spell check on all content fields — red underlines + right-click corrections in Electron',
    ],
  },
  {
    version: '2.0.2',
    date: '2026-05-12',
    changes: [
      'Fixed Pro7 connection — correct API path for ProPresenter 20.x (/version vs /v1/version)',
    ],
  },
  {
    version: '2.0.1',
    date: '2026-05-12',
    changes: [
      'Empty state logo polish — proper spacing between wordmark and version line',
      'Version displayed as x.x.x throughout',
      'Header wordmark size tuned for Electron titlebar',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-05-12',
    changes: [
      'DeckPro is now a native desktop app — no terminal or browser required',
      'Launches directly from your Applications folder or Dock',
      'Pro7 connection polls every 10s and reconnects automatically',
    ],
  },
  {
    version: '1.9.1',
    date: '2026-05-11',
    changes: [
      'Sync dot repositioned to the left of undo/redo',
      '"Saved" status indicator restored next to sync dot',
    ],
  },
  {
    version: '1.9.0',
    date: '2026-05-11',
    changes: [
      'Schemes panel redesigned — Style / Transitions / Build Order / Layout tabs (no more collapsible Advanced)',
      'Add Element sidebar condensed to compact 2-column grid',
      'Sync dot moved inside the undo/redo group',
    ],
  },
  {
    version: '1.8.0',
    date: '2026-05-11',
    changes: [
      'Streamlined header — Series/Title/Date/QR moved into Decks modal as Deck Info',
      'Deck name chip shows active series or title in the header',
      'Changelog, Help, Settings, and Schemes collapsed into ··· more menu',
      'Pro7 sync dot positioned between undo/redo buttons',
      'Schemes panel redesigned with Colors / Fonts / Sizes tabs',
    ],
  },
  {
    version: '1.7.0',
    date: '2026-05-11',
    changes: [
      'Deck Library — save, browse, and load past decks from the header',
      'Decks persist in localStorage, restore full slide state',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-05-11',
    changes: [
      'Help & Guide modal with 6 sections (Overview, Slide Types, Bible Lookup, Outline Panel, Generating, Pro7 Connection)',
      'Header inputs redesigned — underline style, less visual clutter',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-05-11',
    changes: [
      'Speaker Notes panel accepts Google Drive / Docs links',
      'Outline toggle button floats top-right of main panel',
      'Branded empty state with DeckPro logomark',
      'Orange brand color + DeckPro logomark in header',
      'Changelog modal (this panel)',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-05-11',
    changes: [
      'Outline / Speaker Notes side panel with PDF drop zone and zoom controls',
      'Drag-to-resize panel handle',
      'PDF viewer with zoom controls (50–200%)',
      'Generate overview modal with slide count breakdown',
      'Output delivery: Save to folder / Download / Ask every time',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-05-11',
    changes: [
      'Bible lookup via API.Bible — NLT and all public translations',
      'Per-slide translation override picker',
      'Enter key triggers Bible lookup',
      'API key hidden in settings (password field)',
      'Translation list with available Bible versions',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-05-11',
    changes: [
      'Undo / Redo with ⌘Z / ⌘⇧Z',
      'Font family preview in style picker dropdown',
      'Confidence monitor text as collapsible section',
      'Saved indicator in header',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-05-11',
    changes: [
      'Style presets (Default and custom)',
      'Pro7 live connection status indicator',
      'Presentation settings panel',
      'Series datalist with recent series memory',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-11',
    changes: [
      'Initial release',
      'Scripture, Point, Blank, Image, Custom slide types',
      'Drag-to-reorder slide queue',
      'ProPresenter 7 .pro file generation',
      'Prop file generation',
      'Response card support',
      'QR code toggle',
      'LocalStorage persistence',
    ],
  },
];

// ─── Bible book autocomplete ──────────────────────────────────────────────────
// Each entry: [canonical name, [abbreviations...]] — sorted longest-first for greedy matching.
// Abbreviations are lowercase; numbered-book variants include both spaced and compact forms.
const BIBLE_BOOKS = [
  // ── Old Testament ──
  ['Genesis',        ['genesis','gen','ge','gn']],
  ['Exodus',         ['exodus','exod','exo','ex']],
  ['Leviticus',      ['leviticus','lev','le','lv']],
  ['Numbers',        ['numbers','num','nu','nm','nb']],
  ['Deuteronomy',    ['deuteronomy','deut','deu','dt']],
  ['Joshua',         ['joshua','josh','jos','jsh']],
  ['Judges',         ['judges','judg','jdg','jd']],
  ['Ruth',           ['ruth','rut','ru']],
  ['1 Samuel',       ['1 samuel','1samuel','1sam','1sa','1 sa']],
  ['2 Samuel',       ['2 samuel','2samuel','2sam','2sa','2 sa']],
  ['1 Kings',        ['1 kings','1kings','1kgs','1ki','1 kgs','1 ki','1kng']],
  ['2 Kings',        ['2 kings','2kings','2kgs','2ki','2 kgs','2 ki','2kng']],
  ['1 Chronicles',   ['1 chronicles','1chronicles','1 chron','1chron','1 chr','1chr','1 ch','1ch']],
  ['2 Chronicles',   ['2 chronicles','2chronicles','2 chron','2chron','2 chr','2chr','2 ch','2ch']],
  ['Ezra',           ['ezra','ezr','ez']],
  ['Nehemiah',       ['nehemiah','neh','ne']],
  ['Esther',         ['esther','esth','est','es']],
  ['Job',            ['job','jb']],
  ['Psalms',         ['psalms','psalm','psa','pss','ps']],
  ['Proverbs',       ['proverbs','prov','pro','prv','pr']],
  ['Ecclesiastes',   ['ecclesiastes','eccles','eccl','ecc','qoh']],
  ['Song of Solomon',['song of solomon','song of songs','canticles','song','sos','sng','son']],
  ['Isaiah',         ['isaiah','isa','is']],
  ['Jeremiah',       ['jeremiah','jer','je','jr']],
  ['Lamentations',   ['lamentations','lam','la']],
  ['Ezekiel',        ['ezekiel','ezek','eze','ezk']],
  ['Daniel',         ['daniel','dan','da','dn']],
  ['Hosea',          ['hosea','hos','ho']],
  ['Joel',           ['joel','joe','jl']],
  ['Amos',           ['amos','amo','am']],
  ['Obadiah',        ['obadiah','obad','oba','ob']],
  ['Jonah',          ['jonah','jon','jnh']],
  ['Micah',          ['micah','mic','mi']],
  ['Nahum',          ['nahum','nah','na']],
  ['Habakkuk',       ['habakkuk','hab','hb']],
  ['Zephaniah',      ['zephaniah','zeph','zep','zp']],
  ['Haggai',         ['haggai','hag','hg']],
  ['Zechariah',      ['zechariah','zech','zec','zc']],
  ['Malachi',        ['malachi','mal','ml']],
  // ── New Testament ──
  ['Matthew',        ['matthew','matt','mat','mt']],
  ['Mark',           ['mark','mrk','mk','mr']],
  ['Luke',           ['luke','luk','lk','lu']],
  ['John',           ['john','joh','jn','jo']],
  ['Acts',           ['acts','act','ac']],
  ['Romans',         ['romans','rom','ro','rm']],
  ['1 Corinthians',  ['1 corinthians','1corinthians','1 cor','1cor','1 co','1co']],
  ['2 Corinthians',  ['2 corinthians','2corinthians','2 cor','2cor','2 co','2co']],
  ['Galatians',      ['galatians','gal','ga']],
  ['Ephesians',      ['ephesians','eph','ep']],
  ['Philippians',    ['philippians','phil','php','pp']],
  ['Colossians',     ['colossians','col']],
  ['1 Thessalonians',['1 thessalonians','1thessalonians','1 thess','1thess','1 thes','1thes','1 th','1th']],
  ['2 Thessalonians',['2 thessalonians','2thessalonians','2 thess','2thess','2 thes','2thes','2 th','2th']],
  ['1 Timothy',      ['1 timothy','1timothy','1 tim','1tim','1 ti','1ti','1 tm','1tm']],
  ['2 Timothy',      ['2 timothy','2timothy','2 tim','2tim','2 ti','2ti','2 tm','2tm']],
  ['Titus',          ['titus','tit']],
  ['Philemon',       ['philemon','philem','phm','pm']],
  ['Hebrews',        ['hebrews','heb','he']],
  ['James',          ['james','jas','jm']],
  ['1 Peter',        ['1 peter','1peter','1 pet','1pet','1 pe','1pe','1 pt','1pt']],
  ['2 Peter',        ['2 peter','2peter','2 pet','2pet','2 pe','2pe','2 pt','2pt']],
  ['1 John',         ['1 john','1john','1 joh','1joh','1 jn','1jn','1 jo','1jo']],
  ['2 John',         ['2 john','2john','2 joh','2joh','2 jn','2jn','2 jo','2jo']],
  ['3 John',         ['3 john','3john','3 joh','3joh','3 jn','3jn','3 jo','3jo']],
  ['Jude',           ['jude','jud']],
  ['Revelation',     ['revelation','revelations','rev','re','rv']],
];

// Returns a canonically-cased suggestion string (e.g. "Genesis 1:1") if the typed
// text is an unambiguous book abbreviation prefix, or null if no unique match.
// Only completes the book portion — chapter/verse suffix is preserved as-is.
function bibleBookAutocomplete(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase();

  let matchBook = null;
  let matchLen  = 0;
  let ambiguous = false;

  for (const [canonical, abbrs] of BIBLE_BOOKS) {
    for (const abbr of abbrs) {
      if (!lower.startsWith(abbr)) continue;
      const after = lower.slice(abbr.length);
      // Valid if nothing follows, or only whitespace, or whitespace then chapter digits
      if (after !== '' && !/^\s+\d/.test(after) && !/^\s*$/.test(after)) continue;
      if (abbr.length > matchLen) {
        matchLen  = abbr.length;
        matchBook = canonical;
        ambiguous = false;
      } else if (abbr.length === matchLen && canonical !== matchBook) {
        ambiguous = true;
      }
    }
  }

  if (!matchBook || ambiguous) return null;

  const suffix = raw.slice(matchLen); // preserve original chapter/verse
  const suggested = matchBook + suffix;
  if (suggested === raw) return null; // already canonical, nothing to do
  return suggested;
}

// ─── Tooltip content ─────────────────────────────────────────────────────────
// Single source of truth for all tooltip text. HTML uses data-tip-key="key".
// Dynamic tips that require runtime values keep data-tip in the template instead.
const TOOLTIPS = {
  // Add Item
  'add-scripture':            'Scripture\nA Bible passage — reference bar, body text, and a matching prop for the LED wall.',
  'add-point':                'Point\nA message point — single static prop, or a revealing list that builds bullet by bullet.',
  'add-blank':                'Blank\nAn empty slide — optional confidence-monitor text, no prop.',
  'add-image':                'Image\nAn image placeholder slide — build the media in Pro7 by hand.',
  'add-custom':               'Custom\nAn empty slot exported as a blank slide with your label — build it out by hand in ProPresenter.',
  // Preferences — Queue
  'queue':                    'Queue\nThe strip on the confidence monitor that lists what\'s coming up next.',
  'queue-format':             'Queue format\nNext Reference / Reference + Phrase show only the single next slide. Full List shows every upcoming slide.',
  // Preferences — Schemes panel
  'feature-visibility':       'Feature Visibility\nHide advanced fields so the slide editor is simpler when handing off to other users. Turning one off just hides it — it doesn\'t change exports.',
  'scheme-new':               'New Style\nCreate a blank style from defaults.',
  'scheme-dupe':              'Duplicate\nCopy this style into a new editable one — the usual way to make your own look.',
  'scheme-import':            'Import Style\nLoad a style JSON file (from Export, or shared by someone else) as a new style.',
  'scheme-export':            'Export Style\nSave this style as a JSON file — share it, or back it up.',
  // Response Card
  'decision-text':            'Decision Text\nThe main commitment statement shown on the Response Card slide.',
  // Rich-text toolbar
  'bold':                     'Bold\nBold weight of the body font for the selected words. Shortcut: ⌘B.',
  'italic':                   'Italic\nItalicizes the selected words. Shortcut: ⌘I.',
  'underline':                'Underline\nUnderlines the selected words. Shortcut: ⌘U.',
  'alt':                      'Emphasis (ALT)\nUses the bold/emphasis style for selected words. By default that inherits Regular font and colour. ⌘+click a word, or hold ⌘ and drag across several.',
  // Slide overrides
  'overrides':                'Overrides\nPer-slide settings that override the scheme defaults for just this slide: stage layout, transitions, and which macro fires.',
  'macro-override':           'Macro Override\nFires a specific macro when this slide is advanced to, on top of (or instead of) the scheme trigger settings.',
  'stage-layout-override':    'Stage Layout Override\nSwitches the Pro7 stage display to a specific layout when this slide is advanced to.',
  'transition-override':      'Transition Override\nUse a different slide transition for just this slide instead of the scheme default.',
  'prop-name':                'Prop Name\nThe name of the prop slot in Pro7. Auto-set from the reference or point text — edit it to match an existing prop.',
  'prop-transition-override': 'Prop Transition Override\nUse a different prop / LED wall transition for just this slide instead of the scheme default.',
  // Shared slide fields
  'blank-before':             'Blank Before\nInserts an empty slide before this one so the previous content clears before this slide appears.',
  // Scripture
  'reference':                'Reference\nBook, chapter and verse — e.g. John 3:16 or Tobit 6:2-4. Press Enter to look it up.',
  'fit-width':                'Fit Width\nAuto-sizes the text box to the content so short lines aren\'t stretched across the screen. Can be combined with Strip — when both are on, the box is sized to fit the flattened (stripped) text. Sizes the main screen by default; see "+ Display 2" to also fit the LED wall (on by default too, independently).',
  'fit-width-prop':           '+ Display 2\nAlso auto-size the LED wall (Display 2) box to the content — on by default alongside Fit Width. Display 2 has its own font size and canvas, so it gets its own independent fit, not a copy of the main screen\'s. Turn it off on slides where you\'ve positioned that box by hand and want it left alone.',
  'strip':                    'Strip\nRemoves hard line breaks on the main screen so the verse flows as one block. The prop / LED wall keeps its line breaks. Combine with Fit Width to size the box to the flattened text.',
  'bible-formatting':         'Bible Formatting\nAdd the verse number in front of each verse, and choose superscript or inline.',
  'split':                    'Split\nBreaks this scripture into a second slide so a long passage is shown across two slides instead of one crowded one.',
  // Point
  'point-single':             'Point — Single\nOne static prop that stays up while you talk. Use for a single point or statement.',
  'point-revealing':          'Point — Revealing\nOne prop per bullet, revealed one at a time. Use for a list that builds as you go.',
  // QR
  'qr-marker':                'QR Stop\nDrag into the deck to mark where auto QR-fill stops. Blanks before it default to QR on (when the deck-wide QR toggle is on); blanks at or after it default to off. Doesn\'t export as a slide.',
  'qr-toggle':                'QR\nToggles the QR macro for this blank specifically — overrides whatever the QR Stop marker would otherwise set, and stays put even if you move the marker later.',
  'qr-deck-toggle':           'QR\nThis deck\'s default QR state for blanks — turns the QR macro on for blanks before the QR Stop marker (or all blanks, if there\'s no marker). Any blank with its own QR override ignores this.',
};

// ─── State ────────────────────────────────────────────────────────────────────

const DEFAULT_FEATURES = () => ({
  blankBefore:          true,  // blank-before toggle on content slides
  confidenceMonitor:    true,  // blank confidence monitor text field
  propName:             true,  // prop name field
  transitionOverride:   true,  // per-slide main presentation transition override
  propTransitionOverride: true, // per-slide prop transition override
  overrides:            true,  // the Overrides disclosure on each slide
  bodyTools:            true,  // Fit Width / Strip buttons on scripture, Fit Width on points
  verseFormatting:      true,  // Verses (Bible formatting) button
});

const FONT_ADV_DEFAULTS = () => ({
  yOffset: 0, charSpacing: 0, lineHeight: 1,
  paragraphSpacingBefore: 0, paragraphSpacingAfter: 0,
  alignment: '', bold: false, italic: false, underline: false, strikethrough: false,
  capitalization: '', color: '',
  verticalAlignment: '',
  marginLeft: 0, marginTop: 0, marginRight: 0, marginBottom: 0,
  strokeEnabled: false, strokeWidth: 1, strokeColor: '',
  shadowEnabled: false, shadowOpacity: 75, shadowColor: '', shadowAngle: 315, shadowOffset: 5, shadowBlur: 5,
  scaleBehavior: '',
});

// Response Card elements for the LED wall prop (display 2). Base 5 (title +
// decision + 3 responses) plus any user-added custom elements. Each is fully
// editable: name (= Pro7 object name), text, position (x/y/w/h) and style
// (font/size/color/align). Empty font/size/color inherit the scheme prop fonts.
// Decision/R1–R3 text comes from the Response Card deck item, not here.
function DEFAULT_RC_ELEMENTS() {
  return [
    { id: 'rc-title',    role: 'title',    name: 'Response Card', text: 'Response Card', x: 325, y: 856, w: 2550, h: 400, font: '', size: 0, color: '', align: 'center' },
    { id: 'rc-decision', role: 'decision', name: 'Decision',      text: '',              x: 400, y: 150, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' },
    { id: 'rc-r1',       role: 'r1',       name: 'Response 1',     text: '',              x: 400, y: 330, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' },
    { id: 'rc-r2',       role: 'r2',       name: 'Response 2',     text: '',              x: 400, y: 510, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' },
    { id: 'rc-r3',       role: 'r3',       name: 'Response 3',     text: '',              x: 400, y: 690, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' },
  ];
}

const DEFAULT_GLOBAL_TYPOGRAPHY = () => ({
  font1:        'Montserrat-Medium',
  font2:        'Montserrat-ExtraBold',
  boldFont:     'Montserrat-Black',
  colorNeutral: '#ffffff',
  colorAccent:  '#ffffff',
  ...DEFAULT_GLOBAL_SIZES,
});

// All position/size fields shown in the Layout tab grid.
const LAYOUT_FIELDS = [
  'canvasW','canvasH',
  'bodyX','bodyY','bodyW','bodyH',
  'pointX','pointY','pointW','pointH',
  'titleX','titleY','titleW','titleH','autoTitleY','titleAutoGap',
  'rcBodyX','rcBodyY','rcBodyW','rcBodyH',
  'rcTitleX','rcTitleY','rcTitleW','rcTitleH','rcAutoTitleY','rcTitleAutoGap',
  'startEndX','startEndY','startEndW','startEndH',
  'liveX','liveY','liveW','liveH',
  'queueX','queueY','queueW','queueH',
  'propCanvasW','propCanvasH',
  'propBodyX','propBodyY','propBodyW','propBodyH',
  'propPointX','propPointY','propPointW','propPointH',
  'propTitleX','propTitleY','propTitleW','propTitleH','propAutoTitleY','propTitleAutoGap',
];
const DEFAULT_GLOBAL_LAYOUT = () => {
  const d = DEFAULT_STYLE_SCHEME();
  return Object.fromEntries(LAYOUT_FIELDS.map(k => [k, d[k]]));
};
function ensureGlobalLayout() {
  const def = DEFAULT_GLOBAL_LAYOUT();
  state.globalLayout = { ...def, ...(state.globalLayout || {}) };
  return state.globalLayout;
}

// Motion: transition type/duration (main + prop) and build orders. Same
// null-means-inherit-from-global pattern as layout fields — a scheme keeps a
// concrete value until the user explicitly resets it back to null.
const MOTION_SCALAR_FIELDS = ['transitionType', 'transitionDuration', 'propTransitionType', 'propTransitionDuration'];
const DEFAULT_GLOBAL_MOTION = () => {
  const d = DEFAULT_STYLE_SCHEME();
  return {
    ...Object.fromEntries(MOTION_SCALAR_FIELDS.map(k => [k, d[k]])),
    buildOrders: deepClone(d.buildOrders),
  };
};
function ensureGlobalMotion() {
  const def = DEFAULT_GLOBAL_MOTION();
  state.globalMotion = { ...def, ...(state.globalMotion || {}), buildOrders: (state.globalMotion || {}).buildOrders || def.buildOrders };
  return state.globalMotion;
}

// Macros / Stage Displays / Response Card: whole-list inherit. scheme.macros
// (etc) === null means "use Global's list live"; an array means the scheme
// has broken off into its own custom list. Global itself is always a real array.
function ensureGlobalMacros() {
  if (!Array.isArray(state.globalMacros)) state.globalMacros = [];
  return state.globalMacros;
}
function ensureGlobalStageDisplays() {
  if (!Array.isArray(state.globalStageDisplays)) state.globalStageDisplays = [];
  return state.globalStageDisplays;
}
function ensureGlobalRcElements() {
  if (!Array.isArray(state.globalRcElements)) state.globalRcElements = DEFAULT_RC_ELEMENTS();
  return state.globalRcElements;
}

const DEFAULT_GLOBAL_SIZES = {
  bodySize: 44,
  pointSize: 44,
  titleSize: 60,
  rcBodySize: 44,
  rcTitleSize: 60,
  startEndSize: 45,
  propBodySize: 80,
  propPointSize: 80,
  pointStackedSize: 66,
  propTitleSize: 110,
  notesSize: 50,
  liveSize: 42,
  queueSize: 32,
};
const SIZE_FIELDS = Object.keys(DEFAULT_GLOBAL_SIZES);
const SIZE_FIELD_SET = new Set(SIZE_FIELDS);
const SIZE_FIELD_TO_TYPO_KEY = Object.fromEntries(SIZE_FIELDS.map(k => [k, k]));
const TYPOGRAPHY_KEYS = ['font1', 'font2', 'boldFont', 'colorNeutral', 'colorAccent', ...SIZE_FIELDS];
const COLOR_TYPO_KEYS = new Set(['colorNeutral', 'colorAccent']);
const REGULAR_FONT_FIELDS   = ['bodyFont', 'propBodyFont', 'pointFont', 'propPointFont', 'pointStackedFont', 'rcBodyFont', 'startEndFont', 'notesFont', 'liveFont', 'queueFont'];
const HIGHLIGHT_FONT_FIELDS = ['titleFont', 'propTitleFont', 'rcTitleFont'];
const BOLD_FONT_FIELDS      = ['boldFont', 'propBoldFont', 'notesBoldFont'];
const REGULAR_ADV_FIELDS    = ['bodyFontAdv', 'propBodyFontAdv', 'pointFontAdv', 'propPointFontAdv', 'pointStackedFontAdv', 'rcBodyFontAdv', 'startEndFontAdv', 'notesFontAdv', 'liveFontAdv', 'queueFontAdv'];
const HIGHLIGHT_ADV_FIELDS  = ['titleFontAdv', 'propTitleFontAdv', 'rcTitleFontAdv'];
const BOLD_ADV_FIELDS       = ['boldFontAdv', 'propBoldFontAdv', 'notesBoldFontAdv'];
const ADV_SCHEME_KEYS = [...REGULAR_ADV_FIELDS, ...HIGHLIGHT_ADV_FIELDS, ...BOLD_ADV_FIELDS];
const DEFAULT_GLOBAL_FONT_ADV = () => Object.fromEntries(ADV_SCHEME_KEYS.map(k => [k, FONT_ADV_DEFAULTS()]));
function ensureGlobalFontAdv() {
  if (!state.globalFontAdv) state.globalFontAdv = DEFAULT_GLOBAL_FONT_ADV();
  for (const k of ADV_SCHEME_KEYS) {
    state.globalFontAdv[k] = { ...FONT_ADV_DEFAULTS(), ...(state.globalFontAdv[k] || {}) };
  }
  return state.globalFontAdv;
}
const FONT_FIELD_TO_TYPO_KEY = Object.fromEntries([
  ...REGULAR_FONT_FIELDS.map(k => [k, 'font1']),
  ...HIGHLIGHT_FONT_FIELDS.map(k => [k, 'font2']),
  ...BOLD_FONT_FIELDS.map(k => [k, 'boldFont']),
]);
const ADV_FIELD_TO_TYPO_KEY = Object.fromEntries([
  ...REGULAR_ADV_FIELDS.map(k => [k, 'colorNeutral']),
  ...HIGHLIGHT_ADV_FIELDS.map(k => [k, 'colorAccent']),
  ...BOLD_ADV_FIELDS.map(k => [k, 'colorNeutral']),
]);
const DEFAULT_SCHEME_TYPOGRAPHY = () => Object.fromEntries(TYPOGRAPHY_KEYS.map(k => [k, null]));

const DEFAULT_STYLE_SCHEME = () => ({
  id:          'default',
  name:        'Default',
  isLocked:    false,
  typography:  DEFAULT_SCHEME_TYPOGRAPHY(),
  macros:            [],  // per-scheme macro list (name, uuid, color, triggers)
  stageDisplays:     [],  // per-scheme stage display entries [{id, name, uuid, triggers}]
  rcElements:        DEFAULT_RC_ELEMENTS(),  // display-2 response card elements
  _ptSizes:    true,
  fillEnabled: false,
  bodyFill:    '#2196f2',
  titleFill:   '#a9391a',
  // Fonts
  bodyFont:     'Montserrat-Medium',
  propBodyFont: 'Montserrat-SemiBold',
  pointFont:    'Montserrat-ExtraBold',   // point text (main screen)
  propPointFont:'Montserrat-ExtraBold',   // point text (LED wall) — active/current bullet
  pointStackedFont: 'Montserrat-Medium',  // revealing points on the LED wall — previously-revealed (stacked) bullets
  rcBodyFont:   'Montserrat-Medium',
  rcTitleFont:  'Montserrat-ExtraBold',
  titleFont:    'Montserrat-ExtraBold',
  propTitleFont:'Montserrat-ExtraBold',
  startEndFont: 'Montserrat-ExtraBold',
  notesFont:     'Montserrat-Medium',
  notesBoldFont: 'Montserrat-Black',  // alt/emphasis words on the confidence monitor — matches scripture's bold look by default
  liveFont:      'HelveticaNeue',  // "live" confidence-monitor badge
  queueFont:     'HelveticaNeue',  // upcoming-slide queue sidebar
  // Sizes (pt — backend doubles for RTF automatically)
  bodySize:      44,
  pointSize:     44,
  titleSize:     60,
  rcBodySize:    44,
  rcTitleSize:   60,
  startEndSize:  45,
  propBodySize:  80,
  propPointSize: 80,
  pointStackedSize: 66,
  propTitleSize: 110,
  notesSize:     50,
  liveSize:      42,
  queueSize:     32,
  // Transitions — main presentation
  transitionType:     'fade',
  transitionDuration: 0.6,
  // Transitions — props (global default)
  propTransitionType:     'fade',
  propTransitionDuration: 0.6,
  // Canvas dimensions
  canvasW: 1920, canvasH: 1080,
  propCanvasW: 3200, propCanvasH: 1280,
  // Main screen element bounds
  bodyX: 0, bodyY: 729.98, bodyW: 1920, bodyH: 350.02,
  bodyMarginLeft: 0, bodyMarginTop: 0, bodyMarginRight: 0, bodyMarginBottom: 60,
  pointX: 0, pointY: 729.98, pointW: 1920, pointH: 350.02,
  titleX: -0.18, titleY: 880, titleW: 1920.18, titleH: 50.51,
  autoTitleY: true, titleAutoGap: 16,
  rcBodyX: 0, rcBodyY: 729.98, rcBodyW: 1920, rcBodyH: 350.02,
  rcTitleX: -0.18, rcTitleY: 880, rcTitleW: 1920.18, rcTitleH: 50.51,
  rcAutoTitleY: true, rcTitleAutoGap: 16,
  startEndX: 0, startEndY: 900.14, startEndW: 1920, startEndH: 179.86,
  liveX: 1736.73, liveY: 1096.71, liveW: 183.27, liveH: 71.56,
  queueX: 0, queueY: 0, queueW: 400, queueH: 1080,
  // Prop element bounds (scaled to 3200×1280)
  propBodyX: 0, propBodyY: 853, propBodyW: 3200, propBodyH: 427,
  propPointX: 0, propPointY: 853, propPointW: 3200, propPointH: 427,
  propTitleX: -0.30, propTitleY: 1040, propTitleW: 3200.30, propTitleH: 60,
  propAutoTitleY: true, propTitleAutoGap: 16,
  // Font advanced styling. Display 2 (LED-wall prop) advanced styling defaults
  // to null = "inherit Display 1" — resolved live from the matching Display 1
  // row in applyTypographyToStyle. A concrete object here means "overridden".
  bodyFontAdv:     FONT_ADV_DEFAULTS(),
  propBodyFontAdv: null,
  boldFontAdv:     FONT_ADV_DEFAULTS(),
  propBoldFontAdv: null,
  pointFontAdv:    FONT_ADV_DEFAULTS(),
  propPointFontAdv:null,
  pointStackedFontAdv: FONT_ADV_DEFAULTS(),
  rcBodyFontAdv:   null,
  rcTitleFontAdv:  null,
  titleFontAdv:    FONT_ADV_DEFAULTS(),
  propTitleFontAdv:null,
  startEndFontAdv: FONT_ADV_DEFAULTS(),
  notesFontAdv:    FONT_ADV_DEFAULTS(),
  notesBoldFontAdv:FONT_ADV_DEFAULTS(),
  liveFontAdv:     FONT_ADV_DEFAULTS(),
  queueFontAdv:    FONT_ADV_DEFAULTS(),
  // Build order per slide type
  buildOrders: {
    content: [
      { id: 'bo-c1', element: 'body',  dir: 'out', start: 'START_WITH_SLIDE', delay: 60, transition: 'dissolve', duration: 0.6, enabled: true },
      { id: 'bo-c2', element: 'title', dir: 'out', start: 'START_WITH_PREVIOUS',  delay: 0,  transition: 'dissolve', duration: 0.6, enabled: true },
    ],
    point:   [],
    blank:   [],
    startEnd:[
      { id: 'bo-se1', element: 'body', dir: 'in', start: 'START_WITH_SLIDE', delay: 1, transition: 'cut', duration: 0, enabled: true },
    ],
  },
});


const DEFAULT_STAGESCREEN = () => ({
  screenName:         'Stage Screen 1',
  screenUuid:         'DC13BE46-70FA-440C-B205-9063C695836A',
  rcLayoutName:       'RESPONSE CARD',
  rcLayoutUuid:       '6934381D-0B53-4557-812D-49AE7BACBA6B',
  messageLayoutName:  '26SPRING_stagedisplay_message',
  messageLayoutUuid:  '2530DD83-DD12-4E0A-93E2-AE326D9C1B38',
});

const DEFAULT_STATE = () => ({
  config: {
    seriesName:          '',
    messageTitle:        '',
    weekDate:            new Date().toISOString().slice(0, 10),
    qrCode:              false,
    qrMacro:             null,
    // When true AND qrCode is on, Export delivers TWO presentations (no-QR +
    // QR) sharing one prop collection, instead of just the QR-configured deck.
    qrExportPair:        false,
    // Dedicated gradient macros: gradientMacro fires on Scripture/Point/RC
    // Content cues normally; gradientMacroQr fires there instead whenever
    // this export's qrCode is on (e.g. the QR half of a paired export) — a
    // different visual treatment to match the QR-configured look.
    gradientMacro:       null,
    gradientMacroQr:     null,
    includeResponseCard: true,
    outputFolder:        '',
    pro7Port:            1025,
    pro7Password:        '',
    autoManagePro7:      false,
    pro7RootFolder:      '',
    pro7LibraryFolder:   '',
    setupComplete:       false,
    icloudSync:          false, // machine-local: whether THIS Mac syncs portable settings via iCloud (never itself synced)
    theme:               '',
    features:            DEFAULT_FEATURES(),
    stageScreen:         DEFAULT_STAGESCREEN(),
    bibleApiKey:         '',
    bibleId:             '',
    bibleName:           '',
    bibleList:           [],  // cached [{id, name, abbreviation}]
    verseNumbers:        false, // prefix each verse with its number on lookup
    verseSuper:          true,  // render verse numbers as superscript
    queueMode:           'ref', // queue strip: 'list' | 'ref' | 'refPhrase'
    gdriveUrl:           '',  // last-loaded Google Drive notes doc (persists across redeploys)
    notesMode:           'manual', // Smart Notes: 'manual' (you pick) | 'auto' (scan & suggest)
    notesIgnored:        [],   // suggestion keys the user dismissed (don't re-suggest)
    notesTrayOpen:       true,  // Suggested Slides tray expanded/collapsed
    notesStyleMap:       {},   // signal (heading tag / highlight color) → role mapping
    notesUseNearbyRefs:  true, // pair highlighted Content with a nearby unhighlighted scripture ref above it
    bookNames:           {},  // e.g. { acts: 'Acts of the Apostles', songOfSolomon: 'Song of Songs' }
    capitalizeDivinePronouns: false, // capitalize He/Him/His/Himself in body text at export
    speakers:            [],  // permanent/recurring speakers offered in the New Deck dropdown
    displayNames:        { mainScreen: 'Main Screen', ledWall: 'LED Wall', monitor: 'Confidence Monitor' },
    responses: {
      decisionText: 'I have decided to follow Jesus today!',
      r1: '',
      r2: '',
      r3: '',
      notesTemplate: '{decision}\n1 — {r1}\n2 — {r2}\n3 — {r3}',
    },
  },
  globalTypography: DEFAULT_GLOBAL_TYPOGRAPHY(),
  globalLayout:     DEFAULT_GLOBAL_LAYOUT(),
  globalFontAdv:    DEFAULT_GLOBAL_FONT_ADV(),
  globalMotion:     DEFAULT_GLOBAL_MOTION(),
  globalMacros:     [],
  globalStageDisplays: [],
  globalRcElements: DEFAULT_RC_ELEMENTS(),
  styleSchemes:  [DEFAULT_STYLE_SCHEME()],
  activeSchemeId: 'default',
  showBlanks: true,
  slides: [
    { id: 'start', type: 'start', label: 'Start of Notes', fixed: true },
    { id: 'end',   type: 'end',   label: 'End of Notes',   fixed: true },
  ],
  activeId: 'start',
  currentDeckId: null,
});

let state = DEFAULT_STATE();

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeHexColor(value, fallback = '#ffffff') {
  if (!value) return fallback;
  const raw = String(value).trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return ('#' + raw).toLowerCase();
  return fallback;
}

function advColor(adv, fallback = '#ffffff') {
  return normalizeHexColor(adv?.color, fallback);
}

function ensureGlobalTypography(seedScheme = null) {
  const seed = seedScheme || (state.styleSchemes || []).find(s => s?.isDefault) || (state.styleSchemes || [])[0] || {};
  const base = {
    font1:        seed.bodyFont  || 'Montserrat-Medium',
    font2:        seed.titleFont || 'Montserrat-ExtraBold',
    boldFont:     'Montserrat-Black',
    colorNeutral: advColor(seed.bodyFontAdv,  '#ffffff'),
    colorAccent:  advColor(seed.titleFontAdv, '#ffffff'),
    ...Object.fromEntries(SIZE_FIELDS.map(k => [k, Number(seed[k]) || DEFAULT_GLOBAL_SIZES[k]])),
  };
  state.globalTypography = {
    ...DEFAULT_GLOBAL_TYPOGRAPHY(),
    ...base,
    ...(state.globalTypography || {}),
  };
  state.globalTypography.colorNeutral = normalizeHexColor(state.globalTypography.colorNeutral);
  state.globalTypography.colorAccent  = normalizeHexColor(state.globalTypography.colorAccent);
  for (const key of SIZE_FIELDS) state.globalTypography[key] = Number(state.globalTypography[key]) || DEFAULT_GLOBAL_SIZES[key];
  return state.globalTypography;
}

function ensureSchemeTypography(scheme, global = ensureGlobalTypography()) {
  if (!scheme) return {};
  const existing = scheme.typography || {};
  // Migrate old key names from before v4.3.31
  if (existing.regularFont   !== undefined) { existing.font1        = existing.font1        ?? existing.regularFont;    delete existing.regularFont; }
  if (existing.highlightFont !== undefined) { existing.font2        = existing.font2        ?? existing.highlightFont;  delete existing.highlightFont; }
  if (existing.regularColor  !== undefined) { existing.colorNeutral = existing.colorNeutral ?? existing.regularColor;   delete existing.regularColor; }
  if (existing.highlightColor!== undefined) { existing.colorAccent  = existing.colorAccent  ?? existing.highlightColor; delete existing.highlightColor; }
  const typography = {};
  for (const key of TYPOGRAPHY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(existing, key)) {
      typography[key] = SIZE_FIELD_SET.has(key)
        ? (existing[key] == null ? null : Number(existing[key]) || null)
        : (existing[key] || null);
    } else {
      // Legacy seed: first-time migration from old per-field scheme values
      let raw;
      if      (key === 'font1')        raw = scheme.bodyFont  || '';
      else if (key === 'font2')        raw = scheme.titleFont || '';
      else if (key === 'boldFont')     raw = '';
      else if (key === 'colorNeutral') raw = advColor(scheme.bodyFontAdv,  '');
      else if (key === 'colorAccent')  raw = advColor(scheme.titleFontAdv, '');
      else if (SIZE_FIELD_SET.has(key)) raw = scheme[key];
      else raw = '';
      const inherited = SIZE_FIELD_SET.has(key)
        ? Number(raw) === Number(global[key])
        : COLOR_TYPO_KEYS.has(key)
          ? normalizeHexColor(raw, global[key]) === normalizeHexColor(global[key])
          : raw === global[key];
      typography[key] = inherited ? null : (SIZE_FIELD_SET.has(key) ? Number(raw) || null : raw || null);
    }
  }
  scheme.typography = typography;
  return typography;
}

function resolveSchemeTypography(scheme, global = ensureGlobalTypography()) {
  const overrides = ensureSchemeTypography(scheme, global);
  return {
    font1:        overrides.font1        || global.font1,
    font2:        overrides.font2        || global.font2,
    boldFont:     overrides.boldFont     || global.boldFont,
    colorNeutral: normalizeHexColor(overrides.colorNeutral || global.colorNeutral),
    colorAccent:  normalizeHexColor(overrides.colorAccent  || global.colorAccent),
    ...Object.fromEntries(SIZE_FIELDS.map(k => [k, Number(overrides[k] ?? global[k]) || DEFAULT_GLOBAL_SIZES[k]])),
  };
}

function setAdvColor(style, key, color) {
  style[key] = { ...FONT_ADV_DEFAULTS(), ...(style[key] || {}), color: normalizeHexColor(color) };
}

function applyTypographyToStyle(scheme, global = ensureGlobalTypography()) {
  const style = deepClone(scheme || DEFAULT_STYLE_SCHEME());
  const t = resolveSchemeTypography(style, global);
  // fontFields stores per-field overrides; palette is the fallback
  const ff = style.fontFields || {};
  for (const key of REGULAR_FONT_FIELDS)   style[key] = ff[key] || t.font1;
  for (const key of HIGHLIGHT_FONT_FIELDS)  style[key] = ff[key] || t.font2;
  for (const key of BOLD_FONT_FIELDS)       style[key] = ff[key] || t.boldFont;
  for (const key of SIZE_FIELDS)            style[key] = t[key];
  // Per-field color override: if scheme has a color set on the adv, keep it; else use palette
  for (const key of REGULAR_ADV_FIELDS) {
    if (scheme[key]?.color) style[key] = { ...FONT_ADV_DEFAULTS(), ...(scheme[key] || {}) };
    else setAdvColor(style, key, t.colorNeutral);
  }
  for (const key of HIGHLIGHT_ADV_FIELDS) {
    if (scheme[key]?.color) style[key] = { ...FONT_ADV_DEFAULTS(), ...(scheme[key] || {}) };
    else setAdvColor(style, key, t.colorAccent);
  }
  for (const key of BOLD_ADV_FIELDS) {
    if (scheme[key]?.color) style[key] = { ...FONT_ADV_DEFAULTS(), ...(scheme[key] || {}) };
    else setAdvColor(style, key, t.colorNeutral);
  }
  // Display 2 (LED-wall prop) advanced styling inherits Display 1 when the
  // scheme leaves it null. The loops above already resolved the Display 1
  // counterparts, so clone those over — live, so changing Display 1 carries to
  // Display 2 until the user overrides it. A concrete value is left untouched.
  for (const [d2, d1] of Object.entries(D2_ADV_INHERIT)) {
    if (scheme[d2] == null) style[d2] = deepClone(style[d1]);
  }
  return style;
}

// LED-wall advanced-styling field → the Display 1 field it inherits from when
// left null. Covers the Display 2 prop rows and the Response Card text rows,
// which all default to following their main-screen counterpart.
const D2_ADV_INHERIT = {
  propBodyFontAdv:  'bodyFontAdv',
  propPointFontAdv: 'pointFontAdv',
  propTitleFontAdv: 'titleFontAdv',
  propBoldFontAdv:  'boldFontAdv',
  rcBodyFontAdv:    'bodyFontAdv',
  rcTitleFontAdv:   'titleFontAdv',
};

// Materialize a scheme's advanced-styling object before an edit. A Display 2
// field that's inheriting (null) forks from its resolved Display 1 counterpart
// so the edit starts from what was on screen — not blank defaults, which would
// silently drop the inherited colour/style. Everything else forks from blanks.
function forkAdv(scheme, key) {
  if (scheme[key]) return scheme[key];
  const d1 = D2_ADV_INHERIT[key];
  scheme[key] = d1
    ? deepClone(styleForExport(scheme)[d1] || FONT_ADV_DEFAULTS())
    : FONT_ADV_DEFAULTS();
  return scheme[key];
}

function styleForExport(scheme) {
  const resolved = applyTypographyToStyle(scheme || activeStyleScheme());
  const glb = ensureGlobalLayout();
  for (const f of LAYOUT_FIELDS) {
    if (resolved[f] == null && glb[f] != null) resolved[f] = glb[f];
  }
  const glbMotion = ensureGlobalMotion();
  for (const f of MOTION_SCALAR_FIELDS) {
    if (resolved[f] == null && glbMotion[f] != null) resolved[f] = glbMotion[f];
  }
  if (resolved.buildOrders == null) resolved.buildOrders = glbMotion.buildOrders;
  if (resolved.rcElements == null) resolved.rcElements = ensureGlobalRcElements();
  const {
    id: _sid,
    name: _sname,
    isLocked: _sl,
    typography: _typo,
    fontFields: _ff,
    ...style
  } = resolved;
  return style;
}

function dn(key) {
  const n = (state.config.displayNames || {})[key];
  if (n) return n;
  if (key === 'mainScreen') return 'Main Screen';
  if (key === 'ledWall')    return 'LED Wall';
  if (key === 'monitor')    return 'Confidence Monitor';
  return key;
}

// ─── Pro7 runtime state (not persisted) ──────────────────────────────────────
const pro7rt = { connected: false, version: null, liveMacros: null, liveStageLayouts: null };
let   _fontList      = null;  // cached system font list (PostScript names)
let   _fontFamilyMap = null;  // family → [{ style, postscript }]

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY    = 'deckpro_state';
const GEN_HISTORY_KEY = 'deckpro_gen_history';
const GEN_HISTORY_MAX = 30;

let _savedTimer   = null;
let _autosaveTimer = null;
const _undoStack = [];
const _redoStack = [];
const UNDO_LIMIT = 60;
let _skipUndoPush = false;

function pushUndo() {
  if (_skipUndoPush) return;
  _undoStack.push(JSON.stringify(state));
  if (_undoStack.length > UNDO_LIMIT) _undoStack.shift();
  _redoStack.length = 0;
  updateUndoButtons();
}

function updateUndoButtons() {
  const u = document.getElementById('btn-undo');
  const r = document.getElementById('btn-redo');
  if (u) u.disabled = _undoStack.length === 0;
  if (r) r.disabled = _redoStack.length === 0;
}

function applyUndo() {
  if (!_undoStack.length) return;
  _redoStack.push(JSON.stringify(state));
  state = JSON.parse(_undoStack.pop());
  _skipUndoPush = true;
  saveState(); render(); syncHeaderInputs();
  _syncNotesPanelToDeck?.();  // keep notes panel in sync if undo crossed a load/clear
  _skipUndoPush = false;
  updateUndoButtons();
}

function applyRedo() {
  if (!_redoStack.length) return;
  _undoStack.push(JSON.stringify(state));
  state = JSON.parse(_redoStack.pop());
  _skipUndoPush = true;
  saveState(); render(); syncHeaderInputs();
  _syncNotesPanelToDeck?.();  // keep notes panel in sync if redo crossed a load/clear
  _skipUndoPush = false;
  updateUndoButtons();
}

let _saveFailed = false;
let _stateFileSaveFailed = false;
let _stateFileSaveTimer = null;

async function persistStateToFile() {
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
    if (!res.ok) throw new Error('State save failed');
    _stateFileSaveFailed = false;
  } catch (e) {
    if (!_stateFileSaveFailed) {
      _stateFileSaveFailed = true;
      toast('error', 'Settings are not saving', 'DeckPro could not write its app-data state file. Your changes may not survive relaunch.');
    }
  }
}

function scheduleStateFileSave() {
  clearTimeout(_stateFileSaveTimer);
  _stateFileSaveTimer = setTimeout(persistStateToFile, 250);
}

function saveStateBeforeUnload() {
  const body = JSON.stringify({ state });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/state', new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch (_) {}
  try {
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  } catch (_) {}
}

function saveState() {
  pushUndo();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    _saveFailed = false;
  } catch (e) {
    // Don't fail silently — a save failure means the user's work isn't persisted.
    if (!_saveFailed) {
      _saveFailed = true;
      toast('error', 'Not saving locally', 'Local storage is full or blocked, so changes are not being saved. Export now to keep your work.');
    }
  }
  scheduleStateFileSave();
  const el = document.getElementById('saved-indicator');
  if (el) {
    el.classList.add('show');
    clearTimeout(_savedTimer);
    _savedTimer = setTimeout(() => el.classList.remove('show'), 1200);
  }
  clearTimeout(_autosaveTimer);
  _autosaveTimer = setTimeout(autosaveDeck, 1500);
  bumpSyncMeta();
}

function applySavedState(saved) {
  if (!saved || typeof saved !== 'object') return false;
  try {
    state = Object.assign(DEFAULT_STATE(), saved);
    // Merge config separately so new keys get defaults
    const defaultCfg = DEFAULT_STATE().config;
    state.config = Object.assign(defaultCfg, saved.config || {});
    // Ensure nested responses object gets defaults
    state.config.responses = Object.assign(defaultCfg.responses, (saved.config || {}).responses || {});
    // Feature flags
    state.config.features = Object.assign(DEFAULT_FEATURES(), (saved.config || {}).features || {});
    // Stage screen config
    state.config.stageScreen = Object.assign(DEFAULT_STAGESCREEN(), (saved.config || {}).stageScreen || {});
    // Restore style schemes — support old 'stylePresets' key for migration
    const savedSchemes = saved.styleSchemes || saved.stylePresets;
    if (Array.isArray(savedSchemes) && savedSchemes.length) {
      const LEGACY_PT_SIZE_FIELDS = ['bodySize', 'pointSize', 'titleSize', 'rcBodySize', 'rcTitleSize', 'startEndSize', 'propBodySize', 'propPointSize', 'propTitleSize'];
      state.styleSchemes = savedSchemes.map(p => {
        const DEF = DEFAULT_STYLE_SCHEME();
        // Migrate old half-point values to pt
        let out = deepClone(p);
        if (!p._ptSizes) {
          out = { ...out, _ptSizes: true };
          for (const f of LEGACY_PT_SIZE_FIELDS) if (out[f]) out[f] = Math.round(out[f] / 2);
        }
        // Merge with defaults so all new fields get values
        const merged = { ...DEF, ...out };
        // Clean up junk 'undefined' key left by a pre-4.7.2 double-bound color handler
        delete merged['undefined'];
        merged._needsTypographyMigration = !out.typography;
        // Merge nested fontAdv objects too
        for (const k of ['bodyFontAdv','propBodyFontAdv','boldFontAdv','propBoldFontAdv','notesBoldFontAdv','titleFontAdv','propTitleFontAdv','startEndFontAdv','notesFontAdv','liveFontAdv','queueFontAdv','pointFontAdv','propPointFontAdv','pointStackedFontAdv','rcBodyFontAdv','rcTitleFontAdv']) {
          merged[k] = { ...FONT_ADV_DEFAULTS(), ...(out[k] || {}) };
        }
        // Seed slide-notes font fields for schemes saved before notes were customizable
        if (!out.notesFont)     merged.notesFont     = DEF.notesFont;
        if (!out.notesSize)     merged.notesSize     = DEF.notesSize;
        // Seed point sizes added in v3.40.0
        if (!out.pointSize)     merged.pointSize     = merged.bodySize;
        if (!out.propPointSize) merged.propPointSize = merged.propBodySize;
        // Seed point layout split from body layout
        if (out.pointX === undefined) merged.pointX = merged.bodyX;
        if (out.pointY === undefined) merged.pointY = merged.bodyY;
        if (out.pointW === undefined) merged.pointW = merged.bodyW;
        if (out.pointH === undefined) merged.pointH = merged.bodyH;
        if (out.propPointX === undefined) merged.propPointX = merged.propBodyX;
        if (out.propPointY === undefined) merged.propPointY = merged.propBodyY;
        if (out.propPointW === undefined) merged.propPointW = merged.propBodyW;
        if (out.propPointH === undefined) merged.propPointH = merged.propBodyH;
        if (!out.rcBodySize)  merged.rcBodySize  = merged.bodySize;
        if (!out.rcTitleSize) merged.rcTitleSize = merged.titleSize;
        if (!out.rcBodyFont)  merged.rcBodyFont  = merged.bodyFont;
        if (!out.rcTitleFont) merged.rcTitleFont = merged.titleFont;
        if (out.rcBodyX === undefined) merged.rcBodyX = merged.bodyX;
        if (out.rcBodyY === undefined) merged.rcBodyY = merged.bodyY;
        if (out.rcBodyW === undefined) merged.rcBodyW = merged.bodyW;
        if (out.rcBodyH === undefined) merged.rcBodyH = merged.bodyH;
        if (out.rcTitleX === undefined) merged.rcTitleX = merged.titleX;
        if (out.rcTitleY === undefined) merged.rcTitleY = merged.titleY;
        if (out.rcTitleW === undefined) merged.rcTitleW = merged.titleW;
        if (out.rcTitleH === undefined) merged.rcTitleH = merged.titleH;
        if (out.rcAutoTitleY === undefined) merged.rcAutoTitleY = merged.autoTitleY;
        if (out.rcTitleAutoGap === undefined) merged.rcTitleAutoGap = merged.titleAutoGap;
        // Seed prop title font split added in v3.40.0
        if (!out.propTitleFont)    merged.propTitleFont    = merged.titleFont;
        if (!out.propTitleFontAdv) merged.propTitleFontAdv = JSON.parse(JSON.stringify(merged.titleFontAdv));
        else                       merged.propTitleFontAdv = { ...FONT_ADV_DEFAULTS(), ...out.propTitleFontAdv };
        // boldFont / propBoldFont were removed (emphasis renders as plain \b on the
        // body font). Carry the bold *advanced* styling forward as an internal
        // fallback for point styling on schemes saved before the point-font split.
        if (!out.propBoldFontAdv) merged.propBoldFontAdv = JSON.parse(JSON.stringify(merged.boldFontAdv));
        else                      merged.propBoldFontAdv = { ...FONT_ADV_DEFAULTS(), ...out.propBoldFontAdv };
        // Seed the split point fonts from the old bold fonts for pre-split schemes
        // (preserves existing point-text styling — point used to share the bold font).
        if (!out.pointFont)         merged.pointFont         = out.boldFont || merged.pointFont;
        if (!out.pointFontAdv)      merged.pointFontAdv      = JSON.parse(JSON.stringify(merged.boldFontAdv));
        else                        merged.pointFontAdv      = { ...FONT_ADV_DEFAULTS(), ...out.pointFontAdv };
        if (!out.propPointFont)     merged.propPointFont     = out.propBoldFont || out.boldFont || merged.propPointFont;
        if (!out.propPointFontAdv)  merged.propPointFontAdv  = JSON.parse(JSON.stringify(merged.propBoldFontAdv));
        else                        merged.propPointFontAdv  = { ...FONT_ADV_DEFAULTS(), ...out.propPointFontAdv };
        if (!out.rcBodyFontAdv)     merged.rcBodyFontAdv     = JSON.parse(JSON.stringify(merged.bodyFontAdv));
        else                        merged.rcBodyFontAdv     = { ...FONT_ADV_DEFAULTS(), ...out.rcBodyFontAdv };
        if (!out.rcTitleFontAdv)    merged.rcTitleFontAdv    = JSON.parse(JSON.stringify(merged.titleFontAdv));
        else                        merged.rcTitleFontAdv    = { ...FONT_ADV_DEFAULTS(), ...out.rcTitleFontAdv };
        // Drop the removed orphan fields if an old scheme carried them.
        delete merged.titleText; delete merged.titleShadow;
        delete merged.boldFont;  delete merged.propBoldFont;
        // Strip legacy isDefault flag — all schemes are equal now
        delete merged.isDefault;
        if (p.isLocked === undefined) merged.isLocked = false;
        // Merge buildOrders — fill any missing tab keys with defaults. A scheme
        // that explicitly has buildOrders: null (inheriting Global) stays null —
        // only materialize/fill defaults for schemes that HAVE their own object.
        if (out.buildOrders === null) {
          merged.buildOrders = null;
        } else {
          merged.buildOrders = deepClone({ ...DEF.buildOrders, ...(out.buildOrders || {}) });
          // Migrate old 'this slide' → 'body', and drop the retired 'atem_gradient'
          // build-order entries (the gradient is now a Pro7 macro, not an element).
          for (const tabKey of Object.keys(merged.buildOrders)) {
            if (Array.isArray(merged.buildOrders[tabKey])) {
              merged.buildOrders[tabKey] = merged.buildOrders[tabKey]
                .filter(entry => entry.element !== 'atem_gradient')
                .map(entry => entry.element === 'this slide' ? { ...entry, element: 'body' } : entry);
            }
          }
        }
        return deepClone(merged);
      });
    }
    const seedGlobalScheme = state.styleSchemes.find(s => s.isDefault) || state.styleSchemes[0] || DEFAULT_STYLE_SCHEME();
    const _rawGT = saved.globalTypography ? { ...saved.globalTypography } : null;
    // Migrate old key names (pre-v4.3.31)
    if (_rawGT) {
      if (_rawGT.regularFont   !== undefined) { _rawGT.font1        = _rawGT.font1        ?? _rawGT.regularFont;    delete _rawGT.regularFont; }
      if (_rawGT.highlightFont !== undefined) { _rawGT.font2        = _rawGT.font2        ?? _rawGT.highlightFont;  delete _rawGT.highlightFont; }
      if (_rawGT.regularColor  !== undefined) { _rawGT.colorNeutral = _rawGT.colorNeutral ?? _rawGT.regularColor;   delete _rawGT.regularColor; }
      if (_rawGT.highlightColor!== undefined) { _rawGT.colorAccent  = _rawGT.colorAccent  ?? _rawGT.highlightColor; delete _rawGT.highlightColor; }
    }
    state.globalTypography = _rawGT
      ? { ...DEFAULT_GLOBAL_TYPOGRAPHY(), ..._rawGT }
      : {
          font1:        seedGlobalScheme.bodyFont  || 'Montserrat-Medium',
          font2:        seedGlobalScheme.titleFont || 'Montserrat-ExtraBold',
          boldFont:     'Montserrat-Black',
          colorNeutral: advColor(seedGlobalScheme.bodyFontAdv,  '#ffffff'),
          colorAccent:  advColor(seedGlobalScheme.titleFontAdv, '#ffffff'),
          ...Object.fromEntries(SIZE_FIELDS.map(k => [k, Number(seedGlobalScheme[k]) || DEFAULT_GLOBAL_SIZES[k]])),
        };
    state.globalTypography.colorNeutral = normalizeHexColor(state.globalTypography.colorNeutral);
    state.globalTypography.colorAccent  = normalizeHexColor(state.globalTypography.colorAccent);
    for (const key of SIZE_FIELDS) state.globalTypography[key] = Number(state.globalTypography[key]) || DEFAULT_GLOBAL_SIZES[key];
    for (const scheme of state.styleSchemes) {
      if (scheme._needsTypographyMigration) delete scheme.typography;
      ensureSchemeTypography(scheme, state.globalTypography);
      delete scheme._needsTypographyMigration;
    }
    state.globalLayout = saved.globalLayout
      ? { ...DEFAULT_GLOBAL_LAYOUT(), ...saved.globalLayout }
      : DEFAULT_GLOBAL_LAYOUT();
    if (saved.globalFontAdv) {
      state.globalFontAdv = DEFAULT_GLOBAL_FONT_ADV();
      for (const k of ADV_SCHEME_KEYS) {
        state.globalFontAdv[k] = { ...FONT_ADV_DEFAULTS(), ...(saved.globalFontAdv[k] || {}) };
      }
    } else {
      state.globalFontAdv = DEFAULT_GLOBAL_FONT_ADV();
    }
    state.globalMotion = saved.globalMotion
      ? { ...DEFAULT_GLOBAL_MOTION(), ...saved.globalMotion, buildOrders: saved.globalMotion.buildOrders || DEFAULT_GLOBAL_MOTION().buildOrders }
      : DEFAULT_GLOBAL_MOTION();
    state.globalMacros        = Array.isArray(saved.globalMacros)        ? saved.globalMacros        : [];
    state.globalStageDisplays = Array.isArray(saved.globalStageDisplays) ? saved.globalStageDisplays : [];
    state.globalRcElements    = Array.isArray(saved.globalRcElements)    ? saved.globalRcElements    : DEFAULT_RC_ELEMENTS();
    // Support old 'activeStyleId' key for migration
    state.activeSchemeId = saved.activeSchemeId || saved.activeStyleId
      || (state.styleSchemes[0]?.id ?? 'default');
    state.showBlanks = saved.showBlanks ?? true;
    // Migrate global customMacros → per-scheme macros (v4.0.10+)
    if (Array.isArray(saved.config?.customMacros) && saved.config.customMacros.length) {
      const defaultScheme = state.styleSchemes.find(s => s.isDefault) || state.styleSchemes[0];
      if (defaultScheme && !defaultScheme.macros?.length) {
        defaultScheme.macros = saved.config.customMacros;
      }
    }

    // Migrate global stageScreen → per-scheme stageDisplays + stageScreenConfig (v4.2.2+)
    const _ss = saved.config?.stageScreen;
    if (_ss) {
      for (const scheme of state.styleSchemes) {
        if (!scheme.stageDisplays?.length) {
          scheme.stageDisplays = [
            { id: uid(), name: _ss.rcLayoutName      || '', uuid: _ss.rcLayoutUuid      || '', triggers: ['rcBlank', 'rcContent', 'rcHold'] },
            { id: uid(), name: _ss.messageLayoutName || '', uuid: _ss.messageLayoutUuid || '', triggers: ['scripture', 'point', 'blank', 'image', 'custom'] },
          ].filter(d => d.name || d.uuid);
        }
      }
    }

    // Migrate legacy 'rc' macro trigger → 'rcContent' (v4.2.4+)
    for (const scheme of state.styleSchemes) {
      for (const macro of (scheme.macros || [])) {
        if (Array.isArray(macro.triggers) && macro.triggers.includes('rc')) {
          macro.triggers = macro.triggers.map(t => t === 'rc' ? 'rcContent' : t);
        }
      }
    }

    // Migrate role-based stageDisplays → trigger-based (v4.3.0+)
    for (const scheme of state.styleSchemes) {
      if (!scheme.stageDisplays?.length) continue;
      let screenEntry = null;
      scheme.stageDisplays = scheme.stageDisplays.map(d => {
        if (!d.role) return d; // already trigger-based
        if (d.role === 'screen') { screenEntry = d; return null; }
        const triggers = d.role === 'msgLayout'
          ? ['scripture', 'point', 'blank', 'image', 'custom']
          : d.role === 'rcLayout'
          ? ['rcBlank', 'rcContent', 'rcHold']
          : (d.triggers || []);
        return { id: d.id, name: d.name || '', uuid: d.uuid || '', triggers };
      }).filter(Boolean);
    }

    // Migrate old string[] bullets → spans[][] for revealing points
    for (const sl of (state.slides || [])) {
      if (sl.type === 'point' && sl.mode === 'revealing' && Array.isArray(sl.bullets)) {
        sl.bullets = sl.bullets.map(b =>
          (typeof b === 'string') ? [{ text: b, bold: false }] : b
        );
      }
    }

    // Migrate pre-v3.24.0 bold:true spans to alt:true.
    // Before v3.24.0, bold meant the scheme emphasis font (Montserrat-Black).
    // Now bold = plain \b; alt = emphasis font. Any span with bold but no alt key is old-style.
    function migrateBoldToAlt(spans) {
      if (!Array.isArray(spans)) return spans;
      return spans.map(s => (s.bold && s.alt === undefined) ? { ...s, bold: false, alt: true } : s);
    }
    for (const sl of (state.slides || [])) {
      if (sl.bodies) sl.bodies = sl.bodies.map(b => migrateBoldToAlt(b));
      if (sl.body)   sl.body   = migrateBoldToAlt(sl.body);
      if (sl.spans)  sl.spans  = migrateBoldToAlt(sl.spans);
      if (sl.blankSpans) sl.blankSpans = migrateBoldToAlt(sl.blankSpans);
      if (sl.type === 'point' && sl.mode === 'revealing' && Array.isArray(sl.bullets)) {
        sl.bullets = sl.bullets.map(b => Array.isArray(b) ? migrateBoldToAlt(b) : b);
      }
    }

    if (!state.slides.find(s => s.type === 'start'))
      state.slides.unshift({ id: 'start', type: 'start', label: 'Start of Notes', fixed: true });
    if (!state.slides.find(s => s.type === 'end'))
      state.slides.push({ id: 'end', type: 'end', label: 'End of Notes', fixed: true });
    // Migrate the old default start label "START" → "Start of Notes" (match End of Notes)
    const startSlide = state.slides.find(s => s.type === 'start');
    if (startSlide && (startSlide.label === 'START' || !startSlide.label)) {
      startSlide.label = 'Start of Notes';
      if (startSlide.text === 'START') startSlide.text = 'Start of Notes';
    }
    return true;
  } catch (e) {
    setTimeout(() => toast('error', 'Could not restore your last state',
      'The saved app data was unreadable, so DeckPro started fresh.'), 400);
    return false;
  }
}

async function loadState() {
  try {
    const res = await fetch('/api/state');
    const data = await res.json();
    if (data.ok && data.state && applySavedState(data.state)) return;
  } catch (_) {
    // Running from a plain static preview or an older build — fall back below.
  }

  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    if (applySavedState(JSON.parse(raw))) scheduleStateFileSave();
  } catch (e) {
    // Don't silently discard a deck we couldn't parse — preserve a backup and tell the user.
    if (raw) {
      try { localStorage.setItem(STORAGE_KEY + '_corrupt_backup', raw); } catch (_) {}
      setTimeout(() => toast('error', 'Could not restore your last deck',
        'The saved data was unreadable, so a fresh deck was started. A backup copy was kept in case it can be recovered.'), 400);
    }
  }
}

function syncHeaderInputs() {
  const s   = state.config.seriesName?.trim()  || '';
  const t   = state.config.messageTitle?.trim() || '';
  const raw = state.config.weekDate || '';
  const d   = raw ? new Date(raw + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const isDraft = !state.currentDeckId;

  const meta  = document.getElementById('deck-header-meta');
  const elSeries = document.getElementById('dhm-series');
  const elTitle  = document.getElementById('dhm-title');
  const elDate   = document.getElementById('dhm-date');
  const sep1     = document.getElementById('dhm-sep1');
  const sep2     = document.getElementById('dhm-sep2');

  if (meta) meta.classList.toggle('dhm--draft', isDraft && !s && !t);

  if (elSeries) elSeries.textContent = isDraft && !s && !t ? 'Draft' : s;
  if (elTitle)  elTitle.textContent  = isDraft && !s && !t ? '' : t;
  if (elDate)   elDate.textContent   = isDraft && !s && !t ? '' : d;
  if (sep1) sep1.style.display = (s && t) ? '' : 'none';
  if (sep2) sep2.style.display = ((t && d) || (s && d && !t)) && !isDraft ? '' : 'none';

  const dl = document.getElementById('series-datalist');
  if (dl) {
    const recent = state.config.recentSeries || [];
    dl.innerHTML = recent.map(r => `<option value="${esc(r)}">`).join('');
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
}
function syncUidCounter() { /* no-op — UUIDs never collide */ }

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Confirm modal helper ─────────────────────────────────────

function showConfirmModal(title, body, confirmLabel, onConfirm) {
  document.getElementById('g-confirm-overlay')?.remove();
  const ov = document.createElement('div');
  ov.id = 'g-confirm-overlay';
  ov.className = 'g-confirm-overlay';
  ov.innerHTML = '<div class="g-confirm-modal">' +
    '<p class="g-confirm-title">' + esc(title) + '</p>' +
    '<p class="g-confirm-body">' + esc(body) + '</p>' +
    '<div class="g-confirm-btns">' +
    '<button class="btn g-confirm-cancel">Cancel</button>' +
    '<button class="btn g-confirm-ok">' + esc(confirmLabel) + '</button>' +
    '</div></div>';
  document.body.appendChild(ov);
  ov.querySelector('.g-confirm-cancel').addEventListener('click', () => ov.remove());
  ov.querySelector('.g-confirm-ok').addEventListener('click', () => { ov.remove(); onConfirm(); });
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}

// ─── Tooltip system ───────────────────────────────────────────

let _tipTarget = null;
let _tipTimeout = null;

// ─── Diagnostics ──────────────────────────────────────────────────────────────

// Rolling log of recent app activity (toasts + JS errors) — a "temp log" a
// user can hand over verbatim (via Export Diagnostic Bundle) to show exactly
// what led up to a problem, not just the app's general state at the time.
const _eventLog = [];
function logEvent(kind, msg, extra) {
  _eventLog.push({ at: new Date().toISOString(), kind, msg: String(msg || '').slice(0, 500), extra: extra ? String(extra).slice(0, 500) : undefined });
  if (_eventLog.length > 50) _eventLog.shift();
}
function initDiagnostics() {
  window.addEventListener('error', e => logEvent('error', e.message, e.filename ? `${e.filename}:${e.lineno}` : ''));
  window.addEventListener('unhandledrejection', e => logEvent('promise', e.reason && e.reason.message ? e.reason.message : e.reason));
  const origErr = console.error.bind(console);
  console.error = (...args) => { try { logEvent('console', args.map(a => (a && a.message) || a).join(' ')); } catch (_) {} origErr(...args); };
}

async function buildDiagnosticBundle() {
  const cfg = state.config || {};
  // Settings minus secrets.
  const { bibleApiKey, pro7Password, ...safeConfig } = cfg;
  const slides = state.slides || [];
  const typeCounts = slides.reduce((m, s) => { m[s.type] = (m[s.type] || 0) + 1; return m; }, {});
  const schemes = state.styleSchemes || [];
  const bundle = {
    app: 'DeckPro',
    version: APP_VERSION,
    generatedAt: new Date().toISOString(),
    platform: { userAgent: navigator.userAgent, platform: navigator.platform, language: navigator.language },
    secretsPresent: { bibleApiKey: !!bibleApiKey, pro7Password: !!pro7Password },
    config: safeConfig,
    deck: {
      slideCount: slides.length,
      typeCounts,
      activeId: state.activeId,
      showBlanks: state.showBlanks,
    },
    schemes: { count: schemes.length, activeSchemeId: state.activeSchemeId, names: schemes.map(s => s.name) },
    macros: (activeStyleScheme().macros || []).map(m => ({ name: m.name, hasUuid: !!m.uuid, triggers: m.triggers || [] })),
    pro7: { connected: !!(typeof pro7rt !== 'undefined' && pro7rt.connected), liveMacroCount: (typeof pro7rt !== 'undefined' && pro7rt.liveMacros ? pro7rt.liveMacros.length : 0), schemeMacros: (activeStyleScheme()?.macros || []).length },
    library: (typeof _libStatus !== 'undefined' && _libStatus) ? { libraryDir: _libStatus.libraryDir, deckCount: _libStatus.deckCount } : null,
    exportHistory: (typeof loadGenHistory === 'function' ? loadGenHistory() : []).slice(0, 10).map(h => ({ name: h.fileName || h.name, at: h.at || h.date, ok: h.ok !== false })),
    eventLog: _eventLog,
  };
  try {
    const res = await fetch('/api/setup/doctor');
    const data = await res.json();
    if (data.ok) bundle.machineSetup = data;
  } catch (_) {}
  return bundle;
}

async function exportDiagnosticBundle() {
  let json;
  try { json = JSON.stringify(await buildDiagnosticBundle(), null, 2); }
  catch (e) { toast('error', 'Could not build diagnostics', e.message); return; }
  try {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const a = Object.assign(document.createElement('a'), { href: url, download: `deckpro-diagnostic-${ts}.json` });
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
    toast('success', 'Diagnostic bundle saved', 'Secrets (API key, password) are excluded.');
  } catch (e) {
    toast('error', 'Could not save diagnostics', e.message);
  }
}

function initTooltip() {
  const tip = document.createElement('div');
  tip.id = 'g-tip';
  tip.className = 'g-tip';
  document.body.appendChild(tip);

  document.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-tip],[data-tip-key]');
    if (!el || el === _tipTarget) return;
    _tipTarget = el;
    clearTimeout(_tipTimeout);
    _tipTimeout = setTimeout(() => {
      const key  = el.getAttribute('data-tip-key');
      let text = key ? (TOOLTIPS[key] || key) : el.getAttribute('data-tip');
      if (!text) return;
      text = text.replace(/\\n/g, '\n'); // accept a literal "\n" in the attribute as a line break
      // Optional title: text before the first newline (or an explicit data-tip-title)
      const title = el.getAttribute('data-tip-title')
        || (text.includes('\n') ? text.slice(0, text.indexOf('\n')) : '');
      const body  = title && !el.getAttribute('data-tip-title')
        ? text.slice(text.indexOf('\n') + 1)
        : text;
      tip.innerHTML = (title ? `<span class="g-tip-title">${esc(title)}</span>` : '') + esc(body);
      tip.classList.add('visible');
      const r = el.getBoundingClientRect();
      const tw = tip.offsetWidth;
      let left = r.left + r.width / 2 - tw / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
      tip.style.left = left + 'px';
      tip.style.top  = (r.top - tip.offsetHeight - 8) + 'px';
    }, 700);
  });

  document.addEventListener('mouseout', e => {
    const el = e.target.closest('[data-tip],[data-tip-key]');
    if (!el) return;
    _tipTarget = null;
    clearTimeout(_tipTimeout);
    tip.classList.remove('visible');
  });
}

// ─── Rich-text helpers ────────────────────────────────────────────────────────

function extractSpans(el) {
  const spans = [];
  function walk(node, fmt) {
    if (node.nodeType === 3) {
      if (node.textContent) spans.push({ text: node.textContent, ...fmt });
    } else if (node.nodeType === 1) {
      if (node.tagName === 'BR') { spans.push({ text: '\n', ...fmt }); return; }
      if (node.tagName === 'SUP' || (node.classList && node.classList.contains('vnum'))) {
        const t = node.textContent;
        if (t) spans.push({ text: t, verseNum: true, super: node.tagName === 'SUP', alt: false, bold: false, italic: false, underline: false });
        return;
      }
      if (node.tagName === 'SPAN' && node.classList.contains('digit-warn')) {
        for (const child of node.childNodes) walk(child, fmt);
        return;
      }
      const alt       = fmt.alt       || (node.tagName === 'SPAN' && node.classList.contains('alt-fmt'));
      const bold      = !alt && (fmt.bold      || node.tagName === 'B' || node.tagName === 'STRONG'
                        || node.style.fontWeight === 'bold' || node.style.fontWeight === '700');
      const italic    = fmt.italic    || node.tagName === 'I' || node.tagName === 'EM'
                        || node.style.fontStyle === 'italic';
      const underline = fmt.underline || node.tagName === 'U'
                        || node.style.textDecoration === 'underline'
                        || node.style.textDecorationLine === 'underline';
      for (const child of node.childNodes) walk(child, { alt, bold, italic, underline });
    }
  }
  walk(el, { alt: false, bold: false, italic: false, underline: false });
  return spans.reduce((acc, s) => {
    const last = acc[acc.length - 1];
    if (last && !last.verseNum && !s.verseNum && last.alt === s.alt && last.bold === s.bold && last.italic === s.italic && last.underline === s.underline)
      last.text += s.text;
    else
      acc.push({ text: s.text, alt: !!s.alt, bold: !!s.bold, italic: !!s.italic, underline: !!s.underline, ...(s.verseNum ? { verseNum: true, super: !!s.super } : {}) });
    return acc;
  }, []);
}

// Extract plain text from a bullet (string or spans array)
function bulletToText(bullet) {
  if (typeof bullet === 'string') return bullet;
  return (bullet || []).map(s => s.text || '').join('');
}

function spansToHtml(spans) {
  return (spans || []).map(s => {
    if (s.verseNum) {
      const inner = esc(s.text);
      return s.super ? `<sup class="vnum">${inner}</sup>` : `<span class="vnum">${inner}</span>`;
    }
    let html = esc(s.text);
    if (s.underline) html = `<u>${html}</u>`;
    if (s.italic)    html = `<em>${html}</em>`;
    if (s.bold)      html = `<strong>${html}</strong>`;
    return html;
  }).join('');
}

const DIGIT_PREFIX_RE = /^(\d+)(?:\s|["'\u201c\u201d\u2018\u2019])/;

// Like spansToHtml but converts \n spans → <br> for the preview canvas
function spansToHtmlPreview(spans) {
  return (spans || []).map((s, i) => {
    if (s.text === '\n') return '<br>';
    if (s.verseNum) {
      const inner = esc(s.text);
      return s.super ? `<sup class="vnum">${inner}</sup>` : `<span class="vnum">${inner}</span>`;
    }
    let html = esc(s.text).replace(/\n/g, '<br>');
    if (i === 0) {
      const dm = s.text.match(DIGIT_PREFIX_RE);
      if (dm) {
        const rest = esc(s.text.slice(dm[1].length)).replace(/\n/g, '<br>');
        html = `<span class="digit-warn">${esc(dm[1])}</span>${rest}`;
      }
    }
    if (s.underline) html = `<u>${html}</u>`;
    if (s.italic)    html = `<em>${html}</em>`;
    if (s.bold)      html = `<strong>${html}</strong>`;
    if (s.alt)       html = `<span class="alt-fmt">${html}</span>`;
    return html;
  }).join('');
}

function activeStyleScheme() {
  return (state.styleSchemes || []).find(s => s.id === state.activeSchemeId) || (state.styleSchemes || [])[0] || {};
}

// ─── Fit Width: weighted line-break scoring ──────────────────────────────────
//
// Instead of one rigid rule ("keep the same line count as full width"), Fit
// Width now proposes many candidate box widths, reads the line breakdown each
// one induces, and scores it against a set of tunable penalties. The lowest
// cost wins. Tune the feel by editing FIT_WEIGHTS — nothing else changes.
//
// Cost model (all soft terms are >= 0, so more lines always costs more baseline
// and the punctuation terms only decide *where* a needed break lands, never add
// lines): each line adds `perLine`; an internal break adds 0..breakMidClause
// depending on the punctuation it follows; a lone short word on the last line
// adds `orphan`; splitting an emphasis (bold) phrase across lines adds
// `highlightSplit`. The last-line term depends on type: points add a raggedness
// cost for uneven line widths across the whole block; scripture/body instead adds
// `shortLast` only when the last line is under `shortLastRatio` of the average of
// the lines above it. Hard constraints (line wider than the box, or more than
// maxLines) disqualify a candidate.
const FIT_WEIGHTS = {
  perLine:        16,   // baseline cost per line → prefer fewer lines
  orphan:         60,   // last line is a single short word (widow)
  orphanMaxChars:  7,   // "short" = this many letters or fewer
  shortLast:      50,   // last line's width is < shortLastRatio of the lines above it (scripture/body only)
  shortLastRatio: 1/3,
  breakSentence:   0,   // breaking after . ! ? … is the ideal break point
  breakClause:     1,   // after : ;
  breakSoft:       3,   // after ,
  breakMidClause: 10,   // breaking with NO punctuation is the worst place
  lineEndRunt:    12,   // a line ending on a runt (conjunction/article/prep)
  highlightSplit: 40,   // an emphasis phrase straddling two lines
  raggedPerPx:  0.04,   // penalty per px of line-width std-deviation (points only)
  maxLines:        6,   // hard cap on line count
  pad:            24,   // breathing room added to the winning width
};

// Short function words that read badly at the end of a line ("...your heart and",
// "...all things through"). Ending a line on one of these — with no punctuation
// to justify it — earns the lineEndRunt penalty so the scorer prefers ending
// lines on content words instead.
const FIT_RUNT_WORDS = new Set([
  'a','an','the','and','or','but','nor','for','yet','so','of','to','in','on','at',
  'by','as','with','from','into','onto','over','under','through','upon','that','than',
  'this','these','those','my','your','his','her','its','our','their','not','is','are',
  'was','were','be','if','it','he','she','we','they','you','i',
]);

// Flatten spans into words, tagging each with style, the punctuation that ends
// it (rates break quality), and whether it's a runt (rates line-end quality).
// Assumes no explicit newlines.
function _fitWordList(spans) {
  const words = [];
  for (const s of (spans || [])) {
    if (!s || !s.text) continue;
    for (const tok of String(s.text).split(/\s+/)) {
      if (!tok) continue;
      const m = tok.match(/[.!?…:;,]+$/);
      const end = m ? m[0] : '';
      const rank = /[.!?…]$/.test(end) ? 3 : /[:;]$/.test(end) ? 2 : /,$/.test(end) ? 1 : 0;
      const bare = tok.replace(/[^A-Za-z']/g, '').toLowerCase();
      // A runt only if it carries no trailing punctuation of its own — a comma or
      // period after the word already makes it a legitimate place to break.
      const runt = rank === 0 && (bare.length <= 2 || FIT_RUNT_WORDS.has(bare));
      words.push({ text: tok, bold: !!s.bold, italic: !!s.italic, underline: !!s.underline, punctRank: rank, runt });
    }
  }
  return words;
}

// Render the word list at a given box width and read back the actual line
// breakdown (which words landed on which line, and each line's pixel width).
function _fitLinesAtWidth(inner, words, w) {
  inner.style.whiteSpace = 'normal';
  inner.style.display    = 'block';
  inner.style.width      = `${w}px`;
  inner.innerHTML = words.map((wd, i) => {
    let h = esc(wd.text);
    if (wd.underline) h = `<u>${h}</u>`;
    if (wd.italic)    h = `<em>${h}</em>`;
    if (wd.bold)      h = `<strong>${h}</strong>`;
    return `<span class="_fw" data-i="${i}">${h}</span>`;
  }).join(' ');

  const els   = inner.querySelectorAll('span._fw');
  const lines = [];
  let cur = null, lastTop = null;
  els.forEach((el, i) => {
    const top = el.offsetTop;
    if (lastTop === null || Math.abs(top - lastTop) > 1) {
      cur = { words: [], left: Infinity, right: 0 };
      lines.push(cur);
      lastTop = top;
    }
    cur.words.push(words[i]);
    cur.left  = Math.min(cur.left,  el.offsetLeft);
    cur.right = Math.max(cur.right, el.offsetLeft + el.offsetWidth);
  });
  for (const ln of lines) ln.width = Math.max(0, ln.right - ln.left);
  return lines;
}

// Score a line breakdown. Lower is better; returns Infinity if disqualified.
// `type` controls which last-line term applies: points want every line (including
// the last) close to the same length, so they get the raggedness term; scripture/body
// just needs the last line to not be conspicuously shorter than the ones above it.
function _fitScore(lines, words, boxW, type) {
  const W = FIT_WEIGHTS;
  const n = lines.length;
  if (!n) return Infinity;
  if (n > W.maxLines) return Infinity;
  // Hard constraint: a single word wider than the box (guaranteed overflow).
  for (const ln of lines) if (ln.width > boxW + 1) return Infinity;

  let cost = n * W.perLine;

  // Where each internal break lands (rate by the punctuation it follows, plus a
  // penalty if the line ends on a runt word like "and" / "the" / "through").
  for (let i = 0; i < n - 1; i++) {
    const lw = lines[i].words[lines[i].words.length - 1];
    cost += lw.punctRank === 3 ? W.breakSentence
          : lw.punctRank === 2 ? W.breakClause
          : lw.punctRank === 1 ? W.breakSoft
          :                       W.breakMidClause;
    if (lw.runt) cost += W.lineEndRunt;
  }

  // Orphan / widow: a lone short word stranded on the final line.
  if (n > 1) {
    const last = lines[n - 1];
    if (last.words.length === 1) {
      const letters = last.words[0].text.replace(/[^A-Za-z0-9]/g, '').length;
      if (letters <= W.orphanMaxChars) cost += W.orphan;
    }
  }

  // Splitting an emphasis phrase across lines — only meaningful when the block
  // is NOT entirely bold (a fully-bold point has no "highlight" to protect).
  if (!words.every(w => w.bold)) {
    const lineOf = new Map();
    lines.forEach((ln, li) => ln.words.forEach(w => lineOf.set(w, li)));
    let i = 0;
    while (i < words.length) {
      if (words[i].bold) {
        let j = i; while (j < words.length && words[j].bold) j++;
        const a = lineOf.get(words[i]), b = lineOf.get(words[j - 1]);
        if (a !== undefined && b !== undefined && b > a) cost += W.highlightSplit * (b - a);
        i = j;
      } else i++;
    }
  }

  if (n > 1) {
    if (type === 'point') {
      // Points: reward evenly-filled lines across the whole block.
      const ws   = lines.map(l => l.width);
      const mean = ws.reduce((a, b) => a + b, 0) / n;
      const varc = ws.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n;
      cost += Math.sqrt(varc) * W.raggedPerPx;
    } else {
      // Scripture/body: only the last line matters — penalize it landing
      // conspicuously shorter than the average of the lines above it.
      const above = lines.slice(0, n - 1);
      const avgAbove = above.reduce((a, l) => a + l.width, 0) / above.length;
      const last = lines[n - 1];
      if (avgAbove > 0 && last.width < avgAbove * W.shortLastRatio) cost += W.shortLast;
    }
  }

  return cost;
}

// Measure one line's pixel width at no-wrap.
function _fitLineWidth(inner, lineWords) {
  inner.style.whiteSpace = 'nowrap';
  inner.style.display    = 'inline-block';
  inner.style.width      = 'auto';
  inner.innerHTML = lineWords.map(wd => {
    let h = esc(wd.text);
    if (wd.underline) h = `<u>${h}</u>`;
    if (wd.italic)    h = `<em>${h}</em>`;
    if (wd.bold)      h = `<strong>${h}</strong>`;
    return h;
  }).join(' ');
  return inner.scrollWidth;
}

// Enumerate line partitions that break ONLY after punctuation words (comma,
// clause, or sentence end). These reach layouts that box-width alone can't —
// e.g. a point split cleanly after every comma — and are the candidates that,
// when they win, get emitted as hard line breaks. Points only.
function _fitPunctPartitions(words) {
  const breaks = [];
  for (let i = 0; i < words.length - 1; i++) if (words[i].punctRank >= 1) breaks.push(i);
  if (!breaks.length || breaks.length > 6) return [];   // cap: 2^6 subsets
  const partitions = [];
  const total = 1 << breaks.length;
  for (let mask = 1; mask < total; mask++) {
    const cuts = [];
    for (let b = 0; b < breaks.length; b++) if (mask & (1 << b)) cuts.push(breaks[b]);
    if (cuts.length + 1 > FIT_WEIGHTS.maxLines) continue;
    const lines = [];
    let start = 0;
    for (const c of cuts) { lines.push(words.slice(start, c + 1)); start = c + 1; }
    lines.push(words.slice(start));
    partitions.push(lines);
  }
  return partitions;
}

/**
 * Measure text spans in a hidden div and find the optimal body width.
 * Poetry mode (has \n): tightest width that fits each explicit line no-wrap.
 * Balance mode (no \n): sweep candidate widths, score the induced line break,
 *   pick the lowest-cost layout (see FIT_WEIGHTS).
 * `type` selects the render size/weight ('point' → pointSize + bold).
 * `display` selects which screen's metrics to measure at: 'main' (Display 1)
 *   or 'prop' (Display 2 / LED wall) — these have independent canvas size,
 *   font size, and body-width ceiling, so a box fit for one is not fit for
 *   the other and each needs its own search.
 * For points, the search also proposes explicit punctuation-break layouts;
 *   when one wins and box-width can't reproduce it, `brokenText` carries the
 *   text with hard line breaks (\n) for the caller to export.
 * `lines` is the real measured line count the winning width actually wraps
 *   into — used for Auto Title Y instead of a separate, disagreement-prone
 *   estimate.
 * Returns { bodyW, bodyX, brokenText, lines } in Pro7 canvas coordinates.
 */
function computeOptimalBodyWidth(spans, rs, type = 'body', display = 'main') {
  // Resolve the scheme so inherited body width / sizes are real numbers, not
  // nulls — otherwise the cap silently falls back to the full canvas and the
  // measurement font size is wrong (the two long-standing Fit Width bugs).
  const st = styleForExport(rs || activeStyleScheme()) || {};
  const isProp  = display === 'prop';
  const canvasW = isProp ? (st.propCanvasW ?? 3200) : (st.canvasW ?? 1920);
  const size    = isProp
    ? (type === 'point' ? (st.propPointSize ?? st.propBodySize ?? 80) : (st.propBodySize ?? 80))
    : (type === 'point' ? (st.pointSize ?? st.bodySize ?? 44) : (st.bodySize ?? 44));
  // Width ceiling: stay within the palette's own configured box for the
  // element being measured — body width for scripture, point width for
  // points — never wider than that regardless of how short the text is.
  const cap     = (isProp
    ? (type === 'point' ? st.propPointW : st.propBodyW)
    : (type === 'point' ? st.pointW     : st.bodyW)) || canvasW;
  const maxW    = Math.max(1, Math.min(cap, canvasW));
  const padding = 80; // breathing room for the poetry branch

  const hasExplicit = (spans || []).some(s => s.text?.includes('\n'));
  // `lines` is the REAL measured line count at the winning width — Auto Title Y
  // uses this instead of independently re-guessing it from a char-width
  // heuristic, which routinely disagreed with what Fit Width actually rendered.
  const centered = (w, brokenText = null, lines = null) => ({ bodyW: w, bodyX: Math.round((canvasW - w) / 2), brokenText, lines });

  // Hidden measurement container — 1:1 canvas coordinate space.
  const msr   = document.createElement('div');
  const style = document.createElement('style');
  style.textContent = '._msr strong{font-family:Montserrat,"Montserrat-Black",sans-serif;font-weight:900}._msr em{font-style:italic}._msr ._fw{display:inline}';
  const inner = document.createElement('div');
  inner.className = '_msr';
  msr.appendChild(style);
  msr.appendChild(inner);
  Object.assign(msr.style, {
    position: 'fixed', top: '-9999px', left: '-9999px',
    visibility: 'hidden', pointerEvents: 'none',
    fontSize: `${size}px`,
    fontFamily: 'Montserrat,"Montserrat-Medium",sans-serif',
    fontWeight: type === 'point' ? '900' : '500',
    lineHeight: '1.3',
  });
  document.body.appendChild(msr);

  try {
    if (hasExplicit) {
      // Poetry: measure each explicit line at no-wrap, take the widest.
      inner.style.whiteSpace = 'nowrap';
      inner.style.display    = 'inline-block';

      const lines = [[]];
      for (const span of spans) {
        const parts = span.text.split('\n');
        parts.forEach((part, i) => {
          if (i > 0) lines.push([]);
          if (part) lines[lines.length - 1].push({ ...span, text: part });
        });
      }

      let widest = 0, lineCount = 0;
      for (const line of lines) {
        if (!line.length) continue;
        lineCount++;
        inner.innerHTML = spansToHtml(line);
        widest = Math.max(widest, inner.scrollWidth);
      }
      return centered(Math.min(Math.ceil(widest) + padding, maxW), null, Math.max(1, lineCount));
    }

    // ── Balance mode: weighted candidate search ──
    const words = _fitWordList(spans);
    if (!words.length) return centered(maxW);

    // Floor: never narrower than the widest single word (would force overflow).
    let widestWord = 0;
    inner.style.whiteSpace = 'nowrap';
    inner.style.display    = 'inline-block';
    for (const wd of words) {
      inner.innerHTML = wd.bold ? `<strong>${esc(wd.text)}</strong>` : esc(wd.text);
      widestWord = Math.max(widestWord, inner.scrollWidth);
    }
    const floorW = Math.min(Math.ceil(widestWord) + 4, maxW);

    // Sweep widths from floor → maxW; keep the narrowest width that yields each
    // distinct line layout, score it, and track the best. A fine step matters:
    // some strictly-better layouts live in a narrow width window (e.g. shifting
    // a runt "and" down a line), so a coarse sweep would skip right over them.
    const STEP = 12;
    const seen = new Set();
    let best = null;   // { cost, width, broken:string[]|null }
    const consider = (lines, boxW, broken) => {
      const cost = _fitScore(lines, words, boxW, type);
      if (cost === Infinity) return;
      const tight = Math.min(Math.max(...lines.map(l => l.width)) + FIT_WEIGHTS.pad, boxW, maxW);
      if (!best || cost < best.cost - 0.01) best = { cost, width: Math.ceil(tight), broken, lineCount: lines.length };
    };
    for (let w = floorW; w <= maxW; w += STEP) {
      const lines = _fitLinesAtWidth(inner, words, w);
      const sig = lines.map(l => l.words.length).join(',');
      if (seen.has(sig)) continue;
      seen.add(sig);
      consider(lines, w, null);
    }
    // Always consider the full-width layout too (covers the single-line case).
    consider(_fitLinesAtWidth(inner, words, maxW), maxW, null);

    // Points also get explicit punctuation-break candidates — layouts that break
    // only after . ! ? … : ; , and can beat anything box-width alone produces.
    if (type === 'point') {
      for (const part of _fitPunctPartitions(words)) {
        const lines = part.map(lw => ({ words: lw, width: _fitLineWidth(inner, lw) }));
        consider(lines, maxW, lines.map(l => l.words.map(w => w.text).join(' ')));
      }
    }

    if (!best) return centered(maxW);
    const width = Math.min(best.width, maxW);
    // Emit hard breaks only when the winning layout can't be reproduced by the
    // natural wrap at this width — otherwise box-width alone already gives it.
    let brokenText = null;
    if (best.broken) {
      const nat = _fitLinesAtWidth(inner, words, width)
        .map(l => l.words.map(w => w.text).join(' ')).join('\n');
      const brk = best.broken.join('\n');
      if (nat !== brk) brokenText = brk;
    }
    return centered(width, brokenText, best.lineCount);
  } finally {
    document.body.removeChild(msr);
  }
}

// Strip removes line breaks so the main-screen body flows as one block. Line
// breaks aren't always their own span: extractSpans() merges a <br>'s span into
// the surrounding text whenever the formatting matches on both sides — the
// common case for plain, unformatted scripture — so the break ends up embedded
// inside a longer span's text ("line one\nline two") rather than sitting alone
// as its own {text:'\n'} entry. An exact `s.text !== '\n'` filter only ever
// catches the standalone case, so it silently did nothing for plain text.
// Mirrors builder.js's stripNewlineSpans — keep both in sync.
function stripNewlineSpans(spans) {
  const replaced = (spans || []).map(s => ({ ...s, text: (s.text || '').replace(/\n+/g, ' ') }));
  if (replaced.length) {
    replaced[0] = { ...replaced[0], text: replaced[0].text.replace(/^ +/, '') };
    replaced[replaced.length - 1] = { ...replaced[replaced.length - 1], text: replaced[replaced.length - 1].text.replace(/ +$/, '') };
  }
  return replaced.filter(s => s.text !== '');
}

// Compute Fit Width for one slide's current text. Single source of truth for
// both the per-slide toggle (attachFormHandlers) and the pre-export batch
// recompute — keeps the two from drifting apart.
//
// Scripture: measures the stripped (newline-free) text when Strip is also on,
// since Strip flattens display 1 into one flowing paragraph — the box should
// fit that paragraph, not the original poetry line lengths. Display 2 (LED
// wall) always keeps the original line breaks regardless of Strip — Strip is
// display-1-only — so its box is measured against the unstripped text.
//
// Display 1 and Display 2 have independent canvas size, font size, and body
// width, so a box fit for one is not fit for the other — each gets its own
// computeOptimalBodyWidth() search (see the `display` param there).
//
// Display 2 is gated behind its OWN flag (slide.propFitWidth) — defaults to
// true on new slides (same as slide.fitWidth), but is a genuinely independent
// flag, not hard-coupled to Display 1's. Coupling them directly (Display 1 on
// ⇒ Display 2 also resized, with no separate flag at all) was tried and
// reverted: Display 2 often carries a deliberately custom box (position/size
// hand-tuned to a specific screen/NDI feed), and silently shrinking +
// recentering it the moment Display 1's Fit Width was turned on broke that
// tuning with no way to opt out. Turn this off per-slide wherever Display 2
// has a hand-tuned box that should be left alone.
//
// Revealing points: every cue in the sequence shares one box per display
// (spec.bodyW/bodyX and spec.propBodyW/propBodyX in builder.js/buildProp.js),
// so each display is sized off its OWN widest individual bullet rather than
// just the first — otherwise a later, longer bullet could overflow a box
// sized for a short one. That keeps each box static across the whole reveal
// sequence.
//
// Returns { bodyW, bodyX, brokenText, bodyLines, propBodyW, propBodyX,
// propBrokenText, propBodyLines } (prop fields null if not applicable) or
// null if there's no text to measure. bodyLines/propBodyLines are the real
// measured line counts, fed to Auto Title Y (see estimateTitleY/
// estimatePropTitleY) instead of that heuristic re-deriving them and
// disagreeing with what Fit Width actually rendered.
function computeSlideFitWidth(slide, scheme) {
  const wantsProp = !!slide.propFitWidth;
  if (slide.type === 'scripture') {
    const rawSpans = (slide.bodies || [[]])[0] || [];
    if (!rawSpans.length || rawSpans.every(s => !s.text)) return null;
    const mainSpans = slide.stripNewlines ? stripNewlineSpans(rawSpans) : rawSpans;
    const main = computeOptimalBodyWidth(mainSpans, scheme, 'scripture', 'main');
    if (!wantsProp) return { ...main, bodyLines: main.lines, propBodyW: null, propBodyX: null, propBodyLines: null };
    const prop = computeOptimalBodyWidth(rawSpans, scheme, 'scripture', 'prop');
    return { ...main, bodyLines: main.lines, propBodyW: prop.bodyW, propBodyX: prop.bodyX, propBodyLines: prop.lines };
  }
  if (slide.type === 'point') {
    if (slide.mode === 'revealing') {
      let best = null, bestProp = null;
      for (const bullet of (slide.bullets || [])) {
        const spans = Array.isArray(bullet) ? bullet : [{ text: bullet || '', bold: true }];
        if (!spans.length || spans.every(s => !s.text)) continue;
        const r = computeOptimalBodyWidth(spans, scheme, 'point', 'main');
        if (!best || r.bodyW > best.bodyW) best = r;
        if (wantsProp) {
          const rp = computeOptimalBodyWidth(spans, scheme, 'point', 'prop');
          if (!bestProp || rp.bodyW > bestProp.bodyW) bestProp = rp;
        }
      }
      if (!best) return null;
      return { ...best, propBodyW: bestProp ? bestProp.bodyW : null, propBodyX: bestProp ? bestProp.bodyX : null };
    }
    const text = slide.bodyText || '';
    if (!text) return null;
    const spans = [{ text, bold: true }];
    const main = computeOptimalBodyWidth(spans, scheme, 'point', 'main');
    if (!wantsProp) return { ...main, propBodyW: null, propBodyX: null, propBrokenText: null };
    const prop = computeOptimalBodyWidth(spans, scheme, 'point', 'prop');
    return { ...main, propBodyW: prop.bodyW, propBodyX: prop.bodyX, propBrokenText: prop.brokenText || null };
  }
  return null;
}

// ─── Macro color helpers ───────────────────────────────────────────────────────

function pro7ColorToCss(c) {
  if (!c) return null;
  return `rgba(${Math.round((c.red||0)*255)},${Math.round((c.green||0)*255)},${Math.round((c.blue||0)*255)},${c.alpha??1})`;
}

function macroDisplayColor(m) {
  if (m.color) return m.color;
  if (pro7rt.liveMacros?.length) {
    const live = pro7rt.liveMacros.find(l => (l.id?.uuid ?? l.id ?? '') === m.uuid);
    const css = pro7ColorToCss(live?.color);
    if (css) return css;
  }
  // Stable hash color from UUID so each macro is visually distinct even offline
  let h = 0;
  const s = m.uuid || m.id || '';
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `hsl(${(h >>> 0) % 360},65%,55%)`;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

let rcGroupExpanded = false;
const expandedRevealGroups = new Set(); // revealing-point slide ids currently unfurled

const ICON = {
  start:     { cls: 'si-start',     text: 'S'  },
  end:       { cls: 'si-end',       text: 'E'  },
  blank:     { cls: 'si-blank',     text: 'B'  },
  scripture: { cls: 'si-scripture', text: 'S' },
  point:     { cls: 'si-point',     text: 'P' },
  image:     { cls: 'si-image',     text: 'I' },
  custom:    { cls: 'si-custom',    text: 'C' },
};

// Stage display entries matching any of the given trigger keys (type + pos) — mirrors getSlideMacroBadges.
function getSlideStageDisplays(...triggerKeys) {
  const displays = activeStyleScheme().stageDisplays || [];
  return displays.filter(d =>
    (d.name || d.uuid) && triggerKeys.some(k => (d.triggers || []).includes(k))
  );
}

// Sidebar: monitor-on-stand dot badges for stage displays firing on these triggers.
// Small QR-square badge for a blank that will fire the QR macro on export —
// same visual family as the macro/stage badges, shown next to them.
function qrBadgeHTML(qrOn) {
  if (!qrOn) return '';
  const QR_ICON = `<svg class="si-qr-icon" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1"/><rect x="6" y="1" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1"/><rect x="1" y="6" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1"/><rect x="6.5" y="6.5" width="2" height="2" rx="0.3" fill="currentColor"/></svg>`;
  return `<span class="si-badge si-badge-qr" title="QR code fires on this blank">${QR_ICON}</span>`;
}

function stageDisplayBadgesHTML(...triggerKeys) {
  const STAGE_ICON = `<svg class="sd-brush-icon" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="1.3" width="6" height="4.2" rx="0.6" stroke="currentColor" stroke-width="1.1"/><path d="M5 5.5v1.6M3.3 7.9h3.4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>`;
  return getSlideStageDisplays(...triggerKeys)
    .map(d => `<span class="si-badge si-badge-stage" title="Stage: ${esc(d.name || d.uuid)}">${STAGE_ICON}</span>`)
    .join('');
}

// Main panel: monitor-on-stand + name chips for stage displays firing on these triggers.
function stageDisplayChipsHTML(...triggerKeys) {
  const STAGE_ICON = `<svg class="slide-chip-icon" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="1.3" width="6" height="4.2" rx="0.6" stroke="currentColor" stroke-width="1.1"/><path d="M5 5.5v1.6M3.3 7.9h3.4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>`;
  return getSlideStageDisplays(...triggerKeys)
    .map(d => `<span class="slide-macro-chip slide-stage-chip" title="Stage: ${esc(d.name || d.uuid)}">${STAGE_ICON}${esc(d.name || d.uuid)}</span>`)
    .join('');
}

// Returns `pos:N` key for a slide (1-indexed position in state.slides).
function slidePosKey(slide) { return `pos:${state.slides.indexOf(slide) + 1}`; }

// Auto QR default for a blank-before-eligible slide: true only when the
// deck-wide QR toggle (state.config.qrCode) is on AND this slide sits before
// the first QR Stop marker in the deck (no marker in the deck = everything
// counts as "before").
function autoQRDefault(slide) {
  if (!state.config.qrCode) return false;
  const markerIdx = state.slides.findIndex(s => s.type === 'qrmarker');
  if (markerIdx === -1) return true;
  const slideIdx = state.slides.indexOf(slide);
  return slideIdx !== -1 && slideIdx < markerIdx;
}

// Final QR state for a blank-before-eligible slide. Manual override
// (slide.qrOverride, set by clicking the per-slide QR toggle) always wins
// over the auto default computed from the marker + deck-wide toggle —
// moving the marker later never changes a slide you've already touched by hand.
function effectiveQR(slide) {
  return (slide.qrOverride !== null && slide.qrOverride !== undefined) ? slide.qrOverride : autoQRDefault(slide);
}

// Inline text chips shown in the main panel heading — accepts multiple trigger keys (type + pos).
function macroChipsHTML(...triggerKeys) {
  const macros = activeStyleScheme().macros || [];
  return macros
    .filter(m => triggerKeys.some(k => (m.triggers || []).includes(k)))
    .map(m => `<span class="slide-macro-chip" style="${m.color ? `border-color:${m.color}` : ''}" title="${esc(m.name)}">${esc(m.name)}</span>`)
    .join('');
}

// All macros assigned to any of the given trigger keys (type + pos).
function getSlideMacroBadges(...triggerKeys) {
  const macros = activeStyleScheme().macros || [];
  return macros
    .filter(m => triggerKeys.some(k => (m.triggers || []).includes(k)))
    .map(m => ({ cls: 'macro-assigned', icon: 'dot', color: macroDisplayColor(m), title: m.name }));
}

function macroBadgesHTML(badges) {
  return (badges || []).map(macroBadgeHTML).join('');
}

function macroBadgeHTML(badge) {
  if (!badge) return '';
  const titleAttr = badge.title ? ` title="${esc(badge.title)}"` : '';
  let icon = '';
  if (badge.icon === 'dot')
    icon = `<span class="badge-icon badge-macro-dot"${badge.title ? ` data-name="${esc(badge.title)}"` : ''}${badge.color ? ` style="background:${badge.color}"` : ''}></span>`;
  else if (badge.icon === 'ring')
    icon = `<span class="badge-icon badge-macro-ring"${titleAttr}${badge.color ? ` style="color:${badge.color}"` : ''}></span>`;
  else if (badge.icon === 'circle')       icon = '<span class="badge-icon badge-circle"></span>';
  else if (badge.icon === 'circle-slash') icon = '<span class="badge-icon badge-circle-slash"></span>';
  return `<span class="si-badge si-badge-macro ${badge.cls}">${icon}${badge.text ? esc(badge.text) : ''}</span>`;
}

// Paintbrush + layout name tag for per-slide stage layout overrides.
function stageBadgeHTML(slide) {
  const layout = slide?.stageLayout?.layoutName;
  if (!layout) return '';
  return `<span class="si-badge si-tag si-tag-stage" title="Stage Layout Override: ${esc(layout)}">
    <svg class="si-tag-icon" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.5 2L12 4.5 5.5 11 2 12l1-3.5L9.5 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M8 3.5l2.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>${esc(layout)}</span>`;
}

// ─── Sidebar item right-click context menu ───────────────────────────────────

let _slideCtxMenu = null;

function getSlideCtxMenu() {
  if (_slideCtxMenu) return _slideCtxMenu;
  _slideCtxMenu = document.createElement('div');
  _slideCtxMenu.id = 'slide-ctx-menu';
  _slideCtxMenu.innerHTML = `
    <button id="ctx-dupe-slide">Duplicate</button>
    <button id="ctx-delete-slide" class="ctx-delete">Delete</button>
  `;
  document.body.appendChild(_slideCtxMenu);
  document.addEventListener('mousedown', e => {
    if (!_slideCtxMenu.contains(e.target)) hideSlideCtxMenu();
  });
  return _slideCtxMenu;
}

function showSlideCtxMenu(x, y, { onDuplicate, onDelete }) {
  const menu = getSlideCtxMenu();
  const dupeBtn = menu.querySelector('#ctx-dupe-slide');
  const delBtn  = menu.querySelector('#ctx-delete-slide');
  dupeBtn.style.display = onDuplicate ? '' : 'none';
  delBtn.style.display  = onDelete    ? '' : 'none';
  dupeBtn.onclick = onDuplicate ? () => { onDuplicate(); hideSlideCtxMenu(); } : null;
  delBtn.onclick  = onDelete    ? () => { onDelete();    hideSlideCtxMenu(); } : null;
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  menu.classList.add('open');
  const rect = menu.getBoundingClientRect();
  if (rect.right  > window.innerWidth)  menu.style.left = Math.max(0, x - rect.width)  + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top  = Math.max(0, y - rect.height) + 'px';
}

function hideSlideCtxMenu() {
  _slideCtxMenu?.classList.remove('open');
}

function makeSidebarItem({ id, cls, iconCls, iconText, label, fixed, draggable, onClick, onDelete, onDuplicate, macroBadges, stageBadges, transBadge, propTransBadge }) {
  const item = document.createElement('div');
  item.className = `slide-item${cls ? ' ' + cls : ''}${fixed ? ' fixed' : ''}`;
  item.dataset.id = id;
  if (draggable) item.draggable = true;
  const badges = macroBadgesHTML(macroBadges)
               + (stageBadges || '')
               + (transBadge     ? `<span class="si-badge si-badge-trans">${esc(transBadge)}</span>`           : '')
               + (propTransBadge ? `<span class="si-badge si-badge-prop-trans">${esc(propTransBadge)}</span>` : '');
  item.innerHTML = `
    <div class="slide-icon ${iconCls}">${iconText}</div>
    <div class="slide-label">${esc(label)}</div>
    ${badges ? `<div class="slide-badges">${badges}</div>` : ''}
  `;
  item.addEventListener('click', () => onClick());
  if (onDuplicate || onDelete) {
    item.addEventListener('contextmenu', e => {
      e.preventDefault();
      showSlideCtxMenu(e.clientX, e.clientY, { onDuplicate, onDelete });
    });
  }
  return item;
}

function renderSidebar() {
  const queue = document.getElementById('slide-queue');
  queue.innerHTML = '';

  // Update deck-wide QR toggle button state
  const qrToggleBtn = document.getElementById('btn-deck-qr');
  if (qrToggleBtn) qrToggleBtn.classList.toggle('active', !!state.config.qrCode);

  for (let _si = 0; _si < state.slides.length; _si++) {
    const slide = state.slides[_si];
    // Hide blank slides from sidebar when showBlanks is false
    if (!state.showBlanks && slide.type === 'blank') continue;

    // QR Stop marker: a striped divider, not a real slide — marks where
    // auto QR-fill (deck-wide QR toggle) stops. No form, no export.
    if (slide.type === 'qrmarker') {
      const marker = document.createElement('div');
      marker.className = `slide-item qr-marker-item${slide.id === state.activeId ? ' active' : ''}`;
      marker.dataset.id = slide.id;
      marker.draggable = true;
      const tickSvg = `<svg class="qr-marker-ticks" width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="10" x2="6" y2="2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="10" x2="12" y2="2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="10" x2="18" y2="2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
      marker.innerHTML = `${tickSvg}<span class="qr-marker-label">QR STOP</span>${tickSvg}`;
      marker.addEventListener('click', () => selectSlide(slide.id));
      marker.addEventListener('contextmenu', e => {
        e.preventDefault();
        showSlideCtxMenu(e.clientX, e.clientY, {
          onDuplicate: () => duplicateSlide(slide.id),
          onDelete:    () => deleteSlide(slide.id),
        });
      });
      marker.addEventListener('dragstart', onDragStart);
      marker.addEventListener('dragend',   onDragEnd);
      marker.addEventListener('dragover',  onDragOver);
      marker.addEventListener('dragleave', onDragLeave);
      marker.addEventListener('drop',      onDrop);
      queue.appendChild(marker);
      continue;
    }

    const ic             = ICON[slide.type] || { cls: '', text: '?' };
    const posKey         = `pos:${_si + 1}`;
    const hasBB          = slide.blankBefore && ['scripture', 'point', 'image'].includes(slide.type);
    // pos:N badge goes on the blank-before row (it is the Nth output cue); exclude it from the content slide
    const macroBadges    = getSlideMacroBadges(slide.type, ...(hasBB ? [] : [posKey]));
    if (slide.macroOverride) {
      macroBadges.push({ cls: 'macro-override', icon: 'ring', color: macroDisplayColor(slide.macroOverride), title: `Override: ${slide.macroOverride.name}` });
    }
    const transBadge     = slide.transition?.type     ? slide.transition.type.toUpperCase()     : null;
    const propTransBadge = slide.propTransition?.type ? slide.propTransition.type.toUpperCase() : null;

    // Blank-before indicator row (before content slides with blankBefore: true)
    if (hasBB) {
      const indicator = document.createElement('div');
      indicator.className = 'si-blank-indicator' + (!state.showBlanks ? ' hidden' : '');
      const bbBadges = getSlideMacroBadges('blankBefore', posKey);
      const bbStageBadges = stageDisplayBadgesHTML('blankBefore', posKey);
      const bbQrBadge = qrBadgeHTML(effectiveQR(slide));
      indicator.innerHTML = `<span class="si-blank-icon"><span class="badge-circle"></span></span><span class="si-blank-label">blank</span><div class="slide-badges" style="margin-left:auto">${macroBadgesHTML(bbBadges)}${bbStageBadges}${bbQrBadge}</div>`;
      queue.appendChild(indicator);
    }

    const item = makeSidebarItem({
      id:          slide.id,
      cls:         slide.id === state.activeId ? 'active' : '',
      iconCls:     ic.cls,
      iconText:    ic.text,
      label:       slide.label,
      fixed:       slide.fixed,
      draggable:   !slide.fixed,
      onClick:     () => selectSlide(slide.id),
      onDelete:    slide.fixed ? null : () => deleteSlide(slide.id),
      onDuplicate: slide.fixed ? null : () => duplicateSlide(slide.id),
      macroBadges,
      stageBadges: stageDisplayBadgesHTML(slide.type, ...(hasBB ? [] : [posKey]))
                 + (slide.type === 'blank' ? qrBadgeHTML(effectiveQR(slide)) : ''),
      transBadge,
      propTransBadge,
    });

    if (!slide.fixed) {
      item.addEventListener('dragstart', onDragStart);
      item.addEventListener('dragend',   onDragEnd);
    }
    item.addEventListener('dragover',  onDragOver);
    item.addEventListener('dragleave', onDragLeave);
    item.addEventListener('drop',      onDrop);

    // Inject RC group just before END
    if (slide.type === 'end') {
      const RC_SUBITEMS = [
        { id: 'rcBlank',   label: 'RC Blank',   trigger: 'rcBlank'   },
        { id: 'rcContent', label: 'RC Content',  trigger: 'rcContent' },
        { id: 'rcHold',    label: 'RC Hold',     trigger: 'rcHold'    },
      ];
      const rcIsActive = state.activeId === 'rc';

      const rcGroup = document.createElement('div');
      rcGroup.className = 'rc-group';

      // Header row
      const rcHeader = makeSidebarItem({
        id:        'rc',
        cls:       rcIsActive ? 'active' : '',
        iconCls:   'si-rc',
        iconText:  'RC',
        label:     'Response Card',
        fixed:     true,
        draggable: false,
        onClick:   () => { state.activeId = 'rc'; render(); },
        macroBadges: [],
        stageBadges: '',
      });
      // Unfurl arrow button (toggle expand, stops click from opening RC panel)
      const ARROW_SVG = `<svg viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 3l2 2 2-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const arrowBtn = document.createElement('button');
      arrowBtn.className = `rc-unfurl-btn${rcGroupExpanded ? ' open' : ''}`;
      arrowBtn.title = rcGroupExpanded ? 'Collapse' : 'Expand';
      arrowBtn.innerHTML = ARROW_SVG;
      arrowBtn.addEventListener('click', e => {
        e.stopPropagation();
        rcGroupExpanded = !rcGroupExpanded;
        renderSidebar();
      });
      rcHeader.querySelector('.slide-icon')?.before(arrowBtn);
      rcGroup.appendChild(rcHeader);

      // Sub-items (only when expanded)
      if (rcGroupExpanded) {
        for (const sub of RC_SUBITEMS) {
          const subItem = makeSidebarItem({
            id:        sub.id,
            cls:       'rc-subitem',
            iconCls:   'si-rc',
            iconText:  'RC',
            label:     sub.label,
            fixed:     true,
            draggable: false,
            onClick:   () => { state.activeId = 'rc'; render(); },
            macroBadges: getSlideMacroBadges(sub.trigger),
            stageBadges: stageDisplayBadgesHTML(sub.trigger),
          });
          rcGroup.appendChild(subItem);
        }
      }

      queue.appendChild(rcGroup);
    }

    // Building (revealing) points unfurl like Response Card — one subitem
    // per bullet, since each bullet is its own output cue on export.
    if (slide.type === 'point' && slide.mode === 'revealing') {
      const isExpanded = expandedRevealGroups.has(slide.id);
      const group = document.createElement('div');
      group.className = 'rc-group';

      const ARROW_SVG = `<svg viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 3l2 2 2-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const arrowBtn = document.createElement('button');
      arrowBtn.className = `rc-unfurl-btn${isExpanded ? ' open' : ''}`;
      arrowBtn.title = isExpanded ? 'Collapse' : 'Expand';
      arrowBtn.innerHTML = ARROW_SVG;
      arrowBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (isExpanded) expandedRevealGroups.delete(slide.id);
        else expandedRevealGroups.add(slide.id);
        renderSidebar();
      });
      item.querySelector('.slide-icon')?.before(arrowBtn);
      group.appendChild(item);

      if (isExpanded) {
        (slide.bullets || []).forEach((bullet, i) => {
          const text = bulletToText(bullet)?.trim() || `Bullet ${i + 1}`;
          const subItem = makeSidebarItem({
            id:          `${slide.id}-b${i}`,
            cls:         'rc-subitem',
            iconCls:     ic.cls,
            iconText:    String(i + 1),
            label:       text,
            fixed:       true,
            draggable:   false,
            onClick:     () => selectSlide(slide.id),
            macroBadges: [],
            stageBadges: '',
          });
          group.appendChild(subItem);
        });
      }

      queue.appendChild(group);
      continue;
    }

    queue.appendChild(item);
  }
}

// ─── Drag-to-reorder ──────────────────────────────────────────────────────────

let dragId = null;

function onDragStart(e) {
  dragId = e.currentTarget.dataset.id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => { e.currentTarget.style.opacity = '0.4'; }, 0);
}

function onDragEnd(e) {
  e.currentTarget.style.opacity = '';
  document.querySelectorAll('.slide-item.drag-before, .slide-item.drag-after')
    .forEach(el => { el.classList.remove('drag-before'); el.classList.remove('drag-after'); });
  dragId = null;
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const el = e.currentTarget;
  if (el.dataset.id === dragId) return;
  const rect = el.getBoundingClientRect();
  const isBefore = e.clientY < rect.top + rect.height / 2;
  el.classList.toggle('drag-before', isBefore);
  el.classList.toggle('drag-after', !isBefore);
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-before');
  e.currentTarget.classList.remove('drag-after');
}

function onDrop(e) {
  e.preventDefault();
  const el = e.currentTarget;
  const targetId = el.dataset.id;
  const insertBefore = el.classList.contains('drag-before');
  el.classList.remove('drag-before');
  el.classList.remove('drag-after');
  if (!dragId || dragId === targetId) return;

  const fromIdx = state.slides.findIndex(s => s.id === dragId);
  const target  = state.slides.find(s => s.id === targetId);
  if (!target) return;

  const [moved] = state.slides.splice(fromIdx, 1);

  let toIdx = state.slides.findIndex(s => s.id === targetId);
  if (target.type === 'start') toIdx = 1;
  else if (target.type === 'end') toIdx = state.slides.length - 1;
  else if (!insertBefore) toIdx = toIdx + 1;
  toIdx = Math.max(1, Math.min(toIdx, state.slides.length - 1));

  state.slides.splice(toIdx, 0, moved);
  render();
}

// ─── Main panel ───────────────────────────────────────────────────────────────

function renderMain() {
  const panel = document.getElementById('main-panel');


  if (state.activeId === 'settings') { renderConfigPanel(panel);      return; }
  if (state.activeId === 'style')    { renderStylePanel(panel);        return; }
  if (state.activeId === 'rc')       { renderResponseCardPanel(panel); return; }

  const slide = state.slides.find(s => s.id === state.activeId);
  if (!slide) {
    panel.innerHTML = `
      <div class="panel-brand">
        <img src="assets/deckpro_wordmark_black.png" alt="DeckPro" class="panel-brand-logo">
        <div class="panel-brand-sub">v${APP_VERSION} &nbsp;·&nbsp; Lucca Grillo</div>
      </div>`;
    return;
  }

  if (slide.type === 'start' || slide.type === 'end') {
    panel.innerHTML = startEndForm(slide);
    attachStartEndHandlers(slide);
    return;
  }

  switch (slide.type) {
    case 'blank':     panel.innerHTML = blankForm(slide);     break;
    case 'scripture': panel.innerHTML = scriptureForm(slide); break;
    case 'point':     panel.innerHTML = pointForm(slide);     break;
    case 'image':     panel.innerHTML = imageForm(slide);     break;
    case 'custom':    panel.innerHTML = customForm(slide);    break;
    case 'qrmarker':  panel.innerHTML = qrMarkerForm(slide);  return; // no form fields to wire
    default:          panel.innerHTML = '<div class="panel-empty">Unknown type</div>'; return;
  }
  attachFormHandlers(slide);
}

// ─── Transition picker helper ─────────────────────────────────────────────────

function transitionRow(current, idPrefix) {
  const type = current?.type || 'default';
  const dur  = current?.duration ?? 0.6;
  const showDur = type !== 'default' && type !== 'cut';
  return `
    <div class="trans-row" id="${idPrefix}-trans-row">
      <div class="segmented-control trans-seg" id="${idPrefix}-trans-seg">
        <button data-val="default"  class="${type === 'default'  ? 'active' : ''}">Default</button>
        <button data-val="fade"     class="${type === 'fade'     ? 'active' : ''}">Fade</button>
        <button data-val="dissolve" class="${type === 'dissolve' ? 'active' : ''}">Dissolve</button>
        <button data-val="cut"      class="${type === 'cut'      ? 'active' : ''}">Cut</button>
      </div>
      <input type="number" class="trans-dur" id="${idPrefix}-trans-dur"
        value="${showDur ? dur : ''}" min="0.1" max="5" step="0.1" placeholder="s"
        style="display:${showDur ? 'block' : 'none'}">
    </div>
  `;
}

function attachTransitionHandlers(idPrefix, get, save) {
  const seg = document.getElementById(`${idPrefix}-trans-seg`);
  const dur = document.getElementById(`${idPrefix}-trans-dur`);
  if (!seg) return;
  seg.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      seg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.dataset.val;
      const showDur = val !== 'default' && val !== 'cut';
      dur.style.display = showDur ? 'block' : 'none';
      if (val === 'default') {
        save(null);
      } else if (val === 'cut') {
        save({ type: 'cut', duration: 0 });
      } else {
        save({ type: val, duration: parseFloat(dur.value) || 0.6 });
      }
    });
  });
  dur.addEventListener('input', () => {
    const active = seg.querySelector('button.active')?.dataset.val;
    if (active && active !== 'default' && active !== 'cut') {
      save({ type: active, duration: parseFloat(dur.value) || 0.6 });
    }
  });
}

// ─── Build order editor ───────────────────────────────────────────────────────

let _boActiveTab = 'content';

const BO_ELEMENTS = {
  content:  ['body', 'title', 'live'],
  point:    ['body', 'live'],
  blank:    ['body'],
  startEnd: ['body'],
};

const BO_STARTS = [
  ['START_WITH_SLIDE',    'After Transition'],
  ['ON_CLICK',            'On Click'],
  ['START_WITH_PREVIOUS', 'With Previous'],
  ['START_AFTER_PREVIOUS','After Previous'],
];

// Mirrors a real constraint in ProPresenter's own build-order UI: the FIRST
// build item in a slide's list can only start "After Transition" (i.e. as
// soon as the slide's own transition finishes — Pro7's actual term; "With
// Slide" isn't a real Pro7 option) or "On Click" — there's no earlier item
// for it to start "with"/"after". Every item AFTER the first can only
// reference the item directly above it — "On Click", "With Previous", or
// "After Previous" — "After Transition" only ever makes sense once, for
// whichever build the slide itself kicks off.
function validBoStartsForPosition(i) {
  return i === 0
    ? ['START_WITH_SLIDE', 'ON_CLICK']
    : ['ON_CLICK', 'START_WITH_PREVIOUS', 'START_AFTER_PREVIOUS'];
}
// Reordering/adding/removing rows can leave an entry's `start` invalid for its
// NEW position (e.g. deleting row 1 promotes row 2 — previously "With
// Previous" — into position 0, where that no longer means anything). Called
// after any structural change, once the caller already holds a forked
// (non-Global-inheriting) entries array, so it's always safe to mutate here.
function sanitizeBoStarts(entries) {
  entries.forEach((entry, i) => {
    if (!validBoStartsForPosition(i).includes(entry.start)) entry.start = 'ON_CLICK';
  });
}

const BO_TRANSITIONS = [
  ['cut',      'Cut'],
  ['dissolve', 'Dissolve'],
  ['fade',     'Fade'],
];

function renderBuildTable(tab, scheme, locked) {
  const entries  = (scheme.buildOrders ?? ensureGlobalMotion().buildOrders)[tab] || [];
  const elements = BO_ELEMENTS[tab] || ['this slide'];
  const dis      = locked ? 'disabled' : '';

  const rows = entries.map((entry, i) => {
    const isCut  = entry.transition === 'cut';
    const isLast = i === entries.length - 1;
    return `
      <tr class="bo-row">
        <td class="bo-cell-ord">
          <button class="bo-mv" data-dir="up"   data-idx="${i}" ${i === 0    || locked ? 'disabled' : ''} title="Move up">↑</button>
          <button class="bo-mv" data-dir="down" data-idx="${i}" ${isLast     || locked ? 'disabled' : ''} title="Move down">↓</button>
        </td>
        <td class="bo-cell-en">
          <input type="checkbox" class="bo-en" data-idx="${i}" ${entry.enabled ? 'checked' : ''} ${dis}>
        </td>
        <td class="bo-cell-el">
          <select class="bo-el" data-idx="${i}" ${dis}>
            ${elements.map(el => `<option value="${esc(el)}" ${entry.element === el ? 'selected' : ''}>${esc(el)}</option>`).join('')}
          </select>
        </td>
        <td class="bo-cell-dir">
          <select class="bo-dir" data-idx="${i}" ${dis}>
            <option value="in"  ${entry.dir === 'in'  ? 'selected' : ''}>In</option>
            <option value="out" ${entry.dir === 'out' ? 'selected' : ''}>Out</option>
          </select>
        </td>
        <td class="bo-cell-start">
          <select class="bo-start" data-idx="${i}" ${dis}>
            ${BO_STARTS.filter(([val]) => validBoStartsForPosition(i).includes(val))
              .map(([val, lbl]) => `<option value="${val}" ${entry.start === val ? 'selected' : ''}>${lbl}</option>`).join('')}
          </select>
        </td>
        <td class="bo-cell-delay">
          <input type="number" class="bo-num bo-delay" data-idx="${i}"
            value="${entry.delay ?? 0}" min="0" step="0.5" placeholder="s" ${dis}>
        </td>
        <td class="bo-cell-trans">
          <select class="bo-trans" data-idx="${i}" ${dis}>
            ${BO_TRANSITIONS.map(([val, lbl]) => `<option value="${val}" ${entry.transition === val ? 'selected' : ''}>${lbl}</option>`).join('')}
          </select>
        </td>
        <td class="bo-cell-dur">
          <input type="number" class="bo-num bo-dur" data-idx="${i}"
            value="${isCut ? '' : (entry.duration ?? 0.6)}" min="0" max="10" step="0.1" placeholder="s"
            ${isCut || locked ? 'disabled' : ''} ${isCut ? 'style="opacity:.3"' : ''}>
        </td>
        <td class="bo-cell-del">
          <button class="bo-del" data-idx="${i}" ${dis} title="Remove">×</button>
        </td>
      </tr>`;
  }).join('');

  const empty = !rows ? `<tr><td colspan="9" class="bo-empty">No builds — click + Add</td></tr>` : '';

  return `
    <table class="bo-table">
      <thead>
        <tr>
          <th class="bo-th-ord"></th>
          <th class="bo-th-en">On</th>
          <th class="bo-th-el">Element</th>
          <th class="bo-th-dir">Dir</th>
          <th class="bo-th-start">Start</th>
          <th class="bo-th-delay">Delay</th>
          <th class="bo-th-trans">Transition</th>
          <th class="bo-th-dur">Dur</th>
          <th class="bo-th-del"></th>
        </tr>
      </thead>
      <tbody>${rows || empty}</tbody>
    </table>
    <button class="btn-sm bo-add-btn" id="bo-add-btn" ${locked ? 'disabled' : ''}>+ Add</button>
  `;
}

function attachBuildOrderHandlers(getScheme, panel, locked) {
  const wrap = panel.querySelector('#bo-table-wrap');
  if (!wrap) return;

  const getEntries = () => {
    const s = getScheme(); if (!s) return [];
    // Forking point: the first edit on an inheriting scheme materializes a copy
    // of Global's current build orders, then detaches from Global going forward.
    if (s.buildOrders == null) s.buildOrders = deepClone(ensureGlobalMotion().buildOrders);
    if (!Array.isArray(s.buildOrders[_boActiveTab])) s.buildOrders[_boActiveTab] = [];
    return s.buildOrders[_boActiveTab];
  };

  const refresh = () => {
    const s = getScheme(); if (!s) return;
    wrap.innerHTML = renderBuildTable(_boActiveTab, s, locked);
    attachBuildRowHandlers(getEntries, wrap, getScheme, panel, locked);
  };

  // Tab switching
  panel.querySelectorAll('.bo-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _boActiveTab = btn.dataset.tab;
      panel.querySelectorAll('.bo-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === _boActiveTab));
      refresh();
    });
  });

  // Whole-object reset-to-global / push-to-global
  panel.querySelector('.wf-reset[data-wf="buildOrders"]')?.addEventListener('click', () => {
    const s = getScheme(); if (!s) return;
    s.buildOrders = null;
    saveState(); renderStylePanel(panel);
  });
  panel.querySelector('.wf-push[data-wf="buildOrders"]')?.addEventListener('click', () => {
    const s = getScheme(); if (!s) return;
    const glbMotion = ensureGlobalMotion();
    glbMotion.buildOrders = deepClone(s.buildOrders ?? glbMotion.buildOrders);
    saveState(); renderStylePanel(panel);
    toast('success', 'Pushed to Global', 'Every style inheriting build orders will now use this.');
  });

  attachBuildRowHandlers(getEntries, wrap, getScheme, panel, locked);
}

function attachBuildRowHandlers(getEntries, wrap, getScheme, panel, locked) {
  if (locked) return;

  const refresh = () => {
    const s = getScheme(); if (!s) return;
    wrap.innerHTML = renderBuildTable(_boActiveTab, s, locked);
    attachBuildRowHandlers(getEntries, wrap, getScheme, panel, locked);
  };

  // ↑/↓ move
  wrap.querySelectorAll('.bo-mv').forEach(btn => {
    btn.addEventListener('click', () => {
      const entries = getEntries();
      const i = Number(btn.dataset.idx);
      if (btn.dataset.dir === 'up' && i > 0) {
        [entries[i - 1], entries[i]] = [entries[i], entries[i - 1]];
      } else if (btn.dataset.dir === 'down' && i < entries.length - 1) {
        [entries[i], entries[i + 1]] = [entries[i + 1], entries[i]];
      }
      sanitizeBoStarts(entries);
      saveState(); refresh();
    });
  });

  // Delete row
  wrap.querySelectorAll('.bo-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const entries = getEntries();
      entries.splice(Number(btn.dataset.idx), 1);
      sanitizeBoStarts(entries);
      saveState(); refresh();
    });
  });

  // Enabled toggle
  wrap.querySelectorAll('.bo-en').forEach(inp => {
    inp.addEventListener('change', () => {
      getEntries()[Number(inp.dataset.idx)].enabled = inp.checked;
      saveState();
    });
  });

  // Element
  wrap.querySelectorAll('.bo-el').forEach(sel => {
    sel.addEventListener('change', () => {
      getEntries()[Number(sel.dataset.idx)].element = sel.value;
      saveState();
    });
  });

  // Direction
  wrap.querySelectorAll('.bo-dir').forEach(sel => {
    sel.addEventListener('change', () => {
      getEntries()[Number(sel.dataset.idx)].dir = sel.value;
      saveState();
    });
  });

  // Start type
  wrap.querySelectorAll('.bo-start').forEach(sel => {
    sel.addEventListener('change', () => {
      getEntries()[Number(sel.dataset.idx)].start = sel.value;
      saveState();
    });
  });

  // Delay
  wrap.querySelectorAll('.bo-delay').forEach(inp => {
    inp.addEventListener('input', () => {
      getEntries()[Number(inp.dataset.idx)].delay = parseFloat(inp.value) || 0;
      saveState();
    });
  });

  // Transition — show/hide Dur when Cut
  wrap.querySelectorAll('.bo-trans').forEach(sel => {
    sel.addEventListener('change', () => {
      const i = Number(sel.dataset.idx);
      getEntries()[i].transition = sel.value;
      const durInp = wrap.querySelector(`.bo-dur[data-idx="${i}"]`);
      if (durInp) {
        const isCut = sel.value === 'cut';
        durInp.disabled     = isCut;
        durInp.style.opacity = isCut ? '0.3' : '';
        if (isCut) durInp.value = '';
      }
      saveState();
    });
  });

  // Duration
  wrap.querySelectorAll('.bo-dur').forEach(inp => {
    inp.addEventListener('input', () => {
      getEntries()[Number(inp.dataset.idx)].duration = parseFloat(inp.value) || 0;
      saveState();
    });
  });

  // Add new row
  const addBtn = document.getElementById('bo-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const elements = BO_ELEMENTS[_boActiveTab] || ['this slide'];
      const entries = getEntries();
      entries.push({
        id: uid(), element: elements[0], dir: 'out',
        start: entries.length === 0 ? 'ON_CLICK' : 'START_AFTER_PREVIOUS', delay: 0,
        transition: 'dissolve', duration: 0.6, enabled: true,
      });
      saveState(); refresh();
    });
  }
}

// ─── Config / global settings panel ──────────────────────────────────────────

const CUSTOM_MACRO_TRIGGERS = [
  ['start',       'Start'],
  ['end',         'End'],
  ['scripture',   'Scripture'],
  ['point',       'Point'],
  ['blank',       'Blank'],
  ['blankBefore', 'Blank Before'],
  ['image',       'Image'],
  ['rcBlank',     'RC Blank'],
  ['rcContent',   'RC Content'],
  ['rcHold',      'RC Hold'],
];



function showMacroPicker(onSelect, singleSelect = false) {
  document.getElementById('macro-picker-overlay')?.remove();
  const liveMacros = pro7rt.liveMacros || [];
  const existing   = new Set((activeStyleScheme().macros ?? ensureGlobalMacros()).map(m => m.uuid));
  const selected   = new Set(); // UUIDs currently ticked

  const mName  = (m) => (m.id?.name?.string ?? m.id?.name ?? m.name?.string ?? m.name ?? '');
  const mUuid  = (m) => (m.id?.uuid?.string ?? m.id?.uuid ?? '');
  const mColor = (m) => {
    const c = m.color;
    if (!c) return null;
    return `rgba(${Math.round((c.red||0)*255)},${Math.round((c.green||0)*255)},${Math.round((c.blue||0)*255)},${c.alpha??1})`;
  };

  const overlay = document.createElement('div');
  overlay.className = 'macro-picker-overlay';
  overlay.id = 'macro-picker-overlay';
  overlay.innerHTML = `
    <div class="macro-picker-modal">
      <div class="macro-picker-header">
        <input type="text" class="macro-picker-search" placeholder="Search macros…" autocomplete="off" spellcheck="false">
        <button class="macro-picker-close" title="Cancel">×</button>
      </div>
      <div class="macro-picker-list"></div>
      <div class="macro-picker-footer">
        <span class="macro-picker-count">${liveMacros.length} macros from Pro7</span>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="macro-picker-refresh">Refresh</button>
          <button class="macro-picker-add" disabled>Add 0</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const search   = overlay.querySelector('.macro-picker-search');
  const list     = overlay.querySelector('.macro-picker-list');
  const closeBtn = overlay.querySelector('.macro-picker-close');
  const refresh  = overlay.querySelector('.macro-picker-refresh');
  const count    = overlay.querySelector('.macro-picker-count');
  const addBtn   = overlay.querySelector('.macro-picker-add');

  function updateAddBtn() {
    addBtn.disabled = selected.size === 0;
    addBtn.textContent = selected.size === 0 ? 'Add 0' : `Add ${selected.size}`;
  }

  function renderRows(filter = '') {
    const f = filter.trim().toLowerCase();
    if (!liveMacros.length) {
      list.innerHTML = `<div class="macro-picker-empty">No macros found — make sure Pro7 is connected.</div>`;
      return;
    }
    const filtered = liveMacros.filter(m => {
      const name = mName(m).toLowerCase();
      const uuid = mUuid(m).toLowerCase();
      return !f || name.includes(f) || uuid.includes(f);
    });
    if (!filtered.length) {
      list.innerHTML = `<div class="macro-picker-empty">No matches for "${esc(filter)}".</div>`;
      return;
    }
    list.innerHTML = filtered.map(m => {
      const name  = mName(m);
      const uuid  = mUuid(m);
      const color = mColor(m);
      const isExisting = existing.has(uuid);
      const isSel = selected.has(uuid);
      const dot = color ? `<span class="mpi-dot" style="background:${color}"></span>` : `<span class="mpi-dot mpi-dot-default"></span>`;
      return `<div class="macro-picker-row${isSel ? ' selected' : ''}${isExisting ? ' existing' : ''}" data-name="${esc(name)}" data-uuid="${esc(uuid)}" data-color="${esc(color||'')}">
        <span class="mpi-check">${isSel ? '✓' : ''}</span>
        ${dot}
        <span class="macro-picker-row-name">${esc(name)}</span>
        <code class="macro-picker-row-uuid">${esc(uuid)}</code>
        ${isExisting ? '<span class="mpi-existing">added</span>' : ''}
      </div>`;
    }).join('');
  }

  renderRows();
  setTimeout(() => search.focus(), 40);

  search.addEventListener('input', () => renderRows(search.value));

  list.addEventListener('click', e => {
    const row = e.target.closest('.macro-picker-row');
    if (!row || row.classList.contains('existing')) return;
    const uuid = row.dataset.uuid;
    if (singleSelect) {
      // Immediately confirm selection
      const m = liveMacros.find(m2 => mUuid(m2) === uuid);
      overlay.remove();
      onSelect(m ? [{ name: mName(m), uuid, color: mColor(m) }] : []);
      return;
    }
    if (selected.has(uuid)) selected.delete(uuid); else selected.add(uuid);
    row.classList.toggle('selected', selected.has(uuid));
    row.querySelector('.mpi-check').textContent = selected.has(uuid) ? '\u2713' : '';
    updateAddBtn();
  });

  addBtn.addEventListener('click', () => {
    const result = [...selected].map(uuid => {
      const m = liveMacros.find(m => mUuid(m) === uuid);
      return m ? { name: mName(m), uuid, color: mColor(m) } : null;
    }).filter(Boolean);
    overlay.remove();
    onSelect(result);
  });

  refresh.addEventListener('click', async () => {
    refresh.textContent = 'Refreshing…';
    refresh.disabled = true;
    await fetchPro7Macros(true);
    liveMacros.length = 0;
    liveMacros.push(...(pro7rt.liveMacros || []));
    count.textContent = `${liveMacros.length} macros from Pro7`;
    refresh.textContent = 'Refresh';
    refresh.disabled = false;
    renderRows(search.value);
  });

  closeBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// attachMacrosPanelHandlers removed — macros are now per-scheme, managed in Schemes → Macros tab

function attachSchemesMacrosTab(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const getScheme = () => state.styleSchemes.find(s => s.id === state.activeSchemeId) || state.styleSchemes[0];
  // Read-only: what to DISPLAY — falls to Global while the scheme is null (inheriting).
  const resolvedMacros = () => getScheme()?.macros ?? ensureGlobalMacros();
  // Fork point: first edit on an inheriting scheme materializes a copy of
  // Global's current macros, then detaches going forward.
  function fork() {
    const s = getScheme(); if (!s) return null;
    if (s.macros == null) s.macros = deepClone(ensureGlobalMacros());
    return s;
  }
  function badgeHtml() {
    const s = getScheme();
    const inherit = !s || s.macros == null;
    return `<div class="wf-row">
      <span class="wf-badge ${inherit ? 'wf-inherit' : 'wf-custom'}">${inherit ? '● Using Global' : '● Custom'}</span>
      ${inherit ? '' : `<button class="btn-sm wf-reset" type="button" id="smac-wf-reset">↺ Reset to Global</button>`}
      <button class="btn-sm wf-push" type="button" id="smac-wf-push">↑ Push to Global</button>
    </div>`;
  }

  function rerender() {
    const macros = resolvedMacros();
    el.querySelector('.smac-badge-wrap').innerHTML = badgeHtml();
    el.querySelector('.smac-list').innerHTML = macros.length ? macros.map((m, idx) => `
      <div class="smac-row custom-macro-row">
        <div class="custom-macro-fields">
          <span class="cm-dot" style="background:${macroDisplayColor(m)}"></span>
          <span class="cm-name-ro">${esc(m.name)}</span>
          <code class="cm-uuid-ro">${esc(m.uuid || '')}</code>
          <button class="btn-custom-del smac-del" data-idx="${idx}" title="Remove">×</button>
        </div>
        <div class="smac-chips">
          ${CUSTOM_MACRO_TRIGGERS.map(([key, label]) =>
            `<button class="cm-chip${(m.triggers || []).includes(key) ? ' active' : ''}" data-idx="${idx}" data-trigger="${key}">${label}</button>`
          ).join('')}
        </div>
        <div class="smac-pos-row">
          <span class="smac-pos-label">Slide #</span>
          ${(m.triggers || []).filter(t => /^pos:\d+$/.test(t)).map(t =>
            `<span class="smac-pos-chip" data-idx="${idx}" data-pos="${t}">#${t.slice(4)}<button class="smac-pos-rm" data-idx="${idx}" data-pos="${t}">×</button></span>`
          ).join('')}
          <input type="number" class="smac-pos-input" min="1" max="999" placeholder="add #" data-idx="${idx}">
        </div>
      </div>`).join('')
    : `<p class="cm-empty">No macros for this scheme — click + Add Macro to import from Pro7.</p>`;
  }

  el.innerHTML = `
    <div class="smac-gradient-wrap"></div>
    <div class="smac-badge-wrap"></div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
      <button class="btn-sm" id="smac-add-btn">+ Add Macro</button>
    </div>
    <div class="smac-list"></div>
  `;
  renderSingleMacroField(el.querySelector('.smac-gradient-wrap'), 'gradientMacro', 'Gradient',
    'Fires on Scripture, Point, and Response Card content cues — deck-wide, not per-style, since it\'s a real macro rather than visual style. See the QR Code tab for the version that fires instead when this export\'s QR toggle is on.');
  rerender();

  el.querySelector('#smac-add-btn').addEventListener('click', () => {
    showMacroPicker((selected) => {
      const scheme = fork();
      if (!scheme) return;
      for (const { name, uuid, color } of selected) {
        if (!scheme.macros.some(m => m.uuid === uuid))
          scheme.macros.push({ id: uid(), name, uuid, color, triggers: [] });
      }
      saveState();
      rerender();
    });
  });

  el.addEventListener('click', e => {
    if (e.target.id === 'smac-wf-reset') {
      const s = getScheme(); if (!s) return;
      s.macros = null;
      saveState(); rerender();
      return;
    }
    if (e.target.id === 'smac-wf-push') {
      state.globalMacros = deepClone(resolvedMacros());
      saveState(); rerender();
      toast('success', 'Pushed to Global', 'Every style inheriting macros will now use this.');
      return;
    }
    if (e.target.classList.contains('smac-del')) {
      const idx = parseInt(e.target.dataset.idx, 10);
      const scheme = fork();
      if (!isNaN(idx) && scheme?.macros) { scheme.macros.splice(idx, 1); saveState(); rerender(); }
    }
    if (e.target.classList.contains('cm-chip')) {
      const idx     = parseInt(e.target.dataset.idx, 10);
      const trigger = e.target.dataset.trigger;
      const scheme  = fork();
      if (isNaN(idx) || !scheme?.macros?.[idx]) return;
      const mTriggers = scheme.macros[idx].triggers || [];
      const ti = mTriggers.indexOf(trigger);
      if (ti === -1) mTriggers.push(trigger); else mTriggers.splice(ti, 1);
      scheme.macros[idx].triggers = mTriggers;
      saveState();
      rerender();
    }
    if (e.target.classList.contains('smac-pos-rm')) {
      const idx    = parseInt(e.target.dataset.idx, 10);
      const posKey = e.target.dataset.pos;
      const scheme = fork();
      if (isNaN(idx) || !scheme?.macros?.[idx]) return;
      const t = scheme.macros[idx].triggers || [];
      scheme.macros[idx].triggers = t.filter(x => x !== posKey);
      saveState(); rerender();
    }
  });

  el.addEventListener('keydown', e => {
    if (!e.target.classList.contains('smac-pos-input')) return;
    if (e.key !== 'Enter') return;
    const idx = parseInt(e.target.dataset.idx, 10);
    const n   = parseInt(e.target.value, 10);
    if (isNaN(idx) || isNaN(n) || n < 1) return;
    const posKey = `pos:${n}`;
    const scheme = fork();
    if (!scheme?.macros?.[idx]) return;
    const t = scheme.macros[idx].triggers || [];
    if (!t.includes(posKey)) { t.push(posKey); scheme.macros[idx].triggers = t; saveState(); }
    e.target.value = '';
    rerender();
  });
}

function attachSchemesStageTab(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const getScheme = () => state.styleSchemes.find(s => s.id === state.activeSchemeId) || state.styleSchemes[0];
  // Read-only: what to DISPLAY — falls to Global while the scheme is null (inheriting).
  const resolvedStageDisplays = () => getScheme()?.stageDisplays ?? ensureGlobalStageDisplays();
  // Fork point: first edit on an inheriting scheme materializes a copy of
  // Global's current stage displays, then detaches going forward.
  function fork() {
    const s = getScheme(); if (!s) return null;
    if (s.stageDisplays == null) s.stageDisplays = deepClone(ensureGlobalStageDisplays());
    return s;
  }
  function badgeHtml() {
    const s = getScheme();
    const inherit = !s || s.stageDisplays == null;
    return `<div class="wf-row">
      <span class="wf-badge ${inherit ? 'wf-inherit' : 'wf-custom'}">${inherit ? '● Using Global' : '● Custom'}</span>
      ${inherit ? '' : `<button class="btn-sm wf-reset" type="button" id="sstage-wf-reset">↺ Reset to Global</button>`}
      <button class="btn-sm wf-push" type="button" id="sstage-wf-push">↑ Push to Global</button>
    </div>`;
  }

  const STAGE_ICON = `<svg style="width:10px;height:10px;vertical-align:middle;margin-right:3px" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="1.3" width="6" height="4.2" rx="0.6" stroke="currentColor" stroke-width="1.1"/><path d="M5 5.5v1.6M3.3 7.9h3.4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>`;

  function rerender() {
    const entries = resolvedStageDisplays();
    el.querySelector('.sstage-badge-wrap').innerHTML = badgeHtml();

    el.querySelector('.sstage-list').innerHTML = entries.length ? entries.map((d, idx) => `
      <div class="smac-row custom-macro-row">
        <div class="custom-macro-fields">
          <span class="cm-dot" style="background:var(--orange);opacity:.7">${STAGE_ICON}</span>
          <span class="cm-name-ro">${esc(d.name) || '<span style="color:var(--muted);font-style:italic;font-weight:400">no layout picked</span>'}</span>
          <code class="cm-uuid-ro">${esc(d.uuid || '')}</code>
          <button class="btn-sm sstage-pick" data-idx="${idx}">Pick</button>
          <button class="btn-custom-del sstage-del" data-idx="${idx}" title="Remove">×</button>
        </div>
        <div class="smac-chips">
          ${CUSTOM_MACRO_TRIGGERS.map(([key, label]) =>
            `<button class="cm-chip${(d.triggers || []).includes(key) ? ' active' : ''}" data-idx="${idx}" data-trigger="${key}">${label}</button>`
          ).join('')}
        </div>
        <div class="smac-pos-row">
          <span class="smac-pos-label">Slide #</span>
          ${(d.triggers || []).filter(t => /^pos:\d+$/.test(t)).map(t =>
            `<span class="smac-pos-chip" data-idx="${idx}" data-pos="${t}">#${t.slice(4)}<button class="smac-pos-rm sstage-pos-rm" data-idx="${idx}" data-pos="${t}">×</button></span>`
          ).join('')}
          <input type="number" class="smac-pos-input sstage-pos-input" min="1" max="999" placeholder="add #" data-idx="${idx}">
        </div>
      </div>`).join('')
    : `<p class="cm-empty">No stage displays — click + Add Stage Display to pick a layout from Pro7.</p>`;
  }

  el.innerHTML = `
    <div class="sstage-badge-wrap"></div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
      <button class="btn-sm" id="sstage-add-btn">+ Add Stage Display</button>
    </div>
    <div class="sstage-list smac-list"></div>
  `;
  rerender();

  // Add Stage Display button → multi-select picker
  el.querySelector('#sstage-add-btn').addEventListener('click', () => {
    showStageLayoutPicker(null, el.querySelector('#sstage-add-btn'), (results) => {
      const scheme = fork();
      if (!scheme || !results.length) return;
      for (const { name, uuid } of results)
        scheme.stageDisplays.push({ id: uid(), name, uuid, triggers: [] });
      saveState(); rerender();
    }, false);
  });

  // Trigger chip toggle
  el.addEventListener('click', e => {
    if (e.target.id === 'sstage-wf-reset') {
      const s = getScheme(); if (!s) return;
      s.stageDisplays = null;
      saveState(); rerender();
      return;
    }
    if (e.target.id === 'sstage-wf-push') {
      state.globalStageDisplays = deepClone(resolvedStageDisplays());
      saveState(); rerender();
      toast('success', 'Pushed to Global', 'Every style inheriting stage displays will now use this.');
      return;
    }
    if (e.target.classList.contains('cm-chip') && e.target.closest('.sstage-list')) {
      const idx     = parseInt(e.target.dataset.idx, 10);
      const trigger = e.target.dataset.trigger;
      const scheme  = fork();
      if (isNaN(idx) || !scheme?.stageDisplays?.[idx]) return;
      const t  = scheme.stageDisplays[idx].triggers || [];
      const ti = t.indexOf(trigger);
      if (ti === -1) t.push(trigger); else t.splice(ti, 1);
      scheme.stageDisplays[idx].triggers = t;
      saveState();
      rerender();
    }
    if (e.target.classList.contains('sstage-del')) {
      const idx = parseInt(e.target.dataset.idx, 10);
      const scheme = fork();
      if (!isNaN(idx) && scheme?.stageDisplays) { scheme.stageDisplays.splice(idx, 1); saveState(); rerender(); }
    }
    if (e.target.classList.contains('sstage-pick')) {
      const idx = parseInt(e.target.dataset.idx, 10);
      showStageLayoutPicker(null, e.target, (name, uuid) => {
        const scheme = fork();
        if (!isNaN(idx) && scheme?.stageDisplays?.[idx]) {
          scheme.stageDisplays[idx].name = name;
          scheme.stageDisplays[idx].uuid = uuid;
          saveState(); rerender();
        }
      });
    }
    if (e.target.classList.contains('sstage-pos-rm')) {
      const idx    = parseInt(e.target.dataset.idx, 10);
      const posKey = e.target.dataset.pos;
      const scheme = fork();
      if (isNaN(idx) || !scheme?.stageDisplays?.[idx]) return;
      scheme.stageDisplays[idx].triggers = (scheme.stageDisplays[idx].triggers || []).filter(x => x !== posKey);
      saveState(); rerender();
    }
  });

  // Slide # input → Enter to add pos trigger
  el.addEventListener('keydown', e => {
    if (!e.target.classList.contains('sstage-pos-input')) return;
    if (e.key !== 'Enter') return;
    const idx = parseInt(e.target.dataset.idx, 10);
    const n   = parseInt(e.target.value, 10);
    if (isNaN(idx) || isNaN(n) || n < 1) return;
    const posKey = `pos:${n}`;
    const scheme = fork();
    if (!scheme?.stageDisplays?.[idx]) return;
    const t = scheme.stageDisplays[idx].triggers || [];
    if (!t.includes(posKey)) { t.push(posKey); scheme.stageDisplays[idx].triggers = t; saveState(); }
    e.target.value = '';
    rerender();
  });
}

// Response Card element editor (display-2 / LED wall prop). Lists the base
// elements (title, decision, R1–R3) plus custom ones, each fully editable:
// name (= Pro7 object name), text, position (X/Y/W/H) and style (font/size/
// color/align). Decision/R1–R3 text is filled from the Response Card deck item.
function attachSchemesResponseCardTab(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const getScheme = () => state.styleSchemes.find(s => s.id === state.activeSchemeId) || state.styleSchemes[0];
  const FROM_DECK = ['decision', 'r1', 'r2', 'r3'];
  const ROLE_LABEL = { title: 'Title', decision: 'Decision', r1: 'Response 1', r2: 'Response 2', r3: 'Response 3', custom: 'Custom' };
  const families = (typeof _fontFamilyMap === 'object' && _fontFamilyMap) ? Object.keys(_fontFamilyMap).sort((a, b) => a.localeCompare(b)) : [];

  // Read-only: what to DISPLAY. Does not mutate — s.rcElements stays null
  // (inheriting Global) until an actual edit forks it via fork() below.
  function resolvedElements() {
    const s = getScheme();
    return s?.rcElements ?? ensureGlobalRcElements();
  }
  // Fork point: the first edit on an inheriting scheme materializes a copy of
  // Global's current elements into the scheme, then detaches going forward.
  function fork() {
    const s = getScheme(); if (!s) return null;
    if (s.rcElements == null) s.rcElements = deepClone(ensureGlobalRcElements());
    return s;
  }

  function card(elObj, idx) {
    const fromDeck = FROM_DECK.includes(elObj.role);
    const isCustom = elObj.role === 'custom';
    const curFam = parseFontPS(elObj.font || '').family;
    const famOpts = `<option value=""${!elObj.font ? ' selected' : ''}>(inherit)</option>` +
      families.map(f => `<option value="${esc(f)}"${f === curFam ? ' selected' : ''}>${esc(f)}</option>`).join('');
    const styles = (_fontFamilyMap && _fontFamilyMap[curFam]) || [];
    const styOpts = elObj.font
      ? styles.map(({ style, postscript }) => `<option value="${esc(postscript)}"${postscript === elObj.font ? ' selected' : ''}>${esc(style)}</option>`).join('')
      : '<option value="">—</option>';
    const num = (fld, val) => `<input type="number" class="rc-inp sz-input" data-idx="${idx}" data-fld="${fld}" value="${val ?? 0}" step="1">`;
    return `
      <div class="tcard rc-el-card" data-idx="${idx}">
        <div class="rc-el-hd" style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span class="rc-el-role" style="font-size:11px;color:var(--muted);min-width:74px">${esc(ROLE_LABEL[elObj.role] || 'Element')}</span>
          <input type="text" class="rc-inp" data-idx="${idx}" data-fld="name" value="${esc(elObj.name || '')}" placeholder="Element name" style="flex:1">
          ${isCustom ? `<button class="btn-custom-del rc-el-del" data-idx="${idx}" title="Remove">×</button>` : ''}
        </div>
        <div class="rc-el-text" style="margin-bottom:6px">
          ${fromDeck
            ? `<input type="text" class="rc-inp" value="" placeholder="Text comes from the Response Card item" disabled style="width:100%;opacity:.6">`
            : `<input type="text" class="rc-inp" data-idx="${idx}" data-fld="text" value="${esc(elObj.text || '')}" placeholder="Text" style="width:100%">`}
        </div>
        <div class="rc-el-style" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px">
          <select class="rc-sel" data-idx="${idx}" data-fld="fontFamily">${famOpts}</select>
          <select class="rc-sel" data-idx="${idx}" data-fld="fontWeight" ${elObj.font ? '' : 'disabled'}>${styOpts}</select>
          <input type="number" class="rc-inp sz-input" data-idx="${idx}" data-fld="size" value="${elObj.size || ''}" placeholder="auto" step="1" style="width:64px">
          <input type="text" class="rc-inp color-hex" data-idx="${idx}" data-fld="color" value="${(elObj.color || '').replace(/^#/, '')}" placeholder="color" maxlength="6" style="width:74px">
          <span class="segmented-control rc-align" data-idx="${idx}">
            ${['left', 'center', 'right'].map(a => `<button data-idx="${idx}" data-align="${a}" class="${(elObj.align || 'center') === a ? 'active' : ''}">${a[0].toUpperCase()}</button>`).join('')}
          </span>
        </div>
        <div class="rc-el-pos" style="display:flex;gap:6px;align-items:center">
          <span style="font-size:11px;color:var(--muted)">X</span>${num('x', elObj.x)}
          <span style="font-size:11px;color:var(--muted)">Y</span>${num('y', elObj.y)}
          <span style="font-size:11px;color:var(--muted)">W</span>${num('w', elObj.w)}
          <span style="font-size:11px;color:var(--muted)">H</span>${num('h', elObj.h)}
        </div>
      </div>`;
  }

  function badgeHtml() {
    const s = getScheme();
    const inherit = !s || s.rcElements == null;
    return `<div class="wf-row">
      <span class="wf-badge ${inherit ? 'wf-inherit' : 'wf-custom'}">${inherit ? '● Using Global' : '● Custom'}</span>
      ${inherit ? '' : `<button class="btn-sm wf-reset" type="button" id="rc-wf-reset">↺ Reset to Global</button>`}
      <button class="btn-sm wf-push" type="button" id="rc-wf-push">↑ Push to Global</button>
    </div>`;
  }

  function rerender() {
    const els = resolvedElements();
    el.querySelector('.rc-badge-wrap').innerHTML = badgeHtml();
    el.querySelector('.rc-list').innerHTML = els.map((e, i) => card(e, i)).join('');
  }

  el.innerHTML = `
    <p style="color:var(--muted);font-size:12px;margin:0 0 10px">
      Elements on the LED wall (display 2) response card. Decision and Response 1–3 text come from the Response Card item in your deck; everything else is set here. Empty font/size/colour inherit your scheme's prop fonts.
    </p>
    <div class="rc-badge-wrap"></div>
    <div class="rc-list"></div>
    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <button class="btn-sm" id="rc-add-btn">+ Add Element</button>
    </div>
  `;
  rerender();

  // Text/name/number/colour inputs — update in place (no re-render, keep focus)
  el.addEventListener('input', e => {
    const t = e.target;
    if (!t.classList.contains('rc-inp')) return;
    const idx = parseInt(t.dataset.idx, 10); const fld = t.dataset.fld;
    const s = fork(); if (isNaN(idx) || !s?.rcElements?.[idx] || !fld) return;
    if (['x', 'y', 'w', 'h', 'size'].includes(fld)) s.rcElements[idx][fld] = parseInt(t.value, 10) || 0;
    else if (fld === 'color') s.rcElements[idx].color = t.value.trim() ? '#' + t.value.replace(/^#/, '') : '';
    else s.rcElements[idx][fld] = t.value;
    saveState();
    el.querySelector('.rc-badge-wrap').innerHTML = badgeHtml();
  });

  // Font family/weight selects + align/add/remove — re-render
  el.addEventListener('change', e => {
    const t = e.target;
    if (!t.classList.contains('rc-sel')) return;
    const idx = parseInt(t.dataset.idx, 10); const s = fork();
    if (isNaN(idx) || !s?.rcElements?.[idx]) return;
    if (t.dataset.fld === 'fontFamily') {
      const fam = t.value;
      s.rcElements[idx].font = fam ? ((_fontFamilyMap?.[fam]?.[0]?.postscript) || fam) : '';
    } else if (t.dataset.fld === 'fontWeight') {
      s.rcElements[idx].font = t.value;
    }
    saveState(); rerender();
  });

  el.addEventListener('click', e => {
    const align = e.target.closest('.rc-align button');
    if (align) {
      const idx = parseInt(align.dataset.idx, 10); const s = fork();
      if (!isNaN(idx) && s?.rcElements?.[idx]) { s.rcElements[idx].align = align.dataset.align; saveState(); rerender(); }
      return;
    }
    if (e.target.classList.contains('rc-el-del')) {
      const idx = parseInt(e.target.dataset.idx, 10); const s = fork();
      if (!isNaN(idx) && s?.rcElements) { s.rcElements.splice(idx, 1); saveState(); rerender(); }
      return;
    }
    if (e.target.id === 'rc-add-btn') {
      const s = fork(); if (!s) return;
      s.rcElements.push({ id: uid(), role: 'custom', name: `Custom ${s.rcElements.filter(x => x.role === 'custom').length + 1}`, text: '', x: 400, y: 1080, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' });
      saveState(); rerender();
      return;
    }
    if (e.target.id === 'rc-wf-reset') {
      const s = getScheme(); if (!s) return;
      s.rcElements = null;
      saveState(); rerender();
      return;
    }
    if (e.target.id === 'rc-wf-push') {
      const els = deepClone(resolvedElements());
      state.globalRcElements = els;
      saveState(); rerender();
      toast('success', 'Pushed to Global', 'Every style inheriting Response Card elements will now use this.');
    }
  });
}

// Renders one "single macro assignment" field (label + value + Pick/Change
// button) into `container`, bound to state.config[key]. Used for QR Macro,
// Gradient, and Gradient (QR code version) — all deck-wide, not per-scheme,
// since these are unique real-world macros, not visual style. Multiple
// fields can share one container; each is scoped by `key`.
function renderSingleMacroField(container, key, label, hint) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  wrap.innerHTML = `
    <label>${esc(label)}</label>
    ${hint ? `<p class="style-group-hint">${hint}</p>` : ''}
    <div class="qr-macro-row" style="display:flex;align-items:center;gap:8px">
      <div class="${key}-val" style="display:flex;align-items:center;gap:6px;flex:1"></div>
      <button class="btn-sm" data-pick="${key}" type="button">Pick Macro</button>
    </div>
  `;
  container.appendChild(wrap);

  function rerender() {
    const m = state.config[key] || null;
    const dot = m && m.color
      ? `<span class="cm-dot" style="background:${m.color}"></span>`
      : `<span class="cm-dot cm-dot-default"></span>`;
    wrap.querySelector(`.${key}-val`).innerHTML = m
      ? `${dot}<span class="override-macro-name">${esc(m.name)}</span><code class="cm-uuid-ro">${esc(m.uuid || '')}</code>
         <button class="btn-custom-del" data-clear="${key}" title="Remove">×</button>`
      : `<span class="cm-empty" style="margin:0">No macro selected.</span>`;
    wrap.querySelector(`[data-pick="${key}"]`).textContent = m ? 'Change' : 'Pick Macro';
  }
  rerender();

  wrap.querySelector(`[data-pick="${key}"]`).addEventListener('click', () => {
    showMacroPicker((selected) => {
      if (selected.length) {
        const { name, uuid, color } = selected[0];
        state.config[key] = { name, uuid, color };
        saveState();
        rerender();
      }
    }, true);
  });

  wrap.addEventListener('click', (e) => {
    if (e.target.dataset.clear === key) {
      state.config[key] = null;
      saveState();
      rerender();
    }
  });
}

// QR Code tab: two deck-wide macro assignments — the QR Code macro itself
// (fires on blank-before cues with QR on) and a matching Gradient macro used
// on content cues instead of the normal one, whenever this export's QR
// toggle is on (see the Gradient field on the Macros tab for the non-QR one).
function attachSchemesQRTab(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  renderSingleMacroField(el, 'qrMacro', 'QR Macro',
    'QR Code is a macro, not an image DeckPro draws. Pick which macro fires on any blank slide with QR turned on — see the QR toggle next to "Blank slide before this one" on scripture/point/image slides, the QR Stop marker in the deck sidebar, and this deck\'s own QR toggle (Decks → edit this deck).');
  renderSingleMacroField(el, 'gradientMacroQr', 'Gradient (QR code version)',
    'Fires on Scripture, Point, and Response Card content cues instead of the normal Gradient macro (Macros tab), whenever this export\'s QR toggle is on — for a background treatment that matches the QR-configured look.');
}

function renderConfigPanel(panel) {
  const cfg = state.config;

  panel.innerHTML = `
    <div class="slide-form">
      <h2>
        Preferences
      </h2>

      <div class="settings-section">
        <h3>Deck Library</h3>
        <div class="settings-row">
          <label>Location</label>
          <div class="folder-row" style="flex:1">
            <input type="text" id="cfg-library-dir" value="" readonly placeholder="Loading…">
            <button class="btn-browse" id="btn-library-browse">Change…</button>
            <button class="btn-browse" id="btn-library-reset">Default</button>
          </div>
        </div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.5">
          Decks live in a local database with daily backups. Point the location at an iCloud Drive, Dropbox, or shared folder to use the same library on multiple computers — DeckPro joins an existing library if it finds one there.
        </div>
      </div>

      <div class="settings-section">
        <h3>iCloud Sync</h3>
        <div class="rc-toggle-row" id="sync-toggle-row">
          <div class="toggle ${cfg.icloudSync === true ? 'on' : ''}" id="sync-toggle"></div>
          <span>Sync portable settings with iCloud</span>
        </div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.5">
          Keeps your <strong>styles</strong> and preferences (display names, feature visibility, Bible defaults, book names, speakers, response card, queue format) in step across your Macs via iCloud Drive. Machine-specific settings — Pro7 paths &amp; password, export folder, API keys, theme — and the current draft stay on this computer.
        </div>
        <div class="sync-status" id="sync-status" style="margin-top:8px"></div>
      </div>

      <div class="settings-section">
        <h3>Display Names</h3>
        <p style="color:var(--muted);font-size:12px;margin:0 0 10px">
          Rename outputs to match your setup — these labels appear throughout the app.
        </p>
        <div class="settings-row" style="margin-bottom:8px;align-items:center">
          <label style="min-width:100px;font-size:13px;color:var(--muted)">Display 1</label>
          <input type="text" id="cfg-dn-mainScreen" value="${esc((cfg.displayNames || {}).mainScreen || 'Main Screen')}" placeholder="Main Screen" style="flex:1">
        </div>
        <div class="settings-row" style="margin-bottom:8px;align-items:center">
          <label style="min-width:100px;font-size:13px;color:var(--muted)">Display 2</label>
          <input type="text" id="cfg-dn-ledWall" value="${esc((cfg.displayNames || {}).ledWall || 'LED Wall')}" placeholder="LED Wall" style="flex:1">
        </div>
        <div class="settings-row" style="align-items:center">
          <label style="min-width:100px;font-size:13px;color:var(--muted)">Display 3</label>
          <input type="text" id="cfg-dn-monitor" value="${esc((cfg.displayNames || {}).monitor || 'Confidence Monitor')}" placeholder="Confidence Monitor" style="flex:1">
        </div>
      </div>

      <div class="settings-section">
        <h3>Speakers</h3>
        <p style="color:var(--muted);font-size:12px;margin:0 0 10px">
          Recurring speakers offered in the New Deck dropdown. New names can be added there too.
        </p>
        <div id="speakers-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          ${(cfg.speakers || []).length
            ? (cfg.speakers || []).map(s => `
                <span class="speaker-chip" style="display:inline-flex;align-items:center;gap:6px;background:var(--panel-2,#2a2a2a);border:1px solid var(--border,#444);border-radius:14px;padding:3px 6px 3px 10px;font-size:12.5px">
                  ${esc(s)}
                  <button class="speaker-chip-x" data-speaker="${esc(s)}" title="Remove" style="border:none;background:none;color:var(--muted);cursor:pointer;font-size:14px;line-height:1;padding:0 2px">×</button>
                </span>`).join('')
            : '<span style="color:var(--muted);font-size:12px">No permanent speakers yet.</span>'}
        </div>
        <div class="settings-row" style="align-items:center">
          <input type="text" id="cfg-speaker-add" placeholder="Add a speaker…" style="flex:1" spellcheck="true">
          <button class="btn-browse" id="btn-speaker-add">Add</button>
        </div>
      </div>

      <div class="settings-section">
        <h3 data-tip-key="queue">Queue</h3>
        <div class="field" style="margin-bottom:0">
          <label data-tip-key="queue-format">Upcoming-slide format</label>
          <select id="cfg-queue-mode" style="flex:1">
            <option value="ref"${(cfg.queueMode || 'ref') === 'ref' ? ' selected' : ''}>Next Reference Only — e.g. "Ephesians 5:18"</option>
            <option value="refPhrase"${cfg.queueMode === 'refPhrase' ? ' selected' : ''}>Next Reference + First Phrase</option>
            <option value="list"${cfg.queueMode === 'list' ? ' selected' : ''}>Full List</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h3>Pro7 Connection</h3>
        <div class="pro7-conn-row">
          <div class="field" style="flex:0 0 110px;margin-bottom:0">
            <label>Port</label>
            <input type="number" id="cfg-pro7port" value="${cfg.pro7Port || 1025}" min="1" max="65535" style="width:100%">
          </div>
          <div class="field" style="flex:1;margin-bottom:0">
            <label>Password (if set)</label>
            <input type="password" id="cfg-pro7password" value="${esc(cfg.pro7Password || '')}" placeholder="leave blank if none" style="width:100%">
          </div>
          <button class="btn-sm" id="btn-pro7-connect" style="align-self:flex-end;margin-bottom:0">Check</button>
        </div>
        <div id="pro7-connect-status" class="pro7-connect-status ${pro7rt.connected ? 'ok' : 'err'}">
          ${pro7rt.connected
            ? `Connected${pro7rt.version ? ' — ' + esc(pro7rt.version) : ''}`
            : 'Not connected — check Pro7 is running and Network API is enabled in preferences'}
        </div>
        <div class="settings-row" style="margin-top:12px;align-items:center">
          <label style="min-width:110px">Pro7 Folder</label>
          <div class="folder-row" style="flex:1">
            <input type="text" id="cfg-pro7-root" value="${esc(cfg.pro7RootFolder || '')}" readonly placeholder="Auto-detect" style="flex:1;min-width:0">
            <button class="btn-browse" id="btn-pro7-root-browse">Browse…</button>
            ${cfg.pro7RootFolder ? `<button class="btn-browse" id="btn-pro7-root-clear">Clear</button>` : ''}
          </div>
        </div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:4px;line-height:1.5;margin-bottom:10px">
          Pick the folder that contains <strong>Configuration</strong> and <strong>Libraries</strong> — often <code>Documents/ProPresenter</code>.
        </div>
        <div class="settings-row" style="margin-top:8px;align-items:center">
          <label style="min-width:110px">Export Library</label>
          <div class="folder-row" style="flex:1">
            <select id="cfg-pro7-library" style="flex:1;min-width:0">
              <option value="">${cfg.pro7RootFolder ? 'Loading libraries...' : 'Choose Pro7 Folder first'}</option>
            </select>
            <button class="btn-browse" id="btn-pro7-library-browse">Browse…</button>
            ${cfg.pro7LibraryFolder ? `<button class="btn-browse" id="btn-pro7-library-clear">Clear</button>` : ''}
          </div>
        </div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:4px;line-height:1.5;margin-bottom:10px">
          Choose where DeckPro saves new .pro files. Auto-select follows Pro7's active library.
        </div>
        <div class="rc-toggle-row" id="automanage-row">
          <div class="toggle ${cfg.autoManagePro7 === true ? 'on' : ''}" id="automanage-toggle"></div>
          <span>Auto-manage ProPresenter on export</span>
        </div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.5">
          When on, exporting will quit ProPresenter if it's open, write your deck and props, then relaunch it — so you never have to close it by hand. Turn off to be warned instead.
        </div>
      </div>

      <div class="settings-section">
        <h3>QR Export</h3>
        <div class="rc-toggle-row" id="qr-export-pair-row">
          <div class="toggle ${cfg.qrExportPair === true ? 'on' : ''}" id="qr-export-pair-toggle"></div>
          <span>Export both versions when QR is on</span>
        </div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.5">
          When the deck's QR toggle is on, Export delivers two presentations to Pro7 — one without QR and one with — both sharing the same prop collection, instead of just the QR version. Handy for a Saturday/Sunday pair with identical content. Both files get a sequential <code>_v1</code>/<code>_v2</code> suffix.
        </div>
      </div>

      <details class="settings-disclosure">
        <summary class="settings-disclosure-summary" data-tip-key="feature-visibility">Feature Visibility</summary>
        <div class="settings-disclosure-body">
          <p style="color:var(--muted);font-size:12px;margin:0 0 12px">
            Hide advanced fields for simpler handoffs to other users. Hiding a field doesn't change what's exported.
          </p>
          ${(() => {
            const F = cfg.features || DEFAULT_FEATURES();
            const sections = [
              ['Slide fields', [
                ['blankBefore',          'Blank slide before toggle'],
                ['confidenceMonitor',    `${dn('monitor')} text fields`],
                ['propName',             'Prop name fields'],
              ]],
              ['Overrides', [
                ['overrides',            'Overrides section (per slide)'],
                ['transitionOverride',   'Main transition override'],
                ['propTransitionOverride','Prop transition override'],
              ]],
              ['Scripture tools', [
                ['bodyTools',            'Fit Width / Strip buttons'],
                ['verseFormatting',      'Verses (Bible formatting) button'],
              ]],
            ];
            return sections.map(([title, rows]) => `
              <div class="feature-vis-group">
                <div class="feature-vis-title">${esc(title)}</div>
                ${rows.map(([key, lbl]) => `
                  <div class="feature-toggle-row" data-feature="${key}">
                    <div class="toggle ${F[key] ? 'on' : ''}" id="ft-${key}"></div>
                    <label>${esc(lbl)}</label>
                  </div>
                `).join('')}
              </div>
            `).join('');
          })()}
        </div>
      </details>

      <div class="settings-section">
        <h3>Bible Lookup (API.Bible)</h3>
        <p style="color:var(--muted);font-size:12px;margin:0 0 10px">
          Get a free API key at <strong>api.bible</strong>. Paste it below, then click Fetch to load your available translations.
        </p>
        <div class="field" style="margin-bottom:8px">
          <label>API Key</label>
          <div style="display:flex;gap:6px">
            <input type="password" id="cfg-bible-key" value="${esc(cfg.bibleApiKey || '')}" placeholder="Paste your api.bible key" spellcheck="false" autocomplete="off" style="flex:1">
            <button class="btn-sm" id="btn-bible-fetch">Fetch</button>
          </div>
        </div>
        <div class="field" style="margin-bottom:4px">
          <label>Default Translation</label>
          <select id="cfg-bible-id" style="width:100%">
            ${(cfg.bibleList || []).length
              ? (cfg.bibleList.map(b =>
                  `<option value="${esc(b.id)}" ${b.id === cfg.bibleId ? 'selected' : ''}>${esc(b.name)} (${esc(b.abbreviation)})</option>`
                ).join(''))
              : (cfg.bibleId
                  ? `<option value="${esc(cfg.bibleId)}">${esc(cfg.bibleName || cfg.bibleId)}</option>`
                  : `<option value="">— paste key and click Fetch —</option>`)}
          </select>
        </div>
        ${(cfg.bibleList || []).length ? `
          <div class="bible-list-note">${cfg.bibleList.length} translation${cfg.bibleList.length !== 1 ? 's' : ''} available on your account</div>
        ` : ''}
      </div>

      <div class="settings-section">
        <h3>Book Names</h3>
        <p style="color:var(--muted);font-size:12px;margin:0 0 10px">
          Choose how ambiguous book names appear in the title. Applied at export — changing the setting retroactively updates all slides.
        </p>
        ${BOOK_NAME_OPTIONS.map(({ key, label, choices }) => {
          const cur = (cfg.bookNames || {})[key] || '';
          return `
            <div class="settings-row" style="margin-bottom:8px;align-items:center">
              <label style="min-width:160px;font-size:13px">${esc(label)}</label>
              <select class="bookname-select" data-key="${esc(key)}" style="flex:1">
                <option value="">As typed</option>
                ${choices.map(c => `<option value="${esc(c)}" ${cur === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
              </select>
            </div>
          `;
        }).join('')}
        <div class="rc-toggle-row" id="capitalize-pronouns-row" style="margin-top:10px">
          <div class="toggle ${cfg.capitalizeDivinePronouns === true ? 'on' : ''}" id="capitalize-pronouns-toggle"></div>
          <span>Capitalize divine pronouns on Scripture lookup (He, Him, His, Himself)</span>
        </div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.5">
          When on, verses you look up get He/Him/His/Himself capitalized right in the editor — visible, so you can lowercase any that refer to someone other than God (e.g. Mark 1:40, where the man with leprosy says "he said"). No translation on your key does this automatically, and no rule can tell a divine "he" from a human one, so the caps are yours to review. Whole-word only — "this" and "history" are untouched.
        </div>
        <button class="btn-sm" id="btn-divine-caps-deck" style="margin-top:10px">Capitalize divine pronouns in this deck now</button>
        <div style="font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.5">
          Applies the same capitalization to every body field already in this deck — handy for text you typed or pasted rather than looked up. Run it once, then fix any exceptions by hand.
        </div>
      </div>

    </div>
  `;

  // Deck Library location
  (async () => {
    if (!_libStatus) _libStatus = await libApi('/api/library/status');
    const inp = document.getElementById('cfg-library-dir');
    if (inp && _libStatus?.libraryDir) inp.value = _libStatus.libraryDir;
  })();
  document.getElementById('btn-library-browse')?.addEventListener('click', async () => {
    try {
      const res  = await fetch('/api/browse-folder');
      const data = await res.json();
      if (!data.ok || !data.folder) return;
      const r = await libApi('/api/library/location', { method: 'POST', body: { folder: data.folder } });
      if (r.ok) {
        _libStatus = await libApi('/api/library/status');
        const inp = document.getElementById('cfg-library-dir');
        if (inp) inp.value = r.libraryDir;
        await refreshLibCache();
        renderDecksList();
        toast('success', r.adopted ? 'Joined existing library' : 'Library moved', r.libraryDir);
      } else {
        toast('error', 'Could not change library location', r.error || '');
      }
    } catch (e) {
      toast('error', 'Could not change library location', e.message || 'Unexpected error');
    }
  });
  document.getElementById('btn-library-reset')?.addEventListener('click', async () => {
    const r = await libApi('/api/library/location', { method: 'POST', body: { reset: true } });
    if (r.ok) {
      _libStatus = await libApi('/api/library/status');
      const inp = document.getElementById('cfg-library-dir');
      if (inp) inp.value = r.libraryDir;
      await refreshLibCache();
      renderDecksList();
      toast('success', 'Library reset to default location', r.libraryDir);
    }
  });

  // iCloud sync toggle
  const syncToggle = document.getElementById('sync-toggle');
  if (syncToggle) {
    syncToggle.addEventListener('click', () => {
      const on = !state.config.icloudSync;
      syncToggle.classList.toggle('on', on);
      setSyncEnabled(on);
    });
  }
  updateSyncStatusUI();

  // Pro7 root folder
  document.getElementById('btn-pro7-root-browse')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/browse-folder');
      const data = await res.json();
      if (!data.ok || !data.folder) return;
      cfg.pro7RootFolder = normalizePro7RootFolder(data.folder);
      if (!libraryBelongsToRoot(cfg.pro7LibraryFolder, cfg.pro7RootFolder)) cfg.pro7LibraryFolder = '';
      saveState();
      const inp = document.getElementById('cfg-pro7-root');
      if (inp) inp.value = cfg.pro7RootFolder;
      renderConfigPanel(document.getElementById('main-panel'));
    } catch (e) {
      toast('error', 'Could not select folder', e.message || '');
    }
  });
  document.getElementById('btn-pro7-root-clear')?.addEventListener('click', () => {
    cfg.pro7RootFolder = '';
    cfg.pro7LibraryFolder = '';
    saveState();
    renderConfigPanel(document.getElementById('main-panel'));
  });

  // Pro7 export library
  loadPro7LibrarySelect(document.getElementById('cfg-pro7-library'), cfg, cfg.pro7RootFolder);
  document.getElementById('cfg-pro7-library')?.addEventListener('change', e => {
    cfg.pro7LibraryFolder = e.target.value;
    saveState();
  });
  document.getElementById('btn-pro7-library-browse')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/browse-folder');
      const data = await res.json();
      if (!data.ok || !data.folder) return;
      cfg.pro7LibraryFolder = data.folder;
      saveState();
      renderConfigPanel(document.getElementById('main-panel'));
    } catch (e) {
      toast('error', 'Could not select folder', e.message || '');
    }
  });
  document.getElementById('btn-pro7-library-clear')?.addEventListener('click', () => {
    cfg.pro7LibraryFolder = '';
    saveState();
    renderConfigPanel(document.getElementById('main-panel'));
  });

  // Pro7 port + password
  document.getElementById('cfg-pro7port').addEventListener('change', e => {
    cfg.pro7Port = parseInt(e.target.value, 10) || 1025;
    saveState();
  });
  document.getElementById('cfg-queue-mode')?.addEventListener('change', e => {
    cfg.queueMode = e.target.value;
    saveState();
  });
  document.getElementById('cfg-pro7password').addEventListener('input', e => {
    cfg.pro7Password = e.target.value;
    saveState();
  });

  // Auto-manage ProPresenter on export
  document.getElementById('automanage-row')?.addEventListener('click', () => {
    cfg.autoManagePro7 = cfg.autoManagePro7 !== true;
    document.getElementById('automanage-toggle').classList.toggle('on', cfg.autoManagePro7);
    saveState();
    // Prompt for Accessibility permission right when this feature is turned
    // on (it's what dismissPro7QuitDialog needs) — asking now, at a moment
    // that clearly explains why, beats waiting for a real quit to silently
    // fail because permission was never granted.
    if (cfg.autoManagePro7) fetch('/api/request-accessibility', { method: 'POST' }).catch(() => {});
  });

  // QR pair export
  document.getElementById('qr-export-pair-row')?.addEventListener('click', () => {
    cfg.qrExportPair = cfg.qrExportPair !== true;
    document.getElementById('qr-export-pair-toggle').classList.toggle('on', cfg.qrExportPair);
    saveState();
  });

  // Pro7 connect check
  document.getElementById('btn-pro7-connect').addEventListener('click', async () => {
    const btn = document.getElementById('btn-pro7-connect');
    btn.disabled = true; btn.textContent = '…';
    await checkPro7(false);
    btn.disabled = false; btn.textContent = 'Check';
  });

  // Feature visibility toggles
  document.querySelectorAll('.feature-toggle-row').forEach(row => {
    row.addEventListener('click', () => {
      if (!cfg.features) cfg.features = DEFAULT_FEATURES();
      const key = row.dataset.feature;
      cfg.features[key] = !cfg.features[key];
      row.querySelector('.toggle').classList.toggle('on', cfg.features[key]);
      saveState();
    });
  });

  // Custom macros
  // macros moved to Schemes → Macros tab (per-scheme)

  // Display names
  ['mainScreen', 'ledWall', 'monitor'].forEach(key => {
    const defaults = { mainScreen: 'Main Screen', ledWall: 'LED Wall', monitor: 'Confidence Monitor' };
    document.getElementById(`cfg-dn-${key}`)?.addEventListener('input', e => {
      if (!cfg.displayNames) cfg.displayNames = { ...defaults };
      cfg.displayNames[key] = e.target.value.trim() || defaults[key];
      saveState();
    });
  });

  // Permanent speakers
  const addSpeaker = () => {
    const inp = document.getElementById('cfg-speaker-add');
    const name = (inp?.value || '').trim();
    if (!name) return;
    if (!Array.isArray(cfg.speakers)) cfg.speakers = [];
    if (!cfg.speakers.some(s => s.toLowerCase() === name.toLowerCase())) {
      cfg.speakers.push(name);
      cfg.speakers.sort((a, b) => a.localeCompare(b));
      saveState();
    }
    renderConfigPanel(document.getElementById('main-panel'));
  };
  document.getElementById('btn-speaker-add')?.addEventListener('click', addSpeaker);
  document.getElementById('cfg-speaker-add')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addSpeaker(); }
  });
  document.querySelectorAll('.speaker-chip-x').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.speaker;
      cfg.speakers = (cfg.speakers || []).filter(s => s !== name);
      saveState();
      renderConfigPanel(document.getElementById('main-panel'));
    });
  });

  // Bible API key
  document.getElementById('cfg-bible-key').addEventListener('input', e => {
    cfg.bibleApiKey = e.target.value.trim();
    saveState();
  });

  // Bible translation select
  document.getElementById('cfg-bible-id').addEventListener('change', e => {
    const sel = e.target;
    cfg.bibleId   = sel.value;
    cfg.bibleName = sel.options[sel.selectedIndex]?.text || '';
    saveState();
  });

  // Fetch available Bibles from API.Bible
  document.getElementById('btn-bible-fetch').addEventListener('click', async () => {
    const btn = document.getElementById('btn-bible-fetch');
    const key = document.getElementById('cfg-bible-key').value.trim();
    if (!key) { toast('error', 'No API key', 'Enter your api.bible key first'); return; }
    btn.disabled = true; btn.textContent = '…';
    try {
      const res  = await fetch(`/api/bible/bibles?apiKey=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (!data.ok) { toast('error', 'Failed', data.error || 'Could not fetch Bibles'); return; }
      cfg.bibleList   = data.bibles.map(b => ({
        id:           b.id,
        name:         b.nameLocal || b.name,
        abbreviation: b.abbreviationLocal || b.abbreviation,
      }));
      cfg.bibleApiKey = key;
      if (!cfg.bibleId && cfg.bibleList.length) {
        cfg.bibleId   = cfg.bibleList[0].id;
        cfg.bibleName = cfg.bibleList[0].name;
      }
      saveState();
      // Re-render settings to show populated list
      renderConfigPanel(document.getElementById('main-panel'));
      toast('success', `${data.bibles.length} translation${data.bibles.length !== 1 ? 's' : ''} loaded`, 'Pick your default below');
    } catch (err) {
      toast('error', 'Network error', err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Fetch Bibles';
    }
  });

  // Book name overrides
  document.querySelectorAll('.bookname-select').forEach(sel => {
    sel.addEventListener('change', e => {
      if (!cfg.bookNames) cfg.bookNames = {};
      const key = e.target.dataset.key;
      const val = e.target.value;
      if (val) cfg.bookNames[key] = val;
      else delete cfg.bookNames[key];
      saveState();
    });
  });

  // Capitalize divine pronouns
  document.getElementById('capitalize-pronouns-row')?.addEventListener('click', () => {
    cfg.capitalizeDivinePronouns = cfg.capitalizeDivinePronouns !== true;
    document.getElementById('capitalize-pronouns-toggle').classList.toggle('on', cfg.capitalizeDivinePronouns);
    saveState();
  });
  document.getElementById('btn-divine-caps-deck')?.addEventListener('click', () => applyDivineCapsToDeck());
}

// ─── Machine Setup / Onboarding ──────────────────────────────────────────────

function maybeShowMachineSetup() {
  if (state.config.setupComplete === true) return;
  setTimeout(() => showMachineSetup(false), 350);
}

function normalizePro7RootFolder(folder) {
  if (!folder) return '';
  const parts = String(folder).replace(/\/+$/, '').split('/');
  const last = parts[parts.length - 1];
  if (last === 'Props' && parts[parts.length - 2] === 'Configuration') parts.splice(parts.length - 2, 2);
  else if (last === 'Configuration' || last === 'Libraries') parts.pop();
  return parts.join('/') || '/';
}

function pathBaseName(p) {
  const parts = String(p || '').replace(/\/+$/, '').split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

function libraryBelongsToRoot(libraryPath, rootPath) {
  if (!libraryPath || !rootPath) return true;
  const root = normalizePro7RootFolder(rootPath).replace(/\/+$/, '');
  return String(libraryPath).startsWith(`${root}/Libraries/`);
}

function setupStatusPill(ok, text) {
  return `<span class="setup-pill ${ok ? 'ok' : 'warn'}">${esc(text)}</span>`;
}

async function fetchSetupScan() {
  const res = await fetch('/api/setup/doctor');
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Scan failed');
  return data;
}

function setupCandidateScore(c) {
  let score = 0;
  if (c.propsConfigExists) score += 50;
  if ((c.libraries || []).length) score += 30;
  if (c.root === 'Documents') score += 15;
  if (c.root === 'UserWorkspaces') score += 10;
  return score;
}

function bestPro7Candidate(data) {
  const candidates = (data.pro7?.candidates || []).filter(c => c.exists);
  return candidates.sort((a, b) => setupCandidateScore(b) - setupCandidateScore(a))[0] || null;
}

function setupScanHTML(data, cfg) {
  const candidates = (data.pro7?.candidates || []).filter(c => c.exists);
  const saved = data.pro7?.savedFolderStatus;
  const tick  = ok  => `<span class="dr-${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'}</span>`;
  const warn  = msg => `<span class="dr-warn">⚠ ${esc(msg)}</span>`;

  const rows = [
    { label: 'DeckPro data',   value: esc(data.deckpro?.dataDir || '—') },
    { label: 'State file',     value: data.deckpro?.stateFileExists ? tick(true) + ' saved' : tick(false) + ' not written yet' },
    { label: 'Deck library',   value: esc(data.deckpro?.libraryDir || '—') },
  ];

  if (saved) {
    rows.push({ label: 'Saved Pro7 folder', value: saved.ready
      ? tick(true) + ' ' + esc(cfg.pro7RootFolder || '')
      : tick(false) + ' ' + warn(saved.reason || 'Invalid') + ' ' + esc(cfg.pro7RootFolder || '') });
    rows.push({ label: 'Configuration/Props', value: saved.propsExists ? tick(true) + ' found' : tick(false) + ' missing' });
  }

  const cRows = candidates.slice(0, 6).map(c => {
    const libs = (c.libraries || []).join(', ') || '—';
    return `<div class="dr-candidate">${tick(c.propsConfigExists)} <span class="dr-path">${esc(c.path)}</span>`
      + `<span class="dr-meta">${esc(libs)}${c.propsConfigExists ? ' · Props ready' : ''}</span></div>`;
  }).join('');

  return `<div class="setup-doctor">`
    + rows.map(r => `<div class="dr-row"><span class="dr-lbl">${esc(r.label)}</span><span class="dr-val">${r.value}</span></div>`).join('')
    + (candidates.length ? `<div class="dr-section">Pro7 folders found (${candidates.length})</div>${cRows}` : `<div class="dr-section">No Pro7 folders found</div>`)
    + `</div>`;
}

function pro7CandidateForRoot(data, rootPath) {
  const candidates = (data.pro7?.candidates || []).filter(c => c.exists);
  const root = normalizePro7RootFolder(rootPath);
  if (root) {
    const match = candidates.find(c => normalizePro7RootFolder(c.path) === root);
    return match || null;
  }
  return bestPro7Candidate(data);
}

function pro7LibraryOptionsForScan(data, rootPath) {
  const candidate = pro7CandidateForRoot(data, rootPath);
  if (!candidate) return [];
  if (Array.isArray(candidate.libraryOptions) && candidate.libraryOptions.length) {
    return candidate.libraryOptions.map(lib => ({
      name: lib.name || pathBaseName(lib.path),
      path: lib.path,
      active: !!lib.active,
    })).filter(lib => lib.path);
  }
  return (candidate.libraries || []).map(name => ({
    name,
    path: `${candidate.librariesDir}/${name}`,
    active: candidate.activeLibrary === `${candidate.librariesDir}/${name}`,
  })).filter(lib => lib.path);
}

function fillPro7LibrarySelect(select, cfg, data, rootPath) {
  if (!select) return;
  const root = normalizePro7RootFolder(rootPath || cfg.pro7RootFolder || '');
  if (!root) {
    select.innerHTML = '<option value="">Choose Pro7 Folder first</option>';
    select.disabled = true;
    return;
  }

  const options = pro7LibraryOptionsForScan(data, root);
  const selected = cfg.pro7LibraryFolder || '';
  const active = options.find(o => o.active);
  const autoLabel = active ? `Auto-select (${active.name})` : 'Auto-select active library';
  const knownSelected = selected && options.some(o => o.path === selected);

  const rows = [
    `<option value="">${esc(autoLabel)}</option>`,
    ...options.map(o => `<option value="${esc(o.path)}"${selected === o.path ? ' selected' : ''}>${esc(o.name)}${o.active ? ' (active)' : ''}</option>`),
  ];
  if (selected && !knownSelected) {
    rows.push(`<option value="${esc(selected)}" selected>${esc(pathBaseName(selected) || selected)} (manual)</option>`);
  }

  select.innerHTML = rows.join('');
  select.disabled = false;
  select.value = selected && (knownSelected || selected) ? selected : '';
}

async function loadPro7LibrarySelect(select, cfg, rootPath) {
  if (!select) return;
  if (!normalizePro7RootFolder(rootPath || cfg.pro7RootFolder || '')) {
    fillPro7LibrarySelect(select, cfg, { pro7: { candidates: [] } }, rootPath);
    return;
  }
  select.innerHTML = '<option value="">Loading libraries...</option>';
  select.disabled = true;
  try {
    fillPro7LibrarySelect(select, cfg, await fetchSetupScan(), rootPath);
  } catch (_) {
    select.innerHTML = cfg.pro7LibraryFolder
      ? `<option value="${esc(cfg.pro7LibraryFolder)}">${esc(pathBaseName(cfg.pro7LibraryFolder) || cfg.pro7LibraryFolder)}</option>`
      : '<option value="">Could not scan libraries</option>';
    select.disabled = !cfg.pro7LibraryFolder;
  }
}

async function showMachineSetup(force = false) {
  if (!force && state.config.setupComplete === true) return;
  document.querySelector('.setup-overlay')?.remove();
  const cfg = state.config;
  const scheme = activeStyleScheme();
  const macroCount = (scheme?.macros || []).length;
  const stageCount = (scheme?.stageDisplays || []).length;
  const bibleReady = !!(cfg.bibleApiKey && cfg.bibleId);
  const pro7Ready = !!pro7rt.connected;

  // Validate the saved Pro7 folder path via the server (disk existence check).
  // Start with an optimistic state while the scan loads.
  let folderValidation = null; // null = not yet checked
  let rootReady = !!cfg.pro7RootFolder;
  let rootPillText = rootReady ? 'Ready' : 'Auto-detect';
  // Kick off the scan asynchronously — the pill will update after the modal renders.
  let _scanDataPromise = null;
  if (cfg.pro7RootFolder) {
    _scanDataPromise = fetchSetupScan().then(data => {
      folderValidation = data.pro7?.savedFolderStatus || null;
    }).catch(() => { folderValidation = null; });
  }
  const overlay = document.createElement('div');
  overlay.className = 'setup-overlay';
  overlay.innerHTML = `
    <div class="setup-modal">
      <div class="setup-header">
        <div>
          <div class="setup-title">Machine Setup</div>
          <div class="setup-sub">One-time setup for this computer: Pro7 connection, Bible lookup, library path, macros, and stage layouts.</div>
        </div>
        <button class="setup-close" id="setup-close">×</button>
      </div>
      <div class="setup-body">
        <section class="setup-card">
          <div class="setup-card-head">
            <span>Pro7 Connection</span>
            ${setupStatusPill(pro7Ready, pro7Ready ? 'Connected' : 'Needs check')}
          </div>
          <div class="setup-grid-2">
            <label>Port<input type="number" id="setup-pro7-port" value="${cfg.pro7Port || 1025}" min="1" max="65535"></label>
            <label>Password<input type="password" id="setup-pro7-password" value="${esc(cfg.pro7Password || '')}" placeholder="blank if none"></label>
          </div>
          <button class="btn-sm setup-action" id="setup-check-pro7">Check Pro7</button>
          <p class="setup-note">ProPresenter must be open with Network API enabled.</p>
        </section>

        <section class="setup-card">
          <div class="setup-card-head">
            <span>Pro7 Folder</span>
            <span id="setup-root-pill">${setupStatusPill(rootReady, rootPillText)}</span>
          </div>
          <div class="setup-folder">
            <input type="text" id="setup-pro7-root" value="${esc(cfg.pro7RootFolder || '')}" readonly placeholder="Auto-detect">
            ${cfg.pro7RootFolder
              ? `<button class="btn-browse" id="setup-root-clear">Clear</button>`
              : `<button class="btn-browse" id="setup-root-detect">Auto-detect</button>
                 <button class="btn-browse" id="setup-root-browse">Browse…</button>`}
          </div>
          <p class="setup-note">Pick the ProPresenter folder that contains Configuration and Libraries.</p>
          <label class="setup-library-field">Export Library
            <select id="setup-pro7-library" ${rootReady ? '' : 'disabled'}>
              <option value="">${rootReady ? 'Loading libraries...' : 'Choose Pro7 Folder first'}</option>
            </select>
          </label>
          <p class="setup-note">Choose where new DeckPro decks save. Auto-select follows Pro7's active library.</p>
          <div class="setup-folder-tools">
            <button class="btn-sm setup-action" id="setup-show-scan">Details</button>
            <span>Shows what DeckPro found on this machine.</span>
          </div>
          <div class="setup-scan" id="setup-scan" style="display:none"></div>
        </section>

        <section class="setup-card">
          <div class="setup-card-head">
            <span>API.Bible</span>
            ${setupStatusPill(bibleReady, bibleReady ? 'Ready' : 'Needs key')}
          </div>
          <label>API Key<input type="password" id="setup-bible-key" value="${esc(cfg.bibleApiKey || '')}" placeholder="Paste api.bible key"></label>
          <div class="setup-folder">
            <select id="setup-bible-id">
              ${(cfg.bibleList || []).length
                ? cfg.bibleList.map(b => `<option value="${esc(b.id)}" ${b.id === cfg.bibleId ? 'selected' : ''}>${esc(b.name)} (${esc(b.abbreviation)})</option>`).join('')
                : (cfg.bibleId ? `<option value="${esc(cfg.bibleId)}">${esc(cfg.bibleName || cfg.bibleId)}</option>` : `<option value="">Fetch translations first</option>`)}
            </select>
            <button class="btn-sm" id="setup-bible-fetch">Fetch</button>
          </div>
        </section>

        <section class="setup-card">
          <div class="setup-card-head">
            <span>Macros & Stage Displays</span>
            ${setupStatusPill(macroCount + stageCount > 0, `${macroCount} macro${macroCount === 1 ? '' : 's'} · ${stageCount} stage`)}
          </div>
          <div class="setup-actions-row">
            <button class="btn-sm" id="setup-open-macros">Open Macros</button>
            <button class="btn-sm" id="setup-open-stage">Open Stage</button>
          </div>
          <p class="setup-note">Use Pro7's live picker once this computer can connect to Pro7.</p>
        </section>
      </div>
      <div class="setup-footer">
        <button class="btn-browse" id="setup-open-preferences">Open Preferences</button>
        <span></span>
        <button class="btn-browse" id="setup-skip">Skip for now</button>
        <button class="setup-primary" id="setup-done">Done</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  const commitSetupConnection = () => {
    const portInput = overlay.querySelector('#setup-pro7-port');
    const passInput = overlay.querySelector('#setup-pro7-password');
    cfg.pro7Port = parseInt(portInput?.value || '1025', 10) || 1025;
    cfg.pro7Password = passInput?.value || '';
  };
  const finish = () => {
    commitSetupConnection();
    cfg.setupComplete = true;
    saveState();
    close();
    toast('success', 'Machine setup saved', 'You can reopen it from the menu anytime.');
  };
  const reopen = () => { close(); showMachineSetup(true); };

  overlay.querySelector('#setup-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.querySelector('#setup-skip').addEventListener('click', finish);
  overlay.querySelector('#setup-done').addEventListener('click', finish);
  overlay.querySelector('#setup-pro7-port').addEventListener('change', () => { commitSetupConnection(); saveState(); });
  overlay.querySelector('#setup-pro7-password').addEventListener('input', () => { commitSetupConnection(); saveState(); });
  loadPro7LibrarySelect(overlay.querySelector('#setup-pro7-library'), cfg, cfg.pro7RootFolder);

  // After the scan resolves, update the Pro7 Folder pill with the real validation result.
  if (_scanDataPromise) {
    _scanDataPromise.then(() => {
      const pillWrap = overlay.querySelector('#setup-root-pill');
      if (!pillWrap) return;
      if (folderValidation && !folderValidation.ready) {
        pillWrap.innerHTML = setupStatusPill(false, folderValidation.reason || 'Folder not found');
      } else if (folderValidation && folderValidation.ready) {
        pillWrap.innerHTML = setupStatusPill(true, 'Ready');
      }
    });
  }

  overlay.querySelector('#setup-pro7-library')?.addEventListener('change', e => {
    cfg.pro7LibraryFolder = e.target.value;
    saveState();
  });

  overlay.querySelector('#setup-check-pro7').addEventListener('click', async () => {
    commitSetupConnection();
    saveState();
    await checkPro7(false);
    reopen();
  });

  overlay.querySelector('#setup-root-detect')?.addEventListener('click', async () => {
    const btn = overlay.querySelector('#setup-root-detect');
    btn.disabled = true;
    btn.textContent = 'Detecting…';
    try {
      const data = await fetchSetupScan();
      const best = bestPro7Candidate(data);
      if (!best) {
        const box = overlay.querySelector('#setup-scan');
        box.style.display = '';
        box.textContent = setupScanText(data, cfg);
        toast('error', 'No Pro7 folder found', 'Use Browse and pick the ProPresenter folder manually.');
        return;
      }
      cfg.pro7RootFolder = normalizePro7RootFolder(best.path);
      if (!libraryBelongsToRoot(cfg.pro7LibraryFolder, cfg.pro7RootFolder)) cfg.pro7LibraryFolder = '';
      saveState();
      toast('success', 'Pro7 folder detected', cfg.pro7RootFolder);
      reopen();
    } catch (e) {
      toast('error', 'Auto-detect failed', e.message || '');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Auto-detect';
    }
  });

  overlay.querySelector('#setup-root-browse')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/browse-folder');
      const data = await res.json();
      if (!data.ok || !data.folder) return;
      cfg.pro7RootFolder = normalizePro7RootFolder(data.folder);
      if (!libraryBelongsToRoot(cfg.pro7LibraryFolder, cfg.pro7RootFolder)) cfg.pro7LibraryFolder = '';
      saveState();
      reopen();
    } catch (e) {
      toast('error', 'Could not select folder', e.message || '');
    }
  });
  overlay.querySelector('#setup-root-clear')?.addEventListener('click', () => {
    cfg.pro7RootFolder = '';
    cfg.pro7LibraryFolder = '';
    saveState();
    reopen();
  });

  overlay.querySelector('#setup-bible-id').addEventListener('change', e => {
    const sel = e.target;
    cfg.bibleId = sel.value;
    cfg.bibleName = sel.options[sel.selectedIndex]?.text || '';
    saveState();
  });
  overlay.querySelector('#setup-bible-key').addEventListener('input', e => {
    cfg.bibleApiKey = e.target.value.trim();
    saveState();
  });
  overlay.querySelector('#setup-bible-fetch').addEventListener('click', async () => {
    const btn = overlay.querySelector('#setup-bible-fetch');
    const key = overlay.querySelector('#setup-bible-key').value.trim();
    if (!key) { toast('error', 'No API key', 'Enter your api.bible key first'); return; }
    btn.disabled = true; btn.textContent = '…';
    try {
      const res = await fetch(`/api/bible/bibles?apiKey=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (!data.ok) { toast('error', 'Failed', data.error || 'Could not fetch Bibles'); return; }
      cfg.bibleList = data.bibles.map(b => ({
        id: b.id,
        name: b.nameLocal || b.name,
        abbreviation: b.abbreviationLocal || b.abbreviation,
      }));
      cfg.bibleApiKey = key;
      if (!cfg.bibleId && cfg.bibleList.length) {
        cfg.bibleId = cfg.bibleList[0].id;
        cfg.bibleName = cfg.bibleList[0].name;
      }
      saveState();
      toast('success', `${data.bibles.length} translation${data.bibles.length !== 1 ? 's' : ''} loaded`, 'Pick your default translation.');
      reopen();
    } catch (err) {
      toast('error', 'Network error', err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Fetch';
    }
  });

  overlay.querySelector('#setup-open-preferences').addEventListener('click', () => {
    state.activeId = 'settings';
    saveState();
    render();
    close();
  });
  overlay.querySelector('#setup-open-macros').addEventListener('click', () => {
    _styleTab = 'macros';
    state.activeId = 'style';
    saveState();
    render();
    close();
  });
  overlay.querySelector('#setup-open-stage').addEventListener('click', () => {
    _styleTab = 'stage';
    state.activeId = 'style';
    saveState();
    render();
    close();
  });

  overlay.querySelector('#setup-show-scan').addEventListener('click', async () => {
    const box = overlay.querySelector('#setup-scan');
    if (box.style.display !== 'none') {
      box.style.display = 'none';
      return;
    }
    box.style.display = '';
    box.innerHTML = '<div class="dr-scanning">Scanning…</div>';
    try {
      box.innerHTML = setupScanHTML(await fetchSetupScan(), cfg);
    } catch (err) {
      box.innerHTML = `<div class="dr-row"><span class="dr-bad">✗</span> ${esc(err.message || 'Scan failed')}</div>`;
    }
  });
}

// ─── Style scheme panel ───────────────────────────────────────────────────────

function fontAdvPanel(schemeKey, label, scheme, locked, extraColorFields = []) {
  const adv = scheme[schemeKey] || FONT_ADV_DEFAULTS();
  const dis = locked ? 'disabled' : '';
  const alignOpts = [['', 'Left'], ['center', 'Center'], ['right', 'Right'], ['justify', 'Justify']];
  const alignBtns = alignOpts.map(([v, lbl]) =>
    `<button data-val="${v}" class="${adv.alignment === v ? 'active' : ''}" ${dis}>${lbl}</button>`
  ).join('');
  const capOpts = [
    ['', 'None'], ['allCaps', 'All Caps'], ['titleCase', 'Title Case'],
    ['startCase', 'Start Case'], ['allLower', 'All Lower'],
  ];
  const colorVal = adv.color || '#ffffff';
  const extraColorHtml = extraColorFields.map(({ label: clbl, field }) => {
    const val = scheme[field] || '#ffffff';
    return `
      <div class="font-adv-row">
        <label>${esc(clbl)}</label>
        <div class="color-input-wrap">
          <input type="color" id="sc-${field}" value="${esc(val)}" ${dis}>
          <input type="text" class="color-hex" id="sc-${field}-hex" value="${esc(val)}" maxlength="7" ${dis}>
        </div>
      </div>`;
  }).join('');
  return `
    <details class="font-adv-panel">
      <summary class="font-adv-summary">Advanced — ${esc(label)}</summary>
      <div class="font-adv-body">
        <div class="fav-num-grid">
          <div class="fav-num-cell">
            <span class="fav-num-lbl">Y Offset</span>
            <div class="fav-num-unit-row">
              <input type="number" class="fav-num" data-scheme="${schemeKey}" data-field="yOffset"
                value="${adv.yOffset ?? 0}" step="0.5" ${dis}>
              <span class="fav-unit">px</span>
            </div>
          </div>
          <div class="fav-num-cell">
            <span class="fav-num-lbl">Char Spacing</span>
            <div class="fav-num-unit-row">
              <input type="number" class="fav-num" data-scheme="${schemeKey}" data-field="charSpacing"
                value="${adv.charSpacing ?? 0}" step="0.5" ${dis}>
              <span class="fav-unit">pt</span>
            </div>
          </div>
          <div class="fav-num-cell">
            <span class="fav-num-lbl">Line Height</span>
            <div class="fav-num-unit-row">
              <input type="number" class="fav-num" data-scheme="${schemeKey}" data-field="lineHeight"
                value="${adv.lineHeight ?? 1}" min="0.1" max="5" step="0.05" ${dis}>
              <span class="fav-unit">×</span>
            </div>
          </div>
          <div class="fav-num-cell">
            <span class="fav-num-lbl">Para Spacing</span>
            <div class="fav-para-row">
              <input type="number" class="fav-num fav-para-inp" data-scheme="${schemeKey}" data-field="paragraphSpacingBefore"
                value="${adv.paragraphSpacingBefore ?? 0}" step="1" ${dis} title="Before (pt)">
              <span class="fav-para-sep">/</span>
              <input type="number" class="fav-num fav-para-inp" data-scheme="${schemeKey}" data-field="paragraphSpacingAfter"
                value="${adv.paragraphSpacingAfter ?? 0}" step="1" ${dis} title="After (pt)">
            </div>
          </div>
        </div>
        <div class="font-adv-row">
          <label>Alignment</label>
          <div class="segmented-control fav-align" data-scheme="${schemeKey}">${alignBtns}</div>
          <div class="segmented-control fav-vert-align" data-scheme="${schemeKey}" ${dis ? 'data-disabled="1"' : ''}>
            ${[
              ['top',    '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><line x1="1" y1="1.5" x2="12" y2="1.5"/><line x1="6.5" y1="3" x2="6.5" y2="12"/><polyline points="4,5.5 6.5,3 9,5.5"/></svg>'],
              ['middle', '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><line x1="1" y1="6.5" x2="12" y2="6.5"/><line x1="6.5" y1="1" x2="6.5" y2="5"/><polyline points="4,3.5 6.5,1 9,3.5"/><line x1="6.5" y1="8" x2="6.5" y2="12"/><polyline points="4,9.5 6.5,12 9,9.5"/></svg>'],
              ['bottom', '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><line x1="1" y1="11.5" x2="12" y2="11.5"/><line x1="6.5" y1="1" x2="6.5" y2="10"/><polyline points="4,7.5 6.5,10 9,7.5"/></svg>'],
            ].map(([v, icon]) =>
              `<button data-val="${v}" class="${adv.verticalAlignment === v ? 'active' : ''}" title="${v[0].toUpperCase()+v.slice(1)}" ${dis}>${icon}</button>`
            ).join('')}
          </div>
        </div>
        <div class="font-adv-row fav-style-row">
          <div class="font-adv-toggles">
            <button type="button" class="fav-toggle ${adv.bold ? 'on' : ''}" data-scheme="${schemeKey}" data-field="bold" ${dis}><b>B</b></button>
            <button type="button" class="fav-toggle ${adv.italic ? 'on' : ''}" data-scheme="${schemeKey}" data-field="italic" ${dis}><i>I</i></button>
            <button type="button" class="fav-toggle ${adv.underline ? 'on' : ''}" data-scheme="${schemeKey}" data-field="underline" ${dis}><u>U</u></button>
            <button type="button" class="fav-toggle ${adv.strikethrough ? 'on' : ''}" data-scheme="${schemeKey}" data-field="strikethrough" ${dis}><s>S</s></button>
          </div>
          <select class="fav-select fav-caps-sel" data-scheme="${schemeKey}" data-field="capitalization" ${dis}>
            ${capOpts.map(([v, lbl]) => `<option value="${v}" ${adv.capitalization === v ? 'selected' : ''}>${lbl}</option>`).join('')}
          </select>
        </div>
        <div class="font-adv-row">
          <label>Scaling</label>
          <select class="fav-select fav-scale-sel" data-scheme="${schemeKey}" data-field="scaleBehavior" ${dis}>
            <option value="" ${!adv.scaleBehavior ? 'selected' : ''}>Default</option>
            <option value="SCALE_BEHAVIOR_SCALE_FONT_DOWN" ${adv.scaleBehavior === 'SCALE_BEHAVIOR_SCALE_FONT_DOWN' ? 'selected' : ''}>Scale down</option>
            <option value="SCALE_BEHAVIOR_SCALE_FONT_UP_DOWN" ${adv.scaleBehavior === 'SCALE_BEHAVIOR_SCALE_FONT_UP_DOWN' ? 'selected' : ''}>Text up or down</option>
            <option value="none" ${adv.scaleBehavior === 'none' ? 'selected' : ''}>None</option>
          </select>
        </div>
        <div class="font-adv-row">
          <label>Margins</label>
          <div class="fav-margins-row">
            ${[['marginLeft','L'],['marginTop','T'],['marginRight','R'],['marginBottom','B']].map(([field, lbl]) =>
              `<span class="fav-margin-lbl">${lbl}</span><input type="number" class="fav-num fav-margin-inp" data-scheme="${schemeKey}" data-field="${field}" value="${adv[field] ?? 0}" step="1" ${dis}>`
            ).join('')}
          </div>
        </div>
        ${extraColorHtml}
        <div class="fav-section">
          <label class="fav-section-head">
            <input type="checkbox" class="fav-chk" data-scheme="${schemeKey}" data-field="strokeEnabled" ${adv.strokeEnabled ? 'checked' : ''} ${dis}>
            <span>Stroke</span>
          </label>
          <div class="fav-section-body ${adv.strokeEnabled ? '' : 'fav-section-off'}">
            <div class="fav-inline-row">
              <span class="fav-num-lbl">Width</span>
              <input type="number" class="fav-num" data-scheme="${schemeKey}" data-field="strokeWidth"
                value="${adv.strokeWidth ?? 1}" step="0.5" min="0" ${dis}>
              <span class="fav-unit">pt</span>
              <input type="color" class="fav-sc" data-scheme="${schemeKey}" data-which="strokeColor"
                value="${adv.strokeColor ? (adv.strokeColor.startsWith('#') ? adv.strokeColor : '#' + adv.strokeColor) : '#ffffff'}" ${dis}>
              <input type="text" class="color-hex fav-sc-hex" data-scheme="${schemeKey}" data-which="strokeColor"
                value="${(adv.strokeColor || '').replace(/^#/, '')}" maxlength="6" placeholder="ffffff" ${dis}>
            </div>
          </div>
        </div>
        <div class="fav-section">
          <label class="fav-section-head">
            <input type="checkbox" class="fav-chk" data-scheme="${schemeKey}" data-field="shadowEnabled" ${adv.shadowEnabled ? 'checked' : ''} ${dis}>
            <span>Shadow</span>
          </label>
          <div class="fav-section-body ${adv.shadowEnabled ? '' : 'fav-section-off'}">
            <div class="fav-inline-row">
              <span class="fav-num-lbl">Opacity</span>
              <input type="number" class="fav-num" data-scheme="${schemeKey}" data-field="shadowOpacity"
                value="${adv.shadowOpacity ?? 75}" min="0" max="100" step="1" ${dis}>
              <span class="fav-unit">%</span>
              <input type="color" class="fav-sc" data-scheme="${schemeKey}" data-which="shadowColor"
                value="${adv.shadowColor ? (adv.shadowColor.startsWith('#') ? adv.shadowColor : '#' + adv.shadowColor) : '#000000'}" ${dis}>
              <input type="text" class="color-hex fav-sc-hex" data-scheme="${schemeKey}" data-which="shadowColor"
                value="${(adv.shadowColor || '').replace(/^#/, '')}" maxlength="6" placeholder="000000" ${dis}>
            </div>
            <div class="fav-inline-row">
              <span class="fav-num-lbl">Angle</span>
              <input type="number" class="fav-num" data-scheme="${schemeKey}" data-field="shadowAngle"
                value="${adv.shadowAngle ?? 315}" min="0" max="360" step="1" ${dis}>
              <span class="fav-unit">°</span>
              <span class="fav-num-lbl" style="margin-left:6px">Offset</span>
              <input type="number" class="fav-num" data-scheme="${schemeKey}" data-field="shadowOffset"
                value="${adv.shadowOffset ?? 5}" min="0" step="0.5" ${dis}>
              <span class="fav-num-lbl" style="margin-left:6px">Blur</span>
              <input type="number" class="fav-num" data-scheme="${schemeKey}" data-field="shadowBlur"
                value="${adv.shadowBlur ?? 5}" min="0" step="0.5" ${dis}>
            </div>
          </div>
        </div>
      </div>
    </details>
  `;
}

// Compact layout table for the Advanced section
function lyRows() {
  return [
    { label: dn('mainScreen'), type: 'head' },
    { label: 'Canvas',       cols: ['—','—','canvasW','canvasH'] },
    { label: 'Body',         cols: ['bodyX','bodyY','bodyW','bodyH'], region: 'body' },
    { label: 'Point',        cols: ['pointX','pointY','pointW','pointH'], region: 'point' },
    { label: 'Title',        cols: ['titleX','titleY','titleW','titleH'], autoY: { field: 'autoTitleY', gapField: 'titleAutoGap' }, region: 'header' },
    { label: 'RC Body',      cols: ['rcBodyX','rcBodyY','rcBodyW','rcBodyH'], region: 'rcBody' },
    { label: 'RC Title',     cols: ['rcTitleX','rcTitleY','rcTitleW','rcTitleH'], autoY: { field: 'rcAutoTitleY', gapField: 'rcTitleAutoGap' }, region: 'rcTitle' },
    { label: 'Utility',      cols: ['startEndX','startEndY','startEndW','startEndH'], region: 'startEnd' },
    { label: 'Live',         cols: ['liveX','liveY','liveW','liveH'], region: 'live' },
    { label: 'Queue',        cols: ['queueX','queueY','queueW','queueH'], region: 'queue' },
    { label: dn('ledWall'),  type: 'head', head: 'prop' },
    { label: 'Canvas',       cols: [null,null,'propCanvasW','propCanvasH'] },
    { label: 'Prop body',    cols: ['propBodyX','propBodyY','propBodyW','propBodyH'], region: 'propBody' },
    { label: 'Prop point',   cols: ['propPointX','propPointY','propPointW','propPointH'], region: 'propPoint' },
    { label: 'Prop title',   cols: ['propTitleX','propTitleY','propTitleW','propTitleH'], autoY: { field: 'propAutoTitleY', gapField: 'propTitleAutoGap' }, region: 'propHeader' },
  ];
}

function lyTable(rows, scheme, dis) {
  const glb = !dis ? ensureGlobalLayout() : ensureGlobalLayout();
  const ov = (f) => {
    if (!f || f === '—' || dis) return false;
    const v = scheme[f];
    if (v === undefined || v === null) return false;
    const g = glb[f];
    if (g === undefined) return false;
    if (typeof g === 'number') return Math.abs(Number(v) - g) > 0.01;
    return v !== g;
  };
  // Resolve: null scheme field falls back to global
  const rv = (f) => (f && f !== '—') ? (scheme[f] ?? glb[f] ?? '') : '';

  const numTd = (f) => {
    if (!f || f === '—') return `<td class="sg-td"><span class="sg-na">—</span></td>`;
    const o = ov(f) ? ' sg-td-scheme' : '';
    return `<td class="sg-td${o}" data-ly-field="${f}">` +
      `<input type="number" class="sg-num layout-num" id="ly-${f}" value="${rv(f)}" step="0.01" ${dis}></td>`;
  };

  let inProp = false;

  const bodyRows = rows.map(row => {
    if (row.type === 'head') {
      if (row.head === 'prop') inProp = true;
      return `<tr class="sg-section-hd"><th colspan="8">${esc(row.label)}</th></tr>`;
    }
    const [c0, c1, c2, c3] = row.cols;
    const hasX = c0 && c0 !== '—';
    const hasY = c1 && c1 !== '—';
    const hasW = c2 && c2 !== '—';
    const hasH = c3 && c3 !== '—';
    const prop = inProp;

    // Y cell — dimmed when auto-Y is on
    const yDimmed = row.autoY && (scheme[row.autoY.field] ?? glb[row.autoY.field]);
    const yTd = !hasY
      ? `<td class="sg-td"><span class="sg-na">—</span></td>`
      : `<td class="sg-td${ov(c1) ? ' sg-td-scheme' : ''}${yDimmed ? ' ly-y-dimmed' : ''}" data-ly-field="${c1}">` +
        `<input type="number" class="sg-num layout-num" id="ly-${c1}" value="${rv(c1)}" step="0.01" ${dis}></td>`;

    // Alignment buttons
    const canAlign = (hasX || hasY) && !dis;
    const near = (a, b) => Math.abs((a ?? NaN) - b) < 0.6;
    const cW = prop ? (rv('propCanvasW') || 3200) : (rv('canvasW') || 1920);
    const cH = prop ? (rv('propCanvasH') || 1280) : (rv('canvasH') || 1080);
    const curX = rv(c0) || null, curW = rv(c2) || null;
    const curY = rv(c1) || null, curH = rv(c3) || null;
    const hActive = new Set();
    if (hasX && hasW && curX !== null && curW !== null) {
      if (near(curX, (cW - curW) / 2)) hActive.add('h-center');
      else if (near(curX, 0))           hActive.add('h-left');
      else if (near(curX, cW - curW))   hActive.add('h-right');
    }
    const vActive = new Set();
    if (hasY && hasH && curY !== null && curH !== null) {
      if (near(curY, (cH - curH) / 2)) vActive.add('v-middle');
      else if (near(curY, 0))           vActive.add('v-top');
      else if (near(curY, cH - curH))   vActive.add('v-bottom');
    }
    const ab = (align) => `class="ly-align-btn${hActive.has(align) || vActive.has(align) ? ' active' : ''}"`;

    const alignCell = canAlign ? `<td class="sg-td" style="padding:2px 4px;white-space:nowrap">
      <div class="ly-align-group">
        ${hasX && hasW ? `
          <button ${ab('h-left')}   data-align="h-left"   data-xf="${c0}" data-wf="${c2}" data-prop="${prop}" title="Align left"><svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="1.5" height="10" fill="currentColor" rx=".5"/><rect x="3" y="3" width="7" height="2.5" fill="currentColor" rx=".5"/><rect x="3" y="6.5" width="5" height="2.5" fill="currentColor" rx=".5"/></svg></button>
          <button ${ab('h-center')} data-align="h-center" data-xf="${c0}" data-wf="${c2}" data-prop="${prop}" title="Center horizontally"><svg width="12" height="12" viewBox="0 0 12 12"><rect x="5.25" y="1" width="1.5" height="10" fill="currentColor" rx=".5"/><rect x="2" y="3" width="8" height="2.5" fill="currentColor" rx=".5"/><rect x="3" y="6.5" width="6" height="2.5" fill="currentColor" rx=".5"/></svg></button>
          <button ${ab('h-right')}  data-align="h-right"  data-xf="${c0}" data-wf="${c2}" data-prop="${prop}" title="Align right"><svg width="12" height="12" viewBox="0 0 12 12"><rect x="9.5" y="1" width="1.5" height="10" fill="currentColor" rx=".5"/><rect x="2" y="3" width="7" height="2.5" fill="currentColor" rx=".5"/><rect x="4" y="6.5" width="5" height="2.5" fill="currentColor" rx=".5"/></svg></button>
        ` : '<button class="ly-align-btn" style="visibility:hidden"></button><button class="ly-align-btn" style="visibility:hidden"></button><button class="ly-align-btn" style="visibility:hidden"></button>'}
        ${hasY && hasH ? `
          <button ${ab('v-top')}    data-align="v-top"    data-yf="${c1}" data-hf="${c3}" data-prop="${prop}" title="Align top"><svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="1.5" fill="currentColor" rx=".5"/><rect x="3" y="3" width="2.5" height="7" fill="currentColor" rx=".5"/><rect x="6.5" y="3" width="2.5" height="5" fill="currentColor" rx=".5"/></svg></button>
          <button ${ab('v-middle')} data-align="v-middle" data-yf="${c1}" data-hf="${c3}" data-prop="${prop}" title="Center vertically"><svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="5.25" width="10" height="1.5" fill="currentColor" rx=".5"/><rect x="3" y="2" width="2.5" height="8" fill="currentColor" rx=".5"/><rect x="6.5" y="3" width="2.5" height="6" fill="currentColor" rx=".5"/></svg></button>
          <button ${ab('v-bottom')} data-align="v-bottom" data-yf="${c1}" data-hf="${c3}" data-prop="${prop}" title="Align bottom"><svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="9.5" width="10" height="1.5" fill="currentColor" rx=".5"/><rect x="3" y="2" width="2.5" height="7" fill="currentColor" rx=".5"/><rect x="6.5" y="4" width="2.5" height="5" fill="currentColor" rx=".5"/></svg></button>
        ` : '<button class="ly-align-btn" style="visibility:hidden"></button><button class="ly-align-btn" style="visibility:hidden"></button><button class="ly-align-btn" style="visibility:hidden"></button>'}
      </div>
    </td>` : `<td class="sg-td"></td>`;

    // Auto Y + Gap — always emit 2 cells for consistent column count
    let autoTds = `<td class="sg-td"></td><td class="sg-td"></td>`;
    if (row.autoY) {
      const { field, gapField } = row.autoY;
      const checked = (scheme[field] ?? glb[field]) ? 'checked' : '';
      const gapOv = ov(gapField) ? ' sg-td-scheme' : '';
      autoTds = `<td class="sg-td">
          <label class="ly-auto-y-chk-lbl">
            <input type="checkbox" class="ly-auto-y-chk" id="ly-${field}" ${checked} ${dis}>
            Auto
          </label>
        </td>
        <td class="sg-td${gapOv}" data-ly-field="${gapField}">
          <input type="number" class="sg-num layout-num" id="ly-${gapField}" value="${rv(gapField) || 16}" step="1" ${dis}>
        </td>`;
    }

    return `<tr class="sg-row"${row.region ? ` data-region="${row.region}"` : ''}>
      <td class="sg-row-lbl${row.region ? ' ly-row-name-click' : ''}">${esc(row.label)}</td>
      ${numTd(c0)}
      ${yTd}
      ${numTd(c2)}
      ${numTd(c3)}
      ${alignCell}
      ${autoTds}
    </tr>`;
  }).join('');

  return `<table class="sg-table">
    <thead>
      <tr class="sg-grp-row">
        <th rowspan="2" class="sg-corner"></th>
        <th colspan="2" class="sg-grp">Position</th>
        <th colspan="2" class="sg-grp">Size</th>
        <th rowspan="2" class="sg-hd-solo">Align</th>
        <th rowspan="2" class="sg-hd-solo">Auto Y</th>
        <th rowspan="2" class="sg-hd-solo">Gap</th>
      </tr>
      <tr class="sg-col-row">
        <th class="sg-col">X</th>
        <th class="sg-col">Y</th>
        <th class="sg-col">W</th>
        <th class="sg-col">H</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>`;
}

function refreshAlignBtns(panel, scheme) {
  const near = (a, b) => Math.abs((a ?? NaN) - b) < 0.6;
  panel.querySelectorAll('.ly-align-btn[data-align]').forEach(btn => {
    const align  = btn.dataset.align;
    const isProp = btn.dataset.prop === 'true';
    const cW = isProp ? (scheme.propCanvasW ?? 3200) : (scheme.canvasW ?? 1920);
    const cH = isProp ? (scheme.propCanvasH ?? 1280) : (scheme.canvasH ?? 1080);
    let active = false;
    if (align === 'h-center') {
      const x = scheme[btn.dataset.xf] ?? null, w = scheme[btn.dataset.wf] ?? null;
      if (x !== null && w !== null) active = near(x, (cW - w) / 2);
    } else if (align === 'h-left') {
      const x = scheme[btn.dataset.xf] ?? null, w = scheme[btn.dataset.wf] ?? null;
      if (x !== null && w !== null) active = near(x, 0) && !near(x, (cW - w) / 2);
    } else if (align === 'h-right') {
      const x = scheme[btn.dataset.xf] ?? null, w = scheme[btn.dataset.wf] ?? null;
      if (x !== null && w !== null) active = near(x, cW - w) && !near(x, (cW - w) / 2);
    } else if (align === 'v-middle') {
      const y = scheme[btn.dataset.yf] ?? null, h = scheme[btn.dataset.hf] ?? null;
      if (y !== null && h !== null) active = near(y, (cH - h) / 2);
    } else if (align === 'v-top') {
      const y = scheme[btn.dataset.yf] ?? null, h = scheme[btn.dataset.hf] ?? null;
      if (y !== null && h !== null) active = near(y, 0) && !near(y, (cH - h) / 2);
    } else if (align === 'v-bottom') {
      const y = scheme[btn.dataset.yf] ?? null, h = scheme[btn.dataset.hf] ?? null;
      if (y !== null && h !== null) active = near(y, cH - h) && !near(y, (cH - h) / 2);
    }
    btn.classList.toggle('active', active);
  });
}

function refreshSchemePreviews(panel, scheme) {
  const sv = styleForExport(scheme);
  const mainW = sv.canvasW || 1920, mainH = sv.canvasH || 1080;
  const propW = sv.propCanvasW || 3200, propH = sv.propCanvasH || 1280;
  const pct = (v, d) => (v / d * 100).toFixed(2) + '%';
  const REGION = {
    queue:     [sv.queueX??0, sv.queueY??0, sv.queueW??0, sv.queueH??0, mainW, mainH],
    body:      [sv.bodyX??0, sv.bodyY??0, sv.bodyW??0, sv.bodyH??0, mainW, mainH],
    point:     [sv.pointX??sv.bodyX??0, sv.pointY??sv.bodyY??0, sv.pointW??sv.bodyW??0, sv.pointH??sv.bodyH??0, mainW, mainH],
    header:    [sv.titleX??0, sv.titleY??0, sv.titleW??0, sv.titleH??0, mainW, mainH],
    rcBody:    [sv.rcBodyX??sv.bodyX??0, sv.rcBodyY??sv.bodyY??0, sv.rcBodyW??sv.bodyW??0, sv.rcBodyH??sv.bodyH??0, mainW, mainH],
    rcTitle:   [sv.rcTitleX??sv.titleX??0, sv.rcTitleY??sv.titleY??0, sv.rcTitleW??sv.titleW??0, sv.rcTitleH??sv.titleH??0, mainW, mainH],
    startEnd:  [sv.startEndX??0, sv.startEndY??0, sv.startEndW??0, sv.startEndH??0, mainW, mainH],
    live:      [sv.liveX??0, sv.liveY??0, sv.liveW??0, sv.liveH??0, mainW, mainH],
    propBody:  [sv.propBodyX??0, sv.propBodyY??0, sv.propBodyW??0, sv.propBodyH??0, propW, propH],
    propPoint: [sv.propPointX??sv.propBodyX??0, sv.propPointY??sv.propBodyY??0, sv.propPointW??sv.propBodyW??0, sv.propPointH??sv.propBodyH??0, propW, propH],
    propHeader:[sv.propTitleX??0, sv.propTitleY??0, sv.propTitleW??0, sv.propTitleH??0, propW, propH],
  };
  panel.querySelectorAll('.lp-region[data-region]').forEach(el => {
    const d = REGION[el.dataset.region];
    if (!d) return;
    const [x, y, w, h, cw, ch] = d;
    if (!w || !h) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.style.left = pct(x, cw); el.style.top = pct(y, ch);
    el.style.width = pct(w, cw); el.style.height = pct(h, ch);
  });
  panel.querySelectorAll('.lp-canvas[data-canvas="main"]').forEach(el => el.style.aspectRatio = `${mainW} / ${mainH}`);
  panel.querySelectorAll('.lp-canvas[data-canvas="prop"]').forEach(el => el.style.aspectRatio = `${propW} / ${propH}`);
}

// ── Text-tab building blocks ────────────────────────────────────────────────
// Renders the Font / Weight / Size / Color quick-controls for one text role.
// Element IDs/classes match the originals so existing change handlers bind.
function fontControl({ advKey, field, sizeField = null, propSizeField = null, scheme, rawScheme, dis }) {
  const val = scheme[field] || '';
  const fontTypoKey = FONT_FIELD_TO_TYPO_KEY[field];
  const colorTypoKey = ADV_FIELD_TO_TYPO_KEY[advKey];
  const sizeTypoKey = SIZE_FIELD_TO_TYPO_KEY[sizeField];
  const fontIsScheme  = !!(fontTypoKey  && rawScheme?.typography?.[fontTypoKey]  != null);
  const colorIsScheme = !!(colorTypoKey && rawScheme?.typography?.[colorTypoKey] != null);
  const sizeIsScheme  = !!(sizeTypoKey  && rawScheme?.typography?.[sizeTypoKey]  != null);
  const inheritIcons = (key) => `
    <button type="button" class="inherit-action inherit-icon-btn" data-action="use-global" data-key="${key}" title="Use global" ${dis}>↺</button>
    <button type="button" class="inherit-action inherit-icon-btn" data-action="push-global" data-key="${key}" title="Push to Global" ${dis}>↑</button>`;
  const { family: curFam } = parseFontPS(val);
  const families = _fontFamilyMap ? Object.keys(_fontFamilyMap).sort((a, b) => a.localeCompare(b)) : [];
  const famOptions = families.length
    ? families.map(f => `<option value="${esc(f)}" ${f === curFam ? 'selected' : ''}>${esc(f)}</option>`).join('')
    : `<option value="${esc(curFam)}">${esc(curFam || '…')}</option>`;
  const stylesForFam = _fontFamilyMap?.[curFam] || (val ? [{ style: parseFontPS(val).style, postscript: val }] : []);
  const styOptions = stylesForFam.map(({ style, postscript }) =>
    `<option value="${esc(postscript)}" ${postscript === val ? 'selected' : ''}>${esc(style)}</option>`
  ).join('') || `<option value="${esc(val)}">${esc(parseFontPS(val).style)}</option>`;
  const sizeBox = (f) => f
    ? `<span class="tsc-size-box"><input type="number" class="sz-input sf-size" id="ss-${f}" value="${scheme[f] ?? 44}" min="1" max="400" step="1" ${dis}><span class="sf-unit">pt</span></span>`
    : '';
  const curAdv = scheme[advKey] || FONT_ADV_DEFAULTS();
  const sizeRow = (sizeField || propSizeField)
    ? `<div class="tsc-row${sizeIsScheme ? ' inherit-scheme' : ''}"><span class="tsc-lbl">Size</span>
         <span class="tsc-size-row">${sizeBox(sizeField)}${propSizeField ? `<span class="tsc-size-sep" title="LED-wall size">wall</span>${sizeBox(propSizeField)}` : ''}</span></div>`
    : '';
  return `
    <div class="tsc-row${fontIsScheme ? ' inherit-scheme' : ''}"><span class="tsc-lbl">Font</span>
      <div class="inherit-ctrl-wrap">
        <select class="sf-fam-select" id="sf-fam-${field}" ${dis}>${famOptions}</select>
        ${fontIsScheme ? inheritIcons(fontTypoKey) : ''}
      </div></div>
    <div class="tsc-row${fontIsScheme ? ' inherit-scheme' : ''}"><span class="tsc-lbl">Weight</span>
      <select class="sf-sty-select" id="sf-sty-${field}" ${dis}>${styOptions}</select></div>
    ${sizeRow}
    <div class="tsc-row${colorIsScheme ? ' inherit-scheme' : ''}"><span class="tsc-lbl">Color</span>
      <span class="color-input-wrap font-color-inline">
        <input type="color" class="fav-color" data-scheme="${advKey}" value="${curAdv.color ? (curAdv.color.startsWith('#') ? curAdv.color : '#' + curAdv.color) : '#ffffff'}" ${dis}>
        <input type="text" class="color-hex fav-color-hex" data-scheme="${advKey}" value="${(curAdv.color || '').replace(/^#/, '')}" maxlength="6" placeholder="Default" ${dis}>
        <button type="button" class="fav-color-clear" data-scheme="${advKey}" title="Use global color" ${dis}>×</button>
        ${colorIsScheme ? inheritIcons(colorTypoKey) : ''}
      </span></div>`;
}

// Static visual preview of the active scheme (Phase 1 — wired to scheme values, not full render).
function schemePreviewPanel(scheme) {
  const fam = (ps) => `"${esc(parseFontPS(ps || '').family || ps || 'sans-serif')}", sans-serif`;
  const bodyColor  = (scheme.bodyFontAdv && scheme.bodyFontAdv.color) || '#ffffff';
  // Reference bar is scheme-driven: no background fill, text colour from titleFontAdv (default white)
  const titleText  = (scheme.titleFontAdv && scheme.titleFontAdv.color) || '#ffffff';
  const seColor    = (scheme.startEndFontAdv && scheme.startEndFontAdv.color) || '#ffffff';
  // Scale 1080-tall canvas down to a ~200px-tall preview
  const sc = 200 / (scheme.canvasH || 1080);
  const px = (pt) => Math.max(8, Math.round((pt || 44) * sc * 2));
  return `
    <div class="sp-grid">
      <div class="sp-card">
        <div class="sp-card-hd">${dn('mainScreen')} — Scripture</div>
        <div class="sp-screen sp-16x9">
          <div class="sp-grad"></div>
          <div class="sp-refbar" style="background:transparent;color:${esc(titleText)};font-family:${fam(scheme.titleFont)};font-size:${px(scheme.titleSize)}px">JOHN 3:16</div>
          <div class="sp-body" style="font-family:${fam(scheme.bodyFont)};color:${esc(bodyColor)};font-size:${px(scheme.bodySize)}px">The Lord created medicines out of the earth…</div>
        </div>
      </div>
      <div class="sp-card">
        <div class="sp-card-hd">${dn('mainScreen')} — Point</div>
        <div class="sp-screen sp-16x9">
          <div class="sp-grad"></div>
          <div class="sp-body sp-point" style="font-family:${fam(scheme.pointFont)};color:${esc(bodyColor)};font-size:${px(scheme.bodySize)}px">LOVE ONE ANOTHER</div>
        </div>
      </div>
      <div class="sp-card">
        <div class="sp-card-hd">${dn('ledWall')}</div>
        <div class="sp-screen sp-wall">
          <div class="sp-body sp-wall-body" style="font-family:${fam(scheme.propBodyFont)};font-size:${px(scheme.propBodySize)}px">The Lord created medicines out of the earth…</div>
        </div>
      </div>
      <div class="sp-card">
        <div class="sp-card-hd">Utility</div>
        <div class="sp-screen sp-16x9">
          <div class="sp-se" style="font-family:${fam(scheme.startEndFont)};color:${esc(seColor)};font-size:${px(scheme.startEndSize)}px">MESSAGE TITLE</div>
        </div>
      </div>
      <div class="sp-card sp-card-wide">
        <div class="sp-card-hd">Slide Notes — ${dn('monitor')}</div>
        <div class="sp-notes" style="font-family:${fam(scheme.notesFont)}">Speaker note preview — only visible on the ${dn('monitor')}.</div>
      </div>
    </div>
    <p class="sp-foot">Approximate preview from this style's fonts, sizes and colours.</p>`;
}

// Visual Layout preview — scaled Main + Prop canvases with clickable region boxes
// linked to the layout table rows. (Phase 2; drag/resize is deferred — Phase 3.)
function layoutPreview(scheme, sel) {
  const sv = styleForExport(scheme);
  const mainW = sv.canvasW || 1920, mainH = sv.canvasH || 1080;
  const propW = sv.propCanvasW || 3200, propH = sv.propCanvasH || 1280;
  // [slug, label, x, y, w, h] — drawn back-to-front so small boxes sit on top
  const mainRegions = [
    ['queue',     'Queue',        sv.queueX ?? 0,    sv.queueY ?? 0,    sv.queueW ?? 0,     sv.queueH ?? 0],
    ['body',      'Body',         sv.bodyX ?? 0,     sv.bodyY ?? 0,     sv.bodyW ?? 0,      sv.bodyH ?? 0],
    ['point',     'Point',        sv.pointX ?? sv.bodyX ?? 0, sv.pointY ?? sv.bodyY ?? 0, sv.pointW ?? sv.bodyW ?? 0, sv.pointH ?? sv.bodyH ?? 0],
    ['header',    'Title',        sv.titleX ?? 0,    sv.titleY ?? 0,    sv.titleW ?? 0,     sv.titleH ?? 0],
    ['rcBody',    'RC Body',      sv.rcBodyX ?? sv.bodyX ?? 0, sv.rcBodyY ?? sv.bodyY ?? 0, sv.rcBodyW ?? sv.bodyW ?? 0, sv.rcBodyH ?? sv.bodyH ?? 0],
    ['rcTitle',   'RC Title',     sv.rcTitleX ?? sv.titleX ?? 0, sv.rcTitleY ?? sv.titleY ?? 0, sv.rcTitleW ?? sv.titleW ?? 0, sv.rcTitleH ?? sv.titleH ?? 0],
    ['startEnd',  'Utility',      sv.startEndX ?? 0, sv.startEndY ?? 0, sv.startEndW ?? 0,  sv.startEndH ?? 0],
    ['live',      'Live',         sv.liveX ?? 0,     sv.liveY ?? 0,     sv.liveW ?? 0,      sv.liveH ?? 0],
  ];
  const propRegions = [
    ['propBody',   'Prop body',   sv.propBodyX ?? 0, sv.propBodyY ?? 0, sv.propBodyW ?? 0,  sv.propBodyH ?? 0],
    ['propPoint',  'Prop point',  sv.propPointX ?? sv.propBodyX ?? 0, sv.propPointY ?? sv.propBodyY ?? 0, sv.propPointW ?? sv.propBodyW ?? 0, sv.propPointH ?? sv.propBodyH ?? 0],
    ['propHeader', 'Prop title',  sv.propTitleX ?? 0, sv.propTitleY ?? 0, sv.propTitleW ?? 0, sv.propTitleH ?? 0],
  ];
  const box = (cw, ch) => ([slug, lbl, x, y, w, h]) => {
    if (!w || !h) return '';
    const pct = (v, d) => (v / d) * 100;
    return `<div class="lp-region lp-region-${slug}${sel === slug ? ' sel' : ''}" data-region="${slug}"
      style="left:${pct(x, cw).toFixed(2)}%;top:${pct(y, ch).toFixed(2)}%;width:${pct(w, cw).toFixed(2)}%;height:${pct(h, ch).toFixed(2)}%"
      title="${esc(lbl)}"><span class="lp-region-lbl">${esc(lbl)}</span></div>`;
  };
  return `
    <div class="lp-wrap">
      <div class="lp-canvas-block">
        <div class="lp-canvas-lbl">${dn('mainScreen')} · ${Math.round(mainW)}×${Math.round(mainH)}</div>
        <div class="lp-canvas" data-canvas="main" style="aspect-ratio:${mainW} / ${mainH}">${mainRegions.map(box(mainW, mainH)).join('')}</div>
      </div>
      <div class="lp-canvas-block">
        <div class="lp-canvas-lbl">${dn('ledWall')} · ${Math.round(propW)}×${Math.round(propH)}</div>
        <div class="lp-canvas" data-canvas="prop" style="aspect-ratio:${propW} / ${propH}">${propRegions.map(box(propW, propH)).join('')}</div>
      </div>
    </div>
    <p class="style-group-hint" style="margin-top:8px">Click a region to highlight its row below. Boxes are drawn from this scheme's positions; off-canvas elements (e.g. Live) may sit outside the frame.</p>`;
}

// ── Palette tab + Global view helpers ─────────────────────────────────────────
function renderPaletteTab(rawScheme, t, dis) {
  const fontSlot = (key, name, desc) => {
    const val = t[key] || '';
    const curFam = fontFamilyOf(val);
    const families = _fontFamilyMap ? Object.keys(_fontFamilyMap).sort((a, b) => a.localeCompare(b)) : [];
    const famOpts = families.length
      ? families.map(f => `<option value="${esc(f)}"${f === curFam ? ' selected' : ''}>${esc(f)}</option>`).join('')
      : `<option value="${esc(curFam)}">${esc(curFam || '…')}</option>`;
    const styArr = _fontFamilyMap?.[curFam] || (val ? [{ style: parseFontPS(val).style, postscript: val }] : []);
    const styOpts = styArr.map(({ style, postscript }) =>
      `<option value="${esc(postscript)}"${postscript === val ? ' selected' : ''}>${esc(style)}</option>`
    ).join('') || `<option value="${esc(val)}">${esc(parseFontPS(val).style || 'Regular')}</option>`;
    return `<div class="palette-slot">
      <div class="palette-slot-info"><span class="palette-slot-name">${esc(name)}</span><span class="palette-slot-desc">${esc(desc)}</span></div>
      <div class="palette-slot-ctrl">
        <div class="inherit-ctrl-wrap">
          <select class="sf-fam-select" id="palette-fam-${key}" ${dis}>${famOpts}</select>
        </div>
        <select class="sf-sty-select" id="palette-sty-${key}" ${dis}>${styOpts}</select>
      </div>
    </div>`;
  };
  const colorSlot = (key, name, desc) => {
    const val = normalizeHexColor(t[key] || '#ffffff');
    const pickerVal = val.startsWith('#') ? val : '#' + val;
    return `<div class="palette-slot">
      <div class="palette-slot-info"><span class="palette-slot-name">${esc(name)}</span><span class="palette-slot-desc">${esc(desc)}</span></div>
      <span class="color-input-wrap">
        <input type="color" class="fav-color" id="palette-color-${key}" value="${pickerVal}" ${dis}>
        <input type="text" class="color-hex fav-color-hex" id="palette-hex-${key}" value="${(val||'').replace(/^#/,'')}" maxlength="6" placeholder="ffffff" ${dis}>
        <button type="button" class="fav-color-clear palette-color-clear" data-key="${key}" title="Use global color" ${dis}>×</button>
      </span>
    </div>`;
  };
  return `<p class="style-group-hint">The five style slots every scheme starts from. Fields in Text / Layout / Motion inherit from these unless they have their own override.</p>
    <div class="tcard"><div class="tcard-hd">Fonts</div>
      ${fontSlot('font1',    'Font 1',    'Body · Point · Utility · Notes · Queue · Live')}
      ${fontSlot('font2',    'Font 2',    'Title · Response Card title')}
      ${fontSlot('boldFont', 'Bold / ALT','Emphasis spans in body text')}
    </div>
    <div class="tcard"><div class="tcard-hd">Colors</div>
      ${colorSlot('colorNeutral', 'Neutral', 'Body · Point · Utility · Notes · Queue · Live · Bold')}
      ${colorSlot('colorAccent',  'Accent',  'Title · Response Card title')}
    </div>`;
}

function renderGlobalPanel(panel, schemeOptionsHTML) {
  ensureGlobalTypography();
  ensureGlobalLayout();
  ensureGlobalFontAdv();
  const gMotion = ensureGlobalMotion();
  const gMacros = ensureGlobalMacros();
  const gStage  = ensureGlobalStageDisplays();
  const gRc     = ensureGlobalRcElements();
  const g = state.globalTypography;

  // Build a fake scheme whose typography, layout, adv AND motion ARE the globals —
  // so no overrides show, and renderBuildTable/etc can be reused as-is (read-only).
  const gScheme = { ...DEFAULT_STYLE_SCHEME(), ...state.globalLayout, ...state.globalFontAdv, ...gMotion, typography: { ...g } };
  const sv = applyTypographyToStyle(gScheme);
  const rs = { ...DEFAULT_STYLE_SCHEME(), ...state.globalFontAdv, typography: {} };

  const _gTab = (_styleTab && ['text','layout','motion','macros','stage','responseCard'].includes(_styleTab)) ? _styleTab : 'text';

  panel.innerHTML = `<div class="slide-form">
    <h2>Styles</h2>
    <p class="scheme-intro">
      A style sets the visual look of your slides — fonts, sizes, colours, animations and positions.
      Pick one to use for this deck, or duplicate to make your own.
    </p>
    <div class="scheme-toolbar">
      <select id="style-scheme-select" class="scheme-tb-select" title="Switch view">
        <option value="__global__" selected>◈ Global</option>
        ${schemeOptionsHTML}
      </select>
    </div>
    <div class="global-view-banner">Global defaults — read-only. Push a value from any style to update.</div>

    <div class="style-tabs">
      <button class="style-tab${_gTab === 'text'   ? ' active' : ''}" data-gtab="text">Text</button>
      <button class="style-tab${_gTab === 'layout' ? ' active' : ''}" data-gtab="layout">Layout</button>
      <button class="style-tab${_gTab === 'motion' ? ' active' : ''}" data-gtab="motion">Motion</button>
      <button class="style-tab${_gTab === 'macros' ? ' active' : ''}" data-gtab="macros">Macros</button>
      <button class="style-tab${_gTab === 'stage'  ? ' active' : ''}" data-gtab="stage">Stage</button>
      <button class="style-tab${_gTab === 'responseCard' ? ' active' : ''}" data-gtab="responseCard">Response Card</button>
    </div>

    <fieldset class="scheme-fields scheme-locked" disabled>
      <div class="style-tab-body" id="g-tab-text"   ${_gTab !== 'text'   ? 'style="display:none"' : ''}>
        <div class="sg-lp-compact">${layoutPreview(gScheme, null)}</div>
        ${renderSchemeGrid(sv, rs, 'disabled')}
      </div>
      <div class="style-tab-body" id="g-tab-layout" ${_gTab !== 'layout' ? 'style="display:none"' : ''}>
        ${layoutPreview(gScheme, null)}
        <p class="style-group-hint">Default element bounds (read-only).</p>
        ${lyTable(lyRows(), gScheme, 'disabled')}
      </div>
      <div class="style-tab-body" id="g-tab-motion" ${_gTab !== 'motion' ? 'style="display:none"' : ''}>
        <div class="trans-cols">
          <div class="trans-col">
            <div class="trans-col-title">Slide</div>
            <div class="segmented-control trans-seg">
              ${['fade','dissolve','cut'].map(v => `<button class="${gMotion.transitionType === v ? 'active' : ''}" disabled>${v[0].toUpperCase()}${v.slice(1)}</button>`).join('')}
            </div>
            ${gMotion.transitionType !== 'cut' ? `<div class="trans-dur-wrap"><input type="number" value="${gMotion.transitionDuration}" disabled><span class="fav-unit">s</span></div>` : ''}
          </div>
          <div class="trans-col">
            <div class="trans-col-title">Prop</div>
            <div class="segmented-control trans-seg">
              ${['fade','dissolve','cut'].map(v => `<button class="${gMotion.propTransitionType === v ? 'active' : ''}" disabled>${v[0].toUpperCase()}${v.slice(1)}</button>`).join('')}
            </div>
            ${gMotion.propTransitionType !== 'cut' ? `<div class="trans-dur-wrap"><input type="number" value="${gMotion.propTransitionDuration}" disabled><span class="fav-unit">s</span></div>` : ''}
          </div>
        </div>
        <p class="style-group-hint" style="margin-top:16px">Build order (read-only) — ${_boActiveTab}</p>
        <div class="bo-tabs" id="g-bo-tabs">
          ${[['content','Scripture'],['point','Point'],['blank','Blank'],['startEnd','Utility']].map(([tab, lbl]) =>
            `<button class="bo-tab${_boActiveTab === tab ? ' active' : ''}" data-gbotab="${tab}">${lbl}</button>`).join('')}
        </div>
        ${renderBuildTable(_boActiveTab, gScheme, true)}
      </div>
      <div class="style-tab-body" id="g-tab-macros" ${_gTab !== 'macros' ? 'style="display:none"' : ''}>
        ${gMacros.length
          ? gMacros.map(m => `<div class="smac-row custom-macro-row"><div class="custom-macro-fields">
              <span class="cm-name-ro">${esc(m.name) || '(no macro picked)'}</span>
              <code class="cm-uuid-ro">${esc(m.uuid || '')}</code>
            </div><div class="smac-chips">${(m.triggers || []).map(t => `<span class="cm-chip active" style="pointer-events:none">${esc(t)}</span>`).join('') || '<span class="cm-empty" style="margin:0">no triggers</span>'}</div></div>`).join('')
          : '<p class="cm-empty">No global macros yet — push one from a style.</p>'}
      </div>
      <div class="style-tab-body" id="g-tab-stage" ${_gTab !== 'stage' ? 'style="display:none"' : ''}>
        ${gStage.length
          ? gStage.map(d => `<div class="smac-row custom-macro-row"><div class="custom-macro-fields">
              <span class="cm-name-ro">${esc(d.name) || '(no layout picked)'}</span>
              <code class="cm-uuid-ro">${esc(d.uuid || '')}</code>
            </div><div class="smac-chips">${(d.triggers || []).map(t => `<span class="cm-chip active" style="pointer-events:none">${esc(t)}</span>`).join('') || '<span class="cm-empty" style="margin:0">no triggers</span>'}</div></div>`).join('')
          : '<p class="cm-empty">No global stage displays yet — push one from a style.</p>'}
      </div>
      <div class="style-tab-body" id="g-tab-responseCard" ${_gTab !== 'responseCard' ? 'style="display:none"' : ''}>
        <table class="bo-table"><thead><tr><th>Name</th><th>Role</th><th>Text</th><th>X</th><th>Y</th><th>W</th><th>H</th></tr></thead>
        <tbody>${gRc.map(el => `<tr><td>${esc(el.name)}</td><td>${esc(el.role)}</td><td>${esc(el.text || '—')}</td><td>${el.x}</td><td>${el.y}</td><td>${el.w}</td><td>${el.h}</td></tr>`).join('')}</tbody></table>
      </div>
    </fieldset>
  </div>`;

  document.getElementById('style-scheme-select')?.addEventListener('change', e => {
    state.activeSchemeId = e.target.value;
    renderStylePanel(panel);
  });

  panel.querySelectorAll('[data-gbotab]').forEach(btn => {
    btn.addEventListener('click', () => {
      _boActiveTab = btn.dataset.gbotab;
      renderGlobalPanel(panel, schemeOptionsHTML);
    });
  });

  panel.querySelectorAll('[data-gtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      _styleTab = btn.dataset.gtab;
      panel.querySelectorAll('[data-gtab]').forEach(b => b.classList.toggle('active', b.dataset.gtab === _styleTab));
      panel.querySelectorAll('.style-tab-body').forEach(body => {
        body.style.display = body.id === `g-tab-${_styleTab}` ? '' : 'none';
      });
    });
  });
}

// Spreadsheet-style data grid for Text tab — one row per element, one column per property.
function renderSchemeGrid(sv, rs, dis) {
  const sections = [
    { label: 'Display 1', rows: [
      { id: 'body1',  lbl: 'Body',        fontF: 'bodyFont',      advK: 'bodyFontAdv',      sizeF: 'bodySize' },
      { id: 'bold1',  lbl: 'Bold',        fontF: 'boldFont',      advK: 'boldFontAdv',      sizeF: null },
      { id: 'title1', lbl: 'Title',       fontF: 'titleFont',     advK: 'titleFontAdv',     sizeF: 'titleSize' },
      { id: 'point1', lbl: 'Point',       fontF: 'pointFont',     advK: 'pointFontAdv',     sizeF: 'pointSize' },
      { id: 'rcBody1',  lbl: 'RC Body',   fontF: 'rcBodyFont',    advK: 'rcBodyFontAdv',    sizeF: 'rcBodySize' },
      { id: 'rcTitle1', lbl: 'RC Title',  fontF: 'rcTitleFont',   advK: 'rcTitleFontAdv',   sizeF: 'rcTitleSize' },
    ]},
    { label: 'Display 2', rows: [
      { id: 'body2',  lbl: 'Body',        fontF: 'propBodyFont',  advK: 'propBodyFontAdv',  sizeF: 'propBodySize' },
      { id: 'bold2',  lbl: 'Bold',        fontF: 'propBoldFont',  advK: 'propBoldFontAdv',  sizeF: null },
      { id: 'title2', lbl: 'Title',       fontF: 'propTitleFont', advK: 'propTitleFontAdv', sizeF: 'propTitleSize' },
      { id: 'point2', lbl: 'Point',       fontF: 'propPointFont', advK: 'propPointFontAdv', sizeF: 'propPointSize' },
      { id: 'pointStacked', lbl: 'Point Stacked', fontF: 'pointStackedFont', advK: 'pointStackedFontAdv', sizeF: 'pointStackedSize' },
    ]},
    { label: 'Display 3', rows: [
      { id: 'notes',      lbl: 'Slide Notes', fontF: 'notesFont',     advK: 'notesFontAdv',     sizeF: 'notesSize' },
      { id: 'notesBold',  lbl: 'Notes Alt',   fontF: 'notesBoldFont', advK: 'notesBoldFontAdv', sizeF: null },
    ]},
    { label: 'Utility', rows: [
      { id: 'se',    lbl: 'Utility',     fontF: 'startEndFont',  advK: 'startEndFontAdv',  sizeF: 'startEndSize' },
      { id: 'live',  lbl: 'Live Badge',  fontF: 'liveFont',      advK: 'liveFontAdv',      sizeF: 'liveSize' },
      { id: 'queue', lbl: 'Queue',       fontF: 'queueFont',     advK: 'queueFontAdv',     sizeF: 'queueSize' },
    ]},
  ];

  const families = (_fontFamilyMap && typeof _fontFamilyMap === 'object')
    ? Object.keys(_fontFamilyMap).sort((a, b) => a.localeCompare(b))
    : [];

  const famOptsFn = (curFam) => families.length
    ? families.map(f => `<option value="${esc(f)}"${f === curFam ? ' selected' : ''}>${esc(f)}</option>`).join('')
    : `<option value="${esc(curFam || '')}">${esc(curFam || '—')}</option>`;

  const styOptsFn = (curFam, curPS) => {
    const arr = _fontFamilyMap?.[curFam];
    if (arr && arr.length) return arr.map(({ style, postscript }) =>
      `<option value="${esc(postscript)}"${postscript === curPS ? ' selected' : ''}>${esc(style)}</option>`
    ).join('');
    return `<option value="${esc(curPS || '')}">${esc(parseFontPS(curPS || '').style || 'Regular')}</option>`;
  };

  const colorVal = (v, fb = '#ffffff') => {
    if (!v) return fb;
    return v.startsWith('#') ? v : '#' + v;
  };

  const NUM_COLS = 34;

  const dataRow = ({ id, lbl, fontF, typoKey, advK, sizeF }) => {
    const ps      = fontF ? (sv[fontF] || '') : (typoKey ? (sv[typoKey] || '') : '');
    const curFam  = (fontF || typoKey) ? fontFamilyOf(ps) : '';
    const adv     = sv[advK] || FONT_ADV_DEFAULTS();
    const noFont  = !fontF && !typoKey;

    const fontTypoKey = fontF ? (FONT_FIELD_TO_TYPO_KEY[fontF] || null) : (typoKey || null);
    const advRaw  = rs[advK];
    const _globalAdv = ensureGlobalFontAdv()[advK] || FONT_ADV_DEFAULTS();
    const advOv   = (field) => {
      if (!advRaw) return false;
      const v = advRaw[field];
      if (v === undefined || v === null) return false;
      const def = _globalAdv[field];
      if (def === null || def === undefined) return false;
      if (typeof def === 'number') return Math.abs(Number(v) - def) > 0.01;
      if (typeof def === 'boolean') return !!v !== def;
      return v !== def;
    };
    const _globalTypo = ensureGlobalTypography();
    const fontOv     = fontTypoKey ? (rs.typography?.[fontTypoKey] != null && rs.typography?.[fontTypoKey] !== _globalTypo[fontTypoKey]) : false;
    const fontFieldOv = !!(fontF && rs.fontFields?.[fontF]);
    const sizeOv   = sizeF ? (rs.typography?.[sizeF] != null && Number(rs.typography?.[sizeF]) !== Number(_globalTypo[sizeF])) : false;
    const alignOv  = advOv('alignment');
    const vAlignOv = advOv('verticalAlignment');
    const sc = (ov) => ov ? ' sg-td-scheme' : '';

    const togCell  = (field) => {
      const glbOn = !!_globalAdv[field];
      return `<td class="sg-td sg-td-tog${sc(advOv(field))}" data-scheme="${advK}" data-field="${field}"><button type="button" class="fav-toggle sg-tog ${adv[field] ? 'on' : ''}${glbOn ? ' sg-tog-global' : ''}" data-scheme="${advK}" data-field="${field}" ${dis}></button></td>`;
    };
    const HA_ICONS = {
      '':       `<svg viewBox="0 0 14 10" fill="none" stroke="currentColor" stroke-linecap="round" width="14" height="10"><path d="M1 2h12M1 5.5h7M1 9h9" stroke-width="1.4"/></svg>`,
      center:   `<svg viewBox="0 0 14 10" fill="none" stroke="currentColor" stroke-linecap="round" width="14" height="10"><path d="M1 2h12M3.5 5.5h7M2.5 9h9" stroke-width="1.4"/></svg>`,
      right:    `<svg viewBox="0 0 14 10" fill="none" stroke="currentColor" stroke-linecap="round" width="14" height="10"><path d="M1 2h12M6 5.5h7M4 9h9" stroke-width="1.4"/></svg>`,
      justify:  `<svg viewBox="0 0 14 10" fill="none" stroke="currentColor" stroke-linecap="round" width="14" height="10"><path d="M1 2h12M1 5.5h12M1 9h9" stroke-width="1.4"/></svg>`,
    };
    const VA_ICONS = {
      '':       `<svg viewBox="0 0 10 12" fill="none" stroke="currentColor" stroke-linecap="round" width="10" height="12"><path d="M1 2h8" stroke-width="2"/><path d="M2.5 5.5h5M2.5 9h5" stroke-width="1.4"/></svg>`,
      middle:   `<svg viewBox="0 0 10 12" fill="none" stroke="currentColor" stroke-linecap="round" width="10" height="12"><path d="M2 3h6M2 6h6M2 9h6" stroke-width="1.4"/></svg>`,
      bottom:   `<svg viewBox="0 0 10 12" fill="none" stroke="currentColor" stroke-linecap="round" width="10" height="12"><path d="M2.5 3h5M2.5 6.5h5" stroke-width="1.4"/><path d="M1 10h8" stroke-width="2"/></svg>`,
    };
    const glbAlign = _globalAdv.alignment ?? '';
    const glbVAlign = _globalAdv.verticalAlignment ?? '';
    const haBtn = (v, title) => {
      const isOn = adv.alignment === v;
      const isGlb = glbAlign === v;
      return `<td class="sg-td sg-td-align${alignOv ? ' sg-td-scheme' : ''}" data-scheme="${advK}" data-field="alignment"><button type="button" class="sg-halign-btn sg-align-cell${isOn ? ' on' : ''}${isGlb ? ' sg-align-global' : ''}" data-scheme="${advK}" data-val="${v}" title="${title}" ${dis}>${HA_ICONS[v] || ''}</button></td>`;
    };
    const vaBtn = (v, title) => {
      const isOn = adv.verticalAlignment === v;
      const isGlb = glbVAlign === v;
      return `<td class="sg-td sg-td-align${vAlignOv ? ' sg-td-scheme' : ''}" data-scheme="${advK}" data-field="verticalAlignment"><button type="button" class="sg-valign-btn sg-align-cell${isOn ? ' on' : ''}${isGlb ? ' sg-align-global' : ''}" data-scheme="${advK}" data-val="${v}" title="${title}" ${dis}>${VA_ICONS[v] || ''}</button></td>`;
    };
    const numCell  = (field, dflt, step) =>
      `<td class="sg-td${sc(advOv(field))}" data-scheme="${advK}" data-field="${field}"><input type="number" class="fav-num sg-num" data-scheme="${advK}" data-field="${field}" value="${adv[field] ?? dflt}" step="${step}" ${dis}></td>`;
    const colorCell = (field, fb) =>
      `<td class="sg-td sg-td-color${sc(advOv(field))}" data-scheme="${advK}" data-field="${field}"><input type="color" class="sg-adv-color" data-scheme="${advK}" data-field="${field}" value="${colorVal(adv[field], fb)}" ${dis}></td>`;

    return `<tr class="sg-row" data-rowid="${id}">
      <th scope="row" class="sg-row-lbl">${esc(lbl)}</th>
      <td class="sg-td sg-td-fam${sc(fontOv || fontFieldOv)}" data-typokey="${fontTypoKey || ''}">${noFont ? '<span class="sg-na">—</span>'
        : typoKey ? `<select class="sg-typo-fam sg-fam" id="sg-typo-fam-${id}" data-typokey="${typoKey}" ${dis}>${famOptsFn(curFam)}</select>`
        : `<select class="sf-fam-select sg-fam" id="sf-fam-${fontF}" ${dis}>${famOptsFn(curFam)}</select>`}</td>
      <td class="sg-td sg-td-sty${sc(fontOv || fontFieldOv)}" data-typokey="${fontTypoKey || ''}">${noFont ? '<span class="sg-na">—</span>'
        : typoKey ? `<select class="sg-typo-sty sg-sty" id="sg-typo-sty-${id}" data-typokey="${typoKey}" ${dis}>${styOptsFn(curFam, ps)}</select>`
        : `<select class="sf-sty-select sg-sty" id="sf-sty-${fontF}" ${dis}>${styOptsFn(curFam, ps)}</select>`}</td>
      <td class="sg-td sg-td-color${sc(advOv('color'))}" data-scheme="${advK}" data-field="color"><input type="color" class="sg-adv-color sg-color" data-scheme="${advK}" data-field="color" value="${colorVal(adv.color)}" ${dis}></td>
      <td class="sg-td${sc(sizeOv)}" data-typokey="${sizeF || ''}">${sizeF
        ? `<input type="number" class="sz-input sf-size sg-size" id="ss-${sizeF}" value="${sv[sizeF] ?? 44}" min="1" max="400" step="1" ${dis}>`
        : '<span class="sg-na">—</span>'}</td>
      ${togCell('bold')}${togCell('italic')}${togCell('underline')}${togCell('strikethrough')}
      <td class="sg-td${sc(advOv('capitalization'))}" data-scheme="${advK}" data-field="capitalization"><select class="fav-select sg-caps" data-scheme="${advK}" data-field="capitalization" ${dis}>
        <option value="" ${adv.capitalization === '' ? 'selected' : ''}>—</option>
        <option value="allCaps" ${adv.capitalization === 'allCaps' ? 'selected' : ''}>ALL</option>
        <option value="titleCase" ${adv.capitalization === 'titleCase' ? 'selected' : ''}>Title</option>
        <option value="startCase" ${adv.capitalization === 'startCase' ? 'selected' : ''}>Start</option>
        <option value="allLower" ${adv.capitalization === 'allLower' ? 'selected' : ''}>lower</option>
      </select></td>
      <td class="sg-td${sc(advOv('scaleBehavior'))}" data-scheme="${advK}" data-field="scaleBehavior"><select class="fav-select sg-scale" data-scheme="${advK}" data-field="scaleBehavior" ${dis}>
        <option value="" ${!adv.scaleBehavior ? 'selected' : ''}>—</option>
        <option value="SCALE_BEHAVIOR_SCALE_FONT_DOWN" ${adv.scaleBehavior === 'SCALE_BEHAVIOR_SCALE_FONT_DOWN' ? 'selected' : ''}>↓</option>
        <option value="SCALE_BEHAVIOR_SCALE_FONT_UP_DOWN" ${adv.scaleBehavior === 'SCALE_BEHAVIOR_SCALE_FONT_UP_DOWN' ? 'selected' : ''}>↕</option>
        <option value="none" ${adv.scaleBehavior === 'none' ? 'selected' : ''}>✕</option>
      </select></td>
      ${haBtn('', 'Left')}${haBtn('center', 'Center')}${haBtn('right', 'Right')}${haBtn('justify', 'Justify')}
      ${vaBtn('', 'Top')}${vaBtn('middle', 'Middle')}${vaBtn('bottom', 'Bottom')}
      ${togCell('strokeEnabled')}
      ${numCell('strokeWidth', 1, 0.5)}
      ${colorCell('strokeColor', '#000000')}
      ${togCell('shadowEnabled')}
      ${colorCell('shadowColor', '#000000')}
      ${numCell('shadowAngle', 315, 15)}
      ${numCell('shadowOffset', 5, 0.5)}
      ${numCell('shadowBlur', 5, 0.5)}
      ${numCell('charSpacing', 0, 0.5)}
      ${numCell('lineHeight', 1, 0.05)}
      ${numCell('paragraphSpacingBefore', 0, 1)}
      ${numCell('paragraphSpacingAfter', 0, 1)}
      ${numCell('marginTop', 0, 1)}
      ${numCell('marginBottom', 0, 1)}
      ${numCell('marginLeft', 0, 1)}
      ${numCell('marginRight', 0, 1)}
    </tr>`;
  };

  const tbody = sections.map(sec =>
    `<tr class="sg-section-hd"><th colspan="${NUM_COLS}" class="sg-section-lbl">${esc(sec.label)}</th></tr>` +
    sec.rows.map(dataRow).join('')
  ).join('');

  return `<div class="sg-scroll"><table class="sg-table">
    <thead>
      <tr class="sg-grp-row">
        <th rowspan="2" class="sg-corner"></th>
        <th colspan="2" class="sg-grp">Font</th>
        <th class="sg-grp sg-solo">Color</th>
        <th class="sg-grp sg-solo">Size</th>
        <th colspan="4" class="sg-grp">Formatting</th>
        <th rowspan="2" class="sg-grp sg-hd-solo">Caps</th>
        <th rowspan="2" class="sg-grp sg-hd-solo">Scale</th>
        <th colspan="4" class="sg-grp">H-Align</th>
        <th colspan="3" class="sg-grp">V-Align</th>
        <th colspan="3" class="sg-grp">Stroke</th>
        <th colspan="5" class="sg-grp">Shadow</th>
        <th rowspan="2" class="sg-grp sg-hd-solo">Char</th>
        <th rowspan="2" class="sg-grp sg-hd-solo">Line</th>
        <th colspan="2" class="sg-grp">Para</th>
        <th colspan="4" class="sg-grp">Margins</th>
      </tr>
      <tr class="sg-col-row">
        <th class="sg-col">font</th><th class="sg-col">weight</th>
        <th class="sg-col"></th>
        <th class="sg-col">pt</th>
        <th class="sg-col">B</th><th class="sg-col"><i>I</i></th><th class="sg-col"><u>U</u></th><th class="sg-col"><s>S</s></th>
        <th class="sg-col">L</th><th class="sg-col">C</th><th class="sg-col">R</th><th class="sg-col">J</th>
        <th class="sg-col">T</th><th class="sg-col">M</th><th class="sg-col">B</th>
        <th class="sg-col">on</th><th class="sg-col">w</th><th class="sg-col">clr</th>
        <th class="sg-col">on</th><th class="sg-col">clr</th><th class="sg-col">°</th><th class="sg-col">px</th><th class="sg-col">blur</th>
        <th class="sg-col">↑</th><th class="sg-col">↓</th>
        <th class="sg-col">T</th><th class="sg-col">B</th><th class="sg-col">L</th><th class="sg-col">R</th>
      </tr>
    </thead>
    <tbody>${tbody}</tbody>
  </table></div>`;
}

function renderStylePanel(panel) {
  if (!state.styleSchemes || !state.styleSchemes.length) {
    state.styleSchemes  = [DEFAULT_STYLE_SCHEME()];
    state.activeSchemeId = 'default';
  }
  const schemeOptionsHTML = state.styleSchemes.map(p =>
    `<option value="${esc(p.id)}"${p.id === state.activeSchemeId ? ' selected' : ''}>${esc(p.name)}</option>`
  ).join('');
  if (state.activeSchemeId === '__global__') {
    renderGlobalPanel(panel, schemeOptionsHTML);
    return;
  }
  const scheme = state.styleSchemes.find(p => p.id === state.activeSchemeId) || state.styleSchemes[0];
  if (!['palette', 'text', 'layout', 'motion', 'macros', 'stage', 'responseCard', 'qr'].includes(_styleTab)) _styleTab = 'text';
  const locked = !!scheme.isLocked;
  const dis    = locked ? 'disabled' : '';
  ensureGlobalTypography();
  ensureSchemeTypography(scheme);
  const schemeView = applyTypographyToStyle(scheme);
  const resolvedTypography = resolveSchemeTypography(scheme);

  const FONT_EXTRA_COLORS = {
    bodyFontAdv:  [{ label: 'Fill',   field: 'bodyFill'    }],
  };
  // Plain-language explanations of each font slot (technical term kept in the label,
  // explanation surfaced on hover via a ? badge). Keyed by font field.
  const FONT_TIPS = {
    bodyFont:      `Scripture & body text on the ${dn('mainScreen')}.`,
    propBodyFont:  `Scripture body text on the ${dn('ledWall')} behind the stage (the "prop"), separate from the ${dn('mainScreen')}.`,
    pointFont:     `Point slides — the main point text on the ${dn('mainScreen')}.`,
    propPointFont: `Point slides — the point text on the ${dn('ledWall')} behind the stage (the "prop").`,
    titleFont:    'Slide title text — e.g. a scripture reference or Response Card title.',
    startEndFont: 'Utility slides like Start, End, and Response Card Hold.',
    notesFont:    `Speaker notes shown only on the ${dn('monitor')}, not to the room.`,
    liveFont:     `The small "live" badge shown on the ${dn('monitor')} to mark the active slide.`,
    queueFont:    'The upcoming-slide queue strip down the side of the slide.',
  };

  panel.innerHTML = `
    <div class="slide-form">
      <h2>
        Styles
      </h2>
      <p class="scheme-intro">
        A style sets the visual look of your slides — fonts, sizes, colours, animations and positions.
        Pick one to use for this deck, or duplicate to make your own.
      </p>

      <div class="scheme-toolbar">
        <select id="style-scheme-select" class="scheme-tb-select" title="Active style">
          <option value="__global__">◈ Global</option>
          ${schemeOptionsHTML}
        </select>
        <input type="text" id="style-scheme-name" class="scheme-tb-name" value="${esc(scheme.name)}" placeholder="Style name" ${dis}>
        <div class="scheme-tb-icons">
          <button class="btn-scheme-icon" id="btn-scheme-new" data-tip-key="scheme-new">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
          <button class="btn-scheme-icon" id="btn-scheme-dupe" data-tip-key="scheme-dupe">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4.5" y="1" width="7.5" height="8.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 4v6.5A1.5 1.5 0 0 0 2.5 12H9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
          <span class="scheme-tb-sep"></span>
          <button class="btn-scheme-icon" id="btn-scheme-import" data-tip-key="scheme-import">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v7.5M3.5 5l3 3.5 3-3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 9.5v1.5A1 1 0 0 0 2 12h9a1 1 0 0 0 1-1V9.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          </button>
          <input type="file" id="scheme-import-file" accept=".json" style="display:none">
          <button class="btn-scheme-icon" id="btn-scheme-export" data-tip-key="scheme-export">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 8.5V1M3.5 4.5l3-3.5 3 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 9.5v1.5A1 1 0 0 0 2 12h9a1 1 0 0 0 1-1V9.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          </button>
          <button class="btn-scheme-icon btn-scheme-icon-danger" id="btn-scheme-delete" title="Delete style"
            ${state.styleSchemes.length <= 1 ? 'disabled' : ''}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M5 3.5V2h3v1.5M4 3.5l.5 7h4l.5-7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="btn-scheme-lock ${locked ? 'locked' : 'unlocked'}" id="btn-scheme-lock"
            title="${locked ? 'Unlock to edit' : 'Lock style'}">${locked ? '🔒' : '🔓'}</button>
        </div>
      </div>

      ${locked ? `
      <div class="scheme-lock-banner">
        <span class="slb-icon">🔒</span>
        <div class="slb-text">
          <strong>This style is locked</strong>
          <span>Locked so it can't be changed by accident. Duplicate it to make your own editable copy, or unlock to edit this one directly.</span>
        </div>
        <div class="slb-actions">
          <button class="btn-sm" id="btn-lock-duplicate">Duplicate</button>
          <button class="btn-sm" id="btn-lock-unlock">Unlock</button>
        </div>
      </div>` : ''}

      <div class="style-tabs">
        <button class="style-tab style-tab-palette${_styleTab === 'palette' ? ' active' : ''}" data-tab="palette">Style</button>
        <span class="style-tab-sep"></span>
        ${[['text','Text'],['layout','Layout'],['motion','Motion']].map(([t, lbl]) => `
          <button class="style-tab${_styleTab === t ? ' active' : ''}" data-tab="${t}">${lbl}</button>`).join('')}
        <span class="style-tab-sep"></span>
        <button class="style-tab style-tab-global${_styleTab === 'macros' ? ' active' : ''}" data-tab="macros">Macros</button>
        <button class="style-tab style-tab-global${_styleTab === 'stage' ? ' active' : ''}" data-tab="stage">Stage</button>
        <button class="style-tab style-tab-global${_styleTab === 'responseCard' ? ' active' : ''}" data-tab="responseCard">Response Card</button>
        <button class="style-tab style-tab-global${_styleTab === 'qr' ? ' active' : ''}" data-tab="qr">QR Code</button>
      </div>

      <fieldset class="scheme-fields ${locked ? 'scheme-locked' : ''}" ${locked ? 'disabled' : ''}>

      <!-- PALETTE tab — scheme-level font/color slots -->
      <div class="style-tab-body" id="style-tab-palette" ${_styleTab !== 'palette' ? 'style="display:none"' : ''}>
        ${renderPaletteTab(scheme, resolvedTypography, dis)}
      </div>

      <!-- TEXT tab — canvas map + data grid -->
      <div class="style-tab-body" id="style-tab-text" ${_styleTab !== 'text' ? 'style="display:none"' : ''}>
        <div class="sg-lp-compact">${layoutPreview(scheme, _textSel)}</div>

        ${renderSchemeGrid(schemeView, scheme, dis)}
      </div>

      <!-- MOTION tab — Transitions + Build Order -->
      <div class="style-tab-body" id="style-tab-motion" ${_styleTab !== 'motion' ? 'style="display:none"' : ''}>
        <div class="motion-subtabs">
          ${[['transitions', 'Transitions'], ['build', 'Build Order']].map(([t, lbl]) =>
            `<button class="motion-subtab${_motionTab === t ? ' active' : ''}" data-mtab="${t}">${lbl}</button>`).join('')}
        </div>

        <div class="motion-sub" id="motion-sub-transitions" ${_motionTab !== 'transitions' ? 'style="display:none"' : ''}>
          ${(() => {
            const glbMotion = ensureGlobalMotion();
            const slideInherit = scheme.transitionType == null;
            const curType = scheme.transitionType ?? glbMotion.transitionType ?? 'fade';
            const curDur  = scheme.transitionDuration ?? glbMotion.transitionDuration ?? 0.6;
            const propInherit = scheme.propTransitionType == null;
            const curPropType = scheme.propTransitionType ?? glbMotion.propTransitionType ?? 'fade';
            const curPropDur  = scheme.propTransitionDuration ?? glbMotion.propTransitionDuration ?? 0.6;
            const wfBadge = (inherit, field) => `
              <div class="wf-row">
                <span class="wf-badge ${inherit ? 'wf-inherit' : 'wf-custom'}">${inherit ? '● Using Global' : '● Custom'}</span>
                ${inherit ? '' : `<button class="btn-sm wf-reset" type="button" data-wf="${field}" ${dis}>↺ Reset to Global</button>`}
                <button class="btn-sm wf-push" type="button" data-wf="${field}" ${dis}>↑ Push to Global</button>
              </div>`;
            return `
          <div class="trans-cols">
            <div class="trans-col">
              <div class="trans-col-title">Slide</div>
              <div class="segmented-control trans-seg" id="adv-trans-seg">
                <button data-val="fade"     class="${curType === 'fade'     ? 'active' : ''}" ${dis}>Fade</button>
                <button data-val="dissolve" class="${curType === 'dissolve' ? 'active' : ''}" ${dis}>Dissolve</button>
                <button data-val="cut"      class="${curType === 'cut'      ? 'active' : ''}" ${dis}>Cut</button>
              </div>
              <div class="trans-dur-wrap" id="adv-dur-field" style="${curType === 'cut' ? 'display:none' : ''}">
                <input type="number" id="adv-trans-dur" value="${curDur}" min="0.1" max="5" step="0.1" class="trans-dur" ${dis}>
                <span class="fav-unit">s</span>
              </div>
              ${wfBadge(slideInherit, 'transition')}
            </div>
            <div class="trans-col">
              <div class="trans-col-title">Prop</div>
              <div class="segmented-control trans-seg" id="adv-prop-trans-seg">
                <button data-val="fade"     class="${curPropType === 'fade'     ? 'active' : ''}" ${dis}>Fade</button>
                <button data-val="dissolve" class="${curPropType === 'dissolve' ? 'active' : ''}" ${dis}>Dissolve</button>
                <button data-val="cut"      class="${curPropType === 'cut'      ? 'active' : ''}" ${dis}>Cut</button>
              </div>
              <div class="trans-dur-wrap" id="adv-prop-dur-field" style="${curPropType === 'cut' ? 'display:none' : ''}">
                <input type="number" id="adv-prop-trans-dur" value="${curPropDur}" min="0.1" max="5" step="0.1" class="trans-dur" ${dis}>
                <span class="fav-unit">s</span>
              </div>
              ${wfBadge(propInherit, 'propTransition')}
            </div>
          </div>`;
          })()}
        </div>

        <div class="motion-sub" id="motion-sub-build" ${_motionTab !== 'build' ? 'style="display:none"' : ''}>
          <p class="style-group-hint">Advanced — controls how each element animates in and out, per slide type.</p>
          <div class="wf-row">
            <span class="wf-badge ${scheme.buildOrders == null ? 'wf-inherit' : 'wf-custom'}">${scheme.buildOrders == null ? '● Using Global' : '● Custom'}</span>
            ${scheme.buildOrders == null ? '' : `<button class="btn-sm wf-reset" type="button" data-wf="buildOrders" ${dis}>↺ Reset to Global</button>`}
            <button class="btn-sm wf-push" type="button" data-wf="buildOrders" ${dis}>↑ Push to Global</button>
          </div>
          <div class="bo-tabs" id="bo-tabs">
            ${[['content','Scripture'],['point','Point'],['blank','Blank'],['startEnd','Utility']].map(([tab, lbl]) =>
              `<button class="bo-tab${_boActiveTab === tab ? ' active' : ''}" data-tab="${tab}">${lbl}</button>`
            ).join('')}
          </div>
          <div id="bo-table-wrap">
            ${renderBuildTable(_boActiveTab, scheme, locked)}
          </div>
        </div>
      </div>

      <!-- LAYOUT tab -->
      <div class="style-tab-body" id="style-tab-layout" ${_styleTab !== 'layout' ? 'style="display:none"' : ''}>
        ${layoutPreview(scheme, _layoutSel)}
        <p class="style-group-hint">X/Y/W/H in pixels; use the align buttons for quick centering.</p>
        ${lyTable(lyRows(), scheme, dis)}
      </div>

      </fieldset>

      <!-- MACROS tab — lives outside fieldset so it's editable even on locked schemes -->
      <div class="style-tab-body" id="style-tab-macros" ${_styleTab !== 'macros' ? 'style="display:none"' : ''}>
        <div id="scheme-macros-tab"></div>
      </div>

      <!-- STAGE tab — per-scheme stage display entries -->
      <div class="style-tab-body" id="style-tab-stage" ${_styleTab !== 'stage' ? 'style="display:none"' : ''}>
        <div id="scheme-stage-tab"></div>
      </div>

      <!-- RESPONSE CARD tab — display-2 (LED wall) prop elements -->
      <div class="style-tab-body" id="style-tab-responseCard" ${_styleTab !== 'responseCard' ? 'style="display:none"' : ''}>
        <div id="scheme-rc-tab"></div>
      </div>

      <!-- QR CODE tab — deck-wide macro that fires on QR-on blanks (not per-scheme) -->
      <div class="style-tab-body" id="style-tab-qr" ${_styleTab !== 'qr' ? 'style="display:none"' : ''}>
        <div id="scheme-qr-tab"></div>
      </div>

    </div>
  `;

  // Top-level tabs: Text / Layout / Motion / Preview / Macros / Stage
  panel.querySelectorAll('.style-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _styleTab = btn.dataset.tab;
      panel.querySelectorAll('.style-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === _styleTab));
      panel.querySelectorAll('.style-tab-body').forEach(body => {
        body.style.display = body.id === `style-tab-${_styleTab}` ? '' : 'none';
      });
    });
  });

  // Macros tab
  attachSchemesMacrosTab('scheme-macros-tab');
  // Stage tab
  attachSchemesStageTab('scheme-stage-tab');
  // Response Card tab (display-2 prop elements)
  attachSchemesResponseCardTab('scheme-rc-tab');
  // QR Code tab (deck-wide macro, not per-scheme)
  attachSchemesQRTab('scheme-qr-tab');

  // Motion sub-tabs: Transitions / Build Order
  panel.querySelectorAll('.motion-subtab').forEach(btn => {
    btn.addEventListener('click', () => {
      _motionTab = btn.dataset.mtab;
      panel.querySelectorAll('.motion-subtab').forEach(b => b.classList.toggle('active', b.dataset.mtab === _motionTab));
      panel.querySelectorAll('.motion-sub').forEach(sub => {
        sub.style.display = sub.id === `motion-sub-${_motionTab}` ? '' : 'none';
      });
    });
  });

  // Layout visual preview ↔ table row linking (works whether or not the scheme is locked)
  const applyRegionSel = (slug, scroll) => {
    panel.querySelectorAll('#style-tab-layout .lp-region').forEach(b => b.classList.toggle('sel', b.dataset.region === slug));
    panel.querySelectorAll('.ly-table tbody tr[data-region]').forEach(tr => {
      const on = tr.dataset.region === slug;
      tr.classList.toggle('ly-row-selected', on);
      if (on && scroll) tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  };
  const selectRegion = (slug) => { _layoutSel = slug; applyRegionSel(slug, true); };
  panel.querySelectorAll('#style-tab-layout .lp-region').forEach(b => b.addEventListener('click', () => selectRegion(b.dataset.region)));
  panel.querySelectorAll('.ly-row-name-click').forEach(c => c.addEventListener('click', () => {
    const tr = c.closest('tr'); if (tr?.dataset.region) selectRegion(tr.dataset.region);
  }));
  if (_layoutSel) applyRegionSel(_layoutSel, false);


  // Locked-scheme banner actions
  document.getElementById('btn-lock-unlock')?.addEventListener('click', () => {
    const s = getScheme(); if (!s) return;
    s.isLocked = false;
    saveState(); renderStylePanel(panel);
  });
  document.getElementById('btn-lock-duplicate')?.addEventListener('click', () => {
    document.getElementById('btn-scheme-dupe')?.click();
  });

  const getScheme = () => state.styleSchemes.find(x => x.id === state.activeSchemeId);

  // Build order tabs + table handlers
  attachBuildOrderHandlers(getScheme, panel, locked);

  // Scheme select / new / dupe / delete
  document.getElementById('style-scheme-select').addEventListener('change', e => {
    state.activeSchemeId = e.target.value;
    if (e.target.value !== '__global__') saveState();
    renderStylePanel(panel);
  });
  document.getElementById('btn-scheme-new').addEventListener('click', () => {
    const p = { ...deepClone(DEFAULT_STYLE_SCHEME()), id: 'scheme_' + Date.now(), name: 'New Scheme', isLocked: false };
    for (const f of LAYOUT_FIELDS) p[f] = null;
    for (const f of MOTION_SCALAR_FIELDS) p[f] = null;
    for (const f of Object.keys(D2_ADV_INHERIT)) p[f] = null;   // Display 2 inherits Display 1
    p.buildOrders = null; p.macros = null; p.stageDisplays = null; p.rcElements = null;
    state.styleSchemes.push(p); state.activeSchemeId = p.id;
    saveState(); renderStylePanel(panel);
  });
  document.getElementById('btn-scheme-dupe').addEventListener('click', () => {
    const src = getScheme() || state.styleSchemes[0];
    const d   = { ...deepClone(src), id: 'scheme_' + Date.now(), name: src.name + ' Copy', isDefault: false, isLocked: false };
    state.styleSchemes.push(d); state.activeSchemeId = d.id;
    saveState(); renderStylePanel(panel);
  });
  document.getElementById('btn-scheme-delete').addEventListener('click', () => {
    const s = getScheme();
    if (!s || state.styleSchemes.length <= 1) return;
    state.styleSchemes  = state.styleSchemes.filter(p => p.id !== state.activeSchemeId);
    state.activeSchemeId = state.styleSchemes[0].id;
    saveState(); renderStylePanel(panel);
  });

  // Import / export a palette as a standalone JSON file
  document.getElementById('btn-scheme-export').addEventListener('click', () => {
    const s = getScheme() || state.styleSchemes[0];
    if (!s) return;
    const { isDefault, isLocked, ...portable } = deepClone(s);
    const json = JSON.stringify(portable, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const slug = (s.name || 'palette').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'palette';
    const a = Object.assign(document.createElement('a'), { href: url, download: `${slug}.deckpro-palette.json` });
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
    toast('success', 'Style exported', `${s.name}.json`);
  });
  document.getElementById('btn-scheme-import').addEventListener('click', () => {
    document.getElementById('scheme-import-file').click();
  });
  document.getElementById('scheme-import-file').addEventListener('change', async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch (err) {
      toast('error', 'Could not import style', 'That file is not valid JSON.');
      return;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !parsed.typography) {
      toast('error', 'Could not import style', 'That file doesn\'t look like a DeckPro style.');
      return;
    }
    const p = { ...deepClone(parsed), id: 'scheme_' + Date.now(), name: (parsed.name || 'Imported Style'), isDefault: false, isLocked: false };
    state.styleSchemes.push(p); state.activeSchemeId = p.id;
    saveState(); renderStylePanel(panel);
    toast('success', 'Style imported', p.name);
  });

  // Lock / unlock
  document.getElementById('btn-scheme-lock').addEventListener('click', () => {
    const s = getScheme(); if (!s) return;
    s.isLocked = !s.isLocked;
    saveState(); renderStylePanel(panel);
  });

  // Scheme name
  document.getElementById('style-scheme-name').addEventListener('input', e => {
    const s = getScheme();
    if (s) { s.name = e.target.value; saveState(); }
  });

  if (locked) return; // no need to attach change handlers when locked

  document.querySelectorAll('.inherit-action').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const s = getScheme(); if (!s) return;
      ensureGlobalTypography();
      ensureSchemeTypography(s);
      const key = btn.dataset.key;
      const resolved = resolveSchemeTypography(s)[key];
      if (btn.dataset.action === 'push-global') {
        const inheritCount = state.styleSchemes.filter(x => !(x.typography?.[key])).length;
        const customCount  = state.styleSchemes.filter(x =>  !!(x.typography?.[key])).length;
        const msg = `Push "${key}" to Global?\n\n${inheritCount} scheme${inheritCount === 1 ? '' : 's'} will pick up this new default.${customCount ? `\n${customCount} scheme${customCount === 1 ? '' : 's'} with a custom value will not change.` : ''}`;
        if (!confirm(msg)) return;
        state.globalTypography[key] = COLOR_TYPO_KEYS.has(key) ? normalizeHexColor(resolved) : resolved;
      }
      s.typography[key] = null;
      saveState();
      renderStylePanel(panel);
    });
  });

  // Color pickers
  ['bodyFill'].forEach(field => {
    const picker = document.getElementById(`sc-${field}`);
    const hexIn  = document.getElementById(`sc-${field}-hex`);
    const s = getScheme();
    if (!picker || !hexIn || !s) return;
    picker.addEventListener('input', e => { s[field] = e.target.value; hexIn.value = e.target.value; saveState(); });
    hexIn.addEventListener('input', e => {
      if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) { s[field] = e.target.value; picker.value = e.target.value; saveState(); }
    });
  });

  // Font selects (family + style)
  ['bodyFont', 'propBodyFont', 'boldFont', 'propBoldFont', 'pointFont', 'propPointFont', 'pointStackedFont', 'rcBodyFont', 'rcTitleFont', 'titleFont', 'propTitleFont', 'startEndFont', 'notesFont', 'notesBoldFont', 'liveFont', 'queueFont'].forEach(field => {
    const famSel = document.getElementById(`sf-fam-${field}`);
    const stySel = document.getElementById(`sf-sty-${field}`);
    if (!famSel || !stySel) return;

    // Apply preview font to the select element itself
    const applyPreview = () => {
      const ps = stySel.value || famSel.value;
      famSel.style.fontFamily = `"${ps}", sans-serif`;
    };
    applyPreview();

    famSel.addEventListener('change', e => {
      const s = getScheme(); if (!s) return;
      const fam = e.target.value;
      const styles = _fontFamilyMap?.[fam] || [];
      stySel.innerHTML = styles.map(({ style, postscript }) =>
        `<option value="${esc(postscript)}">${esc(style)}</option>`
      ).join('') || `<option value="${esc(fam)}">${esc('Regular')}</option>`;
      if (!s.fontFields) s.fontFields = {};
      s.fontFields[field] = stySel.value;
      applyPreview();
      saveState();
      renderStylePanel(panel);
    });

    stySel.addEventListener('change', e => {
      const s = getScheme(); if (!s) return;
      if (!s.fontFields) s.fontFields = {};
      s.fontFields[field] = e.target.value;
      applyPreview();
      saveState();
      renderStylePanel(panel);
    });
  });

  // Palette tab — font slot selects (font1, font2, boldFont)
  ;['font1', 'font2', 'boldFont'].forEach(key => {
    const famSel = document.getElementById(`palette-fam-${key}`);
    const stySel = document.getElementById(`palette-sty-${key}`);
    if (!famSel || !stySel) return;
    const applyPreview = () => { famSel.style.fontFamily = `"${stySel.value || famSel.value}", sans-serif`; };
    applyPreview();
    famSel.addEventListener('change', e => {
      const s = getScheme(); if (!s) return;
      const fam = e.target.value;
      const styles = _fontFamilyMap?.[fam] || [];
      stySel.innerHTML = styles.map(({ style, postscript }) =>
        `<option value="${esc(postscript)}">${esc(style)}</option>`
      ).join('') || `<option value="${esc(fam)}">${esc('Regular')}</option>`;
      ensureSchemeTypography(s);
      s.typography[key] = stySel.value;
      applyPreview(); saveState(); renderStylePanel(panel);
    });
    stySel.addEventListener('change', e => {
      const s = getScheme(); if (!s) return;
      ensureSchemeTypography(s);
      s.typography[key] = e.target.value;
      applyPreview(); saveState(); renderStylePanel(panel);
    });
  });

  // Palette tab — color slot pickers (colorNeutral, colorAccent)
  ;['colorNeutral', 'colorAccent'].forEach(key => {
    const picker = document.getElementById(`palette-color-${key}`);
    const hexIn  = document.getElementById(`palette-hex-${key}`);
    const clearBtn = document.querySelector(`.palette-color-clear[data-key="${key}"]`);
    if (!picker || !hexIn) return;
    const commitColor = (hex, rerender = true) => {
      const s = getScheme(); if (!s) return;
      ensureSchemeTypography(s);
      s.typography[key] = normalizeHexColor(hex);
      saveState(); if (rerender) renderStylePanel(panel);
    };
    picker.addEventListener('input', e => { hexIn.value = e.target.value.replace(/^#/,''); commitColor(e.target.value, false); });
    picker.addEventListener('change', e => commitColor(e.target.value));
    hexIn.addEventListener('blur', e => {
      const v = '#' + e.target.value.replace(/^#/,'');
      if (/^#[0-9a-fA-F]{6}$/.test(v)) commitColor(v);
    });
    clearBtn?.addEventListener('click', () => {
      const s = getScheme(); if (!s) return;
      ensureSchemeTypography(s);
      s.typography[key] = null;
      saveState(); renderStylePanel(panel);
    });
  });

  // Size inputs
  ['bodySize', 'pointSize', 'titleSize', 'rcBodySize', 'rcTitleSize', 'startEndSize', 'propBodySize', 'propPointSize', 'pointStackedSize', 'propTitleSize', 'notesSize', 'liveSize', 'queueSize'].forEach(field => {
    const inp = document.getElementById(`ss-${field}`);
    if (!inp) return;
    inp.addEventListener('input', e => {
      const s = getScheme();
      if (!s) return;
      const val = parseInt(e.target.value, 10) || DEFAULT_GLOBAL_SIZES[field] || 44;
      const typoKey = SIZE_FIELD_TO_TYPO_KEY[field];
      if (typoKey) {
        ensureSchemeTypography(s);
        s.typography[typoKey] = val;
      } else {
        s[field] = val;
      }
      saveState();
    });
    inp.addEventListener('change', () => {
      if (SIZE_FIELD_TO_TYPO_KEY[field]) renderStylePanel(panel);
    });
  });

  // Transition
  document.getElementById('adv-trans-seg')?.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = getScheme(); if (!s) return;
      s.transitionType = btn.dataset.val;
      saveState(); renderStylePanel(panel);
    });
  });
  document.getElementById('adv-trans-dur')?.addEventListener('input', e => {
    const s = getScheme();
    if (s) { s.transitionDuration = parseFloat(e.target.value) || 0.6; saveState(); }
  });

  // Prop transition (global)
  document.getElementById('adv-prop-trans-seg')?.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = getScheme(); if (!s) return;
      s.propTransitionType = btn.dataset.val;
      saveState(); renderStylePanel(panel);
    });
  });
  document.getElementById('adv-prop-trans-dur')?.addEventListener('input', e => {
    const s = getScheme();
    if (s) { s.propTransitionDuration = parseFloat(e.target.value) || 0.6; saveState(); }
  });

  // Motion transition: whole-field reset-to-global / push-to-global
  panel.querySelectorAll('.wf-reset[data-wf="transition"], .wf-reset[data-wf="propTransition"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = getScheme(); if (!s) return;
      const isProp = btn.dataset.wf === 'propTransition';
      s[isProp ? 'propTransitionType' : 'transitionType'] = null;
      s[isProp ? 'propTransitionDuration' : 'transitionDuration'] = null;
      saveState(); renderStylePanel(panel);
    });
  });
  panel.querySelectorAll('.wf-push[data-wf="transition"], .wf-push[data-wf="propTransition"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = getScheme(); if (!s) return;
      const glbMotion = ensureGlobalMotion();
      if (btn.dataset.wf === 'propTransition') {
        glbMotion.propTransitionType = s.propTransitionType ?? glbMotion.propTransitionType;
        glbMotion.propTransitionDuration = s.propTransitionDuration ?? glbMotion.propTransitionDuration;
      } else {
        glbMotion.transitionType = s.transitionType ?? glbMotion.transitionType;
        glbMotion.transitionDuration = s.transitionDuration ?? glbMotion.transitionDuration;
      }
      saveState(); renderStylePanel(panel);
      toast('success', 'Pushed to Global', 'Every style inheriting this will now use it.');
    });
  });

  // Font advanced: numeric inputs
  document.querySelectorAll('.fav-num').forEach(inp => {
    inp.addEventListener('input', e => {
      const s = getScheme(); if (!s) return;
      const key   = inp.dataset.scheme;
      const field = inp.dataset.field;
      forkAdv(s, key);
      s[key][field] = parseFloat(inp.value) || 0;
      saveState();
    });
  });

  // Font advanced: vertical alignment buttons
  document.querySelectorAll('.fav-vert-align').forEach(seg => {
    if (seg.dataset.disabled) return;
    seg.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = getScheme(); if (!s) return;
        const key = seg.dataset.scheme;
        seg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        forkAdv(s, key);
        s[key].verticalAlignment = btn.dataset.val;
        saveState();
      });
    });
  });

  // Font advanced: alignment segmented control
  document.querySelectorAll('.fav-align').forEach(seg => {
    seg.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = getScheme(); if (!s) return;
        const key = seg.dataset.scheme;
        seg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        forkAdv(s, key);
        s[key].alignment = btn.dataset.val;
        saveState();
      });
    });
  });

  // Font advanced: italic / underline toggles
  document.querySelectorAll('.fav-toggle').forEach(lbl => {
    lbl.addEventListener('click', () => {
      const s = getScheme(); if (!s) return;
      const key   = lbl.dataset.scheme;
      const field = lbl.dataset.field;
      forkAdv(s, key);
      s[key][field] = !s[key][field];
      lbl.classList.toggle('on', s[key][field]);
      saveState();
    });
  });

  // Font advanced: capitalization select
  document.querySelectorAll('.fav-select').forEach(sel => {
    sel.addEventListener('change', e => {
      const s = getScheme(); if (!s) return;
      const key   = sel.dataset.scheme;
      const field = sel.dataset.field;
      forkAdv(s, key);
      s[key][field] = sel.value;
      saveState();
    });
  });

  // Font advanced: color pickers
  document.querySelectorAll('.fav-color').forEach(picker => {
    picker.addEventListener('input', e => {
      const s = getScheme(); if (!s) return;
      const key = picker.dataset.scheme;
      if (!key) return; // palette-tab color slots have their own handler; ignore here
      forkAdv(s, key);
      s[key].color = e.target.value; // always #RRGGBB from native picker
      const typoKey = ADV_FIELD_TO_TYPO_KEY[key];
      if (typoKey) {
        ensureSchemeTypography(s);
        s.typography[typoKey] = normalizeHexColor(e.target.value);
      }
      const hexEl = picker.closest('.color-input-wrap')?.querySelector('.fav-color-hex');
      if (hexEl) hexEl.value = e.target.value.replace(/^#/, '');
      saveState();
    });
    picker.addEventListener('change', () => {
      if (ADV_FIELD_TO_TYPO_KEY[picker.dataset.scheme]) renderStylePanel(panel);
    });
  });
  document.querySelectorAll('.fav-color-hex').forEach(hexIn => {
    hexIn.addEventListener('input', e => {
      const s = getScheme(); if (!s) return;
      const key = hexIn.dataset.scheme;
      if (!key) return; // palette-tab hex fields have their own handler; ignore here
      forkAdv(s, key);
      const raw = e.target.value.replace(/^#/, '');
      if (/^[0-9a-fA-F]{6}$/.test(raw)) {
        const full = '#' + raw;
        s[key].color = full;
        const typoKey = ADV_FIELD_TO_TYPO_KEY[key];
        if (typoKey) {
          ensureSchemeTypography(s);
          s.typography[typoKey] = normalizeHexColor(full);
        }
        const picker = hexIn.closest('.color-input-wrap')?.querySelector('.fav-color');
        if (picker) picker.value = full;
        saveState();
        if (typoKey) renderStylePanel(panel);
      }
    });
  });
  document.querySelectorAll('.fav-color-clear').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = getScheme(); if (!s) return;
      const key = btn.dataset.scheme;
      if (!key) return; // palette-tab clear buttons have their own handler; ignore here
      forkAdv(s, key);
      s[key].color = '';
      const typoKey = ADV_FIELD_TO_TYPO_KEY[key];
      if (typoKey) {
        ensureSchemeTypography(s);
        s.typography[typoKey] = null;
      }
      const wrap = btn.closest('.color-input-wrap');
      if (wrap) {
        wrap.querySelector('.fav-color').value = '#ffffff';
        wrap.querySelector('.fav-color-hex').value = '';
      }
      saveState();
      if (typoKey) renderStylePanel(panel);
    });
  });

  // Font advanced: stroke/shadow enable checkboxes
  document.querySelectorAll('.fav-chk').forEach(chk => {
    chk.addEventListener('change', () => {
      const s = getScheme(); if (!s) return;
      const key   = chk.dataset.scheme;
      const field = chk.dataset.field;
      forkAdv(s, key);
      s[key][field] = chk.checked;
      const body = chk.closest('.fav-section')?.querySelector('.fav-section-body');
      if (body) body.classList.toggle('fav-section-off', !chk.checked);
      saveState();
    });
  });

  // Font advanced: stroke/shadow color pickers
  document.querySelectorAll('.fav-sc').forEach(picker => {
    picker.addEventListener('input', e => {
      const s = getScheme(); if (!s) return;
      const key   = picker.dataset.scheme;
      const field = picker.dataset.which;
      forkAdv(s, key);
      s[key][field] = e.target.value;
      const hex = picker.closest('.fav-inline-row')?.querySelector('.fav-sc-hex[data-which="' + field + '"]');
      if (hex) hex.value = e.target.value.replace(/^#/, '');
      saveState();
    });
  });
  document.querySelectorAll('.fav-sc-hex').forEach(hexIn => {
    hexIn.addEventListener('input', e => {
      const s = getScheme(); if (!s) return;
      const key   = hexIn.dataset.scheme;
      const field = hexIn.dataset.which;
      forkAdv(s, key);
      const raw = e.target.value.replace(/^#/, '');
      if (/^[0-9a-fA-F]{6}$/.test(raw)) {
        const full = '#' + raw;
        s[key][field] = full;
        const picker = hexIn.closest('.fav-inline-row')?.querySelector('.fav-sc[data-which="' + field + '"]');
        if (picker) picker.value = full;
        saveState();
      }
    });
  });

  // Scheme grid: clear per-field font override (revert to palette)
  panel.querySelectorAll('.sg-clear-field-font').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = getScheme(); if (!s) return;
      if (s.fontFields) delete s.fontFields[btn.dataset.field];
      saveState(); renderStylePanel(panel);
    });
  });

  // Scheme grid: typography-backed font selects (bold rows → s.typography.boldFont)
  panel.querySelectorAll('.sg-typo-fam').forEach(sel => {
    sel.addEventListener('change', e => {
      const s = getScheme(); if (!s) return;
      const key = sel.dataset.typokey;
      const fam = e.target.value;
      const styles = _fontFamilyMap?.[fam] || [];
      const firstPS = styles[0]?.postscript || fam;
      ensureSchemeTypography(s);
      s.typography[key] = firstPS;
      saveState();
      renderStylePanel(panel);
    });
  });
  panel.querySelectorAll('.sg-typo-sty').forEach(sel => {
    sel.addEventListener('change', e => {
      const s = getScheme(); if (!s) return;
      const key = sel.dataset.typokey;
      ensureSchemeTypography(s);
      s.typography[key] = sel.value;
      saveState();
    });
  });

  // Scheme grid: H-alignment radio buttons
  panel.querySelectorAll('.sg-halign-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = getScheme(); if (!s) return;
      const key = btn.dataset.scheme;
      forkAdv(s, key);
      s[key].alignment = btn.dataset.val;
      panel.querySelectorAll(`.sg-halign-btn[data-scheme="${key}"]`).forEach(b =>
        b.classList.toggle('on', b.dataset.val === btn.dataset.val));
      saveState();
    });
  });

  // Scheme grid: V-alignment radio buttons
  panel.querySelectorAll('.sg-valign-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = getScheme(); if (!s) return;
      const key = btn.dataset.scheme;
      forkAdv(s, key);
      s[key].verticalAlignment = btn.dataset.val;
      panel.querySelectorAll(`.sg-valign-btn[data-scheme="${key}"]`).forEach(b =>
        b.classList.toggle('on', b.dataset.val === btn.dataset.val));
      saveState();
    });
  });

  // Scheme grid: bare color fields (stroke color, shadow color)
  panel.querySelectorAll('.sg-adv-color').forEach(picker => {
    picker.addEventListener('input', e => {
      const s = getScheme(); if (!s) return;
      const key   = picker.dataset.scheme;
      const field = picker.dataset.field;
      forkAdv(s, key);
      s[key][field] = e.target.value;
      saveState();
    });
  });

  // Scheme grid: canvas click → highlight matching row
  panel.querySelectorAll('#style-tab-text .lp-region').forEach(b => {
    b.addEventListener('click', () => {
      const slug = b.dataset.region;
      _textSel = slug;
      const TEXT_REGION_TO_ROW = {
        body: 'body1', propBody: 'body2', point: 'point1', propPoint: 'point2',
        rcBody: 'rcBody1', rcTitle: 'rcTitle1',
        header: 'title1', propHeader: 'title2', startEnd: 'se',
        live: 'live', queue: 'queue',
      };
      const rowId = TEXT_REGION_TO_ROW[slug];
      panel.querySelectorAll('#style-tab-text .lp-region').forEach(r =>
        r.classList.toggle('sel', r.dataset.region === slug));
      panel.querySelectorAll('#style-tab-text .sg-row').forEach(r =>
        r.classList.toggle('sg-row-sel', r.dataset.rowid === rowId));
      if (rowId) {
        const target = panel.querySelector(`#style-tab-text .sg-row[data-rowid="${rowId}"]`);
        if (target) target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  });

  // Text tab: clicking a row highlights the matching preview region
  const TEXT_ROW_TO_REGION = {
    body1: 'body', bold1: 'body', title1: 'header', point1: 'point',
    rcBody1: 'rcBody', rcTitle1: 'rcTitle',
    body2: 'propBody', bold2: 'propBody', title2: 'propHeader', point2: 'propPoint',
    se: 'startEnd', live: 'live', queue: 'queue',
  };
  panel.querySelectorAll('#style-tab-text .sg-row[data-rowid]').forEach(row => {
    row.addEventListener('click', () => {
      const rowId = row.dataset.rowid;
      const slug = TEXT_ROW_TO_REGION[rowId];
      _textSel = slug || null;
      panel.querySelectorAll('#style-tab-text .sg-row').forEach(r =>
        r.classList.toggle('sg-row-sel', r.dataset.rowid === rowId));
      panel.querySelectorAll('#style-tab-text .lp-region').forEach(r =>
        r.classList.toggle('sel', !!slug && r.dataset.region === slug));
    });
  });

  // Restore selection highlight after re-render
  if (_textSel) {
    const TEXT_REGION_TO_ROW = {
      body: 'body1', propBody: 'body2', point: 'point1', propPoint: 'point2',
      rcBody: 'rcBody1', rcTitle: 'rcTitle1',
      header: 'title1', propHeader: 'title2', startEnd: 'se',
      live: 'live', queue: 'queue',
    };
    const rowId = TEXT_REGION_TO_ROW[_textSel];
    panel.querySelectorAll('#style-tab-text .lp-region').forEach(r =>
      r.classList.toggle('sel', r.dataset.region === _textSel));
    panel.querySelectorAll('#style-tab-text .sg-row').forEach(r =>
      r.classList.toggle('sg-row-sel', r.dataset.rowid === rowId));
  }

  // Scheme grid: right-click context menu (reset / push-to-global)
  if (!document.getElementById('sg-ctx-menu')) {
    const m = document.createElement('div');
    m.id = 'sg-ctx-menu';
    m.innerHTML =
      `<button id="sg-ctx-reset" type="button">↺ Reset to global</button>` +
      `<button id="sg-ctx-push" type="button">↑ Push to global</button>` +
      `<button id="sg-ctx-inherit-d1" type="button">↺ Reset to Display 1</button>` +
      `<button id="sg-ctx-reset-def" type="button">↺ Reset to default</button>`;
    document.body.appendChild(m);
    document.addEventListener('click', e => {
      const m2 = document.getElementById('sg-ctx-menu');
      if (m2 && !m2.contains(e.target)) m2.style.display = 'none';
    });
  }
  const _sgCtx = document.getElementById('sg-ctx-menu');
  _sgCtx.dataset.lyfield = _sgCtx.dataset.lyfield || '';
  document.getElementById('sg-ctx-reset').onclick = () => {
    const s = getScheme(); if (!s) return;
    const lyField = _sgCtx.dataset.lyfield;
    const key     = _sgCtx.dataset.typokey;
    const advKey  = _sgCtx.dataset.scheme;
    const advFld  = _sgCtx.dataset.field;
    if (lyField) {
      s[lyField] = null;
    } else if (advKey && advFld && s[advKey]) {
      s[advKey][advFld] = (ensureGlobalFontAdv()[advKey] || FONT_ADV_DEFAULTS())[advFld];
    } else {
      if (!key) return;
      ensureSchemeTypography(s);
      s.typography[key] = null;
    }
    saveState(); renderStylePanel(panel); _sgCtx.style.display = 'none';
  };
  document.getElementById('sg-ctx-push').onclick = () => {
    const s = getScheme(); if (!s) return;
    const lyField = _sgCtx.dataset.lyfield;
    const key     = _sgCtx.dataset.typokey;
    const advKey  = _sgCtx.dataset.scheme;
    const advFld  = _sgCtx.dataset.field;
    if (lyField) {
      const glb = ensureGlobalLayout();
      glb[lyField] = s[lyField] ?? glb[lyField];
      s[lyField] = null;
    } else if (advKey && advFld && s[advKey]) {
      const glb = ensureGlobalFontAdv();
      if (!glb[advKey]) glb[advKey] = FONT_ADV_DEFAULTS();
      glb[advKey][advFld] = s[advKey][advFld];
    } else {
      if (!key) return;
      ensureSchemeTypography(s); ensureGlobalTypography();
      state.globalTypography[key] = s.typography[key] ?? resolveSchemeTypography(s)[key];
      s.typography[key] = null;
    }
    saveState(); renderStylePanel(panel); _sgCtx.style.display = 'none';
  };
  // Reset a whole Display 2 prop row back to inheriting Display 1 (null it out).
  document.getElementById('sg-ctx-inherit-d1').onclick = () => {
    const s = getScheme(); if (!s) return;
    const advKey = _sgCtx.dataset.scheme;
    if (advKey && D2_ADV_INHERIT[advKey]) s[advKey] = null;
    saveState(); renderStylePanel(panel); _sgCtx.style.display = 'none';
  };
  document.getElementById('sg-ctx-reset-def').onclick = () => {
    const s = getScheme(); if (!s) return;
    const lyField = _sgCtx.dataset.lyfield;
    const advKey  = _sgCtx.dataset.scheme;
    const field   = _sgCtx.dataset.field;
    if (lyField) {
      s[lyField] = DEFAULT_STYLE_SCHEME()[lyField];
      saveState(); renderStylePanel(panel);
    } else if (advKey && field && s[advKey]) {
      s[advKey][field] = FONT_ADV_DEFAULTS()[field];
      saveState(); renderStylePanel(panel);
    }
    _sgCtx.style.display = 'none';
  };
  panel.querySelectorAll('#style-tab-text .sg-td').forEach(td => {
    td.addEventListener('contextmenu', e => {
      e.preventDefault();
      const typoKey = td.dataset.typokey || '';
      const advKey  = td.dataset.scheme  || '';
      const advFld  = td.dataset.field   || '';
      _sgCtx.dataset.lyfield = '';
      _sgCtx.dataset.typokey = typoKey;
      _sgCtx.dataset.scheme  = advKey;
      _sgCtx.dataset.field   = advFld;
      const s = getScheme();
      const isOvTypo = !!(typoKey && s?.typography?.[typoKey]);
      const isOvAdv  = !!(advKey && advFld && s?.[advKey] != null && (() => {
        const v = s[advKey][advFld];
        const def = (ensureGlobalFontAdv()[advKey] || FONT_ADV_DEFAULTS())[advFld];
        if (v === undefined || v === null) return false;
        if (def === null || def === undefined) return false;
        if (typeof def === 'number') return Math.abs(Number(v) - def) > 0.01;
        if (typeof def === 'boolean') return !!v !== def;
        return v !== def;
      })());
      const resetBtn    = document.getElementById('sg-ctx-reset');
      const pushBtn     = document.getElementById('sg-ctx-push');
      const inheritBtn  = document.getElementById('sg-ctx-inherit-d1');
      const resetDefBtn = document.getElementById('sg-ctx-reset-def');
      resetBtn.style.display    = (typoKey && isOvTypo) || (advKey && advFld && isOvAdv) ? '' : 'none';
      pushBtn.style.display     = (typoKey || (advKey && advFld)) ? '' : 'none';
      // "Reset to Display 1" only for a Display 2 prop row that's currently overriding.
      inheritBtn.style.display  = (advKey && D2_ADV_INHERIT[advKey] && s?.[advKey] != null) ? '' : 'none';
      resetDefBtn.style.display = 'none';
      const hasItems = typoKey || (advKey && advFld);
      if (!hasItems) return;
      _sgCtx.style.cssText = `display:block;position:fixed;left:${e.clientX}px;top:${e.clientY}px;`;
    });
  });

  // Layout cells — right-click to push to global or reset to global
  panel.querySelectorAll('#style-tab-layout .sg-td[data-ly-field]').forEach(td => {
    td.addEventListener('contextmenu', e => {
      e.preventDefault();
      const lyField = td.dataset.lyField;
      const s = getScheme();
      const v = s?.[lyField];
      const isOv = v !== undefined && v !== null;
      if (!isOv) return;
      _sgCtx.dataset.lyfield = lyField;
      _sgCtx.dataset.typokey = '';
      _sgCtx.dataset.scheme  = '';
      _sgCtx.dataset.field   = '';
      document.getElementById('sg-ctx-reset').style.display     = '';
      document.getElementById('sg-ctx-push').style.display      = '';
      document.getElementById('sg-ctx-inherit-d1').style.display = 'none';
      document.getElementById('sg-ctx-reset-def').style.display = 'none';
      _sgCtx.style.cssText = `display:block;position:fixed;left:${e.clientX}px;top:${e.clientY}px;`;
    });
  });

  // Layout numeric inputs — update value + refresh alignment button states in-place
  document.querySelectorAll('.layout-num').forEach(inp => {
    inp.addEventListener('input', () => {
      const s = getScheme(); if (!s) return;
      const field = inp.id.replace('ly-', '');
      s[field] = parseFloat(inp.value) ?? 0;
      saveState();
      refreshAlignBtns(panel, s);
      refreshSchemePreviews(panel, s);
      // Update override highlight live
      const td = inp.closest('.sg-td[data-ly-field]');
      if (td) {
        const glb = ensureGlobalLayout();
        const g = glb[field], v = s[field];
        const isOv = g !== undefined && v !== null && (
          typeof g === 'number' ? Math.abs(Number(v) - g) > 0.01 : v !== g
        );
        td.classList.toggle('sg-td-scheme', isOv);
      }
    });
  });

  // Alignment buttons
  panel.querySelectorAll('.ly-align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = getScheme(); if (!s) return;
      const isProp  = btn.dataset.prop === 'true';
      const glb = ensureGlobalLayout();
      const cW = isProp ? (s.propCanvasW ?? glb.propCanvasW ?? 3200) : (s.canvasW ?? glb.canvasW ?? 1920);
      const cH = isProp ? (s.propCanvasH ?? glb.propCanvasH ?? 1280) : (s.canvasH ?? glb.canvasH ?? 1080);
      const align = btn.dataset.align;

      if (align === 'h-left') {
        const xf = btn.dataset.xf;
        s[xf] = 0;
        const el = document.getElementById(`ly-${xf}`); if (el) el.value = 0;
      } else if (align === 'h-center') {
        const xf = btn.dataset.xf, wf = btn.dataset.wf;
        const w = parseFloat(s[wf] ?? 0);
        const x = Math.round((cW - w) / 2 * 100) / 100;
        s[xf] = x;
        const el = document.getElementById(`ly-${xf}`); if (el) el.value = x;
      } else if (align === 'h-right') {
        const xf = btn.dataset.xf, wf = btn.dataset.wf;
        const w = parseFloat(s[wf] ?? 0);
        const x = Math.round((cW - w) * 100) / 100;
        s[xf] = x;
        const el = document.getElementById(`ly-${xf}`); if (el) el.value = x;
      } else if (align === 'v-top') {
        const yf = btn.dataset.yf;
        s[yf] = 0;
        const el = document.getElementById(`ly-${yf}`); if (el) el.value = 0;
      } else if (align === 'v-middle') {
        const yf = btn.dataset.yf, hf = btn.dataset.hf;
        const h = parseFloat(s[hf] ?? 0);
        const y = Math.round((cH - h) / 2 * 100) / 100;
        s[yf] = y;
        const el = document.getElementById(`ly-${yf}`); if (el) el.value = y;
      } else if (align === 'v-bottom') {
        const yf = btn.dataset.yf, hf = btn.dataset.hf;
        const h = parseFloat(s[hf] ?? 0);
        const y = Math.round((cH - h) * 100) / 100;
        s[yf] = y;
        const el = document.getElementById(`ly-${yf}`); if (el) el.value = y;
      }
      saveState();
      renderStylePanel(panel);
    });
  });

  // Auto Title Y toggles (Header + Prop header)
  panel.querySelectorAll('.ly-auto-y-chk').forEach(chk => {
    chk.addEventListener('change', () => {
      const s = getScheme(); if (!s) return;
      const field = chk.id.replace('ly-', '');
      s[field] = chk.checked;
      saveState();
      renderStylePanel(panel);
    });
  });

}

// ─── Response Card panel ──────────────────────────────────────────────────────

function renderResponseCardPanel(panel) {
  const cfg = state.config;
  if (!cfg.responses) cfg.responses = { decisionText: '', r1: '', r2: '', r3: '' };
  const rc = cfg.responses;

  panel.innerHTML = `
    <div class="slide-form">
      <h2>
        Response Card
      </h2>

      <div class="settings-section">
        <div class="rc-toggle-row" id="rc-toggle-row">
          <div class="toggle ${cfg.includeResponseCard ? 'on' : ''}" id="rc-toggle"></div>
          <span>Include Response Card this week</span>
        </div>
      </div>

      <div class="settings-section">
        <h3>Text</h3>
        <div class="field" style="margin-bottom:10px">
          <label data-tip-key="decision-text">Decision Text</label>
          ${(cfg.rcDecisionTextLocked !== false) ? `
            <div class="rc-locked-field" id="rc-decisionText-locked" title="Click to customize">
              <span class="rc-locked-val">${esc(rc.decisionText || 'I have decided to follow Jesus today!')}</span>
              <span class="rc-locked-hint">locked</span>
            </div>
          ` : `
            <div style="display:flex;align-items:center;gap:6px;flex:1">
              <input type="text" id="rc-decisionText" spellcheck="true" value="${esc(rc.decisionText)}" placeholder="Decision text" style="flex:1">
              <button class="btn-sm rc-lock-btn" id="rc-decision-relock" title="Reset and lock">Lock</button>
            </div>
          `}
        </div>
        <div class="field" style="margin-bottom:10px">
          <label>Response 1</label>
          <input type="text" id="rc-r1" spellcheck="true" value="${esc(rc.r1)}" placeholder="Response option">
        </div>
        <div class="field" style="margin-bottom:10px">
          <label>Response 2</label>
          <input type="text" id="rc-r2" spellcheck="true" value="${esc(rc.r2)}" placeholder="Response option">
        </div>
        <div class="field" style="margin-bottom:0">
          <label>Response 3</label>
          <input type="text" id="rc-r3" spellcheck="true" value="${esc(rc.r3)}" placeholder="Response option">
        </div>
      </div>

      <div class="settings-section">
        <h3 data-tip="The confidence-monitor notes shown on every Response Card slide. Write your own text and drop in tags that auto-fill.">${dn('monitor')} Notes</h3>
        <div class="field" style="margin-bottom:6px">
          <textarea id="rc-notes-template" class="rc-notes-template" rows="5" spellcheck="true" placeholder="{decision}&#10;1 — {r1}&#10;2 — {r2}&#10;3 — {r3}">${esc(rc.notesTemplate ?? '{decision}\n1 — {r1}\n2 — {r2}\n3 — {r3}')}</textarea>
        </div>
        <div class="rc-notes-tags">
          Tags: <code>{decision}</code> <code>{r1}</code> <code>{r2}</code> <code>{r3}</code> — they auto-fill from the fields above.
          <button class="btn-sm" id="rc-notes-reset" type="button" style="margin-left:6px">Reset to default</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('rc-toggle-row').addEventListener('click', () => {
    cfg.includeResponseCard = !cfg.includeResponseCard;
    document.getElementById('rc-toggle').classList.toggle('on', cfg.includeResponseCard);
    saveState();
  });

  // Decision text lock/unlock
  const lockedEl  = document.getElementById('rc-decisionText-locked');
  const relockBtn = document.getElementById('rc-decision-relock');
  if (lockedEl) {
    lockedEl.addEventListener('click', () => {
      showConfirmModal(
        'Customize decision text?',
        'This text appears on the Response Card slide. Unlocking lets you edit it for this deck.',
        'Unlock',
        () => { cfg.rcDecisionTextLocked = false; saveState(); render(); }
      );
    });
  }
  if (relockBtn) {
    relockBtn.addEventListener('click', () => {
      cfg.rcDecisionTextLocked = true;
      saveState();
      render();
    });
  }

  ['r1', 'r2', 'r3'].forEach(key => {
    const el = document.getElementById('rc-' + key);
    if (el) el.addEventListener('input', e => { cfg.responses[key] = e.target.value; saveState(); });
  });
  const dtEl = document.getElementById('rc-decisionText');
  if (dtEl) dtEl.addEventListener('input', e => { cfg.responses.decisionText = e.target.value; saveState(); });

  const tmplEl = document.getElementById('rc-notes-template');
  if (tmplEl) tmplEl.addEventListener('input', e => { cfg.responses.notesTemplate = e.target.value; saveState(); });
  document.getElementById('rc-notes-reset')?.addEventListener('click', () => {
    cfg.responses.notesTemplate = '{decision}\n1 — {r1}\n2 — {r2}\n3 — {r3}';
    saveState();
    render();
  });
}

// ─── Form templates ───────────────────────────────────────────────────────────

function richEditor(id, spans) {
  return `
    <div class="rich-editor-wrap">
      <div class="rich-toolbar">
        <button class="btn-fmt" id="${id}-bold"      type="button" data-tip-key="bold"><b>B</b></button>
        <button class="btn-fmt" id="${id}-italic"    type="button" data-tip-key="italic"><i>I</i></button>
        <button class="btn-fmt" id="${id}-underline" type="button" data-tip-key="underline"><u>U</u></button>
        <span class="rich-toolbar-sep"></span>
        <button class="btn-fmt btn-fmt-alt" id="${id}-alt" type="button" data-tip-key="alt"><span class="btn-fmt-alt-lbl">ALT</span></button>
      </div>
      <div class="rich-content" id="${id}" contenteditable="true" spellcheck="true"
           data-placeholder="Enter text…">${spansToHtmlPreview(spans)}</div>
    </div>
  `;
}

// Plain multi-line editor — same contenteditable input method as the scripture
// rich editor, but with no formatting toolbar (point text is plain text).
function plainEditor(id, text, placeholder = 'Point text…') {
  return `
    <div class="rich-editor-wrap rich-editor-plain">
      <div class="rich-content" id="${id}" contenteditable="true" spellcheck="true"
           data-placeholder="${esc(placeholder)}">${esc(text || '').replace(/\n/g, '<br>')}</div>
    </div>
  `;
}

function macroOverrideRow(slide) {
  const m = slide.macroOverride;
  const dot = m && m.color
    ? `<span class="cm-dot" style="background:${m.color};width:9px;height:9px;flex-shrink:0"></span>`
    : `<span class="cm-dot cm-dot-default" style="width:9px;height:9px;flex-shrink:0"></span>`;
  return `
    <div class="field override-macro-row">
      <label data-tip-key="macro-override">Macro Override</label>
      <div class="override-macro-val" id="override-macro-val">
        ${m ? `${dot}<span class="override-macro-name">${esc(m.name)}</span>
          <button class="btn-override-macro-clear" id="btn-override-macro-clear" title="Remove">×</button>` : ''}
      </div>
      <button class="btn-sm" id="btn-override-macro-pick" type="button">${m ? 'Change' : 'Add'}</button>
    </div>
  `;
}

function overridesSection(slide, features) {
  if (features && !features.overrides) return '';
  const stageRow  = stageLayoutRow(slide);
  const transRow  = slideTransitionRow(slide, features);
  const macroRow  = macroOverrideRow(slide);
  const body = [stageRow, transRow, macroRow].filter(Boolean).join('');
  if (!body) return '';
  return `
    <details class="slide-overrides" id="slide-overrides">
      <summary class="slide-overrides-summary" data-tip-key="overrides">Overrides</summary>
      <div class="slide-overrides-body">${body}</div>
    </details>
  `;
}


function stageLayoutRow(slide) {
  const displays = activeStyleScheme().stageDisplays || [];
  const layouts = displays
    .filter(d => d.name)
    .map(d => ({ name: d.name, uuid: d.uuid }));
  if (!layouts.length) return ''; // no layouts configured yet
  const cur = slide.stageLayout?.layoutName || '';
  return `
    <div class="field">
      <label data-tip-key="stage-layout-override">Stage Layout Override</label>
      <select id="f-stageLayout" style="flex:1">
        <option value="">None</option>
        ${layouts.map(l => `<option value="${esc(l.name)}" data-uuid="${esc(l.uuid)}" ${cur === l.name ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}
      </select>
    </div>
  `;
}

function slideTransitionRow(slide, features) {
  if (features && !features.transitionOverride) return '';
  return `
    <div class="field">
      <label data-tip-key="transition-override">Transition Override</label>
      ${transitionRow(slide.transition, 'f')}
    </div>
  `;
}

function propSection(slide, features, { showTransition = true, idPrefix = 'fp', showCustomProp = false } = {}) {
  if (features && !features.propName && !(showTransition && features?.propTransitionOverride)) return '';
  const parts = [];
  if (!features || features.propName) {
    const propVal = slide.propName || slide.propBaseName || slide.bodyText || slide.reference || '';
    parts.push(`
      <div class="field">
        <label data-tip-key="prop-name">Prop Name</label>
        <input type="text" id="f-propName" spellcheck="false" value="${esc(propVal)}" placeholder="Auto-set from reference">
      </div>
    `);
  }
  if (showCustomProp) {
    parts.push(`
      <div class="rc-toggle-row" id="custom-prop-row" style="margin-top:4px">
        <div class="toggle${slide.customProp ? ' on' : ''}" id="custom-prop-toggle"></div>
        <label style="font-size:13px">Custom prop — skip auto-generation, leave slot blank for manual Pro7 build</label>
      </div>
    `);
  }
  if (showTransition && (!features || features.propTransitionOverride)) {
    parts.push(`
      <div class="field">
        <label data-tip-key="prop-transition-override">Prop Transition Override</label>
        ${transitionRow(slide.propTransition, idPrefix)}
      </div>
    `);
  }
  if (!parts.length) return '';
  return `<div class="slide-prop-section">${parts.join('')}</div>`;
}

function startEndForm(slide) {
  const isStart = slide.type === 'start';
  const iconCls = isStart ? 'si-start' : 'si-end';
  const iconTxt = isStart ? 'S' : 'E';
  const defaultText = isStart ? 'Start of Notes' : 'End of Notes';
  const posKey = slidePosKey(slide);
  return `
    <div class="slide-form">
      <h2>
        <input type="text" class="slide-title-input" id="f-label" spellcheck="true" value="${esc(slide.label || defaultText)}" placeholder="${defaultText}">
        ${macroChipsHTML(slide.type, posKey)}${stageDisplayChipsHTML(slide.type, posKey)}
      </h2>
      <div class="field">
        <label>Screen Text</label>
        <input type="text" id="f-text" spellcheck="true" value="${esc(slide.text ?? slide.label ?? defaultText)}" placeholder="${defaultText}">
      </div>
    </div>
  `;
}

function attachStartEndHandlers(slide) {
  document.getElementById('f-label')?.addEventListener('input', e => {
    slide.label = e.target.value;
    saveState();
    renderSidebar();
  });
  document.getElementById('f-text')?.addEventListener('input', e => {
    slide.text = e.target.value;
    saveState();
  });
}

function customConfidenceMonitorSection(editorId, spans) {
  const hasText = (spans || []).some(span => String(span?.text || '').trim());
  return `
    <details class="slide-overrides cm-custom-text"${hasText ? ' open' : ''}>
      <summary class="slide-overrides-summary">Custom ${esc(dn('monitor'))} Text</summary>
      <div class="slide-overrides-body">${richEditor(editorId, spans || [])}</div>
    </details>
  `;
}

function blankForm(slide) {
  const F = state.config.features || DEFAULT_FEATURES();
  return `
    <div class="slide-form">
      <h2>
        <input type="text" class="slide-title-input" id="f-label" spellcheck="true" value="${esc(slide.label)}" placeholder="Blank label">
        ${macroChipsHTML('blank', slidePosKey(slide))}${stageDisplayChipsHTML('blank', slidePosKey(slide))}
      </h2>
      <div class="blank-qr-row" id="blank-qr-row">
        <div class="toggle qr-toggle-inline${effectiveQR(slide) ? ' on' : ''}" id="blank-qr-toggle" data-tip-key="qr-toggle"></div>
        <label data-tip-key="qr-toggle" class="qr-toggle-label">QR</label>
      </div>
      ${F.confidenceMonitor ? `
        ${customConfidenceMonitorSection('f-body', slide.spans || [])}
      ` : ''}
      <div class="slide-secondary">
        ${overridesSection(slide, F)}
      </div>
    </div>
  `;
}

function imageForm(slide) {
  const on = !!slide.blankBefore;
  const F  = state.config.features || DEFAULT_FEATURES();
  const blankSection = F.blankBefore ? `
    <div class="blank-before-row" id="blank-before-row">
      <div class="toggle${on ? ' on' : ''}" id="bb-toggle"></div>
      <label data-tip-key="blank-before">Blank slide before this one</label>
      <div class="qr-toggle-wrap${on ? ' visible' : ''}" id="qr-toggle-wrap">
        <div class="toggle qr-toggle-inline${effectiveQR(slide) ? ' on' : ''}" id="qr-toggle" data-tip-key="qr-toggle"></div>
        <label data-tip-key="qr-toggle" class="qr-toggle-label">QR</label>
      </div>
    </div>
    ${F.confidenceMonitor ? `
      <div class="blank-before-preview${on ? ' visible' : ''}" id="bb-preview">
        ${customConfidenceMonitorSection('f-blank-spans', slide.blankSpans || [])}
      </div>
    ` : `<div class="blank-before-preview${on ? ' visible' : ''}" id="bb-preview" style="display:none"></div>`}
  ` : '';
  return `
    <div class="slide-form">
      <h2>
        <input type="text" class="slide-title-input" id="f-label" spellcheck="true" value="${esc(slide.label)}" placeholder="Image label">
        ${macroChipsHTML('image', slidePosKey(slide))}${stageDisplayChipsHTML('image', slidePosKey(slide))}
      </h2>

      <div class="slide-secondary">
        ${blankSection}
        ${overridesSection(slide, F)}
        ${propSection(slide, F, { idPrefix: 'fp' })}
      </div>
    </div>
  `;
}

function qrMarkerForm(slide) {
  return `
    <div class="slide-form">
      <h2>QR Stop</h2>
      <p style="color:var(--muted);font-size:13px;margin-top:4px">
        Not a real slide — doesn't export. It's a boundary: when this deck's QR toggle (Decks → edit this deck) is on,
        blanks before this marker default to showing the QR macro, and blanks at or after it default to not.
        Drag it anywhere in the deck to move the boundary. Any blank you've manually toggled with its own QR
        switch keeps that choice regardless of where this marker is.
      </p>
    </div>
  `;
}

function customForm(slide) {
  return `
    <div class="slide-form">
      <h2>
        <input type="text" class="slide-title-input" id="f-label" spellcheck="true" value="${esc(slide.label)}" placeholder="Custom label">
        ${macroChipsHTML('custom', slidePosKey(slide))}${stageDisplayChipsHTML('custom', slidePosKey(slide))}
      </h2>
      <p style="color:var(--muted);font-size:13px;margin-top:4px">Exports as a blank slide with this label — a slot you can build out by hand in ProPresenter.</p>
    </div>
  `;
}

function scriptureForm(slide) {
  const bodies = slide.bodies || [slide.body || []];
  const on = !!slide.blankBefore;
  const followReveal = slide.followReveal || 'single';
  const F = state.config.features || DEFAULT_FEATURES();

  const bodyEditors = bodies.map((body, idx) => `
    ${idx > 0 ? `
      <div class="slide-break-divider">
        slide break
        <button class="btn-remove-body" data-body-idx="${idx}" title="Remove this body">× remove</button>
      </div>
    ` : ''}
    ${richEditor(`f-body-${idx}`, body)}
    <div class="digit-badge" id="digit-badge-${idx}"></div>
  `).join('');

  const blankSection = F.blankBefore ? `
    <div class="blank-before-row" id="blank-before-row">
      <div class="toggle${on ? ' on' : ''}" id="bb-toggle"></div>
      <label data-tip-key="blank-before">Blank slide before this one</label>
      <div class="qr-toggle-wrap${on ? ' visible' : ''}" id="qr-toggle-wrap">
        <div class="toggle qr-toggle-inline${effectiveQR(slide) ? ' on' : ''}" id="qr-toggle" data-tip-key="qr-toggle"></div>
        <label data-tip-key="qr-toggle" class="qr-toggle-label">QR</label>
      </div>
    </div>
    ${F.confidenceMonitor ? `
      <div class="blank-before-preview${on ? ' visible' : ''}" id="bb-preview">
        ${customConfidenceMonitorSection('f-blank-spans', slide.blankSpans || [])}
      </div>
    ` : `<div class="blank-before-preview${on ? ' visible' : ''}" id="bb-preview" style="display:none"></div>`}
  ` : '';

  return `
    <div class="slide-form">
      <h2>
        <input type="text" class="slide-title-input" id="f-label" spellcheck="true" value="${esc(slide.label)}" placeholder="Reference">
        ${macroChipsHTML('scripture', slidePosKey(slide))}${stageDisplayChipsHTML('scripture', slidePosKey(slide))}
      </h2>

      <div class="field">
        <label data-tip-key="reference">Reference</label>
        <div class="ref-row">
          <input type="text" id="f-reference" spellcheck="false" value="${esc(slide.reference || '')}" placeholder="e.g. John 13:35">
          ${(() => {
            const list = state.config.bibleList || [];
            const cur  = slide.bibleId || state.config.bibleId || '';
            if (!list.length) return `<button class="btn-lookup" id="btn-bible-lookup" type="button">Lookup</button>`;
            return `
              <select class="btn-lookup-trans" id="f-bible-id" title="Translation for this lookup">
                <option value="">Default</option>
                ${list.map(b => `<option value="${esc(b.id)}" ${b.id === cur ? 'selected' : ''}>${esc(b.abbreviation)}</option>`).join('')}
              </select>
              <button class="btn-lookup" id="btn-bible-lookup" type="button">Lookup</button>
            `;
          })()}
        </div>
      </div>
      <div class="field">
        <div class="body-field-hdr">
          <label>Body Text</label>
          <div class="body-field-tools">
            ${F.bodyTools ? `
            <button class="btn-sm body-tool-btn ${slide.fitWidth ? 'active' : ''}" id="btn-fit-width" type="button" data-tip-key="fit-width">Fit Width</button>
            ${slide.fitWidth ? `
            <button class="btn-sm body-tool-btn ${slide.propFitWidth ? 'active' : ''}" id="btn-fit-width-prop" type="button" data-tip-key="fit-width-prop">+ Display 2</button>
            ` : ''}
            <button class="btn-sm body-tool-btn ${slide.stripNewlines ? 'active' : ''}" id="btn-strip-nl" type="button" data-tip-key="strip">Strip</button>
            ` : ''}
            ${F.verseFormatting ? `
            <div class="verse-fmt-wrap">
              <button class="btn-sm body-tool-btn ${state.config.verseNumbers ? 'active' : ''}" id="btn-verse-fmt" type="button" data-tip-key="bible-formatting">Verses ⌄</button>
            </div>
            ` : ''}
          </div>
        </div>
        ${bodyEditors}
        <button class="btn-split-body" id="btn-split-body" type="button" data-tip-key="split">+ Split into another slide</button>
      </div>

      <div class="slide-secondary">
        ${bodies.length > 1 ? `
          <div class="field" id="field-follow-reveal">
            <label>${dn('monitor')}</label>
            <div class="segmented-control">
              <button id="fr-single"   class="${followReveal === 'single'   ? 'active' : ''}">Sequential</button>
              <button id="fr-stacking" class="${followReveal === 'stacking' ? 'active' : ''}">Stacking</button>
            </div>
          </div>
        ` : ''}
        ${blankSection}
        ${overridesSection(slide, F)}
        ${propSection(slide, F)}
      </div>
    </div>
  `;
}

function pointForm(slide) {
  const mode = slide.mode || 'single';
  const on   = !!slide.blankBefore;
  const F    = state.config.features || DEFAULT_FEATURES();

  const singleFields = mode === 'single' ? `
    <div class="field" id="field-bodyText">
      <div class="body-field-hdr">
        <label>Point Text</label>
        <div class="body-field-tools">
          ${F.bodyTools ? `
          <button class="btn-sm body-tool-btn ${slide.fitWidth ? 'active' : ''}" id="btn-fit-width" type="button" data-tip-key="fit-width">Fit Width</button>
          ${slide.fitWidth ? `
          <button class="btn-sm body-tool-btn ${slide.propFitWidth ? 'active' : ''}" id="btn-fit-width-prop" type="button" data-tip-key="fit-width-prop">+ Display 2</button>
          ` : ''}
          ` : ''}
        </div>
      </div>
      ${plainEditor('f-bodyText', slide.bodyText, 'Point text…')}
    </div>
  ` : '';

  const followReveal = slide.followReveal || 'single';

  const revealingFields = mode === 'revealing' ? `
    <div class="field" id="field-title">
      <label>Series Title (optional header on prop)</label>
      <input type="text" id="f-title" spellcheck="true" value="${esc(slide.title || '')}" placeholder="Series title">
    </div>
    <div class="field" id="field-follow-reveal">
      <label>${dn('monitor')}</label>
      <div class="segmented-control">
        <button id="fr-single"   class="${followReveal === 'single'   ? 'active' : ''}">Sequential</button>
        <button id="fr-stacking" class="${followReveal === 'stacking' ? 'active' : ''}">Stacking</button>
      </div>
    </div>
    <div class="field" id="field-bullets">
      <div class="body-field-hdr">
        <label>Bullets (one per slide)</label>
        <div class="body-field-tools">
          ${F.bodyTools ? `
          <button class="btn-sm body-tool-btn ${slide.fitWidth ? 'active' : ''}" id="btn-fit-width" type="button" data-tip-key="fit-width">Fit Width</button>
          ${slide.fitWidth ? `
          <button class="btn-sm body-tool-btn ${slide.propFitWidth ? 'active' : ''}" id="btn-fit-width-prop" type="button" data-tip-key="fit-width-prop">+ Display 2</button>
          ` : ''}
          ` : ''}
        </div>
      </div>
      <div class="bullet-list" id="bullet-list">
        ${(slide.bullets || [[]]).map((b, i) => `
          <div class="bullet-row" data-bullet-idx="${i}">
            <span style="color:var(--muted);font-size:13px;min-width:18px">${i + 1}</span>
            <div class="bullet-rich" id="bullet-rich-${i}" contenteditable="true" spellcheck="true"
                 data-idx="${i}" data-placeholder="Bullet ${i + 1}">${spansToHtml(Array.isArray(b) ? b : [{text: b, bold: false}])}</div>
            <button class="btn-remove-bullet" data-idx="${i}" title="Remove">×</button>
          </div>
        `).join('')}
      </div>
      <button class="btn-add-bullet" id="btn-add-bullet" type="button">+ Add bullet</button>
      <details class="reflow-details">
        <summary class="reflow-summary">Paste to reflow…</summary>
        <div class="reflow-body">
          <textarea id="reflow-paste" rows="5" placeholder="Paste bullet text here — one line per bullet — then click Split"></textarea>
          <button class="btn-sm" id="btn-reflow" type="button">Split into bullets</button>
        </div>
      </details>
    </div>
  ` : '';

  // Prop section differs by mode
  const propPart = (() => {
    if (mode === 'single') {
      return propSection(slide, F, { showCustomProp: true });
    }
    // Revealing: prop base name + two separate transition overrides
    const parts = [];
    if (!F || F.propName) {
      parts.push(`
        <div class="field">
          <label>Prop Base Name</label>
          <input type="text" id="f-propBaseName" spellcheck="false" value="${esc(slide.propBaseName || '')}" placeholder="Auto-set from first bullet">
        </div>
      `);
    }
    if (!F || F.propTransitionOverride) {
      parts.push(`
        <div class="field">
          <label>Initial Prop Transition (blank → first prop)</label>
          ${transitionRow(slide.propInitialTransition, 'fpi')}
        </div>
        <div class="field">
          <label>Reveal Transition (prop → next prop)</label>
          ${transitionRow(slide.propRevealTransition, 'fpr')}
        </div>
      `);
    }
    if (!parts.length) return '';
    return `<div class="slide-prop-section">${parts.join('')}</div>`;
  })();

  const blankSection = F.blankBefore ? `
    <div class="blank-before-row" id="blank-before-row">
      <div class="toggle${on ? ' on' : ''}" id="bb-toggle"></div>
      <label data-tip-key="blank-before">Blank slide before this one</label>
      <div class="qr-toggle-wrap${on ? ' visible' : ''}" id="qr-toggle-wrap">
        <div class="toggle qr-toggle-inline${effectiveQR(slide) ? ' on' : ''}" id="qr-toggle" data-tip-key="qr-toggle"></div>
        <label data-tip-key="qr-toggle" class="qr-toggle-label">QR</label>
      </div>
    </div>
    ${F.confidenceMonitor ? `
      <div class="blank-before-preview${on ? ' visible' : ''}" id="bb-preview">
        ${customConfidenceMonitorSection('f-blank-spans', slide.blankSpans || [])}
      </div>
    ` : `<div class="blank-before-preview${on ? ' visible' : ''}" id="bb-preview" style="display:none"></div>`}
  ` : '';

  return `
    <div class="slide-form">
      <h2>
        <input type="text" class="slide-title-input" id="f-label" spellcheck="true" value="${esc(slide.label)}" placeholder="Point label">
        ${macroChipsHTML('point', slidePosKey(slide))}${stageDisplayChipsHTML('point', slidePosKey(slide))}
      </h2>

      <div class="field">
        <label>Mode</label>
        <div class="segmented-control">
          <button id="mode-single" class="${mode === 'single' ? 'active' : ''}" data-tip-key="point-single">Single</button>
          <button id="mode-revealing" class="${mode === 'revealing' ? 'active' : ''}" data-tip-key="point-revealing">Revealing</button>
        </div>
      </div>
      ${singleFields}
      ${revealingFields}

      <div class="slide-secondary">
        ${blankSection}
        ${overridesSection(slide, F)}
        ${propPart}
      </div>
    </div>
  `;
}

// ─── Form event handlers ──────────────────────────────────────────────────────

function toggleAltFmt(bodyEl, onSave) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return;

  // Find all .alt-fmt spans that intersect the selection:
  //  - directAlt: selection is inside a span (commonAncestor is or is inside .alt-fmt)
  //  - descAlt: spans are inside the selection
  // This handles trailing-whitespace snap: even if word-snap extends one char past the
  // span boundary, intersectsNode still finds the span so we unwrap correctly.
  const root = range.commonAncestorContainer.nodeType === 3
    ? range.commonAncestorContainer.parentElement
    : range.commonAncestorContainer;
  const directAlt = root.closest?.('.alt-fmt') || (root.classList?.contains('alt-fmt') ? root : null);
  const descAlt   = [...root.querySelectorAll('.alt-fmt')].filter(s => range.intersectsNode(s));
  const altSpans  = directAlt ? [directAlt, ...descAlt] : descAlt;

  if (altSpans.length > 0) {
    // Unwrap all intersecting alt-fmt spans
    for (const span of altSpans) {
      const frag = document.createDocumentFragment();
      while (span.firstChild) frag.appendChild(span.firstChild);
      span.parentNode.replaceChild(frag, span);
    }
  } else {
    // Wrap selection in .alt-fmt span
    try {
      const span = document.createElement('span');
      span.className = 'alt-fmt';
      range.surroundContents(span);
    } catch (_) {
      // Selection crosses element boundaries — extract, wrap, reinsert
      const contents = range.extractContents();
      const span = document.createElement('span');
      span.className = 'alt-fmt';
      span.appendChild(contents);
      range.insertNode(span);
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    }
  }

  onSave(extractSpans(bodyEl));
}

function applyAltFmt(bodyEl, onSave) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return;
  try {
    const span = document.createElement('span');
    span.className = 'alt-fmt';
    range.surroundContents(span);
  } catch (_) {
    const contents = range.extractContents();
    const span = document.createElement('span');
    span.className = 'alt-fmt';
    span.appendChild(contents);
    range.insertNode(span);
    sel.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(span);
    sel.addRange(r);
  }
  onSave(extractSpans(bodyEl));
}

let _altBrackets = null;

function updateAltBrackets() {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || sel.isCollapsed) { removeAltBrackets(); return; }
  const range = sel.getRangeAt(0);
  const rects = Array.from(range.getClientRects()).filter(r => r.width > 0);
  if (!rects.length) { removeAltBrackets(); return; }
  if (!_altBrackets) {
    const mk = char => {
      const el = document.createElement('span');
      el.className = 'alt-drag-bracket';
      el.textContent = char;
      document.body.appendChild(el);
      return el;
    };
    _altBrackets = { open: mk('['), close: mk(']') };
  }
  const first = rects[0], last = rects[rects.length - 1];
  _altBrackets.open.style.left  = `${first.left - 9}px`;
  _altBrackets.open.style.top   = `${first.top}px`;
  _altBrackets.open.style.height = `${first.height}px`;
  _altBrackets.close.style.left  = `${last.right + 2}px`;
  _altBrackets.close.style.top   = `${last.top}px`;
  _altBrackets.close.style.height = `${last.height}px`;
}

function removeAltBrackets() {
  if (_altBrackets) {
    _altBrackets.open.remove();
    _altBrackets.close.remove();
    _altBrackets = null;
  }
}

// Wire a plainEditor: reports plain text (with \n for line breaks), strips any
// formatting, and blocks bold/italic/underline so it stays plain.
function attachPlainEditor(editorId, onSave) {
  const el = document.getElementById(editorId);
  if (!el) return;
  el.addEventListener('input', () => onSave(extractSpans(el).map(s => s.text).join('')));
  el.addEventListener('paste', e => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  });
  el.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && ['b', 'i', 'u'].includes(e.key.toLowerCase())) e.preventDefault();
  });
}

function attachRichEditor(editorId, onSave) {
  const bodyEl = document.getElementById(editorId);
  if (!bodyEl) return;

  const fmtBtns = {
    bold:      document.getElementById(`${editorId}-bold`),
    italic:    document.getElementById(`${editorId}-italic`),
    underline: document.getElementById(`${editorId}-underline`),
  };
  const altBtn = document.getElementById(`${editorId}-alt`);

  function updateFmtBtns() {
    for (const [cmd, btn] of Object.entries(fmtBtns)) {
      if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
    }
    if (altBtn) {
      const sel = window.getSelection();
      const node = sel.focusNode;
      const inAlt = node && (node.nodeType === 3
        ? node.parentElement.closest('.alt-fmt')
        : node.closest?.('.alt-fmt'));
      altBtn.classList.toggle('active', !!inAlt);
    }
  }

  bodyEl.addEventListener('input', () => onSave(extractSpans(bodyEl)));

  // cmd+click / cmd+drag: toggle alt on click, drag word-by-word to apply alt
  bodyEl.addEventListener('mousedown', e => {
    if (!e.metaKey) return;
    e.preventDefault();
    bodyEl.focus();
    const cr = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!cr) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(cr);
    // Anchor at word start so drag extends from a clean boundary
    sel.modify('move', 'backward', 'word');
    bodyEl.classList.add('alt-dragging');

    let dragged = false;

    const onMove = ev => {
      dragged = true;
      const cr2 = document.caretRangeFromPoint(ev.clientX, ev.clientY);
      if (!cr2) return;
      try {
        sel.extend(cr2.startContainer, cr2.startOffset);
        // Snap focus to word boundary in the drag direction
        const anchorNode = sel.anchorNode, focusNode = sel.focusNode;
        if (anchorNode && focusNode) {
          const isForward = anchorNode === focusNode
            ? sel.focusOffset >= sel.anchorOffset
            : !!(anchorNode.compareDocumentPosition(focusNode) & Node.DOCUMENT_POSITION_FOLLOWING);
          sel.modify('extend', isForward ? 'forward' : 'backward', 'word');
        }
      } catch (_) {}
      updateAltBrackets();
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      removeAltBrackets();
      bodyEl.classList.remove('alt-dragging');
      if (!dragged) {
        // Single click: extend to full word and toggle
        sel.modify('extend', 'forward', 'word');
        toggleAltFmt(bodyEl, onSave);
      } else {
        // Drag: already word-snapped, just apply
        applyAltFmt(bodyEl, onSave);
      }
      updateFmtBtns();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  for (const [cmd, btn] of Object.entries(fmtBtns)) {
    if (!btn) continue;
    // Prevent mousedown from blurring the editor — otherwise the text selection
    // collapses before the click fires and execCommand has nothing to format.
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => {
      bodyEl.focus();
      document.execCommand(cmd);
      updateFmtBtns();
      onSave(extractSpans(bodyEl));
    });
  }

  if (altBtn) {
    // Prevent mousedown from blurring the editor so the selection survives into click
    altBtn.addEventListener('mousedown', e => e.preventDefault());
    altBtn.addEventListener('click', () => {
      bodyEl.focus();
      toggleAltFmt(bodyEl, onSave);
      updateFmtBtns();
    });
  }

  bodyEl.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey) {
      const map = { b: 'bold', i: 'italic', u: 'underline' };
      const cmd = map[e.key.toLowerCase()];
      if (cmd && fmtBtns[cmd]) { e.preventDefault(); fmtBtns[cmd].click(); }
    }
  });
  bodyEl.addEventListener('keyup',   updateFmtBtns);
  bodyEl.addEventListener('mouseup', updateFmtBtns);
  bodyEl.addEventListener('blur', () => {
    bodyEl.innerHTML = spansToHtmlPreview(extractSpans(bodyEl));
  });
}

function attachBlankBeforeHandlers(slide) {
  const bbRow      = document.getElementById('blank-before-row');
  const bbToggle   = document.getElementById('bb-toggle');
  const bbPreview  = document.getElementById('bb-preview');
  const qrWrap     = document.getElementById('qr-toggle-wrap');
  const qrToggle   = document.getElementById('qr-toggle');
  if (!bbRow) return;

  // Sync initial state
  if (slide.blankBefore) bbToggle.classList.add('on');

  bbRow.addEventListener('click', () => {
    slide.blankBefore = !slide.blankBefore;
    bbToggle.classList.toggle('on', slide.blankBefore);
    bbPreview.classList.toggle('visible', slide.blankBefore);
    qrWrap?.classList.toggle('visible', slide.blankBefore);
    saveState();
    // The sidebar queue shows a "blank before" indicator per slide (renderSidebar
    // reads slide.blankBefore) — refresh it so it doesn't go stale until the
    // user happens to click into the sidebar for an unrelated reason.
    renderSidebar();
  });

  if (qrToggle) {
    qrToggle.addEventListener('click', e => {
      e.stopPropagation(); // don't also flip the parent blank-before row
      slide.qrOverride = !effectiveQR(slide);
      qrToggle.classList.toggle('on', slide.qrOverride);
      saveState();
    });
  }

  attachRichEditor('f-blank-spans', spans => {
    slide.blankSpans = spans;
    saveState();
  });
}

function attachOverridesHandlers(slide) {
  const get = id => document.getElementById(id);

  // Macro override pick
  const pickBtn  = get('btn-override-macro-pick');
  const clearBtn = get('btn-override-macro-clear');

  if (pickBtn) {
    // Select from already-configured macros (not the Pro7 import picker).
    pickBtn.addEventListener('click', () => showMacroOverridePopover(pickBtn, slide));
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      slide.macroOverride = null;
      saveState();
      renderMain();
    });
  }
}

function attachFormHandlers(slide) {
  const get = id => document.getElementById(id);

  // ── Blank-before (scripture + point) ──
  attachBlankBeforeHandlers(slide);

  // ── QR toggle (standalone Blank slides — no blank-before row to nest under) ──
  const blankQrToggle = get('blank-qr-toggle');
  if (blankQrToggle) {
    blankQrToggle.addEventListener('click', () => {
      slide.qrOverride = !effectiveQR(slide);
      blankQrToggle.classList.toggle('on', slide.qrOverride);
      saveState();
    });
  }

  // ── Overrides section (macro override, all slide types) ──
  attachOverridesHandlers(slide);

  // ── Reference (scripture) — auto-syncs label & propName ──
  const refEl = get('f-reference');
  if (refEl) {
    refEl.addEventListener('input', (e) => {
      // Smart book-name autocomplete (skip on deletion to avoid fighting the user)
      const isDeleting = e.inputType && (e.inputType.startsWith('delete') || e.inputType.startsWith('history'));
      if (!isDeleting) {
        const suggested = bibleBookAutocomplete(refEl.value);
        if (suggested) {
          const typedLen = refEl.value.length;
          refEl.value = suggested;
          // Select the auto-completed suffix of the book name so the user can keep typing
          const bookName = suggested.match(/^([^\d]+)/)?.[1]?.trimEnd() || suggested;
          if (typedLen < bookName.length) {
            refEl.setSelectionRange(typedLen, bookName.length);
          }
        }
      }

      slide.reference = refEl.value;
      if (!slide._labelManual) {
        slide.label = slide.reference;
        get('f-label').value = slide.label;
        renderSidebar();
      }
      if (!slide._propNameManual) {
        slide.propName = slide.reference;
        const pn = get('f-propName');
        if (pn) pn.value = slide.propName;
      }
      saveState();
    });
    refEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const transEl = get('f-bible-id');
        lookupBibleVerse(slide, refEl.value.trim(), transEl?.value || '');
      }
    });

    // Per-slide translation override
    const transEl = get('f-bible-id');
    if (transEl) {
      transEl.addEventListener('change', e => { slide.bibleId = e.target.value || ''; saveState(); });
    }
    // Bible lookup
    const lookupBtn = get('btn-bible-lookup');
    if (lookupBtn) {
      lookupBtn.addEventListener('click', () => {
        const overrideId = transEl?.value || '';
        lookupBibleVerse(slide, refEl.value.trim(), overrideId);
      });
    }
  }

  // ── Label ──
  const lblEl = get('f-label');
  if (lblEl) {
    lblEl.addEventListener('input', () => {
      slide.label = lblEl.value;
      slide._labelManual = true;
      renderSidebar();
      saveState();
    });
  }

  // ── Scripture body editors ──
  if (slide.type === 'scripture') {
    if (!slide.bodies) slide.bodies = [slide.body || []];

    let _fitTimer = null;
    slide.bodies.forEach((body, idx) => {
      attachRichEditor(`f-body-${idx}`, spans => {
        slide.bodies[idx] = spans;
        updateDigitBadge(idx, spans);
        if (slide.fitWidth) {
          clearTimeout(_fitTimer);
          _fitTimer = setTimeout(() => {
            const s = activeStyleScheme();
            const allSpans = (slide.bodies || [[]])[0] || [];
            if (allSpans.some(sp => sp.text)) {
              const r = computeOptimalBodyWidth(allSpans, s);
              slide.bodyW = r.bodyW; slide.bodyX = r.bodyX;
            }
            saveState();
          }, 450);
        } else {
          saveState();
        }
      });
    });
    slide.bodies.forEach((body, idx) => updateDigitBadge(idx, body));

    // Split button
    const splitBtn = get('btn-split-body');
    if (splitBtn) {
      splitBtn.addEventListener('click', () => {
        slide.bodies.push([]);
        slide._labelManual = true;
        renderMain();
      });
    }

    // Remove body buttons
    document.querySelectorAll('.btn-remove-body').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.bodyIdx);
        if (slide.bodies.length > 1) {
          slide.bodies.splice(idx, 1);
          renderMain();
        }
      });
    });
  }

  // ── Blank body (blank slides) ──
  if (slide.type === 'blank') {
    attachRichEditor('f-body', spans => {
      slide.spans = spans;
      saveState();
    });
  }

  // ── Image label only ──
  // (label handler above covers it)

  // ── propName ──
  const propEl = get('f-propName');
  if (propEl) {
    propEl.addEventListener('input', () => {
      slide.propName = propEl.value;
      slide._propNameManual = true;
      saveState();
    });
  }

  // ── Point mode toggle ──
  const modeS = get('mode-single');
  const modeR = get('mode-revealing');
  if (modeS) {
    modeS.addEventListener('click', () => { slide.mode = 'single'; renderMain(); });
  }
  if (modeR) {
    modeR.addEventListener('click', () => { slide.mode = 'revealing'; renderMain(); });
  }

  // ── Confidence monitor follow-reveal mode (revealing only) ──
  const frSingle   = get('fr-single');
  const frStacking = get('fr-stacking');
  if (frSingle) {
    frSingle.addEventListener('click', () => { slide.followReveal = 'single'; frSingle.classList.add('active'); frStacking.classList.remove('active'); saveState(); });
  }
  if (frStacking) {
    frStacking.addEventListener('click', () => { slide.followReveal = 'stacking'; frStacking.classList.add('active'); frSingle.classList.remove('active'); saveState(); });
  }

  // ── Point single fields ──
  attachPlainEditor('f-bodyText', text => {
    slide.bodyText = text;
    // Label and prop/cue name stay single-line (collapse any line breaks).
    const oneLine = text.replace(/\s*\n\s*/g, ' ').trim();
    if (!slide._labelManual) {
      slide.label = oneLine;
      const l = get('f-label'); if (l) l.value = slide.label;
      renderSidebar();
    }
    if (!slide._propNameManual) {
      slide.propName = oneLine;
      const pn = get('f-propName');
      if (pn) pn.value = slide.propName;
    }
    saveState();
  });

  // Custom prop toggle (single mode)
  document.getElementById('custom-prop-row')?.addEventListener('click', () => {
    slide.customProp = !slide.customProp;
    document.getElementById('custom-prop-toggle').classList.toggle('on', !!slide.customProp);
    saveState();
  });

  // ── Point revealing fields ──
  // Deck label for a revealing point uses the prop header title if set,
  // otherwise falls back to the first bullet.
  const syncRevealingLabel = () => {
    if (slide._labelManual) return;
    const t = (slide.title || '').trim();
    slide.label = t || bulletToText((slide.bullets || [[]])[0]) || '';
    const lbl = get('f-label');
    if (lbl) lbl.value = slide.label;
    renderSidebar();
  };
  const titleEl = get('f-title');
  if (titleEl) {
    titleEl.addEventListener('input', () => { slide.title = titleEl.value; syncRevealingLabel(); saveState(); });
  }

  // Bullet rich editors (CMD+B for bold, no toolbar)
  document.querySelectorAll('.bullet-rich').forEach(div => {
    const idx = Number(div.dataset.idx);
    div.addEventListener('input', () => {
      if (!slide.bullets) slide.bullets = [];
      slide.bullets[idx] = extractSpans(div);
      // Auto-sync label (title → first bullet)
      if (idx === 0) syncRevealingLabel();
      else renderSidebar(); // keep unfurled bullet subitems (Deck panel) in sync
      saveState();
    });
    div.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        document.execCommand('bold');
        if (!slide.bullets) slide.bullets = [];
        slide.bullets[idx] = extractSpans(div);
        saveState();
      }
    });
  });

  // Add bullet
  const addBulletBtn = get('btn-add-bullet');
  if (addBulletBtn) {
    addBulletBtn.addEventListener('click', () => {
      if (!slide.bullets) slide.bullets = [];
      slide.bullets.push([]);
      renderMain();
      renderSidebar(); // keep unfurled bullet subitems in sync
    });
  }

  // Reflow: paste multi-line text → split into bullets
  const reflowBtn = get('btn-reflow');
  if (reflowBtn) {
    reflowBtn.addEventListener('click', () => {
      const ta = get('reflow-paste');
      if (!ta) return;
      const lines = ta.value.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;
      slide.bullets = lines.map(l => [{ text: l, bold: false }]);
      ta.value = '';
      syncRevealingLabel(); // first bullet may have changed, which the label falls back to
      renderMain();
      renderSidebar(); // keep unfurled bullet subitems in sync
      saveState();
    });
  }

  // Remove bullet
  document.querySelectorAll('.btn-remove-bullet').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (!slide.bullets) slide.bullets = [];
      if (slide.bullets.length > 1) {
        slide.bullets.splice(idx, 1);
        renderMain();
        renderSidebar(); // keep unfurled bullet subitems in sync
      }
    });
  });

  // ── Per-slide transition picker ──
  attachTransitionHandlers('f', get, trans => {
    slide.transition = trans;
    saveState();
    renderSidebar();
  });

  // ── Prop transition overrides ──
  // Single prop (scripture, point-single, image)
  attachTransitionHandlers('fp', get, trans => {
    slide.propTransition = trans;
    saveState();
  });
  // Revealing prop: initial (blank → first prop)
  attachTransitionHandlers('fpi', get, trans => {
    slide.propInitialTransition = trans;
    saveState();
  });
  // Revealing prop: sequential reveal (prop N → N+1)
  attachTransitionHandlers('fpr', get, trans => {
    slide.propRevealTransition = trans;
    saveState();
  });

  // ── propBaseName (revealing point) ──
  const propBaseEl = get('f-propBaseName');
  if (propBaseEl) {
    propBaseEl.addEventListener('input', () => { slide.propBaseName = propBaseEl.value; saveState(); });
  }

  // ── Body width / preview tools ──

  // Helper: compute and store fit-width for the current slide (both displays)
  function applyFitWidth() {
    const result = computeSlideFitWidth(slide, activeStyleScheme());
    if (!result) return;
    slide.bodyW = result.bodyW;
    slide.bodyX = result.bodyX;
    slide.bodyLines = result.bodyLines ?? null;
    slide.propBodyW = result.propBodyW ?? null;
    slide.propBodyX = result.propBodyX ?? null;
    slide.propBodyLines = result.propBodyLines ?? null;
    slide._fitBrokenText = (slide.type === 'point' && slide.mode !== 'revealing') ? (result.brokenText || null) : null;
    slide._fitPropBrokenText = (slide.type === 'point' && slide.mode !== 'revealing') ? (result.propBrokenText || null) : null;
  }

  const fitBtn     = get('btn-fit-width');
  const fitPropBtn = get('btn-fit-width-prop');
  const stripBtn   = get('btn-strip-nl');

  if (fitBtn) {
    fitBtn.addEventListener('click', () => {
      slide.fitWidth = !slide.fitWidth;
      if (slide.fitWidth) {
        applyFitWidth();
      } else {
        slide.bodyW = null;
        slide.bodyX = null;
        slide.bodyLines = null;
        // Reset the Display 2 sub-toggle too, so it doesn't silently reapply
        // next time Fit Width is turned back on without being re-chosen.
        slide.propFitWidth = false;
        slide.propBodyW = null;
        slide.propBodyX = null;
        slide.propBodyLines = null;
        slide._fitBrokenText = null;
        slide._fitPropBrokenText = null;
      }
      saveState();
      renderMain(); // the "+ Display 2" sub-toggle only shows while Fit Width is on
    });
  }

  if (fitPropBtn) {
    fitPropBtn.addEventListener('click', () => {
      slide.propFitWidth = !slide.propFitWidth;
      fitPropBtn.classList.toggle('active', slide.propFitWidth);
      if (slide.fitWidth) applyFitWidth(); // recompute — computeSlideFitWidth already nulls prop fields when off
      saveState();
    });
  }

  if (stripBtn) {
    stripBtn.addEventListener('click', () => {
      slide.stripNewlines = !slide.stripNewlines;
      stripBtn.classList.toggle('active', slide.stripNewlines);
      // Strip changes what Fit Width measures (flattened vs. explicit-break text),
      // so re-run it if it's on.
      if (slide.fitWidth) applyFitWidth();
      saveState();
    });
  }

  // ── Bible formatting popover (verse numbers + superscript) ──
  const verseFmtBtn = get('btn-verse-fmt');
  if (verseFmtBtn) {
    verseFmtBtn.addEventListener('click', () => showVerseFormatPopover(verseFmtBtn, slide));
  }

  // ── Stage layout select ──
  const stageLayoutEl = get('f-stageLayout');
  if (stageLayoutEl) {
    stageLayoutEl.addEventListener('change', () => {
      const sel = stageLayoutEl.options[stageLayoutEl.selectedIndex];
      const name = sel.value;
      if (!name) {
        slide.stageLayout = null;
      } else {
        slide.stageLayout = { layoutName: name, layoutUuid: sel.dataset.uuid || '' };
      }
      saveState();
    });
  }
}

// ─── Slide actions ────────────────────────────────────────────────────────────

function selectSlide(id) {
  state.activeId = id;
  render();
}

function addSlide(type) {
  const endIdx = state.slides.findIndex(s => s.type === 'end');
  const defaults = {
    scripture: { label: 'New Scripture', reference: '', bodies: [[]], propName: '', blankBefore: true, blankSpans: [], blankShowProp: false, transition: null, propTransition: null, stripNewlines: false, fitWidth: true, bodyW: null, bodyX: null, propFitWidth: true, propBodyW: null, propBodyX: null, followReveal: 'single', qrOverride: null },
    point:     { label: 'New Point', mode: 'single', bodyText: '', propName: '', propBaseName: '', title: '', bullets: [[]], blankBefore: true, blankSpans: [], blankShowProp: false, transition: null, propTransition: null, propInitialTransition: null, propRevealTransition: null, fitWidth: true, bodyW: null, bodyX: null, propFitWidth: true, propBodyW: null, propBodyX: null, qrOverride: null },
    blank:     { label: 'Blank', spans: [], transition: null, qrOverride: null },
    image:     { label: 'Image', blankBefore: true, blankSpans: [], transition: null, propTransition: null, qrOverride: null },
    custom:    { label: 'Custom' },
    qrmarker:  { label: 'QR Stop' },
  };
  const slide = { id: uid(), type, fixed: false, ...defaults[type] };
  // Insert right after whichever slide is currently selected, so building a
  // deck in order doesn't require dragging every new slide into place. Falls
  // back to "just before END" when nothing valid is selected (or END itself is).
  const activeIdx = state.slides.findIndex(s => s.id === state.activeId);
  const insertAt = (activeIdx !== -1 && state.slides[activeIdx].type !== 'end') ? activeIdx + 1 : endIdx;
  state.slides.splice(insertAt, 0, slide);
  state.activeId = slide.id;
  render();
}

function deleteSlide(id) {
  const idx = state.slides.findIndex(s => s.id === id);
  if (idx === -1) return;
  state.slides.splice(idx, 1);
  if (state.activeId === id) {
    state.activeId = state.slides[Math.min(idx, state.slides.length - 1)]?.id ?? null;
  }
  saveState(); render();
}

function duplicateSlide(id) {
  const idx = state.slides.findIndex(s => s.id === id);
  if (idx === -1) return;
  const copy = JSON.parse(JSON.stringify(state.slides[idx]));
  copy.id = uid();
  copy.fixed = false;
  state.slides.splice(idx + 1, 0, copy);
  state.activeId = copy.id;
  saveState(); render();
}

// ─── Header handlers ──────────────────────────────────────────────────────────

function attachHeaderHandlers() {
  // deck-header-meta click is handled in initDecks

  // ··· more menu
  const moreBtn  = document.getElementById('btn-more');
  const moreMenu = document.getElementById('header-more-menu');
  moreBtn?.addEventListener('click', e => {
    e.stopPropagation();
    moreMenu?.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#header-more-wrap')) moreMenu?.classList.remove('open');
  });
  document.getElementById('mm-schemes')?.addEventListener('click', () => {
    state.activeId = state.activeId === 'style' ? null : 'style';
    render(); moreMenu?.classList.remove('open');
  });
  document.getElementById('mm-settings')?.addEventListener('click', () => {
    state.activeId = state.activeId === 'settings' ? null : 'settings';
    render(); moreMenu?.classList.remove('open');
  });
  document.getElementById('mm-setup')?.addEventListener('click', () => {
    showMachineSetup(true);
    moreMenu?.classList.remove('open');
  });
  document.getElementById('mm-help')?.addEventListener('click', () => {
    document.getElementById('help-modal')?.classList.add('open');
    moreMenu?.classList.remove('open');
  });
  document.getElementById('mm-diagnostic')?.addEventListener('click', () => {
    moreMenu?.classList.remove('open');
    exportDiagnosticBundle();
  });
  document.getElementById('mm-changelog')?.addEventListener('click', () => {
    document.getElementById('changelog-modal')?.classList.add('open');
    moreMenu?.classList.remove('open');
  });
  document.getElementById('mm-check-updates')?.addEventListener('click', () => {
    moreMenu?.classList.remove('open');
    checkForUpdates(true);
  });
  document.getElementById('mm-theme')?.addEventListener('click', () => {
    toggleTheme();
    moreMenu?.classList.remove('open');
  });

  document.getElementById('btn-add-scripture').addEventListener('click', () => addSlide('scripture'));
  document.getElementById('btn-add-point').addEventListener('click',     () => addSlide('point'));
  document.getElementById('btn-add-blank').addEventListener('click',     () => addSlide('blank'));
  document.getElementById('btn-add-image').addEventListener('click',     () => addSlide('image'));
  document.getElementById('btn-add-custom').addEventListener('click',    () => addSlide('custom'));
  document.getElementById('btn-add-qrmarker').addEventListener('click', () => addSlide('qrmarker'));
  document.getElementById('btn-generate').addEventListener('click', generate);
  document.getElementById('btn-deck-qr')?.addEventListener('click', () => {
    state.config.qrCode = !state.config.qrCode;
    saveState();
    renderSidebar();
  });

  document.getElementById('btn-undo')?.addEventListener('click', applyUndo);
  document.getElementById('btn-redo')?.addEventListener('click', applyRedo);
  // Notes panel resize
  const notesPanel  = document.getElementById('notes-panel');
  const resizeHandle = document.getElementById('notes-resize-handle');
  if (resizeHandle && notesPanel) {
    resizeHandle.addEventListener('mousedown', e => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = notesPanel.offsetWidth;
      resizeHandle.classList.add('dragging');
      notesPanel.classList.add('resizing');
      // Shield iframes so they don't swallow mousemove events
      const shield = document.createElement('div');
      shield.style.cssText = 'position:fixed;inset:0;z-index:99998;cursor:col-resize';
      document.body.appendChild(shield);
      const onMove = mv => {
        const newW = Math.max(200, Math.min(700, startW - (mv.clientX - startX)));
        notesPanel.style.width = `${newW}px`;
      };
      const onUp = () => {
        resizeHandle.classList.remove('dragging');
        notesPanel.classList.remove('resizing');
        shield.remove();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  const toggleNotes = () => {
    const panel = document.getElementById('notes-panel');
    const floatBtn = document.getElementById('btn-notes-open');
    const hidden = panel?.classList.toggle('hidden');
    if (floatBtn) floatBtn.style.display = hidden ? '' : 'none';
  };
  // Hide button initially since panel starts visible
  const _initFloatBtn = document.getElementById('btn-notes-open');
  if (_initFloatBtn) _initFloatBtn.style.display = 'none';
  document.getElementById('btn-notes-close')?.addEventListener('click', toggleNotes);
  document.getElementById('btn-notes-open')?.addEventListener('click', toggleNotes);

  // Sidebar drag-to-resize
  const sidebarEl = document.querySelector('.sidebar');
  const sidebarHandle = document.getElementById('sidebar-resize-handle');
  if (sidebarHandle && sidebarEl) {
    sidebarHandle.addEventListener('mousedown', e => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = sidebarEl.offsetWidth;
      sidebarHandle.classList.add('dragging');
      const shield = document.createElement('div');
      shield.style.cssText = 'position:fixed;inset:0;z-index:99998;cursor:col-resize';
      document.body.appendChild(shield);
      const onMove = mv => {
        const newW = Math.max(160, Math.min(520, startW + (mv.clientX - startX)));
        sidebarEl.style.width = `${newW}px`;
      };
      const onUp = () => {
        sidebarHandle.classList.remove('dragging');
        shield.remove();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // PDF drop zone
  attachPdfHandlers();
  document.getElementById('gen-modal-close')?.addEventListener('click', () => {
    document.getElementById('gen-modal')?.classList.remove('open');
  });
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      if (e.shiftKey) applyRedo(); else applyUndo();
      e.preventDefault();
    }
  });
}

// ─── Spec builder ─────────────────────────────────────────────────────────────

function buildFileName() {
  const { seriesName, messageTitle, weekDate } = state.config;
  const d = weekDate || new Date().toISOString().slice(0, 10);
  const [yyyy, mm, dd] = d.split('-');
  const yy = (yyyy || '').slice(-2);  // 2-digit year: 2026 → 26
  const series = fileNameToken(seriesName || 'Untitled');
  const title  = fileNameToken(messageTitle || '');
  // No QR/SAT suffix baked in here — every export (QR or not, paired or not)
  // gets a sequential _v{N} suffix appended in runGenerate(), so a Saturday/
  // Sunday pair and a plain re-export all share one uniform naming scheme.
  return title
    ? `Message_${yy}.${mm}.${dd}_${series}_${title}`
    : `Message_${yy}.${mm}.${dd}_${series}`;
}

function fileNameToken(value) {
  const cleaned = normalizeDeckQuotes(value || '')
    .replace(/['"]/g, '')
    .trim();
  const words = cleaned.match(/[A-Za-z0-9]+/g) || [];
  if (!words.length) return '';
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function normalizeDeckQuotes(value) {
  return String(value ?? '')
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛]/g, "'");
}

// Live quote uniforming — export already normalizes everything via
// normalizeDeckQuotes(), but that only ran at the very end, so the editor
// itself could still show a mix of straight/curly (macOS smart-quotes while
// typing, curly quotes pasted from Bible sites or Word docs). Normalize as
// the user types/pastes too, so what's displayed always matches what exports.
function normalizeQuotesInElement(el) {
  // Reassigning a Text node's .textContent resets any active Selection's
  // offset to 0 even when the node object and string length are unchanged —
  // so the cursor must be explicitly saved and restored around the mutation,
  // or every normalized quote would knock typing back to the start of the line.
  const sel = window.getSelection();
  const hasFocusInside = sel.rangeCount > 0 && el.contains(sel.focusNode);
  const restoreNode = hasFocusInside ? sel.focusNode : null;
  const restoreOffset = hasFocusInside ? sel.focusOffset : null;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node, changed = false;
  while ((node = walker.nextNode())) {
    const normalized = normalizeDeckQuotes(node.textContent);
    if (normalized !== node.textContent) { node.textContent = normalized; changed = true; }
  }

  if (changed && restoreNode && restoreNode.isConnected) {
    try {
      const range = document.createRange();
      const maxOffset = restoreNode.textContent?.length ?? 0;
      range.setStart(restoreNode, Math.min(restoreOffset, maxOffset));
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (_) {}
  }
}

function initLiveQuoteNormalization() {
  // Capture phase so this runs BEFORE each field's own input handler reads
  // the value/DOM — otherwise the field would save the un-normalized text
  // and only the display would end up fixed.
  document.addEventListener('input', e => {
    const t = e.target;
    if (!t) return;
    if (t.isContentEditable) {
      normalizeQuotesInElement(t);
    } else if ((t.tagName === 'INPUT' && (t.type === 'text' || t.type === 'search')) || t.tagName === 'TEXTAREA') {
      const normalized = normalizeDeckQuotes(t.value);
      if (normalized !== t.value) {
        const { selectionStart, selectionEnd } = t;
        t.value = normalized;
        try { t.setSelectionRange(selectionStart, selectionEnd); } catch (_) {}
      }
    }
  }, true);
}

// ─── Drag text from the notes doc straight into any field ─────────────────
// Captured at dragstart (live DOM, so bold survives even when the browser's
// serialized text/html drag payload would lose it) and consumed on drop —
// same field-detection rule as live quote normalization above.
let _draggedNotesText = null; // { plain, html } — html is <strong>-only, sanitized
// Set only by a whole-block drag (extractNotesBlocks' dragstart, below) —
// null for a plain text-selection drag, which has no single block to trace
// back to. Read by the sidebar drop handler to find/build the right slide.
let _draggedNotesBlockIdx = null;

function isTextFieldTarget(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) return true;
  return false;
}

// Shared by both drag sources below (a text selection, or a whole notes
// block): walks a node list, wrapping runs of bold text in <strong> based
// on computed font-weight (Google Docs marks bold via inline
// font-weight:700 on a span, not a semantic <b>/<strong> tag) or the tag
// itself, and converts <br> to a literal line break.
function boldWalkToHtml(nodes, startBold = false) {
  const bits = [];
  const walk = (node, bold) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) bits.push(bold ? `<strong>${esc(node.textContent)}</strong>` : esc(node.textContent));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === 'BR') { bits.push('<br>'); return; }
    // Checks the tag, the inline style attribute, AND computed style —
    // Google Docs marks bold via a CSS class on a nested span (only
    // reflected in computed style), not an inline style or semantic tag, so
    // relying on just the first two silently misses the common case. Purely
    // additive (OR), so a detached clone (a text SELECTION's
    // cloneContents(), whose computed style is unreliable outside a
    // rendered tree) still falls back to whatever the tag/inline checks
    // catch, same as before.
    const isBold = bold || node.tagName === 'B' || node.tagName === 'STRONG'
      || /bold|[7-9]00/.test(node.style?.fontWeight || '')
      || _isBoldWeight(getComputedStyle(node).fontWeight);
    node.childNodes.forEach(child => walk(child, isBold));
  };
  nodes.forEach(n => walk(n, startBold));
  return bits.join('');
}

function initNotesFieldDragDrop() {
  const docBody = document.getElementById('notes-doc-body');
  if (docBody) {
    docBody.addEventListener('dragstart', () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount || !docBody.contains(sel.anchorNode)) {
        _draggedNotesText = null;
        return;
      }
      const frag = sel.getRangeAt(0).cloneContents();
      // Read plain text off the clone, not sel.toString() — the live selection
      // can already be gone by the time this runs (the browser collapses it
      // as part of entering drag mode), even synchronously within this handler.
      _draggedNotesText = { plain: frag.textContent, html: boldWalkToHtml([...frag.childNodes]) };
    });
    docBody.addEventListener('dragend', () => { _draggedNotesText = null; });
  }

  document.addEventListener('dragover', e => {
    if (isTextFieldTarget(e.target)) e.preventDefault();
  });

  document.addEventListener('drop', e => {
    const t = e.target;
    if (!isTextFieldTarget(t)) return;
    const dragged = _draggedNotesText;
    const plain = dragged?.plain ?? e.dataTransfer.getData('text/plain');
    if (!plain) return;
    e.preventDefault();

    if (t.isContentEditable) {
      t.focus();
      const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
      if (range) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      document.execCommand('insertHTML', false, dragged?.html || esc(plain));
    } else {
      t.focus();
      const start = t.selectionStart ?? t.value.length;
      const end   = t.selectionEnd   ?? t.value.length;
      const next  = t.value.slice(0, start) + plain + t.value.slice(end);
      t.value = next;
      const caret = start + plain.length;
      try { t.setSelectionRange(caret, caret); } catch (_) {}
    }
    t.dispatchEvent(new Event('input', { bubbles: true }));
    _draggedNotesText = null;
    _draggedNotesBlockIdx = null;
  });
}

// Drag a notes block straight onto the deck sidebar to create a slide from
// it — dropped on the SAME container the existing slide-reorder drag uses
// (#slide-queue), but harmlessly: reorder's onDrop/onDragOver key off the
// module-level `dragId`, which a notes-block drag never sets, so they no-op
// and let the event bubble up here undisturbed.
function initNotesSidebarDrop() {
  const queue = document.getElementById('slide-queue');
  if (!queue) return;
  queue.addEventListener('dragover', e => {
    if (_draggedNotesBlockIdx == null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  queue.addEventListener('drop', e => {
    if (_draggedNotesBlockIdx == null) return;
    e.preventDefault();
    const block = _notesDoc?.blocks?.[_draggedNotesBlockIdx];
    _draggedNotesBlockIdx = null;
    if (!block) return;
    const suggestion = notesSuggestionForBlock(block.idx);
    if (suggestion) applyNotesSuggestion(suggestion);
    else notesAddPointFrom({ text: block.text, title: block.text });
  });
}

// Whole-word capitalization of divine pronouns (He/Him/His/Himself).
//
// No English translation on a typical API.Bible key capitalizes these — the ones
// that do (NASB, Amplified, LSB, MEV) aren't in the catalog — and no rule can
// perfectly tell a divine "he" from a human one: Mark 1:40-41 has both, worded
// identically ("...he said" is the man with leprosy in v40, then Jesus in v41).
// So instead of silently guessing at export — where a wrong cap like the leper's
// "he said" was invisible and unfixable — DeckPro writes the caps INTO the
// visible body text (on Scripture lookup when the pref is on, or on demand across
// the deck). The user sees the result and can lowercase any wrong one, and that
// edit sticks because nothing re-applies behind their back. Word-boundary matched
// so "this"/"history" are never touched.
function divineCapsText(text) {
  if (!text) return text;
  return String(text).replace(/\b(he|him|his|himself)\b/gi, m => m[0].toUpperCase() + m.slice(1));
}

// Count the lowercase divine pronouns in a string — i.e. how many words a
// divineCapsText() pass would actually change (the case-sensitive pattern only
// matches the lowercase forms). Used to report/skip no-op runs.
function countLowercaseDivine(text) {
  return (String(text || '').match(/\b(he|him|his|himself)\b/g) || []).length;
}

// Apply divine caps to a span array ([{text, bold}, ...]) in place-safe fashion,
// returning fresh spans (preserves bold and any other per-span fields).
function divineCapsSpans(spans) {
  return (spans || []).map(s => ({ ...s, text: divineCapsText(s.text || '') }));
}

function normalizeBodyText(value) {
  // Divine-pronoun caps are NOT applied here anymore — they live in the visible
  // body text now (see divineCapsText). Export uses exactly what the user sees.
  return normalizeDeckQuotes(value);
}

// On-demand: capitalize divine pronouns across every body field already in the
// deck, so the pref can be applied retroactively (or after pasting/typing text
// that didn't come through Scripture lookup). Visible + reviewable, never silent.
function applyDivineCapsToDeck() {
  let total = 0;
  const doStr    = v => { total += countLowercaseDivine(v); return divineCapsText(v || ''); };
  const doSpans  = arr => (arr || []).map(s => ({ ...s, text: doStr(s.text || '') }));
  const doBullet = b => Array.isArray(b) ? doSpans(b) : doStr(b);

  (state.slides || []).forEach(slide => {
    switch (slide.type) {
      case 'scripture':
        if (Array.isArray(slide.bodies)) slide.bodies = slide.bodies.map(doSpans);
        else if (slide.body)             slide.body   = doSpans(slide.body);
        if (slide.blankSpans)            slide.blankSpans = doSpans(slide.blankSpans);
        break;
      case 'point':
        if (slide.title != null)         slide.title    = doStr(slide.title);
        if (slide.bodyText != null)      slide.bodyText = doStr(slide.bodyText);
        if (slide._fitBrokenText != null)     slide._fitBrokenText     = divineCapsText(slide._fitBrokenText);
        if (slide._fitPropBrokenText != null) slide._fitPropBrokenText = divineCapsText(slide._fitPropBrokenText);
        if (Array.isArray(slide.bullets)) slide.bullets = slide.bullets.map(doBullet);
        if (slide.blankSpans)            slide.blankSpans = doSpans(slide.blankSpans);
        break;
      case 'blank':
      case 'custom':
        if (slide.spans)                 slide.spans = doSpans(slide.spans);
        break;
      case 'image':
        if (slide.blankSpans)            slide.blankSpans = doSpans(slide.blankSpans);
        break;
    }
  });

  if (total === 0) {
    toast('info', 'Nothing to capitalize', 'No lowercase he/him/his/himself found in the deck’s body text.');
    return;
  }
  saveState();
  renderMain();
  toast('success', 'Divine pronouns capitalized',
    `Updated ${total} word${total === 1 ? '' : 's'}. Review them and lowercase any that refer to someone other than God.`);
}

function normalizeExportSpans(spans) {
  return (spans || []).map(span => ({ ...span, text: normalizeBodyText(span.text || '') }));
}

function normalizeExportBullets(bullets) {
  return (bullets || []).map(bullet =>
    Array.isArray(bullet) ? normalizeExportSpans(bullet) : normalizeBodyText(bullet || '')
  );
}

// ─── Book name normalization ──────────────────────────────────────────────────

const BOOK_NAME_OPTIONS = [
  { key: 'acts',          label: 'Acts',                             pattern: /^Acts\b/i,                      choices: ['Acts', 'Acts of the Apostles'] },
  { key: 'songOfSolomon', label: 'Song of Solomon / Song of Songs',  pattern: /^Song of (Solomon|Songs?)\b/i,  choices: ['Song of Solomon', 'Song of Songs'] },
  { key: 'psalm',         label: 'Psalm / Psalms',                   pattern: /^Psalms?\b/i,                   choices: ['Psalm', 'Psalms'] },
  {
    key: 'numberedBooks',
    label: 'Numbered books (1 Cor, 2 Tim, 1 Peter…)',
    pattern: /^(1(?:st)?|2(?:nd)?|3(?:rd)?|First|Second|Third|I{1,3})\s+/i,
    choices: ['1 / 2 / 3', 'First / Second / Third', '1st / 2nd / 3rd'],
    transform(ref, override) {
      const PREFIXES = [['1', '2', '3'], ['First', 'Second', 'Third'], ['1st', '2nd', '3rd']];
      const choiceIdx = ['1 / 2 / 3', 'First / Second / Third', '1st / 2nd / 3rd'].indexOf(override);
      if (choiceIdx < 0) return ref;
      return ref.replace(/^(1(?:st)?|2(?:nd)?|3(?:rd)?|First|Second|Third|I{1,3})\s+/i, (_, p) => {
        const n = /^(1(?:st)?|first|i)$/i.test(p) ? 0 : /^(2(?:nd)?|second|ii)$/i.test(p) ? 1 : 2;
        return PREFIXES[choiceIdx][n] + ' ';
      });
    },
  },
];

function applyBookNames(ref, bookNames) {
  if (!ref || !bookNames) return ref;
  let s = ref;
  for (const { key, pattern, transform } of BOOK_NAME_OPTIONS) {
    const override = bookNames[key];
    if (!override) continue;
    if (transform) s = transform(s, override);
    else s = s.replace(pattern, override);
  }
  return s;
}

// Build the stageScreen object the builder expects. Stage-layout actions need
// the physical screen's name + UUID or ProPresenter can't apply the layout —
// this must return the configured screen, not an empty stub (the empty stub
// silently made every stage-display cue a no-op on export).
function schemeStageScreen() {
  const ss = (state.config && state.config.stageScreen) || DEFAULT_STAGESCREEN();
  return { screenName: ss.screenName || '', screenUuid: ss.screenUuid || '' };
}

function buildSpec() {
  const { includeResponseCard, outputFolder, responses } = state.config;

  // Resolve active style scheme (strip UI-only fields)
  const activeScheme = (state.styleSchemes || []).find(p => p.id === state.activeSchemeId)
    || DEFAULT_STYLE_SCHEME();
  const style = styleForExport(activeScheme);

  const slides = state.slides.map(slide => {
    if (slide.type === 'start') return { type: 'start', label: normalizeDeckQuotes(slide.label || 'Start of Notes'), text: normalizeDeckQuotes(slide.text ?? slide.label ?? 'Start of Notes') };
    if (slide.type === 'end')   return { type: 'end',   label: normalizeDeckQuotes(slide.label || 'End of Notes'), text: normalizeDeckQuotes(slide.text ?? slide.label ?? 'End of Notes') };

    if (slide.type === 'scripture') {
      const bodies = (slide.bodies || [slide.body || []]).map(normalizeExportSpans);
      // Auto-fill blankSpans from all bodies when split and not manually set
      const blankSpans = (slide.blankSpans && slide.blankSpans.length)
        ? slide.blankSpans
        : bodies.length > 1
          ? bodies.reduce((acc, body, i) => {
              if (i > 0) acc.push({ text: '\n', bold: false });
              return acc.concat(body || []);
            }, [])
          : [];
      const displayRef = applyBookNames(slide.reference || '', state.config.bookNames || {});
      return {
        type:          'scripture',
        label:         normalizeDeckQuotes(slide.label || slide.reference || 'Scripture'),
        reference:     normalizeDeckQuotes(displayRef),
        bodies,
        propName:      normalizeDeckQuotes(slide.propName || slide.reference || 'scripture'),
        blankBefore:   !!slide.blankBefore,
        blankSpans:    normalizeExportSpans(blankSpans),
        qrOn:          slide.blankBefore ? effectiveQR(slide) : false,
        stageLayout:   slide.stageLayout || null,
        transition:    slide.transition || null,
        propTransition: slide.propTransition || null,
        macroOverride: slide.macroOverride || null,
        stripNewlines: !!slide.stripNewlines,
        followReveal:  slide.followReveal || 'single',
        bodyW:         slide.fitWidth ? (slide.bodyW || null) : null,
        bodyX:         slide.fitWidth ? (slide.bodyX || null) : null,
        bodyLines:     slide.fitWidth ? (slide.bodyLines || null) : null,
        propBodyW:     (slide.fitWidth && slide.propFitWidth) ? (slide.propBodyW || null) : null,
        propBodyX:     (slide.fitWidth && slide.propFitWidth) ? (slide.propBodyX || null) : null,
        propBodyLines: (slide.fitWidth && slide.propFitWidth) ? (slide.propBodyLines || null) : null,
      };
    }

    if (slide.type === 'point') {
      if (slide.mode === 'revealing') {
        return {
          type:                 'point',
          mode:                 'revealing',
          label:                normalizeDeckQuotes(slide.label || 'Point'),
          title:                normalizeBodyText(slide.title || ''),
          bullets:              normalizeExportBullets((slide.bullets || [[]]).filter(b => bulletToText(b)?.trim())),
          propBaseName:         normalizeDeckQuotes(slide.propBaseName || slide.label || 'point'),
          followReveal:         slide.followReveal || 'single',
          blankBefore:          !!slide.blankBefore,
          blankSpans:           normalizeExportSpans(slide.blankSpans || []),
          qrOn:                 slide.blankBefore ? effectiveQR(slide) : false,
          stageLayout:          slide.stageLayout || null,
          transition:           slide.transition || null,
          macroOverride:        slide.macroOverride || null,
          propInitialTransition: slide.propInitialTransition || null,
          propRevealTransition:  slide.propRevealTransition || null,
          bodyW:                slide.fitWidth ? (slide.bodyW || null) : null,
          bodyX:                slide.fitWidth ? (slide.bodyX || null) : null,
          propBodyW:            (slide.fitWidth && slide.propFitWidth) ? (slide.propBodyW || null) : null,
          propBodyX:            (slide.fitWidth && slide.propFitWidth) ? (slide.propBodyX || null) : null,
        };
      }
      return {
        type:          'point',
        mode:          'single',
        label:         normalizeDeckQuotes(slide.label || slide.bodyText || 'Point'),
        bodyText:      normalizeBodyText(slide.bodyText || ''),
        // Main-screen body only: same text with Fit Width's chosen hard breaks.
        // Prop name, notes and queue keep the unbroken bodyText. Guarded against
        // a stale cache: only used if collapsing the breaks reproduces the text.
        bodyDisplayText: (slide.fitWidth && slide._fitBrokenText &&
          slide._fitBrokenText.replace(/\n/g, ' ').trim() === (slide.bodyText || '').trim())
          ? normalizeBodyText(slide._fitBrokenText) : null,
        // Same idea for Display 2 (LED wall) — its own hard breaks, independent
        // of Display 1's, since it wraps at its own box width.
        propBodyDisplayText: (slide.fitWidth && slide.propFitWidth && slide._fitPropBrokenText &&
          slide._fitPropBrokenText.replace(/\n/g, ' ').trim() === (slide.bodyText || '').trim())
          ? normalizeBodyText(slide._fitPropBrokenText) : null,
        propName:      normalizeDeckQuotes(slide.propName || slide.bodyText || 'point'),
        customProp:    !!slide.customProp,
        blankBefore:   !!slide.blankBefore,
        blankSpans:    normalizeExportSpans(slide.blankSpans || []),
        qrOn:          slide.blankBefore ? effectiveQR(slide) : false,
        stageLayout:   slide.stageLayout || null,
        transition:    slide.transition || null,
        macroOverride: slide.macroOverride || null,
        propTransition: slide.propTransition || null,
        bodyW:         slide.fitWidth ? (slide.bodyW || null) : null,
        bodyX:         slide.fitWidth ? (slide.bodyX || null) : null,
        propBodyW:     (slide.fitWidth && slide.propFitWidth) ? (slide.propBodyW || null) : null,
        propBodyX:     (slide.fitWidth && slide.propFitWidth) ? (slide.propBodyX || null) : null,
      };
    }

    if (slide.type === 'blank') {
      return {
        type:        'blank',
        label:       normalizeDeckQuotes(slide.label || 'Blank'),
        spans:       normalizeExportSpans(slide.spans || []),
        qrOn:        effectiveQR(slide),
        stageLayout: slide.stageLayout || null,
        transition:  slide.transition || null,
        macroOverride: slide.macroOverride || null,
      };
    }

    if (slide.type === 'image') {
      return {
        type:           'image',
        label:          normalizeDeckQuotes(slide.label || 'Image'),
        stageLayout:    slide.stageLayout || null,
        transition:     slide.transition || null,
        propTransition: slide.propTransition || null,
        macroOverride:  slide.macroOverride || null,
        blankBefore:    !!slide.blankBefore,
        blankSpans:     normalizeExportSpans(slide.blankSpans || []),
        qrOn:           slide.blankBefore ? effectiveQR(slide) : false,
      };
    }

    if (slide.type === 'custom') {
      // Unfinished type — exported as a blank slide so the slot is preserved.
      return {
        type:          'custom',
        label:         normalizeDeckQuotes(slide.label || 'Custom'),
        spans:         normalizeExportSpans(slide.spans || []),
        stageLayout:   slide.stageLayout || null,
        transition:    slide.transition || null,
        macroOverride: slide.macroOverride || null,
      };
    }

    return null;
  }).filter(Boolean);

  return {
    name:                buildFileName(),
    deckId:              state.currentDeckId || null,
    qrCode:              !!state.config.qrCode,
    qrMacro:             state.config.qrMacro || null,
    gradientMacro:       state.config.gradientMacro || null,
    gradientMacroQr:     state.config.gradientMacroQr || null,
    includeResponseCard: includeResponseCard,
    outputFolder:        outputFolder || '',
    responses:           Object.fromEntries(Object.entries(responses || { decisionText: '', r1: '', r2: '', r3: '' }).map(([k, v]) => [k, normalizeDeckQuotes(v)])),
    style,
    stageScreen:         schemeStageScreen(),
    stageDisplays:       (activeStyleScheme().stageDisplays ?? ensureGlobalStageDisplays()).filter(d => d.name && d.uuid && (d.triggers || []).length),
    customMacros:        (activeStyleScheme().macros ?? ensureGlobalMacros()).filter(m => m.name && m.uuid && (m.triggers || []).length),
    queueMode:           state.config.queueMode || 'ref',
    pro7RootFolder:      state.config.pro7RootFolder || '',
    pro7LibraryFolder:   state.config.pro7LibraryFolder || '',
    slides,
  };
}

// ─── Export ──────────────────────────────────────────────────────────────────────

// A single scripture slide longer than this (characters) is worth splitting.
const LONG_SCRIPTURE_CHARS = 380;
// True if a string has leading or trailing whitespace we'd want flagged.
const hasEdgeSpace = (s) => typeof s === 'string' && s.length > 0 && s !== s.replace(/^[ \t]+|[ \t]+$/g, '');

// True if a string has a hard return (blank line) before or after the actual
// text — e.g. "text\n\n". Internal line breaks are intentional and not flagged.
const hasEdgeHardReturn = (s) => typeof s === 'string' && s.trim() !== '' && (/^\s*\n/.test(s) || /\n\s*$/.test(s));

// Strip leading/trailing hard returns (and edge whitespace) from a spans array,
// in place: drop fully-blank edge spans, then trim the new first/last text spans.
function trimEdgeHardReturns(bodyArr) {
  while (bodyArr.length && /^\s*$/.test(bodyArr[bodyArr.length - 1].text || '')) bodyArr.pop();
  while (bodyArr.length && /^\s*$/.test(bodyArr[0].text || '')) bodyArr.shift();
  const first = bodyArr.findIndex(s => s.text);
  if (first >= 0) bodyArr[first] = { ...bodyArr[first], text: bodyArr[first].text.replace(/^\s+/, '') };
  const last = bodyArr.map((s, j) => (s.text ? j : -1)).filter(j => j >= 0).pop();
  if (last != null) bodyArr[last] = { ...bodyArr[last], text: bodyArr[last].text.replace(/\s+$/, '') };
}

function updateDigitBadge(idx, spans) {
  const badge = document.getElementById('digit-badge-' + idx);
  if (!badge) return;
  // Intentional verse-number spans are not artifacts — ignore them.
  const digitSpan = (spans || []).find(s => !s.verseNum && /^\d+\s*$/.test(s.text || ''));
  const joined = (spans || []).filter(s => !s.verseNum).map(s => s.text || '').join('');
  const m = !digitSpan && joined.trim().match(DIGIT_PREFIX_RE);
  if (digitSpan) {
    badge.textContent = '\u26a0 "' + digitSpan.text.trim() + '" looks like a verse number';
    badge.style.display = 'block';
  } else if (m) {
    badge.textContent = '\u26a0 starts with "' + m[1] + '" \u2014 may be a verse number';
    badge.style.display = 'block';
  } else {
    badge.textContent = '';
    badge.style.display = 'none';
  }
}

function preflightWarnings() {
  // Each item: { msg, slideId?, field?, autoFix? }
  const items = [];
  const cfg = state.config;

  function warn(msg, slideId = null, field = null, autoFix = null) {
    items.push({ msg, slideId, field, autoFix });
  }

  for (const slide of state.slides) {
    const label = slide.label || slide.type;
    if (slide.type === 'scripture') {
      if (!slide.reference?.trim()) {
        warn(`Scripture “${label}” has no reference`, slide.id, 'reference');
      } else if (hasEdgeSpace(slide.reference)) {
        warn(
          `Scripture “${label}” reference has a stray space at the start or end`,
          slide.id, 'reference',
          () => { slide.reference = slide.reference.trim(); saveState(); }
        );
      }
      const bodies = slide.bodies || [[]];
      if (bodies.every(b => !b?.some(s => s.text?.trim())))
        warn(`Scripture “${label}” has no body text`, slide.id, 'body');
      bodies.forEach((b, i) => {
        const joined = (b || []).map(s => s.text || '').join('');
        const sfx = bodies.length > 1 ? ` (slide ${i + 1})` : '';
        if (joined.length > LONG_SCRIPTURE_CHARS)
          warn(`Scripture “${label}”${sfx} is long (${joined.length} chars) — consider splitting it into two slides`, slide.id, 'body');
        if (hasEdgeSpace(joined)) {
          warn(`Scripture “${label}”${sfx} has a stray space at the start or end`, slide.id, 'body', () => {
            if (!slide.bodies) return;
            const bodyArr = slide.bodies[i];
            if (!bodyArr || !bodyArr.length) return;
            // Trim leading/trailing text from first/last non-empty span
            const first = bodyArr.findIndex(s => s.text);
            if (first >= 0) bodyArr[first] = { ...bodyArr[first], text: bodyArr[first].text.replace(/^[ \t]+/, '') };
            const last = bodyArr.map((s, j) => s.text ? j : -1).filter(j => j >= 0).pop();
            if (last != null) bodyArr[last] = { ...bodyArr[last], text: bodyArr[last].text.replace(/[ \t]+$/, '') };
            saveState();
          });
        }
        if (hasEdgeHardReturn(joined)) {
          warn(`Scripture “${label}”${sfx} has a hard return (blank line) before or after the text`, slide.id, 'body', () => {
            const bodyArr = slide.bodies?.[i];
            if (!bodyArr || !bodyArr.length) return;
            trimEdgeHardReturns(bodyArr);
            saveState();
          });
        }
        // Detect lone digit spans (verse-number artifacts from Bible copy-paste).
        // Intentional verse-number spans are flagged { verseNum: true } and skipped.
        const digitSpan = (b || []).find(s => !s.verseNum && /^\d+\s*$/.test(s.text || ''));
        if (digitSpan) {
          warn(
            `Scripture "${label}"${sfx} may contain a leftover verse number: "${digitSpan.text.trim()}" is a digit-only span`,
            slide.id, 'body',
            () => {
              if (!slide.bodies) return;
              slide.bodies[i] = (slide.bodies[i] || []).filter(s => !/^\d+\s*$/.test(s.text || ''));
              saveState();
            }
          );
        } else if (!(b || []).some(s => s.verseNum) && /^\d+(?:\s|["“”‘’])/.test(joined.trim())) {
          const digit = (joined.trim().match(/^(\d+)/) || [])[1];
          warn(
            `Scripture "${label}"${sfx} body starts with "${digit}" — may be a leftover verse number`,
            slide.id, 'body',
            () => {
              if (!slide.bodies) return;
              const bodyArr = slide.bodies[i];
              if (!bodyArr) return;
              const firstIdx = bodyArr.findIndex(s => s.text);
              if (firstIdx < 0) return;
              bodyArr[firstIdx] = {
                ...bodyArr[firstIdx],
                text: bodyArr[firstIdx].text.replace(/^\d+(?:\s|["“”‘’])/, m => m.slice(digit.length).replace(/^\s/, ''))
              };
              saveState();
            }
          );
        }
      });
    }
    if (slide.type === 'point' && slide.mode !== 'revealing') {
      if (!slide.bodyText?.trim()) {
        warn(`Point “${label}” has no body text`, slide.id, 'bodyText');
      } else if (hasEdgeSpace(slide.bodyText)) {
        warn(
          `Point “${label}” has a stray space at the start or end`,
          slide.id, 'bodyText',
          () => { slide.bodyText = slide.bodyText.trim(); saveState(); }
        );
      }
      if (hasEdgeHardReturn(slide.bodyText)) {
        warn(
          `Point “${label}” has a hard return (blank line) before or after the text`,
          slide.id, 'bodyText',
          () => { slide.bodyText = slide.bodyText.replace(/^\s+|\s+$/g, ''); saveState(); }
        );
      }
    }
    if (slide.type === 'point' && slide.mode === 'revealing') {
      if (!(slide.bullets || []).some(b => bulletToText(b)?.trim()))
        warn(`Revealing point “${label}” has no bullets`, slide.id, 'bullets');
    }
  }

  if (cfg.includeResponseCard) {
    const r = cfg.responses || {};
    if (!r.r1?.trim() && !r.r2?.trim() && !r.r3?.trim())
      warn('Response card is enabled but all three response lines are empty', 'rc');
  }

  // ── Macros / Stage Displays with no triggers ──────────────────────────────
  // A correctly-picked entry (real name + uuid) with zero triggers checked is
  // indistinguishable in the Palette UI from one that's fully configured — no
  // visual difference, and buildSpec()'s `.filter(d => ... (d.triggers||[]).length)`
  // silently drops it from the export. This is the most likely explanation for
  // "I picked a real stage layout/macro but it never fires" — catch it here.
  const activeMacros = (activeStyleScheme().macros ?? ensureGlobalMacros());
  for (const m of activeMacros) {
    if (m.name && m.uuid && !(m.triggers || []).length)
      warn(`Macro "${m.name}" has no triggers set — it will never fire on export (Styles → Macros)`);
  }
  const activeStageDisplays = (activeStyleScheme().stageDisplays ?? ensureGlobalStageDisplays());
  for (const d of activeStageDisplays) {
    if (d.name && d.uuid && !(d.triggers || []).length)
      warn(`Stage display "${d.name}" has no triggers set — it will never fire on export (Styles → Stage)`);
  }

  // ── Quote mismatch checks ──────────────────────────────────────────────────
  for (const slide of state.slides) {
    const label = slide.label || slide.type;
    const texts = [];
    if (slide.type === 'scripture') {
      const bodies = slide.bodies || [[]];
      for (const body of bodies) {
        const joined = (body || []).map(s => s.text || '').join('');
        if (joined.trim()) texts.push({ text: joined, field: 'body' });
      }
    } else if (slide.type === 'point' && slide.mode !== 'revealing') {
      if (slide.bodyText?.trim()) texts.push({ text: slide.bodyText, field: 'bodyText' });
    } else if (slide.type === 'point' && slide.mode === 'revealing') {
      for (const b of (slide.bullets || [])) {
        const bt = bulletToText(b);
        if (bt?.trim()) texts.push({ text: bt, field: 'bullets' });
      }
    }
    for (const { text, field } of texts) {
      const normalized = normalizeDeckQuotes(text);
      const straightDouble = (normalized.match(/"/g) || []).length;
      if (straightDouble % 2 !== 0)
        warn(`“${label}” has an odd number of double quotes — may be unpaired`, slide.id, field);
    }
  }

  return items;
}

async function generate() {
  const btn = document.getElementById('btn-generate');

  // Check Pro7 BEFORE disabling the button — so we can bail cleanly.
  // If auto-manage is on, the server will quit/relaunch Pro7 for us, so we proceed.
  const autoManage = state.config.autoManagePro7 === true;
  try {
    const check = await fetch('/api/pro7/process');
    const { running } = await check.json();
    if (running && !autoManage) { showProRunningModal(); return; }
  } catch (_) { /* can't check — allow export anyway */ }

  const warnings = preflightWarnings();
  if (warnings.length) {
    const ok = await showWarningDialog(warnings);
    if (!ok) return;
  }

  btn.disabled = true;
  btn.textContent = 'Exporting…';

  // Compute fit-width for any slides that have it on (catches slides never visited in this session)
  try {
    const scheme = activeStyleScheme();
    for (const slide of state.slides) {
      if (!slide.fitWidth) continue;
      const r = computeSlideFitWidth(slide, scheme);
      if (r) {
        slide.bodyW = r.bodyW; slide.bodyX = r.bodyX; slide.bodyLines = r.bodyLines ?? null;
        slide.propBodyW = r.propBodyW ?? null; slide.propBodyX = r.propBodyX ?? null; slide.propBodyLines = r.propBodyLines ?? null;
        // Hard punctuation breaks apply to single-mode point body text only.
        slide._fitBrokenText = (slide.type === 'point' && slide.mode !== 'revealing') ? (r.brokenText || null) : null;
        slide._fitPropBrokenText = (slide.type === 'point' && slide.mode !== 'revealing') ? (r.propBrokenText || null) : null;
      }
    }
  } catch (_) { /* non-fatal — export continues without fit-width pre-computation */ }

  // Always export directly to Pro7
  await runGenerate(btn, true);
}

function showDeliveryOverlay(steps, opts = {}) {
  const overlay = document.getElementById('delivery-overlay');
  const stepsEl = document.getElementById('delivery-steps');
  if (!overlay || !stepsEl) return;
  // Title/subtitle default to the export copy but can be overridden (e.g. for updates)
  const titleEl = document.getElementById('delivery-title');
  const subEl   = document.getElementById('delivery-sub');
  if (titleEl) titleEl.textContent = opts.title    || 'Delivering to ProPresenter';
  if (subEl)   subEl.textContent   = opts.subtitle || "Don't switch to ProPresenter until this completes";
  stepsEl.innerHTML = steps.map((s, i) => `
    <div class="delivery-step" id="delivery-step-${i}">
      <div class="delivery-step-icon" id="delivery-step-icon-${i}">
        <div class="delivery-step-spin"></div>
      </div>
      <span>${s}</span>
    </div>`).join('');
  // Show release notes if provided (update installs)
  overlay.querySelector('.delivery-notes')?.remove();
  if (opts.notes) {
    const notesHtml = formatUpdateNotes(opts.notes, 10);
    if (notesHtml) {
      const notesDiv = document.createElement('div');
      notesDiv.className = 'delivery-notes';
      notesDiv.innerHTML = `<div class="delivery-notes-title">What's new</div>${notesHtml}`;
      stepsEl.parentNode.appendChild(notesDiv);
    }
  }
  // Cancel button — only while there's a safe bail point (the "closing
  // ProPresenter" wait). Clicking it stops the export before anything is
  // written and leaves Pro7 open. Rebuilt each time so a stale handler can't
  // linger from a previous overlay.
  overlay.querySelector('.delivery-cancel')?.remove();
  if (opts.onCancel) {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'delivery-cancel btn-secondary';
    cancelBtn.textContent = 'Cancel export';
    cancelBtn.addEventListener('click', () => {
      cancelBtn.disabled = true;
      cancelBtn.textContent = 'Cancelling…';
      opts.onCancel();
    });
    stepsEl.parentNode.appendChild(cancelBtn);
  }
  overlay.classList.add('visible');
}

function updateDeliveryStep(i, done) {
  const step = document.getElementById(`delivery-step-${i}`);
  const icon = document.getElementById(`delivery-step-icon-${i}`);
  if (!step || !icon) return;
  if (done) {
    step.classList.add('done');
    icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6.5" stroke="var(--blue)" stroke-width="1.2"/>
      <path d="M4 7l2 2 4-4" stroke="var(--blue)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  } else {
    icon.innerHTML = `<div class="delivery-step-spin"></div>`;
  }
}

function hideDeliveryOverlay() {
  const overlay = document.getElementById('delivery-overlay');
  overlay?.querySelector('.delivery-cancel')?.remove();
  overlay?.classList.remove('visible');
}

// Ask the server to abort an in-flight export. Only has an effect while the
// server is still waiting for ProPresenter to close (the safe bail point);
// once past that the export finishes normally and this is a no-op.
function requestExportCancel() {
  fetch('/api/generate/cancel', { method: 'POST' }).catch(() => {});
}

// ─── Rebuild overlay ──────────────────────────────────────────────────────────

const REBUILD_STEPS = [
  'Clearing build cache',
  'Building app',
  'Installing to Applications',
  'Refreshing system cache',
  'Relaunching',
];

function showRebuildOverlay() {
  const overlay = document.getElementById('rebuild-overlay');
  const stepsEl = document.getElementById('rebuild-steps');
  const title   = document.getElementById('rebuild-title');
  const sub     = document.getElementById('rebuild-sub');
  const closeBtn = document.getElementById('rebuild-close-btn');
  if (!overlay || !stepsEl) return;

  // Reset state
  if (title)    { title.textContent = 'Redeploying DeckPro'; title.style.color = ''; }
  if (sub)      { sub.textContent = 'Takes about 30 seconds — don\'t close the app'; sub.style.color = ''; }
  if (closeBtn) closeBtn.style.display = 'none';

  stepsEl.innerHTML = REBUILD_STEPS.map((s, i) => `
    <div class="delivery-step" id="rebuild-step-${i}">
      <div class="delivery-step-icon" id="rebuild-step-icon-${i}">
        <div class="delivery-step-dot"></div>
      </div>
      <span>${s}</span>
    </div>`).join('');

  overlay.classList.add('visible');
}

function updateRebuildStep(stepNum) {
  // stepNum is 1-based from rebuild.sh (STEP:1, STEP:2, …)
  // Mark previous step done, set current step spinning
  const doneIdx   = stepNum - 2;
  const activeIdx = stepNum - 1;
  const checkSvg  = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6.5" stroke="var(--blue)" stroke-width="1.2"/>
    <path d="M4 7l2 2 4-4" stroke="var(--blue)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  if (doneIdx >= 0) {
    document.getElementById(`rebuild-step-${doneIdx}`)?.classList.add('done');
    const icon = document.getElementById(`rebuild-step-icon-${doneIdx}`);
    if (icon) icon.innerHTML = checkSvg;
  }
  if (activeIdx < REBUILD_STEPS.length) {
    const icon = document.getElementById(`rebuild-step-icon-${activeIdx}`);
    if (icon) icon.innerHTML = `<div class="delivery-step-spin"></div>`;
  }
}

function showRebuildError(msg) {
  const title    = document.getElementById('rebuild-title');
  const sub      = document.getElementById('rebuild-sub');
  const closeBtn = document.getElementById('rebuild-close-btn');
  if (title)    { title.textContent = 'Rebuild Failed'; title.style.color = 'var(--red, #ff453a)'; }
  if (sub)      { sub.textContent = msg; sub.style.color = 'var(--muted)'; }
  if (closeBtn) {
    closeBtn.style.display = '';
    closeBtn.onclick = () => document.getElementById('rebuild-overlay')?.classList.remove('visible');
  }
}

// Every export gets a sequential _v{N} suffix (lowercase), starting at v1 —
// even the very first export of a given base name. Tolerant of legacy
// uppercase _V{N} entries already sitting in gen history from before this
// convention, so the count doesn't reset/collide for existing users.
function nextVersionedName(base) {
  const baseRe = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(_[vV]\\d+)?\\.pro$`);
  const priorCount = loadGenHistory().filter(e => baseRe.test(e.fileName || '')).length;
  return { name: `${base}_v${priorCount + 1}`, index: priorCount + 1 };
}

async function runGenerate(btn, deliverMode = false) {
  if (!btn) btn = document.getElementById('btn-generate');

  btn.disabled = true;
  btn.textContent = 'Exporting…';

  try {
    // Paired export: when the deck-wide QR toggle is on AND the "export both"
    // preference is enabled, one Export click delivers TWO presentations —
    // the deck as-is with QR off, and the deck as configured with QR on —
    // sharing one prop collection (see encodeDeliverPair in encode.js). Both
    // share the SAME _v{N}, since they're the same version of the deck; the
    // QR one gets an additional _SAT suffix to distinguish it (e.g. base_v7
    // / base_v7_SAT).
    if (state.config.qrCode && state.config.qrExportPair) {
      const wasQr = state.config.qrCode;
      state.config.qrCode = false;
      const specNoQR = buildSpec();
      state.config.qrCode = wasQr; // restore (true)
      const specQR = buildSpec();

      const base = specNoQR.name; // buildFileName() no longer varies by qrCode
      const v1 = nextVersionedName(base);
      specNoQR.name = v1.name;
      specQR.name   = `${v1.name}_SAT`;
      const fileNameNoQR = specNoQR.name;
      const fileNameQR   = specQR.name;

      specNoQR.deliverMode = true;
      specQR.deliverMode   = true;
      specNoQR.autoManagePro7 = state.config.autoManagePro7 === true;
      specQR.autoManagePro7   = state.config.autoManagePro7 === true;

      const steps = [
        'Building presentations',
        'Writing to ProPresenter library (2 files)',
        'Writing props (shared)',
      ];
      if (specNoQR.autoManagePro7) {
        steps.unshift('Closing ProPresenter (if open)');
        steps.push('Relaunching ProPresenter');
      }
      const lastStep = steps.length - 1;
      const postGenerate = (extra) => fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          spec: specNoQR, fileName: fileNameNoQR,
          pairSpec: specQR, pairFileName: fileNameQR,
          ...extra,
        }),
      }).then(r => r.json());

      const overlayOpts = {
        subtitle: "Exporting the non-QR and QR versions — don't switch to ProPresenter until this completes",
        ...(specNoQR.autoManagePro7 ? { onCancel: requestExportCancel } : {}),
      };
      showDeliveryOverlay(steps, overlayOpts);
      updateDeliveryStep(0, false);
      let data = await postGenerate({});

      // Either (or both) of the two files may have been hand-edited in Pro7
      // since last export — see the single-export path below for why this
      // check is fast (no Pro7 quit/relaunch happens until after a choice).
      if (data.ok && data.needsDecision) {
        hideDeliveryOverlay();
        const choice = await showMergeDecisionModal(data.changes);
        if (!choice) return; // cancelled — nothing was written, just stop
        showDeliveryOverlay(steps, overlayOpts);
        updateDeliveryStep(0, false);
        data = await postGenerate({ mergeChoice: choice, mergeChanges: data.changes });
      }

      if (data.cancelled) {
        hideDeliveryOverlay();
        toast('info', 'Export cancelled', 'Nothing was written. ProPresenter was left open.');
        return;
      }

      if (data.ok) {
        for (let i = 0; i <= lastStep; i++) {
          updateDeliveryStep(i, true);
          await new Promise(r => setTimeout(r, i === lastStep ? 500 : 250));
        }
        hideDeliveryOverlay();
        // Record both files in history — same shared propsBackup on each.
        for (const p of (data.presentations || [])) {
          addGenHistoryEntry({
            presentationPath:  p.path,
            presentationBytes: p.bytes,
            delivered:         data.delivered,
            propsBackup:       data.propsBackup,
          });
        }
        showGenerateModal(data, specQR);
        if (data.propsInstalled === false) {
          toast('warn', 'Decks exported — props not installed', data.propsError || 'Configuration/Props not found');
        }
      } else {
        hideDeliveryOverlay();
        toast('error', 'Export failed', data.error || 'Unknown error');
      }
      return;
    }

    const spec = buildSpec();
    const { name } = nextVersionedName(spec.name);
    spec.name = name;
    const fileName = spec.name;
    spec.deliverMode = true;
    spec.autoManagePro7 = state.config.autoManagePro7 === true;

    const steps = [
      'Building presentation',
      'Writing to ProPresenter library',
      'Writing props',
    ];
    if (spec.autoManagePro7) {
      steps.unshift('Closing ProPresenter (if open)');
      steps.push('Relaunching ProPresenter');
    }
    const lastStep = steps.length - 1;
    const postGenerate = (extra) => fetch('/api/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ spec, fileName, ...extra }),
    }).then(r => r.json());

    const overlayOpts = spec.autoManagePro7 ? { onCancel: requestExportCancel } : {};
    showDeliveryOverlay(steps, overlayOpts);
    updateDeliveryStep(0, false);
    let data = await postGenerate({});

    // Deck's last exported file was hand-edited in Pro7 since DeckPro wrote
    // it — pause for Merge/Override before anything gets written. The check
    // itself (a file read + decode + diff) is fast — no Pro7 quit/relaunch
    // happens until after a choice is made — so this should feel like a
    // quick transition, not a stall.
    if (data.ok && data.needsDecision) {
      hideDeliveryOverlay();
      const choice = await showMergeDecisionModal(data.changes);
      if (!choice) return; // cancelled — nothing was written, just stop
      showDeliveryOverlay(steps, overlayOpts);
      updateDeliveryStep(0, false);
      data = await postGenerate({ mergeChoice: choice, mergeChanges: data.changes });
    }

    if (data.cancelled) {
      hideDeliveryOverlay();
      toast('info', 'Export cancelled', 'Nothing was written. ProPresenter was left open.');
      return;
    }

    if (data.ok) {
      // Mark all steps done in sequence for a smooth finish
      for (let i = 0; i <= lastStep; i++) {
        updateDeliveryStep(i, true);
        await new Promise(r => setTimeout(r, i === lastStep ? 500 : 250));
      }
      hideDeliveryOverlay();
      addGenHistoryEntry(data);
      showGenerateModal(data, spec);
      if (data.propsInstalled === false) {
        toast('warn', 'Deck exported — props not installed', data.propsError || 'Configuration/Props not found');
      }
    } else {
      hideDeliveryOverlay();
      toast('error', 'Export failed', data.error || 'Unknown error');
    }
  } catch (err) {
    hideDeliveryOverlay();
    toast('error', 'Export error', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Export';
  }
}

// Strips the well-known element/action path prefix (already shown via the
// change's own slideLabel/elementName) so what's left reads as a plain
// property name — "bounds.size.width" instead of the full internal path.
function describeChangePath(c) {
  let p = c.path
    .replace(/^actions\[\d+\]\.slide\.presentation\.baseSlide\.elements\[[^\]]+\]\.?/, '')
    .replace(/^actions\[\d+\]\.?/, '');
  if (p) return p;
  return c.kind === 'added' ? 'added in Pro7' : c.kind === 'removed' ? 'removed in Pro7' : '';
}

function formatChangeValue(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return String(Math.round(v * 100) / 100);
  const s = String(v);
  return s.length > 60 ? s.slice(0, 57) + '…' : s;
}

// Shown when the deck's last exported file was hand-edited in ProPresenter
// since DeckPro wrote it (see checkForHandEdits in server.js). Lists what
// changed — slide, element, property, old → new — and lets the user choose
// to carry those edits forward into the new version, or export fresh from
// DeckPro's own data and let the old edits go. Resolves to 'merge' |
// 'override' | null (dismissed — caller should abort the export entirely,
// not guess which the user meant).
function showMergeDecisionModal(changes) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'warn-overlay';

    const rows = changes.map(c => {
      if (c.kind === 'structural') {
        return `<li class="warn-item"><span class="warn-msg">Slide count changed in ProPresenter: ${formatChangeValue(c.oldValue)} → ${formatChangeValue(c.newValue)} slides. This deck can't be reliably merged — pick Override, or fix the slide count in Pro7 first.</span></li>`;
      }
      // role only appears on a paired QR export (two independent files) —
      // absent (and so omitted) for the plain single-file export path.
      const roleTag = c.role ? `<span style="opacity:.65">[${c.role === 'qr' ? 'QR file' : 'No-QR file'}]</span> ` : '';
      const where = c.slideIndex ? `Slide ${c.slideIndex}${c.slideLabel ? ` "${esc(c.slideLabel)}"` : ''}` : '';
      const what  = c.elementName ? `${esc(c.elementName)}` : '';
      const prop  = esc(describeChangePath(c));
      const notMergeable = c.mergeable === false ? ' <em style="opacity:.7">(shown only — can\'t auto-merge text content)</em>' : '';
      let valueLine;
      if (c.kind === 'added')       valueLine = 'added in Pro7';
      else if (c.kind === 'removed') valueLine = 'removed in Pro7';
      else valueLine = `${esc(formatChangeValue(c.oldValue))} → ${esc(formatChangeValue(c.newValue))}`;
      return `<li class="warn-item">
        <span class="warn-msg">${roleTag}<strong>${where}${what ? ' · ' + what : ''}</strong>${prop ? ' — ' + prop : ''}: ${valueLine}${notMergeable}</span>
      </li>`;
    }).join('');

    overlay.innerHTML = `
      <div class="warn-modal">
        <div class="warn-hdr">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L2 17h16L10 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
            <path d="M10 8v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="10" cy="14.5" r=".75" fill="currentColor"/>
          </svg>
          <span>Changed in ProPresenter since last export</span>
        </div>
        <p style="font-size:12.5px;color:var(--muted);margin:0 0 8px;line-height:1.4">
          The last version of this deck has been hand-edited in ProPresenter. Merge to carry those edits into the new version, or override to export fresh from DeckPro and let them go.
        </p>
        <ul class="warn-list">${rows}</ul>
        <div class="warn-actions">
          <button class="warn-btn-cancel">Cancel</button>
          <button class="warn-btn-fixall" id="merge-decision-override">Override</button>
          <button class="warn-btn-ok" id="merge-decision-merge">Merge</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('.warn-btn-cancel')?.addEventListener('click', () => { overlay.remove(); resolve(null); });
    overlay.querySelector('#merge-decision-override')?.addEventListener('click', () => { overlay.remove(); resolve('override'); });
    overlay.querySelector('#merge-decision-merge')?.addEventListener('click', () => { overlay.remove(); resolve('merge'); });
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(null); } });
  });
}

function showProRunningModal() {
  const modal = document.getElementById('gen-modal');
  const body  = document.getElementById('gen-modal-body');
  const title = document.getElementById('gen-modal-title');
  if (!modal || !body) return;
  title.textContent = 'Quit ProPresenter first';
  body.innerHTML = `
    <p style="font-size:13px;color:var(--muted);line-height:1.5;margin-bottom:14px">
      Props are written to ProPresenter's config file, which Pro7 overwrites when it quits.
      Close ProPresenter, then export — it'll be ready to open when you're done.
    </p>
    <div style="text-align:right">
      <button id="pro-running-ok" style="background:var(--blue);color:#fff;border:none;border-radius:7px;padding:7px 18px;font-size:13px;font-weight:600;cursor:pointer">Got it</button>
    </div>`;
  modal.classList.add('open');
  document.getElementById('pro-running-ok')?.addEventListener('click', () => modal.classList.remove('open'));
  document.getElementById('gen-modal-close')?.addEventListener('click', () => modal.classList.remove('open'));
}

function showWarningDialog(warnings, opts = {}) {
  const heading     = opts.heading     || 'Before you export';
  const okLabel     = opts.okLabel     || 'Export Anyway';
  const cancelLabel = opts.cancelLabel || 'Go Back';

  // Normalise: accept plain strings for backward compat
  const items = warnings.map(w => typeof w === 'string' ? { msg: w } : w);

  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'warn-overlay';

    const hasAutoFix = items.some(it => it.autoFix && !it._fixed);

    function renderItems() {
      return items.map((it, i) => `
        <li class="warn-item${it._fixed ? ' warn-item-fixed' : ''}" data-idx="${i}">
          <span class="warn-msg">${esc(it.msg)}</span>
          <span class="warn-item-acts">
            ${it.autoFix && !it._fixed ? `<button class="warn-act warn-act-fix" data-idx="${i}">Fix</button>` : ''}
            ${it.slideId && !it._fixed ? `<button class="warn-act warn-act-goto" data-idx="${i}">Go&nbsp;to&nbsp;↗</button>` : ''}
          </span>
        </li>`).join('');
    }

    function buildHtml() {
      const anyFix = items.some(it => it.autoFix && !it._fixed);
      return `
        <div class="warn-modal">
          <div class="warn-hdr">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 17h16L10 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
              <path d="M10 8v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="10" cy="14.5" r=".75" fill="currentColor"/>
            </svg>
            <span>${esc(heading)}</span>
          </div>
          <ul class="warn-list" id="pf-warn-list">${renderItems()}</ul>
          <div class="warn-actions">
            <button class="warn-btn-cancel">${esc(cancelLabel)}</button>
            ${anyFix ? `<button class="warn-btn-fixall">Fix all auto</button>` : ''}
            <button class="warn-btn-ok">${esc(okLabel)}</button>
          </div>
        </div>`;
    }

    overlay.innerHTML = buildHtml();
    document.body.appendChild(overlay);

    function refresh() {
      overlay.innerHTML = buildHtml();
      attachHandlers();
    }

    function goTo(item) {
      overlay.remove();
      resolve(false);
      if (item.slideId === 'rc') {
        state.activeId = 'rc';
        render();
      } else if (item.slideId) {
        state.activeId = item.slideId;
        render();
        setTimeout(() => {
          const fid = item.field === 'reference' ? 'f-reference'
                    : item.field === 'bodyText'  ? 'f-bodyText'
                    : null;
          const el = fid ? document.getElementById(fid) : null;
          if (el) { el.focus(); el.select?.(); el.scrollIntoView?.({ block: 'center' }); }
        }, 80);
      }
    }

    function attachHandlers() {
      overlay.querySelector('.warn-btn-cancel')?.addEventListener('click', () => { overlay.remove(); resolve(false); });
      overlay.querySelector('.warn-btn-ok')?.addEventListener('click',     () => { overlay.remove(); resolve(true); });
      overlay.querySelector('.warn-btn-fixall')?.addEventListener('click', () => {
        items.forEach(it => { if (it.autoFix && !it._fixed) { it.autoFix(); it._fixed = true; } });
        refresh();
      });
      overlay.querySelectorAll('.warn-act-fix').forEach(btn => {
        btn.addEventListener('click', () => {
          const it = items[Number(btn.dataset.idx)];
          if (it?.autoFix) { it.autoFix(); it._fixed = true; refresh(); }
        });
      });
      overlay.querySelectorAll('.warn-act-goto').forEach(btn => {
        btn.addEventListener('click', () => goTo(items[Number(btn.dataset.idx)]));
      });
      overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
    }

    attachHandlers();
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function toast(type, title, detail) {
  logEvent('toast:' + type, title, detail);
  const wrap = document.getElementById('toast-wrap');
  const el   = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<strong>${esc(title)}</strong><div class="toast-path">${esc(detail)}</div>`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 7000);
}

async function readJsonResponse(resp, fallback) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch (_) {
    const title = (text.match(/<title[^>]*>([^<]+)/i)?.[1] || '').trim();
    const detail = [
      `HTTP ${resp.status || 'unknown'}`,
      title ? `title "${title}"` : '',
    ].filter(Boolean).join(', ');
    throw new Error(`${fallback || 'DeckPro'} got a web page instead of app data (${detail}). Make sure the Google Doc is shared "Anyone with the link can view".`);
  }
}

// ─── PDF speaker notes ────────────────────────────────────────────────────────

let _pdfObjectUrl = null;
let _pdfZoom = 100;

// Speaker Notes are per-deck: each deck stores its own notes-doc URL in
// state.config.gdriveUrl. The panel is built once at boot, though, so on its own
// it would keep showing whatever deck was open at launch ("one notes doc for
// everything"). `_syncNotesPanelToDeck` (assigned inside attachPdfHandlers, which
// owns the loaders) reconciles the visible panel with the active deck; call it
// whenever the deck changes. `_loadedNotesUrl` tracks what the panel is currently
// showing so we skip a redundant re-fetch when it already matches — the sentinel
// ' local' marks a dropped local PDF (no URL, can't persist, clears on switch).
let _loadedNotesUrl = '';
let _syncNotesPanelToDeck = null;

// Reset the notes panel back to its empty drop-zone state (shared by the two
// clear buttons and by _syncNotesPanelToDeck when a deck has no notes). Does NOT
// touch state.config.gdriveUrl — callers decide whether to also clear that.
function clearNotesPanelView() {
  if (_pdfObjectUrl) { URL.revokeObjectURL(_pdfObjectUrl); _pdfObjectUrl = null; }
  const frame   = document.getElementById('pdf-frame');       if (frame)   frame.src = '';
  const docBody = document.getElementById('notes-doc-body');  if (docBody) docBody.innerHTML = '';
  const docView = document.getElementById('notes-doc-view');  if (docView) docView.style.display = 'none';
  const pdfView = document.getElementById('pdf-viewer');      if (pdfView) pdfView.style.display = 'none';
  const dropZ   = document.getElementById('pdf-drop-zone');   if (dropZ)   dropZ.style.display = 'flex';
  document.getElementById('notes-panel')?.classList.remove('pdf-open');
  const gi = document.getElementById('pdf-gdrive-input');     if (gi) gi.value = '';
  _notesDoc = null;
  _pdfZoom = 100;
  _loadedNotesUrl = '';
}

let _styleTab = 'text';      // Text | Layout | Motion | Preview
let _motionTab = 'transitions'; // within Motion: transitions | build
let _layoutSel = null;          // selected region slug in the Layout visual preview
let _textSel   = null;          // selected region slug in the Text visual preview

function attachPdfHandlers() {
  const zone      = document.getElementById('pdf-drop-zone');
  const fileIn    = document.getElementById('pdf-file-input');
  const browseBtn = document.getElementById('btn-pdf-browse');
  const clearBtn  = document.getElementById('btn-pdf-clear');
  if (!zone) return;

  function applyZoom() {
    const frame = document.getElementById('pdf-frame');
    const wrap  = document.getElementById('pdf-frame-wrap');
    if (!frame || !wrap) return;
    const scale = _pdfZoom / 100;
    // Scale the iframe content by transforming it within the wrapper
    frame.style.width       = `${100 / scale}%`;
    frame.style.height      = `${100 / scale}%`;
    frame.style.transform   = `scale(${scale})`;
    frame.style.transformOrigin = 'top left';
    document.getElementById('pdf-zoom-val').textContent = `${_pdfZoom}%`;
  }

  function loadPdf(file) {
    if (!file || file.type !== 'application/pdf') {
      toast('error', 'Not a PDF', 'Drop a .pdf file'); return;
    }
    if (_pdfObjectUrl) URL.revokeObjectURL(_pdfObjectUrl);
    _pdfObjectUrl = URL.createObjectURL(file);
    _pdfZoom = 100;
    document.getElementById('pdf-frame').src = _pdfObjectUrl;
    document.getElementById('pdf-viewer-name').textContent = file.name;
    document.getElementById('pdf-drop-zone').style.display = 'none';
    document.getElementById('pdf-viewer').style.display    = 'flex';
    document.getElementById('notes-panel')?.classList.add('pdf-open');
    applyZoom();
    _loadedNotesUrl = ' local';  // dropped file — not persisted; clears on deck switch
  }

  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    loadPdf(e.dataTransfer.files[0]);
  });

  browseBtn?.addEventListener('click', () => fileIn?.click());
  fileIn?.addEventListener('change', e => loadPdf(e.target.files[0]));

  async function loadGdrivePdf(url) {
    if (!url) return;
    const loadBtn = document.getElementById('btn-pdf-gdrive-load');
    const orig = loadBtn.textContent;
    loadBtn.textContent = 'Loading…';
    loadBtn.disabled = true;
    try {
      const proxyUrl = `/api/gdrive-pdf?url=${encodeURIComponent(url)}`;
      const resp = await fetch(proxyUrl);
      if (!resp.ok) {
        const err = await readJsonResponse(resp, 'Drive load failed').catch(e => ({ error: e.message || resp.statusText }));
        toast('error', 'Drive load failed', err.error || resp.statusText);
        return;
      }
      const blob = await resp.blob();
      if (_pdfObjectUrl) URL.revokeObjectURL(_pdfObjectUrl);
      _pdfObjectUrl = URL.createObjectURL(blob);
      _pdfZoom = 100;
      document.getElementById('pdf-frame').src = _pdfObjectUrl;
      document.getElementById('pdf-viewer-name').textContent = 'Google Drive';
      document.getElementById('pdf-drop-zone').style.display = 'none';
      document.getElementById('pdf-viewer').style.display    = 'flex';
      document.getElementById('notes-panel')?.classList.add('pdf-open');
      applyZoom();
      // Persist the Drive URL so it survives a reload / redeploy
      state.config.gdriveUrl = url;
      _loadedNotesUrl = url;
      saveState();
    } catch (e) {
      toast('error', 'Drive load failed', e.message);
    } finally {
      loadBtn.textContent = orig;
      loadBtn.disabled = false;
    }
  }

  // Google Docs → rich HTML (Smart Notes); other Drive files → PDF viewer.
  async function loadGdriveNotes(url) {
    if (!url) return;
    const isDoc = /\/document\/d\//.test(url);
    if (!isDoc) return loadGdrivePdf(url);

    const loadBtn = document.getElementById('btn-pdf-gdrive-load');
    const orig = loadBtn ? loadBtn.textContent : '';
    if (loadBtn) { loadBtn.textContent = 'Loading…'; loadBtn.disabled = true; }
    try {
      const resp = await fetch(`/api/gdrive-html?url=${encodeURIComponent(url)}`);
      const data = await readJsonResponse(resp, 'Doc load failed');
      if (!resp.ok || !data.ok) { toast('error', 'Doc load failed', data.error || resp.statusText || 'Unknown error'); return; }
      const processed = processNotesHtml(data.html, data.id);
      showNotesDoc(processed, 'Google Doc');
      state.config.gdriveUrl = url;
      _loadedNotesUrl = url;
      saveState();
    } catch (e) {
      toast('error', 'Doc load failed', e.message);
    } finally {
      if (loadBtn) { loadBtn.textContent = orig; loadBtn.disabled = false; }
    }
  }

  const gdriveInput = document.getElementById('pdf-gdrive-input');
  document.getElementById('btn-pdf-gdrive-load')?.addEventListener('click', () => {
    loadGdriveNotes(gdriveInput?.value.trim());
  });
  gdriveInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') loadGdriveNotes(gdriveInput.value.trim());
  });
  // Reconcile the panel with whatever deck is active — restores this deck's own
  // saved Drive doc (or clears the panel if it has none). Assigned here because
  // the loaders (loadGdriveNotes) are closures scoped to attachPdfHandlers;
  // loadDeckState()/newDeck() call it on every deck change.
  _syncNotesPanelToDeck = function () {
    const url = state.config.gdriveUrl || '';
    if (url === _loadedNotesUrl) return;  // already showing the right doc
    if (url) {
      if (gdriveInput) gdriveInput.value = url;
      loadGdriveNotes(url);               // sets _loadedNotesUrl on success
    } else {
      clearNotesPanelView();              // this deck has no notes doc
    }
  };
  // Restore the current deck's doc on boot.
  _syncNotesPanelToDeck();

  attachNotesDocHandlers();

  document.getElementById('btn-pdf-zoom-in')?.addEventListener('click', () => {
    _pdfZoom = Math.min(_pdfZoom + 25, 200); applyZoom();
  });
  document.getElementById('btn-pdf-zoom-out')?.addEventListener('click', () => {
    _pdfZoom = Math.max(_pdfZoom - 25, 50); applyZoom();
  });

  clearBtn?.addEventListener('click', () => {
    clearNotesPanelView();
    if (fileIn) fileIn.value = '';
    // Forget the persisted Drive doc so it doesn't reload next launch
    state.config.gdriveUrl = '';
    saveState();
  });
}

// ════════════════════════════════════════════════════════════════════════════
// Smart Notes — rich-document intake (Phase 1)
// Google Docs load as structured HTML rendered in DeckPro's own DOM, so we can
// scan, suggest, drag, and link. PDFs stay on the iframe viewer (display only).
// Deterministic — no LLM. The app suggests; nothing touches the deck until you
// click Add.
// ════════════════════════════════════════════════════════════════════════════

let _notesDoc  = null;   // { id, title, blocks:[{tag,text,bg,idx}], colors:[], suggestions:[] }
let _notesZoom = 100;
let _selectedPointKeys = new Set(); // point suggestion keys checked for grouping into one revealing slide

// Flat book name list for Smart Notes scripture detection (apocrypha included).
// Order longest-first so "Song of Solomon" wins over "Song".
const SCRIPTURE_BOOK_NAMES = [
  'Song of Solomon','Song of Songs','Ecclesiasticus',
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  'Samuel','Kings','Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Psalm',
  'Proverbs','Ecclesiastes','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel',
  'Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah',
  'Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans',
  'Corinthians','Galatians','Ephesians','Philippians','Colossians','Thessalonians',
  'Timothy','Titus','Philemon','Hebrews','James','Peter','Jude','Revelation',
  'Tobit','Judith','Wisdom','Sirach','Baruch','Maccabees',
];

function scriptureRegex() {
  const numPrefix = '(?:[1-3]|First|Second|Third|I{1,3})\\s+';
  const books = SCRIPTURE_BOOK_NAMES.map(b => b.replace(/ /g, '\\s+')).join('|');
  // optional numbered prefix · book · chapter · optional :verse(-verse)(,verse…)
  return new RegExp(
    `\\b(?:${numPrefix})?(?:${books})\\.?\\s+\\d+(?::\\d+(?:[\\u2013\\u2014-]\\d+)?(?:\\s*,\\s*\\d+(?:[\\u2013\\u2014-]\\d+)?)*)?\\b`,
    'gi'
  );
}

const _normRef   = r => (r || '').toLowerCase().replace(/\s+/g, '').replace(/[.,;]/g, '');
const _normLabel = t => (t || '').toLowerCase().replace(/\s+/g, ' ').trim();

// ── Verse-range detection (Smart Notes) ─────────────────────────────────────
// Splits a reference like "Galatians 5:22-23" into { bookPart: "Galatians ",
// chapter: "5", verses: Set{22,23} }. Whole-chapter refs with no verse part
// ("Luke 15") return null — nothing to compare against.
function parseVerseRangeInfo(ref) {
  const m = (ref || '').match(/^(.*?)(\d+):(\d+(?:[–—-]\d+)?(?:\s*,\s*\d+(?:[–—-]\d+)?)*)$/);
  if (!m) return null;
  const [, bookPart, chapter, versePart] = m;
  const verses = new Set();
  versePart.split(',').forEach(part => {
    const rm = part.trim().match(/^(\d+)(?:[–—-](\d+))?$/);
    if (!rm) return;
    const start = +rm[1], end = rm[2] ? +rm[2] : start;
    for (let v = start; v <= end && v - start < 200; v++) verses.add(v);
  });
  return verses.size ? { bookPart, chapter, verses } : null;
}

// Collapses a verse-number set back into a compact range string: {22,23} → "22-23".
function formatVerseRange(versesSet) {
  const sorted = [...versesSet].sort((a, b) => a - b);
  if (!sorted.length) return '';
  const parts = [];
  let start = sorted[0], prev = sorted[0];
  for (let idx = 1; idx <= sorted.length; idx++) {
    const v = sorted[idx];
    if (v === prev + 1) { prev = v; continue; }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    if (idx < sorted.length) { start = prev = v; }
  }
  return parts.join(',');
}

// Best-effort scan for verse-number markers surviving in plain-text-extracted
// notes (superscript formatting is lost by the time we see .textContent) — a
// short number preceded by start-of-text/whitespace/comma and followed by
// whitespace, same shape as a real verse number sitting inline in prose.
function extractVerseMarkers(text) {
  const verses = new Set();
  const re = /(?:^|[\s,])(\d{1,3})(?=\s)/g;
  let m;
  while ((m = re.exec(text || '')) !== null) verses.add(parseInt(m[1], 10));
  return verses;
}

function scriptureExists(ref) {
  const n = _normRef(ref);
  return state.slides.some(s => s.type === 'scripture' && _normRef(s.reference) === n);
}
function pointExists(text) {
  const n = _normLabel(text);
  return state.slides.some(s => s.type === 'point' &&
    (_normLabel(s.label) === n || _normLabel(s.bodyText) === n));
}
function responseCardHasContent() {
  const r = state.config.responses || {};
  return !!(r.r1?.trim() || r.r2?.trim() || r.r3?.trim());
}

function _isHighlight(c) {
  if (!c) return false;
  if (c === 'transparent') return false;
  // any fully-transparent rgba is not a highlight
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(',').map(x => x.trim());
    if (parts.length === 4 && parseFloat(parts[3]) === 0) return false;
    // near-white backgrounds aren't highlights
    const [r, g, b] = parts.map(Number);
    if (r >= 250 && g >= 250 && b >= 250) return false;
  }
  return true;
}

// Prefix every selector in the doc's own CSS so it can't leak into the app UI.
function scopeNotesCss(css, scope) {
  if (!css) return '';
  return css.replace(/(^|\})\s*([^@{}]+?)\s*\{/g, (full, brace, sel) => {
    const scoped = sel.split(',').map(s => `${scope} ${s.trim()}`).join(', ');
    return `${brace} ${scoped} {`;
  });
}

function processNotesHtml(html, id) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,meta,link,title,base').forEach(n => n.remove());
  let styleText = '';
  doc.querySelectorAll('style').forEach(s => { styleText += s.textContent + '\n'; s.remove(); });
  const bodyHtml = doc.body ? doc.body.innerHTML : html;
  return { id, styleText, bodyHtml };
}

function showNotesDoc({ id, styleText, bodyHtml }, title) {
  let styleEl = document.getElementById('notes-doc-style');
  if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'notes-doc-style'; document.head.appendChild(styleEl); }
  styleEl.textContent = scopeNotesCss(styleText, '#notes-doc-body');

  const bodyEl = document.getElementById('notes-doc-body');
  bodyEl.innerHTML = bodyHtml;
  bodyEl.querySelectorAll('a').forEach(a => { a.removeAttribute('href'); a.style.cursor = 'text'; });

  document.getElementById('notes-doc-name').textContent = title || 'Google Doc';
  document.getElementById('pdf-drop-zone').style.display = 'none';
  document.getElementById('pdf-viewer').style.display    = 'none';
  document.getElementById('notes-doc-view').style.display = 'flex';
  document.getElementById('notes-panel')?.classList.add('pdf-open');

  _notesDoc = { id, title, blocks: [], colors: [], suggestions: [] };
  extractNotesBlocks();
  applyNotesZoom();
  refreshNotesMode();
}

// Common filler words excluded from bold/decision-line word-matching. These
// are near-guaranteed to appear MANY times throughout any notes doc and any
// fetched Bible verse — matching bold status by flat per-word set membership
// (see applyNotesBoldToSpans below) means a stop-word bolded ANYWHERE in the
// tracked notes text would falsely mark EVERY occurrence of that word bold
// in an unrelated verse (e.g. "you"/"is"/"me" bolding throughout a verse
// where nothing was actually bolded in the source doc).
const NOTES_STOP_WORDS = new Set(['i','a','an','the','to','of','in','on','at','is','are','was','were',
  'and','or','but','with','for','my','me','you','your','it','this','that','be','have','has','had']);

// Contiguous bold RUNS within a notes block, as phrases (not individual
// words) — reapplication (applyNotesBoldToSpans) requires the whole phrase
// to appear as a run of consecutive words in the fetched text, so a common
// word bolded once doesn't bold every unrelated occurrence of that word
// elsewhere in the verse (the old word-set approach's failure mode: "you"
// bolded once would bold every "you" in the fetched text). A phrase that's
// just a single stop word ("you", "is", "me"...) is dropped entirely, since
// on its own it can't be told apart from any other occurrence of that word.
// Checks COMPUTED font-weight while walking the tree (same approach as
// extractHighlightedText below) rather than matching <b>/<strong> tags —
// Google Docs' actual HTML export represents bold as inline
// `style="font-weight:700"` on a <span>, not a semantic tag, so a tag-name
// selector silently finds nothing for the most common real-world source.
function _isBoldWeight(computedFontWeight) {
  if (computedFontWeight === 'bold' || computedFontWeight === 'bolder') return true;
  const n = parseInt(computedFontWeight, 10);
  return !isNaN(n) && n >= 600;
}
function extractBoldPhrases(el) {
  const phrases = [];
  let buf = '';
  const flush = () => {
    const t = buf.replace(/\s+/g, ' ').trim();
    buf = '';
    if (!t) return;
    const words = t.toLowerCase().split(' ').filter(Boolean);
    if (words.length === 1 && NOTES_STOP_WORDS.has(words[0].replace(/[^\w']/g, ''))) return;
    phrases.push(t);
  };
  const walk = (node, inBold) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (inBold) buf += node.textContent; else flush();
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const bold = inBold || _isBoldWeight(getComputedStyle(node).fontWeight);
    node.childNodes.forEach(child => walk(child, bold));
  };
  el.childNodes.forEach(child => walk(child, _isBoldWeight(getComputedStyle(el).fontWeight)));
  flush();
  return phrases;
}

// Text that's actually highlighted within a block — a block's own background
// counts (whole line highlighted), or descendant spans (a phrase highlighted
// inside an otherwise plain line, e.g. just "JOY!" inside a longer sentence).
// Falls back to '' when nothing in the block is highlighted at all.
function extractHighlightedText(el) {
  const bits = [];
  const startHighlighted = _isHighlight(getComputedStyle(el).backgroundColor);
  const walk = (node, inHighlight) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (inHighlight) bits.push(node.textContent);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const highlighted = inHighlight || _isHighlight(getComputedStyle(node).backgroundColor);
    node.childNodes.forEach(child => walk(child, highlighted));
  };
  el.childNodes.forEach(child => walk(child, startHighlighted));
  return bits.join('').replace(/\s+/g, ' ').trim();
}

function extractNotesBlocks() {
  const bodyEl = document.getElementById('notes-doc-body');
  if (!bodyEl) return;
  const blocks = [];
  const colorSet = new Set();
  bodyEl.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li').forEach(el => {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    let bg = '';
    const own = getComputedStyle(el).backgroundColor;
    if (_isHighlight(own)) { bg = own; }
    el.querySelectorAll('*').forEach(s => {
      const c = getComputedStyle(s).backgroundColor;
      if (_isHighlight(c)) { bg = c; }
    });
    if (bg) colorSet.add(bg);
    const idx = blocks.length;
    blocks.push({ tag: el.tagName.toLowerCase(), text, bg, idx, boldPhrases: extractBoldPhrases(el), highlightedText: extractHighlightedText(el) });
    el.dataset.notesBlock = idx;
    // Whole-block drag: click-drag the block itself, no text selection first
    // (that's the OTHER drag source, initNotesFieldDragDrop's selection-based
    // one, still available for dragging part of a block). stopPropagation
    // keeps docBody's own dragstart from also firing and, finding no active
    // selection, clobbering the payload this sets.
    el.draggable = true;
    el.addEventListener('dragstart', e => {
      e.stopPropagation();
      _draggedNotesText = { plain: el.textContent, html: boldWalkToHtml([...el.childNodes], _isBoldWeight(getComputedStyle(el).fontWeight)) };
      _draggedNotesBlockIdx = idx;
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', el.textContent);
    });
    el.addEventListener('dragend', () => { _draggedNotesText = null; _draggedNotesBlockIdx = null; });
  });
  _notesDoc.blocks  = blocks;
  _notesDoc.colors  = [...colorSet];
}

// Resolve a block's role from the Style Map: highlight color wins over heading
// level; anything unmapped falls through to 'auto' (built-in behavior).
function resolveBlockRole(b) {
  const map = state.config.notesStyleMap || {};
  if (b.bg && map[b.bg] && map[b.bg] !== 'auto') return map[b.bg];
  if (/^h[1-6]$/.test(b.tag) && map[b.tag] && map[b.tag] !== 'auto') return map[b.tag];
  return 'auto';
}

// Gather consecutive <li> OR <p> blocks following block i (a heading's list
// of options). Plain paragraphs count too, not just real <li> list items —
// pastors very often just type "1. ..." / "- ..." as ordinary paragraph
// lines rather than using the doc editor's actual bullet-list formatting, and
// requiring <li> silently found nothing for that (extremely common) case.
// Stops at the next heading, at a bullet explicitly mapped to a non-auto
// role, or at one carrying its own highlight differing from the triggering
// block's — all three signal the author intentionally split it off.
function collectBullets(blocks, i) {
  const trigger = blocks[i];
  const bullets = [];
  let j = i + 1, consumed = 0;
  while (j < blocks.length && (blocks[j].tag === 'li' || blocks[j].tag === 'p')) {
    const blk = blocks[j];
    if (resolveBlockRole(blk) !== 'auto') break;
    if (blk.bg && blk.bg !== trigger.bg) break;
    bullets.push(blk.text); j++; consumed++;
  }
  return { bullets, consumed };
}

function buildNotesSuggestions() {
  if (!_notesDoc) return [];
  const rx = scriptureRegex();
  const ignored = new Set(state.config.notesIgnored || []);
  const blocks  = _notesDoc.blocks;
  const out  = [];
  const seen = new Set();
  const push = (s) => {
    if (seen.has(s.key)) return out.find(x => x.key === s.key) || null;
    if (ignored.has(s.key)) return null;
    seen.add(s.key); out.push(s); return s;
  };

  // Tracks the verse text (as found in the notes) belonging to the active
  // scripture suggestion, so it can be compared against the claimed reference
  // range once the chain ends. A single verse has nothing to compare against,
  // so only ranges of 2+ verses ever get flagged.
  let scriptureChainSuggestion = null;
  let scriptureChainText = '';
  let scriptureChainBoldPhrases = new Set();
  const finalizeScriptureChain = () => {
    if (scriptureChainSuggestion) {
      const info = parseVerseRangeInfo(scriptureChainSuggestion.ref);
      if (info && info.verses.size >= 2) {
        const found = extractVerseMarkers(scriptureChainText);
        const claimed = info.verses;
        const agree = found.size > 0 && [...claimed].every(v => found.has(v)) && [...found].every(v => claimed.has(v));
        if (found.size > 0 && !agree) {
          scriptureChainSuggestion.verseRangeWarning = {
            claimedLabel: formatVerseRange(claimed),
            foundLabel: formatVerseRange(found),
            trimmedRef: info.bookPart + info.chapter + ':' + formatVerseRange(found),
          };
        }
      }
      // Words the author bolded in the notes get carried onto the suggestion so
      // Add can re-apply them as ALT emphasis on the Bible-API-fetched body text.
      if (scriptureChainBoldPhrases.size) {
        scriptureChainSuggestion.notesBoldPhrases = scriptureChainBoldPhrases;
      }
    }
    scriptureChainSuggestion = null;
    scriptureChainText = '';
    scriptureChainBoldPhrases = new Set();
  };
  const startScriptureChain = (suggestion, seedText, seedBoldPhrases) => {
    finalizeScriptureChain();
    scriptureChainSuggestion = suggestion;
    scriptureChainText = seedText || '';
    scriptureChainBoldPhrases = new Set(seedBoldPhrases || []);
  };
  const continueScriptureChain = (text, boldPhrases) => {
    scriptureChainText += ' ' + text;
    (boldPhrases || []).forEach(p => scriptureChainBoldPhrases.add(p));
  };

  const makePoint = (b, conf) => {
    // Skip past any trailing detail bullets so they don't also surface as
    // their own low-quality suggestions — but don't use them as this point's
    // content. Grouping several points into one revealing slide is now a
    // manual, explicit action (select checkboxes → Group into Revealing).
    const grp = collectBullets(blocks, b._i);
    // Prefer just the highlighted phrase over the whole block — a block can be
    // a long bold sentence with only a short phrase actually highlighted
    // (e.g. "...second FRUIT of the Spirit: JOY!" where only "JOY!" is lit up).
    const text = b.highlightedText || b.text;
    push({ type: 'point', mode: 'single', title: text, text, preview: text, blockIdx: b.idx,
           confidence: conf, key: 'pt:' + _normLabel(text), dupe: pointExists(text) });
    return grp.consumed;
  };

  // "I have decided to follow Jesus today!" (or whatever this deck's decisionText
  // is) is boilerplate, not a weekly response option — score how closely a line
  // PARAPHRASES it and drop the closest match, so a decision line mixed in with
  // real options doesn't crowd one out. Common short words ("i", "to", "a") are
  // excluded from the comparison and don't count as a match on their own —
  // otherwise an unrelated option like "I want to start a relationship with
  // Jesus" shares just enough filler words with "I have decided to follow
  // Jesus today" to look like a paraphrase and gets wrongly dropped. The score
  // is the fraction of the CANDIDATE's own significant words found in the
  // phrase, so a true close paraphrase (which reuses most of the phrase's
  // wording) scores high while a merely-related option scores low.
  const decisionWordOverlap = (text, phrase) => {
    const words = s => (s || '').toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
      .filter(w => w && !NOTES_STOP_WORDS.has(w));
    const phraseWords = new Set(words(phrase));
    const textWords = words(text);
    if (!textWords.length) return 0;
    const matched = textWords.filter(w => phraseWords.has(w)).length;
    return matched / textWords.length;
  };
  const DECISION_PARAPHRASE_THRESHOLD = 0.6; // fraction of significant words that must match

  const makeResponse = (b, conf) => {
    const grp = collectBullets(blocks, b._i);
    const raw = grp.bullets.length ? grp.bullets : [b.text];
    const decisionPhrase = state.config.responses?.decisionText || 'I have decided to follow Jesus today!';
    // Whichever single line matches the decision text the most closely is the
    // decision text — pastors often write their own close paraphrase of it
    // rather than the exact string. Drop just that one line and keep the rest
    // in their original order.
    // Only ever drop the decision line when there's more than one candidate —
    // otherwise a single fallback line (e.g. no real bullets were found, so
    // the trigger block's own text stood in) could share one incidental word
    // with the decision phrase and get filtered down to nothing, silently
    // turning "Add" into a no-op instead of filling anything in.
    let pool = raw;
    if (raw.length > 1) {
      const scored = raw.map((t, i) => ({ t, i, overlap: decisionWordOverlap(t, decisionPhrase) }));
      const top = scored.reduce((a, c) => (c.overlap > a.overlap ? c : a), scored[0]);
      if (top && top.overlap >= DECISION_PARAPHRASE_THRESHOLD) pool = raw.filter((_, i) => i !== top.i);
    }
    const bullets = pool.slice(0, 3);
    push({ type: 'response', bullets, preview: bullets.join(' • '), blockIdx: b.idx,
           confidence: conf, key: 'rc:' + _normLabel(bullets.join('|')),
           dupe: responseCardHasContent() });
    return grp.consumed;
  };

  // True if this trigger block (or one of its following bullets) closely
  // paraphrases the response-card decision line — the strongest available
  // signal that a block with no explicit 'response' color mapping ('content'
  // or 'auto') is actually response-card intro text, not an ordinary point,
  // so it should route to makeResponse() (one suggestion filling all the
  // options) instead of makePoint() (which would use just the intro line's
  // own text as a single point, discarding the actual options).
  const looksLikeResponseTrigger = (b) => {
    const decisionPhrase = state.config.responses?.decisionText || 'I have decided to follow Jesus today!';
    const grp = collectBullets(blocks, b._i);
    const candidates = [b.text, ...grp.bullets];
    return candidates.some(t => decisionWordOverlap(t, decisionPhrase) >= DECISION_PARAPHRASE_THRESHOLD);
  };

  const pushScripturesFromBlock = (b, conf) => {
    rx.lastIndex = 0;
    let found = false;
    let m;
    let last = null;
    while ((m = rx.exec(b.text)) !== null) {
      found = true;
      const ref = m[0].replace(/[.,;:]+$/, '').trim();
      last = push({ type: 'scripture', ref, preview: ref, blockIdx: b.idx, confidence: conf, key: 'scr:' + _normRef(ref), dupe: scriptureExists(ref) });
    }
    if (last) startScriptureChain(last, b.text, b.boldPhrases);
    return found;
  };

  const firstScriptureRef = (text) => {
    rx.lastIndex = 0;
    const m = rx.exec(text || '');
    return m ? m[0].replace(/[.,;:]+$/, '').trim() : '';
  };

  const nearbyUnhighlightedRef = (i) => {
    if (state.config.notesUseNearbyRefs === false) return '';
    if (i === 0) return '';
    const prev = blocks[i - 1];
    const prevRole = resolveBlockRole(prev);
    if (['ignore', 'point', 'confidence', 'response'].includes(prevRole)) return '';
    if (prev.bg) return ''; // must be unhighlighted, per the feature's design
    const ref = firstScriptureRef(prev.text);
    if (!ref) return '';
    // Require the block to be essentially JUST the reference — a prose line that
    // merely mentions a verse must not pair, or a highlighted point sitting near an
    // incidental scripture mention gets folded into a scripture suggestion instead
    // of surfacing as its own point.
    const remainder = prev.text.replace(ref, '').trim();
    if (remainder.length > 2) return '';
    return ref;
  };

  const sameSignal = (a, b) => a && b && a.bg && a.bg === b.bg && resolveBlockRole(a) === resolveBlockRole(b);
  let scriptureContinuation = null;

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]; b._i = i;
    const role = resolveBlockRole(b);
    if (role === 'ignore') { scriptureContinuation = null; finalizeScriptureChain(); continue; }

    if (role === 'scripture') {
      const m = b.text.match(rx);
      if (m) {
        const ref = m[0].replace(/[.,;:]+$/, '').trim();
        const pushed = push({ type: 'scripture', ref, preview: ref, blockIdx: b.idx, confidence: 'Mapped', key: 'scr:' + _normRef(ref), dupe: scriptureExists(ref) });
        scriptureContinuation = b;
        startScriptureChain(pushed, b.text, b.boldPhrases);
      } else if (sameSignal(scriptureContinuation, b)) {
        // Same highlight immediately after a highlighted reference is verse text,
        // not a separate (and fabricated) reference suggestion.
        scriptureContinuation = b;
        continueScriptureChain(b.text, b.boldPhrases);
      } else {
        // No reference found and not a continuation — skip rather than fabricate
        // a "reference" out of the whole block's text.
        scriptureContinuation = null;
        finalizeScriptureChain();
      }
      continue;
    }
    if (role === 'confidence') {
      scriptureContinuation = null;
      finalizeScriptureChain();
      push({ type: 'confidence', text: b.text, preview: b.text, blockIdx: b.idx, confidence: 'Mapped', key: 'cf:' + _normLabel(b.text), dupe: false });
      continue;
    }
    if (role === 'point') { scriptureContinuation = null; finalizeScriptureChain(); i += makePoint(b, 'Mapped'); continue; }
    if (role === 'response') { scriptureContinuation = null; finalizeScriptureChain(); i += makeResponse(b, 'Mapped'); continue; }
    if (role === 'content') {
      const hasScripture = pushScripturesFromBlock(b, 'Content');
      if (hasScripture) {
        scriptureContinuation = b;
        // pushScripturesFromBlock already started the chain via startScriptureChain
      } else {
        const ref = nearbyUnhighlightedRef(i);
        if (ref) {
          const pushed = push({ type: 'scripture', ref, preview: ref, blockIdx: b.idx, confidence: 'Content', key: 'scr:' + _normRef(ref), dupe: scriptureExists(ref) });
          scriptureContinuation = b;
          // b is the verse-text block itself (the ref lived in the unhighlighted
          // block above it), so seed the chain with b's own text.
          startScriptureChain(pushed, b.text, b.boldPhrases);
        } else if (sameSignal(scriptureContinuation, b)) {
          // Same highlight immediately after a highlighted reference is verse text,
          // not a separate point suggestion.
          scriptureContinuation = b;
          continueScriptureChain(b.text, b.boldPhrases);
        } else {
          scriptureContinuation = null;
          finalizeScriptureChain();
          i += looksLikeResponseTrigger(b) ? makeResponse(b, 'Content') : makePoint(b, 'Content');
        }
      }
      continue;
    }

    // role === 'auto' — built-in detection. Mirrors the 'scripture'/'content'
    // branches' own-ref-vs-continuation structure (check for a fresh
    // reference, then a same-highlight continuation, THEN give up and
    // finalize) — the old version unconditionally finalized before checking
    // continuation, so a highlighted multi-paragraph verse (reference in one
    // block, verse text with the actual bolded words in the next) never had
    // its later blocks' bold phrases carried onto the suggestion at all.
    if (pushScripturesFromBlock(b, 'High')) {
      scriptureContinuation = b;
    } else if (sameSignal(scriptureContinuation, b)) {
      scriptureContinuation = b;
      continueScriptureChain(b.text, b.boldPhrases);
    } else {
      scriptureContinuation = null;
      finalizeScriptureChain();
      if (looksLikeResponseTrigger(b)) {
        i += makeResponse(b, 'Medium');
      } else if (b.bg) {
        // Highlighted but not mapped to a specific role — the highlight
        // itself is a strong enough signal to treat it as a likely point,
        // regardless of heading tag or length (unlike the plain-text
        // heuristic below, which needs both since it has no highlight to
        // go on).
        i += makePoint(b, 'High');
      } else if (/^h[1-3]$/.test(b.tag) && b.text.length <= 80) {
        i += makePoint(b, 'Medium');
      }
    }
  }
  finalizeScriptureChain();
  _notesDoc.suggestions = out;
  return out;
}

function rescanNotes() {
  if ((state.config.notesMode || 'manual') === 'auto' && _notesDoc) buildNotesSuggestions();
  renderNotesTray();
}

// ── Mode (auto / manual) ──────────────────────────────────────────────────
function refreshNotesMode() {
  const mode = state.config.notesMode || 'manual';
  document.querySelectorAll('.notes-mode-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === mode));
  if (mode === 'auto' && _notesDoc) buildNotesSuggestions();
  renderNotesTray();
}

function renderNotesTray() {
  const body  = document.getElementById('notes-tray-body');
  const count = document.getElementById('notes-tray-count');
  const tray  = document.getElementById('notes-tray');
  if (!body || !tray) return;

  tray.classList.toggle('collapsed', state.config.notesTrayOpen === false);

  const mode = state.config.notesMode || 'manual';
  if (mode === 'manual') {
    if (count) count.textContent = '';
    body.innerHTML = `<p class="notes-tray-empty">Manual mode — select text in the notes above, then choose what to add.</p>`;
    return;
  }

  const sugs = (_notesDoc && _notesDoc.suggestions) || [];
  if (count) count.textContent = sugs.length ? String(sugs.length) : '';
  if (!sugs.length) {
    body.innerHTML = `<p class="notes-tray-empty">No suggestions found in this doc.</p>`;
    return;
  }
  // Selections only make sense for suggestions still on screen.
  const liveKeys = new Set(sugs.filter(s => s.type === 'point').map(s => s.key));
  [..._selectedPointKeys].forEach(k => { if (!liveKeys.has(k)) _selectedPointKeys.delete(k); });

  const chipLabel = t => t === 'scripture' ? 'Scripture' : t === 'confidence' ? 'Confidence' : t === 'response' ? 'Response' : 'Point';
  const dupeTitle = t => t === 'response' ? 'Response Card already has content' : 'A matching slide already exists';
  const groupBar = _selectedPointKeys.size >= 2 ? `
    <div class="sug-group-bar">
      <span>${_selectedPointKeys.size} points selected</span>
      <div class="sug-group-bar-acts">
        <button class="sug-btn sug-btn-orange" id="btn-group-points">Group into Revealing</button>
        <button class="sug-btn" id="btn-group-clear">Clear</button>
      </div>
    </div>` : '';
  body.innerHTML = groupBar + sugs.map(s => `
    <div class="sug-card" data-key="${esc(s.key)}" data-block="${s.blockIdx}">
      <div class="sug-top">
        ${s.type === 'point' ? `<input type="checkbox" class="sug-check" data-key="${esc(s.key)}" ${_selectedPointKeys.has(s.key) ? 'checked' : ''}>` : ''}
        <span class="sug-chip sug-${s.type}">${chipLabel(s.type)}</span>
        <span class="sug-conf">${s.confidence}</span>
        ${s.dupe ? `<span class="sug-dupe" title="${esc(dupeTitle(s.type))}">⚠ in deck</span>` : ''}
      </div>
      <div class="sug-preview">${esc(s.preview)}</div>
      ${s.verseRangeWarning ? `
        <div class="sug-verse-warn">
          <div class="sug-verse-warn-msg">⚠ Reference says v${esc(s.verseRangeWarning.claimedLabel)}, notes show v${esc(s.verseRangeWarning.foundLabel)}</div>
          <div class="sug-verse-warn-acts">
            <button class="sug-btn sug-verse-keep" data-key="${esc(s.key)}">Conform Scripture to Reference</button>
            <button class="sug-btn sug-verse-trim" data-key="${esc(s.key)}">Conform Reference to Notes</button>
          </div>
        </div>` : ''}
      <div class="sug-acts">
        <button class="sug-btn sug-add" data-key="${esc(s.key)}">Add</button>
        <button class="sug-btn sug-ignore" data-key="${esc(s.key)}">Ignore</button>
      </div>
    </div>`).join('');
}

function notesSuggestionByKey(key) {
  return (_notesDoc && _notesDoc.suggestions || []).find(s => s.key === key);
}

// ── Add wiring (reuses addSlide so shapes are always correct) ──────────────
function notesAddScripture(ref, boldPhrases = null) {
  addSlide('scripture');
  const slide = state.slides.find(s => s.id === state.activeId);
  if (!slide) return;
  slide.reference = ref;
  slide.label     = ref;
  slide.propName  = ref;
  saveState();
  render();
  lookupBibleVerse(slide, ref, '', boldPhrases); // async — fills bodies + toast on miss
  toast('success', 'Scripture added', ref);
}

function textToBullets(text) {
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(l => [{ text: l, bold: false }]);
}

function notesAddPoint(text, mode = 'single') {
  notesAddPointFrom({ text, title: text, mode, bullets: mode === 'revealing' ? text.split('\n') : [] });
}

// Create a point slide from a suggestion (or selection), honoring single/revealing.
function notesAddPointFrom(s) {
  addSlide('point');
  const slide = state.slides.find(x => x.id === state.activeId);
  if (!slide) return;
  slide.mode  = s.mode || 'single';
  slide.label = (s.title || s.text || 'Point').split('\n')[0].slice(0, 60);
  if (slide.mode === 'revealing' && s.bullets && s.bullets.length) {
    slide.title   = s.title || '';
    slide.bullets = s.bullets.map(t => [{ text: String(t).trim(), bold: false }]).filter(b => b[0].text);
    if (!slide.bullets.length) slide.bullets = [[]];
    slide.propBaseName = slide.label;
  } else {
    slide.bodyText = (s.text || s.title || '').replace(/\n+/g, ' ').trim();
  }
  saveState();
  render();
  toast('success', 'Point added', slide.label);
}

// Confidence-monitor note → a Blank slide carrying that text.
function notesAddConfidence(text) {
  addSlide('blank');
  const slide = state.slides.find(x => x.id === state.activeId);
  if (!slide) return;
  const clean = text.replace(/\n+/g, ' ').trim();
  slide.label = 'Confidence: ' + clean.slice(0, 40);
  slide.spans = [{ text: clean, bold: false }];
  saveState();
  render();
  toast('success', 'Confidence note added', '');
}

// Response Card suggestion → fills the weekly r1/r2/r3 options.
// decisionText is deliberately left alone — it's boilerplate, not weekly content.
function notesAddResponseCard(s) {
  const cfg = state.config;
  if (!cfg.responses) cfg.responses = { decisionText: '', r1: '', r2: '', r3: '' };
  const [r1, r2, r3] = s.bullets || [];
  if (r1) cfg.responses.r1 = r1;
  if (r2) cfg.responses.r2 = r2;
  if (r3) cfg.responses.r3 = r3;
  cfg.includeResponseCard = true; // filling it implies this week uses it
  saveState();
  render();
  toast('success', 'Response Card filled', [r1, r2, r3].filter(Boolean).join(' · '));
}

// Shared by the tray's Add button and dragging a notes block straight onto
// the sidebar — routes a suggestion to whichever notesAdd* fits its type,
// then marks it handled (removed from the tray) either way.
function applyNotesSuggestion(s) {
  if (!s) return;
  if (s.type === 'scripture')       notesAddScripture(s.ref, s.notesBoldPhrases);
  else if (s.type === 'confidence') notesAddConfidence(s.text);
  else if (s.type === 'response')   notesAddResponseCard(s);
  else                              notesAddPointFrom(s);
  notesIgnore(s.key);
}

// Finds the suggestion a dragged block belongs to — either its OWN trigger
// (an exact blockIdx match), or, for a continuation block with no
// suggestion of its own (verse text following its reference, a bullet
// following its heading), the nearest PRECEDING suggestion, since a chain
// continuation always comes after its trigger in document order.
function notesSuggestionForBlock(blockIdx) {
  if (!_notesDoc?.suggestions?.length) return null;
  const exact = _notesDoc.suggestions.find(s => s.blockIdx === blockIdx);
  if (exact) return exact;
  let best = null;
  for (const s of _notesDoc.suggestions) {
    if (s.blockIdx <= blockIdx && (!best || s.blockIdx > best.blockIdx)) best = s;
  }
  return best;
}

function notesIgnore(key) {
  if (!state.config.notesIgnored) state.config.notesIgnored = [];
  if (!state.config.notesIgnored.includes(key)) state.config.notesIgnored.push(key);
  if (_notesDoc) _notesDoc.suggestions = _notesDoc.suggestions.filter(s => s.key !== key);
  saveState();
  renderNotesTray();
}

function applyNotesZoom() {
  const body = document.getElementById('notes-doc-body');
  if (!body) return;
  body.style.fontSize = `${_notesZoom}%`;
}

// ── Style Map: map this doc's heading levels & highlight colors to roles ────
const NOTES_ROLES = ['auto', 'content', 'scripture', 'point', 'confidence', 'response', 'ignore'];
const NOTES_ROLE_LABELS = {
  auto: 'Auto',
  content: 'Content',
  scripture: 'Scripture',
  point: 'Point',
  confidence: 'Confidence',
  response: 'Response',
  ignore: 'Ignore',
};

function renderStyleMap() {
  const el = document.getElementById('notes-stylemap');
  if (!el || !_notesDoc) return;
  const map = state.config.notesStyleMap || {};
  const headingTags = [...new Set(_notesDoc.blocks.map(b => b.tag).filter(t => /^h[1-6]$/.test(t)))].sort();
  const colors = _notesDoc.colors || [];
  const roleSel = (sig) => `<select class="sm-role" data-sig="${esc(sig)}">
    ${NOTES_ROLES.map(r => `<option value="${r}" ${(map[sig] || 'auto') === r ? 'selected' : ''}>${NOTES_ROLE_LABELS[r]}</option>`).join('')}
  </select>`;
  const nearbyRefs = state.config.notesUseNearbyRefs !== false;
  el.innerHTML = `
    <div class="sm-hdr">Style Map</div>
    <div class="sm-sub">Map this doc's headings and highlight colors to slide types. Content forces a suggestion: Scripture if a reference is found, otherwise Point.</div>
    <label class="sm-check">
      <input type="checkbox" id="sm-nearby-refs" ${nearbyRefs ? 'checked' : ''}>
      <span><strong>Refs without highlight</strong><small>Pair highlighted Content with a nearby Bible ref above it.</small></span>
    </label>
    <div class="sm-sec">Headings</div>
    ${headingTags.length
      ? headingTags.map(t => `<div class="sm-row"><span class="sm-key">${t.toUpperCase()}</span>${roleSel(t)}</div>`).join('')
      : `<div class="sm-empty">No headings found in this doc</div>`}
    <div class="sm-sec">Highlight colors</div>
    ${colors.length
      ? colors.map(c => `<div class="sm-row"><span class="sm-swatch" style="background:${esc(c)}"></span><span class="sm-key sm-key-color">${esc(c)}</span>${roleSel(c)}</div>`).join('')
      : `<div class="sm-empty">No highlights found in this doc</div>`}`;
}

function toggleStyleMap(force) {
  const el = document.getElementById('notes-stylemap');
  if (!el) return;
  const show = force !== undefined ? force : el.style.display === 'none';
  if (show) { renderStyleMap(); el.style.display = 'block'; }
  else el.style.display = 'none';
}

// ── Manual select-to-assign ───────────────────────────────────────────────
function showNotesSelectionMenu() {
  const menu = document.getElementById('notes-sel-menu');
  if (!menu) return;
  const sel = window.getSelection();
  const text = sel ? sel.toString().trim() : '';
  const bodyEl = document.getElementById('notes-doc-body');
  // only react to selections inside the notes doc
  if (!text || !bodyEl || !sel.anchorNode || !bodyEl.contains(sel.anchorNode)) {
    menu.style.display = 'none';
    return;
  }
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  const panelRect = document.getElementById('notes-panel').getBoundingClientRect();
  menu.dataset.text = text;
  menu.style.display = 'flex';
  menu.style.top  = `${rect.bottom - panelRect.top + 6}px`;
  menu.style.left = `${Math.max(8, rect.left - panelRect.left)}px`;
  // default route hint: looks like a reference?
  const looksRef = scriptureRegex().test(text);
  menu.querySelector('[data-role="scripture"]').classList.toggle('preferred', looksRef);
  menu.querySelector('[data-role="point"]').classList.toggle('preferred', !looksRef && text.split('\n').length > 1);
}

function attachNotesDocHandlers() {
  // Mode toggle
  document.getElementById('notes-mode-toggle')?.addEventListener('click', e => {
    const btn = e.target.closest('.notes-mode-btn');
    if (!btn) return;
    state.config.notesMode = btn.dataset.mode;
    saveState();
    refreshNotesMode();
  });

  // Tray collapse
  document.getElementById('notes-tray-hdr')?.addEventListener('click', () => {
    state.config.notesTrayOpen = !(state.config.notesTrayOpen !== false);
    saveState();
    renderNotesTray();
  });

  // Tray drag-to-resize (vertical, same pattern as the sidebar/notes-panel's
  // horizontal resize — handle sits on the tray's top edge)
  const trayEl = document.getElementById('notes-tray');
  const trayHandle = document.getElementById('notes-tray-resize-handle');
  if (trayHandle && trayEl) {
    trayHandle.addEventListener('mousedown', e => {
      e.preventDefault();
      const startY = e.clientY;
      const startH = trayEl.offsetHeight;
      trayEl.style.maxHeight = 'none'; // dragging overrides the default 45% cap
      trayHandle.classList.add('dragging');
      const shield = document.createElement('div');
      shield.style.cssText = 'position:fixed;inset:0;z-index:99998;cursor:row-resize';
      document.body.appendChild(shield);
      const onMove = mv => {
        const newH = Math.max(120, Math.min(700, startH - (mv.clientY - startY)));
        trayEl.style.height = `${newH}px`;
      };
      const onUp = () => {
        trayHandle.classList.remove('dragging');
        shield.remove();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // Tray Add / Ignore / mode-toggle (delegated)
  document.getElementById('notes-tray-body')?.addEventListener('change', e => {
    const check = e.target.closest('.sug-check');
    if (!check) return;
    if (check.checked) _selectedPointKeys.add(check.dataset.key);
    else _selectedPointKeys.delete(check.dataset.key);
    renderNotesTray();
  });

  document.getElementById('notes-tray-body')?.addEventListener('click', e => {
    const addBtn      = e.target.closest('.sug-add');
    const igBtn       = e.target.closest('.sug-ignore');
    const verseKeepBtn = e.target.closest('.sug-verse-keep');
    const verseTrimBtn = e.target.closest('.sug-verse-trim');
    const groupBtn     = e.target.closest('#btn-group-points');
    const clearBtn     = e.target.closest('#btn-group-clear');
    if (groupBtn) {
      const selected = [..._selectedPointKeys]
        .map(k => notesSuggestionByKey(k))
        .filter(Boolean)
        .sort((a, b) => a.blockIdx - b.blockIdx);
      if (selected.length >= 2) {
        const bullets = selected.map(s => s.text);
        notesAddPointFrom({ mode: 'revealing', text: bullets[0], bullets });
        const keys = selected.map(s => s.key);
        _selectedPointKeys.clear();
        keys.forEach(k => notesIgnore(k)); // removes each from the tray, re-renders
      }
      return;
    }
    if (clearBtn) { _selectedPointKeys.clear(); renderNotesTray(); return; }
    if (verseKeepBtn) {
      // Conform Scripture to Reference — trust the claimed range as-is; Add
      // will fetch that full range from the Bible API like it always does.
      const s = notesSuggestionByKey(verseKeepBtn.dataset.key);
      if (s) { s.verseRangeWarning = null; renderNotesTray(); }
      return;
    }
    if (verseTrimBtn) {
      // Conform Reference to Notes — shrink the reference down to whatever
      // verses were actually found in the notes text.
      const s = notesSuggestionByKey(verseTrimBtn.dataset.key);
      if (s && s.verseRangeWarning) {
        s.ref = s.verseRangeWarning.trimmedRef;
        s.preview = s.ref;
        s.key = 'scr:' + _normRef(s.ref);
        s.dupe = scriptureExists(s.ref);
        s.verseRangeWarning = null;
        renderNotesTray();
      }
      return;
    }
    if (addBtn) {
      applyNotesSuggestion(notesSuggestionByKey(addBtn.dataset.key));
    } else if (igBtn) {
      notesIgnore(igBtn.dataset.key);
    }
  });

  // Zoom
  document.getElementById('btn-notes-zoom-in')?.addEventListener('click',  () => { _notesZoom = Math.min(_notesZoom + 10, 200); applyNotesZoom(); });
  document.getElementById('btn-notes-zoom-out')?.addEventListener('click', () => { _notesZoom = Math.max(_notesZoom - 10, 60);  applyNotesZoom(); });

  // Style Map
  document.getElementById('btn-notes-stylemap')?.addEventListener('click', e => { e.stopPropagation(); toggleStyleMap(); });
  document.getElementById('notes-stylemap')?.addEventListener('change', e => {
    const nearbyRefs = e.target.closest('#sm-nearby-refs');
    if (nearbyRefs) {
      state.config.notesUseNearbyRefs = nearbyRefs.checked;
      saveState();
      rescanNotes();
      return;
    }
    const sel = e.target.closest('.sm-role');
    if (!sel) return;
    if (!state.config.notesStyleMap) state.config.notesStyleMap = {};
    const v = sel.value;
    if (v === 'auto') delete state.config.notesStyleMap[sel.dataset.sig];
    else state.config.notesStyleMap[sel.dataset.sig] = v;
    saveState();
    rescanNotes();
  });
  document.addEventListener('mousedown', e => {
    const el = document.getElementById('notes-stylemap');
    if (el && el.style.display !== 'none' &&
        !el.contains(e.target) && e.target.id !== 'btn-notes-stylemap') {
      el.style.display = 'none';
    }
  });

  // Remove doc
  document.getElementById('btn-notes-doc-clear')?.addEventListener('click', () => {
    clearNotesPanelView();
    state.config.gdriveUrl = '';
    saveState();
  });

  // Manual selection menu
  const docBody = document.getElementById('notes-doc-body');
  docBody?.addEventListener('mouseup', () => {
    if ((state.config.notesMode || 'manual') === 'manual') setTimeout(showNotesSelectionMenu, 0);
  });
  // Dismiss the selection menu when clicking away from it
  document.addEventListener('mousedown', e => {
    const menu = document.getElementById('notes-sel-menu');
    if (menu && menu.style.display !== 'none' && !menu.contains(e.target)) menu.style.display = 'none';
  });
  document.getElementById('notes-sel-menu')?.addEventListener('click', e => {
    const opt = e.target.closest('[data-role]');
    if (!opt) return;
    const menu = document.getElementById('notes-sel-menu');
    const text = menu.dataset.text || '';
    menu.style.display = 'none';
    if (!text) return;
    if (opt.dataset.role === 'scripture') {
      const m = text.match(scriptureRegex());
      notesAddScripture(m ? m[0] : text);
    } else if (opt.dataset.role === 'point') {
      notesAddPoint(text, text.split('\n').length > 1 ? 'revealing' : 'single');
    } else if (opt.dataset.role === 'confidence') {
      const slide = state.slides.find(s => s.id === state.activeId);
      if (slide && 'blankSpans' in slide) {
        slide.blankBefore = true;
        slide.blankSpans  = [{ text: text.replace(/\n+/g, ' ').trim(), bold: false }];
        saveState(); renderMain();
        toast('success', 'Set as Confidence Monitor', slide.label || '');
      } else {
        toast('error', 'Select a slide first', 'Confidence text attaches to the current scripture/point slide');
      }
    } else if (opt.dataset.role === 'response') {
      const bullets = text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3);
      notesAddResponseCard({ bullets });
    }
    window.getSelection()?.removeAllRanges();
  });
}

// ─── Generate overview modal ──────────────────────────────────────────────────

// ─── Generation history ───────────────────────────────────────────────────────

function loadGenHistory() {
  try { return JSON.parse(localStorage.getItem(GEN_HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveGenHistory(h) {
  try { localStorage.setItem(GEN_HISTORY_KEY, JSON.stringify(h)); } catch (_) {}
}
function addGenHistoryEntry(data) {
  if (!data.presentationPath) return;
  const h = loadGenHistory();
  h.unshift({
    id: Date.now(),
    fileName: data.presentationPath.split('/').pop(),
    path: data.presentationPath,
    propsPath: data.props?.[0]?.path || null,
    propsBackup: data.propsBackup || null,
    sizeKB: data.presentationBytes ? Math.round(data.presentationBytes / 1024) : null,
    delivered: !!data.delivered,
    date: new Date().toISOString(),
  });
  saveGenHistory(h.slice(0, GEN_HISTORY_MAX));
  renderGenHistory();
  // Record in the library db, linked to the open deck
  libApi('/api/history', { method: 'POST', body: {
    deckId:    state.currentDeckId || '',
    fileName:  data.presentationPath.split('/').pop(),
    path:      data.presentationPath,
    sizeKB:    data.presentationBytes ? Math.round(data.presentationBytes / 1024) : 0,
    delivered: !!data.delivered,
  } }).then(r => {
    if (r.ok && state.currentDeckId) {
      const row = _libCache.find(d => d.id === state.currentDeckId);
      if (row) {
        row.dirty = 0;
        row.last_generated_at = new Date().toISOString();
        row.last_export_path  = data.presentationPath;
        if (data.delivered) row.last_delivered_at = row.last_generated_at;
      }
    }
  });
}

function renderGenHistory() {
  const panel = document.getElementById('gen-history-panel');
  if (!panel) return;
  const h = loadGenHistory();
  if (!h.length) {
    panel.innerHTML = `<div class="gen-history-empty">No exports yet</div>`;
    return;
  }
  const fmt = iso => {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  panel.innerHTML = `
    <div class="gen-history-header">
      <span>Recent Exports</span>
      <button class="gen-history-clear" id="gen-history-clear">Clear</button>
    </div>
    ${h.map(e => `
      <div class="gen-history-item" data-path="${esc(e.path)}">
        <div class="ghi-icon">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4 4h8l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M12 4v4h4" stroke="currentColor" stroke-width="1.4"/></svg>
        </div>
        <div class="ghi-info">
          <div class="ghi-name" title="${esc(e.path)}">${esc(e.fileName)}</div>
          <div class="ghi-meta">${e.delivered ? '⬆ Exported · ' : ''}${e.sizeKB ? e.sizeKB + ' KB · ' : ''}${fmt(e.date)}${e.propsBackup ? ' · 🛟 backup' : ''}</div>
        </div>
        ${e.propsBackup ? `<button class="ghi-restore" data-backup="${esc(e.propsBackup)}" title="Restore Pro7's props config to the state before this export">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M4 10a6 6 0 1 1 1.8 4.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 6v4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>` : ''}
        <button class="ghi-reveal" data-path="${esc(e.path)}" title="Reveal in Finder">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `).join('')}
  `;
  document.getElementById('gen-history-clear')?.addEventListener('click', e => {
    e.stopPropagation();
    saveGenHistory([]);
    renderGenHistory();
  });
  panel.querySelectorAll('.ghi-reveal').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      fetch('/api/reveal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: btn.dataset.path }) });
    });
  });
  panel.querySelectorAll('.ghi-restore').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      restorePro7Backup(btn.dataset.backup);
    });
  });
}

async function restorePro7Backup(backupFile) {
  const ok = await showWarningDialog([
    "This restores ProPresenter's props configuration to the state it was in right before that export.",
    'Your current props config will be snapshotted first, so this is undoable.',
    'If ProPresenter is open it will be quit and relaunched.',
  ], { heading: 'Restore ProPresenter config', okLabel: 'Restore', cancelLabel: 'Cancel' });
  if (!ok) return;
  const autoManage = state.config.autoManagePro7 === true;
  try {
    const res = await fetch('/api/pro7/restore', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: backupFile, autoManage }),
    });
    const data = await res.json();
    if (data.ok) {
      toast('success', 'Pro7 config restored', data.relaunched ? 'ProPresenter was relaunched.' : 'Restored the props configuration.');
    } else if (data.pro7Running) {
      toast('error', 'ProPresenter is open', 'Turn on Auto-manage ProPresenter, or close Pro7, then try again.');
    } else {
      toast('error', 'Restore failed', data.error || 'Unknown error');
    }
  } catch (err) {
    toast('error', 'Network error', err.message);
  }
}

function initGenHistory() {
  const menuBtn = document.getElementById('mm-gen-history');
  const panel   = document.getElementById('gen-history-panel');
  if (!menuBtn || !panel) return;
  renderGenHistory();
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    const moreMenu = document.getElementById('header-more-menu');
    if (moreMenu) moreMenu.classList.remove('open');
    panel.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== menuBtn) panel.classList.remove('open');
  });
}

function showGenerateModal(data, spec) {
  const modal = document.getElementById('gen-modal');
  const body  = document.getElementById('gen-modal-body');
  const title = document.getElementById('gen-modal-title');
  if (!modal || !body) return;
  if (title) title.textContent = data.delivered ? 'Ready — open ProPresenter' : 'Generated';

  const isPair = Array.isArray(data.presentations) && data.presentations.length > 0;

  const counts = { scripture: 0, point: 0, blank: 0, image: 0, custom: 0 };
  for (const s of (spec.slides || [])) {
    if (counts[s.type] !== undefined) counts[s.type]++;
  }
  const totalSlides = (spec.slides || []).length;
  const presKB = isPair
    ? Math.round(data.presentations.reduce((sum, p) => sum + (p.bytes || 0), 0) / 1024)
    : (data.presentationBytes ? Math.round(data.presentationBytes / 1024) : null);

  const chipColors = {
    scripture: '#e8f0fe', point: '#e8f5e9', blank: '#f3e5f5', image: '#fff3e0', custom: '#fce4ec'
  };
  const chipTextColors = {
    scripture: '#1565c0', point: '#2e7d32', blank: '#6a1b9a', image: '#bf360c', custom: '#880e4f'
  };

  const breakdownChips = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([type, n]) => `<span class="gen-breakdown-chip" style="background:${chipColors[type]};color:${chipTextColors[type]};border-color:${chipColors[type]}">${n} ${type}</span>`)
    .join('');

  const propSection = data.props && data.props.length
    ? `<div class="gen-modal-filename" style="margin-top:0">
        <div style="font-weight:600;color:var(--text);font-size:12px;margin-bottom:4px">${data.props.length} Prop file${data.props.length > 1 ? 's' : ''}</div>
        ${data.props.map(p => `<div>${esc(p.path)}</div>`).join('')}
      </div>`
    : (isPair
        ? `<div class="gen-modal-filename" style="margin-top:0">
            <div style="font-weight:600;color:var(--text);font-size:12px;margin-bottom:4px">Shared prop collection</div>
            <div>Both presentations reference the same DeckPro prop slots — no duplicate props were written.</div>
          </div>`
        : '');

  const filenameSection = isPair
    ? data.presentations.map(p => `<div class="gen-modal-filename">${esc(p.path)}</div>`).join('')
    : `<div class="gen-modal-filename">${esc(data.presentationPath)}</div>`;

  const revealButtons = isPair
    ? data.presentations.map((p, i) => `<button class="gen-modal-reveal-pair btn-secondary" data-path="${esc(p.path)}">Find ${i === 0 ? 'Standard' : 'Alternate'} Export in Finder</button>`).join('')
    : (data.presentationPath ? `<button id="gen-modal-reveal" class="btn-secondary">Reveal in Finder</button>` : '');

  body.innerHTML = `
    ${filenameSection}
    <div class="gen-modal-stats">
      <div class="gen-stat">
        <div class="gen-stat-num">${totalSlides}</div>
        <div class="gen-stat-lbl">Total slides${isPair ? ' (each)' : ''}</div>
      </div>
      ${presKB ? `<div class="gen-stat">
        <div class="gen-stat-num">${presKB} KB</div>
        <div class="gen-stat-lbl">${isPair ? 'Combined size' : 'File size'}</div>
      </div>` : ''}
    </div>
    ${breakdownChips ? `<div class="gen-modal-breakdown">${breakdownChips}</div>` : ''}
    ${propSection}
    <div class="gen-modal-actions">
      ${revealButtons}
      <button id="gen-modal-ok">Done</button>
    </div>
  `;

  modal.classList.add('open');
  const close = () => modal.classList.remove('open');
  document.getElementById('gen-modal-ok')?.addEventListener('click', close);
  document.getElementById('gen-modal-close')?.addEventListener('click', close);
  if (isPair) {
    modal.querySelectorAll('.gen-modal-reveal-pair').forEach(btn => {
      btn.addEventListener('click', () => {
        fetch('/api/reveal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: btn.dataset.path }) });
      });
    });
  } else {
    document.getElementById('gen-modal-reveal')?.addEventListener('click', () => {
      fetch('/api/reveal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: data.presentationPath }) });
    });
  }
  modal.addEventListener('click', e => { if (e.target === modal) close(); }, { once: true });
}

// ─── Bible lookup ─────────────────────────────────────────────────────────────

// ─── Verse-number span helpers ───────────────────────────────────────────────

const VERSE_SENTINEL_RE = /\uE000([\d\u2013-]+)\uE001\s*/g;

// Convert server text with verse-number sentinels into spans. Each verse number
// becomes its own span flagged { verseNum: true, super }.
function parseVerseSpans(text, superscript) {
  const spans = [];
  let lastIdx = 0, m;
  VERSE_SENTINEL_RE.lastIndex = 0;
  while ((m = VERSE_SENTINEL_RE.exec(text)) !== null) {
    if (m.index > lastIdx) {
      const t = text.slice(lastIdx, m.index);
      if (t) spans.push({ text: t, bold: false });
    }
    spans.push({ text: m[1], verseNum: true, super: !!superscript, bold: false });
    spans.push({ text: ' ', bold: false });
    lastIdx = VERSE_SENTINEL_RE.lastIndex;
  }
  if (lastIdx < text.length) {
    const t = text.slice(lastIdx);
    if (t) spans.push({ text: t, bold: false });
  }
  return spans.length ? spans : [{ text: text, bold: false }];
}

// Remove verse-number spans (and a trailing space) from a spans array.
function stripVerseSpans(spans) {
  const out = [];
  for (let i = 0; i < (spans || []).length; i++) {
    const s = spans[i];
    if (s.verseNum) {
      // also swallow an immediately-following pure-space span
      if (spans[i + 1] && !spans[i + 1].verseNum && spans[i + 1].text === ' ') i++;
      continue;
    }
    out.push(s);
  }
  return out.length ? out : [{ text: '', bold: false }];
}

// Re-applies bold phrases found in the source notes as ALT emphasis onto
// Bible-API-fetched spans, since the API text is very likely the same
// translation the author copied into their notes — word-for-word, just
// without the formatting once it's plain-text-extracted.
//
// Matches whole PHRASES (consecutive words), not individual words in
// isolation — a phrase only matches where its words appear adjacent, in
// order, in the fetched text. Matching by individual word membership (the
// old approach) meant a common word bolded ANYWHERE in the tracked notes
// text — even for an unrelated reason elsewhere — would mark EVERY
// occurrence of that word bold in a totally different verse (e.g. "you"
// bolded once would bold every "you" in the fetched text). Longest phrases
// are tried first so a longer bolded run wins over a shorter phrase that
// happens to be one of its words.
function applyNotesBoldToSpans(spans, boldPhrases) {
  if (!boldPhrases || !boldPhrases.size) return spans;
  // Strip punctuation off each word's OUTER edges before building the pattern.
  // A phrase like "No," (bolded with its trailing comma in the notes) otherwise
  // becomes /\bNo,\b/ — and the trailing \b can't match after a comma (comma→
  // space is non-word→non-word, no boundary), so the whole phrase silently fails
  // to bold while every phrase ending in a letter works. Stripping edge
  // punctuation lands the \b anchors on letters; the separator between words
  // still absorbs any punctuation that sat between them. Inner apostrophes and
  // accented letters are preserved (only known punctuation is trimmed).
  const EDGE_PUNCT = /^[\s,.;:!?'"()‘’“”\-–—]+|[\s,.;:!?'"()‘’“”\-–—]+$/g;
  const patterns = [...boldPhrases]
    .sort((a, b) => b.length - a.length)
    .map(p => {
      const words = p.split(/\s+/)
        .map(w => w.replace(EDGE_PUNCT, ''))
        .filter(Boolean)
        .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (!words.length) return null;
      return new RegExp('\\b' + words.join('[\\s,.;:!?\'"()‘’“”-]+') + '\\b', 'gi');
    })
    .filter(Boolean);
  if (!patterns.length) return spans;

  const out = [];
  for (const s of spans) {
    if (s.verseNum || !s.text) { out.push(s); continue; }
    const ranges = [];
    for (const re of patterns) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(s.text)) !== null) {
        ranges.push([m.index, m.index + m[0].length]);
        if (m[0].length === 0) re.lastIndex++;
      }
    }
    if (!ranges.length) { out.push(s); continue; }
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push([...r]);
    }
    let cursor = 0;
    for (const [start, end] of merged) {
      if (start > cursor) out.push({ text: s.text.slice(cursor, start), bold: false, alt: false });
      out.push({ text: s.text.slice(start, end), bold: false, alt: true });
      cursor = end;
    }
    if (cursor < s.text.length) out.push({ text: s.text.slice(cursor), bold: false, alt: false });
  }
  return out;
}

// Returns true if any body in the slide contains verse-number spans.
function slideHasVerseNums(slide) {
  return (slide.bodies || []).some(b => (b || []).some(s => s.verseNum));
}

// Re-apply the superscript flag to all verse-number spans across a slide's bodies.
function applyVerseSuper(slide, superscript) {
  (slide.bodies || []).forEach(b => (b || []).forEach(s => { if (s.verseNum) s.super = !!superscript; }));
}

async function lookupBibleVerse(slide, ref, overrideBibleId = '', boldPhrases = null) {
  if (!ref) return;
  const btn = document.getElementById('btn-bible-lookup');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  const { bibleApiKey, bibleId } = state.config;
  const resolvedBibleId = overrideBibleId || bibleId;
  if (!bibleApiKey || !resolvedBibleId) {
    toast('error', 'Bible not configured', 'Add your API key and pick a translation in Settings');
    if (btn) { btn.disabled = false; btn.textContent = 'Lookup'; }
    return;
  }

  try {
    const wantVerseNums = state.config.verseNumbers === true;
    const url = `/api/bible/search?apiKey=${encodeURIComponent(bibleApiKey)}&bibleId=${encodeURIComponent(resolvedBibleId)}&ref=${encodeURIComponent(ref)}${wantVerseNums ? '&verseNumbers=1' : ''}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.ok) { toast('error', 'Verse not found', data.error || ref); return; }

    // Preserve hard line breaks (poetry). Collapse only horizontal whitespace; keep newlines.
    // Verse-number sentinels (\uE000 N \uE001) are preserved through this cleanup.
    const text = (data.text || '')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .trim();
    if (!text) { toast('error', 'No text returned', ref); return; }

    let spans = wantVerseNums
      ? parseVerseSpans(text, state.config.verseSuper !== false)
      : [{ text: text.replace(/\uE000[\d\u2013-]+\uE001\s*/g, ''), bold: false }];
    if (boldPhrases && boldPhrases.size) spans = applyNotesBoldToSpans(spans, boldPhrases);
    // Capitalize divine pronouns right in the fetched text (visible + editable),
    // so the user can lowercase any that refer to someone other than God.
    if (state.config.capitalizeDivinePronouns) spans = divineCapsSpans(spans);
    if (!slide.bodies) slide.bodies = [[]];
    slide.bodies[0] = spans;

    // Auto-set reference if field is empty
    if (!slide.reference && data.reference) {
      slide.reference = data.reference;
      const refEl = document.getElementById('f-reference');
      if (refEl) refEl.value = data.reference;
      if (!slide._labelManual) {
        slide.label = data.reference;
        const lblEl = document.getElementById('f-label');
        if (lblEl) lblEl.value = data.reference;
      }
    }

    saveState();
    renderMain();
  } catch (err) {
    toast('error', 'Lookup failed', err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Lookup'; }
  }
}

// ─── Stage layout picker modal (mirrors showMacroPicker) ─────────────────────

// cb(name, uuid) for single-select (Pick on existing entry).
// cb([{name,uuid}, ...]) for multi-select (+ Add Stage Display).
function showStageLayoutPicker(field, anchorEl, cb, singleSelect = true) {
  document.getElementById('stage-layout-picker-overlay')?.remove();
  const liveLayouts = pro7rt.liveStageLayouts || [];
  const existing    = new Set((activeStyleScheme().stageDisplays ?? ensureGlobalStageDisplays()).map(d => d.uuid));
  const selected    = new Set();

  const overlay = document.createElement('div');
  overlay.className = 'macro-picker-overlay';
  overlay.id = 'stage-layout-picker-overlay';
  overlay.innerHTML = `
    <div class="macro-picker-modal">
      <div class="macro-picker-header">
        <input type="text" class="macro-picker-search" placeholder="Search stage layouts…" autocomplete="off" spellcheck="false">
        <button class="macro-picker-close" title="Cancel">×</button>
      </div>
      <div class="macro-picker-list"></div>
      <div class="macro-picker-footer">
        <span class="macro-picker-count">${liveLayouts.length} layouts from Pro7</span>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="macro-picker-refresh">Refresh</button>
          ${singleSelect ? '' : `<button class="macro-picker-add" disabled>Add 0</button>`}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const search   = overlay.querySelector('.macro-picker-search');
  const list     = overlay.querySelector('.macro-picker-list');
  const closeBtn = overlay.querySelector('.macro-picker-close');
  const refresh  = overlay.querySelector('.macro-picker-refresh');
  const count    = overlay.querySelector('.macro-picker-count');
  const addBtn   = overlay.querySelector('.macro-picker-add');

  function updateAddBtn() {
    if (!addBtn) return;
    addBtn.disabled = selected.size === 0;
    addBtn.textContent = selected.size === 0 ? 'Add 0' : `Add ${selected.size}`;
  }

  const STAGE_ICON = `<svg style="width:10px;height:10px;flex-shrink:0" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="1.3" width="6" height="4.2" rx="0.6" stroke="currentColor" stroke-width="1.1"/><path d="M5 5.5v1.6M3.3 7.9h3.4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>`;

  function renderRows(filter = '') {
    const f = filter.trim().toLowerCase();
    if (!liveLayouts.length) {
      list.innerHTML = `<div class="macro-picker-empty">No stage layouts found — make sure Pro7 is connected.</div>`;
      return;
    }
    const filtered = liveLayouts.filter(l => !f || l.name.toLowerCase().includes(f) || l.uuid.toLowerCase().includes(f));
    if (!filtered.length) {
      list.innerHTML = `<div class="macro-picker-empty">No matches for "${esc(filter)}".</div>`;
      return;
    }
    list.innerHTML = filtered.map(l => {
      const isExisting = existing.has(l.uuid);
      const isSel      = selected.has(l.uuid);
      return `<div class="macro-picker-row${isSel ? ' selected' : ''}${isExisting ? ' existing' : ''}" data-name="${esc(l.name)}" data-uuid="${esc(l.uuid)}">
        ${singleSelect ? '' : `<span class="mpi-check">${isSel ? '✓' : ''}</span>`}
        <span class="mpi-dot mpi-dot-default" style="display:flex;align-items:center;justify-content:center;color:var(--muted)">${STAGE_ICON}</span>
        <span class="macro-picker-row-name">${esc(l.name)}</span>
        <code class="macro-picker-row-uuid">${esc(l.uuid)}</code>
        ${isExisting ? '<span class="mpi-existing">added</span>' : ''}
      </div>`;
    }).join('');
  }

  renderRows();
  setTimeout(() => search.focus(), 40);

  search.addEventListener('input', () => renderRows(search.value));

  list.addEventListener('click', e => {
    const row = e.target.closest('.macro-picker-row');
    if (!row || row.classList.contains('existing')) return;
    const { name, uuid } = row.dataset;
    if (singleSelect) {
      overlay.remove();
      cb(name, uuid);
      return;
    }
    if (selected.has(uuid)) selected.delete(uuid); else selected.add(uuid);
    row.classList.toggle('selected', selected.has(uuid));
    row.querySelector('.mpi-check').textContent = selected.has(uuid) ? '✓' : '';
    updateAddBtn();
  });

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const result = [...selected].map(uuid => {
        const l = liveLayouts.find(l => l.uuid === uuid);
        return l ? { name: l.name, uuid: l.uuid } : null;
      }).filter(Boolean);
      overlay.remove();
      cb(result);
    });
  }

  refresh.addEventListener('click', async () => {
    refresh.textContent = 'Refreshing…';
    refresh.disabled = true;
    await fetchPro7StageLayouts(true);
    liveLayouts.length = 0;
    liveLayouts.push(...(pro7rt.liveStageLayouts || []));
    count.textContent = `${liveLayouts.length} layouts from Pro7`;
    refresh.textContent = 'Refresh';
    refresh.disabled = false;
    renderRows(search.value);
  });

  closeBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function showMacroOverridePopover(anchorEl, slide) {
  document.getElementById('macro-ov-pop')?.remove();
  const macros = activeStyleScheme().macros || [];

  const pop = document.createElement('div');
  pop.id = 'macro-ov-pop';
  pop.className = 'verse-fmt-pop macro-ov-pop';
  const cur = slide.macroOverride;
  const rowHtml = (uuid, color, name, checked, isNone) =>
    `<div class="mov-row${isNone ? ' mov-none' : ''}" data-uuid="${esc(uuid || '')}">
      ${isNone ? '' : `<span class="cm-dot" style="background:${color}"></span>`}
      <span class="mov-name">${esc(name)}</span>
      ${checked ? '<span class="mov-check">\u2713</span>' : ''}
    </div>`;
  const list = macros.length
    ? macros.map(m => rowHtml(m.uuid, macroDisplayColor(m), m.name, cur && cur.uuid === m.uuid, false)).join('')
    : `<div class="mov-empty">No macros configured yet. Add them in <strong>Preferences \u2192 Macros</strong>.</div>`;
  pop.innerHTML = `
    <div class="vfp-title">Select macro</div>
    ${cur ? rowHtml('', '', 'None (clear override)', false, true) : ''}
    ${list}
  `;
  document.body.appendChild(pop);

  const r = anchorEl.getBoundingClientRect();
  const pw = pop.offsetWidth;
  let left = r.right - pw;
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
  pop.style.left = left + 'px';
  pop.style.top  = (r.bottom + 6) + 'px';

  const close = () => { pop.remove(); document.removeEventListener('mousedown', onDoc, true); };
  function onDoc(e) { if (!pop.contains(e.target) && e.target !== anchorEl) close(); }
  setTimeout(() => document.addEventListener('mousedown', onDoc, true), 0);

  pop.addEventListener('click', e => {
    const row = e.target.closest('.mov-row');
    if (!row) return;
    const uuid = row.dataset.uuid;
    if (!uuid) {
      slide.macroOverride = null;
    } else {
      const m = macros.find(x => x.uuid === uuid);
      if (m) slide.macroOverride = { uuid: m.uuid, name: m.name, color: m.color };
    }
    close();
    saveState();
    renderMain();
    const ov = document.getElementById('slide-overrides');
    if (ov) ov.open = true;
  });
}

function showVerseFormatPopover(anchorEl, slide) {
  document.getElementById('verse-fmt-pop')?.remove();
  const cfg = state.config;

  const pop = document.createElement('div');
  pop.id = 'verse-fmt-pop';
  pop.className = 'verse-fmt-pop';
  pop.innerHTML = `
    <div class="vfp-title">Bible formatting</div>
    <div class="vfp-row" id="vfp-nums-row">
      <div class="toggle${cfg.verseNumbers ? ' on' : ''}" id="vfp-nums"></div>
      <div class="vfp-label">
        <span>Verse numbers</span>
        <small>Add the number in front of each verse</small>
      </div>
    </div>
    <div class="vfp-row${cfg.verseNumbers ? '' : ' vfp-disabled'}" id="vfp-super-row">
      <div class="toggle${cfg.verseSuper !== false ? ' on' : ''}" id="vfp-super"></div>
      <div class="vfp-label">
        <span>Superscript</span>
        <small>Raise the number above the line</small>
      </div>
    </div>
    <div class="vfp-foot">Applies to Bible lookups. ${slide.reference ? 'Changing this re-fetches this verse.' : 'Look up a verse to apply.'}</div>
  `;
  document.body.appendChild(pop);

  // Position below the anchor button, right-aligned
  const r = anchorEl.getBoundingClientRect();
  const pw = pop.offsetWidth;
  let left = r.right - pw;
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
  pop.style.left = left + 'px';
  pop.style.top  = (r.bottom + 6) + 'px';

  const close = () => {
    pop.remove();
    document.removeEventListener('mousedown', onDoc, true);
  };
  function onDoc(e) {
    if (!pop.contains(e.target) && e.target !== anchorEl) close();
  }
  setTimeout(() => document.addEventListener('mousedown', onDoc, true), 0);

  // Verse numbers toggle
  pop.querySelector('#vfp-nums').addEventListener('click', async () => {
    const turningOn = !cfg.verseNumbers;
    cfg.verseNumbers = turningOn;
    saveState();
    pop.querySelector('#vfp-nums').classList.toggle('on', turningOn);
    pop.querySelector('#vfp-super-row').classList.toggle('vfp-disabled', !turningOn);
    anchorEl.classList.toggle('active', turningOn);

    if (turningOn) {
      if (slide.reference) {
        close();
        await lookupBibleVerse(slide, slide.reference, slide.bibleId || '');
      } else {
        toast('info', 'No reference yet', 'Look up a verse and numbers will be added');
      }
    } else {
      // Strip verse-number spans from existing bodies
      slide.bodies = (slide.bodies || []).map(stripVerseSpans);
      saveState();
      renderMain();
    }
  });

  // Superscript toggle
  pop.querySelector('#vfp-super').addEventListener('click', () => {
    if (!cfg.verseNumbers) return;
    cfg.verseSuper = cfg.verseSuper === false ? true : false;
    saveState();
    pop.querySelector('#vfp-super').classList.toggle('on', cfg.verseSuper !== false);
    if (slideHasVerseNums(slide)) {
      applyVerseSuper(slide, cfg.verseSuper !== false);
      saveState();
      renderMain();
    }
  });
}

// ─── Render ───────────────────────────────────────────────────────────────────

let _lastActiveId = null;
function render() {
  // Auto-lock: leaving the Schemes panel re-locks the default scheme so it
  _lastActiveId = state.activeId;

  saveState();
  renderSidebar();
  renderMain();
}

// ─── Pro7 connection helpers ──────────────────────────────────────────────────

function updateStatusDot() {
  const dot  = document.getElementById('pro7-dot');
  const text = document.getElementById('pro7-status-text');
  if (!dot) return;
  const connected = pro7rt.connected;
  dot.className = 'pro7-dot' + (connected ? ' connected' : '');
  const label = connected
    ? `Connected${pro7rt.version ? ' — ' + pro7rt.version : ''}`
    : 'Not connected';
  dot.title = `Pro7 ${label.toLowerCase()}`;
  if (text) text.textContent = label;
}

async function checkPro7(silent = false) {
  const port     = state.config.pro7Port || 1025;
  const password = state.config.pro7Password || '';
  try {
    const res  = await fetch(`/api/pro7/status?port=${port}&password=${encodeURIComponent(password)}`);
    const data = await res.json();
    pro7rt.connected = !!(data.ok && data.connected);
    if (pro7rt.connected && data.data) {
      const v = data.data;
      pro7rt.version = v.applicationVersion
        ? `${v.applicationVersion.major || ''}.${v.applicationVersion.minor || ''}`
        : null;
    } else {
      pro7rt.version = null;
    }
    if (pro7rt.connected) {
      await fetchPro7Macros(true);
      await fetchPro7StageLayouts(true);
    }
  } catch (_) {
    pro7rt.connected = false;
    pro7rt.version   = null;
  }
  updateStatusDot();
  if (!silent && document.getElementById('pro7-connect-status'))
    renderPro7StatusInPanel();
}

async function fetchPro7Macros(silent = false) {
  if (!pro7rt.connected) return;
  const port     = state.config.pro7Port || 1025;
  const password = state.config.pro7Password || '';
  try {
    const res  = await fetch(`/api/pro7/macros?port=${port}&password=${encodeURIComponent(password)}`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.macros)) {
      pro7rt.liveMacros = data.macros;
    }
  } catch (_) {}
}

async function fetchPro7StageLayouts(silent = false) {
  if (!pro7rt.connected) return;
  const port     = state.config.pro7Port || 1025;
  const password = state.config.pro7Password || '';
  try {
    const res  = await fetch(`/api/pro7/stage-layouts?port=${port}&password=${encodeURIComponent(password)}`);
    const data = await res.json();
    if (data.ok) {
      // Pro7 returns layouts as an array or wrapped in { layouts: [...] }
      const raw = Array.isArray(data.layouts) ? data.layouts
                : Array.isArray(data.layouts?.layouts) ? data.layouts.layouts
                : [];
      // Normalise each layout to { name, uuid }
      pro7rt.liveStageLayouts = raw.map(l => ({
        name: l.id?.name ?? l.name ?? '',
        uuid: l.id?.uuid ?? l.uuid ?? '',
      })).filter(l => l.name || l.uuid);
    }
  } catch (_) {}
}

async function loadFonts() {
  if (_fontList) return _fontList;

  // Try browser queryLocalFonts API first (Chrome 103+ with local-fonts permission)
  if (typeof queryLocalFonts === 'function') {
    try {
      const fonts = await queryLocalFonts();
      _fontFamilyMap = {};
      for (const { family, style, postscriptName } of fonts) {
        if (!_fontFamilyMap[family]) _fontFamilyMap[family] = [];
        _fontFamilyMap[family].push({ style, postscript: postscriptName });
      }
      _fontList = fonts.map(f => f.postscriptName).sort((a, b) => a.localeCompare(b));
      if (state.activeId === 'style') {
        const panel = document.getElementById('main-panel');
        if (panel) renderStylePanel(panel);
      }
      return _fontList;
    } catch (_) { /* permission denied or unsupported — fall through */ }
  }

  // Fall back to server endpoint
  try {
    const res  = await fetch('/api/fonts');
    const data = await res.json();
    _fontList = data.ok ? data.fonts : [];
    // Use the pre-built fontMap from the server if available (accurate family/style data)
    if (data.ok && data.fontMap && Object.keys(data.fontMap).length) {
      _fontFamilyMap = data.fontMap;
    } else {
      buildFontFamilyMap();
    }
  } catch (_) { _fontList = []; buildFontFamilyMap(); }
  // Re-render style panel if it's currently open so selects populate
  if (state.activeId === 'style') {
    const panel = document.getElementById('main-panel');
    if (panel) renderStylePanel(panel);
  }
  return _fontList;
}

function buildFontFamilyMap() {
  if (!_fontList) return;
  const map = {};
  for (const ps of _fontList) {
    const idx = ps.lastIndexOf('-');
    const family = idx === -1 ? ps          : ps.slice(0, idx);
    const style  = idx === -1 ? 'Regular'   : ps.slice(idx + 1);
    if (!map[family]) map[family] = [];
    map[family].push({ style, postscript: ps });
  }
  _fontFamilyMap = map;
}

function parseFontPS(psName) {
  if (!psName) return { family: '', style: 'Regular' };
  const idx = psName.lastIndexOf('-');
  if (idx === -1) return { family: psName, style: 'Regular' };
  return { family: psName.slice(0, idx), style: psName.slice(idx + 1) };
}

// Resolve the display family name for a PostScript name.
// _fontFamilyMap keys are display names (e.g. "Noto Sans"), but parseFontPS
// returns PostScript-split names (e.g. "NotoSans") — they don't always match.
// This does a reverse lookup so the family select highlights the correct option.
function fontFamilyOf(ps) {
  if (!ps) return '';
  if (_fontFamilyMap) {
    for (const [fam, styles] of Object.entries(_fontFamilyMap)) {
      if (styles.some(s => s.postscript === ps)) return fam;
    }
  }
  return parseFontPS(ps).family;
}

function renderPro7StatusInPanel() {
  const el = document.getElementById('pro7-connect-status');
  if (!el) return;
  if (pro7rt.connected) {
    el.textContent = `Connected${pro7rt.version ? ' — ' + pro7rt.version : ''}`;
    el.className = 'pro7-connect-status ok';
  } else {
    el.textContent = 'Not connected — check Pro7 is running and Network API is enabled';
    el.className = 'pro7-connect-status err';
  }
}

// ─── Deck Library ────────────────────────────────────────────────────────────

// ─── Deck Library (server-backed, SQLite) ────────────────────────────────────

const LEGACY_DECKS_KEY = 'deckpro_saved_decks';

let _libCache  = [];      // deck metadata rows from the library db (no state)
let _libReady  = false;
let _libStatus = null;    // /api/library/status payload
let _deckBaseStamp = null;     // optimistic-concurrency stamp for the open deck
let _conflictPrompted = false;

async function libApi(url, opts = {}) {
  try {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function refreshLibCache() {
  const data = await libApi('/api/decks');
  if (data.ok) { _libCache = data.decks || []; _libReady = true; }
  return _libCache;
}

async function initLibrary() {
  // One-time migration: move localStorage decks into the library database
  try {
    const legacyRaw = localStorage.getItem(LEGACY_DECKS_KEY);
    if (legacyRaw) {
      const legacyDecks = JSON.parse(legacyRaw) || [];
      if (legacyDecks.length) {
        const r = await libApi('/api/library/migrate', { method: 'POST', body: { decks: legacyDecks, history: loadGenHistory() } });
        if (r.ok) {
          try { localStorage.setItem(LEGACY_DECKS_KEY + '_backup', legacyRaw); } catch (_) {}
          localStorage.removeItem(LEGACY_DECKS_KEY);
          if (r.imported > 0) {
            toast('success', 'Library upgraded', `${r.imported} deck${r.imported === 1 ? '' : 's'} moved into the new library database`);
          }
        }
      } else {
        localStorage.removeItem(LEGACY_DECKS_KEY);
      }
    }
  } catch (_) { /* migration is retried on next launch if it fails */ }

  _libStatus = await libApi('/api/library/status');
  await refreshLibCache();

  const cur = _libCache.find(d => d.id === state.currentDeckId);
  _deckBaseStamp = cur ? cur.updated_at : null;

  // Pull export history from the library db into the local panel cache
  const hist = await libApi('/api/history?limit=30');
  if (hist.ok && hist.history?.length) {
    saveGenHistory(hist.history.map(h => ({
      id: h.id, fileName: h.file_name, path: h.path,
      sizeKB: h.size_kb || null, delivered: !!h.delivered, date: h.created_at,
    })));
    renderGenHistory();
  }

  renderDecksList();
}

function deckSaveBody() {
  return {
    series:   state.config.seriesName   || '',
    title:    state.config.messageTitle || '',
    date:     state.config.weekDate     || '',
    speaker:  state.config.speaker      || '',
    schemeId: state.activeSchemeId      || '',
    state,
    baseUpdatedAt: _deckBaseStamp,
  };
}

async function autosaveDeck() {
  if (!state.currentDeckId) return; // draft — never auto-promote to library
  const id = state.currentDeckId;
  const r  = await libApi(`/api/decks/${id}`, { method: 'PUT', body: deckSaveBody() });
  if (r.ok) {
    _deckBaseStamp = r.updatedAt;
    const row = _libCache.find(d => d.id === id);
    if (row) {
      row.series      = state.config.seriesName   || '';
      row.title       = state.config.messageTitle || '';
      row.date        = state.config.weekDate     || '';
      row.speaker     = state.config.speaker      || '';
      row.slide_count = state.slides.filter(s => !['start', 'end'].includes(s.type)).length;
      row.updated_at  = r.updatedAt;
      row.dirty       = 1;
    } else {
      await refreshLibCache();
    }
  } else if (r.conflict) {
    handleSaveConflict(id);
  }
}

async function handleSaveConflict(id) {
  if (_conflictPrompted) return;
  _conflictPrompted = true;
  const keepMine = window.confirm(
    'This deck was changed somewhere else — most likely on another computer sharing this library.\n\n' +
    'OK — keep THIS version (overwrites the library copy)\n' +
    'Cancel — load the library version (discards local edits)'
  );
  try {
    if (keepMine) {
      const r = await libApi(`/api/decks/${id}`, { method: 'PUT', body: { ...deckSaveBody(), force: true } });
      if (r.ok) _deckBaseStamp = r.updatedAt;
    } else {
      await loadDeckState(id);
    }
  } finally {
    _conflictPrompted = false;
  }
}

async function deleteDeck(id) { // soft delete → Trash
  await libApi(`/api/decks/${id}`, { method: 'DELETE' });
  const row = _libCache.find(d => d.id === id);
  if (row) row.status = 'deleted';
  if (state.currentDeckId === id) { state.currentDeckId = null; _deckBaseStamp = null; }
  renderDecksList();
}

async function purgeDeck(id) {
  await libApi(`/api/decks/${id}?hard=1`, { method: 'DELETE' });
  _libCache = _libCache.filter(d => d.id !== id);
  renderDecksList();
}

async function setDeckStatus(id, status) {
  await libApi(`/api/decks/${id}/status`, { method: 'POST', body: { status } });
  const row = _libCache.find(d => d.id === id);
  if (row) row.status = status;
  renderDecksList();
}

async function toggleDeckTemplate(id) {
  const row = _libCache.find(d => d.id === id);
  const on  = row ? !row.is_template : true;
  await libApi(`/api/decks/${id}/template`, { method: 'POST', body: { isTemplate: on } });
  if (row) row.is_template = on ? 1 : 0;
  renderDecksList();
}

async function duplicateDeckAction(id) {
  const newId = crypto.randomUUID();
  const r = await libApi(`/api/decks/${id}/duplicate`, { method: 'POST', body: { newId } });
  if (r.ok) await refreshLibCache();
  renderDecksList();
}

// Every deck's saved state carries a FULL snapshot of state.config AND the
// top-level style/global fields (see deckSaveBody() — it saves the whole
// `state`), so opening or creating a deck would otherwise silently roll all
// of this back to whatever it was the last time THAT deck was saved. That's
// correct for deck CONTENT (series, title, response text, slides — you want
// those to switch). It's wrong for anything that's really a PREFERENCE: a
// Pro7 connection detail, a recurring speaker you added last week, your
// Global palette. Two lists, split the same way the app's own iCloud
// SYNC_SECTIONS() already does (that function is the authoritative signal
// for "this is a preference, not deck content" — reuse its judgment rather
// than re-deriving one from scratch):
//
// - PERSISTENT_CONFIG_FIELDS: keys under state.config.
// - PERSISTENT_STATE_FIELDS: top-level state keys (styleSchemes + every
//   global* — SYNC_SECTIONS() treats all of these as portable preferences).
//
// `responses` (the week's actual R1/R2/R3 answer text) is deliberately left
// OUT even though SYNC_SECTIONS() lists it for cross-machine sync — that's a
// different job (syncing a device's copy) from "should switching decks touch
// this," and response text is genuine per-week content, not a preference.
const PERSISTENT_CONFIG_FIELDS = [
  // Pro7 / machine connection
  'pro7Port', 'pro7Password', 'pro7RootFolder', 'pro7LibraryFolder',
  'autoManagePro7', 'outputFolder', 'setupComplete', 'stageScreen',
  'qrMacro', 'qrExportPair', 'gradientMacro', 'gradientMacroQr', 'icloudSync', 'theme',
  // Bible lookup
  'bibleApiKey', 'bibleId', 'bibleName', 'bibleList', 'verseNumbers', 'verseSuper',
  // App-wide preferences (mirrors SYNC_SECTIONS()'s portable-vs-deck split)
  'features', 'recentSeries', 'displayNames', 'bookNames', 'queueMode',
  'speakers', 'notesStyleMap', 'capitalizeDivinePronouns',
  'notesMode', 'notesUseNearbyRefs',
];
const PERSISTENT_STATE_FIELDS = [
  'styleSchemes', 'globalTypography', 'globalLayout', 'globalFontAdv',
  'globalMotion', 'globalMacros', 'globalStageDisplays', 'globalRcElements',
];
function carryPersistentConfig(fromState, toState) {
  for (const f of PERSISTENT_CONFIG_FIELDS) toState.config[f] = fromState.config[f];
}
function carryPersistentGlobals(fromState, toState) {
  for (const f of PERSISTENT_STATE_FIELDS) toState[f] = fromState[f];
}
// Both together — the common case (opening an existing deck: nothing about
// the CURRENT session's globals should be deliberately different from what
// gets carried forward). newDeck() calls the two pieces separately instead,
// since creating from a template deliberately keeps THAT template's own
// style snapshot rather than the live session's.
function carryPersistentSettings(fromState, toState) {
  carryPersistentConfig(fromState, toState);
  carryPersistentGlobals(fromState, toState);
}

async function loadDeckState(id) {
  const r = await libApi(`/api/decks/${id}`);
  if (!r.ok || !r.deck?.state) {
    toast('error', 'Could not open deck', r.error || 'Deck state missing');
    return;
  }
  const priorState = state;
  state = r.deck.state;
  carryPersistentSettings(priorState, state);
  state.currentDeckId = id;
  _deckBaseStamp = r.deck.updated_at;
  libApi(`/api/decks/${id}/opened`, { method: 'POST' });
  const row = _libCache.find(d => d.id === id);
  if (row) row.last_opened_at = new Date().toISOString();
  _undoStack.length = 0; _redoStack.length = 0;
  saveState();
  clearTimeout(_autosaveTimer); // opening a deck isn't an edit — skip the echo save
  render();
  syncHeaderInputs();
  _syncNotesPanelToDeck?.();    // load THIS deck's own notes doc (per-deck, not global)
  updateUndoButtons?.();
}

async function newDeck({ series = '', title = '', date = '', schemeId = null, speaker = '', fromTemplateId = null } = {}) {
  let s = null;
  if (fromTemplateId) {
    const r = await libApi(`/api/decks/${fromTemplateId}`);
    if (r.ok && r.deck?.state) s = JSON.parse(JSON.stringify(r.deck.state));
  }
  if (!s) s = DEFAULT_STATE();
  s.config.seriesName   = series;
  s.config.messageTitle = title;
  s.config.speaker      = speaker;
  s.config.weekDate     = date || new Date().toISOString().slice(0, 10);
  // Carry over settings that belong to this computer, not the deck (whether
  // starting fresh or from a template — a template is another deck's own
  // saved snapshot, so it has the same stale-machine-config risk).
  // Preferences always carry forward, template or not — a template deck
  // shouldn't reset your Bible key or speaker list any more than a plain new
  // deck should. The Global palette is different: a template is a deliberate
  // saved style+structure snapshot, so creating FROM one keeps ITS style
  // rather than overwriting it with the live session's (matches the existing
  // !fromTemplateId behavior this block already had).
  carryPersistentConfig(state, s);
  if (!fromTemplateId) carryPersistentGlobals(state, s);
  s.activeSchemeId = schemeId || s.activeSchemeId || state.activeSchemeId;
  s.currentDeckId  = crypto.randomUUID();
  s.activeId       = 'start';
  if (series) {
    const recent = state.config.recentSeries || [];
    s.config.recentSeries = [series, ...recent.filter(x => x !== series)].slice(0, 12);
  }
  state = s;
  _deckBaseStamp = null;
  _undoStack.length = 0; _redoStack.length = 0;
  saveState();
  clearTimeout(_autosaveTimer);
  render();
  syncHeaderInputs();
  _syncNotesPanelToDeck?.();    // new deck starts with its own (usually empty) notes
  updateUndoButtons?.();
  await autosaveDeck(); // create the library row immediately
  renderDecksList();
}

// ─── Library UI ───────────────────────────────────────────────────────────────

let _deckSort      = 'date';
let _deckFilter    = 'active';
let _deckSearch    = '';
let _editingDeckId = null;
let _openMenuId    = null;

function deckDateLabel(raw) {
  if (!raw) return '';
  return new Date(raw + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function relTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function deckEditFormHtml(deck) {
  return `
    <div class="deck-item deck-item--editing" data-id="${deck.id}">
      <div class="deck-edit-fields">
        <input class="deck-edit-input" id="de-series" placeholder="Series" value="${esc(deck.series || '')}" spellcheck="true">
        <input class="deck-edit-input" id="de-title"  placeholder="Title"  value="${esc(deck.title  || '')}" spellcheck="true">
        <input class="deck-edit-input" id="de-speaker" placeholder="Speaker" value="${esc(deck.speaker || '')}" spellcheck="true">
        <input class="deck-edit-input deck-edit-date" id="de-date" type="date" value="${esc(deck.date || '')}">
        <label class="deck-edit-qr-wrap" title="Default QR state for this deck's blanks — a quick on/off you can flip per deck. Sets the starting point for untouched blanks only; the QR Stop marker and each blank's own QR toggle still apply on top of it.">
          <div class="toggle${deck._qrOn ? ' on' : ''}" id="de-qr-toggle"></div>
          QR
        </label>
      </div>
      <div class="deck-edit-actions">
        <button class="btn-deck-edit-save" data-id="${deck.id}">Save</button>
        <button class="btn-deck-edit-cancel">Cancel</button>
      </div>
    </div>`;
}

function deckRowHtml(deck) {
  if (deck.id === _editingDeckId) return deckEditFormHtml(deck);

  const isCurrent = deck.id === state.currentDeckId;
  const inTrash   = deck.status === 'deleted';
  const series    = deck.series || '';
  const title     = deck.title  || '';
  const dateLabel = deckDateLabel(deck.date);

  const metaBits = [
    dateLabel,
    deck.speaker ? esc(deck.speaker) : '',
    deck.slide_count != null ? `${deck.slide_count} slides` : '',
  ].filter(Boolean).join(' · ');

  let exportLine;
  if (deck.last_generated_at) {
    exportLine = `<span class="deck-export-ok">⬆ ${relTime(deck.last_generated_at)}</span>` +
      (deck.dirty ? `<span class="deck-dirty-lbl" title="Edited since last export">· edited since</span>` : '');
  } else {
    exportLine = `<span class="deck-never-exported">never exported</span>`;
  }

  const badges = [
    isCurrent ? '<span class="deck-current-badge">Open</span>' : '',
    deck.is_template ? '<span class="deck-template-badge">Template</span>' : '',
    deck.status === 'archived' ? '<span class="deck-archived-badge">Archived</span>' : '',
  ].join('');

  const menuItems = inTrash ? `
    <button class="deck-menu-item" data-act="restore" data-id="${deck.id}">Restore</button>
    <button class="deck-menu-item deck-menu-item--danger" data-act="purge" data-id="${deck.id}">Delete Forever</button>
  ` : `
    <button class="deck-menu-item" data-act="edit" data-id="${deck.id}">Edit Info</button>
    <button class="deck-menu-item" data-act="duplicate" data-id="${deck.id}">Duplicate</button>
    <button class="deck-menu-item" data-act="template" data-id="${deck.id}">${deck.is_template ? 'Remove from Templates' : 'Save as Template'}</button>
    <button class="deck-menu-item" data-act="${deck.status === 'archived' ? 'unarchive' : 'archive'}" data-id="${deck.id}">${deck.status === 'archived' ? 'Unarchive' : 'Archive'}</button>
    ${deck.last_export_path ? `<button class="deck-menu-item" data-act="reveal" data-id="${deck.id}">Reveal Last Export</button>` : ''}
    <button class="deck-menu-item deck-menu-item--danger" data-act="trash" data-id="${deck.id}">Delete</button>
  `;

  return `
    <div class="deck-item${isCurrent ? ' deck-item--current' : ''}" data-id="${deck.id}">
      <div class="deck-item-info">
        ${badges}
        <div class="deck-item-name">
          ${series ? `<span class="deck-item-series">${esc(series)}</span>` : ''}
          ${series && title ? '<span class="deck-item-sep">—</span>' : ''}
          ${title  ? `<span class="deck-item-title">${esc(title)}</span>`  : ''}
          ${!series && !title ? '<span class="deck-item-untitled">Untitled</span>' : ''}
        </div>
        <div class="deck-item-meta">${metaBits}${metaBits ? ' · ' : ''}${exportLine}</div>
      </div>
      <div class="deck-item-actions">
        ${!isCurrent && !inTrash ? `<button class="btn-deck-load" data-id="${deck.id}">Open</button>` : ''}
        <button class="btn-deck-menu" data-id="${deck.id}" title="Actions">⋯</button>
        ${_openMenuId === deck.id ? `<div class="deck-menu">${menuItems}</div>` : ''}
      </div>
    </div>`;
}

function renderDecksList() {
  const list = document.getElementById('decks-list');
  if (!list) return;
  if (!_libReady) {
    list.innerHTML = `<div class="deck-empty">Loading library…</div>`;
    updateDeckFooter(0);
    return;
  }

  const q = _deckSearch.trim().toLowerCase();
  const decks = _libCache.filter(d => {
    if (_deckFilter === 'active')         { if (d.status !== 'active' || d.is_template) return false; }
    else if (_deckFilter === 'templates') { if (!d.is_template || d.status === 'deleted') return false; }
    else if (_deckFilter === 'archived')  { if (d.status !== 'archived') return false; }
    else if (_deckFilter === 'deleted')   { if (d.status !== 'deleted') return false; }
    if (q && !(`${d.series} ${d.title} ${d.speaker} ${d.date}`.toLowerCase().includes(q))) return false;
    return true;
  });

  if (_deckSort === 'series') {
    decks.sort((a, b) => (a.series || '').localeCompare(b.series || '') || (b.date || '').localeCompare(a.date || ''));
  } else if (_deckSort === 'updated') {
    decks.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  } else {
    decks.sort((a, b) => (b.date || b.updated_at || '').localeCompare(a.date || a.updated_at || ''));
  }

  // Draft row — working state not yet in the library
  const showDraft = !state.currentDeckId && _deckFilter === 'active' && !q;
  const draftHtml = showDraft ? `
    <div class="deck-item deck-item--draft" id="deck-draft-item">
      <div class="deck-item-info">
        <span class="deck-draft-badge">Draft</span>
        <div class="deck-item-name"><span class="deck-item-untitled">Unsaved deck</span></div>
        <div class="deck-item-meta">${state.slides.filter(s => !['start', 'end'].includes(s.type)).length} slides · not in library</div>
      </div>
      <div class="deck-item-actions">
        <button class="btn-deck-save-draft" id="btn-save-draft">Save to Library</button>
      </div>
    </div>
    <div class="save-draft-form hidden" id="save-draft-form">
      <div class="deck-edit-fields">
        <input class="deck-edit-input" id="sd-series" placeholder="Series" list="series-datalist" spellcheck="true">
        <input class="deck-edit-input" id="sd-title"  placeholder="Title" spellcheck="true">
        <input class="deck-edit-input deck-edit-date" id="sd-date" type="date" value="${new Date().toISOString().slice(0, 10)}">
      </div>
      <div class="deck-edit-actions">
        <button class="btn-deck-edit-save" id="btn-sd-confirm">Save</button>
        <button class="btn-deck-edit-cancel" id="btn-sd-cancel">Cancel</button>
      </div>
    </div>` : '';

  let rows = '';
  if (_deckSort === 'series' && decks.length) {
    let lastSeries = null;
    for (const d of decks) {
      const s = d.series || 'No Series';
      if (s !== lastSeries) { rows += `<div class="deck-group-head">${esc(s)}</div>`; lastSeries = s; }
      rows += deckRowHtml(d);
    }
  } else {
    rows = decks.map(deckRowHtml).join('');
  }

  if (!decks.length && !showDraft) {
    const msgs = {
      active:    'No decks yet. Hit <strong>+ New Deck</strong> to start one.',
      templates: 'No templates yet — open a deck\u2019s ⋯ menu and choose Save as Template.',
      archived:  'Nothing archived.',
      deleted:   'Trash is empty.',
    };
    rows = `
      <div class="deck-empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <rect x="2" y="6" width="20" height="14" rx="2"/>
          <path d="M2 10h20M7 3h10"/>
        </svg>
        ${q ? 'No decks match your search.' : msgs[_deckFilter]}
      </div>`;
  }

  list.innerHTML = draftHtml + rows;
  updateDeckFooter(decks.length);
}

function updateDeckFooter(visible) {
  const el = document.getElementById('decks-modal-footer');
  if (!el) return;
  const total = _libCache.length;
  const loc = _libStatus?.libraryDir ? _libStatus.libraryDir.replace(/^\/Users\/[^/]+/, '~') : '';
  el.innerHTML = `${total} deck${total === 1 ? '' : 's'} in library${loc ? ` · <span class="deck-footer-loc" title="${esc(_libStatus.libraryDir)}">${esc(loc)}</span>` : ''}`;
}

function initDecks() {
  const modal = document.getElementById('decks-modal');
  const close = document.getElementById('decks-modal-close');
  const list  = document.getElementById('decks-list');
  if (!modal) return;

  function openModal() {
    renderDecksList();
    modal.classList.add('open');
    const sel = document.getElementById('nd-scheme');
    if (sel) {
      sel.innerHTML = state.styleSchemes.map(sc =>
        `<option value="${esc(sc.id)}"${sc.id === state.activeSchemeId ? ' selected' : ''}>${esc(sc.name)}</option>`
      ).join('');
    }
    const tsel = document.getElementById('nd-template');
    if (tsel) {
      const templates = _libCache.filter(d => d.is_template && d.status !== 'deleted');
      tsel.innerHTML = '<option value="">Blank deck</option>' + templates.map(t =>
        `<option value="${esc(t.id)}">${esc([t.series, t.title].filter(Boolean).join(' — ') || 'Untitled')}</option>`
      ).join('');
    }
    const dl = document.getElementById('series-datalist');
    if (dl) {
      dl.innerHTML = (state.config.recentSeries || []).map(r => `<option value="${esc(r)}">`).join('');
    }
    const sdl = document.getElementById('speaker-datalist');
    if (sdl) {
      sdl.innerHTML = (state.config.speakers || []).map(s => `<option value="${esc(s)}">`).join('');
    }
    // Refresh from db in the background (picks up changes from other machines)
    refreshLibCache().then(renderDecksList);
  }

  document.getElementById('btn-decks')?.addEventListener('click', openModal);
  document.getElementById('deck-header-meta')?.addEventListener('click', openModal);
  close?.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  // Search
  document.getElementById('deck-search')?.addEventListener('input', e => {
    _deckSearch = e.target.value;
    _openMenuId = null;
    renderDecksList();
  });

  // Filter + sort tabs
  modal.addEventListener('click', e => {
    const filterBtn = e.target.closest('.deck-filter-btn');
    if (filterBtn) {
      _deckFilter = filterBtn.dataset.filter;
      _openMenuId = null; _editingDeckId = null;
      modal.querySelectorAll('.deck-filter-btn').forEach(b => b.classList.toggle('active', b === filterBtn));
      renderDecksList();
      return;
    }
    const sortBtn = e.target.closest('.deck-sort-btn');
    if (sortBtn) {
      _deckSort = sortBtn.dataset.sort;
      modal.querySelectorAll('.deck-sort-btn').forEach(b => b.classList.toggle('active', b === sortBtn));
      renderDecksList();
    }
  });

  // New Deck form
  document.getElementById('btn-new-deck')?.addEventListener('click', () => {
    const form = document.getElementById('new-deck-form');
    form?.classList.toggle('hidden');
    if (!form?.classList.contains('hidden')) {
      document.getElementById('nd-series').value  = '';
      document.getElementById('nd-title').value   = '';
      document.getElementById('nd-speaker').value = '';
      document.getElementById('nd-date').value    = new Date().toISOString().slice(0, 10);
    }
  });
  document.getElementById('btn-nd-cancel')?.addEventListener('click', () => {
    document.getElementById('new-deck-form')?.classList.add('hidden');
  });
  document.getElementById('btn-nd-create')?.addEventListener('click', async () => {
    const series   = document.getElementById('nd-series')?.value.trim()  || '';
    const title    = document.getElementById('nd-title')?.value.trim()   || '';
    const speaker  = document.getElementById('nd-speaker')?.value.trim() || '';
    const date     = document.getElementById('nd-date')?.value           || '';
    const schemeId = document.getElementById('nd-scheme')?.value         || null;
    const fromTemplateId = document.getElementById('nd-template')?.value || null;
    // Offer to remember a new speaker as a permanent/recurring one.
    if (speaker) {
      const known = state.config.speakers || (state.config.speakers = []);
      if (!known.some(s => s.toLowerCase() === speaker.toLowerCase())) {
        if (confirm(`Add “${speaker}” as a permanent speaker? They'll appear in the dropdown next time.`)) {
          known.push(speaker);
          known.sort((a, b) => a.localeCompare(b));
          saveState();
        }
      }
    }
    document.getElementById('new-deck-form')?.classList.add('hidden');
    modal.classList.remove('open');
    await newDeck({ series, title, date, schemeId, speaker, fromTemplateId });
  });

  // Save-draft form
  list?.addEventListener('click', e => {
    if (e.target.closest('#btn-save-draft')) {
      document.getElementById('save-draft-form')?.classList.toggle('hidden');
      return;
    }
    if (e.target.closest('#btn-sd-cancel')) {
      document.getElementById('save-draft-form')?.classList.add('hidden');
      return;
    }
    if (e.target.closest('#btn-sd-confirm')) {
      const series = document.getElementById('sd-series')?.value.trim() || '';
      const title  = document.getElementById('sd-title')?.value.trim()  || '';
      const date   = document.getElementById('sd-date')?.value          || '';
      state.currentDeckId       = crypto.randomUUID();
      state.config.seriesName   = series || state.config.seriesName;
      state.config.messageTitle = title  || state.config.messageTitle;
      state.config.weekDate     = date   || state.config.weekDate;
      if (series) {
        const recent = state.config.recentSeries || [];
        state.config.recentSeries = [series, ...recent.filter(s => s !== series)].slice(0, 12);
      }
      _deckBaseStamp = null;
      autosaveDeck().then(renderDecksList);
      saveState();
      clearTimeout(_autosaveTimer);
      syncHeaderInputs();
      return;
    }
  });

  // Row interactions (open / edit / action menu)
  list?.addEventListener('click', async e => {
    const loadBtn    = e.target.closest('.btn-deck-load');
    const menuBtn    = e.target.closest('.btn-deck-menu');
    const menuItem   = e.target.closest('.deck-menu-item');
    const saveEdit   = e.target.closest('.btn-deck-edit-save:not(#btn-sd-confirm)');
    const cancelEdit = e.target.closest('.btn-deck-edit-cancel:not(#btn-sd-cancel)');
    const qrToggle   = e.target.closest('#de-qr-toggle');

    if (qrToggle) { qrToggle.classList.toggle('on'); return; }

    if (menuBtn) {
      _openMenuId = _openMenuId === menuBtn.dataset.id ? null : menuBtn.dataset.id;
      renderDecksList();
      return;
    }

    if (menuItem) {
      const id  = menuItem.dataset.id;
      const act = menuItem.dataset.act;
      _openMenuId = null;
      if (act === 'edit') {
        const row = _libCache.find(d => d.id === id);
        if (row) {
          // Pull QR state for the edit form (only known client-side for the open deck)
          row._qrOn = id === state.currentDeckId ? !!state.config.qrCode : !!row._qrOn;
        }
        _editingDeckId = id;
        renderDecksList();
      }
      else if (act === 'duplicate')  await duplicateDeckAction(id);
      else if (act === 'template')   await toggleDeckTemplate(id);
      else if (act === 'archive')    await setDeckStatus(id, 'archived');
      else if (act === 'unarchive')  await setDeckStatus(id, 'active');
      else if (act === 'restore')    await setDeckStatus(id, 'active');
      else if (act === 'trash')      await deleteDeck(id);
      else if (act === 'purge') {
        if (window.confirm('Permanently delete this deck? This cannot be undone.')) await purgeDeck(id);
      }
      else if (act === 'reveal') {
        const row = _libCache.find(d => d.id === id);
        if (row?.last_export_path) {
          fetch('/api/reveal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: row.last_export_path }) });
        }
      }
      renderDecksList();
      return;
    }

    if (saveEdit) {
      const id      = saveEdit.dataset.id;
      const series  = document.getElementById('de-series')?.value.trim()  || '';
      const title   = document.getElementById('de-title')?.value.trim()   || '';
      const speaker = document.getElementById('de-speaker')?.value.trim() || '';
      const date    = document.getElementById('de-date')?.value           || '';
      const qrOn    = document.getElementById('de-qr-toggle')?.classList.contains('on') ?? false;
      const r = await libApi(`/api/decks/${id}/info`, { method: 'POST', body: { series, title, date, speaker, qrCode: qrOn } });
      const row = _libCache.find(d => d.id === id);
      if (row) { row.series = series; row.title = title; row.date = date; row.speaker = speaker; if (r.updatedAt) row.updated_at = r.updatedAt; }
      if (id === state.currentDeckId) {
        state.config.seriesName   = series;
        state.config.messageTitle = title;
        state.config.weekDate     = date;
        state.config.speaker      = speaker;
        state.config.qrCode       = qrOn;
        if (r.updatedAt) _deckBaseStamp = r.updatedAt;
        saveState();
        clearTimeout(_autosaveTimer);
        syncHeaderInputs();
      }
      if (series) {
        const recent = state.config.recentSeries || [];
        state.config.recentSeries = [series, ...recent.filter(s => s !== series)].slice(0, 12);
      }
      _editingDeckId = null;
      renderDecksList();
      return;
    }
    if (cancelEdit) {
      _editingDeckId = null;
      renderDecksList();
      return;
    }

    if (loadBtn) {
      _editingDeckId = null;
      _openMenuId = null;
      modal.classList.remove('open');
      await loadDeckState(loadBtn.dataset.id);
    }
  });

  // Click outside closes any open action menu
  document.addEventListener('click', e => {
    if (_openMenuId && !e.target.closest('.deck-menu') && !e.target.closest('.btn-deck-menu')) {
      _openMenuId = null;
      renderDecksList();
    }
  });
}

// ─── Self-update ──────────────────────────────────────────────────────────────

let _updateInfo = null;

async function checkForUpdates(manual = false) {
  let data = null;
  try {
    data = await fetch('/api/update/check').then(r => r.json());
  } catch (_) { data = { ok: false, error: 'offline' }; }

  if (!data.ok) {
    if (manual) toast('error', 'Update check failed', data.error || 'Could not reach GitHub');
    return;
  }
  if (!data.updateAvailable) {
    hideUpdateBanner();
    if (manual) toast('success', 'Up to date', `DeckPro v${data.current} is the latest version`);
    return;
  }
  _updateInfo = data;
  showUpdateBanner(data);
  if (manual) toast('info', 'Update available', `DeckPro v${data.latest} is ready to install`);
}

function formatUpdateNotes(md, maxItems = 5) {
  if (!md) return '';
  const items = md.split('\n')
    .map(l => l.trim())
    .filter(l => /^[-*] /.test(l))
    .slice(0, maxItems)
    .map(l => `<li>${esc(l.replace(/^[-*] /, ''))}</li>`);
  return items.length ? `<ul class="update-notes-list">${items.join('')}</ul>` : '';
}

function showUpdateBanner(info) {
  hideUpdateBanner();
  const notesHtml = formatUpdateNotes(info.notes, 4);
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.className = 'update-banner';
  banner.innerHTML = `
    <span class="update-banner-text">
      <strong>DeckPro v${esc(info.latest)}</strong> is available
      <span class="update-banner-sub">you have v${esc(info.current)}</span>
    </span>
    ${notesHtml ? `<div class="update-banner-notes">${notesHtml}</div>` : ''}
    <button class="update-banner-install" id="update-banner-install">Update &amp; Relaunch</button>
    <button class="update-banner-dismiss" id="update-banner-dismiss" title="Not now">×</button>
  `;
  document.body.appendChild(banner);
  document.getElementById('update-banner-install')?.addEventListener('click', installUpdate);
  document.getElementById('update-banner-dismiss')?.addEventListener('click', hideUpdateBanner);
}

function hideUpdateBanner() {
  document.getElementById('update-banner')?.remove();
}

async function installUpdate() {
  hideUpdateBanner();
  showDeliveryOverlay([
    'Downloading update',
    'Installing',
    'Relaunching',
  ], {
    title: 'Updating DeckPro',
    subtitle: "Don't close the app until this completes",
    notes: _updateInfo?.notes,
  });
  updateDeliveryStep(0, false);
  try {
    const r = await fetch('/api/update/install', { method: 'POST' }).then(x => x.json());
    if (r.ok) {
      updateDeliveryStep(0, true);
      updateDeliveryStep(1, true);
      // App quits and relaunches on its own from here
    } else {
      hideDeliveryOverlay();
      toast('error', 'Update failed', r.error || 'Unknown error');
    }
  } catch (_) {
    // Connection drops as the app quits mid-update — expected
  }
}

// ─── Help ─────────────────────────────────────────────────────────────────────

function helpSections() {
  const D1 = dn('mainScreen'), D2 = dn('ledWall'), D3 = dn('monitor');
  return [
  {
    id: 'start',
    label: 'Getting Started',
    html: `
      <h3>What DeckPro is</h3>
      <p class="help-lead">DeckPro builds ready-to-run ProPresenter&nbsp;7 message decks for Canvas Church. You fill in slides in a simple form, press <strong>Export</strong>, and a complete <code>.pro</code> file — with all its props, macros, stage-layout triggers and ${D3.toLowerCase()} notes — drops straight into ProPresenter. The goal is that anyone on the team can build the weekly deck, not just the one person who knows Pro7 inside out.</p>

      <h4>The core loop</h4>
      <ol class="help-steps">
        <li>Set the <strong>Series</strong>, <strong>Title</strong> and <strong>Date</strong> in the header bar.</li>
        <li>Add slides from the left sidebar — Scripture, Point, Blank, Image, Custom.</li>
        <li>Fill in each slide: body text, reference, bullets. Use Bible Lookup to auto-fill verses.</li>
        <li>Pick a <strong>Style</strong> (visual look) if you want something other than the default.</li>
        <li>Press <strong>Export</strong> (<span class="help-kbd">⌘E</span>). DeckPro writes the deck and props into ProPresenter.</li>
        <li>Open ProPresenter — your deck is there, ready to present.</li>
      </ol>

      <div class="help-callout">
        <strong>First time on a new computer?</strong> Open <strong>···&nbsp;→&nbsp;Machine Setup</strong> and walk through the cards: connect to Pro7, point at your Pro7 folder, add a Bible key, and import your macros / stage layouts. You only do this once per machine. See <em>Pro7 &amp; Machine Setup</em>.
      </div>

      <h4>Your work is always saved</h4>
      <p>The deck you're editing autosaves continuously — the header shows <strong>“saved.”</strong> Every deck also lives in the <strong>Deck Library</strong> (the <strong>Decks</strong> button) in a local database with daily backups. Nothing lives only in the browser.</p>

      <p class="help-muted">New to a specific area? Jump to a section above, or use the search box to find any term across the whole guide.</p>
    `,
  },
  {
    id: 'interface',
    label: 'The Interface',
    html: `
      <h3>A map of the window</h3>
      <p>DeckPro has four zones: the header bar, the left sidebar, the center editor, and the right reference panel.</p>

      <h4>Header bar (top)</h4>
      <ul>
        <li><strong>Series / Title / Date / Speaker</strong> — deck identity; drives the export filename.</li>
        <li><strong>saved</strong> indicator — confirms the current deck is written to the library.</li>
        <li><strong>Connection dot</strong> — green when DeckPro is talking to a running ProPresenter.</li>
        <li><strong>Undo / Redo</strong> — <span class="help-kbd">⌘Z</span> / <span class="help-kbd">⌘⇧Z</span>.</li>
        <li><strong>Decks</strong> — opens the Deck Library.</li>
        <li><strong>Export</strong> — builds and delivers the deck to Pro7 (<span class="help-kbd">⌘E</span>).</li>
        <li><strong>···</strong> — the more menu (see below).</li>
      </ul>

      <h4>Left sidebar</h4>
      <ul>
        <li><strong>Add Item</strong> — Scripture, Point, Blank, Image, Custom buttons (<span class="help-kbd">⌘1</span>–<span class="help-kbd">⌘5</span>).</li>
        <li><strong>Deck</strong> — the ordered list of slides. <strong>Start of Notes</strong> and <strong>End of Notes</strong> are fixed bookends; everything between them you can drag to reorder. The <strong>Blanks</strong> control manages blank slides. Click a slide to edit it.</li>
      </ul>

      <h4>Center editor</h4>
      <p>The form for the selected slide. Its fields change with the slide type. This is where you type body text, references, bullets, and open the per-slide Overrides.</p>

      <h4>Right panel — Speaker Notes</h4>
      <p>Toggle it with the <strong>Notes</strong> button. Drop a PDF or paste a Google Docs link to keep your script or ${D3} content alongside while you build. Drag its left edge to resize.</p>

      <h4>The ··· more menu</h4>
      <ul>
        <li><strong>DeckPro Guide</strong> — this manual.</li>
        <li><strong>What's New</strong> — the changelog.</li>
        <li><strong>Styles</strong> — the visual-style editor (also “Palettes”/“Schemes”).</li>
        <li><strong>Preferences</strong> — app settings.</li>
        <li><strong>Machine Setup</strong> — one-time per-computer setup.</li>
        <li><strong>Export History</strong> — recent exports, with reveal-in-Finder.</li>
        <li><strong>Export Diagnostic Bundle</strong> — a troubleshooting snapshot.</li>
        <li><strong>Check for Updates</strong> — pull the latest release.</li>
        <li><strong>Theme</strong> — light / dark (<span class="help-kbd">⌘⇧D</span>).</li>
      </ul>
    `,
  },
  {
    id: 'deck',
    label: 'Building a Deck',
    html: `
      <h3>Deck identity &amp; the filename</h3>
      <p>The header fields become the export filename, and every export gets a sequential <code>_v{N}</code> suffix (starting at <code>_v1</code>) — a plain re-export becomes <code>_v2</code>, <code>_v3</code>, and so on:</p>
      <p class="help-pre">Message_YY.MM.DD_Series_Title_v1</p>
      <ul>
        <li><strong>Date</strong> → <code>YY.MM.DD</code> (2-digit year).</li>
        <li><strong>Series</strong> and <strong>Title</strong> → PascalCase tokens (spaces and punctuation stripped).</li>
        <li><strong>QR</strong> toggle (Decks → edit this deck) → sets the default for which blanks fire the QR macro (see <em>QR Code</em>). It no longer changes the filename by itself — see <strong>QR Export pair</strong> below.</li>
      </ul>

      <h4>QR Export pair</h4>
      <p>Enable <strong>Preferences → QR Export → "Export both versions when QR is on"</strong> and, whenever the deck's QR toggle is on, pressing Export delivers <em>two</em> presentations in one action — one without QR, one with — sharing the exact same prop collection (no duplicate props written). Both share the <em>same</em> <code>_v{N}</code>, since they're the same version of the deck; the QR one gets an additional <code>_SAT</code> suffix to tell them apart, e.g. <code>..._v7</code> (no QR) and <code>..._v7_SAT</code> (QR). Handy for a Saturday/Sunday pair with otherwise identical content.</p>

      <h4>Adding &amp; ordering slides</h4>
      <ul>
        <li>Add from the sidebar or with <span class="help-kbd">⌘1</span>–<span class="help-kbd">⌘5</span>.</li>
        <li><strong>Drag</strong> slides in the Deck list to reorder. <strong>Start</strong> and <strong>End</strong> stay pinned.</li>
        <li>Click any slide to open its editor; the queue and props recompute automatically on export.</li>
      </ul>

      <h4>Start &amp; End</h4>
      <p>Every deck automatically begins with a <strong>Start</strong> banner and closes with an <strong>End</strong> banner — they carry the Message-Start / logo macros and don't need editing.</p>

      <h4>Speakers</h4>
      <p>The New Deck dialog offers a speaker dropdown. Add recurring names in <strong>Preferences → Speakers</strong>, or type a new one on the spot.</p>

      <div class="help-callout">
        <strong>Quotes are auto-tidied.</strong> Curly quotes from Bible sites or Word are normalized to straight quotes as you type <em>and</em> at export, so what you see matches what ships. DeckPro also warns before export if it spots mismatched or unclosed quotes.
      </div>
    `,
  },
  {
    id: 'scripture',
    label: 'Scripture Slides',
    html: `
      <h3>Scripture</h3>
      <p>A verse or passage slide. Enter the reference and body text by hand, or use <strong>Bible Lookup</strong> to fetch it. Each scripture slide also generates a matching prop for the ${D2}, and embeds the full verse text into its <strong>Slide Notes</strong> so it appears on the ${D3} in Pro7.</p>

      <h4>Bible Lookup</h4>
      <ol class="help-steps">
        <li>Add a free API key in <strong>Preferences → Bible Lookup</strong> (get one at <strong>api.bible</strong>) and click <strong>Fetch</strong> to load your translations.</li>
        <li>Type a reference — <code>John 13:35</code>, <code>2 Corinthians 3:18</code>, <code>Tobit 6:2-4</code>.</li>
        <li>Press <span class="help-kbd">Enter</span> or click <strong>Lookup</strong>. Body and reference fill in automatically.</li>
      </ol>

      <h4>Translations</h4>
      <ul>
        <li>Set a <strong>Default Translation</strong> in Preferences (NLT is the Canvas default).</li>
        <li>Override per slide with the translation picker beside the reference field.</li>
      </ul>

      <h4>Splitting long passages</h4>
      <p>Use <strong>+ Split into another slide</strong> to break a long passage across two (or more) slides. Each part is its own on-screen slide, but the Slide Notes still carry the <em>full</em> passage so the speaker sees everything on the ${D3}.</p>

      <h4>The reference bar</h4>
      <p>The reference (e.g. “John 13:35”) renders as the gold title bar above the verse. Its vertical position auto-adjusts to sit just above the body text.</p>

      <h4>Verses (Bible formatting)</h4>
      <p>The <strong>Verses</strong> button adds verse-number formatting — superscript numbers within the passage. Toggle its visibility in <strong>Preferences → Feature Visibility</strong>.</p>

      <h4>Book-name style</h4>
      <p>In <strong>Preferences → Book Names</strong>, choose how ambiguous names render — <code>1 Corinthians</code> vs <code>First Corinthians</code>, <code>Psalm</code> vs <code>Psalms</code>, <code>Song of Solomon</code> vs <code>Song of Songs</code>. Applied at export and retroactive to all slides.</p>
    `,
  },
  {
    id: 'points',
    label: 'Point Slides',
    html: `
      <h3>Point</h3>
      <p>A message-point slide. Two modes, chosen with the segmented control:</p>

      <h4>Single</h4>
      <p>One static point shown throughout — one prop on the ${D2}. Type the point text; use <span class="help-kbd">⌘B</span> to bold an emphasis phrase.</p>

      <h4>Revealing</h4>
      <p>A building list: one prop per bullet, each revealing the next line progressively while previously-revealed lines stack above (dimmer). Add bullets in the list; bold within any bullet with <span class="help-kbd">⌘B</span>. Set an optional <strong>title</strong> (a dimmed header above the bullets) and a <strong>prop base name</strong> that names the generated prop series.</p>

      <h4>Automatic line breaks</h4>
      <p>Point text is auto-fit: DeckPro sizes the text box to the content and, for multi-line points, breaks the lines intelligently — preferring to split after punctuation (a comma, colon or period) and never stranding a lone short word or a runt like “and” at the end of a line. A point that fits on one line stays on one line. See <em>Fit Width</em> for the full picture.</p>
    `,
  },
  {
    id: 'other-slides',
    label: 'Blank · Image · Custom',
    html: `
      <h3>Blank</h3>
      <p>A black / empty slide. Optionally give it ${D3} text (bold supported). Blanks are also inserted automatically by the <strong>Blank Before</strong> toggle on scripture and point slides — see <em>Slide Notes &amp; Blank Before</em>.</p>

      <h3>Image</h3>
      <p>A slide with a background image pulled from your Pro7 media library. Give it a label; reference the media by name.</p>

      <h3>Custom</h3>
      <p>An escape hatch. A Custom slide exports as a <strong>blank slot carrying your label</strong> — a placeholder you finish by hand in ProPresenter (a video, a special graphic, anything DeckPro doesn't model). It still holds its place in the deck order, queue, and any macro/stage triggers you attach.</p>
    `,
  },
  {
    id: 'notes',
    label: 'Notes & Blank Before',
    html: `
      <h3>Slide Notes → the ${D3}</h3>
      <p>DeckPro writes each slide's content into its ProPresenter <strong>Slide Notes</strong>, which drive the ${D3}. Scripture slides embed the full passage (even across splits) so the speaker always sees the whole verse — no fragile off-screen elements required.</p>

      <h3>Blank Before</h3>
      <p>Toggle <strong>Blank Before</strong> on a scripture or point slide to auto-insert a black slide immediately ahead of it. The inserted blank's notes <strong>auto-populate from the upcoming slide</strong>, so the ${D3} previews what's coming while the screen is dark.</p>
      <ul>
        <li>Optionally type your own text to show <em>during</em> the blank.</li>
        <li>Toggle <strong>Show prop during blank</strong> to keep the ${D2} prop up while the main screen is black.</li>
      </ul>
      <p class="help-muted">Hide the Blank Before or ${D3} fields in <strong>Preferences → Feature Visibility</strong> for a simpler editor.</p>
    `,
  },
  {
    id: 'overrides',
    label: 'Per-Slide Overrides',
    html: `
      <h3>Overrides</h3>
      <p>Each content slide has an <strong>Overrides</strong> disclosure for one-off tweaks that don't belong to the whole style:</p>
      <ul>
        <li><strong>Prop Name</strong> — rename the generated prop / its ${D2} match name.</li>
        <li><strong>Transition Override</strong> — a specific transition for this slide's main-screen change, instead of the style's default.</li>
        <li><strong>Prop Transition Override</strong> — same, for the ${D2} prop.</li>
        <li><strong>Macro Override</strong> — fire a specific configured macro on this slide.</li>
        <li><strong>Stage Layout</strong> — trigger a specific stage-display layout when this slide comes up.</li>
      </ul>
      <p class="help-muted">Any override row can be hidden via <strong>Preferences → Feature Visibility → Overrides</strong>. Style-wide macros and stage layouts (which fire by slide <em>type</em>) live in the Styles editor instead — see <em>Macros &amp; Stage</em>.</p>
    `,
  },
  {
    id: 'responsecard',
    label: 'Response Card',
    html: `
      <h3>Response Card</h3>
      <p>Enable <strong>Response Card</strong> for a deck and DeckPro appends the full response-card package before the End slide — the hold slide, the decision prompt, and Response 1 / 2 / 3, each linked to the <strong>Response Card</strong> prop on the ${D2}.</p>
      <ul>
        <li>The hold and card slides automatically trigger the <strong>Response Card stage layout</strong> and the Message-Blank macro, so your stage display and lighting switch on cue.</li>
        <li>The three response lines come from the deck's Response Card fields; everything else (positions, fonts) is defined in the style's <strong>Response Card</strong> tab — see <em>LED Wall &amp; Inheritance</em>.</li>
      </ul>
    `,
  },
  {
    id: 'palettes',
    label: 'Styles: Overview',
    html: `
      <h3>Styles &amp; the three tiers</h3>
      <p>A <strong>style</strong> defines every visual aspect of the generated slides — fonts, sizes, colours, positions, animations, macros, stage layouts. Open the editor from <strong>···&nbsp;→&nbsp;Styles</strong>. Styling cascades through three tiers, broad to specific:</p>
      <ul>
        <li><strong>Global</strong> — the house-style baseline, shared by every style. Read-only here (shown as <strong>◈&nbsp;Global</strong> in the style picker); you change it by pushing a value up from a style.</li>
        <li><strong>Style</strong> — base fonts and colours for this style, cascading to all its fields.</li>
        <li><strong>Custom</strong> — per-field overrides on top (a specific size, colour, position, transition…).</li>
      </ul>

      <h4>Reading the colours</h4>
      <p>Throughout the editor, <span class="help-pill help-pill-blue">blue</span> means a value is <strong>inheriting</strong> (from Global, or from Display&nbsp;1), and <span class="help-pill help-pill-orange">orange</span> means it's a <strong>custom override</strong>. Untouched fields inherit; the moment you change one it turns orange.</p>

      <h4>Managing values (right-click a cell)</h4>
      <ul>
        <li><strong>Reset to Global</strong> — drop a custom override and inherit again.</li>
        <li><strong>Push to Global</strong> — send this value up so every inheriting style adopts it.</li>
        <li><strong>Reset to Display 1</strong> — hand an ${D2} row back to inheriting the main screen (see <em>LED Wall</em>).</li>
      </ul>

      <h4>Style toolbar</h4>
      <ul>
        <li><strong>New</strong> — a fresh style that inherits everything from Global.</li>
        <li><strong>Duplicate</strong> — copy the current style's exact values.</li>
        <li><strong>Delete</strong>, <strong>Lock</strong> (🔓/🔒 — protect a style from edits).</li>
      </ul>

      <h4>Tabs</h4>
      <p><strong>Style</strong> (base fonts/colours) · <strong>Text</strong> · <strong>Layout</strong> · <strong>Motion</strong> · <strong>Macros</strong> · <strong>Stage</strong> · <strong>Response Card</strong>. Each is covered in the next sections.</p>
    `,
  },
  {
    id: 'text-layout',
    label: 'Text & Layout',
    html: `
      <h3>Text tab</h3>
      <p>A grid of every text element, grouped by output. Each row sets font family &amp; style, colour, size, <strong>B</strong>/<strong>I</strong>/<strong>U</strong>/strikethrough, capitalization, scale behaviour, horizontal &amp; vertical alignment, plus advanced styling (character spacing, line height, paragraph spacing, margins, stroke, shadow).</p>
      <ul>
        <li><strong>${D1} (main screen):</strong> Body, Bold (emphasis), Title, Point, RC Body, RC Title.</li>
        <li><strong>${D2} (LED wall props):</strong> Body, Bold, Title, Point, Point Stacked.</li>
        <li><strong>${D3}:</strong> Slide Notes, Notes Alt.</li>
        <li><strong>Utility:</strong> Start/End banner, Live badge, Queue sidebar.</li>
      </ul>
      <p class="help-muted">Right-click any cell for Reset / Push / Reset-to-Display-1. Blue cells inherit, orange cells override.</p>

      <h3>Layout tab</h3>
      <p>The X / Y / W / H bounds of every element, on both canvases — the main <strong>1920×1080</strong> screen and the <strong>${D2}</strong> prop canvas (3200×1280).</p>
      <ul>
        <li><strong>Alignment buttons</strong> — six per row (left/center/right, top/middle/bottom). Click one to snap X or Y to that canvas position; the active one lights orange. Full-width elements show “center” active.</li>
        <li><strong>Auto&nbsp;Y</strong> — on the Title and Prop Title rows, calculates Y automatically to sit just above the body box (body&nbsp;Y − title&nbsp;H − gap). Uncheck for a fixed Y.</li>
      </ul>
      <div class="help-callout">
        <strong>Fit Width interacts with Layout.</strong> On scripture and point slides, DeckPro can shrink the body box to fit the text — but never wider than the Body width you set here. That width is the ceiling. See <em>Fit Width</em>.
      </div>
    `,
  },
  {
    id: 'motion',
    label: 'Motion',
    html: `
      <h3>Motion tab</h3>
      <p>Two sub-tabs control animation.</p>
      <h4>Transitions</h4>
      <p>The default transition <strong>type</strong> and <strong>duration</strong> for the main screen and, separately, for the ${D2} prop. Individual slides can override these in their Overrides section.</p>
      <h4>Build Order</h4>
      <p>Per slide type (Content, Point, Blank, Start/End), the order and animation in which a slide's elements — body, title, live — build in or out. Each build tab holds its own ordered rows. (The bottom gradient isn't in this list — it's a Pro7 macro, not a DeckPro element; see <em>QR Code</em> and <em>Macros &amp; Stage</em> for the Gradient macro fields.)</p>
      <p>Each row's <strong>Start</strong> option is constrained to match how ProPresenter's own build order actually works: the <em>first</em> row in a list can only start <strong>After Transition</strong> or <strong>On Click</strong> — there's no earlier item for it to start "with" or "after." Every row after that can only start <strong>On Click</strong>, <strong>With Previous</strong>, or <strong>After Previous</strong>, always referencing the row directly above it. Reordering, adding, or deleting rows automatically corrects any row left with an invalid Start for its new position.</p>
      <p class="help-muted">Like everything else, Motion values inherit Global by default (blue) until you override them (orange), with Reset / Push on each.</p>
    `,
  },
  {
    id: 'macros-stage',
    label: 'Macros & Stage',
    html: `
      <h3>Macros tab</h3>
      <p>Per-style Pro7 macro triggers. Click <strong>+ Add Macro</strong> to import macros live from ProPresenter, then give each one <strong>triggers</strong>:</p>
      <ul>
        <li><strong>Slide-type chips</strong> — fire the macro on every Scripture / Point / Blank / Image / Custom slide.</li>
        <li><strong>Slide&nbsp;#</strong> position triggers — fire on specific slide positions (type a number, press Enter).</li>
      </ul>

      <h4>Gradient</h4>
      <p>A dedicated single macro field, separate from the per-trigger list above — the macro that fires on Scripture, Point, and Response Card content cues. It's deck-wide, not per-style, since it's a real macro rather than visual style — same reasoning as QR Macro. See <em>QR Code</em> for the matching <strong>Gradient (QR code version)</strong> field, which fires instead whenever that export's QR toggle is on.</p>

      <h3>Stage tab</h3>
      <p>Per-style stage-display layouts, same model as Macros. <strong>+ Add Stage Display</strong> picks any Pro7 stage layout; assign it slide-type and/or Slide&nbsp;# triggers. The <strong>Stage Screen</strong> row at the top identifies the physical display these layouts target.</p>

      <div class="help-callout">
        <strong>Whole-list inheritance.</strong> A style's Macros / Stage lists inherit Global's list live until you edit them — the first change forks a private copy (an orange “Custom” badge appears). <strong>Reset to Global</strong> returns to inheriting; <strong>Push to Global</strong> shares your list with every inheriting style.
      </div>
      <p class="help-muted">Import your machine's macros and layouts once via <strong>···&nbsp;→&nbsp;Machine Setup</strong>.</p>
    `,
  },
  {
    id: 'ledwall',
    label: 'LED Wall & Inheritance',
    html: `
      <h3>${D2} inherits ${D1}</h3>
      <p>By default the ${D2} (Display&nbsp;2) follows the main screen. Every ${D2} text style — Body, Bold, Title, Point — plus the <strong>Response Card</strong> text (RC Body → Body, RC Title → Title) starts out <strong>inheriting its main-screen counterpart, live</strong>. Style the main screen and the LED wall follows automatically.</p>
      <ul>
        <li>Change any ${D2} cell and it becomes its own <strong>override</strong> (orange) — keeping whatever it was inheriting as the starting point, so nothing jumps.</li>
        <li>Right-click an overridden ${D2} row → <strong>Reset to Display 1</strong> to hand it back to inheriting.</li>
        <li>Fonts and sizes already inherited when left blank; this covers the advanced styling too (colour, italic/underline, alignment, margins, stroke, shadow).</li>
      </ul>

      <h3>Response Card tab</h3>
      <p>Defines the elements on the ${D2} response card (Display&nbsp;2): a Title, the Decision prompt, and Response 1–3, plus any custom elements. Each has an editable name (its Pro7 object name), text, position (X/Y/W/H) and style. The Decision and Response 1–3 <em>text</em> comes from the deck's Response Card item; everything else is set here.</p>
      <p class="help-muted">Existing styles keep their current ${D2} look untouched — only new styles start out inheriting. Point Stacked (the dimmed revealed bullets) has no main-screen twin, so it stays independent.</p>
    `,
  },
  {
    id: 'fitwidth',
    label: 'Fit Width',
    html: `
      <h3>What Fit Width does</h3>
      <p>Long body text stretched edge-to-edge is hard to read. <strong>Fit Width</strong> shrinks the text box to fit the content and chooses the best place to break each line — so short lines aren't stretched and words don't wrap awkwardly.</p>

      <h4>How it decides</h4>
      <p>Rather than one rigid rule, DeckPro tries many box widths, reads how each one breaks the text into lines, and scores every option. Lower score wins. It prefers:</p>
      <ul>
        <li>Fewer lines.</li>
        <li>No <strong>orphan</strong> — a lone short word stranded on the last line.</li>
        <li>Not splitting a <strong>bold/emphasis phrase</strong> across two lines — though it still will if that's what it takes to keep the other lines a consistent length (see below).</li>
        <li><strong>Scripture/body:</strong> the last line shouldn't come out conspicuously shorter than the lines above it — specifically, less than a third of their average width.</li>
        <li><strong>Points:</strong> every line, including the last, is scored for evenness — DeckPro tries to keep all lines close to the same length.</li>
        <li>For points: breaking <strong>after punctuation</strong> (. ! ? … : ;&nbsp;,) rather than mid-clause, and not ending a line on a runt word (“and”, “the”, “through”).</li>
      </ul>

      <h4>Scripture vs. Point</h4>
      <ul>
        <li><strong>Scripture</strong> — toggle the <strong>Fit Width</strong> button on the slide. <strong>Strip</strong> (remove newlines) can be combined with it: with both on, the box is sized to fit the flattened (newline-free) text rather than the original poetry line lengths, so display 1 can run more horizontally while display 2 keeps the original line breaks.</li>
        <li><strong>Point</strong> — on by default (toggle above the Point Text / Bullets box, next to no reason to turn it off), DeckPro can insert real line breaks to split cleanly after punctuation (e.g. one line per comma). A point that fits on one line stays on one line — breaks are never forced just because punctuation exists.</li>
        <li><strong>Revealing points</strong> — every bullet in the sequence shares one box, so it's sized off the <em>widest</em> bullet in the list rather than just the first, and that same size is held across every reveal step. That keeps the box static as bullets are revealed one at a time, instead of resizing slide to slide.</li>
      </ul>

      <div class="help-callout">
        <strong>The width cap.</strong> Fit Width can only ever <em>shrink</em> the box — never grow it past the Body width set in the style's Layout tab. Widen the ceiling there if you need more room.
      </div>

      <h4>Display 2 (LED wall)</h4>
      <p><strong>+ Display 2</strong> (next to Fit Width, only shown while Fit Width itself is on) fits that slide's LED-wall box to its content too — on by default for new slides, alongside Fit Width. It runs its own independent search using Display 2's own font size, canvas, and body width — it does not copy whatever Display 1 computed.</p>
      <p>Turn it off on a slide where you've hand-positioned the Display 2 box for a specific screen or NDI feed and want it left exactly where you put it — DeckPro will render that box at your style's configured prop width, exactly as if Fit Width didn't exist. Turning Fit Width off resets this sub-toggle too.</p>
    `,
  },
  {
    id: 'qrcode',
    label: 'QR Code',
    html: `
      <h3>QR Code is a macro, not an image</h3>
      <p>DeckPro doesn't draw a QR code onto any slide. Instead, it fires a single configured <strong>macro</strong> — whatever your show actually uses to display the QR code (Companion, Resolume, an ATEM macro, etc.) — on the blank slides you want it to appear on.</p>

      <h4>Setup — three pieces</h4>
      <ul>
        <li><strong>Pick the macro.</strong> Styles → <em>QR Code</em> tab → Pick Macro. One deck-wide setting, not per-style — the macro that shows a QR code doesn't change with visual style.</li>
        <li><strong>This deck's QR toggle.</strong> Decks → edit this deck → the QR toggle. Off by default. When on, it sets the <em>default</em> for every blank in the deck — before the QR Stop marker (see below), blanks default to firing the macro; after it, they default to not.</li>
        <li><strong>Per-slide QR toggle.</strong> Next to "Blank slide before this one" on scripture, point, and image slides. Overrides the auto default for that one blank specifically, and keeps that choice even if you later move the QR Stop marker or flip the deck's QR toggle.</li>
      </ul>

      <h4>QR Stop marker</h4>
      <p>Add <strong>QR Stop</strong> from the sidebar — it renders as a striped divider, not a real slide (it never exports). Drag it anywhere in the deck. Blanks before it default to QR on (when the deck's QR toggle is on); blanks at or after it default to off. It's purely a bulk-default boundary — any blank you've touched with its own QR toggle ignores it entirely.</p>

      <div class="help-callout">
        <strong>Manual always wins.</strong> Once you've clicked a slide's own QR toggle, that choice is locked in — moving the marker or flipping the deck-wide toggle later never changes it again. Only untouched blanks follow the auto default.
      </div>

      <h4>Gradient (QR code version)</h4>
      <p>A second macro field alongside QR Macro — fires on Scripture, Point, and Response Card content cues <em>instead of</em> the normal Gradient macro (Macros tab) whenever this export's QR toggle is on, so the no-QR and QR files can each use a different background treatment. In a paired export (see <em>Building a Deck</em>), the no-QR file always uses the normal Gradient and the QR file always uses this one.</p>
    `,
  },
  {
    id: 'library',
    label: 'Deck Library',
    html: `
      <h3>Deck Library</h3>
      <p>The <strong>Decks</strong> button opens your library. Every deck lives in a local database with automatic daily backups.</p>
      <h4>Finding decks</h4>
      <ul>
        <li><strong>Search</strong> by series, title, speaker or date.</li>
        <li><strong>Filters</strong> — Decks, Templates, Archived, Trash.</li>
        <li><strong>Sort</strong> by date, series (grouped) or last updated.</li>
      </ul>
      <h4>Deck actions (⋯ on a deck)</h4>
      <ul>
        <li><strong>Edit Info</strong> — series, title, speaker, date, QR toggle.</li>
        <li><strong>Duplicate</strong> — start a new deck from a copy.</li>
        <li><strong>Save as Template</strong> — reuse a structure; pick it under “Start from” when creating a deck.</li>
        <li><strong>Archive</strong> — tuck away without deleting.</li>
        <li><strong>Delete</strong> — moves to Trash; restore or delete forever from there.</li>
      </ul>
      <h4>Status at a glance</h4>
      <p>Each deck shows when it was last exported and whether it's been edited since — so you always know what's actually live in Pro7.</p>
      <h4>Sharing across computers</h4>
      <p>In <strong>Preferences → Deck Library</strong>, point the library at an iCloud Drive, Dropbox or shared folder. Another Mac pointing at the same folder joins the same library. If the same deck is edited in two places, DeckPro detects the conflict and asks which version to keep.</p>
    `,
  },
  {
    id: 'export',
    label: 'Exporting',
    html: `
      <h3>Exporting to Pro7</h3>
      <p>Press <strong>Export</strong> (<span class="help-kbd">⌘E</span>). DeckPro always writes directly into ProPresenter — the deck into your library and all its props into Pro7's props configuration, in one step.</p>

      <div class="help-callout help-callout-warn">
        <strong>ProPresenter must not overwrite the export.</strong> Pro7 rewrites its props config when it quits, which would undo DeckPro's write. Two ways to stay safe:
        <ul>
          <li><strong>Auto-manage</strong> (recommended) — in Preferences, turn on “Auto-manage ProPresenter on export.” DeckPro quits Pro7 (clicking through its "Are you sure you want to quit?" dialog if it appears), writes everything, and relaunches it for you. Turning this on asks macOS for the Accessibility permission it needs, the first time — approve it in the system prompt so the auto-quit can actually click that dialog.</li>
          <li><strong>Manual</strong> — close ProPresenter yourself first; DeckPro warns you if it's still open, then reopen it after.</li>
        </ul>
      </div>

      <h4>What gets written</h4>
      <ul>
        <li>A <code>Message_YY.MM.DD_Series_Title.pro</code> presentation in your chosen Pro7 library.</li>
        <li>All prop slots in Pro7's Configuration/Props — active slides get real content, unused slots get empty placeholders.</li>
        <li>A <strong>DeckPro</strong> collection folder in the Props panel, kept in sync. Your other prop collections are preserved byte-for-byte.</li>
      </ul>

      <h4>Merge or Override — when Pro7 has hand-edits</h4>
      <p>If you tweak something directly in ProPresenter after DeckPro exported a deck — resize a text box, retint a fill, retype a verse or point, tweak a macro — the <em>next</em> export detects it and pauses before writing anything, showing exactly what changed: which file, which slide, which element, which property, old value → new value.</p>
      <ul>
        <li><strong>Merge</strong> — carries those Pro7 edits forward into the new version, alongside whatever content changes you made in DeckPro.</li>
        <li><strong>Override</strong> — exports fresh from DeckPro's own data and lets the Pro7 edits go.</li>
      </ul>
      <p>This covers anything a hand-edit could touch — position, size, colour, font, macros, props, elements added or removed entirely in Pro7 — and text content itself is safely reconstructed (not just flagged) for every real text field: Scripture body and reference-bar text, Point body text, Response Card text, and Start/End banners, bold emphasis included wherever it applies. A QR paired export tracks and merges its no-QR and QR files independently, since either one could be hand-edited on its own.</p>
      <div class="help-callout">
        <strong>Needs a baseline to compare against.</strong> Detection works by diffing what's currently in Pro7 against a snapshot DeckPro saved the last time <em>it</em> wrote that file. A deck's very first export — or one from before this feature existed — has nothing to compare against yet, so the very next export after that just proceeds normally. Detection kicks in starting from the export after that.
      </div>

      <h4>After exporting</h4>
      <p>Open ProPresenter — the deck and its props are there. Recent exports are logged under <strong>···&nbsp;→&nbsp;Export History</strong>; click the folder icon to reveal a file in Finder.</p>
    `,
  },
  {
    id: 'pro7',
    label: 'Pro7 & Machine Setup',
    html: `
      <h3>Connecting to ProPresenter</h3>
      <p>DeckPro talks to a running Pro7 on your network to read live macros, stage layouts and prop data.</p>
      <ol class="help-steps">
        <li>In ProPresenter: <strong>Preferences → Network → Enable Network API</strong>. Note the port (default <strong>1025</strong>) and any password.</li>
        <li>In DeckPro <strong>Preferences → Pro7 Connection</strong>: enter the same port and password, click <strong>Check</strong>.</li>
        <li>The header dot turns green when connected.</li>
      </ol>

      <h4>Pro7 Folder &amp; Export Library</h4>
      <ul>
        <li><strong>Pro7 Folder</strong> — the folder containing <code>Configuration</code> and <code>Libraries</code> (often <code>Documents/ProPresenter</code>).</li>
        <li><strong>Export Library</strong> — which library new <code>.pro</code> files land in. Auto-select follows Pro7's active library.</li>
      </ul>

      <h3>Machine Setup</h3>
      <p>Open <strong>···&nbsp;→&nbsp;Machine Setup</strong> for a one-time, per-computer checklist:</p>
      <ul>
        <li><strong>Pro7 Connection</strong> — port &amp; password.</li>
        <li><strong>Pro7 Folder</strong> — pick or auto-detect.</li>
        <li><strong>Bible Lookup</strong> — paste your API.Bible key.</li>
        <li><strong>Macros &amp; Stage Displays</strong> — import from the connected Pro7.</li>
        <li><strong>Path scan</strong> — confirms everything resolves.</li>
      </ul>
      <p class="help-muted">Machine-specific settings (Pro7 paths, password, export folder, API keys, theme) stay on this computer; styles and shared preferences can sync via iCloud.</p>
    `,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    html: `
      <h3>Preferences</h3>
      <p>Open with <strong>···&nbsp;→&nbsp;Preferences</strong>.</p>
      <ul>
        <li><strong>Deck Library</strong> — where decks are stored; point at a shared folder to sync across Macs.</li>
        <li><strong>iCloud Sync</strong> — keep styles and portable preferences in step across your Macs.</li>
        <li><strong>Display Names</strong> — rename Display 1 / 2 / 3 (e.g. “${D1}”, “${D2}”, “${D3}”). Your names appear everywhere in the app.</li>
        <li><strong>Speakers</strong> — recurring names for the New Deck dropdown.</li>
        <li><strong>Queue</strong> — the upcoming-slide format on the queue sidebar: Next Reference Only · Next Reference + First Phrase · Full List.</li>
        <li><strong>Pro7 Connection</strong> — port, password, folder, library, auto-manage.</li>
        <li><strong>Feature Visibility</strong> — hide advanced fields (Blank Before, ${D3} text, Prop Name, Overrides, Fit Width/Strip, Verses) for simpler handoffs. Hiding never changes what's exported.</li>
        <li><strong>Bible Lookup</strong> — API key &amp; default translation.</li>
        <li><strong>Book Names</strong> — ambiguous book-name styling.</li>
      </ul>
    `,
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    html: `
      <h3>Common issues</h3>
      <ul>
        <li><strong>Export didn't show up in Pro7</strong> — Pro7 was open and overwrote it on quit. Turn on Auto-manage, or close Pro7 before exporting.</li>
        <li><strong>Bible Lookup fails</strong> — check the API key in Preferences and that the translation is available on your account (click Fetch).</li>
        <li><strong>Not connected (dot is red)</strong> — confirm Pro7 is running with Network API enabled, and the port/password match.</li>
        <li><strong>Macros / stage layouts empty</strong> — connect to Pro7, then import via Machine Setup.</li>
        <li><strong>Quote-mismatch warning</strong> — DeckPro found straight/curly quote inconsistency or an unclosed quote. Fix the flagged slide before exporting.</li>
      </ul>

      <h4>Diagnostic bundle</h4>
      <p><strong>···&nbsp;→&nbsp;Export Diagnostic Bundle</strong> saves a JSON snapshot for troubleshooting — app version, platform, settings (with your API key and Pro7 password <em>excluded</em>; only a yes/no that they're set), a deck &amp; style summary, macro setup, Pro7/library status, recent export history, and a rolling log of the last 50 things the app showed you (every success/error/warning toast, plus any JS errors) with timestamps — a "what just happened" trail, not just a snapshot of current state. Hand this over when reporting a problem instead of screenshots.</p>

      <h4>Updates</h4>
      <p><strong>Check for Updates…</strong> pulls the latest release.</p>
    `,
  },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    html: `
      <h3>Keyboard Shortcuts</h3>
      <table class="help-shortcuts-table">
        <tbody>
          <tr class="help-shortcuts-group"><td colspan="2">File</td></tr>
          <tr><td><span class="help-kbd">⌘N</span></td><td>New Deck</td></tr>
          <tr><td><span class="help-kbd">⌘O</span></td><td>Deck Library</td></tr>
          <tr><td><span class="help-kbd">⌘E</span></td><td>Export</td></tr>
          <tr><td><span class="help-kbd">⌘⇧R</span></td><td>Redeploy app</td></tr>
          <tr class="help-shortcuts-group"><td colspan="2">Edit</td></tr>
          <tr><td><span class="help-kbd">⌘Z</span></td><td>Undo</td></tr>
          <tr><td><span class="help-kbd">⌘⇧Z</span></td><td>Redo</td></tr>
          <tr class="help-shortcuts-group"><td colspan="2">Add Slide</td></tr>
          <tr><td><span class="help-kbd">⌘1</span></td><td>Add Scripture</td></tr>
          <tr><td><span class="help-kbd">⌘2</span></td><td>Add Point</td></tr>
          <tr><td><span class="help-kbd">⌘3</span></td><td>Add Blank</td></tr>
          <tr><td><span class="help-kbd">⌘4</span></td><td>Add Image</td></tr>
          <tr><td><span class="help-kbd">⌘5</span></td><td>Add Custom</td></tr>
          <tr class="help-shortcuts-group"><td colspan="2">View</td></tr>
          <tr><td><span class="help-kbd">⌘⇧D</span></td><td>Toggle dark mode</td></tr>
          <tr class="help-shortcuts-group"><td colspan="2">Text Editing</td></tr>
          <tr><td><span class="help-kbd">⌘B</span></td><td>Bold (in rich-text body fields)</td></tr>
          <tr><td><span class="help-kbd">⌘I</span></td><td>Italic</td></tr>
          <tr><td><span class="help-kbd">⌘U</span></td><td>Underline</td></tr>
          <tr><td><span class="help-kbd">Enter</span></td><td>Bible Lookup — fetch verse</td></tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'tech',
    label: 'Technical Reference',
    html: `
      <h3>Technical Reference</h3>
      <p class="help-muted">For developers and maintainers. How DeckPro turns a form into a valid Pro7 file.</p>

      <h4>Architecture</h4>
      <ul>
        <li><strong>Electron + Express.</strong> <code>node server.js</code> serves the UI; Electron wraps it (<code>main.js</code> holds the native menu &amp; accelerators).</li>
        <li><strong>Client:</strong> <code>public/app.js</code> — the whole editor, style engine, Fit Width, and spec builder (<code>buildSpec()</code>).</li>
        <li><strong>Server build chain:</strong> <code>builder.js</code> (presentation) + <code>buildProp.js</code> (props) + <code>rtf.js</code> (text) + <code>encode.js</code> (protobuf) → <code>.pro</code> files.</li>
      </ul>

      <h4>File format</h4>
      <ul>
        <li><code>.pro</code> files are <strong>protobuf binary</strong> — presentations are <code>rv.data.Presentation</code>, props are <code>rv.data.PropDocument</code> (schema under <code>ProPresenter7-Proto/</code>).</li>
        <li>All props for a deck go in one <code>{name}_Props.pro</code>; each prop is a <strong>cue</strong>, matched to the presentation by <code>parameterName</code> = <code>cue.name</code> (not by UUID).</li>
        <li>Text is <strong>base64-encoded RTF</strong> in <code>element.text.rtfData</code>. Bold = font switch (Montserrat-Medium ↔ Montserrat-Black). A <code>\\n</code> becomes an RTF hard line break — how point punctuation-splitting is emitted.</li>
      </ul>

      <h4>Build pipeline (buildPresentation)</h4>
      <ol class="help-steps">
        <li>Expand slides → raw cues (blank-before injection, multi-body scripture, revealing bullets).</li>
        <li>Append Response Card cues before End (if enabled).</li>
        <li>Inject the Message-Content macro; fire the configured QR macro on blank-before cues whose slide had <code>qrOn</code> (computed client-side — see <em>QR Code</em>); fire the Gradient macro (or its QR-version counterpart, based on <code>spec.qrCode</code>) on Scripture/Point/RC-content cues; inject the queue element into every cue.</li>
      </ol>

      <h4>Default element bounds (1920×1080)</h4>
      <p class="help-muted">These are the <em>default style's</em> values, editable per-style in the Layout tab — not fixed constants. Builder reads them from the resolved scheme; the real defaults live in builder's <code>DEFAULT_STYLE</code>, and the make-functions' inline fallbacks are neutral <code>0/0/100/100</code> placeholders that are never reached in normal exports.</p>
      <ul>
        <li>Body: y=729.98, h=350.02 (bottom third). Fit Width varies x/w within the style's Body width.</li>
        <li>Title (scripture ref): full-width bar; Auto&nbsp;Y places it just above the body.</li>
        <li>live: x≈1737, y≈1097 (below the canvas — the ${D3} badge).</li>
        <li>Queue sidebar: x=0, w≈400, full height.</li>
        <li><strong>Hardcoded (not in the Layout tab):</strong> the QR image (x=0, y≈655, ~424²) in <code>builder.js</code>. The bottom gradient is <em>not</em> generated by DeckPro at all — it's driven by a Pro7 macro.</li>
      </ul>

      <h4>Style resolution &amp; inheritance</h4>
      <ul>
        <li><strong>Global → Style → Custom.</strong> A field of <code>null</code> means “inherit”; a concrete value means “override.” Editing a null field <em>forks</em> it (materializes the inherited value first) so nothing jumps.</li>
        <li><code>styleForExport(scheme)</code> is the single resolution point: fills null layout/motion/RC-element fields from Global, then resolves ${D2} advanced styling from its Display&nbsp;1 counterpart via the <code>D2_ADV_INHERIT</code> map (propBody→body, propPoint→point, propTitle→title, propBold→bold, rcBody→body, rcTitle→title).</li>
        <li>Macros / stage displays / build orders / RC elements use <strong>whole-list inherit</strong> (null = inherit Global's list live; any edit forks a private copy).</li>
      </ul>

      <h4>Fit Width internals</h4>
      <ul>
        <li><code>computeOptimalBodyWidth(spans, scheme, type)</code> measures in a hidden DOM node at the resolved font/size (Point uses pointSize + weight 900), sweeps candidate widths (12px steps), and scores each layout with the tunable <code>FIT_WEIGHTS</code> block via <code>_fitScore(lines, words, boxW, type)</code>.</li>
        <li>The last-line term is type-dependent: points score raggedness across every line (<code>raggedPerPx</code>); scripture/body instead adds <code>shortLast</code> only when the last line falls under <code>shortLastRatio</code> (1/3) of the average width of the lines above it.</li>
        <li>For points it also proposes punctuation-only break layouts; if one wins and box-width alone can't reproduce it, it emits hard breaks as <code>bodyDisplayText</code> (main-screen body only — notes/queue/prop keep the unbroken text). Revealing points don't get hard breaks, only single-mode.</li>
        <li><code>computeSlideFitWidth(slide, scheme)</code> is the shared entry point used by both the per-slide toggle and the pre-export batch recompute. For scripture it strips newline spans first when Strip is also on; for revealing points it runs every bullet through <code>computeOptimalBodyWidth</code> and keeps the widest result, since all reveal cues share one <code>bodyW</code>/<code>bodyX</code> in <code>buildPointCues()</code>.</li>
        <li><code>computeOptimalBodyWidth(spans, rs, type, display)</code>'s <code>display</code> param (<code>'main'</code>|<code>'prop'</code>) selects Display 2's own canvas size/font size/body-width ceiling instead of Display 1's. <code>computeSlideFitWidth</code> only runs the <code>'prop'</code> search when <code>slide.propFitWidth</code> is true (the "+ Display 2" sub-toggle, only shown while <code>slide.fitWidth</code> is on — defaults to <code>true</code> on new slides, same as <code>fitWidth</code>, but is a genuinely independent flag: turn it off per-slide to leave a hand-tuned custom Display 2 box alone). It's independent rather than hard-coupled to <code>slide.fitWidth</code> because that was tried first and reverted — it silently resized/recentered custom Display 2 boxes the moment Display 1's Fit Width was turned on, with no way to opt out.</li>
        <li>Highlighted/emphasis (<code>alt</code>) text is rendered with ordinary spaces in the exported RTF — earlier builds substituted <code>\~</code> (RTF non-breaking space) for every space inside an <code>alt</code> span, which silently blocked ProPresenter from ever wrapping inside a highlighted phrase regardless of what Fit Width computed. That substitution is gone; <code>highlightSplit</code> in <code>FIT_WEIGHTS</code> is now the only thing discouraging (not preventing) a split there.</li>
      </ul>

      <h4>Merge/Override internals</h4>
      <ul>
        <li><code>diffPresentation.js</code>: <code>diffPresentations(baseline, current)</code> deep-diffs two decoded <code>rv.data.Presentation</code> objects — cues matched by index, elements within a cue matched by stable <code>name</code>. Any field shaped like a UUID reference (not just literally named <code>uuid</code>) is skipped on both sides, since builder.js mints a fresh one every export; a UUID going from present to absent is still reported. <code>applyChanges(target, changes, style)</code> reapplies changes onto a freshly-built structure the same way, using <code>textMergeKindFor(slideType, elementName)</code> to pick which renderer (if any) can safely reconstruct a given text field's <code>rtfData</code> — see there for the exact list and why some fields are still detect-only.</li>
        <li><code>rtf.js</code>: <code>parseRtfSpans()</code> / <code>parsePointBodySpans()</code> are the reverse of the span-based encoders (<code>rtfBody</code>/<code>rtfPointBody</code> respectively) — rtfPointBody's per-span format (a repeated self-contained <code>\\f0\\b0\\fsN</code>/<code>\\f1\\bfsN</code> marker on every span, no shared state) is genuinely different from rtfBody's state-machine toggling, hence the separate parser.</li>
        <li><code>library.js</code> stores one snapshot per export "role" (<code>single</code>/<code>noQr</code>/<code>qr</code>) — the decoded shape of whatever DeckPro last wrote — as the baseline the next export's hand-edit check diffs the currently-installed file against.</li>
        <li>Classifying a cue by element names alone is a trap: Start/End/Response-Card-Hold cues also name their text element <code>body</code> (rendered via <code>rtfStartEnd</code>, not <code>rtfBody</code>) — the real discriminator is whether a <code>live</code> element is present (scripture/point/response-card have one, Start/End never does).</li>
      </ul>

      <h4>Tests</h4>
      <p><code>npm test</code> runs the RTF, builder, prop, verse-chain, encode, golden-master and fuzz suites plus a scheme-field audit — every build is gated by them.</p>

      <p class="help-muted">Deeper notes live in <code>CLAUDE.md</code> at the repo root (element styles, macro UUIDs, RTF specifics, the full spec shape).</p>
    `,
  },
]; }

function initHelp() {
  const modal  = document.getElementById('help-modal');
  const nav    = document.getElementById('help-nav');
  const body   = document.getElementById('help-body');
  const close  = document.getElementById('help-modal-close');
  const search = document.getElementById('help-search');
  const noRes  = document.getElementById('help-no-results');
  if (!modal) return;

  nav.innerHTML = helpSections().map((s, i) =>
    `<button class="help-nav-btn${i === 0 ? ' active' : ''}" data-section="${s.id}">${s.label}</button>`
  ).join('');

  body.innerHTML = helpSections().map((s, i) =>
    `<div class="help-section${i === 0 ? ' active' : ''}" id="help-sec-${s.id}">${s.html}</div>`
  ).join('');

  nav.addEventListener('click', e => {
    const btn2 = e.target.closest('.help-nav-btn');
    if (!btn2) return;
    nav.querySelectorAll('.help-nav-btn').forEach(b => b.classList.remove('active'));
    body.querySelectorAll('.help-section').forEach(s => s.classList.remove('active'));
    btn2.classList.add('active');
    document.getElementById(`help-sec-${btn2.dataset.section}`)?.classList.add('active');
    body.scrollTop = 0;
  });

  // Full-text search across all sections. Empty query → tabbed mode.
  function runSearch() {
    const q = (search?.value || '').trim().toLowerCase();
    const secs = body.querySelectorAll('.help-section');
    if (!q) {
      body.classList.remove('help-searching');
      if (nav) nav.style.display = '';
      secs.forEach(s => { s.style.display = ''; });   // revert to .active CSS
      if (noRes) noRes.style.display = 'none';
      return;
    }
    body.classList.add('help-searching');
    if (nav) nav.style.display = 'none';
    let any = false;
    secs.forEach(s => {
      const hit = s.textContent.toLowerCase().includes(q);
      s.style.display = hit ? 'block' : 'none';
      if (hit) any = true;
    });
    if (noRes) noRes.style.display = any ? 'none' : 'block';
    body.scrollTop = 0;
  }
  search?.addEventListener('input', runSearch);

  const closeModal = () => {
    modal.classList.remove('open');
    if (search) { search.value = ''; runSearch(); }
  };
  close?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
}

// ─── Changelog ───────────────────────────────────────────────────────────────

function initChangelog() {
  const modal = document.getElementById('changelog-modal');
  const body  = document.getElementById('changelog-modal-body');
  const close = document.getElementById('changelog-modal-close');
  if (!modal) return;

  // Set version in more menu
  const versionEl = document.getElementById('more-version');
  if (versionEl) versionEl.textContent = `v${APP_VERSION}`;

  body.innerHTML = CHANGELOG.map(entry => `
    <div>
      <div>
        <span class="cl-entry-version">v${entry.version}</span>
        <span class="cl-entry-date">${entry.date}</span>
      </div>
      <ul class="cl-entry-changes">
        ${entry.changes.map(c => `<li>${c}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  close?.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
}

// ─── iCloud portable-settings sync ─────────────────────────────────────────────
//
// Syncs PALETTES + a subset of preferences between the user's Macs via a single
// JSON file in iCloud Drive. Machine-specific settings (Pro7 paths/password,
// output folder, setup state, API keys, theme) and the current draft never sync.
//
// Merge is section-by-section (each preference group) and per-palette-by-id, so
// an edit on one Mac never clobbers an unrelated change on the other. Deletions
// use tombstones so a removed palette doesn't resurrect. Timestamps mean
// "when a user last changed this here"; a brand-new machine's baseline is 0 so
// the established config on iCloud wins on first sync. Ties favour the remote
// copy (don't clobber what's already shared); the id union preserves local-only
// palettes regardless.

const SYNC_META_KEY = 'deckpro-sync-meta';
const DEVICE_ID_KEY = 'deckpro-device-id';

// Which parts of state travel. Each entry reads/writes its slice of state.
function SYNC_SECTIONS() {
  const c = state.config;
  return {
    features:         { get: () => c.features,        set: v => { c.features = v; } },
    displayNames:     { get: () => c.displayNames,    set: v => { c.displayNames = v; } },
    bible:            { get: () => ({ bibleList: c.bibleList, bibleId: c.bibleId, bibleName: c.bibleName }),
                        set: v => { c.bibleList = v.bibleList || []; c.bibleId = v.bibleId || ''; c.bibleName = v.bibleName || ''; } },
    verse:            { get: () => ({ verseNumbers: c.verseNumbers, verseSuper: c.verseSuper }),
                        set: v => { c.verseNumbers = !!v.verseNumbers; c.verseSuper = !!v.verseSuper; } },
    queueMode:        { get: () => ({ v: c.queueMode }), set: v => { c.queueMode = v.v || 'ref'; } },
    bookNames:        { get: () => c.bookNames,        set: v => { c.bookNames = v || {}; } },
    speakers:         { get: () => c.speakers,         set: v => { c.speakers = v || []; } },
    responses:        { get: () => c.responses,        set: v => { c.responses = v || {}; } },
    notesStyleMap:    { get: () => c.notesStyleMap,    set: v => { c.notesStyleMap = v || {}; } },
    stageScreen:      { get: () => c.stageScreen,      set: v => { c.stageScreen = v; } },
    qrMacro:          { get: () => c.qrMacro,          set: v => { c.qrMacro = v || null; } },
    qrExportPair:     { get: () => ({ v: c.qrExportPair }), set: v => { c.qrExportPair = !!v.v; } },
    gradientMacro:    { get: () => c.gradientMacro,    set: v => { c.gradientMacro = v || null; } },
    gradientMacroQr:  { get: () => c.gradientMacroQr,  set: v => { c.gradientMacroQr = v || null; } },
    globalTypography: { get: () => state.globalTypography, set: v => { state.globalTypography = v; } },
    globalLayout:     { get: () => state.globalLayout,     set: v => { state.globalLayout = v; } },
    globalFontAdv:    { get: () => state.globalFontAdv,    set: v => { state.globalFontAdv = v; } },
    globalMotion:     { get: () => state.globalMotion,     set: v => { state.globalMotion = v; } },
    globalMacros:     { get: () => state.globalMacros,     set: v => { state.globalMacros = v || []; } },
    globalStageDisplays: { get: () => state.globalStageDisplays, set: v => { state.globalStageDisplays = v || []; } },
    globalRcElements: { get: () => state.globalRcElements, set: v => { state.globalRcElements = v || DEFAULT_RC_ELEMENTS(); } },
  };
}

let _syncMeta   = null;
let _syncing    = false;
let _syncPushTimer = null;
let _syncHostname  = '';
let _syncStatus = { state: 'off', at: 0 }; // off | syncing | synced | paused

function stableHash(obj) {
  try { return JSON.stringify(obj ?? null); } catch { return ''; }
}

function getDeviceId() {
  let id = null;
  try { id = localStorage.getItem(DEVICE_ID_KEY); } catch (_) {}
  if (!id) {
    id = (crypto?.randomUUID?.() || ('dev-' + Math.random().toString(36).slice(2, 10)));
    try { localStorage.setItem(DEVICE_ID_KEY, id); } catch (_) {}
  }
  return id;
}

function loadSyncMeta() {
  try { _syncMeta = JSON.parse(localStorage.getItem(SYNC_META_KEY) || 'null'); } catch { _syncMeta = null; }
  return _syncMeta;
}
function persistSyncMeta() {
  try { localStorage.setItem(SYNC_META_KEY, JSON.stringify(_syncMeta)); } catch (_) {}
}
function persistStateLocal() {
  // Save merged state without the undo/autosave side effects of saveState()
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
}

// First-enable baseline: record current hashes at updatedAt 0 ("never edited
// here") so the established iCloud config wins on first sync.
function buildBaselineSyncMeta() {
  const meta = { deviceId: getDeviceId(), sections: {}, palettes: {}, tombstones: {}, lastPulledAt: 0, lastPushedAt: 0 };
  const secs = SYNC_SECTIONS();
  for (const name of Object.keys(secs)) meta.sections[name] = { hash: stableHash(secs[name].get()), updatedAt: 0 };
  for (const sc of state.styleSchemes || []) meta.palettes[sc.id] = { hash: stableHash(sc), updatedAt: 0 };
  _syncMeta = meta;
  persistSyncMeta();
}

// Detect local edits since last save and stamp them now(). Auto-tombstones any
// palette that has disappeared. Runs on every saveState when sync is enabled.
function bumpSyncMeta() {
  if (!state.config.icloudSync) return;
  if (!_syncMeta) buildBaselineSyncMeta();
  const now = Date.now();
  let changed = false;
  const secs = SYNC_SECTIONS();
  for (const name of Object.keys(secs)) {
    const h = stableHash(secs[name].get());
    const m = _syncMeta.sections[name];
    if (!m || m.hash !== h) { _syncMeta.sections[name] = { hash: h, updatedAt: now }; changed = true; }
  }
  const seen = new Set();
  for (const sc of state.styleSchemes || []) {
    seen.add(sc.id);
    const h = stableHash(sc);
    const m = _syncMeta.palettes[sc.id];
    if (!m || m.hash !== h) { _syncMeta.palettes[sc.id] = { hash: h, updatedAt: now }; changed = true; }
    if (_syncMeta.tombstones[sc.id]) { delete _syncMeta.tombstones[sc.id]; changed = true; }
  }
  for (const id of Object.keys(_syncMeta.palettes)) {
    if (!seen.has(id)) { delete _syncMeta.palettes[id]; _syncMeta.tombstones[id] = now; changed = true; }
  }
  if (changed) { persistSyncMeta(); scheduleSyncPush(); }
}

function buildSyncDoc() {
  const deviceId = getDeviceId();
  const secs = SYNC_SECTIONS();
  const sections = {};
  let top = 0;
  for (const name of Object.keys(secs)) {
    const ts = _syncMeta.sections[name]?.updatedAt || 0;
    sections[name] = { data: secs[name].get(), updatedAt: ts, updatedByDeviceId: deviceId };
    if (ts > top) top = ts;
  }
  const items = {};
  for (const sc of state.styleSchemes || []) {
    const ts = _syncMeta.palettes[sc.id]?.updatedAt || 0;
    items[sc.id] = { id: sc.id, data: sc, updatedAt: ts, deletedAt: null, updatedByDeviceId: deviceId };
    if (ts > top) top = ts;
  }
  for (const [id, ts] of Object.entries(_syncMeta.tombstones)) {
    items[id] = { id, data: null, updatedAt: 0, deletedAt: ts, updatedByDeviceId: deviceId };
    if (ts > top) top = ts;
  }
  sections.palettes = { items };
  return { schemaVersion: 1, appVersion: APP_VERSION, updatedAt: top, updatedByDeviceId: deviceId,
           deviceLabel: _syncHostname || '', sections };
}

// Merge remote doc into local state + meta. Returns { changed, localAhead }.
function mergeSyncDoc(remote) {
  if (!_syncMeta) buildBaselineSyncMeta();
  let changed = false, localAhead = false;
  const secs = SYNC_SECTIONS();

  for (const name of Object.keys(secs)) {
    const lt = _syncMeta.sections[name]?.updatedAt || 0;
    const rSec = remote?.sections?.[name];
    const rt = rSec?.updatedAt || 0;
    if (rt > lt || (rt === lt && rt > 0)) {
      // remote newer, or tie at a real timestamp → adopt remote if it differs
      if (rSec && stableHash(secs[name].get()) !== stableHash(rSec.data)) {
        secs[name].set(rSec.data);
        _syncMeta.sections[name] = { hash: stableHash(rSec.data), updatedAt: rt };
        changed = true;
      } else if (rSec) {
        _syncMeta.sections[name] = { hash: stableHash(secs[name].get()), updatedAt: rt };
      }
    } else if (lt > rt) {
      localAhead = true;
    }
  }

  // Palettes: union of every id we know about anywhere
  const remoteItems = remote?.sections?.palettes?.items || {};
  const localById = new Map((state.styleSchemes || []).map(s => [s.id, s]));
  const ids = new Set([
    ...localById.keys(),
    ...Object.keys(_syncMeta.palettes),
    ...Object.keys(_syncMeta.tombstones),
    ...Object.keys(remoteItems),
  ]);
  const nextSchemes = [];
  const nextPaletteMeta = {};
  const nextTombstones = {};
  for (const id of ids) {
    const lTomb = _syncMeta.tombstones[id] || 0;
    const lTs   = _syncMeta.palettes[id]?.updatedAt || 0;
    const local = localById.has(id)
      ? { deleted: false, ts: lTs, data: localById.get(id) }
      : (lTomb > 0 ? { deleted: true, ts: lTomb } : { deleted: false, ts: 0, data: null });
    const rItem = remoteItems[id];
    const remoteState = rItem
      ? (() => { const rTs = Math.max(rItem.updatedAt || 0, rItem.deletedAt || 0);
                 return { deleted: !!rItem.deletedAt && (rItem.deletedAt >= (rItem.updatedAt || 0)),
                          ts: rTs, data: rItem.data }; })()
      : { deleted: false, ts: 0, data: null };

    // Winner: higher ts; tie → remote (if it exists)
    let win = local, side = 'local';
    if (remoteState.ts > local.ts || (remoteState.ts === local.ts && rItem)) { win = remoteState; side = 'remote'; }

    if (win.deleted) {
      nextTombstones[id] = win.ts;
      if (localById.has(id) || !_syncMeta.tombstones[id]) changed = true;
    } else if (win.data) {
      nextSchemes.push(win.data);
      nextPaletteMeta[id] = { hash: stableHash(win.data), updatedAt: win.ts };
      if (!localById.has(id) || stableHash(localById.get(id)) !== stableHash(win.data)) changed = true;
    }
    if (side === 'local' && local.ts > remoteState.ts) localAhead = true;
  }

  // Apply palette results
  _syncMeta.palettes = nextPaletteMeta;
  _syncMeta.tombstones = nextTombstones;
  if (!nextSchemes.length) { const d = DEFAULT_STYLE_SCHEME(); nextSchemes.push(d); _syncMeta.palettes[d.id] = { hash: stableHash(d), updatedAt: 0 }; }
  // Preserve local ordering where possible, then append any new remote palettes
  const order = new Map((state.styleSchemes || []).map((s, i) => [s.id, i]));
  nextSchemes.sort((a, b) => (order.has(a.id) ? order.get(a.id) : 1e9) - (order.has(b.id) ? order.get(b.id) : 1e9));
  state.styleSchemes = nextSchemes;
  if (!nextSchemes.some(s => s.id === state.activeSchemeId)) {
    state.activeSchemeId = nextSchemes.some(s => s.id === 'default') ? 'default' : nextSchemes[0].id;
  }

  return { changed, localAhead };
}

function scheduleSyncPush() {
  clearTimeout(_syncPushTimer);
  _syncPushTimer = setTimeout(() => syncCycle('local-edit'), 2000);
}

async function syncCycle(reason) {
  if (!state.config.icloudSync || _syncing) return;
  _syncing = true;
  setSyncStatus('syncing');
  try {
    const pull = await fetch('/api/sync/pull').then(r => r.json()).catch(() => null);
    if (!pull || !pull.available) { setSyncStatus('paused'); return; }
    if (!_syncMeta) buildBaselineSyncMeta();

    const { changed, localAhead } = mergeSyncDoc(pull.doc);
    if (changed) {
      persistSyncMeta();
      persistStateLocal();
      render();
    }
    const doc = buildSyncDoc();
    const remoteTop = pull.doc?.updatedAt ?? -1;
    if (!pull.doc || localAhead || doc.updatedAt > remoteTop) {
      const pr = await fetch('/api/sync/push', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc }),
      }).then(r => r.json()).catch(() => null);
      if (pr?.ok) _syncMeta.lastPushedAt = Date.now();
    }
    _syncMeta.lastPulledAt = Date.now();
    persistSyncMeta();
    setSyncStatus('synced');
  } catch (_) {
    setSyncStatus('paused');
  } finally {
    _syncing = false;
    updateSyncStatusUI();
  }
}

function setSyncStatus(s) { _syncStatus = { state: s, at: Date.now() }; updateSyncStatusUI(); }

function relTime(ts) {
  if (!ts) return '';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5)   return 'just now';
  if (s < 60)  return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function updateSyncStatusUI() {
  const el = document.getElementById('sync-status');
  if (!el) return;
  if (!state.config.icloudSync) { el.textContent = ''; el.className = 'sync-status'; return; }
  let txt, cls = 'sync-status';
  switch (_syncStatus.state) {
    case 'syncing': txt = 'Syncing…'; break;
    case 'paused':  txt = 'iCloud sync paused — will retry'; cls += ' paused'; break;
    case 'synced':  txt = `Synced ${relTime(_syncMeta?.lastPulledAt)}`; cls += ' ok'; break;
    default:        txt = 'Waiting for iCloud…';
  }
  el.textContent = txt;
  el.className = cls;
}

let _syncListenersBound = false;
function bindSyncListeners() {
  if (_syncListenersBound) return;
  _syncListenersBound = true;
  window.addEventListener('focus', () => syncCycle('focus'));
  setInterval(() => syncCycle('interval'), 60 * 1000);
}

async function setSyncEnabled(on) {
  state.config.icloudSync = on;
  saveState();
  if (on) {
    // Confirm iCloud is actually there before promising anything
    const st = await fetch('/api/sync/status').then(r => r.json()).catch(() => null);
    _syncHostname = st?.hostname || _syncHostname;
    if (!st?.available) { setSyncStatus('paused'); toast('info', 'iCloud not available', 'DeckPro will sync once iCloud Drive is reachable.'); return; }
    if (!_syncMeta) buildBaselineSyncMeta();
    bindSyncListeners();
    syncCycle('enable');
  } else {
    setSyncStatus('off');
  }
}

function initSync() {
  loadSyncMeta();
  getDeviceId();
  fetch('/api/sync/status').then(r => r.json()).then(st => { _syncHostname = st?.hostname || ''; }).catch(() => {});
  if (state.config.icloudSync) {
    bindSyncListeners();
    syncCycle('launch');
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────

const THEME_KEY = 'deckpro-theme';

function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  const icon  = document.getElementById('mm-theme-icon');
  const label = document.getElementById('mm-theme-label');
  if (dark) {
    if (icon) icon.innerHTML = '<path d="M17 12A7 7 0 1 1 8 3a5 5 0 0 0 9 9Z" fill="currentColor"/>';
    if (label) label.textContent = 'Light Mode';
  } else {
    if (icon) icon.innerHTML = '<path d="M10 3v1M10 16v1M3 10H2M18 10h-1M5.05 5.05l-.71-.71M15.66 14.66l-.71-.71M5.05 14.95l-.71.71M15.66 5.34l-.71.71M13 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
    if (label) label.textContent = 'Dark Mode';
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark');
  const next = isDark ? 'light' : 'dark';
  state.config.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
  saveState();
  applyTheme(!isDark);
}

function initTheme() {
  let saved = state.config.theme || '';
  try { if (!saved) saved = localStorage.getItem(THEME_KEY); } catch (_) {}
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  applyTheme(saved === 'dark' || (saved === null && prefersDark));
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function bootstrap() {
  const _tvEl = document.getElementById('titlebar-version');
  if (_tvEl) _tvEl.textContent = 'v' + APP_VERSION;

  await loadState();
  initTheme();
  initLiveQuoteNormalization();
  initNotesFieldDragDrop();
  initNotesSidebarDrop();
  syncUidCounter();
  attachHeaderHandlers();
  initDecks();
  initHelp();
  initTooltip();
  initDiagnostics();
  initGenHistory();
  initLibrary();
  initChangelog();
  document.querySelector('header h1')?.addEventListener('click', () => {
    state.activeId = null;
    render();
  });
  syncHeaderInputs();
  render();
  updateStatusDot();
  maybeShowMachineSetup();

  // Background: check Pro7 status, load fonts, check for updates
  checkPro7(true);
  loadFonts();
  checkForUpdates();
  setInterval(() => checkForUpdates(), 6 * 60 * 60 * 1000); // re-check every 6h
  initSync();
  // Auto-manage may already be on from before this permission prompt
  // existed — ask once at startup too, not just when the toggle is flipped.
  if (state.config.autoManagePro7 === true) fetch('/api/request-accessibility', { method: 'POST' }).catch(() => {});

  // Poll Pro7 every 10s — reconnects automatically when Pro7 opens
  setInterval(() => checkPro7(true), 10000);
}

window.addEventListener('pagehide', saveStateBeforeUnload);
bootstrap();
