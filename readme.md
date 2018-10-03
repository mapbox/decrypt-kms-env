# decrypt-kms-env

[![Build Status](https://travis-ci.org/mapbox/decrypt-kms-env.svg?branch=master)](https://travis-ci.org/mapbox/decrypt-kms-env)

Simple utility for decrypting secure environment variables encrypted using KMS.

### Install

`npm install @mapbox/decrypt-kms-env --save`

### From a Dockerfile/shell

Once installed, run your application in your Dockerfile prefixed:

```
RUN eval $(./node_modules/.bin/decrypt-kms-env) && npm start
```

Follows a simple convention whereby:

- Encrypted blobs are prefixed with `secure:`,
- When the output of `decrypt-kms-env` is passed to `eval` in a shell, values are decrypted in-place. Scrubbed debug output is provided so you can confirm env vars have been decrypted and set.

```
> eval $(./node_modules/.bin/decrypt-kms-env)
Decrypted SecureValueA=************1231
Decrypted SecureValueB=************913X
```

### From JS/Lambda function

If you don't have access to a shell to set env vars before starting your app, you can run `decrypt-kms-env` via JS.

```js
var dke = require('@mapbox/decrypt-kms-env');
dke(process.env, function(err, scrubbed) {
  if (err) throw err;
  // Values in process.env are now decrypted.

  // To debug use `scrubbed` instead of logging `process.env` directly.
  // console.log(scrubbed);
});
```

------

### Our usage

We use this from within Docker containers to decrypt env vars encrypted via KMS.

------

### v1.x

For projects using `python` & `awscli` rather than node, the `v1.x` branch of this project can be used.

```sh
# Install
curl -sL https://github.com/mapbox/decrypt-kms-env/archive/v1.0.6.tar.gz | tar --gunzip --extract --strip-components=1 --exclude=readme.md --directory=/usr/local

# Run app
. decrypt-kms-env && npm start
```

