import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TalkingToService, TalkingToInput } from './talking-to.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('talking-to')
export class TalkingToController {
    constructor(private readonly service: TalkingToService) { }

    // Endpoint público ou protegido para testar o motor
    // Vou deixar aberto para facilitar seus testes agora via Postman/Curl, mas idealmente seria protegido
    @Post('simulate')
    simulate(@Body() scores: TalkingToInput) {
        return this.service.analyzeProfile(scores);
    }
}
