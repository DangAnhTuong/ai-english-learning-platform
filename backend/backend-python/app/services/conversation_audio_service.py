import os
import asyncio
import aiofiles
import hashlib
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from openai import OpenAI
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ConversationAudioService:
    """Service để generate và quản lý audio files cho conversation lines"""
    
    # Constants for duration calculation
    # MP3 128kbps = 16KB/sec, WAV 16-bit 24kHz mono = 48KB/sec
    BITRATE_MP3 = 16 * 1024  # bytes per second
    BITRATE_WAV = 48 * 1024  # bytes per second
    
    # Max concurrent API calls
    MAX_CONCURRENT = 3
    
    # Retry settings
    MAX_RETRIES = 2
    RETRY_DELAY = 1.0  # seconds
    
    def __init__(self):
        self.audio_storage_path = os.getenv(
            "CONVERSATION_AUDIO_PATH",
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "conversation_audio")
        )
        self._ensure_storage_directory()
        
        # Cache directory for avoiding duplicate API calls
        self.cache_path = os.path.join(self.audio_storage_path, "_cache")
        Path(self.cache_path).mkdir(parents=True, exist_ok=True)
        
        # Initialize OpenAI client
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            logger.warning("OPENAI_API_KEY not found. Audio generation will fail.")
            self.openai_client = None
        else:
            self.openai_client = OpenAI(api_key=openai_api_key)
    
    def _ensure_storage_directory(self):
        """Tạo thư mục lưu audio nếu chưa có"""
        Path(self.audio_storage_path).mkdir(parents=True, exist_ok=True)
        logger.info(f"Audio storage directory: {self.audio_storage_path}")
    
    async def generate_conversation_audio(
        self,
        conversation_id: str,
        lines: List[Dict],
        voice_settings: Dict
    ) -> Dict[str, Any]:
        """
        Generate audio cho TAT CA lines (moi line co the co voice settings rieng)
        
        Args:
            conversation_id: ID cua conversation
            lines: Danh sach lines can generate (moi line co voiceSettings rieng)
            voice_settings: Voice configuration per participant { P1: {...}, P2: {...} }
            
        Returns:
            {
                "success": bool,
                "total_lines": int,
                "generated": int,
                "failed": int,
                "cached": int,
                "audio_urls": {line_id: url},
                "metadata": {line_id: {duration, fileSize}}
            }
        """
        results = {
            "success": True,
            "total_lines": len(lines),
            "generated": 0,
            "failed": 0,
            "cached": 0,
            "audio_urls": {},
            "metadata": {},
            "failed_lines": []
        }
        
        if not lines:
            logger.warning(f"No lines received for conversation {conversation_id}")
            return results
        
        logger.info(f"Processing {len(lines)} lines for conversation {conversation_id}")
        
        # Cleanup old audio files before regenerating
        await self._cleanup_conversation_audio(conversation_id)
        
        # Create tasks for parallel processing with semaphore
        semaphore = asyncio.Semaphore(self.MAX_CONCURRENT)
        
        async def process_line(line: Dict) -> Tuple[str, Optional[Dict], Optional[str]]:
            """Process single line with semaphore and retry"""
            # Lay voice settings tu line (da duoc Node.js gan san)
            line_voice_settings = line.get("voiceSettings", {})
            provider = line_voice_settings.get("provider", "openai")
            voice = line_voice_settings.get("voice", "alloy")
            speed = line_voice_settings.get("speed", 1.0)
            
            # Fallback: lay tu voice_settings theo participantId
            participant_id = line.get("participantId", "P1")
            if not line_voice_settings and participant_id in voice_settings:
                p_settings = voice_settings[participant_id]
                provider = p_settings.get("provider", "openai")
                voice = p_settings.get("voice", "alloy")
                speed = p_settings.get("speed", 1.0)
            
            async with semaphore:
                return await self._generate_line_with_retry(
                    conversation_id=conversation_id,
                    line=line,
                    provider=provider,
                    voice=voice,
                    speed=speed,
                    voice_settings=line_voice_settings or voice_settings.get(participant_id, {})
                )
        
        # Run all tasks in parallel
        tasks = [process_line(line) for line in lines]
        task_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        for i, result in enumerate(task_results):
            line_id = lines[i]["_id"]
            
            if isinstance(result, Exception):
                logger.error(f"Failed to generate audio for line {line_id}: {str(result)}")
                results["failed"] += 1
                results["failed_lines"].append(line_id)
                continue
            
            line_id_result, audio_info, status = result
            
            if audio_info:
                results["audio_urls"][line_id_result] = audio_info["url"]
                results["metadata"][line_id_result] = {
                    "duration": audio_info["duration"],
                    "fileSize": audio_info["fileSize"],
                    "format": audio_info.get("format", "mp3")
                }
                if status == "cached":
                    results["cached"] += 1
                else:
                    results["generated"] += 1
            else:
                results["failed"] += 1
                results["failed_lines"].append(line_id)
        
        logger.info(
            f"Audio generation completed for conversation {conversation_id}: "
            f"{results['generated']} generated, {results['cached']} cached, {results['failed']} failed"
        )
        
        return results
    
    async def _generate_line_with_retry(
        self,
        conversation_id: str,
        line: Dict,
        provider: str,
        voice: str,
        speed: float,
        voice_settings: Dict
    ) -> Tuple[str, Optional[Dict], Optional[str]]:
        """Generate audio for a line with retry mechanism"""
        line_id = line["_id"]
        text = line["content"]
        order = line["order"]
        
        # Check cache first
        cache_key = self._get_cache_key(text, provider, voice, speed)
        cached_audio = await self._get_from_cache(cache_key)
        
        if cached_audio:
            # Copy from cache to conversation directory
            audio_info = await self._copy_from_cache(
                cache_key, conversation_id, line_id, order, provider
            )
            if audio_info:
                logger.debug(f"Using cached audio for line {order}")
                return (line_id, audio_info, "cached")
        
        # Generate with retry
        last_error = None
        for attempt in range(self.MAX_RETRIES + 1):
            try:
                audio_info = await self._generate_line_audio(
                    conversation_id=conversation_id,
                    line_id=line_id,
                    text=text,
                    order=order,
                    provider=provider,
                    voice=voice,
                    speed=speed,
                    voice_settings=voice_settings
                )
                
                # Save to cache for future use
                await self._save_to_cache(cache_key, audio_info["path"])
                
                logger.info(f"Generated audio for line {order} (attempt {attempt + 1})")
                return (line_id, audio_info, "generated")
                
            except Exception as e:
                last_error = e
                logger.warning(f"Attempt {attempt + 1} failed for line {order}: {str(e)}")
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
        
        logger.error(f"All attempts failed for line {order}: {str(last_error)}")
        return (line_id, None, "failed")
    
    def _get_cache_key(self, text: str, provider: str, voice: str, speed: float) -> str:
        """Generate cache key from text and voice settings"""
        content = f"{text}|{provider}|{voice}|{speed}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def _get_from_cache(self, cache_key: str) -> Optional[Path]:
        """Check if audio exists in cache"""
        for ext in ["mp3", "wav"]:
            cache_file = Path(self.cache_path) / f"{cache_key}.{ext}"
            if cache_file.exists():
                return cache_file
        return None
    
    async def _save_to_cache(self, cache_key: str, source_path: str):
        """Save audio file to cache"""
        try:
            source = Path(source_path)
            if source.exists():
                dest = Path(self.cache_path) / f"{cache_key}{source.suffix}"
                shutil.copy2(source, dest)
                logger.debug(f"Cached audio: {cache_key}")
        except Exception as e:
            logger.warning(f"Failed to cache audio: {str(e)}")
    
    async def _copy_from_cache(
        self,
        cache_key: str,
        conversation_id: str,
        line_id: str,
        order: int,
        provider: str
    ) -> Optional[Dict]:
        """Copy audio from cache to conversation directory"""
        try:
            cached_file = await self._get_from_cache(cache_key)
            if not cached_file:
                return None
            
            # Create conversation directory
            conversation_dir = Path(self.audio_storage_path) / conversation_id
            conversation_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy file
            ext = cached_file.suffix
            filename = f"line_{order}_{line_id}{ext}"
            dest_path = conversation_dir / filename
            shutil.copy2(cached_file, dest_path)
            
            # Get metadata
            file_size = os.path.getsize(dest_path)
            duration = self._calculate_duration(file_size, ext.lstrip('.'))
            
            return {
                "url": f"/api/v1/conversation/audio/{conversation_id}/{filename}",
                "duration": duration,
                "fileSize": file_size,
                "path": str(dest_path),
                "format": ext.lstrip('.')
            }
        except Exception as e:
            logger.warning(f"Failed to copy from cache: {str(e)}")
            return None
    
    async def _cleanup_conversation_audio(self, conversation_id: str):
        """Remove old audio files for a conversation before regenerating"""
        try:
            conversation_dir = Path(self.audio_storage_path) / conversation_id
            if conversation_dir.exists():
                shutil.rmtree(conversation_dir)
                logger.info(f"Cleaned up old audio for conversation {conversation_id}")
        except Exception as e:
            logger.warning(f"Failed to cleanup audio: {str(e)}")
    
    async def _generate_line_audio(
        self,
        conversation_id: str,
        line_id: str,
        text: str,
        order: int,
        provider: str,
        voice: str,
        speed: float,
        voice_settings: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generate audio cho 1 line và lưu file"""
        
        if provider == "openai":
            audio_bytes = await self._generate_with_openai(text, voice, speed)
        elif provider == "deepgram":
            # Build voice settings for Deepgram
            deepgram_voice_settings = voice_settings or {
                "model": f"aura-{voice}-en" if not voice.startswith("aura-") else voice,
                "encoding": "linear16",
                "container": "wav",
                "sample_rate": 24000
            }
            audio_bytes = await self._generate_with_deepgram(text, deepgram_voice_settings)
        else:
            raise ValueError(f"Provider {provider} not supported. Use 'openai' or 'deepgram'")
        
        # Tạo thư mục cho conversation
        conversation_dir = Path(self.audio_storage_path) / conversation_id
        conversation_dir.mkdir(parents=True, exist_ok=True)
        
        # Determine file extension based on provider
        file_ext = "wav" if provider == "deepgram" else "mp3"
        filename = f"line_{order}_{line_id}.{file_ext}"
        file_path = conversation_dir / filename
        
        # Lưu file
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(audio_bytes)
        
        # Get file metadata
        file_size = os.path.getsize(file_path)
        duration = self._calculate_duration(file_size, file_ext)
        
        # Return URL (relative path để serve qua API)
        audio_url = f"/api/v1/conversation/audio/{conversation_id}/{filename}"
        
        return {
            "url": audio_url,
            "duration": duration,
            "fileSize": file_size,
            "path": str(file_path),
            "format": file_ext
        }
    
    async def _generate_with_openai(
        self,
        text: str,
        voice: str,
        speed: float
    ) -> bytes:
        """Generate audio bằng OpenAI TTS API"""
        if not self.openai_client:
            raise ValueError("OpenAI client not initialized")
        
        try:
            response = await asyncio.to_thread(
                self.openai_client.audio.speech.create,
                model="tts-1",  # Hoặc "tts-1-hd" cho chất lượng cao hơn
                voice=voice,
                input=text,
                speed=speed
            )
            return response.content
        except Exception as e:
            logger.error(f"OpenAI TTS generation failed: {str(e)}")
            raise
    
    async def _generate_with_deepgram(
        self,
        text: str,
        voice_settings: Dict
    ) -> bytes:
        """Generate audio bằng Deepgram Aura TTS API"""
        try:
            from app.services.deepgram_service import DeepgramService
            
            deepgram_service = DeepgramService()
            audio_path = await deepgram_service.text_to_speech(
                text=text,
                voice_settings=voice_settings
            )
            
            if not audio_path or audio_path == "mock-tts-audio":
                raise ValueError("Deepgram TTS failed or not configured")
            
            # Read audio file
            async with aiofiles.open(audio_path, "rb") as f:
                audio_bytes = await f.read()
            
            # Deepgram returns WAV, browser can play WAV natively
            return audio_bytes
            
        except Exception as e:
            logger.error(f"Deepgram TTS generation failed: {str(e)}")
            raise
    
    def _calculate_duration(self, file_size: int, format: str = "mp3") -> float:
        """
        Calculate audio duration from file size based on format
        
        MP3 128kbps = 16KB/sec
        WAV 16-bit 24kHz mono = 48KB/sec
        """
        if format == "wav":
            # WAV: 24kHz, 16-bit, mono = 48000 bytes/sec
            return round(file_size / self.BITRATE_WAV, 2)
        else:
            # MP3: 128kbps = 16384 bytes/sec
            return round(file_size / self.BITRATE_MP3, 2)
    
    def _estimate_duration(self, file_size: int) -> float:
        """Backward compatibility - default to MP3"""
        return self._calculate_duration(file_size, "mp3")
    
    def get_audio_file_path(self, conversation_id: str, filename: str) -> Optional[Path]:
        """Lấy đường dẫn file audio"""
        clean_filename = Path(filename).name
        file_path = Path(self.audio_storage_path) / conversation_id / clean_filename
        
        if file_path.exists() and file_path.is_file():
            return file_path
        
        return None

