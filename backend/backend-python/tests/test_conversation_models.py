import pytest
from datetime import datetime
from app.models.conversation import (
    ConversationScenario,
    ConversationMessage,
    UserConversationSession,
    ConversationProgress,
    ConversationTopic,
    ConversationLevel,
    CreateConversationScenarioRequest
)

class TestConversationModels:
    """Test conversation data models"""
    
    def test_conversation_message_creation(self):
        """Test creating a conversation message"""
        message = ConversationMessage(
            id="msg_1",
            speaker="user",
            message="Hello, how are you?",
            order=1
        )
        
        assert message.id == "msg_1"
        assert message.speaker == "user"
        assert message.message == "Hello, how are you?"
        assert message.order == 1
        assert message.audio_url is None
        assert message.metadata == {}
    
    def test_conversation_scenario_creation(self):
        """Test creating a conversation scenario"""
        scenario = ConversationScenario(
            title="Restaurant Order",
            topic=ConversationTopic.RESTAURANT,
            level=ConversationLevel.BEGINNER,
            description="Practice ordering food",
            ai_character_name="Sarah",
            ai_character_description="Friendly server",
            ai_system_prompt="You are a server",
            learning_objectives=["Learn food vocabulary"],
            key_vocabulary=["menu", "order"],
            key_phrases=["I'd like to order"]
        )
        
        assert scenario.title == "Restaurant Order"
        assert scenario.topic == ConversationTopic.RESTAURANT
        assert scenario.level == ConversationLevel.BEGINNER
        assert scenario.ai_character_name == "Sarah"
        assert len(scenario.learning_objectives) == 1
        assert "menu" in scenario.key_vocabulary
        assert scenario.max_conversation_turns == 10  # default value
        assert scenario.enable_interruption is True  # default value
        assert scenario.is_active is True  # default value
    
    def test_user_conversation_session_creation(self):
        """Test creating a user conversation session"""
        session = UserConversationSession(
            user_id="user_123",
            scenario_id="scenario_456"
        )
        
        assert session.user_id == "user_123"
        assert session.scenario_id == "scenario_456"
        assert session.current_turn == 0
        assert session.messages == []
        assert session.user_speaking_time == 0.0
        assert session.ai_speaking_time == 0.0
        assert session.is_completed is False
        assert session.completion_score is None
    
    def test_conversation_progress_creation(self):
        """Test creating conversation progress tracking"""
        progress = ConversationProgress(
            user_id="user_123",
            topic=ConversationTopic.BUSINESS_MEETING,
            level=ConversationLevel.ADVANCED
        )
        
        assert progress.user_id == "user_123"
        assert progress.topic == ConversationTopic.BUSINESS_MEETING
        assert progress.level == ConversationLevel.ADVANCED
        assert progress.total_sessions == 0
        assert progress.completed_sessions == 0
        assert progress.total_speaking_time == 0.0
        assert progress.mastered_vocabulary == []
        assert progress.mastered_phrases == []
    
    def test_create_conversation_scenario_request(self):
        """Test creating a conversation scenario request"""
        request = CreateConversationScenarioRequest(
            title="Test Scenario",
            topic=ConversationTopic.SHOPPING,
            level=ConversationLevel.INTERMEDIATE,
            description="Test description",
            ai_character_name="Test Character",
            ai_character_description="Test character description",
            ai_system_prompt="Test system prompt"
        )
        
        assert request.title == "Test Scenario"
        assert request.topic == ConversationTopic.SHOPPING
        assert request.level == ConversationLevel.INTERMEDIATE
        assert request.max_conversation_turns == 10
        assert request.enable_interruption is True
        assert request.tags == []
    
    def test_conversation_topic_enum_values(self):
        """Test conversation topic enum values"""
        topics = [topic.value for topic in ConversationTopic]
        
        expected_topics = [
            "restaurant", "shopping", "job_interview", "travel",
            "business_meeting", "medical_appointment", "education",
            "friendship", "family", "hobbies"
        ]
        
        for expected_topic in expected_topics:
            assert expected_topic in topics
    
    def test_conversation_level_enum_values(self):
        """Test conversation level enum values"""
        levels = [level.value for level in ConversationLevel]
        
        expected_levels = ["beginner", "intermediate", "advanced"]
        
        for expected_level in expected_levels:
            assert expected_level in levels
    
    def test_session_with_messages(self):
        """Test session with conversation messages"""
        messages = [
            ConversationMessage(
                id="msg_1",
                speaker="ai",
                message="Hello! How can I help you?",
                order=1
            ),
            ConversationMessage(
                id="msg_2",
                speaker="user", 
                message="I'd like to order food",
                order=2
            )
        ]
        
        session = UserConversationSession(
            user_id="user_123",
            scenario_id="scenario_456",
            messages=messages,
            current_turn=2
        )
        
        assert len(session.messages) == 2
        assert session.current_turn == 2
        assert session.messages[0].speaker == "ai"
        assert session.messages[1].speaker == "user"
    
    def test_scenario_with_sample_conversation(self):
        """Test scenario with sample conversation"""
        sample_messages = [
            ConversationMessage(
                id="sample_1",
                speaker="ai",
                message="Welcome to our restaurant!",
                order=1
            ),
            ConversationMessage(
                id="sample_2",
                speaker="user",
                message="Thank you!",
                order=2
            )
        ]
        
        scenario = ConversationScenario(
            title="Restaurant Welcome",
            topic=ConversationTopic.RESTAURANT,
            level=ConversationLevel.BEGINNER,
            description="Practice restaurant greetings",
            ai_character_name="Host",
            ai_character_description="Restaurant host",
            ai_system_prompt="Welcome customers warmly",
            sample_conversation=sample_messages
        )
        
        assert len(scenario.sample_conversation) == 2
        assert scenario.sample_conversation[0].message == "Welcome to our restaurant!"
        assert scenario.sample_conversation[1].speaker == "user"
    
    def test_progress_with_mastered_content(self):
        """Test progress tracking with mastered vocabulary and phrases"""
        progress = ConversationProgress(
            user_id="user_123",
            topic=ConversationTopic.RESTAURANT,
            level=ConversationLevel.BEGINNER,
            total_sessions=5,
            completed_sessions=4,
            mastered_vocabulary=["menu", "order", "bill"],
            mastered_phrases=["I'd like to order", "Can I have the check?"]
        )
        
        assert progress.total_sessions == 5
        assert progress.completed_sessions == 4
        assert len(progress.mastered_vocabulary) == 3
        assert len(progress.mastered_phrases) == 2
        assert "menu" in progress.mastered_vocabulary
        assert "I'd like to order" in progress.mastered_phrases