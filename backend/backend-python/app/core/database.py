import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional

logger = logging.getLogger(__name__)

class Database:
    """MongoDB database singleton"""
    _instance: Optional['Database'] = None
    _client: Optional[AsyncIOMotorClient] = None
    _db: Optional[AsyncIOMotorDatabase] = None
    
    def __new__(cls) -> 'Database':
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance
    
    async def connect(self) -> None:
        """Connect to MongoDB"""
        if self._client is None:
            mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
            database_name = os.getenv("DATABASE_NAME", "english_learning")
            
            try:
                self._client = AsyncIOMotorClient(mongodb_url)
                self._db = self._client[database_name]
                
                # Test connection
                await self._client.admin.command('ping')
                logger.info(f"Connected to MongoDB: {database_name}")
                
            except Exception as e:
                logger.error(f"Failed to connect to MongoDB: {e}")
                raise
    
    async def disconnect(self) -> None:
        """Disconnect from MongoDB"""
        if self._client:
            self._client.close()
            self._client = None
            self._db = None
            logger.info("Disconnected from MongoDB")
    
    @property
    def db(self) -> AsyncIOMotorDatabase:
        """Get database instance"""
        if self._db is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._db
    
    @property
    def client(self) -> AsyncIOMotorClient:
        """Get client instance"""
        if self._client is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._client

# Global database instance
database = Database()

async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance for dependency injection"""
    return database.db

# Collection names
class Collections:
    CONVERSATION_SCENARIOS = "conversation_scenarios"
    USER_CONVERSATION_SESSIONS = "user_conversation_sessions"
    CONVERSATION_PROGRESS = "conversation_progress"