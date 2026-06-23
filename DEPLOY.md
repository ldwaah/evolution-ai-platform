# Evolution AI Platform Deployment

## Live site

**Production URL:** https://evolution-ai-platform.netlify.app

## Test login credentials

These are **demo-only** credentials for the online test run. Replace with real authentication before any production use.

| Role | Username | Password | Login page | Protected page |
| --- | --- | --- | --- | --- |
| Staff | `staff` | `EvoStaff2026` | `/login-staff.html` | `/dashboard.html` |
| Student | `student` | `EvoStudent2026` | `/login-student.html` | `/student.html` |

Session keys (browser `sessionStorage`):

- Staff: `evoStaffAuth`
- Student: `evoStudentAuth`

## What is gated

- **Staff dashboard** (`dashboard.html`): requires staff login. Includes lesson catalogue, student placement reviews, and staff tabs.
- **Student dashboard** (`student.html`): requires student login. Includes tutor selection, citizenship placement assessment, lessons, and progress.
- **Entry** (`index.html`): public. Simple open-door intro; press **Enter** to continue to the login chooser.
- **Login chooser** (`login.html`): public. Links route to login pages, not directly to dashboards.

## Auth note

Authentication is **client-side only** for this demo. Credentials are checked in the browser and stored in `sessionStorage`. Production must use server-side auth (OAuth, SSO, or similar).

## Deploy to Netlify

From the project root:

```bash
# Install Netlify CLI if needed
npm install -g netlify-cli

# Log in (opens browser)
netlify login

# First-time setup: link or create a site
netlify init

# Deploy to production
netlify deploy --prod --dir .
```

If the site is already linked, only the deploy command is needed:

```bash
netlify deploy --prod --dir .
```

After a successful deploy, update the **Production URL** at the top of this file with the URL printed by the CLI (for example `https://your-site-name.netlify.app`).

## Manual deploy alternative

1. Push this folder to a GitHub repository.
2. In [Netlify](https://app.netlify.com), create a new site from the repo.
3. Build command: _(none — static site)_
4. Publish directory: `.` (project root)
5. Deploy.

The included `netlify.toml` already sets `publish = "."`.
