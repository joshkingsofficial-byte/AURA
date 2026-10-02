# AURA — Master Work File

A living record of where AURA 001 actually stands, updated as physical
evidence accumulates. This file did not exist before 2026-09-27 — it was
created specifically because no single document stated AURA 001's live
deployment status. Earlier documents (`CURRENT_STATE_V0.md`) are frozen
historical snapshots and are not updated to reflect ongoing 001 status;
this file is.

---

## Current Position (as of 2026-09-27)

- **AURA 001 now runs independently on a Raspberry Pi 4.** The approved
  `aura-001-simplification` branch, commit `77e2c71`, was cloned onto the
  Pi and built natively for ARM64. The production build runs without the
  Mac present.
- The **55-inch LG OLED television** was the first interim large-display
  physical observation. It is not the planned final display.
- The **planned Dell S2425HSM study is still required** — do not treat the
  OLED test as a substitute for it.
- **Reflective-material (two-way mirror) testing has not started.** Every
  finding below involving brightness, spacing, typography weight, or
  timing remains provisional until that testing happens.
- **The Mac is no longer required for normal AURA runtime.** It remains
  the development machine.

**Architecture now established:**

```
Mac            = development studio
GitHub         = approved source / approval boundary
Raspberry Pi   = physical installation runtime
```

Future development flow:

```
Mac development
→ test
→ approve
→ commit
→ push to GitHub
→ Pi pulls approved version
→ dependency install from approved lockfile
→ production build
→ AURA service restart/reload
```

This is documentation of the architecture, not an implementation of
further automation — the Pi remains pull-based and deploys only approved
states, deliberately not live-synced to every Mac edit.

---

## Physical Study Status

| Study | Status | Notes |
|---|---|---|
| **Physical Study 01 — Naked Bench** | Begun | First large-display observation used the 55" LG OLED as an interim study, not the planned Dell. The Dell study is still required before this study can be considered complete. |
| **Physical Study 02 — Reflective Material** | Not started | Two-way mirror material has not yet been physically tested. Do not finalise reflection composition, Trace brightness, typography weight, information opacity, Living Atmosphere brightness, final spacing, final Reveal timing, or final Return timing until this happens. |

---

## Physical Review 001 — Raspberry Pi / Large-Display Observation

**Dated: 2026-09-27.** These conclusions emerged only after AURA 001 was
deployed onto a Raspberry Pi and observed at physical, large-display scale
for the first time. They did not exist, and could not have been reached,
from laptop-screenshot review alone. Recorded here as new evidence, not as
a correction of earlier reasoning made without this information.

Classification key: **PRESERVE** · **CHANGE/INVESTIGATE** · **DEFER UNTIL REFLECTIVE MATERIAL** · **OPERATIONAL/INFRASTRUCTURE**

### PR001-01 — ART / Scale — *PRESERVE*

The concentric-circle development artwork produced an unexpected physical
effect at 55" OLED scale. On the Mac it read as a placeholder radial
graphic; on the physical OLED it appeared more like emitted light —
almost a sun or luminous source existing inside the black surface.
Minded's immediate physical reaction was strong: the work felt
significantly more powerful at scale than expected.

Do **not** delete this artwork as a disposable placeholder. Recorded
provisionally as **ART STUDY 001 — EMANATION**. It does not automatically
become the final hosted artwork, but it has earned preservation as an
intentional visual study.

### PR001-02 — MIRROR / Negative Space — *PRESERVE + DEFER UNTIL REFLECTIVE MATERIAL*

At large physical scale the central negative-space strategy became
convincing — functional information stays peripheral while the centre
remains available for the human/reflection. The actual MIRROR state
cannot yet be judged fully because no two-way mirror material is
installed; Minded could faintly perceive their reflection in the naked
OLED and could already imagine the room, body, and people occupying the
central surface once reflective material is added. Preserve reflection
priority and central negative space.

### PR001-03 — Scale Remains Open — *CHANGE/INVESTIGATE*

The 55" test revealed a materially different experience from the laptop.
Do **not** conclude 55" replaces the Dell — the 24" Dell remains necessary
for the planned physical study. Recorded instead: 24" may produce a more
intimate/personal AURA; large-format AURA may produce a more
architectural/confrontational presence. Final scale remains unresolved
and must be tested physically.

### PR001-04 — Return Trace — *CHANGE/INVESTIGATE (not fixed yet)*

ART → MIRROR Trace entry is directionally correct — the Trace visibly
originates from the first and final A crossbars and travels outward
symmetrically. MIRROR → ART is perceptually weaker: the returning Trace
currently reads like a rapid symmetrical disappearance/erasure rather
than a clearly visible travelling light returning home into the A
crossbars. **This physically confirms the existing QA_TRACKER VR6
concern.** The returning travelling head and retracting base need to read
as one coherent gesture. Not fixed in this pass.

### PR001-05 — The Stillness — *PRESERVE*

The Stillness after ART recedes works physically. Minded described the
feeling as: *"you are waiting for something on the other end."* This
indicates anticipation, not dead time. Preserve the current conceptual
role and do not shorten it yet. Final duration remains subject to
reflective-material testing.

### PR001-06 — Wordmark / Trace Attention — *CHANGE/INVESTIGATE (not implemented yet)*

When the AURA wordmark appears, its unfamiliar/stylish typography
naturally captures attention. Because Trace entry begins quickly, the
viewer is still studying AURA while the Trace is already travelling. The
geometry successfully establishes that the A crossbars generate the
Trace, but the choreography does not currently provide enough perceptual
time for the viewer to understand that causal relationship. Investigate
later: STILLNESS → AURA appears → brief recognition → crossbars activate
→ Trace departs. This does **not** mean simply slowing the entire
transition — the goal is perceptual separation and causality: AURA should
appear to generate the Trace. Not implemented in this pass.

### PR001-07 — Living Atmosphere Absent — *CHANGE/INVESTIGATE — FUNCTIONAL DISCREPANCY*

The intended MIRROR composition (top-left time/date, top-centre AURA,
top-right sound/music, centre human/reflection, lower-right Living
Atmosphere, lower-left silence, perimeter Trace) was only partially
realised during the Raspberry Pi physical test. Time/date and "NIGHTS —
Frank Ocean" appeared correctly. **Living Atmosphere did not appear in the
lower-right territory.** Recorded as a functional discrepancy requiring
investigation — not redesigned in this pass. See QA_TRACKER.md A4.

**2026-09-27 update:** during Mac/browser testing of ART STUDY 003B
(CAR_LIVE), Living Atmosphere rendered correctly in MIRROR at the
lower-right (18° / CLEAR). Not treating PR001-07 as fixed — the
discrepancy appears environment-specific: present on Mac, previously
absent on the Raspberry Pi physical runtime. Root cause between the two
environments remains uninvestigated.

### PR001-08 — Information Scale / Hierarchy — *CHANGE/INVESTIGATE + DEFER UNTIL REFLECTIVE MATERIAL*

At 55" physical scale the functional typography remains intentionally
thin and restrained. However, the upper-right music territory appears
noticeably smaller/weaker than the upper-left time/date territory. Do
**not** simply enlarge all typography. Possible future hierarchy to study:
time ≈ track title in primary visual weight; date ≈ artist attribution as
quieter secondary information. Do not finalise font weight, brightness,
or opacity before mirror-material testing — reflective material will
change perceived luminance and legibility.

### PR001-09 — Resting Trace — *PRESERVE + DEFER UNTIL REFLECTIVE MATERIAL*

Previous screenshot-based concern (QA_TRACKER VR1) suggested the
completed perimeter Trace might read too strongly as an illuminated UI
border. **Physical observation changed this assessment.** At 55" scale,
once settled, the Trace begins to blend into the structure rather than
constantly demanding attention. Do **not** automatically make it thinner
or dimmer. Final judgement should wait for the physical frame and
reflective material. This is an example where physical observation
supersedes assumptions made from laptop screenshots. See QA_TRACKER.md
VR1 annotation.

### PR001-10 — The Return / ART Emergence — *PRESERVE*

The strongest physical discovery during Return was the way ART re-entered
the surface. Minded described the experience approximately as: *"It feels
like it went from a mirror with cool stuff to the art bleeding into the
screen, like it slipped into the build to illuminate."* The Return did
not feel merely like switching from a mirror interface back to an image —
the luminous artwork appeared to emerge from within the physical black
surface. Preserve this material-emergence quality. Do not introduce
UI-like transitions that make ART feel like a page, screen, or image
loading.

### New Conceptual Observation — *PRESERVE, PROVISIONAL ONLY*

ART and MIRROR should increasingly be understood not as two
applications/screens but as two conditions of the same physical work. In
MIRROR, AURA gives the surface to the human. In ART, AURA gives the
surface to the artwork. The Stillness can be understood as the interval
in which ownership of the surface changes.

**This is a working interpretation, not a new locked manifesto line.** It
is recorded here only. It has not been added to `PRESENCE_BIBLE.md` and
should not be treated as governing language until a dedicated Presence
pass confirms and promotes it.

---

## ART Study Candidates — Status (2026-09-30)

`ART_STUDIES` (LONELY, CAR_LIVE, alongside the original EMANATION) is now
implemented as a source-level registry consumed by `ArtState.js` — see
the code itself for the mechanism. This section records the *artistic*
status of the two new candidates, which the implementation work does not
settle on its own:

- **LONELY's `contain` presentation remains under physical study.**
  Implementing the `fit` field and verifying it renders correctly on a
  laptop screen is not the same as judging whether `contain` is the right
  artistic treatment — that judgement is explicitly deferred to physical
  display, per the same reasoning already established throughout Physical
  Review 001 (laptop screenshots have repeatedly been overridden by
  physical observation in this project).
- **CAR_LIVE's `contain` presentation remains under physical study**, for
  the same reason.
- **CAR_LIVE's current immediate looping is technical test behaviour
  only.** The derivative's native `loop` attribute (instant restart on
  end) exists to prove the moving-image render path works through
  `ArtState` — it is not an artistic decision about how CAR_LIVE should
  actually loop.
- **The intended long-stillness / unexpected-motion-arrival behaviour is
  not yet implemented.** ART STUDY 003B's own artistic direction (car
  exits → deliberate hold on the empty frame → surprise return, not an
  instant reset — see the loop-question discussion during the trim/derivative
  work) has not been built. This commit captures render-path verification
  only, not the intended final behaviour.
- **The measured ~2-3% derivative luma shift is an open physical-review
  observation, not corrected.** `ffmpeg signalstats` showed the CAR_LIVE
  derivative reading consistently brighter than the source MOV at matching
  timestamps during creation; visually the difference wasn't obvious
  side-by-side on a laptop. Tracked for resolution in QA_TRACKER.md (A8) —
  judgement on whether a correction pass is warranted waits for physical
  display, not a laptop comparison.

**2026-09-30 update (commit 4291509):** the deployment copy of `lonely.jpg`
was sanitized for privacy — original camera EXIF (including GPS
coordinates, device make/model, capture date) and embedded XMP metadata
were stripped via a marker-level rewrite. **This introduced a bug**,
caught by Pi-side verification before it reached any running display: the
stored pixels were physically landscape (4032×3024), relying on an EXIF
`Orientation = 6` tag to display correctly as portrait — stripping that
tag without baking the rotation into the pixel data itself left the file
displaying sideways.

**2026-09-30 correction (this commit):** the deployment copy was rebuilt
from the pre-sanitization backup. The rotation was baked into the pixel
data directly via `jpegtran -rotate 90 -perfect` (a lossless block-level
transform — `-perfect` fails outright if perfect losslessness isn't
achievable for the image's dimensions, and it succeeded; verified
separately by confirming the resulting entropy-coded scan data is
byte-identical whether or not the colour profile is re-attached
afterward). The file now stores pixels natively as 3024×4032 portrait, so
it displays correctly with **no EXIF orientation dependency at all** —
not just none present, none needed. EXIF, GPS, XMP, and the processing-tool
comment remain stripped. The Display P3 ICC colour profile was re-attached
via a direct byte-level splice (no re-encoding). The original master
remains untouched outside the repo at `~/Downloads/lonely-original.heic`
and `~/Downloads/lonely.jpg`.

---

## Static Art Physical Study (2026-09-30)

**Purpose:** isolate static artwork behaviour from moving-image behaviour
and evaluate how 16:9 paintings inhabit AURA at physical scale — CAR_LIVE
testing is paused, not removed, while this runs.

Three temporary candidates added to `ART_STUDIES`, sourced from the
J. Paul Getty Museum's open-content collection (public domain; rights
statement "No Copyright — United States" embedded in each file's own
metadata), all 3840×2160 (16:9), copied byte-for-byte with no
modification — inspection found no GPS/device metadata and no orientation
dependency requiring intervention:

- **PAINTING_VENICE** (ART STUDY 004A) — *Regatta on the Grand Canal in
  Honor of Frederick IV, King of Denmark*. Currently `ACTIVE_ART_STUDY`.
- **PAINTING_SEA** (ART STUDY 004B) — *Van Tromp, going about to please
  his Masters, Ships a Sea, getting a Good Wetting*, J.M.W. Turner, 1844.
- **PAINTING_GARDEN** (ART STUDY 004C) — *Dance before a Fountain*,
  Nicolas Lancret, c. 1724.

No artist/title/date metadata was added to the `ART_STUDIES` registry
entries themselves yet — the source files carry this in their own
embedded metadata, but nothing is invented here beyond what was supplied.
Test order for physical viewing: VENICE → SEA → GARDEN, switching
`ACTIVE_ART_STUDY` one entry at a time, same source-only mechanism as
every other study — no slideshow, no rotation, no visitor-facing
selector, no transitions between paintings.

**No artistic judgement is final until seen on the physical
installation** — same standing rule as every other study in this file.
`fit: 'contain'` was chosen because both the artwork and the display are
16:9, so it's expected to fill the surface without material cropping, but
that expectation itself is unverified until viewed physically.

**2026-09-30 update:** all three paintings now use `fit: 'cover'` (full-
surface), not `contain`. Rationale below, under Static Art Schedule Study.

---

## Static Art Schedule Study (2026-09-30)

**Status: implemented in source, not yet committed, pushed, or deployed
to the Pi — report only, pending review.**

**Purpose.** This is an experimental mechanism for observing how the same
static artworks read under different real lighting/time conditions on the
physical installation — it is explicitly **not** final curatorial
programming. The schedule below (which painting shows at which hour) is a
development starting point for physical observation, the same standing as
every timing constant in `constants.js`.

**What changed:**

- All three paintings (`PAINTING_VENICE`, `PAINTING_SEA`,
  `PAINTING_GARDEN`) switched from `fit: 'contain'` to `fit: 'cover'` in
  `constants.js` — full-surface presentation rather than letterboxed. The
  three source JPEGs themselves are untouched; only the `objectFit` style
  `ArtState` applies to them changed. LONELY, CAR_LIVE, and EMANATION are
  unaffected — still `contain`/native framing as before.
- A new pure function, `getScheduledStudyKey(date = new Date())` in the
  new file `frontend/aura-ui/src/aura001/artSchedule.js`, maps the current
  local hour to one of the three paintings:

  | Local hours | Study |
  |---|---|
  | 08:00–11:59 | PAINTING_VENICE |
  | 12:00–15:59 | PAINTING_SEA |
  | 16:00–19:59 | PAINTING_GARDEN |
  | 20:00–07:59 | PAINTING_VENICE |

  Deterministic, local-device-time-only, no network dependency, nothing
  persisted — a fresh page load always recomputes the correct study from
  the device clock alone.
- A source-level-only override, `DEV_ART_STUDY_OVERRIDE` in `constants.js`
  (default `null`), can force one specific study for development/testing,
  bypassing the schedule. This is not visitor-facing — there is no
  runtime picker or UI control, exactly matching the standing rule already
  established for `ACTIVE_ART_STUDY`.
- `RevealSequence.js` now owns a `lockedStudyKey` piece of state, resolved
  once at mount and passed down to every `<ArtState />` render site. It is
  only ever recomputed at two deliberately safe moments:
  1. A 60-second poll, applied **only** while idle in `ART` (checked
     against the live state, not stale closure state).
  2. Once, at the exact instant `ART_RETURNING` begins (inside
     `handleTraceLeavingComplete`), so a visitor returning from MIRROR
     always sees the artwork appropriate for the current time, not
     whatever was showing before they entered MIRROR.

  Critically, a schedule change can **never** interrupt
  REVEAL/STILLNESS/TRACE/MIRROR/RETURN — not because of an extra guard
  written for this feature, but because `ArtState` is already genuinely
  unmounted for the entire STILLNESS_IN → TRACE_LEAVING span (existing
  DOM-purity architecture, unrelated to this change). There is nothing on
  screen for a schedule tick to alter during that whole span.

**Verified this pass:**
- Mock-time-injection test of the pure `getScheduledStudyKey` logic
  against all 10 specified boundary timestamps (07:59, 08:00, 11:59,
  12:00, 15:59, 16:00, 19:59, 20:00, 23:59, 00:00) — all 10 resolved to
  the expected study.
- Live browser check of the production build (served locally): at actual
  local time 17:5x (hour 17, inside the 16:00–19:59 window),
  `<img>`'s resolved `src` was `painting-garden-study.jpg` with computed
  `object-fit: cover` — confirms real wiring, not just the isolated
  function.
- Full Reveal → Stillness → Trace → MIRROR → Return cycle run end-to-end
  in-browser: `ArtState`/`<img>` confirmed absent (DOM query returned
  none) throughout MIRROR, then confirmed present again after Return
  completed, still resolving the same current-hour study with `cover`
  still applied — i.e., a full cycle with no schedule boundary crossed
  mid-cycle leaves the artwork and its framing unchanged, as expected.
  (A boundary actually being *crossed* mid-MIRROR was not separately
  exercised with real wall-clock time in this pass, since architecture —
  not timing luck — is what guarantees no interruption: see above.)
- `npm run build`: succeeds, only the two pre-existing ESLint warnings
  (`WidgetOverlay.js` unused `isActive`, `useRealtimeVoice.js` missing
  `setOrb` dep) — no new warnings introduced.

**Not yet verified:** an actual schedule-boundary crossing occurring
*during* a live MIRROR session on the physical installation (the
architectural guarantee above was verified by code structure and by
unmount/remount inspection, not by waiting for a real clock boundary
mid-session). Final judgement on whether this schedule is the right cadence,
or whether daily painting rotation is even artistically desirable at all,
depends on physical observation on the Pi — same standing rule as every
other study in this file.

**Explicitly not done in this pass, per instruction:** no commit, no push,
no deploy to the Pi. No change to `PRESENCE_BIBLE.md` — the "experimental,
not final curatorial programming" framing above stays recorded here only,
not promoted into governing language. No change to LONELY, CAR_LIVE, or
any JPEG/MP4 byte content — only `constants.js`, the new `artSchedule.js`,
`ArtState.js`, and `RevealSequence.js` changed.

---

## Technician Art Preview Override (2026-10-02)

**Source-level only — a development/physical-review tool, not
visitor-facing.** Added no new mechanism: `DEV_ART_STUDY_OVERRIDE` in
`constants.js` (already introduced for the Static Art Schedule Study
above) already forces any `ART_STUDIES` key regardless of the local-time
schedule — this pass only documents its valid keys at the source line
(`EMANATION`, `LONELY`, `CAR_LIVE`, `PAINTING_VENICE`, `PAINTING_SEA`,
`PAINTING_GARDEN`) and verifies it end-to-end for the four studies under
current physical review.

**Purpose:** inspect artworks rapidly on reference hardware (the AURA
Dell) for surface ownership, edge crop, composition loss, fit, position,
scale, and colour/contrast — without waiting hours between the schedule's
own time windows.

**Verified this pass**, for each of `PAINTING_VENICE`, `PAINTING_SEA`,
`PAINTING_GARDEN`, and `LONELY` set as the override:
- the forced study's correct asset resolved (confirmed via `<img>` `src`,
  not assumed), with its own registry `fit` applied correctly (`cover`
  for the three paintings, `contain` for LONELY, unchanged);
- the override held regardless of actual local time (tested while real
  time was inside SEA's own window, with VENICE still forced — confirms
  the override, not clock luck);
- a full Reveal → Stillness → Trace → MIRROR → Return cycle completed
  normally with the override active, `ArtState` confirmed absent
  throughout MIRROR exactly as without an override, and Return correctly
  resolved back to the *forced* study, not whatever the schedule would
  have returned;
- restoring `DEV_ART_STUDY_OVERRIDE` to `null` afterward resumed the
  ordinary schedule immediately, with no leftover state — a fresh load at
  real local hour 13 correctly resolved to `PAINTING_SEA` (12:00–16:00
  window), with no override artifact remaining.
- `npm run build`: succeeds, only the two known pre-existing ESLint
  warnings — no new ones.

**Must be returned to `null` before normal scheduled operation** — it is
a technician tool, left active it would silently defeat the schedule on
whatever build it ships in. No visitor-facing control, no on-screen menu
was added — source editing only, per instruction. Not promoted into
`PRESENCE_BIBLE.md`.

**2026-10-03 update — `?technicianArt=` URL override added.** With AURA
now physically running on the AURA Dell (confirmed: scheduled switching
works, VENICE displays correctly, Living Atmosphere now appears
correctly, Trace reads materially better on the Dell than on the 55" LG
OLED, SEA previously stood out as a particularly good fit for the Dell),
editing source and rebuilding for every framing comparison was too slow
for physical review. `artSchedule.js`'s `getScheduledStudyKey()` now also
accepts a `?technicianArt=<ART_STUDIES key>` URL query parameter, in this
precedence order:

1. `DEV_ART_STUDY_OVERRIDE` (source-level, if non-null)
2. `?technicianArt=` (URL, session-only)
3. normal local-time schedule

- **Physical-review convenience only** — not a visitor feature. No
  visible control, no menu, no artwork browser of any kind was added;
  it's read directly from `window.location.search`, nothing renders
  because of its presence beyond the artwork itself.
- **URL-controlled but invisible** — there is no UI indicating an
  override is active. A technician must know the URL to use it.
- **Non-persistent by construction, not by extra code** — the value is
  read fresh on every call (initial mount, the 60s idle-ART poll, and the
  re-lock at ART_RETURNING) directly from the current URL. Nothing is
  written to localStorage, cookies, IndexedDB, or any config file.
  Closing the tab or loading the bare URL again means it's gone — there
  was never anything to clear.
- **Invalid values are ignored safely** — the parameter is only honoured
  if it exactly matches an existing `ART_STUDIES` key (checked via
  `Object.prototype.hasOwnProperty`); anything else (typo, removed key,
  absent) falls through to the normal schedule without throwing.
- **Visitors still have no authority to browse or change hosted art** —
  this is a URL a technician types deliberately on reference hardware
  during installation/framing review, not a feature exposed, hinted at,
  or reachable through any part of AURA's visitor-facing surface.

**Verified this pass** (dev server, representing the same logic the
production build ships): `?technicianArt=PAINTING_VENICE` → VENICE;
`?technicianArt=PAINTING_SEA` → SEA; `?technicianArt=PAINTING_GARDEN` →
GARDEN; `?technicianArt=LONELY` → LONELY (`contain` fit preserved);
`?technicianArt=INVALID` → fell through to the current scheduled artwork
(VENICE, hour 0) with no crash; no parameter at all → current scheduled
artwork, same result. One full forced cycle
(`?technicianArt=LONELY`) run end-to-end: Reveal → Stillness → Trace →
MIRROR (time/date, music, and now-working Living Atmosphere all present
and unaffected) → Return → LONELY reappeared, still forced, exactly as
required. Removing the parameter afterward (bare `http://localhost:3000`)
immediately resumed the normal schedule with no leftover state.
`npm run build`: succeeds, only the two known pre-existing warnings.

Primary physical review set remains `PAINTING_VENICE`, `PAINTING_SEA`,
`PAINTING_GARDEN`, `LONELY` — existing registry framing (`fit`, crop,
scale) deliberately unchanged this pass; all four still need observing
on the Dell before any framing changes are considered.

---

## Living Atmosphere — Pi Root Cause Resolved (2026-10-02)

**Root cause, confirmed via Pi-side read-only diagnosis:** Living
Atmosphere's source and compiled build were always correct on both Mac
and Pi, and MIRROR always mounted the weather territory correctly. The
Pi's kiosk Chromium browser cannot reliably obtain a `navigator.geolocation`
fix in the installation runtime environment. Because
`INSTALLATION_LATITUDE`/`INSTALLATION_LONGITUDE` were `null`, the app's
only path to weather data was that unreliable browser geolocation call —
so the Open-Meteo fetch was never reached at all on the Pi, and the
failure was invisible because every error path (`fetch().catch()`, the
geolocation error callback) silently swallowed its error with an empty
handler. **Mac success was environment-specific** — Mac's browser
obtains geolocation reliably; the Pi's kiosk browser does not. This was
never a Presence/design problem.

**Fix:** `INSTALLATION_LATITUDE`/`INSTALLATION_LONGITUDE` in
`constants.js` are no longer `null` — AURA's actual installation
location, Chelmsford, Essex, UK, is now configured explicitly as
town-level coordinates (51.7356, 0.4798; not an exact address, per
instruction). Since installation coordinates now take priority in the
existing `weatherProvider.js` priority order, normal AURA runtime never
reaches the browser-geolocation branch at all — it remains only as a
fallback for a developer running without any installation configured,
now with a finite 8-second timeout so a stalled/denied fix can never
block anything else in MIRROR. Restrained development-only console
logging (`[AURA weather] ...`, gated on `NODE_ENV === 'development'`,
same gate already used by the `?weather=` dev override) was added at the
three points that previously failed silently — using installation
coordinates, geolocation fallback failure, Open-Meteo fetch failure —
so a future regression would be visible in dev tools rather than
invisible. No visitor-facing error UI was added.

**This confirms a broader principle for this installation:
installation-specific configuration belongs to the work, not the
visitor.** AURA should not depend on a visitor's or installation's
browser/device to correctly infer where it physically is — that is
authored, deliberate configuration, the same way `ACTIVE_ART_STUDY` and
`DEV_ART_STUDY_OVERRIDE` are source-level decisions rather than runtime
guesses. Browser geolocation is not reliable enough to be primary
gallery runtime behaviour. **This is an infrastructure/runtime
correction, not a Presence redesign** — Living Atmosphere's visual
design, MIRROR composition, and weather animation/typography are
completely unchanged; not promoted into `PRESENCE_BIBLE.md`, though the
"installation configuration belongs to the work" framing may be worth a
future dedicated Presence pass if it turns out to generalize beyond
weather.

**Verified this pass:** Open-Meteo request confirmed firing with the new
coordinates (`https://api.open-meteo.com/v1/forecast?latitude=51.7356&longitude=0.4798&current_weather=true`,
HTTP 200); weather resolved and rendered in MIRROR's lower-right
territory (observed "15° CLOUDY" alongside time/date/music, all
correctly positioned); full Reveal → MIRROR → Return cycle unaffected;
ART (VENICE, per the active schedule window) unaffected before and after
the cycle; `npm run build` succeeds with only the two known pre-existing
warnings; no console errors observed across the full cycle.

**Still physical-review-pending:** this fix has not yet been observed on
the Pi/Dell itself — only verified on Mac (dev server + production
build). Per the standing rule, final confirmation that Living Atmosphere
now actually appears on the physical installation still requires a Pi
deploy and physical observation, not just this Mac-side evidence.

---

## Operational / Infrastructure Findings

The Raspberry Pi now runs AURA independently. AURA has been built natively
on ARM64. Basic autonomous startup/kiosk behaviour has been demonstrated.
A hard-power-cycle test exposed a temporary white-screen/browser failure;
a subsequent power cycle recovered AURA successfully. See QA_TRACKER.md
A5–A7 for the tracked open items this produced:

- Abrupt power removal must **not** become the normal gallery shutdown
  method.
- Gallery-safe startup/shutdown procedure remains unresolved.
- Reliable remote operator access remains unresolved.
- Mac → Pi SSH/TCP connectivity still requires investigation (ICMP ping
  succeeds; all TCP ports, including 22 and 3000, currently refused with
  "No route to host").
- A physical service/recovery keyboard may remain part of the development
  technician kit, but should not be part of the exhibited work.

**Development rule:** do not make every live Mac edit automatically
propagate to the Pi. The Pi deploys approved states only. Mac =
development, GitHub = approval boundary/archive, Pi = installation
runtime.
