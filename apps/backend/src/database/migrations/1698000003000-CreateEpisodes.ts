import { MigrationInterface, QueryRunner } from 'typeorm';

export class 1698000003000CreateEpisodes implements MigrationInterface {
  name = '1698000003000CreateEpisodes';

  public async up(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
  }
}
