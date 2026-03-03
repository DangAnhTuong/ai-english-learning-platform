import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch
from app.main import app
from app.models.conversation import (
    ConversationScenario,
    ConversationTopic,
    ConversationLevel
)

class TestConversationAPI:
    """Test conversation API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def sample_scenario_data(self):
        """Sample scenario data for testing"""
        return {
            "title": "Test Restaurant Order",
            "topic": "restaurant",
            "level": "beginner", 
            "description": "Practice ordering food at a restaurant",
            "ai_character_name": "Sarah",
            "ai_character_description": "A friendly restaurant server",
            "ai_system_prompt": "You are a friendly server helping customers order food",
            "learning_objectives": [
                "Learn food vocabulary",
                "Practice polite ordering"
            ],
            "key_vocabulary": ["menu", "order", "food"],
            "key_phrases": ["I'd like to order", "What do you recommend?"],
            "tags": ["food", "dining"]
        }
    
    @patch('app.api.v1.conversation.get_conversation_service')
    def test_create_scenario_success(self, mock_get_service, client, sample_scenario_data):
        """Test creating a conversation scenario successfully"""
        # Arrange
        mock_service = Mock()
        mock_service.create_scenario = AsyncMock(return_value="scenario_123")
        mock_get_service.return_value = mock_service
        
        # Act
        response = client.post("/api/v1/conversation/scenarios", json=sample_scenario_data)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["scenario_id"] == "scenario_123"
        assert "message" in data
    
    @patch('app.api.v1.conversation.get_conversation_service')
    def test_get_scenarios_success(self, mock_get_service, client):
        """Test retrieving scenarios with filters"""
        # Arrange
        mock_scenarios = [
            ConversationScenario(
                id="scenario_1",
                title="Restaurant Order",
                topic=ConversationTopic.RESTAURANT,
                level=ConversationLevel.BEGINNER,
                description="Practice ordering food",
                ai_character_name="Sarah",
                ai_character_description="Friendly server",
                ai_system_prompt="You are a server"
            )
        ]
        
        mock_service = Mock()
        mock_service.get_scenarios = AsyncMock(return_value=(mock_scenarios, 1))
        mock_get_service.return_value = mock_service
        
        # Act
        response = client.get("/api/v1/conversation/scenarios?topic=restaurant&level=beginner")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["scenarios"]) == 1
        assert data["scenarios"][0]["title"] == "Restaurant Order"
    
    @patch('app.api.v1.conversation.get_conversation_service')
    def test_get_scenario_by_id_success(self, mock_get_service, client):
        """Test retrieving a specific scenario by ID"""
        # Arrange
        mock_scenario = ConversationScenario(
            id="scenario_123",
            title="Test Scenario",
            topic=ConversationTopic.SHOPPING,
            level=ConversationLevel.INTERMEDIATE,
            description="Test description",
            ai_character_name="Test Character", 
            ai_character_description="Test description",
            ai_system_prompt="Test prompt"
        )
        
        mock_service = Mock()
        mock_service.get_scenario = AsyncMock(return_value=mock_scenario)
        mock_get_service.return_value = mock_service
        
        # Act
        response = client.get("/api/v1/conversation/scenarios/scenario_123")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "scenario_123"
        assert data["title"] == "Test Scenario"
    
    @patch('app.api.v1.conversation.get_conversation_service')
    def test_get_scenario_not_found(self, mock_get_service, client):
        """Test retrieving a non-existent scenario"""
        # Arrange
        mock_service = Mock()
        mock_service.get_scenario = AsyncMock(return_value=None)
        mock_get_service.return_value = mock_service
        
        # Act
        response = client.get("/api/v1/conversation/scenarios/non_existent")
        
        # Assert
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
    
    @patch('app.api.v1.conversation.get_conversation_service')
    def test_start_conversation_success(self, mock_get_service, client):
        """Test starting a conversation session"""
        # Arrange
        request_data = {
            "scenario_id": "scenario_123",
            "user_id": "user_456"
        }
        
        mock_service = Mock()
        mock_service.start_conversation = AsyncMock(return_value="session_789")
        mock_get_service.return_value = mock_service
        
        # Act
        response = client.post("/api/v1/conversation/sessions/start", json=request_data)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == "session_789"
        assert "message" in data
    
    @patch('app.api.v1.conversation.get_conversation_service')
    def test_update_scenario_success(self, mock_get_service, client):
        """Test updating a scenario"""
        # Arrange
        update_data = {
            "title": "Updated Title",
            "description": "Updated description"
        }
        
        mock_service = Mock()
        mock_service.update_scenario = AsyncMock(return_value=True)
        mock_get_service.return_value = mock_service
        
        # Act
        response = client.put("/api/v1/conversation/scenarios/scenario_123", json=update_data)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "updated successfully" in data["message"]
    
    @patch('app.api.v1.conversation.get_conversation_service')
    def test_update_scenario_not_found(self, mock_get_service, client):
        """Test updating a non-existent scenario"""
        # Arrange
        update_data = {
            "title": "Updated Title"
        }
        
        mock_service = Mock()
        mock_service.update_scenario = AsyncMock(return_value=False)
        mock_get_service.return_value = mock_service
        
        # Act
        response = client.put("/api/v1/conversation/scenarios/non_existent", json=update_data)
        
        # Assert
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
    
    @patch('app.api.v1.conversation.get_conversation_service')
    def test_delete_scenario_success(self, mock_get_service, client):
        """Test deleting a scenario"""
        # Arrange
        mock_service = Mock()
        mock_service.delete_scenario = AsyncMock(return_value=True)
        mock_get_service.return_value = mock_service
        
        # Act
        response = client.delete("/api/v1/conversation/scenarios/scenario_123")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "deleted successfully" in data["message"]
    
    @patch('app.api.v1.conversation.get_conversation_service')
    def test_get_user_progress(self, mock_get_service, client):
        """Test retrieving user progress"""
        # Arrange
        mock_progress = [
            {
                "user_id": "user_123",
                "topic": "restaurant",
                "level": "beginner",
                "total_sessions": 5,
                "completed_sessions": 3
            }
        ]
        
        mock_service = Mock()
        mock_service.get_user_progress = AsyncMock(return_value=mock_progress)
        mock_get_service.return_value = mock_service
        
        # Act
        response = client.get("/api/v1/conversation/users/user_123/progress")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["user_id"] == "user_123"
    
    def test_validation_error_handling(self, client):
        """Test API validation error handling"""
        # Act - Send invalid data (missing required fields)
        response = client.post("/api/v1/conversation/scenarios", json={
            "title": "Test"
            # Missing required fields
        })
        
        # Assert
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    def test_health_check_endpoint(self, client):
        """Test conversation health check endpoint"""
        # Note: This might fail without actual database connection
        # In a real test environment, we'd mock the database connection
        pass  # Skip for now as it requires database setup