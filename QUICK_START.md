# Canvas Bulk Editor — Quick Start (Alpha)

This guide is for alpha testers who want to get productive quickly.

## 1) Get your Canvas API token first

You can use a normal Canvas instance or **Canvas FFT** (Flexible Framework Testing). FFT supports creating personal API access tokens the same way as production.

1. Log into Canvas (or FFT).
2. Go to **Account → Settings**.
3. Scroll to **Approved Integrations**.
4. Click **New Access Token**.
5. Give it a name (example: `Bulk Editor`) and optionally set an expiration date.
6. Copy the token immediately. **Canvas will never show it again.**
7. Store it in a password manager (1Password, Bitwarden, LastPass).  
   **Do not** store it in a text file, email, or Slack.
8. Treat it like a password: the token has the same permissions as your Canvas account.
9. On first app launch, paste it into the token field.  
   The app stores it locally, so you usually only re-enter it if it expires or is revoked.

### Alpha setup with FFT and sharing

For shared testing without e-mailing course packages:

1. In **Canvas FFT**, create or pick an **empty course** dedicated to Bulk Editor alpha work.
2. Add your API token (steps above) and point Bulk Editor at that FFT course.
3. **Share the FFT course** with collaborators—for example, enroll Shauna as **Teacher** or **Designer** so she can open the same course in FFT.
4. Anyone with access can **download the `.imscc` export directly** from Canvas: use **Settings → Export Course Contents** (wording may vary slightly in FFT), then download the export to their machine. No need to send the package by e-mail.

## 2) Getting started

1. Open the app and choose your course from the course dropdown.
2. Click a tab (Assignments, Modules, Pages, Quizzes, etc.).
3. Wait for the grid to load the data for that tab.

## 3) Editing cells

- Click into a cell to edit it inline.
- Changed rows are marked as modified.
- Click **Sync Changes** to save edits to Canvas.
- If sync fails, check the **System Debug Monitor** for details.

## 4) Bulk actions

- **Search & Replace**: updates matching text across selected rows (or filtered rows if none selected).
- **Date Shift**: moves selected date fields forward/backward by the offset you choose.
- **Points**: bulk updates numeric point values (or module position when on Modules).

## 5) Clone and Delete

- **Clone** creates copies using the options in the clone modal (naming, count, method by tab).
- **Delete** removes selected items after confirmation; some tabs include deeper delete options.
- Always read the confirmation text before proceeding.

## 6) Known limitations

- `podcast_enabled` is read-only (Canvas API limitation).
- Quiz `points_possible` is read-only (Canvas computes it from question values).

## 7) Tips

- Don’t sort or filter in the middle of a heavy edit session if you rely on undo (undo history can be cleared).
- Sync before switching tabs to reduce conflicts and missed changes.
