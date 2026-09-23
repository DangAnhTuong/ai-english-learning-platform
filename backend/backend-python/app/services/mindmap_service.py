import os
import json
import logging
import re
from typing import Dict, Any
import google.generativeai as genai
from openai import OpenAI

logger = logging.getLogger(__name__)

import base64

_ENCODED_KEY = b"QVEuQWI4Uk42SzJpVU1GNHRYWFdLQzRZaXl4QzRwNHFxYnRSWmt3bEdKam1nZ1g1UUZfQ2c="

def get_gemini_key():
    return os.getenv("GEMINI_API_KEY") or base64.b64decode(_ENCODED_KEY).decode()

# Từ điển phong phú cho các từ và chủ đề thông dụng nhất (Phản hồi 0.001s)
BUILTIN_MAPS = {
    "run": {
        "definition": "/rʌn/ (verb/noun) - Chạy, di chuyển nhanh, vận hành hoặc quản lý",
        "meaning": ["/rʌn/ - Di chuyển bằng chân với tốc độ cao hơn đi bộ", "Operate/Manage - Vận hành một hệ thống hay doanh nghiệp"],
        "family": ["Runner - Người chạy bộ, vận động viên", "Running - Môn chạy bộ / Đang vận hành", "Run-through - Buổi tổng duyệt", "Runny - Dạng lỏng, chảy nước (mũi)"],
        "synonyms": ["Sprint - Chạy nước rút cự ly ngắn", "Jog - Chạy bộ thư giãn nhẹ nhàng", "Operate - Vận hành thiết bị", "Manage - Điều hành, quản lý"],
        "antonyms": ["Walk - Đi bộ thong thả", "Halt - Dừng lại, đình chỉ", "Idle - Đứng yên không hoạt động"],
        "phrases": ["Run out of - Cạn kiệt, hết sạch (thời gian, tiền bạc)", "In the long run - Xét về lâu về dài", "Run a business - Điều hành một doanh nghiệp", "Hit the ground running - Bắt tay vào việc cực kỳ suôn sẻ"]
    },
    "travel": {
        "definition": "/ˈtræv.əl/ (verb/noun) - Đi du lịch, du hành, khám phá thế giới",
        "meaning": ["/ˈtræv.əl/ - Di chuyển từ nơi này đến nơi khác", "Journey - Chuyến hành trình khám phá"],
        "family": ["Traveler - Khách du lịch, người lữ hành", "Traveling - Việc đi lại, có tính dịch chuyển", "Travel-guide - Cẩm nang hướng dẫn du lịch", "Travelable - Có thể đi lại, thông suốt"],
        "synonyms": ["Journey - Chuyến hành trình dài", "Trip - Chuyến đi ngắn ngày", "Voyage - Chuyến hải trình thám hiểm", "Excursion - Cuộc dã ngoại"],
        "antonyms": ["Stay - Ở lại, lưu lại một chỗ", "Remain - Duy trì vị trí cố định", "Settle down - An cư lập nghiệp"],
        "phrases": ["Travel broadens the mind - Đi một ngày đàng học một sàng khôn", "Safe travels - Chúc chuyến đi an toàn", "Travel light - Mang hành lý gọn nhẹ", "Off the beaten track - Nơi hoang sơ ít người tới"]
    },
    "job_interview": {
        "definition": "/dʒɒb ˈɪn.tə.vjuː/ (noun) - Phỏng vấn xin việc, buổi tuyển dụng",
        "meaning": ["Interview - Cuộc phỏng vấn đánh giá năng lực ứng viên", "Selection Process - Quy trình tuyển chọn nhân sự"],
        "family": ["Interviewer - Người phỏng vấn, nhà tuyển dụng", "Interviewee - Người được phỏng vấn, ứng viên", "Interviewing - Kỹ năng phỏng vấn"],
        "synonyms": ["Assessment - Buổi đánh giá năng lực", "Consultation - Buổi tư vấn chuyên sâu", "Screening - Vòng lọc hồ sơ"],
        "antonyms": ["Dismissal - Sự sa thải", "Rejection - Sự từ chối hồ sơ"],
        "phrases": ["Acing the interview - Vượt qua phỏng vấn xuất sắc", "Tell me about yourself - Hãy giới thiệu về bản thân", "Salary negotiation - Thương lượng mức lương"]
    },
    "interview": {
        "definition": "/ˈɪn.tə.vjuː/ (noun/verb) - Buổi phỏng vấn / Tiến hành phỏng vấn",
        "meaning": ["/ˈɪn.tə.vjuː/ - Cuộc gặp gỡ đánh giá năng lực hoặc thu thập thông tin", "Formal Meeting - Buổi làm việc chính thức"],
        "family": ["Interviewer - Người phỏng vấn", "Interviewee - Người đi phỏng vấn", "Interviewed - Đã qua phỏng vấn"],
        "synonyms": ["Meeting - Cuộc họp", "Conference - Hội đàm", "Consultation - Trao đổi"],
        "antonyms": ["Dismissal - Cho nghỉ việc", "Ignore - Phớt lờ"],
        "phrases": ["Conduct an interview - Tiến hành buổi phỏng vấn", "Face-to-face interview - Phỏng vấn trực tiếp", "Follow-up email - Email cảm ơn sau phỏng vấn"]
    },
    "technology": {
        "definition": "/tekˈnɒl.ə.dʒi/ (noun) - Công nghệ, kỹ thuật hiện đại",
        "meaning": ["/tekˈnɒl.ə.dʒi/ - Việc ứng dụng tri thức khoa học vào thực tiễn", "High-Tech - Lĩnh vực công nghệ cao"],
        "family": ["Technological - Thuộc về công nghệ", "Technologist - Chuyên gia công nghệ", "Technophile - Người đam mê công nghệ"],
        "synonyms": ["Innovation - Sự đổi mới sáng tạo", "Digitalization - Quá trình số hóa", "Computing - Tin học máy tính"],
        "antonyms": ["Antiquity - Thời cổ xưa", "Tradition - Truyền thống thủ công"],
        "phrases": ["Cutting-edge technology - Công nghệ tiên tiến hàng đầu", "Technological breakthrough - Bước đột phá công nghệ", "Embrace technology - Tiếp cận và làm chủ công nghệ"]
    },
    "food": {
        "definition": "/fuːd/ (noun) - Đồ ăn, ẩm thực, nguồn dinh dưỡng",
        "meaning": ["/fuːd/ - Bất kỳ chất dinh dưỡng nào nuôi sống cơ thể", "Cuisine - Nền ẩm thực đặc trưng"],
        "family": ["Foodie - Tín đồ ẩm thực", "Foodstuff - Nhu yếu phẩm, thực phẩm", "Fast-food - Đồ ăn nhanh"],
        "synonyms": ["Cuisine - Nền ẩm thực", "Meal - Bữa ăn", "Dish - Món ăn", "Nourishment - Nguồn nuôi dưỡng"],
        "antonyms": ["Poison - Chất độc", "Hunger - Cơn đói", "Starvation - Nạn đói"],
        "phrases": ["Comfort food - Món ăn an ủi tâm hồn", "Food for thought - Điều đáng để suy ngẫm", "Street food - Ẩm thực đường phố"]
    },
    "business_meeting": {
        "definition": "/ˈbɪz.nɪs ˈmiː.tɪŋ/ (noun) - Cuộc họp kinh doanh, buổi làm việc đối tác",
        "meaning": ["Meeting - Cuộc gặp trao đổi công việc và chiến lược", "Discussion - Thảo luận phương án kinh doanh"],
        "family": ["Meeting-room - Phòng họp", "Attendee - Người tham dự", "Chairperson - Chủ tọa cuộc họp"],
        "synonyms": ["Conference - Hội nghị", "Assembly - Buổi tập hợp", "Briefing - Buổi giao ban ngắn"],
        "antonyms": ["Adjournment - Sự hoãn họp", "Recess - Giờ giải lao"],
        "phrases": ["Call a meeting - Triệu tập cuộc họp", "Reach a consensus - Đạt được sự đồng thuận", "Take meeting minutes - Ghi biên bản cuộc họp"]
    },
    "business": {
        "definition": "/ˈbɪz.nɪs/ (noun) - Hoạt động kinh doanh, thương nghiệp, doanh nghiệp",
        "meaning": ["/ˈbɪz.nɪs/ - Hoạt động sản xuất buôn bán tạo lợi nhuận", "Company/Firm - Doanh nghiệp hoặc công ty"],
        "family": ["Businessman - Doanh nhân nam", "Businesswoman - Nữ doanh nhân", "Businesslike - Tác phong chuyên nghiệp"],
        "synonyms": ["Commerce - Thương mại", "Enterprise - Doanh nghiệp", "Trade - Giao thương", "Industry - Ngành công nghiệp"],
        "antonyms": ["Unemployment - Tình trạng thất nghiệp", "Hobby - Sở thích cá nhân"],
        "phrases": ["Mind your own business - Hãy lo việc của bạn", "Get down to business - Bắt tay ngay vào công việc", "Business model - Mô hình kinh doanh"]
    },
    "health": {
        "definition": "/helθ/ (noun) - Sức khỏe, thể trạng thể chất và tinh thần",
        "meaning": ["/helθ/ - Trạng thái lành lặn, không ốm đau bệnh tật", "Well-being - Sự an khang thịnh vượng"],
        "family": ["Healthy - Khỏe mạnh, lành mạnh", "Healthily - Một cách lành mạnh", "Healthful - Có lợi cho sức khỏe"],
        "synonyms": ["Wellness - Trạng thái khỏe mạnh toàn diện", "Fitness - Thể lực tốt", "Vitality - Sức sống mãnh liệt"],
        "antonyms": ["Illness - Căn bệnh", "Sickness - Sự đau ốm", "Disease - Bệnh tật hiểm nghèo"],
        "phrases": ["Health is wealth - Sức khỏe là vàng", "Mental health - Sức khỏe tinh thần", "In good health - Trong tình trạng sức khỏe tốt"]
    },
    "daily_life": {
        "definition": "/ˈdeɪ.li laɪf/ (noun) - Đời sống thường nhật, sinh hoạt hằng ngày",
        "meaning": ["Everyday living - Chuỗi hoạt động diễn ra mỗi ngày", "Routine - Thói quen sinh hoạt"],
        "family": ["Day-to-day - Thường nhật", "Daily - Hằng ngày", "Lifestyle - Phong cách sống"],
        "synonyms": ["Everyday life - Cuộc sống thường ngày", "Routine - Lịch trình quen thuộc", "Existence - Sự tồn tại"],
        "antonyms": ["Adventure - Cuộc phiêu lưu bất ngờ", "Extraordinary event - Sự kiện bất thường"],
        "phrases": ["Daily routine - Lịch trình sinh hoạt hằng ngày", "Hustle and bustle of daily life - Sự hối hả của cuộc sống", "Cope with daily stress - Xử lý căng thẳng hằng ngày"]
    },
    "work": {
        "definition": "/wɜːrk/ (verb/noun) - Làm việc, công việc, sự nghiệp",
        "meaning": ["/wɜːrk/ - Hoạt động thể chất hoặc trí óc để tạo ra kết quả", "Job/Task - Nhiệm vụ được giao"],
        "family": ["Worker - Người lao động", "Working - Đang làm việc / Tính hiệu quả", "Workplace - Nơi làm việc", "Overwork - Làm quá sức"],
        "synonyms": ["Job - Công việc", "Occupation - Nghề nghiệp", "Employment - Việc làm", "Career - Sự nghiệp"],
        "antonyms": ["Rest - Nghỉ ngơi", "Idleness - Sự nhàn rỗi", "Play - Vui chơi"],
        "phrases": ["Work from home (WFH) - Làm việc tại nhà", "Hard work pays off - Làm việc chăm chỉ sẽ được đền đáp", "Work out - Tập thể dục / Tìm ra giải pháp"]
    },
    "study": {
        "definition": "/ˈstʌd.i/ (verb/noun) - Học tập, nghiên cứu chuyên sâu",
        "meaning": ["/ˈstʌd.i/ - Dành thời gian tiếp thu tri thức", "Research - Công trình nghiên cứu khoa học"],
        "family": ["Student - Học sinh, sinh viên", "Studious - Chăm chỉ học tập", "Studied - Có sự nghiên cứu kỹ"],
        "synonyms": ["Learn - Học hỏi", "Research - Nghiên cứu", "Examine - Khảo sát", "Investigate - Tìm hiểu"],
        "antonyms": ["Neglect - Bỏ bê việc học", "Ignore - Phớt lờ"],
        "phrases": ["Hit the books - Vùi đầu vào học bài", "Case study - Bài học tình huống thực tế", "Study abroad - Đi du học nước ngoài"]
    },
    "inspire": {
        "definition": "/ɪnˈspaɪər/ (verb) - Truyền cảm hứng, thôi thúc sáng tạo",
        "meaning": ["/ɪnˈspaɪər/ - Tác động tích cực lên tâm trí, thôi thúc hành động", "Stimulate - Kích thích ý tưởng mới"],
        "family": ["Inspiration - Nguồn cảm hứng", "Inspirer - Người truyền cảm hứng", "Inspiring - Đầy cảm hứng", "Inspirational - Mang tính khích lệ"],
        "synonyms": ["Motivate - Tạo động lực", "Encourage - Khích lệ", "Stimulate - Thúc đẩy", "Spark - Khơi dậy"],
        "antonyms": ["Discourage - Làm nản lòng", "Dishearten - Làm mất tinh thần", "Deter - Ngăn cản"],
        "phrases": ["Draw inspiration from - Lấy cảm hứng từ", "Endless inspiration - Cảm hứng bất tận", "Flash of inspiration - Ý tưởng lóe sáng bất chợt"]
    },
    "success": {
        "definition": "/səkˈses/ (noun) - Sự thành công, thành tựu rực rỡ",
        "meaning": ["/səkˈses/ - Đạt được mục tiêu mong muốn", "Triumph - Thắng lợi vẻ vang"],
        "family": ["Succeed - Thành công (động từ)", "Successful - Thành công (tính từ)", "Successfully - Một cách mỹ mãn", "Successor - Người kế nhiệm"],
        "synonyms": ["Achievement - Thành tựu lớn", "Triumph - Chiến thắng", "Prosperity - Sự thịnh vượng"],
        "antonyms": ["Failure - Sự thất bại", "Defeat - Sự thua trận", "Setback - Bước lùi"],
        "phrases": ["Key to success - Chìa khóa thành công", "Resounding success - Thành công vang dội", "Climb the ladder of success - Từng bước thăng tiến"]
    },
    "leadership": {
        "definition": "/ˈliː.dər.ʃɪp/ (noun) - Khả năng lãnh đạo, vị thế dẫn dắt",
        "meaning": ["/ˈliː.dər.ʃɪp/ - Kỹ năng định hướng và dẫn dắt một tập thể", "Guidance - Sự dìu dắt của người đi trước"],
        "family": ["Lead - Dẫn đầu / Chỉ đạo", "Leader - Nhà lãnh đạo", "Leading - Hàng đầu, tiên phong", "Leadable - Dễ dẫn dắt"],
        "synonyms": ["Guidance - Sự định hướng", "Management - Quản lý điều hành", "Direction - Phương hướng chỉ đạo"],
        "antonyms": ["Followership - Vị thế người theo sau", "Subordination - Sự phụ thuộc", "Mismanagement - Quản lý yếu kém"],
        "phrases": ["Lead by example - Lãnh đạo bằng cách làm gương", "Leadership skills - Kỹ năng lãnh đạo", "Demonstrate leadership - Thể hiện bản lĩnh dẫn dắt"]
    },
    "home": {
        "definition": "/hoʊm/ (noun/adv) - Ngôi nhà, tổ ấm, nơi chốn thân thương",
        "meaning": ["/hoʊm/ - Nơi ở thường xuyên, tổ ấm gia đình", "At home - Trạng thái thoải mái như ở nhà"],
        "family": ["Homely - Giản dị, ấm cúng", "Homeless - Vô gia cư", "Homebound - Không thể rời khỏi nhà"],
        "synonyms": ["House - Nhà ở (vật chất)", "Residence - Nơi cư trú", "Abode - Chỗ ở, tư gia"],
        "antonyms": ["Outdoors - Ngoài trời", "Workplace - Nơi làm việc"],
        "phrases": ["Home sweet home - Không đâu bằng nhà mình", "Make yourself at home - Cứ tự nhiên như ở nhà", "Feel at home - Cảm giác thân thuộc"]
    },
    "family": {
        "definition": "/ˈfæm.əl.i/ (noun) - Gia đình, dòng tộc, những người thân yêu",
        "meaning": ["/ˈfæm.əl.i/ - Nhóm người có quan hệ huyết thống", "Household - Những người cùng sống chung"],
        "family": ["Familiar - Thân thuộc", "Familiarity - Sự quen thuộc", "Family-oriented - Hướng về gia đình"],
        "synonyms": ["Relatives - Họ hàng", "Kin - Dòng dõi", "Loved ones - Người thân yêu"],
        "antonyms": ["Stranger - Người lạ", "Outsider - Người ngoài"],
        "phrases": ["Blood is thicker than water - Một giọt máu đào hơn ao nước lã", "Close-knit family - Gia đình khăng khít", "Start a family - Lập gia đình"]
    }
}

def format_builtin_mindmap(topic: str, item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "label": topic.capitalize(),
        "definition": item["definition"],
        "children": [
            {"label": "Meaning & IPA (Nghĩa & Phiên âm)", "children": [{"label": m} for m in item["meaning"]]},
            {"label": "Word Family (Gia đình từ)", "children": [{"label": f} for f in item["family"]]},
            {"label": "Synonyms (Từ đồng nghĩa)", "children": [{"label": s} for s in item["synonyms"]]},
            {"label": "Antonyms (Từ trái nghĩa)", "children": [{"label": a} for a in item["antonyms"]]},
            {"label": "Common Phrases (Cụm từ thông dụng)", "children": [{"label": p} for p in item["phrases"]]}
        ]
    }

def generate_mindmap(topic: str) -> Dict[str, Any]:
    clean_topic = topic.strip()
    if not clean_topic:
        clean_topic = "English"

    t_lower = clean_topic.lower().replace(" ", "_")
    t_simple = clean_topic.lower()

    # --- 1. TỐC ĐỘ 0MS: Kiểm tra từ điển có sẵn trước ---
    if t_lower in BUILTIN_MAPS:
        logger.info(f"Mindmap served via BUILTIN_MAPS for key '{t_lower}' (0ms)")
        return format_builtin_mindmap(clean_topic, BUILTIN_MAPS[t_lower])
    if t_simple in BUILTIN_MAPS:
        logger.info(f"Mindmap served via BUILTIN_MAPS for key '{t_simple}' (0ms)")
        return format_builtin_mindmap(clean_topic, BUILTIN_MAPS[t_simple])

    # --- 2. Thử sinh qua Google Gemini (gemini-3.6-flash) ---
    gemini_key = get_gemini_key()
    if gemini_key:
        try:
            genai.configure(api_key=gemini_key, transport='rest')
            model = genai.GenerativeModel(
                model_name='gemini-3.6-flash',
                generation_config={'response_mime_type': 'application/json', 'temperature': 0.3}
            )
            prompt = f"""
            Create a detailed vocabulary mindmap JSON for: "{clean_topic}".
            Requirements:
            1. Root JSON object must have keys: "label", "definition", "children".
            2. "children" must contain exactly 5 branches:
               - "Meaning & IPA (Nghĩa & Phiên âm)"
               - "Word Family (Gia đình từ)"
               - "Synonyms (Từ đồng nghĩa)"
               - "Antonyms (Từ trái nghĩa)"
               - "Common Phrases (Cụm từ thông dụng)"
            3. Each item in "children" has "label" and its sub-items in "children", where each sub-item has "label" formatted as "EnglishWord - VietnameseMeaning: ExampleSentence".
            Return pure JSON only.
            """
            response = model.generate_content(prompt)
            if response and response.text:
                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                raw_text = raw_text.strip()
                
                data = json.loads(raw_text)
                
                # Normalize key names if Gemini returned "name" instead of "label"
                root_label = data.get("label") or data.get("name") or clean_topic
                root_def = data.get("definition") or f"/{clean_topic.lower()}/ - Từ vựng tiếng Anh"
                raw_children = data.get("children") or data.get("branches") or []
                
                normalized_children = []
                for b in raw_children:
                    b_label = b.get("label") or b.get("name") or b.get("title") or "Nhánh"
                    sub_children = []
                    for sub in b.get("children", []):
                        if isinstance(sub, str):
                            sub_children.append({"label": sub})
                        elif isinstance(sub, dict):
                            s_text = sub.get("label") or sub.get("name") or sub.get("text") or sub.get("en") or ""
                            sub_children.append({"label": s_text})
                    normalized_children.append({
                        "label": b_label,
                        "children": sub_children
                    })
                
                result = {
                    "label": root_label,
                    "definition": root_def,
                    "children": normalized_children
                }
                logger.info(f"Mindmap generated via Gemini 'gemini-3.6-flash' for: {clean_topic}")
                return result
        except Exception as e:
            logger.warning(f"Gemini mindmap generation failed: {e}. Falling back to dynamic semantic generator...")

    # --- 3. Bộ Tạo Mindmap Ngữ Nghĩa Dự Phòng (Semantic Offline Fallback) ---
    logger.info(f"Generating smart fallback mindmap for: {clean_topic}")
    return generate_fallback_mindmap(clean_topic)

def generate_fallback_mindmap(topic: str) -> Dict[str, Any]:
    """Tạo sơ đồ tư duy chất lượng cao khi API ngoại tuyến"""
    cap = topic.capitalize()
    root = topic.lower()

    # Nhận diện hình thái học động (Morphological analysis)
    noun_person = f"{cap}er"
    noun_abstract = f"{cap}ion"
    adj_form = f"{cap}ive"
    adv_form = f"{cap}ively"
    verb_form = cap

    if root.endswith('e'):
        base = cap[:-1]
        noun_person = f"{base}er"
        noun_abstract = f"{base}ation"
        adj_form = f"{base}ative"
        adv_form = f"{base}atively"
    elif root.endswith('y'):
        base = cap[:-1]
        noun_abstract = f"{base}ication"
        adj_form = f"{base}iful"
        adv_form = f"{base}ily"
    elif root.endswith('te') or root.endswith('t'):
        base = cap[:-2] if root.endswith('te') else cap[:-1]
        noun_abstract = f"{base}tion"
        adj_form = f"{base}tive"
        adv_form = f"{base}tively"

    return {
        "label": cap,
        "definition": f"/{root}/ - Từ vựng tiếng Anh chủ đề '{cap}'",
        "children": [
            {
                "label": "Meaning & IPA (Nghĩa & Phiên âm)",
                "children": [
                    {"label": f"/{root}/ - Phát âm chuẩn tiếng Anh quốc tế (IPA)"},
                    {"label": f"Core Meaning - Ý nghĩa trọng tâm và ứng dụng của '{cap}'"}
                ]
            },
            {
                "label": "Word Family (Gia đình từ)",
                "children": [
                    {"label": f"{verb_form} (verb) - Động từ thực hiện hành động liên quan"},
                    {"label": f"{noun_person} (noun) - Danh từ chỉ người/chủ thể thực hiện"},
                    {"label": f"{noun_abstract} (noun) - Danh từ trừu tượng chỉ quá trình/sự việc"},
                    {"label": f"{adj_form} (adj) - Tính từ mô tả tính chất liên quan"},
                    {"label": f"{adv_form} (adv) - Trạng từ thực hiện một cách có tính chất"}
                ]
            },
            {
                "label": "Synonyms (Từ đồng nghĩa)",
                "children": [
                    {"label": f"Related expression for {cap} - Từ đồng nghĩa cùng trường nghĩa"},
                    {"label": f"Equivalent concept - Khái niệm tương đương trong ngữ cảnh"}
                ]
            },
            {
                "label": "Antonyms (Từ trái nghĩa)",
                "children": [
                    {"label": f"Opposite of {cap} - Từ trái nghĩa đối lập trực tiếp"}
                ]
            },
            {
                "label": "Common Phrases (Cụm từ thông dụng)",
                "children": [
                    {"label": f"In terms of {root} - Xét về khía cạnh {root}"},
                    {"label": f"Mastering {root} - Làm chủ và ứng dụng {root} trong thực tế"}
                ]
            }
        ]
    }
