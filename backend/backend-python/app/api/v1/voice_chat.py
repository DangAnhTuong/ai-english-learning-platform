from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import base64
import logging
import asyncio
from typing import Dict, Any
import os
from openai import OpenAI
from deepgram import Deepgram

router = APIRouter()

# Setup logging
logger = logging.getLogger(__name__)

# Initialize clients
openai_api_key = os.getenv("OPENAI_API_KEY")
deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")

# Initialize clients as None - will be set when needed
openai_client = None
deepgram_client = None

def get_openai_client():
    global openai_client
    if openai_client is None:
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        openai_client = OpenAI(api_key=openai_api_key)
    return openai_client

def get_deepgram_client():
    global deepgram_client
    if deepgram_client is None:
        if not deepgram_api_key:
            raise ValueError("DEEPGRAM_API_KEY not found in environment variables")
        deepgram_client = Deepgram(deepgram_api_key)
    return deepgram_client

# Store conversation contexts
conversation_contexts: Dict[str, list] = {}

async def voice_chat_websocket(websocket: WebSocket):
    await websocket.accept()
    client_id = id(websocket)
    conversation_contexts[client_id] = []
    
    logger.info(f"Voice chat WebSocket connected: {client_id}")
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "audio_data":
                await process_audio_message(websocket, client_id, message)
            elif message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            else:
                logger.warning(f"Unknown message type: {message.get('type')}")
                
    except WebSocketDisconnect:
        logger.info(f"Voice chat WebSocket disconnected: {client_id}")
        if client_id in conversation_contexts:
            del conversation_contexts[client_id]
    except Exception as e:
        logger.error(f"Voice chat error: {str(e)}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": str(e)
        }))

async def process_audio_message(websocket: WebSocket, client_id: str, message: Dict[str, Any]):
    """Process audio data and generate AI response"""
    try:
        # Decode base64 audio
        audio_base64 = message.get("audio")
        if not audio_base64:
            return
            
        audio_data = base64.b64decode(audio_base64)
        
        # Transcribe audio using Deepgram
        transcript = await transcribe_audio(audio_data)
        
        if not transcript or transcript.strip() == "":
            return
            
        # Send transcript to client
        await websocket.send_text(json.dumps({
            "type": "transcript",
            "text": transcript
        }))
        
        # Generate AI response
        ai_response = await generate_ai_response(client_id, transcript)
        
        if ai_response:
            # Send AI response to client
            await websocket.send_text(json.dumps({
                "type": "ai_response",
                "text": ai_response
            }))
            
    except Exception as e:
        logger.error(f"Error processing audio message: {str(e)}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Processing error: {str(e)}"
        }))

async def transcribe_audio(audio_data: bytes) -> str:
    """Transcribe audio using Deepgram"""
    try:
        deepgram_client = get_deepgram_client()
        response = await deepgram_client.transcription.prerecorded({
            "buffer": audio_data,
            "mimetype": "audio/webm"
        }, {
            "model": "nova-2",
            "smart_format": True,
            "punctuate": True,
            "language": "multi"  # Auto-detect Vietnamese and English
        })
        
        if response and "results" in response:
            transcript = response["results"]["channels"][0]["alternatives"][0]["transcript"]
            logger.info(f"Transcribed: {transcript}")
            return transcript
            
        return ""
        
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        return ""

async def generate_ai_response(client_id: str, user_message: str) -> str:
    """Generate AI response using OpenAI"""
    try:
        # Get conversation context
        context = conversation_contexts.get(client_id, [])
        
        # Add user message to context
        context.append({"role": "user", "content": user_message})
        
        # Keep only last 10 messages to manage context size
        if len(context) > 10:
            context = context[-10:]
        
        # Create system prompt for voice conversation
        system_prompt = """You are an AI voice assistant for real-time conversation. Your role is to:
1. Have natural, conversational responses
2. Keep responses concise (1-2 sentences) for voice interaction
3. Be helpful, friendly, and engaging
4. Respond in the same language as the user (Vietnamese or English)
5. Support code-switching between Vietnamese and English
6. Be conversational, not formal

Keep your responses short and natural for voice conversation."""

        # Prepare messages for OpenAI
        messages = [{"role": "system", "content": system_prompt}] + context
        
        # Generate response
        openai_client = get_openai_client()
        response = await asyncio.to_thread(
            openai_client.chat.completions.create,
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=150,  # Keep responses short for voice
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        # Add AI response to context
        context.append({"role": "assistant", "content": ai_response})
        conversation_contexts[client_id] = context
        
        logger.info(f"AI Response: {ai_response}")
        return ai_response
        
    except Exception as e:
        logger.error(f"AI response generation error: {str(e)}")
        return "I'm sorry, I couldn't process that. Could you please repeat?"

@router.post("/clear-context")
async def clear_conversation_context(client_id: str):
    """Clear conversation context for a client"""
    if client_id in conversation_contexts:
        del conversation_contexts[client_id]
    return {"message": "Context cleared"} 