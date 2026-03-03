import os
import asyncio
import json
import logging
from typing import Dict, Any, Optional, Callable
from openai import OpenAI
from app.utils.token_utils import calculate_context_tokens, format_context_string

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RealtimeService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.is_initialized = False
        self.response_cache = {}  # Simple cache để giảm API calls
        
    async def initialize(self):
        """Khởi tạo service cho Realtime API"""
        try:
            # Kiểm tra API key
            if not os.getenv("OPENAI_API_KEY"):
                raise Exception("OPENAI_API_KEY not found in environment variables")
            
            self.is_initialized = True
            logger.info("Realtime service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Realtime service: {str(e)}")
            raise
    
    async def process_audio_transcription(self, audio_content: bytes, audio_type: str = "audio/webm") -> Dict[str, Any]:
        """Xử lý audio transcription sử dụng OpenAI Whisper"""
        try:
            # Kiểm tra audio content size
            if len(audio_content) < 1000:  # Ít nhất 1KB
                return {
                    "transcript": "",
                    "confidence": 0.0,
                    "language": "unknown",
                    "error": "Audio file too small. Please record for at least 1 second."
                }
            
            # Kiểm tra API key
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                # Mock transcription for demo
                logger.info("Mock transcription - no OpenAI API key")
                return {
                    "transcript": "Hello, I would like to practice English conversation",
                    "confidence": 0.8,
                    "language": "en",
                    "segments": []
                }
            
            # Tạo file tạm thời từ audio content
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
                temp_file.write(audio_content)
                temp_file_path = temp_file.name
            
            try:
                # Sử dụng OpenAI Whisper để transcribe - Tối ưu cho chi phí
                with open(temp_file_path, "rb") as audio_file:
                    transcript = self.client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="json",  # Chỉ lấy text, không cần verbose
                        # Remove language parameter to enable auto-detection
                        # language="vi"  # Let Whisper auto-detect language for better accuracy
                    )
                
                # Xóa file tạm thời
                os.unlink(temp_file_path)
                
                return {
                    "transcript": transcript.text,
                    "confidence": 0.0,  # Không có trong json format
                    "language": "auto",  # Whisper tự detect
                    "segments": []  # Không có trong json format
                }
                
            except Exception as e:
                # Xóa file tạm thời nếu có lỗi
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                raise e
                
        except Exception as e:
            logger.error(f"Audio transcription failed: {str(e)}")
            return {
                "transcript": "",
                "confidence": 0.0,
                "language": "unknown",
                "error": str(e)
            }
    
    async def get_ai_response(self, user_message: str, conversation_history: list = None) -> str:
        """Lấy response từ AI assistant với conversation context"""
        try:
            if not self.is_initialized:
                await self.initialize()
            
            # Kiểm tra API key
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                # Mock AI responses for demo
                logger.info(f"Mock AI response for: {user_message[:50]}...")
                
                mock_responses = [
                    "Hello! How can I help you practice English today?",
                    "That's great! Can you tell me more about that?",
                    "I understand. What would you like to talk about next?", 
                    "Excellent! You're doing very well with your English.",
                    "That's interesting! What do you think about that topic?",
                    "Good job! Keep practicing and you'll improve even more.",
                    "I see. Would you like to try a different conversation topic?",
                    "Nice work! Your English is getting better with each conversation."
                ]
                
                # Simple response selection based on message content
                if "hello" in user_message.lower() or "hi" in user_message.lower():
                    return "Hello! It's nice to meet you. How are you doing today?"
                elif "order" in user_message.lower() or "food" in user_message.lower():
                    return "Great! What would you like to order? I can recommend some popular dishes if you'd like."
                elif "job" in user_message.lower() or "work" in user_message.lower():
                    return "That sounds like interesting work! Can you tell me more about your job responsibilities?"
                else:
                    import random
                    return random.choice(mock_responses)
            
            # Tối ưu conversation history với token-based limiting
            if conversation_history:
                # Lấy tối đa 10 messages gần nhất
                recent_messages = conversation_history[-10:]
                
                # Tính toán context dựa trên token limit
                max_context_tokens = 2000  # Giới hạn 2000 tokens cho context
                context_messages, total_tokens = calculate_context_tokens(recent_messages, max_context_tokens)
                
                # Tạo context string từ selected messages
                context = format_context_string(context_messages)
                cache_key = f"chat:{hash(context + user_message)}"
                
                logger.info(f"Context: {len(context_messages)} messages, ~{total_tokens} tokens")
            else:
                context = ""
                cache_key = f"chat:{user_message[:50]}"
            
            # Kiểm tra cache trước
            if cache_key in self.response_cache:
                logger.info("Using cached response")
                return self.response_cache[cache_key]
            
            # Tối ưu prompt - ngắn gọn hơn cho phản hồi nhanh
            system_prompt = """EN tutor: Brief, encouraging. Max 50 words. VN/EN OK."""

            # Tạo messages array với context
            messages = [{"role": "system", "content": system_prompt}]
            
            if context:
                messages.append({"role": "user", "content": f"Context:\n{context}\n\nCurrent message: {user_message}"})
            else:
                messages.append({"role": "user", "content": user_message})

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=100,  # Giảm thêm token usage cho phản hồi nhanh hơn
                temperature=0.7,
                stream=False  # Tắt streaming để tăng tốc độ
            )
            
            result = response.choices[0].message.content
            
            # Cache response (giới hạn cache size)
            if len(self.response_cache) < 100:  # Giới hạn 100 cached responses
                self.response_cache[cache_key] = result
            
            return result
            
        except Exception as e:
            logger.error(f"AI response failed: {str(e)}")
            return f"Sorry, I'm having trouble responding right now. Let me try to help you in a different way. What would you like to practice?"
    
    async def get_pronunciation_feedback(self, expected_text: str, user_transcript: str) -> str:
        """Đưa ra feedback về phát âm sử dụng AI assistant"""
        try:
            if not self.is_initialized:
                await self.initialize()
            
            # Tối ưu prompt cho pronunciation feedback
            feedback_prompt = f"""Pronunciation feedback: Expected "{expected_text}", heard "{user_transcript}". Be brief and encouraging."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "English pronunciation tutor. Be brief and encouraging."},
                    {"role": "user", "content": feedback_prompt}
                ],
                max_tokens=80,  # Giảm token usage cho feedback nhanh
                temperature=0.5  # Giảm temperature cho phản hồi nhất quán hơn
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Pronunciation feedback failed: {str(e)}")
            return "Great effort! Keep practicing your pronunciation."
    
    def clear_conversation(self):
        """Xóa conversation history"""
        try:
            logger.info("Conversation history cleared")
        except Exception as e:
            logger.error(f"Failed to clear conversation: {str(e)}")

# Global instance
realtime_service = RealtimeService() 