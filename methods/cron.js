  'use strict';

const config = require('dotenv').config();
const db = require('../lib/db');
const slack = require('../lib/slack');
const async = require('async')

// init
db.connect();

module.exports.cron = (event, context, cb) => {
  // TODO: check for new users on a channel
  // TODO: protect againt paralle execution of cron and midnight scripts
  async.waterfall([
    (callback) => {
      db.getStatusChannel().then((channelId) => {
        console.log('channelId', channelId)
        callback(null, channelId)  
      })
      
    },        
    (channelId, callback) => {
      slack.getChannelInfo(channelId).then((channelData) => {
        callback(null, channelData.channel.members)  
      })
    },    
    (users, callback) => {
      console.log('users', users);

      async.each(users, (userId, loop) => {
        console.log('processing:', userId)
        
        slack.checkUserPresence(userId)
        .then((status) => {
            console.log(status)
            async.waterfall([
              (callback) => {
                db.addUser(userId)
                .then(() => {
                    callback(null, true)
                }).catch(() => {
                    callback('Fail to add users')
                })
              },   
              (result, callback) => {
                db.getMarkAsLoggedOut(userId).then((wasOffline) => {
                    console.log(userId + ':was offline today', wasOffline, Number(wasOffline) == 1)
                    callback(null, Number(wasOffline) == 1)
                }).catch(() => {
                    callback('Fail to add users')
                })
              },                
              (wasOffline, callback) => {
                console.log('injected wasOffline', wasOffline)
                // check if logged in
                if ('active' === status.presence) {
                  console.log(userId + ':mark as logged in')
                  let actions = [
                    db.markAsLoggedIn(userId, 1)
                  ]
                  if (wasOffline) actions.push(db.markAsAppearedToday(userId))

                  Promise.all(actions)
                  .then(() => {
                    console.log(userId + ':marked as logged in')
                    wasOffline ?
                      console.log(userId + ':marked as appeared today') :
                      console.log(userId + ':not marked as appeared today. Your was not offline today.') 

                    callback(null);
                  })
                  .catch(() => {
                    callback('Error: User not marked as logged in.')
                  })
                } else {
                  callback(null)
                }
              },
              (callback) => {
                // check if logged out
                if ('active' !== status.presence) {
                  console.log(userId + ':mark as logged out')
                  Promise.all([
                    db.markAsLoggedIn(userId, 0),
                    db.markAsLoggedOut(userId, 1)
                  ])
                  .then(() => {
                    console.log(userId + ':marked as logged out')
                    callback(null);
                  })
                  .catch(() => {
                    callback('Error: user not marked as logged out.')
                  })
                } else {
                  callback(null)
                }
              },       
              (callback) => {
                db.canRemind(userId)
                .then((can) => {
                  console.log(userId + ':Can remind?', can)
                  callback(null, can)
                })
                .catch(()=> {
                  callback('Error: could not get user remind status.')
                })
              },    
              (can, callback) => {
                if (can) {
                  slack.sendReminder(userId)
                  .then(() => {
                    console.log('User reminded on slack')
                    callback(null, true)  
                  })
                  .catch(() => {
                    callback('Error: could not get user remind status.')
                  })                    
                } else {
                  callback(null, false)
                }
              },     
              (reminded, callback) => {
                if (reminded) {
                  db.markAsReminded(userId)
                  .then(() => {
                    console.log('User marked as reminded')
                    callback(null, true)  
                  })
                  .catch(() => {
                    callback('Error: could not mark user reminded.')
                  })                    
                } else {
                  callback(null, true)
                }
              },                                                
            ], (err, result) => {
              loop(err, result)  
            })
        })
        .catch((err) => {
          loop(err)  
        })

      }, (err) => {
        callback(null)
      });      
    }
  ], (err, result) => {
        err ?
          context.fail(err) :
          context.succeed({status : 'completed'})
  })
}