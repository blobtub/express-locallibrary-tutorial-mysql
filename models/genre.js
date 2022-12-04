const { DataTypes } = require('sequelize');
const getDatabaseInstance = require('../db');

const sequelize = getDatabaseInstance();

const genreSchema = {
  name: { type: DataTypes.STRING(100), allowNull: false, validate: {
    len: [3, 100] }  // minLength: 3, maxLength: 100
  },
  url: { type: DataTypes.VIRTUAL, get() {  // Virtual for this genre instance URL.
    return "/catalog/genre/" + this.id;  
  }}
};

const Genre = sequelize.define('Genre', genreSchema, { tableName: 'GENRE_TEST_1' });  // define genre model

// Export model.
module.exports = Genre;
