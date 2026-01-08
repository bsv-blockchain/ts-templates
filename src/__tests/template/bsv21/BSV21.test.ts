import BSV21 from '../../../template/bsv21/BSV21'
import Inscription from '../../../template/inscription/Inscription'
import { Script, OP, LockingScript } from '@bsv/sdk'

describe('BSV21', () => {
  describe('deployMint', () => {
    it('should create valid deploy+mint token with required fields', () => {
      const token = BSV21.deployMint('MYTOKEN', BigInt(1000000))

      expect(token.tokenData.p).toBe('bsv-20')
      expect(token.tokenData.op).toBe('deploy+mint')
      expect(token.tokenData.sym).toBe('MYTOKEN')
      expect(token.tokenData.amt).toBe('1000000')
      expect(token.getAmount()).toBe(BigInt(1000000))
      expect(token.getSymbol()).toBe('MYTOKEN')
      expect(token.getDecimals()).toBe(0)
      expect(token.isDeployMint()).toBe(true)
      expect(token.isTransfer()).toBe(false)
      expect(token.isBurn()).toBe(false)
    })

    it('should create deploy+mint token with decimals', () => {
      const token = BSV21.deployMint('TOKEN', BigInt(1000000), 8)

      expect(token.tokenData.dec).toBe(8)
      expect(token.getDecimals()).toBe(8)
    })

    it('should create deploy+mint token with icon', () => {
      const icon = 'https://example.com/icon.png'
      const token = BSV21.deployMint('ICON', BigInt(100), 0, icon)

      expect(token.tokenData.icon).toBe(icon)
      expect(token.getIcon()).toBe(icon)
      expect(token.hasIcon()).toBe(true)
    })

    it('should create deploy+mint token with all optional fields', () => {
      const token = BSV21.deployMint('FULL', BigInt(5000000), 8, 'data:image/png;base64,abc123')

      expect(token.tokenData.sym).toBe('FULL')
      expect(token.tokenData.amt).toBe('5000000')
      expect(token.tokenData.dec).toBe(8)
      expect(token.tokenData.icon).toBe('data:image/png;base64,abc123')
      expect(token.getAmount()).toBe(BigInt(5000000))
      expect(token.getDecimals()).toBe(8)
      expect(token.hasIcon()).toBe(true)
    })

    it('should validate symbol requirements', () => {
      expect(() => BSV21.deployMint('', BigInt(1000))).toThrow('Symbol cannot be empty')
      expect(() => BSV21.deployMint('SYMBOL_TOO_LONG_EXCEEDS_THIRTY_TWO_CHARS', BigInt(1000)))
        .toThrow('Symbol cannot exceed 32 characters')
    })

    it('should validate amount requirements', () => {
      expect(() => BSV21.deployMint('TEST', BigInt(0))).toThrow('Amount must be positive')
      expect(() => BSV21.deployMint('TEST', BigInt(-100))).toThrow('Amount must be positive')
    })

    it('should validate decimal requirements', () => {
      expect(() => BSV21.deployMint('TEST', BigInt(1000), -1)).toThrow('Decimals must be between 0 and 18')
      expect(() => BSV21.deployMint('TEST', BigInt(1000), 19)).toThrow('Decimals must be between 0 and 18')

      // Valid decimals should work
      expect(() => BSV21.deployMint('TEST', BigInt(1000), 0)).not.toThrow()
      expect(() => BSV21.deployMint('TEST', BigInt(1000), 18)).not.toThrow()
    })

    it('should create inscription with correct content type', () => {
      const token = BSV21.deployMint('TEST', BigInt(1000))
      const inscription = token.getInscription()

      expect(inscription.file.type).toBe('application/bsv-20')
      const content = new TextDecoder().decode(inscription.file.content)
      expect(content).toContain('"p":"bsv-20"')
      expect(content).toContain('"op":"deploy+mint"')
      expect(content).toContain('"sym":"TEST"')
      expect(content).toContain('"amt":"1000"')
    })
  })

  describe('transfer', () => {
    it('should create valid transfer token', () => {
      const tokenId = 'a'.repeat(64) + '_0'
      const token = BSV21.transfer(tokenId, BigInt(500))

      expect(token.tokenData.p).toBe('bsv-20')
      expect(token.tokenData.op).toBe('transfer')
      expect(token.tokenData.id).toBe(tokenId)
      expect(token.tokenData.amt).toBe('500')
      expect(token.getAmount()).toBe(BigInt(500))
      expect(token.getTokenId()).toBe(tokenId)
      expect(token.isTransfer()).toBe(true)
      expect(token.isDeployMint()).toBe(false)
      expect(token.isBurn()).toBe(false)
    })

    it('should validate token ID format', () => {
      const validTokenId = 'a'.repeat(64) + '_123'
      expect(() => BSV21.transfer(validTokenId, BigInt(100))).not.toThrow()

      // Invalid formats
      expect(() => BSV21.transfer('', BigInt(100))).toThrow('Token ID cannot be empty')
      expect(() => BSV21.transfer('invalid', BigInt(100))).toThrow('Token ID must be in format: txid_vout')
      expect(() => BSV21.transfer('a'.repeat(63) + '_0', BigInt(100))).toThrow('Token ID must be in format: txid_vout')
      expect(() => BSV21.transfer('a'.repeat(64) + '_abc', BigInt(100))).toThrow('Token ID must be in format: txid_vout')
      expect(() => BSV21.transfer('a'.repeat(64), BigInt(100))).toThrow('Token ID must be in format: txid_vout')
    })

    it('should validate amount requirements', () => {
      const tokenId = 'a'.repeat(64) + '_0'
      expect(() => BSV21.transfer(tokenId, BigInt(0))).toThrow('Amount must be positive')
      expect(() => BSV21.transfer(tokenId, BigInt(-100))).toThrow('Amount must be positive')
    })

    it('should create inscription with correct content', () => {
      const tokenId = 'b'.repeat(64) + '_5'
      const token = BSV21.transfer(tokenId, BigInt(750))
      const inscription = token.getInscription()

      expect(inscription.file.type).toBe('application/bsv-20')
      const content = new TextDecoder().decode(inscription.file.content)
      expect(content).toContain('"p":"bsv-20"')
      expect(content).toContain('"op":"transfer"')
      expect(content).toContain(`"id":"${tokenId}"`)
      expect(content).toContain('"amt":"750"')
    })
  })

  describe('burn', () => {
    it('should create valid burn token', () => {
      const tokenId = 'c'.repeat(64) + '_99'
      const token = BSV21.burn(tokenId, BigInt(250))

      expect(token.tokenData.p).toBe('bsv-20')
      expect(token.tokenData.op).toBe('burn')
      expect(token.tokenData.id).toBe(tokenId)
      expect(token.tokenData.amt).toBe('250')
      expect(token.getAmount()).toBe(BigInt(250))
      expect(token.getTokenId()).toBe(tokenId)
      expect(token.isBurn()).toBe(true)
      expect(token.isDeployMint()).toBe(false)
      expect(token.isTransfer()).toBe(false)
    })

    it('should validate token ID format', () => {
      const validTokenId = 'd'.repeat(64) + '_456'
      expect(() => BSV21.burn(validTokenId, BigInt(100))).not.toThrow()

      // Invalid formats
      expect(() => BSV21.burn('', BigInt(100))).toThrow('Token ID cannot be empty')
      expect(() => BSV21.burn('invalid', BigInt(100))).toThrow('Token ID must be in format: txid_vout')
    })

    it('should validate amount requirements', () => {
      const tokenId = 'd'.repeat(64) + '_0'
      expect(() => BSV21.burn(tokenId, BigInt(0))).toThrow('Amount must be positive')
      expect(() => BSV21.burn(tokenId, BigInt(-50))).toThrow('Amount must be positive')
    })

    it('should create inscription with correct content', () => {
      const tokenId = 'e'.repeat(64) + '_7'
      const token = BSV21.burn(tokenId, BigInt(125))
      const inscription = token.getInscription()

      expect(inscription.file.type).toBe('application/bsv-20')
      const content = new TextDecoder().decode(inscription.file.content)
      expect(content).toContain('"p":"bsv-20"')
      expect(content).toContain('"op":"burn"')
      expect(content).toContain(`"id":"${tokenId}"`)
      expect(content).toContain('"amt":"125"')
    })
  })

  describe('decode', () => {
    it('should decode deploy+mint tokens from scripts', () => {
      const original = BSV21.deployMint('DECODE', BigInt(2000000), 6, 'https://test.com/icon.svg')
      const script = original.lock()
      const decoded = BSV21.decode(script)

      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.tokenData).toEqual(original.tokenData)
        expect(decoded.getSymbol()).toBe('DECODE')
        expect(decoded.getAmount()).toBe(BigInt(2000000))
        expect(decoded.getDecimals()).toBe(6)
        expect(decoded.getIcon()).toBe('https://test.com/icon.svg')
        expect(decoded.isDeployMint()).toBe(true)
      }
    })

    it('should decode transfer tokens from scripts', () => {
      const tokenId = 'f'.repeat(64) + '_42'
      const original = BSV21.transfer(tokenId, BigInt(1500))
      const script = original.lock()
      const decoded = BSV21.decode(script)

      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.tokenData).toEqual(original.tokenData)
        expect(decoded.getTokenId()).toBe(tokenId)
        expect(decoded.getAmount()).toBe(BigInt(1500))
        expect(decoded.isTransfer()).toBe(true)
      }
    })

    it('should decode burn tokens from scripts', () => {
      const tokenId = 'g'.repeat(64) + '_88'
      const original = BSV21.burn(tokenId, BigInt(300))
      const script = original.lock()
      const decoded = BSV21.decode(script)

      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.tokenData).toEqual(original.tokenData)
        expect(decoded.getTokenId()).toBe(tokenId)
        expect(decoded.getAmount()).toBe(BigInt(300))
        expect(decoded.isBurn()).toBe(true)
      }
    })

    it('should return null for non-inscription scripts', () => {
      const script = new Script()
      script.writeOpCode(OP.OP_RETURN)
      script.writeBin([72, 101, 108, 108, 111]) // "Hello"

      const decoded = BSV21.decode(script)
      expect(decoded).toBeNull()
    })

    it('should return null for non-BSV-20 inscriptions', () => {
      const textInscription = Inscription.fromText('Hello, World!', 'text/plain')
      const script = textInscription.lock()
      const decoded = BSV21.decode(script)

      expect(decoded).toBeNull()
    })

    it('should return null for invalid JSON in inscription', () => {
      const invalidInscription = Inscription.fromText('invalid json {', 'application/bsv-20')
      const script = invalidInscription.lock()
      const decoded = BSV21.decode(script)

      expect(decoded).toBeNull()
    })

    it('should return null for invalid protocol identifier', () => {
      const invalidData = { p: 'wrong-protocol', op: 'deploy+mint', sym: 'TEST', amt: '1000' }
      const invalidInscription = Inscription.fromText(JSON.stringify(invalidData), 'application/bsv-20')
      const script = invalidInscription.lock()
      const decoded = BSV21.decode(script)

      expect(decoded).toBeNull()
    })

    it('should validate required fields for deploy+mint', () => {
      // Missing symbol
      const noSymbol = { p: 'bsv-20', op: 'deploy+mint', amt: '1000' }
      let inscription = Inscription.fromText(JSON.stringify(noSymbol), 'application/bsv-20')
      expect(BSV21.decode(inscription.lock())).toBeNull()

      // Invalid decimals
      const invalidDecimals = { p: 'bsv-20', op: 'deploy+mint', sym: 'TEST', amt: '1000', dec: 20 }
      inscription = Inscription.fromText(JSON.stringify(invalidDecimals), 'application/bsv-20')
      expect(BSV21.decode(inscription.lock())).toBeNull()
    })

    it('should validate required fields for transfer/burn', () => {
      // Missing token ID
      const noId = { p: 'bsv-20', op: 'transfer', amt: '1000' }
      let inscription = Inscription.fromText(JSON.stringify(noId), 'application/bsv-20')
      expect(BSV21.decode(inscription.lock())).toBeNull()

      // Invalid token ID format
      const invalidId = { p: 'bsv-20', op: 'transfer', id: 'invalid', amt: '1000' }
      inscription = Inscription.fromText(JSON.stringify(invalidId), 'application/bsv-20')
      expect(BSV21.decode(inscription.lock())).toBeNull()
    })

    it('should validate amount field', () => {
      // Missing amount
      const noAmount = { p: 'bsv-20', op: 'deploy+mint', sym: 'TEST' }
      let inscription = Inscription.fromText(JSON.stringify(noAmount), 'application/bsv-20')
      expect(BSV21.decode(inscription.lock())).toBeNull()

      // Invalid amount
      const invalidAmount = { p: 'bsv-20', op: 'deploy+mint', sym: 'TEST', amt: 'invalid' }
      inscription = Inscription.fromText(JSON.stringify(invalidAmount), 'application/bsv-20')
      expect(BSV21.decode(inscription.lock())).toBeNull()

      // Zero amount
      const zeroAmount = { p: 'bsv-20', op: 'deploy+mint', sym: 'TEST', amt: '0' }
      inscription = Inscription.fromText(JSON.stringify(zeroAmount), 'application/bsv-20')
      expect(BSV21.decode(inscription.lock())).toBeNull()
    })
  })

  describe('lock', () => {
    it('should generate locking script without suffix', () => {
      const token = BSV21.deployMint('LOCK', BigInt(1000))
      const script = token.lock()

      expect(script).toBeDefined()
      expect(script.chunks).toBeDefined()
      expect(script.chunks.length).toBeGreaterThan(0)

      // Should be decodable
      const decoded = BSV21.decode(script)
      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.getSymbol()).toBe('LOCK')
      }
    })

    it('should generate locking script with suffix', () => {
      const token = BSV21.transfer('h'.repeat(64) + '_1', BigInt(500))

      // Create a simple P2PKH-like suffix script
      const suffixScript = new Script()
      suffixScript.writeOpCode(OP.OP_DUP)
      suffixScript.writeOpCode(OP.OP_HASH160)
      const lockingScript = new LockingScript(suffixScript.chunks)

      const script = token.lock(lockingScript)

      expect(script).toBeDefined()
      expect(script.chunks.length).toBeGreaterThan(lockingScript.chunks.length)

      // Should be decodable
      const decoded = BSV21.decode(script)
      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.getTokenId()).toBe('h'.repeat(64) + '_1')
      }
    })
  })

  describe('unlock', () => {
    it('should throw error for unlock attempts', () => {
      const token = BSV21.deployMint('UNLOCK', BigInt(1000))

      expect(() => token.unlock()).toThrow('BSV-21 tokens cannot be unlocked directly')
    })
  })

  describe('utility methods', () => {
    it('should provide access to underlying inscription', () => {
      const token = BSV21.deployMint('UTIL', BigInt(1000))
      const inscription = token.getInscription()

      expect(inscription).toBeInstanceOf(Inscription)
      expect(inscription.file.type).toBe('application/bsv-20')
    })

    it('should format token data as JSON', () => {
      const token = BSV21.deployMint('JSON', BigInt(1500), 4)
      const json = token.toJSON()

      expect(json).toContain('"p": "bsv-20"')
      expect(json).toContain('"op": "deploy+mint"')
      expect(json).toContain('"sym": "JSON"')
      expect(json).toContain('"amt": "1500"')
      expect(json).toContain('"dec": 4')
    })

    it('should validate token data structure', () => {
      // Valid tokens
      expect(BSV21.deployMint('VALID', BigInt(1000)).validate()).toBe(true)
      expect(BSV21.transfer('i'.repeat(64) + '_0', BigInt(500)).validate()).toBe(true)
      expect(BSV21.burn('j'.repeat(64) + '_1', BigInt(250)).validate()).toBe(true)

      // All valid tokens should pass validation
      const tokens = [
        BSV21.deployMint('TEST1', BigInt(1000)),
        BSV21.deployMint('TEST2', BigInt(2000), 8, 'icon'),
        BSV21.transfer('k'.repeat(64) + '_0', BigInt(500)),
        BSV21.burn('l'.repeat(64) + '_1', BigInt(100))
      ]

      tokens.forEach(token => {
        expect(token.validate()).toBe(true)
      })
    })
  })

  describe('round-trip compatibility', () => {
    it('should maintain data integrity through encode/decode cycles', () => {
      const testCases = [
        BSV21.deployMint('ROUNDTRIP1', BigInt(5000000), 8, 'https://example.com/icon.png'),
        BSV21.deployMint('SIMPLE', BigInt(1000)),
        BSV21.transfer('m'.repeat(64) + '_123', BigInt(750)),
        BSV21.burn('n'.repeat(64) + '_456', BigInt(250))
      ]

      testCases.forEach((original, index) => {
        const script = original.lock()
        const decoded = BSV21.decode(script)

        expect(decoded).not.toBeNull()
        if (decoded != null) {
          expect(decoded.tokenData).toEqual(original.tokenData)
          expect(decoded.getAmount()).toBe(original.getAmount())
          expect(decoded.getOperation()).toBe(original.getOperation())

          // Test specific fields based on operation
          if (original.isDeployMint()) {
            expect(decoded.getSymbol()).toBe(original.getSymbol())
            expect(decoded.getDecimals()).toBe(original.getDecimals())
            expect(decoded.getIcon()).toBe(original.getIcon())
          } else {
            expect(decoded.getTokenId()).toBe(original.getTokenId())
          }
        }
      })
    })

    it('should handle large amounts correctly', () => {
      const largeAmount = BigInt('999999999999999999999999999')
      const token = BSV21.deployMint('LARGE', largeAmount)
      const script = token.lock()
      const decoded = BSV21.decode(script)

      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.getAmount()).toBe(largeAmount)
        expect(decoded.tokenData.amt).toBe(largeAmount.toString())
      }
    })

    it('should preserve inscription properties', () => {
      const parent = new Uint8Array(36).fill(1)
      const prefix = new Script().writeOpCode(OP.OP_1).writeOpCode(OP.OP_2)

      const token = BSV21.deployMint('PROPS', BigInt(1000), 0, undefined, {
        parent,
        scriptPrefix: prefix
      })

      const script = token.lock()
      const decoded = BSV21.decode(script)

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
      const minDecimals = BSV21.deployMint('MIN', BigInt(1000), 0)
      const maxDecimals = BSV21.deployMint('MAX', BigInt(1000), 18)

      expect(minDecimals.getDecimals()).toBe(0)
      expect(maxDecimals.getDecimals()).toBe(18)

      // Round-trip test
      const minScript = minDecimals.lock()
      const maxScript = maxDecimals.lock()
      const minDecoded = BSV21.decode(minScript)
      const maxDecoded = BSV21.decode(maxScript)

      if (minDecoded != null) {
        expect(minDecoded.getDecimals()).toBe(0)
      }
      if (maxDecoded != null) {
        expect(maxDecoded.getDecimals()).toBe(18)
      }
    })

    it('should handle maximum symbol length', () => {
      const maxSymbol = 'A'.repeat(32)
      const token = BSV21.deployMint(maxSymbol, BigInt(1000))

      expect(token.getSymbol()).toBe(maxSymbol)

      // Round-trip test
      const script = token.lock()
      const decoded = BSV21.decode(script)
      if (decoded != null) {
        expect(decoded.getSymbol()).toBe(maxSymbol)
      }
    })

    it('should handle various icon formats', () => {
      const icons = [
        'https://example.com/icon.png',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'icon_outpoint_reference',
        ''
      ]

      icons.forEach((icon, index) => {
        const token = BSV21.deployMint(`ICON${index}`, BigInt(1000), 0, icon !== '' ? icon : undefined)
        const script = token.lock()
        const decoded = BSV21.decode(script)

        expect(decoded).not.toBeNull()
        if (decoded != null) {
          expect(decoded.getIcon()).toBe(icon !== '' ? icon : undefined)
        }
      })
    })
  })
})
