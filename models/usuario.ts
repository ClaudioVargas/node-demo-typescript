import { DataTypes, Model } from "sequelize";

import db from '../db/connection'

const Usuario = db.define('Usuario', {
    
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING
    },
    estado: {
        type: DataTypes.BOOLEAN
    },
    updatedAt: {
        type: DataTypes.DATE
    },
})

export default Usuario