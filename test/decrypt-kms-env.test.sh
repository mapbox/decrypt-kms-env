#!/usr/bin/env sh

CODE=0

export SecureVarA=secure:$(echo "EncryptedValue1" | base64)
export SecureVarB=secure:$(echo "EncryptedValue2" | base64)

aws() {
    if [ ! -f ./kms-encrypted-value ]; then
        echo "not ok - wrote ./kms-encrypted-value"
        CODE=1
    fi
    if [ "$(cat ./kms-encrypted-value)" = "EncryptedValue1" ]; then
        echo "PlainTextValue1" | base64
    elif [ "$(cat ./kms-encrypted-value)" = "EncryptedValue2" ]; then
        echo "PlainTextValue2" | base64
    fi
}
export aws

. $(dirname $0)/../bin/decrypt-kms-env

if [ $SecureVarA = "PlainTextValue1" ]; then
    echo "ok - decrypted SecureVarA"
else
    echo "not ok - decrypted SecureVarA"
    CODE=1
fi

if [ $SecureVarB = "PlainTextValue2" ]; then
    echo "ok - decrypted SecureVarB"
else
    echo "not ok - decrypted SecureVarB"
    CODE=1
fi

if [ ! -f ./kms-encrypted-value ]; then
    echo "ok - cleaned up ./kms-encrypted-value"
else
    echo "not ok - cleaned up ./kms-encrypted-value"
    CODE=1
fi

exit $CODE
