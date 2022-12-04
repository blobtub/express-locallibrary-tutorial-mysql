const Sequelize = require('sequelize');

var sequelize;

//TODO: add error handling

function getDatabaseInstance(connectionURI) {
	if (!sequelize) sequelize = new Sequelize(connectionURI || process.env.MYSQLDB_URI);
	return sequelize;
}

module.exports = getDatabaseInstance;