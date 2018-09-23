const Discord = require('discord.js');
const client = new Discord.Client();

const commands = require('./commands');

const {
  BOT_TOKEN,
  INTRODUCTION_CHANNEL_ID,
  GUILD_ID,
  DEBUGGING_COMMAND
} = require('./config');

const germinating = require('./tasks/germinating');

if (DEBUGGING_COMMAND) {
  console.log('DEBUGGING', DEBUGGING_COMMAND, 'command.');
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = client.guilds.get(GUILD_ID);
  if (!DEBUGGING_COMMAND && guild.id === GUILD_ID) {
    germinating.addMissingGerminators(guild);
    germinating.listenCodeOfConductReactions(guild);
  }
});

client.on('guildMemberAdd', (member) => {
  if (!DEBUGGING_COMMAND && member.guild.id === GUILD_ID) { 
    germinating.moveToGerminating(member);
  }
});

client.on('message', (message) => {
  const { guild, channel, author } = message;
  if (message.author.bot || channel.type === 'dm') return;

  if (guild && guild.id === GUILD_ID) {
    if (!DEBUGGING_COMMAND && channel.id === INTRODUCTION_CHANNEL_ID) {
      germinating.checkIntroMessage(message, guild, author);
    } else if (message.content[0] === '!') {
      const command = message.content.split(' ')[0].substr(1).toLowerCase();

      if (DEBUGGING_COMMAND && DEBUGGING_COMMAND === command) {
        commands.handle(command, message);
      } else if (!DEBUGGING_COMMAND) {
        commands.handle(command, message);
      }
    }
  }
});

client.login(BOT_TOKEN);
