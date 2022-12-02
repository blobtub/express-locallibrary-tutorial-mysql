const { DataTypes } = require('sequelize');

const bookSchema = {
  title: { type: DataTypes.STRING, allowNull: false },
  summary: { type: DataTypes.STRING, allowNull: false },
  isbn: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.VIRTUAL, get() {  // Virtual for this book instance URL.
    return "/catalog/book/" + this.id;
  }}
};

const bookModel = (sequelize) => {
  var Author = require('./author')(sequelize);
  var Genre = require('./genre')(sequelize);

  Book = sequelize.define('Book', bookSchema, { tableName: 'BOOK_TEST_1' });
  Author.hasMany(Book, {foreignKey: {name: 'authorId', allowNull: false}});
  Book.belongsTo(Author, {foreignKey: {name: 'authorId', allowNull: false}});
  Genre.belongsToMany(Book, {through: 'GENRE_BOOK_LINK_TEST_1', foreignKey: 'bookId', otherKey: 'genreId'});
  Book.belongsToMany(Genre, {through: 'GENRE_BOOK_LINK_TEST_1', foreignKey: 'bookId', otherKey: 'genreId'});

  return Book;
};

// Export model.
module.exports = bookModel;
