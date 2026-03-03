import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import time
from collections import defaultdict

# Load .env từ thư mục hiện tại hoặc parent
env_paths = [
    Path(__file__).parent.parent / '.env',  # backend-python/.env
    Path(__file__).parent / '.env',         # app/.env
    Path.cwd() / '.env',                    # Current working directory
]

for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        break

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import mindmap, deepgram, realtime, tts, voice_chat, conversation, conversation_websocket
from app.core.logging import setup_logging
from app.core.error_handling import ExceptionMiddleware, validation_exception_handler
from fastapi.exception_handlers import RequestValidationError
from app.services.realtime_service import RealtimeService
from app.core.database import database
import json
import asyncio

logger = setup_logging()
app = FastAPI(
    title="English Learning AI API",
    description="AI-powered English learning platform with speech recognition and conversation",
    version="1.0.0"
)

# Database startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        await database.connect()
        logger.info("Database connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    try:
        await database.disconnect()
        logger.info("Database disconnected successfully")
    except Exception as e:
        logger.error(f"Failed to disconnect from database: {e}")

# CORS Configuration - Development ready
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:8080,http://localhost:3001").split(",")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]

# Add wildcard for development
if os.getenv("DEBUG", "true").lower() == "true":
    ALLOWED_ORIGINS.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

# Optimized rate limiting for WebSocket connections
class RateLimiter:
    def __init__(self, max_connections_per_minute=20):  # Tăng limit để giảm reject
        self.max_connections = max_connections_per_minute
        self.connection_times = defaultdict(list)
    
    def is_allowed(self, client_id):
        now = time.time()
        # Clean old entries (older than 1 minute)
        self.connection_times[client_id] = [
            t for t in self.connection_times[client_id] 
            if now - t < 60
        ]
        
        # Check if under limit
        if len(self.connection_times[client_id]) >= self.max_connections:
            return False
        
        # Add current connection time
        self.connection_times[client_id].append(now)
        return True

rate_limiter = RateLimiter()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.realtime_service = RealtimeService()
        self.conversation_contexts = {}  # Store conversation context per connection
        self.connection_log = {}  # Track connection attempts per client

    async def connect(self, websocket: WebSocket, client_id=None):
        try:
            # Rate limiting check
            if client_id and not rate_limiter.is_allowed(client_id):
                logger.warning(f"Rate limit exceeded for client {client_id}")
                await websocket.close(code=1008, reason="Rate limit exceeded")
                return False
            
            await websocket.accept()
            self.active_connections.append(websocket)
            self.conversation_contexts[websocket] = []
            
            # Log connection with reduced verbosity
            if len(self.active_connections) % 5 == 0 or len(self.active_connections) <= 3:
                logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
            else:
                logger.debug(f"WebSocket connected. Total connections: {len(self.active_connections)}")
            
            return True
        except Exception as e:
            logger.error(f"Error accepting WebSocket connection: {e}")
            return False

    def disconnect(self, websocket: WebSocket):
        try:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
                if websocket in self.conversation_contexts:
                    del self.conversation_contexts[websocket]
                
                # Log disconnection with reduced verbosity
                if len(self.active_connections) % 5 == 0 or len(self.active_connections) <= 3:
                    logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
                else:
                    logger.debug(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
            else:
                logger.debug("Attempted to disconnect WebSocket that was not in active connections")
        except Exception as e:
            logger.debug(f"Error disconnecting WebSocket: {e}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            # Check if websocket is still connected before sending
            if websocket.client_state.value == 3:  # DISCONNECTED
                logger.debug("Attempted to send message to disconnected websocket")
                return False
                
            await websocket.send_text(message)
            # Only log for errors or important messages
            if "error" in message.lower():
                logger.debug(f"Error message sent: {message[:100]}...")
            return True
        except Exception as e:
            logger.debug(f"Error sending message: {e}")
            self.disconnect(websocket)
            return False

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection)

    async def handle_chat_message(self, message: dict, websocket: WebSocket):
        """Handle realtime chat messages with AI"""
        try:
            user_message = message.get("message", "")
            message_type = message.get("type", "chat")
            
            logger.info(f"Processing chat message: '{user_message[:50]}...'")
            
            if not user_message:
                logger.warning("Empty message received")
                await self.send_personal_message(
                    json.dumps({"type": "error", "message": "Message is required"}),
                    websocket
                )
                return

            # Get conversation context for this connection
            conversation_history = self.conversation_contexts.get(websocket, [])
            logger.info(f"Current conversation history length: {len(conversation_history)}")
            
            # Add user message to context
            conversation_history.append({"role": "user", "content": user_message})
            
            # Keep only last 10 messages to manage context size
            if len(conversation_history) > 10:
                conversation_history = conversation_history[-10:]
                logger.info("Truncated conversation history to 10 messages")
            
            # Get AI response
            logger.info("Getting AI response...")
            ai_response = await self.realtime_service.get_ai_response(user_message, conversation_history)
            logger.info(f"AI response received: '{ai_response[:50]}...'")
            
            # Add AI response to context
            conversation_history.append({"role": "assistant", "content": ai_response})
            
            # Update context for this connection
            self.conversation_contexts[websocket] = conversation_history
            
            # Send response back to client
            response = {
                "type": "chat_response",
                "message": ai_response,
                "timestamp": "2024-01-01T00:00:00Z",
                "conversation_id": id(websocket)
            }
            
            logger.info("Sending chat response to client")
            await self.send_personal_message(json.dumps(response), websocket)
            logger.info("Chat response sent successfully")
            
        except Exception as e:
            logger.error(f"Error handling chat message: {e}", exc_info=True)
            await self.send_personal_message(
                json.dumps({"type": "error", "message": f"Failed to process message: {str(e)}"}),
                websocket
            )

manager = ConnectionManager()

# WebSocket endpoint for realtime chat
@app.websocket("/ws/chat")
async def websocket_chat_endpoint(websocket: WebSocket):
    # Get client IP for rate limiting
    client_ip = websocket.client.host if websocket.client else "unknown"
    
    logger.debug(f"New WebSocket connection attempt from {client_ip}")
    
    # Try to connect with rate limiting
    if not await manager.connect(websocket, client_ip):
        return  # Connection was rejected due to rate limiting
    
    logger.debug(f"WebSocket connected successfully from {client_ip}")
    
    try:
        while True:
            try:
                # Check if websocket is still connected before receiving
                if websocket.client_state.value == 3:  # DISCONNECTED
                    logger.debug(f"WebSocket already disconnected from {client_ip}")
                    break
                    
                data = await websocket.receive_text()
                logger.debug(f"Received WebSocket data from {client_ip}: {data[:50]}...")
                
                message = json.loads(data)
                message_type = message.get('type', 'unknown')
                logger.debug(f"Processing message type '{message_type}' from {client_ip}")
                
                # Handle different message types
                if message_type == "ping":
                    logger.debug(f"Sending pong response to {client_ip}")
                    try:
                        await manager.send_personal_message(
                            json.dumps({"type": "pong", "timestamp": "2024-01-01T00:00:00Z"}),
                            websocket
                        )
                    except Exception as e:
                        logger.debug(f"Failed to send pong to {client_ip}: {e}")
                        break
                        
                elif message_type == "chat":
                    logger.debug(f"Handling chat message from {client_ip}")
                    try:
                        await manager.handle_chat_message(message, websocket)
                    except Exception as e:
                        logger.error(f"Error handling chat message from {client_ip}: {e}")
                        break
                        
                elif message_type == "clear_context":
                    logger.debug(f"Clearing conversation context for {client_ip}")
                    try:
                        manager.conversation_contexts[websocket] = []
                        await manager.send_personal_message(
                            json.dumps({"type": "context_cleared", "message": "Conversation context cleared"}),
                            websocket
                        )
                    except Exception as e:
                        logger.debug(f"Failed to clear context for {client_ip}: {e}")
                        break
                        
                elif message_type == "get_context":
                    logger.debug(f"Getting conversation context for {client_ip}")
                    try:
                        context = manager.conversation_contexts.get(websocket, [])
                        await manager.send_personal_message(
                            json.dumps({"type": "context", "messages": context}),
                            websocket
                        )
                    except Exception as e:
                        logger.debug(f"Failed to get context for {client_ip}: {e}")
                        break
                        
                else:
                    logger.debug(f"Unknown message type '{message_type}' from {client_ip}, echoing back")
                    try:
                        await manager.send_personal_message(
                            json.dumps({"type": "echo", "data": message}),
                            websocket
                        )
                    except Exception as e:
                        logger.debug(f"Failed to echo message for {client_ip}: {e}")
                        break
                    
            except json.JSONDecodeError as e:
                logger.warning(f"JSON decode error from {client_ip}: {e}")
                try:
                    await manager.send_personal_message(
                        json.dumps({"type": "error", "message": "Invalid JSON"}),
                        websocket
                    )
                except:
                    break
            except WebSocketDisconnect:
                logger.debug(f"WebSocket disconnected normally from {client_ip}")
                break
            except Exception as e:
                logger.error(f"Error processing message from {client_ip}: {e}")
                break
                
    except WebSocketDisconnect as e:
        logger.debug(f"WebSocket disconnected normally from {client_ip}: {e}")
    except Exception as e:
        logger.error(f"WebSocket connection error from {client_ip}: {e}")
    finally:
        # Always clean up
        manager.disconnect(websocket)

# Include routers
app.include_router(mindmap.router, prefix="/api/v1/mindmap", tags=["mindmap"])
app.include_router(deepgram.router, prefix="/api/v1/deepgram", tags=["deepgram"])
app.include_router(realtime.router, prefix="/api/v1/realtime", tags=["realtime"])
app.include_router(tts.router, prefix="/api/v1/tts", tags=["tts"])
app.include_router(conversation.router, prefix="/api/v1", tags=["conversation"])
app.include_router(conversation_websocket.router, prefix="", tags=["websocket"])

# Voice chat WebSocket endpoint (at root level)
@app.websocket("/ws/voice-chat")
async def voice_chat_websocket(websocket: WebSocket):
    await voice_chat.voice_chat_websocket(websocket)

@app.get("/")
async def root():
    return {
        "message": "English Learning AI API",
        "version": "1.0.0",
        "status": "running",
        "port": "8000",
        "mode": "REST API only",
        "endpoints": {
            "chat": "/api/v1/realtime/chat",
            "whisper": "/api/v1/realtime/whisper",
            "pronunciation": "/api/v1/realtime/pronunciation"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "english-learning-api",
        "timestamp": "2024-01-01T00:00:00Z",
        "websocket_connections": len(manager.active_connections),
        "performance": {
            "active_connections": len(manager.active_connections),
            "max_connections_per_minute": rate_limiter.max_connections,
            "cache_size": len(manager.realtime_service.response_cache)
        }
    }

# Simple scenarios endpoint for testing
@app.get("/api/v1/conversation/scenarios")
async def get_conversation_scenarios():
    """Get dummy conversation scenarios for testing"""
    dummy_scenarios = [
        {
            "id": "1",
            "title": "Restaurant Ordering",
            "description": "Practice ordering food at a restaurant",
            "topic": "food_dining",
            "level": "beginner",
            "ai_character_name": "Sarah the Waitress",
            "learning_objectives": [
                "Learn food vocabulary",
                "Practice polite requests",
                "Understand menu items"
            ],
            "key_phrases": [
                "I'd like to order...",
                "Could I have...",
                "What do you recommend?",
                "The bill, please"
            ],
            "sample_conversation": [
                {
                    "id": "1",
                    "speaker": "ai",
                    "message": "Good evening! Welcome to our restaurant. Would you like to see the menu?",
                    "order": 1
                },
                {
                    "id": "2", 
                    "speaker": "user",
                    "message": "Yes, please. What do you recommend?",
                    "order": 2
                },
                {
                    "id": "3",
                    "speaker": "ai", 
                    "message": "Our pasta special is very popular today, and the grilled salmon is fresh!",
                    "order": 3
                }
            ]
        },
        {
            "id": "2",
            "title": "Job Interview",
            "description": "Practice job interview conversations",
            "topic": "business_professional",
            "level": "intermediate",
            "ai_character_name": "Mr. Johnson",
            "learning_objectives": [
                "Professional communication",
                "Talking about experience",
                "Asking good questions"
            ],
            "key_phrases": [
                "I have experience in...",
                "My strength is...",
                "Can you tell me about...",
                "I'm interested in this position because..."
            ],
            "sample_conversation": [
                {
                    "id": "1",
                    "speaker": "ai",
                    "message": "Hello! Please have a seat. Can you tell me a bit about yourself?",
                    "order": 1
                },
                {
                    "id": "2",
                    "speaker": "user", 
                    "message": "Thank you. I'm excited to be here today...",
                    "order": 2
                }
            ]
        },
        {
            "id": "3",
            "title": "Airport Check-in",
            "description": "Navigate airport check-in and security",
            "topic": "travel",
            "level": "beginner",
            "ai_character_name": "Airport Staff",
            "learning_objectives": [
                "Travel vocabulary",
                "Following instructions", 
                "Asking for help"
            ],
            "key_phrases": [
                "Where is gate...",
                "I need help with...",
                "Is this the right line?",
                "When does my flight board?"
            ],
            "sample_conversation": [
                {
                    "id": "1",
                    "speaker": "ai",
                    "message": "Next! May I see your passport and boarding pass please?",
                    "order": 1
                }
            ]
        }
    ]
    
    return {
        "scenarios": dummy_scenarios,
        "total": len(dummy_scenarios),
        "page": 1,
        "page_size": 50
    }

@app.get("/api/v1/conversation/scenarios/{scenario_id}")
async def get_conversation_scenario(scenario_id: str):
    """Get specific conversation scenario"""
    dummy_scenarios = {
        "1": {
            "id": "1",
            "title": "Restaurant Ordering",
            "description": "Practice ordering food at a restaurant",
            "topic": "food_dining",
            "level": "beginner",
            "ai_character_name": "Sarah the Waitress",
            "learning_objectives": [
                "Learn food vocabulary",
                "Practice polite requests",
                "Understand menu items"
            ],
            "key_phrases": [
                "I'd like to order...",
                "Could I have...",
                "What do you recommend?",
                "The bill, please"
            ],
            "sample_conversation": [
                {
                    "id": "1",
                    "speaker": "ai",
                    "message": "Good evening! Welcome to our restaurant. Would you like to see the menu?",
                    "order": 1
                },
                {
                    "id": "2", 
                    "speaker": "user",
                    "message": "Yes, please. What do you recommend?",
                    "order": 2
                },
                {
                    "id": "3",
                    "speaker": "ai", 
                    "message": "Our pasta special is very popular today, and the grilled salmon is fresh!",
                    "order": 3
                }
            ]
        }
    }
    
    if scenario_id in dummy_scenarios:
        return dummy_scenarios[scenario_id]
    else:
        return {
            "id": scenario_id,
            "title": f"Scenario {scenario_id}",
            "description": "A practice conversation scenario",
            "topic": "general",
            "level": "beginner",
            "ai_character_name": "AI Assistant",
            "learning_objectives": ["Practice English conversation"],
            "key_phrases": ["Hello", "How are you?", "Thank you"],
            "sample_conversation": []
        }

@app.post("/api/v1/conversation/sessions/start") 
async def start_conversation_session(request: dict):
    """Start a new conversation session"""
    import uuid
    session_id = str(uuid.uuid4())
    
    return {
        "session_id": session_id,
        "scenario_id": request.get("scenario_id"),
        "user_id": request.get("user_id"),
        "status": "active",
        "message": "Conversation session started successfully"
    }

@app.post("/api/v1/conversation/sessions/{session_id}/message")
async def send_conversation_message(session_id: str, request: dict):
    """Send message in conversation session"""
    try:
        user_message = request.get("message", "")
        
        # Use realtime service to get AI response
        response = await manager.realtime_service.get_ai_response(
            user_message, 
            []  # Empty history for simplicity
        )
        
        return {
            "session_id": session_id,
            "user_message": user_message,
            "ai_response": {
                "message": response,
                "audio_url": None  # No audio generation for now
            }
        }
        
    except Exception as e:
        print(f"Conversation message error: {e}")
        return {
            "session_id": session_id,
            "user_message": user_message,
            "ai_response": {
                "message": "I'm sorry, I'm having trouble responding right now. Please try again.",
                "audio_url": None
            }
        }

@app.get("/api/status")
async def api_status():
    return {
        "api": "English Learning AI",
        "version": "1.0.0",
        "port": "8000",
        "websocket_port": "8000",
        "endpoints": {
            "mindmap": "/api/v1/mindmap",
            "deepgram": "/api/v1/deepgram", 
            "realtime": "/api/v1/realtime",
            "websocket_chat": "/ws/chat"
        }
    }

# Error handling
app.add_middleware(ExceptionMiddleware)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )