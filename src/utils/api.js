import axios from 'axios';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import EncHex from 'crypto-js/enc-hex';

const API_KEY = import.meta.env.VITE_BYBIT_API_KEY;
const API_SECRET = import.meta.env.VITE_BYBIT_API_SECRET;
const BASE_URL = 'https://api.bybit.com';

// Obtener timestamp del servidor de Bybit
async function getServerTime() {
    try {
        const response = await axios.get(`${BASE_URL}/v5/market/time`);
        const serverTime = response.data.result?.timeSecond
            ? (parseInt(response.data.result.timeSecond) * 1000).toString()
            : response.data.time?.toString();
        if (!serverTime) {
            throw new Error('No se recibió timestamp del servidor');
        }
        return serverTime;
    } catch (error) {
        console.error('Error fetching server time:', error.message);
        return Date.now().toString(); // Fallback
    }
}

function generateSignature(params, secret) {
    if (!params || !secret) {
        throw new Error('Parámetros o secreto no definidos');
    }
    const queryString = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    return HmacSHA256(queryString, secret).toString(EncHex);
}

// Función para obtener transacciones en un rango específico
async function fetchTransactionsInRange(endpoint, startTime, endTime, extraParams = {}) {
    const allTransactions = [];
    let cursor = '';

    do {
        const timestamp = await getServerTime();
        if (!timestamp) {
            throw new Error('Timestamp no válido');
        }

        const params = {
            api_key: API_KEY,
            timestamp: timestamp,
            recv_window: '5000',
            limit: '50',
            startTime: startTime,
            endTime: endTime,
            ...extraParams,
        };

        if (cursor) {
            params.cursor = cursor;
        }

        const signature = generateSignature(params, API_SECRET);
        params.sign = signature;

        try {
            const response = await axios.get(`${BASE_URL}${endpoint}`, { params });
            console.log(`Raw response for ${endpoint} (cursor: ${cursor || 'none'}, start: ${startTime}, end: ${endTime}):`, response.data);

            if (response.data.retCode !== 0) {
                console.error(`API Error: ${response.data.retMsg}`);
                return allTransactions;
            }

            const transactions = response.data.result?.rows || [];
            console.log(`Transactions fetched in this batch:`, transactions);

            allTransactions.push(...transactions.map(tx => ({
                ...tx,
                date: tx.successAt || tx.createTime
                    ? new Date(parseInt(tx.successAt || tx.createTime)).toLocaleString()
                    : 'N/A',
            })));

            cursor = response.data.result.nextPageCursor || '';
            console.log(`Next page cursor: ${cursor}`);

        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error.response?.data || error.message);
            return allTransactions;
        }
    } while (cursor);

    return allTransactions;
}

// Función principal para dividir el rango y combinar resultados
export async function fetchTransactions(endpoint, extraParams = {}) {
    if (!API_KEY || !API_SECRET) {
        throw new Error('API_KEY o API_SECRET no están definidos en .env');
    }

    const allTransactions = [];
    const endDate = new Date(); // Fecha actual
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Restar 30 días
    

    
    const intervalMs = 31 * 24 * 60 * 60 * 1000; // 31 días en milisegundos

    let currentStart = startDate.getTime();
    const finalEnd = endDate.getTime();

    while (currentStart < finalEnd) {
        const currentEnd = Math.min(currentStart + intervalMs, finalEnd);
        console.log(`Fetching range: ${new Date(currentStart).toLocaleString()} - ${new Date(currentEnd).toLocaleString()}`);

        const transactions = await fetchTransactionsInRange(
            endpoint,
            currentStart.toString(),
            currentEnd.toString(),
            extraParams
        );
        allTransactions.push(...transactions);

        currentStart = currentEnd + 1; // Avanzar al siguiente intervalo
    }

    console.log(`Total transactions fetched for ${endpoint}:`, allTransactions);
    return allTransactions;
}