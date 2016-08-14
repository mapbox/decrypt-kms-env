var tape = require('tape');
var AWS = require('aws-sdk-mock');
var decrypt = require('../bin/decrypt-kms-env');

tape('decrypt-kms-env: no secure env vars', function(assert) {
  decrypt({}, function(err, output) {
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
  decrypt({
    SecureVarA: 'secure:' + (new Buffer('EncryptedValue1')).toString('base64'),
    SecureVarB: 'secure:' + (new Buffer('EncryptedValue2')).toString('base64'),
    NormalVarC: 'Hello World'
  }, function(err, output) {
    assert.ifError(err, 'no error');
    assert.deepEqual(output, 'export SecureVarA=DecryptedValue1; echo \'Decrypted SecureVarA=************lue1\'; export SecureVarB=DecryptedValue2; echo \'Decrypted SecureVarB=************lue2\'; ', 'shell output');
    assert.end();
  });
});

