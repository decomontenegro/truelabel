declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production' | 'staging';
    PORT: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    [key: string]: string | undefined;
  }
}
