import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from '@sequelize/core';
import { Attribute, PrimaryKey, AutoIncrement, NotNull } from '@sequelize/core/decorators-legacy';


export class UsuarioTema extends Model<InferAttributes<UsuarioTema>, InferCreationAttributes<UsuarioTema>> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare usuarioId: number;  
  
  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare temaId: number;



}