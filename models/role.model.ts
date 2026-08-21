import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from '@sequelize/core';
import { Attribute, PrimaryKey, AutoIncrement, NotNull, Unique, HasMany } from '@sequelize/core/decorators-legacy';
import { Usuario } from './usuario.model';

export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
@Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  @Unique
  declare nombre: string; // Ejemplo: 'ADMIN', 'USER', 'EDITOR'

  @Attribute(DataTypes.STRING)
  declare descripcion: string; // Ejemplo: 'Administrador total del sistema'

  // Un Rol puede tener muchos Usuarios
  @HasMany(() => Usuario, 'roleId')
  declare usuarios?: NonAttribute<Usuario[]>;
}