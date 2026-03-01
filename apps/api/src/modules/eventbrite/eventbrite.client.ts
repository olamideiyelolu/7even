import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EventbriteListResponse {
  pagination?: {
    has_more_items?: boolean;
    continuation?: string;
  };
  events?: Array<Record<string, unknown>>;
}

@Injectable()
export class EventbriteClient {
  private readonly logger = new Logger(EventbriteClient.name);
  private readonly baseUrl = 'https://www.eventbriteapi.com/v3';

  constructor(private readonly config: ConfigService) {}

  isEnabled() {
    return this.config.get<string>('EVENTBRITE_ENABLED', 'false') === 'true';
  }

  async listOrganizationEvents(orgId: string, fromIso: string, toIso: string) {
    const token = this.config.get<string>('EVENTBRITE_TOKEN', '');
    if (!this.isEnabled() || !token) return [];

    const all: Array<Record<string, unknown>> = [];
    let continuation: string | undefined;

    do {
      const query = new URLSearchParams({
        status: 'live',
        'start_date.range_start': fromIso,
        'start_date.range_end': toIso,
        order_by: 'start_asc',
        expand: 'venue,category,subcategory,ticket_availability',
        page_size: '50'
      });

      if (continuation) {
        query.set('continuation', continuation);
      }

      const url = `${this.baseUrl}/organizations/${orgId}/events/?${query.toString()}`;
      const payload = await this.requestWithRetry(url, token);
      all.push(...(payload.events ?? []));
      continuation = payload.pagination?.has_more_items ? payload.pagination?.continuation : undefined;
    } while (continuation);

    return all;
  }

  async searchEventsByCity(city: string, fromIso: string, toIso: string) {
    const token = this.config.get<string>('EVENTBRITE_TOKEN', '');
    if (!this.isEnabled() || !token) return [];

    const all: Array<Record<string, unknown>> = [];
    let continuation: string | undefined;

    do {
      const query = new URLSearchParams({
        'location.address': city,
        'location.within': '25mi',
        status: 'live',
        'start_date.range_start': fromIso,
        'start_date.range_end': toIso,
        order_by: 'start_asc',
        expand: 'venue,category,subcategory,ticket_availability',
        page_size: '50'
      });

      if (continuation) {
        query.set('continuation', continuation);
      }

      const url = `${this.baseUrl}/events/search/?${query.toString()}`;
      const payload = await this.requestWithRetry(url, token);
      all.push(...(payload.events ?? []));
      continuation = payload.pagination?.has_more_items ? payload.pagination?.continuation : undefined;
    } while (continuation);

    return all;
  }

  private async requestWithRetry(url: string, token: string) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return (await response.json()) as EventbriteListResponse;
      }

      const shouldRetry = response.status === 429 || response.status >= 500;
      if (!shouldRetry || attempt === maxAttempts) {
        const body = await response.text();
        throw new Error(`Eventbrite request failed (${response.status}): ${body.slice(0, 300)}`);
      }

      const delayMs = attempt * 500;
      this.logger.warn(`Eventbrite request retry ${attempt}/${maxAttempts} after ${response.status}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return { events: [] } as EventbriteListResponse;
  }
}
