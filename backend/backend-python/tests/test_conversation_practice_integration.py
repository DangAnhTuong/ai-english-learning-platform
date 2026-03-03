import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.models.conversation import (
    ConversationTopic,
    ConversationLevel,
    CreateConversationScenarioRequest,
    StartConversationRequest,
    ConversationMessageRequest
)

# Test client
client = TestClient(app)

class TestConversationPracticeIntegration:
    """Integration tests for the complete conversation practice system"""
    
    @pytest.fixture
    def sample_scenario_data(self):
        """Sample scenario for testing"""
        return {
            "title": "Restaurant Ordering",
            "topic": "restaurant",
            "level": "beginner",
            "description": "Practice ordering food at a restaurant",
            "ai_character_name": "Sarah",
            "ai_character_description": "A friendly restaurant server",
            "ai_system_prompt": "You are Sarah, a helpful server at a restaurant.",
            "learning_objectives": ["Learn food vocabulary", "Practice polite ordering"],
            "key_vocabulary": ["menu", "order", "dish", "bill"],
            "key_phrases": ["I'd like to order", "What do you recommend?"],
            "max_conversation_turns": 10,
            "enable_interruption": True,
            "voice_settings": {"model": "aura-asteria-en"},
            "tags": ["food", "service"]
        }
    
    @pytest.fixture
    def mock_database(self):
        """Mock database connection"""
        with patch("app.core.database.get_database") as mock_db:
            mock_db.return_value = Mock()
            yield mock_db
    
    @pytest.fixture
    def mock_ai_service(self):
        """Mock AI conversation service"""
        with patch("app.services.ai_conversation_service.OpenAIConversationService") as mock_ai:
            mock_ai_instance = Mock()
            mock_ai_instance.initialize_conversation = AsyncMock()
            mock_ai_instance.generate_response = AsyncMock(return_value="Hello! How can I help you today?")
            mock_ai_instance.handle_interruption = AsyncMock()
            mock_ai_instance.cleanup_conversation = AsyncMock()
            mock_ai.return_value = mock_ai_instance
            yield mock_ai_instance
    
    @pytest.fixture
    def mock_deepgram_service(self):
        """Mock Deepgram service"""
        with patch("app.services.deepgram_service.DeepgramService") as mock_deepgram:
            mock_deepgram_instance = Mock()
            mock_deepgram_instance.transcribe_audio = AsyncMock(return_value="Hello, I would like to order")
            mock_deepgram_instance.text_to_speech = AsyncMock(return_value="/tmp/audio_file.wav")
            mock_deepgram_instance.get_supported_voices = AsyncMock(return_value={"english": {}})
            mock_deepgram.return_value = mock_deepgram_instance
            yield mock_deepgram_instance
    
    def test_create_conversation_scenario(self, mock_database, sample_scenario_data):
        """Test creating a new conversation scenario"""
        with patch("app.services.repositories.conversation_repository.MongoConversationRepository") as mock_repo:
            mock_repo_instance = Mock()
            mock_repo_instance.create_scenario = AsyncMock(return_value="scenario_123")
            mock_repo.return_value = mock_repo_instance
            
            response = client.post("/conversation/scenarios", json=sample_scenario_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "scenario_id" in data
            assert data["message"] == "Scenario created successfully"
    
    def test_get_conversation_scenarios(self, mock_database):
        """Test retrieving conversation scenarios"""
        with patch("app.services.repositories.conversation_repository.MongoConversationRepository") as mock_repo:
            mock_scenario = Mock()
            mock_scenario.model_dump.return_value = {
                "id": "scenario_123",
                "title": "Restaurant Ordering",
                "topic": "restaurant",
                "level": "beginner"
            }
            
            mock_repo_instance = Mock()
            mock_repo_instance.get_scenarios = AsyncMock(return_value=[mock_scenario])
            mock_repo_instance.count_scenarios = AsyncMock(return_value=1)
            mock_repo.return_value = mock_repo_instance
            
            response = client.get("/conversation/scenarios")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 1
            assert len(data["scenarios"]) == 1
    
    def test_start_conversation_session(self, mock_database, mock_ai_service, mock_deepgram_service):
        """Test starting a new conversation session"""
        with patch("app.services.repositories.conversation_repository.MongoConversationRepository") as mock_repo:
            # Mock scenario retrieval
            mock_scenario = Mock()
            mock_scenario.id = "scenario_123"
            mock_scenario.sample_conversation = []
            mock_scenario.ai_character_name = "Sarah"
            
            mock_repo_instance = Mock()
            mock_repo_instance.get_scenario_by_id = AsyncMock(return_value=mock_scenario)
            mock_repo_instance.create_session = AsyncMock(return_value="session_456")
            mock_repo.return_value = mock_repo_instance
            
            request_data = {
                "scenario_id": "scenario_123",
                "user_id": "user_789"
            }
            
            response = client.post("/conversation/sessions/start", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["session_id"] == "session_456"
            assert data["message"] == "Conversation started successfully"
    
    def test_send_text_message(self, mock_database, mock_ai_service, mock_deepgram_service):
        """Test sending a text message in conversation"""
        with patch("app.services.repositories.conversation_repository.MongoConversationRepository") as mock_repo:
            # Mock session and scenario
            mock_session = Mock()
            mock_session.id = "session_456"
            mock_session.scenario_id = "scenario_123"
            mock_session.messages = []
            mock_session.current_turn = 0
            mock_session.user_speaking_time = 0.0
            mock_session.ai_speaking_time = 0.0
            mock_session.model_dump.return_value = {"id": "session_456"}
            
            mock_scenario = Mock()
            mock_scenario.ai_character_name = "Sarah"
            mock_scenario.voice_settings = {"model": "aura-asteria-en"}
            mock_scenario.max_conversation_turns = 10
            
            mock_repo_instance = Mock()
            mock_repo_instance.get_session_by_id = AsyncMock(return_value=mock_session)
            mock_repo_instance.get_scenario_by_id = AsyncMock(return_value=mock_scenario)
            mock_repo_instance.update_session = AsyncMock()
            mock_repo.return_value = mock_repo_instance
            
            request_data = {
                "message": "Hello, I would like to see the menu"
            }
            
            response = client.post("/conversation/sessions/session_456/message", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "ai_response" in data
            assert data["message"] == "Message processed successfully"
    
    def test_send_audio_message(self, mock_database, mock_ai_service, mock_deepgram_service):
        """Test sending an audio message in conversation"""
        import base64
        
        # Create mock audio data
        mock_audio_data = base64.b64encode(b"fake audio data").decode('utf-8')
        
        with patch("app.services.repositories.conversation_repository.MongoConversationRepository") as mock_repo:
            mock_session = Mock()
            mock_session.id = "session_456"
            mock_session.scenario_id = "scenario_123"
            mock_session.messages = []
            mock_session.current_turn = 0
            mock_session.user_speaking_time = 0.0
            mock_session.ai_speaking_time = 0.0
            mock_session.model_dump.return_value = {"id": "session_456"}
            
            mock_scenario = Mock()
            mock_scenario.ai_character_name = "Sarah"
            mock_scenario.voice_settings = {"model": "aura-asteria-en"}
            mock_scenario.max_conversation_turns = 10
            
            mock_repo_instance = Mock()
            mock_repo_instance.get_session_by_id = AsyncMock(return_value=mock_session)
            mock_repo_instance.get_scenario_by_id = AsyncMock(return_value=mock_scenario)
            mock_repo_instance.update_session = AsyncMock()
            mock_repo.return_value = mock_repo_instance
            
            request_data = {
                "message": "",
                "audio_data": mock_audio_data
            }
            
            response = client.post("/conversation/sessions/session_456/message", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "ai_response" in data
            
            # Verify transcription was called
            mock_deepgram_service.transcribe_audio.assert_called_once()
    
    def test_interrupt_ai_speaking(self, mock_database, mock_ai_service):
        """Test interrupting AI speaking"""
        with patch("app.services.repositories.conversation_repository.MongoConversationRepository") as mock_repo:
            mock_session = Mock()
            mock_session.interruption_count = 0
            mock_session.model_dump.return_value = {"id": "session_456"}
            
            mock_repo_instance = Mock()
            mock_repo_instance.get_session_by_id = AsyncMock(return_value=mock_session)
            mock_repo_instance.update_session = AsyncMock()
            mock_repo.return_value = mock_repo_instance
            
            response = client.post("/conversation/sessions/session_456/interrupt")
            
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "AI interrupted successfully"
            
            # Verify AI service was notified
            mock_ai_service.handle_interruption.assert_called_once_with("session_456")
    
    def test_end_conversation_session(self, mock_database, mock_ai_service):
        """Test ending a conversation session"""
        with patch("app.services.repositories.conversation_repository.MongoConversationRepository") as mock_repo:
            mock_session = Mock()
            mock_session.id = "session_456"
            mock_session.scenario_id = "scenario_123"
            mock_session.is_completed = False
            
            mock_scenario = Mock()
            mock_scenario.learning_objectives = []
            mock_scenario.key_vocabulary = []
            mock_scenario.key_phrases = []
            mock_scenario.max_conversation_turns = 10
            
            mock_repo_instance = Mock()
            mock_repo_instance.get_session_by_id = AsyncMock(return_value=mock_session)
            mock_repo_instance.get_scenario_by_id = AsyncMock(return_value=mock_scenario)
            mock_repo_instance.update_session = AsyncMock()
            mock_repo_instance.update_user_progress = AsyncMock()
            mock_repo_instance.get_user_progress = AsyncMock(return_value=[])
            mock_repo.return_value = mock_repo_instance
            
            response = client.post("/conversation/sessions/session_456/end")
            
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Conversation ended successfully"
            
            # Verify AI service cleanup
            mock_ai_service.cleanup_conversation.assert_called_once_with("session_456")
    
    def test_get_session_details(self, mock_database):
        """Test retrieving session details"""
        with patch("app.services.repositories.conversation_repository.MongoConversationRepository") as mock_repo:
            mock_session = Mock()
            mock_session.model_dump.return_value = {
                "id": "session_456",
                "user_id": "user_789",
                "scenario_id": "scenario_123",
                "messages": []
            }
            
            mock_repo_instance = Mock()
            mock_repo_instance.get_session_by_id = AsyncMock(return_value=mock_session)
            mock_repo.return_value = mock_repo_instance
            
            response = client.get("/conversation/sessions/session_456")
            
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == "session_456"
    
    def test_whisper_transcription_endpoint(self):
        """Test Whisper transcription endpoint"""
        with patch("app.services.realtime_service.realtime_service") as mock_service:
            mock_service.process_audio_transcription = AsyncMock(return_value={
                "transcript": "Hello, how are you?",
                "confidence": 0.95,
                "language": "en"
            })
            
            # Create mock audio file
            audio_content = b"fake audio content"
            
            response = client.post(
                "/api/v1/realtime/whisper",
                files={"audio": ("test.webm", audio_content, "audio/webm")}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["transcript"] == "Hello, how are you?"
            assert data["confidence"] == 0.95
    
    def test_voice_configuration_optimization(self, mock_database):
        """Test voice configuration optimization"""
        response = client.post(
            "/conversation/voice/optimize",
            params={
                "character_name": "Sarah",
                "character_description": "A friendly restaurant server",
                "conversation_level": "beginner"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "model" in data
        assert "encoding" in data
        assert "sample_rate" in data
    
    def test_conversation_health_check(self, mock_database):
        """Test conversation service health check"""
        response = client.get("/conversation/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["message"] == "Conversation service is operational"
    
    def test_error_handling_invalid_scenario(self, mock_database):
        """Test error handling for invalid scenario ID"""
        with patch("app.services.repositories.conversation_repository.MongoConversationRepository") as mock_repo:
            mock_repo_instance = Mock()
            mock_repo_instance.get_scenario_by_id = AsyncMock(return_value=None)
            mock_repo.return_value = mock_repo_instance
            
            response = client.get("/conversation/scenarios/invalid_id")
            
            assert response.status_code == 404
            data = response.json()
            assert data["detail"] == "Scenario not found"
    
    def test_error_handling_invalid_session(self, mock_database):
        """Test error handling for invalid session ID"""
        with patch("app.services.repositories.conversation_repository.MongoConversationRepository") as mock_repo:
            mock_repo_instance = Mock()
            mock_repo_instance.get_session_by_id = AsyncMock(return_value=None)
            mock_repo.return_value = mock_repo_instance
            
            response = client.get("/conversation/sessions/invalid_session")
            
            assert response.status_code == 404
            data = response.json()
            assert data["detail"] == "Session not found"
    
    @pytest.mark.asyncio
    async def test_conversation_flow_integration(self, mock_database, mock_ai_service, mock_deepgram_service):
        """Test complete conversation flow from start to finish"""
        with patch("app.services.repositories.conversation_repository.MongoConversationRepository") as mock_repo:
            # Setup mocks
            mock_scenario = Mock()
            mock_scenario.id = "scenario_123"
            mock_scenario.sample_conversation = []
            mock_scenario.ai_character_name = "Sarah"
            mock_scenario.voice_settings = {"model": "aura-asteria-en"}
            mock_scenario.max_conversation_turns = 6
            mock_scenario.learning_objectives = ["Learn ordering"]
            mock_scenario.key_vocabulary = ["menu", "order"]
            mock_scenario.key_phrases = ["I'd like to order"]
            
            mock_session = Mock()
            mock_session.id = "session_456"
            mock_session.scenario_id = "scenario_123"
            mock_session.messages = []
            mock_session.current_turn = 0
            mock_session.user_speaking_time = 0.0
            mock_session.ai_speaking_time = 0.0
            mock_session.interruption_count = 0
            mock_session.is_completed = False
            mock_session.model_dump.return_value = {"id": "session_456"}
            
            mock_repo_instance = Mock()
            mock_repo_instance.get_scenario_by_id = AsyncMock(return_value=mock_scenario)
            mock_repo_instance.create_session = AsyncMock(return_value="session_456")
            mock_repo_instance.get_session_by_id = AsyncMock(return_value=mock_session)
            mock_repo_instance.update_session = AsyncMock()
            mock_repo_instance.update_user_progress = AsyncMock()
            mock_repo_instance.get_user_progress = AsyncMock(return_value=[])
            mock_repo.return_value = mock_repo_instance
            
            # 1. Start conversation
            start_response = client.post("/conversation/sessions/start", json={
                "scenario_id": "scenario_123",
                "user_id": "user_789"
            })
            assert start_response.status_code == 200
            
            # 2. Send multiple messages
            for i in range(3):
                message_response = client.post(f"/conversation/sessions/session_456/message", json={
                    "message": f"This is message {i+1}. I'd like to order from the menu."
                })
                assert message_response.status_code == 200
            
            # 3. End conversation
            end_response = client.post("/conversation/sessions/session_456/end")
            assert end_response.status_code == 200
            
            # Verify all services were called appropriately
            assert mock_ai_service.initialize_conversation.called
            assert mock_ai_service.generate_response.call_count == 3
            assert mock_ai_service.cleanup_conversation.called

if __name__ == "__main__":
    pytest.main([__file__, "-v"])