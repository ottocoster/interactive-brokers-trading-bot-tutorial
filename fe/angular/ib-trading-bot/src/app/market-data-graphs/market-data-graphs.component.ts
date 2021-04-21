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
          const lines = this.findSupportAndResistance(this.messageArray, 6000);

          this.renderGraph(
            this.messageArray
              .filter(candlestick => candlestick.t > 0)
              .filter(candlestick => candlestick.reqId === 6000), 'chart3M1D', lines.supportLines, lines.resistanceLines);

              console.log(lines);
        }

        if (parsedMessage.reqId === 6001) {
          const lines = this.findSupportAndResistance(this.messageArray, 6001);

          this.renderGraph(
            this.messageArray
            .filter(candlestick => candlestick.t > 0)
            .filter(candlestick => candlestick.reqId === 6001), 'chart1W1H', lines.supportLines, lines.resistanceLines);
        }

        if (parsedMessage.reqId === 6002) {
          const lines = this.findSupportAndResistance(this.messageArray, 6002);

          this.renderGraph(
            this.messageArray
              .filter(candlestick => candlestick.t > 0)
              .filter(candlestick => candlestick.reqId === 6002), 'chart1H1m', lines.supportLines, lines.resistanceLines);
        }
      }

      // Live 5 sec bar graph
      if (parsedMessage.reqId === 6003) {
        const lines = this.findSupportAndResistance(this.messageArray, 6003);

        this.renderGraph(
          this.messageArray
            .filter(candlestick => candlestick.t > 0)
            .filter(candlestick => candlestick.reqId === 6003), 'chart5s', lines.supportLines, lines.resistanceLines);
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
      this.webSocketMessage$.next(lastMessage);
    };
  }

  renderGraph(data: CandlestickData[], element: string, supportLines: CandlestickData[], resistanceLines: CandlestickData[]): void {
    const ctx = (document.getElementById(element) as any).getContext('2d');
    ctx.canvas.width = 600;
    ctx.canvas.height = 400;

    const datasets: any = [{
      label: element,
      data: data
    }];

    supportLines.forEach(supportLine =>
      datasets.push({
        type: 'line',
        label: `Support line`,
        borderColor: 'blue',
        borderWidth: 1,
        fill: false,
        data: [{
          x: supportLine.t,
          y: supportLine.l,
        },
        {
          x: Date.now(),
          y: supportLine.l,
        }]
      })
    )

    resistanceLines.forEach(resistanceLine =>
      datasets.push({
        type: 'line',
        label: `Resistance line`,
        borderColor: 'red',
        borderWidth: 1,
        fill: false,
        data: [{
          x: resistanceLine.t,
          y: resistanceLine.h,
        },
        {
          x: Date.now(),
          y: resistanceLine.h,
        }]
      })
    )

    const chart = new Chart(ctx, {
      type: 'candlestick',
      data: {
        datasets: datasets
      }
    });
  }

  findSupportAndResistance(messageArray: CandlestickData[], reqId: number) {
    const supportLines = messageArray
        .filter(candlestick => candlestick.t > 0)
        .filter(candlestick => candlestick.reqId === reqId)
        .filter((value, index, array) => {
          if (index > 0
            && index < (array.length - 2)
            && array[index - 1].l >= value.l
            && array[index + 1].l > value.l) {
            return true;
          }
        }).sort((a, b) => a.l - b.l);

    const resistanceLines = messageArray
        .filter(candlestick => candlestick.t > 0)
        .filter(candlestick => candlestick.reqId === reqId)
        .filter((value, index, array) => {
          if (index > 0
            && index < (array.length - 2)
            && array[index - 1].h <= value.h
            && array[index + 1].h < value.h) {
            return true;
          }
        }).sort((a, b) => b.h - a.h);

        const averageBarHeight = messageArray
        .filter(candlestick => candlestick.t > 0)
        .filter(candlestick => candlestick.reqId === reqId)
        .map(candlestick => candlestick.h - candlestick.l)
        .reduce((previous, current) => previous + current)
        / messageArray
          .filter(candlestick => candlestick.t > 0)
          .filter(candlestick => candlestick.reqId === reqId).length;

        const uniqueSupportLines: CandlestickData[] = [];

        supportLines.forEach((supportLine, index, array) => {
          if (index === 0) {
            uniqueSupportLines.push(supportLine);
          }
  
          if (index > 0) {
            const isUnique = uniqueSupportLines.every(uniqueSupportLine => {
              return Math.abs(supportLine.l - uniqueSupportLine.l) > 2 * averageBarHeight;
            });
  
            if (isUnique) {
              uniqueSupportLines.push(supportLine);
            }
          }
        });

        const uniqueResistanceLines: CandlestickData[] = [];

        resistanceLines.forEach((resistanceLine, index, array) => {
          if (index === 0) {
            uniqueResistanceLines.push(resistanceLine);
          }
  
          if (index > 0) {
            const isUnique = uniqueResistanceLines.every(uniqueResistanceLine => {
              return Math.abs(resistanceLine.h - uniqueResistanceLine.h) > 2 * averageBarHeight;
            });
  
            if (isUnique) {
              uniqueResistanceLines.push(resistanceLine);
            }
          }
        });

        return {
          supportLines: uniqueSupportLines,
          resistanceLines: uniqueResistanceLines
        }
  }  
}
