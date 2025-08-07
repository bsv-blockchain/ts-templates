# PRD: TS-Templates

## 1. Product overview
### 1.1 Document title and version
- PRD: TS-Templates
- Version: 0.0.1

### 1.2 Product summary
TS-Templates is a comprehensive TypeScript library for BSV blockchain script templates that provides reusable script implementations for common blockchain operations. The project expands from the current 3 templates (OpReturn, Metanet, MultiPushDrop) to match the comprehensive Go template library with 15+ templates across protocols like BitCom, BSocial, BSV20/21, inscriptions, lockups, and more.

This library consolidates existing TypeScript implementations from disparate projects (js-1sat-ord, yours wallet, bmapjs, etc.) into a canonical library following BSV TS-SDK templating patterns. The goal is to achieve feature parity with the Go SDK while maintaining the design principles of the BSV TypeScript SDK templating system.

The project focuses on creating a unified place for all script templates scattered across the BSV ecosystem, eliminating duplication and fragmentation while providing developers with easy-to-use, well-documented building blocks for blockchain application development.

## 2. Goals
### 2.1 Business goals
- Provides unified place for all script templates scattered across ecosystem, eliminating duplication and fragmentation

### 2.2 User goals
- Easy to use out-of-the-box templates with sensible defaults but support all configuration needed for variants on par with Go SDK
- Supports both reading/parsing scripts and creating scripts
- Huge time saver for developers as scripts are like lego bricks - having them neatly organized into templates makes application layer development much easier
- Lower barrier to entry with AI-friendly concise, potent, easy to consume docs and llms.txt versions
- Well thought out tests and examples for AI comprehension

### 2.3 Non-goals
- No storage, no frontend components, not an application
- Doesn't need to be completely exhaustive but should cover majority of common script templates in use by ecosystem

## 3. User personas
### 3.1 Key user types
- BSV application developers
- Wallet developers
- Protocol implementers
- Library maintainers
- AI systems

### 3.2 Basic persona details
- **BSV Application Developers**: Building applications on BSV blockchain who need script templates as building blocks
- **Wallet Developers**: Creating wallet software that needs to handle various BSV protocols
- **Protocol Implementers**: Developers working on BSV protocol implementations
- **Library Maintainers**: Teams maintaining projects like bmapjs that will use these templates
- **AI Systems**: LLMs and AI coding assistants that need clear, well-documented templates with examples

### 3.3 Role-based access
- **Open Source Users**: Wide open and open source library with no authentication or access restrictions

## 4. Functional requirements
- **Template Implementation System** (Priority: High)
  - Create Claude Code slash command `/create-template` for systematic template generation with checklist-driven process including lint, build, export updates, validation, performance testing, automatic file structure creation, boilerplate setup
- **Core Script Templates** (Priority: High)
  - Implement ScriptTemplate interface with lock() and unlock() methods for each protocol
- **Protocol Coverage** (Priority: High)
  - BSocial (High Priority), Ordinals (High Priority), BitCom (B, MAP, AIP, SIGMA), BSV20/21, inscriptions, lockups, OPNS, P2PKH, cosigning
- **Parsing & Creation** (Priority: High)
  - Support both reading existing scripts and creating new ones with sensible defaults
- **Test Coverage** (Priority: High)
  - Port comprehensive tests from go-sdk, validate transaction structures, prove unlock functionality
- **AI-Friendly Documentation** (Priority: High)
  - Concise docs with llms.txt versions, well-thought-out examples for AI comprehension
- **Type Safety** (Priority: Medium)
  - Full TypeScript support with exported definitions
- **Template Consolidation** (Priority: Medium)
  - Gather existing implementations from js-1sat-ord, yours wallet, bmapjs, etc.

## 5. User experience
### 5.1. Entry points & first-time user flow
- Experienced developers/agents install and use on command when building specific features
- New users discover through @bsv/sdk documentation (will be updated to link to this repository)
- Blog articles with examples
- BSV Association educational material in the future

### 5.2. Core experience
- **Import template**: Developers import the needed template from the library
  - Clear package structure makes finding the right template intuitive
- **Configure parameters**: Set up template with required data and options
  - Sensible defaults reduce configuration burden while supporting all variants
- **Call lock() method**: Generate locking script for transactions
  - Returns properly formatted script ready for blockchain use
- **Use in transaction**: Integrate generated script into BSV transactions
  - Seamless integration with @bsv/sdk transaction building

### 5.3. Advanced features & edge cases
- Handling multiple outputs is important, especially multiple OP_RETURN outputs in single transaction
- Must use Utils from '@bsv/sdk' (toHex, toArray, toBase64) instead of Buffer for data conversion
- js-1sat-ord repo provides good code samples for transaction creation and template usage

### 5.4. UI/UX highlights
- Great TypeScript types with advanced features like dynamic return types based on input types to avoid ambiguous returns
- Keep things in binary and only 'inflate' as needed since transactions can be large
- Strong IntelliSense support

## 6. Narrative
Alex is a BSV application developer who wants to implement BitCom MAP protocol transactions because they need to store structured metadata on-chain. They find TS-Templates through the @bsv/sdk documentation and discover they can simply import the MAP template, configure it with their data, and generate the locking script without having to understand the underlying BitCom protocol mechanics. Within minutes, they have working transactions that follow the protocol specification exactly.

## 7. Success metrics
### 7.1. User-centric metrics
- Developer adoption rate
- Time to implement common protocols (vs building from scratch)
- Community contributions of new templates
- GitHub star count

### 7.2. Business metrics
- Reduction in duplicated code across BSV projects
- Number of projects migrating from scattered implementations
- Other projects using this as npm dependency
- Maintenance burden reduction
- AI coherence
- Simplicity

### 7.3. Technical metrics
- Test coverage 80%+
- Performance benchmarks vs Go SDK (bonus not requirement - Go is the fast one)
- Documentation completeness

## 8. Technical considerations
### 8.1. Integration points
- Entire BSV ecosystem will gradually migrate from one-off templates to reference this library
- bmapjs rewrite, wallet projects, other BSV tools will integrate later

### 8.2. Data storage & privacy
- Public blockchain data, no privacy concerns for scripts
- Keys are sensitive - never transmitted or recorded without encryption except client-side session storage
- Keys never transmitted EVER - use env vars or pass from memory
- Not directly relevant to this repo since keys get passed into functions

### 8.3. Scalability & performance
- No crazy performance requirements - working result will be fine, consider performance optimization once all functionality is complete

### 8.4. Potential challenges
- Not particularly hard - series of magic incantations that need to be right, then it becomes EASY
- Main challenge is getting the incantations correct

## 9. Milestones & sequencing
### 9.1. Project estimate
- Small: 1 week (starting July 15th)

### 9.2. Team size & composition
- Small Team: 2 total people
  - 1 megadev Satchmo and Claude (coding assistant)

### 9.3. Suggested phases
- **Phase 1**: Create slash command system + high-priority templates (BSocial, Ordinals, P2PKH) (3 days)
  - Key deliverables: `/create-template` command, systematic checklist, BSocial/Ordinals/P2PKH templates with tests
- **Phase 2**: BitCom protocols (B, MAP, AIP, SIGMA) (2 days)
  - Key deliverables: Core BitCom protocol templates, comprehensive test coverage
- **Phase 3**: Token standards (BSV20/21, inscriptions) (1 day)
  - Key deliverables: Token protocol templates, validation tests
- **Phase 4**: Advanced features (lockups, OPNS, cosigning) (1 day)
  - Key deliverables: Advanced protocol templates, final documentation updates

## 10. User stories
### 10.1. Create slash command for template generation
- **ID**: US-001
- **Description**: As a developer, I want to use a `/create-template` slash command so that I can systematically generate new script templates following a consistent checklist
- **Acceptance criteria**:
  - Command accepts template name and description as arguments
  - Automatically creates file structure (`src/TemplateName.ts`, `src/__tests/TemplateName.test.ts`)
  - Sets up basic boilerplate following existing patterns
  - Provides systematic checklist for implementation steps
  - Updates `mod.ts` exports automatically

### 10.2. Implement ScriptTemplate interface
- **ID**: US-002
- **Description**: As a template implementer, I want each template to implement the ScriptTemplate interface so that all templates have consistent lock() and unlock() methods
- **Acceptance criteria**:
  - Template implements ScriptTemplate interface from @bsv/sdk
  - Provides lock() method for creating locking scripts
  - Provides unlock() method or throws appropriate error if not applicable
  - Includes static utility methods as needed (e.g., decode())
  - Follows existing patterns in current templates

### 10.3. Import and use BSocial template
- **ID**: US-003
- **Description**: As a BSV application developer, I want to import and use the BSocial template so that I can create social media transactions following BitcoinSchema.org standards
- **Acceptance criteria**:
  - Can import BSocial template from library
  - Supports post, like, follow, reply, and other social actions
  - Provides sensible defaults while supporting all configuration options
  - Returns properly formatted scripts ready for blockchain use
  - Includes comprehensive test coverage

### 10.4. Import and use Ordinals template
- **ID**: US-004
- **Description**: As a wallet developer, I want to import and use Ordinals templates so that I can handle ordinal-aware transactions
- **Acceptance criteria**:
  - Can import Ordinals-related templates (ordlock, ordp2pkh)
  - Supports ordinal locking and unlocking functionality
  - Handles ordinal-aware P2PKH transactions
  - Maintains ordinal integrity during transactions
  - Includes validation tests with real blockchain data

### 10.5. Handle multiple outputs in transactions
- **ID**: US-005
- **Description**: As a protocol implementer, I want to handle multiple outputs including multiple OP_RETURN outputs in a single transaction so that I can create complex protocol transactions
- **Acceptance criteria**:
  - Templates support multiple output scenarios
  - Can create multiple OP_RETURN outputs in single transaction
  - Properly handles output ordering and validation
  - Maintains transaction structure integrity
  - Includes test cases for multi-output scenarios

### 10.6. Parse existing scripts with templates
- **ID**: US-006
- **Description**: As a developer, I want to parse existing blockchain scripts using templates so that I can understand and work with existing protocol transactions
- **Acceptance criteria**:
  - Templates provide parsing/decode functionality
  - Can identify script type and extract relevant data
  - Handles edge cases and malformed scripts gracefully
  - Returns structured data objects from scripts
  - Includes validation for parsed data

### 10.7. Get TypeScript IntelliSense support
- **ID**: US-007
- **Description**: As a developer, I want excellent TypeScript IntelliSense support so that I can discover template methods and properties easily
- **Acceptance criteria**:
  - Full TypeScript type definitions exported
  - Dynamic return types based on input types
  - Clear JSDoc documentation for all public methods
  - Avoids ambiguous return types
  - Provides helpful code completion suggestions

### 10.8. Port tests from Go Templates
- **ID**: US-008
- **Description**: As a template implementer, I want to port comprehensive tests from the Go Templates repository so that I can ensure compatibility and correctness
- **Acceptance criteria**:
  - All relevant Go Templates tests ported to TypeScript/Jest
  - Test vectors from Go Templates testdata directories included
  - Tests cover edge cases and error conditions
  - Validation of transaction structures
  - Proof that unlock functionality works correctly

### 10.9. Use @bsv/sdk Utils for data conversion
- **ID**: US-009
- **Description**: As a developer, I want templates to use @bsv/sdk Utils instead of Buffer so that data conversion is handled consistently
- **Acceptance criteria**:
  - All templates use @bsv/sdk Utils (toHex, toArray, toBase64)
  - No direct Buffer usage in template code
  - Consistent data conversion across all templates
  - Proper handling of binary data
  - Maintains performance with large transactions

### 10.10. Discover templates through documentation
- **ID**: US-010
- **Description**: As a new user, I want to discover templates through clear documentation so that I can understand what templates are available and how to use them
- **Acceptance criteria**:
  - Comprehensive README with template descriptions
  - AI-friendly documentation with llms.txt versions
  - Clear usage examples for each template
  - Links from @bsv/sdk documentation
  - Examples suitable for AI comprehension

### 10.11. Implement BitCom protocol templates
- **ID**: US-011
- **Description**: As a protocol implementer, I want BitCom protocol templates (B, MAP, AIP, SIGMA) so that I can create BitCom-compliant transactions
- **Acceptance criteria**:
  - B protocol template for data storage
  - MAP protocol template for metadata
  - AIP protocol template for author identity
  - SIGMA protocol template for signatures
  - All templates follow BitCom specifications exactly

### 10.12. Implement token standard templates
- **ID**: US-012
- **Description**: As a token developer, I want BSV20 and BSV21 token templates so that I can create token transactions following these standards
- **Acceptance criteria**:
  - BSV20 template for fungible tokens
  - BSV21 template with sub-templates for LTM, POW20, cosigning
  - Support for token creation, transfer, and burning
  - Proper validation of token operations
  - Comprehensive test coverage for token scenarios

### 10.13. Consolidate existing implementations
- **ID**: US-013
- **Description**: As a library maintainer, I want to consolidate existing template implementations from various projects so that there's a single canonical source
- **Acceptance criteria**:
  - Gather implementations from js-1sat-ord, yours wallet, bmapjs
  - Adapt existing code to follow ScriptTemplate interface
  - Maintain functionality while improving consistency
  - Provide migration path for existing users
  - Document changes and improvements made

### 10.14. Validate transaction structures
- **ID**: US-014
- **Description**: As a template implementer, I want to validate that generated transactions have the correct structure so that I can ensure blockchain compatibility
- **Acceptance criteria**:
  - Each template includes transaction validation tests
  - Proof that unlock functionality works correctly
  - Comparison with expected transaction structures
  - Validation against blockchain consensus rules
  - Error handling for invalid configurations

### 10.15. Create AI-friendly documentation
- **ID**: US-015
- **Description**: As an AI system, I want concise, well-structured documentation with examples so that I can understand and use templates effectively
- **Acceptance criteria**:
  - Clear, concise documentation for each template
  - llms.txt versions available for AI consumption
  - Well-thought-out examples for AI comprehension
  - Consistent documentation structure across templates
  - Examples that demonstrate both basic and advanced usage