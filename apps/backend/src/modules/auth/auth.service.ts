import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
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
}
