const amqp = require('amqplib');
const { logger } = require('../utils/logger');
const { eventPublishCounter } = require('../utils/metrics');

let channel = null;

const connectRabbitMQ = async () => {
    try {
        const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        const connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();

        await channel.assertExchange('user.events', 'topic', { durable: true });
        logger.info('Connected to RabbitMQ user.events exchange');
    } catch (error) {
        logger.warn('RabbitMQ not available at startup. Retrying in 10s... (Account deletion cascade will be disabled until connected)');
        setTimeout(connectRabbitMQ, 10000);
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

const closeRabbitMQ = async () => {
    if (channel) {
        logger.info('Closing RabbitMQ Channel.');
        await channel.close();
    }
    // We ideally should close the connection here if we stored it at module level,
    // but the node process dying cleans up TCP cleanly if channel cleanly drains in flight buffers.
};

module.exports = {
    connectRabbitMQ,
    publishEvent,
    closeRabbitMQ
};
