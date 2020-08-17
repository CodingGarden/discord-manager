const Discord = require('discord.js');
const { exec } = require('child_process');

const client = new Discord.Client();

const commands = require('./commands');
const db = require('./db');

const {
  BOT_TOKEN,
  INTRODUCTION_CHANNEL_ID,
  GUILD_ID,
  DEBUGGING_COMMAND,
  MOD_ROLE_ID,
} = require('./config');

const germinating = require('./tasks/germinating');
const { listenForTickets, replyToUser } = require('./tasks/supportTickets');

if (DEBUGGING_COMMAND) {
  console.log('DEBUGGING', DEBUGGING_COMMAND, 'command.');
}

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!DEBUGGING_COMMAND && guild.id === GUILD_ID) {
    listenForTickets(guild);
    germinating.listenCodeOfConductReactions(guild);
    console.log('Adding missing germinators...');
    try {
      await germinating.addMissingGerminators(guild);
    } catch (error) {
      console.error(error);
    }
  }
});

client.on('guildMemberAdd', async (member) => {
  if (!DEBUGGING_COMMAND && member.guild.id === GUILD_ID) {
    try {
      await germinating.moveToGerminating(member);
    } catch (error) {
      console.log('Error while moving to germinating:');
      console.error(error.message);
      console.error(error);
      console.error(error.stack);
    }
  }
});

client.on('guildMemberRemove', async (member) => {
  if (!DEBUGGING_COMMAND && member.guild.id === GUILD_ID) {
    await db.remove({
      _id: member.id,
    });
  }
});

client.on('message', (message) => {
  const { guild, channel, author, member } = message;
  if (message.author.bot || channel.type === 'dm') return;

  if (guild && guild.id === GUILD_ID) {
    if (!DEBUGGING_COMMAND && channel.id === INTRODUCTION_CHANNEL_ID) {
      germinating.checkIntroMessage(message, guild, author);
    } else if (message.content[0] === '!') {
      const command = message.content.split(' ')[0].substr(1).toLowerCase();

      if (command === 'restart') {
        const modRole = member.roles.cache.get(MOD_ROLE_ID);
        if (modRole) {
          console.log('restarting...');
          exec('forever restart 0');
        }
      } else if (command === 'reply') {
        replyToUser(message);
      } else if (DEBUGGING_COMMAND && DEBUGGING_COMMAND === command) {
        commands.handle(command, message);
      } else if (!DEBUGGING_COMMAND) {
        commands.handle(command, message);
      }
    }
  }
});

client.login(BOT_TOKEN);

process.on('unhandledRejection', (error) => {
  console.log('unhandledRejection:', error.message);
  console.error(error);
});
