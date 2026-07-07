function setFieldValue(element, value) {
  if (!element || value == null || value === "") return false;
  const str = String(value);

  if (element instanceof HTMLSelectElement) {
    const opt = Array.from(element.options).find(
      (o) => o.value === str || o.textContent?.trim().toLowerCase() === str.toLowerCase(),
    );
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
