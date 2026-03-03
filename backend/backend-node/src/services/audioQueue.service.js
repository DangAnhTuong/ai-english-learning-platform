const ConversationAudioService = require('./conversationAudio.service');
const Conversation = require('../models/conversation');
const Logger = require('../utils/logger');

/**
 * Simple in-memory queue for audio generation
 * Processes jobs sequentially to avoid overwhelming the API
 */
class AudioQueueService {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = 1; // Process one at a time
        this.currentJob = null;
    }

    /**
     * Add conversation to audio generation queue
     * @param {string} conversationId - Conversation ID
     * @param {Array} lines - Lines to generate audio for (ALL participants)
     * @param {Object} voiceSettings - Voice configuration per participant { P1: {...}, P2: {...} }
     * @param {Object} participantMap - Map of participant names to IDs
     * @param {Function} onProgress - Progress callback (optional)
     * @param {Function} onComplete - Complete callback (optional)
     */
    async enqueue(conversationId, lines, voiceSettings, participantMap = null, onProgress = null, onComplete = null) {
        const job = {
            id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversationId,
            lines,
            participantMap,
            voiceSettings: voiceSettings || {},
            onProgress,
            onComplete,
            createdAt: new Date(),
            status: 'pending'
        };

        this.queue.push(job);
        Logger.info(`Audio generation job queued: ${job.id} for conversation ${conversationId}, ${lines.length} lines`);

        // Start processing if not already running
        this.processQueue();

        return job.id;
    }

    /**
     * Process queue sequentially
     */
    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const job = this.queue.shift();
            this.currentJob = job;
            job.status = 'processing';

            try {
                Logger.info(`Processing audio generation job: ${job.id}`);

                // Update conversation status
                await this.updateConversationStatus(job.conversationId, 'generating', 0);

                // Call progress callback if provided
                if (job.onProgress) {
                    job.onProgress({ status: 'generating', progress: 0 });
                }

                // Generate audio
                const result = await ConversationAudioService.generateAudio(
                    job.conversationId,
                    job.lines,
                    job.voiceSettings
                );

                if (result.success) {
                    // Update conversation with audio URLs
                    await this.updateConversationWithAudio(job.conversationId, result, job.speakerAName);

                    // Update status to completed
                    await this.updateConversationStatus(
                        job.conversationId,
                        result.failed > 0 ? 'partial' : 'completed',
                        100
                    );

                    job.status = 'completed';

                    if (job.onComplete) {
                        job.onComplete({
                            success: true,
                            status: result.failed > 0 ? 'partial' : 'completed',
                            generated: result.generated,
                            failed: result.failed
                        });
                    }

                    Logger.info(`Audio generation completed for conversation ${job.conversationId}`);
                } else {
                    throw new Error('Audio generation failed');
                }
            } catch (error) {
                Logger.error(`Audio generation job ${job.id} failed:`, error.message);

                job.status = 'failed';

                // Update conversation status
                await this.updateConversationStatus(job.conversationId, 'failed', 0);

                if (job.onComplete) {
                    job.onComplete({
                        success: false,
                        error: error.message
                    });
                }
            } finally {
                this.currentJob = null;
            }

            // Small delay between jobs to avoid overwhelming the API
            await this.sleep(500);
        }

        this.processing = false;
    }

    /**
     * Update conversation audio generation status
     */
    async updateConversationStatus(conversationId, status, progress) {
        try {
            await Conversation.updateOne(
                { _id: conversationId },
                {
                    $set: {
                        audioGenerationStatus: status,
                        audioGenerationProgress: progress,
                        ...(status === 'completed' || status === 'partial' ? { audioGeneratedAt: new Date() } : {})
                    }
                }
            );
        } catch (error) {
            Logger.error(`Failed to update conversation status:`, error.message);
        }
    }

    /**
     * Update conversation lines with audio URLs
     * @param {string} conversationId - ID conversation
     * @param {Object} result - Result from audio generation
     * @param {string} speakerAName - Name of Speaker A to filter correct lines
     */
    async updateConversationWithAudio(conversationId, result, speakerAName) {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            Logger.info(`Updating audio URLs for conversation ${conversationId}, Speaker A: "${speakerAName}"`);

            // Update each line with audio URL
            for (const [lineId, audioUrl] of Object.entries(result.audio_urls || {})) {
                const line = conversation.lines.find(l => l._id.toString() === lineId);
                if (line) {
                    line.audioUrl = audioUrl;
                    line.audioStatus = 'completed';
                    line.audioMetadata = {
                        ...line.audioMetadata,
                        ...(result.metadata && result.metadata[lineId] ? result.metadata[lineId] : {}),
                        format: 'mp3',
                        generatedAt: new Date()
                    };
                    Logger.info(`Updated line ${lineId} with audioUrl: ${audioUrl}`);
                }
            }

            // Mark failed lines (only for Speaker A lines that were attempted)
            if (result.failed_lines && Array.isArray(result.failed_lines)) {
                for (const failedLineId of result.failed_lines) {
                    const line = conversation.lines.find(l => l._id.toString() === failedLineId);
                    if (line && line.speaker === speakerAName) {
                        line.audioStatus = 'failed';
                        Logger.warn(`Marked line ${failedLineId} as failed`);
                    }
                }
            }

            await conversation.save();
            Logger.info(`Conversation ${conversationId} updated with ${Object.keys(result.audio_urls || {}).length} audio URLs`);
        } catch (error) {
            Logger.error(`Failed to update conversation with audio:`, error.message);
            throw error;
        }
    }

    /**
     * Get queue status
     */
    getStatus() {
        return {
            queueLength: this.queue.length,
            processing: this.processing,
            currentJob: this.currentJob ? {
                id: this.currentJob.id,
                conversationId: this.currentJob.conversationId,
                status: this.currentJob.status
            } : null
        };
    }

    /**
     * Get job status by conversation ID
     */
    getJobStatus(conversationId) {
        // Check current job
        if (this.currentJob && this.currentJob.conversationId === conversationId) {
            return {
                status: this.currentJob.status,
                inQueue: false,
                processing: true
            };
        }

        // Check queue
        const jobInQueue = this.queue.find(job => job.conversationId === conversationId);
        if (jobInQueue) {
            return {
                status: jobInQueue.status,
                inQueue: true,
                processing: false,
                position: this.queue.indexOf(jobInQueue) + 1
            };
        }

        return null;
    }

    /**
     * Clear completed jobs from queue (optional cleanup)
     */
    clearCompleted() {
        // In-memory queue doesn't need cleanup, but we can add this for future Redis implementation
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Singleton instance
const audioQueueService = new AudioQueueService();

module.exports = audioQueueService;
