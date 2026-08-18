function setFieldValue(element, value) {
  if (!element || value == null || value === "") return false;
  const str = String(value);

  if (element instanceof HTMLSelectElement) {
    const needle = str.toLowerCase();
    const opt = Array.from(element.options).find((o) => {
      const valueText = (o.value || "").toLowerCase();
      const label = (o.textContent || "").trim().toLowerCase();
      return valueText === needle || label === needle || label.includes(needle) || (label && needle.includes(label));
    });
    if (opt) element.value = opt.value;
    else element.value = str;
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  const proto =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(element, str);
  else element.value = str;

  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new Event("blur", { bubbles: true }));
  element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Tab" }));
  return true;
}

function elementMatchesKeywords(element, keywords) {
  const parts = [
    element.name,
    element.id,
    element.getAttribute("placeholder"),
    element.getAttribute("aria-label"),
    element.getAttribute("data-testid"),
    element.className,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return keywords.some((k) => parts.includes(k.toLowerCase()));
}

function findInputByLabelKeywords(keywords) {
  const labels = document.querySelectorAll("label");
  for (const label of labels) {
    const text = (label.textContent || "").toLowerCase().replace(/\s+/g, " ");
    if (!keywords.some((k) => text.includes(k.toLowerCase()))) continue;

    const forId = label.getAttribute("for");
    if (forId) {
      const el = document.getElementById(forId);
      if (el && (el.matches("input, textarea, select") || el.isContentEditable)) return el;
    }

    const nested = label.querySelector("input, textarea, select");
    if (nested) return nested;

    const sibling = label.parentElement?.querySelector("input, textarea, select");
    if (sibling) return sibling;
  }
  return null;
}

function findInputByKeywords(keywords) {
  const byLabel = findInputByLabelKeywords(keywords);
  if (byLabel) return byLabel;

  const fields = document.querySelectorAll("input, textarea, select");
  for (const field of fields) {
    if (field.type === "hidden" || field.type === "submit" || field.type === "button") continue;
    if (elementMatchesKeywords(field, keywords)) return field;
  }
  return null;
}

function fillField(keywords, value) {
  const el = findInputByKeywords(keywords);
  if (!el || isMarkedFilled(el)) return false;
  const label = fieldLabel(el);
  if (shouldSkipPortalControl(label)) return false;
  if (!setFieldValue(el, value)) return false;
  markFilled(el);
  return true;
}

function normalizeLabel(value) {
  return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function isAwbLikeField(field, label) {
  const blob = `${label} ${field.name || ""} ${field.id || ""}`.toLowerCase();
  return /\b(awb|waybill|hawb|docket|tracking no|tracking number)\b/.test(blob);
}

function visibleFormFields(root) {
  const scope = root || document;
  return Array.from(scope.querySelectorAll("input, textarea, select")).filter((field) => {
    const type = (field.type || "").toLowerCase();
    if (["hidden", "submit", "button", "image", "checkbox", "radio", "file"].includes(type)) return false;
    if (field.disabled) return false;
    return true;
  });
}

function labelToTheLeft(field) {
  const fr = field.getBoundingClientRect();
  let best = "";
  let bestDist = Infinity;
  const candidates = document.querySelectorAll("td, th, label, span, div, b, strong");
  for (const el of candidates) {
    if (el.contains(field)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (Math.abs(r.top - fr.top) > 18) continue;
    if (r.right > fr.left + 6) continue;
    const text = normalizeLabel(el.innerText || el.textContent || "");
    if (!text || text.length > 36) continue;
    const dist = fr.left - r.right;
    if (dist >= 0 && dist < bestDist && dist < 240) {
      bestDist = dist;
      best = text;
    }
  }
  return best;
}

function adjacentLabelText(field) {
  const parts = [labelToTheLeft(field)];
  const row = field.closest("tr");
  if (row) {
    const cells = Array.from(row.querySelectorAll("td, th"));
    const cell = field.closest("td, th");
    const idx = cell ? cells.indexOf(cell) : -1;
    if (idx > 0) parts.push(cells[idx - 1].textContent || "");
    else if (cells[0] && cells[0] !== cell) parts.push(cells[0].textContent || "");
  }
  const labelled = field.closest("label");
  if (labelled) parts.push(labelled.textContent || "");
  if (field.labels) {
    Array.from(field.labels).forEach((label) => parts.push(label.textContent || ""));
  }
  let prev = field.previousElementSibling;
  if (prev) parts.push(prev.textContent || "");
  parts.push(field.getAttribute("placeholder") || "");
  parts.push(field.getAttribute("aria-label") || "");
  parts.push(field.name || "");
  parts.push(field.id || "");
  return normalizeLabel(parts.join(" "));
}

function collectSectionHeadings() {
  const keys = [
    ["account details", "account"],
    ["shipper details", "shipper"],
    ["consignee details", "consignee"],
    ["services details", "services"],
    ["shipment details", "shipment"],
    ["pieces details", "pieces"],
    ["performa details", "performa"],
    ["proforma details", "performa"],
    ["charge details", "charges"],
  ];
  const nodes = Array.from(
    document.querySelectorAll("td, th, legend, caption, h1, h2, h3, h4, h5, b, strong, span, div, label"),
  );
  const found = [];
  for (const node of nodes) {
    const text = normalizeLabel(node.innerText || node.textContent);
    if (!text || text.length > 48) continue;
    for (const [full, key] of keys) {
      if (text === full || text.includes(full)) {
        found.push({ key, el: node, rect: node.getBoundingClientRect() });
        break;
      }
    }
  }
  return found;
}

function threeColumnBands(headings) {
  const unique = [];
  const cols = headings
    .filter((heading) => heading.key === "shipper" || heading.key === "consignee" || heading.key === "services")
    .sort((a, b) => a.rect.left - b.rect.left || a.rect.width - b.rect.width);
  for (const col of cols) {
    if (unique.some((item) => item.key === col.key)) continue;
    unique.push(col);
  }
  if (unique.length < 2) return [];
  const top = Math.min(...unique.map((col) => col.rect.top));
  const sameRow = unique.filter((col) => Math.abs(col.rect.top - top) < 50);
  if (sameRow.length < 2) return [];
  sameRow.sort((a, b) => a.rect.left - b.rect.left);
  return sameRow.map((col, index) => ({
    key: col.key,
    top: col.rect.bottom,
    left: index === 0 ? col.rect.left - 24 : col.rect.left - 8,
    right: sameRow[index + 1] ? sameRow[index + 1].rect.left - 8 : col.rect.right + 520,
  }));
}

function laterSectionKey(field, headings) {
  const top = field.getBoundingClientRect().top;
  const later = headings.filter(
    (heading) =>
      ["pieces", "performa", "charges", "shipment"].includes(heading.key) && heading.rect.top <= top + 8,
  );
  if (!later.length) return "";
  later.sort((a, b) => b.rect.top - a.rect.top);
  return later[0].key;
}

function sectionKeyForField(field, headings) {
  const later = laterSectionKey(field, headings);
  if (later) return later;
  const rect = field.getBoundingClientRect();
  const cx = rect.left + Math.min(rect.width, 40) / 2;
  const top = rect.top;
  const bands = threeColumnBands(headings);
  if (bands.length) {
    const colTop = Math.min(...bands.map((band) => band.top));
    if (top >= colTop - 4) {
      const band = bands.find((item) => cx >= item.left && cx < item.right);
      if (band) return band.key;
    }
  }
  let best = null;
  for (const heading of headings) {
    const y = heading.rect.top;
    if (y <= top + 12 && (!best || y > best.y)) best = { y, key: heading.key };
  }
  return best?.key || "";
}

function sortFieldsVisual(fields) {
  return [...fields].sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    if (Math.abs(ar.top - br.top) > 10) return ar.top - br.top;
    return ar.left - br.left;
  });
}

function fillFieldByOrder(fields, index, value) {
  if (value == null || value === "") return false;
  const field = fields[index];
  if (!field) return false;
  const label = adjacentLabelText(field);
  if (isAwbLikeField(field, label)) return false;
  return setFieldValue(field, value);
}

function fieldsInSection(sectionKey) {
  const headings = collectSectionHeadings();
  return visibleFormFields().filter((field) => sectionKeyForField(field, headings) === sectionKey);
}

function fieldLabel(field) {
  return labelToTheLeft(field) || adjacentLabelText(field);
}

function shouldSkipPortalControl(label) {
  const n = normalizeLabel(label);
  if (!n) return false;
  if (n.includes("client name") || n.includes("client id") || n.includes("book date")) return true;
  if (n === "product" || n.startsWith("product ")) return true;
  if (n === "vendor" || n.startsWith("vendor ")) return true;
  if (n === "service" || n.startsWith("service ")) return true;
  if (/\b(iec|gstin|document no|document type|hsn|igst|cgst|sgst|surcharge|contract charges|item fuel|tax on fuel|item amount|item total)\b/.test(n)) {
    return true;
  }
  return false;
}

function markFilled(field) {
  if (field) field.dataset.xgooFilled = "1";
}

function isMarkedFilled(field) {
  return field?.dataset?.xgooFilled === "1";
}

function scrapeVisibleFields() {
  const headings = collectSectionHeadings();
  const fields = sortFieldsVisual(visibleFormFields()).slice(0, 150);
  return fields.map((field, index) => {
    const id = `xgoo-${index}`;
    field.setAttribute("data-xgoo-field", id);
    const type = (field.type || "").toLowerCase();
    const options =
      field.tagName === "SELECT"
        ? Array.from(field.options)
            .slice(0, 20)
            .map((option) => (option.textContent || "").trim())
            .filter(Boolean)
        : [];
    return {
      id,
      label: fieldLabel(field).slice(0, 120),
      name: String(field.name || "").slice(0, 80),
      htmlId: String(field.id || "").slice(0, 80),
      section: sectionKeyForField(field, headings) || "",
      tag: field.tagName.toLowerCase(),
      type,
      value: type === "password" ? "" : String(field.value || "").slice(0, 80),
      options,
    };
  });
}

function applyMappings(mappings) {
  let filled = 0;
  const byId = new Map();
  document.querySelectorAll("[data-xgoo-field]").forEach((field) => {
    byId.set(field.getAttribute("data-xgoo-field"), field);
  });
  for (const mapping of mappings || []) {
    if (!mapping?.fieldId || mapping.value == null || mapping.value === "") continue;
    const field = byId.get(mapping.fieldId);
    if (!field || isMarkedFilled(field)) continue;
    const label = fieldLabel(field);
    if (isAwbLikeField(field, label) || shouldSkipPortalControl(label)) continue;
    if (setFieldValue(field, mapping.value)) {
      markFilled(field);
      filled += 1;
    }
  }
  return filled;
}

function fillSectionField(sectionKey, keywords, value, opts) {
  if (value == null || value === "") return false;
  const reject = opts?.reject || [];
  const skipFilled = opts?.skipFilled !== false;
  const headings = collectSectionHeadings();
  let fields = fieldsInSection(sectionKey);
  if (!fields.length) {
    fields = visibleFormFields().filter((field) => {
      const key = sectionKeyForField(field, headings);
      if (key === "account") return false;
      const label = fieldLabel(field);
      if (shouldSkipPortalControl(label) || isAwbLikeField(field, label)) return false;
      if (!key) return true;
      return key === sectionKey;
    });
  }

  const ranked =
    sectionKey === "consignee"
      ? [...fields.filter((field) => !String(field.value || "").trim()), ...fields]
      : fields;

  const seen = new Set();
  for (const field of ranked) {
    if (seen.has(field)) continue;
    seen.add(field);
    if (skipFilled && isMarkedFilled(field)) continue;
    const label = fieldLabel(field);
    if (isAwbLikeField(field, label) || shouldSkipPortalControl(label)) continue;
    if (reject.some((item) => label.includes(String(item).toLowerCase()))) continue;
    if (!keywords.some((keyword) => label.includes(keyword.toLowerCase()))) continue;
    if (setFieldValue(field, value)) {
      markFilled(field);
      return true;
    }
  }
  return false;
}

function joinAddress(addr) {
  if (!addr) return "";
  const line = [addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
  return line || addr.address || "";
}

function showToast(message, isError) {
  const id = "xgoo-extension-toast";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.style.cssText =
      "position:fixed;bottom:20px;right:20px;z-index:2147483647;padding:12px 16px;font:14px system-ui,sans-serif;color:#fff;background:#111;border:2px solid #f97316;max-width:360px;box-shadow:0 4px 20px rgba(0,0,0,.35);";
    document.body.appendChild(el);
  }
  el.style.background = isError ? "#7f1d1d" : "#111";
  el.textContent = message;
  el.style.display = "block";
  if (el._xgooHide) clearTimeout(el._xgooHide);
  el._xgooHide = setTimeout(() => {
    if (el) el.style.display = "none";
  }, 7000);
}
