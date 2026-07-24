import { useState, useMemo } from "react";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceDot, ResponsiveContainer, Legend, Area,
} from "recharts";

const fmt$ = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtN = (n) => Math.round(n).toLocaleString("en-US");
const fmtPct = (n) => `${(n * 100).toFixed(1)}%`;

function Field({ label, suffix, value, onChange, step = 1, min = 0 }) {
  return (
    <label className="cvp-field">
      <span className="cvp-field-label">{label}</span>
      <div className="cvp-field-input">
        {suffix === "$" && <span className="cvp-prefix">$</span>}
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && suffix !== "$" && <span className="cvp-suffix">{suffix}</span>}
      </div>
    </label>
  );
}

function Metric({ label, value, sub, tone = "default" }) {
  return (
    <div className={`cvp-metric cvp-tone-${tone}`}>
      <div className="cvp-metric-label">{label}</div>
      <div className="cvp-metric-value">{value}</div>
      {sub && <div className="cvp-metric-sub">{sub}</div>}
    </div>
  );
}

export default function CVPDashboard() {
  const [name, setName] = useState("Aurora Roastery — Single-Origin Coffee Bags");
  const [price, setPrice] = useState(50);
  const [vc, setVc] = useState(30);
  const [fixed, setFixed] = useState(100000);
  const [volume, setVolume] = useState(8000);
  const [taxRate, setTaxRate] = useState(25);
  const [targetProfit, setTargetProfit] = useState(50000);
  const [maxUnits, setMaxUnits] = useState(15000);

  const calc = useMemo(() => {
    const cm = price - vc;
    const cmRatio = price > 0 ? cm / price : 0;
    const bepUnits = cm > 0 ? fixed / cm : Infinity;
    const bepSales = bepUnits * price;
    const mosUnits = volume - bepUnits;
    const mosValue = mosUnits * price;
    const mosPct = volume > 0 ? mosUnits / volume : 0;

    const taxFrac = Math.min(Math.max(taxRate, 0), 99) / 100;
    const preTaxTarget = taxFrac > 0 ? targetProfit / (1 - taxFrac) : targetProfit;
    const targetUnits = cm > 0 ? (fixed + preTaxTarget) / cm : Infinity;
    const targetSales = targetUnits * price;

    const preTaxProfitAtVol = volume * cm - fixed;
    const afterTaxProfitAtVol = preTaxProfitAtVol * (1 - taxFrac);

    const points = 40;
    const chartData = Array.from({ length: points + 1 }, (_, i) => {
      const x = Math.round((maxUnits / points) * i);
      return {
        units: x,
        revenue: x * price,
        totalCost: fixed + x * vc,
        fixedCost: fixed,
      };
    });

    function scenario(p, v) {
      const c = p - v;
      const bu = c > 0 ? fixed / c : Infinity;
      return { cm: c, cmRatio: p > 0 ? c / p : 0, bepUnits: bu, bepSales: bu * p };
    }

    const sensitivity = [
      { label: "Base case", price, vc, ...scenario(price, vc) },
      { label: "Price −10%", price: price * 0.9, vc, ...scenario(price * 0.9, vc) },
      { label: "Price +10%", price: price * 1.1, vc, ...scenario(price * 1.1, vc) },
      { label: "Variable cost −10%", price, vc: vc * 0.9, ...scenario(price, vc * 0.9) },
      { label: "Variable cost +10%", price, vc: vc * 1.1, ...scenario(price, vc * 1.1) },
    ];

    return {
      cm, cmRatio, bepUnits, bepSales, mosUnits, mosValue, mosPct,
      targetUnits, targetSales, preTaxProfitAtVol, afterTaxProfitAtVol,
      chartData, sensitivity, preTaxTarget,
    };
  }, [price, vc, fixed, volume, taxRate, targetProfit, maxUnits]);

  const runwayPct = Math.min(Math.max(calc.bepUnits / Math.max(volume, 1), 0), 1.4);
  const pastBreakeven = volume >= calc.bepUnits;

  return (
    <div className="cvp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .cvp-root {
          --ink: #0E1520;
          --panel: #161F2C;
          --panel-2: #1C2735;
          --hairline: #2B3646;
          --text: #EDEFF3;
          --muted: #8A93A3;
          --mint: #4FD1AE;
          --amber: #E8A33D;
          --rose: #E8607A;
          --mono: 'IBM Plex Mono', monospace;
          --display: 'Space Grotesk', sans-serif;
          --body: 'Inter', sans-serif;
          background: var(--ink);
          color: var(--text);
          font-family: var(--body);
          min-height: 100vh;
          padding: 28px;
          box-sizing: border-box;
        }
        .cvp-root * { box-sizing: border-box; }

        .cvp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--hairline);
          padding-bottom: 18px;
        }
        .cvp-eyebrow {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--mint);
          margin-bottom: 6px;
        }
        .cvp-title-input {
          font-family: var(--display);
          font-size: 26px;
          font-weight: 600;
          color: var(--text);
          background: transparent;
          border: none;
          border-bottom: 1px dashed var(--hairline);
          padding: 2px 0;
          width: 100%;
          max-width: 560px;
        }
        .cvp-title-input:focus { outline: none; border-bottom-color: var(--mint); }
        .cvp-header-note {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--muted);
          text-align: right;
        }

        .cvp-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 22px;
        }
        @media (max-width: 860px) {
          .cvp-layout { grid-template-columns: 1fr; }
        }

        .cvp-panel {
          background: var(--panel);
          border: 1px solid var(--hairline);
          border-radius: 10px;
          padding: 18px;
        }
        .cvp-panel-title {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 14px;
        }

        .cvp-field { display: block; margin-bottom: 14px; }
        .cvp-field-label {
          display: block;
          font-size: 12.5px;
          color: var(--muted);
          margin-bottom: 5px;
        }
        .cvp-field-input {
          display: flex;
          align-items: center;
          background: var(--ink);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 7px 10px;
        }
        .cvp-field-input:focus-within { border-color: var(--mint); }
        .cvp-field-input input {
          background: transparent;
          border: none;
          color: var(--text);
          font-family: var(--mono);
          font-size: 14px;
          width: 100%;
          outline: none;
        }
        .cvp-prefix, .cvp-suffix {
          font-family: var(--mono);
          font-size: 13px;
          color: var(--muted);
        }
        .cvp-prefix { margin-right: 4px; }
        .cvp-suffix { margin-left: 4px; }

        .cvp-main { display: flex; flex-direction: column; gap: 20px; }

        .cvp-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }
        .cvp-metric {
          background: var(--panel);
          border: 1px solid var(--hairline);
          border-radius: 10px;
          padding: 14px 16px;
        }
        .cvp-metric-label {
          font-size: 11.5px;
          color: var(--muted);
          margin-bottom: 6px;
        }
        .cvp-metric-value {
          font-family: var(--mono);
          font-size: 20px;
          font-weight: 600;
        }
        .cvp-metric-sub {
          font-family: var(--mono);
          font-size: 11.5px;
          color: var(--muted);
          margin-top: 4px;
        }
        .cvp-tone-mint .cvp-metric-value { color: var(--mint); }
        .cvp-tone-amber .cvp-metric-value { color: var(--amber); }
        .cvp-tone-rose .cvp-metric-value { color: var(--rose); }

        .cvp-runway-label {
          display: flex;
          justify-content: space-between;
          font-family: var(--mono);
          font-size: 11.5px;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .cvp-runway {
          position: relative;
          height: 34px;
          border-radius: 8px;
          overflow: hidden;
          background: linear-gradient(90deg, var(--rose) 0%, var(--rose) calc(100% / var(--r)), var(--mint) calc(100% / var(--r)), var(--mint) 100%);
          border: 1px solid var(--hairline);
        }
        .cvp-runway-marker {
          position: absolute;
          top: 0; bottom: 0;
          width: 2px;
          background: #fff;
        }
        .cvp-runway-marker-label {
          position: absolute;
          top: -20px;
          transform: translateX(-50%);
          font-family: var(--mono);
          font-size: 10.5px;
          color: var(--text);
          white-space: nowrap;
        }

        .cvp-chart-card { padding: 18px; }
        .cvp-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--mono);
          font-size: 12.5px;
        }
        .cvp-table th {
          text-align: right;
          font-weight: 500;
          color: var(--muted);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 10px;
          border-bottom: 1px solid var(--hairline);
        }
        .cvp-table th:first-child, .cvp-table td:first-child { text-align: left; }
        .cvp-table td {
          text-align: right;
          padding: 9px 10px;
          border-bottom: 1px solid var(--hairline);
        }
        .cvp-table tr:last-child td { border-bottom: none; }
        .cvp-table tr.base td { color: var(--mint); }
        .cvp-delta-up { color: var(--rose); }
        .cvp-delta-down { color: var(--mint); }
      `}</style>

      <div className="cvp-header">
        <div>
          <div className="cvp-eyebrow">CVP Model · Break-even &amp; Margin Dashboard</div>
          <input
            className="cvp-title-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="cvp-header-note">
          Contribution margin {fmtPct(calc.cmRatio)} · Break-even {fmtN(calc.bepUnits)} units
        </div>
      </div>

      <div className="cvp-layout">
        <div className="cvp-panel">
          <div className="cvp-panel-title">Inputs</div>
          <Field label="Selling price per unit" suffix="$" value={price} onChange={setPrice} step={0.5} />
          <Field label="Variable cost per unit" suffix="$" value={vc} onChange={setVc} step={0.5} />
          <Field label="Fixed costs (total)" suffix="$" value={fixed} onChange={setFixed} step={500} />
          <Field label="Expected sales volume" suffix="units" value={volume} onChange={setVolume} step={50} />
          <Field label="Tax rate" suffix="%" value={taxRate} onChange={setTaxRate} step={1} />
          <Field label="Target profit (after tax)" suffix="$" value={targetProfit} onChange={setTargetProfit} step={500} />
          <Field label="Chart volume range (max units)" suffix="units" value={maxUnits} onChange={setMaxUnits} step={500} />
        </div>

        <div className="cvp-main">
          <div className="cvp-metrics">
            <Metric label="Contribution margin / unit" value={fmt$(calc.cm)} sub={`Ratio ${fmtPct(calc.cmRatio)}`} tone="mint" />
            <Metric label="Break-even (units)" value={fmtN(calc.bepUnits)} sub={`${fmt$(calc.bepSales)} in sales`} tone="amber" />
            <Metric
              label="Margin of safety"
              value={fmtN(calc.mosUnits)}
              sub={`${fmt$(calc.mosValue)} · ${fmtPct(calc.mosPct)}`}
              tone={calc.mosUnits >= 0 ? "mint" : "rose"}
            />
            <Metric
              label={`Units for ${fmt$(targetProfit)} target profit`}
              value={fmtN(calc.targetUnits)}
              sub={`${fmt$(calc.targetSales)} in sales · pre-tax ${fmt$(calc.preTaxTarget)}`}
            />
            <Metric
              label="Profit at expected volume"
              value={fmt$(calc.afterTaxProfitAtVol)}
              sub={`Pre-tax ${fmt$(calc.preTaxProfitAtVol)}`}
              tone={calc.afterTaxProfitAtVol >= 0 ? "mint" : "rose"}
            />
          </div>

          <div className="cvp-panel">
            <div className="cvp-panel-title">Volume Runway — expected volume vs. break-even</div>
            <div className="cvp-runway-label">
              <span>0 units</span>
              <span>{fmtN(Math.max(volume, calc.bepUnits) * 1.15)} units</span>
            </div>
            <div
              className="cvp-runway"
              style={{ "--r": Math.max(volume, calc.bepUnits, 1) * 1.15 / Math.max(calc.bepUnits, 1) }}
            >
              <div
                className="cvp-runway-marker"
                style={{ left: `${Math.min((calc.bepUnits / (Math.max(volume, calc.bepUnits) * 1.15)) * 100, 100)}%` }}
              >
                <span className="cvp-runway-marker-label">BEP {fmtN(calc.bepUnits)}</span>
              </div>
              <div
                className="cvp-runway-marker"
                style={{ left: `${Math.min((volume / (Math.max(volume, calc.bepUnits) * 1.15)) * 100, 100)}%`, background: "#fff", opacity: 0.6 }}
              >
                <span className="cvp-runway-marker-label" style={{ top: 40 }}>Expected {fmtN(volume)}</span>
              </div>
            </div>
            <div className="cvp-metric-sub" style={{ marginTop: 26 }}>
              {pastBreakeven
                ? `Expected volume clears break-even by ${fmtN(calc.mosUnits)} units (${fmtPct(calc.mosPct)} margin of safety).`
                : `Expected volume falls short of break-even by ${fmtN(-calc.mosUnits)} units.`}
            </div>
          </div>

          <div className="cvp-panel cvp-chart-card">
            <div className="cvp-panel-title">Cost-Volume-Profit Chart</div>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={calc.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#2B3646" strokeDasharray="3 3" />
                <XAxis
                  dataKey="units"
                  tickFormatter={fmtN}
                  stroke="#8A93A3"
                  tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }}
                  label={{ value: "Units sold", position: "insideBottom", offset: -4, fill: "#8A93A3", fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => fmt$(v)}
                  stroke="#8A93A3"
                  tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{ background: "#1C2735", border: "1px solid #2B3646", borderRadius: 8, fontFamily: "IBM Plex Mono", fontSize: 12 }}
                  labelFormatter={(v) => `${fmtN(v)} units`}
                  formatter={(v, n) => [fmt$(v), n]}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
                <Area type="monotone" dataKey="fixedCost" name="Fixed cost" fill="#E8607A" fillOpacity={0.08} stroke="none" />
                <Line type="monotone" dataKey="totalCost" name="Total cost" stroke="#E8607A" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="revenue" name="Total revenue" stroke="#4FD1AE" strokeWidth={2} dot={false} />
                {Number.isFinite(calc.bepUnits) && (
                  <ReferenceLine x={calc.bepUnits} stroke="#E8A33D" strokeDasharray="4 4" label={{ value: "Break-even", position: "top", fill: "#E8A33D", fontSize: 11 }} />
                )}
                {Number.isFinite(calc.bepUnits) && (
                  <ReferenceDot x={calc.bepUnits} y={calc.bepSales} r={5} fill="#E8A33D" stroke="#0E1520" />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="cvp-panel">
            <div className="cvp-panel-title">Sensitivity Analysis — Break-even vs. ±10% price / variable cost</div>
            <table className="cvp-table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Price</th>
                  <th>Variable cost</th>
                  <th>CM / unit</th>
                  <th>CM ratio</th>
                  <th>Break-even units</th>
                  <th>Δ vs base</th>
                  <th>Break-even sales</th>
                </tr>
              </thead>
              <tbody>
                {calc.sensitivity.map((s, i) => {
                  const delta = s.bepUnits - calc.sensitivity[0].bepUnits;
                  return (
                    <tr key={s.label} className={i === 0 ? "base" : ""}>
                      <td>{s.label}</td>
                      <td>{fmt$(s.price)}</td>
                      <td>{fmt$(s.vc)}</td>
                      <td>{fmt$(s.cm)}</td>
                      <td>{fmtPct(s.cmRatio)}</td>
                      <td>{fmtN(s.bepUnits)}</td>
                      <td className={delta > 0 ? "cvp-delta-up" : delta < 0 ? "cvp-delta-down" : ""}>
                        {i === 0 ? "—" : `${delta > 0 ? "+" : ""}${fmtN(delta)}`}
                      </td>
                      <td>{fmt$(s.bepSales)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
