'use strict';

const config = require('dotenv').config();
const redis = require("redis");

const service = {
  client: null,
  connect: () => {
    service.client = redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    });

    service.client.on("error", function (err) {
      console.log("RedisError:" + err, null, 2);
    });
  },
  saveAccessTokens: (token, botToken) => {
    service.client.set('access-token', token)
    service.client.set('bot-token', botToken)
  },
  saveBotUserId: (userId) => {
    service.client.set('bot-user-id', userId);
  },  
  getAccessToken: () => {
    let promise = new Promise((resolve, reject) => {
      service.client.get('bot-token', (err, data) => {
        resolve(data);
      });
    })

    return promise;
  },
  getApiToken: () => {
    let promise = new Promise((resolve, reject) => {
      service.client.get('access-token', (err, data) => {
        resolve(data);
      });
    })

    return promise;
  },  
  setStatusChannel: (channel) => {
    let promise = new Promise((resolve, reject) => {
      service.client.set('status-channel', channel, (err, data) => {
        if (err) {
          reject(err)
        } else {
         resolve(data)
        }
      });
    })

    return promise;
  },  
  getStatusChannel: () => {
    let promise = new Promise((resolve, reject) => {
      service.client.get('status-channel', (err, data) => {
        if (err) { 
          reject(err) 
        } else {
          resolve(data);
        }
      });
    })

    return promise;
  },  
  setDirectChannel: (userId, channel) => {
    let promise = new Promise((resolve, reject) => {
      service.client.hset('direct_channels', userId + '-direct-channel', channel, (err, data) => {
        resolve(data);
      });
    })

    return promise;
  },  
  getDirectChannel: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.hget('direct_channels', userId + '-direct-channel', (err, data) => {
        if (err) { 
          reject(err) 
        } else {
          resolve(data);
        }
      });
    })

    return promise;
  }, 
  getDirectChannels: () => {
    let promise = new Promise((resolve, reject)=>{
      service.client.hgetall('direct_channels', (err, data)=>{
        if (err) { 
          reject(err) 
        } else {
          let channels = Object.keys(data || {}).map((key)=>{
            return data[key];
          });
          resolve(channels);
        }
      });
    });

    return promise;
  }, 
  addUser: (userId) => { 
    let promise = new Promise((resolve, reject)=>{
      service.client.sadd('users', userId, (err, data)=>{
        if (err) { 
          reject(err) 
        } else {
          resolve(data);
        }
      });
    });

    return promise; 
  },
  addAllowedUser: (userId) => { 
    service.client.sadd('allowed-users', userId);
  },
  addAdminUser: (userId) => { 
    service.client.sadd('admin-users', userId);
  },
  removeUser: (userId) => { 
    service.client.srem('users', userId);
  },
  removeAllowedUser: (userId) => { 
    service.client.srem('admin-users', userId);
  }, 
  removeAdminUser: (userId) => { 
    service.client.srem('allowed-users', userId);
  },  
  getUsers: () => {
    let promise = new Promise((resolve, reject) => {
      service.client.smembers('users', (err, data) => {
        if (err) { 
          reject(err) 
        } else {
          resolve(data);
        }
      });
    })

    return promise;    
  },
  getAdminUsers: () => {
    let promise = new Promise((resolve, reject) => {
      service.client.smembers('users',(err, data) => {
        if (err) { 
          reject(err) 
        } else {
          resolve(data);
        }
      });
    })

    return promise;    
  },
  markAsLoggedIn: (userId, status) => {
    let promise = new Promise((resolve, reject) => {
      service.client.set(userId + '-logged-in', status, (err, data) => {
        resolve(data);
      });
    })

    return promise;    
  },
  isUserLoggedIn: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.get(userId + '-logged-in', (err, data) => {
        resolve(data);
      });
    })

    return promise;    
  },  
  markAsLoggedOut: (userId, status) => {
    let promise = new Promise((resolve, reject) => {
      service.client.set(userId + '-logged-out', status, (err, data) => {
        resolve(data);
      });
    })

    return promise;    
  },  
  markAsAppearedToday: (userId) => { 
    let promise = new Promise((resolve, reject) => {
      service.client.setnx(userId + '-appeared_today', Date.now(), (err, data) => {
        resolve(data);
      });
    })

    return promise;
  },
  getMarkAsAppearedToday: (userId) => { 
    let promise = new Promise((resolve, reject) => {
      service.client.get(userId + '-appeared_today', (err, data) => {
        resolve(data);
      });
    })

    return promise;
  },
  getMarkAsLoggedOut: (userId) => { 
    let promise = new Promise((resolve, reject) => {
      service.client.get(userId + '-logged-out', (err, data) => {
        resolve(data);
      });
    })

    return promise;
  },  
  canRemind: (userId) => { 
    let promise = new Promise((resolve, reject) => {
      Promise.all([
        service.getMarkAsAppearedToday(userId), 
        service.getMarkAsReminded(userId), 
        service.getUserCheckIn(userId),
        service.getMarkAsLoggedOut(userId),
        service.isUserLoggedIn(userId)
        ])
      .then((results) => {
        console.log(userId, results)
        let timeoutValue = config.REMIND_TIMOUT || 15
        let agree = false;
        let diff = Math.floor((Date.now() - results[0]) / 60000)
        
        let timeLimit = config.REMIND_LAST_CALL
        let timeParams = timeLimit.split(':')
        
        
        let lastCall = new Date()
        lastCall.setHours(timeParams[0])
        lastCall.setMinutes(timeParams[1])
        lastCall.setSeconds(timeParams[2] || 0)
        let cronInterval = config.REMIND_INTERVAL * 60 * 1000


        let isUserLoggedIn = results[4]
        let userWasReminded = results[2]
        let userWasOffline = results[3]
        let appearedToday = results[0]

        // console.log(userId, 'getMarkAsReminded', results[1] == 0)
        // console.log(userId, 'getUserCheckIn', results[2] == 0)
        console.log(userId, 'diff timout', diff, diff >= timeoutValue)
        // console.log(userId, 'conds', results[1] == 0 , userWasReminded == 0 , userWasOffline == 1 , isUserLoggedIn == 1)
        console.log(userId, 'last call', (Date.now() < lastCall.getTime() && Date.now() + cronInterval >= lastCall.getTime()))

        if (Boolean(appearedToday) == 1 && userWasReminded == 0 && isUserLoggedIn == 1
          && ((diff >= timeoutValue) || (Date.now() < lastCall.getTime() && Date.now() + cronInterval >= lastCall.getTime()))
        ) {
          agree = true;
        }

        resolve(agree)
      })
    });

    return promise;
  },  
  markAsReminded: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.set(userId + '-reminded', Date.now(), (err, data) => {
        resolve(data);
      });
    })

    return promise;    
  },
  getMarkAsReminded: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.get(userId + '-reminded', (err, data) => {
        resolve(data);
      });
    })

    return promise;    
  }, 
  getUserCheckIn: (user) => {
    let promise = new Promise((resolve, reject) => {
      service.client.get(user + '_check_in_today', (err, data) => {
        resolve(data);
      });
    });

    return promise;
  },
  setUserCheckIn: (user) => {
    service.client.set(user + '_check_in_today', true);
  },
  getUserCheckInTime: (user) => {
    let promise = new Promise((resolve, reject) => {
      service.client.get(user + '_check_in_time', (err, data) => {
        resolve(data);
      });
    });

    return promise;
  },
  setUserCheckInTime: (user, checkInTime) => {
    service.client.set(user + '_check_in_time', checkInTime);
  },
  getUserCheckOut: (user) => {
    let promise = new Promise((resolve, reject) => {
      service.client.get(user + '_check_out_today', (err, data) => {
        resolve(data);
      });
    });

    return promise;
  },
  setUserCheckOut: (user) => {
    service.client.set(user + '_check_out_today', true);
  },
  getUserCheckOutTime: (user) => {
    let promise = new Promise((resolve, reject) => {
      service.client.get(user + '_check_out_time', (err, data) => {
        resolve(data);
      });
    });

    return promise;
  },
  setUserCheckOutTime: (userId, checkOutTime) => {
    service.client.set(userId + '_check_out_time', checkOutTime);
  },
  resetLoggedIn: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.set(userId + '-logged-in', 0, (err, data) => {
        resolve(data);
      });
    })

    return promise; 
  },  
  resetReminded: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.set(userId + '-reminded', 0, (err, data) => {
        resolve(data);
      });
    })

    return promise; 
  },
  resetAppearedToday: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.del(userId + '-appeared_today', (err, data) => {
        resolve(data);
      });
    })

    return promise; 
  },
  resetUserCheckInToday: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.set(userId + '_check_in_today', 0, (err, data) => {
        resolve(data);
      });
    })

    return promise; 
  },
  resetUserCheckInTime: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.del(userId + '_check_in_time', (err, data) => {
        resolve(data);
      });
    })

    return promise; 
  },  
  resetUserCheckOutToday: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.set(userId + '_check_out_today', 0, (err, data) => {
        resolve(data);
      });
    })

    return promise; 
  },
  resetUserCheckOutTime: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.del(userId + '_check_out_time', (err, data) => {
        resolve(data);
      });
    })

    return promise; 
  },
  resetMarkAsLoggedOut: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.del(userId + '-logged-out', (err, data) => {
        resolve(data);
      });
    })

    return promise; 
  },  
  getUserHours: (userId, keys) => {
    let promise = new Promise((resolve, reject) => {
      service.client.hmget(userId + '-payroll', keys, (err, data) => {
        resolve(data);
      });
    })

    return promise; 
  },
  setUserHours: (userId, values) => {
    let promise = new Promise((resolve, reject) => {
      service.client.hmset(userId + '-payroll', values, (err, data) => {
        resolve(data);
      });
    })

    return promise; 
  } 
};

module.exports = service;