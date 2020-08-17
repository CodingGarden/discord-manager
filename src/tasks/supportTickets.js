const {
  MOD_CHANNEL_ID,
  TICKET_CHANNEL_ID,
  TICKET_MESSAGE_ID,
  SUPPORT_TICKET_MESSAGE,
} = require('../config');

async function sendMessageToModsChannel(guild, message) {
  const modChannel = guild.channels.cache.get(MOD_CHANNEL_ID);
  modChannel.send(message);
}

async function listenForTickets(guild) {
  const ticketChannel = guild.channels.cache.get(TICKET_CHANNEL_ID);
  const ticketMessage = await ticketChannel.messages.fetch(TICKET_MESSAGE_ID);
  const collector = ticketMessage.createReactionCollector(() => true);
  collector.on('collect', async (reaction, user) => {
    sendMessageToModsChannel(guild, `${user.tag} has opened a support ticket.`);
    listenForUserDMs(guild, user);
    reaction.remove();
  });
}

async function listenForUserDMs(guild, user) {
  const userChannel = await user.createDM();
  const collector = userChannel.createMessageCollector(() => true, {
    time: 86400, // 24h
  });

  userChannel.send(SUPPORT_TICKET_MESSAGE);

  collector.on('collect', async (message) => {
    sendMessageToModsChannel(guild, `${user.tag} sent: ${message}`);
  });
}

async function replyToUser(message) {
  let [_command, _user, ...body] = message.split(' ');
  body = body.join(' ');
  const user = message.mentions.first();

  user.send(body);
}

module.exports = { listenForTickets, replyToUser };
