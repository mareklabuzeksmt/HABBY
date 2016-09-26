'use strict';

const config = require('dotenv').config()
const db = require('../lib/db')
const time = require('../lib/time')
const async = require('async')

// init
db.connect()

module.exports.midnight = (event, context, cb) => {
  console.log('consolidation :)')

  async.waterfall([
        (callback) => {
            db.getUsers()
              .then((users) => { 
                const currentDay =  time.currentDay()
                const currentWeek = time.currentWeek()
                const currentMonth = time.currentMonth()

                async.each(users, (user, callback) => {
                  console.log('processing:', user)
                  let promises = [];

                  //db.setUserCheckInTime(user, 1)
                  //db.setUserCheckOutTime(user, 1 + 5)

                  promises.push(db.getUserCheckInTime(user))
                  promises.push(db.getUserCheckOutTime(user))
                  promises.push(db.getUserHours(user, [`week-${currentWeek}`, `week-${currentWeek}-days`, `month-${currentMonth}`,`month-${currentMonth}-days`]))

                  Promise.all(promises).then((results) => {
                    let hours = results[1] - results[0];
                    
                    console.log('existing payroll', results[2]);    
                    console.log('time',results[1],'-',results[0],'=', results[1] - results[0]);

                    hours = hours >= 0 ? hours: 0

                    let payroll = {
                      [`day-${currentDay}`] : hours,
                      [`week-${currentWeek}`] : Number(results[2][0]) + hours,
                      [`week-${currentWeek}-days`]: Number(results[2][1]) + (hours > 0 ? 1: 0),
                      [`month-${currentMonth}`] : Number(results[2][2]) + hours,
                      [`month-${currentMonth}-days`] : Number(results[2][3]) + (hours > 0 ? 1: 0)
                    }

                    console.log('calculated payroll', payroll);    

                    db.setUserHours(user, payroll).then(() => {
                      callback()
                    })
                  })  
                }, (err) => {
                  callback(null)
                });
            })
        },    
        (callback) => {
            db.getUsers()
              .then((users) => { 
                let promises = [];
                // console.log('users', users) 
                users.forEach(function (user) {
                  console.log('clearing data:', user)

                  promises.push(db.resetLoggedIn(user))
                  promises.push(db.resetAppearedToday(user))
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