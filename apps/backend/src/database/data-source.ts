import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: false,
  migrations: ['dist/database/migrations/*.js'],
  entities: ['dist/modules/**/*.entity.js'],
});

export default AppDataSource;
