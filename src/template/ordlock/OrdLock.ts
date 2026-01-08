import {
  BigNumber,
  type LockingScript,
  OP,
  P2PKH,
  type PrivateKey,
  Script,
  type Transaction,
  TransactionSignature,
  UnlockingScript,
  Utils,
} from '@bsv/sdk'

/**
 * OrdLock PREFIX - sCrypt contract prefix shared with Lock template
 */
export const ORDLOCK_PREFIX = Utils.toArray(
  '2097dfd76851bf465e8f715593b217714858bbe9570ff3bd5e33840a34e20ff0262102ba79df5f8ae7604a9830f03c7933028186aede0675a16f025dc4f8be8eec0382201008ce7480da41702918d1ec8e6849ba32b4d65b1e40dc669c31a1e6306b266c0000',
  'hex'
)

/**
 * OrdLock SUFFIX - contract validation script
 */
export const ORDLOCK_SUFFIX = Utils.toArray(
  '615179547a75537a537a537a0079537a75527a527a7575615579008763567901c161517957795779210ac407f0e4bd44bfc207355a778b046225a7068fc59ee7eda43ad905aadbffc800206c266b30e6a1319c66dc401e5bd6b432ba49688eecd118297041da8074ce081059795679615679aa0079610079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81517a75615779567956795679567961537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff00517951796151795179970079009f63007952799367007968517a75517a75517a7561527a75517a517951795296a0630079527994527a75517a6853798277527982775379012080517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01205279947f7754537993527993013051797e527e54797e58797e527e53797e52797e57797e0079517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a756100795779ac517a75517a75517a75517a75517a75517a75517a75517a75517a7561517a75517a756169587951797e58797eaa577961007982775179517958947f7551790128947f77517a75517a75618777777777777777777767557951876351795779a9876957795779ac777777777777777767006868',
  'hex'
)

/**
 * OrdLock decoded data structure
 */
export interface OrdLockData {
  /** Seller's address (base58check encoded) */
  seller: string
  /** Listing price in satoshis */
  price: bigint
  /** Raw payout output data */
  payout: number[]
}

/**
 * Finds the index of a subarray within an array
 */
function indexOf (arr: number[], subArr: number[], fromIndex: number = 0): number {
  for (let i = fromIndex; i <= arr.length - subArr.length; i++) {
    let found = true
    for (let j = 0; j < subArr.length; j++) {
      if (arr[i + j] !== subArr[j]) {
        found = false
        break
      }
    }
    if (found) return i
  }
  return -1
}

/**
 * Reads a Bitcoin varint from a byte array
 * Returns the value and number of bytes consumed
 */
function readVarInt (data: number[], offset: number): { value: number, bytesRead: number } {
  const first = data[offset]
  if (first < 0xfd) {
    return { value: first, bytesRead: 1 }
  } else if (first === 0xfd) {
    const value = data[offset + 1] | (data[offset + 2] << 8)
    return { value, bytesRead: 3 }
  } else if (first === 0xfe) {
    const value = data[offset + 1] | (data[offset + 2] << 8) | (data[offset + 3] << 16) | (data[offset + 4] << 24)
    return { value, bytesRead: 5 }
  } else {
    // 0xff - 8 byte value, but we'll just handle up to 4 bytes for simplicity
    const value = data[offset + 1] | (data[offset + 2] << 8) | (data[offset + 3] << 16) | (data[offset + 4] << 24)
    return { value, bytesRead: 9 }
  }
}

/**
 * OrdLock - Ordinal Lock template for marketplace listings
 *
 * OrdLock enables trustless ordinal/NFT sales by locking an output with a
 * contract that can only be unlocked by providing payment to a specified address.
 *
 * @example
 * ```typescript
 * // Decode an OrdLock from a script
 * const ordlock = OrdLock.decode(script);
 * if (ordlock) {
 *   console.log(`Seller: ${ordlock.seller}`);
 *   console.log(`Price: ${ordlock.price} satoshis`);
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class OrdLock {
  /**
   * Decodes an OrdLock from a script
   *
   * @param script - The script to decode
   * @param mainnet - Whether to use mainnet address prefix (default: true)
   * @returns Decoded OrdLock data or null if not found/invalid
   */
  static decode (script: Script, mainnet: boolean = true): OrdLockData | null {
    try {
      const scriptBinary = script.toBinary()

      // Find PREFIX
      const prefixIndex = indexOf(scriptBinary, ORDLOCK_PREFIX)
      if (prefixIndex === -1) return null

      // Find SUFFIX after PREFIX
      const suffixIndex = indexOf(scriptBinary, ORDLOCK_SUFFIX, prefixIndex + ORDLOCK_PREFIX.length)
      if (suffixIndex === -1) return null

      // Extract data between PREFIX and SUFFIX
      const dataBytes = scriptBinary.slice(prefixIndex + ORDLOCK_PREFIX.length, suffixIndex)
      if (dataBytes.length === 0) return null

      // Parse the data as script chunks
      const dataScript = Script.fromBinary(dataBytes)
      const chunks = dataScript.chunks

      if (chunks.length < 2) return null

      // Chunk 0: seller PKHash (20 bytes)
      const sellerChunk = chunks[0]
      if (sellerChunk?.data == null || sellerChunk.data.length !== 20) return null

      // Chunk 1: payout TransactionOutput (satoshis + locking script)
      const payoutChunk = chunks[1]
      if (payoutChunk?.data == null || payoutChunk.data.length < 9) return null

      const payoutData = payoutChunk.data

      // Parse TransactionOutput: 8-byte LE satoshis + varint script length + script
      // Read 8-byte little-endian satoshis
      let price = BigInt(0)
      for (let i = 0; i < 8; i++) {
        price |= BigInt(payoutData[i]) << BigInt(i * 8)
      }

      // Convert PKHash to address
      const addressPrefix = mainnet ? [0x00] : [0x6f]
      const seller = Utils.toBase58Check(sellerChunk.data, addressPrefix)

      return {
        seller,
        price,
        payout: Array.from(payoutData)
      }
    } catch {
      return null
    }
  }

  /**
   * Checks if a script contains an OrdLock pattern
   *
   * @param script - The script to check
   * @returns true if the script contains OrdLock pattern
   */
  static isOrdLock (script: Script): boolean {
    const scriptBinary = script.toBinary()
    const prefixIndex = indexOf(scriptBinary, ORDLOCK_PREFIX)
    if (prefixIndex === -1) return false
    const suffixIndex = indexOf(scriptBinary, ORDLOCK_SUFFIX, prefixIndex + ORDLOCK_PREFIX.length)
    return suffixIndex !== -1
  }

  /**
   * Checks if an unlocking script indicates a purchase (vs cancellation)
   *
   * @param unlockingScript - The unlocking script to check
   * @returns true if the unlock represents a purchase
   */
  static isPurchase (unlockingScript: Script): boolean {
    const scriptBinary = unlockingScript.toBinary()
    return indexOf(scriptBinary, ORDLOCK_SUFFIX) !== -1
  }

  /**
   * Creates an OrdLock locking script for listing an ordinal
   *
   * @param cancelAddress - Address that can cancel the listing
   * @param payAddress - Address that receives payment on purchase
   * @param price - Listing price in satoshis
   * @returns The OrdLock locking script
   */
  static lock (cancelAddress: string, payAddress: string, price: number): Script {
    const cancelPkh = Utils.fromBase58Check(cancelAddress).data as number[]
    const payPkh = Utils.fromBase58Check(payAddress).data as number[]

    return new Script()
      .writeScript(Script.fromBinary(ORDLOCK_PREFIX))
      .writeBin(cancelPkh)
      .writeBin(OrdLock.buildOutput(price, new P2PKH().lock(payPkh).toBinary()))
      .writeScript(Script.fromBinary(ORDLOCK_SUFFIX))
  }

  /**
   * Builds a serialized transaction output (satoshis + script)
   *
   * @param satoshis - Output value
   * @param script - Locking script as binary
   * @returns Serialized output bytes
   */
  static buildOutput (satoshis: number, script: number[]): number[] {
    const writer = new Utils.Writer()
    writer.writeUInt64LEBn(new BigNumber(satoshis))
    writer.writeVarIntNum(script.length)
    writer.write(script)
    return writer.toArray()
  }

  /**
   * Creates an unlocking script for cancelling a listing
   *
   * @param privateKey - Private key for the cancel address
   * @param signOutputs - Signature scope for outputs
   * @param anyoneCanPay - Whether to use ANYONECANPAY
   * @param sourceSatoshis - Input satoshis (optional if sourceTransaction provided)
   * @param lockingScript - Input locking script (optional if sourceTransaction provided)
   * @returns Unlock template with sign and estimateLength methods
   */
  static cancelListing (
    privateKey: PrivateKey,
    signOutputs: 'all' | 'none' | 'single' = 'all',
    anyoneCanPay = false,
    sourceSatoshis?: number,
    lockingScript?: Script
  ): {
    sign: (tx: Transaction, inputIndex: number) => Promise<UnlockingScript>
    estimateLength: () => Promise<number>
  } {
    const p2pkh = new P2PKH().unlock(privateKey, signOutputs, anyoneCanPay, sourceSatoshis, lockingScript)
    return {
      sign: async (tx: Transaction, inputIndex: number) => {
        return (await p2pkh.sign(tx, inputIndex)).writeOpCode(OP.OP_1)
      },
      estimateLength: async () => {
        return 107
      }
    }
  }

  /**
   * Creates an unlocking script for purchasing a listing
   *
   * The purchase path requires:
   * - Output 0: The ordinal going to buyer
   * - Output 1: Payment to seller (must match payout in OrdLock)
   * - Output 2+: Additional outputs (marketplace fees, etc.)
   *
   * No signature is required - the contract validates the outputs match.
   *
   * @param sourceSatoshis - Input satoshis (optional if sourceTransaction provided)
   * @param lockingScript - Input locking script (optional if sourceTransaction provided)
   * @returns Unlock template with sign and estimateLength methods
   */
  static purchaseListing (
    sourceSatoshis?: number,
    lockingScript?: Script
  ): {
    sign: (tx: Transaction, inputIndex: number) => Promise<UnlockingScript>
    estimateLength: (tx: Transaction, inputIndex: number) => Promise<number>
  } {
    const purchase = {
      sign: async (tx: Transaction, inputIndex: number) => {
        if (tx.outputs.length < 2) {
          throw new Error('Malformed transaction: requires at least 2 outputs')
        }
        const script = new UnlockingScript()
          .writeBin(OrdLock.buildOutput(
            tx.outputs[0].satoshis ?? 0,
            tx.outputs[0].lockingScript.toBinary()
          ))
        if (tx.outputs.length > 2) {
          const writer = new Utils.Writer()
          for (const output of tx.outputs.slice(2)) {
            writer.write(OrdLock.buildOutput(output.satoshis ?? 0, output.lockingScript.toBinary()))
          }
          script.writeBin(writer.toArray())
        } else {
          script.writeOpCode(OP.OP_0)
        }

        const input = tx.inputs[inputIndex]
        let sourceSats = sourceSatoshis as number
        if (!sourceSats && input.sourceTransaction) {
          sourceSats = input.sourceTransaction.outputs[input.sourceOutputIndex].satoshis as number
        } else if (!sourceSatoshis) {
          throw new Error('sourceTransaction or sourceSatoshis is required')
        }

        const sourceTXID = (input.sourceTXID ?? input.sourceTransaction?.id('hex')) as string
        let subscript = lockingScript as LockingScript
        if (!subscript) {
          subscript = input.sourceTransaction?.outputs[input.sourceOutputIndex].lockingScript as LockingScript
        }
        const preimage = TransactionSignature.format({
          sourceTXID,
          sourceOutputIndex: input.sourceOutputIndex,
          sourceSatoshis: sourceSats,
          transactionVersion: tx.version,
          otherInputs: [],
          inputIndex,
          outputs: tx.outputs,
          inputSequence: input.sequence ?? 0xffffffff,
          subscript,
          lockTime: tx.lockTime,
          scope: TransactionSignature.SIGHASH_ALL |
            TransactionSignature.SIGHASH_ANYONECANPAY |
            TransactionSignature.SIGHASH_FORKID
        })

        return script.writeBin(preimage).writeOpCode(OP.OP_0)
      },
      estimateLength: async (tx: Transaction, inputIndex: number) => {
        return (await purchase.sign(tx, inputIndex)).toBinary().length
      }
    }
    return purchase
  }
}
