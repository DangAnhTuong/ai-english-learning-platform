const mongoose = require('mongoose');
const Conversation = require('./src/models/conversation');
const User = require('./src/models/userSchema');

mongoose.connect('mongodb://localhost:27017/english-learning')
  .then(async () => {
    try {
      const admin = await User.findOne({ email: 'admin@example.com' });
      if (!admin) {
        console.error("No admin found!");
        process.exit(1);
      }

      await Conversation.deleteMany({});
      
      const conversations = [
        {
          title: "Gọi món tại nhà hàng",
          description: "Luyện tập cách gọi món và giao tiếp với nhân viên phục vụ tại nhà hàng.",
          topic: "restaurant",
          level: "beginner",
          participants: [
            { id: "A", name: "Waiter" },
            { id: "B", name: "Customer" }
          ],
          lines: [
            { speaker: "A", speakerName: "Waiter", content: "Hello, are you ready to order?", translation: "Xin chào, bạn đã sẵn sàng gọi món chưa?", order: 1 },
            { speaker: "B", speakerName: "Customer", content: "Yes, I would like the grilled chicken, please.", translation: "Vâng, cho tôi món gà nướng.", order: 2 },
            { speaker: "A", speakerName: "Waiter", content: "Excellent choice. Would you like anything to drink?", translation: "Lựa chọn tuyệt vời. Bạn có muốn uống gì không?", order: 3 },
            { speaker: "B", speakerName: "Customer", content: "Just some water, thank you.", translation: "Chỉ nước lọc thôi, cảm ơn.", order: 4 }
          ],
          totalLines: 4,
          duration: 5,
          tags: ["food", "ordering", "restaurant"],
          isActive: true,
          createdBy: admin._id,
          difficulty: 1,
          audioGenerationStatus: "pending"
        },
        {
          title: "Phỏng vấn xin việc cơ bản",
          description: "Luyện tập trả lời các câu hỏi phổ biến trong một buổi phỏng vấn bằng tiếng Anh.",
          topic: "job_interview",
          level: "intermediate",
          participants: [
            { id: "A", name: "Interviewer" },
            { id: "B", name: "Candidate" }
          ],
          lines: [
            { speaker: "A", speakerName: "Interviewer", content: "Could you tell me a little bit about yourself?", translation: "Bạn có thể kể cho tôi nghe một chút về bản thân không?", order: 1 },
            { speaker: "B", speakerName: "Candidate", content: "I have been working as a software developer for three years.", translation: "Tôi đã làm lập trình viên phần mềm được ba năm.", order: 2 },
            { speaker: "A", speakerName: "Interviewer", content: "What are your greatest strengths?", translation: "Điểm mạnh lớn nhất của bạn là gì?", order: 3 },
            { speaker: "B", speakerName: "Candidate", content: "I am a quick learner and a great team player.", translation: "Tôi học hỏi nhanh và làm việc nhóm tốt.", order: 4 },
            { speaker: "A", speakerName: "Interviewer", content: "Why do you want to work for our company?", translation: "Tại sao bạn muốn làm việc cho công ty chúng tôi?", order: 5 },
            { speaker: "B", speakerName: "Candidate", content: "Because your company works on innovative technologies.", translation: "Bởi vì công ty của bạn làm việc với những công nghệ đổi mới.", order: 6 }
          ],
          totalLines: 6,
          duration: 10,
          tags: ["work", "career", "interview"],
          isActive: true,
          createdBy: admin._id,
          difficulty: 3,
          audioGenerationStatus: "pending"
        },
        {
          title: "Đặt phòng khách sạn",
          description: "Tình huống gọi điện đặt phòng khách sạn cho chuyến du lịch.",
          topic: "travel",
          level: "intermediate",
          participants: [
            { id: "A", name: "Receptionist" },
            { id: "B", name: "Traveler" }
          ],
          lines: [
            { speaker: "A", speakerName: "Receptionist", content: "Good morning, Seaside Hotel. How can I help you?", translation: "Chào buổi sáng, Khách sạn Seaside. Tôi có thể giúp gì cho bạn?", order: 1 },
            { speaker: "B", speakerName: "Traveler", content: "Hi, I'd like to book a double room for next weekend.", translation: "Chào bạn, tôi muốn đặt một phòng đôi cho cuối tuần tới.", order: 2 },
            { speaker: "A", speakerName: "Receptionist", content: "Let me check our availability. Yes, we have a room with an ocean view.", translation: "Để tôi kiểm tra xem phòng còn trống không. Vâng, chúng tôi có một phòng nhìn ra biển.", order: 3 },
            { speaker: "B", speakerName: "Traveler", content: "That sounds perfect. How much is it per night?", translation: "Tuyệt quá. Giá bao nhiêu một đêm vậy?", order: 4 },
            { speaker: "A", speakerName: "Receptionist", content: "It's $150 per night, breakfast included.", translation: "Giá là 150 đô la một đêm, bao gồm bữa sáng.", order: 5 },
            { speaker: "B", speakerName: "Traveler", content: "Great, I'll take it.", translation: "Tuyệt vời, tôi sẽ lấy phòng đó.", order: 6 }
          ],
          totalLines: 6,
          duration: 8,
          tags: ["hotel", "booking", "holiday"],
          isActive: true,
          createdBy: admin._id,
          difficulty: 2,
          audioGenerationStatus: "pending"
        }
      ];

      await Conversation.insertMany(conversations);
      console.log("Successfully seeded conversations.");
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });
