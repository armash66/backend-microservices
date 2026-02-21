const amqp = require('amqplib');
const taskModel = require('../models/taskModel');

let channel = null;

const connectRabbitMQ = async () => {
    try {
        const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        const connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();

        // Assert the exchange to make sure it exists
        await channel.assertExchange('user.events', 'topic', { durable: true });

        // Create an exclusive queue for task service worker
        const q = await channel.assertQueue('task-service-user-events', { durable: true });

        // Bind the queue to the exchange listening only for user.deleted
        await channel.bindQueue(q.queue, 'user.events', 'user.deleted');

        console.log('Task Service: Connected to RabbitMQ and waiting for user.deleted events.');

        // Consume Messages
        channel.consume(q.queue, async (msg) => {
            if (msg.content) {
                const payload = JSON.parse(msg.content.toString());
                const userId = payload.userId;

                try {
                    console.log(`Received user.deleted event for userId: ${userId}`);
                    await taskModel.deleteTasksByUser(userId);

                    // Acknowledge the message only after successfully deleting the tasks
                    channel.ack(msg);
                } catch (error) {
                    console.error('Failed to process user.deleted event:', error);
                    // Decide whether to nack or requeue depending on failure strategy
                    // Here we won't requeue right away so it doesn't loop infinitely on hard failures
                }
            }
        }, { noAck: false }); // explicit acknowledgments

    } catch (error) {
        console.error('RabbitMQ Connection Error:', error);
        setTimeout(connectRabbitMQ, 5000);
    }
};

module.exports = {
    connectRabbitMQ
};
