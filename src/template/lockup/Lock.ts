import { Script, Utils } from '@bsv/sdk'

/**
 * Lock PREFIX - sCrypt contract prefix shared with OrdLock template
 */
export const LOCK_PREFIX = Utils.toArray(
  '2097dfd76851bf465e8f715593b217714858bbe9570ff3bd5e33840a34e20ff0262102ba79df5f8ae7604a9830f03c7933028186aede0675a16f025dc4f8be8eec0382201008ce7480da41702918d1ec8e6849ba32b4d65b1e40dc669c31a1e6306b266c0000',
  'hex'
)

/**
 * Lock SUFFIX - time-lock contract validation script
 */
export const LOCK_SUFFIX = Utils.toArray(
  '610079040065cd1d9f690079547a75537a537a537a5179537a75527a527a7575615579014161517957795779210ac407f0e4bd44bfc207355a778b046225a7068fc59ee7eda43ad905aadbffc800206c266b30e6a1319c66dc401e5bd6b432ba49688eecd118297041da8074ce081059795679615679aa0079610079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81517a75615779567956795679567961537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff00517951796151795179970079009f63007952799367007968517a75517a75517a7561527a75517a517951795296a0630079527994527a75517a6853798277527982775379012080517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01205279947f7754537993527993013051797e527e54797e58797e527e53797e52797e57797e0079517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a756100795779ac517a75517a75517a75517a75517a75517a75517a75517a75517a7561517a75517a756169557961007961007982775179517954947f75517958947f77517a75517a756161007901007e81517a7561517a7561040065cd1d9f6955796100796100798277517951790128947f755179012c947f77517a75517a756161007901007e81517a7561517a756105ffffffff009f69557961007961007982775179517954947f75517958947f77517a75517a756161007901007e81517a7561517a75615279a2695679a95179876957795779ac7777777777777777',
  'hex'
)

/**
 * Lock decoded data structure
 */
export interface LockData {
  /** Owner's address (base58check encoded) */
  address: string
  /** Block height or timestamp until which the output is locked */
  until: number
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
 * Checks if an array contains a subarray
 */
function contains (arr: number[], subArr: number[], fromIndex: number = 0): boolean {
  return indexOf(arr, subArr, fromIndex) !== -1
}

/**
 * Lock - Time-lock template for locking outputs until a specific block height or timestamp
 *
 * The Lock template enables creating outputs that can only be spent after a certain
 * block height or Unix timestamp has been reached.
 *
 * @example
 * ```typescript
 * // Decode a Lock from a script
 * const lock = Lock.decode(script);
 * if (lock) {
 *   console.log(`Address: ${lock.address}`);
 *   console.log(`Locked until: ${lock.until}`);
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class Lock {
  /**
   * Decodes a Lock from a script
   *
   * @param script - The script to decode
   * @param mainnet - Whether to use mainnet address prefix (default: true)
   * @returns Decoded Lock data or null if not found/invalid
   */
  static decode (script: Script, mainnet: boolean = true): LockData | null {
    try {
      const scriptBinary = script.toBinary()

      // Find PREFIX
      const prefixIndex = indexOf(scriptBinary, LOCK_PREFIX)
      if (prefixIndex === -1) return null

      // Check that SUFFIX exists somewhere after PREFIX
      if (!contains(scriptBinary, LOCK_SUFFIX, prefixIndex)) return null

      // Extract data starting after PREFIX
      const pos = prefixIndex + LOCK_PREFIX.length

      // Parse the data as script chunks
      const remainingBytes = scriptBinary.slice(pos)
      const dataScript = Script.fromBinary(remainingBytes)
      const chunks = dataScript.chunks

      if (chunks.length < 2) return null

      // Chunk 0: address PKHash (20 bytes)
      const addressChunk = chunks[0]
      if (addressChunk?.data == null || addressChunk.data.length !== 20) return null

      // Chunk 1: until value (variable length, little-endian)
      const untilChunk = chunks[1]
      if (untilChunk?.data == null) return null

      // Read little-endian uint32 (pad to 4 bytes if needed)
      const untilData = untilChunk.data
      const padded = new Uint8Array(4)
      for (let i = 0; i < Math.min(untilData.length, 4); i++) {
        padded[i] = untilData[i]
      }
      const until = padded[0] | (padded[1] << 8) | (padded[2] << 16) | (padded[3] << 24)

      // Convert PKHash to address
      const addressPrefix = mainnet ? [0x00] : [0x6f]
      const address = Utils.toBase58Check(addressChunk.data, addressPrefix)

      return {
        address,
        until: until >>> 0 // Ensure unsigned
      }
    } catch {
      return null
    }
  }

  /**
   * Checks if a script contains a Lock pattern
   *
   * @param script - The script to check
   * @returns true if the script contains Lock pattern
   */
  static isLock (script: Script): boolean {
    const scriptBinary = script.toBinary()
    const prefixIndex = indexOf(scriptBinary, LOCK_PREFIX)
    if (prefixIndex === -1) return false
    return contains(scriptBinary, LOCK_SUFFIX, prefixIndex)
  }
}
