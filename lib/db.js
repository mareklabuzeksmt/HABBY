'use strict';

const config = require('dotenv').config();
const redis  = require("redis");

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
      Promise.all([service.getMarkAsAppearedToday(userId), service.getMarkAsReminded(userId)])
      .then((results) => {
        let agree = false;
        let diff = Math.floor((Date.now() - results[0]) / 60000)

        if (!results[1] && diff >= 15) {
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
};

module.exports = service;