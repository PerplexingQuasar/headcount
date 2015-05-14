var db = require('../config');
var User = require('./user.js');
var Event = require('./event.js');

var Invite = db.Model.extend({
  tableName: 'invites',
  hasTimestamps: true,
  user: function() {
    return this.belongsTo('User', 'id');
  },
  event: function() {
    return this.belongsTo('Event', 'id');
  }
});

module.exports = db.model('Invite', Invite);
