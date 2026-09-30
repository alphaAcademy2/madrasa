# HIMAYATHUL ISLAM MADRASA - NADUVATHUR — GitHub Pages

Samastha Registration No: 737

## Architecture

GitHub Pages + static HTML/CSS/JS
→ Google Apps Script Web App API
→ Google Sheets

The same Apps Script API is intended for future Flutter Admin/Usthad/Student applications.

## Files

- `index.html` - SPA entry point
- `style.css` - responsive design
- `app.js` - routing, UI and API calls
- `worker.js` - Cloudflare Worker SPA routing
- `Code.gs` - Google Apps Script API/backend
- `wrangler.toml` - Cloudflare deployment configuration
- `README.md` - setup instructions

## Important security note

A QR URL contains only a Student ID. The public student GET endpoint returns only permitted profile/content. Sensitive writes such as prayer entry require a server-issued authenticated student session.

Do not put passwords, Sheet IDs, API keys, or private data into QR codes or frontend JavaScript.

## 1. Create Google Sheet

Create one Google Spreadsheet and copy its ID.

Open Apps Script and paste `Code.gs`.

Set:

`CONFIG.SPREADSHEET_ID`

Change:

`CONFIG.ADMIN_USER`
`CONFIG.ADMIN_PASSWORD`

Run `setupSheets()` once and authorize the script.

## 2. Deploy Apps Script

Deploy → New deployment → Web app.

- Execute as: Me
- Who has access: Anyone with the URL

Copy the Web App URL.

## 3. Configure Cloudflare

Recommended Worker environment variable:

`MADRASA_API_URL = https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`

Put the files in a Cloudflare Workers Static Assets project.

Example `wrangler.toml`:

```toml
name = "himayathul-islam-madrasa"
compatibility_date = "2026-09-30"

[assets]
directory = "./"
binding = "ASSETS"

[vars]
MADRASA_API_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"
```

Then deploy:

```bash
npx wrangler deploy
```

## 4. Student QR

Recommended QR URL:

`https://your-domain.com/student/STD001`

Only the unique ID is in the QR. Do not encode the student's name, phone, guardian, DOB or other private information.

## 5. Student prayer write security

The sample backend intentionally refuses anonymous prayer writes. A production student authentication flow should issue a short-lived STUDENT session after validating a secure QR token / student credential.

Do not use the visible Student ID alone as a write credential.

## 6. Dynamic Programs

Programs are stored in the `Programs` sheet.

Use:

- `status`: ACTIVE / INACTIVE
- `target_type`: WHOLE_MADRASA / CLASS / STUDENT
- `target_class_id`
- `target_student_id`
- `start_date`
- `end_date`
- `display_order`

Inactive or date-expired programs are not returned to students.

If there are no visible programs, the whole Programs section is omitted.

## 7. Attendance

Attendance is monthly summary data:

`Absent = Working Days - Attended Days`

`Percentage = Attended Days / Working Days * 100`

The student page requests only the last completed month.

## 8. No mobile update banner

This Web App intentionally contains no mobile application update banner/system. Mobile app version management belongs to future Flutter applications.

## 9. Future Flutter

Future Flutter apps should call the same Apps Script endpoint with JSON:

```json
{
  "action": "some.action",
  "payload": {},
  "session": "SESSION_TOKEN"
}
```

Do not create a second database.

## Production hardening checklist

Before public launch, add:

1. Password hashing/salted hashes for Users.
2. Secure student QR tokens instead of treating a public Student ID as a credential.
3. Short-lived refresh/session strategy.
4. Rate limiting at Cloudflare Worker and/or Apps Script layer.
5. Strict input validation.
6. Audit logs for admin/teacher changes.
7. File upload handling with controlled Drive folders and MIME/size validation.
8. Fine-grained teacher class authorization in every write endpoint.
9. Published-result checks before returning marks.
10. CORS/origin policy appropriate to the final domain.


## GitHub Pages deployment

1. Create a GitHub repository, for example `madrasa`.
2. Upload:
   - `index.html`
   - `404.html`
   - `config.js`
   - `style.css`
   - `app.js`
   - `Code.gs` (reference/backend file; it does not execute on GitHub)
   - `API_CONTRACT.md`
3. Edit `config.js`:

```javascript
window.MADRASA_API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
window.MADRASA_BASE_PATH = "/madrasa";
```

If using a custom domain such as `https://madrasa.example.com`, use:

```javascript
window.MADRASA_BASE_PATH = "";
```

4. GitHub → Settings → Pages → Deploy from branch → `main` → `/root`.
5. Your QR URL can be:

`https://USERNAME.github.io/madrasa/student/STD001`

or with a custom domain:

`https://madrasa.example.com/student/STD001`

`404.html` is used as the GitHub Pages SPA fallback so direct QR links can load the same application.

## Important GitHub Pages limitation

GitHub Pages is static hosting. It does not execute `Code.gs`.

`Code.gs` must be deployed separately as a Google Apps Script Web App. GitHub Pages only calls that API.

## Recommended production setup

GitHub Pages:
- frontend
- routing fallback
- CSS/JS
- student/admin/usthad UI

Google Apps Script:
- authentication
- authorization
- validation
- database operations
- Google Sheets access

Google Sheets:
- single shared database for Web + future Flutter apps

No mobile update banner/system is included in this Web App.
