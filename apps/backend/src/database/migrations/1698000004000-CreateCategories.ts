import { MigrationInterface, QueryRunner } from 'typeorm';

export class 1698000004000CreateCategories implements MigrationInterface {
  name = '1698000004000CreateCategories';

  public async up(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
  }
}
