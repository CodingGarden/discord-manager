require('dotenv').config();

module.exports = {
	ADMIN_ID: process.env.ADMIN_ID,
	MOD_ROLE_ID: process.env.MOD_ROLE_ID,
	DEBUGGING_COMMAND: process.env.DEBUGGING_COMMAND,
	BOT_TOKEN: process.env.BOT_TOKEN,
	GUILD_ID: process.env.GUILD_ID,
	WELCOME_CHANNEL_ID: process.env.WELCOME_CHANNEL_ID,
	INTRODUCTION_CHANNEL_ID: process.env.INTRODUCTION_CHANNEL_ID,
	CODE_OF_CONDUCT_MESSAGE_ID: process.env.CODE_OF_CONDUCT_MESSAGE_ID,
	GERMINATING_ROLE_ID: process.env.GERMINATING_ROLE_ID,
	SEEDLING_ROLE_ID: process.env.SEEDLING_ROLE_ID,
	BOT_LOG_CHANNEL_ID: process.env.BOT_LOG_CHANNEL_ID,
	MIN_INTRO_MESSAGE_LENGTH: process.env.MIN_INTRO_MESSAGE_LENGTH,
	MOD_CHANNEL_ID: process.env.MOD_CHANNEL_ID,
	TICKET_CHANNEL_ID: process.env.TICKET_CHANNEL_ID,
	TICKET_MESSAGE_ID: process.env.TICKET_MESSAGE_ID,
	SUPPORT_TICKET_MESSAGE: `Thanks for creating a support ticket. Please, explain what is your problem ans we will try to respond as soon as possible.`,
	WELCOME_MESSAGE: `Welcome to the 🌻 💚 **Coding Garden Discord!** 💚 🌻 

Before gaining access to all of the channels, you will need to **read the rules and code of conduct** in the <#${process.env.WELCOME_CHANNEL_ID}> channel.

After you have **read and acknowledged** that you will abide by the rules and code of conduct, You will need to introduce yourself in the <#${process.env.INTRODUCTION_CHANNEL_ID}> channel.

**Your introduction must be a minimum of 40 characters long.** You can tell us your name, what you do, how long you've been coding, and maybe even your favorite food! Other fun things to talk about include: how you found Coding Garden or what your favorite thing about coding is.

**REMEMBER:** **Do not spam multiple channels with the same message or you will be muted/banned.** Always spend at least 30 seconds to decide what channel is best for your comment/question. (See an overview of channels in the <#${process.env.WELCOME_CHANNEL_ID}> channel)

Let's have some fun!`,
};
