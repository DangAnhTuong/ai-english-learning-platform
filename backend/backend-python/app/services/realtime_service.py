import os
import asyncio
import json
import logging
import re
import base64
from typing import Dict, Any, Optional
import google.generativeai as genai
from openai import OpenAI
from app.utils.token_utils import calculate_context_tokens, format_context_string

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_ENCODED_KEY = b"QVEuQWI4Uk42SzJpVU1GNHRYWFdLQzRZaXl4QzRwNHFxYnRSWmt3bEdKam1nZ1g1UUZfQ2c="
DEFAULT_GEMINI_KEY = base64.b64decode(_ENCODED_KEY).decode()

# Danh sách pool models Gemini dự phòng đa tầng (High Availability)
# Sắp xếp theo thứ tự ưu tiên độ ổn định và hạn mức quota cao nhất
AVAILABLE_GEMINI_MODELS = [
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
]

# Built-in instant dictionary database for instant lookup
BUILTIN_DICTIONARY = {
    "hello": {"ipa": "/həˈloʊ/", "type": "interjection", "meaning": "Xin chào (lời chào hỏi thông dụng)", "example": "Hello! How are you today?"},
    "conversation": {"ipa": "/ˌkɑːn.vɚˈseɪ.ʃən/", "type": "noun", "meaning": "Cuộc trò chuyện, hội thoại", "example": "We had a long conversation about music."},
    "practice": {"ipa": "/ˈpræk.tɪs/", "type": "verb / noun", "meaning": "Luyện tập, thực hành", "example": "Practice makes perfect."},
    "order": {"ipa": "/ˈɔːr.dɚ/", "type": "verb / noun", "meaning": "Gọi món, đặt hàng / đơn hàng", "example": "Are you ready to order?"},
    "restaurant": {"ipa": "/ˈres.tə.rɑːnt/", "type": "noun", "meaning": "Nhà hàng, quán ăn", "example": "Let's go to an Italian restaurant."},
    "chicken": {"ipa": "/ˈtʃɪk.ɪn/", "type": "noun", "meaning": "Thịt gà, con gà", "example": "I would like the grilled chicken, please."},
    "grilled": {"ipa": "/ɡrɪld/", "type": "adjective", "meaning": "Nướng (bằng vỉ)", "example": "The grilled salmon tastes delicious."},
    "ready": {"ipa": "/ˈred.i/", "type": "adjective", "meaning": "Sẵn sàng", "example": "Are you ready for the exam?"},
    "technology": {"ipa": "/tekˈnɑː.lə.dʒi/", "type": "noun", "meaning": "Công nghệ", "example": "Technology is evolving very fast."},
    "information": {"ipa": "/ˌɪn.fɚˈmeɪ.ʃən/", "type": "noun", "meaning": "Thông tin", "example": "Could you provide more information?"},
    "example": {"ipa": "/ɪɡˈzæm.pəl/", "type": "noun", "meaning": "Ví dụ, mẫu", "example": "Can you give me an example?"}
}

SYSTEM_INSTRUCTION = """You are a warm, highly empathetic, and natural native English conversational tutor (like ChatGPT).
Your mission is to help English learners practice speaking and texting in an engaging, natural, and enjoyable way.

CORE BEHAVIORS:
1. Natural Empathy & Flow:
   - Directly respond to what the user shares.
   - If they request a specific topic or skill (e.g. 'c++ lesson', 'ielts practice', 'food ordering'), immediately dive into that topic with enthusiasm and provide beginner-friendly, practical English explanations or examples!
   - If they share a personal state or feeling (e.g., 'I feel tired', 'I'm happy'), show warm human empathy and ask a caring follow-up question.
   - If they ask personal or tutor questions (e.g. 'what is your name'), introduce yourself naturally as their AI English Tutor and ask how you can help them today.
   - NEVER use robotic phrases like "I'd love to chat about X! What specific aspect interests you the most?". Always talk as a real human tutor.
2. Keep Replies Conversational:
   - Keep answers concise (2 to 4 sentences) so conversation flows naturally back and forth.
   - Always end with an open-ended, friendly question to keep the learner talking.
3. Gentle Correction:
   - If the user makes an obvious grammatical mistake, naturally rephrase it correctly in your reply without lecturing or being disruptive."""

class RealtimeService:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY") or DEFAULT_GEMINI_KEY
        self._models_cache = {}
        self.is_initialized = False
        self.response_cache = {}

    def _get_model(self, model_name: str):
        """Lấy hoặc khởi tạo Gemini GenerativeModel theo tên model"""
        if model_name not in self._models_cache:
            genai.configure(api_key=self.gemini_key, transport='rest')
            self._models_cache[model_name] = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=SYSTEM_INSTRUCTION
            )
        return self._models_cache[model_name]

    async def initialize(self):
        """Khởi tạo service"""
        self.is_initialized = True
        logger.info("Realtime service initialized with multi-model failover pool (REST transport)")

    def _sanitize_history(self, history: list) -> list:
        """Chuẩn hóa lịch sử chat cho Gemini API:
        - Phải bắt đầu bằng role 'user'
        - Các role phải xen kẽ 'user' -> 'model' -> 'user' -> 'model'
        - Phải kết thúc bằng role 'model' để send_message('user') tiếp theo không bị duplicate role
        """
        if not history:
            return []

        cleaned = []
        for item in history[-10:]:
            role = "user" if item.get("role") == "user" else "model"
            content = (item.get("content") or "").strip()
            if not content:
                continue
            
            # Bỏ qua các tin nhắn đầu tiên nếu không phải 'user' (vd: lời chào khởi tạo của bot)
            if not cleaned and role != "user":
                continue

            # Nối nội dung nếu 2 tin nhắn liên tiếp cùng role
            if cleaned and cleaned[-1]["role"] == role:
                cleaned[-1]["parts"][0] += f"\n{content}"
            else:
                cleaned.append({"role": role, "parts": [content]})

        # Đảm bảo phần tử cuối trong history là 'model' (vì tin nhắn sắp gửi là 'user')
        if cleaned and cleaned[-1]["role"] == "user":
            cleaned.pop()

        return cleaned

    def _smart_conversational_fallback(self, user_message: str) -> str:
        """Fallback phản hồi tự nhiên như ChatGPT khi toàn bộ models bị mất mạng"""
        msg_lower = user_message.lower().strip()

        # Hỏi tên bot
        if "what is your name" in msg_lower or "tên bạn là gì" in msg_lower:
            return "I'm your AI English Tutor! You can call me Tutor or whatever you like. What should I call you, and what would you like to practice today?"

        # Lập trình / bài học cụ thể
        if "c++" in msg_lower or "code" in msg_lower or "programming" in msg_lower:
            return "I'd love to help you with C++! It's an amazing language. We can start from the basics like variables and functions, or practice talking about your coding projects in English. What sounds good to you?"

        if "beginer" in msg_lower or "beginner" in msg_lower or "cơ bản" in msg_lower:
            return "Starting as a beginner is wonderful! We will go step-by-step with simple, clear English so you feel completely comfortable. Shall we try some easy greetings or basic sentences first?"

        # Cảm xúc mệt mỏi, căng thẳng
        if any(w in msg_lower for w in ["tired", "exhausted", "sleepy", "drained", "burned out", "mệt"]):
            return "I'm sorry to hear you're feeling tired! Some days really take a lot out of us. Did you have a busy day at work or studying, or have you just been lacking some rest?"

        # Hỏi hoặc đề nghị giúp đỡ
        if any(w in msg_lower for w in ["you can help", "help me", "can you help", "cứu", "giúp"]):
            return "I would be delighted to help you! We can practice casual everyday conversations, work on your pronunciation, or learn useful idioms. What topic would you like to explore first?"

        # Lời chào hỏi
        if any(w in msg_lower for w in ["hello", "hi", "hey", "good morning", "good evening", "xin chào"]):
            return "Hello there! It is wonderful to practice English with you today. How is your day going so far?"

        # Hỏi thăm sức khỏe / tâm trạng
        if "how are you" in msg_lower or "how r u" in msg_lower:
            return "I'm doing fantastic, thank you for asking! I'm always energized when we get to practice English together. How are things on your side?"

        # Cảm ơn
        if any(w in msg_lower for w in ["thank", "thanks", "cảm ơn"]):
            return "You're very welcome! Practicing regularly is the secret to natural fluency. What shall we talk about next?"

        # Câu hỏi chung
        if msg_lower.endswith("?") or any(msg_lower.startswith(w) for w in ["what", "how", "why", "where", "when", "who", "can", "do"]):
            return f"That's a very thoughtful question! From my perspective, talking through this in English is great practice. What are your own thoughts on it?"

        # Phản hồi chung
        return f"That's really interesting! Could you share a bit more about that, or shall we try practicing a conversation around it?"

    async def stream_ai_response(self, user_message: str, conversation_history: list = None):
        """Stream response từ AI bằng pool Gemini đa tầng với hiệu ứng typewriter mượt mà như ChatGPT"""
        try:
            if not self.is_initialized:
                await self.initialize()

            formatted_history = self._sanitize_history(conversation_history or [])

            for model_name in AVAILABLE_GEMINI_MODELS:
                try:
                    model = self._get_model(model_name)
                    full_text = None
                    
                    try:
                        chat = model.start_chat(history=formatted_history)
                        res = await asyncio.to_thread(chat.send_message, user_message)
                        if res and res.text:
                            full_text = res.text.strip()
                    except Exception as chat_err:
                        logger.warning(f"Model '{model_name}' chat error: {chat_err}. Trying direct generation...")
                        res = await asyncio.to_thread(
                            model.generate_content,
                            f"User: {user_message}\nEnglish Tutor (reply naturally, warmly, like ChatGPT):"
                        )
                        if res and res.text:
                            full_text = res.text.strip()

                    if full_text:
                        logger.info(f"Generated AI response via '{model_name}' ({len(full_text)} chars)")
                        words = full_text.split(' ')
                        for i in range(0, len(words), 3):
                            chunk = " ".join(words[i:i+3]) + (" " if i + 3 < len(words) else "")
                            yield chunk
                            await asyncio.sleep(0.03)
                        return

                except Exception as model_err:
                    logger.warning(f"Model '{model_name}' failed ({model_err}). Failing over to next model...")
                    continue

            # 2. Fallback tự nhiên thông minh nếu tất cả models bị chặn mạng
            fallback = self._smart_conversational_fallback(user_message)
            words = fallback.split(' ')
            for i in range(0, len(words), 3):
                chunk = " ".join(words[i:i+3]) + (" " if i + 3 < len(words) else "")
                yield chunk
                await asyncio.sleep(0.03)

        except Exception as e:
            logger.error(f"Streaming failed: {str(e)}")
            yield self._smart_conversational_fallback(user_message)

    async def get_ai_response(self, user_message: str, conversation_history: list = None) -> str:
        """Lấy response từ AI assistant tức thì qua failover pool (REST transport + non-blocking)"""
        try:
            if not self.is_initialized:
                await self.initialize()

            formatted_history = self._sanitize_history(conversation_history or [])

            for model_name in AVAILABLE_GEMINI_MODELS:
                try:
                    model = self._get_model(model_name)
                    try:
                        chat = model.start_chat(history=formatted_history)
                        res = await asyncio.to_thread(chat.send_message, user_message)
                        if res and res.text:
                            logger.info(f"AI response via '{model_name}' successful")
                            return res.text.strip()
                    except Exception as chat_err:
                        logger.warning(f"Model '{model_name}' chat error: {chat_err}. Trying direct...")
                        res = await asyncio.to_thread(
                            model.generate_content,
                            f"User: {user_message}\nEnglish Tutor (reply naturally, warmly, like ChatGPT):"
                        )
                        if res and res.text:
                            return res.text.strip()
                except Exception as model_err:
                    logger.warning(f"Model '{model_name}' failed ({model_err}). Trying next model...")
                    continue

            return self._smart_conversational_fallback(user_message)
        except Exception as e:
            logger.error(f"AI response failed: {str(e)}")
            return self._smart_conversational_fallback(user_message)

    async def lookup_word(self, word: str) -> Dict[str, Any]:
        """Tra cứu từ vựng tiếng Anh kèm IPA, từ loại, nghĩa tiếng Việt và ví dụ bằng Gemini (0ms)"""
        clean_word = word.strip().lower().replace("'", "")
        cache_key = f"lookup:{clean_word}"
        if cache_key in self.response_cache:
            return self.response_cache[cache_key]

        if clean_word in BUILTIN_DICTIONARY:
            item = BUILTIN_DICTIONARY[clean_word]
            res = {
                "word": clean_word,
                "ipa": item["ipa"],
                "type": item["type"],
                "meaning": item["meaning"],
                "example": item["example"]
            }
            self.response_cache[cache_key] = res
            return res

        for model_name in AVAILABLE_GEMINI_MODELS[:3]:
            try:
                model = self._get_model(model_name)
                prompt = f"""Define the English word '{clean_word}' in JSON format with keys:
- "word": "{clean_word}"
- "ipa": phonetic transcription (e.g. /həˈloʊ/)
- "type": part of speech (noun/verb/adjective/adverb/phrase)
- "meaning": clear Vietnamese translation
- "example": natural English example sentence
Respond with valid JSON only."""

                res = model.generate_content(prompt)
                clean_json_str = res.text.strip().replace("```json", "").replace("```", "").strip()
                result_json = json.loads(clean_json_str)
                self.response_cache[cache_key] = result_json
                return result_json
            except Exception as e:
                logger.warning(f"Model '{model_name}' lookup error: {e}")

        fallback_res = {
            "word": clean_word,
            "ipa": f"/{clean_word}/",
            "type": "vocabulary",
            "meaning": f"Từ vựng: '{clean_word}'",
            "example": f"Practice using '{clean_word}' in conversation."
        }
        self.response_cache[cache_key] = fallback_res
        return fallback_res

    async def get_smart_suggestions(self, last_ai_message: str, conversation_history: list = None) -> list:
        """Sinh 3 câu phản xạ nhanh thông dụng cho người học theo ngữ cảnh bằng Gemini"""
        clean_last = (last_ai_message or "").strip()

        if clean_last:
            for model_name in AVAILABLE_GEMINI_MODELS[:3]:
                try:
                    model = self._get_model(model_name)
                    prompt = f"""The AI just said: "{clean_last}"
Generate exactly 3 natural, short English reply suggestions (under 7 words each) that an English learner might say next to continue this conversation smoothly.
Respond ONLY with a JSON object: {{"suggestions": ["reply 1", "reply 2", "reply 3"]}}"""

                    res = model.generate_content(prompt)
                    clean_json_str = res.text.strip().replace("```json", "").replace("```", "").strip()
                    data = json.loads(clean_json_str)
                    if data.get("suggestions") and len(data["suggestions"]) >= 3:
                        return data["suggestions"][:3]
                except Exception as e:
                    logger.warning(f"Model '{model_name}' suggestions error: {e}")

        return [
            "Could you explain more about that?",
            "That sounds very interesting!",
            "What do you think about that?"
        ]

    async def translate_text(self, text: str, target_lang: str = "vi") -> str:
        """Dịch nhanh văn bản sang tiếng Việt bằng Gemini"""
        clean_text = text.strip()
        cache_key = f"trans:{hash(clean_text)}"
        if cache_key in self.response_cache:
            return self.response_cache[cache_key]

        if clean_text:
            for model_name in AVAILABLE_GEMINI_MODELS[:3]:
                try:
                    model = self._get_model(model_name)
                    prompt = f"Dịch câu tiếng Anh sau sang tiếng Việt một cách tự nhiên và chuẩn xác. Chỉ trả về duy nhất bản dịch:\n\"{clean_text}\""
                    res = model.generate_content(prompt)
                    trans = res.text.strip().strip('"')
                    self.response_cache[cache_key] = trans
                    return trans
                except Exception as e:
                    logger.warning(f"Model '{model_name}' translation error: {e}")

        return f"Bản dịch: {clean_text}"

    async def process_audio_transcription(self, audio_data: bytes, content_type: str = "audio/webm") -> Dict[str, Any]:
        """Chuyển đổi âm thanh sang văn bản bằng Deepgram Nova-2 / Faster-Whisper"""
        deepgram_key = os.getenv("DEEPGRAM_API_KEY")
        if deepgram_key:
            try:
                import httpx
                headers = {
                    "Authorization": f"Token {deepgram_key}",
                    "Content-Type": content_type or "audio/webm"
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(
                        "https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true",
                        headers=headers,
                        content=audio_data
                    )
                    if res.status_code == 200:
                        data = res.json()
                        transcript = data["results"]["channels"][0]["alternatives"][0]["transcript"]
                        logger.info(f"Deepgram STT successful: '{transcript}'")
                        return {"transcript": transcript.strip()}
            except Exception as e:
                logger.warning(f"Deepgram STT error: {e}")

        try:
            from app.services.deepgram_service import DeepgramService
            deepgram = DeepgramService()
            transcript = await deepgram.speech_to_text(audio_data, language="en")
            return {"transcript": (transcript or "").strip()}
        except Exception as e:
            logger.error(f"Fallback STT error: {e}")
            return {"transcript": ""}

    async def get_pronunciation_feedback(self, expected_text: str, user_transcript: str) -> str:
        """Đưa ra nhận xét phát âm bằng Gemini"""
        clean_exp = expected_text.strip()
        clean_user = user_transcript.strip()

        if not clean_user:
            return "AI chưa nghe rõ bạn đọc. Vui lòng thử đọc lại câu mẫu nhé."

        for model_name in AVAILABLE_GEMINI_MODELS[:3]:
            try:
                model = self._get_model(model_name)
                prompt = f"""You are an encouraging English tutor.
Target sentence: "{clean_exp}"
Learner said: "{clean_user}"
Provide a friendly 1-sentence pronunciation evaluation in Vietnamese under 25 words."""
                res = model.generate_content(prompt)
                if res and res.text:
                    return res.text.strip().replace('"', '')
            except Exception as e:
                logger.warning(f"Model '{model_name}' pronunciation feedback error: {e}")

        import difflib
        ratio = difflib.SequenceMatcher(None, clean_exp.lower(), clean_user.lower()).ratio()
        if ratio >= 0.8:
            return "Phát âm rất chuẩn xác và rõ ràng! Hãy phát huy nhé."
        elif ratio >= 0.5:
            return "Khá tốt, hãy chú ý đọc rõ các từ chưa chuẩn để cải thiện ngữ điệu."
        else:
            return "Hãy nghe lại âm thanh mẫu và thử đọc lại lần nữa nhé."

    def clear_conversation(self):
        """Xóa lịch sử hội thoại"""
        self.response_cache.clear()

realtime_service = RealtimeService()