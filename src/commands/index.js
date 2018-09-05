const fortune = require('./fortune');
const eightBall = require('./eightBall');

const commands = {
  '!fortune': fortune,
  '!8ball': eightBall
};

const allCommands = Object.keys(commands);

commands['!commands'] = (message) => {
  return message.channel.send(allCommands.join(' '));
};

module.exports = commands;
