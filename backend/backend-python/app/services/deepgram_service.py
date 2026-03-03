from abc import ABC, abstractmethod
import logging
import asyncio
import base64
import aiofiles
import os
import uuid
from typing import Optional, Dict, Any
from deepgram import Deepgram

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
    
    def _get_deepgram_client(self) -> Deepgram:
        """Get Deepgram client instance"""
        if self.client is None:
            api_key = os.getenv("DEEPGRAM_API_KEY")
            if not api_key:
                # Return None for now - we'll use mock TTS
                return None
            self.client = Deepgram(api_key)
        return self.client
    
    def _ensure_audio_directory(self) -> None:
        """Ensure audio storage directory exists"""
        os.makedirs(self.audio_storage_path, exist_ok=True)
    
    async def speech_to_text(
        self,
        audio_data: bytes,
        language: str = "en-US",
        model: str = "nova-2"
    ) -> str:
        """Convert speech to text using Deepgram"""
        try:
            deepgram_client = self._get_deepgram_client()
            
            # Configure transcription options for cost optimization
            options = {
                "model": model,  # nova-2 is cost-effective and accurate
                "language": language,
                "smart_format": True,
                "punctuate": True,
                "diarize": False,  # Disable speaker diarization to save costs
                "multichannel": False,
                "alternatives": 1,  # Only get top result to save costs
                "interim_results": False,
                "endpointing": True,
                "vad_turnoff": 1000,  # Voice activity detection timeout
                "profanity_filter": False,
                "redact": False,
                "search": [],
                "replace": [],
                "keywords": [],
                "numerals": True
            }
            
            # Perform transcription
            response = await asyncio.to_thread(
                deepgram_client.transcription.prerecorded,
                {"buffer": audio_data, "mimetype": "audio/webm"},
                options
            )
            
            # Extract transcript
            if response and "results" in response:
                channels = response["results"]["channels"]
                if channels and len(channels) > 0:
                    alternatives = channels[0]["alternatives"]
                    if alternatives and len(alternatives) > 0:
                        transcript = alternatives[0]["transcript"].strip()
                        
                        if transcript:
                            logger.info(f"STT successful: {len(transcript)} characters")
                            return transcript
            
            logger.warning("STT returned empty transcript")
            return ""
            
        except Exception as e:
            logger.error(f"STT error: {str(e)}")
            return ""
    
    async def text_to_speech(
        self,
        text: str,
        voice_settings: Optional[Dict[str, Any]] = None,
        character_name: Optional[str] = None
    ) -> Optional[str]:
        """Convert text to speech using Deepgram Aura (cost-effective TTS)"""
        try:
            deepgram_client = self._get_deepgram_client()
            
            # If no Deepgram client (no API key), return mock audio indicator
            if not deepgram_client:
                logger.info(f"Mock TTS for {character_name or 'AI'}: {text[:50]}...")
                # Return a mock indicator that frontend will handle as text-to-speech
                return "mock-tts-audio"
            
            # Default voice settings optimized for cost and quality
            default_settings = {
                "model": "aura-asteria-en",  # Natural English voice
                "encoding": "linear16",
                "container": "wav",
                "sample_rate": 24000,
                "bit_rate": 128000
            }
            
            # Select voice based on character if provided
            if character_name and not voice_settings:
                character_voice_map = {
                    "sarah": "aura-stella-en",      # Restaurant server - friendly
                    "mr. johnson": "aura-orion-en", # Interview manager - professional
                    "alexandra": "aura-athena-en",  # Business analyst - confident
                    "emma": "aura-asteria-en",      # Sales associate - warm
                    "david": "aura-arcas-en"        # Travel agent - conversational
                }
                
                selected_voice = character_voice_map.get(
                    character_name.lower(), 
                    "aura-asteria-en"  # Default fallback
                )
                default_settings["model"] = selected_voice
            
            # Merge with provided settings
            if voice_settings:
                default_settings.update(voice_settings)
            
            # Generate speech
            response = await asyncio.to_thread(
                deepgram_client.speak.v("1").save,
                filename=None,  # Get response directly
                source={"text": text},
                options=default_settings
            )
            
            if response:
                # Generate unique filename
                character_prefix = character_name.lower().replace(" ", "_") if character_name else "ai"
                audio_filename = f"{character_prefix}_{uuid.uuid4()}.wav"
                audio_path = os.path.join(self.audio_storage_path, audio_filename)
                
                # Save audio file
                async with aiofiles.open(audio_path, "wb") as f:
                    await f.write(response)
                
                logger.info(f"TTS successful for {character_name or 'AI'}: {audio_filename}")
                return audio_path
            
            logger.warning("TTS returned empty response")
            return None
            
        except Exception as e:
            logger.error(f"TTS error: {str(e)}")
            # Return mock indicator on error
            return "mock-tts-audio"
    
    async def transcribe_audio(
        self,
        audio_data: bytes,
        language: str = "en"
    ) -> Optional[str]:
        """Transcribe audio using OpenAI Whisper via realtime service fallback"""
        try:
            # Check if we have Deepgram client
            deepgram_client = self._get_deepgram_client()
            
            if deepgram_client:
                # Try Deepgram STT first if available
                result = await self.speech_to_text(
                    audio_data=audio_data,
                    language=f"{language}-US" if language == "en" else language,
                    model="nova-2"
                )
                
                if result and result.strip():
                    return result.strip()
            
            # Use OpenAI Whisper as primary/fallback
            logger.info("Using OpenAI Whisper for transcription")
            
            from app.services.realtime_service import realtime_service
            whisper_result = await realtime_service.process_audio_transcription(
                audio_data, "audio/webm"
            )
            
            if not whisper_result.get("error") and whisper_result.get("transcript"):
                return whisper_result["transcript"].strip()
            
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