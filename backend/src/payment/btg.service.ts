import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

interface BtgTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface CreateChargeRequest {
    amount: number;
    description: string;
    externalReference: string;
}

interface CreateChargeResponse {
    id: string;
    pixCopyPaste: string;
    qrCode: string;
    expiresAt: string;
    status: string;
}

@Injectable()
export class BtgService {
    private readonly logger = new Logger(BtgService.name);
    private readonly authUrl = 'https://auth.empresas.btgpactual.com/oauth/token';
    private readonly apiUrl = 'https://api.empresas.btgpactual.com';

    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            timeout: 30000,
        });
    }

    /**
     * Obtém ou renova o token de acesso BTG
     */
    private async getAccessToken(): Promise<string> {
        // Verificar se o token ainda é válido
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
            this.logger.log('Usando token BTG existente');
            return this.accessToken;
        }

        this.logger.log('Solicitando novo token BTG...');

        try {
            const response = await this.axiosInstance.post<BtgTokenResponse>(
                this.authUrl,
                {
                    grant_type: 'client_credentials',
                    client_id: process.env.BTG_CLIENT_ID,
                    client_secret: process.env.BTG_CLIENT_SECRET,
                    scope: 'billing.charge.create billing.charge.read billing.charge.update'
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            this.accessToken = response.data.access_token;
            // Token expira em X segundos, renovar 5min antes
            const expiresInMs = (response.data.expires_in - 300) * 1000;
            this.tokenExpiry = new Date(Date.now() + expiresInMs);

            this.logger.log(`Token BTG obtido com sucesso. Expira em ${response.data.expires_in}s`);
            return this.accessToken;

        } catch (error) {
            this.logger.error('Erro ao obter token BTG:', error.response?.data || error.message);
            throw new Error('Falha na autenticação com BTG');
        }
    }

    /**
     * Cria uma cobrança PIX dinâmica
     */
    async createPixCharge(data: CreateChargeRequest): Promise<CreateChargeResponse> {
        const token = await this.getAccessToken();

        this.logger.log(`Criando cobrança PIX para: ${data.externalReference}`);

        try {
            const response = await this.axiosInstance.post(
                `${this.apiUrl}/billing/v1/charges`,
                {
                    amount: data.amount,
                    description: data.description,
                    externalReference: data.externalReference,
                    expiresIn: 900, // 15 minutos em segundos
                    paymentMethod: 'PIX'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            this.logger.log(`Cobrança PIX criada: ${response.data.id}`);

            return {
                id: response.data.id,
                pixCopyPaste: response.data.pixCopyPaste,
                qrCode: response.data.qrCode,
                expiresAt: response.data.expiresAt,
                status: response.data.status
            };

        } catch (error) {
            this.logger.error('Erro ao criar cobrança PIX:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Falha ao criar cobrança PIX');
        }
    }

    /**
     * Consulta o status de uma cobrança
     */
    async getChargeStatus(chargeId: string): Promise<{ status: string; paidAt?: string }> {
        const token = await this.getAccessToken();

        this.logger.log(`Consultando status da cobrança: ${chargeId}`);

        try {
            const response = await this.axiosInstance.get(
                `${this.apiUrl}/billing/v1/charges/${chargeId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            return {
                status: response.data.status,
                paidAt: response.data.paidAt
            };

        } catch (error) {
            this.logger.error('Erro ao consultar status:', error.response?.data || error.message);
            throw new Error('Falha ao consultar status da cobrança');
        }
    }

    /**
     * Valida assinatura do webhook (se BTG fornecer)
     */
    validateWebhookSignature(payload: any, signature: string): boolean {
        // TODO: Implementar validação de assinatura quando BTG fornecer documentação
        // Por ora, verificar se o payload tem campos essenciais
        return payload && payload.chargeId && payload.status;
    }
}
