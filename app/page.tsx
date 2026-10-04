"use client";

import { useGameStore } from "../store/useGameStore";
import { useState } from "react";
import ScoreChart from "../components/RankChart";

export default function Home() {
  const {
    players,
    dealerIndex,
    kyoku,
    honba,
    kyotaku,
    nextRound,
    ron,
    tsumo,
    ryukyoku,
    reach,
    undo,
    history,
    setPlayerName,
    isEnded,
    endGame,
    resetGame,
  } = useGameStore();

  const [winner, setWinner] = useState(0);
  const [loser, setLoser] = useState(1);
  const [point, setPoint] = useState(1000);
  const [tenpai, setTenpai] = useState<number[]>([]);

  const waitingIndex = (dealerIndex - 1 + players.length) % players.length;

  const getWind = (kyoku: number) => {
  const winds = ["東", "南", "西", "北"];
  const wind = winds[Math.floor((kyoku - 1) / 4)];
  const num = ((kyoku - 1) % 4) + 1;
  return `${wind}${num}`;
  };
  // ✅ 順位
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const topScore = ranked[0].score;

  // ✅ 共通ボタン
  const btn = {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
  };

  return (
    <div style={{ padding: 15, maxWidth: 700, margin: "auto" }}>
      <h1 style={{ fontSize: 24 }}>🀄 麻雀スコア管理</h1>

      {/* 状態 */}
      <div style={card}>
        <div>局: {getWind(kyoku)}</div>
        <div>親: {players[dealerIndex].name}</div>
        {isEnded && (
          <div style={{ color: "red", fontWeight: "bold" }}>
            終局
          </div>
        )}
        <div style={{ color: "gray" }}>
          抜け番: {players[waitingIndex].name}
        </div>
        <div>
          本場:{honba}　供託:{kyotaku}
        </div>
      </div>

      {/* 順位 */}
      <div style={card}>
        <h2>順位</h2>
        {ranked.map((p, rank) => {
          const diff = p.score - topScore;

          return (
            <div
              key={p.id}
              style={{
                ...row,
                background:
                  rank === 0
                    ? "#dcfce7"
                    : rank === ranked.length - 1
                    ? "#fee2e2"
                    : "white",
              }}
            >
              <div>
                {rank + 1}位 {p.name}
              </div>

              <div>
                {p.score}（{diff >= 0 ? "+" : ""}
                {diff}）
              </div>
            </div>
          );
        })}
      </div>

      {/* プレイヤー操作 */}
      <div style={card}>
        <h2>プレイヤー</h2>

        {players.map((p, index) => {
          const isWaiting = index === waitingIndex;

          return (
            <div key={p.id} style={row}>
              <div>
                <input
                  value={p.name}
                  onChange={(e) =>
                    setPlayerName(index, e.target.value)
                  }
                  style={{ width: 70 }}
                />
                {index === dealerIndex && "（親）"}
                {p.isReach && "（リーチ）"}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div>{p.score}</div>
                <button
                  style={{
                    ...btn,
                    background:
                      isWaiting || p.isReach|| isEnded
                        ? "#ccc"
                        : "#6366f1",
                    color: "white",
                  }}
                  disabled={
                    isWaiting || p.isReach || p.score < 1000 || isEnded
                  }
                  onClick={() => reach(index)}
                >
                  リーチ
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 和了 */}
      <div style={card}>
        <h2>和了</h2>

        <select
          value={winner}
          onChange={(e) => setWinner(Number(e.target.value))}
        >
          {players.map(
            (p, i) =>
              i !== waitingIndex && (
                <option key={p.id} value={i}>
                  {p.name}
                </option>
              )
          )}
        </select>

        <select
          value={loser}
          onChange={(e) => setLoser(Number(e.target.value))}
        >
          {players.map(
            (p, i) =>
              i !== waitingIndex &&
              i !== winner && (
                <option key={p.id} value={i}>
                  {p.name}
                </option>
              )
          )}
        </select>

        <input
          type="number"
          value={point}
          onChange={(e) => setPoint(Number(e.target.value))}
        />

        <div style={{ marginTop: 10 }}>
          <button
          disabled={isEnded}
            style={{ ...btn, background: "#3b82f6", color: "white" }}
            onClick={() => ron(winner, loser, point)}
          >
            ロン
          </button>

          <button
          disabled={isEnded}
            style={{
              ...btn,
              background: "#22c55e",
              color: "white",
              marginLeft: 10,
            }}
            onClick={() => tsumo(winner, point)}
          >
            ツモ(子の支払いを入力)
          </button>
        </div>
      </div>

      {/* 流局（タップUI） */}
      <div style={card}>
        <h2>流局(聴牌者選択)</h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {players.map((p, i) => {
            if (i === waitingIndex) return null;

            const selected = tenpai.includes(i);

            return (
              <button
              disabled={isEnded}
                key={p.id}
                onClick={() =>
                  selected
                    ? setTenpai(tenpai.filter(x => x !== i))
                    : setTenpai([...tenpai, i])
                }
                style={{
                  ...btn,
                  background: selected ? "#22c55e" : "white",
                  color: selected ? "white" : "black",
                  border: "2px solid #ccc",
                }}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        <button
        disabled={isEnded}
          style={{
            ...btn,
            background: "#f59e0b",
            color: "white",
            marginTop: 10,
          }}
          onClick={() => {
            ryukyoku(tenpai);
            setTenpai([]);
          }}
        >
          流局実行
        </button>
      </div>

      {/* 操作 */}
      <div style={card}>
        <button
        disabled={isEnded}
          style={{ ...btn, background: "#10b981", color: "white" }}
          onClick={() => nextRound(true)}
        >
          連荘
        </button>

        <button
        disabled={isEnded}
          style={{
            ...btn,
            background: "#6b7280",
            color: "white",
            marginLeft: 10,
          }}
          onClick={() => nextRound(false)}
        >
          親流れ
        </button>

        <button
        disabled={isEnded}
          style={{
            ...btn,
            background: "#ef4444",
            color: "white",
            marginLeft: 10,
          }}
          onClick={undo}
        >
          戻る
        </button>
      </div>

      {/* 点数グラフ */}
      <div style={card}>
        <h2>点数推移</h2>
        <ScoreChart />
      </div>

      {/* 履歴 */}
      <div style={card}>
        <h2>履歴</h2>
        {[...history].reverse().map((h, i) => (
          <div key={i}>
            <b>{h.log}</b>
            <div style={{ fontSize: 12 }}>
              局:{h.kyoku} 本場:{h.honba} 供託:{h.kyotaku}
            </div>
          </div>
        ))}
      </div>
        <button
        onClick={endGame}
          style={{
          ...btn,
          background: "#ef4444", // 赤
          color: "white",
          fontWeight: "bold",
          fontSize: "16px",
          marginTop: 10,
          borderRadius: 12,
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        }}
        >
          🟥 終局
        </button>
        {isEnded && (
        <button
          style={{
          ...btn,
          background: "#8b5cf6",
          color: "white",
          marginTop: 10,
        }}
        onClick={resetGame}
        >
        次の半荘へ
        </button>
        )}
    </div>
  );
}

/* スタイル */
const card: React.CSSProperties = {
  border: "1px solid #ccc",
  borderRadius: 12,
  padding: 10,
  marginTop: 15,
};

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: 6,
};