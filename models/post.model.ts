import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from '@sequelize/core';
import { Attribute, PrimaryKey, AutoIncrement, NotNull, HasMany } from '@sequelize/core/decorators-legacy';
import { Usuario } from './usuario.model';

const sequelize = new Sequelize('mysql::memory:');

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

}