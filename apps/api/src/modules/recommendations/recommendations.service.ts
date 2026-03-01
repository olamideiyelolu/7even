import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventbriteService } from '../eventbrite/eventbrite.service';
import { Match, MatchDocument } from '../matching/schemas/match.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Suggestion, SuggestionDocument } from './schemas/suggestion.schema';
import { VenueEvent, VenueEventDocument } from './schemas/venue-event.schema';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Suggestion.name)
    private readonly suggestionModel: Model<SuggestionDocument>,
    @InjectModel(VenueEvent.name)
    private readonly venueEventModel: Model<VenueEventDocument>,
    @InjectModel(Match.name)
    private readonly matchModel: Model<MatchDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly eventbriteService: EventbriteService
  ) {}

  async generateForMatch(matchId: string, combinedInterests: string[]) {
    const interests = [...new Set(combinedInterests.map((value) => value.toLowerCase().trim()).filter(Boolean))];
    const eventbriteRanked = await this.rankEventbriteEvents(interests);

    if (eventbriteRanked.length > 0) {
      await this.persistSuggestions(matchId, eventbriteRanked);
      return eventbriteRanked;
    }

    const catalogRanked = await this.rankCatalogEvents(interests);
    await this.persistSuggestions(matchId, catalogRanked);
    return catalogRanked;
  }

  async getForMatch(matchId: string, userId: string) {
    const match = await this.matchModel.findById(matchId);
    if (!match) return null;

    const participants = [match.userA.toString(), match.userB.toString()];
    if (!participants.includes(userId)) return null;

    const users = await this.userModel.find({
      _id: {
        $in: [new Types.ObjectId(match.userA.toString()), new Types.ObjectId(match.userB.toString())]
      }
    });

    const combinedInterests = [
      ...new Set(
        users.flatMap((user) => (user.interests ?? []).map((interest) => interest.toLowerCase().trim()).filter(Boolean))
      )
    ];

    await this.generateForMatch(match.id, combinedInterests);
    return this.suggestionModel.findOne({ matchId: new Types.ObjectId(match.id) });
  }

  private async rankEventbriteEvents(combinedInterests: string[]) {
    const events = await this.eventbriteService.listUpcomingThisWeek(new Date(), 'Chicago');

    const categoryWeights = this.buildCategoryWeights(combinedInterests);

    const ranked = events
      .map((event) => {
        const matchedTags = (event.tags ?? []).filter((tag) => combinedInterests.includes(tag.toLowerCase()));
        const categoryScore = this.categoryScore(event.categoryId, event.subcategoryId, categoryWeights);
        const tagScore = matchedTags.length / Math.max(1, (event.tags ?? []).length);
        const freeBias = event.isFree ? 0.2 : 0;
        const lowCostBias = !event.isFree && (event.priceMin ?? Number.POSITIVE_INFINITY) <= 20 ? 0.1 : 0;
        const startsAtMs = event.startsAt.getTime();
        const now = Date.now();
        const daysAway = Math.max(0, (startsAtMs - now) / (1000 * 60 * 60 * 24));
        const proximityScore = Math.max(0, 1 - daysAway / 7);

        const score = Number((tagScore * 0.35 + categoryScore * 0.35 + proximityScore * 0.2 + freeBias + lowCostBias).toFixed(4));

        return {
          venueEventId: event._id,
          name: event.name,
          type: 'event' as const,
          matchedTags,
          score,
          eventUrl: event.url,
          startsAt: event.startsAt,
          venueName: event.venueName,
          locationLabel: this.locationLabel(event),
          priceLabel: this.priceLabel(event),
          source: 'eventbrite' as const
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return ranked;
  }

  private async rankCatalogEvents(combinedInterests: string[]) {
    const catalog = await this.venueEventModel.find();
    return catalog
      .map((item) => {
        const matchedTags = item.tags.filter((tag) => combinedInterests.includes(tag.toLowerCase()));
        const score = matchedTags.length / Math.max(1, item.tags.length);
        return {
          venueEventId: item._id,
          name: item.name,
          type: item.type,
          matchedTags,
          score: Number(score.toFixed(4)),
          venueName: item.name,
          locationLabel: item.neighborhood,
          priceLabel: 'Varies',
          source: 'catalog' as const
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private async persistSuggestions(matchId: string, items: Array<Record<string, unknown>>) {
    await this.suggestionModel.findOneAndUpdate(
      { matchId: new Types.ObjectId(matchId) },
      {
        matchId: new Types.ObjectId(matchId),
        items
      },
      { upsert: true, new: true }
    );
  }

  private buildCategoryWeights(interests: string[]) {
    const categoryMap: Record<string, string[]> = {
      music: ['103'],
      comedy: ['104', '3003'],
      art: ['104'],
      foodie: ['105', '5001'],
      sports: ['108', '8001'],
      outdoors: ['109', '9001'],
      gaming: ['110', '11003'],
      nightlife: ['103', '104', '110']
    };

    const weights = new Map<string, number>();
    for (const interest of interests) {
      for (const id of categoryMap[interest] ?? []) {
        weights.set(id, (weights.get(id) ?? 0) + 1);
      }
    }

    const maxWeight = Math.max(1, ...weights.values());
    for (const [id, weight] of weights.entries()) {
      weights.set(id, Number((weight / maxWeight).toFixed(4)));
    }

    return weights;
  }

  private categoryScore(
    categoryId: string | undefined,
    subcategoryId: string | undefined,
    weights: Map<string, number>
  ) {
    const categoryWeight = categoryId ? (weights.get(categoryId) ?? 0) : 0;
    const subcategoryWeight = subcategoryId ? (weights.get(subcategoryId) ?? 0) : 0;
    return Math.max(categoryWeight, subcategoryWeight);
  }

  private locationLabel(event: { city?: string; venueName?: string; address?: string }) {
    if (event.city && event.venueName) return `${event.venueName} · ${event.city}`;
    if (event.address) return event.address;
    return event.city ?? 'Chicago';
  }

  private priceLabel(event: { isFree?: boolean; priceMin?: number; priceMax?: number; currency?: string }) {
    if (event.isFree) return 'Free';
    const currency = event.currency ?? 'USD';
    const symbol = currency === 'USD' ? '$' : `${currency} `;
    if (typeof event.priceMin === 'number' && typeof event.priceMax === 'number') {
      if (event.priceMin === event.priceMax) return `${symbol}${event.priceMin.toFixed(0)}`;
      return `${symbol}${event.priceMin.toFixed(0)}-${symbol}${event.priceMax.toFixed(0)}`;
    }
    if (typeof event.priceMin === 'number') return `${symbol}${event.priceMin.toFixed(0)}+`;
    return 'Varies';
  }
}
