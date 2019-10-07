const options = [
  '🇦',
  '🇧',
  '🇨',
  '🇩',
  '🇪',
  '🇫',
  '🇬',
  '🇭',
  '🇮',
  '🇯',
  '🇰',
  '🇱',
  '🇲',
  '🇳',
  '🇴',
  '🇵',
  '🇶',
  '🇷',
  '🇸',
  '🇹',
  '🇺',
  '🇻',
  '🇼',
  '🇽',
  '🇾',
  '🇿',
];

const pollLog = {};

function canSendPoll(user_id) {
  if (pollLog[user_id]) {
    const timeSince = Date.now() - pollLog[user_id].lastPoll;
    if (timeSince < 30000) {
      return false;
    }
  }
  return true;
}

function extractQuestionOptions(arguments) {
  return [...new Set(arguments.slice(1))]
}

function removeDuplicateOptions(options, nextOption) {
  insertIfNotExist(options, nextOption);

  return options;
}

function insertIfNotExist(array, item) {
  if(!array.includes(item.trim())) {
    array.push(item.trim());
  }
}

module.exports = {
  name: 'poll',
  triggers: ['poll', '📊'],
  description: 'Ask a polling question. Vote by emoji reaction. Question and options must be wrapped in double quotes. Questions with no provided options are treated as Yes / No / Unsure questions.',
  example: '"Thoughtful question here?" "Optional Answer A" "Optional Answer B"',
  handler: (message) => {
    let args = message.content.match(/"(.+?)"/g);
    if (args) {
      if (!canSendPoll(message.author.id)) {
        return message
          .channel
          .send(`${message.author} please wait before sending another poll.`);
      } else if (args.length === 1) { // yes no unsure question
        const question = args[0].replace(/"/g, '');
        pollLog[message.author.id] = {
          lastPoll: Date.now()
        };
        return message
          .channel
          .send(`${message.author} asks: ${question}`)
          .then(async (pollMessage) => {
            await pollMessage.react('👍');
            await pollMessage.react('👎');
            await pollMessage.react(message.guild.emojis.get('475747395754393622'));
          });
      } else { // multiple choice
        args = args.map(a => a.replace(/"/g, ''));
        const question = args[0];
        const questionOptions = extractQuestionOptions(args).reduce(removeDuplicateOptions, []);
        if (questionOptions.length > 20) {
          return message.channel.send(`${message.author} Polls are limited to 20 options.`);
        } else {
          pollLog[message.author.id] = {
            lastPoll: Date.now()
          };
          return message
            .channel
            .send(`${message.author} asks: ${question}
${questionOptions
    .map((option, i) => `${options[i]} - ${option}`).join('\n')}
`)
            .then(async (pollMessage) => {
              for (let i = 0; i < questionOptions.length; i++) {
                await pollMessage.react(options[i]);
              }
            });
        }
      }
    } else {
      return message
        .channel
        .send(`${message.author} invalid Poll! Question and options should be wrapped in double quotes.`);
    }
  }
};
