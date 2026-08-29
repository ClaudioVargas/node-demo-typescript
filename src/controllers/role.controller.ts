import { Request, Response } from "express"
import { Role } from "../models/role.model"



export const getRoles = async (req: Request, res: Response) => {

    // await Post.sync()
    const posts = await Role.findAll()
    return res.status(200).json({
        data: posts
    })
}

export const postRole = async (req: Request, res: Response) => {
    const { body } = req

    try {
        await Role.sync()
        body.createdAt = new Date()
        body.updatedAt = new Date()
        const response = await Role.create(body);
        return res.status(201).json({
            msg: response
        })

    } catch (error) {
        res.status(500).json({
            msg: 'Contecte con el administrador'
        })
    }
}

export const deleteRole = (req: Request, res: Response) => {
    const { id } = req.params
    res.json({
        msg: 'deleteRole',
        id
    })
}

