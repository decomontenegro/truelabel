export default () => ({
  port: parseInt(process.env.API_PORT, 10) || 3001,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    url: process.env.REDIS_URL,
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION || 'us-east-1',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@trust-label.com',
  },
  cors: {
    origins: process.env.CORS_ORIGINS || 'http://localhost:3000',
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
  labs: {
    eurofins: {
      apiKey: process.env.LAB_EUROFINS_API_KEY,
    },
    sgs: {
      apiKey: process.env.LAB_SGS_API_KEY,
    },
    sfdk: {
      apiKey: process.env.LAB_SFDK_API_KEY,
    },
  },
});