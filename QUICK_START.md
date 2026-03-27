# Canvas Bulk Editor — Quick Start (Alpha)

This guide is for **alpha testers**. It assumes you have been enrolled in an **empty Canvas FFT course** that already has the Bulk Editor tool configured—you do not create that course yourself.

## 1) Export the alpha FFT course and import it into your own course

You’ll use the shared FFT course only as a **download source**. Do your real testing in a course **you** control.

1. Log into **Canvas FFT** and open the alpha course you were given access to.
2. Go to **Settings → Export Course Contents** (wording may vary slightly in FFT).
3. When the export is ready, download the **`.imscc`** file to your computer.
4. Log into **your Canvas** (campus production, sandbox, or another instance where you have teacher access to a course).
5. Open the course where you want to work (or create an empty course), then run **Import Course Content** (or your institution’s equivalent) and import that **`.imscc`**.

**Do not** import your own course content into the shared FFT alpha course. That shell is shared with other testers; mixing content there causes conflicts. Export **from** FFT, import **into** your course only.

## 2) Get your Canvas API token

Create the token in **the same Canvas** as the course you will edit with Bulk Editor (usually the course you imported the package into, not a different instance).

**Canvas FFT** supports personal access tokens the same way production Canvas does.

1. In that Canvas, go to **Account → Settings**.
2. Scroll to **Approved Integrations**.
3. Click **New Access Token**.
4. Give it a name (example: `Bulk Editor`) and optionally set an expiration date.
5. Copy the token immediately. **Canvas will never show it again.**
6. Store it in a password manager (1Password, Bitwarden, LastPass).  
   **Do not** store it in a text file, email, or Slack.
7. Treat it like a password: the token has the same permissions as your Canvas account.
8. On first app launch, paste it into the token field.  
   The app stores it locally, so you usually only re-enter it if it expires or is revoked.

## 3) Getting started

1. Open the app and choose your course from the course dropdown.
2. Click a tab (Assignments, Modules, Pages, Quizzes, etc.).
3. Wait for the grid to load the data for that tab.

## 4) Editing cells

- Click into a cell to edit it inline.
- Changed rows are marked as modified.
- Click **Sync Changes** to save edits to Canvas.
- If sync fails, check the **System Debug Monitor** for details.

## 5) Bulk actions

- **Search & Replace**: updates matching text across selected rows (or filtered rows if none selected).
- **Date Shift**: moves selected date fields forward/backward by the offset you choose.
- **Points**: bulk updates numeric point values (or module position when on Modules).

## 6) Clone and Delete

- **Clone** creates copies using the options in the clone modal (naming, count, method by tab).
- **Delete** removes selected items after confirmation; some tabs include deeper delete options.
- Always read the confirmation text before proceeding.

## 7) Known limitations

- `podcast_enabled` is read-only (Canvas API limitation).
- Quiz `points_possible` is read-only (Canvas computes it from question values).

## 8) Tips

- Don’t sort or filter in the middle of a heavy edit session if you rely on undo (undo history can be cleared).
- Sync before switching tabs to reduce conflicts and missed changes.
