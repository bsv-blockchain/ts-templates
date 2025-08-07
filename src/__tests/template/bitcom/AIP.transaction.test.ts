import AIP from '../../../template/bitcom/AIP.js'
import BitCom from '../../../template/bitcom/BitCom.js'
import { loadTestVectors, getTransactionFromVector, validateTransaction } from '../../utils/testData.js'

describe('AIP Transaction Tests', () => {
  let testVectors: any

  beforeAll(() => {
    testVectors = loadTestVectors('aip_test_vectors.json')
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

        // Test AIP parsing
        let foundAIP = false
        for (const output of tx.outputs) {
          if (output.lockingScript == null) continue

          try {
            // First decode BitCom structure
            const bitcomData = BitCom.decode(output.lockingScript)
            if (bitcomData != null) {
              // Then decode AIP data
              const aipArray = AIP.decode(bitcomData)
              if (aipArray.length > 0) {
                foundAIP = true
                const aipData = aipArray[0] // Take first AIP entry

                // Verify signing address
                if (vector.expected.signing_address != null) {
                  expect(aipData.data.address).toBe(vector.expected.signing_address)
                }

                // Verify algorithm
                if (vector.expected.signing_protocol != null) {
                  expect(aipData.data.algorithm).toBe(vector.expected.signing_protocol)
                }

                // Test that signature exists
                expect(aipData.data.signature).toBeDefined()
                expect(aipData.data.signature.length).toBeGreaterThan(0)

                break
              }
            }
          } catch (error) {
            // Continue to next output if parsing fails
            continue
          }
        }

        if (vector.expected.has_aip === true) {
          expect(foundAIP).toBe(true)
        }
      })
    })
  })

  describe('AIP Protocol Compliance', () => {
    test('AIP identity attestation structure', () => {
      // Test with the known BAP transaction structure
      const txid = '744a55a8637aa191aa058630da51803abbeadc2de3d65b4acace1f5f10789c5b'
      const vector = {
        name: 'bap_identity_test',
        description: 'Test BAP identity attestation',
        txid,
        expected: { tx_id: txid }
      }

      const tx = getTransactionFromVector(vector)
      if (tx == null) {
        console.warn('No transaction data for AIP compliance test')
        return
      }

      // Look for AIP data in the transaction
      let foundAIP = false
      for (const output of tx.outputs) {
        if (output.lockingScript == null) continue

        const bitcomData = BitCom.decode(output.lockingScript)
        if (bitcomData != null) {
          const aipArray = AIP.decode(bitcomData)
          if (aipArray.length > 0) {
            foundAIP = true
            const aipData = aipArray[0]

            // Test AIP structure
            expect(aipData.data.address).toBeDefined()
            expect(aipData.data.algorithm).toBeDefined()
            expect(aipData.data.signature).toBeDefined()

            // Test that address is valid Bitcoin address
            expect(aipData.data.address).toMatch(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/)

            break
          }
        }
      }

      expect(foundAIP).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('handles invalid AIP data gracefully', () => {
      // Test with empty BitCom structure
      const emptyBitCom = { protocols: [], scriptPrefix: [] }
      const result = AIP.decode(emptyBitCom)
      expect(result).toEqual([])
    })

    test('handles non-AIP BitCom data', () => {
      // Test with BitCom structure that has no AIP protocols
      const nonAipBitCom = {
        protocols: [
          { protocol: 'DIFFERENT', script: [1, 2, 3], pos: 0 }
        ],
        scriptPrefix: []
      }
      const result = AIP.decode(nonAipBitCom)
      expect(result).toEqual([])
    })
  })
})
