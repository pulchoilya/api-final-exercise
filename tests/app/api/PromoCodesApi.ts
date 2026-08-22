import { BaseApiClient } from './BaseApiClient';

export type CreatePromoCodePayload = {
  code: string;
  discountPercent: number;
  maxUses?: number | null;
  expiresAt: string;
};

type RequestOptions = { failOnStatusCode?: boolean };

export class PromoCodesApi extends BaseApiClient {
  private promoCodesPath(courseId: string) {
    return `/api/admin/courses/${courseId}/promo-codes`;
  }

  async list(accessToken: string, courseId: string, options?: RequestOptions) {
    return this.request.get(this.promoCodesPath(courseId), {
      headers: this.authHeaders(accessToken),
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async create(
    accessToken: string,
    courseId: string,
    payload: CreatePromoCodePayload,
    options?: RequestOptions,
  ) {
    return this.request.post(this.promoCodesPath(courseId), {
      headers: this.authHeaders(accessToken),
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async toggleActive(
    accessToken: string,
    courseId: string,
    promoCodeId: string,
    options?: RequestOptions,
  ) {
    return this.request.patch(`${this.promoCodesPath(courseId)}/${promoCodeId}`, {
      headers: this.authHeaders(accessToken),
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async remove(
    accessToken: string,
    courseId: string,
    promoCodeId: string,
    options?: RequestOptions,
  ) {
    return this.request.delete(`${this.promoCodesPath(courseId)}/${promoCodeId}`, {
      headers: this.authHeaders(accessToken),
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }
}
