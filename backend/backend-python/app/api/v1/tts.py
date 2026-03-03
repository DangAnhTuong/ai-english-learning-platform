from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import Optional
import os
import logging
from openai import OpenAI

router = APIRouter()

# Setup logging
logger = logging.getLogger(__name__)

# Khởi tạo OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

client = OpenAI(api_key=openai_api_key)

class TTSRequest(BaseModel):
    text: str
    voice: str = "alloy"  # alloy, ash, ballad, coral, echo, sage, shimmer, verse
    model: str = "tts-1"  # tts-1, tts-1-hd, gpt-4o-mini-tts
    speed: float = 1.0
    language: Optional[str] = None  # auto, vi, en

@router.post("/generate")
async def generate_speech(request: TTSRequest):
    """Generate speech using OpenAI TTS API"""
    try:
        logger.info(f"Generating speech for text: {request.text[:50]}...")
        
        # Tạo instructions cho tiếng Việt nếu cần
        instructions = None
        if request.language == "vi" or any(char in request.text for char in "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"):
            instructions = "Speak in Vietnamese with proper pronunciation and tone marks."
        
        # Gọi OpenAI TTS API
        response = client.audio.speech.create(
            model=request.model,
            voice=request.voice,
            input=request.text,
            speed=request.speed,
            instructions=instructions
        )
        
        # Trả về audio data trực tiếp
        audio_data = response.content
        
        logger.info(f"Successfully generated speech, size: {len(audio_data)} bytes")
        
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={
                "Content-Length": str(len(audio_data)),
                "Content-Disposition": "attachment; filename=speech.mp3"
            }
        )
        
    except Exception as e:
        logger.error(f"TTS generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

@router.post("/stream")
async def stream_speech(request: TTSRequest):
    """Stream speech using OpenAI TTS API"""
    try:
        logger.info(f"Streaming speech for text: {request.text[:50]}...")
        
        # Tạo instructions cho tiếng Việt nếu cần
        instructions = None
        if request.language == "vi" or any(char in request.text for char in "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"):
            instructions = "Speak in Vietnamese with proper pronunciation and tone marks."
        
        # Gọi OpenAI TTS API với streaming
        response = client.audio.speech.create(
            model=request.model,
            voice=request.voice,
            input=request.text,
            speed=request.speed,
            instructions=instructions,
            response_format="opus"  # Streaming format
        )
        
        # Trả về audio data trực tiếp
        audio_data = response.content
        
        logger.info(f"Successfully streamed speech, size: {len(audio_data)} bytes")
        
        return Response(
            content=audio_data,
            media_type="audio/opus",
            headers={
                "Content-Length": str(len(audio_data)),
                "Content-Disposition": "attachment; filename=speech.opus"
            }
        )
        
    except Exception as e:
        logger.error(f"TTS streaming failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS streaming failed: {str(e)}")

@router.get("/voices")
async def get_available_voices():
    """Get available TTS voices"""
    voices = [
        {"id": "alloy", "name": "Alloy", "description": "Neutral, balanced voice"},
        {"id": "ash", "name": "Ash", "description": "Warm, friendly voice"},
        {"id": "ballad", "name": "Ballad", "description": "Smooth, melodic voice"},
        {"id": "coral", "name": "Coral", "description": "Bright, energetic voice"},
        {"id": "echo", "name": "Echo", "description": "Deep, resonant voice"},
        {"id": "sage", "name": "Sage", "description": "Mature, wise voice"},
        {"id": "shimmer", "name": "Shimmer", "description": "Light, airy voice"},
        {"id": "verse", "name": "Verse", "description": "Poetic, expressive voice"}
    ]
    
    return {
        "voices": voices,
        "models": [
            {"id": "tts-1", "name": "TTS-1", "description": "Standard quality"},
            {"id": "tts-1-hd", "name": "TTS-1 HD", "description": "High quality"},
            {"id": "gpt-4o-mini-tts", "name": "GPT-4o Mini TTS", "description": "Latest model"}
        ]
    } 