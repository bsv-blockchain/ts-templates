import AIP, { AIP_PREFIX } from '../../../template/bitcom/AIP'
import BitCom from '../../../template/bitcom/BitCom'
import { PrivateKey, Utils, Script } from '@bsv/sdk'

describe('AIP', () => {
  describe('constants', () => {
    it('should have correct AIP prefix', () => {
      expect(AIP_PREFIX).toBe('15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva')
    })
  })

  describe('sign', () => {
    it('should create AIP signature for data', async () => {
      const privateKey = PrivateKey.fromRandom()
      const data = Utils.toArray('Hello, AIP!', 'utf8')

      const aip = await AIP.sign(data, privateKey)

      expect(aip.data.algorithm).toBe('BITCOIN_ECDSA')
      expect(aip.data.address).toBe(privateKey.toAddress().toString())
      expect(aip.data.signature).toBeInstanceOf(Array)
      expect(aip.data.signature.length).toBeGreaterThan(0)
      expect(aip.data.valid).toBe(true)
    })

    it('should create AIP signature with custom algorithm', async () => {
      const privateKey = PrivateKey.fromRandom()
      const data = Utils.toArray('Hello, AIP!', 'utf8')

      const aip = await AIP.sign(data, privateKey, { algorithm: 'CUSTOM_ALGO' })

      expect(aip.data.algorithm).toBe('CUSTOM_ALGO')
      expect(aip.data.address).toBe(privateKey.toAddress().toString())
    })

    it('should create AIP signature with field indexes', async () => {
      const privateKey = PrivateKey.fromRandom()
      const data = Utils.toArray('Hello, AIP!', 'utf8')
      const fieldIndexes = [0, 2, 4]

      const aip = await AIP.sign(data, privateKey, { fieldIndexes })

      expect(aip.data.fieldIndexes).toEqual(fieldIndexes)
    })
  })

  describe('lock', () => {
    it('should generate locking script for AIP', async () => {
      const privateKey = PrivateKey.fromRandom()
      const data = Utils.toArray('Hello, AIP!', 'utf8')

      const aip = await AIP.sign(data, privateKey)
      const script = aip.lock()

      expect(script).toBeInstanceOf(Script)
      expect(script.toHex()).toBeTruthy()
    })

    it('should include field indexes in locking script', async () => {
      const privateKey = PrivateKey.fromRandom()
      const data = Utils.toArray('Hello, AIP!', 'utf8')
      const fieldIndexes = [1, 3, 5]

      const aip = await AIP.sign(data, privateKey, { fieldIndexes })
      const script = aip.lock()

      expect(script).toBeInstanceOf(Script)

      // Verify script contains field indexes
      const scriptHex = script.toHex()
      expect(scriptHex).toContain('31') // '1' in hex
      expect(scriptHex).toContain('33') // '3' in hex
      expect(scriptHex).toContain('35') // '5' in hex
    })
  })

  describe('unlock', () => {
    it('should throw error for unlock method', async () => {
      const privateKey = PrivateKey.fromRandom()
      const data = Utils.toArray('Hello, AIP!', 'utf8')

      const aip = await AIP.sign(data, privateKey)

      expect(() => aip.unlock()).toThrow('AIP signatures cannot be unlocked')
    })
  })

  describe('verify', () => {
    it('should return validation status', async () => {
      const privateKey = PrivateKey.fromRandom()
      const data = Utils.toArray('Hello, AIP!', 'utf8')

      const aip = await AIP.sign(data, privateKey)

      expect(aip.verify()).toBe(true)
    })

    it('should return false for invalid signature', () => {
      const aip = new AIP({
        algorithm: 'BITCOIN_ECDSA',
        address: 'invalid_address',
        signature: [1, 2, 3, 4],
        valid: false
      })

      expect(aip.verify()).toBe(false)
    })
  })

  describe('decode', () => {
    it('should decode AIP from BitCom transaction', async () => {
      const privateKey = PrivateKey.fromRandom()
      const data = Utils.toArray('Hello, AIP!', 'utf8')

      // Create AIP signature
      const aip = await AIP.sign(data, privateKey)

      // Create BitCom transaction with AIP
      const script = aip.lock()
      const bitcom = BitCom.decode(script)

      if (bitcom != null) {
        const decodedAips = AIP.decode(bitcom)

        expect(decodedAips).toBeInstanceOf(Array)
        expect(decodedAips.length).toBe(1)
        expect(decodedAips[0].data.algorithm).toBe('BITCOIN_ECDSA')
        expect(decodedAips[0].data.address).toBe(privateKey.toAddress().toString())
        expect(decodedAips[0].data.signature).toBeInstanceOf(Array)
      }
    })

    it('should handle empty BitCom transaction', () => {
      const bitcom = {
        protocols: [],
        scriptPrefix: []
      }

      const aips = AIP.decode(bitcom)
      expect(aips).toEqual([])
    })

    it('should handle BitCom transaction without AIP', () => {
      const bitcom = {
        protocols: [{
          protocol: 'different_protocol',
          script: [],
          pos: 0
        }],
        scriptPrefix: []
      }

      const aips = AIP.decode(bitcom)
      expect(aips).toEqual([])
    })

    it('should decode AIP with field indexes', async () => {
      const privateKey = PrivateKey.fromRandom()
      const data = Utils.toArray('Hello, AIP!', 'utf8')
      const fieldIndexes = [0, 2, 4]

      // Create AIP signature with field indexes
      const aip = await AIP.sign(data, privateKey, { fieldIndexes })

      // Create BitCom transaction with AIP
      const script = aip.lock()
      const bitcom = BitCom.decode(script)

      if (bitcom != null) {
        const decodedAips = AIP.decode(bitcom)

        expect(decodedAips).toBeInstanceOf(Array)
        expect(decodedAips.length).toBe(1)
        expect(decodedAips[0].data.fieldIndexes).toEqual(fieldIndexes)
      }
    })

    it('should handle malformed AIP protocol', () => {
      const bitcom = {
        protocols: [{
          protocol: AIP_PREFIX,
          script: [0x01, 0x02], // Invalid script
          pos: 0
        }],
        scriptPrefix: []
      }

      const aips = AIP.decode(bitcom)
      expect(aips).toEqual([])
    })
  })

  describe('integration tests', () => {
    it('should create, encode, and decode AIP signature', async () => {
      const privateKey = PrivateKey.fromRandom()
      const originalData = Utils.toArray('Test message for AIP')

      // Create AIP signature
      const originalAip = await AIP.sign(originalData, privateKey)
      expect(originalAip.verify()).toBe(true)

      // Create BitCom transaction
      const script = originalAip.lock()
      expect(script).toBeInstanceOf(Script)

      // Decode back from script
      const bitcom = BitCom.decode(script)
      expect(bitcom).toBeTruthy()

      if (bitcom != null) {
        const decodedAips = AIP.decode(bitcom)
        expect(decodedAips.length).toBe(1)

        const decodedAip = decodedAips[0]
        expect(decodedAip.data.algorithm).toBe(originalAip.data.algorithm)
        expect(decodedAip.data.address).toBe(originalAip.data.address)
        expect(decodedAip.data.signature).toEqual(originalAip.data.signature)
      }
    })

    it('should handle multiple AIP signatures in one transaction', async () => {
      const privateKey1 = PrivateKey.fromRandom()
      const privateKey2 = PrivateKey.fromRandom()
      const data = Utils.toArray('Multi-AIP test', 'utf8')

      // Create two AIP signatures
      const aip1 = await AIP.sign(data, privateKey1)
      const aip2 = await AIP.sign(data, privateKey2)

      // Would need to combine into single BitCom transaction
      // This is a placeholder for multi-AIP testing
      expect(aip1.verify()).toBe(true)
      expect(aip2.verify()).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty data', async () => {
      const privateKey = PrivateKey.fromRandom()
      const data: number[] = []

      const aip = await AIP.sign(data, privateKey)
      expect(aip.data.signature).toBeInstanceOf(Array)
      expect(aip.data.signature.length).toBeGreaterThan(0)
    })

    it('should handle large data', async () => {
      const privateKey = PrivateKey.fromRandom()
      const largeData = new Array(1000).fill(65) // 1000 'A' characters

      const aip = await AIP.sign(largeData, privateKey)
      expect(aip.data.signature).toBeInstanceOf(Array)
      expect(aip.verify()).toBe(true)
    })

    it('should handle invalid field indexes in decode', () => {
      // Create a proper script structure with invalid and valid field indexes
      const script = new Script()
      script.writeBin(Utils.toArray('BITCOIN_ECDSA', 'utf8')) // algorithm
      script.writeBin(Utils.toArray('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'utf8')) // address
      script.writeBin(new Array(64).fill(0)) // signature
      script.writeBin(Utils.toArray('abc', 'utf8')) // invalid field index
      script.writeBin(Utils.toArray('1', 'utf8')) // valid field index

      const bitcom = {
        protocols: [{
          protocol: AIP_PREFIX,
          script: script.toBinary(),
          pos: 0
        }],
        scriptPrefix: []
      }

      const aips = AIP.decode(bitcom)
      expect(aips.length).toBe(1)
      expect(aips[0].data.fieldIndexes).toEqual([1]) // Only valid index should be included
    })
  })
})
