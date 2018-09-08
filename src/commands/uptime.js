const ms = require('ms');
const bootTime = new Date();

module.exports = {
  name: 'uptime',
  triggers: ['uptime', 'ut', '⏱'],
  description: 'See how long CG-Bot has been up.',
  handler: (message) => {
    const uptime = (new Date() - bootTime);
    return message.channel.send(`CG-Bot has been up since ${bootTime.toUTCString()} for a total of: ${ms(uptime, { long: true })}`);
  }
};
