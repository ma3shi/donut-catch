"use strict";
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("postgres://postgres:postgres@db/donut_catch");

module.exports = {
  sequelize,
  DataTypes,
};
