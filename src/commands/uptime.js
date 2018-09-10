const countdown = require('countdown');
const bootTime = new Date();

module.exports = {
  name: 'uptime',
  triggers: ['uptime', 'ut', '⏱'],
  description: 'See how long CG-Bot has been up.',
  handler: (message) => {
    return message.channel.send(`CG-Bot has been up since ${bootTime.toUTCString()} for a total of: ${countdown(bootTime)}`);
  }
};
