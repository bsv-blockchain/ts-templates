# CHANGELOG for `@bsv/templates`

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Table of Contents

- [Unreleased](#unreleased)
- [1.0.0 - YYYY-MM-DD](#100---yyyy-mm-dd)

## [Unreleased]

---

## [1.1.1] - 2025-12-28

### Added
- MultiSigPubkeyHash template from upstream (multi-signature support)
- Cosign template for multi-signature co-signing workflows
- Lock template for time-locked outputs
- OrdLock template for ordinal-locked transactions
- MAP template export

### Changed
- Synced with upstream bitcoin-sv/ts-templates (v1.3.0)
- Updated to named exports for OpReturn and MultiPushDrop (breaking change from upstream)
- Updated @bsv/sdk to 1.9.29
- Added @bsv/wallet-toolbox dev dependency

## [1.1.0] - Previous

### Added
- (Include new features or significant user-visible enhancements here.)

### Changed
- (Detail modifications that are non-breaking but relevant to the end-users.)

### Deprecated
- (List features that are in the process of being phased out or replaced.)

### Removed
- (Indicate features or capabilities that were taken out of the project.)

### Fixed
- (Document bugs that were fixed since the last release.)

### Security
- (Notify of any improvements related to security vulnerabilities or potential risks.)

---

## [1.0.0] - YYYY-MM-DD

### Added
- Initial release of the BSV Script Templates Repository.

---

### Template for New Releases:

Replace `X.X.X` with the new version number and `YYYY-MM-DD` with the release date:

```
## [X.X.X] - YYYY-MM-DD

### Added
- 

### Changed
- 

### Deprecated
- 

### Removed
- 

### Fixed
- 

### Security
- 
```

Use this template as the starting point for each new version. Always update the "Unreleased" section with changes as they're implemented, and then move them under the new version header when that version is released.