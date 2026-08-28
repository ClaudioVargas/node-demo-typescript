import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from '@sequelize/core';
import { Attribute, PrimaryKey, AutoIncrement, NotNull, HasMany, BelongsTo } from '@sequelize/core/decorators-legacy';
import { Post } from './post.model';
import { Role } from './role.model';

/**
 * @openapi
 * components:
 *   schemas:
 *     UsuarioSchema:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - email
 *         - password
 *         - isActive
 *         - roleId
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autogenerado del usuario
 *           example: 1
 *         name:
 *           type: string
 *           description: Nombre completo del usuario
 *           example: "Juan Pérez"
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico único
 *           example: "juan.perez@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña encriptada
 *           example: "********"
 *         isActive:
 *           type: boolean
 *           description: Estado de activación de la cuenta
 *           example: true
 *         roleId:
 *           type: integer
 *           description: ID del rol asignado
 *           example: 2
 *     UpdateUsuarioSchema:
 *      allOf:
 *        - $ref: '#/components/schemas/UsuarioSchema'
 *      properties:
 *        password:
 *          readOnly: true
 *        isActive:
 *          readOnly: true
 *        roleId:
 *          readOnly: true
 */
export class Usuario extends Model<InferAttributes<Usuario>, InferCreationAttributes<Usuario>> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare name: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  @Attribute({ unique: true })
  declare email: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare password: string;

  @Attribute(DataTypes.BOOLEAN)
  @NotNull
  declare isActive: boolean;

  @HasMany(() => Post, /* foreign key */ 'usuarioId')
  declare posts?: NonAttribute<Post[]>;

  @Attribute(DataTypes.INTEGER)
  @NotNull // Opcional: quítalo si permites usuarios sin rol al crearse
  declare roleId: number;

  @BelongsTo(() => Role, 'roleId')
  declare role?: NonAttribute<Role>;
}