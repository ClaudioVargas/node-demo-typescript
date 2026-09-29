import { findPosts, findPost, createPost, updatePost, findPostsByUsuario } from '../../src/repository/post.repository'
import { Post } from '../../src/models/post.model'

jest.mock('../../src/models/post.model', () => ({
  Post: Object.assign(class {}, {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    sync: jest.fn(async () => 0),
  }) as any,
}))

jest.mock('../../src/models/tema.model', () => ({ Tema: 'TEMA' }))

jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

describe('post.repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('findPosts devuelve la lista completa', async () => {
    const lista = [{ id: 1, title: 'Hola' }]
    ;(Post.findAll as jest.Mock).mockResolvedValue(lista)

    expect(await findPosts()).toEqual(lista)
  })

  test('findPost devuelve el post encontrado', async () => {
    const post = { id: 1, title: 'Hola' }
    ;(Post.findByPk as jest.Mock).mockResolvedValue(post)

    expect(await findPost('1')).toEqual(post)
  })

  test('findPost devuelve null si no existe', async () => {
    ;(Post.findByPk as jest.Mock).mockResolvedValue(null)

    expect(await findPost('999')).toBeNull()
  })

  test('createPost crea el post con timestamps', async () => {
    ;(Post.create as jest.Mock).mockResolvedValue({ id: 4, title: 'Nuevo' })

    const creado = await createPost({ title: 'Nuevo', body: 'texto', usuarioId: 1 })

    expect(creado).toEqual({ id: 4, title: 'Nuevo' })
    const arg = (Post.create as jest.Mock).mock.calls[0][0]
    expect(arg.createdAt).toBeInstanceOf(Date)
    expect(arg.updatedAt).toBeInstanceOf(Date)
  })

  test('updatePost devuelve false si el post no existe', async () => {
    ;(Post.findByPk as jest.Mock).mockResolvedValue(null)

    expect(await updatePost({ id: 9, title: 'X' })).toBe(false)
  })

  test('updatePost aplica set() y save()', async () => {
    const set = jest.fn()
    const save = jest.fn(async () => 0)
    ;(Post.findByPk as jest.Mock).mockResolvedValue({ set, save })

    expect(await updatePost({ id: 1, title: 'Nuevo' })).toBe(true)
    expect(set.mock.calls[0][0].title).toBe('Nuevo')
    expect(save).toHaveBeenCalled()
  })

  test('findPostsByUsuario filtra por usuario e incluye los temas', async () => {
    const posts = [{ id: 1, title: 'A' }]
    ;(Post.findAll as jest.Mock).mockResolvedValue(posts)

    expect(await findPostsByUsuario('7')).toEqual(posts)
    expect(Post.findAll).toHaveBeenCalledWith({
      where: { usuarioId: '7' },
      include: [{ model: 'TEMA', through: { attributes: [] } }],
    })
  })
})