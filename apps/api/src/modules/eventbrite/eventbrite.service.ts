import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Model } from 'mongoose';
import { EventbriteClient } from './eventbrite.client';
import { EventbriteEvent, EventbriteEventDocument } from './schemas/eventbrite-event.schema';

dayjs.extend(utc);
dayjs.extend(timezone);

interface SyncOptions {
  city?: string;
  from?: Date;
  to?: Date;
}

interface NormalizedEvent {
  eventbriteId: string;
  name: string;
  url: string;
  startsAt: Date;
  endsAt?: Date;
  timezone: string;
  venueName?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  categoryId?: string;
  subcategoryId?: string;
  isFree: boolean;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  tags: string[];
  status: string;
  sourceUpdatedAt: Date;
}

@Injectable()
export class EventbriteService {
  private readonly logger = new Logger(EventbriteService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly eventbriteClient: EventbriteClient,
    @InjectModel(EventbriteEvent.name)
    private readonly eventbriteEventModel: Model<EventbriteEventDocument>
  ) {}

  isEnabled() {
    return this.eventbriteClient.isEnabled();
  }

  async syncUpcomingEvents(options: SyncOptions = {}) {
    if (!this.isEnabled()) {
      return { inserted: 0, updated: 0, pruned: 0 };
    }

    const timezoneName = this.config.get<string>('MATCH_TIMEZONE', 'America/Chicago');
    const city = (options.city ?? this.config.get<string>('EVENTBRITE_CITY', 'Chicago')).toLowerCase();
    const from = options.from ?? dayjs().tz(timezoneName).startOf('day').toDate();
    const to = options.to ?? dayjs(from).tz(timezoneName).add(14, 'day').endOf('day').toDate();
    const orgIds = this.config
      .get<string>('EVENTBRITE_ORGANIZATION_IDS', '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    let inserted = 0;
    let updated = 0;
    const seenIds = new Set<string>();

    const allRawEvents: Array<Record<string, unknown>> = [];

    if (orgIds.length > 0) {
      for (const orgId of orgIds) {
        const events = await this.eventbriteClient.listOrganizationEvents(orgId, from.toISOString(), to.toISOString());
        allRawEvents.push(...events);
      }
    } else {
      this.logger.log('EVENTBRITE_ORGANIZATION_IDS is empty. Falling back to city-wide search.');
      const events = await this.eventbriteClient.searchEventsByCity(city, from.toISOString(), to.toISOString());
      allRawEvents.push(...events);
    }

    for (const raw of allRawEvents) {
        const normalized = this.normalizeEvent(raw);
        if (!normalized) continue;

        if ((normalized.city ?? '').toLowerCase() !== city) {
          continue;
        }

        seenIds.add(normalized.eventbriteId);

        const existing = await this.eventbriteEventModel.findOne({ eventbriteId: normalized.eventbriteId });
        await this.eventbriteEventModel.findOneAndUpdate(
          { eventbriteId: normalized.eventbriteId },
          normalized,
          { upsert: true, new: true }
        );

        if (existing) {
          updated += 1;
        } else {
          inserted += 1;
        }
    }

    const pruneQuery: Record<string, unknown> = {
      $or: [{ startsAt: { $lt: dayjs().tz(timezoneName).startOf('day').toDate() } }, { status: { $ne: 'live' } }]
    };

    if (seenIds.size > 0) {
      pruneQuery.$or = [...(pruneQuery.$or as unknown[]), { eventbriteId: { $nin: [...seenIds] } }];
    }

    const pruneResult = await this.eventbriteEventModel.deleteMany(pruneQuery);

    return {
      inserted,
      updated,
      pruned: pruneResult.deletedCount ?? 0
    };
  }

  async listUpcomingThisWeek(referenceDate = new Date(), city = 'Chicago') {
    const timezoneName = this.config.get<string>('MATCH_TIMEZONE', 'America/Chicago');
    const start = dayjs(referenceDate).tz(timezoneName).startOf('day').toDate();
    const end = dayjs(referenceDate).tz(timezoneName).day(0).add(1, 'week').endOf('day').toDate();

    return this.eventbriteEventModel
      .find({
        startsAt: { $gte: start, $lte: end },
        city: { $regex: new RegExp(`^${city}$`, 'i') },
        status: 'live'
      })
      .sort({ startsAt: 1 });
  }

  private normalizeEvent(raw: Record<string, unknown>): NormalizedEvent | null {
    const id = this.readString(raw.id);
    const name = this.readString((raw.name as { text?: unknown } | undefined)?.text);
    const url = this.readString(raw.url);
    const startsLocal = this.readString((raw.start as { local?: unknown } | undefined)?.local);
    const timezoneName =
      this.readString((raw.start as { timezone?: unknown } | undefined)?.timezone) || 'America/Chicago';

    if (!id || !name || !url || !startsLocal) return null;

    const startsAt = dayjs.tz(startsLocal, timezoneName);
    if (!startsAt.isValid()) return null;

    const endsLocal = this.readString((raw.end as { local?: unknown } | undefined)?.local);
    const endsAt = endsLocal ? dayjs.tz(endsLocal, timezoneName) : null;

    const venue = (raw.venue as Record<string, unknown> | undefined) ?? {};
    const address = (venue.address as Record<string, unknown> | undefined) ?? {};
    const ticketAvailability =
      (raw.ticket_availability as Record<string, unknown> | undefined) ?? {};
    const minimumTicketPrice =
      (ticketAvailability.minimum_ticket_price as Record<string, unknown> | undefined) ?? {};
    const maximumTicketPrice =
      (ticketAvailability.maximum_ticket_price as Record<string, unknown> | undefined) ?? {};

    const categoryId = this.readString((raw.category as { id?: unknown } | undefined)?.id) ?? this.readString(raw.category_id);
    const subcategoryId = this.readString((raw.subcategory as { id?: unknown } | undefined)?.id) ?? this.readString(raw.subcategory_id);

    return {
      eventbriteId: id,
      name,
      url,
      startsAt: startsAt.toDate(),
      endsAt: endsAt?.isValid() ? endsAt.toDate() : undefined,
      timezone: timezoneName,
      venueName: this.readString(venue.name),
      address: this.readString(address.localized_address_display) ?? this.readString(address.address_1),
      city: this.readString(address.city),
      latitude: this.readNumber(venue.latitude),
      longitude: this.readNumber(venue.longitude),
      categoryId,
      subcategoryId,
      isFree: this.readBoolean(raw.is_free),
      priceMin: this.readNumber(minimumTicketPrice.major_value),
      priceMax: this.readNumber(maximumTicketPrice.major_value),
      currency: this.readString(minimumTicketPrice.currency) ?? this.readString(maximumTicketPrice.currency),
      tags: this.tagsForCategory(categoryId, subcategoryId),
      status: this.readString(raw.status) ?? 'live',
      sourceUpdatedAt: new Date()
    };
  }

  private tagsForCategory(categoryId?: string, subcategoryId?: string) {
    const tags = new Set<string>();
    const byCategory: Record<string, string[]> = {
      '103': ['music', 'nightlife'],
      '104': ['comedy', 'art', 'nightlife'],
      '105': ['foodie'],
      '108': ['sports', 'outdoors'],
      '109': ['outdoors'],
      '110': ['gaming', 'nightlife']
    };

    const bySubcategory: Record<string, string[]> = {
      '3003': ['comedy'],
      '5001': ['foodie'],
      '8001': ['sports'],
      '9001': ['outdoors'],
      '11003': ['gaming']
    };

    for (const tag of byCategory[categoryId ?? ''] ?? []) {
      tags.add(tag);
    }
    for (const tag of bySubcategory[subcategoryId ?? ''] ?? []) {
      tags.add(tag);
    }

    return [...tags];
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }

  private readNumber(value: unknown) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private readBoolean(value: unknown) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
  }
}
