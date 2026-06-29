'use strict';
const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('threads', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      origin_msg: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.createTable('thread_messages', {
      thread_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      msg_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      reply_to: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('thread_messages');
    await queryInterface.dropTable('threads');
  },
};
