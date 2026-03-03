import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generate_mindmap_api_success():
    response = client.post("/api/v1/mindmap/generate", json={"topic": "Technology"})
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data and "edges" in data
    assert data["nodes"][0]["label"] == "Technology"

def test_generate_mindmap_api_empty_topic():
    response = client.post("/api/v1/mindmap/generate", json={"topic": ""})
    assert response.status_code == 400

def test_generate_mindmap_api_long_topic():
    response = client.post("/api/v1/mindmap/generate", json={"topic": "A"*100})
    assert response.status_code == 400

def test_generate_mindmap_api_missing_topic():
    response = client.post("/api/v1/mindmap/generate", json={})
    assert response.status_code == 422 