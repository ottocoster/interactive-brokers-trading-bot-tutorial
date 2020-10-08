import Ib from '@stoqey/ib';
import { stock } from '@stoqey/ib/dist/contract/stock';
import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8080 });
let connected = false;

const options = { port: 4001 };
const connection = new Ib(options);

let tickerId = 6000;
const contract = stock('AAPL', undefined, 'USD');

connection.on('connected', () => {
    connected = true;
    console.log('Connected!');
});

connection.on('disconnected', () => {
    connected = false;
    console.log('Disconnected!');
});

connection.on('result', (event: any, args: any) => {
    console.log('%s --- %s', event, JSON.stringify(args));
});

connection.on('error', (err: any) => {
    console.error('error --- %s', err.message);
});

if (!connected) {
    connection.connect();
}

wss.on('connection', (ws: any) => {
    ws.on('message', (message: string) => {
        console.log(`Received message => ${message}`);
    });

    connection.reqHistoricalData(tickerId, contract, '', '1 M', '1 day', 'ADJUSTED_LAST', 1, 1, false);

    connection.on('historicalData', (reqId: number, date: string, open: number, high: number, low: number, close: number, volume: number, count: number, WAP: number, hasGaps: boolean) => {
        console.log('got historical data:', date, open);

        ws.send(JSON.stringify({
            t: Date.parse(`${date.substring(0,4)}-${date.substring(4,6)}-${date.substring(6,8)}`),
            o: open.toString(),
            h: high.toString(),
            l: low.toString(),
            c: close.toString(),
        }));
    });

});