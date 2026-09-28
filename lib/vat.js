/**
 * VAT number helpers: normalisation, Belgian checksum, VIES lookup
 * and Peppol reachability via Billit.
 */

import { getPeppolParticipant } from "@/lib/billit";

const VIES_URL = "https://ec.europa.eu/taxation_customs/vies/rest-api/ms";

// Country codes known to VIES (Greece uses EL)
const VIES_COUNTRIES = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR",
  "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK", "XI",
];

/**
 * Normalise user input to { country, number }.
 * "be 0123.456.789" -> { country: "BE", number: "0123456789" }
 * Input without country prefix is treated as Belgian.
 */
export function parseVATNumber(input) {
  const cleaned = (input || "").replace(/[\s.\-/]/g, "").toUpperCase();
  const match = cleaned.match(/^([A-Z]{2})?([0-9A-Z]+)$/);
  if (!match) return null;

  // Greece is "EL" in VIES
  const country = match[1] === "GR" ? "EL" : match[1] || "BE";
  let number = match[2];

  if (!VIES_COUNTRIES.includes(country)) return null;
  if (number.length < 8 || number.length > 12 || !/\d/.test(number)) return null;

  // Old 9-digit Belgian numbers get a leading 0
  if (country === "BE" && /^\d{9}$/.test(number)) {
    number = "0" + number;
  }

  return { country, number, formatted: `${country}${number}` };
}

/**
 * Belgian VAT/enterprise numbers: 10 digits, start with 0 or 1,
 * last 2 digits = 97 - (first 8 digits mod 97).
 */
export function isValidBelgianChecksum(number) {
  if (!/^[01]\d{9}$/.test(number)) return false;
  const base = parseInt(number.slice(0, 8), 10);
  const check = parseInt(number.slice(8), 10);
  return 97 - (base % 97) === check;
}

/**
 * Check a VAT number against the EU VIES service.
 * Returns { valid: true|false|null, name, address } — null when VIES is unavailable.
 */
export async function checkVIES(country, number, retries = 1) {
  const result = await requestVIES(country, number);
  if (result.valid === null && retries > 0) {
    // VIES regularly rejects bursts of requests; one retry usually helps
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return checkVIES(country, number, retries - 1);
  }
  return result;
}

async function requestVIES(country, number) {
  try {
    const response = await fetch(`${VIES_URL}/${country}/vat/${number}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { valid: null };

    const data = await response.json();
    if (data.userError && !["VALID", "INVALID"].includes(data.userError)) {
      // MS_UNAVAILABLE, TIMEOUT, etc.
      return { valid: null };
    }

    const clean = (value) => (value && value !== "---" ? value.trim() : null);
    return {
      valid: data.isValid === true,
      name: clean(data.name),
      address: clean(data.address),
    };
  } catch (error) {
    console.error("[VAT] VIES lookup failed:", error.message);
    return { valid: null };
  }
}

/**
 * Full check used by the order wizard.
 * status: "valid" | "invalid" | "unverified" (VIES down, checksum ok)
 * peppol: true | false | null (null = lookup failed / not applicable)
 */
export async function validateVATNumber(input) {
  const parsed = parseVATNumber(input);
  if (!parsed) {
    return { status: "invalid", reason: "format" };
  }

  const { country, number, formatted } = parsed;

  if (country === "BE" && !isValidBelgianChecksum(number)) {
    return { status: "invalid", reason: "checksum", formatted, country };
  }

  const [vies, peppol] = await Promise.all([
    checkVIES(country, number),
    // Belgian companies are addressed on Peppol by enterprise number (scheme 0208)
    country === "BE"
      ? getPeppolParticipant(`0208:${number}`)
      : getPeppolParticipant(`9925:${formatted}`),
  ]);

  if (vies.valid === false) {
    return { status: "invalid", reason: "vies", formatted, country, peppol };
  }

  return {
    status: vies.valid ? "valid" : "unverified",
    formatted,
    country,
    name: vies.name || null,
    address: vies.address || null,
    peppol,
  };
}

/**
 * Check a Belgian enterprise number (ondernemingsnummer, KBO) for
 * organisations without a VAT number. Same checksum as a Belgian VAT
 * number; not in VIES, so only the Peppol lookup (scheme 0208) is done.
 */
export async function validateEnterpriseNumber(input) {
  const digits = (input || "").replace(/^\s*BE/i, "").replace(/[^0-9]/g, "");
  const number = digits.length === 9 ? "0" + digits : digits;

  if (!isValidBelgianChecksum(number)) {
    return { status: "invalid" };
  }

  const peppol = await getPeppolParticipant(`0208:${number}`);
  return { status: "valid", formatted: number, country: "BE", peppol };
}
