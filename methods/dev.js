'use strict';

const config = require('dotenv').config()
const db = require('../lib/db')
const time = require('../lib/time')
const async = require('async')

// init
db.connect()

module.exports.debug = (event, context, cb) => {
  console.log(event)

  const userId =  event.query.userId

  async.waterfall([
        (callback) => {
            let data = {
               userId: userId,
               flags: {},
               payroll: {}
            }

            callback(null, data)
        },
        (data, callback) => {
            console.log('userId', userId);
            Promise.all([
              db.getMarkAsAppearedToday(userId),
              db.getMarkAsReminded(userId),
              db.getUserCheckIn(userId),
              db.getUserCheckInTime(userId),
              db.getUserCheckOut(userId),
              db.getUserCheckOutTime(userId),
              db.getMarkAsLoggedOut(userId),
              db.canRemind(userId)
            ]).then((results) => {
              console.log('flags', results);

              data.flags = {
                'appearedToday' : results[0],
                'wasOfflineToday': results[6],
                'reminded' : results[1],
                'checkIn' : results[2],
                'checkInTime' : results[3],
                'checkOut' : results[4],
                'checkOutTime' : results[5]
              }

              data.canRemind = results[7]

              callback(null, data)
            })
        },
        (data, callback) => {
            const currentDay =  time.currentDay()
            const currentWeek = time.currentWeek()
            const currentMonth = time.currentMonth()

            let keys = [
              `day-${currentDay}`,
              `week-${currentWeek}`,
              `month-${currentMonth}`
            ]

            db.getUserHours(userId, keys).then((results) => {
              console.log('hours', results);

              data.payroll = {
                [keys[0]]: results[0],
                [keys[1]]: results[1],
                [keys[2]]: results[2]
              }

              callback(null, data)
            })
        }                
    ], (err, result) => {
        err ?
          context.fail(err) :
          context.succeed(result)
    }
  )
}

module.exports.reset = (event, context, cb) => {
  console.log('reset')

  async.waterfall([   
        (callback) => {
            db.getUsers()
              .then((users) => { 
                let promises = [];
                // console.log('users', users) 
                users.forEach(function (user) {
                  console.log('clearing data:', user)

                  promises.push(db.resetLoggedIn(user))
                  promises.push(db.resetAppearedToday(user))
                  promises.push(db.resetMarkAsLoggedOut(user))
                  promises.push(db.resetReminded(user))
                  promises.push(db.resetUserCheckInToday(user))
                  promises.push(db.resetUserCheckOutToday(user))
                  promises.push(db.resetUserCheckInTime(user))
                  promises.push(db.resetUserCheckOutTime(user))
                });

                return Promise.all(promises)  
              })
              .then(() => {
                callback(null)
              })
        }
    ], (err, result) => {
        err ?
          context.fail(err) :
          context.succeed({status : 'completed'})
    }
  )
}