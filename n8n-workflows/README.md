# n8n Workflows for CTL Plumbing

## Setup Instructions

### 1. Install n8n
```bash
npm install -g n8n
```

### 2. Start n8n
```bash
n8n start
```
Access at http://localhost:5678

### 3. Import Workflows
1. Go to Workflows → Import from File
2. Import each JSON file from this directory

### 4. Configure Credentials
Set up these credentials in n8n:
- **Telegram Bot** (for emergency alerts)
- **SMTP** (for email notifications)
- **Environment Variables**:
  - `TELEGRAM_CHAT_ID` - Chat ID for alerts
  - `FROM_EMAIL` - Sender email address
  - `NOTIFICATION_EMAIL` - Recipient email address

### 5. Configure Webhook URL
Update the webhook URL in your frontend/app to:
```
https://app.ctlplumbingllc.com/webhook/lead-submission
```

## Workflows

### 1. Lead Integration (`lead-integration.json`)
**Triggers:** Webhook from website lead form
**Actions:**
- Creates lead in OpenSite
- AI scores the lead automatically
- Sends Telegram alert for emergencies
- Sends email notification

### 2. Daily Report (`daily-report.json`)
**Triggers:** Daily at 8:00 AM
**Actions:**
- Fetches dashboard stats
- Fetches all leads
- Generates daily summary
- Sends email report

## API Endpoints Used
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id/score` - Update lead score
- `POST /api/ai/optimize/generate` - AI scoring
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/leads` - List all leads
