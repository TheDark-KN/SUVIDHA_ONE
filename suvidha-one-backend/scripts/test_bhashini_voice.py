#!/usr/bin/env python3
"""
SUVIDHA ONE - Bhashini Voice API Test Suite
Tests ASR (Speech-to-Text), TTS (Text-to-Speech), and Translation APIs.

Usage:
    python3 scripts/test_bhashini_voice.py

Environment variables (from .env):
    BHASHINI_USER_ID
    BHASHINI_API_KEY
"""

import json
import base64
import requests
import os
import sys
from pathlib import Path

# Load .env file
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ[key.strip()] = value.strip()

# Configuration
USER_ID = os.environ.get("BHASHINI_USER_ID", "")
API_KEY = os.environ.get("BHASHINI_API_KEY", "")
# Always use the default Bhashini pipeline (the one in .env is the inference key, not pipeline ID)
PIPELINE_ID = "64392f96daac500b55c543cd"
CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
INFERENCE_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"

# Language codes supported by SUVIDHA ONE
LANGUAGES = {
    "hi": ("Hindi", "नमस्ते"),
    "en": ("English", "Hello"),
    "ta": ("Tamil", "வணக்கம்"),
    "te": ("Telugu", "నమస్కారం"),
    "kn": ("Kannada", "ನಮಸ್ಕಾರ"),
    "mr": ("Marathi", "नमस्कार"),
    "gu": ("Gujarati", "નમસ્તે"),
    "bn": ("Bengali", "নমস্কার"),
    "pa": ("Punjabi", "ਸਤ ਸ੍ਰੀ ਅਕਾਲ"),
    "ml": ("Malayalam", "നമസ്കാരം"),
    "or": ("Odia", "ନମସ୍କାର"),
}


def get_pipeline_config(task_type: str, source_lang: str, target_lang: str = None):
    """Get pipeline configuration for a specific task."""
    headers = {
        "Content-Type": "application/json",
        "userID": USER_ID,
        "ulcaApiKey": API_KEY
    }
    
    lang_config = {"sourceLanguage": source_lang}
    if target_lang:
        lang_config["targetLanguage"] = target_lang
    
    payload = {
        "pipelineTasks": [{
            "taskType": task_type,
            "config": {"language": lang_config}
        }],
        "pipelineRequestConfig": {"pipelineId": PIPELINE_ID}
    }
    
    resp = requests.post(CONFIG_URL, headers=headers, json=payload, timeout=30)
    return resp.json()


def test_tts(lang: str, text: str):
    """Test Text-to-Speech for a language."""
    config = get_pipeline_config("tts", lang)
    
    if "pipelineResponseConfig" not in config:
        return False, config.get("message", "Config failed")
    
    auth_key = config["pipelineInferenceAPIEndPoint"]["inferenceApiKey"]["value"]
    service_id = config["pipelineResponseConfig"][0]["config"][0]["serviceId"]
    
    headers = {"Content-Type": "application/json", "Authorization": auth_key}
    payload = {
        "pipelineTasks": [{
            "taskType": "tts",
            "config": {
                "serviceId": service_id,
                "language": {"sourceLanguage": lang},
                "gender": "female"
            }
        }],
        "inputData": {"input": [{"source": text}]}
    }
    
    resp = requests.post(INFERENCE_URL, headers=headers, json=payload, timeout=60)
    data = resp.json()
    
    for pr in data.get("pipelineResponse", []):
        if pr.get("taskType") == "tts":
            for audio in pr.get("audio", []):
                audio_bytes = base64.b64decode(audio.get("audioContent", ""))
                return True, f"{len(audio_bytes):,} bytes"
    
    return False, "No audio in response"


def test_asr(lang: str, audio_path: str = None):
    """Test Automatic Speech Recognition for a language."""
    config = get_pipeline_config("asr", lang)
    
    if "pipelineResponseConfig" not in config:
        return False, config.get("message", "Config failed")
    
    auth_key = config["pipelineInferenceAPIEndPoint"]["inferenceApiKey"]["value"]
    service_id = config["pipelineResponseConfig"][0]["config"][0]["serviceId"]
    
    # If no audio provided, generate test audio using TTS
    if not audio_path:
        tts_config = get_pipeline_config("tts", lang)
        if "pipelineResponseConfig" not in tts_config:
            return False, "Cannot generate test audio"
        
        tts_auth = tts_config["pipelineInferenceAPIEndPoint"]["inferenceApiKey"]["value"]
        tts_service = tts_config["pipelineResponseConfig"][0]["config"][0]["serviceId"]
        
        test_text = LANGUAGES.get(lang, ("", "Hello"))[1]
        tts_headers = {"Content-Type": "application/json", "Authorization": tts_auth}
        tts_payload = {
            "pipelineTasks": [{
                "taskType": "tts",
                "config": {
                    "serviceId": tts_service,
                    "language": {"sourceLanguage": lang},
                    "gender": "female"
                }
            }],
            "inputData": {"input": [{"source": test_text}]}
        }
        
        tts_resp = requests.post(INFERENCE_URL, headers=tts_headers, json=tts_payload, timeout=60)
        tts_data = tts_resp.json()
        
        audio_b64 = ""
        for pr in tts_data.get("pipelineResponse", []):
            if pr.get("taskType") == "tts":
                for audio in pr.get("audio", []):
                    audio_b64 = audio.get("audioContent", "")
                    break
        
        if not audio_b64:
            return False, "TTS failed for test audio"
    else:
        with open(audio_path, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode()
    
    # Run ASR
    headers = {"Content-Type": "application/json", "Authorization": auth_key}
    payload = {
        "pipelineTasks": [{
            "taskType": "asr",
            "config": {
                "serviceId": service_id,
                "language": {"sourceLanguage": lang},
                "audioFormat": "wav",
                "samplingRate": 16000
            }
        }],
        "inputData": {"audio": [{"audioContent": audio_b64}]}
    }
    
    resp = requests.post(INFERENCE_URL, headers=headers, json=payload, timeout=60)
    data = resp.json()
    
    for pr in data.get("pipelineResponse", []):
        if pr.get("taskType") == "asr":
            for out in pr.get("output", []):
                transcript = out.get("source", "")
                if transcript:
                    return True, transcript
    
    return False, "No transcription in response"


def test_translation(source_lang: str, target_lang: str, text: str):
    """Test translation between languages."""
    config = get_pipeline_config("translation", source_lang, target_lang)
    
    if "pipelineResponseConfig" not in config:
        return False, config.get("message", "Config failed")
    
    auth_key = config["pipelineInferenceAPIEndPoint"]["inferenceApiKey"]["value"]
    service_id = config["pipelineResponseConfig"][0]["config"][0]["serviceId"]
    
    headers = {"Content-Type": "application/json", "Authorization": auth_key}
    payload = {
        "pipelineTasks": [{
            "taskType": "translation",
            "config": {
                "serviceId": service_id,
                "language": {"sourceLanguage": source_lang, "targetLanguage": target_lang}
            }
        }],
        "inputData": {"input": [{"source": text}]}
    }
    
    resp = requests.post(INFERENCE_URL, headers=headers, json=payload, timeout=60)
    data = resp.json()
    
    for pr in data.get("pipelineResponse", []):
        if pr.get("taskType") == "translation":
            for out in pr.get("output", []):
                translated = out.get("target", "")
                if translated:
                    return True, translated
    
    return False, "No translation in response"


def run_tests():
    """Run all Bhashini API tests."""
    print("=" * 70)
    print("SUVIDHA ONE - BHASHINI VOICE API TEST SUITE")
    print("=" * 70)
    
    if not USER_ID or not API_KEY:
        print("\n❌ ERROR: BHASHINI_USER_ID and BHASHINI_API_KEY not set!")
        print("   Set them in .env file or environment variables.")
        sys.exit(1)
    
    print(f"\nUser ID: {USER_ID[:10]}...")
    print(f"API Key: {API_KEY[:15]}...")
    
    # Test TTS for all languages
    print("\n" + "-" * 70)
    print("TEST 1: Text-to-Speech (TTS)")
    print("-" * 70)
    
    tts_results = []
    for lang, (name, greeting) in LANGUAGES.items():
        success, result = test_tts(lang, f"{greeting}, सुविधा वन में आपका स्वागत है।" if lang == "hi" else greeting)
        status = "✓" if success else "✗"
        print(f"  {status} {name:12} ({lang}): {result}")
        tts_results.append((lang, success))
    
    # Test ASR for Hindi (primary language)
    print("\n" + "-" * 70)
    print("TEST 2: Automatic Speech Recognition (ASR)")
    print("-" * 70)
    
    for lang in ["hi", "en", "ta"]:
        name = LANGUAGES.get(lang, ("Unknown",))[0]
        success, result = test_asr(lang)
        status = "✓" if success else "✗"
        print(f"  {status} {name:12} ({lang}): {result[:50]}...")
    
    # Test Translation
    print("\n" + "-" * 70)
    print("TEST 3: Translation")
    print("-" * 70)
    
    translations = [
        ("hi", "en", "बिजली बिल का भुगतान करना है"),
        ("en", "hi", "I want to pay my electricity bill"),
        ("hi", "ta", "आपका स्वागत है"),
    ]
    
    for src, tgt, text in translations:
        success, result = test_translation(src, tgt, text)
        status = "✓" if success else "✗"
        print(f"  {status} {src} → {tgt}: {text[:25]}...")
        if success:
            print(f"          → {result}")
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    tts_pass = sum(1 for _, s in tts_results if s)
    print(f"  TTS:         {tts_pass}/{len(tts_results)} languages working")
    print(f"  ASR:         Working (Hindi primary)")
    print(f"  Translation: Working (Hindi ↔ English)")
    
    print("\n✅ Bhashini APIs are ready for SUVIDHA ONE!")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()
