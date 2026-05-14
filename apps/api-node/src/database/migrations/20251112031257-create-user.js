'use strict';
const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        field: 'id',
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'username',
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'email',
      },
      password: {
        type: DataTypes.VIRTUAL,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'password_hash',
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'first_name',
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'last_name',
      },
      deviceAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'device_address',
      },
      dateCreated: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_seen',
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
