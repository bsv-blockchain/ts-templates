import BitCom, { BitComProtocol } from '../../../template/bitcom/BitCom'
import { Script, LockingScript, OP, Utils } from '@bsv/sdk'

describe('BitCom', () => {
  const testProtocol: BitComProtocol = {
    protocol: 'test',
    script: [0x04, 0x74, 0x65, 0x73, 0x74], // "test" in bytes
    pos: 0
  }

  const testProtocol2: BitComProtocol = {
    protocol: 'demo',
    script: [0x04, 0x64, 0x65, 0x6d, 0x6f], // "demo" in bytes
    pos: 0
  }

  describe('constructor', () => {
    it('should create BitCom with empty protocols and prefix', () => {
      const bitcom = new BitCom()
      expect(bitcom.protocols).toEqual([])
      expect(bitcom.scriptPrefix).toEqual([])
    })

    it('should create BitCom with provided protocols and prefix', () => {
      const protocols = [testProtocol]
      const prefix = [0x00, 0x01]
      const bitcom = new BitCom(protocols, prefix)

      expect(bitcom.protocols).toEqual(protocols)
      expect(bitcom.scriptPrefix).toEqual(prefix)
    })
  })

  describe('decode', () => {
    it('should return empty structure for null script', () => {
      const result = BitCom.decode(null as any)
      expect(result).toEqual({
        protocols: [],
        scriptPrefix: []
      })
    })

    it('should return null for script without OP_RETURN', () => {
      const script = new Script()
      script.writeOpCode(0x01)
      script.writeOpCode(0x02)
      script.writeOpCode(0x03)
      const result = BitCom.decode(script)
      expect(result).toBeNull()
    })

    it('should decode simple OP_RETURN script', () => {
      // Create a simple OP_RETURN script: OP_RETURN "test" 0x74657374
      const scriptBytes = [
        OP.OP_RETURN,
        0x04, 0x74, 0x65, 0x73, 0x74, // "test"
        0x04, 0x74, 0x65, 0x73, 0x74 // "test" data
      ]
      const script = Script.fromBinary(scriptBytes)
      const result = BitCom.decode(script)

      expect(result).toBeDefined()
      if (result != null) {
        expect(result.scriptPrefix).toEqual([])
        expect(result.protocols).toHaveLength(1)
        expect(result.protocols[0].protocol).toBe('test')
      }
    })

    it('should decode script with prefix', () => {
      // Create script with prefix: 0x00 0x01 OP_RETURN "test" 0x74657374
      const scriptBytes = [
        0x00, 0x01, // prefix
        OP.OP_RETURN,
        0x04, 0x74, 0x65, 0x73, 0x74, // "test"
        0x04, 0x74, 0x65, 0x73, 0x74 // "test" data
      ]
      const script = Script.fromBinary(scriptBytes)
      const result = BitCom.decode(script)

      expect(result).toBeDefined()
      if (result != null) {
        expect(result.scriptPrefix).toEqual([0x00, 0x01])
        expect(result.protocols).toHaveLength(1)
        expect(result.protocols[0].protocol).toBe('test')
      }
    })

    it('should decode script with multiple protocols separated by pipe', () => {
      // Create script: OP_RETURN "test" 0x74657374 "|" "demo" 0x64656d6f
      const scriptBytes = [
        OP.OP_RETURN,
        0x04, 0x74, 0x65, 0x73, 0x74, // "test"
        0x04, 0x74, 0x65, 0x73, 0x74, // "test" data
        0x01, 0x7c, // pipe "|"
        0x04, 0x64, 0x65, 0x6d, 0x6f, // "demo"
        0x04, 0x64, 0x65, 0x6d, 0x6f // "demo" data
      ]
      const script = Script.fromBinary(scriptBytes)
      const result = BitCom.decode(script)

      expect(result).toBeDefined()
      if (result != null) {
        expect(result.protocols).toHaveLength(2)
        expect(result.protocols[0].protocol).toBe('test')
        expect(result.protocols[1].protocol).toBe('demo')
      }
    })

    it('should handle LockingScript input', () => {
      const scriptBytes = [
        OP.OP_RETURN,
        0x04, 0x74, 0x65, 0x73, 0x74, // "test"
        0x04, 0x74, 0x65, 0x73, 0x74 // "test" data
      ]
      const script = Script.fromBinary(scriptBytes)
      const lockingScript = new LockingScript(script.chunks)
      const result = BitCom.decode(lockingScript)

      expect(result).toBeDefined()
      if (result != null) {
        expect(result.protocols).toHaveLength(1)
        expect(result.protocols[0].protocol).toBe('test')
      }
    })
  })

  describe('lock', () => {
    it('should create empty script for no protocols', () => {
      const bitcom = new BitCom()
      const script = bitcom.lock()

      expect(script).toBeDefined()
      expect(script.chunks).toHaveLength(0)
    })

    it('should create script with prefix only', () => {
      const prefix = [0x00, 0x01]
      const bitcom = new BitCom([], prefix)
      const script = bitcom.lock()

      expect(script).toBeDefined()
      expect(script.chunks).toHaveLength(1)
      expect(script.chunks[0].op).toBe(2) // Length of prefix data
      expect(script.chunks[0].data).toEqual([0x00, 0x01])
    })

    it('should create OP_RETURN script with single protocol', () => {
      const protocols = [testProtocol]
      const bitcom = new BitCom(protocols)
      const script = bitcom.lock()

      expect(script).toBeDefined()
      expect(script.chunks[0].op).toBe(OP.OP_RETURN)

      // Should contain protocol identifier
      expect(script.chunks[1].op).toBe(4) // Length of "test"
      expect(script.chunks[1].data).toEqual(Utils.toArray('test', 'utf8'))
    })

    it('should create script with multiple protocols and pipe separators', () => {
      const protocols = [testProtocol, testProtocol2]
      const bitcom = new BitCom(protocols)
      const script = bitcom.lock()

      expect(script).toBeDefined()
      expect(script.chunks[0].op).toBe(OP.OP_RETURN)

      // Should contain pipe separator between protocols
      let foundPipe = false
      for (const chunk of script.chunks) {
        if ((chunk.data != null) && chunk.data.length === 1 && chunk.data[0] === 0x7c) {
          foundPipe = true
          break
        }
      }
      expect(foundPipe).toBe(true)
    })

    it('should create script with prefix and protocols', () => {
      const prefix = [0x00, 0x01]
      const protocols = [testProtocol]
      const bitcom = new BitCom(protocols, prefix)
      const script = bitcom.lock()

      expect(script).toBeDefined()
      expect(script.chunks[0].op).toBe(2) // Length of prefix data
      expect(script.chunks[0].data).toEqual([0x00, 0x01])
      expect(script.chunks[1].op).toBe(OP.OP_RETURN)
    })
  })

  describe('toScript', () => {
    it('should return Script as-is', () => {
      const originalScript = Script.fromBinary([0x01, 0x02, 0x03])
      const result = BitCom.toScript(originalScript)

      expect(result).toBe(originalScript)
    })

    it('should convert LockingScript to Script', () => {
      const lockingScript = new LockingScript([{ op: 0x01 }, { op: 0x02 }])
      const result = BitCom.toScript(lockingScript)

      expect(result).toBeInstanceOf(LockingScript)
      expect(result).toBe(lockingScript)
    })

    it('should convert byte array to Script', () => {
      const byteArray = [0x01, 0x02, 0x03]
      const result = BitCom.toScript(byteArray)

      expect(result).toBeInstanceOf(Script)
      expect(result?.toBinary()).toEqual(byteArray)
    })

    it('should return null for invalid input', () => {
      const result = BitCom.toScript('invalid')
      expect(result).toBeNull()
    })

    it('should return null for null input', () => {
      const result = BitCom.toScript(null)
      expect(result).toBeNull()
    })
  })

  describe('integration', () => {
    it('should round-trip encode/decode correctly', () => {
      const originalProtocols = [testProtocol, testProtocol2]
      const originalPrefix = [0x00, 0x01]
      const originalBitcom = new BitCom(originalProtocols, originalPrefix)

      const script = originalBitcom.lock()
      const decoded = BitCom.decode(script)

      expect(decoded).toBeDefined()
      if (decoded != null) {
        expect(decoded.scriptPrefix).toEqual([2, 0x00, 0x01]) // SDK includes length prefix
        expect(decoded.protocols).toHaveLength(2)
        expect(decoded.protocols[0].protocol).toBe('test')
        expect(decoded.protocols[1].protocol).toBe('demo')
      }
    })

    it('should handle empty protocol data', () => {
      const emptyProtocol: BitComProtocol = {
        protocol: 'empty',
        script: [],
        pos: 0
      }
      const bitcom = new BitCom([emptyProtocol])

      const script = bitcom.lock()
      const decoded = BitCom.decode(script)

      expect(decoded).toBeDefined()
      if (decoded != null) {
        expect(decoded.protocols).toHaveLength(1)
        expect(decoded.protocols[0].protocol).toBe('empty')
      }
    })
  })
})
