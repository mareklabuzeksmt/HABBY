'use strict';

const config = require('dotenv').config()
const db = require('../lib/db')
const slack = require('../lib/slack')

// init
db.connect()

module.exports.authorize = (event, context, cb) => {
  let permissions = [
    'channels:history',
    'channels:read',
    'bot',
    'chat:write:bot',
    'im:read',
    'im:write',
    'im:history'
  ]

  let url = 'https://slack.com/oauth/authorize?' +
    'client_id=' + config.SLACK_CLIENT_ID + '&' +
    'scope=' + permissions.join(',') + '&' +
    'redirect_uri=' + 'https://' + event.headers.Host + '/' + event.stage + '/access'
    
  context.succeed({
    location: url
  })
}

module.exports.access = (event, context, cb) => {
  slack.access(event.query.code, (err, credentials) => {
    db.saveAccessTokens(credentials.access_token, credentials.bot.bot_access_token)
    db.saveBotUserId(credentials.bot.bot_user_id)

    context.succeed({
      ok: 'Habby is auhtorized to your Slack Team'
    })
  })
}