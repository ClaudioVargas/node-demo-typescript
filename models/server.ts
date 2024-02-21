import express, { Application } from 'express'

import userRoutes from '../routes/usuario.router'
import postRoutes from '../routes/post.router'
import temaRoutes from '../routes/tema.router'

import cors from 'cors'

import db from '../db/connection'

class Server {
    private app: Application;
    private port: string
    private apiPaths = {
        usuario: '/api/usuarios',
        post: '/api/post',
        tema: '/api/tema'
    }

    constructor(){
        this.app = express();
        this.port = process.env.PORT || '8000'
        this.dbConnection()
        this.middlewares()
        //se definen rutas
        this.routes()
    }

    routes() {
        this.app.use(this.apiPaths.usuario, userRoutes)
        this.app.use(this.apiPaths.post, postRoutes)
        this.app.use(this.apiPaths.tema, temaRoutes)
    }

    listen(){
        this.app.listen( this.port, () => {
          console.info("Servidor corriendo en puerto !!", +this.port)  
        } )
    }

    middlewares() {
        // cors
        this.app.use( cors() )

        //lectura body
        this.app.use( express.json())

        //carpeta publica
        this.app.use( express.static('public') )
    }

    async dbConnection() {
        try {
            await db.authenticate()
            console.info("authenticacion correcta")
        } catch (error: any) {
            throw new Error(error)
        }
    }
}

export default Server