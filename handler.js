'use strict';

const config = require('dotenv').config();
const db = require('./lib/db');
const slack = require('./lib/slack');
const byeRegexp = /bye-bye|bye|bb|wylogowuję się|kończę/g;
// init
db.connect();

module.exports.authorize = (event, context, cb) => {
  // console.log('event', JSON.stringify(event, null, 2));
  // console.log('context', JSON.stringify(context, null, 2));

  let permissions = [
    'channels:write,channels:read,bot,chat:write:bot,chat:write:user,im:read,im:write'
  ];

  // TODO: replace client_id, redirect_uri depend on env
  let url = 'https://slack.com/oauth/authorize?' +
    'client_id=' + '36296541748.77041816724' + '&' +
    'scope=' + 'channels:write,channels:read,bot,chat:write:bot,chat:write:user,im:read,im:write' + '&' +
    'redirect_uri=' + 'https://bbuzqv0311.execute-api.us-east-1.amazonaws.com/dev/access'
    ;

  context.succeed({
    location: url
  });
};

module.exports.access = (event, context, cb) => {
  //console.log('event', JSON.stringify(event, null, 2));
  //console.log('context', JSON.stringify(context, null, 2));

  slack.access(event.body.code, (err, accessToken) => {
    db.saveAccessToken(accessToken);

    context.succeed({
      ok: 'ok'
    });
  });
};

module.exports.cron = (event, context, cb) => {
  let process = (users) => {
    let promise = new Promise((resolve, reject) => {
      users.forEach((userId, index) => {
        console.log('checking', userId, index, users.length);
        slack.checkUserPresence(userId)
        .then((status) => {
          console.log('presence data', JSON.stringify(status, null, 2));
          if ('active' === status.presence) {
            // update flags
            db.markAsLoggedIn(userId, 1);
            db.markAsAppearedToday(userId);
          } else {
            db.markAsLoggedIn(userId, 0);
          }

          return status.presence;
        })
        .then((status) => {
          if ('active' === status) return db.canRemind(userId);
          return false;
        })
        .then((flag) => {
          if (!flag) return false;
          if (flag) return slack.sendReminder(userId);
        })
        .then((reminded) => {
          if (!reminded) return false;
          if (reminded) db.markAsReminded(userId); 
        })
        .then(() => {
          if (index === users.length - 1) {
            resolve('completed');
          }
        })
      })
    })

    return promise;
  }

  db.getUsers()
  .then((users) => {
    if (users.length) {
      process(users).then(() => {
        context.succeed({status : 'completed'});  
      });
    } else {
      context.succeed({status : 'completed'});  
    }
  })

  


};

module.exports.challenge = (event, context, cb) => {
  //console.log('event', JSON.stringify(event, null, 2));
  let slackEvent = event.body.event;

  if (slackEvent.type === 'message') {
    db.getStatusChannel().then((channel) => {
      if (channel === slackEvent.channel) {
        console.log('new message on status channel');
        db.getUserCheckIn(slackEvent.user).then((checkIn) => {
          if (!checkIn) {
            console.log(slackEvent.user + ' check in today');
            db.setUserCheckIn(slackEvent.user);
            db.setUserCheckInTime(slackEvent.user, slackEvent.ts);
          } else if (byeRegexp.test(slackEvent.text)) {
            db.getUserCheckOut(slackEvent.user).then((checkOut) => {
              if (!checkOut) {
                console.log(slackEvent.user + ' check out today');
                db.setUserCheckOut(slackEvent.user);
                db.setUserCheckOutTime(slackEvent.user, slackEvent.ts);
              }
            });

          }
        });
      }
    });
  }

  if (event.body && 'challenge' in event.body) {
    cb(null, { challenge: event.body.challenge })
  } else {
    cb(null, { ok: 'ok' })
  }
};