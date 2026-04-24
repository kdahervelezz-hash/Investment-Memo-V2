import { useState, useRef } from "react";
import * as XLSX from "sheetjs";

var WATCHLIST_TICKERS = [];

function TickerInput({ onAnalyze, loading }) {
  var _t = useState(""); var ticker = _t[0], setTicker = _t[1];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      <input
        value={ticker}
        onChange={function(e) { setTicker(e.target.value.toUpperCase()); }}
        onKeyDown={function(e) { if (e.key === "Enter" && ticker) onAnalyze(ticker); }}
        placeholder="Enter ticker (e.g. NVDA, AAPL, TSLA)"
        style={{ flex: 1, background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 6, padding: "12px 16px", color: "#e0ffe0", fontSize: 15, fontFamily: "'IBM Plex Mono', monospace", outline: "none", letterSpacing: 1 }}
      />
      <button
        onClick={function() { if (ticker) onAnalyze(ticker); }}
        disabled={!ticker || loading}
        style={{ background: loading ? "rgba(0,255,136,0.1)" : "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: 6, padding: "12px 24px", color: "#00ff88", fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, opacity: !ticker || loading ? 0.4 : 1 }}
      >
        {loading ? "ANALYZING..." : "ANALYZE"}
      </button>
    </div>
  );
}

function ScoreBar({ score, label }) {
  var color = score >= 70 ? "#00ff88" : score >= 40 ? "#ffaa00" : "#ff4444";
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: "#7a8a7a", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: color, fontWeight: 700 }}>{score}/100</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ height: 5, borderRadius: 3, width: score + "%", background: color, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function SignalCard({ signals, type }) {
  var isPositive = type === "bull";
  var color = isPositive ? "#00ff88" : "#ff4444";
  var icon = isPositive ? "\u25B2" : "\u25BC";
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16, flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{icon}</span> {isPositive ? "Bullish Signals" : "Bearish Signals"}
      </div>
      {(signals || []).map(function(s, i) {
        return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: color + "15", border: "1px solid " + color + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: color, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 12, color: "#e0e0e0", lineHeight: 1.5, fontWeight: 600 }}>{s.signal || s}</div>
              {s.evidence && <div style={{ fontSize: 10, color: "#7a8a7a", marginTop: 2, lineHeight: 1.4 }}>{s.evidence}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RiskCard({ risks }) {
  return (
    <div style={{ background: "rgba(255,170,0,0.03)", border: "1px solid rgba(255,170,0,0.1)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#ffaa00", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>⚠️ Key Risks</div>
      {(risks || []).map(function(r, i) {
        return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
            <div style={{ width: 4, height: 4, borderRadius: 2, background: "#ffaa00", flexShrink: 0, marginTop: 7 }} />
            <div>
              <div style={{ fontSize: 12, color: "#e0e0e0", lineHeight: 1.5, fontWeight: 600 }}>{r.risk || r}</div>
              {r.severity && <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", padding: "1px 6px", borderRadius: 3, background: r.severity === "HIGH" ? "rgba(255,68,68,0.15)" : r.severity === "MEDIUM" ? "rgba(255,170,0,0.15)" : "rgba(0,255,136,0.1)", color: r.severity === "HIGH" ? "#ff4444" : r.severity === "MEDIUM" ? "#ffaa00" : "#00ff88", marginTop: 3, display: "inline-block" }}>{r.severity}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SentimentRow({ items }) {
  var colors = { POSITIVE: "#00ff88", NEGATIVE: "#ff4444", NEUTRAL: "#7a8a7a" };
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#00ccff", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>💬 Sentiment from Recent Filings</div>
      {(items || []).map(function(it, i) {
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, padding: "6px 8px", borderRadius: 6, background: it.sentiment === "NEGATIVE" ? "rgba(255,68,68,0.04)" : "transparent" }}>
            <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: colors[it.sentiment] || "#7a8a7a", padding: "2px 6px", borderRadius: 3, background: (colors[it.sentiment] || "#7a8a7a") + "15", flexShrink: 0, marginTop: 2 }}>{it.sentiment || "NEUTRAL"}</span>
            <div>
              <div style={{ fontSize: 11, color: "#c0c0c0", lineHeight: 1.5 }}>{it.statement}</div>
              {it.source && <div style={{ fontSize: 9, color: "#5a6a5a", marginTop: 2 }}>{it.source}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LanguageChanges({ changes }) {
  if (!changes || changes.length === 0) return null;
  return (
    <div style={{ background: "rgba(136,0,255,0.03)", border: "1px solid rgba(136,0,255,0.1)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#aa66ff", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>🔄 Notable Language Changes from Prior Quarter</div>
      {changes.map(function(ch, i) {
        return (
          <div key={i} style={{ marginBottom: 10, padding: "8px 10px", borderRadius: 6, background: "rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: 11, color: "#c0c0c0", lineHeight: 1.5 }}>{ch.change}</div>
            <div style={{ fontSize: 9, color: "#5a6a5a", marginTop: 2 }}>{ch.implication}</div>
          </div>
        );
      })}
    </div>
  );
}

function Recommendation({ rec, confidence }) {
  var recColors = { watchlist: "#00ccff", "research further": "#ffaa00", "not attractive": "#ff4444" };
  var recKey = (rec || "").toLowerCase();
  var col = recColors[recKey] || "#7a8a7a";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderRadius: 10, background: col + "08", border: "1px solid " + col + "25", marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 9, color: "#7a8a7a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Recommendation</div>
        <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'IBM Plex Mono', monospace", color: col, textTransform: "uppercase", letterSpacing: 2 }}>{rec}</div>
      </div>
      <div style={{ marginLeft: "auto", textAlign: "right" }}>
        <div style={{ fontSize: 9, color: "#7a8a7a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Confidence</div>
        <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'IBM Plex Mono', monospace", color: confidence >= 70 ? "#00ff88" : confidence >= 40 ? "#ffaa00" : "#ff4444" }}>{confidence}<span style={{ fontSize: 12 }}>/100</span></div>
      </div>
    </div>
  );
}

function MemoView({ data }) {
  if (!data) return null;
  var d = data;
  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 900, color: "#00ff88" }}>{d.ticker}</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#e0ffe0", fontFamily: "'Newsreader', serif" }}>{d.company_name}</div>
          <div style={{ fontSize: 11, color: "#5a8a5a" }}>{d.sector} | {d.market_cap}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button onClick={function() { exportExcel(d); }} style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 6, padding: "8px 16px", color: "#00ff88", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer", letterSpacing: 1 }}>Download Excel (with YoY data)</button>
        <button onClick={function() { exportPDF(d); }} style={{ background: "rgba(0,204,255,0.08)", border: "1px solid rgba(0,204,255,0.2)", borderRadius: 6, padding: "8px 16px", color: "#00ccff", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer", letterSpacing: 1 }}>Download Investment Memo (PDF)</button>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#00ff88", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>📊 Financial Highlights</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
          {(d.highlights || []).map(function(h, i) {
            return (
              <div key={i} style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(0,255,136,0.03)", border: "1px solid rgba(0,255,136,0.08)" }}>
                <div style={{ fontSize: 8, color: "#5a8a5a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{h.metric}</div>
                <div style={{ fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: "#e0ffe0" }}>{h.value}</div>
                {h.change && <div style={{ fontSize: 9, color: h.change.indexOf("+") >= 0 || h.change.indexOf("up") >= 0 ? "#00ff88" : h.change.indexOf("-") >= 0 || h.change.indexOf("down") >= 0 ? "#ff4444" : "#7a8a7a" }}>{h.change}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <Recommendation rec={d.recommendation} confidence={d.confidence_score} />

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#7a8a7a", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Confidence Breakdown</div>
        <ScoreBar score={d.confidence_data_quality || 0} label="Data Quality" />
        <ScoreBar score={d.confidence_sentiment_clarity || 0} label="Sentiment Clarity" />
        <ScoreBar score={d.confidence_financial_strength || 0} label="Financial Strength" />
        <ScoreBar score={d.confidence_risk_visibility || 0} label="Risk Visibility" />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <SignalCard signals={d.bull_signals} type="bull" />
        <SignalCard signals={d.bear_signals} type="bear" />
      </div>

      <RiskCard risks={d.key_risks} />
      <SentimentRow items={d.sentiment_items} />
      <LanguageChanges changes={d.language_changes} />

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#e0ffe0", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>📝 Investment Memo</div>
        <div style={{ fontSize: 12, color: "#b0c0b0", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{d.memo}</div>
      </div>

      {d.sources && (
        <div style={{ fontSize: 9, color: "#4a5a4a", lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700, color: "#5a8a5a" }}>SOURCES: </span>{d.sources}
        </div>
      )}
    </div>
  );
}

function WatchlistPanel({ watchlist, onSelect, onRemove, alerts }) {
  if (watchlist.length === 0) return null;
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#00ccff", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>📋 Watchlist Monitor</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {watchlist.map(function(w, i) {
          var alert = alerts && alerts[w.ticker];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, background: alert ? "rgba(255,170,0,0.08)" : "rgba(0,255,136,0.04)", border: "1px solid " + (alert ? "rgba(255,170,0,0.2)" : "rgba(0,255,136,0.1)"), cursor: "pointer" }} onClick={function() { onSelect(w.ticker); }}>
              {alert && <span style={{ width: 6, height: 6, borderRadius: 3, background: "#ffaa00", flexShrink: 0 }} />}
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#e0ffe0" }}>{w.ticker}</span>
              <span style={{ fontSize: 9, color: "#5a8a5a" }}>{w.rec || ""}</span>
              <button onClick={function(e) { e.stopPropagation(); onRemove(i); }} style={{ background: "none", border: "none", color: "#ff4444", cursor: "pointer", fontSize: 12, padding: 0, marginLeft: 4 }}>x</button>
            </div>
          );
        })}
      </div>
      {alerts && Object.keys(alerts).length > 0 && (
        <div style={{ marginTop: 10 }}>
          {Object.entries(alerts).map(function(entry) {
            return (
              <div key={entry[0]} style={{ fontSize: 10, color: "#ffaa00", padding: "4px 8px", borderRadius: 4, background: "rgba(255,170,0,0.06)", marginBottom: 3 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>{entry[0]}</span>: {entry[1]}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function exportExcel(data, portVal) {
  if (!data) return;
  var wb = XLSX.utils.book_new();

  // Sheet 1: Financial Highlights with YoY
  var hlRows = [["Metric", "Current Value", "Prior Year", "Change", "Trend"]];
  (data.highlights || []).forEach(function(h) {
    var trend = "";
    if (h.change) {
      if (h.change.indexOf("+") >= 0 || h.change.toLowerCase().indexOf("up") >= 0) trend = "Improving";
      else if (h.change.indexOf("-") >= 0 || h.change.toLowerCase().indexOf("down") >= 0) trend = "Declining";
      else trend = "Stable";
    }
    hlRows.push([h.metric || "", h.value || "", h.prior_year || "N/A", h.change || "N/A", trend]);
  });
  var ws1 = XLSX.utils.aoa_to_sheet(hlRows);
  ws1["!cols"] = [{wch:22},{wch:18},{wch:18},{wch:18},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws1, "Financial Highlights");

  // Sheet 2: Bull vs Bear Signals
  var sigRows = [["Type", "#", "Signal", "Evidence"]];
  (data.bull_signals || []).forEach(function(s, i) { sigRows.push(["BULLISH", i + 1, s.signal || s, s.evidence || ""]); });
  (data.bear_signals || []).forEach(function(s, i) { sigRows.push(["BEARISH", i + 1, s.signal || s, s.evidence || ""]); });
  var ws2 = XLSX.utils.aoa_to_sheet(sigRows);
  ws2["!cols"] = [{wch:10},{wch:4},{wch:40},{wch:40}];
  XLSX.utils.book_append_sheet(wb, ws2, "Bull vs Bear");

  // Sheet 3: Key Risks
  var riskRows = [["Risk", "Severity"]];
  (data.key_risks || []).forEach(function(r) { riskRows.push([r.risk || r, r.severity || "MEDIUM"]); });
  var ws3 = XLSX.utils.aoa_to_sheet(riskRows);
  ws3["!cols"] = [{wch:50},{wch:10}];
  XLSX.utils.book_append_sheet(wb, ws3, "Key Risks");

  // Sheet 4: Sentiment Analysis
  var sentRows = [["Statement", "Sentiment", "Source"]];
  (data.sentiment_items || []).forEach(function(s) { sentRows.push([s.statement || "", s.sentiment || "", s.source || ""]); });
  var ws4 = XLSX.utils.aoa_to_sheet(sentRows);
  ws4["!cols"] = [{wch:50},{wch:12},{wch:30}];
  XLSX.utils.book_append_sheet(wb, ws4, "Sentiment");

  // Sheet 5: Language Changes
  var langRows = [["Change", "Implication"]];
  (data.language_changes || []).forEach(function(ch) { langRows.push([ch.change || "", ch.implication || ""]); });
  var ws5 = XLSX.utils.aoa_to_sheet(langRows);
  ws5["!cols"] = [{wch:45},{wch:45}];
  XLSX.utils.book_append_sheet(wb, ws5, "Language Changes");

  // Sheet 6: Summary
  var sumRows = [
    ["Company", data.company_name || ""],
    ["Ticker", data.ticker || ""],
    ["Sector", data.sector || ""],
    ["Market Cap", data.market_cap || ""],
    ["Recommendation", data.recommendation || ""],
    ["Confidence Score", (data.confidence_score || 0) + "/100"],
    ["Data Quality", (data.confidence_data_quality || 0) + "/100"],
    ["Sentiment Clarity", (data.confidence_sentiment_clarity || 0) + "/100"],
    ["Financial Strength", (data.confidence_financial_strength || 0) + "/100"],
    ["Risk Visibility", (data.confidence_risk_visibility || 0) + "/100"],
    [""],
    ["Sources", data.sources || ""],
  ];
  var ws6 = XLSX.utils.aoa_to_sheet(sumRows);
  ws6["!cols"] = [{wch:20},{wch:50}];
  XLSX.utils.book_append_sheet(wb, ws6, "Summary");

  XLSX.writeFile(wb, (data.ticker || "memo") + "_analysis.xlsx");
}

function exportPDF(data) {
  if (!data) return;
  var w = window.open("", "_blank");
  var bull = (data.bull_signals || []).map(function(s, i) {
    return "<div style='margin-bottom:8px'><b>" + (i+1) + ".</b> " + (s.signal || s) + (s.evidence ? "<br><span style='color:#666;font-size:11px'>" + s.evidence + "</span>" : "") + "</div>";
  }).join("");
  var bear = (data.bear_signals || []).map(function(s, i) {
    return "<div style='margin-bottom:8px'><b>" + (i+1) + ".</b> " + (s.signal || s) + (s.evidence ? "<br><span style='color:#666;font-size:11px'>" + s.evidence + "</span>" : "") + "</div>";
  }).join("");
  var risks = (data.key_risks || []).map(function(r) {
    return "<div style='margin-bottom:6px'>- " + (r.risk || r) + " <span style='color:" + (r.severity === "HIGH" ? "red" : r.severity === "MEDIUM" ? "orange" : "green") + ";font-size:10px;font-weight:bold'>(" + (r.severity || "MEDIUM") + ")</span></div>";
  }).join("");
  var highlights = (data.highlights || []).map(function(h) {
    return "<tr><td style='padding:4px 8px;border-bottom:1px solid #eee'>" + (h.metric || "") + "</td><td style='padding:4px 8px;border-bottom:1px solid #eee;font-weight:bold'>" + (h.value || "") + "</td><td style='padding:4px 8px;border-bottom:1px solid #eee;color:#888'>" + (h.prior_year || "N/A") + "</td><td style='padding:4px 8px;border-bottom:1px solid #eee;color:" + ((h.change || "").indexOf("+") >= 0 ? "green" : (h.change || "").indexOf("-") >= 0 ? "red" : "#333") + "'>" + (h.change || "N/A") + "</td></tr>";
  }).join("");
  var sentiment = (data.sentiment_items || []).map(function(s) {
    return "<div style='margin-bottom:6px;padding:4px 8px;background:" + (s.sentiment === "NEGATIVE" ? "#fff5f5" : s.sentiment === "POSITIVE" ? "#f5fff5" : "#f9f9f9") + ";border-radius:4px'><span style='font-size:10px;font-weight:bold;color:" + (s.sentiment === "POSITIVE" ? "green" : s.sentiment === "NEGATIVE" ? "red" : "#888") + "'>" + (s.sentiment || "") + "</span> " + (s.statement || "") + (s.source ? "<br><span style='font-size:10px;color:#999'>" + s.source + "</span>" : "") + "</div>";
  }).join("");
  var lang = (data.language_changes || []).map(function(ch) {
    return "<div style='margin-bottom:6px;padding:4px 8px;background:#f8f0ff;border-radius:4px'>" + (ch.change || "") + "<br><span style='font-size:10px;color:#666'>" + (ch.implication || "") + "</span></div>";
  }).join("");
  var recColor = (data.recommendation || "").toLowerCase() === "watchlist" ? "#0088cc" : (data.recommendation || "").toLowerCase() === "research further" ? "#cc8800" : "#cc0000";

  var html = "<!DOCTYPE html><html><head><title>" + (data.ticker || "") + " Investment Memo</title><style>body{font-family:Georgia,serif;max-width:750px;margin:40px auto;padding:0 20px;color:#222;line-height:1.6}h1{font-size:24px;margin-bottom:4px}h2{font-size:16px;color:#444;border-bottom:2px solid #eee;padding-bottom:4px;margin-top:24px}table{width:100%;border-collapse:collapse}th{text-align:left;padding:4px 8px;background:#f5f5f5;border-bottom:2px solid #ddd;font-size:12px;text-transform:uppercase;color:#666}.rec{display:inline-block;padding:6px 16px;border-radius:4px;font-weight:bold;font-size:14px;text-transform:uppercase;letter-spacing:1px}.meta{color:#888;font-size:13px}@media print{body{margin:20px}}</style></head><body>";
  html += "<h1>" + (data.company_name || data.ticker) + " (" + (data.ticker || "") + ")</h1>";
  html += "<div class='meta'>" + (data.sector || "") + " | " + (data.market_cap || "") + " | Generated " + new Date().toLocaleDateString() + "</div>";
  html += "<div style='margin:16px 0'><span class='rec' style='background:" + recColor + "22;color:" + recColor + ";border:1px solid " + recColor + "'>" + (data.recommendation || "") + "</span> <span style='font-family:monospace;font-size:18px;font-weight:bold;margin-left:12px'>" + (data.confidence_score || 0) + "/100 confidence</span></div>";
  html += "<h2>Financial Highlights</h2><table><tr><th>Metric</th><th>Current</th><th>Prior Year</th><th>Change</th></tr>" + highlights + "</table>";
  html += "<h2>Investment Memo</h2><div style='white-space:pre-wrap;font-size:13px'>" + (data.memo || "") + "</div>";
  html += "<div style='display:flex;gap:20px;margin-top:16px'><div style='flex:1'><h2 style='color:green'>Bullish Signals</h2>" + bull + "</div><div style='flex:1'><h2 style='color:red'>Bearish Signals</h2>" + bear + "</div></div>";
  html += "<h2>Key Risks</h2>" + risks;
  html += "<h2>Sentiment from Filings</h2>" + sentiment;
  if (lang) html += "<h2>Language Changes vs Prior Quarter</h2>" + lang;
  html += "<h2>Confidence Breakdown</h2><table><tr><th>Dimension</th><th>Score</th></tr><tr><td>Data Quality</td><td>" + (data.confidence_data_quality || 0) + "/100</td></tr><tr><td>Sentiment Clarity</td><td>" + (data.confidence_sentiment_clarity || 0) + "/100</td></tr><tr><td>Financial Strength</td><td>" + (data.confidence_financial_strength || 0) + "/100</td></tr><tr><td>Risk Visibility</td><td>" + (data.confidence_risk_visibility || 0) + "/100</td></tr></table>";
  html += "<div style='margin-top:24px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:8px'><b>Sources:</b> " + (data.sources || "N/A") + "<br><b>Disclaimer:</b> AI-generated analysis for educational purposes only. Not investment advice. Verify all data independently.</div>";
  html += "</body></html>";

  w.document.write(html);
  w.document.close();
  setTimeout(function() { w.print(); }, 500);
}

export default function App() {
  var _ld = useState(false); var loading = _ld[0], setLoading = _ld[1];
  var _res = useState(null); var result = _res[0], setResult = _res[1];
  var _err = useState(null); var err = _err[0], setErr = _err[1];
  var _wl = useState([]); var watchlist = _wl[0], setWatchlist = _wl[1];
  var _alerts = useState({}); var alerts = _alerts[0], setAlerts = _alerts[1];
  var _scanLd = useState(false); var scanLd = _scanLd[0], setScanLd = _scanLd[1];

  var analyze = async function(ticker) {
    setLoading(true); setErr(null); setResult(null);
    var prompt = "You are a senior equity research analyst. Analyze the stock ticker: " + ticker + "\n\nDo the following:\n1. EXTRACTION: Search Yahoo Finance, recent SEC filings, and earnings call coverage for this company. Pull key financial numbers, guidance changes, and risk language.\n2. CLASSIFICATION: Classify management statements and financial trends as POSITIVE, NEGATIVE, or NEUTRAL for business outlook.\n3. SYNTHESIS: Write a concise one-page investment memo with citations.\n\nRespond with ONLY valid JSON (no markdown):\n{\n\"ticker\": \"" + ticker + "\",\n\"company_name\": \"Full Company Name\",\n\"sector\": \"Sector\",\n\"market_cap\": \"$XXB\",\n\"highlights\": [{\"metric\": \"Revenue\", \"value\": \"$XX.XB\", \"change\": \"+X% YoY\"}],\n\"bull_signals\": [{\"signal\": \"description\", \"evidence\": \"source/data\"}],\n\"bear_signals\": [{\"signal\": \"description\", \"evidence\": \"source/data\"}],\n\"key_risks\": [{\"risk\": \"description\", \"severity\": \"HIGH|MEDIUM|LOW\"}],\n\"sentiment_items\": [{\"statement\": \"quote or paraphrase from filing\", \"sentiment\": \"POSITIVE|NEGATIVE|NEUTRAL\", \"source\": \"Q4 2024 Earnings Call / 10-K\"}],\n\"language_changes\": [{\"change\": \"what changed in language\", \"implication\": \"what it suggests\"}],\n\"recommendation\": \"watchlist|research further|not attractive\",\n\"confidence_score\": 75,\n\"confidence_data_quality\": 80,\n\"confidence_sentiment_clarity\": 70,\n\"confidence_financial_strength\": 75,\n\"confidence_risk_visibility\": 65,\n\"memo\": \"3-4 paragraph investment memo with key thesis, financial overview, and risks. Reference specific data points.\",\n\"sources\": \"list of sources consulted\"\n}\n\n3 bull signals, 3 bear signals, 3+ risks, 4+ sentiment items, 2+ language changes, 5+ financial highlights. All data must come from your web search results, not memory.";

    for (var att = 0; att < 3; att++) {
      try {
        if (att > 0) await new Promise(function(r) { setTimeout(r, att * 4000 + 2000); });
        var resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 8192,
            tools: [{ type: "web_search_20250305", name: "web_search" }],
            messages: [{ role: "user", content: prompt }] })
        });
        if (resp.status === 429 || resp.status === 529) { if (att < 2) continue; throw new Error("Rate limited. Wait 2 min."); }
        if (!resp.ok) throw new Error("API " + resp.status);
        var data = await resp.json(); if (!data.content) throw new Error("Empty response");
        var text = data.content.filter(function(i) { return i.type === "text"; }).map(function(i) { return i.text; }).join("\n");
        var f = text.indexOf("{"), l = text.lastIndexOf("}");
        if (f === -1 || l <= f) throw new Error("No JSON found");
        var parsed = JSON.parse(text.slice(f, l + 1));
        setResult(parsed);

        var exists = watchlist.find(function(w) { return w.ticker === parsed.ticker; });
        if (!exists) {
          setWatchlist(watchlist.concat([{ ticker: parsed.ticker, rec: parsed.recommendation, dd: new Date().toLocaleDateString() }]));
        }
        break;
      } catch (e) {
        if (att === 2) setErr(e.message || "Analysis failed");
      }
    }
    setLoading(false);
  };

  var scanWatchlist = async function() {
    if (watchlist.length === 0) return;
    setScanLd(true);
    var tickers = watchlist.map(function(w) { return w.ticker; }).join(", ");
    var prompt = "For each of these stocks: " + tickers + "\nSearch for their most recent news and earnings. For each, determine if any of these alerts apply:\n- Management tone changed (more cautious or more confident)\n- Guidance weakened or strengthened\n- Risk factors expanded in recent filings\n- Earnings call language shifted notably\n\nRespond ONLY with valid JSON object where keys are tickers and values are alert strings (empty string if no alert):\n{\"AAPL\": \"Guidance weakened: lowered Q2 revenue outlook by 5%\", \"MSFT\": \"\"}";
    try {
      var resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4096,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }] })
      });
      var data = await resp.json();
      var text = data.content.filter(function(i) { return i.type === "text"; }).map(function(i) { return i.text; }).join("\n");
      var f2 = text.indexOf("{"), l2 = text.lastIndexOf("}");
      if (f2 >= 0 && l2 > f2) {
        var alertData = JSON.parse(text.slice(f2, l2 + 1));
        var filtered = {};
        Object.keys(alertData).forEach(function(k) { if (alertData[k]) filtered[k] = alertData[k]; });
        setAlerts(filtered);
      }
    } catch (e) { console.error(e); }
    setScanLd(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050a05", color: "#e0ffe0", fontFamily: "'Newsreader', serif" }}>
      <style>{[
        "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Newsreader:ital,wght@0,400;0,700;0,800;1,400&display=swap');",
        "* { box-sizing: border-box; margin: 0; padding: 0; }",
        "@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }",
        "@keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }",
        "::selection { background: rgba(0,255,136,0.3); }",
        "input:focus { border-color: rgba(0,255,136,0.4) !important; }",
      ].join("\n")}</style>

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.008) 2px, rgba(0,255,136,0.008) 4px)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", padding: "36px 24px 60px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#00ff88", boxShadow: "0 0 8px #00ff88" }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, color: "#5a8a5a", letterSpacing: 3, textTransform: "uppercase" }}>Equity Research Terminal</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#e0ffe0", lineHeight: 1.1, fontFamily: "'Newsreader', serif" }}>Investment Memo Generator</h1>
          <p style={{ color: "#5a8a5a", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>AI-powered equity analysis with real-time data extraction, sentiment classification, and synthesis</p>
        </div>

        <WatchlistPanel watchlist={watchlist} onSelect={analyze} onRemove={function(i) { setWatchlist(watchlist.filter(function(_, j) { return j !== i; })); }} alerts={alerts} />

        {watchlist.length > 0 && (
          <button onClick={scanWatchlist} disabled={scanLd} style={{ background: "rgba(0,204,255,0.08)", border: "1px solid rgba(0,204,255,0.2)", borderRadius: 6, padding: "8px 16px", color: "#00ccff", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", cursor: scanLd ? "wait" : "pointer", marginBottom: 16, opacity: scanLd ? 0.5 : 1 }}>
            {scanLd ? "Scanning..." : "Scan Watchlist for Alerts"}
          </button>
        )}

        <TickerInput onAnalyze={analyze} loading={loading} />

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#00ff88", animation: "fadeIn 0.5s ease" }}>
              Searching filings, earnings calls, and financial data...
            </div>
            <div style={{ width: 200, height: 2, background: "rgba(0,255,136,0.1)", margin: "16px auto", borderRadius: 1, overflow: "hidden" }}>
              <div style={{ width: "40%", height: 2, background: "#00ff88", borderRadius: 1, animation: "scanline 1.5s ease infinite" }} />
            </div>
          </div>
        )}

        {err && (
          <div style={{ background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 8, padding: 14, marginBottom: 16, color: "#ff6666", fontSize: 12 }}>{err}</div>
        )}

        <MemoView data={result} />

        <div style={{ marginTop: 24, padding: "12px 16px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <p style={{ fontSize: 9, color: "#3a4a3a", lineHeight: 1.6 }}>
            This tool uses AI to extract, classify, and synthesize public financial data. It is not investment advice. All data sourced from public filings and financial websites via web search. Always verify data independently and consult a licensed financial advisor.
          </p>
        </div>
      </div>
    </div>
  );
}
