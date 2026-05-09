import pino from 'pino';

const transport = pino.transport({
    targets: [
        {
            target: 'pino/file',
            options: {
                destination: './logs/app.log'
            }
        }
    ]
});

const logger = pino(transport);

export default logger;