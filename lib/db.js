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
  getStatusChannel: () => {
    let promise = new Promise((resolve, reject) => {
      resolve('C299PHU2D');

      // service.client.get('status-channel', (data) => {
      //   resolve(data);
      // });

    });

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
  setUserCheckOutTime: (user, checkOutTime) => {
    service.client.set(user + '_check_out_time', checkOutTime);
  }
};

module.exports = service;