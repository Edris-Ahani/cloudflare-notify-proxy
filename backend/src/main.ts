import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allowed origins for Next.js frontend (local + Coolify custom domains)
  const defaultOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:15434",
    "http://127.0.0.1:15434",
  ];

  const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((item) => item.trim())
    : [];

  const allowedOrigins = [...defaultOrigins, ...envOrigins];

  // Enable Cross-Origin Resource Sharing (CORS)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, postman) or matching allowed origins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
  });

  // Global request validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = process.env.PORT || 4000;
  await app.listen(port, "0.0.0.0");
  console.log(`Backend server successfully started on port ${port}`);
}

bootstrap();
