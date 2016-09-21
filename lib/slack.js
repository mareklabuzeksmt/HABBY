'use strict';

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
      slack.channels.list({token: token}, (err, data) => {
        console.log('channel list', data.channels[3].members);
      })
    })
  },
  getChannelInfo: (channelId) => {
    service.getAccessToken().then((token)=> {
      slack.channels.info({token:token, channel: channelId}, (err, data) => {
        console.log('channel info', data);
      })    
    })    
  },
  checkUserPresence: (userId) => {
    service.getAccessToken().then((token)=> {
      slack.users.getPresence({token:token, user: userId}, (err, data) => {
        console.log('user info', data);
      })    
    })     
  },
  sendReminder: (userId) => {
    service.getAccessToken().then((token)=> {
      slack.chat.postMessage({token:token, channel: userId, text: "Status reminder"}, (err, data) => {
        console.log('user info', data);
      })    
    })     
  }  
};

module.exports = service;
