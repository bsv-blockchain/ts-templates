import B from '../../../template/bitcom/B.js'
import { loadTestVectors, getTransactionFromVector, validateTransaction } from '../../utils/testData.js'

describe('B Protocol Transaction Tests', () => {
  let testVectors: any

  beforeAll(() => {
    testVectors = loadTestVectors('b_protocol_test_vectors.json')
  })

  describe('Transaction Parsing', () => {
    testVectors?.vectors?.forEach((vector: any) => {
      test(`${String(vector.name)}: ${String(vector.description)}`, () => {
        const tx = getTransactionFromVector(vector)
        if (tx == null) {
          console.warn(`Skipping test ${String(vector.name)} - no transaction data available`)
          return
        }

        // Validate basic transaction properties
        validateTransaction(tx, vector.expected)

        // Test B protocol parsing
        let foundBProtocol = false
        for (const output of tx.outputs) {
          if (output.lockingScript == null) continue

          try {
            const bData = B.decode(output.lockingScript)
            if (bData != null) {
              foundBProtocol = true

              // Verify media type
              if (vector.expected.media_type != null) {
                expect(bData.mediaType).toBe(vector.expected.media_type)
              }

              // Verify encoding
              if (vector.expected.encoding != null) {
                expect(bData.encoding).toBe(vector.expected.encoding)
              }

              // Verify data exists
              if (vector.expected.has_data === true) {
                expect(bData.data).toBeDefined()
                expect(Array.isArray(bData.data)).toBe(true)
                expect(bData.data.length).toBeGreaterThan(0)
              }

              // Test basic structure
              expect(bData.mediaType).toBeDefined()
              expect(bData.encoding).toBeDefined()
              expect(bData.data).toBeDefined()

              break
            }
          } catch (error) {
            // Continue to next output if parsing fails
            continue
          }
        }

        if (vector.expected.has_b_protocol === true) {
          expect(foundBProtocol).toBe(true)
        }
      })
    })
  })

  describe('B Protocol Compliance', () => {
    test('B protocol data structure', () => {
      // Test with known B protocol transaction
      const txid = '266c2a52d7d1f30709c847424d8195eeef8a0172f190be6244e5c8a1c2e44d94'
      const vector = {
        name: 'b_protocol_test',
        description: 'Test B protocol structure',
        txid,
        expected: { tx_id: txid }
      }

      const tx = getTransactionFromVector(vector)
      if (tx == null) {
        console.warn('No transaction data for B protocol compliance test')
        return
      }

      // Look for B protocol data in the transaction
      let foundBProtocol = false
      for (const output of tx.outputs) {
        if (output.lockingScript == null) continue

        const bData = B.decode(output.lockingScript)
        if (bData != null) {
          foundBProtocol = true

          // Test B protocol structure
          expect(bData.mediaType).toBeDefined()
          expect(bData.encoding).toBeDefined()
          expect(bData.data).toBeDefined()

          // Test that data is an array
          expect(Array.isArray(bData.data)).toBe(true)

          // Test that media type and encoding are strings
          expect(typeof bData.mediaType).toBe('string')
          expect(typeof bData.encoding).toBe('string')

          // Test that data array contains numbers
          if (bData.data.length > 0) {
            expect(typeof bData.data[0]).toBe('number')
          }

          break
        }
      }

      expect(foundBProtocol).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('handles invalid B protocol data gracefully', () => {
      // Test with empty script
      const emptyScript = { chunks: [] }
      const result = B.decode(emptyScript as any)
      expect(result).toBeNull()
    })

    test('handles non-B protocol OP_RETURN data', () => {
      // Test with non-B protocol OP_RETURN
      const nonBScript = {
        chunks: [
          { op: 106 }, // OP_RETURN
          { data: new TextEncoder().encode('HELLO WORLD') }
        ]
      }
      const result = B.decode(nonBScript as any)
      expect(result).toBeNull()
    })
  })
})
