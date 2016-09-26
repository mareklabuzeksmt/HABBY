'use strict';

const config = require('dotenv').config();
const db = require('./lib/db');
const slack = require('./lib/slack');
const byeRegexp = /bye-bye|bye|bb|wylogowuję się|kończę/g;
const reports = require('./lib/report');

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
  console.log('event', JSON.stringify(event, null, 2));
  
  let slackEvent = event.body.event;

  let processMessageEvent = (slackEvent) => {
     db.getUserCheckIn(slackEvent.user).then((checkIn) => {
          if (checkIn == false) {
            console.log(slackEvent.user + ' check in today');
            db.setUserCheckIn(slackEvent.user);
            db.setUserCheckInTime(slackEvent.user, slackEvent.ts);
          } else if (byeRegexp.test(slackEvent.text)) {
            db.getUserCheckOut(slackEvent.user).then((checkOut) => {
              if (checkOut == false) {
                console.log(slackEvent.user + ' check out today');
                db.setUserCheckOut(slackEvent.user);
                db.setUserCheckOutTime(slackEvent.user, slackEvent.ts);
              }
            });

          }
        });
  }

  let processReportMessage = (userReports, teamReports, slackEvent) => {
    let queryParams, p1, p2, reportPeriod;
    if(userReports) {
      queryParams = userReports[0].split(' ');
      p1 = queryParams[2];
      p2 = queryParams[3];
      reportPeriod = reports.getPeriod(p1,p2);
      reports.generateUserReport(slackEvent.user, reportPeriod)
        .then((results)=>{
          console.log(results);
          slack.sendReport(slackEvent.user, results);
        });
    } else if(teamReports) {
      queryParams = teamReports[0].split(' ');
      p1 = queryParams[2];
      p2 = queryParams[3];
      reportPeriod = reports.getPeriod(p1,p2);
      reports.generateTeamReport(reportPeriod,slackEvent.user)
        .then((results)=>{
          console.log(results);
          slack.sendReport(slackEvent.user, results);
        })
        .catch((error)=>{
          console.log(error);
        });
    }
  }

  if (slackEvent.type === 'message') {
    db.getStatusChannel().then((channel) => {
      //check if message on status channel
      if (channel === slackEvent.channel) {
        console.log('new message on status channel');
        processMessageEvent(slackEvent);
      } else {
        //check if message on direct channel and process /report query
        db.getDirectChannels().then((channels) => {
          if(channels.length && channels.indexOf(slackEvent.channel) > -1) {
            console.log('new message on direct channel');
            //processMessageEvent(slackEvent);
            let userReportMatches = slackEvent.text.match(reports.userReportRegexp);
            let teamReportMatches = slackEvent.text.match(reports.teamReportRegexp);
            processReportMessage(userReportMatches,teamReportMatches,slackEvent);
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