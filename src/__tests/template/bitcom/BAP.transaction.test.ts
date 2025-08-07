import BAP from '../../../template/bitcom/BAP.js'
import BitCom from '../../../template/bitcom/BitCom.js'
import { loadTestVectors, getTransactionFromVector, validateTransaction } from '../../utils/testData.js'

describe('BAP Transaction Tests', () => {
  let testVectors: any

  beforeAll(() => {
    testVectors = loadTestVectors('bap_test_vectors.json')
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

        // Test BAP parsing
        let foundBAP = false
        for (const output of tx.outputs) {
          if (output.lockingScript == null) continue

          try {
            // First decode BitCom structure
            const bitcomData = BitCom.decode(output.lockingScript)
            if (bitcomData != null) {
              // Then decode BAP data
              const bapData = BAP.decode(bitcomData)
              if (bapData != null) {
                foundBAP = true

                // Verify attestation type
                if (vector.expected.attestation_type != null) {
                  expect(bapData.type).toBe(vector.expected.attestation_type)
                }

                // Verify signing address
                if (vector.expected.signing_address != null) {
                  expect(bapData.signerAddr).toBe(vector.expected.signing_address)
                }

                // Verify target address
                if (vector.expected.target_address != null) {
                  expect(bapData.address).toBe(vector.expected.target_address)
                }

                // Test that signature exists if expected
                if (vector.expected.has_signature === true) {
                  expect(bapData.signature).toBeDefined()
                  expect(bapData.signature).not.toBe('')
                }

                // Test sequence number
                expect(bapData.sequence).toBeDefined()
                expect(typeof bapData.sequence).toBe('bigint')

                break
              }
            }
          } catch (error) {
            // Continue to next output if parsing fails
            continue
          }
        }

        if (vector.expected.has_bap === true) {
          expect(foundBAP).toBe(true)
        }
      })
    })
  })

  describe('BAP Protocol Compliance', () => {
    test('BAP attestation structure', () => {
      // Test with the known BAP transaction structure
      const txid = '744a55a8637aa191aa058630da51803abbeadc2de3d65b4acace1f5f10789c5b'
      const vector = {
        name: 'bap_attestation_test',
        description: 'Test BAP attestation structure',
        txid,
        expected: { tx_id: txid }
      }

      const tx = getTransactionFromVector(vector)
      if (tx == null) {
        console.warn('No transaction data for BAP compliance test')
        return
      }

      // Look for BAP data in the transaction
      let foundBAP = false
      for (const output of tx.outputs) {
        if (output.lockingScript == null) continue

        const bitcomData = BitCom.decode(output.lockingScript)
        if (bitcomData != null) {
          const bapData = BAP.decode(bitcomData)
          if (bapData != null) {
            foundBAP = true

            // Test BAP structure
            expect(bapData.type).toBeDefined()
            expect(bapData.sequence).toBeDefined()
            expect(bapData.isSignedByID).toBeDefined()

            // Test attestation type is valid
            expect(Object.values(['ID', 'ATTEST', 'REVOKE', 'ALIAS'])).toContain(bapData.type)

            // Test sequence is non-negative
            expect(bapData.sequence).toBeGreaterThanOrEqual(BigInt(0))

            // If there's a signer address, it should be valid
            if (bapData.signerAddr != null) {
              expect(bapData.signerAddr).toMatch(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/)
            }

            // If there's a target address, it should be valid
            if (bapData.address != null) {
              expect(bapData.address).toMatch(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/)
            }

            break
          }
        }
      }

      expect(foundBAP).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('handles invalid BAP data gracefully', () => {
      // Test with empty BitCom structure
      const emptyBitCom = { protocols: [], scriptPrefix: [] }
      const result = BAP.decode(emptyBitCom)
      expect(result).toBeNull()
    })

    test('handles non-BAP BitCom data', () => {
      // Test with BitCom structure that has no BAP protocols
      const nonBapBitCom = {
        protocols: [
          { protocol: 'DIFFERENT', script: [1, 2, 3], pos: 0 }
        ],
        scriptPrefix: []
      }
      const result = BAP.decode(nonBapBitCom)
      expect(result).toBeNull()
    })
  })
})
