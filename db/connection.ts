import { Sequelize } from '@sequelize/core';
import { Usuario } from '../models/usuario.model';
import { Post } from '../models/post.model';
import { Tema } from '../models/tema.model';

const db = new Sequelize('node_demo', 'root', '1234', {
    host:'localhost',
    dialect: 'mysql',
    models: [Usuario, Post, Tema]
    // logging: false
})

export default db