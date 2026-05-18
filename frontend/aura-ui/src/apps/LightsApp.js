import React, { useState, useEffect, useRef } from 'react';
import { useAuraSocket } from '../hooks/useAuraSocket';

const WS_URL = 'ws://localhost:8765';

const COLOR_PRESETS = [
  { label: 'White',  bg: '#fffcf0', mode: 'temp', temp: 6000 },
  { label: 'Warm',   bg: '#ffcc66', mode: 'temp', temp: 2700 },
  { label: 'Red',    bg: '#ff3333', mode: 'color', hue: 0,   saturation: 100 },
  { label: 'Orange', bg: '#ff8800', mode: 'color', hue: 30,  saturation: 100 },
  { label: 'Yellow', bg: '#ffdd00', mode: 'color', hue: 60,  saturation: 100 },
  { label: 'Green',  bg: '#33cc66', mode: 'color', hue: 120, saturation: 100 },
  { label: 'Blue',   bg: '#3366ff', mode: 'color', hue: 240, saturation: 100 },
  { label: 'Purple', bg: '#9933ff', mode: 'color', hue: 270, saturation: 100 },
  { label: 'Pink',   bg: '#ff66aa', mode: 'color', hue: 320, saturation: 100 },
];

function LightsApp({ onBack }) {
  const [isOn, setIsOn] = useState(false);
  const [brightness, setBrightness] = useState(80);
  const [colorTemp, setColorTemp] = useState(4000);
  const [selectedColor, setSelectedColor] = useState(null);
  const sendRef = useRef(null);

  const { send } = useAuraSocket(WS_URL, (msg) => {
    if (msg.type !== 'gesture_command') return;
    const { gesture } = msg;
    const doSend = sendRef.current;

    if (gesture === 'fist') {
      setIsOn((prev) => {
        const next = !prev;
        doSend?.({ type: 'light_control', action: 'toggle', value: next });
        console.log(`💡 Gesture fist → ${next ? 'ON' : 'OFF'}`);
        return next;
      });
    } else if (gesture === 'point_up') {
      setBrightness((prev) => {
        const next = Math.min(100, prev + 10);
        doSend?.({ type: 'light_control', action: 'brightness', value: next });
        console.log(`🔆 Gesture point_up → brightness ${next}%`);
        return next;
      });
    } else if (gesture === 'point_down') {
      setBrightness((prev) => {
        const next = Math.max(1, prev - 10);
        doSend?.({ type: 'light_control', action: 'brightness', value: next });
        console.log(`🔅 Gesture point_down → brightness ${next}%`);
        return next;
      });
    }
  });

  useEffect(() => { sendRef.current = send; }, [send]);

  const handleToggle = () => {
    const next = !isOn;
    setIsOn(next);
    send({ type: 'light_control', action: 'toggle', value: next });
    console.log(`💡 Toggle → ${next ? 'ON' : 'OFF'}`);
  };

  const handleBrightness = (e) => {
    const v = parseInt(e.target.value);
    setBrightness(v);
    send({ type: 'light_control', action: 'brightness', value: v });
  };

  const handleColorTemp = (e) => {
    const v = parseInt(e.target.value);
    setColorTemp(v);
    setSelectedColor(null);
    send({ type: 'light_control', action: 'color_temp', value: v });
  };

  const handleColorPreset = (preset) => {
    setSelectedColor(preset);
    if (preset.mode === 'temp') {
      setColorTemp(preset.temp);
      send({ type: 'light_control', action: 'color_temp', value: preset.temp });
    } else {
      send({ type: 'light_control', action: 'color', value: { hue: preset.hue, saturation: preset.saturation } });
    }
    console.log(`🎨 Color → ${preset.label}`);
  };

  const glowColor = selectedColor?.bg || (colorTemp < 3500 ? '#ffcc66' : colorTemp < 5000 ? '#ffe8b0' : '#e8f0ff');
  const glowAlpha = Math.round((isOn ? brightness / 100 : 0) * 40).toString(16).padStart(2, '0');

  return (
    <div style={{
      minHeight: '100vh',
      margin: '-32px',
      padding: '32px',
      background: 'radial-gradient(ellipse at 50% 35%, #1a0a2e 0%, #0d0515 45%, #080010 100%)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient light glow */}
      <div style={{
        position: 'absolute',
        width: '700px',
        height: '700px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${glowColor}${glowAlpha} 0%, transparent 65%)`,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -60%)',
        transition: 'background 0.6s ease',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '44px', position: 'relative', zIndex: 1 }}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <span style={styles.title}>LIGHTS</span>
      </div>

      {/* Content column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '36px', position: 'relative', zIndex: 1 }}>

        {/* ON/OFF Toggle */}
        <button onClick={handleToggle} style={{
          ...styles.toggleBtn,
          border: `2px solid ${isOn ? 'rgba(200,169,110,0.85)' : 'rgba(255,255,255,0.12)'}`,
          background: isOn
            ? `radial-gradient(circle, ${glowColor}22 0%, rgba(200,169,110,0.07) 60%, transparent 100%)`
            : 'rgba(255,255,255,0.03)',
          boxShadow: isOn ? `0 0 32px ${glowColor}55, 0 0 64px ${glowColor}1a` : 'none',
          animation: isOn ? 'lightsOnPulse 2.4s ease-in-out infinite' : 'none',
        }}>
          <span style={{ fontSize: '34px', lineHeight: 1 }}>💡</span>
          <span style={{
            fontSize: '10px',
            letterSpacing: '0.25em',
            color: isOn ? '#c8a96e' : 'rgba(255,255,255,0.25)',
            fontWeight: 300,
            marginTop: '4px',
          }}>
            {isOn ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Brightness */}
        <div style={styles.controlRow}>
          <div style={styles.sliderHeader}>
            <span style={styles.label}>BRIGHTNESS</span>
            <span style={styles.value}>{brightness}%</span>
          </div>
          <input
            type="range" min="1" max="100" value={brightness}
            onChange={handleBrightness}
            className="aura-slider"
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        {/* Color Temperature */}
        <div style={styles.controlRow}>
          <div style={styles.sliderHeader}>
            <span style={styles.label}>COLOR TEMP</span>
            <span style={styles.value}>{colorTemp}K</span>
          </div>
          <input
            type="range" min="2700" max="6500" value={colorTemp}
            onChange={handleColorTemp}
            className="aura-slider aura-slider-temp"
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,200,80,0.45)', letterSpacing: '0.1em' }}>Warm</span>
            <span style={{ fontSize: '10px', color: 'rgba(180,210,255,0.45)', letterSpacing: '0.1em' }}>Cool</span>
          </div>
        </div>

        {/* Color Presets */}
        <div style={styles.controlRow}>
          <span style={{ ...styles.label, display: 'block', marginBottom: '14px' }}>COLORS</span>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleColorPreset(preset)}
                title={preset.label}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: preset.bg,
                  border: selectedColor?.label === preset.label
                    ? '2.5px solid #c8a96e'
                    : '2px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedColor?.label === preset.label ? `0 0 14px ${preset.bg}99` : 'none',
                  outline: 'none',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Gesture hints */}
        <div style={{
          background: 'rgba(200,169,110,0.04)',
          border: '1px solid rgba(200,169,110,0.1)',
          borderRadius: '12px',
          padding: '14px 24px',
          width: '100%',
          maxWidth: '480px',
        }}>
          <div style={{ ...styles.label, marginBottom: '12px', textAlign: 'center' }}>GESTURE CONTROLS</div>
          <div style={{ display: 'flex', gap: '28px', justifyContent: 'center' }}>
            {[
              { g: '✊', label: 'Toggle' },
              { g: '👆', label: 'Brighter' },
              { g: '👇', label: 'Dimmer' },
              { g: '🖐️', label: 'Back' },
            ].map(({ g, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px' }}>{g}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', marginTop: '5px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lightsOnPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        .aura-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: rgba(200,169,110,0.2);
          border-radius: 2px;
          outline: none;
        }
        .aura-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #c8a96e;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(200,169,110,0.5);
          transition: box-shadow 0.2s;
        }
        .aura-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 14px rgba(200,169,110,0.8);
        }
        .aura-slider-temp {
          background: linear-gradient(to right, #ffcc66, #fff8e0, #ddeeff);
        }
      `}</style>
    </div>
  );
}

const styles = {
  backBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(200,169,110,0.2)',
    color: '#c8a96e',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '12px',
    letterSpacing: '0.05em',
    fontWeight: 300,
  },
  title: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '12px',
    letterSpacing: '0.45em',
    fontWeight: 200,
    color: '#c8a96e',
    textShadow: '0 0 20px rgba(200,169,110,0.7)',
  },
  toggleBtn: {
    width: '128px',
    height: '128px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    transition: 'all 0.4s ease',
    outline: 'none',
  },
  controlRow: {
    width: '100%',
    maxWidth: '480px',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  label: {
    fontSize: '10px',
    letterSpacing: '0.22em',
    color: 'rgba(200,169,110,0.55)',
    fontWeight: 300,
  },
  value: {
    fontSize: '13px',
    color: '#c8a96e',
    fontWeight: 200,
  },
};

export default LightsApp;
