const jwt = require('jsonwebtoken');
const fs = require('fs');
const fetch = require('node-fetch');

function createSignature(req, res, next) {
  // get private key of the service account provided by Google
  /******* CHANGE THE PATH TO YOUR KEY HERE *******/
  const cert = fs.readFileSync('private.key');

  // get the service account email from the environment variables
  // should look something like this: "761326798069-r5mljlln1rd4lrbhg75efgigp36m78j5@developer.gserviceaccount.com"
  const SERVICE_ACCOUNT = process.env.SERVICE_ACCOUNT;

  // get the scope from the environment variables
  // example scope is: "https://www.googleapis.com/auth/devstorage.read_write"
  // scopes for cloud storage can be found here: https://cloud.google.com/storage/docs/authentication#oauth-scopes
  const SCOPE = process.env.SCOPE;

  // create a payload object for the JWT. Exact specs can be found here: https://developers.google.com/identity/protocols/OAuth2ServiceAccount
  // note that we're setting the token to be valid from now to 30 minutes from now ('iat' and 'exp' fields, respectively)
  const payload = {
    iss: SERVICE_ACCOUNT,
    scope: SCOPE,
    aud: "https://www.googleapis.com/oauth2/v4/token",
    exp: Date.now() + (30 * 60 * 1000),
    iat: Date.now(),
  };

  const signature = jwt.sign(payload, cert, { algorithm: 'RS256'});
  res.jwt = signature;
  next();
}

function getAccessToken(req, res, next) {
  const signature = res.jwt;

  // make a request to the auth endpoint with the signature
  // see here for details: https://developers.google.com/identity/protocols/OAuth2ServiceAccount
  fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: {
      'grant_type': encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer'),
      'assertion': encodeURIComponent(signature),
    }
  })
  .then(r => r.json())
  .then(response => {
    // check to make sure we have a valid response; if not, error out
    if (!response.access_token) next(new Error('Error getting access token'));
    // if the response is valid (i.e. we have a token) then add it to the res object
    res.access_token = response.access_token;
    // move on
    next();
  })
  .catch(err => next(err));
}

module.exports = {
  createSignature,
  getAccessToken,
};
