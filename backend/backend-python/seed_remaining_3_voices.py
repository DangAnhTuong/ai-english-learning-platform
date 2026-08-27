import os
import sys
import asyncio
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
import edge_tts

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

MONGO_URI = "mongodb://127.0.0.1:27017"
client = MongoClient(MONGO_URI)
db = client["english-learning"]
conversations_collection = db["conversations"]

AUDIO_BASE_DIR = os.path.join(os.path.dirname(__file__), "conversation_audio")
os.makedirs(AUDIO_BASE_DIR, exist_ok=True)

async def generate_audio_for_line(text: str, voice: str, output_path: str):
    try:
        communicate = edge_tts.Communicate(text=text, voice=voice)
        await communicate.save(output_path)
        file_size = os.path.getsize(output_path)
        duration = round(file_size / 16384, 2)
        return True, file_size, duration
    except Exception as e:
        print(f"Error generating audio: {e}")
        return False, 0, 0

async def main():
    pending_convs = conversations_collection.find({"audioGenerationStatus": {"$ne": "completed"}})
    for conv in pending_convs:
        conv_id = conv["_id"]
        title = conv.get("title", "Untitled")
        print(f"Generating voice for: '{title}'...")
        conv_folder = os.path.join(AUDIO_BASE_DIR, str(conv_id))
        os.makedirs(conv_folder, exist_ok=True)

        lines = conv.get("lines", [])
        updated_lines = []
        for line in lines:
            line_id = line.get("_id") or ObjectId()
            order = line.get("order", 1)
            speaker = line.get("speaker", "A")
            content = line.get("content", "")
            voice_model = "en-US-JennyNeural" if speaker == "A" else "en-US-GuyNeural"
            filename = f"line_{order}_{str(line_id)}.mp3"
            output_path = os.path.join(conv_folder, filename)

            success, file_size, duration = await generate_audio_for_line(content, voice_model, output_path)
            line["_id"] = line_id
            line["audioUrl"] = f"/audio/{str(conv_id)}/{filename}"
            line["audioStatus"] = "completed" if success else "failed"
            line["audioMetadata"] = {
                "duration": duration,
                "fileSize": file_size,
                "format": "mp3",
                "generatedAt": datetime.now()
            }
            updated_lines.append(line)

        conversations_collection.update_one(
            {"_id": conv_id},
            {
                "$set": {
                    "lines": updated_lines,
                    "audioGenerationStatus": "completed",
                    "audioGenerationProgress": 100,
                    "audioGeneratedAt": datetime.now()
                }
            }
        )
        print(f"✅ Generated voice for '{title}'!")

if __name__ == "__main__":
    asyncio.run(main())
