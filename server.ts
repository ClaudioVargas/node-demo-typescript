import express, { Application, NextFunction, Request, Response } from 'express'

import userRoutes from './routes/usuario.router'
import postRoutes from './routes/post.router'
import temaRoutes from './routes/tema.router'

import cors from 'cors'

import db from './db/connection'
import { Usuario } from './models/usuario.model'
// import { UsuarioTema } from './postTemas.model'

// oauth
import passportLocal from "passport-local";
import passport from 'passport'
import passportGoogle from "passport-google-oauth20";
const GoogleStrategy = passportGoogle.Strategy;
// import expressSesion from 'express-session'
// const session = require('express-session')

import session from 'express-session'

import 'dotenv/config'

class Server {
    private app: Application;
    private port: string
    private apiPaths = {
        usuario: '/api/usuarios',
        post: '/api/post',
        tema: '/api/tema'
    }

    private passport: any

    constructor() {
        this.app = express();
        this.port = process.env.PORT || '8000'
        this.dbConnection()
        // OAutn2
        this.app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }))
        this.app.use(passport.initialize())
        this.app.use(passport.session())
        this.middlewares()
        //se definen rutas
        this.routes()





        const clientId = process.env.GOOGLE_CLIENT_ID || ''
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
        
        this.passport = passport.use(new GoogleStrategy({
            clientID: clientId,
            clientSecret: clientSecret,
            callbackURL: "http://localhost:8000/auth/google/callback",
            passReqToCallback: true,
        }, (request, accessToken, refreshToken, profile, done) => {
              return done(null, profile);
            
        }
        ))

        passport.serializeUser((user, done) => {
            done(null, user);
        });

        passport.deserializeUser((user: any, done) => {
            done(null, user);
        });

    }

    routes() {
        this.app.use(this.apiPaths.usuario, userRoutes)
        this.app.use(this.apiPaths.post, postRoutes)
        this.app.use(this.apiPaths.tema, temaRoutes)

        //test
        this.app.get("/main", (req, res) => {
            res.send('<a href="/auth/google">Iniciar sesion con Google</a>')
        })

        this.app.get("/auth/google",
            passport.authenticate('google', { scope: ['email', 'profile'] })
        );

        this.app.get("/auth/google/callback",
            passport.authenticate('google', {
                successRedirect: '/protected',
                failureRedirect: '/auth/failure'
            })
        )

        this.app.get("/protected", this.isLoggerIn, (req: Request, res) => {
            res.send(`Hello ${req.user}`)
        })

        this.app.get("/auth/failure", (req, res) => {
            res.send("*** Fail ***")
        })


    }

    isLoggerIn(req: Request, res: Response, next: NextFunction) {
        req.user ? next() : res.sendStatus(401)
    }

    listen() {
        this.app.listen(this.port, () => {
            console.info("Servidor corriendo en puerto !!", +this.port)
            db.models.Tema.sync({ alter: false })
            db.models.Usuario.sync({ alter: false })
            db.models.Post.sync({ alter: false })
        })
    }

    middlewares() {
        // cors
        this.app.use(cors())

        //lectura body
        this.app.use(express.json())

        //carpeta publica
        this.app.use(express.static('public'))
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