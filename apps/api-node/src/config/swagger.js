import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MessageBox API',
      version: '1.0.0',
      description: 'REST API for the MessageBox messaging platform',
    },
    servers: [{ url: '/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFound: {
          description: 'Not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['password'],
          description: 'Provide username or email (at least one required)',
          properties: {
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            token: { type: 'string', description: 'Short-lived access token' },
            refreshToken: { type: 'string', description: 'Long-lived refresh token (default 7d)' },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        RefreshResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'New access token' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            deviceAddress: { type: 'string', nullable: true },
            dateCreated: { type: 'string', format: 'date-time' },
            lastLogin: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['username', 'email', 'password', 'firstName', 'lastName'],
          properties: {
            username: { type: 'string', minLength: 8, maxLength: 20 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            deviceAddress: { type: 'string', description: 'Must be a valid IP address' },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          required: ['id', 'userUpdate'],
          properties: {
            id: { type: 'integer' },
            userUpdate: {
              type: 'object',
              description: 'Fields to update (all optional)',
              properties: {
                username: { type: 'string' },
                email: { type: 'string', format: 'email' },
                password: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                deviceAddress: { type: 'string' },
              },
            },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            senderId: { type: 'integer' },
            recipientId: { type: 'integer' },
            subject: { type: 'string', nullable: true },
            body: { type: 'string', nullable: true },
            sentAt: { type: 'string', format: 'date-time' },
            senderAddress: { type: 'string', nullable: true },
            clientMessageId: { type: 'string', nullable: true },
            readAt: { type: 'string', format: 'date-time', nullable: true },
            readerAddress: { type: 'string', nullable: true },
            deletedBySender: { type: 'string', format: 'date-time', nullable: true },
            deletedByRecipient: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        MessageListResponse: {
          type: 'object',
          properties: {
            messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
        CreateMessageRequest: {
          type: 'object',
          required: ['senderId', 'recipientId'],
          properties: {
            senderId: { type: 'integer' },
            recipientId: { type: 'integer' },
            subject: { type: 'string' },
            body: { type: 'string' },
            senderAddress: { type: 'string', description: 'Must be a valid IP address' },
            clientMessageId: { type: 'string', description: 'Idempotency key; auto-generated if omitted' },
          },
        },
        ReplyRequest: {
          type: 'object',
          required: ['replyToId', 'senderId', 'recipientId'],
          properties: {
            replyToId: { type: 'integer', description: 'ID of the message being replied to' },
            senderId: { type: 'integer' },
            recipientId: { type: 'integer' },
            subject: { type: 'string' },
            body: { type: 'string' },
            senderAddress: { type: 'string' },
            clientMessageId: { type: 'string' },
          },
        },
        MessagePostResponse: {
          allOf: [
            { $ref: '#/components/schemas/Message' },
            {
              type: 'object',
              properties: {
                threadId: { type: 'integer', nullable: true },
                replyTo: { type: 'integer', nullable: true },
                idempotencyReplayed: { type: 'boolean' },
              },
            },
          ],
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export default swaggerJsdoc(options);
