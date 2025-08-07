import MAP from '../../../template/bitcom/MAP.js'
import { loadTestVectors, getTransactionFromVector, validateTransaction } from '../../utils/testData.js'

describe('MAP Protocol Transaction Tests', () => {
  let testVectors: any

  beforeAll(() => {
    testVectors = loadTestVectors('map_test_vectors.json')
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

        // Test MAP protocol parsing
        let foundMAP = false
        for (const output of tx.outputs) {
          if (output.lockingScript == null) continue

          try {
            const mapData = MAP.decode(output.lockingScript)
            if (mapData != null) {
              foundMAP = true

              // Verify command
              if (vector.expected.command != null) {
                expect(mapData.cmd).toBe(vector.expected.command)
              }

              // Verify metadata exists
              if (vector.expected.has_metadata === true) {
                expect(mapData.data).toBeDefined()
                expect(typeof mapData.data).toBe('object')
                expect(Object.keys(mapData.data).length).toBeGreaterThan(0)
              }

              // Test basic structure
              expect(mapData.cmd).toBeDefined()
              expect(mapData.data).toBeDefined()
              expect(typeof mapData.data).toBe('object')

              break
            }
          } catch (error) {
            // Continue to next output if parsing fails
            continue
          }
        }

        if (vector.expected.has_map === true) {
          expect(foundMAP).toBe(true)
        }
      })
    })
  })

  describe('MAP Protocol Compliance', () => {
    test('MAP metadata structure', () => {
      // Test with known MAP protocol transaction
      const txid = '266c2a52d7d1f30709c847424d8195eeef8a0172f190be6244e5c8a1c2e44d94'
      const vector = {
        name: 'map_protocol_test',
        description: 'Test MAP protocol structure',
        txid,
        expected: { tx_id: txid }
      }

      const tx = getTransactionFromVector(vector)
      if (tx == null) {
        console.warn('No transaction data for MAP protocol compliance test')
        return
      }

      // Look for MAP protocol data in the transaction
      let foundMAP = false
      for (const output of tx.outputs) {
        if (output.lockingScript == null) continue

        const mapData = MAP.decode(output.lockingScript)
        if (mapData != null) {
          foundMAP = true

          // Test MAP protocol structure
          expect(mapData.cmd).toBeDefined()
          expect(mapData.data).toBeDefined()

          // Test that command is valid
          expect(Object.values(['SET', 'DEL', 'ADD', 'SELECT'])).toContain(mapData.cmd)

          // Test that data is an object
          expect(typeof mapData.data).toBe('object')
          expect(mapData.data).not.toBeNull()

          // Test that data keys and values are strings
          Object.entries(mapData.data).forEach(([key, value]) => {
            expect(typeof key).toBe('string')
            expect(typeof value).toBe('string')
          })

          break
        }
      }

      expect(foundMAP).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('handles invalid MAP protocol data gracefully', () => {
      // Test with empty script
      const emptyScript = { chunks: [] }
      const result = MAP.decode(emptyScript as any)
      expect(result).toBeNull()
    })

    test('handles non-MAP protocol OP_RETURN data', () => {
      // Test with non-MAP protocol OP_RETURN
      const nonMapScript = {
        chunks: [
          { op: 106 }, // OP_RETURN
          { data: new TextEncoder().encode('HELLO WORLD') }
        ]
      }
      const result = MAP.decode(nonMapScript as any)
      expect(result).toBeNull()
    })
  })
})
