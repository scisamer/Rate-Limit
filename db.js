const Datastore = require('nedb-promises')

const db = {};

db.users = new Datastore({ filename: './database/users.db', autoload: true });
db.years = new Datastore({ filename: './database/years.db', autoload: true });

module.exports = db;