import { useCallback, useEffect, useRef, useState } from 'react';

const REALTIME_WS_URL = 'ws://localhost:8766/realtime-ws';
const HOTWORDS = ['hey jarvis', 'hey aura', 'computer'];

const TOOLS = [
  {
    type: 'function',
    name: 'navigate',
    description: 'Navigate the AURA display. Open an app, go back to previous screen, go to the apps home grid, or return to the idle clock screen.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['idle', 'home', 'back', 'app'],
          description: 'idle = main clock screen, home = apps grid, back = previous screen, app = open a specific app',
        },
        app: {
          type: 'string',
          enum: ['music', 'youtube', 'weather', 'lights', 'news', 'recipe', 'tasks', 'photos', 'calendar', 'email', 'settings', 'vision'],
          description: 'Which app to open — required when target is "app"',
        },
      },
      required: ['target'],
    },
  },
  {
    type: 'function',
    name: 'music_control',
    description: 'Control Apple Music playback: play, pause, skip tracks, or adjust volume.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['play', 'pause', 'next', 'previous', 'volume_up', 'volume_down'],
        },
      },
      required: ['action'],
    },
  },
  {
    type: 'function',
    name: 'music_search',
    description: 'Search for and play a specific song, artist, or album in Apple Music.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Song title, artist name, or album to search for' },
      },
      required: ['query'],
    },
  },
  {
    type: 'function',
    name: 'remember',
    description: 'Save something important about the user for future sessions — their name, a preference, a habit, or anything they ask AURA to remember.',
    parameters: {
      type: 'object',
      properties: {
        fact: {
          type: 'string',
          description: 'The fact to remember, written naturally. E.g. "User\'s name is Josh", "User likes jazz music in the morning", "User prefers dim lights when watching TV".',
        },
      },
      required: ['fact'],
    },
  },
  {
    type: 'function',
    name: 'calendar_create',
    description: 'Create a new event in the user\'s Outlook calendar. Returns the event ID which you can use with calendar_delete if a correction is needed.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format. Resolve relative words (today, tomorrow, next Monday) to exact dates using the current date provided in your instructions.' },
        time: { type: 'string', description: 'Start time in HH:MM 24-hour format' },
        duration_minutes: { type: 'number', description: 'Duration in minutes, default 60' },
      },
      required: ['title', 'date', 'time'],
    },
  },
  {
    type: 'function',
    name: 'calendar_delete',
    description: 'Delete a calendar event by its ID. Use this when the user asks to cancel, remove, or change an existing event — delete the old one then call calendar_create with the corrected details.',
    parameters: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'The event ID returned by calendar_create' },
      },
      required: ['event_id'],
    },
  },
  {
    type: 'function',
    name: 'task_create',
    description: 'Create a new task in Microsoft To-Do. Returns the task ID which you can use with task_delete if a correction is needed.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        due_date: { type: 'string', description: 'Optional due date in YYYY-MM-DD format' },
      },
      required: ['title'],
    },
  },
  {
    type: 'function',
    name: 'task_delete',
    description: 'Delete a task from Microsoft To-Do. Provide task_id if you have it (from task_create), or task_title to find and delete by name.',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'The task ID returned by task_create' },
        task_title: { type: 'string', description: 'Task title to search for and delete — used when task_id is unknown' },
      },
    },
  },
  {
    type: 'function',
    name: 'calendar_read',
    description: 'Read calendar events. Call this when the user asks about their schedule, meetings, or events on any date — including "do I have anything tomorrow", "what time is my meeting", "what\'s on my calendar this week". Returns events with IDs you can use with calendar_delete.',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Specific date in YYYY-MM-DD to check. Omit for the next 7 days of upcoming events.',
        },
      },
    },
  },
  {
    type: 'function',
    name: 'task_list',
    description: 'Read the user\'s pending Microsoft To-Do tasks. Call this when the user asks "what tasks do I have", "what\'s on my to-do list", "remind me what I need to do". Returns tasks with IDs you can use with task_delete.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    type: 'function',
    name: 'email_read',
    description: 'Read unread emails from the user\'s Outlook inbox. Call this when asked "do I have any emails", "what emails came in", "any messages". Summarise sender and subject only.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    type: 'function',
    name: 'email_send',
    description: 'Send an email from the user\'s Outlook account. IMPORTANT: Always spell out the recipient address character by character and get explicit "yes, send it" confirmation before calling this. Voice transcription of email addresses is unreliable — warn the user if an address was dictated verbally.',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'Email body text' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    type: 'function',
    name: 'contacts_search',
    description: 'Search the user\'s Outlook contacts by name to find their email address. Use before email_send when the user gives a name not an address.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Name or partial name to search for' },
      },
      required: ['query'],
    },
  },
  {
    type: 'function',
    name: 'light_control',
    description: 'Control the room lights: turn on, off, or apply a mood preset.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['on', 'off', 'preset'],
          description: 'on = turn lights on, off = turn lights off, preset = apply a named mood',
        },
        preset: {
          type: 'string',
          enum: ['hope', 'focus', 'relax', 'sleep', 'night', 'morning', 'chill', 'vibe', 'study', 'dim', 'bright', 'reading', 'sunset', 'romance'],
          description: 'Mood preset — required when action is "preset"',
        },
      },
      required: ['action'],
    },
  },
];

const SYSTEM_PROMPT = `You are AURA, a concise voice assistant on a wall-mounted smart display. Spoken responses must be 1–2 sentences max — you are heard, not read.

Capabilities: navigate the display, control Apple Music, adjust lights, read and create/delete Outlook calendar events, read and create/delete Microsoft To-Do tasks, read and send Outlook emails, search contacts, remember facts about the user.

Key rules:

NAVIGATION
- "Open [app]", "show [app]", "go to [app]", "launch [app]" → call navigate immediately with target:"app" and the matching app name — never ask a clarifying question first
- Available apps: music, youtube, weather, lights, news, recipe, tasks, photos, calendar, email, settings, vision
- "Go back" / "back" → navigate target:"back"
- "Home" / "show apps" → navigate target:"home"
- "Main screen" / "idle" / "go home" → navigate target:"idle"
- You are the display. You do not give instructions on how to open apps — you open them directly.

CALENDAR
- "Do I have meetings / what's on today / what's tomorrow" → call calendar_read with the relevant date
- To delete or update an event when you don't already have its ID: call calendar_read first for the relevant date to find the event and its ID, then call calendar_delete — never say you can't delete without trying to look it up first
- To update an event: calendar_read (find ID) → calendar_delete → calendar_create with corrected details
- Always resolve relative dates (today, tomorrow, next Monday) to exact YYYY-MM-DD before calling calendar_create

TASKS
- "What tasks / to-dos do I have" → call task_list
- To delete a task by name: use task_delete with task_title — it searches automatically, no ID needed

EMAIL
- "Any emails / read my emails" → call email_read, then interpret the results intelligently — do not just list senders. Group similar ones, flag what seems important. Example: "Nothing urgent — two Microsoft alerts and a message from Revive that might need your attention."
- "Send email to X" → if given a name, use contacts_search first. If given an address by voice, warn that addresses are unreliable by voice and ask them to confirm it character by character
- Before calling email_send: spell out the recipient address clearly (e.g. "d-a-m-m-y zero eight one at icloud dot com"), state the subject, then wait for an explicit "yes, send it" — never send without this
- If the user says stop, cancel, wait, or no at any point during email confirmation — do not send

GENERAL
- When the user says thank you, goodbye, or that's all — respond briefly and stop`;

// ── PCM helpers ──────────────────────────────────────────────────────────────

function float32ToPcm16(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return out;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToInt16Array(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

function int16ToFloat32(pcm16) {
  const f32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 32768;
  return f32;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRealtimeVoice({ wsRef, onNavigate, onWake, setIsListening, setIsThinking, setReply }) {
  const [sessionStatus, setSessionStatus] = useState('idle');
  const sessionStatusRef = useRef('idle');
  const [orbState, setOrbState] = useState('resting');
  const realtimeWsRef = useRef(null);
  const streamRef = useRef(null);
  const captureCtxRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const playbackCtxRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const pendingCallsRef = useRef({});
  const micVolumeRef = useRef(0);   // 0–1, updated each rAF frame from capture analyser
  const micAnalyserRef = useRef(null);
  const micRafRef = useRef(null);
  const orbReturningTimerRef = useRef(null);
  const isSpeakingRef = useRef(false);

  const cb = useRef({});
  cb.current = { onNavigate, onWake, setIsListening, setIsThinking, setReply, wsRef };

  const updateStatus = useCallback((s) => {
    setSessionStatus(s);
    sessionStatusRef.current = s;
  }, []);

  const setOrb = useCallback((state) => {
    if (orbReturningTimerRef.current) {
      clearTimeout(orbReturningTimerRef.current);
      orbReturningTimerRef.current = null;
    }
    if (state === 'returning') {
      setOrbState('returning');
      orbReturningTimerRef.current = setTimeout(() => {
        setOrbState('resting');
        orbReturningTimerRef.current = null;
      }, 1500);
    } else {
      setOrbState(state);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const releaseResources = useCallback(() => {
    if (orbReturningTimerRef.current) { clearTimeout(orbReturningTimerRef.current); orbReturningTimerRef.current = null; }
    isSpeakingRef.current = false;
    if (micRafRef.current) { cancelAnimationFrame(micRafRef.current); micRafRef.current = null; }
    micAnalyserRef.current = null;
    micVolumeRef.current = 0;
    if (processorRef.current) { try { processorRef.current.disconnect(); } catch (e) {} processorRef.current = null; }
    if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch (e) {} sourceRef.current = null; }
    if (captureCtxRef.current) { if (captureCtxRef.current.state !== 'closed') captureCtxRef.current.close().catch(() => {}); captureCtxRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
      streamRef.current = null;
    }
    if (realtimeWsRef.current) { try { realtimeWsRef.current.close(); } catch (e) {} realtimeWsRef.current = null; }
    if (playbackCtxRef.current) { if (playbackCtxRef.current.state !== 'closed') playbackCtxRef.current.close().catch(() => {}); playbackCtxRef.current = null; }
    nextPlayTimeRef.current = 0;
    pendingCallsRef.current = {};
  }, []);

  const endSession = useCallback(() => {
    releaseResources();
    setOrb('returning');
    updateStatus('idle');
    cb.current.setIsListening?.(false);
    cb.current.setIsThinking?.(false);
  }, [releaseResources, updateStatus, setOrb]);

  const sendRt = useCallback((obj) => {
    const ws = realtimeWsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }, []);

  const executeTool = useCallback(async (callId, name, args) => {
    let output = 'done';
    const ws = cb.current.wsRef?.current;

    if (name === 'navigate') {
      cb.current.onNavigate?.(args);
      output = 'navigated';
    } else if (name === 'music_control') {
      if (ws && ws.readyState === WebSocket.OPEN) {
        const action = args.action === 'volume_up' ? 'volup'
                     : args.action === 'volume_down' ? 'voldn'
                     : args.action;
        ws.send(JSON.stringify({ type: 'apple_music_control', action }));
      }
      output = args.action;
    } else if (name === 'music_search') {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'apple_music_control', action: 'search', value: args.query }));
      }
      output = `playing ${args.query}`;
    } else if (name === 'calendar_create') {
      try {
        const res = await fetch('http://localhost:8766/calendar/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...args,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });
        if (!res.ok) { output = 'error: calendar unavailable, please try again'; }
        else {
          const data = await res.json();
          output = data.id ? `event created, event_id: ${data.id}` : 'event created';
        }
      } catch (e) {
        output = 'error: could not reach calendar — please try again';
      }
    } else if (name === 'calendar_delete') {
      try {
        const res = await fetch('http://localhost:8766/calendar/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: args.event_id }),
        });
        output = res.ok ? 'event deleted' : 'error: could not delete event';
      } catch (e) {
        output = 'error: could not reach calendar — please try again';
      }
    } else if (name === 'task_create') {
      try {
        const res = await fetch('http://localhost:8766/tasks/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args),
        });
        if (!res.ok) { output = 'error: tasks unavailable, please try again'; }
        else {
          const data = await res.json();
          output = data.id ? `task created, task_id: ${data.id}` : 'task created';
        }
      } catch (e) {
        output = 'error: could not reach tasks — please try again';
      }
    } else if (name === 'task_delete') {
      try {
        const res = await fetch('http://localhost:8766/tasks/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args),
        });
        output = res.ok ? 'task deleted' : 'error: could not delete task';
      } catch (e) {
        output = 'error: could not reach tasks — please try again';
      }
    } else if (name === 'remember') {
      try {
        await fetch('http://localhost:8766/profile/remember', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: args.fact }),
        });
      } catch (e) {}
      output = 'remembered';
    } else if (name === 'calendar_read') {
      try {
        const params = args.date ? `?date=${args.date}` : '';
        const res = await fetch(`http://localhost:8766/calendar/events${params}`);
        const events = await res.json();
        if (events.length === 0) {
          output = args.date ? `No events on ${args.date}` : 'No upcoming events';
        } else {
          const fmtTime = (s) => {
            const d = new Date(s.endsWith('Z') ? s : s + 'Z');
            return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
          };
          output = events.map(e =>
            `"${e.title}" at ${fmtTime(e.start)}${e.location ? ` (${e.location})` : ''} [id:${e.id}]`
          ).join(' | ');
        }
      } catch (e) {
        output = 'Could not read calendar';
      }
    } else if (name === 'task_list') {
      try {
        const res = await fetch('http://localhost:8766/tasks');
        const tasks = await res.json();
        if (tasks.length === 0) {
          output = 'No pending tasks';
        } else {
          output = tasks.map(t =>
            `"${t.title}"${t.due ? ` due ${t.due}` : ''} [id:${t.id}]`
          ).join(' | ');
        }
      } catch (e) {
        output = 'Could not read tasks';
      }
    } else if (name === 'email_read') {
      try {
        const res = await fetch('http://localhost:8766/emails');
        const emails = await res.json();
        if (emails.length === 0) {
          output = 'No unread emails';
        } else {
          output = `${emails.length} unread: ` + emails.map(e => `from ${e.from} — "${e.subject}"`).join(' | ');
        }
      } catch (e) {
        output = 'Could not read emails';
      }
    } else if (name === 'email_send') {
      try {
        const res = await fetch('http://localhost:8766/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args),
        });
        const data = await res.json();
        output = data.success ? 'email sent' : 'error: email failed to send — please try again';
      } catch (e) {
        output = 'error: could not reach mail service — please try again';
      }
    } else if (name === 'contacts_search') {
      try {
        const res = await fetch(`http://localhost:8766/contacts/search?q=${encodeURIComponent(args.query)}`);
        const contacts = await res.json();
        if (contacts.length === 0) {
          output = `No contacts found for "${args.query}"`;
        } else {
          output = contacts.map(c => `${c.name} <${c.email}>`).join(' | ');
        }
      } catch (e) {
        output = 'Could not search contacts';
      }
    } else if (name === 'light_control') {
      if (ws && ws.readyState === WebSocket.OPEN) {
        if (args.action === 'on') {
          ws.send(JSON.stringify({ type: 'light_control', action: 'toggle', value: true }));
        } else if (args.action === 'off') {
          ws.send(JSON.stringify({ type: 'light_control', action: 'toggle', value: false }));
        } else if (args.action === 'preset' && args.preset) {
          ws.send(JSON.stringify({ type: 'light_control', action: 'preset', value: args.preset }));
        }
      }
      output = args.action;
    }

    sendRt({
      type: 'conversation.item.create',
      item: { type: 'function_call_output', call_id: callId, output: JSON.stringify({ result: output }) },
    });
    sendRt({ type: 'response.create' });
  }, [sendRt]);

  // Play a base64-encoded PCM16 audio chunk from OpenAI
  const playAudioDelta = useCallback((b64) => {
    if (!b64) return;
    try {
      if (!playbackCtxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        playbackCtxRef.current = new AC({ sampleRate: 24000 });
        nextPlayTimeRef.current = 0;
      }
      const ctx = playbackCtxRef.current;
      const float32 = int16ToFloat32(base64ToInt16Array(b64));
      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      const start = Math.max(ctx.currentTime + 0.01, nextPlayTimeRef.current);
      src.start(start);
      nextPlayTimeRef.current = start + buffer.duration;
    } catch (e) {
      console.warn('[Realtime] Playback error:', e);
    }
  }, []);

  // Always-fresh event handler — reassigned every render to avoid stale closures
  const handleEventRef = useRef(null);
  handleEventRef.current = (msg) => {
    // Log every event so we can see what OpenAI is sending
    if (!msg.type.includes('audio.delta') && !msg.type.includes('transcript.delta') && msg.type !== 'input_audio_buffer.append') {
      console.log('[Realtime] ←', msg.type, msg.error ? JSON.stringify(msg.error) : '');
    }

    switch (msg.type) {
      case 'session.created':
        setOrb('listening');
        updateStatus('active');
        cb.current.setReply?.('');
        cb.current.setIsListening?.(true);
        break;

      case 'session.updated':
        updateStatus('active');
        cb.current.setReply?.('');
        cb.current.setIsListening?.(true);
        break;

      case 'input_audio_buffer.speech_started':
        console.log('[Realtime] Speech detected');
        setOrb('listening');
        isSpeakingRef.current = false;
        cb.current.setIsListening?.(true);
        cb.current.setIsThinking?.(false);
        nextPlayTimeRef.current = playbackCtxRef.current?.currentTime ?? 0;
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('[Realtime] Speech ended — waiting for response...');
        setOrb('thinking');
        cb.current.setIsListening?.(false);
        cb.current.setIsThinking?.(true);
        break;

      case 'response.audio.delta':        // legacy name
      case 'response.output_audio.delta': // new model name
        if (!isSpeakingRef.current) { isSpeakingRef.current = true; setOrb('speaking'); }
        playAudioDelta(msg.delta);
        break;

      case 'response.audio_transcript.done':         // legacy name
      case 'response.output_audio_transcript.done':  // new model name
        if (msg.transcript) cb.current.setReply?.(msg.transcript);
        break;

      case 'response.output_item.added':
        if (msg.item?.type === 'function_call') {
          pendingCallsRef.current[msg.item.call_id] = { name: msg.item.name, args: '' };
        }
        break;

      case 'response.function_call_arguments.delta':
        if (pendingCallsRef.current[msg.call_id]) {
          pendingCallsRef.current[msg.call_id].args += (msg.delta || '');
        }
        break;

      case 'response.function_call_arguments.done': {
        const callId = msg.call_id;
        const pending = pendingCallsRef.current[callId] || { name: '', args: '{}' };
        const name = msg.name || pending.name;
        let args = {};
        try { args = JSON.parse(msg.arguments || pending.args || '{}'); } catch (e) {}
        delete pendingCallsRef.current[callId];
        executeTool(callId, name, args);
        break;
      }

      case 'response.done':
        isSpeakingRef.current = false;
        setOrb('returning');
        cb.current.setIsThinking?.(false);
        break;

      case 'error':
        console.error('[Realtime] API error:', msg.error);
        cb.current.setReply?.('Error: ' + (msg.error?.message || JSON.stringify(msg.error)));
        break;

      default:
        break;
    }
  };

  const playDing = useCallback(() => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }, []);

  const startSession = useCallback(async () => {
    if (sessionStatusRef.current !== 'idle') return;

    playDing();
    cb.current.onWake?.();
    cb.current.setIsListening?.(true);
    cb.current.setReply?.('');
    updateStatus('connecting');

    try {
      // Load persisted user profile to inject into this session
      let profileContext = '';
      try {
        const res = await fetch('http://localhost:8766/profile');
        const data = await res.json();
        profileContext = data.summary || '';
      } catch (e) {}

      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });

      const rtWs = new WebSocket(REALTIME_WS_URL);
      realtimeWsRef.current = rtWs;

      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('Relay connection timed out')), 10000);
        rtWs.onopen = () => { clearTimeout(t); resolve(); };
        rtWs.onerror = () => { clearTimeout(t); reject(new Error('Relay WebSocket failed to connect')); };
      });

      // Build instructions with current date/time so AURA resolves "tomorrow", "2pm" etc
      const now = new Date();
      const todayISO = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
      const tomorrowDate = new Date(now);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowISO = tomorrowDate.toLocaleDateString('en-CA');
      const dateCtx = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const timeCtx = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const tzCtx = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const temporalCtx = `Current date and time: ${dateCtx}, ${timeCtx} (${tzCtx}). For calendar_create: today = ${todayISO}, tomorrow = ${tomorrowISO}. Always resolve relative dates to exact YYYY-MM-DD before calling calendar_create.`;
      const instructions = [SYSTEM_PROMPT, temporalCtx, profileContext].filter(Boolean).join('\n\n');

      // Configure session
      rtWs.send(JSON.stringify({
        type: 'session.update',
        session: {
          instructions,
          tools: TOOLS,
          tool_choice: 'auto',
          audio: {
            input: {
              turn_detection: {
                type: 'server_vad',
                threshold: 0.4,
                prefix_padding_ms: 300,
                silence_duration_ms: 600,
                create_response: true,
                interrupt_response: true,
              },
            },
            output: {
              voice: 'alloy',
            },
          },
        },
      }));

      rtWs.onmessage = (e) => {
        try { handleEventRef.current?.(JSON.parse(e.data)); } catch (err) {}
      };

      rtWs.onclose = () => {
        console.log('[Realtime] Relay closed');
        if (sessionStatusRef.current !== 'idle') endSession();
      };

      rtWs.onerror = (e) => {
        console.error('[Realtime] Relay error after connect:', e);
      };

      // Start audio capture at 24 kHz → send PCM16 chunks via relay
      const AC = window.AudioContext || window.webkitAudioContext;
      const captureCtx = new AC({ sampleRate: 24000 });
      captureCtxRef.current = captureCtx;

      const source = captureCtx.createMediaStreamSource(streamRef.current);
      sourceRef.current = source;

      // eslint-disable-next-line no-undef
      const processor = captureCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (realtimeWsRef.current?.readyState !== WebSocket.OPEN) return;
        const pcm16 = float32ToPcm16(e.inputBuffer.getChannelData(0));
        realtimeWsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: arrayBufferToBase64(pcm16.buffer),
        }));
      };

      // Analyser tap — reads volume from the same capture stream (no second getUserMedia needed)
      const analyser = captureCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      micAnalyserRef.current = analyser;
      const micData = new Uint8Array(analyser.frequencyBinCount);
      const tickVolume = () => {
        if (!micAnalyserRef.current) return;
        micAnalyserRef.current.getByteFrequencyData(micData);
        const rms = Math.sqrt(micData.reduce((s, v) => s + v * v, 0) / micData.length) / 128;
        micVolumeRef.current = Math.min(1, rms * 2.5);
        micRafRef.current = requestAnimationFrame(tickVolume);
      };
      micRafRef.current = requestAnimationFrame(tickVolume);

      // Silent gain prevents mic echo — processor must be connected to destination to run
      const silentGain = captureCtx.createGain();
      silentGain.gain.value = 0;
      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(captureCtx.destination);


    } catch (err) {
      console.error('[Realtime] Session start FAILED:', err.message, err);
      releaseResources();
      updateStatus('idle');
      cb.current.setIsListening?.(false);
      cb.current.setIsThinking?.(false);
      cb.current.setReply?.('FAIL: ' + (err.message || String(err)));
    }
  }, [playDing, updateStatus, endSession, releaseResources]); // eslint-disable-line react-hooks/exhaustive-deps

  // Continuous hotword detection
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('[Realtime] SpeechRecognition not available — hotword detection requires Chrome/Edge');
      return;
    }

    let cancelled = false;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const text = event.results[i][0].transcript.trim().toLowerCase();
        if (HOTWORDS.some(hw => text.includes(hw)) && sessionStatusRef.current === 'idle') {
          setOrb('aware');
          setTimeout(() => { if (sessionStatusRef.current === 'idle') startSession(); }, 400);
        }
      }
    };
    rec.onerror = (e) => {
      if (e.error !== 'no-speech') console.warn('[Realtime] SpeechRecognition error:', e.error);
    };
    rec.onend = () => { if (!cancelled) try { rec.start(); } catch (e) {} };
    try { rec.start(); } catch (e) {}

    return () => {
      cancelled = true;
      try { rec.stop(); } catch (e) {}
    };
  }, [startSession]);

  useEffect(() => () => { releaseResources(); }, [releaseResources]);

  return { sessionStatus, startSession, endSession, micVolumeRef, orbState };
}
