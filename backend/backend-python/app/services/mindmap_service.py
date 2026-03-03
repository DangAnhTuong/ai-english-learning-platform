from fastapi import HTTPException
import os
import openai
from app.models.mindmap import MindmapNode, MindmapEdge, MindmapResponse
from typing import List, Optional

# Tự động load .env nếu tồn tại
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

openai.api_key = os.getenv("openai_api_key")

SYSTEM_PROMPT = (
    "You are a mindmap generator for an English learning app.\n"
    "Given a topic (in any language), always return a nested JSON mindmap (max 5 levels deep).\n"
    "Each node must have: id (unique string), label (English word/phrase), definition (short, simple English), example_sentence (English), children (array of child nodes, or empty array if leaf).\n"
    "The root node is the translated topic. Each child is a subtopic or related word. Output only valid JSON, no explanation, no markdown."
)

USER_PROMPT = lambda topic: f"User topic: {topic}\nGenerate the mindmap as described."

FALLBACK_MINDMAP = {
    "id": "0",
    "label": "Sample Mindmap",
    "definition": "This is a fallback mindmap when AI cannot generate content.",
    "example_sentence": "This is an example sentence for the fallback mindmap.",
    "children": [
        {
            "id": "1",
            "label": "Fallback Node 1",
            "definition": "A sample child node.",
            "example_sentence": "This is a child node.",
            "children": []
        },
        {
            "id": "2",
            "label": "Fallback Node 2",
            "definition": "Another sample child node.",
            "example_sentence": "This is another child node.",
            "children": []
        }
    ]
}

def generate_mindmap(topic: str) -> dict:
    import json
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": USER_PROMPT(topic)}
            ],
            temperature=0.7,
            max_tokens=1800
        )
        content = response.choices[0].message.content
        try:
            data = json.loads(content)
        except Exception:
            import re
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
            else:
                # Nếu không parse được JSON, trả về fallback
                return FALLBACK_MINDMAP
        return data
    except openai.OpenAIError as e:
        # Nếu lỗi policy hoặc lỗi OpenAI, trả về fallback
        return FALLBACK_MINDMAP
    except Exception as e:
        # Nếu lỗi khác, trả về fallback
        return FALLBACK_MINDMAP 