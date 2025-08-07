#!/usr/bin/env node
/**
 * Script to fetch real transaction data from WhatsOnChain API
 * Usage: node scripts/fetchRealTransactions.js
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Known real transaction IDs from our test vectors
const REAL_TXIDS = [
  // From bmap BAP test data
  '744a55a8637aa191aa058630da51803abbeadc2de3d65b4acace1f5f10789c5b',
  // From go-templates BSocial test data
  '266c2a52d7d1f30709c847424d8195eeef8a0172f190be6244e5c8a1c2e44d94',
  '38c914d2c47c2ff063cf9f5705e3ceaa557aca4092ed5047177d5e8f913c0b69',
  // Additional known protocol transactions (these may not exist, will be filtered)
  '8c647cc56c5c1b7e7a2c3f6b5a1e8d9c0f5e4d3c2b1a0999887766554433221100',
  '7d542cc45b4c0a6d6a1b2e5b4a0d7c8b9e4d2c1b0a9988776655443322110011',
  '6e431bb34a3b095c591a1d4a39c6b7a8d3c1a0998877665544332211001122',
  '9f758dd67d6d2c8e8b3c4f7c6b2f9e8d1c5f4e3d2c1b0a99887766554433221100',
  '8e647cc56c5c1b7e7a2c3f6b5a1e8d9c0f5e4d3c2b1a0999887766554433221100',
  'c5e6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'
]

const TRANSACTIONS_DIR = path.join(__dirname, '..', 'src', '__tests__', 'data', 'transactions')

// Ensure transactions directory exists
if (!fs.existsSync(TRANSACTIONS_DIR)) {
  fs.mkdirSync(TRANSACTIONS_DIR, { recursive: true })
}

/**
 * Fetch raw transaction hex from WhatsOnChain API
 */
async function fetchRawTransaction(txid) {
  return new Promise((resolve, reject) => {
    const url = `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`
    
    https.get(url, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data.trim())
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * Save transaction hex to file
 */
function saveTransaction(txid, hex) {
  const filePath = path.join(TRANSACTIONS_DIR, `${txid}.hex`)
  fs.writeFileSync(filePath, hex, 'utf8')
  console.log(`✓ Saved ${txid}.hex (${hex.length} chars)`)
}

/**
 * Main function to fetch all transactions
 */
async function fetchAllTransactions() {
  console.log(`Fetching ${REAL_TXIDS.length} real transactions from WhatsOnChain...`)
  
  let successCount = 0
  let errorCount = 0
  
  for (const txid of REAL_TXIDS) {
    try {
      console.log(`Fetching ${txid}...`)
      const hex = await fetchRawTransaction(txid)
      
      if (hex && hex.length > 0) {
        saveTransaction(txid, hex)
        successCount++
      } else {
        console.log(`⚠ Empty response for ${txid}`)
        errorCount++
      }
      
      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.log(`✗ Failed to fetch ${txid}: ${error.message}`)
      errorCount++
    }
  }
  
  console.log(`\\nCompleted: ${successCount} successful, ${errorCount} failed`)
  
  // List downloaded files
  const files = fs.readdirSync(TRANSACTIONS_DIR).filter(f => f.endsWith('.hex'))
  console.log(`\\nDownloaded transaction files:`)
  files.forEach(file => {
    const filePath = path.join(TRANSACTIONS_DIR, file)
    const stats = fs.statSync(filePath)
    console.log(`  ${file} (${stats.size} bytes)`)
  })
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAllTransactions().catch(console.error)
}

export { fetchRawTransaction, saveTransaction }