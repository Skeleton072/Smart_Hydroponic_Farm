const supabase = require("../config/supabase");
const { serviceError } = require("../utils/errorHandling");

const TABLE = "Nodes";

const NUMERIC_FIELDS = [
  "min_temperature", "max_temperature",
  "min_humidity",    "max_humidity",
  "min_pH",          "max_pH",
  "min_tds",         "max_tds",
];

const RANGE_PAIRS = [
  ["min_temperature", "max_temperature"],
  ["min_humidity",    "max_humidity"],
  ["min_pH",          "max_pH"],
  ["min_tds",         "max_tds"],
];

/**
 * Validate and normalize node thresholds.
 * @throws { INVALID_INPUT }
 */
function validateNodePayload(body, { partial = false } = {}) {
  const payload = {};

  if (!partial || body.node_name !== undefined) {
    if (body.node_name.trim() == "") {
      throw serviceError("INVALID_INPUT", "node_name is required.");
    }

    if (body.node_name.length > 100) {
      throw serviceError("INVALID_INPUT", "node_name must be at most 100 characters.");
    }

    payload.node_name = body.node_name.trim();
  }

  for (const field of NUMERIC_FIELDS) {
    if (partial && body[field] === undefined) continue;

    const value = Number(body[field]);
    if (!Number.isFinite(value) || value < 0) {
      throw serviceError("INVALID_INPUT", `${field} must be a non-negative number.`);
    }

    payload[field] = value;
  }

  for (const [minField, maxField] of RANGE_PAIRS) {
    const min = payload[minField] ?? body[minField];
    const max = payload[maxField] ?? body[maxField];
    if (min !== undefined && max !== undefined && Number(min) > Number(max)) {
      throw serviceError("INVALID_INPUT", `${minField} must be ≤ ${maxField}.`);
    }
  }

  return payload;
}

async function createNode(body) {
  const payload = validateNodePayload(body);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({...payload, })
    .select()
    .single();

  if (error) throw mapSupabaseError(error, "createNode");
  return data.node_id;
}

async function listNodes(ownerId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "node_id, node_name, min_temperature, max_temperature, min_humidity, max_humidity, min_pH, max_pH, min_tds, max_tds"
    )
    .eq("owner_id", ownerId);

  if (error) throw mapSupabaseError(error, "listNodes");
  return data;
}

async function updateNode(nodeId, body, ownerId) {
  assertUuid(nodeId);
  const payload = validateNodePayload(body, { partial: true });

  if (Object.keys(payload).length === 0) {
    throw serviceError("INVALID_INPUT", "No fields to update.");
  }

  // .select() after .update() returns the updated row — this is how we
  // distinguish "updated" from "no row matched". Do not drop `data` here.
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("node_id", nodeId)
    .eq("owner_id", ownerId)     // ownership enforced in the query
    .select()
    .maybeSingle();              // maybeSingle: null when no row matched

  if (error) throw mapSupabaseError(error, "updateNode");
  if (!data) throw serviceError("NODE_NOT_FOUND");
  return data;
}

async function deleteNode(nodeId, ownerId) {
  assertUuid(nodeId);

  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("node_id", nodeId)
    .eq("owner_id", ownerId)
    .select("node_id")
    .maybeSingle();

  if (error) throw mapSupabaseError(error, "deleteNode");
  if (!data) throw serviceError("NODE_NOT_FOUND");
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(id) {
  if (typeof id !== "string" || !UUID_RE.test(id)) {
    // 404 rather than 400 — a malformed id simply can't match any row.
    throw serviceError("NODE_NOT_FOUND");
  }
}

/**
 * Translate Supabase/Postgres errors into typed errors so the controller
 * never has to look at `error.message`.
 */
function mapSupabaseError(error, context) {
  console.error({ err: error, context }, "Supabase error");

  // Postgres error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
  switch (error.code) {
    case "23505": // unique_violation
      return serviceError("CONFLICT", "A node with that name already exists.", error);
    case "22P02": // invalid_text_representation (bad UUID, etc.)
      return serviceError("NODE_NOT_FOUND", undefined, error);
    case "23503": // foreign_key_violation
      return serviceError("CONFLICT", "Referenced resource does not exist.", error);
    default:
      return serviceError("INTERNAL", undefined, error);
  }
}

module.exports = { createNode, listNodes, updateNode, deleteNode };