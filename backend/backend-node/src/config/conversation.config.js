/**
 * Conversation Configuration
 * Cấu hình số lượng câu trong hội thoại từ biến môi trường
 */

module.exports = {
    // Số lượng câu tối thiểu trong một hội thoại
    minLines: parseInt(process.env.CONVERSATION_MIN_LINES || '2', 10),
    
    // Số lượng câu tối đa trong một hội thoại
    maxLines: parseInt(process.env.CONVERSATION_MAX_LINES || '10', 10),
    
    // Số lượng người tham gia tối thiểu
    minParticipants: parseInt(process.env.CONVERSATION_MIN_PARTICIPANTS || '2', 10),
    
    // Số lượng người tham gia tối đa
    maxParticipants: parseInt(process.env.CONVERSATION_MAX_PARTICIPANTS || '5', 10)
};
