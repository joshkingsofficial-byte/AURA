import json
import os
import asyncio
import aiohttp
from aiohttp import web
from services.outlook_service import (
    get_unread_emails, get_upcoming_events, get_todays_events, get_events_for_date,
    create_calendar_event, delete_calendar_event, get_tasks, create_task, delete_task,
    send_email, search_contacts,
)
from services.user_profile import get_context_summary, add_fact

REALTIME_MODEL = 'gpt-realtime-mini'

# Tracks in-flight relay pump tasks so shutdown can cancel them before runner.cleanup()
_relay_tasks: set = set()
_http_runner = None


async def handle_emails(request):
    emails = get_unread_emails(10)
    return web.Response(
        text=json.dumps(emails),
        content_type='application/json',
        headers={'Access-Control-Allow-Origin': '*'}
    )

async def handle_calendar(request):
    events = get_upcoming_events(10)
    return web.Response(
        text=json.dumps(events),
        content_type='application/json',
        headers={'Access-Control-Allow-Origin': '*'}
    )

async def handle_today(request):
    events = get_todays_events()
    return web.Response(
        text=json.dumps(events),
        content_type='application/json',
        headers={'Access-Control-Allow-Origin': '*'}
    )

async def handle_calendar_create(request):
    try:
        body = await request.json()
        result = create_calendar_event(
            title=body.get("title", "Event"),
            date=body.get("date"),
            time_str=body.get("time", "09:00"),
            duration_minutes=body.get("duration_minutes", 60),
            user_timezone=body.get("timezone", "UTC"),
        )
        return web.Response(
            text=json.dumps(result or {}),
            content_type='application/json',
            headers={'Access-Control-Allow-Origin': '*'}
        )
    except Exception as e:
        return web.Response(status=500, text=str(e))

async def handle_calendar_events(request):
    date_str = request.rel_url.query.get("date")
    events = get_events_for_date(date_str) if date_str else get_upcoming_events(20)
    return web.Response(
        text=json.dumps(events),
        content_type='application/json',
        headers={'Access-Control-Allow-Origin': '*'}
    )

async def handle_calendar_delete(request):
    try:
        body = await request.json()
        event_id = body.get("event_id", "")
        if not event_id:
            return web.Response(status=400, text="Missing event_id")
        success = delete_calendar_event(event_id)
        return web.Response(
            text=json.dumps({"success": success}),
            content_type='application/json',
            headers={'Access-Control-Allow-Origin': '*'}
        )
    except Exception as e:
        return web.Response(status=500, text=str(e))

async def handle_tasks_get(request):
    tasks = get_tasks(20)
    return web.Response(
        text=json.dumps(tasks),
        content_type='application/json',
        headers={'Access-Control-Allow-Origin': '*'}
    )

async def handle_tasks_create(request):
    try:
        body = await request.json()
        result = create_task(body.get("title", ""), body.get("due_date"))
        return web.Response(
            text=json.dumps(result or {}),
            content_type='application/json',
            headers={'Access-Control-Allow-Origin': '*'}
        )
    except Exception as e:
        return web.Response(status=500, text=str(e))

async def handle_tasks_delete(request):
    try:
        body = await request.json()
        success = delete_task(
            task_id=body.get("task_id"),
            task_title=body.get("task_title"),
        )
        return web.Response(
            text=json.dumps({"success": success}),
            content_type='application/json',
            headers={'Access-Control-Allow-Origin': '*'}
        )
    except Exception as e:
        return web.Response(status=500, text=str(e))

async def handle_email_send(request):
    try:
        body = await request.json()
        to = body.get("to", "")
        subject = body.get("subject", "")
        content = body.get("body", "")
        if not to or not subject:
            return web.Response(status=400, text="Missing to or subject")
        success = send_email(to, subject, content)
        return web.Response(
            text=json.dumps({"success": success}),
            content_type='application/json',
            headers={'Access-Control-Allow-Origin': '*'}
        )
    except Exception as e:
        return web.Response(status=500, text=str(e))

async def handle_contacts_search(request):
    q = request.rel_url.query.get("q", "")
    results = search_contacts(q) if q else []
    return web.Response(
        text=json.dumps(results),
        content_type='application/json',
        headers={'Access-Control-Allow-Origin': '*'}
    )

async def handle_profile_get(request):
    summary = get_context_summary()
    return web.Response(
        text=json.dumps({"summary": summary}),
        content_type='application/json',
        headers={'Access-Control-Allow-Origin': '*'}
    )

async def handle_profile_remember(request):
    try:
        body = await request.json()
        text = body.get("text", "").strip()
        if not text:
            return web.Response(status=400, text="Missing text")
        fact = add_fact(text)
        return web.Response(
            text=json.dumps(fact),
            content_type='application/json',
            headers={'Access-Control-Allow-Origin': '*'}
        )
    except Exception as e:
        return web.Response(status=500, text=str(e))


async def handle_realtime_ws(request):
    """WebSocket endpoint — proxies between the browser and OpenAI Realtime API."""
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    api_key = os.getenv('OPENAI_API_KEY', '')
    if not api_key:
        print('[Realtime] No OPENAI_API_KEY — closing relay')
        await ws.close()
        return ws

    url = f'wss://api.openai.com/v1/realtime?model={REALTIME_MODEL}'
    headers = {'Authorization': f'Bearer {api_key}'}

    print('[Realtime] Browser connected — opening OpenAI WebSocket...')
    try:
        timeout = aiohttp.ClientTimeout(total=None, connect=15)
        async with aiohttp.ClientSession(timeout=timeout) as http_session:
            async with http_session.ws_connect(url, headers=headers) as ws_openai:
                print('[Realtime] OpenAI WebSocket connected')

                async def client_to_openai():
                    try:
                        async for msg in ws:
                            if msg.type == aiohttp.WSMsgType.TEXT:
                                await ws_openai.send_str(msg.data)
                            elif msg.type == aiohttp.WSMsgType.BINARY:
                                await ws_openai.send_bytes(msg.data)
                            elif msg.type in (aiohttp.WSMsgType.CLOSE, aiohttp.WSMsgType.ERROR):
                                break
                    except asyncio.CancelledError:
                        raise
                    except Exception as e:
                        print(f'[Realtime] client→openai error: {e}')

                async def openai_to_client():
                    try:
                        async for msg in ws_openai:
                            if ws.closed:
                                break
                            if msg.type == aiohttp.WSMsgType.TEXT:
                                await ws.send_str(msg.data)
                            elif msg.type == aiohttp.WSMsgType.BINARY:
                                await ws.send_bytes(msg.data)
                            elif msg.type in (aiohttp.WSMsgType.CLOSE, aiohttp.WSMsgType.ERROR):
                                break
                    except asyncio.CancelledError:
                        raise
                    except Exception as e:
                        print(f'[Realtime] openai→client error: {e}')

                t1 = asyncio.create_task(client_to_openai())
                t2 = asyncio.create_task(openai_to_client())
                _relay_tasks.add(t1)
                _relay_tasks.add(t2)
                try:
                    await asyncio.wait([t1, t2], return_when=asyncio.FIRST_COMPLETED)
                finally:
                    t1.cancel()
                    t2.cancel()
                    await asyncio.gather(t1, t2, return_exceptions=True)
                    _relay_tasks.discard(t1)
                    _relay_tasks.discard(t2)
                    if not ws_openai.closed:
                        try:
                            await ws_openai.close()
                        except Exception:
                            pass

    except asyncio.CancelledError:
        raise
    except Exception as e:
        print(f'[Realtime] Relay error: {e}')
    finally:
        if not ws.closed:
            try:
                await ws.close()
            except Exception:
                pass

    print('[Realtime] Relay session ended')
    return ws


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

@web.middleware
async def cors_middleware(request, handler):
    if request.method == 'OPTIONS':
        return web.Response(headers=CORS_HEADERS)
    try:
        response = await handler(request)
    except asyncio.CancelledError:
        raise
    # Not a WebSocketResponse and not being cancelled — safe to add CORS headers
    if not isinstance(response, web.WebSocketResponse):
        try:
            for k, v in CORS_HEADERS.items():
                response.headers[k] = v
        except Exception:
            pass
    return response


async def stop_http_server():
    """Cancel in-flight relay tasks, then tear down the aiohttp runner."""
    global _http_runner
    # Cancel relay pump tasks first so they exit cleanly before runner.cleanup()
    tasks = list(_relay_tasks)
    for t in tasks:
        t.cancel()
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
    _relay_tasks.clear()

    if _http_runner:
        await _http_runner.cleanup()
        _http_runner = None
    print('[HTTP] Server stopped')


async def start_http_server():
    global _http_runner
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_route('OPTIONS', '/{path_info:.*}', lambda r: web.Response(headers=CORS_HEADERS))
    app.router.add_get('/emails', handle_emails)
    app.router.add_get('/calendar', handle_calendar)
    app.router.add_get('/calendar/events', handle_calendar_events)
    app.router.add_get('/today', handle_today)
    app.router.add_post('/calendar/create', handle_calendar_create)
    app.router.add_post('/calendar/delete', handle_calendar_delete)
    app.router.add_get('/tasks', handle_tasks_get)
    app.router.add_post('/tasks/create', handle_tasks_create)
    app.router.add_post('/tasks/delete', handle_tasks_delete)
    app.router.add_post('/email/send', handle_email_send)
    app.router.add_get('/contacts/search', handle_contacts_search)
    app.router.add_get('/profile', handle_profile_get)
    app.router.add_post('/profile/remember', handle_profile_remember)
    app.router.add_get('/realtime-ws', handle_realtime_ws)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', 8766)
    await site.start()
    _http_runner = runner
    print('[HTTP] Server started on http://0.0.0.0:8766')
    return runner
