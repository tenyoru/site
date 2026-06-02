import { $$ } from "./dom.js";

// Decode a Cloudflare-obfuscated email: each byte is XOR'd with the leading
// key byte.
const decode = (hex) => {
  let out = "";
  const key = parseInt(hex.substr(0, 2), 16);
  for (let i = 2; i < hex.length; i += 2) {
    out += String.fromCharCode(parseInt(hex.substr(i, 2), 16) ^ key);
  }
  return out;
};

/**
 * Decode Cloudflare-obfuscated emails. Cloudflare's own decoder runs only on a
 * full page load, so addresses injected by the router are decoded here.
 */
export const decodeCloudflareEmails = (root = document) => {
  $$("[data-cfemail]", root).forEach((el) => {
    const email = decode(el.dataset.cfemail);
    el.textContent = email;
    el.classList.remove("__cf_email__");
    const link = el.closest('a[href*="email-protection"]') || (el.tagName === "A" ? el : null);
    if (link) link.href = "mailto:" + email;
  });
};
