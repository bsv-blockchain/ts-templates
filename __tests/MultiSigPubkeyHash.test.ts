import { Transaction, UnlockingScript, MerklePath, P2PKH, PrivateKey, PublicKey, OP } from '@bsv/sdk';
import { MockChain, makeWallet } from './test-utils';
import { MultiSigPubkeyHash } from '../src/MultiSigPubkeyHash';

const key = PrivateKey.fromRandom()

describe('MultiSigPubkeyHash', () => {
    it('should create a valid locking script for MultiSigPubkeyHash and unlock it', async () => {
        
        const wallet = await makeWallet()
        const player1 = await makeWallet()
        const player2 = await makeWallet()
        const player3 = await makeWallet()
        const players = [player1, player2, player3]

        const { publicKey: counterparty } = await wallet.getPublicKey({ identityKey: true })

        const publicKeys = await Promise.all(players.map(async player => {
            const response = await player.getPublicKey({ identityKey: true })
            return response.publicKey
        }))

        const keyID = new Date().toISOString()
        const { address: multiSigAddress, pubkeys } = await MultiSigPubkeyHash.addressBRC29(wallet, publicKeys, keyID, 1)

        const customInstructions = {
            keyID,
            counterparty,
            pubkeys
        }

        const sourceTransaction = new Transaction()
        sourceTransaction.addInput({
            sourceTXID: '0000000000000000000000000000000000000000000000000000000000000000',
            sourceOutputIndex: 0,
            unlockingScript: UnlockingScript.fromASM('01')
        })
        sourceTransaction.addOutput({
            satoshis: 1,
            lockingScript: new MultiSigPubkeyHash().lock(multiSigAddress)
        })
        sourceTransaction.addOutput({
            satoshis: 30,
            lockingScript: new P2PKH().lock(key.toAddress())
        })
    
        const txid = sourceTransaction.id('hex')
        sourceTransaction.merklePath = new MerklePath(0, [[{ txid: true, offset: 0, hash: txid }]])
        const mockChain = new MockChain({ blockheaders: [txid] })
    
        const tx = new Transaction()
        tx.addInput({
            sourceTransaction,
            sourceOutputIndex: 0,
            unlockingScriptTemplate: new MultiSigPubkeyHash().unlock(player1, customInstructions)
        })
        tx.addInput({
            sourceTransaction,
            sourceOutputIndex: 1,
            unlockingScriptTemplate: new P2PKH().unlock(key)
        })
        tx.addOutput({
            change: true,
            lockingScript: new P2PKH().lock(key.toAddress())
        })

        const estimateSize = await tx.inputs[0].unlockingScriptTemplate?.estimateLength(tx, 0)

        await tx.fee()
        await tx.sign()

        expect(estimateSize).toBe(tx.inputs[0]?.unlockingScript?.toBinary().length)

        const passes = await tx.verify(mockChain)
        expect(passes).toBe(true)
    })
})