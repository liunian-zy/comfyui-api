import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { z } from 'zod';

// S3 配置的 Schema
export const S3ConfigSchema = z.object({
  enabled: z.boolean().default(false),
  region: z.string().optional(),
  bucket: z.string().optional(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  endpoint: z.string().optional(),
  // 可选的路径前缀
  pathPrefix: z.string().optional(),
  // 是否使用环境变量中的配置
  useEnvConfig: z.boolean().default(true),
});

export type S3Config = z.infer<typeof S3ConfigSchema>;

export class S3Service {
  private client: S3Client | null = null;
  private config: S3Config;

  constructor(config?: Partial<S3Config>) {
    // 首先从环境变量加载配置
    const envConfig: Partial<S3Config> = {
      enabled: process.env.S3_ENABLED === 'true',
      region: process.env.S3_REGION,
      bucket: process.env.S3_BUCKET,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      endpoint: process.env.S3_ENDPOINT,
      pathPrefix: process.env.S3_PATH_PREFIX,
    };

    // 合并环境变量配置和传入的配置
    this.config = S3ConfigSchema.parse({
      ...envConfig,
      ...config,
    });

    if (this.config.enabled) {
      this.initializeClient();
    }
  }

  private initializeClient() {
    if (!this.config.enabled) return;

    const clientConfig: any = {
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId!,
        secretAccessKey: this.config.secretAccessKey!,
      },
    };

    if (this.config.endpoint) {
      clientConfig.endpoint = this.config.endpoint;
      // 对于 MinIO 等兼容 S3 的服务，可能需要设置 forcePathStyle
      clientConfig.forcePathStyle = true;
    }

    this.client = new S3Client(clientConfig);
  }

  public async uploadBuffer(
    buffer: Buffer,
    filename: string,
    contentType: string = 'image/png'
  ): Promise<string> {
    if (!this.config.enabled || !this.client || !this.config.bucket) {
      throw new Error('S3 service is not properly configured');
    }

    const key = this.config.pathPrefix
      ? `${this.config.pathPrefix}/${filename}`
      : filename;

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.config.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      },
    });

    await upload.done();

    // 返回文件的 URL
    if (this.config.endpoint) {
      return `${this.config.endpoint}/${this.config.bucket}/${key}`;
    } else {
      return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
    }
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }
} 