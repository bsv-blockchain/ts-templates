import B, { B_PREFIX, MediaType, Encoding } from '../../../template/bitcom/B'
import { Script, LockingScript, Utils } from '@bsv/sdk'

describe('B Protocol', () => {
  describe('constants', () => {
    it('should have correct B prefix', () => {
      expect(B_PREFIX).toBe('19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut')
    })
  })

  describe('lock', () => {
    it('should create B protocol with text data', () => {
      const text = 'Hello, B Protocol!'
      const script = B.lock(text, MediaType.TextPlain, Encoding.UTF8)

      expect(script).toBeInstanceOf(LockingScript)
      expect(script.chunks).toBeTruthy()
      expect(script.chunks.length).toBeGreaterThan(0)
    })

    it('should create B protocol with binary data', () => {
      const binaryData = [0x89, 0x50, 0x4E, 0x47] // PNG header
      const script = B.lock(binaryData, MediaType.ImagePNG, Encoding.Binary)

      expect(script).toBeInstanceOf(LockingScript)
      expect(script.chunks).toBeTruthy()
    })

    it('should create B protocol with filename', () => {
      const text = 'Hello, World!'
      const filename = 'hello.txt'
      const script = B.lock(text, MediaType.TextPlain, Encoding.UTF8, filename)

      expect(script).toBeInstanceOf(LockingScript)
      expect(script.chunks).toBeTruthy()
    })

    it('should handle Uint8Array input', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const script = B.lock(data, MediaType.TextPlain, Encoding.UTF8)

      expect(script).toBeInstanceOf(LockingScript)
      expect(script.chunks).toBeTruthy()
    })

    it('should handle hex encoded string', () => {
      const hexData = '48656c6c6f' // "Hello" in hex
      const script = B.lock(hexData, MediaType.TextPlain, Encoding.Hex)

      expect(script).toBeInstanceOf(LockingScript)
      expect(script.chunks).toBeTruthy()
    })

    it('should handle base64 encoded string', () => {
      const base64Data = 'SGVsbG8=' // "Hello" in base64
      const script = B.lock(base64Data, MediaType.TextPlain, Encoding.Base64)

      expect(script).toBeInstanceOf(LockingScript)
      expect(script.chunks).toBeTruthy()
    })
  })

  describe('decode', () => {
    it('should decode B protocol with text data', () => {
      const text = 'Hello, B Protocol!'
      const script = B.lock(text, MediaType.TextPlain, Encoding.UTF8)

      const decoded = B.decode(script)

      expect(decoded).toBeTruthy()
      if (decoded != null) {
        expect(decoded.mediaType).toBe(MediaType.TextPlain)
        expect(decoded.encoding).toBe(Encoding.UTF8)
        expect(Utils.toUTF8(decoded.data)).toBe(text)
        expect(decoded.filename).toBeUndefined()
      }
    })

    it('should decode B protocol with filename', () => {
      const text = 'Hello, World!'
      const filename = 'hello.txt'
      const script = B.lock(text, MediaType.TextPlain, Encoding.UTF8, filename)

      const decoded = B.decode(script)

      expect(decoded).toBeTruthy()
      if (decoded != null) {
        expect(decoded.mediaType).toBe(MediaType.TextPlain)
        expect(decoded.encoding).toBe(Encoding.UTF8)
        expect(Utils.toUTF8(decoded.data)).toBe(text)
        expect(decoded.filename).toBe(filename)
      }
    })

    it('should decode B protocol with binary data', () => {
      const binaryData = [0x89, 0x50, 0x4E, 0x47] // PNG header
      const script = B.lock(binaryData, MediaType.ImagePNG, Encoding.Binary)

      const decoded = B.decode(script)

      expect(decoded).toBeTruthy()
      if (decoded != null) {
        expect(decoded.mediaType).toBe(MediaType.ImagePNG)
        expect(decoded.encoding).toBe(Encoding.Binary)
        expect(decoded.data).toEqual(binaryData)
      }
    })

    it('should handle array input', () => {
      const text = 'Hello, B Protocol!'
      const script = B.lock(text, MediaType.TextPlain, Encoding.UTF8)
      const scriptBytes = script.toBinary()

      const decoded = B.decode(scriptBytes)

      expect(decoded).toBeTruthy()
      if (decoded != null) {
        expect(decoded.mediaType).toBe(MediaType.TextPlain)
        expect(decoded.encoding).toBe(Encoding.UTF8)
        expect(Utils.toUTF8(decoded.data)).toBe(text)
      }
    })

    it('should return null for invalid script', () => {
      const invalidScript = new Script()
      invalidScript.writeOpCode(0x01)

      const decoded = B.decode(invalidScript)

      expect(decoded).toBeNull()
    })

    it('should return null for script without B protocol', () => {
      const script = new Script()
      script.writeOpCode(0x6a) // OP_RETURN
      script.writeBin(Utils.toArray('test'))

      const decoded = B.decode(script)

      expect(decoded).toBeNull()
    })
  })

  describe('helper methods', () => {
    describe('text', () => {
      it('should create text content with default media type', () => {
        const text = 'Hello, World!'
        const script = B.text(text)

        const decoded = B.decode(script)

        expect(decoded).toBeTruthy()
        if (decoded != null) {
          expect(decoded.mediaType).toBe(MediaType.TextPlain)
          expect(decoded.encoding).toBe(Encoding.UTF8)
          expect(Utils.toUTF8(decoded.data)).toBe(text)
        }
      })

      it('should create text content with custom media type', () => {
        const text = '<h1>Hello</h1>'
        const script = B.text(text, MediaType.TextHTML)

        const decoded = B.decode(script)

        expect(decoded).toBeTruthy()
        if (decoded != null) {
          expect(decoded.mediaType).toBe(MediaType.TextHTML)
          expect(decoded.encoding).toBe(Encoding.UTF8)
          expect(Utils.toUTF8(decoded.data)).toBe(text)
        }
      })

      it('should create text content with filename', () => {
        const text = 'Hello, World!'
        const filename = 'hello.txt'
        const script = B.text(text, MediaType.TextPlain, filename)

        const decoded = B.decode(script)

        expect(decoded).toBeTruthy()
        if (decoded != null) {
          expect(decoded.mediaType).toBe(MediaType.TextPlain)
          expect(decoded.encoding).toBe(Encoding.UTF8)
          expect(Utils.toUTF8(decoded.data)).toBe(text)
          expect(decoded.filename).toBe(filename)
        }
      })
    })

    describe('binary', () => {
      it('should create binary content from number array', () => {
        const binaryData = [0x89, 0x50, 0x4E, 0x47]
        const script = B.binary(binaryData, MediaType.ImagePNG)

        const decoded = B.decode(script)

        expect(decoded).toBeTruthy()
        if (decoded != null) {
          expect(decoded.mediaType).toBe(MediaType.ImagePNG)
          expect(decoded.encoding).toBe(Encoding.Binary)
          expect(decoded.data).toEqual(binaryData)
        }
      })

      it('should create binary content from Uint8Array', () => {
        const binaryData = new Uint8Array([0x89, 0x50, 0x4E, 0x47])
        const script = B.binary(binaryData, MediaType.ImagePNG)

        const decoded = B.decode(script)

        expect(decoded).toBeTruthy()
        if (decoded != null) {
          expect(decoded.mediaType).toBe(MediaType.ImagePNG)
          expect(decoded.encoding).toBe(Encoding.Binary)
          expect(decoded.data).toEqual(Array.from(binaryData))
        }
      })

      it('should create binary content with filename', () => {
        const binaryData = [0x89, 0x50, 0x4E, 0x47]
        const filename = 'image.png'
        const script = B.binary(binaryData, MediaType.ImagePNG, filename)

        const decoded = B.decode(script)

        expect(decoded).toBeTruthy()
        if (decoded != null) {
          expect(decoded.mediaType).toBe(MediaType.ImagePNG)
          expect(decoded.encoding).toBe(Encoding.Binary)
          expect(decoded.data).toEqual(binaryData)
          expect(decoded.filename).toBe(filename)
        }
      })
    })

    describe('base64', () => {
      it('should create base64 encoded content', () => {
        const originalText = 'Hello, World!'
        const base64Data = 'SGVsbG8sIFdvcmxkIQ==' // "Hello, World!" in base64
        const script = B.base64(base64Data, MediaType.TextPlain)

        const decoded = B.decode(script)

        expect(decoded).toBeTruthy()
        if (decoded != null) {
          expect(decoded.mediaType).toBe(MediaType.TextPlain)
          expect(decoded.encoding).toBe(Encoding.Base64)
          expect(Utils.toUTF8(decoded.data)).toBe(originalText)
        }
      })

      it('should create base64 encoded content with filename', () => {
        const base64Data = 'SGVsbG8sIFdvcmxkIQ=='
        const filename = 'hello.txt'
        const script = B.base64(base64Data, MediaType.TextPlain, filename)

        const decoded = B.decode(script)

        expect(decoded).toBeTruthy()
        if (decoded != null) {
          expect(decoded.mediaType).toBe(MediaType.TextPlain)
          expect(decoded.encoding).toBe(Encoding.Base64)
          expect(decoded.filename).toBe(filename)
        }
      })
    })

    describe('hex', () => {
      it('should create hex encoded content', () => {
        const originalText = 'Hello'
        const hexData = '48656c6c6f' // "Hello" in hex
        const script = B.hex(hexData, MediaType.TextPlain)

        const decoded = B.decode(script)

        expect(decoded).toBeTruthy()
        if (decoded != null) {
          expect(decoded.mediaType).toBe(MediaType.TextPlain)
          expect(decoded.encoding).toBe(Encoding.Hex)
          expect(Utils.toUTF8(decoded.data)).toBe(originalText)
        }
      })

      it('should create hex encoded content with filename', () => {
        const hexData = '48656c6c6f'
        const filename = 'hello.txt'
        const script = B.hex(hexData, MediaType.TextPlain, filename)

        const decoded = B.decode(script)

        expect(decoded).toBeTruthy()
        if (decoded != null) {
          expect(decoded.mediaType).toBe(MediaType.TextPlain)
          expect(decoded.encoding).toBe(Encoding.Hex)
          expect(decoded.filename).toBe(filename)
        }
      })
    })
  })

  describe('integration tests', () => {
    it('should round-trip encode/decode correctly', () => {
      const originalText = 'Hello, B Protocol!'
      const mediaType = MediaType.TextPlain
      const encoding = Encoding.UTF8
      const filename = 'hello.txt'

      const script = B.lock(originalText, mediaType, encoding, filename)
      const decoded = B.decode(script)

      expect(decoded).toBeTruthy()
      if (decoded != null) {
        expect(decoded.mediaType).toBe(mediaType)
        expect(decoded.encoding).toBe(encoding)
        expect(Utils.toUTF8(decoded.data)).toBe(originalText)
        expect(decoded.filename).toBe(filename)
      }
    })

    it('should handle large data', () => {
      const largeText = 'A'.repeat(10000)
      const script = B.lock(largeText, MediaType.TextPlain, Encoding.UTF8)

      const decoded = B.decode(script)

      expect(decoded).toBeTruthy()
      if (decoded != null) {
        expect(Utils.toUTF8(decoded.data)).toBe(largeText)
      }
    })

    it('should handle empty data', () => {
      const emptyData = ''
      const script = B.lock(emptyData, MediaType.TextPlain, Encoding.UTF8)

      const decoded = B.decode(script)

      // Note: Empty data currently returns null in decode - this is expected behavior
      expect(decoded).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle null input in decode', () => {
      const result = B.decode(null as any)
      expect(result).toBeNull()
    })

    it('should handle undefined input in decode', () => {
      const result = B.decode(undefined as any)
      expect(result).toBeNull()
    })

    it('should handle malformed script', () => {
      const script = new Script()
      script.writeOpCode(0x6a) // OP_RETURN
      script.writeBin(Utils.toArray(B_PREFIX, 'utf8'))
      // Missing required fields

      const result = B.decode(script)
      expect(result).toBeNull()
    })
  })
})
