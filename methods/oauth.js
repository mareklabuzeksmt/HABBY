'use strict';

const config = require('dotenv').config()
const db = require('../lib/db')
const slack = require('../lib/slack')

// init
db.connect()

module.exports.authorize = (event, context, cb) => {
  console.log(event)
  console.log(context)
  console.log(config)

  let permissions = [
    'channels:write,channels:read,bot,chat:write:bot,chat:write:user,im:read,im:write'
  ]

  let url = 'https://slack.com/oauth/authorize?' +
    'client_id=' + config.SLACK_CLIENT_ID + '&' +
    'scope=' + 'channels:write,channels:read,bot,chat:write:bot,chat:write:user,im:read,im:write' + '&' +
    'redirect_uri=' + 'https://' + event.headers.Host + '/' + event.stage + '/access'
    
  context.succeed({
    location: url
  })
}

module.exports.access = (event, context, cb) => {
  slack.access(event.body.code, (err, accessToken) => {
    console.log('accessToken', accessToken)
    db.saveAccessToken(accessToken)

    context.succeed({
      ok: 'ok'
    })
  })
}