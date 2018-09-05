const fortune = require('./fortune');
const eightBall = require('./eightBall');

const commands = [
  fortune,
  eightBall
].reduce((all, cmd) => {
  cmd.triggers.forEach(trigger => all[trigger] = cmd.handler);
  return all;
}, {});

const allCommands = (message) => {
  return message.channel.send(Object.keys(commands).join(' '));
};

commands['commands'] = allCommands;
commands['help'] = allCommands;

module.exports = {
  handle: (command, message) => {
    if (command && commands[command]) {
      commands[command](message);
    }
  }
};
