import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import { type ZodType } from "zod";

// 도메인 스키마는 pokedex-core에 Zod로 정의돼 있어, class-validator로 재작성하지 않고
// 그대로 재사용한다. 검증 실패는 BadRequestException(400)으로 변환된다.
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.message);
    }
    return result.data;
  }
}
