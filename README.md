## mini-rsa
----------------------------
author: bugszhou | Email:bugszhou@outlook.com <br>
description: 小程序rsa加密

###usage

```
import RSA from 'mini-rsa';
const data = 12334656;
const key = new RSA('-----BEGIN PUBLIC KEY-----\n' +
      'MIIBIjANBgkqhkreyufgfdfhfukgk\n' +
      'nU8KfjLwCTaszKbxxmLW2mV3T6Qv8vCo\n' +
      'U+odBHnM3f5uXofR4vcbad\n' +
      '-----END PUBLIC KEY-----', {
      encryptionScheme: {
        scheme: 'pkcs1',
        hash: 'sha256',
        mgf: 'sha1', // use mgf sha1 padding
      },
    });
    const encrypt = key.encrypt(data, 'base64');
```
