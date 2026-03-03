from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.conversation import (
    ConversationScenario,
    UserConversationSession,
    ConversationProgress,
    ConversationTopic,
    ConversationLevel
)
from app.core.database import Collections

class IConversationRepository(ABC):
    """Abstract base class for conversation repository"""
    
    @abstractmethod
    async def create_scenario(self, scenario: ConversationScenario) -> str:
        pass
    
    @abstractmethod
    async def get_scenario_by_id(self, scenario_id: str) -> Optional[ConversationScenario]:
        pass
    
    @abstractmethod
    async def get_scenarios(
        self,
        topic: Optional[ConversationTopic] = None,
        level: Optional[ConversationLevel] = None,
        is_active: bool = True,
        skip: int = 0,
        limit: int = 10
    ) -> List[ConversationScenario]:
        pass
    
    @abstractmethod
    async def update_scenario(self, scenario_id: str, updates: Dict[str, Any]) -> bool:
        pass
    
    @abstractmethod
    async def delete_scenario(self, scenario_id: str) -> bool:
        pass
    
    @abstractmethod
    async def create_session(self, session: UserConversationSession) -> str:
        pass
    
    @abstractmethod
    async def get_session_by_id(self, session_id: str) -> Optional[UserConversationSession]:
        pass
    
    @abstractmethod
    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        pass
    
    @abstractmethod
    async def get_user_progress(self, user_id: str) -> List[ConversationProgress]:
        pass
    
    @abstractmethod
    async def update_user_progress(self, progress: ConversationProgress) -> bool:
        pass

class MongoConversationRepository(IConversationRepository):
    """MongoDB implementation of conversation repository"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.scenarios_collection = db[Collections.CONVERSATION_SCENARIOS]
        self.sessions_collection = db[Collections.USER_CONVERSATION_SESSIONS]
        self.progress_collection = db[Collections.CONVERSATION_PROGRESS]
    
    async def create_scenario(self, scenario: ConversationScenario) -> str:
        """Create new conversation scenario"""
        scenario_dict = scenario.model_dump(exclude={'id'})
        scenario_dict['created_at'] = datetime.utcnow()
        scenario_dict['updated_at'] = datetime.utcnow()
        
        result = await self.scenarios_collection.insert_one(scenario_dict)
        return str(result.inserted_id)
    
    async def get_scenario_by_id(self, scenario_id: str) -> Optional[ConversationScenario]:
        """Get scenario by ID"""
        try:
            document = await self.scenarios_collection.find_one(
                {"_id": ObjectId(scenario_id)}
            )
            if document:
                document['id'] = str(document['_id'])
                del document['_id']
                return ConversationScenario(**document)
        except Exception:
            return None
        return None
    
    async def get_scenarios(
        self,
        topic: Optional[ConversationTopic] = None,
        level: Optional[ConversationLevel] = None,
        is_active: bool = True,
        skip: int = 0,
        limit: int = 10
    ) -> List[ConversationScenario]:
        """Get scenarios with filtering"""
        filter_dict = {"is_active": is_active}
        
        if topic:
            filter_dict["topic"] = topic.value
        if level:
            filter_dict["level"] = level.value
        
        cursor = self.scenarios_collection.find(filter_dict).skip(skip).limit(limit)
        scenarios = []
        
        async for document in cursor:
            document['id'] = str(document['_id'])
            del document['_id']
            scenarios.append(ConversationScenario(**document))
        
        return scenarios
    
    async def update_scenario(self, scenario_id: str, updates: Dict[str, Any]) -> bool:
        """Update scenario"""
        try:
            updates['updated_at'] = datetime.utcnow()
            result = await self.scenarios_collection.update_one(
                {"_id": ObjectId(scenario_id)},
                {"$set": updates}
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    async def delete_scenario(self, scenario_id: str) -> bool:
        """Soft delete scenario (set is_active = False)"""
        return await self.update_scenario(scenario_id, {"is_active": False})
    
    async def create_session(self, session: UserConversationSession) -> str:
        """Create new conversation session"""
        session_dict = session.model_dump(exclude={'id'})
        session_dict['session_start'] = datetime.utcnow()
        
        result = await self.sessions_collection.insert_one(session_dict)
        return str(result.inserted_id)
    
    async def get_session_by_id(self, session_id: str) -> Optional[UserConversationSession]:
        """Get session by ID"""
        try:
            document = await self.sessions_collection.find_one(
                {"_id": ObjectId(session_id)}
            )
            if document:
                document['id'] = str(document['_id'])
                del document['_id']
                return UserConversationSession(**document)
        except Exception:
            return None
        return None
    
    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update session"""
        try:
            result = await self.sessions_collection.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": updates}
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    async def get_user_progress(self, user_id: str) -> List[ConversationProgress]:
        """Get user progress across all topics"""
        cursor = self.progress_collection.find({"user_id": user_id})
        progress_list = []
        
        async for document in cursor:
            del document['_id']
            progress_list.append(ConversationProgress(**document))
        
        return progress_list
    
    async def update_user_progress(self, progress: ConversationProgress) -> bool:
        """Update user progress"""
        try:
            result = await self.progress_collection.update_one(
                {
                    "user_id": progress.user_id,
                    "topic": progress.topic.value,
                    "level": progress.level.value
                },
                {"$set": progress.model_dump()},
                upsert=True
            )
            return result.upserted_id is not None or result.modified_count > 0
        except Exception:
            return False
    
    async def count_scenarios(
        self,
        topic: Optional[ConversationTopic] = None,
        level: Optional[ConversationLevel] = None,
        is_active: bool = True
    ) -> int:
        """Count scenarios with filtering"""
        filter_dict = {"is_active": is_active}
        
        if topic:
            filter_dict["topic"] = topic.value
        if level:
            filter_dict["level"] = level.value
        
        return await self.scenarios_collection.count_documents(filter_dict)
    
    async def get_user_sessions(
        self,
        user_id: str,
        scenario_id: Optional[str] = None,
        is_completed: Optional[bool] = None,
        skip: int = 0,
        limit: int = 10
    ) -> List[UserConversationSession]:
        """Get user conversation sessions"""
        filter_dict = {"user_id": user_id}
        
        if scenario_id:
            filter_dict["scenario_id"] = scenario_id
        if is_completed is not None:
            filter_dict["is_completed"] = is_completed
        
        cursor = self.sessions_collection.find(filter_dict).skip(skip).limit(limit)
        sessions = []
        
        async for document in cursor:
            document['id'] = str(document['_id'])
            del document['_id']
            sessions.append(UserConversationSession(**document))
        
        return sessions