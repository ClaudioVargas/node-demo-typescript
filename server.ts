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
const session = require('express-session')


// const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "aa";
// const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "bb";
const GOOGLE_CLIENT_ID='852988521781-j3krjmc3erc5644fejr8eb86kg7550mi.apps.googleusercontent.com'
const GOOGLE_CLIENT_SECRET='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'

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
            this.middlewares()
            //se definen rutas
            this.routes()


            // OAutn2
            this.app.use(session({secret: "cats"}))
            this.app.use(passport.initialize())
            this.app.use(passport.session())
            console.log("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID)
            console.log("GOOGLE_CLIENT_SECRET", GOOGLE_CLIENT_SECRET)
            this.passport = passport.use(new GoogleStrategy({
                    clientID: GOOGLE_CLIENT_ID,
                    clientSecret: GOOGLE_CLIENT_SECRET,
                    callbackURL: "http://localhost:8000/auth/google/callback",
                    passReqToCallback: true,
                  }, (accessToken, refreshToken, profile, cb:any) => {
                    //   return done(err, user);
                  }
            ))

        }

        routes() {
            this.app.use(this.apiPaths.usuario, userRoutes)
            this.app.use(this.apiPaths.post, postRoutes)
            this.app.use(this.apiPaths.tema, temaRoutes)

            //test
            this.app.get("/main", (req, res)=> {
                res.send('<a href="/auth/google">Iniciar sesion con Google</a>')
            })

            this.app.get("/auth/google", 
                passport.authenticate('google', { scope: ['email', 'profile']})
            );

            this.app.get("/protected", this.isLoggerIn, (req, res)=> {
                res.send("*** protected ***")
            })

            this.app.get("/auth/failure", (req, res)=> {
                res.send("*** Fail ***")
            })

            this.app.get("/auth/google/callback",
                passport.authenticate('google',{
                    successRedirect: '/protected',
                    failureRedirect: '/auth/failure'
                })
            )

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



        // configurePassport(passport: passport.Passport) {
        //     // passport.use(new passportLocal.Strategy());
        // }
    }

export default Server