const cron = require('node-cron');
const Subscription = require('../models/subscription');
const User = require('../models/userSchema');
const Logger = require('../utils/logger');

// Chạy vào lúc 00:00 mỗi ngày
const expireSubscriptionsJob = cron.schedule('0 0 * * *', async () => {
    Logger.info('Bắt đầu chạy CronJob kiểm tra gói cước hết hạn...');
    try {
        const now = new Date();
        
        // Tìm tất cả các gói đang 'active' nhưng đã quá hạn 'endDate'
        const expiredSubs = await Subscription.find({
            status: 'active',
            endDate: { $lt: now }
        });

        if (expiredSubs.length === 0) {
            Logger.info('Không có gói cước nào hết hạn hôm nay.');
            return;
        }

        Logger.info(`Tìm thấy ${expiredSubs.length} gói cước hết hạn. Đang xử lý...`);

        for (let sub of expiredSubs) {
            // 1. Chuyển trạng thái gói cước thành expired
            sub.status = 'expired';
            await sub.save();

            // 2. Gỡ gói cước khỏi User và cập nhật quyền hạn (roles) nếu cần
            await User.findByIdAndUpdate(sub.userId, {
                $unset: { activeSubscriptionId: "" }
                // Nếu muốn giáng cấp User: $pull: { roles: 'premium' } (Tuỳ logic business)
            });

            Logger.info(`Đã hạ cấp tài khoản của User ID: ${sub.userId}`);
        }

        Logger.info('CronJob kiểm tra gói cước hoàn tất.');
    } catch (error) {
        Logger.error('Lỗi khi chạy CronJob:', error);
    }
}, {
    scheduled: false // Chưa tự động chạy ngay, sẽ .start() ở server.js
});

module.exports = {
    expireSubscriptionsJob
};
