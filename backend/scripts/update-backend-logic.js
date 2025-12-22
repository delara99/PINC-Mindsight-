const fs = require('fs');

// Service Update
const servicePath = 'backend/src/big-five-config/big-five-config.service.ts';
let serviceContent = fs.readFileSync(servicePath, 'utf-8');

if (!serviceContent.includes('listInterpretativeTexts')) {
    const serviceMethods = `
    /**
     * Lista textos interpretativos de uma configuração
     */
    async listInterpretativeTexts(configId: string) {
        return this.prisma.bigFiveInterpretativeText.findMany({
            where: { configId },
            orderBy: [
                { category: 'asc' },
                { traitKey: 'asc' },
                { scoreRange: 'asc' }
            ]
        });
    }

    /**
     * Cria novo texto interpretativo
     */
    async createInterpretativeText(data: any) {
        return this.prisma.bigFiveInterpretativeText.create({
            data
        });
    }

    /**
     * Atualiza texto interpretativo
     */
    async updateInterpretativeText(id: string, data: any) {
        return this.prisma.bigFiveInterpretativeText.update({
            where: { id },
            data
        });
    }

    /**
     * Deleta texto interpretativo
     */
    async deleteInterpretativeText(id: string) {
        return this.prisma.bigFiveInterpretativeText.delete({
            where: { id }
        });
    }
`;
    // Inserir antes do último fechamento de classe
    // Procura o último '}'
    const lastBraceIndex = serviceContent.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
        serviceContent = serviceContent.slice(0, lastBraceIndex) + serviceMethods + serviceContent.slice(lastBraceIndex);
        fs.writeFileSync(servicePath, serviceContent, 'utf-8');
        console.log('Service updated');
    }
} else {
    console.log('Service already has methods');
}


// Controller Update
const controllerPath = 'backend/src/big-five-config/big-five-config.controller.ts';
let controllerContent = fs.readFileSync(controllerPath, 'utf-8');

if (!controllerContent.includes('listInterpretativeTexts')) {
    const controllerMethods = `
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
`;
    const lastBraceIndex = controllerContent.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
        controllerContent = controllerContent.slice(0, lastBraceIndex) + controllerMethods + controllerContent.slice(lastBraceIndex);
        fs.writeFileSync(controllerPath, controllerContent, 'utf-8');
        console.log('Controller updated');
    }
} else {
    console.log('Controller already has methods');
}
