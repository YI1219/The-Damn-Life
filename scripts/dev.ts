import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const rawArgs = process.argv.slice(2)
const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs

const projects: Record<string, { cwd: string; cmd: string; args: string[] }> = {
  'app-shell': { cwd: 'apps/app-shell', cmd: 'pnpm', args: ['dev'] },
  'web-console': { cwd: 'apps/web-console', cmd: 'pnpm', args: ['dev'] },
  'admin-console': { cwd: 'apps/admin-console', cmd: 'pnpm', args: ['dev'] },
  cli: { cwd: 'apps/cli', cmd: 'pnpm', args: ['dev'] },
  'runtime-py': { cwd: 'services/runtime-py', cmd: 'python3', args: ['src/main.py'] },
}

function printUsage(): void {
  process.stdout.write('Usage: pnpm dev [project]\n\n')
  process.stdout.write('Options:\n')
  process.stdout.write('  project                  Start only one project\n')
  process.stdout.write('\nAvailable projects:\n')
  for (const name of Object.keys(projects)) {
    process.stdout.write(`  - ${name}\n`)
  }
}

function start(command: string, commandArgs: string[], cwd = process.cwd()): void {
  const child = spawn(command, commandArgs, {
    cwd,
    stdio: 'inherit',
    detached: true,
  })

  const cleanup = () => {
    try {
      process.kill(-child.pid!, 'SIGTERM')
    } catch {
      // process group already exited
    }
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('exit', cleanup)

  child.on('exit', (code: number | null) => {
    process.removeListener('SIGINT', cleanup)
    process.removeListener('SIGTERM', cleanup)
    process.removeListener('exit', cleanup)
    process.exit(code ?? 0)
  })
}

if (args.length === 0) {
  process.stdout.write('\nStarting all dev processes...\n\n')
  start('pnpm', ['exec', 'turbo', 'run', 'dev', '--parallel'])
} else if (args.includes('-h') || args.includes('--help')) {
  printUsage()
  process.exit(0)
} else {
  let target: string | undefined
  if (args.length === 1 && !args[0]?.startsWith('-')) {
    target = args[0]
  }

  if (!target) {
    printUsage()
    process.exit(1)
  }

  const projectName = target
  const project = projects[projectName]
  if (!project) {
    console.error(`Unknown project: ${projectName}`)
    printUsage()
    process.exit(1)
  }

  const cwd = resolve(process.cwd(), project.cwd)
  if (!existsSync(cwd)) {
    console.error(`Directory not found: ${project.cwd}`)
    process.exit(1)
  }

  process.stdout.write(`\nStarting ${projectName} in ${project.cwd}...\n\n`)

  start(project.cmd, project.args, cwd)
}
