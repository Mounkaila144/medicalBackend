import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Tariff, Invoice, InvoiceLine, Payment } from './entities';
import { InvoicingService, PaymentsService } from './services';
import { InvoicesController, PaymentsController, TariffsController } from './controllers';
import { InvoicesResolver, PaymentsResolver, TariffsResolver } from './resolvers';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tariff, Invoice, InvoiceLine, Payment]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [InvoicesController, PaymentsController, TariffsController],
  providers: [
    InvoicingService,
    PaymentsService,
    InvoicesResolver,
    PaymentsResolver,
    TariffsResolver,
  ],
  exports: [InvoicingService, PaymentsService],
})
export class BillingModule {} 