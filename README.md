# Discord Bot/Manager

* [x] The "seedling" role can view all public channels
* [x] Move all users into the "seedling" role
* [x] New users to the discord are placed into a "germinating" role
  * [x] All channels are hidden except for "welcome" and "introductions"
  * [x] Only have the ability to post in "introductions"
* [x] To be moved into the "seedling" role
  * [x] MUST emoji react the code of conduct post in "welcome"
  * [x] MUST post an introduction in the "introductions" channel
    * [x] Introduction must be at least 40 characters long.
* [x] Watch code of conduct for emoji reactions and decide if we should move them to seedling role

## TODO
* [x] Setup eslint
* [x] Refactor CONST variables to .env
  * [x] Create a config object, load from .env
* [x] Refactor methods to use a local db like [nedb](https://github.com/louischatriot/nedb/)
  * [x] Listen for new users
    * [x] Add to db with:
      * CodeOfConduct - false
      * Introduction - false
  * [x] Listen for emoji reactions to COC message
    * Update db
  * [x] Listen for messages in introductions
    * Update db when a message recieved for new user with length > 40
* [ ] Send a message when a user is moved into the seedling group.
* [ ] Move all users that have not yet posted a message into the "germinating" role
* [ ] Deploy!
* [ ] Stream notify channel
  * [ ] Join this channel to be notified when CJ goes live
* [ ] Listen for leave server
  * [ ] Remove COC reactions

## Resources

### Join a Bot to a server

* Make a request in the browser to:
  * https://discordapp.com/api/oauth2/authorize?client_id=12345&scope=bot&permissions=1

### discord.js docs/examples

* https://discord.js.org/#/docs/main/stable/general/welcome
* https://discordjs.guide/#/popular-topics/miscellaneous-examples