from googleapiclient.discovery import build
from services.gmail_service import get_credentials

def get_calendar_service():
    creds = get_credentials()
    return build('calendar', 'v3', credentials=creds)

def get_upcoming_events(max_results=10):
    try:
        service = get_calendar_service()
        now = datetime.now(timezone.utc).isoformat()
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])
        result = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date', ''))
            result.append({
                'id': event['id'],
                'title': event.get('summary', 'No title'),
                'start': start,
                'location': event.get('location', ''),
                'description': event.get('description', '')
            })
        return result
    except Exception as e:
        print(f"[Calendar] Error: {e}")
        return []

def get_todays_events():
    try:
        service = get_calendar_service()
        now = datetime.now(timezone.utc)
        start_of_day = now.replace(hour=0, minute=0, second=0).isoformat()
        end_of_day = now.replace(hour=23, minute=59, second=59).isoformat()
        events_result = service.events().list(
            calendarId='primary',
            timeMin=start_of_day,
            timeMax=end_of_day,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])
        result = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date', ''))
            result.append({
                'id': event['id'],
                'title': event.get('summary', 'No title'),
                'start': start,
                'location': event.get('location', ''),
            })
        return result
    except Exception as e:
        print(f"[Calendar] Error: {e}")
        return []
