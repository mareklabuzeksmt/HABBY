'use strict';

const config = require('dotenv').config()
const db = require('./lib/db')
const slack = require('./lib/slack')
const byeRegexp = /bye-bye|bye|bb|wylogowuję się|kończę na dziś/g
const reports = require('./lib/report')
const async = require('async')

// init
db.connect();

module.exports.authorize = (event, context, cb) => {
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
}

module.exports.access = (event, context, cb) => {
  slack.access(event.body.code, (err, accessToken) => {
    db.saveAccessToken(accessToken);

    context.succeed({
      ok: 'ok'
    });
  });
}

module.exports.challenge = (event, context, cb) => {
  console.log('event', JSON.stringify(event, null, 2))
  
  event.body = event.body || {}

  let slackEvent = 'event' in event.body ? event.body.event : null

  console.log('slack event', slackEvent)

  let processMessageEvent = (slackEvent) => {
    let promise = new Promise((resolve, reject) => {
      
      async.waterfall([
        (callback) => {
          console.log('processing checking #1')
          db.getUserCheckIn(slackEvent.user)
          .then((checkIn) => {
            callback(null, checkIn)  
          })
          .catch((checkIn) => {
            callback('Error: checkin status could not be fetched')  
          })
        },
        (checkIn, callback) => {
          console.log('processing checking #2')

          if (checkIn == false) {
            console.log(slackEvent.user + ' check in today')

            Promise.all([
              db.setUserCheckIn(slackEvent.user),
              db.setUserCheckInTime(slackEvent.user, slackEvent.ts)
            ])
            .then(() => {
              callback(null, true)
            })
            .catch((checkIn) => {
              callback('Error: checkin status could not be set for user')  
            })            
          } else {          
            callback(null, true)
          }
        },
        (status, callback) => {
            console.log('processing checking #3')
            //
            if (byeRegexp.test(slackEvent.text)) {
              db.getUserCheckOut(slackEvent.user)
              .then((checkOut) => {
                if (checkOut == false) {
                  console.log(slackEvent.user + ' check out today')

                  Promise.all([
                    db.setUserCheckOut(slackEvent.user),
                    db.setUserCheckOutTime(slackEvent.user, slackEvent.ts)
                  ])
                  .then(() => {
                    callback(null, true)
                  })
                  .catch((checkIn) => {
                    callback('Error: checkout status could not be set for user')  
                  })  
                } else {
                  callback(null, true)
                }
              })
              .catch(() => {
                callback('Error: checkout status could not be set for user')  
              })
            } else {
                  callback(null, true)
            } 
        }
      ], (err, result) => {
          console.log(4)
          if (err) {
            reject(err)
          } else {
            resolve('ok')
          }
      })
    })      
    
    return promise
  }
  
  let processReportEvent = (userReports, teamReports, slackEvent) => {
    let promise = new Promise((resolve, reject) => {
      let queryParams, p1, p2, reportPeriod;
      if(userReports) {
        console.log('Process user report request');
        queryParams = userReports[0].split(' ');
        p1 = queryParams[2];
        p2 = queryParams[3];
        reportPeriod = reports.getPeriod(p1,p2);
        reports.generateUserReport(slackEvent.user, reportPeriod)
          .then((report)=>{
            slack.sendReport(slackEvent.user, report)
              .then((data)=>{
                resolve(report);
              })
              .catch((error)=>{
                reject('problem with sending message to slack' + error.message);
                console.log(error);
              });
          })
          .catch((error)=>{
            reject(error);
            console.log(error);
          });
      } else if(teamReports) {
        console.log('Process team report request');
        queryParams = teamReports[0].split(' ');
        p1 = queryParams[queryParams.length > 4 ? 3 : 2]; //team report for last week = 5, reports for last week = 4
        p2 = queryParams[queryParams.length > 4 ? 4 : 3];
        reportPeriod = reports.getPeriod(p1,p2);
        reports.generateTeamReport(reportPeriod, slackEvent.user)
          .then((report)=>{
            slack.sendReport(slackEvent.user, report)
              .then((data)=>{
                resolve(report);
              })
              .catch((error)=>{
                reject('problem with sending message to slack' + error.message);
                console.log(error);
              });
          })
          .catch((error)=>{
            reject(error);
            console.log(error);
          });
      } else {
        reject('No report queries to process');
      }
    });

    return promise;
  }

  if ('challenge' in event.body) {
    console.log('challenge')
    context.succeed({ challenge: event.body.challenge })
  } else if (slackEvent && slackEvent.type === 'message') {
    console.log('message')

    db.getStatusChannel()
    .then((channel) => {
      //check if message on status channel
      if (channel === slackEvent.channel) {
        console.log('new message on status channel')
        
        processMessageEvent(slackEvent)
        .then(() => {
           context.succeed({status: 'ok'})
        })
        .catch((err) => {
          console.log(err)
          context.fail('Error process event failed.' + err.message)
        }) 
        
      } else {
        //check if message on direct channel and process /report query
        db.getDirectChannels().then((channels) => {
          if(channels.length && channels.indexOf(slackEvent.channel) > -1) {
            console.log('new message on direct channel');
            //processMessageEvent(slackEvent);
            
            let userReportMatches = slackEvent.text.match(reports.userReportRegexp);
            let teamReportMatches = slackEvent.text.match(reports.teamReportRegexp);
            if(userReportMatches || teamReportMatches) {
            processReportEvent(userReportMatches,teamReportMatches,slackEvent)
              .then(() => {
                context.succeed({status: 'ok'})
              })
              .catch((err) => {
                console.log(err)
                context.fail('Error process report event failed. ' + err.message)
              });
            } else {
              context.succeed({status: 'ok'})
            }
          }
        })
      }
    })
    .catch(() => {
      context.fail('Error status channel could not be fetched')
    }) 
  } else {
    context.fail('Unsupported operation')
  }
}