import os
import json
import pickle
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import base64
import email

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
CREDENTIALS_FILE = os.path.join(os.path.dirname(__file__), '..', 'gmail_credentials.json')
TOKEN_FILE = os.path.join(os.path.dirname(__file__), '..', 'gmail_token.pickle')

def get_gmail_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, 'wb') as token:
            pickle.dump(creds, token)
    return build('gmail', 'v1', credentials=creds)

def get_unread_emails(max_results=5):
    try:
        service = get_gmail_service()
        results = service.users().messages().list(
            userId='me',
            labelIds=['INBOX', 'UNREAD'],
            maxResults=max_results
        ).execute()

        messages = results.get('messages', [])
        emails = []

        for msg in messages:
            msg_data = service.users().messages().get(
                userId='me',
                id=msg['id'],
                format='metadata',
                metadataHeaders=['From', 'Subject', 'Date']
            ).execute()

            headers = {h['name']: h['value'] for h in msg_data['payload']['headers']}
            emails.append({
                'id': msg['id'],
                'from': headers.get('From', 'Unknown'),
                'subject': headers.get('Subject', 'No subject'),
                'date': headers.get('Date', ''),
                'snippet': msg_data.get('snippet', '')
            })

        return emails
    except Exception as e:
        print(f"[Gmail] Error: {e}")
        return []

def get_important_emails(max_results=3):
    try:
        service = get_gmail_service()
        results = service.users().messages().list(
            userId='me',
            labelIds=['INBOX', 'UNREAD', 'IMPORTANT'],
            maxResults=max_results
        ).execute()

        messages = results.get('messages', [])
        emails = []

        for msg in messages:
            msg_data = service.users().messages().get(
                userId='me',
                id=msg['id'],
                format='metadata',
                metadataHeaders=['From', 'Subject', 'Date']
            ).execute()

            headers = {h['name']: h['value'] for h in msg_data['payload']['headers']}
            emails.append({
                'id': msg['id'],
                'from': headers.get('From', 'Unknown'),
                'subject': headers.get('Subject', 'No subject'),
                'date': headers.get('Date', ''),
                'snippet': msg_data.get('snippet', '')
            })

        return emails
    except Exception as e:
        print(f"[Gmail] Error: {e}")
        return []
