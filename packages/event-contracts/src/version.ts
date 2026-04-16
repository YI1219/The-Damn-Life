/**
 * Semver of this contract bundle. Bump per docs/protocols/versioning.md.
 * Wire messages SHOULD include the same major as {@link CONTRACT_VERSION}.
 */
export const CONTRACT_VERSION = '0.1.0' as const

/** Currently published bundle version (single literal until multiple versions are supported). */
export type ContractVersion = typeof CONTRACT_VERSION
