import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  initialRecipes,
} from "../data/recipesData";


const RecipesContext =
  createContext(null);


/* =========================================
   PROVIDER
========================================= */

export function RecipesProvider({
  children,
}) {

  const [
    recipes,
    setRecipes,
  ] = useState(
    initialRecipes
  );


  /* =========================================
     GENERATE RECIPE ID
  ========================================= */

  const generateRecipeId = () => {

    const year =
      new Date()
        .getFullYear();


    const maxNumber =
      recipes.reduce(
        (
          max,
          recipe
        ) => {

          const parts =
            recipe.id
              ?.split("-") ||
            [];


          const number =
            Number(
              parts[
                parts.length - 1
              ]
            ) || 0;


          return Math.max(
            max,
            number
          );
        },
        0
      );


    return `REC-${year}-${String(
      maxNumber + 1
    ).padStart(
      3,
      "0"
    )}`;
  };


  /* =========================================
     DATE INFO
  ========================================= */

  const getDateInfo = () => {

    const now =
      new Date();


    return {

      lastUpdated:
        now.toLocaleDateString(
          "en-GB",
          {
            day:
              "2-digit",

            month:
              "short",

            year:
              "numeric",
          }
        ),


      updatedTime:
        now.toLocaleTimeString(
          "en-US",
          {
            hour:
              "2-digit",

            minute:
              "2-digit",
          }
        ),


      updatedAt:
        now.toISOString(),
    };
  };


  /* =========================================
     ADD RECIPE
  ========================================= */

  const addRecipe = (
    recipeData
  ) => {

    const newRecipe = {

      ...recipeData,


      /*
        لو CreateRecipe بعت id
        مش هنستخدمه.

        الـ Context هو المسؤول
        عن توليد ID.
      */

      id:
        generateRecipeId(),


      createdAt:
        recipeData
          .createdAt ||
        new Date()
          .toISOString(),


      createdBy:
        recipeData
          .createdBy ||
        "Chef Ahmed",


      assignedTo:
        recipeData
          .assignedTo ||
        (
          recipeData.status ===
          "Submitted"
            ? "Approver"
            : "Head Chef"
        ),


      ...getDateInfo(),
    };


    setRecipes(
      (
        previousRecipes
      ) => [
        newRecipe,
        ...previousRecipes,
      ]
    );


    return newRecipe;
  };


  /* =========================================
     SAVE DRAFT
  ========================================= */

  const saveDraft = (
    recipeData
  ) => {

    return addRecipe({
      ...recipeData,

      status:
        "Draft",

      assignedTo:
        "Head Chef",
    });
  };


  /* =========================================
     SUBMIT RECIPE
  ========================================= */

  const submitRecipe = (
    recipeData
  ) => {

    return addRecipe({
      ...recipeData,

      status:
        "Submitted",

      assignedTo:
        "Approver",

      submittedAt:
        new Date()
          .toISOString(),
    });
  };


  /* =========================================
     UPDATE RECIPE
  ========================================= */

  const updateRecipe = (
    recipeId,
    updatedData
  ) => {

    setRecipes(
      (
        previousRecipes
      ) =>
        previousRecipes.map(
          (recipe) =>
            recipe.id ===
            recipeId
              ? {
                  ...recipe,
                  ...updatedData,

                  ...getDateInfo(),
                }
              : recipe
        )
    );
  };


  /* =========================================
     DELETE RECIPE
  ========================================= */

  const deleteRecipe = (
    recipeId
  ) => {

    setRecipes(
      (
        previousRecipes
      ) =>
        previousRecipes.filter(
          (recipe) =>
            recipe.id !==
            recipeId
        )
    );
  };


  /* =========================================
     GET RECIPE BY ID
  ========================================= */

  const getRecipeById = (
    recipeId
  ) => {

    return recipes.find(
      (recipe) =>
        recipe.id ===
        recipeId
    );
  };


  /* =========================================
     CHANGE RECIPE STATUS
  ========================================= */

  const changeRecipeStatus = (
    recipeId,
    status,
    extraData = {}
  ) => {

    const assignedToMap = {

      Draft:
        "Head Chef",

      Submitted:
        "Approver",

      "Under Review":
        "Approver",

      Approved:
        "ERP User",

      Rejected:
        "Head Chef",

      "Pending Approval":
        "Approver",

      "ERP Pending":
        "ERP User",

      "ERP Completed":
        "ERP User",
    };


    updateRecipe(
      recipeId,
      {
        status,

        assignedTo:
          assignedToMap[
            status
          ] ||
          extraData.assignedTo,

        ...extraData,
      }
    );
  };


  /* =========================================
     APPROVE RECIPE
  ========================================= */

  const approveRecipe = (
    recipeId,
    approvalData = {}
  ) => {

    changeRecipeStatus(
      recipeId,
      "ERP Pending",
      {
        approvedOn:
          new Date()
            .toISOString(),

        approvedBy:
          approvalData
            .approvedBy ||
          "Approver",

        approvalComment:
          approvalData
            .approvalComment ||
          "",

        ...approvalData,
      }
    );
  };


  /* =========================================
     REJECT RECIPE
  ========================================= */

  const rejectRecipe = (
    recipeId,
    comment = ""
  ) => {

    changeRecipeStatus(
      recipeId,
      "Rejected",
      {
        rejectionComment:
          comment,

        rejectedAt:
          new Date()
            .toISOString(),

        assignedTo:
          "Head Chef",
      }
    );
  };


  /* =========================================
     MARK ERP COMPLETED
  ========================================= */

  const markERPCompleted = (
    recipeId,
    erpData = {}
  ) => {

    changeRecipeStatus(
      recipeId,
      "ERP Completed",
      {
        erpReference:
          erpData
            .erpReference ||
          "",

        erpNotes:
          erpData
            .erpNotes ||
          "",

        erpEntryDate:
          erpData
            .erpEntryDate ||
          new Date()
            .toISOString(),

        enteredBy:
          erpData
            .enteredBy ||
          "ERP User",

        assignedTo:
          "ERP User",
      }
    );
  };


  /* =========================================
     STATS
  ========================================= */

  const stats =
    useMemo(
      () => ({

        total:
          recipes.length,


        finished:
          recipes.filter(
            (recipe) =>
              recipe.type ===
              "Finished Product"
          ).length,


        semiFinished:
          recipes.filter(
            (recipe) =>
              recipe.type ===
              "Semi-Finished"
          ).length,


        rawMaterials:
          recipes.filter(
            (recipe) =>
              recipe.type ===
              "Raw Material"
          ).length,


        draft:
          recipes.filter(
            (recipe) =>
              recipe.status ===
              "Draft"
          ).length,


        submitted:
          recipes.filter(
            (recipe) =>
              recipe.status ===
              "Submitted"
          ).length,


        pendingApproval:
          recipes.filter(
            (recipe) =>
              recipe.status ===
                "Pending Approval" ||
              recipe.status ===
                "Submitted" ||
              recipe.status ===
                "Under Review"
          ).length,


        approved:
          recipes.filter(
            (recipe) =>
              recipe.status ===
              "Approved"
          ).length,


        rejected:
          recipes.filter(
            (recipe) =>
              recipe.status ===
              "Rejected"
          ).length,


        erpPending:
          recipes.filter(
            (recipe) =>
              recipe.status ===
              "ERP Pending"
          ).length,


        erpCompleted:
          recipes.filter(
            (recipe) =>
              recipe.status ===
              "ERP Completed"
          ).length,

      }),

      [
        recipes,
      ]
    );


  return (
    <RecipesContext.Provider
      value={{
        recipes,
        stats,

        addRecipe,
        saveDraft,
        submitRecipe,

        updateRecipe,
        deleteRecipe,
        getRecipeById,

        changeRecipeStatus,
        approveRecipe,
        rejectRecipe,
        markERPCompleted,
      }}
    >
      {children}
    </RecipesContext.Provider>
  );
}


/* =========================================
   CUSTOM HOOK
========================================= */

export function useRecipes() {

  const context =
    useContext(
      RecipesContext
    );


  if (!context) {

    throw new Error(
      "useRecipes must be used inside RecipesProvider"
    );
  }


  return context;
}