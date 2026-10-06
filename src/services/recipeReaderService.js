import { supabase } from "../lib/supabaseClient";

const call = async (name, parameters = {}) => {
  const { data, error } = await supabase.rpc(name, parameters);
  if (error) throw error;
  return data;
};

export const listReaderCandidates = (recipeId) => call("list_recipe_reader_candidates", { p_recipe_id: recipeId });
export const assignReader = (recipeId, userId, updatedAt) => call("assign_recipe_reader", {
  p_recipe_id: recipeId, p_assigned_user_id: userId, p_expected_updated_at: updatedAt,
});
export const listMyReaderAssignments = () => call("list_my_recipe_reader_assignments");
export const getReaderAssignment = (id) => call("get_recipe_reader_assignment", { p_assignment_id: id });
export const markReaderAssignmentRead = (id) => call("mark_recipe_reader_assignment_read", { p_assignment_id: id });
export const listReaderAssignments = (recipeId) => call("list_recipe_reader_assignments", { p_recipe_id: recipeId });
export const revokeReaderAssignment = (id) => call("revoke_recipe_reader_assignment", { p_assignment_id: id });
export const getReaderPrintData = (id) => call("get_recipe_reader_print_data", { p_assignment_id: id });

export const readerError = (error, t) => {
  const reason = ["permission", "not_approved", "not_found", "stale", "inactive", "duplicate", "unavailable"]
    .find((key) => error?.message?.includes(`reader_${key}`));
  return t(`recipeReaders.errors.${reason || "failed"}`);
};
