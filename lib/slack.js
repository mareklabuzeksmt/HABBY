'use strict';

const config = require('dotenv').config();
const db  = require("./db");
const slack  = require("slack");

const service = {
  access: (code, cb) => {
    // TODO: read client data from config
    let options = {
      client_id: '',  
      client_secret: '',
      code: code
    }

    slack.oauth.access(options, cb);
  },
  test: () => {
    slack.api.test({hello:'world'}, console.log)
  },
  getAccessToken: () => {
      return db.getAccessToken();
  },
  listChannels: () => {
    service.getAccessToken().then((token)=> {
      slack.channels.list({token: token, exclude_archived: 1}, (err, data) => {
        console.log('channel list', data.channels[3].members);
      })
    })
  },
  getChannelInfo: (channelId) => {
    let promise = new Promise((resolve, reject) => {
      service.getAccessToken()
      .then((token) => {
        slack.channels.info({token:token, channel: channelId}, (err, data) => {
          resolve(data)
        })    
      })  
    });

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
        token = 'xoxb-77262931091-SiOcBWoVu9LQpnNj2HKZu6Gi'; // bot token
        slack.im.open({token:token, user: userId}, (err, data) => {
          if (err) {
            reject(err)
          } else {
            db.setDirectChannel(userId, data.channel.id);
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
         let token = 'xoxb-77262931091-SiOcBWoVu9LQpnNj2HKZu6Gi'; // bot token
         let directChannel = results[1];
         
         if (!directChannel) {
            console.log('Creating direct channel')
            service.openDirectChannel(userId).then(directChannel => {
              slack.chat.postMessage({token:token, channel: directChannel, text: "Status reminder"}, (err, data) => {
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
            slack.chat.postMessage({token:token, channel: directChannel, text: "Status reminder"}, (err, data) => {
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
         let token = 'xoxb-77262931091-SiOcBWoVu9LQpnNj2HKZu6Gi'; // bot token
         let directChannel = results[1];
         
         if (!directChannel) {
            service.openDirectChannel(userId).then(directChannel => {
              slack.chat.postMessage({token:token, channel: directChannel, text: reportBody}, (err, data) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(data)
                }
              })
            });
         } else {
            slack.chat.postMessage({token:token, channel: directChannel, text: reportBody}, (err, data) => {
              if (err) {
                reject(err)
              } else {
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
