import re
from typing import List, Dict, Any

def estimate_tokens(text: str) -> int:
    """
    Ước tính số token trong text
    Dựa trên rule: 1 token ≈ 4 ký tự cho tiếng Anh, 1 token ≈ 2 ký tự cho tiếng Việt
    """
    if not text:
        return 0
    
    # Đếm ký tự tiếng Việt (có dấu)
    vietnamese_chars = len(re.findall(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', text, re.IGNORECASE))
    
    # Đếm ký tự Latin
    latin_chars = len(re.findall(r'[a-zA-Z]', text))
    
    # Đếm ký tự khác (số, dấu câu, khoảng trắng)
    other_chars = len(text) - vietnamese_chars - latin_chars
    
    # Tính token (tiếng Việt: 2 chars/token, Latin: 4 chars/token, khác: 4 chars/token)
    tokens = (vietnamese_chars // 2) + ((latin_chars + other_chars) // 4)
    
    return max(1, tokens)  # Ít nhất 1 token

def calculate_context_tokens(messages: List[Dict[str, Any]], max_tokens: int = 2000) -> tuple:
    """
    Tính toán context messages dựa trên token limit
    Returns: (selected_messages, total_tokens)
    """
    if not messages:
        return [], 0
    
    selected_messages = []
    total_tokens = 0
    
    # Đếm ngược từ message gần nhất
    for msg in reversed(messages):
        msg_tokens = estimate_tokens(msg.get('text', ''))
        
        if total_tokens + msg_tokens <= max_tokens:
            selected_messages.insert(0, msg)  # Thêm vào đầu để giữ thứ tự
            total_tokens += msg_tokens
        else:
            break
    
    return selected_messages, total_tokens

def format_context_string(messages: List[Dict[str, Any]]) -> str:
    """
    Format messages thành context string
    """
    if not messages:
        return ""
    
    context_parts = []
    for msg in messages:
        role = msg.get('role', 'unknown')
        text = msg.get('text', '')
        context_parts.append(f"{role}: {text}")
    
    return "\n".join(context_parts) 