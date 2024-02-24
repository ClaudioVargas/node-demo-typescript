import { Request, Response } from "express"

import { Usuario } from "../models/usuario.model"
import { UsuarioTema } from "../models/usuarioTemas.model"
import { and } from "@sequelize/core"
import { Tema } from "../models/tema.model"


export const getUsuarios = async ( req: Request, res: Response ) => {

    // await Usuario.sync()
    const usuarios = await Usuario.findAll()

    return res.status(200).json({
        data: usuarios
    })
}

export const getUsuario = async ( req: Request, res: Response ) => {

    const { id } = req.params

    const usuario = await Usuario.findByPk(id)

    if(!usuario) {
        return res.status(404).json({
            msg: "Usuario con id "+id+" no encontrado" 
        })
    }
    return res.json({
        data: usuario,
    })
}

export const postUsuario = async ( req: Request, res: Response ) => {
    const { body } = req

    try {
        
        await Usuario.sync({alter: true})
        const usuario = new Usuario(body)
        const usuarioDb = await Usuario.findOne({ where: {email: usuario.email} })
        if(!usuarioDb){
            body.createdAt = new Date()
            body.updatedAt = new Date()
            const response = await Usuario.create(body);
            return res.status(201).json({
                msg: response
            })
        } else {
            return res.status(409).json({
            msg: 'Email '+ usuario.email + ' ya existe'
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

export const postLikeTema = async ( req: Request, res: Response ) => {
    const { body } = req
    
    try {
        
        await UsuarioTema.sync({alter: true})
        const usuarioTema = new UsuarioTema(body)
        console.log("*******************+++")
        const usuario = await Tema.findOne({ where: { id: usuarioTema.usuarioId}})
        if(!usuario) {
            return res.status(409).json({
                msg: "usuario con id "+ usuarioTema.usuarioId +" no existe"
            })
        }
        const tema = await Tema.findOne({ where: { id: usuarioTema.temaId}})
        if(!tema) {
            return res.status(409).json({
                msg: "tema con id "+ usuarioTema.temaId +" no existe"
            })
        }
        const usuarioTemaDb = await UsuarioTema.findOne({ where: {usuarioId: usuarioTema.usuarioId, temaId: usuarioTema.temaId} })
        if(!usuarioTemaDb){
            body.createdAt = new Date()
            body.updatedAt = new Date()
            const response = await UsuarioTema.create(body);
            return res.status(201).json({
                msg: response
            })
        } else {
            return res.status(409).json({
            msg: 'usuarioTema con id: '+ usuarioTema.temaId + ' ya existe'
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

export const putUsuario = async ( req: Request, res: Response ) => {
    const { body } = req

    try {
        const usuarioDb = await Usuario.findByPk(body.id)
        console.log("body", body)
        if(usuarioDb) {
            body.updatedAt = new Date()
            usuarioDb.set(body);
            // usuarioDb.update({
            //     updatedAt: new Date()
            // }) para actualizar registros especificos 
            
            
            await usuarioDb.save();
            return res.json({
                src: 'usuario editado correctamente'
            })
        } else {
            return res.status(409).json({
                msg: 'Usuario con id '+ body.id + 'no exisete'
            })
        }
            
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

export const deleteUsuario = ( req: Request, res: Response ) => {
    const { id } = req.params
    res.json({
        msg: 'deleteUsuario',
        id
    })
}