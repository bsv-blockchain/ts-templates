import { describe, expect, it } from '@jest/globals'
import BAP, { BAPAttestationType, BAP_PROTOCOL_PREFIX } from '../../../template/bitcom/BAP.js'
import BitCom from '../../../template/bitcom/BitCom.js'
import { Script, Utils } from '@bsv/sdk'

describe('BAP Protocol', () => {
  describe('Constants', () => {
    it('should have the correct protocol prefix', () => {
      expect(BAP_PROTOCOL_PREFIX).toBe('1BAPSuaPnfGnSBM3GLV9yhxUdYe4vGbdMT')
    })

    it('should have all attestation types', () => {
      expect(BAPAttestationType.ID).toBe('ID')
      expect(BAPAttestationType.ATTEST).toBe('ATTEST')
      expect(BAPAttestationType.REVOKE).toBe('REVOKE')
      expect(BAPAttestationType.ALIAS).toBe('ALIAS')
    })
  })

  describe('ID Attestation', () => {
    it('should create ID attestation', () => {
      const identityKey = '03abc123'
      const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      const algorithm = 'BITCOIN_ECDSA'
      const signerAddr = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const signature = 'H123456789abcdef'

      const bap = BAP.createID(identityKey, address, algorithm, signerAddr, signature)

      expect(bap.type).toBe(BAPAttestationType.ID)
      expect(bap.idKey).toBe(identityKey)
      expect(bap.address).toBe(address)
      expect(bap.algorithm).toBe(algorithm)
      expect(bap.signerAddr).toBe(signerAddr)
      expect(bap.signature).toBe(signature)
      expect(bap.rootAddress).toBe(signerAddr)
      expect(bap.isSignedByID).toBe(true)
    })

    it('should create ID attestation without signature', () => {
      const identityKey = '03abc123'
      const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'

      const bap = BAP.createID(identityKey, address)

      expect(bap.type).toBe(BAPAttestationType.ID)
      expect(bap.idKey).toBe(identityKey)
      expect(bap.address).toBe(address)
      expect(bap.algorithm).toBeUndefined()
      expect(bap.signerAddr).toBeUndefined()
      expect(bap.signature).toBeUndefined()
      expect(bap.isSignedByID).toBe(true)
    })

    it('should generate correct locking script for ID', () => {
      const identityKey = '03abc123'
      const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      const algorithm = 'BITCOIN_ECDSA'
      const signerAddr = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const signature = 'H123456789abcdef'

      const bap = BAP.createID(identityKey, address, algorithm, signerAddr, signature)
      const script = bap.lock()

      expect(script).toBeDefined()
      expect(script.chunks.length).toBeGreaterThan(0)
    })
  })

  describe('ATTEST Attestation', () => {
    it('should create ATTEST attestation', () => {
      const txid = 'abcdef123456789'
      const sequence = BigInt(12345)
      const algorithm = 'BITCOIN_ECDSA'
      const signerAddr = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const signature = 'H123456789abcdef'

      const bap = BAP.createAttest(txid, sequence, algorithm, signerAddr, signature)

      expect(bap.type).toBe(BAPAttestationType.ATTEST)
      expect(bap.idKey).toBe(txid)
      expect(bap.sequence).toBe(sequence)
      expect(bap.algorithm).toBe(algorithm)
      expect(bap.signerAddr).toBe(signerAddr)
      expect(bap.signature).toBe(signature)
      expect(bap.rootAddress).toBe(signerAddr)
      expect(bap.isSignedByID).toBe(false)
    })

    it('should generate correct locking script for ATTEST', () => {
      const txid = 'abcdef123456789'
      const sequence = BigInt(12345)

      const bap = BAP.createAttest(txid, sequence)
      const script = bap.lock()

      expect(script).toBeDefined()
      expect(script.chunks.length).toBeGreaterThan(0)
    })
  })

  describe('REVOKE Attestation', () => {
    it('should create REVOKE attestation', () => {
      const txid = 'abcdef123456789'
      const sequence = BigInt(12345)
      const algorithm = 'BITCOIN_ECDSA'
      const signerAddr = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const signature = 'H123456789abcdef'

      const bap = BAP.createRevoke(txid, sequence, algorithm, signerAddr, signature)

      expect(bap.type).toBe(BAPAttestationType.REVOKE)
      expect(bap.idKey).toBe(txid)
      expect(bap.sequence).toBe(sequence)
      expect(bap.algorithm).toBe(algorithm)
      expect(bap.signerAddr).toBe(signerAddr)
      expect(bap.signature).toBe(signature)
      expect(bap.rootAddress).toBe(signerAddr)
      expect(bap.isSignedByID).toBe(false)
    })

    it('should generate correct locking script for REVOKE', () => {
      const txid = 'abcdef123456789'
      const sequence = BigInt(12345)

      const bap = BAP.createRevoke(txid, sequence)
      const script = bap.lock()

      expect(script).toBeDefined()
      expect(script.chunks.length).toBeGreaterThan(0)
    })
  })

  describe('ALIAS Attestation', () => {
    it('should create ALIAS attestation', () => {
      const alias = 'john_doe'
      const profile = { name: 'John Doe', bio: 'Software developer' }
      const algorithm = 'BITCOIN_ECDSA'
      const signerAddr = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const signature = 'H123456789abcdef'

      const bap = BAP.createAlias(alias, profile, algorithm, signerAddr, signature)

      expect(bap.type).toBe(BAPAttestationType.ALIAS)
      expect(bap.idKey).toBe(alias)
      expect(bap.profile).toEqual(profile)
      expect(bap.algorithm).toBe(algorithm)
      expect(bap.signerAddr).toBe(signerAddr)
      expect(bap.signature).toBe(signature)
      expect(bap.rootAddress).toBe(signerAddr)
      expect(bap.isSignedByID).toBe(false)
    })

    it('should generate correct locking script for ALIAS', () => {
      const alias = 'john_doe'
      const profile = { name: 'John Doe', bio: 'Software developer' }

      const bap = BAP.createAlias(alias, profile)
      const script = bap.lock()

      expect(script).toBeDefined()
      expect(script.chunks.length).toBeGreaterThan(0)
    })
  })

  describe('Decode functionality', () => {
    it('should decode ID attestation', () => {
      const identityKey = '03abc123'
      const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      const algorithm = 'BITCOIN_ECDSA'
      const signerAddr = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const signature = 'H123456789abcdef'

      const originalBap = BAP.createID(identityKey, address, algorithm, signerAddr, signature)
      const script = originalBap.lock()

      // Create BitCom structure
      const bitcom = BitCom.decode(script)
      expect(bitcom).toBeDefined()

      if (bitcom != null) {
        const decodedBap = BAP.decode(bitcom)
        expect(decodedBap).toBeDefined()
        if (decodedBap != null) {
          expect(decodedBap.type).toBe(BAPAttestationType.ID)
          expect(decodedBap.idKey).toBe(identityKey)
          expect(decodedBap.address).toBe(address)
          expect(decodedBap.isSignedByID).toBe(true)
        }
      }
    })

    it('should decode ATTEST attestation', () => {
      const txid = 'abcdef123456789'
      const sequence = BigInt(12345)
      const algorithm = 'BITCOIN_ECDSA'
      const signerAddr = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const signature = 'H123456789abcdef'

      const originalBap = BAP.createAttest(txid, sequence, algorithm, signerAddr, signature)
      const script = originalBap.lock()

      // Create BitCom structure
      const bitcom = BitCom.decode(script)
      expect(bitcom).toBeDefined()

      if (bitcom != null) {
        const decodedBap = BAP.decode(bitcom)
        expect(decodedBap).toBeDefined()
        if (decodedBap != null) {
          expect(decodedBap.type).toBe(BAPAttestationType.ATTEST)
          expect(decodedBap.idKey).toBe(txid)
          expect(decodedBap.sequence).toBe(sequence)
          expect(decodedBap.isSignedByID).toBe(false)
        }
      }
    })

    it('should decode REVOKE attestation', () => {
      const txid = 'abcdef123456789'
      const sequence = BigInt(12345)

      const originalBap = BAP.createRevoke(txid, sequence)
      const script = originalBap.lock()

      // Create BitCom structure
      const bitcom = BitCom.decode(script)
      expect(bitcom).toBeDefined()

      if (bitcom != null) {
        const decodedBap = BAP.decode(bitcom)
        expect(decodedBap).toBeDefined()
        if (decodedBap != null) {
          expect(decodedBap.type).toBe(BAPAttestationType.REVOKE)
          expect(decodedBap.idKey).toBe(txid)
          expect(decodedBap.sequence).toBe(sequence)
          expect(decodedBap.isSignedByID).toBe(false)
        }
      }
    })

    it('should decode ALIAS attestation', () => {
      const alias = 'john_doe'
      const profile = { name: 'John Doe', bio: 'Software developer' }

      const originalBap = BAP.createAlias(alias, profile)
      const script = originalBap.lock()

      // Create BitCom structure
      const bitcom = BitCom.decode(script)
      expect(bitcom).toBeDefined()

      if (bitcom != null) {
        const decodedBap = BAP.decode(bitcom)
        expect(decodedBap).toBeDefined()
        if (decodedBap != null) {
          expect(decodedBap.type).toBe(BAPAttestationType.ALIAS)
          expect(decodedBap.idKey).toBe(alias)
          expect(decodedBap.profile).toEqual(profile)
          expect(decodedBap.isSignedByID).toBe(false)
        }
      }
    })

    it('should return null for invalid BitCom structure', () => {
      const decoded = BAP.decode(null as any)
      expect(decoded).toBeNull()
    })

    it('should return null for BitCom without BAP protocol', () => {
      const bitcom = {
        protocols: [{
          protocol: 'INVALID',
          script: [],
          pos: 0
        }],
        scriptPrefix: []
      }

      const decoded = BAP.decode(bitcom)
      expect(decoded).toBeNull()
    })
  })

  describe('Signature verification', () => {
    it('should verify signature when all components present', () => {
      const bap = BAP.createID(
        '03abc123',
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        'BITCOIN_ECDSA',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        'H123456789abcdef'
      )

      const isValid = bap.verifySignature([])
      expect(isValid).toBe(true)
    })

    it('should fail verification when signature components missing', () => {
      const bap = BAP.createID('03abc123', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

      const isValid = bap.verifySignature([])
      expect(isValid).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should throw error on unlock attempt', () => {
      const bap = BAP.createID('03abc123', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

      expect(() => bap.unlock()).toThrow('BAP attestations cannot be unlocked')
    })

    it('should handle malformed decode data gracefully', () => {
      const bitcom = {
        protocols: [{
          protocol: BAP_PROTOCOL_PREFIX,
          script: [0x00], // Invalid script data
          pos: 0
        }],
        scriptPrefix: []
      }

      const decoded = BAP.decode(bitcom)
      expect(decoded).toBeNull()
    })

    it('should handle invalid JSON in ALIAS profile', () => {
      // Create a BAP with invalid JSON by using a proper script structure
      const script = new Script()
      script.writeBin(Utils.toArray('ALIAS', 'utf8'))
      script.writeBin(Utils.toArray('test_alias', 'utf8'))
      script.writeBin(Utils.toArray('{invalid json', 'utf8')) // Invalid JSON
      script.writeBin(Utils.toArray('|', 'utf8'))

      const bitcom = {
        protocols: [{
          protocol: BAP_PROTOCOL_PREFIX,
          script: script.toBinary(),
          pos: 0
        }],
        scriptPrefix: []
      }

      const decoded = BAP.decode(bitcom)
      expect(decoded).toBeDefined()
      if (decoded != null) {
        expect(decoded.type).toBe(BAPAttestationType.ALIAS)
        expect(decoded.profile).toBe('{invalid json') // Should store as raw string
      }
    })
  })

  describe('Round-trip testing', () => {
    it('should preserve ID data through encode/decode cycle', () => {
      const identityKey = '03abc123'
      const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      const algorithm = 'BITCOIN_ECDSA'
      const signerAddr = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      const signature = 'H123456789abcdef'

      const originalBap = BAP.createID(identityKey, address, algorithm, signerAddr, signature)
      const script = originalBap.lock()
      const bitcom = BitCom.decode(script)
      expect(bitcom).toBeDefined()

      if (bitcom != null) {
        const decodedBap = BAP.decode(bitcom)
        expect(decodedBap).toBeDefined()
        if (decodedBap != null) {
          expect(decodedBap.type).toBe(originalBap.type)
          expect(decodedBap.idKey).toBe(originalBap.idKey)
          expect(decodedBap.address).toBe(originalBap.address)
          expect(decodedBap.algorithm).toBe(originalBap.algorithm)
          expect(decodedBap.signerAddr).toBe(originalBap.signerAddr)
          expect(decodedBap.signature).toBe(originalBap.signature)
          expect(decodedBap.isSignedByID).toBe(originalBap.isSignedByID)
        }
      }
    })

    it('should preserve ATTEST data through encode/decode cycle', () => {
      const txid = 'abcdef123456789'
      const sequence = BigInt(12345)

      const originalBap = BAP.createAttest(txid, sequence)
      const script = originalBap.lock()
      const bitcom = BitCom.decode(script)
      expect(bitcom).toBeDefined()

      if (bitcom != null) {
        const decodedBap = BAP.decode(bitcom)
        expect(decodedBap).toBeDefined()
        if (decodedBap != null) {
          expect(decodedBap.type).toBe(originalBap.type)
          expect(decodedBap.idKey).toBe(originalBap.idKey)
          expect(decodedBap.sequence).toBe(originalBap.sequence)
          expect(decodedBap.isSignedByID).toBe(originalBap.isSignedByID)
        }
      }
    })

    it('should preserve ALIAS data through encode/decode cycle', () => {
      const alias = 'john_doe'
      const profile = { name: 'John Doe', bio: 'Software developer', age: 30 }

      const originalBap = BAP.createAlias(alias, profile)
      const script = originalBap.lock()
      const bitcom = BitCom.decode(script)
      expect(bitcom).toBeDefined()

      if (bitcom != null) {
        const decodedBap = BAP.decode(bitcom)
        expect(decodedBap).toBeDefined()
        if (decodedBap != null) {
          expect(decodedBap.type).toBe(originalBap.type)
          expect(decodedBap.idKey).toBe(originalBap.idKey)
          expect(decodedBap.profile).toEqual(originalBap.profile)
          expect(decodedBap.isSignedByID).toBe(originalBap.isSignedByID)
        }
      }
    })
  })

  describe('Large data handling', () => {
    it('should handle large identity keys', () => {
      const largeKey = 'a'.repeat(1000)
      const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'

      const bap = BAP.createID(largeKey, address)
      const script = bap.lock()

      expect(script).toBeDefined()
      expect(script.chunks.length).toBeGreaterThan(0)
    })

    it('should handle large profile data', () => {
      const alias = 'test_user'
      const largeProfile = {
        name: 'Test User',
        description: 'x'.repeat(5000),
        data: Array(100).fill('large_data_entry')
      }

      const bap = BAP.createAlias(alias, largeProfile)
      const script = bap.lock()
      const bitcom = BitCom.decode(script)
      expect(bitcom).toBeDefined()

      if (bitcom != null) {
        const decoded = BAP.decode(bitcom)
        expect(decoded).toBeDefined()
        if (decoded != null) {
          expect(decoded.profile).toEqual(largeProfile)
        }
      }
    })
  })

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      const bap = BAP.createID('', '')
      const script = bap.lock()

      expect(script).toBeDefined()
      expect(script.chunks.length).toBeGreaterThan(0)
    })

    it('should handle zero sequence number', () => {
      const bap = BAP.createAttest('txid', BigInt(0))
      const script = bap.lock()
      const bitcom = BitCom.decode(script)
      expect(bitcom).toBeDefined()

      if (bitcom != null) {
        const decoded = BAP.decode(bitcom)
        expect(decoded).toBeDefined()
        if (decoded != null) {
          expect(decoded.sequence).toBe(BigInt(0))
        }
      }
    })

    it('should handle very large sequence numbers', () => {
      const largeSequence = BigInt('9223372036854775807') // Max int64
      const bap = BAP.createAttest('txid', largeSequence)
      const script = bap.lock()
      const bitcom = BitCom.decode(script)
      expect(bitcom).toBeDefined()

      if (bitcom != null) {
        const decoded = BAP.decode(bitcom)
        expect(decoded).toBeDefined()
        if (decoded != null) {
          expect(decoded.sequence).toBe(largeSequence)
        }
      }
    })
  })
})
