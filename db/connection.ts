import { Sequelize } from '@sequelize/core';
import { Usuario } from '../models/usuario.model';

const db = new Sequelize('node_demo', 'root', '1234', {
    host:'localhost',
    dialect: 'mysql',
    models: [Usuario]
    // logging: false
})

export default db