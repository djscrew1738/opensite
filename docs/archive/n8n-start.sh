#!/bin/bash
# Start n8n with proper configuration for OpenSite integration

export N8N_PORT=5678
export N8N_PROTOCOL=https
export N8N_HOST=app.ctlplumbingllc.com
export WEBHOOK_URL=https://app.ctlplumbingllc.com/webhook/
export VUE_APP_URL_BASE_API=https://app.ctlplumbingllc.com/n8n/

# Optional: Basic auth (set these in production)
# export N8N_BASIC_AUTH_ACTIVE=true
# export N8N_BASIC_AUTH_USER=admin
# export N8N_BASIC_AUTH_PASSWORD=your-secure-password

echo "Starting n8n..."
echo "Webhook URL: $WEBHOOK_URL"
n8n start
