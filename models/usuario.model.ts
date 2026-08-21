import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from '@sequelize/core';
import { Attribute, PrimaryKey, AutoIncrement, NotNull, HasMany, BelongsTo } from '@sequelize/core/decorators-legacy';
import { Post } from './post.model';
import { Role } from './role.model';

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