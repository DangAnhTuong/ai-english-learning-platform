import pytest
import asyncio
import os
from pathlib import Path

# Add the app directory to Python path for imports
import sys
app_dir = Path(__file__).parent.parent / "app"
sys.path.insert(0, str(app_dir))

@pytest.fixture(scope="session") 
def event_loop():
    """Create an event loop for the entire test session"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Set up test environment variables"""
    # Set test environment variables
    os.environ["OPENAI_API_KEY"] = "test-openai-key"
    os.environ["DEEPGRAM_API_KEY"] = "test-deepgram-key"
    os.environ["MONGODB_URL"] = "mongodb://test-host:27017"
    os.environ["DATABASE_NAME"] = "test_english_learning"
    
    yield
    
    # Cleanup after tests
    test_vars = [
        "OPENAI_API_KEY",
        "DEEPGRAM_API_KEY", 
        "MONGODB_URL",
        "DATABASE_NAME"
    ]
    
    for var in test_vars:
        if var in os.environ:
            del os.environ[var]