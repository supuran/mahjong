"use client";

import { create } from "zustand";
import { persist ,createJSONStorage} from "zustand/middleware";

type Player = {
  id: number;
  name: string;
  score: number;
  isReach: boolean;
};

type Event =
  | { type: "ron"; winner: number; loser: number; point: number }
  | { type: "tsumo"; winner: number; point: number }
  | { type: "reach"; player: number }
  | { type: "ryukyoku" };

type StateSnapshot = {
  players: Player[];
  dealerIndex: number;
  kyoku: number;
  honba: number;
  kyotaku: number;
  log: string;
  event?: Event;
};

type GameState = {
  players: Player[];
  dealerIndex: number;
  kyoku: number;
  honba: number;
  kyotaku: number;
  history: StateSnapshot[];
  isEnded: boolean;
  
  
  

  nextRound: (continueDealer: boolean) => void;
  ron: (winner: number, loser: number, point: number) => void;
  tsumo: (winner: number, point: number) => void;
  ryukyoku: (tenpaiPlayers: number[]) => void;
  reach: (playerIndex: number) => void;
  undo: () => void;
  setPlayerName: (index: number, name: string) => void;
  endGame: () => void;
  resetGame: () => void;
};
const checkEnd = (players: Player[], kyoku: number) => {
  if (players.some(p => p.score < 0)) return true;

  const max = Math.max(...players.map(p => p.score));

  if (kyoku >= 8 && max >= 30000) return true;

  return false;
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      players: [
        { id: 0, name: "A", score: 25000, isReach: false },
        { id: 1, name: "B", score: 25000, isReach: false },
        { id: 2, name: "C", score: 25000, isReach: false },
        { id: 3, name: "D", score: 25000, isReach: false },
        { id: 4, name: "E", score: 25000, isReach: false },
      ],

      dealerIndex: 0,
      kyoku: 1,
      honba: 0,
      kyotaku: 0,
      history: [],
      isEnded: false,

      endGame: () => set({ isEnded: true }),

      setPlayerName: (index, name) =>
        set((state) => {
          const trimmed = name.trim();
          if (!trimmed) return state;

          const isDuplicate = state.players.some(
            (p, i) => i !== index && p.name === trimmed
          );
          if (isDuplicate) return state;

          const players = [...state.players];
          players[index] = { ...players[index], name: trimmed };
          return { players };
        }),
      resetGame: () =>
      set((state) => ({
        players: state.players.map(p => ({
        ...p,
        score: 25000,
        isReach: false,
      })),
        dealerIndex: 0,
        kyoku: 1,
        honba: 0,
        kyotaku: 0,
        history: [],
        isEnded: false,
      })),

      undo: () =>
        set((state) => {
          if (state.history.length === 0) return state;
          const prev = state.history[state.history.length - 1];
          return {
            ...state,
            ...prev,
            history: state.history.slice(0, -1),
          };
        }),

      nextRound: (continueDealer) =>
        set((state) => {
          if (state.isEnded) return state;
          const players = state.players.map((p) => ({
            ...p,
            isReach: false,
          }));
          const kyoku = continueDealer ? state.kyoku : state.kyoku + 1;
          return {
            players,
            history: [
              ...state.history,
              {
                players: state.players.map(p => ({ ...p })),
                dealerIndex: state.dealerIndex,
                kyoku: state.kyoku,
                honba: state.honba,
                kyotaku: state.kyotaku,
                log: continueDealer ? "連荘" : "親流れ",
              },
            ],
            isEnded: checkEnd(players, kyoku),
            dealerIndex: continueDealer
              ? state.dealerIndex
              : (state.dealerIndex + 1) % 5,
            kyoku: kyoku,
            honba: continueDealer ? state.honba + 1 : 0,
          };
        }),

      reach: (index) =>
        set((state) => {
          if (state.isEnded) return state;
          const p = state.players[index];
          if (p.isReach || p.score < 1000) return state;

          const players = [...state.players];
          players[index] = {
            ...p,
            score: p.score - 1000,
            isReach: true,
          };

          return {
            players,
            kyotaku: state.kyotaku + 1000,
            history: [
              ...state.history,
              {
                players: state.players.map(p => ({ ...p })),
                dealerIndex: state.dealerIndex,
                kyoku: state.kyoku,
                honba: state.honba,
                kyotaku: state.kyotaku,
                log: `リーチ：${p.name}`,
                event: { type: "reach", player: index },
              },
            ],
          };
        }),

      ron: (winner, loser, point) =>
        set((state) => {
          if (state.isEnded) return state;
          const players = state.players.map((p) => ({
            ...p,
            isReach: false,
          }));

          const total = point + state.honba * 300;

          players[winner].score += total + state.kyotaku;
          players[loser].score -= total;

          const dealerWin = winner === state.dealerIndex;
          const newKyoku = dealerWin ? state.kyoku : state.kyoku + 1;

          return {
            players,
            dealerIndex: dealerWin
              ? state.dealerIndex
              : (state.dealerIndex + 1) % 5,
            kyoku: newKyoku,
            honba: dealerWin ? state.honba + 1 : 0,
            kyotaku: 0,
            history: [
              ...state.history,
              {
                players: state.players.map(p => ({ ...p })),
                dealerIndex: state.dealerIndex,
                kyoku: newKyoku,
                honba: state.honba,
                kyotaku: state.kyotaku,
                log: `ロン：${state.players[winner].name} → ${state.players[loser].name}`,
                event: { type: "ron", winner, loser, point },
              },
            ],
            isEnded: checkEnd(players, newKyoku),
          };
        }),

      tsumo: (winner, point) =>
        set((state) => {
          if (state.isEnded) return state;
          const dealer = state.dealerIndex;
          const isDealerWin = winner === dealer;

          const players = state.players.map((p) => ({
            ...p,
            isReach: false,
          }));

          let totalGain = 0;

          
          const waitingIndex =
          (state.dealerIndex - 1 + state.players.length) % state.players.length;

          players.forEach((_, i) => {
            if (i === winner) return;
            if (i === waitingIndex) return;

            let pay = point;
            if (!isDealerWin && i === dealer) pay *= 2;

            pay += state.honba * 100; 

            players[i].score -= pay;
            totalGain += pay;
          });

          players[winner].score += totalGain + state.kyotaku;
          const newKyoku = isDealerWin ? state.kyoku : state.kyoku + 1;

          return {
            players,
            dealerIndex: isDealerWin ? dealer : (dealer + 1) % 5,
            kyoku: newKyoku,
            honba: isDealerWin ? state.honba + 1 : 0,
            kyotaku: 0,
            history: [
              ...state.history,
              {
                players: state.players.map(p => ({ ...p })),
                dealerIndex: state.dealerIndex,
                kyoku: newKyoku,
                honba: state.honba,
                kyotaku: state.kyotaku,
                log: `ツモ：${state.players[winner].name}`,
                event: { type: "tsumo", winner, point },
              },
            ],
            isEnded: checkEnd(players, newKyoku),
          };
        }),

      ryukyoku: (tenpai) =>
        set((state) => {
          if (state.isEnded) return state;
          const players = state.players.map((p) => ({
            ...p,
            isReach: false,
          }));

          const setTenpai = new Set(tenpai);
          const count = setTenpai.size;

          if (count !== 0 && count !== players.length) {
            const noten = players
              .map((_, i) => i)
              .filter((i) => !setTenpai.has(i));

            const pay = 3000 / noten.length;
            const gain = 3000 / count;

            noten.forEach((i) => (players[i].score -= pay));
            setTenpai.forEach((i) => (players[i].score += gain));
          }

          return {
            players,
            honba: state.honba + 1,
            history: [
              ...state.history,
              {
                players: state.players.map(p => ({ ...p })),
                dealerIndex: state.dealerIndex,
                kyoku: state.kyoku,
                honba: state.honba,
                kyotaku: state.kyotaku,
                log: "流局",
                event: { type: "ryukyoku" },
              },
            ],
            isEnded: checkEnd(players, state.kyoku),
          };
        }),
    }),
    { name: "mahjong-game" ,storage: createJSONStorage(() => localStorage),}
  )
);