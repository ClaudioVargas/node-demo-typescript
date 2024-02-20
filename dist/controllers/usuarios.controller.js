"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUsuario = exports.putUsuario = exports.postUsuario = exports.getUsuario = exports.getUsuarios = void 0;
const usuario_model_1 = require("../models/usuario.model");
const getUsuarios = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield usuario_model_1.Usuario.sync();
    const usuarios = yield usuario_model_1.Usuario.findAll();
    return res.status(200).json({
        data: usuarios
    });
});
exports.getUsuarios = getUsuarios;
const getUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const usuario = yield usuario_model_1.Usuario.findByPk(id);
    if (!usuario) {
        return res.status(404).json({
            msg: "Usuario con id " + id + " no encontrado"
        });
    }
    return res.json({
        data: usuario,
    });
});
exports.getUsuario = getUsuario;
const postUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = req;
    try {
        yield usuario_model_1.Usuario.sync();
        // const usuario = new Usuario(body) // Usuario no tiene constructor
        const usuarioDb = yield usuario_model_1.Usuario.findOne({ where: { email: body.email } });
        if (!usuarioDb) {
            body.createdAt = new Date();
            body.updatedAt = new Date();
            const response = yield usuario_model_1.Usuario.create(body);
            return res.json({
                msg: response
            });
        }
        else {
            return res.status(409).json({
                msg: 'Email ' + body.email + ' ya existe'
            });
        }
    }
    catch (error) {
        res.status(500).json({
            msg: 'Contecte con el administrador'
        });
    }
    res.json({
        msg: 'postUsuario',
        body
    });
});
exports.postUsuario = postUsuario;
const putUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = req;
    try {
        const usuarioDb = yield usuario_model_1.Usuario.findByPk(body.id);
        console.log("body", body);
        if (usuarioDb) {
            body.updatedAt = new Date();
            usuarioDb.set(body);
            // usuarioDb.update({
            //     updatedAt: new Date()
            // }) para actualizar registros especificos 
            yield usuarioDb.save();
            return res.json({
                src: 'usuario editado correctamente'
            });
        }
        else {
            return res.status(409).json({
                msg: 'Usuario con id ' + body.id + 'no exisete'
            });
        }
    }
    catch (error) {
        res.status(500).json({
            msg: 'Contecte con el administrador',
            error
        });
    }
    res.json({
        msg: 'postUsuario',
        body
    });
});
exports.putUsuario = putUsuario;
const deleteUsuario = (req, res) => {
    const { id } = req.params;
    res.json({
        msg: 'deleteUsuario',
        id
    });
};
exports.deleteUsuario = deleteUsuario;
//# sourceMappingURL=usuarios.controller.js.map