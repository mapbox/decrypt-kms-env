var AWS = require('aws-sdk');
var util = require('util');
var queue = require('d3-queue').queue;

module.exports = js;
module.exports.sh = sh;
module.exports.scrub = scrub;

/**
 * @param {object} env Object with variables to decrypt. Usually `process.env`.
 * @param {function} callback Callback function. Passed an object with scrubbed vars safe for debugging.
 */
function js(env, callback) {
  decrypt(env, function(err, decrypted) {
    if (err) return callback(err);
    var scrubbed = {};
    decrypted.forEach(function(data) {
      env[data.key] = data.decrypted;
      scrubbed[data.key] = scrub(data.decrypted);
    });
    callback(null, scrubbed);
  });
}

/**
 * @param {object} env Object with variables to decrypt. Usually `process.env`.
 * @param {function} callback Callback function. Passed an string that can be eval()'d in bash to set env vars.
 */
function sh(env, callback) {
  decrypt(env, function(err, decrypted) {
    if (err) return callback(err);
    var output = '';
    decrypted.forEach(function(data) {
      output += util.format('export %s=\'%s\'; ', data.key, data.decrypted);
      output += util.format('echo \'Decrypted %s=%s\'; ', data.key, scrub(data.decrypted));
    });
    callback(null, output);
  });
}

/**
 * Private decrypt function that does not scrub output. Not exposed as a public API.
 *
 * @param {object} env Object with variables to decrypt.
 * @param {function} callback Callback function.
 */
function decrypt(env, callback) {
  if (!env.AWS_DEFAULT_REGION) return callback(new Error('AWS_DEFAULT_REGION env var must be set'));
  var kms = new AWS.KMS({
    region: env.AWS_DEFAULT_REGION,
    maxRetries: 10
  });
  var q = queue();
  var MAX_CIPHERTEXT_SIZE = 4096;
  var BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
  
  for (var key in env) {
    if (!(/^secure:/).test(env[key])) continue;
    var ciphertextB64 = env[key].replace(/^secure:/,'');
    
    if (ciphertextB64.length > MAX_CIPHERTEXT_SIZE) {
      return callback(new Error('Ciphertext for key "' + key + '" exceeds maximum allowed size of ' + MAX_CIPHERTEXT_SIZE + ' bytes'));
    }
    
    if (!BASE64_REGEX.test(ciphertextB64)) {
      return callback(new Error('Invalid base64 format for key "' + key + '"'));
    }
    
    q.defer(function(key, val, done) {
      try {
        kms.decrypt({
          CiphertextBlob: Buffer.from(val, 'base64')
        }, function(err, data) {
          if (err) return done(err);
          done(null, { key: key, val: val, decrypted: Buffer.from(data.Plaintext, 'base64').toString('utf8') });
        });
      } catch (e) {
        done(new Error('Failed to decode base64 for key "' + key + '": ' + e.message));
      }
    }, key, ciphertextB64);
  }
  q.awaitAll(function(err, results) {
    if (err) return callback(err);
    callback(null, results);
  });
}

/**
 * Scrub an input string to a fixed length preserving the last 4 characters.
 */
function scrub(value) {
  return util.format('************%s', value.substr(-4));
}

