import { ScriptTemplate, LockingScript, UnlockingScript, PrivateKey, Utils, Script, OP, BigNumber, BSM, Signature } from '@bsv/sdk'
import BitCom, { Protocol, BitComDecoded } from './BitCom.js'

/**
 * AIP (Author Identity Protocol) prefix for BitCom transactions
 */
export const AIP_PREFIX = '15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva'

/**
 * AIP signature data structure
 */
export interface AIPData {
  /** BitCom protocol index */
  bitcomIndex?: number
  /** Signing algorithm (typically "BITCOIN_ECDSA") */
  algorithm: string
  /** Bitcoin address of signer */
  address: string
  /** Cryptographic signature as number array */
  signature: number[]
  /** Optional field indexes that were signed */
  fieldIndexes?: number[]
  /** Whether signature verification passed */
  valid?: boolean
}

/**
 * Options for AIP signature creation
 */
export interface AIPOptions {
  /** Signing algorithm (default: "BITCOIN_ECDSA") */
  algorithm?: string
  /** Specific field indexes to sign (default: sign all fields) */
  fieldIndexes?: number[]
}

/**
 * AIP (Author Identity Protocol) implementation
 *
 * AIP enables cryptographic signing of blockchain content with Bitcoin addresses,
 * providing verifiable authorship and identity verification within BitCom transactions.
 */
export default class AIP implements ScriptTemplate {
  public readonly data: AIPData

  constructor (data: AIPData) {
    this.data = data
  }

  /**
   * Extract AIP signatures from BitCom transaction
   *
   * @param bitcom - Decoded BitCom transaction
   * @returns Array of AIP signatures found in transaction
   */
  static decode (bitcom: BitComDecoded): AIP[] {
    const aips: AIP[] = []

    // Safety check for nil
    if (bitcom?.protocols?.length === 0) {
      return aips
    }

    for (let protoIdx = 0; protoIdx < bitcom.protocols.length; protoIdx++) {
      const protocol = bitcom.protocols[protoIdx]
      if (protocol.protocol === AIP_PREFIX) {
        try {
          const script = Script.fromBinary(protocol.script)
          const chunks = script.chunks

          // Need at least algorithm, address, and signature
          if (chunks?.length < 3) {
            continue
          }

          const aip = new AIP({
            bitcomIndex: protoIdx,
            algorithm: Utils.toUTF8(chunks[0].data ?? []),
            address: Utils.toUTF8(chunks[1].data ?? []),
            signature: Array.from(chunks[2].data ?? []),
            fieldIndexes: undefined,
            valid: undefined
          })

          // Read optional field indexes (remaining chunks)
          const fieldIndexes: number[] = []
          for (let i = 3; i < chunks.length; i++) {
            const indexStr = Utils.toUTF8(chunks[i].data ?? [])
            const index = parseInt(indexStr, 10)
            if (Number.isInteger(index) && !isNaN(index)) {
              fieldIndexes.push(index)
            }
            // Continue parsing even if we encounter invalid field indexes
          }

          if (fieldIndexes.length > 0) {
            aip.data.fieldIndexes = fieldIndexes
          }

          // Validate signature against protocols that came before this AIP
          this.validateAIP(aip, bitcom.protocols.slice(0, protoIdx))

          aips.push(aip)
        } catch (error) {
          // Skip invalid AIP protocols
          continue
        }
      }
    }

    return aips
  }

  /**
   * Create AIP signature for data
   *
   * @param data - Data to sign as number array
   * @param privateKey - Private key for signing
   * @param options - Additional signing options
   * @returns AIP signature object
   */
  static async sign (
    data: number[],
    privateKey: PrivateKey,
    options: AIPOptions = {}
  ): Promise<AIP> {
    const algorithm = options.algorithm ?? 'BITCOIN_ECDSA'
    const address = privateKey.toAddress().toString()

    // Use BSM signing following the pattern from BAP library
    const dummySig = BSM.sign(data, privateKey, 'raw') as Signature
    const messageHash = BSM.magicHash(data)
    const recoveryFactor = dummySig.CalculateRecoveryFactor(privateKey.toPublicKey(), new BigNumber(messageHash))

    // Create compact signature with recovery factor
    const compactSig = (BSM.sign(data, privateKey, 'raw') as Signature).toCompact(
      recoveryFactor,
      true,
      'base64'
    ) as string

    // Convert to number array
    const signatureArray = Array.from(Utils.toArray(compactSig, 'base64'))

    return new AIP({
      algorithm,
      address,
      signature: signatureArray,
      fieldIndexes: options.fieldIndexes,
      valid: true
    })
  }

  /**
   * Verify AIP signature
   *
   * @returns True if signature is valid
   */
  verify (): boolean {
    return this.data.valid === true
  }

  /**
   * Generate locking script for AIP within BitCom
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

    // Add field indexes if present
    if ((this.data.fieldIndexes != null) && this.data.fieldIndexes.length > 0) {
      for (const index of this.data.fieldIndexes) {
        script.writeBin(Utils.toArray(index.toString(), 'utf8'))
      }
    }

    // Create BitCom protocol
    const protocols: Protocol[] = [{
      protocol: AIP_PREFIX,
      script: script.toBinary(),
      pos: 0
    }]

    const bitcom = new BitCom(protocols)
    return bitcom.lock()
  }

  /**
   * Unlock method is not available for AIP scripts
   *
   * @throws Error - AIP signatures cannot be unlocked
   */
  unlock (): {
    sign: (tx: any, inputIndex: number) => Promise<UnlockingScript>
    estimateLength: () => Promise<number>
  } {
    throw new Error('AIP signatures cannot be unlocked')
  }

  /**
   * Validate AIP signature against protocol data
   *
   * @param aip - AIP to validate
   * @param protocols - Protocols that came before this AIP
   */
  private static validateAIP (aip: AIP, protocols: Protocol[]): void {
    try {
      // Reconstruct signed data exactly as Go implementation
      const data: number[] = []
      let fieldIndex = 0

      // Add OP_RETURN
      data.push(OP.OP_RETURN)

      // Process each protocol
      for (const protocol of protocols) {
        // Add protocol prefix
        data.push(...Utils.toArray(protocol.protocol, 'utf8'))

        // Parse protocol script
        const script = Script.fromBinary(protocol.script)
        const chunks = script.chunks

        // Process script chunks
        for (const chunk of chunks) {
          if ((chunk.data != null) && chunk.data.length > 0) {
            // Check if this field should be signed
            const shouldSign = (aip.data.fieldIndexes == null) || aip.data.fieldIndexes.includes(fieldIndex)

            if (shouldSign) {
              data.push(...Array.from(chunk.data))
            }
          } else if ((chunk.op != null) && chunk.op > 0x43 && chunk.op < 0x4f) {
            // Handle printable opcodes
            data.push(chunk.op)
          }
          fieldIndex++
        }

        // Add pipe delimiter
        data.push(0x7c) // '|'
      }

      // Verify signature using BSM following the pattern from BAP library
      const signatureBase64 = Utils.toBase64(aip.data.signature)
      const sig = Signature.fromCompact(signatureBase64, 'base64')

      // Try all recovery factors (0-3) to find the correct public key
      for (let recovery = 0; recovery < 4; recovery++) {
        try {
          const publicKey = sig.RecoverPublicKey(
            recovery,
            new BigNumber(BSM.magicHash(data))
          )

          const sigFitsPubkey = BSM.verify(data, sig, publicKey)
          if (sigFitsPubkey && publicKey.toAddress().toString() === aip.data.address) {
            aip.data.valid = true
            return
          }
        } catch (e) {
          // Try next recovery factor
        }
      }

      aip.data.valid = false
    } catch (error) {
      aip.data.valid = false
    }
  }
}
