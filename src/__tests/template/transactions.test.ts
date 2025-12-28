import { loadTestVectors, getTransactionFromVector } from '../utils/testData.js'
import { Transaction } from '@bsv/sdk'

describe('Transaction Tests', () => {
  test('loads and parses real transaction from file', () => {
    // Test with known real transaction
    const txid = '744a55a8637aa191aa058630da51803abbeadc2de3d65b4acace1f5f10789c5b'
    const vector = {
      name: 'test_transaction',
      description: 'Test transaction',
      txid,
      expected: { tx_id: txid }
    }

    const tx = getTransactionFromVector(vector)

    if (tx != null) {
      expect(tx).toBeInstanceOf(Transaction)
      expect(tx.id('hex')).toBe(txid)
      expect(tx.inputs.length).toBeGreaterThan(0)
      expect(tx.outputs.length).toBeGreaterThan(0)

      // Check for OP_RETURN output (it may not be the first chunk)
      let hasOpReturn = false
      for (let i = 0; i < tx.outputs.length; i++) {
        const output = tx.outputs[i]
        if (output.lockingScript != null && output.lockingScript.chunks.length > 0) {
          // Check all chunks for OP_RETURN
          for (let j = 0; j < output.lockingScript.chunks.length; j++) {
            const chunk = output.lockingScript.chunks[j]
            if (chunk.op === 106) { // OP_RETURN
              hasOpReturn = true
              break
            }
          }
          if (hasOpReturn) break
        }
      }

      expect(hasOpReturn).toBe(true)
    } else {
      // If no transaction data, skip with warning
      console.warn('No transaction data available for test')
    }
  })

  test('loads test vectors from JSON', () => {
    const vectors = loadTestVectors('bitcom_test_vectors.json')

    expect(vectors).toBeDefined()
    expect(vectors.description).toBe('BitCom Protocol Test Vectors')
    expect(vectors.vectors).toBeInstanceOf(Array)
    expect(vectors.vectors.length).toBeGreaterThan(0)

    // Check first vector structure
    const firstVector = vectors.vectors[0]
    expect(firstVector).toHaveProperty('name')
    expect(firstVector).toHaveProperty('description')
    expect(firstVector).toHaveProperty('txid')
    expect(firstVector).toHaveProperty('expected')
  })

  test('processes all real transactions without errors', () => {
    const vectors = loadTestVectors('bitcom_test_vectors.json')

    let processedCount = 0
    let errorCount = 0

    for (const vector of vectors.vectors) {
      try {
        const tx = getTransactionFromVector(vector)
        if (tx != null) {
          expect(tx).toBeInstanceOf(Transaction)
          expect(tx.id('hex')).toBe(vector.txid)
          processedCount++
        } else {
          console.warn(`No transaction data for ${vector.name}`)
        }
      } catch (error) {
        console.error(`Error processing ${vector.name}:`, error)
        errorCount++
      }
    }

    expect(processedCount).toBeGreaterThan(0)
    expect(errorCount).toBe(0)
  })
})
