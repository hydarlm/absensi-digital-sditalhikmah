"""
Timezone utilities for WIB (Western Indonesian Time - UTC+7)
"""
from datetime import datetime, timezone, timedelta
import pytz

# WIB Timezone (Asia/Jakarta)
WIB = pytz.timezone('Asia/Jakarta')

def get_wib_now() -> datetime:
    """Get current datetime in WIB timezone."""
    return datetime.now(WIB)

def to_wib(dt: datetime) -> datetime:
    """Convert datetime to WIB timezone."""
    if dt.tzinfo is None:
        # If naive, assume UTC
        dt = pytz.UTC.localize(dt)
    return dt.astimezone(WIB)

def from_wib_to_utc(dt: datetime) -> datetime:
    """Convert WIB datetime to UTC for database storage."""
    if dt.tzinfo is None:
        # If naive, assume WIB
        dt = WIB.localize(dt)
    return dt.astimezone(pytz.UTC)

def wib_time_now() -> str:
    """Get current time in WIB as HH:MM string."""
    return get_wib_now().strftime('%H:%M')

def wib_datetime_str(dt: datetime = None) -> str:
    """Format datetime as WIB string."""
    if dt is None:
        dt = get_wib_now()
    else:
        dt = to_wib(dt)
    return dt.strftime('%Y-%m-%d %H:%M:%S WIB')
