import { PrivateKey, KeyDeriver, WalletInterface, ChainTracker } from '@bsv/sdk'
import { Wallet, WalletStorageManager, WalletSigner, Services, StorageClient } from '@bsv/wallet-toolbox'
import { config } from 'dotenv'
config()

const PRIVATE_KEY: string = process.env.PRIVATE_KEY || ''

export async function makeWallet (
  chain: 'test' | 'main' = 'main',
  storageURL: string = 'https://storage.babbage.systems',
  privateKey: string = PRIVATE_KEY
): Promise<WalletInterface> {
  const keyDeriver = new KeyDeriver(new PrivateKey(privateKey, 'hex'))
  const storageManager = new WalletStorageManager(keyDeriver.identityKey)
  const signer = new WalletSigner(chain, keyDeriver, storageManager)
  const services = new Services(chain)
  const wallet = new Wallet(signer, services)
  const client = new StorageClient(
    wallet,
    storageURL
  )
  await client.makeAvailable()
  await storageManager.addWalletStorageProvider(client)

  return wallet
}

export class MockChain implements ChainTracker {
  mock: { blockheaders: [string] }
  constructor(mock: { blockheaders: [string] }) {
    this.mock = mock
  }
  async isValidRootForHeight(root: string, height: number): Promise<boolean> {
    return this.mock.blockheaders[height] === root
  }
  async currentHeight(): Promise<number> {
    return this.mock.blockheaders.length
  }
}