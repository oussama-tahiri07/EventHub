const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EventHub API — Documentation',
      version: '1.0.0',
      description:
        'REST API for EventHub: Management of events, participants, registrations, and dashboard analytics.',
      contact: {
        name: 'EventHub Engineering Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Serveur de Développement Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Saisissez votre JWT généré lors du login : Bearer <token>',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
