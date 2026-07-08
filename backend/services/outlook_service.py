import os
import json
import urllib.parse
import requests as http
import msal
from datetime import datetime, timezone, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
TOKEN_CACHE_FILE = os.path.join(DATA_DIR, "outlook_token_cache.json")

CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "")
AUTHORITY = "https://login.microsoftonline.com/consumers"
SCOPES = ["Mail.Read", "Calendars.ReadWrite", "Contacts.Read", "Tasks.ReadWrite", "Mail.Send"]
GRAPH = "https://graph.microsoft.com/v1.0"


def _get_app():
    cache = msal.SerializableTokenCache()
    if os.path.exists(TOKEN_CACHE_FILE):
        try:
            cache.deserialize(open(TOKEN_CACHE_FILE).read())
        except Exception:
            pass
    return msal.PublicClientApplication(CLIENT_ID, authority=AUTHORITY, token_cache=cache), cache


def _save_cache(cache):
    if cache.has_state_changed:
        os.makedirs(DATA_DIR, exist_ok=True)
        open(TOKEN_CACHE_FILE, "w").write(cache.serialize())


def _get_token():
    if not CLIENT_ID:
        raise RuntimeError("MICROSOFT_CLIENT_ID not set in .env")
    app, cache = _get_app()
    accounts = app.get_accounts()
    if accounts:
        result = app.acquire_token_silent(SCOPES, account=accounts[0])
        _save_cache(cache)
        if result and "access_token" in result:
            return result["access_token"]
    raise RuntimeError("Not authenticated — run: python auth_outlook.py")


def _graph(path):
    token = _get_token()
    r = http.get(
        f"{GRAPH}{path}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10
    )
    r.raise_for_status()
    return r.json()


def _graph_post(path, payload):
    token = _get_token()
    r = http.post(
        f"{GRAPH}{path}",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=payload,
        timeout=10
    )
    r.raise_for_status()
    return r.json() if r.content else {}


def send_email(to, subject, body):
    try:
        payload = {
            "message": {
                "subject": subject,
                "body": {"contentType": "Text", "content": body},
                "toRecipients": [{"emailAddress": {"address": to}}],
            },
            "saveToSentItems": True,
        }
        _graph_post("/me/sendMail", payload)
        print(f"[Outlook] Sent email to {to}: {subject}")
        return True
    except Exception as e:
        print(f"[Outlook] Send email error: {e}")
        return False


def _graph_delete(path):
    token = _get_token()
    r = http.delete(
        f"{GRAPH}{path}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10
    )
    r.raise_for_status()


def get_unread_emails(max_results=10):
    try:
        data = _graph(
            f"/me/mailFolders/inbox/messages"
            f"?$filter=isRead eq false"
            f"&$top={max_results}"
            f"&$select=id,subject,from,receivedDateTime,bodyPreview"
            f"&$orderby=receivedDateTime desc"
        )
        return [
            {
                "id": m["id"],
                "from": (lambda ea: ea.get("name") or ea.get("address", ""))(
                    m.get("from", {}).get("emailAddress", {})
                ),
                "subject": m.get("subject", ""),
                "date": m.get("receivedDateTime", ""),
                "snippet": m.get("bodyPreview", ""),
            }
            for m in data.get("value", [])
        ]
    except Exception as e:
        print(f"[Outlook] Email error: {e}")
        return []


def _fmt(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%S')


def get_upcoming_events(max_results=10):
    try:
        now = datetime.now(timezone.utc)
        end = now + timedelta(days=30)
        data = _graph(
            f"/me/calendarView"
            f"?startDateTime={_fmt(now)}"
            f"&endDateTime={_fmt(end)}"
            f"&$top={max_results}"
            f"&$select=id,subject,start,end,location"
            f"&$orderby=start/dateTime"
        )
        return [
            {
                "id": e["id"],
                "title": e.get("subject") or "Untitled",
                "start": e.get("start", {}).get("dateTime", ""),
                "location": e.get("location", {}).get("displayName", ""),
            }
            for e in data.get("value", [])
        ]
    except Exception as e:
        print(f"[Outlook] Calendar error: {e}")
        return []


def create_calendar_event(title, date, time_str, duration_minutes=60, user_timezone="UTC"):
    try:
        start = datetime.strptime(f"{date}T{time_str}", "%Y-%m-%dT%H:%M")
        end = start + timedelta(minutes=int(duration_minutes))
        payload = {
            "subject": title,
            "start": {"dateTime": start.strftime("%Y-%m-%dT%H:%M:%S"), "timeZone": user_timezone},
            "end":   {"dateTime": end.strftime("%Y-%m-%dT%H:%M:%S"),   "timeZone": user_timezone},
        }
        result = _graph_post("/me/events", payload)
        print(f"[Outlook] Created event: {title} on {date} at {time_str} ({user_timezone})")
        return result
    except Exception as e:
        print(f"[Outlook] Create event error: {e}")
        return None


def delete_calendar_event(event_id):
    try:
        _graph_delete(f"/me/events/{urllib.parse.quote(event_id, safe='')}")
        print(f"[Outlook] Deleted event: {event_id[:20]}...")
        return True
    except Exception as e:
        print(f"[Outlook] Delete event error: {e}")
        return False


def _get_default_task_list_id():
    data = _graph("/me/todo/lists?$top=1")
    lists = data.get("value", [])
    if not lists:
        return None
    return urllib.parse.quote(lists[0]["id"], safe='')


def get_tasks(max_results=20):
    try:
        list_id = _get_default_task_list_id()
        if not list_id:
            return []
        data = _graph(
            f"/me/todo/lists/{list_id}/tasks"
            f"?$top=50"
        )
        return [
            {
                "id": t["id"],
                "title": t.get("title", ""),
                "status": t.get("status", ""),
                "due": t.get("dueDateTime", {}).get("dateTime", "") if t.get("dueDateTime") else "",
            }
            for t in data.get("value", [])
            if t.get("status") != "completed"
        ][:max_results]
    except Exception as e:
        print(f"[Outlook] Tasks error: {e}")
        return []


def create_task(title, due_date=None):
    try:
        list_id = _get_default_task_list_id()
        if not list_id:
            return None
        payload = {"title": title}
        if due_date:
            payload["dueDateTime"] = {"dateTime": f"{due_date}T00:00:00", "timeZone": "UTC"}
        result = _graph_post(f"/me/todo/lists/{list_id}/tasks", payload)
        print(f"[Outlook] Created task: {title}")
        return result
    except Exception as e:
        print(f"[Outlook] Create task error: {e}")
        return None


def delete_task(task_id=None, task_title=None):
    try:
        list_id = _get_default_task_list_id()
        if not list_id:
            return False
        if not task_id and task_title:
            data = _graph(f"/me/todo/lists/{list_id}/tasks?$top=100")
            for t in data.get("value", []):
                if task_title.lower() in t.get("title", "").lower():
                    task_id = urllib.parse.quote(t["id"], safe='')
                    break
        if not task_id:
            return False
        _graph_delete(f"/me/todo/lists/{list_id}/tasks/{task_id}")
        print(f"[Outlook] Deleted task: {task_id[:20]}...")
        return True
    except Exception as e:
        print(f"[Outlook] Delete task error: {e}")
        return False


def search_contacts(query, max_results=5):
    try:
        import urllib.parse
        q = urllib.parse.quote(f'"{query}"')
        data = _graph(
            f"/me/contacts?$search={q}"
            f"&$top={max_results}"
            f"&$select=id,displayName,emailAddresses"
        )
        return [
            {
                "id": c["id"],
                "name": c.get("displayName", ""),
                "email": c.get("emailAddresses", [{}])[0].get("address", "") if c.get("emailAddresses") else "",
            }
            for c in data.get("value", [])
        ]
    except Exception as e:
        print(f"[Outlook] Contacts error: {e}")
        return []


def get_events_for_date(date_str):
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        start = dt.replace(hour=0, minute=0, second=0, microsecond=0)
        end = dt.replace(hour=23, minute=59, second=59, microsecond=0)
        data = _graph(
            f"/me/calendarView"
            f"?startDateTime={_fmt(start)}"
            f"&endDateTime={_fmt(end)}"
            f"&$select=id,subject,start,end,location"
            f"&$orderby=start/dateTime"
        )
        return [
            {
                "id": e["id"],
                "title": e.get("subject") or "Untitled",
                "start": e.get("start", {}).get("dateTime", ""),
                "location": e.get("location", {}).get("displayName", ""),
            }
            for e in data.get("value", [])
        ]
    except Exception as e:
        print(f"[Outlook] Events for date error: {e}")
        return []


def get_todays_events():
    try:
        now = datetime.now(timezone.utc)
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59, microsecond=0)
        data = _graph(
            f"/me/calendarView"
            f"?startDateTime={_fmt(start)}"
            f"&endDateTime={_fmt(end)}"
            f"&$select=id,subject,start,end,location"
            f"&$orderby=start/dateTime"
        )
        return [
            {
                "id": e["id"],
                "title": e.get("subject") or "Untitled",
                "start": e.get("start", {}).get("dateTime", ""),
                "location": e.get("location", {}).get("displayName", ""),
            }
            for e in data.get("value", [])
        ]
    except Exception as e:
        print(f"[Outlook] Today error: {e}")
        return []
