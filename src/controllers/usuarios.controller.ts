import { Request, Response } from "express"

import { Usuario } from "../models/usuario.model"
import { UsuarioTema } from "../models/usuarioTemas.model"
import { and } from "@sequelize/core"
import { Tema } from "../models/tema.model"
import bcrypt from "bcrypt";
import { UpdateUsuarioRequest } from "../interfaces/UpdateUsuarioRequest"
// import { UpdateUsuarioRequest } from "../interfaces/UpdateUsuarioRequest"



export const getUsuarios = async (req: Request, res: Response) => {

    // await Usuario.sync()
    const usuarios = await Usuario.findAll()

    return res.status(200).json({
        data: usuarios
    })
}

export const getUsuario = async (req: Request, res: Response) => {

    const { id } = req.params

    const usuario = await Usuario.findByPk(id, {
        attributes: { exclude: ['password'] }
    })

    if (!usuario) {
        return res.status(404).json({
            msg: "Usuario con id " + id + " no encontrado"
        })
    }
    return res.json({
        data: usuario,
    })

}

export const postUsuario = async (req: Request, res: Response) => {
    const { body } = req;

    try {
        await Usuario.sync({ alter: true });

        // Verificar si el email ya existe
        const usuarioDb = await Usuario.findOne({ where: { email: body.email } });
        if (usuarioDb) {
            return res.status(409).json({
                msg: `Email ${body.email} ya existe`,
            });
        }

        // Encriptar el password antes de guardar
        const saltRounds = 16;
        const hashedPassword = await bcrypt.hash(body.password, saltRounds);

        // Crear usuario con password encriptado
        const response = await Usuario.create({
            ...body,
            password: hashedPassword,
            roleId: 2,
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return res.status(201).json({
            msg: "Usuario creado correctamente",
            usuario: {
                id: response.id,
                name: response.name,
                email: response.email,
                isActive: response.isActive,
                // no devolver el password en la respuesta
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            msg: "Conecte con el administrador",
        });
    }
};

export const postLikeTema = async (req: Request, res: Response) => {
    const { body } = req

    try {

        await UsuarioTema.sync({ alter: true })
        const usuarioTema = new UsuarioTema(body)
        console.log("*******************+++")
        const usuario = await Tema.findOne({ where: { id: usuarioTema.usuarioId } })
        if (!usuario) {
            return res.status(409).json({
                msg: "usuario con id " + usuarioTema.usuarioId + " no existe"
            })
        }
        const tema = await Tema.findOne({ where: { id: usuarioTema.temaId } })
        if (!tema) {
            return res.status(409).json({
                msg: "tema con id " + usuarioTema.temaId + " no existe"
            })
        }
        const usuarioTemaDb = await UsuarioTema.findOne({ where: { usuarioId: usuarioTema.usuarioId, temaId: usuarioTema.temaId } })
        if (!usuarioTemaDb) {
            body.createdAt = new Date()
            body.updatedAt = new Date()
            const response = await UsuarioTema.create(body);
            return res.status(201).json({
                msg: response
            })
        } else {
            return res.status(409).json({
                msg: 'usuarioTema con id: ' + usuarioTema.temaId + ' ya existe'
            })
        }

    } catch (error) {
        res.status(500).json({
            msg: 'Contecte con el administrador'
        })
    }
    res.json({
        msg: 'postUsuario',
        body
    })
}

export const putUsuario = async (
    req: Request<{}, {}, UpdateUsuarioRequest>,
    res: Response
): Promise<Response | void> => {
    const { body } = req
    try {
        const usuarioDb = await Usuario.findByPk(body.id)
        if (!usuarioDb) {
            return res.status(409).json({
                msg: `Usuario con id ${body.id} no existe`
            });
        }
        // 4. Actualización segura usando directamente el método update del modelo
        await usuarioDb.update(body, {
            fields:['name', 'email']
        });

        return res.json({
            src: 'usuario editado correctamente'
        });

    } catch (error) {
        res.status(500).json({
            msg: 'Contecte con el administrador',
            error
        })
    }
    res.json({
        msg: 'postUsuario',
        body
    })
}

export const deleteUsuario = (req: Request, res: Response) => {
    const { id } = req.params
    res.json({
        msg: 'deleteUsuario',
        id
    })
}