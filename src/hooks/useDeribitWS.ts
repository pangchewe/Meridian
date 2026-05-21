/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from "react";

const MONTHS: { [key: string]: number } = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
};

export interface DeribitOption {
  instrument_name: string;
  strike: number;
  expiryDate: Date;
  expiryStr: string;
  daysToExpiry: number;
  type: "C" | "P";
  mark_price: number;
  bid_price: number | null;
  ask_price: number | null;
}

export function useDeribitWS() {
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [solPrice, setSolPrice] = useState<number>(85.16); // Fallback standard price from mockup
  const [btcPrice, setBtcPrice] = useState<number>(67420.25);
  const [ethPrice, setEthPrice] = useState<number>(3450.10);
  const [optionChain, setOptionChain] = useState<DeribitOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.CONNECTING || socketRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    setConnecting(true);
    setError(null);

    const wsUrl = "wss://www.deribit.com/ws/api/v2";
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      setError(null);

      // Subscribe to index price channels
      const subscribeMsg = {
        jsonrpc: "2.0",
        id: 1,
        method: "public/subscribe",
        params: {
          channels: [
            "deribit_price_index.sol_usdc",
            "deribit_price_index.btc_usd",
            "deribit_price_index.eth_usd"
          ]
        }
      };
      ws.send(JSON.stringify(subscribeMsg));

      // Fetch options book summary immediately
      fetchOptionBook(ws);

      // Poll options book summary every 30 seconds
      pollIntervalRef.current = window.setInterval(() => {
        fetchOptionBook(ws);
      }, 30000);
    };

    const fetchOptionBook = (socket: WebSocket) => {
      if (socket.readyState === WebSocket.OPEN) {
        const queryMsg = {
          jsonrpc: "2.0",
          id: 2,
          method: "public/get_book_summary_by_currency",
          params: {
            currency: "SOL",
            kind: "option"
          }
        };
        socket.send(JSON.stringify(queryMsg));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.method === "subscription") {
          const channel = msg.params.channel;
          const data = msg.params.data;

          if (channel === "deribit_price_index.sol_usdc") {
            if (data && typeof data.price === "number") {
              setSolPrice(data.price);
            }
          } else if (channel === "deribit_price_index.btc_usd") {
            if (data && typeof data.price === "number") {
              setBtcPrice(data.price);
            }
          } else if (channel === "deribit_price_index.eth_usd") {
            if (data && typeof data.price === "number") {
              setEthPrice(data.price);
            }
          }
        } else if (msg.id === 2) {
          // Response for options book summary
          if (msg.result && Array.isArray(msg.result)) {
            const rawOptions = msg.result;
            const parsedOptions: DeribitOption[] = [];

            for (const item of rawOptions) {
              const name = item.instrument_name; // e.g. "SOL-26JUN26-60-P"
              const parts = name.split("-");
              if (parts.length >= 4) {
                const expiryStr = parts[1]; // e.g. "26JUN26"
                const strikeStr = parts[2]; // e.g. "60"
                const typeStr = parts[3]; // e.g. "P"

                const day = parseInt(expiryStr.slice(0, 2), 10);
                const yearStr = expiryStr.slice(-2);
                const monthStr = expiryStr.slice(2, -2);

                const year = 2000 + parseInt(yearStr, 10);
                const month = MONTHS[monthStr.toUpperCase()];

                if (isNaN(day) || isNaN(year) || month === undefined) {
                  continue;
                }

                const expiryDate = new Date(year, month, day);
                const strike = parseFloat(strikeStr);
                const type = typeStr === "P" ? "P" : "C";

                const now = new Date();
                const daysToExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

                parsedOptions.push({
                  instrument_name: name,
                  strike,
                  expiryDate,
                  expiryStr,
                  daysToExpiry,
                  type,
                  mark_price: item.mark_price || 0,
                  bid_price: item.bid_price || null,
                  ask_price: item.ask_price || null
                });
              }
            }

            setOptionChain(parsedOptions);
          }
        }
      } catch (err) {
        console.error("Error processing Deribit message:", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, 5000);
    };

    ws.onerror = (evt) => {
      console.error("Deribit WebSocket Error:", evt);
      setError("WebSocket connection failed.");
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [connect]);

  // Clean reconnect helper if needed
  const forceReconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
  }, []);

  return {
    connected,
    connecting,
    solPrice,
    btcPrice,
    ethPrice,
    optionChain,
    error,
    forceReconnect
  };
}
