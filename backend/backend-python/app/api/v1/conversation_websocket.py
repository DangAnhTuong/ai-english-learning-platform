from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
import json
import logging
import asyncio
from typing import Dict, Any, Optional
import base64
from datetime import datetime

from app.services.conversation_service import ConversationService
from app.services.repositories.conversation_repository import MongoConversationRepository
from app.services.ai_conversation_service import OpenAIConversationService
from app.services.deepgram_service import DeepgramService
from app.core.database import get_database

router = APIRouter(prefix="/ws/conversation", tags=["websocket"])
logger = logging.getLogger(__name__)

class ConversationWebSocketManager:
    """WebSocket manager for real-time conversation practice"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_connections: Dict[str, str] = {}  # session_id -> connection_id
        self.conversation_service: Optional[ConversationService] = None
    
    async def get_conversation_service(self) -> ConversationService:
        """Get conversation service instance"""
        if self.conversation_service is None:
            db = await get_database()
            repository = MongoConversationRepository(db)
            ai_service = OpenAIConversationService()
            deepgram_service = DeepgramService()
            self.conversation_service = ConversationService(repository, ai_service, deepgram_service)
        return self.conversation_service
    
    async def connect(self, websocket: WebSocket, connection_id: str):
        """Connect new WebSocket"""
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        logger.info(f"WebSocket connected: {connection_id}")
        
        # Send welcome message
        await self.send_message(connection_id, {
            "type": "connection_established",
            "connection_id": connection_id,
            "message": "Connected to conversation service"
        })
    
    async def disconnect(self, connection_id: str):
        """Disconnect WebSocket"""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        # End any active conversation sessions
        session_id = None
        for sid, cid in self.session_connections.items():
            if cid == connection_id:
                session_id = sid
                break
        
        if session_id:
            try:
                service = await self.get_conversation_service()
                await service.end_conversation(session_id)
                del self.session_connections[session_id]
            except Exception as e:
                logger.error(f"Failed to end conversation on disconnect: {e}")
        
        logger.info(f"WebSocket disconnected: {connection_id}")
    
    async def send_message(self, connection_id: str, message: Dict[str, Any]):
        """Send message to specific connection"""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send message to {connection_id}: {e}")
                await self.disconnect(connection_id)
    
    async def handle_message(self, connection_id: str, message: Dict[str, Any]):
        """Handle incoming WebSocket message"""
        message_type = message.get("type")
        
        try:
            if message_type == "start_conversation":
                await self._handle_start_conversation(connection_id, message)
            
            elif message_type == "send_message":
                await self._handle_send_message(connection_id, message)
            
            elif message_type == "send_audio":
                await self._handle_send_audio(connection_id, message)
            
            elif message_type == "interrupt_ai":
                await self._handle_interrupt_ai(connection_id, message)
            
            elif message_type == "end_conversation":
                await self._handle_end_conversation(connection_id, message)
            
            elif message_type == "ping":
                await self.send_message(connection_id, {"type": "pong"})
            
            else:
                await self.send_message(connection_id, {
                    "type": "error",
                    "message": f"Unknown message type: {message_type}"
                })
        
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send_message(connection_id, {
                "type": "error",
                "message": str(e)
            })
    
    async def _handle_start_conversation(self, connection_id: str, message: Dict[str, Any]):
        """Handle start conversation request"""
        scenario_id = message.get("scenario_id")
        user_id = message.get("user_id")
        
        if not scenario_id or not user_id:
            await self.send_message(connection_id, {
                "type": "error",
                "message": "scenario_id and user_id are required"
            })
            return
        
        service = await self.get_conversation_service()
        
        # Start conversation
        from app.models.conversation import StartConversationRequest
        request = StartConversationRequest(scenario_id=scenario_id, user_id=user_id)
        session_id = await service.start_conversation(request)
        
        # Store session mapping
        self.session_connections[session_id] = connection_id
        
        # Get scenario details
        scenario = await service.get_scenario(scenario_id)
        
        await self.send_message(connection_id, {
            "type": "conversation_started",
            "session_id": session_id,
            "scenario": scenario.model_dump() if scenario else None,
            "message": "Conversation started successfully"
        })
        
        # If scenario has sample conversation, send it
        if scenario and scenario.sample_conversation:
            for msg in scenario.sample_conversation:
                await self.send_message(connection_id, {
                    "type": "conversation_message",
                    "message": msg.model_dump()
                })
    
    async def _handle_send_message(self, connection_id: str, message: Dict[str, Any]):
        """Handle text message from user"""
        session_id = message.get("session_id")
        text = message.get("text")
        
        if not session_id or not text:
            await self.send_message(connection_id, {
                "type": "error",
                "message": "session_id and text are required"
            })
            return
        
        service = await self.get_conversation_service()
        
        # Send typing indicator
        await self.send_message(connection_id, {
            "type": "ai_typing",
            "session_id": session_id
        })
        
        # Process message
        ai_response = await service.process_user_message(
            session_id=session_id,
            message=text
        )
        
        # Send AI response
        await self.send_message(connection_id, {
            "type": "ai_response",
            "session_id": session_id,
            "message": ai_response.model_dump()
        })
    
    async def _handle_send_audio(self, connection_id: str, message: Dict[str, Any]):
        """Handle audio message from user"""
        session_id = message.get("session_id")
        audio_base64 = message.get("audio")
        
        if not session_id or not audio_base64:
            await self.send_message(connection_id, {
                "type": "error",
                "message": "session_id and audio are required"
            })
            return
        
        try:
            # Decode audio
            audio_data = base64.b64decode(audio_base64)
            
            # Transcribe audio using Deepgram
            deepgram_service = DeepgramService()
            transcript = await deepgram_service.speech_to_text(audio_data)
            
            if not transcript or transcript.strip() == "":
                await self.send_message(connection_id, {
                    "type": "error",
                    "message": "Could not transcribe audio"
                })
                return
            
            # Send transcript to user
            await self.send_message(connection_id, {
                "type": "transcript",
                "session_id": session_id,
                "text": transcript
            })
            
            # Process the transcribed message
            await self._handle_send_message(connection_id, {
                "session_id": session_id,
                "text": transcript,
                "type": "send_message"
            })
            
        except Exception as e:
            await self.send_message(connection_id, {
                "type": "error",
                "message": f"Audio processing failed: {str(e)}"
            })
    
    async def _handle_interrupt_ai(self, connection_id: str, message: Dict[str, Any]):
        """Handle AI interruption request"""
        session_id = message.get("session_id")
        
        if not session_id:
            await self.send_message(connection_id, {
                "type": "error",
                "message": "session_id is required"
            })
            return
        
        service = await self.get_conversation_service()
        success = await service.interrupt_ai_speaking(session_id)
        
        if success:
            await self.send_message(connection_id, {
                "type": "ai_interrupted",
                "session_id": session_id,
                "message": "AI speaking interrupted"
            })
        else:
            await self.send_message(connection_id, {
                "type": "error",
                "message": "Failed to interrupt AI"
            })
    
    async def _handle_end_conversation(self, connection_id: str, message: Dict[str, Any]):
        """Handle end conversation request"""
        session_id = message.get("session_id")
        
        if not session_id:
            await self.send_message(connection_id, {
                "type": "error",
                "message": "session_id is required"
            })
            return
        
        service = await self.get_conversation_service()
        success = await service.end_conversation(session_id)
        
        if success:
            # Remove session mapping
            if session_id in self.session_connections:
                del self.session_connections[session_id]
            
            await self.send_message(connection_id, {
                "type": "conversation_ended",
                "session_id": session_id,
                "message": "Conversation ended successfully"
            })
        else:
            await self.send_message(connection_id, {
                "type": "error",
                "message": "Failed to end conversation"
            })

# Global WebSocket manager
websocket_manager = ConversationWebSocketManager()

@router.websocket("/{connection_id}")
async def conversation_websocket(websocket: WebSocket, connection_id: str):
    """Real-time conversation practice WebSocket endpoint"""
    await websocket_manager.connect(websocket, connection_id)
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                await websocket_manager.handle_message(connection_id, message)
            except json.JSONDecodeError:
                await websocket_manager.send_message(connection_id, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })
            
    except WebSocketDisconnect:
        await websocket_manager.disconnect(connection_id)
    except Exception as e:
        logger.error(f"WebSocket error for {connection_id}: {e}")
        await websocket_manager.disconnect(connection_id)