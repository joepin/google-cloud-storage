const express = require('express');
const logger = require('morgan');
const path = require('path');

const app = express();
const port = process.env.port || 3000;

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

const google = require('./google.js');
// first we need to generate the JWT signature, then we need to get an access token from google, and send it back
app.get('/token', google.createSignature, google.getAccessToken, (req, res) => {
  res.json({token: res.access_token});
});

app.listen(port, () => console.warn(`Listening on port ${port}!`));
