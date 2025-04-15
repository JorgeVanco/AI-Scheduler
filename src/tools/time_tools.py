# Agents and tools
from langchain.tools import BaseTool, StructuredTool, tool
from datetime import datetime, timedelta
import pytz


@tool
def get_current_time() -> str:
    """Get the current time in ISO format."""

    # Get the current time in local timezone
    local_now = datetime.now(pytz.timezone("Europe/Madrid"))

    return local_now.isoformat()


@tool
def get_date_in_iso_format(date_str: str) -> str:
    """Get the time from a date string in ISO format (YYYY-MM-DD HH:MM).

    Example:
    Input: "2023-10-01 12:30"
    Output: "2023-10-01T12:30:00"
    """
    # Parse the date string
    date_obj = datetime.strptime(date_str, "%Y-%m-%d %H:%M")

    # Convert to ISO format
    iso_time = date_obj.isoformat()

    return iso_time


@tool
def sum_to_date(date_str: str, weeks: int, days: int, hours: int, minutes: int) -> str:
    """Add weeks, days, hours, and minutes to a date string in ISO format.

    Returns: The resulting date in ISO format.
    """
    date_obj = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
    return (
        date_obj + timedelta(weeks=weeks, days=days, hours=hours, minutes=minutes)
    ).isoformat()
