import BSV20 from '../../../template/bsv20/BSV20'
import Inscription from '../../../template/inscription/Inscription'
import { Script, OP, LockingScript } from '@bsv/sdk'

describe('BSV20', () => {
  describe('deploy', () => {
    it('should create valid deploy token with required fields', () => {
      const token = BSV20.deploy('MYTOKEN', BigInt(21000000))

      expect(token.tokenData.p).toBe('bsv-20')
      expect(token.tokenData.op).toBe('deploy')
      expect(token.tokenData.tick).toBe('MYTOKEN')
      expect(token.tokenData.amt).toBe('0')
      expect(token.tokenData.max).toBe('21000000')
      expect(token.getTicker()).toBe('MYTOKEN')
      expect(token.getMaxSupply()).toBe(BigInt(21000000))
      expect(token.getDecimals()).toBe(0)
      expect(token.isDeploy()).toBe(true)
      expect(token.isMint()).toBe(false)
      expect(token.isTransfer()).toBe(false)
      expect(token.isBurn()).toBe(false)
    })

    it('should create deploy token with decimals', () => {
      const token = BSV20.deploy('TOKEN', BigInt(1000000), 8)

      expect(token.tokenData.dec).toBe(8)
      expect(token.getDecimals()).toBe(8)
    })

    it('should create deploy token with mint limit', () => {
      const token = BSV20.deploy('LIMITED', BigInt(1000000), 0, BigInt(1000))

      expect(token.tokenData.lim).toBe('1000')
      expect(token.getLimitPerMint()).toBe(BigInt(1000))
    })

    it('should create deploy token with all optional fields', () => {
      const token = BSV20.deploy('FULL', BigInt(21000000), 8, BigInt(10000))

      expect(token.tokenData.tick).toBe('FULL')
      expect(token.tokenData.max).toBe('21000000')
      expect(token.tokenData.dec).toBe(8)
      expect(token.tokenData.lim).toBe('10000')
      expect(token.getMaxSupply()).toBe(BigInt(21000000))
      expect(token.getDecimals()).toBe(8)
      expect(token.getLimitPerMint()).toBe(BigInt(10000))
    })

    it('should validate ticker requirements', () => {
      expect(() => BSV20.deploy('', BigInt(1000))).toThrow('Ticker cannot be empty')
      expect(() => BSV20.deploy('TICKER_TOO_LONG_EXCEEDS_THIRTY_TWO_CHARS', BigInt(1000)))
        .toThrow('Ticker cannot exceed 32 characters')
    })

    it('should validate max supply requirements', () => {
      expect(() => BSV20.deploy('TEST', BigInt(0))).toThrow('Max supply must be positive')
      expect(() => BSV20.deploy('TEST', BigInt(-100))).toThrow('Max supply must be positive')
    })

    it('should validate decimal requirements', () => {
      expect(() => BSV20.deploy('TEST', BigInt(1000), -1)).toThrow('Decimals must be between 0 and 18')
      expect(() => BSV20.deploy('TEST', BigInt(1000), 19)).toThrow('Decimals must be between 0 and 18')

      // Valid decimals should work
      expect(() => BSV20.deploy('TEST', BigInt(1000), 0)).not.toThrow()
      expect(() => BSV20.deploy('TEST', BigInt(1000), 18)).not.toThrow()
    })

    it('should validate limit per mint requirements', () => {
      expect(() => BSV20.deploy('TEST', BigInt(1000), 0, BigInt(0))).toThrow('Limit per mint must be positive')
      expect(() => BSV20.deploy('TEST', BigInt(1000), 0, BigInt(-100))).toThrow('Limit per mint must be positive')
    })

    it('should create inscription with correct content type', () => {
      const token = BSV20.deploy('TEST', BigInt(1000))
      const inscription = token.getInscription()

      expect(inscription.file.type).toBe('application/bsv-20')
      const content = new TextDecoder().decode(inscription.file.content)
      expect(content).toContain('"p":"bsv-20"')
      expect(content).toContain('"op":"deploy"')
      expect(content).toContain('"tick":"TEST"')
      expect(content).toContain('"max":"1000"')
    })
  })

  describe('mint', () => {
    it('should create valid mint token', () => {
      const token = BSV20.mint('MYTOKEN', BigInt(1000))

      expect(token.tokenData.p).toBe('bsv-20')
      expect(token.tokenData.op).toBe('mint')
      expect(token.tokenData.tick).toBe('MYTOKEN')
      expect(token.tokenData.amt).toBe('1000')
      expect(token.getAmount()).toBe(BigInt(1000))
      expect(token.getTicker()).toBe('MYTOKEN')
      expect(token.isMint()).toBe(true)
      expect(token.isDeploy()).toBe(false)
      expect(token.isTransfer()).toBe(false)
      expect(token.isBurn()).toBe(false)
    })

    it('should validate ticker requirements', () => {
      expect(() => BSV20.mint('', BigInt(1000))).toThrow('Ticker cannot be empty')
      expect(() => BSV20.mint('TICKER_TOO_LONG_EXCEEDS_THIRTY_TWO_CHARS', BigInt(1000)))
        .toThrow('Ticker cannot exceed 32 characters')
    })

    it('should validate amount requirements', () => {
      expect(() => BSV20.mint('TEST', BigInt(0))).toThrow('Amount must be positive')
      expect(() => BSV20.mint('TEST', BigInt(-100))).toThrow('Amount must be positive')
    })

    it('should create inscription with correct content', () => {
      const token = BSV20.mint('MINT', BigInt(5000))
      const inscription = token.getInscription()

      expect(inscription.file.type).toBe('application/bsv-20')
      const content = new TextDecoder().decode(inscription.file.content)
      expect(content).toContain('"p":"bsv-20"')
      expect(content).toContain('"op":"mint"')
      expect(content).toContain('"tick":"MINT"')
      expect(content).toContain('"amt":"5000"')
    })
  })

  describe('transfer', () => {
    it('should create valid transfer token', () => {
      const token = BSV20.transfer('MYTOKEN', BigInt(500))

      expect(token.tokenData.p).toBe('bsv-20')
      expect(token.tokenData.op).toBe('transfer')
      expect(token.tokenData.tick).toBe('MYTOKEN')
      expect(token.tokenData.amt).toBe('500')
      expect(token.getAmount()).toBe(BigInt(500))
      expect(token.getTicker()).toBe('MYTOKEN')
      expect(token.isTransfer()).toBe(true)
      expect(token.isDeploy()).toBe(false)
      expect(token.isMint()).toBe(false)
      expect(token.isBurn()).toBe(false)
    })

    it('should validate ticker requirements', () => {
      expect(() => BSV20.transfer('', BigInt(100))).toThrow('Ticker cannot be empty')
      expect(() => BSV20.transfer('TICKER_TOO_LONG_EXCEEDS_THIRTY_TWO_CHARS', BigInt(100)))
        .toThrow('Ticker cannot exceed 32 characters')
    })

    it('should validate amount requirements', () => {
      expect(() => BSV20.transfer('TEST', BigInt(0))).toThrow('Amount must be positive')
      expect(() => BSV20.transfer('TEST', BigInt(-100))).toThrow('Amount must be positive')
    })

    it('should create inscription with correct content', () => {
      const token = BSV20.transfer('TRANSFER', BigInt(2500))
      const inscription = token.getInscription()

      expect(inscription.file.type).toBe('application/bsv-20')
      const content = new TextDecoder().decode(inscription.file.content)
      expect(content).toContain('"p":"bsv-20"')
      expect(content).toContain('"op":"transfer"')
      expect(content).toContain('"tick":"TRANSFER"')
      expect(content).toContain('"amt":"2500"')
    })
  })

  describe('burn', () => {
    it('should create valid burn token', () => {
      const token = BSV20.burn('MYTOKEN', BigInt(250))

      expect(token.tokenData.p).toBe('bsv-20')
      expect(token.tokenData.op).toBe('burn')
      expect(token.tokenData.tick).toBe('MYTOKEN')
      expect(token.tokenData.amt).toBe('250')
      expect(token.getAmount()).toBe(BigInt(250))
      expect(token.getTicker()).toBe('MYTOKEN')
      expect(token.isBurn()).toBe(true)
      expect(token.isDeploy()).toBe(false)
      expect(token.isMint()).toBe(false)
      expect(token.isTransfer()).toBe(false)
    })

    it('should validate ticker requirements', () => {
      expect(() => BSV20.burn('', BigInt(100))).toThrow('Ticker cannot be empty')
      expect(() => BSV20.burn('TICKER_TOO_LONG_EXCEEDS_THIRTY_TWO_CHARS', BigInt(100)))
        .toThrow('Ticker cannot exceed 32 characters')
    })

    it('should validate amount requirements', () => {
      expect(() => BSV20.burn('TEST', BigInt(0))).toThrow('Amount must be positive')
      expect(() => BSV20.burn('TEST', BigInt(-50))).toThrow('Amount must be positive')
    })

    it('should create inscription with correct content', () => {
      const token = BSV20.burn('BURN', BigInt(750))
      const inscription = token.getInscription()

      expect(inscription.file.type).toBe('application/bsv-20')
      const content = new TextDecoder().decode(inscription.file.content)
      expect(content).toContain('"p":"bsv-20"')
      expect(content).toContain('"op":"burn"')
      expect(content).toContain('"tick":"BURN"')
      expect(content).toContain('"amt":"750"')
    })
  })

  describe('decode', () => {
    it('should decode deploy tokens from scripts', () => {
      const original = BSV20.deploy('DECODE', BigInt(1000000), 8, BigInt(10000))
      const script = original.lock()
      const decoded = BSV20.decode(script)

      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.tokenData).toEqual(original.tokenData)
        expect(decoded.getTicker()).toBe('DECODE')
        expect(decoded.getMaxSupply()).toBe(BigInt(1000000))
        expect(decoded.getDecimals()).toBe(8)
        expect(decoded.getLimitPerMint()).toBe(BigInt(10000))
        expect(decoded.isDeploy()).toBe(true)
      }
    })

    it('should decode mint tokens from scripts', () => {
      const original = BSV20.mint('MINT', BigInt(5000))
      const script = original.lock()
      const decoded = BSV20.decode(script)

      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.tokenData).toEqual(original.tokenData)
        expect(decoded.getTicker()).toBe('MINT')
        expect(decoded.getAmount()).toBe(BigInt(5000))
        expect(decoded.isMint()).toBe(true)
      }
    })

    it('should decode transfer tokens from scripts', () => {
      const original = BSV20.transfer('TRANSFER', BigInt(1500))
      const script = original.lock()
      const decoded = BSV20.decode(script)

      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.tokenData).toEqual(original.tokenData)
        expect(decoded.getTicker()).toBe('TRANSFER')
        expect(decoded.getAmount()).toBe(BigInt(1500))
        expect(decoded.isTransfer()).toBe(true)
      }
    })

    it('should decode burn tokens from scripts', () => {
      const original = BSV20.burn('BURN', BigInt(300))
      const script = original.lock()
      const decoded = BSV20.decode(script)

      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.tokenData).toEqual(original.tokenData)
        expect(decoded.getTicker()).toBe('BURN')
        expect(decoded.getAmount()).toBe(BigInt(300))
        expect(decoded.isBurn()).toBe(true)
      }
    })

    it('should return null for non-inscription scripts', () => {
      const script = new Script()
      script.writeOpCode(OP.OP_RETURN)
      script.writeBin([72, 101, 108, 108, 111]) // "Hello"

      const decoded = BSV20.decode(script)
      expect(decoded).toBeNull()
    })

    it('should return null for non-BSV-20 inscriptions', () => {
      const textInscription = Inscription.fromText('Hello, World!', 'text/plain')
      const script = textInscription.lock()
      const decoded = BSV20.decode(script)

      expect(decoded).toBeNull()
    })

    it('should return null for invalid JSON in inscription', () => {
      const invalidInscription = Inscription.fromText('invalid json {', 'application/bsv-20')
      const script = invalidInscription.lock()
      const decoded = BSV20.decode(script)

      expect(decoded).toBeNull()
    })

    it('should return null for invalid protocol identifier', () => {
      const invalidData = { p: 'wrong-protocol', op: 'deploy', tick: 'TEST', max: '1000', amt: '0' }
      const invalidInscription = Inscription.fromText(JSON.stringify(invalidData), 'application/bsv-20')
      const script = invalidInscription.lock()
      const decoded = BSV20.decode(script)

      expect(decoded).toBeNull()
    })

    it('should validate required fields for deploy', () => {
      // Missing ticker
      const noTicker = { p: 'bsv-20', op: 'deploy', max: '1000', amt: '0' }
      let inscription = Inscription.fromText(JSON.stringify(noTicker), 'application/bsv-20')
      expect(BSV20.decode(inscription.lock())).toBeNull()

      // Missing max supply
      const noMax = { p: 'bsv-20', op: 'deploy', tick: 'TEST', amt: '0' }
      inscription = Inscription.fromText(JSON.stringify(noMax), 'application/bsv-20')
      expect(BSV20.decode(inscription.lock())).toBeNull()

      // Invalid decimals
      const invalidDecimals = { p: 'bsv-20', op: 'deploy', tick: 'TEST', max: '1000', amt: '0', dec: 20 }
      inscription = Inscription.fromText(JSON.stringify(invalidDecimals), 'application/bsv-20')
      expect(BSV20.decode(inscription.lock())).toBeNull()

      // Invalid limit
      const invalidLimit = { p: 'bsv-20', op: 'deploy', tick: 'TEST', max: '1000', amt: '0', lim: '0' }
      inscription = Inscription.fromText(JSON.stringify(invalidLimit), 'application/bsv-20')
      expect(BSV20.decode(inscription.lock())).toBeNull()
    })

    it('should validate required fields for mint/transfer/burn', () => {
      // Missing ticker
      const noTicker = { p: 'bsv-20', op: 'mint', amt: '1000' }
      let inscription = Inscription.fromText(JSON.stringify(noTicker), 'application/bsv-20')
      expect(BSV20.decode(inscription.lock())).toBeNull()

      // Missing amount
      const noAmount = { p: 'bsv-20', op: 'transfer', tick: 'TEST' }
      inscription = Inscription.fromText(JSON.stringify(noAmount), 'application/bsv-20')
      expect(BSV20.decode(inscription.lock())).toBeNull()

      // Invalid amount
      const invalidAmount = { p: 'bsv-20', op: 'burn', tick: 'TEST', amt: 'invalid' }
      inscription = Inscription.fromText(JSON.stringify(invalidAmount), 'application/bsv-20')
      expect(BSV20.decode(inscription.lock())).toBeNull()

      // Zero amount
      const zeroAmount = { p: 'bsv-20', op: 'mint', tick: 'TEST', amt: '0' }
      inscription = Inscription.fromText(JSON.stringify(zeroAmount), 'application/bsv-20')
      expect(BSV20.decode(inscription.lock())).toBeNull()
    })

    it('should validate operation types', () => {
      const invalidOp = { p: 'bsv-20', op: 'invalid', tick: 'TEST', amt: '1000' }
      const inscription = Inscription.fromText(JSON.stringify(invalidOp), 'application/bsv-20')
      expect(BSV20.decode(inscription.lock())).toBeNull()
    })
  })

  describe('lock', () => {
    it('should generate locking script without suffix', () => {
      const token = BSV20.deploy('LOCK', BigInt(1000))
      const script = token.lock()

      expect(script).toBeDefined()
      expect(script.chunks).toBeDefined()
      expect(script.chunks.length).toBeGreaterThan(0)

      // Should be decodable
      const decoded = BSV20.decode(script)
      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.getTicker()).toBe('LOCK')
      }
    })

    it('should generate locking script with suffix', () => {
      const token = BSV20.transfer('SUFFIX', BigInt(500))

      // Create a simple P2PKH-like suffix script
      const suffixScript = new Script()
      suffixScript.writeOpCode(OP.OP_DUP)
      suffixScript.writeOpCode(OP.OP_HASH160)
      const lockingScript = new LockingScript(suffixScript.chunks)

      const script = token.lock(lockingScript)

      expect(script).toBeDefined()
      expect(script.chunks.length).toBeGreaterThan(lockingScript.chunks.length)

      // Should be decodable
      const decoded = BSV20.decode(script)
      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.getTicker()).toBe('SUFFIX')
      }
    })
  })

  describe('unlock', () => {
    it('should throw error for unlock attempts', () => {
      const token = BSV20.deploy('UNLOCK', BigInt(1000))

      expect(() => token.unlock()).toThrow('BSV-20 tokens cannot be unlocked directly')
    })
  })

  describe('utility methods', () => {
    it('should provide access to underlying inscription', () => {
      const token = BSV20.deploy('UTIL', BigInt(1000))
      const inscription = token.getInscription()

      expect(inscription).toBeInstanceOf(Inscription)
      expect(inscription.file.type).toBe('application/bsv-20')
    })

    it('should format token data as JSON', () => {
      const token = BSV20.deploy('JSON', BigInt(1500), 4)
      const json = token.toJSON()

      expect(json).toContain('"p": "bsv-20"')
      expect(json).toContain('"op": "deploy"')
      expect(json).toContain('"tick": "JSON"')
      expect(json).toContain('"max": "1500"')
      expect(json).toContain('"dec": 4')
    })

    it('should validate token data structure', () => {
      // Valid tokens
      expect(BSV20.deploy('VALID', BigInt(1000)).validate()).toBe(true)
      expect(BSV20.mint('VALID', BigInt(500)).validate()).toBe(true)
      expect(BSV20.transfer('VALID', BigInt(250)).validate()).toBe(true)
      expect(BSV20.burn('VALID', BigInt(100)).validate()).toBe(true)

      // All valid tokens should pass validation
      const tokens = [
        BSV20.deploy('TEST1', BigInt(1000)),
        BSV20.deploy('TEST2', BigInt(2000), 8, BigInt(100)),
        BSV20.mint('TEST3', BigInt(500)),
        BSV20.transfer('TEST4', BigInt(250)),
        BSV20.burn('TEST5', BigInt(100))
      ]

      tokens.forEach(token => {
        expect(token.validate()).toBe(true)
      })
    })

    it('should handle undefined optional fields correctly', () => {
      const deploy = BSV20.deploy('OPTIONAL', BigInt(1000))
      const mint = BSV20.mint('OPTIONAL', BigInt(500))

      expect(deploy.getLimitPerMint()).toBeUndefined()
      expect(mint.getMaxSupply()).toBeUndefined()
      expect(mint.getLimitPerMint()).toBeUndefined()
    })
  })

  describe('round-trip compatibility', () => {
    it('should maintain data integrity through encode/decode cycles', () => {
      const testCases = [
        BSV20.deploy('ROUNDTRIP1', BigInt(21000000), 8, BigInt(10000)),
        BSV20.deploy('SIMPLE', BigInt(1000)),
        BSV20.mint('MINT', BigInt(500)),
        BSV20.transfer('TRANSFER', BigInt(250)),
        BSV20.burn('BURN', BigInt(100))
      ]

      testCases.forEach((original, index) => {
        const script = original.lock()
        const decoded = BSV20.decode(script)

        expect(decoded).not.toBeNull()
        if (decoded != null) {
          expect(decoded.tokenData).toEqual(original.tokenData)
          expect(decoded.getOperation()).toBe(original.getOperation())
          expect(decoded.getTicker()).toBe(original.getTicker())

          // Test specific fields based on operation
          if (original.isDeploy()) {
            expect(decoded.getMaxSupply()).toBe(original.getMaxSupply())
            expect(decoded.getDecimals()).toBe(original.getDecimals())
            expect(decoded.getLimitPerMint()).toBe(original.getLimitPerMint())
          } else {
            expect(decoded.getAmount()).toBe(original.getAmount())
          }
        }
      })
    })

    it('should handle large amounts correctly', () => {
      const largeAmount = BigInt('999999999999999999999999999')
      const token = BSV20.deploy('LARGE', largeAmount)
      const script = token.lock()
      const decoded = BSV20.decode(script)

      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.getMaxSupply()).toBe(largeAmount)
        expect(decoded.tokenData.max).toBe(largeAmount.toString())
      }
    })

    it('should preserve inscription properties', () => {
      const parent = new Uint8Array(36).fill(1)
      const prefix = new Script().writeOpCode(OP.OP_1).writeOpCode(OP.OP_2)

      const token = BSV20.deploy('PROPS', BigInt(1000), 0, undefined, {
        parent,
        scriptPrefix: prefix
      })

      const script = token.lock()
      const decoded = BSV20.decode(script)

      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.inscription.parent).toEqual(parent)
        // scriptPrefix should be a Script with same chunks
        expect(decoded.inscription.scriptPrefix?.chunks.length).toBe(2)
        expect(decoded.inscription.scriptPrefix?.chunks[0].op).toBe(OP.OP_1)
        expect(decoded.inscription.scriptPrefix?.chunks[1].op).toBe(OP.OP_2)
      }
    })
  })

  describe('edge cases', () => {
    it('should handle minimum and maximum valid decimals', () => {
      const minDecimals = BSV20.deploy('MIN', BigInt(1000), 0)
      const maxDecimals = BSV20.deploy('MAX', BigInt(1000), 18)

      expect(minDecimals.getDecimals()).toBe(0)
      expect(maxDecimals.getDecimals()).toBe(18)

      // Round-trip test
      const minScript = minDecimals.lock()
      const maxScript = maxDecimals.lock()
      const minDecoded = BSV20.decode(minScript)
      const maxDecoded = BSV20.decode(maxScript)

      if (minDecoded != null) {
        expect(minDecoded.getDecimals()).toBe(0)
      }
      if (maxDecoded != null) {
        expect(maxDecoded.getDecimals()).toBe(18)
      }
    })

    it('should handle maximum ticker length', () => {
      const maxTicker = 'A'.repeat(32)
      const token = BSV20.deploy(maxTicker, BigInt(1000))

      expect(token.getTicker()).toBe(maxTicker)

      // Round-trip test
      const script = token.lock()
      const decoded = BSV20.decode(script)
      if (decoded != null) {
        expect(decoded.getTicker()).toBe(maxTicker)
      }
    })

    it('should handle minimum amounts', () => {
      const operations = [
        BSV20.mint('MIN', BigInt(1)),
        BSV20.transfer('MIN', BigInt(1)),
        BSV20.burn('MIN', BigInt(1))
      ]

      operations.forEach(token => {
        expect(token.getAmount()).toBe(BigInt(1))

        // Round-trip test
        const script = token.lock()
        const decoded = BSV20.decode(script)
        if (decoded != null) {
          expect(decoded.getAmount()).toBe(BigInt(1))
        }
      })
    })

    it('should handle deploy with zero amount correctly', () => {
      const deploy = BSV20.deploy('ZERO', BigInt(1000000))

      expect(deploy.tokenData.amt).toBe('0')
      expect(deploy.getAmount()).toBe(BigInt(0))

      // Round-trip test
      const script = deploy.lock()
      const decoded = BSV20.decode(script)
      if (decoded != null) {
        expect(decoded.getAmount()).toBe(BigInt(0))
      }
    })
  })
})
