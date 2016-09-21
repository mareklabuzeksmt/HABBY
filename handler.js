'use strict';

const config = require('dotenv').config();
const db = require('./lib/db');
const slack = require('./lib/slack');

// init
db.connect();

module.exports.authorize = (event, context, cb) => {
  // console.log('event', JSON.stringify(event, null, 2));
  // console.log('context', JSON.stringify(context, null, 2));

  let permissions = [
    'channels:write,channels:read,bot,chat:write:bot,chat:write:user,im:read,im:write'
  ];

  // TODO: replace client_id, redirect_uri depend on env
  let url = 'https://slack.com/oauth/authorize?'+
    'client_id=' + '36296541748.77041816724' + '&' + 
    'scope=' + 'channels:write,channels:read,bot,chat:write:bot,chat:write:user,im:read,im:write' + '&' +
    'redirect_uri=' + 'https://bbuzqv0311.execute-api.us-east-1.amazonaws.com/dev/access'
    ;

   context.succeed({
        location : url
   });
};

module.exports.access = (event, context, cb) => {
  //console.log('event', JSON.stringify(event, null, 2));
  //console.log('context', JSON.stringify(context, null, 2));

  slack.access(event.body.code, (err, accessToken) => {
    db.saveAccessToken(accessToken);

    context.succeed({
        ok : 'ok'
    });
  });
};

module.exports.cron = (event, context, cb) => {
  db.getUsers().then((users) => {
    if (users.length) {
      users.map((userId) => {
        console.log('checking', userId);
        slack.checkUserPresence(userId).then((status) => {
          console.log('presence data', status);

          if ('active' === status.presence) {
            // update flags
            db.markAsLoggedIn(userId, 1);
            db.markAsAppearedToday(userId);

            // send reminder
            db.canRemind(userId)
            .then((flag) => {
              if (!flag) return false;
              if (flag) { return slack.sendReminder(userId) }
            })
            .then((reminded) => {
               if (reminded) db.markAsReminded(userId); 
            });
            
          } else {
            db.markAsLoggedIn(userId, 0);
          }

          // logged in (bool) – <user id>_logged_in, e.g. U2423423_logged_in
          // time of last disappearing on Slack (timestamp) – <user id>_last_disppearance_time
        })
      })
    }
  })

  context.succeed({status : 'completed'});
};

module.exports.challenge = (event, context, cb) => {
  //console.log('event', JSON.stringify(event, null, 2));

  if (event.body && 'challenge' in event.body) {
    cb(null,{ challenge: event.body.challenge})
  } else {
    cb(null,{ ok: 'ok'})
  }
};