import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

declare const Chart;
declare const luxon;

export interface CandlestickData {
    t: string;
    o: number;
    h: number;
    l: number;
    c: number;
}

@Component({
  selector: 'app-market-data-graphs',
  templateUrl: './market-data-graphs.component.html',
  styleUrls: ['./market-data-graphs.component.css']
})
export class MarketDataGraphsComponent implements OnInit {
  webSocketConnection: WebSocket;
  webSocketMessage$ = new Subject();
  historicData: CandlestickData[];
  messageArray = [];

  constructor() { }

  ngOnInit() {
    this.startWebSocketClient();

    this.webSocketMessage$.subscribe((message: string) => {
      this.messageArray.push(JSON.parse(message));
    });

    setTimeout(() => {
      this.messageArray.pop();
      console.log('messageArray:', this.messageArray);
      this.renderGraph(this.messageArray);
    }, 10000);
  }

  startWebSocketClient() {
    const url = 'ws://localhost:8080/';
    this.webSocketConnection = new WebSocket(url);

    this.webSocketConnection.onopen = () => {
      console.log(`WebSocket connected!`);
    };

    this.webSocketConnection.onerror = error => {
      console.log(`WebSocket error: ${error}`);
    };

    this.webSocketConnection.onmessage = (messageEvent: MessageEvent) => {
      const lastMessage = (messageEvent.data as string);
      console.log(lastMessage);
      this.webSocketMessage$.next(lastMessage);
    };
  }

  renderGraph(data: CandlestickData[]): void {
    const barCount = 60;
    const initialDateStr = '01 Apr 2017 00:00 Z';

    const ctx = document.getElementById('chart').getContext('2d');
    ctx.canvas.width = 1000;
    ctx.canvas.height = 250;

    const chart = new Chart(ctx, {
      type: 'candlestick',
      data: {
        datasets: [{
          label: 'CHRT - Chart.js Corporation',
          data: data
        }]
      }
    });
  }
}
