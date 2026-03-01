import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventbriteClient } from './eventbrite.client';
import { EventbriteService } from './eventbrite.service';
import { EventbriteEvent, EventbriteEventSchema } from './schemas/eventbrite-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventbriteEvent.name, schema: EventbriteEventSchema }
    ])
  ],
  providers: [EventbriteClient, EventbriteService],
  exports: [EventbriteService, MongooseModule]
})
export class EventbriteModule {}
