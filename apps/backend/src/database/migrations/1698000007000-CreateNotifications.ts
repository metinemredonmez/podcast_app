import { MigrationInterface, QueryRunner } from 'typeorm';

export class 1698000007000CreateNotifications implements MigrationInterface {
  name = '1698000007000CreateNotifications';

  public async up(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
  }
}
