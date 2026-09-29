import { getWorkerCount } from '../src/concurrency'
import os from 'os'

jest.mock('cluster', () => ({
  __esModule: true,
  default: { isPrimary: true, on: jest.fn(), fork: jest.fn(), workers: {} },
}))

jest.mock('os', () => ({
  __esModule: true,
  default: {
    availableParallelism: jest.fn(() => 4),
    cpus: jest.fn(() => [1, 2, 3]),
  },
}))

jest.mock('../src/server', () => ({ default: class {} }))
jest.mock('../src/db/connection', () => ({ default: {} }))

describe('getWorkerCount (concurrency)', () => {
  const ORIGINAL: Record<string, string | undefined> = {}

  beforeAll(() => {
    for (const k of ['NODE_ENV', 'WEB_CONCURRENCY']) {
      ORIGINAL[k] = process.env[k]
      delete process.env[k]
    }
  })
  beforeEach(() => {
    delete process.env.NODE_ENV
    delete process.env.WEB_CONCURRENCY
    ;(os.availableParallelism as jest.Mock).mockReturnValue(4)
    ;(os.cpus as jest.Mock).mockReturnValue([1, 2, 3])
  })
  afterAll(() => {
    for (const k of Object.keys(ORIGINAL)) {
      const v = ORIGINAL[k]
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  })

  test('NODE_ENV=test → siempre 1 worker', () => {
    process.env.NODE_ENV = 'test'
    process.env.WEB_CONCURRENCY = '8'
    expect(getWorkerCount()).toBe(1)
  })

  test('WEB_CONCURRENCY entero ≥ 1 fuerza el número de workers', () => {
    process.env.WEB_CONCURRENCY = '3'
    expect(getWorkerCount()).toBe(3)
  })

  test('WEB_CONCURRENCY no entero se ignora en desarrollo', () => {
    process.env.WEB_CONCURRENCY = 'abc'
    expect(getWorkerCount()).toBe(1)
  })

  test('WEB_CONCURRENCY 0 o negativo se ignora', () => {
    process.env.WEB_CONCURRENCY = '-1'
    expect(getWorkerCount()).toBe(1)
  })

  test('en producción usa un worker por núcleo (os.availableParallelism)', () => {
    process.env.NODE_ENV = 'production'
    expect(getWorkerCount()).toBe(4)
  })

  test('en producción sin availableParallelism usa os.cpus() como fallback', () => {
    process.env.NODE_ENV = 'production'
    ;(os as any).availableParallelism = undefined
    expect(getWorkerCount()).toBe(3)
  })
})