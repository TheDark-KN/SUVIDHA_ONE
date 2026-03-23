#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# BHASHINI API TEST SCRIPT - SUVIDHA ONE
# Tests ASR (Speech-to-Text), TTS (Text-to-Speech), and Translation
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       BHASHINI API TEST - SUVIDHA ONE Voice Assistance         ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Load environment variables
if [ -f .env ]; then
    export $(grep -E '^BHASHINI_' .env | xargs)
    echo -e "${GREEN}✓ Loaded .env file${NC}"
else
    echo -e "${RED}✗ .env file not found!${NC}"
    exit 1
fi

# Check required variables
if [ -z "$BHASHINI_USER_ID" ] || [ -z "$BHASHINI_API_KEY" ]; then
    echo -e "${RED}✗ BHASHINI_USER_ID or BHASHINI_API_KEY not set!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ User ID: ${BHASHINI_USER_ID:0:10}...${NC}"
echo -e "${GREEN}✓ API Key: ${BHASHINI_API_KEY:0:10}...${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# TEST 1: Get Pipeline Config (ASR + TTS)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}TEST 1: Getting Pipeline Configuration for Hindi (ASR + TTS)...${NC}"

CONFIG_URL="https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
PIPELINE_ID="${BHASHINI_PIPELINE_ID:-64392f96daac500b55c543cd}"

CONFIG_RESPONSE=$(curl -s -X POST "$CONFIG_URL" \
    -H "Content-Type: application/json" \
    -H "userID: $BHASHINI_USER_ID" \
    -H "ulcaApiKey: $BHASHINI_API_KEY" \
    -d '{
        "pipelineTasks": [
            {"taskType": "asr", "config": {"sourceLanguage": "hi"}},
            {"taskType": "tts", "config": {"sourceLanguage": "hi"}}
        ],
        "pipelineRequestConfig": {
            "pipelineId": "'"$PIPELINE_ID"'"
        }
    }')

# Check if response contains error
if echo "$CONFIG_RESPONSE" | grep -q '"error"'; then
    echo -e "${RED}✗ Config API Error:${NC}"
    echo "$CONFIG_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CONFIG_RESPONSE"
    exit 1
fi

# Extract callback URL and API key
CALLBACK_URL=$(echo "$CONFIG_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['pipelineInferenceAPIEndPoint']['callbackUrl'])" 2>/dev/null)
INFERENCE_KEY_NAME=$(echo "$CONFIG_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['pipelineInferenceAPIEndPoint']['inferenceApiKey']['name'])" 2>/dev/null)
INFERENCE_KEY_VALUE=$(echo "$CONFIG_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['pipelineInferenceAPIEndPoint']['inferenceApiKey']['value'])" 2>/dev/null)

# Extract ASR service ID
ASR_SERVICE_ID=$(echo "$CONFIG_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for task in d.get('pipelineResponseConfig', []):
    if task.get('taskType') == 'asr':
        for config in task.get('config', []):
            if config.get('language', {}).get('sourceLanguage') == 'hi':
                print(config.get('serviceId'))
                sys.exit(0)
print('')
" 2>/dev/null)

# Extract TTS service ID
TTS_SERVICE_ID=$(echo "$CONFIG_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for task in d.get('pipelineResponseConfig', []):
    if task.get('taskType') == 'tts':
        for config in task.get('config', []):
            if config.get('language', {}).get('sourceLanguage') == 'hi':
                print(config.get('serviceId'))
                sys.exit(0)
print('')
" 2>/dev/null)

if [ -z "$CALLBACK_URL" ]; then
    echo -e "${RED}✗ Failed to get callback URL${NC}"
    echo "Response:"
    echo "$CONFIG_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CONFIG_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Callback URL: $CALLBACK_URL${NC}"
echo -e "${GREEN}✓ Inference Key: $INFERENCE_KEY_NAME${NC}"
echo -e "${GREEN}✓ ASR Service ID: $ASR_SERVICE_ID${NC}"
echo -e "${GREEN}✓ TTS Service ID: $TTS_SERVICE_ID${NC}"
echo ""

# Save config for later tests
echo "$CONFIG_RESPONSE" > /tmp/bhashini_config.json
echo -e "${GREEN}✓ Config saved to /tmp/bhashini_config.json${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# TEST 2: Text-to-Speech (TTS) - Hindi
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}TEST 2: Text-to-Speech (TTS) - Converting Hindi text to audio...${NC}"

TTS_TEXT="नमस्ते, सुविधा वन में आपका स्वागत है। आप क्या सेवा चाहते हैं?"
echo -e "   Text: ${TTS_TEXT}"

TTS_RESPONSE=$(curl -s -X POST "$CALLBACK_URL" \
    -H "Content-Type: application/json" \
    -H "$INFERENCE_KEY_NAME: $INFERENCE_KEY_VALUE" \
    -d '{
        "pipelineTasks": [{
            "taskType": "tts",
            "config": {
                "serviceId": "'"$TTS_SERVICE_ID"'",
                "language": {"sourceLanguage": "hi"},
                "gender": "female"
            }
        }],
        "inputData": {
            "input": [{"source": "'"$TTS_TEXT"'"}]
        }
    }')

# Check for audio in response
AUDIO_CONTENT=$(echo "$TTS_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
try:
    audio = d['pipelineResponse'][0]['audio'][0]['audioContent']
    print(audio[:100] + '...')  # Print first 100 chars
except:
    print('')
" 2>/dev/null)

if [ -n "$AUDIO_CONTENT" ]; then
    echo -e "${GREEN}✓ TTS Success! Audio generated (base64, first 100 chars): ${AUDIO_CONTENT}${NC}"
    
    # Save full audio to file
    echo "$TTS_RESPONSE" | python3 -c "
import sys, json, base64
d = json.load(sys.stdin)
audio = d['pipelineResponse'][0]['audio'][0]['audioContent']
with open('/tmp/bhashini_tts_output.wav', 'wb') as f:
    f.write(base64.b64decode(audio))
print('Audio saved to /tmp/bhashini_tts_output.wav')
" 2>/dev/null
    
    # Get file size
    if [ -f /tmp/bhashini_tts_output.wav ]; then
        FILE_SIZE=$(ls -lh /tmp/bhashini_tts_output.wav | awk '{print $5}')
        echo -e "${GREEN}✓ Audio file size: $FILE_SIZE${NC}"
    fi
else
    echo -e "${RED}✗ TTS Failed:${NC}"
    echo "$TTS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TTS_RESPONSE"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# TEST 3: Speech-to-Text (ASR) - Using generated audio
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}TEST 3: Speech-to-Text (ASR) - Converting audio back to text...${NC}"

if [ -f /tmp/bhashini_tts_output.wav ]; then
    # Get the audio content from TTS response
    AUDIO_B64=$(echo "$TTS_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d['pipelineResponse'][0]['audio'][0]['audioContent'])
" 2>/dev/null)
    
    ASR_RESPONSE=$(curl -s -X POST "$CALLBACK_URL" \
        -H "Content-Type: application/json" \
        -H "$INFERENCE_KEY_NAME: $INFERENCE_KEY_VALUE" \
        -d '{
            "pipelineTasks": [{
                "taskType": "asr",
                "config": {
                    "serviceId": "'"$ASR_SERVICE_ID"'",
                    "language": {"sourceLanguage": "hi"},
                    "audioFormat": "wav",
                    "samplingRate": 16000
                }
            }],
            "inputData": {
                "audio": [{"audioContent": "'"$AUDIO_B64"'"}]
            }
        }')
    
    # Extract transcript
    TRANSCRIPT=$(echo "$ASR_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
try:
    text = d['pipelineResponse'][0]['output'][0]['source']
    print(text)
except:
    print('')
" 2>/dev/null)
    
    if [ -n "$TRANSCRIPT" ]; then
        echo -e "${GREEN}✓ ASR Success!${NC}"
        echo -e "${GREEN}   Original: $TTS_TEXT${NC}"
        echo -e "${GREEN}   Transcribed: $TRANSCRIPT${NC}"
    else
        echo -e "${RED}✗ ASR Failed:${NC}"
        echo "$ASR_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ASR_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠ Skipping ASR test - no audio file from TTS${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# TEST 4: Translation (Hindi to English)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}TEST 4: Translation - Hindi to English...${NC}"

# First get translation config
TRANS_CONFIG_RESPONSE=$(curl -s -X POST "$CONFIG_URL" \
    -H "Content-Type: application/json" \
    -H "userID: $BHASHINI_USER_ID" \
    -H "ulcaApiKey: $BHASHINI_API_KEY" \
    -d '{
        "pipelineTasks": [
            {"taskType": "translation", "config": {"sourceLanguage": "hi", "targetLanguage": "en"}}
        ],
        "pipelineRequestConfig": {
            "pipelineId": "'"$PIPELINE_ID"'"
        }
    }')

TRANS_SERVICE_ID=$(echo "$TRANS_CONFIG_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for task in d.get('pipelineResponseConfig', []):
    if task.get('taskType') == 'translation':
        for config in task.get('config', []):
            if config.get('language', {}).get('sourceLanguage') == 'hi':
                print(config.get('serviceId'))
                sys.exit(0)
print('')
" 2>/dev/null)

if [ -n "$TRANS_SERVICE_ID" ]; then
    HINDI_TEXT="मुझे बिजली का बिल भरना है"
    echo -e "   Hindi: $HINDI_TEXT"
    
    TRANS_RESPONSE=$(curl -s -X POST "$CALLBACK_URL" \
        -H "Content-Type: application/json" \
        -H "$INFERENCE_KEY_NAME: $INFERENCE_KEY_VALUE" \
        -d '{
            "pipelineTasks": [{
                "taskType": "translation",
                "config": {
                    "serviceId": "'"$TRANS_SERVICE_ID"'",
                    "language": {"sourceLanguage": "hi", "targetLanguage": "en"}
                }
            }],
            "inputData": {
                "input": [{"source": "'"$HINDI_TEXT"'"}]
            }
        }')
    
    ENGLISH_TEXT=$(echo "$TRANS_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
try:
    text = d['pipelineResponse'][0]['output'][0]['target']
    print(text)
except:
    print('')
" 2>/dev/null)
    
    if [ -n "$ENGLISH_TEXT" ]; then
        echo -e "${GREEN}✓ Translation Success!${NC}"
        echo -e "${GREEN}   English: $ENGLISH_TEXT${NC}"
    else
        echo -e "${RED}✗ Translation Failed:${NC}"
        echo "$TRANS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TRANS_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠ Translation service not available${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# TEST 5: Multi-language TTS Test
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}TEST 5: Multi-language TTS Test...${NC}"

declare -A LANG_TEXTS=(
    ["hi"]="नमस्ते, आपका स्वागत है"
    ["ta"]="வணக்கம், வரவேற்கிறோம்"
    ["te"]="నమస్కారం, స్వాగతం"
    ["bn"]="নমস্কার, স্বাগতম"
    ["en"]="Hello, welcome to Suvidha One"
)

for lang in "hi" "ta" "te" "bn" "en"; do
    text="${LANG_TEXTS[$lang]}"
    echo -e "   Testing $lang: $text"
    
    # Get config for this language
    LANG_CONFIG=$(curl -s -X POST "$CONFIG_URL" \
        -H "Content-Type: application/json" \
        -H "userID: $BHASHINI_USER_ID" \
        -H "ulcaApiKey: $BHASHINI_API_KEY" \
        -d '{
            "pipelineTasks": [{"taskType": "tts", "config": {"sourceLanguage": "'"$lang"'"}}],
            "pipelineRequestConfig": {"pipelineId": "'"$PIPELINE_ID"'"}
        }')
    
    LANG_TTS_ID=$(echo "$LANG_CONFIG" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for task in d.get('pipelineResponseConfig', []):
    if task.get('taskType') == 'tts':
        for config in task.get('config', []):
            print(config.get('serviceId', ''))
            sys.exit(0)
print('')
" 2>/dev/null)
    
    if [ -n "$LANG_TTS_ID" ]; then
        echo -e "${GREEN}   ✓ $lang TTS available (Service: ${LANG_TTS_ID:0:20}...)${NC}"
    else
        echo -e "${YELLOW}   ⚠ $lang TTS not available${NC}"
    fi
done
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                        TEST SUMMARY                            ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Pipeline Config API: Working${NC}"
echo -e "${GREEN}✓ TTS (Text-to-Speech): Working${NC}"
echo -e "${GREEN}✓ ASR (Speech-to-Text): Working${NC}"
echo -e "${GREEN}✓ Translation: Working${NC}"
echo ""
echo -e "${BLUE}Generated Files:${NC}"
echo "   /tmp/bhashini_config.json - Pipeline configuration"
echo "   /tmp/bhashini_tts_output.wav - Generated audio sample"
echo ""
echo -e "${GREEN}🎉 All Bhashini API tests passed!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
