from abc import ABC, abstractmethod
import logging
import asyncio
import base64
import aiofiles
import os
import uuid
from typing import Optional, Dict, Any
import httpx
import tempfile
import io

logger = logging.getLogger(__name__)

class IDeepgramService(ABC):
    """Abstract interface for Deepgram service"""
    
    @abstractmethod
    async def speech_to_text(
        self,
        audio_data: bytes,
        language: str = "en-US",
        model: str = "nova-2"
    ) -> str:
        pass
    
    @abstractmethod
    async def text_to_speech(
        self,
        text: str,
        voice_settings: Optional[Dict[str, Any]] = None,
        character_name: Optional[str] = None
    ) -> Optional[str]:
        pass
    
    @abstractmethod
    async def transcribe_audio(
        self,
        audio_data: bytes,
        language: str = "en"
    ) -> Optional[str]:
        pass
    
    @abstractmethod
    async def get_supported_voices(self) -> Dict[str, Any]:
        pass

class DeepgramService(IDeepgramService):
    """Deepgram implementation for cost-effective STT and TTS"""
    
    def __init__(self):
        self.client = None
        self.audio_storage_path = os.getenv("AUDIO_STORAGE_PATH", "./temp_audio")
        self._ensure_audio_directory()
    
    def _get_whisper_model(self):
        """Get Faster-Whisper model instance"""
        if not hasattr(self, 'whisper_model'):
            from faster_whisper import WhisperModel
            # Using 'small' model for a good balance of speed and accuracy on CPU
            logger.info("Loading Faster-Whisper model...")
            self.whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
            logger.info("Faster-Whisper model loaded")
        return self.whisper_model
    
    def _ensure_audio_directory(self) -> None:
        """Ensure audio storage directory exists"""
        os.makedirs(self.audio_storage_path, exist_ok=True)
    
    async def speech_to_text(
        self,
        audio_data: bytes,
        language: str = "en",
        model: str = "small"
    ) -> str:
        """Convert speech to text using Faster-Whisper (Local)"""
        try:
            model = self._get_whisper_model()
            
            # Write bytes to temporary file for av/ffmpeg to process correctly
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
                temp_audio.write(audio_data)
                temp_audio_path = temp_audio.name
                
            try:
                # Perform transcription
                # Run in a separate thread to avoid blocking the event loop
                def _transcribe():
                    segments, info = model.transcribe(
                        temp_audio_path, 
                        beam_size=5,
                        language=language if language != "en-US" else "en"
                    )
                    return " ".join([segment.text for segment in segments]).strip()
                
                transcript = await asyncio.to_thread(_transcribe)
                
                if transcript:
                    logger.info(f"STT successful (Faster-Whisper): {len(transcript)} characters")
                    return transcript
                    
                logger.warning("STT returned empty transcript")
                return ""
            finally:
                # Clean up temporary file
                if os.path.exists(temp_audio_path):
                    os.remove(temp_audio_path)
            
        except Exception as e:
            logger.error(f"STT error: {str(e)}")
            return ""
    
    async def text_to_speech(
        self,
        text: str,
        voice_settings: Optional[Dict[str, Any]] = None,
        character_name: Optional[str] = None
    ) -> Optional[str]:
        """Convert text to speech using Supertonic/Kokoro (Local)"""
        try:
            # Select Kokoro voice based on character
            character_voice_map = {
                "sarah": "af_bella",      
                "mr. johnson": "am_michael", 
                "alexandra": "af_sarah",  
                "emma": "af_sky",      
                "david": "am_adam"        
            }
            
            selected_voice = character_voice_map.get(
                character_name.lower() if character_name else "", 
                "af_bella"  # Default fallback
            )
            
            # Generate unique filename
            character_prefix = character_name.lower().replace(" ", "_") if character_name else "ai"
            audio_filename = f"{character_prefix}_{uuid.uuid4()}.wav"
            audio_path = os.path.join(self.audio_storage_path, audio_filename)
            
            # Call local Supertonic TTS Server
            # Assuming Supertonic is running locally on port 8888 (OpenAI compatible endpoint)
            supertonic_url = os.getenv("SUPERTONIC_URL", "http://127.0.0.1:8888/v1/audio/speech")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    supertonic_url,
                    json={
                        "input": text,
                        "voice": selected_voice,
                        "model": "kokoro",
                        "response_format": "wav"
                    }
                )
                
                if response.status_code == 200:
                    # Save audio file
                    async with aiofiles.open(audio_path, "wb") as f:
                        await f.write(response.content)
                    
                    logger.info(f"Supertonic TTS successful for {character_name or 'AI'}: {audio_filename}")
                    return audio_path
                else:
                    logger.warning(f"Supertonic returned status {response.status_code}: {response.text}")
                    # Fallback to Edge-TTS if Supertonic is not running
                    logger.info("Falling back to Edge-TTS...")
                    import edge_tts
                    edge_voice = "en-US-AriaNeural"
                    communicate = edge_tts.Communicate(text, edge_voice)
                    await communicate.save(audio_path.replace(".wav", ".mp3"))
                    return audio_path.replace(".wav", ".mp3")
            
        except Exception as e:
            logger.error(f"TTS error: {str(e)}")
            # Try fallback to Edge-TTS one last time
            try:
                import edge_tts
                character_prefix = character_name.lower().replace(" ", "_") if character_name else "ai"
                audio_filename = f"{character_prefix}_{uuid.uuid4()}.mp3"
                audio_path = os.path.join(self.audio_storage_path, audio_filename)
                communicate = edge_tts.Communicate(text, "en-US-AriaNeural")
                await communicate.save(audio_path)
                return audio_path
            except:
                return "mock-tts-audio"
    
    async def transcribe_audio(
        self,
        audio_data: bytes,
        language: str = "en"
    ) -> Optional[str]:
        """Transcribe audio (Direct call to Faster-Whisper)"""
        try:
            result = await self.speech_to_text(
                audio_data=audio_data,
                language="en",
                model="small"
            )
            
            if result and result.strip():
                return result.strip()
            
            logger.warning("Transcription failed")
            return None
            
        except Exception as e:
            logger.error(f"Audio transcription error: {str(e)}")
            return None
    
    async def get_supported_voices(self) -> Dict[str, Any]:
        """Get available Deepgram Aura voices"""
        # Deepgram Aura voices (cost-effective options)
        voices = {
            "english": {
                "aura-asteria-en": {
                    "name": "Asteria",
                    "language": "English",
                    "gender": "Female",
                    "description": "Warm and conversational"
                },
                "aura-luna-en": {
                    "name": "Luna",
                    "language": "English", 
                    "gender": "Female",
                    "description": "Clear and professional"
                },
                "aura-stella-en": {
                    "name": "Stella",
                    "language": "English",
                    "gender": "Female",
                    "description": "Friendly and engaging"
                },
                "aura-athena-en": {
                    "name": "Athena",
                    "language": "English",
                    "gender": "Female",
                    "description": "Confident and articulate"
                },
                "aura-hera-en": {
                    "name": "Hera",
                    "language": "English",
                    "gender": "Female",
                    "description": "Sophisticated and smooth"
                },
                "aura-orion-en": {
                    "name": "Orion",
                    "language": "English",
                    "gender": "Male",
                    "description": "Deep and authoritative"
                },
                "aura-arcas-en": {
                    "name": "Arcas", 
                    "language": "English",
                    "gender": "Male",
                    "description": "Natural and conversational"
                },
                "aura-perseus-en": {
                    "name": "Perseus",
                    "language": "English",
                    "gender": "Male", 
                    "description": "Clear and professional"
                },
                "aura-angus-en": {
                    "name": "Angus",
                    "language": "English",
                    "gender": "Male",
                    "description": "Warm and friendly"
                },
                "aura-orpheus-en": {
                    "name": "Orpheus",
                    "language": "English",
                    "gender": "Male",
                    "description": "Expressive and engaging"
                }
            }
        }
        
        return voices
    
    async def create_optimized_voice_config(
        self,
        character_name: str,
        character_description: str,
        conversation_level: str
    ) -> Dict[str, Any]:
        """Create voice configuration optimized for conversation scenario"""
        voices = await self.get_supported_voices()
        
        # Select voice based on character and level
        voice_mapping = {
            "beginner": {
                "default": "aura-asteria-en",  # Warm and clear
                "teacher": "aura-luna-en",     # Professional
                "friend": "aura-stella-en"     # Friendly
            },
            "intermediate": {
                "default": "aura-athena-en",   # Confident
                "business": "aura-hera-en",    # Sophisticated
                "casual": "aura-arcas-en"      # Natural male
            },
            "advanced": {
                "default": "aura-perseus-en",  # Professional male
                "formal": "aura-orion-en",     # Authoritative
                "casual": "aura-orpheus-en"    # Expressive
            }
        }
        
        # Determine voice type from character description
        voice_type = "default"
        if "teacher" in character_description.lower() or "instructor" in character_description.lower():
            voice_type = "teacher"
        elif "business" in character_description.lower() or "professional" in character_description.lower():
            voice_type = "business"
        elif "friend" in character_description.lower() or "casual" in character_description.lower():
            voice_type = "casual"
        elif "formal" in character_description.lower():
            voice_type = "formal"
        
        selected_voice = voice_mapping.get(conversation_level, voice_mapping["intermediate"]).get(
            voice_type, voice_mapping["intermediate"]["default"]
        )
        
        return {
            "model": selected_voice,
            "encoding": "linear16",
            "container": "wav",
            "sample_rate": 24000,
            "bit_rate": 128000
        }
    
    async def estimate_costs(
        self,
        text_length: int,
        audio_duration_seconds: float
    ) -> Dict[str, float]:
        """Estimate Deepgram usage costs"""
        # Deepgram Aura TTS pricing (as of 2024)
        tts_cost_per_character = 0.000015  # $0.015 per 1K characters
        
        # Deepgram STT pricing
        stt_cost_per_minute = 0.0043  # $0.0043 per minute
        
        estimated_costs = {
            "tts_cost": (text_length * tts_cost_per_character),
            "stt_cost": (audio_duration_seconds / 60.0 * stt_cost_per_minute),
            "total_cost": 0
        }
        
        estimated_costs["total_cost"] = estimated_costs["tts_cost"] + estimated_costs["stt_cost"]
        
        return estimated_costs
    
    async def cleanup_temp_audio(self, max_age_hours: int = 24) -> int:
        """Clean up temporary audio files older than specified hours"""
        import time
        
        cleaned_count = 0
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        try:
            for filename in os.listdir(self.audio_storage_path):
                if filename.endswith(('.wav', '.mp3', '.ogg')):
                    file_path = os.path.join(self.audio_storage_path, filename)
                    file_age = current_time - os.path.getmtime(file_path)
                    
                    if file_age > max_age_seconds:
                        os.remove(file_path)
                        cleaned_count += 1
            
            logger.info(f"Cleaned up {cleaned_count} temporary audio files")
        except Exception as e:
            logger.error(f"Audio cleanup error: {str(e)}")
        
        return cleaned_count