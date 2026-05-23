import { getAnalysis } from "@/lib/storage";
import { createClient } from "./client";

function rowToAnalysis(row) {
  return {
    id:             row.id,
    createdAt:      row.created_at,
    inputType:      row.input_type,
    url:            row.url ?? undefined,
    title:          row.title ?? undefined,
    direction:      row.direction,
    directionLabel: row.direction_label ?? row.direction,
    confidence:     row.confidence,
    score:          row.score,
    summary:        row.summary,
    drivers:        row.drivers ?? [],
    examples:       row.examples ?? [],
    sources:        row.sources ?? [],
    recommendations: row.recommendations ?? [],
    requestMeta:    row.request_meta ?? undefined,
  };
}

function analysisToRow(record, userId) {
  return {
    id:              record.id,
    user_id:         userId,
    created_at:      record.createdAt,
    input_type:      record.inputType,
    url:             record.url ?? null,
    title:           record.title ?? null,
    direction:       record.direction,
    direction_label: record.directionLabel ?? null,
    confidence:      record.confidence,
    score:           record.score ?? 0,
    summary:         record.summary,
    drivers:         record.drivers ?? [],
    examples:        record.examples ?? [],
    sources:         record.sources ?? [],
    recommendations: record.recommendations ?? [],
    request_meta:    record.requestMeta ?? null,
  };
}

export async function saveAnalysisToSupabase(record, userId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("analyses")
    .upsert(analysisToRow(record, userId), { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return rowToAnalysis(data);
}

export async function listAnalysesFromSupabase() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data ?? []).map(rowToAnalysis);
}

export async function getAnalysisFromSupabase(id) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return rowToAnalysis(data);
}

export async function deleteAnalysisFromSupabase(id) {
  const supabase = createClient();
  const { error } = await supabase
    .from("analyses")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function resolveAnalysis(id, user = null) {
  const local = getAnalysis(id);
  if (local) return local;
  if (!user?.id) return null;
  return getAnalysisFromSupabase(id);
}
