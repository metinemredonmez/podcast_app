export class S3Client {
  constructor(private readonly options: Record<string, unknown>) {}

  getOptions(): Record<string, unknown> {
    return this.options;
  }
}
