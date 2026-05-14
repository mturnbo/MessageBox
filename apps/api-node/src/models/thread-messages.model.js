// Thread Messages Model

import { DataTypes, Model } from "sequelize";
import sequelize from '#config/database.js';

class ThreadMessage extends Model {};

ThreadMessage.init(
  {
    threadId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      field: 'thread_id',
    },
    msgId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      field: 'msg_id',
    },
    replyTo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      field: 'reply_to',
    },
  },
  {
    sequelize,
    timestamps: false,
    modelName: 'ThreadMessage',
    tableName: 'thread_messages',
  }
);

export default ThreadMessage;
