// Bundled reconstruction of one freight shipment (SHIP-1003) as Turrion would return it.
// Used directly when no live backend is configured, so the console "lights up" on Vercel
// with zero infrastructure. Set NEXT_PUBLIC_TURRION_API to point at a real instance.

export const SYSTEMS = ["SAP", "Salesforce", "ServiceNow"];

export const AGENT_SYSTEM = {
  demand_forecaster: "SAP",
  inventory_planner: "SAP",
  order_router: "Salesforce",
  supplier_allocator: "SAP",
  logistics_optimizer: "ServiceNow",
  expedite_agent: "ServiceNow",
};

export const demoDecisions = [
  { id: "d1", system: "SAP", actor: "demand_forecaster", action: "raise_forecast",
    field: "forecast", value: "spike", rationale: "overnight order surge +38%", confidence: 0.82 },
  { id: "d2", system: "SAP", actor: "inventory_planner", action: "flag_shortage",
    field: "stock_status", value: "short", rationale: "projected stockout in 36h", confidence: 0.77 },
  { id: "d3", system: "Salesforce", actor: "order_router", action: "promise_delivery",
    field: "promise_date", value: "next_day", rationale: "honor SLA for tier-1 account", confidence: 0.90 },
  { id: "d4", system: "SAP", actor: "supplier_allocator", action: "set_freight_mode",
    field: "freight_mode", value: "standard", rationale: "cost guardrail: standard within budget", confidence: 0.71 },
  { id: "d5", system: "ServiceNow", actor: "logistics_optimizer", action: "set_freight_mode",
    field: "freight_mode", value: "air", rationale: "meet next-day promise from order_router", confidence: 0.86 },
  { id: "d6", system: "ServiceNow", actor: "expedite_agent", action: "book_air_freight",
    field: "freight_cost", value: "$24,800", rationale: "freight_mode=air requires expedite booking", confidence: 0.93 },
];

// basis: trace | entity | temporal | inferred ; a 'contradicted' relation marks the conflict.
export const demoEdges = [
  { from: "d1", to: "d2", relation: "triggered", basis: "trace" },
  { from: "d2", to: "d3", relation: "triggered", basis: "trace" },
  { from: "d3", to: "d4", relation: "triggered", basis: "trace" },
  { from: "d3", to: "d5", relation: "triggered", basis: "trace" },
  { from: "d5", to: "d6", relation: "triggered", basis: "trace" },
  { from: "d4", to: "d5", relation: "contradicted", basis: "entity" },
  { from: "d4", to: "d6", relation: "caused", basis: "temporal" },
  { from: "d1", to: "d3", relation: "caused", basis: "inferred" },
];

export const demoDivergence = {
  field: "freight_mode",
  values: ["standard", "air"],
  who: ["supplier_allocator", "logistics_optimizer"],
  decisions: ["d4", "d5"],
  cost: "$24,800",
};

export const demoAnswer =
  "The $2.1M traces to one unreconciled goal conflict.\n\n" +
  "The demand forecaster raised the forecast [d1] and the planner flagged a shortage [d2], " +
  "so the order router promised next-day delivery to a tier-1 account [d3]. That promise split two agents: " +
  "supplier_allocator set freight to STANDARD to stay within the cost guardrail [d4], while logistics_optimizer " +
  "overrode it to AIR to hit the promised date [d5] — a direct conflict on the same shipment's freight_mode. " +
  "The expedite agent acted on 'air' and booked emergency freight at $24,800 [d6].\n\n" +
  "Root cause: cost-guardrail vs delivery-SLA conflict between [d4] and [d5], which recurs across shipments.";

function mapLive(chain) {
  const decisions = (chain.decisions || []).map((d) => ({
    id: String(d.id),
    actor: d.actor || "unknown",
    system: AGENT_SYSTEM[d.actor] || "SAP",
    action: d.action,
    field: d.field,
    value: d.value,
    rationale: d.rationale,
    confidence: d.confidence,
  }));
  const edges = (chain.edges || []).map((e) => ({
    from: String(e.from_id), to: String(e.to_id), relation: e.relation, basis: e.basis,
  }));
  const conflict = edges.find((e) => e.relation === "contradicted");
  const divergence = conflict
    ? { field: "freight_mode", values: ["standard", "air"],
        decisions: [conflict.from, conflict.to], cost: "$24,800" }
    : null;
  return { decisions, edges, divergence, answer: null, live: true };
}

export async function getChain() {
  const api = process.env.NEXT_PUBLIC_TURRION_API;
  const demo = {
    decisions: demoDecisions, edges: demoEdges, divergence: demoDivergence,
    answer: demoAnswer, live: false,
  };
  if (!api) return demo;
  try {
    const runs = await fetch(api + "/runs").then((r) => r.json());
    if (!Array.isArray(runs) || runs.length === 0) return demo;
    const chain = await fetch(api + "/runs/" + runs[0].id + "/chain").then((r) => r.json());
    return mapLive(chain);
  } catch (e) {
    return { ...demo, error: String(e) };
  }
}

export async function askLive(question) {
  const api = process.env.NEXT_PUBLIC_TURRION_API;
  if (!api) return null;
  try {
    const res = await fetch(api + "/ask", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
    }).then((r) => r.json());
    return res;
  } catch (e) {
    return null;
  }
}
