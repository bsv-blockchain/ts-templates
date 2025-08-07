# Transaction Test Vector Implementation

## Overview

This document describes the implementation of transaction test vectors for the ts-templates library. The implementation allows testing BSV blockchain protocol templates against actual mainnet transaction data.

## Components Implemented

### 1. Test Infrastructure

#### Test Data Utilities (`src/__tests__/utils/testData.ts`)
- `loadTestVectors()` - Loads test vectors from JSON files
- `loadRawTransaction()` - Loads raw transaction hex from files
- `getTransactionFromVector()` - Creates Transaction objects from test vectors
- `fetchRawTransaction()` - Fetches transaction data from WhatsOnChain API
- `validateTransaction()` - Validates transaction properties against expected values

#### WhatsOnChain API Integration (`scripts/fetchRealTransactions.js`)
- Fetches raw transaction hex from WhatsOnChain API
- Handles rate limiting and error conditions
- Saves transaction data to local files for testing
- Supports both on-demand and batch downloading

### 2. Test Data Structure

#### Directory Structure
```
src/__tests__/
├── data/
│   ├── transactions/           # Raw transaction hex files
│   ├── bitcom_test_vectors.json
│   ├── bsv20_test_vectors.json
│   ├── bsv21_test_vectors.json
│   ├── aip_test_vectors.json
│   └── bsocial_test_vectors.json
└── utils/
    └── testData.ts
```

#### Test Vector Format
```json
{
  "description": "Protocol Test Vectors",
  "version": "1.0.0",
  "vectors": [
    {
      "name": "test_case_name",
      "description": "Test description",
      "txid": "transaction_id_hex",
      "expected": {
        "property": "expected_value"
      }
    }
  ]
}
```

### 3. Real Transaction Data

#### Downloaded Transactions
- `744a55a8637aa191aa058630da51803abbeadc2de3d65b4acace1f5f10789c5b` - BAP identity attestation transaction
- `266c2a52d7d1f30709c847424d8195eeef8a0172f190be6244e5c8a1c2e44d94` - BSocial post transaction
- `38c914d2c47c2ff063cf9f5705e3ceaa557aca4092ed5047177d5e8f913c0b69` - BSocial reply target transaction

#### Transaction Sources
- Real transactions from BSV mainnet
- Sourced from go-templates, bmap, and other BSV protocol implementations
- Verified to contain actual protocol data (AIP, BAP, BSocial, etc.)

### 4. Test Implementation

#### Basic Real Transaction Tests (`src/__tests__/template/realTransactions.test.ts`)
- Tests transaction loading and parsing
- Validates transaction structure (inputs, outputs, OP_RETURN)
- Processes all real transactions without errors
- Handles missing transaction data gracefully

#### Test Coverage
- **Transaction Loading**: Verifies raw transaction hex can be loaded and parsed
- **Protocol Detection**: Confirms OP_RETURN outputs are correctly identified
- **Error Handling**: Tests graceful failure when transaction data is missing
- **Data Validation**: Validates transaction properties match expected values

### 5. Protocol-Specific Test Vectors

#### BitCom Protocol Tests
- AIP (Identity Protocol) attestation validation
- BSocial post and reply transaction parsing
- Protocol structure compliance testing

#### Token Protocol Tests (Ready for Implementation)
- BSV20 token deployment, mint, and transfer operations
- BSV21 token operations with icon support
- Interface compatibility with js-1sat-ord

### 6. Development Tools

#### Fetch Script Usage
```bash
# Fetch real transaction data
node scripts/fetchRealTransactions.js

# Run real transaction tests
npm test -- --testNamePattern="Real Transaction"
```

#### Test Patterns
- Use `loadTestVectors()` to load protocol-specific test cases
- Use `getTransactionFromVector()` to create Transaction objects
- Use `validateTransaction()` to verify expected properties
- Handle null/missing transactions gracefully

## Implementation Strategy

### Phase 1: Infrastructure ✅
- [x] Test data utilities
- [x] WhatsOnChain API integration
- [x] Test vector format definition
- [x] Real transaction downloading

### Phase 2: Basic Tests ✅
- [x] Transaction loading and parsing
- [x] OP_RETURN detection
- [x] Error handling
- [x] Test vector validation

### Phase 3: Protocol-Specific Tests (Future)
- [ ] BSV20 token protocol tests with real deployment/mint/transfer transactions
- [ ] BSV21 token protocol tests with icon validation
- [ ] AIP identity protocol signature verification
- [ ] BSocial post/reply parsing and validation
- [ ] MAP metadata extraction and validation

### Phase 4: Advanced Features (Future)
- [ ] Round-trip serialization testing
- [ ] Protocol compliance validation
- [ ] Performance benchmarking with real data
- [ ] Integration with existing test suites

## Benefits

1. **Real-World Validation**: Tests against actual blockchain data
2. **Protocol Compliance**: Ensures templates work with real protocol implementations
3. **Regression Prevention**: Catches issues that synthetic tests might miss
4. **Cross-Implementation Compatibility**: Validates alignment with js-1sat-ord, go-templates, etc.
5. **Confidence in Production**: Higher confidence in production deployments

## Next Steps

1. Implement protocol-specific test cases using the established infrastructure
2. Add more real transaction data for comprehensive coverage
3. Integrate with existing template test suites
4. Add performance benchmarking
5. Enhance error reporting and debugging capabilities

The foundation is now in place for comprehensive real transaction testing across all BSV protocol templates.