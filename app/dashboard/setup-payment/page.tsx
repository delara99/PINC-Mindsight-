'use client';
import { useState } from 'react';
import { API_URL } from '../../../src/config/api';

export default function SetupPaymentPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const createTable = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/migration/create-payment-table`, {
                method: 'POST'
            });
            const data = await res.json();
            setResult(data);
        } catch (error: any) {
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">🔧 Setup Pagamento BTG</h1>

            <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg mb-6">
                <p className="text-yellow-800">
                    <strong>⚠️ Execute apenas UMA vez!</strong><br />
                    Isso vai criar a tabela `payments` no banco de dados.
                </p>
            </div>

            <button
                onClick={createTable}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 mb-6"
            >
                {loading ? 'Criando tabela...' : '🚀 Criar Tabela Payments'}
            </button>

            {result && (
                <div className={`p-4 rounded-lg ${result.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                    <pre className="text-sm overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
