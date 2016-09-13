'use strict';

const config = require('dotenv').config();

const redis = require("redis");
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

client.on("error", function (err) {
    console.log("RedisError:" + err, null, 2);
});

module.exports.authorize = (event, context, cb) => {
  // console.log('event', JSON.stringify(event, null, 2));
  // console.log('context', JSON.stringify(context, null, 2));

  let permissions = [
    'channels:write,channels:read,bot,chat:write:bot,chat:write:user,im:read,im:write'
  ];

  // TODO: replace client_id, redirect_uri depend on env
  let url = 'https://slack.com/oauth/authorize?'+
    'client_id=' + '36296541748.77041816724' + '&' + 
    'scope=' + 'channels:write,channels:read,bot,chat:write:bot,chat:write:user,im:read,im:write' + '&' +
    'redirect_uri=' + 'https://bbuzqv0311.execute-api.us-east-1.amazonaws.com/dev/access'
    ;

   context.succeed({
        location : url
   });
};

module.exports.access = (event, context, cb) => {
  // console.log('event', JSON.stringify(event, null, 2));
  // console.log('context', JSON.stringify(context, null, 2));

  client.incr('testing-lambda');

  client.get('testing-lambda', (error, data) => {
    context.succeed({
        ok : 'ok',
        q: data
    });
  })  

};

module.exports.index = (event, context, cb) => cb(null,
  { message: 'Go Serverless v1.0! Your function executed successfully!', event }
);