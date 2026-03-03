import logging
import uuid
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import asyncio

from app.models.conversation import (
    ConversationScenario,
    UserConversationSession,
    ConversationProgress,
    ConversationMessage,
    ConversationTopic,
    ConversationLevel,
    CreateConversationScenarioRequest,
    UpdateConversationScenarioRequest,
    StartConversationRequest,
    ConversationMessageRequest
)
from app.services.repositories.conversation_repository import IConversationRepository
from app.services.ai_conversation_service import IAIConversationService
from app.services.deepgram_service import IDeepgramService

logger = logging.getLogger(__name__)

class ConversationService:
    """Main conversation service following SOLID principles"""
    
    def __init__(
        self,
        repository: IConversationRepository,
        ai_service: IAIConversationService,
        deepgram_service: IDeepgramService
    ):
        self.repository = repository
        self.ai_service = ai_service
        self.deepgram_service = deepgram_service
        self.active_sessions: Dict[str, UserConversationSession] = {}
    
    # Admin/Configuration methods
    async def create_scenario(self, request: CreateConversationScenarioRequest, created_by: str) -> str:
        """Create new conversation scenario"""
        scenario = ConversationScenario(
            title=request.title,
            topic=request.topic,
            level=request.level,
            description=request.description,
            ai_character_name=request.ai_character_name,
            ai_character_description=request.ai_character_description,
            ai_system_prompt=request.ai_system_prompt,
            sample_conversation=request.sample_conversation,
            learning_objectives=request.learning_objectives,
            key_vocabulary=request.key_vocabulary,
            key_phrases=request.key_phrases,
            max_conversation_turns=request.max_conversation_turns,
            enable_interruption=request.enable_interruption,
            voice_settings=request.voice_settings,
            tags=request.tags,
            created_by=created_by
        )
        
        scenario_id = await self.repository.create_scenario(scenario)
        logger.info(f"Created conversation scenario: {scenario_id}")
        return scenario_id
    
    async def get_scenario(self, scenario_id: str) -> Optional[ConversationScenario]:
        """Get scenario by ID"""
        return await self.repository.get_scenario_by_id(scenario_id)
    
    async def get_scenarios(
        self,
        topic: Optional[ConversationTopic] = None,
        level: Optional[ConversationLevel] = None,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[ConversationScenario], int]:
        """Get scenarios with pagination"""
        scenarios = await self.repository.get_scenarios(
            topic=topic,
            level=level,
            skip=skip,
            limit=limit
        )
        total = await self.repository.count_scenarios(topic=topic, level=level)
        return scenarios, total
    
    async def update_scenario(
        self,
        scenario_id: str,
        request: UpdateConversationScenarioRequest
    ) -> bool:
        """Update conversation scenario"""
        updates = {}
        
        for field, value in request.model_dump(exclude_none=True).items():
            if value is not None:
                updates[field] = value
        
        if updates:
            return await self.repository.update_scenario(scenario_id, updates)
        return True
    
    async def delete_scenario(self, scenario_id: str) -> bool:
        """Delete (deactivate) scenario"""
        return await self.repository.delete_scenario(scenario_id)
    
    # User conversation methods
    async def start_conversation(self, request: StartConversationRequest) -> str:
        """Start new conversation session"""
        # Get scenario
        scenario = await self.repository.get_scenario_by_id(request.scenario_id)
        if not scenario:
            raise ValueError("Scenario not found")
        
        # Create session
        session = UserConversationSession(
            user_id=request.user_id,
            scenario_id=request.scenario_id
        )
        
        # Initialize with sample conversation if available
        if scenario.sample_conversation:
            session.messages = [msg for msg in scenario.sample_conversation]
            session.current_turn = len(scenario.sample_conversation)
        
        session_id = await self.repository.create_session(session)
        session.id = session_id
        
        # Store in active sessions for real-time processing
        self.active_sessions[session_id] = session
        
        # Initialize AI service with scenario context
        await self.ai_service.initialize_conversation(
            session_id=session_id,
            scenario=scenario,
            messages=session.messages
        )
        
        logger.info(f"Started conversation session: {session_id}")
        return session_id
    
    async def process_user_message(
        self,
        session_id: str,
        message: str,
        audio_data: Optional[str] = None
    ) -> ConversationMessage:
        """Process user message (text or audio) and generate AI response"""
        # Get session
        session = await self._get_active_session(session_id)
        if not session:
            raise ValueError("Session not found or expired")
        
        # Get scenario for context
        scenario = await self.repository.get_scenario_by_id(session.scenario_id)
        if not scenario:
            raise ValueError("Scenario not found")
        
        # Process audio if provided
        final_message = message
        if audio_data and not message.strip():
            try:
                # Convert base64 audio to bytes
                import base64
                audio_bytes = base64.b64decode(audio_data)
                
                # Use Whisper for transcription
                transcription_result = await self.deepgram_service.transcribe_audio(audio_bytes)
                if transcription_result and transcription_result.strip():
                    final_message = transcription_result
                else:
                    # Fallback response for unclear audio
                    final_message = "[Audio unclear - please try again]"
                    
            except Exception as e:
                logger.error(f"Audio transcription failed: {e}")
                final_message = "[Audio processing error - please try text instead]"
        
        # Create user message
        user_message = ConversationMessage(
            id=str(uuid.uuid4()),
            speaker="user",
            message=final_message,
            audio_url=None,  # TODO: Store audio if needed
            order=len(session.messages) + 1
        )
        
        # Add to session
        session.messages.append(user_message)
        session.current_turn += 1
        
        # Track speaking time if audio was used
        if audio_data:
            session.user_speaking_time += 3.0  # Approximate duration
        
        # Generate AI response based on conversation context
        conversation_history = [
            {"role": "assistant" if msg.speaker == scenario.ai_character_name else "user", 
             "content": msg.message}
            for msg in session.messages[-8:]  # Last 8 messages for context
        ]
        
        ai_response_text = await self.ai_service.generate_response(
            session_id=session_id,
            user_message=final_message,
            conversation_context=conversation_history,
            scenario_context={
                "character_name": scenario.ai_character_name,
                "character_description": scenario.ai_character_description,
                "system_prompt": scenario.ai_system_prompt,
                "topic": scenario.topic.value,
                "level": scenario.level.value,
                "key_phrases": scenario.key_phrases[:5],  # Provide key phrases for context
                "learning_objectives": scenario.learning_objectives[:3]  # Provide objectives
            }
        )
        
        # Create AI message
        ai_message = ConversationMessage(
            id=str(uuid.uuid4()),
            speaker=scenario.ai_character_name,
            message=ai_response_text,
            order=len(session.messages) + 1
        )
        
        # Generate TTS for AI response
        try:
            audio_url = await self.deepgram_service.text_to_speech(
                text=ai_response_text,
                voice_settings=scenario.voice_settings,
                character_name=scenario.ai_character_name
            )
            ai_message.audio_url = audio_url
            session.ai_speaking_time += 4.0  # Approximate TTS duration
        except Exception as e:
            logger.warning(f"TTS generation failed: {e}")
        
        # Add AI response to session
        session.messages.append(ai_message)
        session.current_turn += 1
        
        # Update session in database
        await self._update_session_in_db(session)
        
        # Check if conversation should end
        if session.current_turn >= scenario.max_conversation_turns * 2:  # Account for both user and AI messages
            await self._complete_conversation(session, scenario)
        
        return ai_message
    
    async def interrupt_ai_speaking(self, session_id: str) -> bool:
        """Handle user interruption of AI speaking"""
        session = await self._get_active_session(session_id)
        if not session:
            return False
        
        session.interruption_count += 1
        await self._update_session_in_db(session)
        
        # Notify AI service about interruption
        await self.ai_service.handle_interruption(session_id)
        
        logger.info(f"AI interrupted in session: {session_id}")
        return True
    
    async def end_conversation(self, session_id: str) -> bool:
        """End conversation session"""
        session = await self._get_active_session(session_id)
        if not session:
            return False
        
        scenario = await self.repository.get_scenario_by_id(session.scenario_id)
        if scenario:
            await self._complete_conversation(session, scenario)
        
        # Remove from active sessions
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        
        # Cleanup AI service
        await self.ai_service.cleanup_conversation(session_id)
        
        logger.info(f"Ended conversation session: {session_id}")
        return True
    
    async def get_user_progress(self, user_id: str) -> List[ConversationProgress]:
        """Get user's conversation progress"""
        return await self.repository.get_user_progress(user_id)
    
    async def get_user_sessions(
        self,
        user_id: str,
        scenario_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
    ) -> List[UserConversationSession]:
        """Get user's conversation sessions"""
        return await self.repository.get_user_sessions(
            user_id=user_id,
            scenario_id=scenario_id,
            skip=skip,
            limit=limit
        )
    
    # Private helper methods
    async def _get_active_session(self, session_id: str) -> Optional[UserConversationSession]:
        """Get active session from cache or database"""
        if session_id in self.active_sessions:
            return self.active_sessions[session_id]
        
        # Try to load from database
        session = await self.repository.get_session_by_id(session_id)
        if session and not session.is_completed:
            self.active_sessions[session_id] = session
            return session
        
        return None
    
    async def _update_session_in_db(self, session: UserConversationSession) -> None:
        """Update session in database"""
        if session.id:
            await self.repository.update_session(
                session.id,
                session.model_dump(exclude={'id'})
            )
    
    async def _complete_conversation(
        self,
        session: UserConversationSession,
        scenario: ConversationScenario
    ) -> None:
        """Complete conversation and update progress"""
        session.session_end = datetime.utcnow()
        session.is_completed = True
        
        # Calculate scores and analytics
        await self._calculate_session_scores(session, scenario)
        
        # Update user progress
        await self._update_user_progress(session, scenario)
        
        # Update session in database
        await self._update_session_in_db(session)
        
        logger.info(f"Completed conversation session: {session.id}")
    
    async def _calculate_session_scores(
        self,
        session: UserConversationSession,
        scenario: ConversationScenario
    ) -> None:
        """Calculate conversation scores and analytics"""
        # TODO: Implement sophisticated scoring algorithms
        # For now, basic scoring based on conversation completion
        
        user_messages = [msg for msg in session.messages if msg.speaker == "user"]
        
        # Completion score based on turns and objectives met
        completion_ratio = min(session.current_turn / scenario.max_conversation_turns, 1.0)
        session.completion_score = completion_ratio * 100
        
        # Basic fluency score (can be enhanced with real analysis)
        session.fluency_score = max(50, completion_ratio * 100 - session.interruption_count * 5)
        
        # Vocabulary analysis
        user_text = " ".join([msg.message.lower() for msg in user_messages])
        session.vocabulary_used = [
            vocab for vocab in scenario.key_vocabulary
            if vocab.lower() in user_text
        ]
        
        session.phrases_used = [
            phrase for phrase in scenario.key_phrases
            if phrase.lower() in user_text
        ]
        
        # Accuracy score based on vocabulary and phrase usage
        vocab_score = len(session.vocabulary_used) / max(len(scenario.key_vocabulary), 1) * 50
        phrase_score = len(session.phrases_used) / max(len(scenario.key_phrases), 1) * 50
        session.accuracy_score = vocab_score + phrase_score
    
    async def _update_user_progress(
        self,
        session: UserConversationSession,
        scenario: ConversationScenario
    ) -> None:
        """Update user's overall progress"""
        # Get existing progress
        progress_list = await self.repository.get_user_progress(session.user_id)
        
        # Find or create progress for this topic/level
        progress = None
        for p in progress_list:
            if p.topic == scenario.topic and p.level == scenario.level:
                progress = p
                break
        
        if not progress:
            progress = ConversationProgress(
                user_id=session.user_id,
                topic=scenario.topic,
                level=scenario.level
            )
        
        # Update statistics
        progress.total_sessions += 1
        if session.is_completed:
            progress.completed_sessions += 1
        
        progress.total_speaking_time += session.user_speaking_time
        progress.last_session_date = datetime.utcnow()
        
        # Update average scores
        if session.fluency_score:
            if progress.average_fluency_score:
                progress.average_fluency_score = (
                    progress.average_fluency_score * (progress.completed_sessions - 1) + 
                    session.fluency_score
                ) / progress.completed_sessions
            else:
                progress.average_fluency_score = session.fluency_score
        
        if session.accuracy_score:
            if progress.average_accuracy_score:
                progress.average_accuracy_score = (
                    progress.average_accuracy_score * (progress.completed_sessions - 1) + 
                    session.accuracy_score
                ) / progress.completed_sessions
            else:
                progress.average_accuracy_score = session.accuracy_score
        
        # Update mastered vocabulary and phrases
        progress.mastered_vocabulary.extend(session.vocabulary_used)
        progress.mastered_vocabulary = list(set(progress.mastered_vocabulary))
        
        progress.mastered_phrases.extend(session.phrases_used)
        progress.mastered_phrases = list(set(progress.mastered_phrases))
        
        # Save progress
        await self.repository.update_user_progress(progress)