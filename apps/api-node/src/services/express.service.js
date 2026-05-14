import express from 'express';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import indexRouter from '#routes/index.routes.js';
import authRouter from '#routes/auth.routes.js';
import usersRouter from '#routes/user.routes.js';
import messagesRouter from '#routes/message.routes.js';

import { notFound } from '#middlewares/notFound.js';
import { handleError } from '#middlewares/handleError.js';
import fs from 'fs';

const __dirname = path.resolve();

let server;

const corsOptions = {
  origin: '*',
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: true,
  optionsSuccessStatus: 204,
};

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' })

const expressService = {
  init: async () => {
    try {
      // config server
      server = express();
      server.use(logger('combined', { stream: accessLogStream }));
      server.use(express.json());
      server.use(express.urlencoded({ extended: false }));
      server.use(cookieParser());
      server.use(express.static(path.join(__dirname, 'public')));

      // add CORS
      server.use(cors(corsOptions));

      // add routes
      server.use('/', indexRouter);
      server.use('/auth', authRouter);
      server.use('/users', usersRouter);
      server.use('/messages', messagesRouter);

      // error handling middleware
      server.use(notFound);
      server.use(handleError);

      // start server
      server.listen(process.env.SERVER_PORT || 3000);
      console.log("[EXPRESS] Express initialized");
    } catch (error) {
      console.log("[EXPRESS] Error during express service initialization");
      throw error;
    }
  },
};

export default expressService;
