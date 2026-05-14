// Thread Model

import { DataTypes, Model } from "sequelize";
import sequelize from '#config/database.js';

class Thread extends Model {};

Thread.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      field: 'id',
    },
    originMsg: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'origin_msg',
    },
    dateCreated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
      field: 'created_at',
    },
  },
  {
    sequelize,
    timestamps: false,
    modelName: 'Thread',
    tableName: 'threads',
  }
);

export default Thread;
