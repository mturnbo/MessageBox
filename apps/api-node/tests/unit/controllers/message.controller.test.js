import { beforeEach, jest } from "@jest/globals";
import sinon from 'sinon';
import MessageController from '#controllers/message.controller';
import Message from '#models/message.model';
import Thread from '#models/thread.model';
import ThreadMessage from '#models/thread-messages.model';
import sequelize from '#config/database.js';

describe('MessageController', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      body: {},
      params: {},
      get: jest.fn().mockReturnValue(undefined)
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    sandbox.restore();
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should create a new message successfully', async () => {
      const mockMessageData = {
        senderId: 1,
        recipientId: 2,
        subject: 'Hello',
        body: 'Test body'
      };
      const mockCreatedMessage = {
        id: 1,
        ...mockMessageData,
        toJSON: jest.fn().mockReturnValue({ id: 1, clientMessageId: 'message-key-1', ...mockMessageData })
      };

      req.body = mockMessageData;
      req.get = jest.fn().mockReturnValue('message-key-1');
      sandbox.stub(Message, 'create').resolves(mockCreatedMessage);

      await MessageController.createMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        senderId: 1,
        recipientId: 2,
        clientMessageId: 'message-key-1',
        subject: 'Hello',
        body: 'Test body',
        replyTo: null,
        threadId: null,
        idempotencyReplayed: false
      });
    });

    it('should handle errors when creating message fails', async () => {
      req.body = {
        senderId: 1,
        recipientId: 2,
        body: 'Test'
      };
      req.get = jest.fn().mockReturnValue('message-key-2');
      sandbox.stub(Message, 'create').rejects(new Error('Database error'));

      await MessageController.createMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });

    it('should replay an existing message for a duplicate idempotency key', async () => {
      req.body = {
        senderId: 1,
        recipientId: 2,
        subject: 'Hello',
        body: 'Test body'
      };
      req.get = jest.fn().mockReturnValue('message-key-3');

      const duplicateError = new Error('duplicate');
      duplicateError.name = 'SequelizeUniqueConstraintError';

      sandbox.stub(Message, 'create').rejects(duplicateError);
      sandbox.stub(Message, 'findOne').resolves({
        id: 44,
        clientMessageId: 'message-key-3',
        senderId: 1,
        recipientId: 2,
        subject: 'Hello',
        body: 'Test body',
        toJSON: jest.fn().mockReturnValue({
          id: 44,
          clientMessageId: 'message-key-3',
          senderId: 1,
          recipientId: 2,
          subject: 'Hello',
          body: 'Test body'
        })
      });

      await MessageController.createMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: 44,
        senderId: 1,
        recipientId: 2,
        subject: 'Hello',
        body: 'Test body',
        clientMessageId: 'message-key-3',
        threadId: null,
        replyTo: null,
        idempotencyReplayed: true
      });
    });
  });

  describe('getMessageById', () => {
    it('should return a message when found', async () => {
      const mockMessage = { id: 1, subject: 'Test', body: 'Test body' };
      req.params.id = '1';

      sandbox.stub(Message, 'findByPk').resolves(mockMessage);

      await MessageController.getMessageById(req, res);

      sandbox.assert.calledWith(Message.findByPk, '1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    it('should return 404 when message not found', async () => {
      req.params.id = '999';
      sandbox.stub(Message, 'findByPk').resolves(null);

      await MessageController.getMessageById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Message not found' });
    });

    it('should handle errors when fetching message', async () => {
      req.params.id = '1';
      sandbox.stub(Message, 'findByPk').rejects(new Error('Database error'));

      await MessageController.getMessageById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });

  describe('replyToMessage', () => {
    it('should create a reply and a new thread for a top-level message', async () => {
      const parentMessage = { id: 10 };
      const replyRecord = {
        id: 11,
        senderId: 2,
        recipientId: 1,
        subject: 'Re: hello',
        body: 'reply body',
        toJSON: jest.fn().mockReturnValue({
          id: 11,
          clientMessageId: 'reply-key-1',
          senderId: 2,
          recipientId: 1,
          subject: 'Re: hello',
          body: 'reply body'
        })
      };
      const createdThread = { id: 22 };

      req.body = {
        replyToId: 10,
        senderId: 2,
        recipientId: 1,
        subject: 'Re: hello',
        body: 'reply body'
      };
      req.get = jest.fn().mockReturnValue('reply-key-1');

      sandbox.stub(sequelize, 'transaction').callsFake(async (callback) => callback({}));
      sandbox.stub(Message, 'findByPk').resolves(parentMessage);
      sandbox.stub(Thread, 'findOne').resolves(null);
      sandbox.stub(ThreadMessage, 'findOne').resolves(null);
      sandbox.stub(Thread, 'create').resolves(createdThread);
      sandbox.stub(Message, 'create').resolves(replyRecord);
      const threadMessageCreate = sandbox.stub(ThreadMessage, 'create').resolves({});

      await MessageController.replyToMessage(req, res);

      sandbox.assert.calledWith(Thread.create, { originMsg: 10 }, { transaction: {} });
      sandbox.assert.calledWith(
        threadMessageCreate,
        { threadId: 22, msgId: 11, replyTo: 10 },
        { transaction: {} }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 11,
        clientMessageId: 'reply-key-1',
        senderId: 2,
        recipientId: 1,
        subject: 'Re: hello',
        body: 'reply body',
        threadId: 22,
        replyTo: 10,
        idempotencyReplayed: false
      });
    });

    it('should attach a reply to an existing thread', async () => {
      const parentMessage = { id: 14 };
      const existingThread = { id: 30, originMsg: 10 };
      const replyRecord = {
        id: 15,
        toJSON: jest.fn().mockReturnValue({ id: 15, clientMessageId: 'reply-key-2', body: 'nested reply' })
      };

      req.body = {
        replyToId: 14,
        senderId: 2,
        recipientId: 1,
        body: 'nested reply'
      };
      req.get = jest.fn().mockReturnValue('reply-key-2');

      sandbox.stub(sequelize, 'transaction').callsFake(async (callback) => callback({}));
      sandbox.stub(Message, 'findByPk').onFirstCall().resolves(parentMessage);
      sandbox.stub(Thread, 'findOne').resolves(null);
      sandbox.stub(ThreadMessage, 'findOne').resolves({ threadId: 30, msgId: 14, replyTo: 10 });
      sandbox.stub(Thread, 'findByPk').resolves(existingThread);
      sandbox.stub(Thread, 'create').resolves({ id: 999 });
      sandbox.stub(Message, 'create').resolves(replyRecord);
      const threadMessageCreate = sandbox.stub(ThreadMessage, 'create').resolves({});

      await MessageController.replyToMessage(req, res);

      expect(Thread.create.called).toBe(false);
      sandbox.assert.calledWith(
        threadMessageCreate,
        { threadId: 30, msgId: 15, replyTo: 14 },
        { transaction: {} }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 15,
        clientMessageId: 'reply-key-2',
        body: 'nested reply',
        threadId: 30,
        replyTo: 14,
        idempotencyReplayed: false
      });
    });

    it('should return 404 when replying to a missing message', async () => {
      req.body = { replyToId: 999, body: 'reply body' };
      req.get = jest.fn().mockReturnValue('reply-key-3');

      sandbox.stub(sequelize, 'transaction').callsFake(async (callback) => callback({}));
      sandbox.stub(Message, 'findByPk').resolves(null);

      await MessageController.replyToMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Message not found' });
    });

    it('should replay the original reply for a duplicate idempotency key', async () => {
      req.body = {
        replyToId: 10,
        senderId: 2,
        recipientId: 1,
        body: 'reply body'
      };
      req.get = jest.fn().mockReturnValue('reply-key-4');

      const duplicateError = new Error('duplicate');
      duplicateError.name = 'SequelizeUniqueConstraintError';

      sandbox.stub(sequelize, 'transaction').rejects(duplicateError);
      sandbox.stub(Message, 'findOne').resolves({
        id: 55,
        clientMessageId: 'reply-key-4',
        senderId: 2,
        recipientId: 1,
        body: 'reply body',
        toJSON: jest.fn().mockReturnValue({
          id: 55,
          clientMessageId: 'reply-key-4',
          senderId: 2,
          recipientId: 1,
          body: 'reply body'
        })
      });
      sandbox.stub(Thread, 'findOne').resolves(null);
      sandbox.stub(ThreadMessage, 'findOne')
        .onFirstCall().resolves({ threadId: 30, msgId: 55, replyTo: 10 })
        .onSecondCall().resolves({ threadId: 30, msgId: 55, replyTo: 10 });
      sandbox.stub(Thread, 'findByPk').resolves({ id: 30, originMsg: 10 });

      await MessageController.replyToMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: 55,
        clientMessageId: 'reply-key-4',
        senderId: 2,
        recipientId: 1,
        body: 'reply body',
        threadId: 30,
        replyTo: 10,
        idempotencyReplayed: true
      });
    });
  });

  describe('getThreadByMessageId', () => {
    it('should return a full thread for a message in a thread', async () => {
      req.params.id = '14';

      const topMessage = {
        id: 10,
        body: 'hello',
        sentAt: '2024-01-01T10:00:00.000Z',
        toJSON: jest.fn().mockReturnValue({ id: 10, body: 'hello', sentAt: '2024-01-01T10:00:00.000Z' })
      };
      const replyMessage = {
        id: 14,
        body: 'reply',
        sentAt: '2024-01-01T10:05:00.000Z',
        toJSON: jest.fn().mockReturnValue({ id: 14, body: 'reply', sentAt: '2024-01-01T10:05:00.000Z' })
      };

      sandbox.stub(Message, 'findByPk').onFirstCall().resolves(replyMessage);
      sandbox.stub(Thread, 'findOne').resolves(null);
      sandbox.stub(ThreadMessage, 'findOne').resolves({ threadId: 30, msgId: 14, replyTo: 10 });
      sandbox.stub(Thread, 'findByPk').resolves({ id: 30, originMsg: 10, dateCreated: '2024-01-01T10:00:00.000Z' });
      sandbox.stub(ThreadMessage, 'findAll').resolves([{ threadId: 30, msgId: 14, replyTo: 10 }]);
      sandbox.stub(Message, 'findAll').resolves([topMessage, replyMessage]);

      await MessageController.getThreadByMessageId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        thread: {
          id: 30,
          originMsg: 10,
          dateCreated: '2024-01-01T10:00:00.000Z'
        },
        messages: [
          { id: 10, body: 'hello', sentAt: '2024-01-01T10:00:00.000Z', replyTo: null },
          { id: 14, body: 'reply', sentAt: '2024-01-01T10:05:00.000Z', replyTo: 10 }
        ]
      });
    });

    it('should return the single message when no thread exists', async () => {
      req.params.id = '10';
      const message = { id: 10, body: 'hello' };

      sandbox.stub(Message, 'findByPk').resolves(message);
      sandbox.stub(Thread, 'findOne').resolves(null);
      sandbox.stub(ThreadMessage, 'findOne').resolves(null);

      await MessageController.getThreadByMessageId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ thread: null, messages: [message] });
    });
  });

  describe('readMessage', () => {
    beforeEach(() => {
      jest.useFakeTimers(); // Enable fake timers
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers(); // Restore real timers after each test
    });

    it('should mark message as read successfully', async () => {
      const mockDate = '2024-01-01 12:00:00';
      const mockMessage = {
        id: 1,
        readAt: null,
        readerAddress: null,
        save: jest.fn().mockResolvedValue(true)
      };

      req.body = { id: 1, readerAddress: '192.168.1.1' };
      sandbox.stub(Message, 'findByPk').resolves(mockMessage);

      await MessageController.readMessage(req, res);

      expect(mockMessage.readAt).toBe(mockDate);
      expect(mockMessage.readerAddress).toBe('192.168.1.1');
      expect(mockMessage.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'Message read successfully' });
    });

    it('should return 404 when message not found', async () => {
      req.body = { id: 999, readerAddress: '192.168.1.1' };
      sandbox.stub(Message, 'findByPk').resolves(null);

      await MessageController.readMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Message not found' });
    });

    it('should handle errors when reading message', async () => {
      req.body = { id: 1, readerAddress: '192.168.1.1' };
      sandbox.stub(Message, 'findByPk').rejects(new Error('Database error'));

      await MessageController.readMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });

  describe('deleteMessage', () => {
    beforeEach(() => {
      jest.useFakeTimers(); // Enable fake timers
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers(); // Restore real timers after each test
    });

    it('should delete message by sender successfully', async () => {
      const mockDate = '2024-01-01 12:00:00';
      const mockMessage = {
        id: 1,
        senderId: 100,
        recipientId: 200,
        deletedBySender: null,
        deletedByRecipient: null,
        save: jest.fn().mockResolvedValue(true)
      };

      req.body = {id: 1, deletedBy: 100};
      sandbox.stub(Message, 'findByPk').resolves(mockMessage);

      await MessageController.deleteMessage(req, res);

      expect(mockMessage.deletedBySender).toBe(mockDate);
      expect(mockMessage.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'Message deleted successfully by sender'
      });
    });

    it('should delete message by recipient successfully', async () => {
      const mockDate = '2024-01-01 12:00:00';
      const mockMessage = {
        id: 1,
        senderId: 100,
        recipientId: 200,
        deletedBySender: null,
        deletedByRecipient: null,
        save: jest.fn().mockResolvedValue(true)
      };

      req.body = {id: 1, deletedBy: 200};
      sandbox.stub(Message, 'findByPk').resolves(mockMessage);

      await MessageController.deleteMessage(req, res);

      expect(mockMessage.deletedByRecipient).toBe(mockDate);
      expect(mockMessage.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'Message deleted successfully by recipient'
      });
    });

    it('should return 404 when message not found', async () => {
      req.body = {id: 999, deletedBy: 100};
      sandbox.stub(Message, 'findByPk').resolves(null);

      await MessageController.deleteMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({error: 'Message not found'});
    });

    it('should handle errors when deleting message', async () => {
      req.body = {id: 1, deletedBy: 100};
      sandbox.stub(Message, 'findByPk').rejects(new Error('Database error'));

      await MessageController.deleteMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({error: 'Internal Server Error'});
    });
  });
});
