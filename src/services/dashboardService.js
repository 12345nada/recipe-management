import {
  supabase,
} from "../lib/supabaseClient";


const STATUS_ORDER = [
  "ERP Completed",
  "ERP Pending",
  "Waiting Approval",
  "Draft",
  "Rejected",
];


const STATUS_VALUES = {
  "ERP Completed":
    "erp-completed",

  "ERP Pending":
    "erp-pending",

  "Waiting Approval":
    "waiting-approval",

  Draft:
    "draft",

  Rejected:
    "rejected",
};


const TYPE_ORDER = [
  "Finished Product",
  "Semi-Finished",
  "Raw Material",
  "Packaging",
];


const getPercentage = (
  value,
  total
) => {
  if (!total) {
    return "0%";
  }

  const percentage =
    (Number(value) /
      Number(total)) *
    100;

  return `${percentage.toFixed(
    1
  )}%`;
};


const getAssignedFallback = (
  status
) => {
  if (
    status === "Submitted" ||
    status ===
      "Pending Approval" ||
    status === "Under Review"
  ) {
    return "Approver";
  }

  if (
    status === "Approved" ||
    status === "ERP Pending" ||
    status === "ERP Completed"
  ) {
    return "ERP User";
  }

  return "Head Chef";
};


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


const getMonthRange = (
  monthOffset = 0
) => {
  const now =
    new Date();

  const start =
    new Date(
      now.getFullYear(),
      now.getMonth() +
        monthOffset,
      1
    );

  const end =
    new Date(
      now.getFullYear(),
      now.getMonth() +
        monthOffset +
        1,
      1
    );

  return {
    start:
      start.toISOString(),

    end:
      end.toISOString(),
  };
};


const getChangePercentage = (
  current,
  previous
) => {
  const currentValue =
    Number(current || 0);

  const previousValue =
    Number(previous || 0);

  if (
    previousValue === 0
  ) {
    if (
      currentValue === 0
    ) {
      return {
        value: 0,
        direction: "same",
      };
    }

    return {
      value: 100,
      direction: "up",
    };
  }

  const difference =
    (
      (
        currentValue -
        previousValue
      ) /
      previousValue
    ) *
    100;

  return {
    value:
      Math.abs(
        difference
      ).toFixed(1),

    direction:
      difference > 0
        ? "up"
        : difference < 0
          ? "down"
          : "same",
  };
};


export const getDashboardStats =
  async () => {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "v_dashboard_recipe_stats"
        )
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    return {
      totalRecipes:
        Number(
          data?.total_recipes ||
            0
        ),

      draft:
        Number(
          data?.draft || 0
        ),

      waitingApproval:
        Number(
          data?.waiting_approval ||
            0
        ),

      approved:
        Number(
          data?.approved || 0
        ),

      rejected:
        Number(
          data?.rejected || 0
        ),

      erpPending:
        Number(
          data?.erp_pending ||
            0
        ),

      erpCompleted:
        Number(
          data?.erp_completed ||
            0
        ),
    };
  };


export const getStatusChart =
  async () => {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "v_recipes_by_status"
        )
        .select("*");

    if (error) {
      throw error;
    }

    const statusMap =
      {};

    (
      data || []
    ).forEach(
      (item) => {
        statusMap[
          item.status
        ] =
          Number(
            item.recipe_count ||
              0
          );
      }
    );

    const waitingApproval =
      (
        statusMap[
          "Submitted"
        ] || 0
      ) +
      (
        statusMap[
          "Pending Approval"
        ] || 0
      ) +
      (
        statusMap[
          "Under Review"
        ] || 0
      );

    const total =
      Object.values(
        statusMap
      ).reduce(
        (
          sum,
          value
        ) =>
          sum +
          Number(value),
        0
      );

    const grouped = {
      "ERP Completed":
        statusMap[
          "ERP Completed"
        ] || 0,

      "ERP Pending":
        statusMap[
          "ERP Pending"
        ] || 0,

      "Waiting Approval":
        waitingApproval,

      Draft:
        statusMap.Draft ||
        0,

      Rejected:
        statusMap.Rejected ||
        0,
    };

    return STATUS_ORDER.map(
      (name) => ({
        name,

        value:
          grouped[name] ||
          0,

        percentage:
          getPercentage(
            grouped[name] ||
              0,
            total
          ),

        statusValue:
          STATUS_VALUES[
            name
          ],
      })
    );
  };


export const getTypeChart =
  async () => {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "v_recipes_by_type"
        )
        .select("*");

    if (error) {
      throw error;
    }

    const typeMap =
      {};

    (
      data || []
    ).forEach(
      (item) => {
        typeMap[
          item.product_type
        ] =
          Number(
            item.recipe_count ||
              0
          );
      }
    );

    return TYPE_ORDER.map(
      (name) => ({
        name,

        value:
          typeMap[name] ||
          0,

        filterValue:
          name,
      })
    );
  };


export const getRecentRecipes =
  async () => {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "v_recipe_list"
        )
        .select(`
          id,
          recipe_number,
          product_name,
          product_type,
          category,
          yield_quantity,
          yield_unit,
          status,
          assigned_to_name,
          created_by_name,
          updated_at
        `)
        .order(
          "updated_at",
          {
            ascending: false,
          }
        );

    if (error) {
      throw error;
    }

    return (
      data || []
    ).map(
      (recipe) => ({
        id:
          recipe.id,

        recipeNumber:
          recipe
            .recipe_number,

        name:
          recipe
            .product_name,

        type:
          recipe
            .product_type,

        category:
          recipe.category,

        yield:
          `${Number(
            recipe
              .yield_quantity
          )} ${
            recipe
              .yield_unit ||
            ""
          }`.trim(),

        status:
          recipe.status,

        assigned:
          recipe
            .assigned_to_name ||
          getAssignedFallback(
            recipe.status
          ),

        createdBy:
          recipe
            .created_by_name ||
          "-",

        updated:
          formatDate(
            recipe.updated_at
          ),

        updatedAt:
          recipe.updated_at,

        image:
          "🍽️",
      })
    );
  };


const getCountBetween =
  async (
    column,
    start,
    end,
    status = null
  ) => {
    let query =
      supabase
        .from(
          "recipes"
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .gte(
          column,
          start
        )
        .lt(
          column,
          end
        );

    if (status) {
      query =
        query.eq(
          "status",
          status
        );
    }

    const {
      count,
      error,
    } =
      await query;

    if (error) {
      throw error;
    }

    return count || 0;
  };


export const getDashboardTrends =
  async () => {
    const current =
      getMonthRange(0);

    const previous =
      getMonthRange(-1);

    const [
      currentRecipes,
      previousRecipes,
      currentCompleted,
      previousCompleted,
    ] =
      await Promise.all([
        getCountBetween(
          "created_at",
          current.start,
          current.end
        ),

        getCountBetween(
          "created_at",
          previous.start,
          previous.end
        ),

        getCountBetween(
          "erp_completed_at",
          current.start,
          current.end,
          "ERP Completed"
        ),

        getCountBetween(
          "erp_completed_at",
          previous.start,
          previous.end,
          "ERP Completed"
        ),
      ]);

    return {
      totalRecipes:
        getChangePercentage(
          currentRecipes,
          previousRecipes
        ),

      erpCompleted:
        getChangePercentage(
          currentCompleted,
          previousCompleted
        ),
    };
  };


export const getDashboardData =
  async () => {
    const [
      stats,
      statusData,
      typeData,
      recipes,
      trends,
    ] =
      await Promise.all([
        getDashboardStats(),
        getStatusChart(),
        getTypeChart(),
        getRecentRecipes(),
        getDashboardTrends(),
      ]);

    return {
      stats,
      statusData,
      typeData,
      recipes,
      trends,
    };
  };


export const subscribeToDashboard =
  (
    onChange
  ) => {
    const channel =
      supabase
        .channel(
          "dashboard-live"
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
              "products",
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
        .subscribe();

    return () => {
      supabase
        .removeChannel(
          channel
        );
    };
  };