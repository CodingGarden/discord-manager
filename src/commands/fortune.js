const fortune = require('fortune-tweetable');

module.exports = {
  name: 'fortune',
  triggers: ['fortune', '🔮'],
  description: 'Get a quote from the fortune-tweetable package.',
  handler: (message) => {
    return message.channel.send(fortune.fortune());
  }
};
