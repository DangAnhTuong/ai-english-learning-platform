import os
from openai import OpenAI
from typing import Dict, Any
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Khởi tạo OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key) if openai_api_key else None
logger.info(f"OpenAI API Key loaded: {'YES' if openai_api_key else 'NO'}")

class AIService:
    def __init__(self):
        self.conversation_history = []
    
    async def get_chat_response(self, user_message: str, context: str = "") -> str:
        """Lấy response từ AI cho chat conversation"""
        try:
            if not client:
                logger.warning("OpenAI client not initialized")
                return "I'm sorry, but I'm not properly configured right now. Please check the OpenAI API key configuration."
            
            logger.info(f"Processing chat request: {user_message[:50]}...")
            
            # Tạo system prompt cho English tutor
            system_prompt = """You are an English tutor AI assistant. Your role is to:
1. Help students practice English conversation
2. Provide pronunciation feedback
3. Correct grammar mistakes
4. Give encouraging and helpful responses
5. Keep responses concise and conversational
6. Respond in English unless specifically asked otherwise

Context: {context}""".format(context=context)
            
            # Tạo messages array
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Thêm conversation history
            for msg in self.conversation_history[-10:]:  # Giữ 10 messages gần nhất
                messages.append(msg)
            
            # Thêm user message
            messages.append({"role": "user", "content": user_message})
            
            logger.info("Calling OpenAI API...")
            
            # Gọi OpenAI API
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=150,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            logger.info(f"OpenAI response received: {ai_response[:50]}...")
            
            # Cập nhật conversation history
            self.conversation_history.append({"role": "user", "content": user_message})
            self.conversation_history.append({"role": "assistant", "content": ai_response})
            
            return ai_response
            
        except Exception as e:
            logger.error(f"AI chat error: {str(e)}", exc_info=True)
            return f"Sorry, I'm having trouble responding right now. Error: {str(e)}"
    
    async def get_pronunciation_feedback(self, expected_text: str, user_transcript: str) -> str:
        """Đưa ra feedback về phát âm"""
        try:
            if not client:
                logger.warning("OpenAI client not initialized for feedback")
                return "Great effort! Keep practicing your pronunciation. (AI feedback temporarily unavailable)"
            
            # Kiểm tra transcript có hợp lệ không
            if not user_transcript or user_transcript.strip() == "":
                return "I couldn't hear what you said. Please try speaking more clearly and make sure your microphone is working properly."
            
            logger.info(f"Processing feedback request - Expected: '{expected_text}', Transcript: '{user_transcript}'")
            
            prompt = f"""As an English pronunciation tutor, analyze this:
Expected text: "{expected_text}"
Student's pronunciation: "{user_transcript}"

Provide brief, encouraging feedback on pronunciation accuracy. Focus on:
1. What was pronounced well
2. Any pronunciation issues
3. Suggestions for improvement

Keep it positive and constructive."""

            logger.info("Calling OpenAI API for feedback...")
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=100,
                temperature=0.7
            )
            
            feedback = response.choices[0].message.content
            logger.info(f"Feedback received: {feedback[:50]}...")
            
            return feedback
            
        except Exception as e:
            logger.error(f"AI feedback error: {str(e)}", exc_info=True)
            return "Great effort! Keep practicing your pronunciation."
    
    def clear_history(self):
        """Xóa conversation history"""
        self.conversation_history = []

# Global instance
ai_service = AIService() 