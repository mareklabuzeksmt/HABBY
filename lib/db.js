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

      // service.client('status-channel', (data) => {
      //   resolve(data);
      // });

    });

    return promise;
  }
};

module.exports = service;