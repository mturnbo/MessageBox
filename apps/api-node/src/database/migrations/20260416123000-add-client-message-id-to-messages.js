'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn('messages', 'client_message_id', {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addIndex('messages', ['client_message_id'], {
      unique: true,
      name: 'messages_client_message_id_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('messages', 'messages_client_message_id_unique');
    await queryInterface.removeColumn('messages', 'client_message_id');
  },
};
