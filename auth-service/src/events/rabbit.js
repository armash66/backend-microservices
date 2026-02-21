const amqp = require('amqplib');
const { logger } = require('../utils/logger');
const { eventPublishCounter } = require('../utils/metrics');

let channel = null;

const connectRabbitMQ = async () => {
    try {
        const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        const connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();

        // Assert a durable exchange using the topic pattern
        await channel.assertExchange('user.events', 'topic', { durable: true });

        console.log('Connected to RabbitMQ user.events exchange');
    } catch (error) {
        console.error('RabbitMQ Connection Error:', error);
        // Do not crash the app immediately if Rabbit isn't up, but let it attempt to connect
        setTimeout(connectRabbitMQ, 5000);
    }
};

const publishEvent = async (routingKey, payload) => {
    if (!channel) {
        logger.error({ routingKey }, 'RabbitMQ channel not established, cannot publish event');
        return;
    }
    try {
        const message = Buffer.from(JSON.stringify(payload));
        // Persistent messages so they are saved to disk in RabbitMQ
        channel.publish('user.events', routingKey, message, { persistent: true });
        logger.info({ routingKey }, 'Published event');

        eventPublishCounter.inc({ routing_key: routingKey });
    } catch (error) {
        logger.error({ err: error, routingKey }, 'Error publishing event');
    }
};

module.exports = {
    connectRabbitMQ,
    publishEvent
};
