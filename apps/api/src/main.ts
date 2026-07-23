import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter.js";
import { JsonLogger } from "./common/logging/json-logger.service.js";
import { getConfig } from "./config/app.config.js";

async function bootstrap(): Promise<void> {
  const config = getConfig();
  const logger = new JsonLogger();
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger,
  });

  app.useLogger(logger);
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  if (config.corsOrigins.length > 0) {
    app.enableCors({
      origin: config.corsOrigins,
      credentials: true,
    });
  }

  if (config.swaggerEnabled) {
    const documentConfig = new DocumentBuilder()
      .setTitle("Ecommerce API")
      .setDescription("Public shop and admin APIs for products, promotions, orders, integrations, and health checks.")
      .setVersion("0.1.0")
      .addTag("admin auth", "Admin login and current profile. Use /admin/auth/login, then paste accessToken into Authorize.")
      .addBearerAuth(
        {
          bearerFormat: "JWT",
          scheme: "bearer",
          type: "http",
        },
        "bearer",
      )
      .addSecurityRequirements("bearer")
      .build();
    const document = SwaggerModule.createDocument(app, documentConfig);
    SwaggerModule.setup("api/v1/docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(config.port, config.host);
  logger.log(`API listening on ${config.host}:${config.port}`, "Bootstrap");
}

void bootstrap();
