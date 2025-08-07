import BSocial, {
  BSocialActionType,
  BSocialContext,
  BSocialPost,
  BSocialLike,
  BSocialFollow,
  BSocialMessage
} from '../../../template/bsocial/BSocial'
import { PrivateKey, Script, LockingScript, Utils } from '@bsv/sdk'

describe('BSocial', () => {
  let testPrivateKey: PrivateKey

  beforeEach(() => {
    testPrivateKey = PrivateKey.fromRandom()
  })

  describe('constructor', () => {
    it('should create a BSocial instance', () => {
      const action = {
        app: 'bsocial',
        type: BSocialActionType.POST
      }
      const bsocial = new BSocial(action)
      expect(bsocial).toBeInstanceOf(BSocial)
    })

    it('should create a BSocial instance with content and tags', () => {
      const action = {
        app: 'bsocial',
        type: BSocialActionType.POST
      }
      const content = 'Hello BSV!'
      const tags = ['bsv', 'blockchain']
      const bsocial = new BSocial(action, content, tags, testPrivateKey)
      expect(bsocial).toBeInstanceOf(BSocial)
    })
  })

  describe('lock', () => {
    it('should create a locking script for a simple post', async () => {
      const action = {
        app: 'bsocial',
        type: BSocialActionType.POST
      }
      const content = 'Hello BSV!'
      const bsocial = new BSocial(action, content)

      const lockingScript = await bsocial.lock()
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
      expect(lockingScript.chunks.length).toBeGreaterThan(0)
    })

    it('should create a locking script for a post with tags', async () => {
      const action = {
        app: 'bsocial',
        type: BSocialActionType.POST
      }
      const content = 'Hello BSV!'
      const tags = ['bsv', 'blockchain']
      const bsocial = new BSocial(action, content, tags)

      const lockingScript = await bsocial.lock()
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })

    it('should create a locking script for a post with AIP signature', async () => {
      const action = {
        app: 'bsocial',
        type: BSocialActionType.POST
      }
      const content = 'Hello BSV!'
      const bsocial = new BSocial(action, content, undefined, testPrivateKey)

      const lockingScript = await bsocial.lock()
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })

    it('should create a locking script for a like action', async () => {
      const action = {
        app: 'bsocial',
        type: BSocialActionType.LIKE,
        txid: 'abc123def456'
      }
      const bsocial = new BSocial(action)

      const lockingScript = await bsocial.lock()
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })

    it('should create a locking script for a follow action', async () => {
      const action = {
        app: 'bsocial',
        type: BSocialActionType.FOLLOW,
        bapId: 'test-bap-id'
      }
      const bsocial = new BSocial(action)

      const lockingScript = await bsocial.lock()
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })

    it('should create a locking script with context and subcontext', async () => {
      const action = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        context: BSocialContext.TX,
        contextValue: 'abc123',
        subcontext: BSocialContext.CHANNEL,
        subcontextValue: 'general'
      }
      const content = 'This is a reply'
      const bsocial = new BSocial(action, content)

      const lockingScript = await bsocial.lock()
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })
  })

  describe('unlock', () => {
    it('should throw error as BSocial scripts are not spendable', () => {
      const action = {
        app: 'bsocial',
        type: BSocialActionType.POST
      }
      const bsocial = new BSocial(action)
      expect(() => bsocial.unlock()).toThrow('Unlock is not supported for BSocial scripts')
    })
  })

  describe('createPost', () => {
    it('should create a post locking script', async () => {
      const post: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: 'Hello BSV!'
      }

      const lockingScript = await BSocial.createPost(post)
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })

    it('should create a post with tags', async () => {
      const post: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: 'Hello BSV!'
      }
      const tags = ['bsv', 'blockchain']

      const lockingScript = await BSocial.createPost(post, tags)
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })

    it('should create a post with identity key', async () => {
      const post: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: 'Hello BSV!'
      }

      const lockingScript = await BSocial.createPost(post, [], testPrivateKey)
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })
  })

  describe('createLike', () => {
    it('should create a like locking script', async () => {
      const like: BSocialLike = {
        app: 'bsocial',
        type: BSocialActionType.LIKE,
        txid: 'abc123def456'
      }

      const lockingScript = await BSocial.createLike(like)
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })

    it('should create a like with identity key', async () => {
      const like: BSocialLike = {
        app: 'bsocial',
        type: BSocialActionType.LIKE,
        txid: 'abc123def456'
      }

      const lockingScript = await BSocial.createLike(like, testPrivateKey)
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })
  })

  describe('createFollow', () => {
    it('should create a follow locking script', async () => {
      const follow: BSocialFollow = {
        app: 'bsocial',
        type: BSocialActionType.FOLLOW,
        bapId: 'test-bap-id'
      }

      const lockingScript = await BSocial.createFollow(follow)
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })

    it('should create a follow with identity key', async () => {
      const follow: BSocialFollow = {
        app: 'bsocial',
        type: BSocialActionType.FOLLOW,
        bapId: 'test-bap-id'
      }

      const lockingScript = await BSocial.createFollow(follow, testPrivateKey)
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })
  })

  describe('createMessage', () => {
    it('should create a message locking script', async () => {
      const message: BSocialMessage = {
        app: 'bsocial',
        type: BSocialActionType.MESSAGE,
        content: 'Hello there!'
      }

      const lockingScript = await BSocial.createMessage(message)
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })

    it('should create a message with identity key', async () => {
      const message: BSocialMessage = {
        app: 'bsocial',
        type: BSocialActionType.MESSAGE,
        content: 'Hello there!'
      }

      const lockingScript = await BSocial.createMessage(message, testPrivateKey)
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })
  })

  describe('createReply', () => {
    it('should create a reply locking script', async () => {
      const reply: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: 'This is a reply'
      }
      const replyTxId = 'abc123def456'

      const lockingScript = await BSocial.createReply(reply, replyTxId)
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })

    it('should create a reply with tags and identity key', async () => {
      const reply: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: 'This is a reply'
      }
      const replyTxId = 'abc123def456'
      const tags = ['reply', 'bsv']

      const lockingScript = await BSocial.createReply(reply, replyTxId, tags, testPrivateKey)
      expect(lockingScript).toBeInstanceOf(LockingScript)
      expect(lockingScript.chunks).toBeTruthy()
    })
  })

  describe('decode', () => {
    it('should decode a simple post', async () => {
      const post: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: 'Hello BSV!'
      }

      const lockingScript = await BSocial.createPost(post)
      const decoded = BSocial.decode(lockingScript)

      expect(decoded).toBeTruthy()
      expect(decoded?.action.app).toBe('bsocial')
      expect(decoded?.action.type).toBe(BSocialActionType.POST)
      expect(decoded?.content).toBe('Hello BSV!')
    })

    it('should decode a post with tags', async () => {
      const post: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: 'Hello BSV!'
      }
      const tags = ['bsv', 'blockchain']

      const lockingScript = await BSocial.createPost(post, tags)
      const decoded = BSocial.decode(lockingScript)

      expect(decoded).toBeTruthy()
      expect(decoded?.action.app).toBe('bsocial')
      expect(decoded?.action.type).toBe(BSocialActionType.POST)
      expect(decoded?.content).toBe('Hello BSV!')
      expect(decoded?.tags).toEqual([['tag0', 'bsv'], ['tag1', 'blockchain']])
    })

    it('should decode a like action', async () => {
      const like: BSocialLike = {
        app: 'bsocial',
        type: BSocialActionType.LIKE,
        txid: 'abc123def456'
      }

      const lockingScript = await BSocial.createLike(like)
      const decoded = BSocial.decode(lockingScript)

      expect(decoded).toBeTruthy()
      expect(decoded?.action.app).toBe('bsocial')
      expect(decoded?.action.type).toBe(BSocialActionType.LIKE)
      expect((decoded?.action as BSocialLike).txid).toBe('abc123def456')
    })

    it('should decode a follow action', async () => {
      const follow: BSocialFollow = {
        app: 'bsocial',
        type: BSocialActionType.FOLLOW,
        bapId: 'test-bap-id'
      }

      const lockingScript = await BSocial.createFollow(follow)
      const decoded = BSocial.decode(lockingScript)

      expect(decoded).toBeTruthy()
      expect(decoded?.action.app).toBe('bsocial')
      expect(decoded?.action.type).toBe(BSocialActionType.FOLLOW)
      expect((decoded?.action as BSocialFollow).bapId).toBe('test-bap-id')
    })

    it('should decode a reply with context', async () => {
      const reply: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: 'This is a reply'
      }
      const replyTxId = 'abc123def456'

      const lockingScript = await BSocial.createReply(reply, replyTxId)
      const decoded = BSocial.decode(lockingScript)

      expect(decoded).toBeTruthy()
      expect(decoded?.action.app).toBe('bsocial')
      expect(decoded?.action.type).toBe(BSocialActionType.POST)
      expect(decoded?.action.context).toBe(BSocialContext.TX)
      expect(decoded?.action.contextValue).toBe(replyTxId)
      expect(decoded?.content).toBe('This is a reply')
    })

    it('should return null for invalid script', () => {
      const invalidScript = new Script()
      invalidScript.writeOpCode(0x01)

      const decoded = BSocial.decode(invalidScript)
      expect(decoded).toBeNull()
    })

    it('should return null for non-BSocial script', () => {
      const script = new Script()
      script.writeOpCode(0x6a) // OP_RETURN
      script.writeBin(Utils.toArray('test'))

      const decoded = BSocial.decode(script)
      expect(decoded).toBeNull()
    })
  })

  describe('signAIP', () => {
    it('should sign a message with AIP', async () => {
      const message = 'test message'
      const signature = await BSocial.signAIP(testPrivateKey, message)

      expect(signature).toBeTruthy()
      expect(typeof signature).toBe('string')
      expect(signature.length).toBeGreaterThan(0)
    })

    it('should produce different signatures for different messages', async () => {
      const message1 = 'test message 1'
      const message2 = 'test message 2'

      const signature1 = await BSocial.signAIP(testPrivateKey, message1)
      const signature2 = await BSocial.signAIP(testPrivateKey, message2)

      expect(signature1).not.toBe(signature2)
    })

    it('should produce different signatures for different keys', async () => {
      const message = 'test message'
      const privateKey2 = PrivateKey.fromRandom()

      const signature1 = await BSocial.signAIP(testPrivateKey, message)
      const signature2 = await BSocial.signAIP(privateKey2, message)

      expect(signature1).not.toBe(signature2)
    })
  })

  describe('integration tests', () => {
    it('should round-trip encode/decode correctly', async () => {
      const post: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: 'Hello BSV!'
      }
      const tags = ['bsv', 'blockchain']

      const lockingScript = await BSocial.createPost(post, tags)
      const decoded = BSocial.decode(lockingScript)

      expect(decoded).toBeTruthy()
      expect(decoded?.action.app).toBe(post.app)
      expect(decoded?.action.type).toBe(post.type)
      expect(decoded?.content).toBe(post.content)
      expect(decoded?.tags).toEqual([['tag0', 'bsv'], ['tag1', 'blockchain']])
    })

    it('should handle complex post with all features', async () => {
      const post: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: 'Complex post with all features',
        context: BSocialContext.CHANNEL,
        contextValue: 'general',
        subcontext: BSocialContext.BAP_ID,
        subcontextValue: 'user123'
      }
      const tags = ['feature', 'test', 'bsv']

      const lockingScript = await BSocial.createPost(post, tags, testPrivateKey)
      const decoded = BSocial.decode(lockingScript)

      expect(decoded).toBeTruthy()
      expect(decoded?.action.app).toBe(post.app)
      expect(decoded?.action.type).toBe(post.type)
      expect(decoded?.action.context).toBe(post.context)
      expect(decoded?.action.contextValue).toBe(post.contextValue)
      expect(decoded?.action.subcontext).toBe(post.subcontext)
      expect(decoded?.action.subcontextValue).toBe(post.subcontextValue)
      expect(decoded?.content).toBe(post.content)
      expect(decoded?.tags?.length).toBe(3)
      expect(decoded?.aip).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('should handle empty content', async () => {
      const post: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: ''
      }

      const lockingScript = await BSocial.createPost(post)
      const decoded = BSocial.decode(lockingScript)

      expect(decoded).toBeTruthy()
      expect(decoded?.action.type).toBe(BSocialActionType.POST)
      // B protocol returns null for empty content, so content should be undefined
      expect(decoded?.content).toBeUndefined()
    })

    it('should handle post without content', async () => {
      const action = {
        app: 'bsocial',
        type: BSocialActionType.LIKE,
        txid: 'abc123'
      }

      const lockingScript = await BSocial.createLike(action)
      const decoded = BSocial.decode(lockingScript)

      expect(decoded).toBeTruthy()
      expect(decoded?.action.type).toBe(BSocialActionType.LIKE)
      expect(decoded?.content).toBeUndefined()
    })

    it('should handle large content', async () => {
      const largeContent = 'A'.repeat(10000)
      const post: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: largeContent
      }

      const lockingScript = await BSocial.createPost(post)
      const decoded = BSocial.decode(lockingScript)

      expect(decoded).toBeTruthy()
      expect(decoded?.content).toBe(largeContent)
    })

    it('should handle many tags', async () => {
      const post: BSocialPost = {
        app: 'bsocial',
        type: BSocialActionType.POST,
        content: 'Post with many tags'
      }
      const tags = Array.from({ length: 50 }, (_, i) => `tag${i}`)

      const lockingScript = await BSocial.createPost(post, tags)
      const decoded = BSocial.decode(lockingScript)

      expect(decoded).toBeTruthy()
      expect(decoded?.tags?.length).toBe(50)
    })
  })
})
