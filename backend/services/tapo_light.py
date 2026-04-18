"""
Smart home integration (Tapo lights, etc.) - temporarily disabled (offline mode)
"""

class SmartHomeClient:
    """Smart home client with Tapo integration disabled (offline mode)."""
    
    def __init__(self, config=None):
        print("[SmartHome] Initialized (offline mode - Tapo disabled)")
        self.config = config or {}
        self.tapo_enabled = False  # OFF while away
    
    def execute(self, action: dict):
        """Skip all real actions while offline."""
        print(f"[SmartHome] (offline) Received action: {action}")
        return {"status": "skipped", "message": "Smart home offline (Tapo disabled)"}
    
    def activate_hope_mode(self):
        """Skip hope mode while offline."""
        print("[SmartHome] (offline) Hope mode requested - skipped (Tapo disabled)")
        return {"status": "skipped", "message": "Smart home offline (Tapo disabled)"}
