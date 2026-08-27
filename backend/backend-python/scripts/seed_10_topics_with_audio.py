import os
import sys
import asyncio
import uuid
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
import edge_tts

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Connect to MongoDB
MONGO_URI = "mongodb://127.0.0.1:27017"
client = MongoClient(MONGO_URI)
db = client["english-learning"]

topics_collection = db["conversationtopics"]
conversations_collection = db["conversations"]
users_collection = db["users"]

admin_user = users_collection.find_one({"roles": "admin"})
admin_id = admin_user["_id"] if admin_user else ObjectId("6a63a0a6820c4f88b36115f1")

script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
AUDIO_BASE_DIR = os.path.join(parent_dir, "conversation_audio") if os.path.basename(script_dir) == "scripts" else os.path.join(script_dir, "conversation_audio")
os.makedirs(AUDIO_BASE_DIR, exist_ok=True)

TOPICS_DATA = [
    {
        "name": "shopping",
        "description": "Mua sắm quần áo, phụ kiện và đổi trả hàng",
        "icon": "🛍️",
        "color": "#4ECDC4",
        "order": 1,
        "isActive": True
    },
    {
        "name": "airport",
        "description": "Thủ tục check-in sân bay, chuyến bay và hành lý",
        "icon": "🛫",
        "color": "#3498DB",
        "order": 2,
        "isActive": True
    },
    {
        "name": "hotel",
        "description": "Đặt phòng khách sạn, nhận phòng và dịch vụ lưu trú",
        "icon": "🏨",
        "color": "#E67E22",
        "order": 3,
        "isActive": True
    },
    {
        "name": "coffee_shop",
        "description": "Gọi đồ uống, bánh ngọt và trò chuyện tại quán cà phê",
        "icon": "☕",
        "color": "#8D6E63",
        "order": 4,
        "isActive": True
    },
    {
        "name": "health",
        "description": "Khám sức khỏe, mô tả triệu chứng và mua thuốc",
        "icon": "🏥",
        "color": "#E74C3C",
        "order": 5,
        "isActive": True
    },
    {
        "name": "workplace",
        "description": "Giao tiếp công sở, họp nhóm và thảo luận dự án",
        "icon": "💼",
        "color": "#455A64",
        "order": 6,
        "isActive": True
    },
    {
        "name": "technology",
        "description": "Thiết bị điện tử, phần mềm và hỗ trợ kỹ thuật",
        "icon": "💻",
        "color": "#9B59B6",
        "order": 7,
        "isActive": True
    },
    {
        "name": "daily_life",
        "description": "Hỏi đường, sinh hoạt hàng ngày và cuộc sống thường nhật",
        "icon": "🏠",
        "color": "#27AE60",
        "order": 8,
        "isActive": True
    },
    {
        "name": "hobbies",
        "description": "Sở thích âm nhạc, phim ảnh và các hoạt động giải trí",
        "icon": "🎨",
        "color": "#F39C12",
        "order": 9,
        "isActive": True
    },
    {
        "name": "banking",
        "description": "Mở tài khoản, rút tiền và dịch vụ tài chính ngân hàng",
        "icon": "🏦",
        "color": "#00897B",
        "order": 10,
        "isActive": True
    },
    {
        "name": "restaurant",
        "description": "Gọi món ăn, thanh toán hóa đơn và trải nghiệm ẩm thực",
        "icon": "🍽️",
        "color": "#FF6B6B",
        "order": 11,
        "isActive": True
    },
    {
        "name": "job_interview",
        "description": "Phỏng vấn xin việc và trả lời câu hỏi nghề nghiệp",
        "icon": "💼",
        "color": "#45B7D1",
        "order": 12,
        "isActive": True
    },
    {
        "name": "travel",
        "description": "Du lịch, tham quan danh lam thắng cảnh và khám phá",
        "icon": "✈️",
        "color": "#FFA07A",
        "order": 13,
        "isActive": True
    }
]

CONVERSATIONS_DATA = [
    # 1. SHOPPING
    {
        "title": "Mua sắm quần áo tại cửa hàng thời trang",
        "description": "Hội thoại cơ bản khi hỏi mua áo sơ mi, thử đồ và thanh toán tại quầy.",
        "topic": "shopping",
        "level": "beginner",
        "duration": 3,
        "tags": ["shopping", "clothes", "store", "beginner"],
        "difficulty": 1,
        "participants": [
            {"id": "A", "name": "Clerk (Nhân viên)"},
            {"id": "B", "name": "Customer (Khách hàng)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Clerk", "content": "Hello! Welcome to our store. How can I help you today?", "translation": "Xin chào! Chào mừng quý khách đến cửa hàng. Tôi có thể giúp gì cho bạn hôm nay?"},
            {"speaker": "B", "speakerName": "Customer", "content": "Hi! I am looking for a blue casual shirt in medium size.", "translation": "Chào bạn! Tôi đang tìm một chiếc áo sơ mi xanh phong cách thường ngày cỡ vừa."},
            {"speaker": "A", "speakerName": "Clerk", "content": "Sure! Here is our newest collection. Would you like to try it on?", "translation": "Chắc chắn rồi! Đây là bộ sưu tập mới nhất. Bạn có muốn thử áo không?"},
            {"speaker": "B", "speakerName": "Customer", "content": "Yes, please. Where is the fitting room located?", "translation": "Vâng, làm ơn. Phòng thử đồ ở vị trí nào vậy bạn?"},
            {"speaker": "A", "speakerName": "Clerk", "content": "The fitting rooms are right over there on your left.", "translation": "Các phòng thử đồ ở ngay phía đằng kia bên tay trái của bạn nhé."},
            {"speaker": "B", "speakerName": "Customer", "content": "Thank you! It fits perfectly. I will take this one.", "translation": "Cảm ơn bạn! Áo vừa vặn hoàn hảo. Tôi sẽ lấy chiếc này."}
        ]
    },
    {
        "title": "Đổi trả hàng và yêu cầu hoàn tiền",
        "description": "Hội thoại trung cấp khi đổi sản phẩm bị lỗi và yêu cầu hoàn lại tiền thanh toán.",
        "topic": "shopping",
        "level": "intermediate",
        "duration": 4,
        "tags": ["shopping", "refund", "return", "customer-service"],
        "difficulty": 2,
        "participants": [
            {"id": "A", "name": "Cashier (Thu ngân)"},
            {"id": "B", "name": "Customer (Khách hàng)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Cashier", "content": "Good morning! How may I assist you at customer service today?", "translation": "Chào buổi sáng! Tôi có thể hỗ trợ gì cho quý khách tại quầy dịch vụ hôm nay?"},
            {"speaker": "B", "speakerName": "Customer", "content": "Good morning. I bought this jacket yesterday, but the zipper is completely broken.", "translation": "Chào bạn. Tôi đã mua chiếc áo khoác này hôm qua, nhưng dây kéo khóa bị hỏng hoàn toàn."},
            {"speaker": "A", "speakerName": "Cashier", "content": "I am so sorry about that inconvenience. Do you have the purchase receipt with you?", "translation": "Tôi rất xin lỗi vì sự bất tiện này. Quý khách có mang theo hóa đơn mua hàng không ạ?"},
            {"speaker": "B", "speakerName": "Customer", "content": "Yes, here is my receipt. I would prefer a full refund if possible.", "translation": "Có, đây là hóa đơn của tôi. Tôi muốn nhận lại tiền hoàn trả đầy đủ nếu được."},
            {"speaker": "A", "speakerName": "Cashier", "content": "Certainly. Since it has a manufacturing defect, I will process the refund to your credit card immediately.", "translation": "Chắc chắn rồi. Vì sản phẩm bị lỗi từ nhà sản xuất, tôi sẽ tiến hành hoàn tiền vào thẻ tín dụng của bạn ngay lập tức."},
            {"speaker": "B", "speakerName": "Customer", "content": "I really appreciate your quick and helpful assistance. Thank you very much!", "translation": "Tôi rất trân trọng sự hỗ trợ nhanh chóng và tận tình của bạn. Cảm ơn bạn rất nhiều!"}
        ]
    },

    # 2. AIRPORT & FLIGHT
    {
        "title": "Thủ tục Check-in tại sân bay quốc tế",
        "description": "Hội thoại cơ bản khi xuất trình hộ chiếu, cân hành lý và nhận thẻ lên máy bay.",
        "topic": "airport",
        "level": "beginner",
        "duration": 3,
        "tags": ["airport", "flight", "travel", "check-in"],
        "difficulty": 1,
        "participants": [
            {"id": "A", "name": "Agent (Nhân viên sân bay)"},
            {"id": "B", "name": "Passenger (Hành khách)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Agent", "content": "Good afternoon! May I see your passport and flight ticket, please?", "translation": "Chào buổi chiều! Tôi có thể xem hộ chiếu và vé máy bay của quý khách được không?"},
            {"speaker": "B", "speakerName": "Passenger", "content": "Here you go. I am traveling on flight VN302 to Singapore.", "translation": "Đây thưa bạn. Tôi bay trên chuyến bay VN302 đi Singapore."},
            {"speaker": "A", "speakerName": "Agent", "content": "Thank you. Do you have any check-in baggage or only carry-on items?", "translation": "Cảm ơn quý khách. Bạn có hành lý ký gửi nào không hay chỉ có đồ xách tay?"},
            {"speaker": "B", "speakerName": "Passenger", "content": "I have one suitcase to check in, and this small backpack with me.", "translation": "Tôi có một vali để ký gửi, và một chiếc ba lô nhỏ này mang theo người."},
            {"speaker": "A", "speakerName": "Agent", "content": "Please place your suitcase on the scale. Your weight is within the allowed limit.", "translation": "Xin vui lòng đặt vali lên bàn cân. Cân nặng của bạn nằm trong giới hạn cho phép."},
            {"speaker": "B", "speakerName": "Passenger", "content": "That is great! What time will boarding begin at the gate?", "translation": "Thật tuyệt! Mấy giờ thì bắt đầu lên máy bay tại cửa khởi hành vậy bạn?"}
        ]
    },
    {
        "title": "Xử lý hành lý thất lạc tại quầy dịch vụ sân bay",
        "description": "Hội thoại trung cấp khi báo cáo hành lý không xuất hiện trên băng chuyền sau chuyến bay.",
        "topic": "airport",
        "level": "intermediate",
        "duration": 4,
        "tags": ["airport", "lost-luggage", "travel", "intermediate"],
        "difficulty": 2,
        "participants": [
            {"id": "A", "name": "Officer (Nhân viên hành lý)"},
            {"id": "B", "name": "Passenger (Hành khách)"}
        ],
        "lines": [
            {"speaker": "B", "speakerName": "Passenger", "content": "Excuse me, all the luggage from carousel 4 has been cleared, but my black suitcase never arrived.", "translation": "Xin lỗi bạn, tất cả hành lý từ băng chuyền số 4 đã lấy hết rồi, nhưng chiếc vali màu đen của tôi vẫn chưa thấy tới."},
            {"speaker": "A", "speakerName": "Officer", "content": "Do not worry, sir. Could you please provide your baggage claim tag and boarding pass?", "translation": "Xin đừng lo lắng thưa quý khách. Bạn có thể vui lòng cung cấp thẻ gửi hành lý và thẻ lên máy bay không?"},
            {"speaker": "B", "speakerName": "Passenger", "content": "Here they are. It is a large Samsonite hardshell suitcase with a red ribbon attached.", "translation": "Chúng đây ạ. Đó là một chiếc vali vỏ cứng Samsonite lớn có buộc một dải ruy băng màu đỏ."},
            {"speaker": "A", "speakerName": "Officer", "content": "I just checked the tracking system. Your bag was accidentally delayed in Tokyo and will arrive on the next flight tonight.", "translation": "Tôi vừa kiểm tra hệ thống theo dõi. Vali của bạn vô tình bị trễ ở Tokyo và sẽ đến vào chuyến bay tiếp theo tối nay."},
            {"speaker": "B", "speakerName": "Passenger", "content": "I am staying at the Grand Hotel downtown. Can you deliver it directly to my room?", "translation": "Tôi đang ở khách sạn Grand Hotel trung tâm thành phố. Bạn có thể giao nó trực tiếp đến phòng tôi được không?"},
            {"speaker": "A", "speakerName": "Officer", "content": "Yes, absolutely! We will provide free courier delivery straight to your hotel door before 9 AM tomorrow.", "translation": "Vâng, chắc chắn rồi! Chúng tôi sẽ chuyển phát nhanh miễn phí thẳng đến cửa khách sạn của bạn trước 9 giờ sáng mai."}
        ]
    },

    # 3. HOTEL & ACCOMMODATION
    {
        "title": "Nhận phòng và hỏi tiện ích khách sạn",
        "description": "Hội thoại cơ bản khi check-in tại khách sạn, nhận chìa khóa và hỏi mật khẩu Wifi.",
        "topic": "hotel",
        "level": "beginner",
        "duration": 3,
        "tags": ["hotel", "check-in", "hospitality", "beginner"],
        "difficulty": 1,
        "participants": [
            {"id": "A", "name": "Receptionist (Lễ tân)"},
            {"id": "B", "name": "Guest (Khách lưu trú)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Receptionist", "content": "Welcome to Sunrise Hotel! Do you have a reservation with us?", "translation": "Chào mừng quý khách đến với Sunrise Hotel! Quý khách đã đặt phòng trước với chúng tôi chưa ạ?"},
            {"speaker": "B", "speakerName": "Guest", "content": "Yes, I booked a deluxe double room under the name David Miller.", "translation": "Vâng, tôi đã đặt một phòng đôi cao cấp dưới tên David Miller."},
            {"speaker": "A", "speakerName": "Receptionist", "content": "Yes, Mr. Miller. Your room 508 is ready on the fifth floor. Here is your keycard.", "translation": "Vâng, anh Miller. Phòng 508 của anh trên tầng 5 đã sẵn sàng. Đây là thẻ từ mở phòng của anh."},
            {"speaker": "B", "speakerName": "Guest", "content": "Thank you. Is breakfast included in the booking?", "translation": "Cảm ơn bạn. Bữa sáng có được bao gồm trong gói đặt phòng không?"},
            {"speaker": "A", "speakerName": "Receptionist", "content": "Yes, buffet breakfast is served every morning from 6:30 to 10:00 AM in the main restaurant.", "translation": "Vâng, bữa sáng buffet được phục vụ mỗi sáng từ 6:30 đến 10:00 tại nhà hàng chính."},
            {"speaker": "B", "speakerName": "Guest", "content": "Wonderful! Could you also let me know the high-speed Wifi password?", "translation": "Tuyệt vời! Bạn cũng có thể cho tôi biết mật khẩu Wifi tốc độ cao được không?"}
        ]
    },
    {
        "title": "Yêu cầu đổi phòng khách sạn do tiếng ồn",
        "description": "Hội thoại trung cấp khi yêu cầu lễ tân đổi sang phòng yên tĩnh hơn.",
        "topic": "hotel",
        "level": "intermediate",
        "duration": 4,
        "tags": ["hotel", "room-change", "service", "intermediate"],
        "difficulty": 2,
        "participants": [
            {"id": "A", "name": "Front Desk (Quầy lễ tân)"},
            {"id": "B", "name": "Guest (Khách lưu trú)"}
        ],
        "lines": [
            {"speaker": "B", "speakerName": "Guest", "content": "Hello, I am staying in room 304, and there is extremely loud construction noise right next door.", "translation": "Xin chào, tôi đang ở phòng 304, và có tiếng ồn thi công xây dựng cực kỳ to ngay bên cạnh phòng."},
            {"speaker": "A", "speakerName": "Front Desk", "content": "We sincerely apologize for the disturbance. Let me check our availability immediately.", "translation": "Chúng tôi chân thành xin lỗi vì sự làm phiền này. Để tôi kiểm tra phòng trống ngay lập tức ạ."},
            {"speaker": "B", "speakerName": "Guest", "content": "I have important online business meetings tonight, so I really need a very quiet environment.", "translation": "Tối nay tôi có các cuộc họp công việc trực tuyến quan trọng, nên tôi thực sự cần một không gian thật yên tĩnh."},
            {"speaker": "A", "speakerName": "Front Desk", "content": "We have an executive room available on the 9th floor facing the garden side. Would that suit your needs?", "translation": "Chúng tôi có một phòng executive còn trống trên tầng 9 hướng nhìn ra phía vườn. Phòng đó có phù hợp với nhu cầu của quý khách không ạ?"},
            {"speaker": "B", "speakerName": "Guest", "content": "That sounds perfect. Will there be any extra charge for this upgrade?", "translation": "Nghe tuyệt đấy. Có tính thêm phụ phí nào cho việc nâng cấp phòng này không bạn?"},
            {"speaker": "A", "speakerName": "Front Desk", "content": "No extra charge at all. It is our complimentary upgrade to ensure you enjoy a pleasant stay.", "translation": "Hoàn toàn không có phụ phí nào ạ. Đây là sự nâng cấp miễn phí từ khách sạn để đảm bảo quý khách có kỳ nghỉ thoải mái nhất."}
        ]
    },

    # 4. COFFEE SHOP
    {
        "title": "Gọi cà phê và bánh ngọt tại quầy",
        "description": "Hội thoại cơ bản khi gọi cà phê Latte, tùy chỉnh đường sữa và mua kèm bánh ngọt.",
        "topic": "coffee_shop",
        "level": "beginner",
        "duration": 3,
        "tags": ["coffee", "cafe", "drinks", "beginner"],
        "difficulty": 1,
        "participants": [
            {"id": "A", "name": "Barista (Nhân viên pha chế)"},
            {"id": "B", "name": "Customer (Khách hàng)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Barista", "content": "Hi there! What can I get started for you today?", "translation": "Xin chào! Tôi có thể lấy món đồ uống gì cho bạn hôm nay nào?"},
            {"speaker": "B", "speakerName": "Customer", "content": "Hi! Can I please get an iced caramel latte with oat milk?", "translation": "Chào bạn! Cho tôi một ly caramel latte đá dùng sữa yến mạch được không?"},
            {"speaker": "A", "speakerName": "Barista", "content": "Of course! What size would you like: small, medium, or large?", "translation": "Dĩ nhiên rồi! Bạn muốn chọn kích cỡ nào: nhỏ, vừa hay lớn?"},
            {"speaker": "B", "speakerName": "Customer", "content": "A medium size, please. And could you make it less sweet with half sugar?", "translation": "Một ly cỡ vừa nhé. Và bạn làm ít ngọt giúp tôi với nửa lượng đường được không?"},
            {"speaker": "A", "speakerName": "Barista", "content": "Got it: medium iced caramel latte, oat milk, half sweet. Would you like any warm pastries to go with that?", "translation": "Đã ghi nhận: latte caramel đá cỡ vừa, sữa yến mạch, nửa đường. Bạn có muốn dùng kèm bánh ngọt nóng hổi nào không?"},
            {"speaker": "B", "speakerName": "Customer", "content": "Yes, I will also take one fresh butter croissant, please.", "translation": "Có, cho tôi lấy thêm một chiếc bánh sừng bò bơ tươi nữa nhé."}
        ]
    },
    {
        "title": "Gặp gỡ bạn bè và trò chuyện cuối tuần tại quán cà phê",
        "description": "Hội thoại trung cấp giữa hai người bạn thân tán gẫu về công việc và cuộc sống.",
        "topic": "coffee_shop",
        "level": "intermediate",
        "duration": 4,
        "tags": ["coffee", "friends", "weekend", "conversation"],
        "difficulty": 2,
        "participants": [
            {"id": "A", "name": "Sarah (Bạn nữ)"},
            {"id": "B", "name": "Lucas (Bạn nam)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Sarah", "content": "Hey Lucas! Long time no see. How have you been holding up lately?", "translation": "Chào Lucas! Lâu lắm không gặp. Dạo gần đây cuộc sống bạn thế nào rồi?"},
            {"speaker": "B", "speakerName": "Lucas", "content": "Hey Sarah! I have been super busy with my new software engineering project, but everything is going well.", "translation": "Chào Sarah! Mình bận túi bụi với dự án kỹ thuật phần mềm mới, nhưng mọi thứ đều đang tiến triển rất tốt."},
            {"speaker": "A", "speakerName": "Sarah", "content": "That is awesome to hear! Are you still working remotely from home most of the week?", "translation": "Thật tuyệt khi nghe vậy! Bạn vẫn đang làm việc từ xa tại nhà hầu hết các ngày trong tuần chứ?"},
            {"speaker": "B", "speakerName": "Lucas", "content": "Yes, our team follows a hybrid model. It saves me so much commuting time every single morning.", "translation": "Đúng vậy, công ty mình áp dụng mô hình kết hợp. Điều đó giúp mình tiết kiệm bao nhiêu thời gian đi lại mỗi buổi sáng."},
            {"speaker": "A", "speakerName": "Sarah", "content": "I completely agree. What are your relaxing plans for this upcoming sunny weekend?", "translation": "Mình hoàn toàn đồng ý. Bạn có kế hoạch thư giãn gì cho dịp cuối tuần ngập nắng sắp tới chưa?"},
            {"speaker": "B", "speakerName": "Lucas", "content": "I am thinking about going on a light mountain hike and taking some nature photos. Would you like to join?", "translation": "Mình đang định đi leo núi nhẹ nhàng và chụp vài bức ảnh thiên nhiên. Bạn có muốn tham gia cùng không?"}
        ]
    },

    # 5. HOSPITAL & HEALTH
    {
        "title": "Khám bệnh và mô tả triệu chứng cảm sốt",
        "description": "Hội thoại cơ bản khi gặp bác sĩ để mô tả triệu chứng sốt, đau họng và mệt mỏi.",
        "topic": "health",
        "level": "beginner",
        "duration": 3,
        "tags": ["health", "doctor", "symptoms", "hospital"],
        "difficulty": 1,
        "participants": [
            {"id": "A", "name": "Doctor (Bác sĩ)"},
            {"id": "B", "name": "Patient (Bệnh nhân)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Doctor", "content": "Good morning! What seems to be the problem today?", "translation": "Chào buổi sáng! Hôm nay bạn cảm thấy trong người có vấn đề gì vậy?"},
            {"speaker": "B", "speakerName": "Patient", "content": "Doctor, I have had a severe sore throat and a high fever since yesterday evening.", "translation": "Thưa bác sĩ, tôi bị đau họng dữ dội và sốt cao từ tối hôm qua đến giờ."},
            {"speaker": "A", "speakerName": "Doctor", "content": "Let me take your body temperature and check your throat with a light.", "translation": "Để tôi đo nhiệt độ cơ thể và kiểm tra cổ họng của bạn bằng đèn soi nhé."},
            {"speaker": "B", "speakerName": "Patient", "content": "I also feel very dizzy and have muscle aches all over my body.", "translation": "Tôi cũng cảm thấy rất chóng mặt và bị đau nhức cơ bắp khắp cả người."},
            {"speaker": "A", "speakerName": "Doctor", "content": "Your temperature is 38.5 degrees. It looks like a standard seasonal viral infection.", "translation": "Nhiệt độ của bạn là 38.5 độ C. Có vẻ như bạn bị nhiễm virus cúm theo mùa thông thường."},
            {"speaker": "B", "speakerName": "Patient", "content": "Should I take any medication or rest at home for a few days?", "translation": "Tôi có nên uống thuốc gì hoặc nghỉ ngơi ở nhà vài ngày không thưa bác sĩ?"}
        ]
    },
    {
        "title": "Tư vấn và mua thuốc theo đơn tại nhà thuốc",
        "description": "Hội thoại trung cấp khi trao đổi với dược sĩ về cách dùng và liều lượng thuốc.",
        "topic": "health",
        "level": "intermediate",
        "duration": 4,
        "tags": ["health", "pharmacy", "medicine", "prescription"],
        "difficulty": 2,
        "participants": [
            {"id": "A", "name": "Pharmacist (Dược sĩ)"},
            {"id": "B", "name": "Customer (Khách mua thuốc)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Pharmacist", "content": "Hello! How can I assist you with your healthcare needs today?", "translation": "Xin chào! Tôi có thể hỗ trợ gì cho nhu cầu chăm sóc sức khỏe của bạn hôm nay?"},
            {"speaker": "B", "speakerName": "Customer", "content": "Hi, I have a prescription here from my doctor for antibiotics and pain relief tablets.", "translation": "Chào bạn, tôi có một đơn thuốc ở đây từ bác sĩ gồm thuốc kháng sinh và viên giảm đau."},
            {"speaker": "A", "speakerName": "Pharmacist", "content": "Let me prepare these for you. Are you allergic to penicillin or any other medications?", "translation": "Để tôi chuẩn bị thuốc cho bạn. Bạn có bị dị ứng với penicillin hay loại thuốc nào khác không?"},
            {"speaker": "B", "speakerName": "Customer", "content": "No, I do not have any known drug allergies.", "translation": "Không, tôi không có tiền sử dị ứng với loại thuốc nào cả."},
            {"speaker": "A", "speakerName": "Pharmacist", "content": "Take one antibiotic capsule twice daily after meals, and make sure to finish the full five-day course.", "translation": "Hãy uống một viên kháng sinh hai lần mỗi ngày sau bữa ăn, và nhớ uống đủ liệu trình năm ngày nhé."},
            {"speaker": "B", "speakerName": "Customer", "content": "Understood clearly. Does this medicine cause any drowsiness during working hours?", "translation": "Tôi hiểu rõ rồi. Thuốc này có gây buồn ngủ trong giờ làm việc không bạn?"}
        ]
    },

    # 6. WORKPLACE & OFFICE
    {
        "title": "Làm quen đồng nghiệp trong ngày đầu đi làm",
        "description": "Hội thoại cơ bản khi chào hỏi đồng nghiệp mới và tìm hiểu văn hóa công ty.",
        "topic": "workplace",
        "level": "beginner",
        "duration": 3,
        "tags": ["workplace", "colleagues", "office", "beginner"],
        "difficulty": 1,
        "participants": [
            {"id": "A", "name": "Alex (Đồng nghiệp cũ)"},
            {"id": "B", "name": "Emily (Nhân viên mới)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Alex", "content": "Hi! You must be Emily, our new UX designer. Welcome to our creative team!", "translation": "Chào bạn! Bạn chắc hẳn là Emily, nhà thiết kế UX mới của chúng tôi. Chào mừng bạn gia nhập đội ngũ sáng tạo!"},
            {"speaker": "B", "speakerName": "Emily", "content": "Hi Alex! Thank you so much. I am really excited to start working here with everyone.", "translation": "Chào Alex! Cảm ơn bạn rất nhiều. Mình thực sự rất hào hứng khi bắt đầu làm việc tại đây cùng mọi người."},
            {"speaker": "A", "speakerName": "Alex", "content": "Let me show you where the coffee lounge, meeting rooms, and print stations are located.", "translation": "Để mình dẫn bạn đi xem phòng trà cà phê, các phòng họp và khu vực máy in ở đâu nhé."},
            {"speaker": "B", "speakerName": "Emily", "content": "That would be wonderful! Where is my dedicated workspace desk?", "translation": "Thế thì tuyệt vời quá! Bàn làm việc riêng của mình ở chỗ nào vậy bạn?"},
            {"speaker": "A", "speakerName": "Alex", "content": "Your desk is right next to the window over here. The dual monitor setup is all ready for you.", "translation": "Bàn làm việc của bạn ở ngay cạnh cửa sổ bên này. Bộ màn hình đôi đã được chuẩn bị sẵn sàng cho bạn rồi."},
            {"speaker": "B", "speakerName": "Emily", "content": "This view is amazing! Thanks for making me feel so welcome on my first day.", "translation": "Góc nhìn này đẹp tuyệt vời! Cảm ơn bạn đã đón tiếp mình nồng nhiệt trong ngày đầu tiên."}
        ]
    },
    {
        "title": "Thảo luận tiến độ dự án trong cuộc họp nhóm",
        "description": "Hội thoại trung cấp khi báo cáo tiến độ công việc và giải quyết vướng mắc kỹ thuật.",
        "topic": "workplace",
        "level": "intermediate",
        "duration": 4,
        "tags": ["workplace", "meeting", "project", "intermediate"],
        "difficulty": 2,
        "participants": [
            {"id": "A", "name": "Project Manager (Quản lý dự án)"},
            {"id": "B", "name": "Lead Developer (Lập trình viên chính)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Project Manager", "content": "Let us review our sprint progress. Are we still on track for the beta release next Friday?", "translation": "Chúng ta hãy cùng xem xét tiến độ sprint. Chúng ta vẫn theo đúng kế hoạch cho đợt phát hành thử nghiệm thứ Sáu tuần tới chứ?"},
            {"speaker": "B", "speakerName": "Lead Developer", "content": "We have finished 90 percent of the frontend components, but the third-party payment gateway integration has hit a minor bottleneck.", "translation": "Chúng tôi đã hoàn thành 90% các thành phần frontend, nhưng phần tích hợp cổng thanh toán bên thứ ba đang gặp một chút nghẽn cổ chai."},
            {"speaker": "A", "speakerName": "Project Manager", "content": "What seems to be causing the delay with the payment system?", "translation": "Điều gì dường như đang gây ra sự chậm trễ với hệ thống thanh toán vậy bạn?"},
            {"speaker": "B", "speakerName": "Lead Developer", "content": "Their webhook documentation was outdated, so we are updating the authentication tokens to match their latest API schema.", "translation": "Tài liệu webhook của họ bị lỗi thời, nên chúng tôi đang cập nhật lại token xác thực để khớp với lược đồ API mới nhất của họ."},
            {"speaker": "A", "speakerName": "Project Manager", "content": "Do you need any additional senior engineers assigned to assist your backend team?", "translation": "Bạn có cần bổ sung thêm kỹ sư cấp cao nào để hỗ trợ đội backend của bạn không?"},
            {"speaker": "B", "speakerName": "Lead Developer", "content": "We should be able to resolve it by tomorrow noon without affecting the overall deployment schedule.", "translation": "Chúng tôi sẽ có thể xử lý xong trước trưa mai mà không làm ảnh hưởng đến tiến độ triển khai chung."}
        ]
    },

    # 7. TECHNOLOGY & GADGETS
    {
        "title": "Tư vấn mua điện thoại thông minh mới",
        "description": "Hội thoại cơ bản khi hỏi về tính năng camera, thời lượng pin và dung lượng máy.",
        "topic": "technology",
        "level": "beginner",
        "duration": 3,
        "tags": ["technology", "smartphone", "gadgets", "beginner"],
        "difficulty": 1,
        "participants": [
            {"id": "A", "name": "Sales Tech (Nhân viên tư vấn)"},
            {"id": "B", "name": "Buyer (Khách mua hàng)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Sales Tech", "content": "Hello! Are you looking for any specific smartphone model today?", "translation": "Xin chào! Hôm nay bạn đang tìm kiếm mẫu điện thoại thông minh cụ thể nào không?"},
            {"speaker": "B", "speakerName": "Buyer", "content": "Hi! I need a phone that has an exceptional camera and long battery life.", "translation": "Chào bạn! Tôi cần một chiếc điện thoại có camera xuất sắc và thời lượng pin dùng lâu."},
            {"speaker": "A", "speakerName": "Sales Tech", "content": "I highly recommend this flagship model. It features a 200MP camera and a two-day battery.", "translation": "Tôi rất khuyến khích mẫu điện thoại cao cấp này. Nó sở hữu camera 200MP và pin dùng được hai ngày."},
            {"speaker": "B", "speakerName": "Buyer", "content": "How much internal storage does this particular model come with?", "translation": "Mẫu máy cụ thể này đi kèm với bao nhiêu dung lượng bộ nhớ trong vậy bạn?"},
            {"speaker": "A", "speakerName": "Sales Tech", "content": "It comes with 256 gigabytes of storage, which holds thousands of high-definition videos.", "translation": "Nó có 256 gigabyte bộ nhớ, chứa được hàng nghìn video độ phân giải cao."},
            {"speaker": "B", "speakerName": "Buyer", "content": "That sounds great! Does it also include a one-year international warranty?", "translation": "Nghe tuyệt quá! Sản phẩm có bao gồm bảo hành quốc tế một năm không bạn?"}
        ]
    },
    {
        "title": "Gọi hỗ trợ kỹ thuật xử lý sự cố mạng Internet",
        "description": "Hội thoại trung cấp khi gọi tổng đài IT để khắc phục đường truyền mạng bị ngắt kết nối.",
        "topic": "technology",
        "level": "intermediate",
        "duration": 4,
        "tags": ["technology", "internet", "tech-support", "intermediate"],
        "difficulty": 2,
        "participants": [
            {"id": "A", "name": "IT Support (Kỹ thuật viên IT)"},
            {"id": "B", "name": "User (Người dùng)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "IT Support", "content": "Thank you for calling Technical Support. My name is Kevin. How may I help you?", "translation": "Cảm ơn quý khách đã gọi đến bộ phận Hỗ trợ Kỹ thuật. Tôi tên là Kevin. Tôi có thể giúp gì cho bạn?"},
            {"speaker": "B", "speakerName": "User", "content": "Hi Kevin, our office fiber internet has been dropping connections every ten minutes since this morning.", "translation": "Chào Kevin, mạng cáp quang văn phòng tôi liên tục bị ngắt kết nối cứ mỗi 10 phút một lần từ sáng nay."},
            {"speaker": "A", "speakerName": "IT Support", "content": "I understand how frustrating that is. Have you tried power cycling the main modem and router yet?", "translation": "Tôi hiểu điều đó gây khó chịu thế nào. Bạn đã thử tắt nguồn và khởi động lại modem chính cùng router chưa?"},
            {"speaker": "B", "speakerName": "User", "content": "Yes, we rebooted both devices, but the WAN status LED is still blinking red intermittently.", "translation": "Rồi, chúng tôi đã khởi động lại cả hai thiết bị, nhưng đèn LED trạng thái mạng WAN vẫn thỉnh thoảng nhấp nháy đỏ."},
            {"speaker": "A", "speakerName": "IT Support", "content": "Let me run a remote diagnostic on your optical line. I see some packet loss detected on the local node.", "translation": "Để tôi chạy chẩn đoán từ xa trên đường cáp quang của bạn. Tôi thấy có hiện tượng mất gói tin trên trạm phát khu vực."},
            {"speaker": "B", "speakerName": "User", "content": "Can you dispatch a field technician to replace the faulty optical cable today?", "translation": "Bạn có thể cử kỹ thuật viên hiện trường đến thay cáp quang bị lỗi trong ngày hôm nay được không?"}
        ]
    },

    # 8. DAILY LIFE & LIVING
    {
        "title": "Hỏi đường đến ga tàu điện ngầm gần nhất",
        "description": "Hội thoại cơ bản khi hỏi đường, rẽ trái phải và xác định khoảng cách đi bộ.",
        "topic": "daily_life",
        "level": "beginner",
        "duration": 3,
        "tags": ["daily_life", "directions", "city", "beginner"],
        "difficulty": 1,
        "participants": [
            {"id": "A", "name": "Pedestrian (Người đi đường)"},
            {"id": "B", "name": "Tourist (Khách du lịch)"}
        ],
        "lines": [
            {"speaker": "B", "speakerName": "Tourist", "content": "Excuse me! Could you tell me how to get to the nearest metro subway station?", "translation": "Xin lỗi bạn! Bạn có thể chỉ cho tôi đường đến ga tàu điện ngầm gần nhất được không?"},
            {"speaker": "A", "speakerName": "Pedestrian", "content": "Sure! Walk straight down this street for two blocks until you see a large pharmacy.", "translation": "Chắc chắn rồi! Bạn cứ đi thẳng đường này qua hai dãy nhà cho đến khi thấy một hiệu thuốc lớn."},
            {"speaker": "B", "speakerName": "Tourist", "content": "Do I need to turn left or right at that pharmacy corner?", "translation": "Tôi cần rẽ trái hay rẽ phải tại góc hiệu thuốc đó vậy bạn?"},
            {"speaker": "A", "speakerName": "Pedestrian", "content": "Turn left at the intersection, and the subway entrance will be right in front of you.", "translation": "Bạn rẽ trái tại ngã tư đó, lối vào ga tàu điện ngầm sẽ nằm ngay trước mặt bạn luôn."},
            {"speaker": "B", "speakerName": "Tourist", "content": "How many minutes does it take to walk there from here?", "translation": "Mất khoảng bao nhiêu phút đi bộ từ đây tới đó vậy bạn?"},
            {"speaker": "A", "speakerName": "Pedestrian", "content": "It is only about a five-minute walk. Have a safe trip!", "translation": "Chỉ mất khoảng 5 phút đi bộ thôi. Chúc bạn có chuyến đi an toàn nhé!"}
        ]
    },
    {
        "title": "Phân chia việc nhà với bạn cùng phòng",
        "description": "Hội thoại trung cấp khi thỏa thuận lịch dọn dẹp, nấu ăn và đổ rác trong căn hộ.",
        "topic": "daily_life",
        "level": "intermediate",
        "duration": 4,
        "tags": ["daily_life", "roommates", "chores", "living"],
        "difficulty": 2,
        "participants": [
            {"id": "A", "name": "Jessica (Bạn cùng phòng 1)"},
            {"id": "B", "name": "Daniel (Bạn cùng phòng 2)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Jessica", "content": "Daniel, do you have a few minutes so we can organize our weekly apartment chore schedule?", "translation": "Daniel, bạn có rảnh vài phút không để chúng ta cùng sắp xếp lại lịch làm việc nhà hàng tuần cho căn hộ nào?"},
            {"speaker": "B", "speakerName": "Daniel", "content": "Sure, Jessica! I noticed the kitchen and living room have been getting messy after our busy exams.", "translation": "Chắc chắn rồi Jessica! Mình cũng nhận thấy bếp và phòng khách dạo này hơi bừa bộn sau đợt thi cử bận rộn."},
            {"speaker": "A", "speakerName": "Jessica", "content": "How about I handle vacuuming the floors and doing the laundry on Mondays and Thursdays?", "translation": "Hay là mình phụ trách hút bụi sàn nhà và giặt giũ vào thứ Hai và thứ Năm nhé?"},
            {"speaker": "B", "speakerName": "Daniel", "content": "That works for me! In return, I will take care of washing the dishes, taking out the trash, and cleaning the bathroom.", "translation": "Hợp lý với mình đấy! Đổi lại, mình sẽ lo việc rửa bát, đổ rác và cọ rửa nhà tắm."},
            {"speaker": "A", "speakerName": "Jessica", "content": "Let us also take turns buying groceries and cooking dinner on alternating weekends.", "translation": "Chúng ta cũng nên luân phiên đi chợ mua đồ ăn và nấu bữa tối vào các dịp cuối tuần xen kẽ nhé."},
            {"speaker": "B", "speakerName": "Daniel", "content": "That sounds very fair and balanced. I will write this schedule down on the fridge whiteboard.", "translation": "Nghe rất công bằng và hợp lý. Mình sẽ viết lịch này lên bảng gắn tủ lạnh luôn."}
        ]
    },

    # 9. HOBBIES & ENTERTAINMENT
    {
        "title": "Chia sẻ về sở thích xem phim và nghe nhạc",
        "description": "Hội thoại cơ bản khi nói về các thể loại phim hành động, khoa học viễn tưởng và gu âm nhạc.",
        "topic": "hobbies",
        "level": "beginner",
        "duration": 3,
        "tags": ["hobbies", "movies", "music", "beginner"],
        "difficulty": 1,
        "participants": [
            {"id": "A", "name": "Anna (Bạn nữ)"},
            {"id": "B", "name": "Brian (Bạn nam)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Anna", "content": "Brian, what kind of activities do you enjoy doing during your free time?", "translation": "Brian, bạn thích làm những hoạt động gì trong thời gian rảnh rỗi?"},
            {"speaker": "B", "speakerName": "Brian", "content": "I love watching science fiction movies and playing acoustic guitar.", "translation": "Mình thích xem các bộ phim khoa học viễn tưởng và chơi đàn guitar thùng."},
            {"speaker": "A", "speakerName": "Anna", "content": "That is so cool! What is your all-time favorite sci-fi movie?", "translation": "Thật là ngầu! Bộ phim khoa học viễn tưởng yêu thích nhất mọi thời đại của bạn là gì?"},
            {"speaker": "B", "speakerName": "Brian", "content": "I absolutely love Interstellar because the storyline and soundtrack are breathtaking.", "translation": "Mình cực kỳ thích phim Hố Đen Tử Thần vì cốt truyện và nhạc phim đẹp đến nghẹt thở."},
            {"speaker": "A", "speakerName": "Anna", "content": "I love that film too! The emotional scenes with the daughter made me cry.", "translation": "Mình cũng rất yêu thích bộ phim đó! Những cảnh đầy cảm xúc với cô con gái làm mình bật khóc luôn."},
            {"speaker": "B", "speakerName": "Brian", "content": "Do you want to come over this Saturday evening for a movie marathon?", "translation": "Thứ Bảy tuần này bạn có muốn ghé qua nhà mình xem phim liên hồi không?"}
        ]
    },
    {
        "title": "Rủ bạn bè đi xem hòa nhạc trực tiếp cuối tuần",
        "description": "Hội thoại trung cấp khi đặt mua vé xem buổi biểu diễn âm nhạc sống và hẹn giờ đón nhau.",
        "topic": "hobbies",
        "level": "intermediate",
        "duration": 4,
        "tags": ["hobbies", "concert", "music", "live-show"],
        "difficulty": 2,
        "participants": [
            {"id": "A", "name": "Chloe (Bạn nữ)"},
            {"id": "B", "name": "Ethan (Bạn nam)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Chloe", "content": "Ethan! Guess what? Our favorite indie rock band is performing live in the city stadium this Saturday!", "translation": "Ethan! Đoán xem gì này? Ban nhạc indie rock yêu thích của chúng mình sẽ biểu diễn trực tiếp ở sân vận động thành phố vào thứ Bảy này đấy!"},
            {"speaker": "B", "speakerName": "Ethan", "content": "Are you serious? I thought their world tour tickets were completely sold out months ago!", "translation": "Bạn nói thật đấy à? Mình tưởng vé lưu diễn thế giới của họ đã bán hết sạch từ mấy tháng trước rồi chứ!"},
            {"speaker": "A", "speakerName": "Chloe", "content": "My cousin works for the event organizer, and she managed to secure two VIP standing tickets for us.", "translation": "Chị họ mình làm việc cho ban tổ chức sự kiện, và chị ấy đã lấy được hai vé VIP đứng cho tụi mình đấy."},
            {"speaker": "B", "speakerName": "Ethan", "content": "That is unbelievable news! What time does the opening act start, and where should we meet?", "translation": "Đúng là tin tức khó tin! Mấy giờ thì màn biểu diễn mở màn bắt đầu, và tụi mình nên gặp nhau ở đâu?"},
            {"speaker": "A", "speakerName": "Chloe", "content": "The gates open at 6:30 PM. I can pick you up with my car around 5:45 PM so we beat the traffic.", "translation": "Cổng mở lúc 6:30 tối. Mình có thể qua đón bạn bằng ô tô vào khoảng 5:45 chiều để tránh kẹt xe nhé."},
            {"speaker": "B", "speakerName": "Ethan", "content": "Deal! Dinner is definitely on me before the show to thank you for the tickets.", "translation": "Chốt luôn! Bữa tối trước buổi diễn chắc chắn là mình bao để cảm ơn bạn vì cặp vé nhé."}
        ]
    },

    # 10. BANK & FINANCE
    {
        "title": "Mở tài khoản thanh toán và phát hành thẻ ATM",
        "description": "Hội thoại cơ bản khi đến chi nhánh ngân hàng mở tài khoản cá nhân và cài đặt ứng dụng.",
        "topic": "banking",
        "level": "beginner",
        "duration": 3,
        "tags": ["banking", "account", "finance", "beginner"],
        "difficulty": 1,
        "participants": [
            {"id": "A", "name": "Banker (Giao dịch viên)"},
            {"id": "B", "name": "Customer (Khách hàng)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Banker", "content": "Good morning! Welcome to First National Bank. How can I help you today?", "translation": "Chào buổi sáng! Chào mừng quý khách đến với First National Bank. Tôi có thể giúp gì cho bạn hôm nay?"},
            {"speaker": "B", "speakerName": "Customer", "content": "Good morning. I would like to open a new checking account and apply for a debit card.", "translation": "Chào bạn. Tôi muốn mở một tài khoản thanh toán mới và đăng ký phát hành thẻ ghi nợ."},
            {"speaker": "A", "speakerName": "Banker", "content": "Wonderful! Do you have two forms of identification and proof of address with you?", "translation": "Tuyệt vời! Bạn có mang theo hai loại giấy tờ tùy thân và giấy xác nhận địa chỉ không?"},
            {"speaker": "B", "speakerName": "Customer", "content": "Yes, I have my national ID card, passport, and a recent utility bill.", "translation": "Có, tôi có căn cước công dân, hộ chiếu và hóa đơn tiền điện nước gần đây."},
            {"speaker": "A", "speakerName": "Banker", "content": "Perfect. Please sign these application forms. We also have mobile banking app with zero monthly fees.", "translation": "Rất tốt. Xin vui lòng ký vào các mẫu đơn đăng ký này. Chúng tôi cũng có ứng dụng ngân hàng di động miễn phí duy trì hàng tháng."},
            {"speaker": "B", "speakerName": "Customer", "content": "That is very convenient. How soon will my physical debit card be ready for pickup?", "translation": "Thế thì rất tiện lợi. Khoảng bao lâu nữa thì thẻ ghi nợ cứng của tôi sẽ sẵn sàng để nhận vậy bạn?"}
        ]
    },
    {
        "title": "Tư vấn đổi ngoại tệ và chuyển tiền quốc tế",
        "description": "Hội thoại trung cấp khi hỏi về tỷ giá hối đoái, phí chuyển khoản và thời gian nhận tiền.",
        "topic": "banking",
        "level": "intermediate",
        "duration": 4,
        "tags": ["banking", "wire-transfer", "currency", "finance"],
        "difficulty": 2,
        "participants": [
            {"id": "A", "name": "Teller (Giao dịch viên ngân hàng)"},
            {"id": "B", "name": "Customer (Khách chuyển tiền)"}
        ],
        "lines": [
            {"speaker": "A", "speakerName": "Teller", "content": "Hello! How may I assist you with your international financial transactions today?", "translation": "Xin chào! Tôi có thể hỗ trợ gì cho các giao dịch tài chính quốc tế của bạn hôm nay?"},
            {"speaker": "B", "speakerName": "Customer", "content": "Hi, I need to make an international wire transfer of five thousand dollars to my daughter studying abroad in London.", "translation": "Chào bạn, tôi cần thực hiện một lệnh chuyển tiền quốc tế 5.000 đô la cho con gái tôi đang du học ở Luân Đôn."},
            {"speaker": "A", "speakerName": "Teller", "content": "Certainly. Do you have the beneficiary SWIFT code, IBAN account number, and recipient bank details?", "translation": "Chắc chắn rồi. Quý khách có mã SWIFT của người thụ hưởng, số tài khoản IBAN và chi tiết ngân hàng nhận tiền không ạ?"},
            {"speaker": "B", "speakerName": "Customer", "content": "Yes, everything is written on this official university wire instructions document.", "translation": "Có, mọi thông tin đều được ghi trên tài liệu hướng dẫn chuyển khoản chính thức từ trường đại học này."},
            {"speaker": "A", "speakerName": "Teller", "content": "The current exchange rate is 1.28 US dollars per British pound, with a flat fifteen-dollar international wire fee.", "translation": "Tỷ giá hiện tại là 1.28 USD đổi 1 Bảng Anh, với phí chuyển khoản quốc tế cố định là 15 USD."},
            {"speaker": "B", "speakerName": "Customer", "content": "That rate is very reasonable. When will the funds successfully settle in her overseas account?", "translation": "Tỷ giá đó rất hợp lý. Khi nào thì số tiền sẽ về đến tài khoản của cháu ở nước ngoài vậy bạn?"}
        ]
    }
]

async def generate_audio_for_line(text: str, voice: str, output_path: str):
    """Generate audio using Edge-TTS with natural human neural voices"""
    try:
        communicate = edge_tts.Communicate(text=text, voice=voice)
        await communicate.save(output_path)
        file_size = os.path.getsize(output_path)
        duration = round(file_size / 16384, 2)  # Approx mp3 bitrate duration
        return True, file_size, duration
    except Exception as e:
        print(f"Error generating audio for '{text}': {e}")
        return False, 0, 0

async def seed_data():
    print("🚀 Bắt đầu quá trình nạp 10 chủ đề và 20 đoạn hội thoại kèm Voice...")

    # 1. Upsert Conversation Topics
    for topic_data in TOPICS_DATA:
        topics_collection.update_one(
            {"name": topic_data["name"]},
            {"$set": topic_data},
            upsert=True
        )
    print(f"✅ Đã cập nhật {len(TOPICS_DATA)} chủ đề trong bảng conversationtopics!")

    # 2. Process Conversations
    total_convs = len(CONVERSATIONS_DATA)
    total_audio_generated = 0

    for idx, conv_data in enumerate(CONVERSATIONS_DATA, start=1):
        title = conv_data["title"]
        print(f"\n[{idx}/{total_convs}] 🔄 Đang xử lý: '{title}' ({conv_data['topic']} - {conv_data['level']})...")

        # Check existing conversation
        existing = conversations_collection.find_one({"title": title})
        conv_id = existing["_id"] if existing else ObjectId()

        conv_folder = os.path.join(AUDIO_BASE_DIR, str(conv_id))
        os.makedirs(conv_folder, exist_ok=True)

        lines_with_ids = []
        for line_idx, line_raw in enumerate(conv_data["lines"], start=1):
            line_id = ObjectId()
            speaker = line_raw["speaker"]
            content = line_raw["content"]
            translation = line_raw["translation"]
            speaker_name = line_raw["speakerName"]

            # Select voice: Speaker A (Female) -> en-US-JennyNeural, Speaker B (Male) -> en-US-GuyNeural
            voice_model = "en-US-JennyNeural" if speaker == "A" else "en-US-GuyNeural"
            filename = f"line_{line_idx}_{str(line_id)}.mp3"
            output_path = os.path.join(conv_folder, filename)

            # Generate voice
            success, file_size, duration = await generate_audio_for_line(content, voice_model, output_path)
            if success:
                total_audio_generated += 1

            line_doc = {
                "_id": line_id,
                "speaker": speaker,
                "speakerName": speaker_name,
                "content": content,
                "translation": translation,
                "audioUrl": f"/audio/{str(conv_id)}/{filename}",
                "audioStatus": "completed" if success else "failed",
                "audioMetadata": {
                    "duration": duration,
                    "fileSize": file_size,
                    "format": "mp3",
                    "generatedAt": datetime.utcnow()
                },
                "order": line_idx
            }
            lines_with_ids.append(line_doc)

        conv_doc = {
            "_id": conv_id,
            "title": title,
            "description": conv_data["description"],
            "topic": conv_data["topic"],
            "level": conv_data["level"],
            "lines": lines_with_ids,
            "participants": conv_data["participants"],
            "totalLines": len(lines_with_ids),
            "duration": conv_data["duration"],
            "tags": conv_data["tags"],
            "isActive": True,
            "createdBy": admin_id,
            "usageCount": 0,
            "difficulty": conv_data["difficulty"],
            "audioGenerationStatus": "completed",
            "audioGenerationProgress": 100,
            "audioGeneratedAt": datetime.utcnow(),
            "voiceSettings": {
                "P1": {"provider": "edge-tts", "voice": "en-US-JennyNeural", "speed": 1.0},
                "P2": {"provider": "edge-tts", "voice": "en-US-GuyNeural", "speed": 1.0}
            },
            "updatedAt": datetime.utcnow()
        }

        if not existing:
            conv_doc["createdAt"] = datetime.utcnow()
            conversations_collection.insert_one(conv_doc)
            print(f"   ✨ Đã tạo mới conversation ID: {conv_id} ({len(lines_with_ids)} câu có voice)")
        else:
            conversations_collection.update_one({"_id": conv_id}, {"$set": conv_doc})
            print(f"   🔄 Đã cập nhật conversation ID: {conv_id} ({len(lines_with_ids)} câu có voice)")

    print(f"\n🎉 HOÀN THÀNH TẤT CẢ! Đã tạo thành công {total_convs} hội thoại với tổng cộng {total_audio_generated} file Voice chất lượng cao!")

if __name__ == "__main__":
    asyncio.run(seed_data())
