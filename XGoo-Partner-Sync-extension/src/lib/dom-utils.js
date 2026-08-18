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
  if (!el) return false;
  return setFieldValue(el, value);
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

function adjacentLabelText(field) {
  const parts = [];
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
    ["pieces details", "pieces"],
  ];
  const nodes = Array.from(
    document.querySelectorAll("td, th, legend, caption, h1, h2, h3, h4, h5, b, strong, span, div"),
  );
  const found = [];
  for (const node of nodes) {
    const own = normalizeLabel(
      Array.from(node.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent)
        .join(" "),
    );
    const text = own || normalizeLabel(node.textContent);
    if (!text || text.length > 48) continue;
    for (const [full, key] of keys) {
      if (text === full || text.includes(full)) {
        found.push({ key, el: node });
        break;
      }
    }
  }
  return found;
}

function sectionKeyForField(field, headings) {
  const top = field.getBoundingClientRect().top + window.scrollY;
  let best = null;
  for (const heading of headings) {
    const y = heading.el.getBoundingClientRect().top + window.scrollY;
    if (y <= top + 12 && (!best || y > best.y)) best = { y, key: heading.key };
  }
  return best?.key || "";
}

function fieldsInSection(sectionKey) {
  const headings = collectSectionHeadings();
  return visibleFormFields().filter((field) => sectionKeyForField(field, headings) === sectionKey);
}

function fillSectionField(sectionKey, keywords, value) {
  if (value == null || value === "") return false;
  const headings = collectSectionHeadings();
  let fields = fieldsInSection(sectionKey);
  if (!fields.length) {
    fields = visibleFormFields().filter((field) => {
      const key = sectionKeyForField(field, headings);
      if (key === "account") return false;
      const label = adjacentLabelText(field);
      if (label.includes("client name") || label.includes("client id") || label.includes("book date")) {
        return false;
      }
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
    const label = adjacentLabelText(field);
    if (isAwbLikeField(field, label)) continue;
    if (label.includes("client name") || label.includes("client id") || label.includes("book date")) continue;
    if (!keywords.some((keyword) => label.includes(keyword.toLowerCase()))) continue;
    return setFieldValue(field, value);
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
      "position:fixed;bottom:20px;right:20px;z-index:2147483647;padding:12px 16px;font:14px system-ui,sans-serif;color:#fff;background:#111;border:2px solid #f97316;max-width:320px;box-shadow:0 4px 20px rgba(0,0,0,.35);";
    document.body.appendChild(el);
  }
  el.style.background = isError ? "#7f1d1d" : "#111";
  el.textContent = message;
  el.style.display = "block";
  setTimeout(() => {
    if (el) el.style.display = "none";
  }, 5000);
}
