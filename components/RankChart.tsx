"use client";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useGameStore } from "../store/useGameStore";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

export default function ScoreChart() {
  const { history, players } = useGameStore();

  if (history.length === 0) return <div>データなし</div>;
  
  const full = [
  ...history,
  { players, event: undefined },
  ];

  const labels = full.map((_, i) => `局${i + 1}`);

  const colors = ["red", "blue", "green", "orange", "purple"];

  const datasets = players.map((p, idx) => ({
    label: p.name,
    data: full.map((h) => h.players[idx].score),
    borderColor: colors[idx],
    tension: 0.3,
    pointRadius: full.map((h: any) =>
      h.event?.type === "ron" ? 6 : 3
    ),
  }));

  const data = { labels, datasets };

  const options: any = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const event = full?.[context.dataIndex]?.event;
            
            if (!event) return context.formattedValue;

            if (event.type === "ron") {
              return `ロン ${event.point}`;
            }
            if (event.type === "tsumo") {
              return `ツモ ${event.point}`;
            }
            if (event.type === "reach") {
              return `リーチ`;
            }
            return context.formattedValue;
          },
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}