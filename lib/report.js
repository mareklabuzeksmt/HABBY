'use strict';

const db  = require("./db");
const slack  = require("slack");
const time = require('./time');

const months = ['month', 'miesiąc'];
const weeks = ['week', 'tydzień'];
const lastPerdiods = ['last','ostatni','poprzedni'];
const currentPeriods = ['this', 'ten'];

const service = {

  getPeriod: (p1,p2) => {
      let periodType = months.indexOf(p2) > -1 ? 'month' : 'week';
      let period;
      if(lastPerdiods.indexOf(p1) > -1) {
        if(periodType === 'month') {
                    period = time.previousMonth();
        } else {
            period = time.previousWeek();
        }
      } else {
          if(periodType === 'month') {
            period = time.currentMonth();
          } else {
            period = time.currentWeek();
          }
      }

      return periodType + '-' + period;
  },
  generateTeamReport: (period) => {
      let promise = new Promise((resolve, reject) => {
          db.getUsers()
            .then((users) => {
                let promises = [];

                users.forEach((userId) => {
                    promises.push(db.getUserHours(userId,[period+'-days', period]));
                });

                Promise.all(promises).then((results) => {
                    let reportBody = 'Team Report for: ' + period + '\n';
                    reportBody += results.join('\n');
                    resolve(reportBody);
                });
            });
      });

      return promise;
  }
}

module.exports = service;