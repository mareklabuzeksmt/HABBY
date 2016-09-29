'use strict';

const config = require('dotenv').config();
const db  = require("./db");
const slack  = require("slack");

const service = {
  access: (code, cb) => {
    
    let options = {
      client_id: config.SLACK_CLIENT_ID,  
      client_secret: config.SLACK_CLIENT_SECRET,
      code: code
    }

    slack.oauth.access(options, cb)
  },
  test: () => {
    slack.api.test({test:'test'}, console.log)
  },
  getAccessToken: () => {
      return db.getAccessToken()
  },
  getApiToken: () => {
      return db.getApiToken()
  },  
  listChannels: () => {
    let promise = new Promise((resolve, reject) => {
      service.getAccessToken()
      .then((token) => {
        slack.channels.list({token: token, exclude_archived: 1}, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })
          
      })  
    })

    return promise;    
  },
  getChannelInfo: (channelId) => {
    let promise = new Promise((resolve, reject) => {
      service.getApiToken()
      .then((token) => {
        console.log('token', token)
        slack.channels.info({token:token, channel: channelId}, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })    
      })  
    })

    return promise;
  },
  checkUserPresence: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.getAccessToken()
      .then((token) => {
        slack.users.getPresence({token:token, user: userId}, (err, data) => {
          resolve(data)
        })    
      })  
    });

    return promise;    
  },

  getUserInfo: (userId) => {
     let promise = new Promise((resolve, reject) => {
      service.getAccessToken()
      .then((token) => {
        slack.users.info({token:token, user: userId}, (err, data) => {
          resolve(data);
        })    
      })  
    });

    return promise; 
  },
  
  openDirectChannel: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.getAccessToken()
      .then((token) => {
        slack.im.open({token:token, user: userId}, (err, data) => {
          if (err) {
            reject(err)
          } else {
            db.setDirectChannel(userId, data.channel.id)
            resolve(data.channel.id)
          }
        })    
      })  
    });

    return promise;  
  }, 

  sendReminder: (userId) => {
    let promise = new Promise((resolve, reject) => {

      Promise.all([service.getAccessToken(), db.getDirectChannel()]).then(results => {
         let token = results[0]; // bot token
         let directChannel = results[1]
         let remindText = 'please check-in on status channel'

         if (!directChannel) {
            console.log('Creating direct channel')
            service.openDirectChannel(userId).then(directChannel => {
              slack.chat.postMessage({token:token, channel: directChannel, text: remindText}, (err, data) => {
                if (err) {
                  reject(err)
                } else {
                  console.log('Remind sent')
                  resolve(data)
                }
              })
            });
         } else {
            console.log('Using direct channel', directChannel)
            slack.chat.postMessage({token:token, channel: directChannel, text: remindText}, (err, data) => {
              if (err) {
                reject(err)
              } else {
                console.log('Remind sent')
                resolve(data)
              }
            })
         }
      })  
    });

    return promise;  
  },

  sendReport: (userId, reportBody) => {
    let promise = new Promise((resolve, reject) => {

      Promise.all([service.getAccessToken(), db.getDirectChannel(userId)]).then(results => {
         let token = results[0]; // bot token
         let directChannel = results[1];
         
         if (!directChannel) {
            service.openDirectChannel(userId).then(directChannel => {
              slack.chat.postMessage({token:token, channel: directChannel, text: reportBody}, (err, data) => {
                if (err) {
                  reject(err)
                } else {
                  console.log('report sent');
                  resolve(data)
                }
              })
            });
         } else {
            slack.chat.postMessage({token:token, channel: directChannel, text: reportBody}, (err, data) => {
              if (err) {
                reject(err)
              } else {
                console.log('report sent');
                resolve(data)
              }
            })
         }
      })  
    });

    return promise;  
  }   
};

module.exports = service;
