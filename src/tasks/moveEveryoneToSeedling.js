const Discord = require('discord.js');
const client = new Discord.Client();

require('dotenv').config();

const { getRolesByName } = require('../lib');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = client.guilds.get(process.env.GUILD_ID);
  const allRoles = guild.roles.array();
  const rolesByName = getRolesByName(allRoles);
  const otherRoles = allRoles.filter(role => role.name !== '@everyone');
  const otherRoleMembersById = otherRoles.reduce((membersById, role) => {
    role.members.array().forEach(({user}) => {
      membersById[user.id] = user;
    });
    return membersById;
  }, {});
  
  const seedlingRole = rolesByName['@seedling'];
  Promise.all(
    rolesByName['@everyone'].members.array().map(member => {
      if (!otherRoleMembersById[member.user.id]) {
        console.log('Starting to move', member.user.username);
        return member.addRole(seedlingRole).then(() => {
          console.log('Moved', member.user.username, 'to @seedling');
        }).catch(() => {
          console.log('Error moving', member.user.username, 'to @seedling');
        });
      }
      console.log('Skipping', member.user.username);
      return Promise.resolve();
    })
  ).then(results => {
    console.log(results.length);
  });
});

client.login(process.env.BOT_TOKEN);