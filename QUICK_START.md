# Canvas Bulk Editor

## Quick Start (Alpha)

*For alpha testers — set up in your own Canvas course (usually a sandbox).*

---

### At a glance

| | |
|:---|:---|
| **Who this is for** | Alpha testers. Your pilot either enrolls you in **Canvas FFT** to export a template course, or sends an **`.imscc`** + LTI details. |
| **Launch** | **Bulk Editor** / **Canvas Bulk Edit** in course navigation — **LTI 1.1 only** (no LTI 1.3 tool, no Canvas OAuth). |
| **Token** | Create in the **same Canvas** as the course you edit. Paste when prompted; **not** saved across visits like a password. |
| **Role** | **Teacher** (or equivalent) on the target course. |
| **After import** | Wait until Canvas shows the import job **complete**. |

---

## Contents

**Setup**

1. [Get the `.imscc` package](#1-get-the-imscc-package)
2. [Import into your course](#2-import-into-your-course)
3. [LTI 1.1 credentials](#3-lti-11-credentials)
4. [Canvas API token](#4-canvas-api-token)
5. [Launch and sign in](#5-launch-and-sign-in)

**Using the tool**

6. [Know before you edit](#6-know-before-you-edit)
7. [Using the grid](#7-using-the-grid)
8. [Editing cells](#8-editing-cells)
9. [Bulk actions](#9-bulk-actions)
10. [Clone and delete](#10-clone-and-delete)
11. [Tips](#11-tips)
12. [Quick troubleshooting](#12-quick-troubleshooting)

---

## 1) Get the `.imscc` package

### Path A — Shared FFT alpha course

The FFT course is only a **download source**. Do **not** import your own content into that shared shell (other testers use it).

| Step | Action |
|:---:|:---|
| 1 | Log into **Canvas FFT** → open the alpha course you were given. |
| 2 | **Settings** → **Export Course Contents** (labels may vary in FFT). |
| 3 | Download the **`.imscc`** when the export is ready. |

### Path B — Package from your pilot lead

Use the **`.imscc`** (and any `lti-config.xml`) they sent — e.g. e-mail or shared drive. **Skip Path A.**

---

## 2) Import into your course

> **Use a sandbox or non-production course first.**  
> The Bulk Editor can change many items at once — practice before a live term.

| Step | Action |
|:---:|:---|
| 1 | In **your** Canvas → target course → **Settings** → **Import Course Content**. |
| 2 | Content type: **Canvas Course Export Package** → select your **`.imscc`** → import. |
| 3 | If Canvas says *The security parameters for the external tool need to be set* — **that is normal** until you finish [§3](#3-lti-11-credentials). |

---

## 3) LTI 1.1 credentials

| Step | Action |
|:---:|:---|
| 1 | **Settings** → **Apps** → **View App Configurations**. |
| 2 | Find **Canvas Bulk Edit** / **Bulk Editor** → **gear** → **Edit** (or add from XML if instructed). |

**Values** (from your pilot — not every alpha uses the same consumer key):

| Field | What to enter |
|:---|:---|
| **Consumer Key** | As provided by developer / pilot lead |
| **Shared Secret** | Secure handoff from pilot lead |
| **Launch URL** | As provided (example: `https://canvas-bulk-editor.onrender.com/lti/launch`) |
| **Config type** | **By URL** or paste XML per `lti-config.xml` |

Save. The external-tool warning should clear when this is valid.

---

## 4) Canvas API token

Same **Canvas** instance as the course you will edit:

| Step | Action |
|:---:|:---|
| 1 | **Account** (avatar) → **Settings**. |
| 2 | **Approved Integrations** → **+ New Access Token**. |
| 3 | Purpose: e.g. `Bulk Editor`. Set expiration if allowed (**recommended**). |
| 4 | **Generate** → **copy immediately** (Canvas shows it once). |
| 5 | Store in a **password manager** — not e-mail, Slack, or plain text. |
| 6 | **Paste the token when you open the tool.** It is **not** kept across separate visits; keep it somewhere easy to copy from. |

---

## 5) Launch and sign in

| Step | Action |
|:---:|:---|
| 1 | Course sidebar → **Canvas Bulk Edit** / **Bulk Editor**. |
| 2 | Enter **Canvas base URL** if asked, then paste your **API token** (§4). |
| 3 | Choose the **course** in the app when prompted. |
| 4 | When the **grid** loads, you’re ready. |

> **Note:** There is **no** “Authorize with Canvas” OAuth step in this build — only LTI launch + token entry.

---

## 6) Know before you edit

### Works now (typical alpha)

- Titles, descriptions, dates, points across many rows  
- **Ctrl+Z** undo in many flows (see cautions below)  
- **Delete** — destructive; use sandbox first  
- **Mode** (Dev / Prod / Demo); debug may be password-protected — ask your pilot  

### Limitations and caution

- **Accreditation** / parts of **Accessibility** may be preview-only or incomplete — confirm for your build  
- **Fill Down** — may not exist yet  
- **Undo** + **synced** edits — not fully verified  
- **Assign To** / **Accommodations** — wired but unverified  
- `podcast_enabled` — read-only (Canvas API)  
- Quiz **`points_possible`** — read-only (Canvas derives from questions)  

---

## 7) Using the grid

1. Pick the **course** in the dropdown if needed.  
2. Open a tab: **Assignments**, **Modules**, **Pages**, **Quizzes**, etc.  
3. Wait until the grid **finishes loading**.  

---

## 8) Editing cells

- Click a cell → edit **inline**; modified rows are marked.  
- **Sync Changes** → writes to Canvas.  
- Sync fails → **System Debug Monitor** (if your mode shows it) or contact your pilot.  

---

## 9) Bulk actions

| Action | What it does |
|:---|:---|
| **Search & Replace** | Matching text in selected or filtered rows |
| **Date Shift** | Move selected date fields by your offset |
| **Points** | Bulk numbers (or **Modules** position on that tab) |

---

## 10) Clone and delete

| Action | Notes |
|:---|:---|
| **Clone** | Clone modal: naming, count, behavior varies by tab |
| **Delete** | Confirm carefully; some tabs have deeper delete options |

---

## 11) Tips

- Heavy **sort/filter** mid-session can interfere with **undo** — be careful if you rely on undo.  
- **Sync** before switching tabs to avoid conflicts and missed changes.  

---

## 12) Quick troubleshooting

| Problem | What to try |
|:---|:---|
| Security / external-tool warning after import | Finish [§3 LTI](#3-lti-11-credentials); valid key, secret, launch URL |
| Tool won’t load / auth error | Re-check **Consumer Key** and **Shared Secret** in App Configurations |
| Grid won’t load course content | New **API token**; check expiry/revocation; **Canvas URL** matches course instance |
| **No LTI 1.1 shared secret found** | Contact developer — server secret must match Canvas |

---

> *Canvas Bulk Editor — Alpha. Launch URL and LTI values come from your pilot; don’t use stale screenshots if your lead gave different ones.*
