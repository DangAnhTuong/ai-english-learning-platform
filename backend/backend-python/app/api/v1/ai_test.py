# backend-python/app/api/v1/ai_test.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import os
import json
import tempfile
from openai import OpenAI

router = APIRouter()

def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")
    return OpenAI(api_key=api_key)

@router.post("/evaluate")
async def evaluate_speaking_test(audios: List[UploadFile] = File(...)):
    try:
        # Kiểm tra xem có nhận được file ghi âm nào không
        if len(audios) == 0:
            raise HTTPException(status_code=400, detail="Không nhận được file ghi âm.")

        full_transcript = ""
        total_spoken_words = 0 # Biến đếm số chữ thực tế thí sinh đã nói
        client = get_client()
        
        # 1. Bóc băng (Transcribe) từng phần một và ghép lại
        for index, audio in enumerate(audios):
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
                content = await audio.read()
                temp_audio.write(content)
                temp_audio_path = temp_audio.name

            # Dùng Whisper bóc băng
            with open(temp_audio_path, "rb") as audio_file:
                transcript_response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            
            part_text = transcript_response.text.strip()
            
            # Chỉ đếm số chữ mà Whisper nghe được từ thí sinh (không đếm chữ hệ thống)
            total_spoken_words += len(part_text.split())
            
            full_transcript += f"[PHẦN {index + 1}]: {part_text if part_text else '(Không có tiếng)'}\n"
            
            os.remove(temp_audio_path)

        # 2. KIỂM TRA ĐIỀU KIỆN TỐI THIỂU (Chống spam / lười nói)
        # Bắt lỗi chuẩn xác: Nếu tổng cộng các phần thi nói chưa được 5 chữ
        if total_spoken_words < 5:
            return {
                "level": "A0",
                "title": "Chưa Đạt (Không có dữ liệu)",
                "score": 0,
                "strengths": ["Chưa thể đánh giá do hệ thống không nhận diện được giọng nói hoặc nói quá ít."],
                "weaknesses": ["Thí sinh bỏ qua các phần thi, hoặc thu âm quá ngắn, bị lỗi mic."],
                "recommendation": "Bạn chưa thực hiện bài thi. Vui lòng kiểm tra lại Micro và trả lời ít nhất 1-2 câu cho mỗi phần nhé!"
            }

        # 3. PROMPT CHUYÊN SÂU DÀNH CHO GIÁM KHẢO AI (CHUẨN IELTS/CEFR)
        prompt = f"""
        Bạn là một Giám khảo chấm thi tiếng Anh IELTS/CEFR cực kỳ khắt khe, lạnh lùng và công tâm.
        Bạn đang chấm bài thi Speaking gồm nhiều phần của một thí sinh.

        Dưới đây là phần bóc băng (transcript) câu trả lời của thí sinh do hệ thống ghi nhận được:
        ---
        {full_transcript}
        ---

        TIÊU CHÍ CHẤM ĐIỂM (Đánh giá khắt khe dựa trên dữ liệu thật):
        1. Task Response (Trả lời đúng trọng tâm): Thí sinh có trả lời đúng câu hỏi của từng phần không? Có phát triển ý không? Nếu nói lạc đề, nói tiếng Việt, hoặc từ ngữ vô nghĩa -> Điểm cực thấp.
        2. Lexical Resource (Từ vựng): Đánh giá sự đa dạng của từ vựng. Thí sinh chỉ dùng từ vựng cơ bản (A1/A2) hay có khả năng dùng từ vựng theo chủ đề, collocation (B1/B2/C1)?
        3. Grammatical Range and Accuracy (Ngữ pháp): Thí sinh dùng câu đơn (A1/A2) hay biết dùng câu ghép, câu phức (B1 trở lên)? Chỉ ra lỗi sai ngữ pháp cụ thể nếu có.
        4. Coherence (Tính mạch lạc): Thí sinh nói thành câu hoàn chỉnh hay chỉ thốt ra các từ rời rạc, lộn xộn?

        LUẬT CHẤM THI NGHIÊM NGẶT (BẮT BUỘC TUÂN THỦ):
        - TUYỆT ĐỐI KHÔNG SUY DIỄN: Chỉ đánh giá những gì thực sự có trong transcript.
        - TUYỆT ĐỐI KHÔNG CHÂM CHƯỚC: Nếu thí sinh nói tiếng Việt (ví dụ: "tôi không biết nói", "alo alo"), nói linh tinh vô nghĩa, hoặc trả lời quá ngắn (vài từ) -> Bắt buộc xếp loại A1 hoặc A0, điểm Score dưới 20. Không được bịa ra "điểm mạnh".
        - QUY ĐỔI ĐIỂM (SCORE) ĐỒNG NHẤT VỚI LEVEL: 
          + A1 (Beginner): 10 - 30 điểm
          + A2 (Elementary): 31 - 45 điểm
          + B1 (Intermediate): 46 - 65 điểm
          + B2 (Upper-Intermediate): 66 - 80 điểm
          + C1/C2 (Advanced): 81 - 100 điểm

        TRẢ VỀ KẾT QUẢ BẰNG ĐỊNH DẠNG JSON CHUẨN (Viết nội dung bằng Tiếng Việt):
        {{
            "level": "B1", 
            "title": "Trung cấp (Intermediate)",
            "score": 65, 
            "strengths": ["Liệt kê 1-2 điểm mạnh THỰC SỰ có trong bài, không bịa đặt. Nếu tệ quá thì ghi 'Chưa có điểm mạnh nổi bật'"],
            "weaknesses": ["Chỉ rõ lỗi sai ngữ pháp/từ vựng cụ thể đã nói, hoặc việc trả lời lạc đề, dùng sai ngôn ngữ..."],
            "recommendation": "Gợi ý cách khắc phục lỗi sai thực tế..."
        }}
        """

        # 4. GỌI GPT ĐỂ CHẤM ĐIỂM
        gpt_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You output only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        result_json = json.loads(gpt_response.choices[0].message.content)
        return result_json

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))