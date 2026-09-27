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
