const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');
const fileModel = require('../models/fileModel');

let channel = null;

const connectRabbitMQ = async () => {
    try {
        const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        const connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();

        await channel.assertExchange('user.events', 'topic', { durable: true });

        const q = await channel.assertQueue('file-service-user-events', { durable: true });
        await channel.bindQueue(q.queue, 'user.events', 'user.deleted');

        console.log('File Service: Connected to RabbitMQ and waiting for user.deleted events.');

        channel.consume(q.queue, async (msg) => {
            if (msg.content) {
                const payload = JSON.parse(msg.content.toString());
                const userId = payload.userId;

                try {
                    console.log(`Received user.deleted event for userId: ${userId}`);

                    // Grab all file metadata and delete from DB table
                    const deletedFiles = await fileModel.deleteFilesByUser(userId);

                    // Now physically delete each file to save disk space
                    for (const f of deletedFiles) {
                        if (f.file_path && fs.existsSync(f.file_path)) {
                            fs.unlinkSync(f.file_path);
                            console.log(`Physically deleted storage file: ${f.file_path}`);
                        }
                    }

                    channel.ack(msg);
                } catch (error) {
                    console.error('Failed to process user.deleted event:', error);
                }
            }
        }, { noAck: false });

    } catch (error) {
        console.error('RabbitMQ Connection Error:', error);
        setTimeout(connectRabbitMQ, 5000);
    }
};

module.exports = {
    connectRabbitMQ
};
