Good, I have everything needed. Let me now build the full guide.Click any box above for the specific code — here's everything else you need to know.

---

## What is Bhashini?

Bhashini is built by the Digital India Bhashini Division (DIBD) under MeitY — its goal is to enable all Indians easy access to digital services in their own language. It integrates ASR (speech-to-text), NMT (machine translation), and TTS (text-to-speech) into a single modular pipeline. The models are built by institutions like IIT Bombay, IIT Madras, IIIT Hyderabad, and CDAC.

---

## The 3 API calls you make every time

Every Bhashini integration uses the same 3-step flow: **Pipeline Config call** (get the model endpoints for your language), then **Pipeline Compute call** for ASR (voice → text), then another **Pipeline Compute call** for TTS (text → voice). You can also chain them as a single `ASR+NMT+TTS` compute call if you want translation in the middle.

---

## Integration code for SUVIDHA ONE (Rust)

**Step 1 — Config call** (do this once, cache the result):
```rust
// POST https://dhruva-api.bhashini.gov.in/services/inference/pipeline
let config_body = json!({
    "pipelineTasks": [
        { "taskType": "asr",  "config": { "language": { "sourceLanguage": "hi" } } },
        { "taskType": "tts",  "config": { "language": { "sourceLanguage": "hi" } } }
    ],
    "pipelineRequestConfig": { "pipelineId": "64392f96daac500b55c543cd" }
});
// Response gives you: serviceId, inferenceApiKey, callbackUrl per task
```

**Step 2 — Compute ASR** (citizen voice → Hindi text):
```rust
// Record WAV at 16kHz on kiosk → base64 encode
let audio_b64 = base64::encode(&wav_bytes);

let asr_body = json!({
    "pipelineTasks": [{
        "taskType": "asr",
        "config": {
            "serviceId": "<from config call>",
            "language": { "sourceLanguage": "hi" },
            "audioFormat": "wav", "samplingRate": 16000
        }
    }],
    "inputData": {
        "audio": [{ "audioContent": audio_b64 }]
    }
});
// Response: { "pipelineResponse": [{ "output": [{ "source": "बिजली बिल भरना है" }] }] }
```

**Step 3 — Compute TTS** (result text → voice back to citizen):
```rust
let tts_body = json!({
    "pipelineTasks": [{
        "taskType": "tts",
        "config": {
            "serviceId": "<from config call>",
            "language": { "sourceLanguage": "hi" },
            "gender": "female"
        }
    }],
    "inputData": {
        "input": [{ "source": "आपका बिजली बिल ₹540 है। क्या आप अभी भुगतान करना चाहते हैं?" }]
    }
});
// Response: { "audio": [{ "audioContent": "<base64 MP3>" }] }
// Decode → play on kiosk speaker
```

---

## One important thing

Bhashini only accepts **WAV format (base64 encoded)** — it does not support WebM. Since browsers record in WebM by default, you need to convert on the frontend before sending. Use the Web Audio API to re-encode to WAV at 16kHz before sending to your backend.

The free tier is for **PoC only**. If you deploy SUVIDHA ONE to production or charge end-users, contact the Bhashini team for the paid tier. For a hackathon, the free tier is completely sufficient.

---

## Also worth knowing — VoicERA

In 2025, Bhashini launched **VoicERA** — a complete open-source voice AI stack with real-time STT, TTS, and LLM-powered conversational agents via WebSocket. It can be deployed on-premise, which is perfect for SUVIDHA ONE's kiosk model where internet may be unreliable.
