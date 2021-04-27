# decrypt-kms-env

[![Build Status](https://travis-ci.org/mapbox/decrypt-kms-env.svg?branch=master)](https://travis-ci.org/mapbox/decrypt-kms-env)

Simple utility for decrypting secure environment variables encrypted using KMS.

## Usage

### From a Dockerfile/shell

**Use v1.x** when you need to decrypt secure environment variables in a Dockerfile or shell script. In a failure situation, such as an with an incorrectly encrypted environment variable, this method will result in the process exiting with a non-zero exit code.

This method follows a simple convention whereby:

- Encrypted environment variable blobs are prefixed with `secure:` (e.g., `MySecretVar=secure:abcde1234`),
- Values are decrypted in-place. Scrubbed debug output is provided so you can confirm env vars have been decrypted and set.

#### Example usage in a Dockerfile:

```dockerfile
# Install
RUN curl -sL https://github.com/mapbox/decrypt-kms-env/archive/v1.0.6.tar.gz | tar --gunzip --extract --strip-components=1 --exclude=readme.md --directory=/usr/local

# Decrypt vars and start app
RUN . decrypt-kms-env && \
    npm start
```

#### Example Shell usage:

```sh
> . decrypt-kms-env
Decrypted SecureValueA=************1231
Decrypted SecureValueB=************913X
```

### From JavaScript/Lambda function

**Use v3.x**. If you don't have access to a shell to set env vars before starting your app, you can run `decrypt-kms-env` via JS.

Install:

```sh
npm install @mapbox/decrypt-kms-env --save
```

Use in JS:

```js
var dke = require('@mapbox/decrypt-kms-env');

dke(process.env, function(err, scrubbed) {
  if (err) throw err;
  // Values in process.env are now decrypted.

  // To debug use `scrubbed` instead of logging `process.env` directly.
  // console.log(scrubbed);
});
```
