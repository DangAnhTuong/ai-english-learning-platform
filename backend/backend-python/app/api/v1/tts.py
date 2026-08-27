from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import Optional
import os
import logging
from openai import OpenAI

router = APIRouter()

# Setup logging
logger = logging.getLogger(__name__)

def get_client():
    api_key = os.getenv("OPENAI_API_KEY") or "placeholder"
    return OpenAI(api_key=api_key)

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
        
        # Try Deepgram TTS first for ultra-fast generation
        try:
            from app.services.deepgram_service import DeepgramService
            deepgram_svc = DeepgramService()
            
            # Map OpenAI voices to Deepgram voices
            voice_model = "aura-asteria-en"
            if request.voice in ["echo", "onyx", "fable"]:
                voice_model = "aura-orion-en" # Male
            elif request.voice in ["shimmer", "nova", "alloy"]:
                voice_model = "aura-stella-en" # Female
                
            audio_path = await deepgram_svc.text_to_speech(
                text=request.text, 
                voice_settings={"model": voice_model}
            )
            
            if audio_path and audio_path != "mock-tts-audio":
                with open(audio_path, "rb") as f:
                    audio_data = f.read()
                
                try:
                    os.remove(audio_path)
                except:
                    pass
                    
                logger.info(f"Successfully generated Deepgram speech, size: {len(audio_data)} bytes")
                
                return Response(
                    content=audio_data,
                    media_type="audio/wav",
                    headers={
                        "Content-Length": str(len(audio_data)),
                        "Content-Disposition": "attachment; filename=speech.wav"
                    }
                )
        except Exception as e:
            logger.warning(f"Deepgram TTS failed, falling back to OpenAI: {str(e)}")
            
        # Fallback to OpenAI TTS API
        instructions = None
        if request.language == "vi" or any(char in request.text for char in "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"):
            instructions = "Speak in Vietnamese with proper pronunciation and tone marks."
        
        client = get_client()
        response = client.audio.speech.create(
            model=request.model,
            voice=request.voice,
            input=request.text,
            speed=request.speed,
            instructions=instructions
        )
        
        audio_data = response.content
        
        logger.info(f"Successfully generated OpenAI speech, size: {len(audio_data)} bytes")
        
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
        client = get_client()
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