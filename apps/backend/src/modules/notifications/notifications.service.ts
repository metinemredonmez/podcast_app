import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  async findAll(): Promise<unknown[]> {
    return [];
  }

  async findOne(id: string): Promise<unknown> {
    return { id };
  }

  async create(payload: unknown): Promise<unknown> {
    void payload;
    return {};
  }

  async send(payload: unknown): Promise<void> {
    await this.create(payload);
  }
}
