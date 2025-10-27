import { MigrationInterface, QueryRunner } from 'typeorm';

export class 1698000000000CreateUsers implements MigrationInterface {
  name = '1698000000000CreateUsers';

  public async up(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
  }
}
