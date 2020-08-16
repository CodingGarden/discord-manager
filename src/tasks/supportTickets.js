const {
	MOD_CHANNEL_ID,
	TICKET_CHANNEL_ID,
	TICKET_MESSAGE_ID,
	SUPPORT_TICKET_MESSAGE,
} = require('../config');

const modChannel = guild.channels.cache.get(MOD_CHANNEL_ID);

async function listenForTickets(guild) {
	const ticketChannel = guild.channels.cache.get(TICKET_CHANNEL_ID);
	const ticketMessage = await ticketChannel.messages.fetch(TICKET_MESSAGE_ID);

	const collector = ticketMessage.createReactionCollector(() => true);
	collector.on('collect', async (reaction, user) => {
		modChannel.send(`${user.tag} has opened a support ticket.`);
		listenForUserDMs(user);
		reaction.remove();
	});
}

async function listenForUserDMs(user) {
	const userChannel = await user.createDM();
	const collector = userChannel.createMessageCollector(() => true, {
		time: 86400,
	});

	userChannel.send(SUPPORT_TICKET_MESSAGE);

	collector.on('collect', async (message) => {
		modChannel.send(`${user.tag} sent: ${message}`);
	});
}

async function replyToUser(message) {
	let [_command, _user, ...body] = message.split(' ');
	body = body.join(' ');
	const user = message.mentions.first();

	user.send(body);
}

module.exports = { listenForTickets, replyToUser };
