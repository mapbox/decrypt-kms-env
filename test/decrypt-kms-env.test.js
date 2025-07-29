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
    var encrypted = Buffer.from(params.CiphertextBlob, 'base64').toString('utf8');
    if (encrypted === 'EncryptedValue1')
      return callback(null, { Plaintext: Buffer.from('DecryptedValue1').toString('base64') });
    if (encrypted === 'EncryptedValue2')
      return callback(null, { Plaintext: Buffer.from('DecryptedValue2').toString('base64') });
    assert.fail('Unrecognized encrypted value ' + encrypted);
  });
  dke.sh({
    AWS_DEFAULT_REGION: 'us-east-1',
    SecureVarA: 'secure:' + Buffer.from('EncryptedValue1').toString('base64'),
    SecureVarB: 'secure:' + Buffer.from('EncryptedValue2').toString('base64'),
    NormalVarC: 'Hello World'
  }, function(err, output) {
    assert.ifError(err, 'no error');
    assert.deepEqual(output, 'export SecureVarA=\'DecryptedValue1\'; echo \'Decrypted SecureVarA=************lue1\'; export SecureVarB=\'DecryptedValue2\'; echo \'Decrypted SecureVarB=************lue2\'; ', 'shell output');
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
    var encrypted = Buffer.from(params.CiphertextBlob, 'base64').toString('utf8');
    if (encrypted === 'EncryptedValue1')
      return callback(null, { Plaintext: Buffer.from('DecryptedValue1').toString('base64') });
    if (encrypted === 'EncryptedValue2')
      return callback(null, { Plaintext: Buffer.from('DecryptedValue2').toString('base64') });
    assert.fail('Unrecognized encrypted value ' + encrypted);
  });
  var env = {
    AWS_DEFAULT_REGION: 'us-east-1',
    SecureVarA: 'secure:' + Buffer.from('EncryptedValue1').toString('base64'),
    SecureVarB: 'secure:' + Buffer.from('EncryptedValue2').toString('base64'),
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

tape('decrypt-kms-env: rejects oversized ciphertext', function(assert) {
  var largePayload = Buffer.alloc(5000).toString('base64'); // Over 4KB limit
  dke.sh({
    AWS_DEFAULT_REGION: 'us-east-1',
    SecureVar: 'secure:' + largePayload
  }, function(err, output) {
    assert.ok(err, 'should error');
    assert.ok(err.message.includes('exceeds maximum allowed size'), 'should mention size limit');
    assert.end();
  });
});

tape('decrypt-kms-env: rejects invalid base64', function(assert) {
  dke.sh({
    AWS_DEFAULT_REGION: 'us-east-1',
    SecureVar: 'secure:invalid!@#$%^&*()base64'
  }, function(err, output) {
    assert.ok(err, 'should error');
    assert.ok(err.message.includes('Invalid base64 format'), 'should mention invalid format');
    assert.end();
  });
});

tape('js dke: rejects oversized ciphertext', function(assert) {
  var largePayload = Buffer.alloc(5000).toString('base64'); // Over 4KB limit
  var env = {
    AWS_DEFAULT_REGION: 'us-east-1',
    SecureVar: 'secure:' + largePayload
  };
  dke(env, function(err, output) {
    assert.ok(err, 'should error');
    assert.ok(err.message.includes('exceeds maximum allowed size'), 'should mention size limit');
    assert.end();
  });
});

tape('js dke: rejects invalid base64', function(assert) {
  var env = {
    AWS_DEFAULT_REGION: 'us-east-1',
    SecureVar: 'secure:invalid!@#$%^&*()base64'
  };
  dke(env, function(err, output) {
    assert.ok(err, 'should error');
    assert.ok(err.message.includes('Invalid base64 format'), 'should mention invalid format');
    assert.end();
  });
});

