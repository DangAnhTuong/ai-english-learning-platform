import pytest
from unittest.mock import Mock, AsyncMock
from app.services.conversation_service import ConversationService
from app.models.conversation import (
    ConversationScenario,
    ConversationTopic,
    ConversationLevel,
    CreateConversationScenarioRequest,
    StartConversationRequest
)

class TestConversationService:
    """Test conversation service functionality"""
    
    @pytest.fixture
    def mock_repository(self):
        """Create mock repository"""
        return Mock()
    
    @pytest.fixture  
    def mock_ai_service(self):
        """Create mock AI service"""
        return Mock()
    
    @pytest.fixture
    def mock_deepgram_service(self):
        """Create mock Deepgram service"""
        return Mock()
    
    @pytest.fixture
    def conversation_service(self, mock_repository, mock_ai_service, mock_deepgram_service):
        """Create conversation service with mocked dependencies"""
        return ConversationService(
            repository=mock_repository,
            ai_service=mock_ai_service,
            deepgram_service=mock_deepgram_service
        )
    
    @pytest.fixture
    def sample_scenario(self):
        """Create sample conversation scenario"""
        return ConversationScenario(
            id="scenario_123",
            title="Restaurant Order",
            topic=ConversationTopic.RESTAURANT,
            level=ConversationLevel.BEGINNER,
            description="Practice ordering food",
            ai_character_name="Sarah",
            ai_character_description="Friendly server",
            ai_system_prompt="You are a server"
        )
    
    @pytest.mark.asyncio
    async def test_create_scenario(self, conversation_service, mock_repository):
        """Test creating a new conversation scenario"""
        # Arrange
        request = CreateConversationScenarioRequest(
            title="Test Scenario",
            topic=ConversationTopic.SHOPPING,
            level=ConversationLevel.INTERMEDIATE,
            description="Test description",
            ai_character_name="Test Character",
            ai_character_description="Test character description",
            ai_system_prompt="Test system prompt"
        )
        
        mock_repository.create_scenario = AsyncMock(return_value="scenario_456")
        
        # Act
        scenario_id = await conversation_service.create_scenario(request, "admin")
        
        # Assert
        assert scenario_id == "scenario_456"
        mock_repository.create_scenario.assert_called_once()
        
        # Check the scenario object passed to repository
        call_args = mock_repository.create_scenario.call_args[0]
        scenario = call_args[0]
        
        assert scenario.title == "Test Scenario"
        assert scenario.topic == ConversationTopic.SHOPPING
        assert scenario.created_by == "admin"
    
    @pytest.mark.asyncio
    async def test_get_scenario(self, conversation_service, mock_repository, sample_scenario):
        """Test retrieving a conversation scenario"""
        # Arrange
        mock_repository.get_scenario_by_id = AsyncMock(return_value=sample_scenario)
        
        # Act
        result = await conversation_service.get_scenario("scenario_123")
        
        # Assert
        assert result == sample_scenario
        mock_repository.get_scenario_by_id.assert_called_once_with("scenario_123")
    
    @pytest.mark.asyncio
    async def test_get_scenario_not_found(self, conversation_service, mock_repository):
        """Test retrieving a non-existent scenario"""
        # Arrange
        mock_repository.get_scenario_by_id = AsyncMock(return_value=None)
        
        # Act
        result = await conversation_service.get_scenario("non_existent")
        
        # Assert
        assert result is None
        mock_repository.get_scenario_by_id.assert_called_once_with("non_existent")
    
    @pytest.mark.asyncio
    async def test_get_scenarios_with_pagination(self, conversation_service, mock_repository):
        """Test getting scenarios with pagination"""
        # Arrange
        mock_scenarios = [
            ConversationScenario(
                title="Scenario 1",
                topic=ConversationTopic.RESTAURANT,
                level=ConversationLevel.BEGINNER,
                description="Description 1",
                ai_character_name="Character 1",
                ai_character_description="Description 1",
                ai_system_prompt="Prompt 1"
            ),
            ConversationScenario(
                title="Scenario 2", 
                topic=ConversationTopic.SHOPPING,
                level=ConversationLevel.INTERMEDIATE,
                description="Description 2",
                ai_character_name="Character 2",
                ai_character_description="Description 2",
                ai_system_prompt="Prompt 2"
            )
        ]
        
        mock_repository.get_scenarios = AsyncMock(return_value=mock_scenarios)
        mock_repository.count_scenarios = AsyncMock(return_value=2)
        
        # Act
        scenarios, total = await conversation_service.get_scenarios(
            topic=ConversationTopic.RESTAURANT,
            skip=0,
            limit=10
        )
        
        # Assert
        assert len(scenarios) == 2
        assert total == 2
        mock_repository.get_scenarios.assert_called_once_with(
            topic=ConversationTopic.RESTAURANT,
            level=None,
            skip=0,
            limit=10
        )
        mock_repository.count_scenarios.assert_called_once_with(
            topic=ConversationTopic.RESTAURANT,
            level=None
        )
    
    @pytest.mark.asyncio
    async def test_start_conversation_success(
        self, 
        conversation_service, 
        mock_repository, 
        mock_ai_service,
        sample_scenario
    ):
        """Test starting a new conversation successfully"""
        # Arrange
        request = StartConversationRequest(
            scenario_id="scenario_123",
            user_id="user_456"
        )
        
        mock_repository.get_scenario_by_id = AsyncMock(return_value=sample_scenario)
        mock_repository.create_session = AsyncMock(return_value="session_789")
        mock_ai_service.initialize_conversation = AsyncMock()
        
        # Act
        session_id = await conversation_service.start_conversation(request)
        
        # Assert
        assert session_id == "session_789"
        mock_repository.get_scenario_by_id.assert_called_once_with("scenario_123")
        mock_repository.create_session.assert_called_once()
        mock_ai_service.initialize_conversation.assert_called_once()
        
        # Check session creation arguments
        call_args = mock_repository.create_session.call_args[0]
        session = call_args[0]
        
        assert session.user_id == "user_456"
        assert session.scenario_id == "scenario_123"
    
    @pytest.mark.asyncio
    async def test_start_conversation_scenario_not_found(
        self,
        conversation_service,
        mock_repository
    ):
        """Test starting conversation with non-existent scenario"""
        # Arrange
        request = StartConversationRequest(
            scenario_id="non_existent",
            user_id="user_456"
        )
        
        mock_repository.get_scenario_by_id = AsyncMock(return_value=None)
        
        # Act & Assert
        with pytest.raises(ValueError, match="Scenario not found"):
            await conversation_service.start_conversation(request)
    
    @pytest.mark.asyncio
    async def test_delete_scenario(self, conversation_service, mock_repository):
        """Test deleting (deactivating) a scenario"""
        # Arrange
        mock_repository.delete_scenario = AsyncMock(return_value=True)
        
        # Act
        result = await conversation_service.delete_scenario("scenario_123")
        
        # Assert
        assert result is True
        mock_repository.delete_scenario.assert_called_once_with("scenario_123")
    
    @pytest.mark.asyncio
    async def test_get_user_progress(self, conversation_service, mock_repository):
        """Test getting user progress"""
        # Arrange
        mock_progress = [
            Mock(user_id="user_123", topic=ConversationTopic.RESTAURANT),
            Mock(user_id="user_123", topic=ConversationTopic.SHOPPING)
        ]
        
        mock_repository.get_user_progress = AsyncMock(return_value=mock_progress)
        
        # Act
        result = await conversation_service.get_user_progress("user_123")
        
        # Assert
        assert len(result) == 2
        mock_repository.get_user_progress.assert_called_once_with("user_123")
    
    @pytest.mark.asyncio
    async def test_get_user_sessions(self, conversation_service, mock_repository):
        """Test getting user sessions"""
        # Arrange
        mock_sessions = [
            Mock(user_id="user_123", scenario_id="scenario_1"),
            Mock(user_id="user_123", scenario_id="scenario_2")
        ]
        
        mock_repository.get_user_sessions = AsyncMock(return_value=mock_sessions)
        
        # Act
        result = await conversation_service.get_user_sessions(
            user_id="user_123",
            skip=0,
            limit=10
        )
        
        # Assert
        assert len(result) == 2
        mock_repository.get_user_sessions.assert_called_once_with(
            user_id="user_123",
            scenario_id=None,
            skip=0,
            limit=10
        )