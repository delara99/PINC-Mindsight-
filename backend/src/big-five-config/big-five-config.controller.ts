import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { BigFiveConfigService } from './big-five-config.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('big-five-config')
@UseGuards(AuthGuard('jwt'))
export class BigFiveConfigController {
    constructor(private configService: BigFiveConfigService) { }

    /**
     * Busca configuração ativa do tenant
     */
    @Get('active')
    async getActive(@Request() req) {
        return this.configService.getActiveConfig(req.user.tenantId);
    }

    /**
     * Lista todas as configurações do tenant
     */
    @Get()
    async list(@Request() req) {
        // Apenas admins podem listar
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem acessar configurações');
        }

        return this.configService.listConfigs(req.user.tenantId);
    }

    /**
     * Busca configuração específica
     */
    @Get(':id')
    async getById(@Param('id') id: string, @Request() req) {
        // Apenas admins podem visualizar
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem acessar configurações');
        }

        return this.configService.getConfig(id, req.user.tenantId);
    }

    /**
     * Cria nova configuração
     */
    @Post()
    async create(@Body() data: any, @Request() req) {
        // Apenas admins podem criar
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem criar configurações');
        }

        return this.configService.createConfig(req.user.tenantId, data);
    }

    /**
     * Atualiza configuração
     */
    @Put(':id')
    async update(@Param('id') id: string, @Body() data: any, @Request() req) {
        // Apenas admins podem atualizar
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem atualizar configurações');
        }

        return this.configService.updateConfig(id, req.user.tenantId, data);
    }

    /**
     * Ativa uma configuração
     */
    @Put(':id/activate')
    async activate(@Param('id') id: string, @Request() req) {
        // Apenas admins podem ativar
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem ativar configurações');
        }

        return this.configService.activateConfig(id, req.user.tenantId);
    }

    /**
     * Popula configuração vazia com traços da config ativa
     */
    @Post(':id/populate')
    async populate(@Param('id') id: string, @Request() req) {
        // Apenas admins podem popular
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem popular configurações');
        }

        return this.configService.populateFromActive(id, req.user.tenantId);
    }

    /**
     * Cria novo traço
     */
    @Post(':configId/traits')
    async createTrait(@Param('configId') configId: string, @Body() data: any, @Request() req) {
        // Apenas admins
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem criar traços');
        }

        return this.configService.createTrait(configId, data);
    }

    /**
     * Cria nova faceta
     */
    @Post('traits/:traitId/facets')
    async createFacet(@Param('traitId') traitId: string, @Body() data: any, @Request() req) {
        // Apenas admins
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem criar facetas');
        }

        return this.configService.createFacet(traitId, data);
    }

    /**
     * Atualiza traço
     */
    @Put('traits/:traitId')
    async updateTrait(@Param('traitId') traitId: string, @Body() data: any, @Request() req) {
        // Apenas admins
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem atualizar traços');
        }

        return this.configService.updateTrait(traitId, data);
    }

    /**
     * Atualiza faceta
     */
    @Put('facets/:facetId')
    async updateFacet(@Param('facetId') facetId: string, @Body() data: any, @Request() req) {
        // Apenas admins
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem atualizar facetas');
        }

        return this.configService.updateFacet(facetId, data);
    }

    /**
     * Lista recomendações de uma configuração
     */
    @Get(':configId/recommendations')
    async listRecommendations(@Param('configId') configId: string) {
        return this.configService.listRecommendations(configId);
    }

    /**
     * Cria recomendação
     */
    @Post('recommendations')
    async createRecommendation(@Body() data: any, @Request() req) {
        // Apenas admins
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem criar recomendações');
        }

        return this.configService.createRecommendation(data);
    }

    /**
     * Atualiza recomendação
     */
    @Put('recommendations/:id')
    async updateRecommendation(@Param('id') id: string, @Body() data: any, @Request() req) {
        // Apenas admins
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem atualizar recomendações');
        }

        return this.configService.updateRecommendation(id, data);
    }

    /**
     * Deleta recomendação
     */
    @Delete('recommendations/:id')
    async deleteRecommendation(@Param('id') id: string, @Request() req) {
        // Apenas admins
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem deletar recomendações');
        }

        return this.configService.deleteRecommendation(id);
    }

    /**
     * Corrige facetas faltantes em TODAS as configurações do tenant
     * POST /api/v1/big-five-config/fix-all-facets
     */
    @Post('fix-all-facets')
    async fixAllFacets(@Request() req) {
        // Apenas admins
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem corrigir configurações');
        }

        return this.configService.fixAllFacets(req.user.tenantId);
    }

    /**
     * RESET COMPLETO: Cria configuração Big Five do zero
     * POST /api/v1/big-five-config/reset-config
     */
    @Post('reset-config')
    async resetConfig(@Request() req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem resetar configurações');
        }

        return this.configService.createCompleteConfig(req.user.tenantId);
    }

    /**
     * Lista textos interpretativos
     */
    @Get(':configId/interpretative-texts')
    async listInterpretativeTexts(@Param('configId') configId: string, @Request() req) {
         if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Acesso negado');
         }
         return this.configService.listInterpretativeTexts(configId);
    }

    /**
     * Cria texto interpretativo
     */
    @Post('interpretative-texts')
    async createInterpretativeText(@Body() data: any, @Request() req) {
         if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Acesso negado');
         }
         return this.configService.createInterpretativeText(data);
    }

    /**
     * Atualiza texto interpretativo
     */
    @Put('interpretative-texts/:id')
    async updateInterpretativeText(@Param('id') id: string, @Body() data: any, @Request() req) {
         if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Acesso negado');
         }
         return this.configService.updateInterpretativeText(id, data);
    }

    /**
     * Deleta texto interpretativo
     */
    @Delete('interpretative-texts/:id')
    async deleteInterpretativeText(@Param('id') id: string, @Request() req) {
         if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Acesso negado');
         }
         return this.configService.deleteInterpretativeText(id);
    }
}
