# Email & SMS Configuration Guide

Complete guide for configuring email monitoring and SMS notifications in OpenSite.

## Table of Contents
1. [Overview](#overview)
2. [Quick Setup Checklist](#quick-setup-checklist)
3. [Email Monitoring Setup](#email-monitoring-setup)
4. [SMS Notifications Setup](#sms-notifications-setup)
5. [SMTP Email Setup](#smtp-email-setup)
6. [Testing Your Configuration](#testing-your-configuration)
7. [Troubleshooting](#troubleshooting)

---

## Overview

OpenSite supports three types of notifications:

1. **Email Monitoring (IMAP)** - Monitors your email inbox for job-related keywords and sends SMS alerts
2. **SMS Notifications (Twilio)** - Sends text message alerts for important emails and job updates
3. **SMTP Email** - Sends daily digest emails and reports

---

## Quick Setup Checklist

```bash
# 1. Email Monitoring (IMAP)
☐ IMAP_HOST (e.g., outlook.office365.com)
☐ IMAP_USER (your email address)
☐ IMAP_PASS (your email password or app password)
☐ Enable email monitor in settings

# 2. SMS Notifications (Twilio)
☐ TWILIO_ACCOUNT_SID (from Twilio console)
☐ TWILIO_AUTH_TOKEN (from Twilio console)
☐ TWILIO_FROM_NUMBER (your Twilio phone number)
☐ NOTIFY_PHONE_NUMBER (your mobile number)

# 3. SMTP (Outgoing Email)
☐ SMTP_HOST (e.g., smtp.gmail.com)
☐ SMTP_USER (your email address)
☐ SMTP_PASS (your email password or app password)
☐ NOTIFY_EMAIL (destination email address)
```

---

## Email Monitoring Setup

### Step 1: Determine Your Email Provider Settings

#### Microsoft Outlook / Office 365
```env
IMAP_HOST=outlook.office365.com
IMAP_PORT=993
IMAP_USER=your-email@outlook.com
IMAP_PASS=your-app-password
```

**Note:** You MUST use an App Password, not your regular password.
1. Go to [account.microsoft.com](https://account.microsoft.com)
2. Security → Advanced security options
3. Create new app password
4. Use this app password in IMAP_PASS

#### Gmail / Google Workspace
```env
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
```

**Note:** You MUST use an App Password:
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → App passwords
3. Generate app password for "Mail"
4. Use this 16-character password in IMAP_PASS

### Step 2: Configure Environment Variables

Add to your `.env` file:
```env
# Email Monitor Configuration
IMAP_HOST=outlook.office365.com
IMAP_PORT=993
IMAP_USER=your-email@company.com
IMAP_PASS=your-app-password-here

# Enable the monitor
EMAIL_MONITOR_ENABLED=true
```

### Step 3: Configure Monitor Keywords (Optional)

By default, the monitor watches for:
- permit, inspection, variance, schedule change
- plumbing, rough-in, top-out, trim
- delay, urgent, code violation
- approved, rescheduled, failed

To customize keywords, add to your `.env`:
```env
EMAIL_MONITOR_KEYWORDS=permit,inspection,plumbing,urgent,custom-keyword
```

---

## SMS Notifications Setup

### Step 1: Create a Twilio Account

1. Go to [twilio.com](https://www.twilio.com)
2. Sign up for a free account
3. Verify your phone number

### Step 2: Get Your Twilio Credentials

From your Twilio Console Dashboard:
- **Account SID** (starts with "AC...")
- **Auth Token** (click "Show" to reveal)

### Step 3: Get a Twilio Phone Number

1. In Twilio Console, go to "Phone Numbers" → "Manage" → "Buy a number"
2. Select a number with SMS capability
3. Note the phone number (e.g., +1234567890)

### Step 4: Configure Environment Variables

Add to your `.env` file:
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token-here
TWILIO_FROM_NUMBER=+1234567890

# Your mobile number for receiving alerts
NOTIFY_PHONE_NUMBER=+1987654321
```

**Important Phone Number Format:**
- Use international format: `+1234567890`
- Include country code (e.g., +1 for US)
- No spaces, dashes, or parentheses in env variables

---

## SMTP Email Setup

For sending daily digests and reports via email.

### Gmail / Google Workspace

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NOTIFY_EMAIL=recipient@example.com
```

**Note:** Use an App Password (same process as IMAP above)

### Microsoft Outlook / Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-app-password
NOTIFY_EMAIL=recipient@example.com
```

### Other Email Providers

| Provider | SMTP_HOST | Port |
|----------|-----------|------|
| Yahoo | smtp.mail.yahoo.com | 587 |
| iCloud | smtp.mail.me.com | 587 |
| Zoho | smtp.zoho.com | 587 |
| Custom | Your provider's SMTP host | 587 or 465 |

---

## Testing Your Configuration

### Method 1: API Endpoints

Test via the OpenSite API:

```bash
# Check configuration status
curl http://localhost:5001/api/notifications/config-status

# Test email connection
curl -X POST http://localhost:5001/api/notifications/test-email-connection \
  -H "Content-Type: application/json" \
  -d '{
    "host": "outlook.office365.com",
    "port": 993,
    "user": "your-email@example.com",
    "pass": "your-password"
  }'

# Send test SMS
curl -X POST http://localhost:5001/api/notifications/test-sms \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'

# Send test email
curl -X POST http://localhost:5001/api/notifications/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "recipient@example.com"}'
```

### Method 2: Server Console

Check configuration on server startup:

```bash
cd /home/djscrew/opensite/backend
node -e "
  const { printConfigStatus } = require('./src/utils/notification-config-checker.js');
  printConfigStatus();
"
```

### Method 3: Dashboard UI

1. Open OpenSite Dashboard
2. Go to Settings → Notifications
3. View configuration status
4. Click "Test Email" or "Test SMS" buttons

---

## Troubleshooting

### Email Connection Issues

#### "IMAP connection failed: Authentication failed"
- **Cause:** Using regular password instead of app password
- **Solution:** Generate and use an app password (see Email Setup section)

#### "IMAP connection failed: Invalid credentials"
- **Cause:** Wrong username or password
- **Solution:** 
  - Verify email address is correct
  - Reset app password and try again
  - Check if 2FA is required

#### "Unable to connect to server"
- **Cause:** Wrong IMAP host or port
- **Solution:**
  - Verify IMAP settings with your email provider
  - Check firewall isn't blocking port 993
  - Try telnet: `telnet imap.gmail.com 993`

### SMS Issues

#### "Twilio not configured"
- **Cause:** Missing Twilio credentials
- **Solution:** Add all required Twilio env variables

#### "The 'To' number is not a valid phone number"
- **Cause:** Wrong phone number format
- **Solution:** Use international format: `+1234567890`

#### "Account SID must start with AC"
- **Cause:** Wrong Account SID format
- **Solution:** Copy the complete Account SID from Twilio Console

#### SMS not received
- **Cause:** Trial account limitations
- **Solution:** 
  - Verify recipient number in Twilio (trial accounts)
  - Upgrade to paid Twilio account
  - Check Twilio logs in Console

### SMTP Email Issues

#### "Invalid login"
- **Cause:** Using regular password instead of app password
- **Solution:** Generate app password for SMTP

#### "Relay access denied"
- **Cause:** SMTP authentication not enabled
- **Solution:** Check SMTP settings, ensure auth is enabled

---

## Security Best Practices

1. **Use App Passwords** - Never use your main email password
2. **Secure .env File** - Ensure `.env` has restricted permissions:
   ```bash
   chmod 600 /home/djscrew/opensite/.env
   chmod 600 /home/djscrew/opensite/backend/.env
   ```
3. **Don't Commit Credentials** - Never commit `.env` files to git
4. **Rotate Passwords** - Change app passwords every 90 days
5. **Use HTTPS** - Always use HTTPS in production

---

## Environment Variable Reference

| Variable | Required For | Example |
|----------|--------------|---------|
| `IMAP_HOST` | Email monitoring | `outlook.office365.com` |
| `IMAP_PORT` | Email monitoring | `993` |
| `IMAP_USER` | Email monitoring | `user@example.com` |
| `IMAP_PASS` | Email monitoring | `app-password` |
| `EMAIL_MONITOR_ENABLED` | Email monitoring | `true` |
| `TWILIO_ACCOUNT_SID` | SMS alerts | `ACxxxxxxxx...` |
| `TWILIO_AUTH_TOKEN` | SMS alerts | `auth-token` |
| `TWILIO_FROM_NUMBER` | SMS alerts | `+1234567890` |
| `NOTIFY_PHONE_NUMBER` | SMS alerts | `+1987654321` |
| `SMTP_HOST` | Outgoing email | `smtp.gmail.com` |
| `SMTP_PORT` | Outgoing email | `587` |
| `SMTP_USER` | Outgoing email | `user@example.com` |
| `SMTP_PASS` | Outgoing email | `app-password` |
| `NOTIFY_EMAIL` | Outgoing email | `recipient@example.com` |

---

## Need Help?

If you continue to experience issues:

1. Check server logs: `tail -f /home/djscrew/opensite/backend.log`
2. Run configuration checker: See Testing section above
3. Verify credentials with your email/SMS provider
4. Check firewall settings for IMAP/SMTP ports

For Twilio-specific issues, check the [Twilio Status Page](https://status.twilio.com/).
