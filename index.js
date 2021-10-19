const express = require('express');
var request = require('request');

const app = express();
var bot = require('./app');

app.get('/', (req, res) => {
  res.send('Hello Express app!');
});

app.listen(3000, () => {
  console.log('server started');
});



var inter = setInterval(() => {
request('https://rate-limit.scisamer.repl.co', function (){});
}, 7 * 1000 * 60);


