# Canvas Bulk Editor — Quick Start (Alpha)

This guide is for **alpha testers** setting up the tool in **their own** Canvas course (usually a **sandbox**). Your pilot lead either enrolls you in a shared **Canvas FFT** course to export from or gives you an **`.imscc`** package and LTI details directly—use the path that applies to you.

**Checklist (easy to forget):**

- **Launch:** Open the tool from the course **Bulk Editor** / **Canvas Bulk Edit** navigation link. This alpha uses **LTI 1.1** (legacy external tool) only—there is **no** LTI 1.3 tool placement and **no** Canvas OAuth for signing in.
- **Token vs Canvas host:** Create your API token in **the same Canvas** where the course you will edit lives (campus, sandbox, or FFT). The tool uses that token against that instance only.
- **Role:** You need permission to edit the target course (typically **Teacher** or equivalent).
- **Import:** After importing an `.imscc`, wait until Canvas shows the import job **complete** before relying on the course shell.

---

## 1) Get the course package (`.imscc`)

**Path A — You were enrolled in a shared FFT alpha course**

The FFT course is only a **download source**; do not import your own content into that shared shell (other testers use it).

1. Log into **Canvas FFT** and open the alpha course you were given access to.
2. Go to **Settings → Export Course Contents** (labels may vary slightly in FFT).
3. Download the **`.imscc`** when the export is ready.

**Path B — Your pilot lead sent the package**

Use the **`.imscc`** (and any `lti-config.xml`) they provided—for example by e-mail or shared drive. Skip Path A.

---

## 2) Import the package into your course (sandbox recommended)

**Use a sandbox (or other non-production) course first.** The Bulk Editor can change many items at once; practice before using it on a live term.

1. In **your** Canvas, open the target course → **Settings** → **Import Course Content**.
2. Set content type to **Canvas Course Export Package** (or equivalent), choose your **`.imscc`**, start the import.
3. When the import finishes, Canvas may show: *The security parameters for the external tool need to be set.* **That is expected** until you complete §3.

---

## 3) Enter the LTI 1.1 credentials

1. In the same course: **Settings → Apps → View App Configurations**.
2. Find **Canvas Bulk Edit** / **Bulk Editor** → gear icon → **Edit** (or add the app if your lead had you install from XML).

Use the values from your **pilot lead** (not all alphas use the same consumer key):

| Field | Value |
|--------|--------|
| **Consumer Key** | As provided by the developer / pilot lead |
| **Shared Secret** | Provided separately (secure handoff) |
| **Launch URL** | As provided by the pilot lead (example: `https://canvas-bulk-editor.onrender.com/lti/launch`) |
| **Config type** | **By URL** or paste XML, per your `lti-config.xml` instructions |

Save / Submit. The external-tool warning should clear once configuration is valid.

---

## 4) Create your Canvas API token

In the **same Canvas** as the course you will edit (see checklist above):

1. **Account** (profile) → **Settings**.
2. **Approved Integrations** → **+ New Access Token**.
3. Purpose: e.g. `Bulk Editor`. Set an expiration if your policy allows (recommended).
4. **Generate**, then **copy the token immediately**—Canvas shows it only once.
5. Store it in a **password manager**. Do not rely on e-mail, Slack, or plain text files.
6. **Expect to paste the token when you use the tool.** It is **not** kept for you across separate visits the way a saved password is—keep the token somewhere easy to copy from when you launch the editor.

---

## 5) Launch and sign in

1. In the course sidebar, open **Canvas Bulk Edit** / **Bulk Editor**.
2. When the tool prompts you, enter your **Canvas base URL** (if asked) and paste your **API token** from §4.
3. Choose your course from the app’s course selector when prompted.
4. When the grid loads, you are ready to work.

There is **no** separate “Authorize with Canvas” OAuth screen for this alpha build—only LTI launch + token entry as above.

---

## Know before you edit

**Works now (typical alpha scope)**

- Edit titles, descriptions, dates, points across many rows.
- **Ctrl+Z** for undo in many flows (see limitations below).
- **Delete** (destructive—use sandbox first).
- **Mode selector** (e.g. Dev / Prod / Demo); developer / debug access may be password-protected—ask your pilot lead.

**Current limitations and caution**

- Some tabs or flows (e.g. **Accreditation**, parts of **Accessibility**) may still be **preview-only** or incomplete—confirm with your pilot lead for your build.
- **Fill Down** may not be implemented yet.
- **Undo** with **synced** edits: not fully verified—use care.
- **Assign To** / **Accommodations**: may be wired but unverified—use with caution.
- `podcast_enabled` is read-only (Canvas API).
- Quiz **`points_possible`** is read-only (Canvas derives it from questions).

---

## 6) Using the grid

1. Pick the **course** in the dropdown if needed.
2. Open a tab (**Assignments**, **Modules**, **Pages**, **Quizzes**, etc.).
3. Wait for the grid to finish loading.

## 7) Editing cells

- Click a cell to edit inline. Modified rows are marked.
- Click **Sync Changes** to write updates to Canvas.
- If sync fails, use the **System Debug Monitor** (if available in your mode) or contact your pilot lead.

## 8) Bulk actions

- **Search & Replace:** matching text across selected or filtered rows.
- **Date Shift:** shift selected date fields by your offset.
- **Points:** bulk numeric updates (or module position on **Modules**).

## 9) Clone and Delete

- **Clone:** options in the clone modal (naming, count, per-tab behavior).
- **Delete:** confirm carefully; some tabs offer deeper delete options.

## 10) Tips

- Avoid heavy sort/filter mid-session if you depend on undo (undo state may reset).
- **Sync** before switching tabs to reduce conflicts and missed changes.

---

## Quick troubleshooting

| Problem | What to try |
|--------|-------------|
| Security / external tool warning right after import | Finish **§3 LTI credentials**; submit valid key, secret, and launch URL. |
| Tool won’t load or shows an auth error | Re-check **Consumer Key** and **Shared Secret** in **App Configurations**. |
| Course content won’t load in the grid | Paste a fresh **API token**; confirm it hasn’t expired or been revoked; confirm **Canvas URL** matches the instance where the course lives. |
| Error such as **No LTI 1.1 shared secret found** | Contact the tool developer—server-side secret may need to match what is in Canvas. |

---

*Canvas Bulk Editor — Alpha quick start. Launch URL and LTI values are provided by your pilot; do not use example URLs from old screenshots if your lead has given different ones.*
