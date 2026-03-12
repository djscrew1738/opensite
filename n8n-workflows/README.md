# n8n Workflow Automation

This directory contains n8n workflow configurations for automating business processes.

## Workflows

### 1. New Lead Notification
**File:** `new-lead-notification.json`

Triggers when a new lead is created in the system.
- Sends Slack notification
- Sends email to sales team
- Creates follow-up task in schedules

### 2. Hot Lead Alert
**File:** `hot-lead-alert.json`

Triggers when a lead scores 80+ (hot tier).
- Immediate SMS to sales manager
- High-priority Slack alert
- Creates urgent follow-up task

### 3. Daily Permit Digest
**File:** `daily-permit-digest.json`

Runs daily at 6 AM.
- Fetches new permits from all sources
- Generates summary report
- Emails to team

### 4. Follow-up Reminders
**File:** `follow-up-reminders.json`

Runs hourly.
- Checks for overdue follow-ups
- Sends reminders via email/SMS
- Escalates if no response

### 5. Weekly Analytics Report
**File:** `weekly-analytics.json`

Runs every Monday at 8 AM.
- Generates lead conversion report
- Creates permit source analysis
- Emails to management

## Setup

1. Install n8n:
```bash
npm install n8n -g
```

2. Import workflows:
```bash
n8n import:workflow --input=./n8n-workflows/
```

3. Configure credentials in n8n UI:
   - OpenSite API key
   - Slack webhook
   - Email SMTP
   - Twilio (for SMS)

4. Activate workflows in n8n UI

## Environment Variables

```bash
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password
N8N_WEBHOOK_URL=https://n8n.yourdomain.com
OPENSITE_API_KEY=your_api_key
```
