/**
 * @fileoverview Utility functions for loading and parsing real transaction test data
 * This file contains utilities, not tests, so it should be excluded from Jest
 */
import { Transaction } from '@bsv/sdk'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Test vector structure for real transaction data
 */
export interface TestVector {
  name: string
  description: string
  txid: string
  expected: Record<string, any>
  rawTransaction?: string
}

/**
 * Collection of test vectors for a specific protocol
 */
export interface TestVectors {
  description: string
  version: string
  vectors: TestVector[]
}

/**
 * Loads test vectors from a JSON file
 */
export function loadTestVectors (filePath: string): TestVectors {
  const fullPath = join(__dirname, '..', 'data', filePath)
  if (!existsSync(fullPath)) {
    throw new Error(`Test vectors file not found: ${fullPath}`)
  }

  const data = readFileSync(fullPath, 'utf8')
  return JSON.parse(data)
}

/**
 * Loads a raw transaction hex from file based on txid
 */
export function loadRawTransaction (txid: string): string | null {
  const filePath = join(__dirname, '..', 'data', 'transactions', `${txid}.hex`)

  if (!existsSync(filePath)) {
    console.warn(`Transaction file not found: ${filePath}`)
    return null
  }

  const rawTx = readFileSync(filePath, 'utf8').trim()
  if (rawTx === '') {
    console.warn(`Empty transaction file: ${filePath}`)
    return null
  }

  return rawTx
}

/**
 * Creates a Transaction object from a test vector
 */
export function getTransactionFromVector (vector: TestVector): Transaction | null {
  // First try to use raw transaction from vector
  if (vector.rawTransaction != null && vector.rawTransaction !== '') {
    try {
      return Transaction.fromHex(vector.rawTransaction)
    } catch (error) {
      console.error(`Failed to parse raw transaction from vector '${vector.name}':`, error)
      return null
    }
  }

  // Fall back to loading from file
  const rawTx = loadRawTransaction(vector.txid)
  if (rawTx === null) {
    return null
  }

  try {
    return Transaction.fromHex(rawTx)
  } catch (error) {
    console.error(`Failed to parse transaction ${vector.txid}:`, error)
    return null
  }
}

/**
 * Fetches raw transaction hex from WhatsOnChain API
 */
export async function fetchRawTransaction (txid: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`)
    if (!response.ok) {
      console.error(`WhatsOnChain API error for ${txid}: ${response.status}`)
      return null
    }
    return await response.text()
  } catch (error) {
    console.error(`Failed to fetch transaction ${txid}:`, error)
    return null
  }
}

/**
 * Validates that a transaction matches expected properties
 */
export function validateTransaction (tx: Transaction, expected: Record<string, any>): void {
  if (expected.tx_id != null && tx.id('hex') !== expected.tx_id) {
    throw new Error(`Transaction ID mismatch: expected ${String(expected.tx_id)}, got ${tx.id('hex')}`)
  }

  if (expected.input_count != null && tx.inputs.length !== expected.input_count) {
    throw new Error(`Input count mismatch: expected ${String(expected.input_count)}, got ${tx.inputs.length}`)
  }

  if (expected.output_count != null && tx.outputs.length !== expected.output_count) {
    throw new Error(`Output count mismatch: expected ${String(expected.output_count)}, got ${tx.outputs.length}`)
  }
}
