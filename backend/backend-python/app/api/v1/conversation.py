from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks, Body
from fastapi.responses import FileResponse
from typing import List, Optional, Dict, Any
import logging
from pydantic import BaseModel

from app.models.conversation import (
    ConversationScenario,
    ConversationTopic,
    ConversationLevel,
    CreateConversationScenarioRequest,
    UpdateConversationScenarioRequest,
    StartConversationRequest,
    ConversationMessageRequest,
    ConversationListResponse,
    ConversationStatsResponse,
    UserConversationSession,
    ConversationProgress
)
from app.services.conversation_service import ConversationService
from app.services.conversation_audio_service import ConversationAudioService
from app.core.database import get_database

router = APIRouter(prefix="/conversation", tags=["conversation"])
logger = logging.getLogger(__name__)

# Request models cho audio generation
class GenerateAudioRequest(BaseModel):
    conversation_id: str
    lines: List[Dict[str, Any]]
    voice_settings: Dict[str, Any] = {}

# Dependency injection setup (will be properly configured in main.py)
async def get_conversation_service() -> ConversationService:
    """Get conversation service instance with dependencies"""
    # This will be properly implemented with dependency injection container
    from app.services.repositories.conversation_repository import MongoConversationRepository
    from app.services.ai_conversation_service import OpenAIConversationService
    from app.services.deepgram_service import DeepgramService
    
    db = await get_database()
    repository = MongoConversationRepository(db)
    ai_service = OpenAIConversationService()
    deepgram_service = DeepgramService()
    
    return ConversationService(repository, ai_service, deepgram_service)

# Admin/Configuration Endpoints
@router.post("/scenarios", response_model=dict)
async def create_conversation_scenario(
    request: CreateConversationScenarioRequest,
    created_by: str = "admin",  # TODO: Get from authentication
    service: ConversationService = Depends(get_conversation_service)
):
    """Create new conversation scenario"""
    try:
        scenario_id = await service.create_scenario(request, created_by)
        return {"scenario_id": scenario_id, "message": "Scenario created successfully"}
    except Exception as e:
        logger.error(f"Failed to create scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scenarios", response_model=ConversationListResponse)
async def get_conversation_scenarios(
    topic: Optional[ConversationTopic] = Query(None),
    level: Optional[ConversationLevel] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    service: ConversationService = Depends(get_conversation_service)
):
    """Get conversation scenarios with filtering and pagination"""
    try:
        skip = (page - 1) * page_size
        scenarios, total = await service.get_scenarios(
            topic=topic,
            level=level,
            skip=skip,
            limit=page_size
        )
        
        return ConversationListResponse(
            scenarios=scenarios,
            total=total,
            page=page,
            page_size=page_size
        )
    except Exception as e:
        logger.error(f"Failed to get scenarios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scenarios/{scenario_id}", response_model=ConversationScenario)
async def get_conversation_scenario(
    scenario_id: str,
    service: ConversationService = Depends(get_conversation_service)
):
    """Get specific conversation scenario"""
    try:
        scenario = await service.get_scenario(scenario_id)
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        return scenario
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/scenarios/{scenario_id}", response_model=dict)
async def update_conversation_scenario(
    scenario_id: str,
    request: UpdateConversationScenarioRequest,
    service: ConversationService = Depends(get_conversation_service)
):
    """Update conversation scenario"""
    try:
        success = await service.update_scenario(scenario_id, request)
        if not success:
            raise HTTPException(status_code=404, detail="Scenario not found")
        return {"message": "Scenario updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/scenarios/{scenario_id}", response_model=dict)
async def delete_conversation_scenario(
    scenario_id: str,
    service: ConversationService = Depends(get_conversation_service)
):
    """Delete (deactivate) conversation scenario"""
    try:
        success = await service.delete_scenario(scenario_id)
        if not success:
            raise HTTPException(status_code=404, detail="Scenario not found")
        return {"message": "Scenario deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=ConversationStatsResponse)
async def get_conversation_stats(
    service: ConversationService = Depends(get_conversation_service)
):
    """Get conversation statistics for admin dashboard"""
    try:
        # TODO: Implement comprehensive stats in service
        return ConversationStatsResponse(
            total_scenarios=0,
            scenarios_by_topic={},
            scenarios_by_level={},
            total_sessions=0,
            active_sessions=0
        )
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# User Practice Endpoints
@router.post("/sessions/start", response_model=dict)
async def start_conversation_session(
    request: StartConversationRequest,
    service: ConversationService = Depends(get_conversation_service)
):
    """Start new conversation practice session"""
    try:
        session_id = await service.start_conversation(request)
        return {"session_id": session_id, "message": "Conversation started successfully"}
    except Exception as e:
        logger.error(f"Failed to start conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/{session_id}/message", response_model=dict)
async def send_conversation_message(
    session_id: str,
    request: ConversationMessageRequest,
    background_tasks: BackgroundTasks,
    service: ConversationService = Depends(get_conversation_service)
):
    """Send message in conversation session"""
    try:
        ai_response = await service.process_user_message(
            session_id=session_id,
            message=request.message,
            audio_data=request.audio_data
        )
        
        return {
            "ai_response": ai_response.model_dump(),
            "message": "Message processed successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to process message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/{session_id}/interrupt", response_model=dict)
async def interrupt_ai_speaking(
    session_id: str,
    service: ConversationService = Depends(get_conversation_service)
):
    """Interrupt AI speaking"""
    try:
        success = await service.interrupt_ai_speaking(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"message": "AI interrupted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to interrupt AI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/{session_id}/end", response_model=dict)
async def end_conversation_session(
    session_id: str,
    service: ConversationService = Depends(get_conversation_service)
):
    """End conversation session"""
    try:
        success = await service.end_conversation(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"message": "Conversation ended successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to end conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}", response_model=UserConversationSession)
async def get_conversation_session(
    session_id: str,
    service: ConversationService = Depends(get_conversation_service)
):
    """Get conversation session details"""
    try:
        from app.services.repositories.conversation_repository import MongoConversationRepository
        db = await get_database()
        repository = MongoConversationRepository(db)
        
        session = await repository.get_session_by_id(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# User Progress Endpoints
@router.get("/users/{user_id}/progress", response_model=List[ConversationProgress])
async def get_user_progress(
    user_id: str,
    service: ConversationService = Depends(get_conversation_service)
):
    """Get user's conversation learning progress"""
    try:
        progress = await service.get_user_progress(user_id)
        return progress
    except Exception as e:
        logger.error(f"Failed to get user progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/sessions", response_model=List[UserConversationSession])
async def get_user_sessions(
    user_id: str,
    scenario_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    service: ConversationService = Depends(get_conversation_service)
):
    """Get user's conversation sessions"""
    try:
        skip = (page - 1) * page_size
        sessions = await service.get_user_sessions(
            user_id=user_id,
            scenario_id=scenario_id,
            skip=skip,
            limit=page_size
        )
        return sessions
    except Exception as e:
        logger.error(f"Failed to get user sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Voice and Audio Endpoints
@router.get("/voices", response_model=dict)
async def get_available_voices():
    """Get available voice options for conversations"""
    try:
        from app.services.deepgram_service import DeepgramService
        deepgram_service = DeepgramService()
        voices = await deepgram_service.get_supported_voices()
        return voices
    except Exception as e:
        logger.error(f"Failed to get voices: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice/optimize", response_model=dict)
async def optimize_voice_config(
    character_name: str,
    character_description: str,
    conversation_level: ConversationLevel
):
    """Get optimized voice configuration for conversation scenario"""
    try:
        from app.services.deepgram_service import DeepgramService
        deepgram_service = DeepgramService()
        
        voice_config = await deepgram_service.create_optimized_voice_config(
            character_name=character_name,
            character_description=character_description,
            conversation_level=conversation_level.value
        )
        return voice_config
    except Exception as e:
        logger.error(f"Failed to optimize voice config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Utility Endpoints
@router.post("/cleanup/audio", response_model=dict)
async def cleanup_temporary_audio(
    background_tasks: BackgroundTasks,
    max_age_hours: int = Query(24, ge=1, le=168)  # 1-168 hours (1 week max)
):
    """Clean up temporary audio files (admin only)"""
    try:
        from app.services.deepgram_service import DeepgramService
        
        def cleanup_task():
            import asyncio
            deepgram_service = DeepgramService()
            return asyncio.run(deepgram_service.cleanup_temp_audio(max_age_hours))
        
        background_tasks.add_task(cleanup_task)
        return {"message": f"Audio cleanup scheduled for files older than {max_age_hours} hours"}
    except Exception as e:
        logger.error(f"Failed to schedule cleanup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai-response", response_model=dict)
async def get_dynamic_ai_response(
    request: dict,
    service: ConversationService = Depends(get_conversation_service)
):
    """Get dynamic AI response when user deviates from script"""
    try:
        from app.services.ai_conversation_service import OpenAIConversationService
        
        ai_service = OpenAIConversationService()
        
        # Create session context from request
        session_id = f"temp_{id(request)}"
        scenario_context = {
            "character_name": request.get("character_name", "Assistant"),
            "character_description": request.get("character_description", "A helpful assistant"),
            "system_prompt": request.get("system_prompt", "You are a helpful assistant"),
            "topic": request.get("topic", "general"),
            "level": request.get("level", "intermediate"),
            "learning_objectives": request.get("learning_objectives", []),
            "key_phrases": request.get("key_phrases", [])
        }
        
        # Convert conversation history to expected format
        conversation_context = []
        for msg in request.get("conversation_history", []):
            role = "user" if msg["speaker"] == "user" else "assistant"
            conversation_context.append({
                "role": role,
                "content": msg["message"]
            })
        
        # Generate dynamic response
        response = await ai_service.generate_response(
            session_id=session_id,
            user_message=request["user_message"],
            conversation_context=conversation_context,
            scenario_context=scenario_context
        )
        
        # Clean up temporary session
        await ai_service.cleanup_conversation(session_id)
        
        return {"response": response}
        
    except Exception as e:
        logger.error(f"Failed to generate dynamic AI response: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health", response_model=dict)
async def conversation_health_check():
    """Health check for conversation service"""
    try:
        # Test database connection
        db = await get_database()
        await db.command("ping")
        
        return {
            "status": "healthy",
            "message": "Conversation service is operational",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

# Audio Generation Endpoints
@router.post("/generate-audio")
async def generate_audio(request: GenerateAudioRequest):
    """
    Generate audio files cho conversation lines
    
    Request body:
    {
        "conversation_id": "string",
        "lines": [
            {
                "_id": "string",
                "content": "string",
                "speaker": "A",
                "order": 1
            }
        ],
        "voice_settings": {
            "speakerA": {
                "provider": "openai",
                "voice": "alloy",
                "speed": 1.0
            }
        }
    }
    """
    try:
        audio_service = ConversationAudioService()
        
        result = await audio_service.generate_conversation_audio(
            conversation_id=request.conversation_id,
            lines=request.lines,
            voice_settings=request.voice_settings
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Audio generation validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Audio generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")

@router.get("/audio/{conversation_id}/{filename}")
async def serve_audio_file(conversation_id: str, filename: str):
    """
    Serve audio file cho frontend
    
    Args:
        conversation_id: ID của conversation
        filename: Tên file audio (line_{order}_{line_id}.mp3)
    """
    try:
        audio_service = ConversationAudioService()
        file_path = audio_service.get_audio_file_path(conversation_id, filename)
        
        if not file_path:
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        # Determine media type based on file extension
        media_type = "audio/mpeg" if filename.endswith('.mp3') else "audio/wav"
        
        return FileResponse(
            path=str(file_path),
            media_type=media_type,
            filename=filename,
            headers={
                "Cache-Control": "public, max-age=31536000"  # Cache 1 year
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to serve audio file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to serve audio file: {str(e)}")