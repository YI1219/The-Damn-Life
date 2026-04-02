import { rmSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')

const patterns = [
  'dist',
  'build',
  'coverage',
  '.turbo',
  'node_modules',
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'target',
  '*.tsbuildinfo',
]

console.log('\n🧹 Cleaning build artifacts...\n')

// Use find to locate and remove directories/files matching patterns
for (const pattern of patterns) {
  try {
    const cmd = pattern.includes('*')
      ? `find . -name '${pattern}' -not -path './.git/*' -delete 2>/dev/null`
      : `find . -type d -name '${pattern}' -not -path './.git/*' -exec rm -rf {} + 2>/dev/null`
    execSync(cmd, { cwd: root, stdio: 'ignore' })
  } catch {
    // ignore errors from find
  }
}

console.log('✅ Clean complete.\n')
