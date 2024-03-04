import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from '@sequelize/core';
import { Attribute, PrimaryKey, AutoIncrement, NotNull, HasMany, BelongsToMany } from '@sequelize/core/decorators-legacy';
import { Usuario } from './usuario.model';
import { Tema } from './tema.model';

// const sequelize = new Sequelize('mysql::memory:');

// import db from ''


export class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare title: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare body: string;
  
  @Attribute(DataTypes.BOOLEAN)
  @NotNull
  declare isActive: boolean;
  
  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare usuarioId: number;
  
  @BelongsToMany(() => Tema, {
    through: 'post_tema',
    foreignKey: 'postId',
    otherKey: 'temaId'
  })
  declare postTemas?: NonAttribute<Tema[]>;

}