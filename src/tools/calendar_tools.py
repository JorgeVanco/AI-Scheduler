from datetime import datetime
from typing import List, Dict, Any
import json
import pytz
import os

# Models
from src.models import CalendarModel, CalendarEvent, TaskListModel, TaskModel

# Agents and tools
from langchain.tools import tool

# from smolagents import tool

# Google API client libraries
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError
from googleapiclient.discovery import build

timezone = pytz.timezone("Europe/Madrid")
# Scopes for API access
SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/tasks",
]
TOKEN_FILE = "token.json"
CREDENTIALS_FILE = "credentials.json"

creds = None

# Check for existing token
if os.path.exists(TOKEN_FILE):
    creds = Credentials.from_authorized_user_info(
        json.loads(open(TOKEN_FILE).read()), SCOPES
    )

# If there are no valid credentials, authenticate
if not creds or not creds.valid:
    try:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
    except RefreshError as e:
        print(f"An error occurred during authentication: {e}")
        flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
        creds = flow.run_local_server(port=0)
        # creds = flow.run_console()

    # Save credentials for next run
    with open(TOKEN_FILE, "w") as token:
        token.write(creds.to_json())

print("Authentication successful!")

# Build service clients
calendar_service = build("calendar", "v3", credentials=creds)
tasks_service = build("tasks", "v1", credentials=creds)


@tool
def create_calendar_events(calendar_events: list[dict[str, str]]):
    """Creates all new calendar events at once given in a list with the summary, start_time and end_time

    Args:
        calendar_events (list): List of calendar events.
            Each calendar event is a dictionary with the following attributes:
                summary (str): Summary of the event.
                start_time (str): Start time in ISO format.
                end_time (str): End time in ISO format.
    """
    print("Creating events...")
    created_events = []
    for event in calendar_events:
        created_event = create_calendar_event.invoke(event)
        created_events.append(created_event)

    return created_events


@tool
def create_calendar_event(
    summary: str, start_time: str, end_time: str
) -> Dict[str, Any]:
    """Create a new calendar event.

    Args:
        summary (str): Summary of the event.
        start_time (str): Start time in ISO format.
        end_time (str): End time in ISO format.
    """
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
        .insert(calendarId=os.getenv("CALENDAR_ID"), body=event_body)
        .execute()
    )

    print(f"Event created: {created_event['htmlLink']}")
    return created_event


def list_calendars() -> List[Dict[str, Any]]:
    """List all calendars."""
    calendars_result = calendar_service.calendarList().list().execute()
    calendars = [
        CalendarModel(id=calendar["id"], summary=calendar["summary"])
        for calendar in calendars_result.get("items", [])
    ]
    return calendars


def get_calendar_events(
    id: str = os.getenv("CALENDAR_ID"), date: str = None
) -> List[CalendarEvent]:
    """Fetch calendar events for the specified date (today by default).

    Args:
        id (str): Calendar ID. Defaults to 'CALENDAR_ID' found in the environment variables.
        date (datetime): Date for which to fetch events. Defaults to today.
    """
    if not date:
        date = datetime.now(timezone)

    # Set time boundaries for the day
    start_time = date.replace(hour=0, minute=0, second=0).isoformat()
    end_time = date.replace(hour=23, minute=59, second=59).isoformat()

    events_result = (
        calendar_service.events()
        .list(
            calendarId=id,
            timeMin=start_time,
            timeMax=end_time,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )

    events = [
        CalendarEvent(
            id=event["id"],
            summary=event.get("summary", "No summary"),
            start=event["start"].get("dateTime", event["start"].get("date")),
            end=event["end"].get("dateTime", event["end"].get("date")),
        )
        for event in events_result.get("items", [])
    ]

    return events


def list_tasks() -> List[Dict[str, Any]]:
    """List all task lists."""
    tasklists_result = tasks_service.tasklists().list().execute()
    tasklists = [
        TaskListModel(title=task_list["title"], id=task_list["id"])
        for task_list in tasklists_result.get("items", [])
    ]
    return tasklists


def get_tasks(task_list_id: str = "@default") -> List[Dict[str, Any]]:
    """Fetch tasks from a specific task list.

    Args:
        task_list_id (str): The id of the task list to get the tasks from.
    """

    # Get incomplete tasks
    tasks_result = (
        tasks_service.tasks()
        .list(
            tasklist=task_list_id,
            showCompleted=False,
            showHidden=False,
            showDeleted=False,
        )
        .execute()
    )

    tasks = tasks_result.get("items", [])

    tasks = [
        TaskModel(
            id=task["id"],
            title=task["title"],
            notes=task.get("notes", ""),
            due_date=task.get("due", "No due date"),
        )
        for task in tasks
    ]

    return tasks
