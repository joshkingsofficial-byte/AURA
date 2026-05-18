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

    def set_message_handler(self, handler):
        self.message_handler = handler

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
                if msg.get("type") == "transcript" and self.message_handler:
                    text = msg.get("text", "").strip()
                    if text:
                        await self.message_handler(text)
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
