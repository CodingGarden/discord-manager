const bootTime = new Date();

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h,
    m > 9 ? m : (h ? '0' + m : m || '0'),
    s > 9 ? s : '0' + s,
  ].filter(a => a).join(':');
}

module.exports = {
  name: 'uptime',
  triggers: ['uptime', 'ut', '⏱'],
  description: 'See how long CG-Bot has been up.',
  handler: (message) => {
    const uptime = (Date.now() - +bootTime) / 1000;
    return message.channel.send(`CG-Bot has been up since ${bootTime.toUTCString()} for a total of: ${formatTime(uptime)}`);
  }
};
