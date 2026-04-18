# ai/conversation_context.py
"""
Conversation Context Manager
Maintains short-term memory of current conversation session
"""

from collections import deque
from datetime import datetime, timedelta


class ConversationContext:
    def __init__(self, max_history=10, session_timeout_minutes=10):
        """
        max_history: How many exchanges to remember
        session_timeout_minutes: How long before conversation is considered "new"
        """
        self.max_history = max_history
        self.session_timeout = timedelta(minutes=session_timeout_minutes)
        self.history = deque(maxlen=max_history)
        self.last_interaction = None
    
    def add_exchange(self, user_text: str, aura_reply: str):
        """Add a conversation exchange"""
        now = datetime.now()
        
        # Check if this is a new session
        if self.last_interaction and (now - self.last_interaction) > self.session_timeout:
            print("[Context] New conversation session - clearing history")
            self.history.clear()
        
        self.history.append({
            'user': user_text,
            'assistant': aura_reply,
            'timestamp': now
        })
        
        self.last_interaction = now
    
    def get_messages_for_gpt(self):
        """
        Convert history to GPT message format
        Returns list of message dicts for GPT API
        """
        messages = []
        for exchange in self.history:
            messages.append({"role": "user", "content": exchange['user']})
            messages.append({"role": "assistant", "content": exchange['assistant']})
        
        return messages
    
    def clear(self):
        """Clear conversation history"""
        self.history.clear()
        self.last_interaction = None
    
    def get_last_user_message(self):
        """Get the last thing user said"""
        if self.history:
            return self.history[-1]['user']
        return None
    
    def get_summary(self):
        """Get summary of current conversation"""
        if not self.history:
            return "No active conversation"
        
        exchanges = len(self.history)
        time_active = (datetime.now() - self.history[0]['timestamp']).seconds // 60
        
        return f"{exchanges} exchanges over {time_active} minutes"


# Global conversation context (shared across requests)
current_conversation = ConversationContext(max_history=10, session_timeout_minutes=10)
