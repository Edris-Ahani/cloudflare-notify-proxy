import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { translateMessage } from "../i18n/messages";

@Catch()
export class I18nExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(I18nExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine target language from request headers
    const langHeader =
      (request.headers["x-lang"] as string) ||
      (request.headers["accept-language"] as string) ||
      "";
    const lang = langHeader.toLowerCase().startsWith("fa") ? "fa" : "en";

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";
    let errorType = "Internal Server Error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === "string") {
        message = translateMessage(res, lang);
      } else if (typeof res === "object" && res !== null) {
        const resObj = res as Record<string, any>;
        errorType = resObj.error || errorType;

        if (Array.isArray(resObj.message)) {
          message = resObj.message.map((msgItem) =>
            typeof msgItem === "string" ? translateMessage(msgItem, lang) : msgItem
          );
        } else if (typeof resObj.message === "string") {
          message = translateMessage(resObj.message, lang);
        }
      }
    } else {
      this.logger.error("Unhandled Exception:", exception);
      if (lang === "fa") {
        message = "خطای غیرمنتظره در سرور رخ داد. لطفاً مجدداً تلاش کنید.";
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: errorType,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
