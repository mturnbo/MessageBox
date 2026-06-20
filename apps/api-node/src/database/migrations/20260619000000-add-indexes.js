'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('users', ['username'], {
      name: 'users_username_unique',
      unique: true,
    });
    await queryInterface.addIndex('messages', ['sender_id'], {
      name: 'messages_sender_id_idx',
    });
    await queryInterface.addIndex('messages', ['recipient_id'], {
      name: 'messages_recipient_id_idx',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_username_unique');
    await queryInterface.removeIndex('messages', 'messages_sender_id_idx');
    await queryInterface.removeIndex('messages', 'messages_recipient_id_idx');
  },
};
