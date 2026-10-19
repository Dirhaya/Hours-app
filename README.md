# Hours

A minimalist, mobile-first personal work-hours tracker. Beige, white and black themes. Plain HTML, CSS and JavaScript; no build step or third-party dependencies.

## Features

- Clock in/out, unpaid breaks and a timer that survives reopening.
- Weekly target, live remaining hours, weekly history and daily bars.
- Add a manual clock-in with no clock-out to keep a shift running.
- Use Edit times to add a manual clock-out to a running shift.
- Add, edit and delete shifts; reject overlaps and invalid times.
- Configurable Monday, Sunday or Saturday week start.
- JSON backup and restore.
- Home Screen manifest, iPhone icon and offline app-shell cache.

## Run locally

Run `python3 -m http.server 8080` from this directory, then open http://localhost:8080. Do not open index.html as a file: ES modules and the service worker need an HTTP server. Run `npm test` with Node.js 18+ for time-calculation and data-validation tests.

## Publish with GitHub Pages

1. Create a GitHub repository named `hours-app` (public if using free public-repository Pages hosting).
2. Upload the contents of this folder, including the icons folder, to the repository root. Do not upload just the ZIP. The index.html file must be at the root.
3. In repository Settings → Pages, choose Deploy from a branch, select main and /(root), then Save.
4. Open the published URL displayed by GitHub Pages after deployment completes.

Alternatively, push this folder with Git after creating your repository. Do not commit personal backup JSON files. This source contains no personal shifts.

Official guide: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Install on iPhone

Open the published HTTPS URL in Safari. Open Share → Add to Home Screen, enable Open as Web App if offered, and tap Add. Launch Hours from the new icon. Visit online first so the app can cache its files; Settings reports offline readiness. This is a web app, not an App Store application.

Apple guide: https://support.apple.com/guide/iphone/turn-a-website-into-an-app-iphea86e5236/ios

## Data and limitations

Shifts and preferences stay in localStorage on this browser/device. GitHub hosts only the application code, not your work logs. There is no login, cloud sync or automatic backup. Download backups regularly from Settings. Clearing website data or removing an app may erase records. Safari, the ChatGPT preview and the installed Home Screen app can use separate storage; existing preview data does not transfer automatically. Restore a backup when moving between supported installations.

Times and week boundaries follow the device timezone. Unpaid breaks are split exactly at week boundaries. History totals show only the portion inside the selected week. Totals display whole minutes; seconds are retained internally. Keep the device clock accurate. Use one tab/device at a time for edits; multi-device synchronization is not provided. Weekly target changes apply to every displayed week.

Manual unpaid breaks can be represented by separate work intervals. Editing a shift preserves its recorded breaks. There are no payroll rules, overtime multipliers or background notifications.

For releases, bump the CACHE version in sw.js whenever cached files change. The new worker activates after old app windows close. Reopen online to receive an update.

## Project status

Ready to upload and host. Automated calculation, validation and manual-entry tests pass. JavaScript syntax checks pass. Browser UI checks could not run in the build environment because its browser executable was unavailable. Physical iPhone installation must be verified after deployment; it has not been tested on a physical iPhone here.
