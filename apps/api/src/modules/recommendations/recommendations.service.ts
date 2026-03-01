import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match, MatchDocument } from '../matching/schemas/match.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  CHICAGO_WEEKLY_DATA,
  WeeklyEvent,
  WeeklyRestaurant
} from './constants/chicago-weekly-data';
import { Suggestion, SuggestionDocument } from './schemas/suggestion.schema';
import { VenueEvent, VenueEventDocument } from './schemas/venue-event.schema';

interface SuggestionCandidate {
  venueEventId?: Types.ObjectId;
  name: string;
  type: 'restaurant' | 'event';
  matchedTags: string[];
  score: number;
  eventUrl?: string;
  startsAt?: Date;
  venueName?: string;
  locationLabel?: string;
  detailLabel?: string;
  priceLabel?: string;
  source: 'static' | 'catalog';
}

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
    private readonly userModel: Model<UserDocument>
  ) {}

  async generateForMatch(matchId: string, combinedInterests: string[]) {
    const interests = [...new Set(combinedInterests.map((value) => value.toLowerCase().trim()).filter(Boolean))];
    const staticRanked = this.rankFromWeeklyStaticData(interests);

    if (staticRanked.length > 0) {
      await this.persistSuggestions(matchId, staticRanked);
      return staticRanked;
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

  private rankFromWeeklyStaticData(combinedInterests: string[]) {
    const weekStart = new Date(`${CHICAGO_WEEKLY_DATA.week_start}T00:00:00-06:00`);
    const weekEnd = new Date(`${CHICAGO_WEEKLY_DATA.week_end}T23:59:59-06:00`);

    const eventCandidates = CHICAGO_WEEKLY_DATA.events
      .filter((event) => {
        const start = new Date(event.start_time_local);
        return !Number.isNaN(start.getTime()) && start >= weekStart && start <= weekEnd;
      })
      .map((event) => this.toEventCandidate(event, combinedInterests));

    const restaurantCandidates = CHICAGO_WEEKLY_DATA.restaurants.map((restaurant) =>
      this.toRestaurantCandidate(restaurant, combinedInterests)
    );

    const selected: SuggestionCandidate[] = [];

    const eventTarget = Math.min(2, eventCandidates.length, 5);
    if (eventTarget > 0) {
      selected.push(...this.pickWeightedRandom(eventCandidates, eventTarget));
    }

    const remaining = 5 - selected.length;
    if (remaining > 0) {
      selected.push(...this.pickWeightedRandom(restaurantCandidates, Math.min(remaining, restaurantCandidates.length)));
    }

    if (selected.length < 5) {
      const leftovers = this.shuffleByWeight([...eventCandidates, ...restaurantCandidates], selected);
      for (const item of leftovers) {
        if (selected.length >= 5) break;
        selected.push(item);
      }
    }

    return selected;
  }

  private toEventCandidate(event: WeeklyEvent, interests: string[]): SuggestionCandidate {
    const tags = [event.category.toLowerCase(), ...(event.venue ? [event.venue.toLowerCase()] : [])];
    const matchedTags = tags.filter((tag) => this.matchesInterest(tag, interests));
    const base = matchedTags.length > 0 ? 0.6 : 0.2;
    const freeBoost = event.price === 'free' ? 0.2 : 0;
    const score = Number((base + freeBoost + Math.random() * 0.2).toFixed(4));

    return {
      name: event.name,
      type: 'event',
      matchedTags,
      score,
      startsAt: new Date(event.start_time_local),
      venueName: event.venue ?? undefined,
      locationLabel: event.address ?? CHICAGO_WEEKLY_DATA.city,
      priceLabel: event.price === 'free' ? 'Free' : event.price === 'paid' ? 'Paid' : 'Unknown',
      source: 'static'
    };
  }

  private toRestaurantCandidate(restaurant: WeeklyRestaurant, interests: string[]): SuggestionCandidate {
    const cuisineTags = restaurant.cuisine.map((item) => item.toLowerCase());
    const matchedTags = cuisineTags.filter((tag) => this.matchesInterest(tag, interests));
    const rating = typeof restaurant.rating === 'number' ? Math.max(0, Math.min(5, restaurant.rating)) / 5 : 0.7;
    const interestBoost = matchedTags.length > 0 ? 0.2 : 0;
    const score = Number((rating * 0.6 + interestBoost + Math.random() * 0.2).toFixed(4));
    const cuisineLabel = restaurant.cuisine.join(', ');
    const ratingLabel = typeof restaurant.rating === 'number' ? `★ ${restaurant.rating.toFixed(1)}` : undefined;
    const detailLabel = [cuisineLabel || undefined, ratingLabel].filter(Boolean).join(' · ');

    return {
      name: restaurant.name,
      type: 'restaurant',
      matchedTags,
      score,
      venueName: restaurant.name,
      locationLabel: restaurant.address ?? CHICAGO_WEEKLY_DATA.city,
      detailLabel: detailLabel || undefined,
      priceLabel: this.restaurantPriceLabel(restaurant.price_level),
      source: 'static'
    };
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
          detailLabel: item.description ?? undefined,
          priceLabel: 'Varies',
          source: 'catalog' as const
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private async persistSuggestions(matchId: string, items: SuggestionCandidate[]) {
    await this.suggestionModel.findOneAndUpdate(
      { matchId: new Types.ObjectId(matchId) },
      {
        matchId: new Types.ObjectId(matchId),
        items
      },
      { upsert: true, new: true }
    );
  }

  private pickWeightedRandom(items: SuggestionCandidate[], count: number) {
    const pool = [...items];
    const picked: SuggestionCandidate[] = [];

    while (pool.length > 0 && picked.length < count) {
      const totalWeight = pool.reduce((sum, item) => sum + Math.max(0.01, item.score), 0);
      let cursor = Math.random() * totalWeight;
      let index = 0;

      for (let i = 0; i < pool.length; i += 1) {
        cursor -= Math.max(0.01, pool[i].score);
        if (cursor <= 0) {
          index = i;
          break;
        }
      }

      picked.push(pool[index]);
      pool.splice(index, 1);
    }

    return picked;
  }

  private shuffleByWeight(items: SuggestionCandidate[], selected: SuggestionCandidate[]) {
    const selectedKeys = new Set(selected.map((item) => `${item.type}:${item.name}`));
    const remaining = items.filter((item) => !selectedKeys.has(`${item.type}:${item.name}`));
    return this.pickWeightedRandom(remaining, remaining.length);
  }

  private matchesInterest(tag: string, interests: string[]) {
    const normalizedTag = tag.toLowerCase();

    if (interests.includes(normalizedTag)) return true;

    const aliases: Record<string, string[]> = {
      foodie: ['food', 'american', 'italian', 'mexican', 'pizza', 'chinese', 'steakhouse'],
      music: ['music', 'jazz'],
      nightlife: ['nightlife', 'bar', 'cocktail', 'late'],
      outdoors: ['outdoors', 'stroll', 'park', 'riverwalk'],
      art: ['art', 'museum'],
      sports: ['sports', 'bulls', 'blackhawks'],
      comedy: ['comedy', 'stand-up'],
      gaming: ['gaming']
    };

    return interests.some((interest) => (aliases[interest] ?? []).some((alias) => normalizedTag.includes(alias)));
  }

  private restaurantPriceLabel(level: WeeklyRestaurant['price_level']) {
    if (!level) return 'Varies';
    if (level === 'cheap') return '$';
    if (level === 'moderate') return '$$';
    if (level === 'expensive') return '$$$';
    return '$$$$';
  }
}
