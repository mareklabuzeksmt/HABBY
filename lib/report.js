'use strict';

const db = require("./db");
const slack = require("./slack");
const time = require('./time');

const months = ['month', 'miesiąc'];
const weeks = ['week', 'tydzień'];
const lastPerdiods = ['last', 'ostatni', 'poprzedni'];
const currentPeriods = ['this', 'ten'];
const userReportRegexp = /((?:raport\sza\s(?:ostatni?|ten?|poprzedni?|)\s(?:tydzień?|miesiąc?)))|((?:report\sfor\s(?:last?|this?|previous?)\s(?:week?|month?)))/g;
const teamReportRegexp = /((?:(?:raporty\sza?|zestawienie\sza?)\s(?:ostatni?|ten?|poprzedni?|)\s(?:tydzień?|miesiąc?)))|((?:(?:reports\sfor?|team\sreport\sfor?)\s(?:last?|this?|previous?)\s(?:week?|month?)))/g;

const service = {
    userReportRegexp: userReportRegexp,
    teamReportRegexp: teamReportRegexp,
    getPeriod: (p1, p2) => {
        let periodType = months.indexOf(p2) > -1 ? 'month' : 'week';
        let period;
        if (lastPerdiods.indexOf(p1) > -1) {
            if (periodType === 'month') {
                period = time.previousMonth();
            } else {
                period = time.previousWeek();
            }
        } else {
            if (periodType === 'month') {
                period = time.currentMonth();
            } else {
                period = time.currentWeek();
            }
        }

        return periodType + '-' + period;
    },
    generateUserReport: (userId, period) => {
        let promise = new Promise((resolve, reject) => {
            Promise.all([slack.getUserInfo(userId), db.getUserHours(userId, [period + '-days', period])])
                .then((results) => {
                    let reportBody = results[0].user.name + ' Report for: ' + period + '\n';
                    let totalSec = results[1][1];
                    let hours = parseInt(totalSec / 3600)
                        , minutes = parseInt(totalSec / 60) % 60;

                    let timeConcat = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes);
                    reportBody += (results[1][0] || 0) + ' day(s) - ' + timeConcat + ' hour(s)\n';
                    resolve(reportBody);
                });
        });

        return promise;
    },
    generateTeamReport: (period, userId) => {
        let promise = new Promise((resolve, reject) => {
            db.getAdminUsers()
                .then((adminUsers) => {
                    if (adminUsers.indexOf(userId) > -1) {
                        db.getUsers()
                            .then((users) => {
                                let promises = [];
                                users.forEach((userId) => {
                                    promises.push(slack.getUserInfo(userId));
                                    promises.push(db.getUserHours(userId, [period + '-days', period]));
                                });

                                Promise.all(promises).then((results) => {
                                    let reportBody = 'Team Report for: ' + period + '\n';

                                    for (var i = 0; i < results.length; i += 2) {
                                        let totalSec = results[i + 1][1];
                                        let hours = parseInt(totalSec / 3600)
                                            , minutes = parseInt(totalSec / 60) % 60;

                                        let timeConcat = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes);
                                        reportBody += results[i].user.name + ': ' + (results[i + 1][0] || 0) +' day(s) - ' + timeConcat + ' hour(s)\n';
                                    }
                                    resolve(reportBody);
                                });
                            });
                    } else {
                        reject(userId + ' not authorized to generate team report');
                    }
                });
        });

        return promise;
    }
}

module.exports = service;