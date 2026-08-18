/**
 * Courier-business formula engine (Excel / Notion style).
 * Safe expression evaluation — no arbitrary JS eval.
 */

export type CourierFormulaContext = {
  partner_rate: number;
  tariff_amount: number;
  weight: number;
  weight_kg: number;
  billed_weight: number;
  fixed_margin: number;
  percentage_margin: number;
  affiliate_margin: number;
  offer_discount: number;
  fuel_charge: number;
  handling_charge: number;
  insurance_charge: number;
  remote_area_charge: number;
  gst: number;
  transit_days: number;
  charges: number;
  margins: number;
};

export type CourierFormulaTarget =
  | "fixedMargin"
  | "percentageMargin"
  | "affiliateMargin"
  | "fuelCharge"
  | "handlingCharge"
  | "insuranceCharge"
  | "remoteAreaCharge"
  | "offerDiscount"
  | "gst"
  | "customerPrice";

export const COURIER_FORMULA_VARIABLES: Array<{
  key: keyof CourierFormulaContext;
  label: string;
  description: string;
}> = [
  { key: "partner_rate", label: "Partner rate", description: "Courier partner tariff amount" },
  { key: "weight", label: "Weight", description: "Weight slab (kg)" },
  { key: "billed_weight", label: "Billed weight", description: "Same as weight slab for tariff rows" },
  { key: "fixed_margin", label: "Fixed margin", description: "Current fixed ₹ margin" },
  { key: "percentage_margin", label: "Margin %", description: "Current percentage margin" },
  { key: "affiliate_margin", label: "Affiliate margin", description: "Affiliate ₹ margin" },
  { key: "fuel_charge", label: "Fuel charge", description: "Fuel surcharge ₹" },
  { key: "handling_charge", label: "Handling", description: "Handling charge ₹" },
  { key: "insurance_charge", label: "Insurance", description: "Insurance charge ₹" },
  { key: "remote_area_charge", label: "Remote / ODA", description: "Remote area charge ₹" },
  { key: "offer_discount", label: "Discount", description: "Offer discount ₹" },
  { key: "gst", label: "GST %", description: "GST percent" },
  { key: "charges", label: "All charges", description: "Fuel + handling + insurance + remote" },
  { key: "margins", label: "All margins", description: "Fixed + % amount + affiliate" },
  { key: "transit_days", label: "Transit days", description: "Transit / TAT days" },
];

export const COURIER_FORMULA_TEMPLATES: Array<{
  id: string;
  name: string;
  formula: string;
  target: CourierFormulaTarget;
  description: string;
}> = [
  {
    id: "pct-of-partner",
    name: "Margin as % of partner rate",
    formula: "partner_rate * 0.10",
    target: "fixedMargin",
    description: "10% of partner rate written as fixed margin ₹",
  },
  {
    id: "light-vs-heavy",
    name: "Light vs heavy margin %",
    formula: "IF(weight <= 5, 12, 8)",
    target: "percentageMargin",
    description: "12% for ≤5 kg, otherwise 8%",
  },
  {
    id: "fuel-surcharge",
    name: "Fuel surcharge 5%",
    formula: "ROUND(partner_rate * 0.05, 2)",
    target: "fuelCharge",
    description: "5% fuel on partner rate",
  },
  {
    id: "customer-landed",
    name: "Customer landed price",
    formula: "ROUND(partner_rate + partner_rate * percentage_margin / 100 + fixed_margin + charges - offer_discount, 2) * (1 + gst / 100)",
    target: "customerPrice",
    description: "Full courier price with margins, charges and GST",
  },
  {
    id: "oda-flat",
    name: "Remote area flat",
    formula: "IF(weight <= 10, 75, 150)",
    target: "remoteAreaCharge",
    description: "₹75 under 10 kg, else ₹150",
  },
];

export const COURIER_FORMULA_TARGETS: Array<{
  value: CourierFormulaTarget;
  label: string;
}> = [
  { value: "fixedMargin", label: "Fixed margin (₹)" },
  { value: "percentageMargin", label: "Margin %" },
  { value: "affiliateMargin", label: "Affiliate margin (₹)" },
  { value: "fuelCharge", label: "Fuel charge (₹)" },
  { value: "handlingCharge", label: "Handling charge (₹)" },
  { value: "insuranceCharge", label: "Insurance charge (₹)" },
  { value: "remoteAreaCharge", label: "Remote / ODA (₹)" },
  { value: "offerDiscount", label: "Offer discount (₹)" },
  { value: "gst", label: "GST %" },
  { value: "customerPrice", label: "Customer price (sets fixed margin)" },
];

function num(v: string | number | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

export function buildCourierFormulaContext(row: {
  tariffAmount?: string | number | null;
  weightMax?: string | number | null;
  fixedMargin?: string | number | null;
  percentageMargin?: string | number | null;
  affiliateMargin?: string | number | null;
  offerDiscount?: string | number | null;
  fuelCharge?: string | number | null;
  handlingCharge?: string | number | null;
  insuranceCharge?: string | number | null;
  remoteAreaCharge?: string | number | null;
  gst?: string | number | null;
  transitDays?: string | number | null;
}): CourierFormulaContext {
  const partnerRate = num(row.tariffAmount);
  const weight = num(row.weightMax);
  const fixedMargin = num(row.fixedMargin);
  const percentageMargin = num(row.percentageMargin);
  const affiliateMargin = num(row.affiliateMargin);
  const fuelCharge = num(row.fuelCharge);
  const handlingCharge = num(row.handlingCharge);
  const insuranceCharge = num(row.insuranceCharge);
  const remoteAreaCharge = num(row.remoteAreaCharge);
  const percentageMarginAmount = Math.round(((partnerRate * percentageMargin) / 100) * 100) / 100;
  const charges = fuelCharge + handlingCharge + insuranceCharge + remoteAreaCharge;
  const margins = fixedMargin + percentageMarginAmount + affiliateMargin;

  return {
    partner_rate: partnerRate,
    tariff_amount: partnerRate,
    weight,
    weight_kg: weight,
    billed_weight: weight,
    fixed_margin: fixedMargin,
    percentage_margin: percentageMargin,
    affiliate_margin: affiliateMargin,
    offer_discount: num(row.offerDiscount),
    fuel_charge: fuelCharge,
    handling_charge: handlingCharge,
    insurance_charge: insuranceCharge,
    remote_area_charge: remoteAreaCharge,
    gst: num(row.gst),
    transit_days: num(row.transitDays),
    charges,
    margins,
  };
}

type Token =
  | { type: "number"; value: number }
  | { type: "ident"; value: string }
  | { type: "op"; value: string }
  | { type: "lparen" }
  | { type: "rparen" }
  | { type: "comma" };

function tokenize(input: string): Token[] {
  const src = input.trim().replace(/^=/, "").trim();
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      const value = parseFloat(src.slice(i, j));
      if (!Number.isFinite(value)) throw new Error(`Invalid number near "${src.slice(i, j)}"`);
      tokens.push({ type: "number", value });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      tokens.push({ type: "ident", value: src.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if ("+-*/^%<>=".includes(ch)) {
      if ((ch === "<" || ch === ">" || ch === "=") && src[i + 1] === "=") {
        tokens.push({ type: "op", value: ch + "=" });
        i += 2;
        continue;
      }
      if (ch === "<" && src[i + 1] === ">") {
        tokens.push({ type: "op", value: "<>" });
        i += 2;
        continue;
      }
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen" });
      i++;
      continue;
    }
    if (ch === ",") {
      tokens.push({ type: "comma" });
      i++;
      continue;
    }
    throw new Error(`Unexpected character "${ch}" in formula`);
  }
  return tokens;
}

type Expr =
  | { kind: "number"; value: number }
  | { kind: "var"; name: string }
  | { kind: "unary"; op: string; expr: Expr }
  | { kind: "binary"; op: string; left: Expr; right: Expr }
  | { kind: "call"; name: string; args: Expr[] };

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  parse(): Expr {
    const expr = this.parseComparison();
    if (this.pos < this.tokens.length) {
      throw new Error("Unexpected tokens after formula");
    }
    return expr;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    const token = this.tokens[this.pos++];
    if (!token) throw new Error("Unexpected end of formula");
    return token;
  }

  private matchOp(...ops: string[]): string | null {
    const token = this.peek();
    if (token?.type === "op" && ops.includes(token.value)) {
      this.pos++;
      return token.value;
    }
    return null;
  }

  private parseComparison(): Expr {
    let left = this.parseAdd();
    while (true) {
      const op = this.matchOp("<", ">", "<=", ">=", "=", "<>");
      if (!op) break;
      left = { kind: "binary", op, left, right: this.parseAdd() };
    }
    return left;
  }

  private parseAdd(): Expr {
    let left = this.parseMul();
    while (true) {
      const op = this.matchOp("+", "-");
      if (!op) break;
      left = { kind: "binary", op, left, right: this.parseMul() };
    }
    return left;
  }

  private parseMul(): Expr {
    let left = this.parsePow();
    while (true) {
      const op = this.matchOp("*", "/", "%");
      if (!op) break;
      left = { kind: "binary", op, left, right: this.parsePow() };
    }
    return left;
  }

  private parsePow(): Expr {
    let left = this.parseUnary();
    const op = this.matchOp("^");
    if (op) {
      left = { kind: "binary", op, left, right: this.parsePow() };
    }
    return left;
  }

  private parseUnary(): Expr {
    const op = this.matchOp("+", "-");
    if (op) return { kind: "unary", op, expr: this.parseUnary() };
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const token = this.peek();
    if (!token) throw new Error("Unexpected end of formula");

    if (token.type === "number") {
      this.consume();
      return { kind: "number", value: token.value };
    }

    if (token.type === "ident") {
      this.consume();
      if (this.peek()?.type === "lparen") {
        this.consume();
        const args: Expr[] = [];
        if (this.peek()?.type !== "rparen") {
          args.push(this.parseComparison());
          while (this.peek()?.type === "comma") {
            this.consume();
            args.push(this.parseComparison());
          }
        }
        if (this.peek()?.type !== "rparen") throw new Error("Missing ) in function call");
        this.consume();
        return { kind: "call", name: token.value, args };
      }
      return { kind: "var", name: token.value };
    }

    if (token.type === "lparen") {
      this.consume();
      const expr = this.parseComparison();
      if (this.peek()?.type !== "rparen") throw new Error("Missing )");
      this.consume();
      return expr;
    }

    throw new Error("Invalid formula syntax");
  }
}

function evalExpr(expr: Expr, ctx: CourierFormulaContext): number {
  switch (expr.kind) {
    case "number":
      return expr.value;
    case "var": {
      if (!(expr.name in ctx)) {
        throw new Error(`Unknown variable "${expr.name}"`);
      }
      return ctx[expr.name as keyof CourierFormulaContext];
    }
    case "unary": {
      const value = evalExpr(expr.expr, ctx);
      return expr.op === "-" ? -value : value;
    }
    case "binary": {
      const left = evalExpr(expr.left, ctx);
      const right = evalExpr(expr.right, ctx);
      switch (expr.op) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          if (right === 0) throw new Error("Division by zero");
          return left / right;
        case "%":
          if (right === 0) throw new Error("Division by zero");
          return left % right;
        case "^":
          return left ** right;
        case "<":
          return left < right ? 1 : 0;
        case ">":
          return left > right ? 1 : 0;
        case "<=":
          return left <= right ? 1 : 0;
        case ">=":
          return left >= right ? 1 : 0;
        case "=":
          return Math.abs(left - right) < 0.0000001 ? 1 : 0;
        case "<>":
          return Math.abs(left - right) >= 0.0000001 ? 1 : 0;
        default:
          throw new Error(`Unsupported operator ${expr.op}`);
      }
    }
    case "call": {
      const args = expr.args.map((arg) => evalExpr(arg, ctx));
      switch (expr.name) {
        case "round":
          if (args.length < 1 || args.length > 2) throw new Error("ROUND needs 1 or 2 arguments");
          {
            const digits = args[1] ?? 0;
            const factor = 10 ** digits;
            return Math.round(args[0] * factor) / factor;
          }
        case "ceil":
          if (args.length !== 1) throw new Error("CEIL needs 1 argument");
          return Math.ceil(args[0]);
        case "floor":
          if (args.length !== 1) throw new Error("FLOOR needs 1 argument");
          return Math.floor(args[0]);
        case "abs":
          if (args.length !== 1) throw new Error("ABS needs 1 argument");
          return Math.abs(args[0]);
        case "min":
          if (args.length < 1) throw new Error("MIN needs arguments");
          return Math.min(...args);
        case "max":
          if (args.length < 1) throw new Error("MAX needs arguments");
          return Math.max(...args);
        case "if":
          if (args.length !== 3) throw new Error("IF needs 3 arguments: IF(condition, then, else)");
          return args[0] ? args[1] : args[2];
        default:
          throw new Error(`Unknown function "${expr.name.toUpperCase()}"`);
      }
    }
    default:
      throw new Error("Invalid expression");
  }
}

export function validateCourierFormula(formula: string): { ok: true } | { ok: false; error: string } {
  try {
    evaluateCourierFormula(formula, buildCourierFormulaContext({ tariffAmount: 100, weightMax: 1 }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid formula" };
  }
}

export function evaluateCourierFormula(formula: string, ctx: CourierFormulaContext): number {
  const raw = formula.trim();
  if (!raw) throw new Error("Formula is empty");
  const tokens = tokenize(raw);
  if (tokens.length === 0) throw new Error("Formula is empty");
  const expr = new Parser(tokens).parse();
  const value = evalExpr(expr, ctx);
  if (!Number.isFinite(value)) throw new Error("Formula result is not a valid number");
  return Math.round(value * 100) / 100;
}

/** Apply formula result into a tariff row field. customerPrice back-solves into fixed_margin. */
export function applyFormulaResultToRow<T extends Record<string, unknown>>(
  row: T,
  target: CourierFormulaTarget,
  result: number,
): T {
  const value = String(Math.round(result * 100) / 100);
  if (target === "customerPrice") {
    const partnerRate = num(row.tariffAmount as string | number | null);
    const pct = num(row.percentageMargin as string | number | null);
    const percentPart = Math.round(((partnerRate * pct) / 100) * 100) / 100;
    const charges =
      num(row.fuelCharge as string | number | null) +
      num(row.handlingCharge as string | number | null) +
      num(row.insuranceCharge as string | number | null) +
      num(row.remoteAreaCharge as string | number | null);
    const affiliate = num(row.affiliateMargin as string | number | null);
    const discount = num(row.offerDiscount as string | number | null);
    const gst = Math.max(0, num(row.gst as string | number | null));
    // result = (partner + fixed + % + affiliate + charges - discount) * (1 + gst/100)
    const subtotalTarget = gst > 0 ? result / (1 + gst / 100) : result;
    const fixed =
      subtotalTarget - partnerRate - percentPart - affiliate - charges + discount;
    return {
      ...row,
      fixedMargin: String(Math.round(Math.max(0, fixed) * 100) / 100),
    };
  }

  const fieldMap: Record<Exclude<CourierFormulaTarget, "customerPrice">, string> = {
    fixedMargin: "fixedMargin",
    percentageMargin: "percentageMargin",
    affiliateMargin: "affiliateMargin",
    fuelCharge: "fuelCharge",
    handlingCharge: "handlingCharge",
    insuranceCharge: "insuranceCharge",
    remoteAreaCharge: "remoteAreaCharge",
    offerDiscount: "offerDiscount",
    gst: "gst",
  };
  return { ...row, [fieldMap[target]]: value };
}
