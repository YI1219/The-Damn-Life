import { execSync } from 'node:child_process'

function check(name: string, cmd: string, expected?: string) {
  try {
    const version = execSync(cmd, { encoding: 'utf-8' }).trim()
    console.log(`  ✅ ${name}: ${version}`)
  } catch {
    console.log(`  ❌ ${name}: not found${expected ? ` (need ${expected})` : ''}`)
  }
}

console.log('\n🔍 Checking environment...\n')
check('Node', 'node -v', '>=22')
check('pnpm', 'pnpm -v', '>=10')
check('Python', 'python3 --version', '>=3.11')
check('Go', 'go version', '>=1.22')
check('Rust', 'rustc --version')
check('Cargo Tauri', 'cargo tauri --version')

console.log('\n📦 Installing dependencies...\n')
execSync('pnpm install', { stdio: 'inherit' })

console.log('\n✅ Bootstrap complete.\n')
