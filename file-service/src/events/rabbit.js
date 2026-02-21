const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');
const fileModel = require('../models/fileModel');
const { logger } = require('../utils/logger');

let channel = null;

const connectRabbitMQ = async () => {
    try {
        const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        const connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();

        await channel.assertExchange('user.events', 'topic', { durable: true });

        const q = await channel.assertQueue('file-service-user-events', { durable: true });
        await channel.bindQueue(q.queue, 'user.events', 'user.deleted');

        logger.info('File Service: Connected to RabbitMQ and waiting for user.deleted events.');

        channel.consume(q.queue, async (msg) => {
            if (msg.content) {
                const payload = JSON.parse(msg.content.toString());
                const userId = payload.userId;

                try {
                    logger.info({ userId }, 'Received user.deleted event');

                    // Grab all file metadata and delete from DB table
                    const deletedFiles = await fileModel.deleteFilesByUser(userId);

                    // Now physically delete each file to save disk space
                    for (const f of deletedFiles) {
                        if (f.file_path && fs.existsSync(f.file_path)) {
                            fs.unlinkSync(f.file_path);
                            logger.info({ filePath: f.file_path }, 'Physically deleted storage file');
                        }
                    }

                    channel.ack(msg);
                } catch (error) {
                    logger.error({ err: error, userId }, 'Failed to process user.deleted event');
                }
            }
        }, { noAck: false });

    } catch (error) {
        logger.error({ err: error }, 'RabbitMQ Connection Error');
        setTimeout(connectRabbitMQ, 5000);
    }
};

module.exports = {
    connectRabbitMQ
};
