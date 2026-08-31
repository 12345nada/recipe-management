import {
  supabase,
} from "../lib/supabaseClient";


const formatDate = (
  value
) => {
  if (!value) {
    return "-";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};


const formatTime = (
  value
) => {
  if (!value) {
    return "-";
  }

  return new Date(
    value
  ).toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};


const formatDateTime = (
  value
) => {
  if (!value) {
    return "-";
  }

  return `${formatDate(value)} ${formatTime(value)}`;
};


const buildProfileName = (
  profile
) => {
  if (!profile) {
    return "System";
  }

  return (
    profile.full_name ||
    profile.username ||
    "System"
  );
};


const buildTimelineDetails = (
  log
) => {
  const parts = [];

  if (log.details) {
    parts.push(
      log.details
    );
  }

  if (
    log.old_status &&
    log.new_status &&
    log.old_status !==
      log.new_status
  ) {
    parts.push(
      `Status: ${log.old_status} → ${log.new_status}`
    );
  }

  if (log.comments) {
    parts.push(
      `Comment: ${log.comments}`
    );
  }

  return parts.join(
    " • "
  );
};


const getLatestApproval = (
  approvals = []
) => {
  if (!approvals.length) {
    return null;
  }

  return [...approvals]
    .sort(
      (a, b) =>
        new Date(
          b.reviewed_at ||
            b.created_at ||
            0
        ) -
        new Date(
          a.reviewed_at ||
            a.created_at ||
            0
        )
    )[0];
};


const getLatestApprovedApproval = (
  approvals = []
) => {
  return [...approvals]
    .filter(
      (approval) =>
        approval.decision ===
        "Approved"
    )
    .sort(
      (a, b) =>
        new Date(
          b.reviewed_at ||
            b.created_at ||
            0
        ) -
        new Date(
          a.reviewed_at ||
            a.created_at ||
            0
        )
    )[0] || null;
};


const getLatestRejectedApproval = (
  approvals = []
) => {
  return [...approvals]
    .filter(
      (approval) =>
        approval.decision ===
          "Rejected" ||
        approval.decision ===
          "Returned"
    )
    .sort(
      (a, b) =>
        new Date(
          b.reviewed_at ||
            b.created_at ||
            0
        ) -
        new Date(
          a.reviewed_at ||
            a.created_at ||
            0
        )
    )[0] || null;
};


export const getAuditRecipes =
  async () => {
    const [
      recipesResult,
      productsResult,
      approvalsResult,
      erpResult,
      logsResult,
    ] =
      await Promise.all([
        supabase
          .from("recipes")
          .select(`
            id,
            recipe_code,
            product_id,
            yield_quantity,
            yield_unit,
            description,
            status,
            created_by,
            assigned_to,
            rejection_comment,
            submitted_at,
            approved_at,
            rejected_at,
            erp_pending_at,
            erp_completed_at,
            created_at,
            updated_at
          `)
          .order(
            "updated_at",
            {
              ascending: false,
            }
          ),

        supabase
          .from("products")
          .select(`
            id,
            product_code,
            name,
            product_type,
            category,
            base_unit
          `),

        supabase
          .from(
            "recipe_approvals"
          )
          .select(`
            id,
            recipe_id,
            approver_id,
            decision,
            comment,
            review_round,
            reviewed_at,
            created_at
          `)
          .order(
            "created_at",
            {
              ascending: true,
            }
          ),

        supabase
          .from("erp_entries")
          .select(`
            id,
            recipe_id,
            erp_reference,
            entry_date,
            entered_by,
            notes,
            status,
            completed_at,
            created_at,
            updated_at
          `),

        supabase
          .from("audit_logs")
          .select(`
            id,
            user_id,
            module,
            action,
            entity_type,
            entity_id,
            entity_code,
            details,
            old_status,
            new_status,
            comments,
            metadata,
            created_at
          `)
          .order(
            "created_at",
            {
              ascending: true,
            }
          ),
      ]);


    const firstError = [
      recipesResult.error,
      productsResult.error,
      approvalsResult.error,
      erpResult.error,
      logsResult.error,
    ].find(Boolean);


    if (firstError) {
      throw firstError;
    }


    const recipes =
      recipesResult.data ||
      [];

    const products =
      productsResult.data ||
      [];

    const approvals =
      approvalsResult.data ||
      [];

    const erpEntries =
      erpResult.data ||
      [];

    const logs =
      logsResult.data ||
      [];


    const profileIds = [
      ...new Set(
        [
          ...recipes.flatMap(
            (recipe) => [
              recipe.created_by,
              recipe.assigned_to,
            ]
          ),

          ...approvals.map(
            (approval) =>
              approval.approver_id
          ),

          ...erpEntries.map(
            (entry) =>
              entry.entered_by
          ),

          ...logs.map(
            (log) =>
              log.user_id
          ),
        ].filter(Boolean)
      ),
    ];


    let profilesMap = {};


    if (profileIds.length) {
      const {
        data:
          profiles,
        error:
          profilesError,
      } =
        await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            username,
            roles (
              name
            )
          `)
          .in(
            "id",
            profileIds
          );


      if (profilesError) {
        throw profilesError;
      }


      profilesMap =
        Object.fromEntries(
          (
            profiles || []
          ).map(
            (profile) => [
              profile.id,
              profile,
            ]
          )
        );
    }


    const productsMap =
      Object.fromEntries(
        products.map(
          (product) => [
            product.id,
            product,
          ]
        )
      );


    const approvalsByRecipe =
      approvals.reduce(
        (
          result,
          approval
        ) => {
          if (
            !result[
              approval.recipe_id
            ]
          ) {
            result[
              approval.recipe_id
            ] = [];
          }

          result[
            approval.recipe_id
          ].push(
            approval
          );

          return result;
        },
        {}
      );


    const erpByRecipe =
      Object.fromEntries(
        erpEntries.map(
          (entry) => [
            entry.recipe_id,
            entry,
          ]
        )
      );


    const logsByRecipe =
      logs.reduce(
        (
          result,
          log
        ) => {
          const recipeId =
            log.entity_id;

          if (!recipeId) {
            return result;
          }

          if (
            !result[
              recipeId
            ]
          ) {
            result[
              recipeId
            ] = [];
          }

          result[
            recipeId
          ].push(
            log
          );

          return result;
        },
        {}
      );


    return recipes.map(
      (recipe) => {
        const product =
          productsMap[
            recipe.product_id
          ] || {};

        const recipeApprovals =
          approvalsByRecipe[
            recipe.id
          ] || [];

        const latestApproval =
          getLatestApproval(
            recipeApprovals
          );

        const approvedApproval =
          getLatestApprovedApproval(
            recipeApprovals
          );

        const rejectedApproval =
          getLatestRejectedApproval(
            recipeApprovals
          );

        const erpEntry =
          erpByRecipe[
            recipe.id
          ] || null;

        const recipeLogs =
          logsByRecipe[
            recipe.id
          ] || [];


        const timeline =
          recipeLogs
            .map(
              (log) => {
                const actor =
                  profilesMap[
                    log.user_id
                  ];

                return {
                  id:
                    log.id,

                  action:
                    log.action ||
                    "Activity",

                  module:
                    log.module ||
                    "-",

                  user:
                    buildProfileName(
                      actor
                    ),

                  userRole:
                    actor?.roles
                      ?.name ||
                    "System",

                  createdAt:
                    log.created_at,

                  date:
                    formatDate(
                      log.created_at
                    ),

                  time:
                    formatTime(
                      log.created_at
                    ),

                  details:
                    buildTimelineDetails(
                      log
                    ),

                  oldStatus:
                    log.old_status,

                  newStatus:
                    log.new_status,

                  comments:
                    log.comments,
                };
              }
            )
            .sort(
              (a, b) =>
                new Date(
                  b.createdAt ||
                    0
                ) -
                new Date(
                  a.createdAt ||
                    0
                )
            );


        return {
          id:
            recipe.id,

          recipeCode:
            recipe.recipe_code ||
            "-",

          recipeName:
            product.name ||
            recipe.recipe_code ||
            "Unnamed Recipe",

          productCode:
            product.product_code ||
            "-",

          type:
            product.product_type ||
            "-",

          category:
            product.category ||
            "-",

          yield:
            recipe.yield_quantity,

          yieldUnit:
            recipe.yield_unit ||
            product.base_unit ||
            "-",

          displayYield:
            `${recipe.yield_quantity ?? "-"} ${recipe.yield_unit || product.base_unit || ""}`.trim(),

          description:
            recipe.description ||
            "No description",

          status:
            recipe.status ||
            "-",

          createdBy:
            buildProfileName(
              profilesMap[
                recipe.created_by
              ]
            ),

          createdByRole:
            profilesMap[
              recipe.created_by
            ]?.roles?.name ||
            "System",

          createdAt:
            recipe.created_at,

          createdDate:
            formatDate(
              recipe.created_at
            ),

          createdTime:
            formatTime(
              recipe.created_at
            ),

          createdDateTime:
            formatDateTime(
              recipe.created_at
            ),

          submittedAt:
            recipe.submitted_at,

          submittedDateTime:
            formatDateTime(
              recipe.submitted_at
            ),

          updatedAt:
            recipe.updated_at,

          lastUpdated:
            formatDateTime(
              recipe.updated_at
            ),

          approval: {
            decision:
              latestApproval
                ?.decision ||
              "-",

            approvedBy:
              approvedApproval
                ? buildProfileName(
                    profilesMap[
                      approvedApproval
                        .approver_id
                    ]
                  )
                : "-",

            approvedByRole:
              approvedApproval
                ? profilesMap[
                    approvedApproval
                      .approver_id
                  ]?.roles
                    ?.name ||
                  "-"
                : "-",

            approvedAt:
              approvedApproval
                ?.reviewed_at ||
              approvedApproval
                ?.created_at ||
              recipe.approved_at ||
              null,

            approvedDateTime:
              formatDateTime(
                approvedApproval
                  ?.reviewed_at ||
                approvedApproval
                  ?.created_at ||
                recipe.approved_at
              ),

            rejectedBy:
              rejectedApproval
                ? buildProfileName(
                    profilesMap[
                      rejectedApproval
                        .approver_id
                    ]
                  )
                : "-",

            rejectedAt:
              rejectedApproval
                ?.reviewed_at ||
              rejectedApproval
                ?.created_at ||
              recipe.rejected_at ||
              null,

            rejectedDateTime:
              formatDateTime(
                rejectedApproval
                  ?.reviewed_at ||
                rejectedApproval
                  ?.created_at ||
                recipe.rejected_at
              ),

            comment:
              latestApproval
                ?.comment ||
              recipe.rejection_comment ||
              "-",

            rejectionReason:
              rejectedApproval
                ?.comment ||
              recipe.rejection_comment ||
              "-",

            reviewRound:
              latestApproval
                ?.review_round ||
              "-",

            history:
              recipeApprovals.map(
                (approval) => ({
                  id:
                    approval.id,

                  decision:
                    approval.decision,

                  approver:
                    buildProfileName(
                      profilesMap[
                        approval.approver_id
                      ]
                    ),

                  approverRole:
                    profilesMap[
                      approval.approver_id
                    ]?.roles?.name ||
                    "-",

                  comment:
                    approval.comment ||
                    "-",

                  reviewRound:
                    approval.review_round ||
                    "-",

                  reviewedAt:
                    approval.reviewed_at ||
                    approval.created_at,

                  reviewedDateTime:
                    formatDateTime(
                      approval.reviewed_at ||
                      approval.created_at
                    ),
                })
              ),
          },

          erp: {
            reference:
              erpEntry
                ?.erp_reference ||
              "-",

            status:
              erpEntry
                ?.status ||
              "-",

            entryDate:
              erpEntry
                ?.entry_date ||
              "-",

            enteredBy:
              erpEntry
                ? buildProfileName(
                    profilesMap[
                      erpEntry.entered_by
                    ]
                  )
                : "-",

            enteredByRole:
              erpEntry
                ? profilesMap[
                    erpEntry.entered_by
                  ]?.roles?.name ||
                  "-"
                : "-",

            notes:
              erpEntry
                ?.notes ||
              "-",

            createdAt:
              erpEntry
                ?.created_at ||
              null,

            createdDateTime:
              formatDateTime(
                erpEntry
                  ?.created_at
              ),

            completedAt:
              erpEntry
                ?.completed_at ||
              recipe
                .erp_completed_at ||
              null,

            completedDateTime:
              formatDateTime(
                erpEntry
                  ?.completed_at ||
                recipe
                  .erp_completed_at
              ),
          },

          timeline,
        };
      }
    );
  };


export const subscribeToAuditTrail =
  (
    onChange
  ) => {
    const channel =
      supabase
        .channel(
          "recipe-audit-trail-live"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "recipes",
          },
          () => {
            onChange?.();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "recipe_approvals",
          },
          () => {
            onChange?.();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "erp_entries",
          },
          () => {
            onChange?.();
          }
        )
        .on(
          "postgres_changes",
          {
            event:
              "INSERT",
            schema:
              "public",
            table:
              "audit_logs",
          },
          () => {
            onChange?.();
          }
        )
        .subscribe();


    return () => {
      supabase
        .removeChannel(
          channel
        );
    };
  };
