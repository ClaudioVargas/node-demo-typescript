import {
  getPosts,
  getPost,
  postPost,
  putPost,
  deletePost,
  getPostsByUsuario,
} from '../../src/controllers/post.controller'
import {
  findPosts,
  findPost,
  createPost,
  updatePost,
  findPostsByUsuario,
} from '../../src/repository/post.repository'

jest.mock('../../src/repository/post.repository', () => ({
  findPosts: jest.fn(),
  findPost: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  findPostsByUsuario: jest.fn(),
}))

describe('post.controller', () => {
  function makeRes(): any {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() }
  }
  function makeReq(overrides: any = {}): any {
    return Object.assign({ body: {}, params: {}, headers: {} }, overrides)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getPosts devuelve 200 con la lista', async () => {
    const lista = [{ id: 1, title: 'Hola' }]
    ;(findPosts as jest.Mock).mockResolvedValue(lista)
    const res = makeRes()

    await getPosts({} as any, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(lista)
  })

  test('getPost devuelve 200 con el post', async () => {
    const post = { id: 1, title: 'Hola' }
    ;(findPost as jest.Mock).mockResolvedValue(post)
    const res = makeRes()

    await getPost(makeReq({ params: { id: '1' } }), res)

    expect(res.json).toHaveBeenCalledWith(post)
  })

  test('getPost devuelve 404 si no existe', async () => {
    ;(findPost as jest.Mock).mockResolvedValue(null)
    const res = makeRes()

    await getPost(makeReq({ params: { id: '999' } }), res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ msg: 'Post con id 999 no encontrado' })
  })

  test('postPost devuelve 201 con el post creado', async () => {
    const post = { id: 1, title: 'Nuevo' }
    ;(createPost as jest.Mock).mockResolvedValue(post)
    const res = makeRes()

    await postPost(makeReq({ body: { title: 'Nuevo' } }), res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ msg: post })
  })

  test('postPost devuelve 500 si el repositorio lanza', async () => {
    ;(createPost as jest.Mock).mockRejectedValue(new Error('db down'))
    const res = makeRes()

    await postPost(makeReq({ body: { title: 'Nuevo' } }), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  test('putPost devuelve 200 si se actualiza', async () => {
    ;(updatePost as jest.Mock).mockResolvedValue(true)
    const res = makeRes()

    await putPost(makeReq({ body: { id: 1, title: 'Editado' } }), res)

    expect(res.json).toHaveBeenCalledWith({ src: 'post editado correctamente' })
  })

  test('putPost devuelve 409 si no existe', async () => {
    ;(updatePost as jest.Mock).mockResolvedValue(false)
    const res = makeRes()

    await putPost(makeReq({ body: { id: 1, title: 'Editado' } }), res)

    expect(res.status).toHaveBeenCalledWith(409)
  })

  test('deletePost responde con el id del post (placeholder)', async () => {
    const res = makeRes()

    await deletePost(makeReq({ params: { id: '7' } }), res)

    expect(res.json).toHaveBeenCalledWith({ msg: 'deletePost', id: '7' })
  })

  test('getPostsByUsuario devuelve 200 con los posts', async () => {
    const posts = [{ id: 1, title: 'A' }]
    ;(findPostsByUsuario as jest.Mock).mockResolvedValue(posts)
    const res = makeRes()

    await getPostsByUsuario(makeReq({ params: { id: '3' } }), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(posts)
  })

  test('getPostsByUsuario devuelve 404 si el usuario no tiene posts', async () => {
    ;(findPostsByUsuario as jest.Mock).mockResolvedValue([])
    const res = makeRes()

    await getPostsByUsuario(makeReq({ params: { id: '3' } }), res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})