"""
Calendar Integration Service for CallBotAI
Supports ICS generation, Google Calendar, and Cal.com
"""

import os
import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from urllib.parse import quote
import httpx

# Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
CALCOM_API_KEY = os.getenv("CALCOM_API_KEY", "")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


# =============================================================================
# ICS File Generation
# =============================================================================

def generate_ics(
    title: str,
    description: str,
    start_time: datetime,
    end_time: datetime,
    location: str = "",
    organizer_email: str = "",
    organizer_name: str = "",
    attendee_email: str = "",
    attendee_name: str = ""
) -> str:
    """
    Generate an ICS calendar file content.
    Compatible with Google Calendar, Apple Calendar, Outlook, etc.
    """
    # Generate unique ID
    uid = f"{uuid.uuid4()}@callbotai.com"

    # Format dates in UTC
    def format_datetime(dt: datetime) -> str:
        return dt.strftime("%Y%m%dT%H%M%SZ")

    dtstamp = format_datetime(datetime.utcnow())
    dtstart = format_datetime(start_time)
    dtend = format_datetime(end_time)

    # Escape special characters
    def escape(text: str) -> str:
        return text.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")

    # Build ICS content
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//CallBot AI//Appointment Booking//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:REQUEST",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{dtstamp}",
        f"DTSTART:{dtstart}",
        f"DTEND:{dtend}",
        f"SUMMARY:{escape(title)}",
        f"DESCRIPTION:{escape(description)}",
    ]

    if location:
        lines.append(f"LOCATION:{escape(location)}")

    if organizer_email:
        org_name = f";CN={escape(organizer_name)}" if organizer_name else ""
        lines.append(f"ORGANIZER{org_name}:mailto:{organizer_email}")

    if attendee_email:
        att_name = f";CN={escape(attendee_name)}" if attendee_name else ""
        lines.append(f"ATTENDEE{att_name};RSVP=TRUE;PARTSTAT=NEEDS-ACTION:mailto:{attendee_email}")

    # Add alarm (reminder 30 minutes before)
    lines.extend([
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Reminder",
        "TRIGGER:-PT30M",
        "END:VALARM",
    ])

    lines.extend([
        "STATUS:CONFIRMED",
        "SEQUENCE:0",
        "END:VEVENT",
        "END:VCALENDAR"
    ])

    return "\r\n".join(lines)


def generate_appointment_ics(
    business_name: str,
    customer_name: str,
    customer_phone: str,
    customer_email: str,
    service_type: str,
    appointment_date: str,
    appointment_time: str,
    notes: str = "",
    business_email: str = "",
    business_address: str = "",
    duration_minutes: int = 60
) -> str:
    """Generate ICS for a booked appointment"""

    # Parse date and time
    try:
        # Handle various date formats
        if "/" in appointment_date:
            date_parts = appointment_date.split("/")
            if len(date_parts[2]) == 2:
                date_parts[2] = "20" + date_parts[2]
            appointment_date = f"{date_parts[2]}-{date_parts[0].zfill(2)}-{date_parts[1].zfill(2)}"

        # Parse time
        time_str = appointment_time.lower().strip()
        if "morning" in time_str:
            hour, minute = 9, 0
        elif "afternoon" in time_str:
            hour, minute = 14, 0
        elif "evening" in time_str:
            hour, minute = 17, 0
        else:
            # Try to parse specific time
            import re
            match = re.search(r'(\d{1,2}):?(\d{2})?\s*(am|pm)?', time_str, re.I)
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2) or 0)
                if match.group(3) and match.group(3).lower() == 'pm' and hour != 12:
                    hour += 12
                elif match.group(3) and match.group(3).lower() == 'am' and hour == 12:
                    hour = 0
            else:
                hour, minute = 10, 0  # Default to 10 AM

        start_time = datetime.strptime(appointment_date, "%Y-%m-%d").replace(hour=hour, minute=minute)
        end_time = start_time + timedelta(minutes=duration_minutes)

    except (ValueError, AttributeError):
        # Default to tomorrow at 10 AM if parsing fails
        start_time = datetime.now().replace(hour=10, minute=0, second=0) + timedelta(days=1)
        end_time = start_time + timedelta(minutes=duration_minutes)

    title = f"{service_type} - {customer_name}"

    description = f"""Appointment booked via CallBot AI

Customer: {customer_name}
Phone: {customer_phone}
Email: {customer_email or 'Not provided'}
Service: {service_type}

Notes:
{notes or 'No additional notes'}

---
Booked automatically by CallBot AI
"""

    return generate_ics(
        title=title,
        description=description,
        start_time=start_time,
        end_time=end_time,
        location=business_address,
        organizer_email=business_email,
        organizer_name=business_name,
        attendee_email=customer_email,
        attendee_name=customer_name
    )


# =============================================================================
# Google Calendar Links
# =============================================================================

def generate_google_calendar_link(
    title: str,
    start_time: datetime,
    end_time: datetime,
    description: str = "",
    location: str = ""
) -> str:
    """Generate a Google Calendar 'Add Event' link"""
    base_url = "https://calendar.google.com/calendar/render"

    def format_datetime(dt: datetime) -> str:
        return dt.strftime("%Y%m%dT%H%M%SZ")

    params = {
        "action": "TEMPLATE",
        "text": title,
        "dates": f"{format_datetime(start_time)}/{format_datetime(end_time)}",
        "details": description,
        "location": location,
    }

    query_string = "&".join(f"{k}={quote(str(v))}" for k, v in params.items() if v)
    return f"{base_url}?{query_string}"


# =============================================================================
# Cal.com Integration
# =============================================================================

class CalComIntegration:
    """Cal.com API integration for advanced scheduling"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or CALCOM_API_KEY
        self.base_url = "https://api.cal.com/v1"

    async def _request(self, method: str, endpoint: str, data: dict = None) -> dict:
        """Make API request to Cal.com"""
        if not self.api_key:
            raise ValueError("Cal.com API key not configured")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            if method == "GET":
                response = await client.get(
                    f"{self.base_url}{endpoint}",
                    headers=headers,
                    params=data
                )
            else:
                response = await client.request(
                    method,
                    f"{self.base_url}{endpoint}",
                    headers=headers,
                    json=data
                )

            response.raise_for_status()
            return response.json()

    async def get_event_types(self) -> List[dict]:
        """Get available event types"""
        result = await self._request("GET", "/event-types")
        return result.get("event_types", [])

    async def get_availability(
        self,
        event_type_id: int,
        start_date: str,
        end_date: str
    ) -> List[dict]:
        """Get available time slots"""
        result = await self._request("GET", "/availability", {
            "eventTypeId": event_type_id,
            "startTime": start_date,
            "endTime": end_date
        })
        return result.get("slots", [])

    async def create_booking(
        self,
        event_type_id: int,
        start_time: str,
        name: str,
        email: str,
        phone: str = None,
        notes: str = None,
        metadata: dict = None
    ) -> dict:
        """Create a booking"""
        data = {
            "eventTypeId": event_type_id,
            "start": start_time,
            "responses": {
                "name": name,
                "email": email,
            },
            "metadata": metadata or {}
        }

        if phone:
            data["responses"]["phone"] = phone
        if notes:
            data["responses"]["notes"] = notes

        return await self._request("POST", "/bookings", data)

    async def cancel_booking(self, booking_id: int, reason: str = None) -> dict:
        """Cancel a booking"""
        data = {}
        if reason:
            data["cancellationReason"] = reason
        return await self._request("DELETE", f"/bookings/{booking_id}", data)

    async def reschedule_booking(
        self,
        booking_id: int,
        new_start_time: str,
        reason: str = None
    ) -> dict:
        """Reschedule a booking"""
        data = {
            "start": new_start_time,
        }
        if reason:
            data["rescheduleReason"] = reason
        return await self._request("PATCH", f"/bookings/{booking_id}", data)


# =============================================================================
# Webhook Handler for Calendar Events
# =============================================================================

async def handle_calcom_webhook(payload: dict) -> dict:
    """Handle incoming Cal.com webhook"""
    event_type = payload.get("triggerEvent")

    if event_type == "BOOKING_CREATED":
        booking = payload.get("payload", {})
        return {
            "action": "booking_created",
            "booking_id": booking.get("id"),
            "start_time": booking.get("startTime"),
            "end_time": booking.get("endTime"),
            "attendee": booking.get("attendees", [{}])[0],
            "event_type": booking.get("eventType", {}).get("title")
        }

    elif event_type == "BOOKING_CANCELLED":
        booking = payload.get("payload", {})
        return {
            "action": "booking_cancelled",
            "booking_id": booking.get("id"),
            "reason": booking.get("cancellationReason")
        }

    elif event_type == "BOOKING_RESCHEDULED":
        booking = payload.get("payload", {})
        return {
            "action": "booking_rescheduled",
            "booking_id": booking.get("id"),
            "new_start_time": booking.get("startTime"),
            "new_end_time": booking.get("endTime")
        }

    return {"action": "unknown", "event": event_type}


# =============================================================================
# Appointment Slot Generation
# =============================================================================

def generate_available_slots(
    business_hours: str,
    booked_slots: List[dict],
    days_ahead: int = 14,
    slot_duration_minutes: int = 60,
    buffer_minutes: int = 15
) -> List[dict]:
    """
    Generate available appointment slots based on business hours.

    Args:
        business_hours: String like "Monday-Friday: 9am-5pm, Saturday: 10am-2pm"
        booked_slots: List of {"start": datetime, "end": datetime}
        days_ahead: Number of days to generate slots for
        slot_duration_minutes: Duration of each slot
        buffer_minutes: Buffer time between appointments

    Returns:
        List of available slots with start and end times
    """
    import re
    from datetime import time as dt_time

    # Parse business hours
    def parse_hours(hours_str: str) -> dict:
        """Parse business hours string into structured data"""
        schedule = {}
        days_map = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6
        }

        # Default closed
        for day in range(7):
            schedule[day] = None

        # Parse each part
        parts = hours_str.lower().split(",")
        for part in parts:
            part = part.strip()
            if not part or "closed" in part:
                continue

            # Extract days and times
            match = re.match(r'([a-z\-]+):\s*(\d{1,2})(am|pm)\s*-\s*(\d{1,2})(am|pm)', part, re.I)
            if match:
                days_str, start_h, start_p, end_h, end_p = match.groups()

                # Convert to 24-hour
                start_hour = int(start_h) + (12 if start_p == 'pm' and int(start_h) != 12 else 0)
                if start_p == 'am' and int(start_h) == 12:
                    start_hour = 0
                end_hour = int(end_h) + (12 if end_p == 'pm' and int(end_h) != 12 else 0)
                if end_p == 'am' and int(end_h) == 12:
                    end_hour = 0

                # Determine which days
                if "-" in days_str:
                    start_day, end_day = days_str.split("-")
                    start_idx = days_map.get(start_day.strip(), 0)
                    end_idx = days_map.get(end_day.strip(), 4)
                    for day in range(start_idx, end_idx + 1):
                        schedule[day] = (start_hour, end_hour)
                else:
                    day_idx = days_map.get(days_str.strip())
                    if day_idx is not None:
                        schedule[day_idx] = (start_hour, end_hour)

        return schedule

    schedule = parse_hours(business_hours)
    available_slots = []

    # Generate slots for each day
    current_date = datetime.now().date() + timedelta(days=1)  # Start tomorrow
    end_date = current_date + timedelta(days=days_ahead)

    while current_date < end_date:
        day_of_week = current_date.weekday()
        hours = schedule.get(day_of_week)

        if hours:
            start_hour, end_hour = hours
            slot_start = datetime.combine(current_date, dt_time(start_hour, 0))
            day_end = datetime.combine(current_date, dt_time(end_hour, 0))

            while slot_start + timedelta(minutes=slot_duration_minutes) <= day_end:
                slot_end = slot_start + timedelta(minutes=slot_duration_minutes)

                # Check if slot conflicts with booked slots
                is_available = True
                for booked in booked_slots:
                    booked_start = booked.get("start")
                    booked_end = booked.get("end")
                    if booked_start and booked_end:
                        if isinstance(booked_start, str):
                            booked_start = datetime.fromisoformat(booked_start.replace("Z", "+00:00"))
                        if isinstance(booked_end, str):
                            booked_end = datetime.fromisoformat(booked_end.replace("Z", "+00:00"))

                        # Check overlap
                        if not (slot_end <= booked_start or slot_start >= booked_end):
                            is_available = False
                            break

                if is_available:
                    available_slots.append({
                        "start": slot_start.isoformat(),
                        "end": slot_end.isoformat(),
                        "date": current_date.strftime("%Y-%m-%d"),
                        "time": slot_start.strftime("%I:%M %p"),
                        "day": current_date.strftime("%A")
                    })

                slot_start = slot_end + timedelta(minutes=buffer_minutes)

        current_date += timedelta(days=1)

    return available_slots
