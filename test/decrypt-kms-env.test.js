var tape = require('tape');
var AWS = require('aws-sdk-mock');
var dke = require('../index.js');

tape('decrypt-kms-env: errors without region', function(assert) {
  dke.sh({}, function(err, output) {
    assert.deepEqual(err && err.toString(), 'Error: AWS_DEFAULT_REGION env var must be set', 'errors');
    assert.end();
  });
});

tape('decrypt-kms-env: no secure env vars', function(assert) {
  dke.sh({
    AWS_DEFAULT_REGION: 'us-east-1'
  }, function(err, output) {
    assert.ifError(err, 'no error');
    assert.deepEqual(output, '', 'no output');
    assert.end();
  });
});

tape('decrypt-kms-env: secure env vars', function(assert) {
  AWS.mock('KMS', 'decrypt', function(params, callback) {
    var encrypted = new Buffer(params.CiphertextBlob, 'base64').toString('utf8');
    if (encrypted === 'EncryptedValue1')
      return callback(null, { Plaintext: (new Buffer('DecryptedValue1')).toString('base64') });
    if (encrypted === 'EncryptedValue2')
      return callback(null, { Plaintext: (new Buffer('DecryptedValue2')).toString('base64') });
    assert.fail('Unrecognized encrypted value ' + encrypted);
  });
  dke.sh({
    AWS_DEFAULT_REGION: 'us-east-1',
    SecureVarA: 'secure:' + (new Buffer('EncryptedValue1')).toString('base64'),
    SecureVarB: 'secure:' + (new Buffer('EncryptedValue2')).toString('base64'),
    NormalVarC: 'Hello World'
  }, function(err, output) {
    assert.ifError(err, 'no error');
    assert.deepEqual(output, 'export SecureVarA=DecryptedValue1; echo \'Decrypted SecureVarA=************lue1\'; export SecureVarB=DecryptedValue2; echo \'Decrypted SecureVarB=************lue2\'; ', 'shell output');
    assert.end();
  });
});


tape('js dke: errors without region', function(assert) {
  dke({}, function(err, output) {
    assert.deepEqual(err && err.toString(), 'Error: AWS_DEFAULT_REGION env var must be set', 'errors');
    assert.end();
  });
});

tape('js dke: no secure env vars', function(assert) {
  dke({
    AWS_DEFAULT_REGION: 'us-east-1'
  }, function(err, output) {
    assert.ifError(err, 'no error');
    assert.deepEqual(output, {}, 'no output');
    assert.end();
  });
});

tape('js dke', function(assert) {
  AWS.mock('KMS', 'decrypt', function(params, callback) {
    var encrypted = new Buffer(params.CiphertextBlob, 'base64').toString('utf8');
    if (encrypted === 'EncryptedValue1')
      return callback(null, { Plaintext: (new Buffer('DecryptedValue1')).toString('base64') });
    if (encrypted === 'EncryptedValue2')
      return callback(null, { Plaintext: (new Buffer('DecryptedValue2')).toString('base64') });
    assert.fail('Unrecognized encrypted value ' + encrypted);
  });
  var env = {
    AWS_DEFAULT_REGION: 'us-east-1',
    SecureVarA: 'secure:' + (new Buffer('EncryptedValue1')).toString('base64'),
    SecureVarB: 'secure:' + (new Buffer('EncryptedValue2')).toString('base64'),
    NormalVarC: 'Hello World'
  };
  dke(env, function(err, output) {
    assert.ifError(err, 'no error');
    assert.deepEqual(env, {
      AWS_DEFAULT_REGION: 'us-east-1',
      SecureVarA: 'DecryptedValue1',
      SecureVarB: 'DecryptedValue2',
      NormalVarC: 'Hello World'
    }, 'Sets decrypted values');
    assert.deepEqual(output, {
      SecureVarA: '************lue1',
      SecureVarB: '************lue2',
    }, 'Debug output');
    assert.end();
  });
});

