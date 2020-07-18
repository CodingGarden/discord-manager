const Discord = require('discord.js');
const client = new Discord.Client();

const {
  BOT_TOKEN,
  SEEDLING_ROLE_ID
} = require('../config');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  const otherRoles = guild.roles.cache.filter(role => role.name !== '@everyone');
  const otherRoleMembersById = otherRoles.reduce((membersById, role) => {
    role.members.forEach(({user}) => {
      membersById[user.id] = user;
    });
    return membersById;
  }, {});
  
  const seedlingRole = guild.roles.cache.get(SEEDLING_ROLE_ID);
  const everyoneRole = guild.roles.cache.find(role => role.name === '@everyone');
  Promise.all(
    everyoneRole.members.map(member => {
      if (!otherRoleMembersById[member.user.id]) {
        console.log('Starting to move', member.user.username);
        return member.roles.add(seedlingRole).then(() => {
          console.log('Moved', member.user.username, 'to @seedling');
        }).catch(() => {
          console.log('Error moving', member.user.username, 'to @seedling');
        });
      }
      console.log('Skipping', member.user.username);
      return Promise.resolve();
    })
  ).then(results => {
    console.log('Checked', results.length, 'users.');
  });
});

client.login(BOT_TOKEN);
