const { DataTypes } = require('sequelize');
const { DateTime } = require('luxon'); // for date handling

const authorSchema = {
  first_name: { type: DataTypes.STRING(100), allowNull: false },
  family_name: { type: DataTypes.STRING(100), allowNull: false },
  date_of_birth: { type: DataTypes.DATE },
  date_of_death: { type: DataTypes.DATE },
  name: { type: DataTypes.VIRTUAL, get() {  // Virtual for author "full" name.
    return this.family_name + ", " + this.first_name;
  }},
  url: { type: DataTypes.VIRTUAL, get() {  // Virtual for this author instance URL.
    return "/catalog/author/" + this.id;
  }},
  lifespan: { type: DataTypes.VIRTUAL, get() {
    var lifetime_string = "";
    if (this.date_of_birth) {
      lifetime_string = DateTime.fromJSDate(this.date_of_birth).toLocaleString(
        DateTime.DATE_MED
      );
    }
    lifetime_string += " - ";
    if (this.date_of_death) {
      lifetime_string += DateTime.fromJSDate(this.date_of_death).toLocaleString(
        DateTime.DATE_MED
      );
    }
    return lifetime_string;    
  }},
  date_of_birth_yyyy_mm_dd : { type: DataTypes.VIRTUAL, get() {
    return DateTime.fromJSDate(this.date_of_birth).toISODate(); // format 'YYYY-MM-DD'
  }},
  date_of_death_yyyy_mm_dd : { type: DataTypes.VIRTUAL, get() {
    return DateTime.fromJSDate(this.date_of_death).toISODate(); // format 'YYYY-MM-DD'
  }}
};

const authorModel = (sequelize) => sequelize.define('Author', authorSchema, { tableName: 'AUTHOR_TEST_1' });

// Export model.
module.exports = authorModel;
