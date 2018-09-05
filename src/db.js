const Datastore = require('nedb-promises')
const db = new Datastore({
  filename: 'bot.db',
  autoload: true
});

module.exports = db;
