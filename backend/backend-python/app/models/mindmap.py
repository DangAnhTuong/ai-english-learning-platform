from pydantic import BaseModel, Field
from typing import List, Optional

class MindmapNode(BaseModel):
    id: str
    label: str
    type: str = "vocab"
    definition: Optional[str] = None
    example_sentence: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    difficulty_level: Optional[str] = None
    related_words: Optional[List[str]] = []

class MindmapEdge(BaseModel):
    source: str
    target: str

class MindmapResponse(BaseModel):
    nodes: List[MindmapNode]
    edges: List[MindmapEdge]

class MindmapRequest(BaseModel):
    topic: str = Field(..., description="English topic to generate mindmap for") 