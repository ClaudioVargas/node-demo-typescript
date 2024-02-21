import { Request, Response } from "express"

import { Tema } from "../models/tema.model"


export const getTemas = async ( req: Request, res: Response ) => {

    // await Tema.sync()
    const usuarios = await Tema.findAll()

    return res.status(200).json({
        data: usuarios
    })
}

export const getTema = async ( req: Request, res: Response ) => {

    const { id } = req.params

    const usuario = await Tema.findByPk(id)

    if(!usuario) {
        return res.status(404).json({
            msg: "Tema con id "+id+" no encontrado" 
        })
    }
    return res.json({
        data: usuario,
    })
}

export const postTema = async ( req: Request, res: Response ) => {
    const { body } = req

    try {
        await Tema.sync()
        const usuario = new Tema(body) // Tema no tiene constructor
        const usuarioDb = await Tema.findOne({ where: {name: usuario.name} })
        if(!usuarioDb){
            body.createdAt = new Date()
            body.updatedAt = new Date()
            const response = await Tema.create(body);
            return res.json({
                msg: response
            })
        } else {
            return res.status(409).json({
            msg: 'Email '+ body.email + ' ya existe'
        })
        }

    } catch (error) {
        res.status(500).json({
            msg: 'Contecte con el administrador'
        })
    }
    res.json({
        msg: 'postTema',
        body
    })
}

export const putTema = async ( req: Request, res: Response ) => {
    const { body } = req

    try {
        const usuarioDb = await Tema.findByPk(body.id)
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
                msg: 'Tema con id '+ body.id + 'no exisete'
            })
        }
            
    } catch (error) {
        res.status(500).json({
            msg: 'Contecte con el administrador',
            error
        })
    }
    res.json({
        msg: 'postTema',
        body
    })
}

export const deleteTema = ( req: Request, res: Response ) => {
    const { id } = req.params
    res.json({
        msg: 'deleteTema',
        id
    })
}