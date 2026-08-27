import os
from openai import OpenAI
from typing import Dict, Any

def get_client():
    api_key = os.getenv("OPENAI_API_KEY") or "placeholder"
    return OpenAI(api_key=api_key)

def generate_mindmap(topic: str) -> Dict[str, Any]:
    client = get_client()
    prompt = f"""
    Hãy tạo một sơ đồ tư duy (mindmap) chuyên sâu cho từ hoặc chủ đề: "{topic}".
    Yêu cầu trả về JSON định dạng cây (tree structure).
    Bao gồm các nhánh chính (mỗi nhánh phải có nhãn tiếng Anh kèm dịch tiếng Việt):
    1. "Meaning & IPA (Nghĩa & Phiên âm)"
    2. "Word Family (Gia đình từ)"
    3. "Synonyms (Từ đồng nghĩa)"
    4. "Antonyms (Từ trái nghĩa)"
    5. "Common Phrases (Cụm từ thông dụng)"

    LƯU Ý: 
    - Tất cả các từ vựng con PHẢI có dịch nghĩa tiếng Việt đi kèm ngay sau dấu gạch ngang.
    - Ví dụ: "Success - Sự thành công".
    - Trả về JSON chuẩn 100%.

    Định dạng mẫu:
    {{
      "label": "{topic}",
      "definition": "Phiên âm và nghĩa tổng quát",
      "children": [
        {{
          "label": "Synonyms (Từ đồng nghĩa)",
          "children": [
            {{"label": "Gorgeous - Tuyệt đẹp"}},
            {{"label": "Stunning - Lộng lẫy"}}
          ]
        }}
      ]
    }}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": "Bạn là chuyên gia ngôn ngữ học và gia sư tiếng Anh."},
                  {"role": "user", "content": prompt}],
        response_format={ "type": "json_object" }
    )
    
    import json
    return json.loads(response.choices[0].message.content)