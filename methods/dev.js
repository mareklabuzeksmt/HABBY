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
            ]).then((results) => {
              console.log('flags', results);

              data.flags = {
                'appearedToday' : results[0],
                'reminded' : results[1],
                'checkIn' : results[2],
                'checkInTime' : results[3],
                'checkOut' : results[4],
                'checkOutTime' : results[5]
              }


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