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
  console.log('Listening for tickets');
  const ticketChannel = guild.channels.cache.get(TICKET_CHANNEL_ID);
  const ticketMessage = await ticketChannel.messages.fetch(TICKET_MESSAGE_ID);
  const collector = ticketMessage.createReactionCollector(() => true);

  ticketMessage.reactions
    .removeAll()
    .catch((err) =>
      console.log(
        'There was a problem while removing the reactions of the ticket message: ',
        err
      )
    );

  collector.on('collect', async (reaction, user) => {
    sendMessageToModsChannel(
      guild,
      `<@${user.id}> has opened a support ticket.`
    );
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
    if (!message.author.bot)
      sendMessageToModsChannel(guild, `<@${user.id}> sent: ${message}`);
  });
}

async function replyToUser(message) {
  console.log(message.mentions);
  // eslint-disable-next-line no-unused-vars
  let [_command, _user, ...body] = message.content.split(' ');
  body = body.join(' ');
  const user = message.mentions.users.first();

  user.send(body);
}

module.exports = { listenForTickets, replyToUser };
