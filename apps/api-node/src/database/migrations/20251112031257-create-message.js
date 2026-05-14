'use strict';
const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
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
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        field: 'client_message_id',
      },
      body: {
        type: DataTypes.TEXT,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'sent_at',
      },
      senderAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'sender_address',
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
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('messages');
  }
};
