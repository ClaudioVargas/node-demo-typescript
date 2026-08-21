import express, { Application, NextFunction, Request, Response } from 'express'

import authRoutes from './routes/auth.router'
import userRoutes from './routes/usuario.router'
import roleRoutes from './routes/role.router'
import postRoutes from './routes/post.router'
import temaRoutes from './routes/tema.router'
import streamRoutes from './routes/stream.router'

import cors from 'cors'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'

import db from './db/connection'
import { Usuario } from './models/usuario.model'

// oauth
import passportLocal from "passport-local";
import passport from 'passport'
import passportGoogle from "passport-google-oauth20";
const GoogleStrategy = passportGoogle.Strategy;

import session from 'express-session'

import 'dotenv/config'
import { ApiError } from './validators/apiError'
import { authJwt } from './validators/authJwt'
import { errorHandler } from './validators/errorHandler'
import { setupSwagger } from './swagger'

const SECRET = process.env.JWT_SECRET || 'secretKey'

class Server {
    private app: Application;
    private port: string
    private apiPaths = {
        usuario: '/api/usuarios',
        post: '/api/post',
        tema: '/api/tema',
        utils: '/api/utils',
        role: '/api/role'
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

        // Levantar Swagger Docs
        setupSwagger(this.app as any);

        //se definen rutas
        this.routes()

        // add global error handler
        this.app.use(errorHandler)


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
        // Rutas públicas de autenticación
        this.app.use('/api/auth', authRoutes)
        // this.app.use('/api/hashPassword', authRoutes)

        // Proteger todas las rutas /api con authJwt a partir de aquí
        this.app.use('/api', authJwt)

        // Rutas protegidas (serán interceptadas por authJwt)
        this.app.use(this.apiPaths.usuario, userRoutes)
        this.app.use(this.apiPaths.role, roleRoutes)
        this.app.use(this.apiPaths.post, postRoutes)
        this.app.use(this.apiPaths.tema, temaRoutes)
        this.app.use(this.apiPaths.utils, streamRoutes)

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

        // NOTE: legacy test endpoints removed in favor of /api/auth

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
        // this.app.use(cors())
        cors({
            origin: [
                "http://localhost:8000", // Swagger UI
                "http://localhost:3000", // Postman (cuando pruebas con servidor local)
                "http://127.0.0.1:3000", // alternativa localhost
                "http://localhost:5173" // react local
            ],
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true, // permite enviar cookies/autenticación si usas JWT en headers
        })

        // security headers
        this.app.use(helmet())

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