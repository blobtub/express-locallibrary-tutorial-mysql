const { DataTypes } = require('sequelize');
const { DateTime } = require("luxon"); //for date handling

const bookInstanceSchema = {
  imprint: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    isIn: [['Available', 'Maintenance', 'Loaned', 'Reserved']],
    defaultValue: 'Maintenance',
  },
  due_back: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  url: { type: DataTypes.VIRTUAL, get() {  // Virtual for this bookinstance object's URL.
    return "/catalog/bookinstance/" + this.id;
  }},
  due_back_formatted: { type: DataTypes.VIRTUAL, get() {
    return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
  }},
  due_back_yyyy_mm_dd: { type: DataTypes.VIRTUAL, get() {
    return DateTime.fromJSDate(this.due_back).toISODate(); //format 'YYYY-MM-DD'
  }}
};

const bookInstanceModel = (sequelize) => {
  var Book = require('./book')(sequelize);

  BookInstance = sequelize.define('BookInstance', bookInstanceSchema, { tableName: 'BOOK_INSTANCE_TEST_1' });
  Book.hasMany(BookInstance, {foreignKey: {name: 'bookId', allowNull: true}});
  BookInstance.belongsTo(Book, {foreignKey: {name: 'bookId', allowNull: true}});  // Reference to the associated book.

  return BookInstance;
}

// Export model.
module.exports = bookInstanceModel;
