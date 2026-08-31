import {
  getRecipes,
  subscribeToRecipes,
} from "./recipeService";


const getAssignedTo = (
  recipe
) => {
  if (
    recipe.assignedTo
  ) {
    return recipe.assignedTo;
  }

  if (
    recipe.status ===
      "Submitted" ||
    recipe.status ===
      "Pending Approval" ||
    recipe.status ===
      "Under Review" ||
    recipe.status ===
      "Rejected"
  ) {
    return "Approver";
  }

  if (
    recipe.status ===
      "Approved" ||
    recipe.status ===
      "ERP Pending" ||
    recipe.status ===
      "ERP Completed"
  ) {
    return "ERP User";
  }

  return "Head Chef";
};


export const getReportRecipes =
  async () => {
    const recipes =
      await getRecipes();


    return recipes.map(
      (recipe) => ({
        ...recipe,

        name:
          recipe.productName ||
          "Unnamed Recipe",

        displayYield:
          `${recipe.yield ?? ""} ${
            recipe.yieldUnit ||
            ""
          }`.trim() ||
          "-",

        assignedTo:
          getAssignedTo(
            recipe
          ),

        lastUpdated:
          recipe.lastUpdated ||
          "-",

        reportDate:
          recipe.updatedAt ||
          recipe.createdAt ||
          null,
      })
    );
  };


export const subscribeToReports =
  (
    onChange
  ) => {
    return subscribeToRecipes(
      onChange
    );
  };
