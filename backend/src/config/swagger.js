// swagger.js - Swagger JSDoc configuration

import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'OpenSite API',
    version: '2.0.0',
    description: 'API documentation for the CTL Plumbing Intelligence Platform',
  },
  servers: [
    {
      url: 'http://localhost:5001/api',
      description: 'Development server',
    },
    {
      url: 'https://app.ctlplumbingllc.com/api',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./backend/src/routes/*.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
