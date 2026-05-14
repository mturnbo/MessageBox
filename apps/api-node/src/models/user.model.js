// User Model

import { DataTypes, Model } from "sequelize";
import sequelize from '#config/database.js';
import bcrypt from 'bcrypt';

class User extends Model {
  checkPassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }
};

User.init(
  {
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
      unique: true,
      validate: {
        isAlphanumeric: true,
        len: [8, 20]
      },
      field: 'username',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'email',
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.VIRTUAL,
      validate: {
        isStrongPassword: (value) => {
          if (value.length < 8) {
            throw new Error('Password must be at least 8 characters long');
          }
        },
      },
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
    fullName: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.firstName} ${this.lastName}`;
      },
      set(value) {
        throw new Error('Do not try to set the `fullName` value!');
      },
    },
    deviceAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'device_address',
      validate: {
        isIP: true,
      },
    },
    dateCreated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
      field: 'created_at',
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_seen',
    },
  },
  {
    sequelize,
    timestamps: false,
    modelName: 'User',
    tableName: 'users',
  }
);

User.associate = (models) => {
  this.hasMany(models.Message, {
    as: 'message',
    foreignKey: { name: 'senderId', type: DataTypes.INTEGER },
    foreignKey: { name: 'recipientId', type: DataTypes.INTEGER },
  });
}

User.addHook("beforeSave", async (user) => {
  if (user.password) {
    user.password_hash = await bcrypt.hash(user.password, 8);
  }
});

export default User;
