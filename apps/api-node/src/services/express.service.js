import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '#config/swagger.js';
import logger from '#config/logger.js';

import indexRouter from '#routes/index.routes.js';
import authRouter from '#routes/auth.routes.js';
import usersRouter from '#routes/user.routes.js';
import messagesRouter from '#routes/message.routes.js';
import healthRouter from '#routes/health.routes.js';

import { notFound } from '#middlewares/notFound.js';
import { handleError } from '#middlewares/handleError.js';

const __dirname = path.resolve();

let server;

const originPort = process.env.ORIGIN;
const corsOptions = {
  origin: originPort ? `http://localhost:${originPort}` : false,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: true,
  optionsSuccessStatus: 204,
};

const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const id = req.headers['x-request-id'] || randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
});

const expressService = {
  init: async () => {
    try {
      // config server
      server = express();
      server.use(helmet());
      server.use(httpLogger);
      server.use(express.json());
      server.use(express.urlencoded({ extended: false }));
      server.use(cookieParser());
      server.use(express.static(path.join(__dirname, 'public')));

      // add CORS
      server.use(cors(corsOptions));

      // API docs
      server.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
      server.get('/docs/spec.json', (req, res) => res.json(swaggerSpec));

      // add routes
      server.use('/', indexRouter);
      server.use('/v1/auth', authRouter);
      server.use('/v1/users', usersRouter);
      server.use('/v1/messages', messagesRouter);
      server.use('/v1/health', healthRouter);

      // error handling middleware
      server.use(notFound);
      server.use(handleError);

      // start server
      server.listen(process.env.SERVER_PORT || 3000);
      logger.info("[EXPRESS] Express initialized");
    } catch (error) {
      logger.error(error, "[EXPRESS] Error during express service initialization");
      throw error;
    }
  },
};

export default expressService;
