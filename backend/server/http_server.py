import json
from aiohttp import web
from services.gmail_service import get_unread_emails

async def handle_emails(request):
    emails = get_unread_emails(10)
    return web.Response(
        text=json.dumps(emails),
        content_type='application/json',
        headers={'Access-Control-Allow-Origin': '*'}
    )

async def start_http_server():
    app = web.Application()
    app.router.add_get('/emails', handle_emails)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 8766)
    await site.start()
    print('[HTTP] Server started on http://localhost:8766')
    return runner
