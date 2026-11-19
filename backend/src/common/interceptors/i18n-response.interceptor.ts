import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Request } from "express";
import { translateMessage } from "../i18n/messages";

@Injectable()
export class I18nResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const langHeader =
      (request.headers["x-lang"] as string) ||
      (request.headers["accept-language"] as string) ||
      "";
    const lang = langHeader.toLowerCase().startsWith("fa") ? "fa" : "en";

    return next.handle().pipe(
      map((data) => {
        if (!data || typeof data !== "object") {
          return data;
        }

        // If response has a message property, translate it if Persian requested
        if (typeof data.message === "string") {
          return {
            ...data,
            message: translateMessage(data.message, lang),
          };
        }

        return data;
      })
    );
  }
}
