import asyncio
from fastapi import APIRouter, HTTPException, status
from app.models.mindmap import MindmapRequest
from app.services.mindmap_service import generate_mindmap

router = APIRouter()

@router.post("/generate")
async def generate_mindmap_api(request: MindmapRequest):
    topic = request.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic must not be empty")
    if len(topic) > 50:
        raise HTTPException(status_code=400, detail="Topic too long (max 50 chars)")
    try:
        # Run blocking generate_mindmap in thread pool to prevent blocking FastAPI event loop
        return await asyncio.to_thread(generate_mindmap, topic)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
