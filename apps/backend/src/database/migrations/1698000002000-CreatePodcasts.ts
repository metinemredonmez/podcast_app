import { MigrationInterface, QueryRunner } from 'typeorm';

export class 1698000002000CreatePodcasts implements MigrationInterface {
  name = '1698000002000CreatePodcasts';

  public async up(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
  }
}
