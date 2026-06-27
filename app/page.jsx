"use client";

import { useEffect, useRef, useState } from "react";
import { getChain, askLive } from "@/lib/demo";

const BASIS_COLOR = {
  trace: "var(--sap)",
  entity: "var(--salesforce)",
  temporal: "var(--amber)",
  inferred: "var(--servicenow)",
};
const SYS_COLOR = { SAP: "var(--sap)", Salesforce: "var(--salesforce)", ServiceNow: "var(--servicenow)" };
const LANE_Y = { SAP: 60, Salesforce: 150, ServiceNow: 240 };
const NODE_W = 152;
const NODE_H = 48;
const X0 = 92;
const DX = 170;
const HEIGHT = 312;

export default function Page() {
  const [data, setData] = useState(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hot, setHot] = useState(null);
  const [question, setQuestion] = useState("Why did SHIP-1003 rack up so much freight cost?");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    getChain().then((d) => {
      setData(d);
      runReveal(d.decisions.length);
    });
    return () => clearInterval(timer.current);
  }, []);

  function runReveal(n) {
    clearInterval(timer.current);
    setStep(0);
    setPlaying(true);
    let s = 0;
    timer.current = setInterval(() => {
      s += 1;
      setStep(s);
      if (s >= n) {
        clearInterval(timer.current);
        setPlaying(false);
      }
    }, 650);
  }

  if (!data) {
    return (
      <div className="wrap">
        <p className="muted">Loading witness console…</p>
      </div>
    );
  }

  const decisions = data.decisions;
  const idx = {};
  decisions.forEach((d, i) => (idx[d.id] = i));
  const pos = (i) => ({ x: X0 + i * DX, y: LANE_Y[decisions[i].system] || 60 });
  const width = X0 + decisions.length * DX + 24;
  const conflictIds = data.divergence ? data.divergence.decisions : [];

  const nodeVisible = (i) => i < step;
  const edgeVisible = (e) => idx[e.from] < step && idx[e.to] < step;

  function edgePath(e) {
    const s = pos(idx[e.from]);
    const t = pos(idx[e.to]);
    const x1 = s.x + NODE_W;
    const y1 = s.y + NODE_H / 2;
    const x2 = t.x;
    const y2 = t.y + NODE_H / 2;
    const mx = (x1 + x2) / 2;
    return "M" + x1 + "," + y1 + " C" + mx + "," + y1 + " " + mx + "," + y2 + " " + x2 + "," + y2;
  }

  function focusNode(id) {
    setStep(decisions.length);
    setHot(id);
  }

  async function onAsk() {
    setAsking(true);
    let text = null;
    let live = false;
    if (data.live) {
      const res = await askLive(question);
      if (res && res.answer) {
        text = res.answer;
        live = true;
      }
    }
    if (!text) text = data.answer || "Connect a backend (and ANTHROPIC_API_KEY) for a generated narrative.";
    setAnswer({ text, live });
    setStep(decisions.length);
    setAsking(false);
  }

  function renderAnswer(text) {
    return text.split(/(\[[^\]]+\])/g).map((p, i) => {
      if (p.length > 2 && p[0] === "[" && p[p.length - 1] === "]") {
        const inner = p.slice(1, -1);
        return (
          <span key={i} className="cite" onClick={() => focusNode(inner)}>
            {inner}
          </span>
        );
      }
      return <span key={i}>{p}</span>;
    });
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand">
          <span className="dot" />
          martus<span style={{ color: "var(--faint)" }}>.ai</span>
          <span className="sub">· Turrion witness console</span>
        </div>
        <span className="modepill">
          {data.live ? "● LIVE — connected to Turrion" : "● DEMO — bundled reconstruction"}
        </span>
      </div>

      <h1>Tuesday, 7:14am. A $2.1M question.</h1>
      <p className="lede">
        Six AI agents across three systems made the decisions below overnight. Watch Turrion
        reconstruct the cross-system causal chain — and the moment two agents collide.
      </p>

      {data.divergence && (
        <div className="diverge">
          <div className="h">⚠ Divergence detected — conflicting writes</div>
          <p>
            <b>{data.divergence.who ? data.divergence.who[0] : "agent A"}</b> set{" "}
            <b>{data.divergence.field}</b> to <b>{data.divergence.values[0]}</b>, while{" "}
            <b>{data.divergence.who ? data.divergence.who[1] : "agent B"}</b> overrode it to{" "}
            <b>{data.divergence.values[1]}</b> on the same shipment. The expedite agent acted on the
            override → emergency air freight <b>{data.divergence.cost}</b>.
          </p>
        </div>
      )}

      <div className="section-title">Reconstructed causal chain</div>
      <div className="card graphcard">
        <div className="controls">
          <button className="btn primary" onClick={() => runReveal(decisions.length)} disabled={playing}>
            {playing ? "Reconstructing…" : "▶ Replay reconstruction"}
          </button>
          <span className="muted" style={{ fontSize: 13 }}>
            {Math.min(step, decisions.length)} / {decisions.length} decisions linked
          </span>
          <div className="legend">
            <span><i className="swatch" style={{ background: "var(--sap)" }} /> trace</span>
            <span><i className="swatch" style={{ background: "var(--salesforce)" }} /> entity</span>
            <span><i className="swatch" style={{ background: "var(--amber)" }} /> temporal</span>
            <span><i className="swatch" style={{ background: "var(--servicenow)" }} /> inferred</span>
            <span><i className="swatch" style={{ background: "var(--rose)" }} /> conflict</span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <svg viewBox={"0 0 " + width + " " + HEIGHT} width="100%" style={{ minWidth: width }}>
            {["SAP", "Salesforce", "ServiceNow"].map((sys) => (
              <g key={sys}>
                <line x1="80" y1={LANE_Y[sys] + NODE_H / 2} x2={width} y2={LANE_Y[sys] + NODE_H / 2}
                  stroke="var(--line-soft)" strokeDasharray="3 6" />
                <text className="lane-label" x="8" y={LANE_Y[sys] + NODE_H / 2 + 4}>{sys}</text>
              </g>
            ))}

            {data.edges.map((e, i) => {
              const conflict = e.relation === "contradicted";
              return (
                <path key={"e" + i} className="edge-path" d={edgePath(e)}
                  stroke={conflict ? "var(--rose)" : BASIS_COLOR[e.basis] || "var(--faint)"}
                  strokeWidth={conflict ? 2.6 : 2}
                  strokeDasharray={conflict ? "6 4" : "none"}
                  opacity={edgeVisible(e) ? (conflict ? 1 : 0.8) : 0} />
              );
            })}

            {decisions.map((d, i) => {
              const p = pos(i);
              const isHot = hot === d.id;
              const isConflict = conflictIds.indexOf(d.id) !== -1;
              const stroke = isConflict ? "var(--rose)" : SYS_COLOR[d.system] || "var(--faint)";
              return (
                <g key={d.id} opacity={nodeVisible(i) ? 1 : 0} style={{ transition: "opacity .4s" }}
                  onClick={() => setHot(isHot ? null : d.id)} cursor="pointer">
                  <rect className="node-rect" x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx="9"
                    fill="var(--panel-2)" stroke={stroke} strokeWidth={isHot ? 2.6 : 1.4}
                    filter={isHot ? "drop-shadow(0 0 10px " + stroke + ")" : "none"} />
                  <text className="node-text" x={p.x + 12} y={p.y + 19}>{d.actor}</text>
                  <text className="node-sub" x={p.x + 12} y={p.y + 35}>
                    {d.action} · {d.field}={d.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="section-title">Decision log</div>
      <div className="declist">
        {decisions.map((d) => {
          const isConflict = conflictIds.indexOf(d.id) !== -1;
          return (
            <div key={d.id}
              className={"decrow" + (hot === d.id ? " hot" : "") + (isConflict ? " conflict" : "")}
              onMouseEnter={() => setHot(d.id)} onMouseLeave={() => setHot(null)}>
              <div className={"sys " + d.system}>{d.system}</div>
              <div>
                <div className="act">{d.actor} — {d.action}</div>
                <div className="rat">{d.field}={d.value} · {d.rationale}</div>
              </div>
              <div className="conf">conf {Math.round((d.confidence || 0) * 100)}%</div>
            </div>
          );
        })}
      </div>

      <div className="section-title">Ask Martus</div>
      <div className="card" style={{ padding: 18 }}>
        <div className="askbox">
          <input value={question} onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAsk()} placeholder="Ask about what happened…" />
          <button className="btn primary" onClick={onAsk} disabled={asking}>
            {asking ? "Thinking…" : "Ask"}
          </button>
        </div>
        {answer && (
          <div className="answer" style={{ marginTop: 14 }}>
            {renderAnswer(answer.text)}
            <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
              {answer.live ? "Generated by Claude over the witnessed graph." :
                "Reconstructed from the witnessed graph. Click a citation to highlight its decision."}
            </div>
          </div>
        )}
      </div>

      <div className="foot">
        martus.ai · Turrion · {data.live ? "live data" : "demo data"} —
        set NEXT_PUBLIC_TURRION_API to connect a running backend.
      </div>
    </div>
  );
}
