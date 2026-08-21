import { Sequelize } from '@sequelize/core';
import { Usuario } from '../models/usuario.model';
import { Post } from '../models/post.model';
import { Tema } from '../models/tema.model';
import { UsuarioTema } from '../models/usuarioTemas.model';
import { Role } from '../models/role.model';

const db = new Sequelize('prueba_db', 'root', '1234', {
    host:'localhost',
    dialect: 'mysql',
    models: [Usuario, Post, Tema, UsuarioTema, Role]
    // logging: false
})

async function inicializarBaseDatos() {
  try {
    // 1. Sincronizar los modelos con la base de datos
    await db.sync({ alter: true });
    console.log('--- Base de datos sincronizada ---');

    // 2. Crear los Roles por defecto si no existen
    // findOrCreate devuelve un arreglo: [instancia, creada_ahora_si_o_no]
    const [adminRol, adminCreado] = await Role.findOrCreate({
      where: { nombre: 'ADMIN' },
      defaults: {
        nombre: 'ADMIN',
        descripcion: 'Administrador total del sistema'
      }
    });

    const [userRol, userCreado] = await Role.findOrCreate({
      where: { nombre: 'USER' },
      defaults: {
        nombre: 'USER',
        descripcion: 'Usuario estándar de la aplicación'
      }
    });

    if (adminCreado) console.log('Rol ADMIN creado por primera vez.');
    if (userCreado) console.log('Rol USER creado por primera vez.');

    // 3. Crear un Usuario Administrador inicial si no existe ninguno
    const [adminUser, userAdminCreado] = await Usuario.findOrCreate({
      where: { email: 'admin@correo.com' },
      defaults: {
        name: 'Administrador Inicial',
        email: 'claudio@gmail.com',
        password: '6f0a4d34a7a67ea901216358af570110$d88d2c39674fc83ff90cc3f03d591aa2f164d99aeb00e0d9af7bec87c531a79ff40750b1d535ceb4ca545290cb3bd5fcc8d5d028813b4ab1d73cb8287e6aa963', // Recuerda encriptar esto en producción
        isActive: true,
        roleId: adminRol.id // Le asignamos el ID del rol obtenido o creado arriba
      }
    });

    console.log('--- Inicialización en tiempo de ejecución completada con éxito ---');

  } catch (error) {
    console.error('Error durante la inicialización de la base de datos:', error);
  }
}

// inicializarBaseDatos();

export default db