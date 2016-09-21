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

module.exports.challenge = (event, context, cb) => {
  //console.log('event', JSON.stringify(event, null, 2));
  let slackEvent = event.body.event;
  /*
  id: 'C2B4R4U21',
       name: 'habby',
       is_channel: true,
       created: 1473776083,
       creator: 'U1290T7QD',
       is_archived: false,
       is_general: false,
       is_member: true,
       members: [Object],
       topic: [Object],
       purpose: [Object],
       num_members: 8 } 
  */
  /*
  id: 'C2B4R4U21',
     name: 'habby',
     is_channel: true,
     created: 1473776083,
     creator: 'U1290T7QD',
     is_archived: false,
     is_general: false,
     is_member: true,
     last_read: '1474444724.000003',
     latest:
      { type: 'message',
        user: 'U2B220MHS',
        text: '+ update <https://wiki.intive.com/confluence/display/HAB/Pesistent+data>',
        ts: '1474444724.000003' },
     unread_count: 0,
     unread_count_display: 0,
     members:
      [ 'U1290T7QD',
        'U2B220MHS',
        'U2B4H12F6',
        'U2B4H3LUU',
        'U2B4VG2CX',
        'U2B4YBFQF',
        'U2BC85JLT',
        'U2BHZMXPY' ],
     topic: { value: '', creator: '', last_set: 0 },
     purpose: { value: '', creator: '', last_set: 0 } } } 
  */

  //console.log('event',JSON.stringify(event, null, 2));

  //slack.listChannels();
  //slack.getChannelInfo('C299PHU2D');
  //slack.checkUserPresence('U1290T7QD');

  //slack.sendReminder('U1290T7QD');


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