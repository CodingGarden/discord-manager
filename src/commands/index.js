const uptime = require('./uptime');
const fortune = require('./fortune');
const eightBall = require('./eightBall');
const poll = require('./poll');

let descriptions = '';
const commands = [
  fortune,
  eightBall,
  uptime,
  poll
].reduce((all, cmd) => {
  cmd.triggers.forEach(trigger => all[trigger] = cmd.handler);
  descriptions += `**${cmd.name}** - ${cmd.description}
Usage: ${cmd.triggers.map(t => '!' + t).join(' or ')}

`;
  return all;
}, {});

const allCommands = (message) => {
  return message.channel.send(descriptions);
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
