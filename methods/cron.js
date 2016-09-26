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
  let process = (users) => {
    let promise = new Promise((resolve, reject) => {
      users.forEach((userId, index) => {
        console.log('checking', userId, index, users.length);
        // TODO: skip already check in/reminded
        slack.checkUserPresence(userId)
        .then((status) => {
          console.log('presence data', JSON.stringify(status, null, 2));
          if ('active' === status.presence) {
            console.log('mark as logged in');
            // update flags
            //db.markAsLoggedIn(userId, 1);
            //db.markAsAppearedToday(userId);
          } else {
            // db.markAsLoggedIn(userId, 0);
          }

          return status.presence;
        })
        .then((status) => {
          if ('active' === status) return db.canRemind(userId);
          if ('active' !== status) return false;
        })
        .then((flag) => {
          // if (!flag) return false;
          // if (flag) return slack.sendReminder(userId);
          return true;
        })
        .then((reminded) => {
          return true;
          // if (!reminded) return false;
          // if (reminded) db.markAsReminded(userId); 
        })
        .then(() => {
          console.log(index, users.length, index === users.length - 1);
          if (index === users.length - 1) {
            console.log('completed')
            resolve('completed')
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