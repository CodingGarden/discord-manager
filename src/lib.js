const codeOfConductMessageId = '452174382136164357';
const seedlingRoleId = '486229599324209162';
const germinatingRoleId = '486255605594587138';
const MIN_INTRO_MESSAGE_LENGTH = 40;
const WELCOME_CHANNEL_ID = '451779463819034626';

module.exports = {
  getRolesByName: (roles) => roles.reduce((byName, role) => (byName[role.name] = role, byName), {}),
  checkMoveToSeedling(guild, author, message, channel) {
    let guildmember = guild.members.find(m => m.id === author.id);
    const germinatingRole = guildmember.roles.get(germinatingRoleId);
    if (germinatingRole && message.content.length >= MIN_INTRO_MESSAGE_LENGTH) {
      const welcomeChannel = guild.channels.array().find(channel => channel.id === WELCOME_CHANNEL_ID);
      welcomeChannel
        .fetchMessage(codeOfConductMessageId)
        .then(message => {
          Promise.all(message.reactions.array().map(reaction => reaction.fetchUsers(100))).then(() => {
            const emojiReaction = message.reactions.array().some(reaction => {
              return reaction.users.array().find(user => {
                return user.id === author.id;
              });
            });
            if (emojiReaction) {
              guildmember
                .addRole(seedlingRoleId)
                .then(() => guildmember.removeRole(germinatingRoleId))
                .then(() => {
                  console.log(author.username, 'has become a seedling!');
                });
            }
            else {
              channel.send(`Thanks for your introduction ${author}! But you still need to acknowledge that you have read the code of conduct by emoji reacting to the message in the \#welcome channel, before you can gain access to the rest of the channels.`);
            }
          });
        });
    }
  }

}
