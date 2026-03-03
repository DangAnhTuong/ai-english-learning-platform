from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import json
import os
from typing import Dict, Any
import asyncio
from app.services.realtime_service import realtime_service

router = APIRouter()

@router.post("/whisper")
async def whisper_transcribe(audio: UploadFile = File(...)):
    """Transcribe audio file using OpenAI Whisper with multilingual support"""
    try:
        # Đọc audio file
        audio_content = await audio.read()
        
        print(f"Processing audio with OpenAI Whisper")
        print(f"Audio content size: {len(audio_content)} bytes")
        print(f"Audio mimetype: {audio.content_type}")
        
        # Sử dụng Realtime service để transcribe
        result = await realtime_service.process_audio_transcription(audio_content, audio.content_type)
        
        print(f"Whisper result: {result}")
        
        # Kiểm tra có lỗi không
        if "error" in result:
            return {
                "transcript": "",
                "confidence": 0.0,
                "language": "unknown",
                "error": result["error"]
            }
        
        # Kiểm tra transcript có hợp lệ không
        if not result["transcript"] or result["transcript"].strip() == "":
            return {
                "transcript": "",
                "confidence": 0.0,
                "language": result.get("language", "unknown"),
                "error": "No speech detected"
            }
        
        return {
            "transcript": result["transcript"],
            "confidence": result["confidence"],
            "language": result.get("language", "unknown"),
            "segments": result.get("segments", [])
        }
        
    except Exception as e:
        print(f"Error in whisper_transcribe: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.post("/chat")
async def chat_response(request: Dict[str, Any]):
    """Get AI response for chat conversation using Realtime API"""
    try:
        user_message = request.get("message", "")
        conversation_history = request.get("conversation_history", [])
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        print(f"Processing chat request: {user_message[:50]}...")
        print(f"Conversation history length: {len(conversation_history)}")
        
        # Sử dụng Realtime service để lấy response
        response = await realtime_service.get_ai_response(user_message, conversation_history)
        
        print(f"AI response: {response[:50]}...")
        
        return {"response": response}
        
    except Exception as e:
        print(f"Chat failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.post("/feedback")
async def pronunciation_feedback(request: Dict[str, Any]):
    """Get pronunciation feedback using Realtime API"""
    try:
        expected_text = request.get("expected", "")
        user_transcript = request.get("transcript", "")
        
        # Convert null/None to empty string
        if user_transcript is None:
            user_transcript = ""
        
        if not expected_text:
            raise HTTPException(status_code=400, detail="Expected text is required")
        
        # Kiểm tra transcript có hợp lệ không
        if not user_transcript or user_transcript.strip() == "":
            return {"feedback": "I couldn't hear what you said. Please try speaking more clearly and make sure your microphone is working properly."}
        
        print(f"Processing feedback request - Expected: '{expected_text}', Transcript: '{user_transcript}'")
        
        # Sử dụng Realtime service để lấy feedback
        feedback = await realtime_service.get_pronunciation_feedback(expected_text, user_transcript)
        
        print(f"Feedback received: {feedback[:50]}...")
        
        return {"feedback": feedback}
        
    except Exception as e:
        print(f"Feedback failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Feedback failed: {str(e)}")

@router.post("/pronunciation")
async def pronunciation_feedback_alias(request: Dict[str, Any]):
    """Get pronunciation feedback using Realtime API (alias for /feedback)"""
    return await pronunciation_feedback(request)

@router.post("/initialize")
async def initialize_realtime():
    """Initialize Realtime service"""
    try:
        await realtime_service.initialize()
        return {"status": "initialized", "message": "Realtime service initialized successfully"}
    except Exception as e:
        print(f"Initialization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Initialization failed: {str(e)}")

@router.post("/clear")
async def clear_conversation():
    """Clear conversation history"""
    try:
        realtime_service.clear_conversation()
        return {"status": "cleared", "message": "Conversation history cleared"}
    except Exception as e:
        print(f"Clear conversation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Clear conversation failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "realtime-api"} 