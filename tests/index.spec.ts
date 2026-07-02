import Server from '../server'; // Ajusta la ruta según tu estructura
import express from 'express';
import passport from 'passport';
import db from '../db/connection';

// 1. Mockear dependencias externas para aislar la clase Server
jest.mock('express', () => {
  const mApp = {
    use: jest.fn(),
    get: jest.fn(),
    listen: jest.fn((port, cb) => cb && cb()),
  };
  const mExpress = jest.fn(() => mApp);
  (mExpress as any).json = jest.fn(() => 'json-middleware');
  (mExpress as any).static = jest.fn(() => 'static-middleware');
  return mExpress;
});

jest.mock('passport', () => ({
  use: jest.fn(),
  initialize: jest.fn(() => 'passport-init'),
  session: jest.fn(() => 'passport-session'),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  authenticate: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

jest.mock('../db/connection', () => ({
  authenticate: jest.fn(() => Promise.resolve()),
  models: {
    Tema: { sync: jest.fn(() => Promise.resolve()) },
    Usuario: { sync: jest.fn(() => Promise.resolve()) },
    Post: { sync: jest.fn(() => Promise.resolve()) },
  },
}));

jest.mock('cors', () => jest.fn(() => 'cors-middleware'));
jest.mock('express-session', () => jest.fn(() => 'session-middleware'));

// Mocks para las rutas internas
jest.mock('../routes/usuario.router', () => 'usuario-router');
jest.mock('../routes/post.router', () => 'post-router');
jest.mock('../routes/tema.router', () => 'tema-router');

describe('Clase Server', () => {
  let server: Server;
  let mockApp: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApp = express();
    server = new Server();
  });

  // Test de inicialización
  test('debería inicializar Express y configurar las variables de entorno', () => {
    expect(express).toHaveBeenCalled();
    expect(db.authenticate).toHaveBeenCalled();
  });

  // Test de Middlewares
  test('debería registrar los middlewares obligatorios', () => {
    expect(mockApp.use).toHaveBeenCalledWith('json-middleware');
    expect(mockApp.use).toHaveBeenCalledWith('static-middleware');
    expect(mockApp.use).toHaveBeenCalledWith('cors-middleware');
    expect(mockApp.use).toHaveBeenCalledWith('passport-init');
  });

  // Test de Rutas
  test('debería registrar las rutas de la API y OAuth', () => {
    expect(mockApp.use).toHaveBeenCalledWith('/api/usuarios', 'usuario-router');
    expect(mockApp.use).toHaveBeenCalledWith('/api/post', 'post-router');
    expect(mockApp.use).toHaveBeenCalledWith('/api/tema', 'tema-router');
    expect(mockApp.get).toHaveBeenCalledWith('/main', expect.any(Function));
    expect(mockApp.get).toHaveBeenCalledWith('/auth/google', expect.any(Function));
  });

  // Test del método listen y sincronización de modelos
  test('debería iniciar el servidor y sincronizar los modelos de la base de datos', () => {
    server.listen();
    expect(mockApp.listen).toHaveBeenCalled();
    expect(db.models.Tema.sync).toHaveBeenCalledWith({ alter: false });
    expect(db.models.Usuario.sync).toHaveBeenCalledWith({ alter: false });
    expect(db.models.Post.sync).toHaveBeenCalledWith({ alter: false });
  });

  // Test del Middleware personalizado isLoggerIn
  describe('Middleware isLoggerIn', () => {
    let mockRequest: Partial<any>;
    let mockResponse: Partial<any>;
    let nextFunction: any;

    beforeEach(() => {
      mockRequest = {};
      mockResponse = { sendStatus: jest.fn() };
      nextFunction = jest.fn();
    });

    test('debería llamar a next() si el usuario está autenticado', () => {
      mockRequest.user = { id: 1, name: 'Test User' };
      server.isLoggerIn(mockRequest as any, mockResponse as any, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    test('debería responder con 401 si el usuario no está autenticado', () => {
      server.isLoggerIn(mockRequest as any, mockResponse as any, nextFunction);
      expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
