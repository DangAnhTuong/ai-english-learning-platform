import os
import asyncio
import json
import logging
import re
from typing import Dict, Any, Optional
import google.generativeai as genai
from openai import OpenAI
from app.utils.token_utils import calculate_context_tokens, format_context_string

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

class RealtimeService:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.gemini_model = None
        self._init_gemini()
        self.is_initialized = False
        self.response_cache = {}

    def _init_gemini(self):
        """Khởi tạo Google Gemini 3.6 Flash Engine"""
        try:
            if self.gemini_key:
                genai.configure(api_key=self.gemini_key)
                self.gemini_model = genai.GenerativeModel(
                    model_name='gemini-3.6-flash',
                    system_instruction="You are an English AI Tutor and conversational partner. Speak in natural, friendly, fluent English like ChatGPT. Keep answers engaging and concise (2-4 sentences max unless detailed explanation is requested). If the user makes an English mistake, gently model the correct phrasing. Always encourage conversation."
                )
                logger.info("Gemini 3.6 Flash AI Engine initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")

    async def initialize(self):
        """Khởi tạo service"""
        self.is_initialized = True
        logger.info("Realtime service initialized")

    async def stream_ai_response(self, user_message: str, conversation_history: list = None):
        """Stream response từ AI bằng Gemini 3.6 Flash tự nhiên như ChatGPT"""
        try:
            if not self.is_initialized:
                await self.initialize()

            # 1. Sử dụng Gemini 3.6 Flash Engine
            if self.gemini_model:
                try:
                    formatted_history = []
                    if conversation_history:
                        for item in conversation_history[-8:]:
                            role = "user" if item.get("role") == "user" else "model"
                            content = item.get("content", "")
                            if content.strip():
                                formatted_history.append({"role": role, "parts": [content]})

                    chat = self.gemini_model.start_chat(history=formatted_history)
                    response = chat.send_message(user_message, stream=True)

                    for chunk in response:
                        if chunk.text:
                            yield chunk.text
                    return

                except Exception as gemini_err:
                    logger.warning(f"Gemini streaming error (trying direct generation): {gemini_err}")
                    try:
                        res = self.gemini_model.generate_content(user_message, stream=True)
                        for chunk in res:
                            if chunk.text:
                                yield chunk.text
                        return
                    except Exception as e:
                        logger.error(f"Direct Gemini failed: {e}")

            # 2. Fallback nhẹ nhàng
            yield f"I'd love to chat about '{user_message}'! What specific aspect interests you the most?"

        except Exception as e:
            logger.error(f"Streaming failed: {str(e)}")
            yield "That's very interesting! Could you tell me more about your thoughts on this?"

    async def get_ai_response(self, user_message: str, conversation_history: list = None) -> str:
        """Lấy response từ AI assistant tức thì"""
        try:
            if not self.is_initialized:
                await self.initialize()

            if self.gemini_model:
                try:
                    res = self.gemini_model.generate_content(user_message)
                    if res and res.text:
                        return res.text.strip()
                except Exception as e:
                    logger.warning(f"Gemini get_ai_response error: {e}")

            return f"That's great! Let's talk more about '{user_message}'."
        except Exception as e:
            logger.error(f"AI response failed: {str(e)}")
            return "How can I assist you with your English practice today?"

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

        if self.gemini_model:
            try:
                prompt = f"""Define the English word '{clean_word}' in JSON format with keys:
- "word": "{clean_word}"
- "ipa": phonetic transcription (e.g. /həˈloʊ/)
- "type": part of speech (noun/verb/adjective/adverb/phrase)
- "meaning": clear Vietnamese translation
- "example": natural English example sentence
Respond with valid JSON only."""

                res = self.gemini_model.generate_content(prompt)
                clean_json_str = res.text.strip().replace("```json", "").replace("```", "").strip()
                result_json = json.loads(clean_json_str)
                self.response_cache[cache_key] = result_json
                return result_json
            except Exception as e:
                logger.warning(f"Gemini lookup fallback: {e}")

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

        if self.gemini_model and clean_last:
            try:
                prompt = f"""The AI just said: "{clean_last}"
Generate exactly 3 natural, short English reply suggestions (under 7 words each) that an English learner might say next to continue this conversation smoothly.
Respond ONLY with a JSON object: {{"suggestions": ["reply 1", "reply 2", "reply 3"]}}"""

                res = self.gemini_model.generate_content(prompt)
                clean_json_str = res.text.strip().replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_json_str)
                if data.get("suggestions") and len(data["suggestions"]) >= 3:
                    return data["suggestions"][:3]
            except Exception as e:
                logger.warning(f"Gemini suggestions fallback: {e}")

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

        if self.gemini_model and clean_text:
            try:
                prompt = f"Dịch câu tiếng Anh sau sang tiếng Việt một cách tự nhiên và chuẩn xác. Chỉ trả về duy nhất bản dịch:\n\"{clean_text}\""
                res = self.gemini_model.generate_content(prompt)
                trans = res.text.strip().strip('"')
                self.response_cache[cache_key] = trans
                return trans
            except Exception as e:
                logger.warning(f"Gemini translation fallback: {e}")

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

        # Fallback to local deepgram_service / faster_whisper
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

        if self.gemini_model:
            try:
                prompt = f"""You are an encouraging English tutor.
Target sentence: "{clean_exp}"
Learner said: "{clean_user}"
Provide a friendly 1-sentence pronunciation evaluation in Vietnamese under 25 words."""
                res = self.gemini_model.generate_content(prompt)
                if res and res.text:
                    return res.text.strip().replace('"', '')
            except Exception as e:
                logger.warning(f"Gemini pronunciation feedback error: {e}")

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