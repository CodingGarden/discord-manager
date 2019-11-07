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
  MIN_INTRO_MESSAGE_LENGTH: process.env.MIN_INTRO_MESSAGE_LENGTH,
  WELCOME_MESSAGE: `Welcome to the 🌻 💚 **Coding Garden Discord!** 💚 🌻 

Before gaining access to all of the channels, you will need to **read the rules and code of conduct** in the #welcome channel.

After you have **read and acknowledged** that you will abide by the rules and code of conduct, You will need to introduce yourself in the #introductions channel.

**Your introduction must be a minimum of 40 characters long.** You can tell us your name, what you do, how long you've been coding, and maybe even your favorite food! Other fun things to talk about include: how you found Coding Garden or what your favorite thing about coding is.

**REMEMBER:** **Do not spam multiple channels with the same message or you will be muted/banned.** Always spend at least 30 seconds to decide what channel is best for your comment/question. (See an overview of channels in the #welcome channel)

Let's have some fun!`
};
