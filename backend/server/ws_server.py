# backend/server/ws_server.py
import asyncio
import json
import websockets


class WebSocketServer:
    def __init__(self, host: str = "0.0.0.0", port: int = 8765):
        self.host = host
        self.port = port
        self.clients = set()
        self.server = None
        self.message_handler = None
        self.light_control_handler = None
        self.youtube_handler = None
        self.vision_handler = None

    def set_message_handler(self, handler):
        self.message_handler = handler

    def set_light_control_handler(self, handler):
        self.light_control_handler = handler

    def set_youtube_handler(self, handler):
        self.youtube_handler = handler

    def set_vision_handler(self, handler):
        self.vision_handler = handler

    async def handler(self, websocket):
        client_info = f"{websocket.remote_address}"
        self.clients.add(websocket)
        print(f"[WS] Client connected from {client_info}")
        try:
            async for raw in websocket:
                try:
                    msg = json.loads(raw)
                except Exception:
                    continue
                msg_type = msg.get("type")
                if msg_type == "transcript" and self.message_handler:
                    text = msg.get("text", "").strip()
                    if text:
                        await self.message_handler(text)
                elif msg_type == "light_control" and self.light_control_handler:
                    await self.light_control_handler(msg)
                elif msg_type in ("youtube_search", "youtube_control") and self.youtube_handler:
                    await self.youtube_handler(msg)
                elif msg_type == "vision_query" and self.vision_handler:
                    await self.vision_handler(msg)
        except websockets.exceptions.ConnectionClosed:
            print(f"[WS] Client disconnected: {client_info}")
        finally:
            self.clients.discard(websocket)

    async def start(self):
        """Start the WebSocket server (async)."""
        self.server = await websockets.serve(self.handler, self.host, self.port)
        print(f"[WS] Server started on ws://{self.host}:{self.port}")

    async def broadcast(self, message: dict):
        """Broadcast a JSON message to all connected clients."""
        if not self.clients:
            return
        payload = json.dumps(message)
        dead = set()
        for client in list(self.clients):
            try:
                await client.send(payload)
            except Exception:
                dead.add(client)
        for client in dead:
            self.clients.discard(client)

    async def stop(self):
        """Stop the WebSocket server gracefully."""
        print("[WS] Stopping server...")
        if self.server:
            self.server.close()
            await self.server.wait_closed()
        # Close all client connections
        await asyncio.gather(
            *(c.close() for c in list(self.clients)),
            return_exceptions=True
        )
        self.clients.clear()
        print("[WS] Server stopped")
