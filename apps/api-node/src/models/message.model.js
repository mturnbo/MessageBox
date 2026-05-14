// Message Model
import {DataTypes, Model} from 'sequelize';
import sequelize from '#config/database.js';

class Message extends Model {};

Message.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
    field: 'id',
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sender_id',
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'recipient_id',
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'subject',
  },
  clientMessageId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    field: 'client_message_id',
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    field: 'sent_at',
  },
  senderAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'sender_address',
    validate: {
      isIP: true,
    },
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
  },
  readerAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'reader_address',
    validate: {
      isIP: true,
    },
  },
  deletedBySender: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_by_sender',
  },
  deletedByRecipient: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_by_recipient',
  },
},
  {
    sequelize,
    timestamps: false,
    modelName: 'Message',
    tableName: 'messages',
  });

/*
const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
    field: 'id',
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sender_id',
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'recipient_id',
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'subject',
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    field: 'sent_at',
  },
  senderAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'sender_address',
    validate: {
      isIP: true,
    },
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
  },
  readerAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'reader_address',
    validate: {
      isIP: true,
    },
  },
  deletedBySender: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_by_sender',
  },
  deletedByRecipient: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_by_recipient',
  },
},
{
  timestamps: false,
  freezeTableName: false,
  modelName: 'Message',
  tableName: 'messages',
});

 */

Message.associate = (models) => {
  this.belongsTo(models.User, {
    as: 'user',
    foreignKey: { name: 'senderId', type: DataTypes.INTEGER },
    foreignKey: { name: 'recipientId', type: DataTypes.INTEGER },
  });
  this.hasMany(models.ThreadMessage, {
    as: 'threadMessage',
    foreignKey: { name: 'msgId', type: DataTypes.INTEGER },
  });
}

export default Message;
