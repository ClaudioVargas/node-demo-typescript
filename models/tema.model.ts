import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from '@sequelize/core';
import { Attribute, PrimaryKey, AutoIncrement, NotNull, BelongsToMany } from '@sequelize/core/decorators-legacy';
import { Post } from './post.model';

const sequelize = new Sequelize('mysql::memory:');

export class Tema extends Model<InferAttributes<Tema>, InferCreationAttributes<Tema>> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare name: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare descripcion: string;
  
  @Attribute(DataTypes.BOOLEAN)
  @NotNull
  declare isActive: boolean;  

  @BelongsToMany(() => Post, {
    through: 'TemaPost',
  })
  declare temaPost?: NonAttribute<Post[]>;

}