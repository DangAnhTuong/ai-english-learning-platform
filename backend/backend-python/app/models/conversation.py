from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ConversationTopic(str, Enum):
    RESTAURANT = "restaurant"
    SHOPPING = "shopping"
    JOB_INTERVIEW = "job_interview"
    TRAVEL = "travel"
    BUSINESS_MEETING = "business_meeting"
    MEDICAL_APPOINTMENT = "medical_appointment"
    EDUCATION = "education"
    FRIENDSHIP = "friendship"
    FAMILY = "family"
    HOBBIES = "hobbies"

class ConversationLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class ConversationMessage(BaseModel):
    id: str
    speaker: str = Field(..., description="'user' or 'ai' or character name")
    message: str = Field(..., description="Message content")
    audio_url: Optional[str] = None
    order: int = Field(..., description="Message order in conversation")
    metadata: Optional[Dict[str, Any]] = {}

class ConversationScenario(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., description="Scenario title")
    topic: ConversationTopic
    level: ConversationLevel
    description: str = Field(..., description="Scenario description")
    
    # AI character configuration
    ai_character_name: str = Field(..., description="AI character name")
    ai_character_description: str = Field(..., description="AI character personality and background")
    ai_system_prompt: str = Field(..., description="System prompt for AI character")
    
    # Pre-defined conversation flow
    sample_conversation: List[ConversationMessage] = Field(default_factory=list)
    
    # Learning objectives
    learning_objectives: List[str] = Field(default_factory=list)
    key_vocabulary: List[str] = Field(default_factory=list)
    key_phrases: List[str] = Field(default_factory=list)
    
    # Settings
    max_conversation_turns: int = Field(default=10, description="Max turns in conversation")
    enable_interruption: bool = Field(default=True, description="Allow user to interrupt AI")
    voice_settings: Dict[str, Any] = Field(default_factory=dict)
    
    # Metadata
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: bool = Field(default=True)
    tags: List[str] = Field(default_factory=list)

class UserConversationSession(BaseModel):
    id: Optional[str] = None
    user_id: str
    scenario_id: str
    
    # Session data
    messages: List[ConversationMessage] = Field(default_factory=list)
    current_turn: int = Field(default=0)
    session_start: datetime = Field(default_factory=datetime.utcnow)
    session_end: Optional[datetime] = None
    
    # Progress tracking
    user_speaking_time: float = Field(default=0.0, description="Total speaking time in seconds")
    ai_speaking_time: float = Field(default=0.0, description="Total AI speaking time in seconds")
    interruption_count: int = Field(default=0)
    pronunciation_scores: List[float] = Field(default_factory=list)
    fluency_score: Optional[float] = None
    accuracy_score: Optional[float] = None
    
    # Analytics
    vocabulary_used: List[str] = Field(default_factory=list)
    phrases_used: List[str] = Field(default_factory=list)
    grammar_mistakes: List[Dict[str, str]] = Field(default_factory=list)
    
    # Status
    is_completed: bool = Field(default=False)
    completion_score: Optional[float] = None
    feedback: Optional[str] = None

class ConversationProgress(BaseModel):
    user_id: str
    topic: ConversationTopic
    level: ConversationLevel
    total_sessions: int = Field(default=0)
    completed_sessions: int = Field(default=0)
    total_speaking_time: float = Field(default=0.0)
    average_fluency_score: Optional[float] = None
    average_accuracy_score: Optional[float] = None
    last_session_date: Optional[datetime] = None
    mastered_vocabulary: List[str] = Field(default_factory=list)
    mastered_phrases: List[str] = Field(default_factory=list)

# Request/Response models
class CreateConversationScenarioRequest(BaseModel):
    title: str
    topic: ConversationTopic
    level: ConversationLevel
    description: str
    ai_character_name: str
    ai_character_description: str
    ai_system_prompt: str
    sample_conversation: List[ConversationMessage] = Field(default_factory=list)
    learning_objectives: List[str] = Field(default_factory=list)
    key_vocabulary: List[str] = Field(default_factory=list)
    key_phrases: List[str] = Field(default_factory=list)
    max_conversation_turns: int = 10
    enable_interruption: bool = True
    voice_settings: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)

class UpdateConversationScenarioRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ai_character_description: Optional[str] = None
    ai_system_prompt: Optional[str] = None
    sample_conversation: Optional[List[ConversationMessage]] = None
    learning_objectives: Optional[List[str]] = None
    key_vocabulary: Optional[List[str]] = None
    key_phrases: Optional[List[str]] = None
    max_conversation_turns: Optional[int] = None
    enable_interruption: Optional[bool] = None
    voice_settings: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None

class StartConversationRequest(BaseModel):
    scenario_id: str
    user_id: str

class ConversationMessageRequest(BaseModel):
    message: str
    audio_data: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ConversationListResponse(BaseModel):
    scenarios: List[ConversationScenario]
    total: int
    page: int
    page_size: int

class ConversationStatsResponse(BaseModel):
    total_scenarios: int
    scenarios_by_topic: Dict[ConversationTopic, int]
    scenarios_by_level: Dict[ConversationLevel, int]
    total_sessions: int
    active_sessions: int