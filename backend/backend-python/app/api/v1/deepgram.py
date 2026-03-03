from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
import json
import os
from typing import Dict, Any
import asyncio
from deepgram import Deepgram
from app.services.ai_service import ai_service

router = APIRouter()

# Khởi tạo Deepgram client - Lazy loading
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
deepgram = None

def get_deepgram_client():
    global deepgram
    if deepgram is None:
        if not DEEPGRAM_API_KEY or DEEPGRAM_API_KEY == "your_deepgram_api_key_here":
            raise ValueError("DEEPGRAM_API_KEY not found or not configured properly. Please set a valid Deepgram API key in your .env file")
        try:
            deepgram = Deepgram(DEEPGRAM_API_KEY)
        except Exception as e:
            raise ValueError(f"Failed to initialize Deepgram client: {str(e)}. Please check your API key.")
    return deepgram

@router.post("/whisper")
async def whisper_transcribe(audio: UploadFile = File(...), language: str = "vi"):
    """Transcribe audio file using Deepgram Whisper"""
    try:
        # Đọc audio file
        audio_content = await audio.read()
        
        print(f"Processing audio with language: {language}")
        print(f"Audio content size: {len(audio_content)} bytes")
        print(f"Audio mimetype: {audio.content_type}")
        
        # Gửi đến Deepgram để transcribe
        transcription_options = {
            "model": "nova-2",
            "smart_format": True,
            "punctuate": True
        }
        
        # Xử lý language parameter
        if language == "auto":
            # Sử dụng chế độ auto-detect cho tiếng Việt và tiếng Anh
            transcription_options["language"] = "multi"
        elif language == "multi":
            # Sử dụng chế độ multi-language
            transcription_options["language"] = "multi"
        elif language and language != "auto":
            # Sử dụng language cụ thể
            transcription_options["language"] = language
        
        try:
            deepgram_client = get_deepgram_client()
        except ValueError as e:
            return JSONResponse(
                status_code=500,
                content={
                    "transcript": "",
                    "confidence": 0.0,
                    "error": str(e),
                    "message": "Please configure your Deepgram API key in the .env file"
                }
            )
        
        response = await deepgram_client.transcription.prerecorded({
            "buffer": audio_content,
            "mimetype": audio.content_type
        }, transcription_options)
        
        print(f"Deepgram response: {response}")
        
        # Kiểm tra response có hợp lệ không
        if not response:
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": "No response from Deepgram"
            }
        
        # Kiểm tra cấu trúc response
        if "results" not in response:
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": "Invalid response structure from Deepgram"
            }
        
        if not response["results"]["channels"]:
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": "No channels in response"
            }
        
        if not response["results"]["channels"][0]["alternatives"]:
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": "No alternatives in response"
            }
        
        # Lấy transcript
        transcript = response["results"]["channels"][0]["alternatives"][0]["transcript"]
        confidence = response["results"]["channels"][0]["alternatives"][0]["confidence"]
        
        print(f"Transcript: {transcript}")
        print(f"Confidence: {confidence}")
        
        # Kiểm tra transcript có hợp lệ không
        if not transcript or transcript.strip() == "":
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": "No speech detected"
            }
        
        return {
            "transcript": transcript,
            "confidence": confidence,
            "language": language
        }
        
    except Exception as e:
        print(f"Error in whisper_transcribe: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.post("/whisper-multi")
async def whisper_transcribe_multi(audio: UploadFile = File(...)):
    """Transcribe audio file using Deepgram with multi-language support"""
    try:
        # Đọc audio file
        audio_content = await audio.read()
        
        print(f"Processing audio with multi-language support")
        print(f"Audio content size: {len(audio_content)} bytes")
        print(f"Audio mimetype: {audio.content_type}")
        
        # Gửi đến Deepgram để transcribe với multi-language
        response = await deepgram.transcription.prerecorded({
            "buffer": audio_content,
            "mimetype": audio.content_type
        }, {
            "model": "nova-2",
            "language": "multi",  # Sử dụng multi-language
            "smart_format": True,
            "punctuate": True
        })
        
        print(f"Deepgram multi-language response: {response}")
        
        # Kiểm tra response có hợp lệ không
        if not response:
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": "No response from Deepgram"
            }
        
        # Kiểm tra cấu trúc response
        if "results" not in response:
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": "Invalid response structure from Deepgram"
            }
        
        if not response["results"]["channels"]:
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": "No channels in response"
            }
        
        if not response["results"]["channels"][0]["alternatives"]:
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": "No alternatives in response"
            }
        
        # Lấy transcript
        transcript = response["results"]["channels"][0]["alternatives"][0]["transcript"]
        confidence = response["results"]["channels"][0]["alternatives"][0]["confidence"]
        
        print(f"Multi-language transcript: {transcript}")
        print(f"Confidence: {confidence}")
        
        # Kiểm tra transcript có hợp lệ không
        if not transcript or transcript.strip() == "":
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": "No speech detected"
            }
        
        return {
            "transcript": transcript,
            "confidence": confidence,
            "language": "multi"
        }
        
    except Exception as e:
        print(f"Error in whisper_transcribe_multi: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Multi-language transcription failed: {str(e)}")

@router.post("/chat")
async def chat_response(request: Dict[str, Any]):
    """Get AI response for chat conversation"""
    try:
        user_message = request.get("message", "")
        context = request.get("context", "")
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        response = await ai_service.get_chat_response(user_message, context)
        return {"response": response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.post("/feedback")
async def pronunciation_feedback(request: Dict[str, Any]):
    """Get pronunciation feedback"""
    try:
        expected_text = request.get("expected", "")
        user_transcript = request.get("transcript", "")
        
        # Convert null/None to empty string
        if user_transcript is None:
            user_transcript = ""
        
        if not expected_text:
            raise HTTPException(status_code=400, detail="Expected text is required")
        
        # Allow empty transcript for feedback - no validation needed
        
        feedback = await ai_service.get_pronunciation_feedback(expected_text, user_transcript)
        return {"feedback": feedback}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback failed: {str(e)}")

@router.websocket("/ws/speech")
async def websocket_speech_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        # Tạo connection với Deepgram
        connection = await deepgram.listen.asynclive.v("1")
        
        # Xử lý các events từ Deepgram
        @connection.on("open")
        async def on_open(event):
            print("Deepgram connection opened")
            await websocket.send_text(json.dumps({
                "type": "connection_status",
                "status": "connected"
            }))
        
        @connection.on("transcript")
        async def on_transcript(result):
            # Gửi transcript về frontend
            transcript_data = {
                "type": "transcript",
                "is_final": result.get("is_final", False),
                "channel": result.get("channel", 0),
                "alternatives": result.get("alternatives", [])
            }
            await websocket.send_text(json.dumps(transcript_data))
        
        @connection.on("error")
        async def on_error(error):
            print(f"Deepgram error: {error}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": str(error)
            }))
        
        @connection.on("close")
        async def on_close(event):
            print("Deepgram connection closed")
            await websocket.send_text(json.dumps({
                "type": "connection_status",
                "status": "disconnected"
            }))
        
        # Bắt đầu connection
        await connection.start({
            "model": "nova-2",
            "language": "vi",  # Thay đổi thành tiếng Việt
            "smart_format": True,
            "punctuate": True,
            "interim_results": True,
            "endpointing": 200,
            "vad_events": True,
            "encoding": "linear16",
            "channels": 1,
            "sample_rate": 16000
        })
        
        # Xử lý audio data từ frontend
        while True:
            try:
                data = await websocket.receive_bytes()
                # Gửi audio data đến Deepgram
                await connection.send(data)
            except WebSocketDisconnect:
                print("WebSocket disconnected")
                break
            except Exception as e:
                print(f"Error processing audio: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Error processing audio: {str(e)}"
                }))
                break
        
        # Đóng connection
        await connection.finish()
        
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"WebSocket error: {str(e)}"
        }))
    finally:
        await websocket.close()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "deepgram"} 