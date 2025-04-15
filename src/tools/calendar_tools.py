from datetime import datetime, timedelta
from typing import TypedDict, List, Dict, Any, Optional
import json
import pytz
import os

# Agents and tools
from langchain.tools import BaseTool, StructuredTool, tool

# Google API client libraries
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

timezone = pytz.timezone("Europe/Madrid")
# Scopes for API access
SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/tasks",
]

creds = None

# Check for existing token
if os.path.exists("token.json"):
    creds = Credentials.from_authorized_user_info(
        json.loads(open("token.json").read()), SCOPES
    )

# If there are no valid credentials, authenticate
if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
        creds = flow.run_local_server(port=0)

    # Save credentials for next run
    with open("token.json", "w") as token:
        token.write(creds.to_json())

print("Authentication successful!")

# Build service clients
calendar_service = build("calendar", "v3", credentials=creds)
tasks_service = build("tasks", "v1", credentials=creds)


@tool
def create_calendar_event(
    summary: str, start_time: str, end_time: str, calendar_id="primary"
) -> Dict[str, Any]:
    """Create a new calendar event."""
    print(f"Creating new event '{summary}'...")

    # Create event body
    event_body = {
        "summary": summary,
        "start": {"dateTime": start_time, "timeZone": str(timezone)},
        "end": {"dateTime": end_time, "timeZone": str(timezone)},
    }

    # Insert new event
    created_event = (
        calendar_service.events()
        .insert(calendarId=calendar_id, body=event_body)
        .execute()
    )

    print(f"Event created: {created_event['htmlLink']}")
    return created_event
