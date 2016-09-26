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
  saveAccessToken: (token) => {
    service.client.set('access-token', token);
  },
  getAccessToken: () => {
    let promise = new Promise((resolve, reject) => {
      resolve('xoxp-36296541748-36306925829-77176934322-d42a975a41');
      /*
      service.client.get('access-token', (data) => {
        resolve(data);
      });*/
    })

    return promise;
  },
  setStatusChannel: (channel) => {
    let promise = new Promise((resolve, reject) => {
      service.client.set('status-channel', channel, (err, data) => {
        resolve(data);
      });
    })

    return promise;
  },  
  getStatusChannel: () => {
    // C299PHU2D
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
      service.client.set(userId + '-direct-channel', channel, (err, data) => {
        resolve(data);
      });
    })

    return promise;
  },  
  getDirectChannel: (userId) => {
    let promise = new Promise((resolve, reject) => {
      service.client.get(userId + '-direct-channel', (err, data) => {
        if (err) { 
          reject(err) 
        } else {
          resolve(data);
        }
      });
    })

    return promise;
  },  
  addUser: (userId) => { 
    service.client.sadd('users', userId)
  },
  addAllowedUser: (userId) => { 
    service.client.sadd('allowed-users', userId);
  },
  removeUser: (userId) => { 
    service.client.srem('users', userId);
  },
  removeAllowedUser: (userId) => { 
    service.client.srem('allowed-users', userId);
  },  
  getUsers: () => {
    let promise = new Promise((resolve, reject) => {
      service.client.sinter('users','allowed-users', (err, data) => {
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
  canRemind: (userId) => { 
    let promise = new Promise((resolve, reject) => {
      Promise.all([
        service.getMarkAsAppearedToday(userId), 
        service.getMarkAsReminded(userId), 
        service.getUserCheckIn(userId)])
      .then((results) => {
        console.log(userId, results)
        let timeoutValue = config.REMIND_TIMOUT || 15
        let agree = false;
        let diff = Math.floor((Date.now() - results[0]) / 60000)

        console.log(userId, 'getMarkAsReminded', results[1] == 0)
        console.log(userId, 'getUserCheckIn', results[2] == 0)

        console.log(userId, 'diff', diff, diff >= timeoutValue)

        if (results[1] == 0 && results[2] == 0 && diff >= timeoutValue) {
          agree = true;
        }

        resolve(agree);
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
      service.client.del(userId + '_check_in_time', 0, (err, data) => {
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
      service.client.del(userId + '_check_out_time', 0, (err, data) => {
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