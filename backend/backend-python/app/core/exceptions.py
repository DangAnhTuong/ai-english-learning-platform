"""
Custom exception classes for the English Learning API
"""

class EnglishLearningAPIException(Exception):
    """Base exception for all API-related errors"""
    
    def __init__(self, message: str, code: str = None, details: dict = None):
        self.message = message
        self.code = code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)

class ConversationServiceException(EnglishLearningAPIException):
    """Base exception for conversation service errors"""
    pass

class ConversationScenarioNotFound(ConversationServiceException):
    """Raised when a conversation scenario is not found"""
    
    def __init__(self, scenario_id: str):
        super().__init__(
            f"Conversation scenario not found: {scenario_id}",
            "SCENARIO_NOT_FOUND",
            {"scenario_id": scenario_id}
        )

class ConversationSessionNotFound(ConversationServiceException):
    """Raised when a conversation session is not found"""
    
    def __init__(self, session_id: str):
        super().__init__(
            f"Conversation session not found: {session_id}",
            "SESSION_NOT_FOUND",
            {"session_id": session_id}
        )

class ConversationSessionExpired(ConversationServiceException):
    """Raised when a conversation session has expired"""
    
    def __init__(self, session_id: str):
        super().__init__(
            f"Conversation session has expired: {session_id}",
            "SESSION_EXPIRED",
            {"session_id": session_id}
        )

class InvalidConversationRequest(ConversationServiceException):
    """Raised when a conversation request is invalid"""
    
    def __init__(self, message: str, request_data: dict = None):
        super().__init__(
            f"Invalid conversation request: {message}",
            "INVALID_REQUEST",
            {"request_data": request_data}
        )

class AIServiceException(EnglishLearningAPIException):
    """Base exception for AI service errors"""
    pass

class AIResponseGenerationFailed(AIServiceException):
    """Raised when AI response generation fails"""
    
    def __init__(self, reason: str, context: dict = None):
        super().__init__(
            f"AI response generation failed: {reason}",
            "AI_RESPONSE_FAILED",
            context or {}
        )

class DeepgramServiceException(EnglishLearningAPIException):
    """Base exception for Deepgram service errors"""
    pass

class SpeechToTextFailed(DeepgramServiceException):
    """Raised when speech-to-text conversion fails"""
    
    def __init__(self, reason: str):
        super().__init__(
            f"Speech-to-text conversion failed: {reason}",
            "STT_FAILED",
            {"reason": reason}
        )

class TextToSpeechFailed(DeepgramServiceException):
    """Raised when text-to-speech conversion fails"""
    
    def __init__(self, reason: str, text: str = None):
        super().__init__(
            f"Text-to-speech conversion failed: {reason}",
            "TTS_FAILED",
            {"reason": reason, "text": text}
        )

class DatabaseException(EnglishLearningAPIException):
    """Base exception for database-related errors"""
    pass

class DatabaseConnectionFailed(DatabaseException):
    """Raised when database connection fails"""
    
    def __init__(self, reason: str):
        super().__init__(
            f"Database connection failed: {reason}",
            "DB_CONNECTION_FAILED",
            {"reason": reason}
        )

class DatabaseOperationFailed(DatabaseException):
    """Raised when a database operation fails"""
    
    def __init__(self, operation: str, reason: str, collection: str = None):
        super().__init__(
            f"Database {operation} operation failed: {reason}",
            "DB_OPERATION_FAILED",
            {"operation": operation, "reason": reason, "collection": collection}
        )

class ValidationException(EnglishLearningAPIException):
    """Raised when request validation fails"""
    
    def __init__(self, field: str, message: str):
        super().__init__(
            f"Validation error for field '{field}': {message}",
            "VALIDATION_ERROR",
            {"field": field, "validation_message": message}
        )

class AuthenticationException(EnglishLearningAPIException):
    """Raised when authentication fails"""
    
    def __init__(self, reason: str = "Authentication failed"):
        super().__init__(
            reason,
            "AUTH_FAILED",
            {"reason": reason}
        )

class AuthorizationException(EnglishLearningAPIException):
    """Raised when authorization fails"""
    
    def __init__(self, resource: str, action: str):
        super().__init__(
            f"Not authorized to {action} {resource}",
            "AUTHORIZATION_FAILED", 
            {"resource": resource, "action": action}
        )

class RateLimitExceeded(EnglishLearningAPIException):
    """Raised when rate limit is exceeded"""
    
    def __init__(self, limit: int, window: str):
        super().__init__(
            f"Rate limit exceeded: {limit} requests per {window}",
            "RATE_LIMIT_EXCEEDED",
            {"limit": limit, "window": window}
        )

class ResourceNotAvailable(EnglishLearningAPIException):
    """Raised when a required resource is not available"""
    
    def __init__(self, resource: str, reason: str = "Resource temporarily unavailable"):
        super().__init__(
            f"{resource} is not available: {reason}",
            "RESOURCE_UNAVAILABLE",
            {"resource": resource, "reason": reason}
        )

class ConfigurationException(EnglishLearningAPIException):
    """Raised when there's a configuration error"""
    
    def __init__(self, setting: str, reason: str):
        super().__init__(
            f"Configuration error for '{setting}': {reason}",
            "CONFIG_ERROR",
            {"setting": setting, "reason": reason}
        )