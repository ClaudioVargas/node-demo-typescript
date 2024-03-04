import { Request, Response } from "express"

import { Post } from "../models/post.model"


export const getPosts = async (req: Request, res: Response) => {

    // await Post.sync()
    const posts = await Post.findAll()

    return res.status(200).json({
        data: posts
    })
}

export const getPost = async (req: Request, res: Response) => {

    const { id } = req.params

    const post = await Post.findByPk(id)

    if (!post) {
        return res.status(404).json({
            msg: "Post con id " + id + " no encontrado"
        })
    }
    return res.json({
        data: post,
    })
}

export const postPost = async (req: Request, res: Response) => {
    const { body } = req

    try {
        await Post.sync()
        body.createdAt = new Date()
        body.updatedAt = new Date()
        const response = await Post.create(body);
        return res.status(201).json({
            msg: response
        })

    } catch (error) {
        res.status(500).json({
            msg: 'Contecte con el administrador'
        })
    }
}

export const putPost = async (req: Request, res: Response) => {
    const { body } = req

    try {
        const postDb = await Post.findByPk(body.id)
        console.log("body", body)
        if (postDb) {
            body.updatedAt = new Date()
            postDb.set(body);
            // postDb.update({
            //     isActive: false
            // }) para actualizar registros especificos 


            await postDb.save();
            return res.json({
                src: 'post editado correctamente'
            })
        } else {
            return res.status(409).json({
                msg: 'Post con id ' + body.id + 'no exisete'
            })
        }

    } catch (error) {
        res.status(500).json({
            msg: 'Contecte con el administrador',
            error
        })
    }
    res.json({
        msg: 'postPost',
        body
    })
}

export const deletePost = (req: Request, res: Response) => {
    const { id } = req.params
    res.json({
        msg: 'deletePost',
        id
    })
}