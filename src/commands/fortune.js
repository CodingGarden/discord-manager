const fortune = require('fortune-tweetable');

module.exports = {
  triggers: ['fortune', '🔮'],
  handler: (message) => {
    return message.channel.send(fortune.fortune());
  }
};
