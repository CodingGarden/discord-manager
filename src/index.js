const Discord = require('discord.js');
const client = new Discord.Client();

const { getRolesByName, checkMoveToSeedling } = require('./lib');

require('dotenv').config();

const WELCOME_CHANNEL_ID = '451779463819034626';
const INTRODUCTION_CHANNEL_ID = '451783474106335243';
const codeOfConductMessageId = '452174382136164357';
const germinatingRoleId = '486255605594587138';
const seedlingRoleId = '486229599324209162';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = client.guilds.get(process.env.GUILD_ID);
  const introductionChannel = guild.channels.array().find(channel => channel.id === INTRODUCTION_CHANNEL_ID);
  const welcomeChannel = guild.channels.array().find(channel => channel.id === WELCOME_CHANNEL_ID);
  welcomeChannel
    .fetchMessage(codeOfConductMessageId)
    .then(message => {
      const collector = message.createReactionCollector(_ => true);
      collector.on('collect', (reaction) => {
        reaction.users.array().forEach(async (user) => {
          const guildmember = await guild.fetchMember(user);
          const germinatingRole = guildmember.roles.get(germinatingRoleId);
          if (germinatingRole) {
            introductionChannel
              .fetchMessages()
              .then(messages => {
                const validIntroMessage = messages.find(message => (
                  message.author.id === user.id &&
                  message.content.length >= 40
                ));
                if (validIntroMessage) {                  
                  guildmember
                    .addRole(seedlingRoleId)
                    .then(() => guildmember.removeRole(germinatingRoleId))
                    .then(() => {
                      console.log(user.username, 'has become a seedling!');
                    });
                } else {
                  console.log(user.username, 'has reacted to COC but has not sent an intro message');
                }
              });
          }
        });
        console.log(`Collected ${reaction.emoji.name}`);
      });
    
      collector.on('end', collected => {
          console.log(`Collected ${collected.size} items`);
      });
    });
});

client.on('guildMemberAdd', member => {
  const guild = client.guilds.get(process.env.GUILD_ID);
  const rolesByName = getRolesByName(guild.roles.array());
  const germinatingRole = rolesByName['@germinating'];

  console.log(member.guild.id);
  if (member.guild.id === process.env.GUILD_ID) {
    console.log(member.user.username, 'just joined the server!');
    
    member
      .addRole(germinatingRole)
      .then(() => {
        console.log(member.user.username, 'added to germinating role!');
      }).catch((error) => {
        console.error('Error moving', member.user.username, 'to germinating role.');
        console.error(error);
      });
  }
});

client.on('message', message => {
  if (message.author.bot) return;

  const { guild, channel, author } = message;
  if (channel.type === 'dm') return;
  
  if (guild && guild.id === process.env.GUILD_ID && channel.id === INTRODUCTION_CHANNEL_ID) {
    checkMoveToSeedling(guild, author, message, channel);
  }
});

client.login(process.env.BOT_TOKEN);
