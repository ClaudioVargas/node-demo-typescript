"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@sequelize/core");
const usuario_model_1 = require("../models/usuario.model");
const db = new core_1.Sequelize('node_demo', 'root', '1234', {
    host: 'localhost',
    dialect: 'mysql',
    models: [usuario_model_1.Usuario]
    // logging: false
});
exports.default = db;
//# sourceMappingURL=connection.js.map