import { describe, it, expect, beforeEach } from '@jest/globals'
import { OP, Utils, Hash, Script } from '@bsv/sdk'
import Inscription, { type InscriptionFile, type InscriptionOptions } from '../../../template/inscription/Inscription'

describe('Inscription', () => {
  let simpleTextInscription: Inscription
  let imageInscription: Inscription
  let jsonInscription: Inscription

  beforeEach(() => {
    // Create test inscriptions
    simpleTextInscription = Inscription.fromText('Hello, BSV!', 'text/plain')

    // Create a simple "image" (just some bytes)
    const imageData = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) // PNG header
    imageInscription = Inscription.create(imageData, 'image/png')

    // Create JSON inscription
    const jsonData = { message: 'Hello, BSV!', timestamp: Date.now() }
    jsonInscription = Inscription.fromText(JSON.stringify(jsonData), 'application/json')
  })

  describe('constructor', () => {
    it('should create inscription with required file data', () => {
      const content = new Uint8Array(Utils.toArray('test', 'utf8'))
      const hash = new Uint8Array(Hash.sha256(Array.from(content)))
      const file: InscriptionFile = {
        hash,
        size: content.length,
        type: 'text/plain',
        content
      }

      const inscription = new Inscription(file)

      expect(inscription.file).toEqual(file)
      expect(inscription.parent).toBeUndefined()
      expect(inscription.scriptPrefix).toBeUndefined()
      expect(inscription.scriptSuffix).toBeUndefined()
    })

    it('should create inscription with optional parameters', () => {
      const content = new Uint8Array(Utils.toArray('test', 'utf8'))
      const hash = new Uint8Array(Hash.sha256(Array.from(content)))
      const file: InscriptionFile = {
        hash,
        size: content.length,
        type: 'text/plain',
        content
      }
      const parent = new Uint8Array(36).fill(0x01)
      const prefix = new Script().writeOpCode(OP.OP_DUP)
      const suffix = new Script().writeOpCode(OP.OP_CHECKSIG)

      const inscription = new Inscription(file, parent, prefix, suffix)

      expect(inscription.file).toEqual(file)
      expect(inscription.parent).toEqual(parent)
      expect(inscription.scriptPrefix?.chunks.length).toBe(1)
      expect(inscription.scriptPrefix?.chunks[0].op).toBe(OP.OP_DUP)
      expect(inscription.scriptSuffix?.chunks.length).toBe(1)
      expect(inscription.scriptSuffix?.chunks[0].op).toBe(OP.OP_CHECKSIG)
    })
  })

  describe('create', () => {
    it('should create inscription from content and MIME type', () => {
      const content = new Uint8Array(Utils.toArray('Hello, World!', 'utf8'))
      const contentType = 'text/plain'

      const inscription = Inscription.create(content, contentType)

      expect(inscription.file.content).toEqual(content)
      expect(inscription.file.type).toBe(contentType)
      expect(inscription.file.size).toBe(content.length)
      expect(inscription.file.hash).toEqual(new Uint8Array(Hash.sha256(Array.from(content))))
    })

    it('should create inscription with options', () => {
      const content = new Uint8Array(Utils.toArray('test', 'utf8'))
      const parent = new Uint8Array(36).fill(0x02)
      const options: InscriptionOptions = { parent }

      const inscription = Inscription.create(content, 'text/plain', options)

      expect(inscription.parent).toEqual(parent)
    })

    it('should throw error for empty content type', () => {
      const content = new Uint8Array(Utils.toArray('test', 'utf8'))

      expect(() => {
        Inscription.create(content, '')
      }).toThrow('Content type must be a non-empty string')
    })
  })

  describe('fromText', () => {
    it('should create inscription from text with default MIME type', () => {
      const text = 'Hello, BSV!'
      const inscription = Inscription.fromText(text)

      expect(inscription.file.type).toBe('text/plain;charset=utf-8')
      expect(Utils.toUTF8(Array.from(inscription.file.content))).toBe(text)
    })

    it('should create inscription from text with custom MIME type', () => {
      const text = '{"message": "hello"}'
      const inscription = Inscription.fromText(text, 'application/json')

      expect(inscription.file.type).toBe('application/json')
      expect(Utils.toUTF8(Array.from(inscription.file.content))).toBe(text)
    })
  })

  describe('lock', () => {
    it('should generate valid inscription script for text', () => {
      const script = simpleTextInscription.lock()

      // Script should contain the ordinals pattern
      const chunks = script.chunks
      const hasOP0 = chunks.some(chunk => chunk.op === OP.OP_0)
      const hasOPIF = chunks.some(chunk => chunk.op === OP.OP_IF)
      const hasOPENDIF = chunks.some(chunk => chunk.op === OP.OP_ENDIF)

      expect(hasOP0).toBe(true)
      expect(hasOPIF).toBe(true)
      expect(hasOPENDIF).toBe(true)

      // Verify it's recognized as an inscription
      expect(Inscription.isInscription(script)).toBe(true)
    })

    it('should generate script with prefix and suffix', () => {
      const content = new Uint8Array(Utils.toArray('test', 'utf8'))
      const prefix = new Script().writeOpCode(OP.OP_DUP)
      const suffix = new Script().writeOpCode(OP.OP_CHECKSIG)

      const inscription = Inscription.create(content, 'text/plain', {
        scriptPrefix: prefix,
        scriptSuffix: suffix
      })

      const script = inscription.lock()
      const scriptBytes = Utils.toArray(script.toHex(), 'hex')

      // Should start with prefix
      expect(scriptBytes[0]).toBe(OP.OP_DUP)
      // Should end with suffix
      expect(scriptBytes[scriptBytes.length - 1]).toBe(OP.OP_CHECKSIG)
    })
  })

  describe('unlock', () => {
    it('should throw error as unlock is not supported', () => {
      expect(() => {
        simpleTextInscription.unlock()
      }).toThrow('Unlock is not supported for inscription scripts')
    })
  })

  describe('verify', () => {
    it('should return true for valid inscription', () => {
      expect(simpleTextInscription.verify()).toBe(true)
    })

    it('should return false for corrupted inscription', () => {
      // Create inscription and modify the hash
      const content = new Uint8Array(Utils.toArray('test', 'utf8'))
      const file: InscriptionFile = {
        hash: new Uint8Array(32).fill(0x00), // Wrong hash
        size: content.length,
        type: 'text/plain',
        content
      }

      const inscription = new Inscription(file)
      expect(inscription.verify()).toBe(false)
    })
  })

  describe('isInscription', () => {
    it('should detect inscription script', () => {
      const script = simpleTextInscription.lock()
      expect(Inscription.isInscription(script)).toBe(true)
    })

    it('should return false for non-inscription script', () => {
      const regularScript = Script.fromHex(Utils.toHex([OP.OP_DUP, OP.OP_HASH160, OP.OP_CHECKSIG]))
      expect(Inscription.isInscription(regularScript)).toBe(false)
    })

    it('should return false for empty script', () => {
      const emptyScript = Script.fromHex('')
      expect(Inscription.isInscription(emptyScript)).toBe(false)
    })
  })

  describe('decode', () => {
    it('should decode simple text inscription', () => {
      const originalScript = simpleTextInscription.lock()
      const decoded = Inscription.decode(originalScript)

      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.file.type).toBe('text/plain')
        expect(Utils.toUTF8(Array.from(decoded.file.content))).toBe('Hello, BSV!')
        expect(decoded.file.size).toBe(decoded.file.content.length)
      }
    })

    it('should return null for non-inscription script', () => {
      const regularScript = Script.fromHex(Utils.toHex([OP.OP_DUP, OP.OP_HASH160, OP.OP_CHECKSIG]))
      const decoded = Inscription.decode(regularScript)

      expect(decoded).toBeNull()
    })
  })

  describe('content extraction methods', () => {
    describe('getText', () => {
      it('should extract text from text inscription', () => {
        const text = simpleTextInscription.getText()
        expect(text).toBe('Hello, BSV!')
      })

      it('should return null for non-text inscription', () => {
        const text = imageInscription.getText()
        expect(text).toBeNull()
      })
    })

    describe('getJSON', () => {
      it('should parse JSON from JSON inscription', () => {
        const json = jsonInscription.getJSON()
        expect(json).toHaveProperty('message', 'Hello, BSV!')
        expect(json).toHaveProperty('timestamp')
      })

      it('should return null for non-JSON content', () => {
        const json = simpleTextInscription.getJSON()
        expect(json).toBeNull()
      })
    })

    describe('getContent', () => {
      it('should return raw content bytes', () => {
        const content = simpleTextInscription.getContent()
        expect(Array.from(content)).toEqual(Utils.toArray('Hello, BSV!', 'utf8'))
      })
    })

    describe('getBase64', () => {
      it('should return base64 encoded content', () => {
        const base64 = simpleTextInscription.getBase64()
        const expected = Utils.toBase64(Utils.toArray('Hello, BSV!', 'utf8'))
        expect(base64).toBe(expected)
      })
    })

    describe('getHex', () => {
      it('should return hex encoded content', () => {
        const hex = simpleTextInscription.getHex()
        const expected = Utils.toHex(Utils.toArray('Hello, BSV!', 'utf8'))
        expect(hex).toBe(expected)
      })
    })
  })

  describe('round-trip testing', () => {
    it('should preserve data through encode/decode cycle', () => {
      const testCases = [
        { content: 'Simple text', type: 'text/plain' },
        { content: '{"test": "json"}', type: 'application/json' }
      ]

      testCases.forEach(({ content, type }) => {
        const original = Inscription.fromText(content, type)
        const script = original.lock()
        const decoded = Inscription.decode(script)

        expect(decoded).not.toBeNull()
        if (decoded != null) {
          expect(decoded.file.type).toBe(type)
          expect(decoded.getText()).toBe(content)
          expect(decoded.verify()).toBe(true)
        }
      })
    })

    it('should preserve binary data through encode/decode cycle', () => {
      const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD])
      const original = Inscription.create(binaryData, 'application/octet-stream')

      const script = original.lock()
      const decoded = Inscription.decode(script)

      expect(decoded).not.toBeNull()
      if (decoded != null) {
        expect(decoded.file.content).toEqual(binaryData)
        expect(decoded.file.type).toBe('application/octet-stream')
        expect(decoded.verify()).toBe(true)
      }
    })
  })
})
