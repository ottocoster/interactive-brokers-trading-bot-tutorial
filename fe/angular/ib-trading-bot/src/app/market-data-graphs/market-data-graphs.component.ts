import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

declare const Chart;
declare const luxon;

export interface CandlestickData {
    reqId: number;
    t: number;
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
  messageArray: CandlestickData[] = [];

  constructor() { }

  ngOnInit() {
    this.startWebSocketClient();

    this.webSocketMessage$.subscribe((message: string) => {
      const parsedMessage: CandlestickData = JSON.parse(message);
      this.messageArray.push(parsedMessage);

      // Check when data for a certain graph has finished, if so, render the graph
      if (parsedMessage.t === null) {
        if (parsedMessage.reqId === 6000) {
          this.renderGraph(
            this.messageArray
              .filter(candlestick => candlestick.t > 0)
              .filter(candlestick => candlestick.reqId === 6000), 'chart3M1D');
        }

        if (parsedMessage.reqId === 6001) {
          this.renderGraph(
            this.messageArray
            .filter(candlestick => candlestick.t > 0)
            .filter(candlestick => candlestick.reqId === 6001), 'chart1W1H');
        }

        if (parsedMessage.reqId === 6002) {
          this.renderGraph(
            this.messageArray
              .filter(candlestick => candlestick.t > 0)
              .filter(candlestick => candlestick.reqId === 6002), 'chart1H1m');
        }
      }

      // Live 5 sec bar graph
      if (parsedMessage.reqId === 6003) {
        this.renderGraph(
          this.messageArray
            .filter(candlestick => candlestick.t > 0)
            .filter(candlestick => candlestick.reqId === 6003), 'chart5s');
      }

    });
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

  renderGraph(data: CandlestickData[], element: string): void {
    const barCount = 60;
    const initialDateStr = '01 Apr 2017 00:00 Z';

    const ctx = (document.getElementById(element) as any).getContext('2d');
    ctx.canvas.width = 600;
    ctx.canvas.height = 400;

    const chart = new Chart(ctx, {
      type: 'candlestick',
      data: {
        datasets: [{
          label: element,
          data: data
        }]
      }
    });
  }
}
