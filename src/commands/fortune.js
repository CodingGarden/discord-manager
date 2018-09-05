const fortune = require('fortune-tweetable');

module.exports = (message) => {
  return message.channel.send(fortune.fortune());
};
