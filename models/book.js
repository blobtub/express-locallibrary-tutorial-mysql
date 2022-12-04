const { DataTypes } = require('sequelize');
const getDatabaseInstance = require('../db');

const sequelize = getDatabaseInstance();

const bookSchema = {
  title: { type: DataTypes.STRING, allowNull: false },
  summary: { type: DataTypes.STRING, allowNull: false },
  isbn: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.VIRTUAL, get() {  // Virtual for this book instance URL.
    return "/catalog/book/" + this.id;
  }}
};

var Author = require('./author');
var Genre = require('./genre');

Book = sequelize.define('Book', bookSchema, { tableName: 'BOOK_TEST_1' });  // define book model

Author.hasMany(Book, {foreignKey: {name: 'authorId', allowNull: false}});
Book.belongsTo(Author, {foreignKey: {name: 'authorId', allowNull: false}});
Genre.belongsToMany(Book, {through: 'GENRE_BOOK_LINK_TEST_1', foreignKey: 'genreId', otherKey: 'bookId'});
Book.belongsToMany(Genre, {through: 'GENRE_BOOK_LINK_TEST_1', foreignKey: 'bookId', otherKey: 'genreId'});

// Export model.
module.exports = Book;
