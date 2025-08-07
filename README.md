# BSV Script Templates

BSV BLOCKCHAIN | Script Templates

A collection of script templates for use with the official BSV TypeScript SDK

## Overview

The goal of this repository is to provide a place where developers from around the ecosystem can publish all manner of script templates, without needing to update the core library. We're generally neutral and unbiased about what people contribute, so feel free to contribute and see what people do with your cool idea!

## Using

You can write code like this:

```ts
import { Transaction } from '@bsv/sdk'
import { OpReturn } from '@bsv/templates'

// Then, just use your template with the SDK!
const opReturn = new OpReturn()
const tx = new Transaction()
tx.addOutput({
  lockingScript: opReturn.lock('Hello, BSV!'),
  satoshis: 0
})
```

## Current Templates

Name                            | Description
--------------------------------|--------------------------
[OpReturn](./src/template/opreturn/OpReturn.ts)   | Tag data in a non-spendable script
[Metanet](./src/template/metanet/Metanet.ts)     | Create transactions that follow the Metanet protocol
[MultiPushDrop](./src/template/pushdrop/MultiPushDrop.ts) | Create data tokens with multiple trusted owners
[Inscription](./src/template/inscription/Inscription.ts) | Create and decode Ordinal-style inscriptions
[BitCom](./src/template/bitcom/BitCom.ts)        | Build generic BitCom outputs
[AIP](./src/template/bitcom/AIP.ts)              | Add AIP signatures to BitCom data
[B](./src/template/bitcom/B.ts)                  | Embed media and data using BitCom B
[BAP](./src/template/bitcom/BAP.ts)              | BAP attestations (keys, identities)
[MAP](./src/template/bitcom/MAP.ts)              | MAP key-value protocol
[BSocial](./src/template/bsocial/BSocial.ts)     | BSocial social actions
[BSV20](./src/template/bsv20/BSV20.ts)           | BSV-20 token inscriptions
[BSV21](./src/template/bsv21/BSV21.ts)           | BSV-21 token inscriptions

### Usage Examples

#### OpReturn
```ts
import { Transaction } from '@bsv/sdk'
import { OpReturn } from '@bsv/templates'

const template = new OpReturn()
const tx = new Transaction()
tx.addOutput({
  lockingScript: template.lock('Hello, BSV!'),
  satoshis: 0
})
```

#### Metanet
```ts
import { Transaction, PublicKey } from '@bsv/sdk'
import { Metanet } from '@bsv/templates'

const pubkey = new PublicKey(...) // Your public key
const template = new Metanet()
const tx = new Transaction()
tx.addOutput({
  lockingScript: template.lock(pubkey, null, ['metadata', 'filename', 'data payload']),
  satoshis: 0
})
```

#### MultiPushDrop
```ts
import { Transaction, SecurityLevel } from '@bsv/sdk'
import { MultiPushDrop } from '@bsv/templates'

const wallet = ... // Your wallet implementation
const template = new MultiPushDrop(wallet)
const fields = [[1], [2]] // Example data fields
const protocolID = [SecurityLevel.High, 'protocol']
const keyID = 'key1'
const counterparties = ['self']

const lockingScript = await template.lock(fields, protocolID, keyID, counterparties)
const tx = new Transaction()
tx.addOutput({
  lockingScript,
  satoshis: 1 // Dust amount
})
```

## Planned Templates
For upcoming templates and development phases, see [ROADMAP.md](./ROADMAP.md).

## Contribution Guidelines

We're always looking for contributors to add the coolest new templates. Whatever kinds of scripts you come up with - all contributions are welcome.

1. **Fork & Clone**: Fork this repository and clone it to your local machine.
2. **Set Up**: Run `npm i` to install all dependencies.
3. **Make Changes**: Create a new branch and make your changes.
4. **Test**: Ensure all tests pass by running `npm test`.
5. **Commit**: Commit your changes and push to your fork.
6. **Pull Request**: Open a pull request from your fork to this repository.
For more details, check the [contribution guidelines](./CONTRIBUTING.md).

For information on past releases, check out the [changelog](./CHANGELOG.md)!

## Support & Contacts

Project Owners: Ty Everett

Development Team Lead: Ty Everett

For questions, bug reports, or feature requests, please open an issue on GitHub or contact us directly.

## License

The license for the code in this repository is the Open BSV License. Refer to [LICENSE.txt](./LICENSE.txt) for the license text.

Thank you for being a part of the BSV Blockchain Script Templates Project. Let's build the future of BSV Blockchain together!
