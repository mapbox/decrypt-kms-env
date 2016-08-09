decrypt-kms-env
---------------
Simple util for decrypting secure environment variables encrypted using KMS. Follows a simple convention whereby:

- Requires `aws` (via `awscli`)
- Encrypted blobs are prefixed with `secure:`,
- When sourced, `decrypt-kms-env` decrypts the values in-place

Before:

```sh
env

Secret1=secure:NNNNNNNN...
Secret2=secure:NNNNNNNN...
Secret3=secure:NNNNNNNN...
```

After:

```sh
. decrypt-kms-env
env

Secret1=cats
Secret2=dogs
Secret3=meow
```

### Install

```sh
curl -sL https://github.com/mapbox/decrypt-kms-env/archive/v1.0.0.tar.gz | tar --gunzip --extract --strip-components=1 --exclude=readme.md --directory=/usr/local
```

### Our usage

We use this from within Docker containers to decrypt env vars encrypted via KMS.
