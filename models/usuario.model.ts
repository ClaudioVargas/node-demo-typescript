import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from '@sequelize/core';
import { Attribute, PrimaryKey, AutoIncrement, NotNull, HasMany } from '@sequelize/core/decorators-legacy';
import { Post } from './post.model';
import { UsuarioTema } from './usuarioTemas.model';

const sequelize = new Sequelize('mysql::memory:');

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
  declare email: string;
  
  @Attribute(DataTypes.BOOLEAN)
  @NotNull
  declare isActive: boolean;  

  @HasMany(() => Post, /* foreign key */ 'usuarioId')
  declare posts?: NonAttribute<Post[]>;

  @HasMany(() => UsuarioTema, /* foreign key */ 'usuarioId')
  declare temas?: NonAttribute<UsuarioTema[]>;

}