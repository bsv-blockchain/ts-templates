import { ScriptTemplate, LockingScript, UnlockingScript, PrivateKey, Utils, Script, OP, BigNumber, BSM, Signature } from '@bsv/sdk'
import BitCom, { Protocol, BitComDecoded } from './BitCom.js'

/**
 * SIGMA protocol identifier
 */
export const SIGMA_PREFIX = 'SIGMA'

/**
 * SIGMA signature algorithm
 */
export enum SigmaAlgorithm {
  BSM = 'BSM'
}

/**
 * SIGMA signature data structure
 */
export interface SigmaData {
  /** BitCom protocol index */
  bitcomIndex?: number
  /** Signing algorithm (BSM) */
  algorithm: SigmaAlgorithm
  /** Bitcoin address of signer */
  address: string
  /** Cryptographic signature as number array */
  signature: number[]
  /** Input index (vin) that anchors the signature */
  vin: number
  /** Whether signature verification passed */
  valid?: boolean
}

/**
 * Options for SIGMA signature creation
 */
export interface SigmaOptions {
  /** Signing algorithm (default: BSM) */
  algorithm?: SigmaAlgorithm
  /** Input index to anchor signature (default: 0) */
  vin?: number
}

/**
 * SIGMA (Secure Identity for Global Message Authentication) implementation
 *
 * SIGMA enables cryptographic signing of blockchain content by combining:
 * - Input hash: SHA256 of the outpoint (txid + vout) from a specific input
 * - Data hash: SHA256 of the script data before the SIGMA protocol marker
 *
 * This creates a signature that binds the content to a specific transaction input,
 * providing proof of ownership at time of signing.
 */
export default class Sigma implements ScriptTemplate {
  public readonly data: SigmaData

  constructor (data: SigmaData) {
    this.data = data
  }

  /**
   * Extract SIGMA signatures from BitCom transaction
   *
   * @param bitcom - Decoded BitCom transaction
   * @returns Array of SIGMA signatures found in transaction
   */
  static decode (bitcom: BitComDecoded): Sigma[] {
    const sigmas: Sigma[] = []

    if (bitcom?.protocols?.length === 0) {
      return sigmas
    }

    for (let protoIdx = 0; protoIdx < bitcom.protocols.length; protoIdx++) {
      const protocol = bitcom.protocols[protoIdx]
      if (protocol.protocol === SIGMA_PREFIX) {
        try {
          const script = Script.fromBinary(protocol.script)
          const chunks = script.chunks

          // Need algorithm, address, signature, and vin
          if (chunks?.length < 4) {
            continue
          }

          const sigma = new Sigma({
            bitcomIndex: protoIdx,
            algorithm: Utils.toUTF8(chunks[0].data ?? []) as SigmaAlgorithm,
            address: Utils.toUTF8(chunks[1].data ?? []),
            signature: Array.from(chunks[2].data ?? []),
            vin: parseInt(Utils.toUTF8(chunks[3].data ?? []), 10),
            valid: undefined
          })

          sigmas.push(sigma)
        } catch (error) {
          // Skip invalid SIGMA protocols
          continue
        }
      }
    }

    return sigmas
  }

  /**
   * Decode SIGMA signatures directly from a Script
   *
   * @param script - The script to decode
   * @returns Array of SIGMA signatures found
   */
  static decodeFromScript (script: Script | LockingScript): Sigma[] {
    const bitcom = BitCom.decode(script)
    if (bitcom == null) {
      return []
    }
    return Sigma.decode(bitcom)
  }

  /**
   * Create SIGMA signature for data
   *
   * @param inputHash - SHA256 hash of the input outpoint
   * @param dataHash - SHA256 hash of the script data
   * @param privateKey - Private key for signing
   * @param options - Additional signing options
   * @returns SIGMA signature object
   */
  static async sign (
    inputHash: number[],
    dataHash: number[],
    privateKey: PrivateKey,
    options: SigmaOptions = {}
  ): Promise<Sigma> {
    const algorithm = options.algorithm ?? SigmaAlgorithm.BSM
    const vin = options.vin ?? 0
    const address = privateKey.toAddress().toString()

    // Combine hashes to create message
    const combinedHashes = new Uint8Array(inputHash.length + dataHash.length)
    combinedHashes.set(inputHash, 0)
    combinedHashes.set(dataHash, inputHash.length)
    const messageHash = Array.from(new Uint8Array(combinedHashes))

    // Sign using BSM
    const sig = BSM.sign(messageHash, privateKey, 'raw') as Signature
    const magicHashValue = BSM.magicHash(messageHash)
    const recoveryFactor = sig.CalculateRecoveryFactor(privateKey.toPublicKey(), new BigNumber(magicHashValue))

    // Create compact signature with recovery factor
    const compactSig = sig.toCompact(recoveryFactor, true, 'base64') as string
    const signatureArray = Array.from(Utils.toArray(compactSig, 'base64'))

    return new Sigma({
      algorithm,
      address,
      signature: signatureArray,
      vin,
      valid: true
    })
  }

  /**
   * Verify SIGMA signature against provided hashes
   *
   * @param inputHash - SHA256 hash of the input outpoint
   * @param dataHash - SHA256 hash of the script data
   * @returns True if signature is valid
   */
  verifyWithHashes (inputHash: number[], dataHash: number[]): boolean {
    try {
      // Combine hashes to recreate message
      const combinedHashes = new Uint8Array(inputHash.length + dataHash.length)
      combinedHashes.set(inputHash, 0)
      combinedHashes.set(dataHash, inputHash.length)
      const messageHash = Array.from(new Uint8Array(combinedHashes))

      // Decode signature
      const signatureBase64 = Utils.toBase64(this.data.signature)
      const sig = Signature.fromCompact(signatureBase64, 'base64')

      // Try all recovery factors
      for (let recovery = 0; recovery < 4; recovery++) {
        try {
          const publicKey = sig.RecoverPublicKey(
            recovery,
            new BigNumber(BSM.magicHash(messageHash))
          )
          const sigFitsPubkey = BSM.verify(messageHash, sig, publicKey)
          if (sigFitsPubkey && publicKey.toAddress().toString() === this.data.address) {
            this.data.valid = true
            return true
          }
        } catch {
          // Try next recovery factor
        }
      }

      this.data.valid = false
      return false
    } catch {
      this.data.valid = false
      return false
    }
  }

  /**
   * Check if signature was previously verified
   *
   * @returns True if signature is valid
   */
  verify (): boolean {
    return this.data.valid === true
  }

  /**
   * Generate locking script for SIGMA within BitCom
   *
   * @returns Locking script
   */
  lock (): LockingScript {
    const script = new Script()

    // Add algorithm
    script.writeBin(Utils.toArray(this.data.algorithm, 'utf8'))

    // Add address
    script.writeBin(Utils.toArray(this.data.address, 'utf8'))

    // Add signature
    script.writeBin(this.data.signature)

    // Add vin
    script.writeBin(Utils.toArray(this.data.vin.toString(), 'utf8'))

    // Create BitCom protocol
    const protocols: Protocol[] = [{
      protocol: SIGMA_PREFIX,
      script: script.toBinary(),
      pos: 0
    }]

    const bitcom = new BitCom(protocols)
    return bitcom.lock()
  }

  /**
   * Unlock method is not available for SIGMA scripts
   *
   * @throws Error - SIGMA signatures cannot be unlocked
   */
  unlock (): {
    sign: (tx: any, inputIndex: number) => Promise<UnlockingScript>
    estimateLength: () => Promise<number>
  } {
    throw new Error('SIGMA signatures cannot be unlocked')
  }
}
