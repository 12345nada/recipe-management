import i18n from "i18next";
import {
  initReactI18next,
} from "react-i18next";


const resources = {

  /* =====================================================
      ENGLISH
  ===================================================== */

  en: {
    translation: {
      notifications: {
        markAllRead: "Mark all as read", unreadCount: "Notifications: {{count}} unread",
        loadError: "Notifications could not be refreshed. Please try again.",
        readError: "The notification could not be marked as read. Please try again.",
        unavailable: "This content is no longer available or you do not have access.",
        resolved: "Task no longer pending", reason: "Reason: {{reason}}",
        events: {
          pending_approval: { title: "Recipe waiting for approval", message: "{{name}} ({{code}}) is waiting for your review." },
          approved: { title: "Recipe approved", message: "{{name}} ({{code}}) was approved." },
          rejected: { title: "Recipe rejected", message: "{{name}} ({{code}}) was rejected." },
          erp_pending: { title: "Recipe ready for ERP", message: "{{name}} ({{code}}) is approved and ready for ERP entry." },
          erp_completed: { title: "ERP entry completed", message: "{{name}} ({{code}}) has been completed in ERP." },
          reader_assigned: { title: "Recipe assigned to you", message: "{{name}} ({{code}}) was assigned to you for reading." },
          reader_revoked: { title: "Recipe assignment revoked", message: "{{name}} ({{code}}) is no longer assigned to you." },
        },
      },
      recipeReaders: {
        assignedToMe: "Assigned to Me",
        "mine": "My Assigned Recipes",
        "assignments": "Recipe Reader Assignments",
        "assign": "Assign to Reader",
        "searchUsers": "Search users…",
        "chooseUser": "Select a reader",
        "reader": "Reader",
        "assignedBy": "Assigned by",
        "assignedAt": "Assigned at",
        "readAt": "Read at",
        "assignmentStatus": "Assignment status",
        "actions": "Actions",
        "active": "Active",
        "revoked": "Revoked",
        "revoke": "Revoke",
        "revokePrompt": "Revoke the assignment for {{name}}? Its history will be preserved.",
        "noAssignments": "No reader assignments yet.",
        "noMine": "No recipes are assigned to you.",
        "unread": "Unread",
        "recipe": "Assigned Recipe",
        "back": "Back to assigned recipes",
        "code": "Recipe Code",
        "name": "Recipe Name",
        "open": "Open recipe",
        "awaitingApproval": "Unavailable until approved",
        "readOnly": "Read only — your assignment allows viewing, acknowledging and printing only.",
        "markRead": "Mark as Read",
        "read": "Read",
        "print": "Print",
        "description": "Description",
        "category": "Category",
        "type": "Product Type",
        "yield": "Yield",
        "ingredient": "Ingredient",
        "quantity": "Quantity",
        "unit": "Unit",
        "notes": "Notes",
        "field": "Field",
        "value": "Value",
        "errors": {
                "permission": "You no longer have permission to perform this action.",
                "not_approved": "Reader access is available only for Approved, ERP Pending or ERP Completed recipes.",
                "not_found": "The recipe or assignment could not be found.",
                "stale": "The recipe changed. Close this window, reload the recipe and try again.",
                "inactive": "The selected user is no longer active.",
                "duplicate": "This user already has an active assignment for this recipe.",
                "unavailable": "This assignment is unavailable. It may have been revoked or the recipe may be awaiting approval.",
                "failed": "The action could not be completed. Please try again."
        }
},

      /* =================================================
          GENERAL
      ================================================= */

      common: {
        english: "English",
        arabic: "Arabic",

        search: "Search",
        searchAnything: "search anything...",

        loading: "Loading...",
        saving: "Saving...",

        viewAll: "View all",

        cancel: "Cancel",
        close: "Close",

        edit: "Edit",
        delete: "Delete",

        add: "Add",
        save: "Save",

        tryAgain: "Try Again",

        previousPage: "Previous page",
        nextPage: "Next page",

        user: "User",

        total: "Total",

        recipes: "recipes",

        showing: "Showing",
        to: "to",
        of: "of",
      },


      /* =================================================
          SIDEBAR
      ================================================= */

      sidebar: {
        dashboard: "Dashboard",
        recipes: "Recipes",
        productMaster: "Product Master",
        erpEntry: "ERP Entry",
        reports: "Reports",
        auditTrail: "Audit Trail",
        settings: "Settings",

        logout: "Logout",
        loggingOut: "Logging out...",

        logoutError:
          "Could not log out. Please try again.",
      },


      /* =================================================
          HEADER
      ================================================= */

      header: {

        searchAnything:
          "search anything...",

        notifications:
          "Notifications",

        loadingNotifications:
          "Loading notifications...",

        noNotifications:
          "No notifications yet.",

        chooseImageError:
          "Please choose JPG, PNG or WEBP image.",

        imageSizeError:
          "Image must be less than 5 MB.",

        imageLoadError:
          "Could not load image.",


        /* =============================================
            PAGE TITLES
        ============================================= */

        dashboard: {
          welcomeBack:
            "Welcome back, {{name}} 👋",

          subtitle: "",
        },


        recipes: {
          title:
            "Recipes",

          subtitle:
            "Manage and organize all your recipes.",

          addNewRecipe:
            "Add New Recipe",
        },


        createRecipe: {
          title:
            "Create New Recipe",

          subtitle:
            "Create a recipe and add its ingredients.",
        },


        recipeDetails: {
          title:
            "Recipe Details",

          subtitle:
            "View recipe information and ingredients.",
        },


        productMaster: {
          title:
            "Product Master",

          subtitle:
            "Manage all products used in recipes.",

          addNewProduct:
            "Add New Product",
        },


        erpEntry: {
          title:
            "ERP Entry",

          subtitle:
            "Manage recipes ready for ERP entry.",
        },


        erpEntryDetails: {
          title:
            "ERP Entry Details",

          subtitle:
            "View recipe details and complete ERP entry.",
        },


        reports: {
          title:
            "Reports",

          subtitle:
            "View recipe and workflow reports.",
        },


        auditTrail: {
          title:
            "Audit Trail",

          subtitle:
            "Track recipe actions and status changes.",
        },


        settings: {
          title:
            "Settings",

          subtitle:
            "Manage system settings and users.",
        },


        defaultPage: {
          title:
            "Recipe Management",

          subtitle: "",
        },
      },


      login: {
  welcomeBack:
    "Welcome Back",

  subtitle:
    "Please sign in to your account",

  adminManager:
    "Admin / Manager",

  employee:
    "Employee",

  username:
    "Username",

  usernamePlaceholder:
    "Enter your username",

  password:
    "Password",

  passwordPlaceholder:
    "Enter your password",

  forgotPassword:
    "Forgot Password?",

  signIn:
    "Sign In",

  signingIn:
    "Signing In...",

  showPassword:
    "Show password",

  hidePassword:
    "Hide password",

  errors: {
    enterCredentials:
      "Please enter your username and password.",

    couldNotSignIn:
      "Could not sign in.",

    sessionError:
      "Could not create user session.",

    incorrectCredentials:
      "Incorrect username or password.",
  },
},


      /* =================================================
          DASHBOARD
      ================================================= */

      dashboard: {

        loading:
          "Loading dashboard...",

        loadError:
          "Could not load dashboard.",

        tryAgain:
          "Try Again",


        /* =============================================
            STATS
        ============================================= */

        stats: {

          totalRecipes:
            "Total Recipes",

          draft:
            "Draft",

          waitingApproval:
            "Waiting Approval",

          erpPending:
            "ERP Pending",

          erpCompleted:
            "ERP Completed",

          rejected:
            "Rejected",

          percentOfTotal:
            "{{value}}% of total",

          noChangeLastMonth:
            "0% vs last month",

          increaseLastMonth:
            "↑ {{value}}% vs last month",

          decreaseLastMonth:
            "↓ {{value}}% vs last month",
        },


        /* =============================================
            CHARTS
        ============================================= */

        charts: {

          recipesByStatus:
            "Recipes by Status",

          recipesByCategory:
            "Recipes by Category",
          uncategorized: "Uncategorized",

          viewAll:
            "View all",

          total:
            "Total",

          recipeCount:
            "{{value}} recipes",

          recipes:
            "Recipes",
        },


        /* =============================================
            RECENT RECIPES
        ============================================= */

        recentRecipes: {

          title:
            "Recent Recipes",

          searchPlaceholder:
            "Search recipes...",

          noRecipes:
            "No recipes found.",


          /* =========================================
              FILTERS
          ========================================= */

          filters: {

            allStatus:
              "All Status",

            draft:
              "Draft",

            waitingApproval:
              "Waiting Approval",

            approved:
              "Approved",

            erpPending:
              "ERP Pending",

            erpCompleted:
              "ERP Completed",

            rejected:
              "Rejected",


            allTypes:
              "All Types",

            finishedProduct:
              "Finished Product",

            semiFinished:
              "Semi-Finished",

            rawMaterial:
              "Raw Material",

            packaging:
              "Packaging",
          },


          /* =========================================
              TABLE
          ========================================= */

          table: {

            recipeName:
              "Recipe Name",

            type:
              "Type",

            yield:
              "Yield",

            status:
              "Status",

            assignedTo:
              "Assigned To",

            lastUpdated:
              "Last Updated",
          },


          /* =========================================
              PAGINATION
          ========================================= */

          pagination: {

            showing:
              "Showing",

            to:
              "to",

            of:
              "of",

            recipes:
              "recipes",

            previousPage:
              "Previous page",

            nextPage:
              "Next page",
          },
        },
      },



      /* =================================================
          RECIPES PAGE
      ================================================= */

      recipesPage: {
        loading: "Loading recipes...",
        backToRecipes: "Back to Recipes",
        noRecipesFound: "No recipes found.",
        noDescription: "No description",

        tabs: {
          allRecipes: "All Recipes",
          draft: "Draft",
          submitted: "Submitted",
          pendingApproval: "Pending Approval",
          approved: "Approved",
          rejected: "Rejected",
          erpPending: "ERP Pending",
          erpCompleted: "ERP Completed",
        },

        stats: {
          finishedProducts: "Finished Products",
          semiFinished: "Semi-Finished",
          pendingApproval: "Pending Approval",
          recipeProducts: "Recipe products",
          requiresReview: "Requires review",
        },

        filters: {
          searchPlaceholder: "Search recipes...",
          allTypes: "All Types",
          allCategories: "All Categories",
        },

        table: {
          id: "ID",
          recipeName: "Recipe Name",
          status: "Status",
          requestedBy: "Requested By",
          lastUpdated: "Last Updated",
          actions: "Actions",
          action: "Action",
          actionsFor: "Actions for {{name}}",
        },

        form: {
          editRecipe: "Edit Recipe",
          createRecipe: "Create New Recipe",
          editSubtitle: "Update recipe information and ingredients.",
          createSubtitle: "Add recipe information and ingredients.",
          recipeInformation: "Recipe Information",
          selectProductHelp: "Select a product from Product Master.",
          product: "Product",
          selectProduct: "Select Product",
          productType: "Product Type",
          type: "Type",
          category: "Category",
          yield: "Yield",
          yieldUnit: "Yield Unit",
          yieldPlaceholder: "Example: 40",
          description: "Description",
          descriptionPlaceholder: "Enter recipe description...",
          quantity: "Quantity",
          unit: "Unit",
        },

        voice: {
          languageLabel: "Speech language",
          start: "Dictate description",
          stop: "Stop",
          starting: "Preparing microphone…",
          recording: "Recording… Speak now. Review the text before saving.",
          stopping: "Stopping…",
          unsupported: "Voice input is not supported in this browser. Please type the description.",
          denied: "Microphone access was denied. Allow it in your browser settings, then try again.",
          microphone: "No microphone is available. Check your microphone and try again.",
          noSpeech: "No speech was detected. Please try again.",
          network: "Speech recognition could not connect. Check your connection or type the description.",
          language: "The browser could not recognize this language. Please type the description.",
          failed: "Voice input could not start or was interrupted. Please try again or type the description.",
        },

        validation: {
          product: "Please select a product.",
          yield: "Please enter a yield quantity greater than zero.",
          ingredients: "Please add at least one ingredient.",
          ingredientsRequiredOnSubmit: "Required for Submit for Approval only.",
        },
        ingredients: {
          title: "Ingredients",
          subtitle: "Add all products required for this recipe.",
          addIngredient: "Add Ingredient",
          editIngredient: "Edit Ingredient",
          updateIngredient: "Update Ingredient",
          ingredient: "Ingredient",
          selectIngredient: "Select Ingredient",
          noneAdded: "No ingredients added yet.",
          noIngredients: "No ingredients.",
        },

        actions: {
          saveDraft: "Save Draft",
          submitForApproval: "Submit for Approval",
          saveChanges: "Save Changes",
          processing: "Processing...",
          approve: "Approve",
          reject: "Reject",
        },

        details: {
          notFound: "Recipe not found",
          rejectionReason: "Rejection reason:",
          createdBy: "Created By",
        },

        reject: {
          title: "Reject Recipe",
          prompt: "Please enter the rejection reason for",
          placeholder: "Enter rejection reason...",
          rejecting: "Rejecting...",
          confirmReject: "Confirm Reject",
        },

        delete: {
          title: "Confirm Action",
          prompt: "Are you sure you want to delete",
          deleting: "Deleting...",
          cancel: "No",
          confirm: "Yes",
        },

        values: {
          completed: "Completed",
          pending: "Pending",
        },

        pagination: {
          showing: "Showing {{from}} to {{to}} of {{total}} recipes",
        },

        errors: {
          couldNotLoad: "Could not load recipes.",
          selectProductFirst: "Please select a product first.",
          ingredientAlreadyAdded: "Ingredient already added.",
          couldNotSave: "Could not save recipe.",
          couldNotUpdate: "Could not update recipe.",
          couldNotDelete: "Could not delete recipe.",
          couldNotApprove: "Could not approve recipe.",
          enterRejectionReason: "Please enter the rejection reason.",
          couldNotReject: "Could not reject recipe.",
        },
      },




      /* =================================================
          PRODUCT MASTER PAGE
      ================================================= */

      productMasterPage: {
        loading: "Loading products...",
        noProducts: "No products found.",
        management: {
          categories: "Manage Categories", units: "Manage Units",
          selectCategory: "Select Category", selectUnit: "Select Base Unit",
          newValue: "New value", editValue: "Edit value", add: "Add", save: "Save",
          delete: "Delete", close: "Close",
          confirmDelete: 'Delete "{{value}}"? Only unused values can be deleted.',
          blank: "Enter a nonblank value.", duplicate: "This value already exists.",
          inUse: "This value cannot be renamed or deleted because it is currently in use.",
          categoryDeleteInUse: "This category cannot be deleted because it is currently used by existing products.",
          unitDeleteInUse: "This unit cannot be deleted because it is currently used in the system.",
          stale: "This value changed. Close and reopen the Product form to reload it.",
          permission: "You do not have permission for this action.",
          activeRequired: "Choose a Category and Base Unit from the available options.",
          failed: "Could not save the value. Please try again.",
          loadFailed: "Could not load Categories and Units. Close and reopen the form to retry.",
        },

        stats: {
          totalProducts: "Total Products",
          productsWithRecipe: "Products With Recipe",
          categories: "Categories",
          rawMaterials: "Raw Materials",
          hundredPercent: "100% of total",
          ofTotal: "of total",
          totalCategories: "Total categories",
          totalRawMaterials: "Total raw materials",
        },

        filters: {
          searchPlaceholder: "Search products...",
          allTypes: "All Types",
          allCategories: "All Categories",
          allUnits: "All Units",
          clear: "Clear",
        },

        table: {
          productCode: "Product Code",
          productName: "Product Name",
          type: "Type",
          category: "Category",
          baseUnit: "Base Unit",
          recipeStatus: "Recipe Status",
          lastUpdated: "Last Updated",
          actions: "Actions",
        },

        recipeStatus: {
          available: "Recipe Available",
          none: "No Recipe",
        },

        units: {
          kg: "Kg",
          gram: "Gram",
          piece: "Piece",
          litre: "Litre",
          ml: "ml",
          pack: "Pack",
        },

        pagination: {
          showing: "Showing {{from}} to {{to}} of {{total}} products",
        },

        delete: {
          title: "Confirm Action",
          prompt: "Are you sure you want to delete",
          deleting: "Deleting...",
          confirm: "Confirm",
        },

        form: {
          editProduct: "Edit Product",
          addNewProduct: "Add New Product",
          editSubtitle: "Update product information.",
          addSubtitle: "Add a new product to Product Master.",
          productName: "Product Name",
          productType: "Product Type",
          category: "Category",
          baseUnit: "Base Unit",
          description: "Description",
          namePlaceholder: "Enter product name",
          categoryPlaceholder: "Example: Flour",
          descriptionPlaceholder: "Enter product description...",
          saveChanges: "Save Changes",
          addProduct: "Add Product",
        },

        errors: {
          couldNotLoad: "Could not load products.",
          usedInRecipe: "This product cannot be deleted because it is already used in a recipe.",
          couldNotDelete: "Could not delete product.",
          nameCategoryRequired: "Product name and category are required.",
          noEditPermission: "You do not have permission to edit products.",
          noAddPermission: "You do not have permission to add products.",
          duplicateProduct: "A product with the same code or unique value already exists.",
          couldNotSave: "Could not save product.",
          productTypeConfiguration: "The selected product type is not configured correctly. Please contact an administrator.",
        },
      },


      /* =================================================
          ERP ENTRY
      ================================================= */

      erpEntryPage: {
        loading: "Loading ERP recipes...",
        empty: "No approved recipes ready for ERP.",

        filters: {
          searchPlaceholder: "Search recipes...",
          allTypes: "All Types",
          allCategories: "All Categories",
          erpPending: "ERP Status: Pending",
          erpCompleted: "ERP Status: Completed",
          allStatuses: "All ERP Status",
          clearFilters: "Filter",
        },

        table: {
          recipeName: "Recipe Name",
          type: "Type",
          category: "Category",
          yield: "Yield",
          approvedOn: "Approved On",
          status: "Status",
          action: "Action",
        },

        actions: {
          enterERP: "Enter ERP",
          completed: "Completed",
        },

        pagination: {
          showing: "Showing {{from}} to {{to}} of {{total}} recipes",
        },

        errors: {
          couldNotLoad: "Could not load ERP recipes.",
        },
      },

      erpDetailsPage: {
        loading: "Loading ERP details...",
        notFound: "Recipe not found",
        back: "Back to ERP Entry",
        erpEntry: "ERP Entry",
        subtitle: "Recipe Details & ERP Entry",
        unnamedRecipe: "Unnamed Recipe",
        recipeApprover: "Recipe Approver",
        noDescription: "No description",

        fields: {
          type: "Type",
          category: "Category",
          yield: "Yield",
          status: "Status",
          id: "ID",
          description: "Description",
        },

        approval: {
          title: "Approval Information",
          approvedBy: "Approved By",
          approvedOn: "Approved On",
          status: "Approval Status",
        },

        form: {
          reference: "ERP Reference",
          entryDate: "ERP Entry Date",
          enteredBy: "Entered By",
          notes: "ERP Notes",
          optional: "(Optional)",
          notesPlaceholder: "Enter any additional notes...",
        },

        actions: {
          completed: "ERP Completed",
          completing: "Completing...",
          markCompleted: "Mark as ERP Completed",
        },

        errors: {
          couldNotLoad: "Could not load ERP details.",
          couldNotCreate: "Could not create ERP entry.",
          couldNotComplete: "Could not complete ERP entry.",
        },
      },



      /* =================================================
          REPORTS PAGE
      ================================================= */

      reportsPage: {
        loading: "Loading reports...",
        noReports: "No reports found.",

        filters: {
          title: "Report Filters",
          subtitle: "Narrow the report results using the filters below.",
          from: "From",
          to: "To",
          allTypes: "All Types",
          allCategories: "All Categories",
          allStatus: "All Status",
          clear: "Clear Filters",
        },

        export: {
          export: "Export",
          pdf: "Export PDF",
          excel: "Export Excel",
        },

        table: {
          title: "Recipe Report",
          showingRecords: "Showing {{from}} to {{to}} of {{total}} records",
          recipeName: "Recipe Name",
          type: "Type",
          category: "Category",
          yield: "Yield",
          status: "Status",
          assignedTo: "Assigned To",
          lastUpdated: "Last Updated",
          actions: "Actions",
        },

        actions: {
          moreActions: "More Actions",
          viewDetails: "View Details",
        },

        details: {
          subtitle: "Complete report information for this recipe.",
          recipeId: "Recipe ID",
          recipeName: "Recipe Name",
          type: "Type",
          category: "Category",
          yield: "Yield",
          status: "Status",
          assignedTo: "Assigned To",
          requestedBy: "Requested By",
          createdAt: "Created At",
          lastUpdated: "Last Updated",
        },

        pagination: {
          showing: "Showing {{from}} to {{to}} of {{total}} recipes",
        },

        errors: {
          couldNotLoad: "Could not load reports.",
        },
      },



      /* =================================================
          AUDIT TRAIL PAGE
      ================================================= */

      auditTrailPage: {
        loading: "Loading audit trail...",
        noRecords: "No audit records found.",
        filters: {
          from: "From",
          to: "To",
          allTypes: "All Types",
          allStatus: "All Status",
          searchPlaceholder: "Search recipe...",
        },
        export: {
          export: "Export",
          pdf: "Export PDF",
          excel: "Export Excel",
        },
        table: {
          recipeId: "Recipe ID",
          recipeName: "Recipe Name",
          type: "Type",
          category: "Category",
          yield: "Yield",
          currentStatus: "Current Status",
          createdBy: "Created By",
          createdAt: "Created At",
          lastUpdated: "Last Updated",
          actions: "Actions",
        },
        actions: {
          moreActions: "More Actions",
          viewDetails: "View Details",
        },
        details: {
          title: "Recipe Audit Details",
          subtitle: "Complete recipe history and audit information.",
          recipeId: "Recipe ID",
          category: "Category",
          yield: "Yield",
          currentStatus: "Current Status",
          creationInformation: "Creation Information",
          createdBy: "Created By",
          createdAt: "Created At",
          lastUpdated: "Last Updated",
          decision: "Decision",
          recipeInformation: "Recipe Information",
          approvalInformation: "Approval Information",
          erpInformation: "ERP Information",
          activityTimeline: "Activity Timeline",
          productCode: "Product Code",
          productType: "Product Type",
          submittedAt: "Submitted At",
          approvalDecision: "Approval Decision",
          approvedBy: "Approved By",
          approvedAt: "Approved At",
          rejectedBy: "Rejected By",
          rejectedAt: "Rejected At",
          reviewRound: "Review Round",
          rejectionReason: "Rejection / Return Reason",
          erpReference: "ERP Reference",
          erpStatus: "ERP Status",
          erpEntryDate: "ERP Entry Date",
          enteredBy: "Entered By",
          erpCreatedAt: "ERP Created At",
          erpCompletedAt: "ERP Completed At",
          erpNotes: "ERP Notes",
          noActivity: "No activity history recorded for this recipe yet.",
        },
        values: {
  completed: "Completed",
},
        pagination: {
          showing: "Showing {{from}} to {{to}} of {{total}} recipes",
        },
        errors: {
          couldNotLoad: "Could not load audit trail.",
        },
      },



      /* =================================================
          SETTINGS PAGE
      ================================================= */

      settingsPage: {
        permissionModules: { general: "General Settings", accounts: "Permissions & User Rights", master: "Master Data" },
        loading: "Loading settings...",

        tabs: {
          general: "General Settings",
          permissions: "Permissions & User Rights",
        },

        general: {
          title: "General Settings",
          subtitle: "Manage your personal preferences.",
          fullName: "Full Name",
          email: "Email Address",
          language: "Language",
          saveChanges: "Save Changes",
        },

        permissions: {
          employees: "Employees",
          selectEmployee: "Select an employee",
          addNewUser: "Add New User",
          searchEmployees: "Search employees...",
          roles: "Roles",
          chooseRole: "Choose a role",
          searchRoles: "Search roles...",
          addNewRole: "Add New Role",
          managePasswords: "Manage user passwords and account access",
          assignedTo: "is assigned to",
          resetPassword: "Reset Password",
          allPermissions: "All Permissions",
          toggleAll: "Turn all permissions on or off",
          module: "Module",
          view: "View",
          add: "Add",
          edit: "Edit",
          delete: "Delete",
          selectedRole: "Selected role:",
          print: "Print",
          savePermissions: "Save Permissions",
        },
        productTypeManagement: {
          description: "Manage product types and their recipe and ingredient eligibility.",
          add: "Add Product Type", edit: "Edit Product Type", delete: "Delete Product Type", save: "Save",
          name: "Product Type Name", arabicName: "Arabic Name", ingredient: "Can be used as an Ingredient?", recipes: "Can have Recipes?",
          yes: "Yes", no: "No", choose: "Select Yes or No", search: "Search product types…",
          retire: "Retire",
          confirmRetire: "Retire {{name}}? Existing records will remain readable, but this type cannot be selected for new use.",
          retired: "This Product Type has been retired and cannot be used for new records.",
          confirmDelete: "Delete {{name}}?", blank: "Enter both the Product Type Name and Arabic Name.",
          duplicate: "A Product Type with this name already exists.", stale: "This Product Type has changed. Close and reopen it before trying again.",
          permission: "You do not have permission for this action.", inUse: "This Product Type is referenced by existing Products and cannot be deleted.",
          protected: "This Product Type is required by the system or has issued Product Codes and cannot be deleted.",
          systemDeleteProtected: "This product type cannot be deleted because it is a system-defined product type.",
          issuedCodesDeleteProtected: "This product type cannot be deleted because product codes have already been issued under it. Use Retire instead.",
          historyDeleteProtected: "This product type cannot be deleted because it has protected product-code or historical records. Use Retire instead.",
          ingredientInUse: "This Product Type is currently used by Recipe Ingredients. Ingredient eligibility cannot be turned off.",
          recipeInUse: "Products of this Product Type currently have Recipes. Recipe eligibility cannot be turned off.",
          configuration: "Select Yes or No for both eligibility settings.", failed: "Unable to complete this action. Please try again.",
          loadFailed: "Unable to load Product Types. Please refresh and try again.",
        },
        masterData: {
          title: "Master Data",
          productTypes: "Product Types",
          description: "Manage categories, units and product types used across the system.",
          categories: "Categories", units: "Units",
          categoryDescription: "Manage product categories used in Product Master.",
          unitDescription: "Manage measurement units used in products and recipes.",
          typeDescription: "System-defined product types used for recipes, ingredients and product code generation.",
          addCategory: "Add Category", addUnit: "Add Unit",
          categorySearch: "Search categories…", unitSearch: "Search units…",
          categoryName: "Category Name", unitName: "Unit Name",
          actions: "Actions", readOnly: "Read Only",
        },

        userModal: {
          title: "Add New User",
          subtitle: "Create login details and assign a role.",
          accountInformation: "Account Information",
          accountSubtitle: "Enter employee login details.",
          username: "Username",
          password: "Password",
          passwordPlaceholder: "Minimum 6 characters",
          confirmPassword: "Confirm Password",
          repeatPassword: "Repeat password",
          role: "Role",
          signInNote: "Employees sign in using their username and temporary password.",
          createUser: "Create User",
        },

        roleModal: {
          title: "Add New Role",
          subtitle: "Create a new job title.",
          roleName: "Role Name",
          roleNamePlaceholder: "Recipe Supervisor",
          description: "Description",
          descriptionPlaceholder: "Describe the role",
          createRole: "Create Role",
        },

        passwordModal: {
          title: "Reset Password",
          subtitle: "Create a new password for {{name}}.",
          newPassword: "New Password",
        },

        delete: {
          title: "Confirm Action",
          prompt: "Are you sure you want to delete",
          confirm: "Confirm",
        },

        success: {
          title: "Success",
          ok: "OK",
          generalSaved: "General settings saved successfully.",
          roleAssigned: "{{name}} is now assigned to {{role}}.",
          userCreated: "User created successfully.",
          roleCreated: "Role created successfully.",
          roleDeleted: "Role deleted successfully.",
          userDeleted: "User deleted successfully.",
          passwordReset: "Password reset successfully.",
          permissionsSaved: "Permissions saved successfully.",
        },

        errors: {
          couldNotLoad: "Could not load settings.",
          couldNotSaveGeneral: "Could not save general settings.",
          couldNotChangeRole: "Could not change employee role.",
          completeRequired: "Please complete all required fields.",
          passwordLength: "Password must be at least 6 characters.",
          passwordMismatch: "Passwords do not match.",
          couldNotCreateUser: "Could not create user.",
          enterRoleName: "Please enter role name.",
          roleExists: "This role already exists.",
          couldNotCreateRole: "Could not create role.",
          couldNotDelete: "Could not delete the selected item.",
          couldNotResetPassword: "Could not reset password.",
          couldNotSavePermissions: "Could not save permissions.",
        },
      },

      /* =================================================
          RECIPE STATUS
      ================================================= */

      status: {

        draft:
          "Draft",

        submitted:
          "Submitted",

        pendingApproval:
          "Pending Approval",

        underReview:
          "Under Review",

        waitingApproval:
          "Waiting Approval",

        approved:
          "Approved",

        rejected:
          "Rejected",

        erpPending:
          "ERP Pending",

        erpCompleted:
          "ERP Completed",
      },


      /* =================================================
          PRODUCT TYPES
      ================================================= */

      productTypes: {

        finishedProduct:
          "Finished Product",

        semiFinished:
          "Semi-Finished",

        rawMaterial:
          "Raw Material",

        packaging:
          "Packaging",
      },


      /* =================================================
          ROLES
      ================================================= */

      roles: {

        user:
          "User",

        administrator:
          "Administrator",

        admin:
          "Admin",

        manager:
          "Manager",

        headChef:
          "Head Chef",

        approver:
          "Approver",

        erpUser:
          "ERP User",
      },
    },
  },


  /* =====================================================
      ARABIC
  ===================================================== */

  ar: {
    translation: {
      notifications: {
        markAllRead: "تحديد الكل كمقروء", unreadCount: "الإشعارات: {{count}} غير مقروء",
        loadError: "تعذر تحديث الإشعارات. يرجى المحاولة مرة أخرى.",
        readError: "تعذر تحديد الإشعار كمقروء. يرجى المحاولة مرة أخرى.",
        unavailable: "هذا المحتوى لم يعد متاحًا أو ليس لديك صلاحية الوصول إليه.",
        resolved: "لم تعد المهمة معلقة", reason: "السبب: {{reason}}",
        events: {
          pending_approval: { title: "وصفة بانتظار الموافقة", message: "{{name}} ({{code}}) بانتظار مراجعتك." },
          approved: { title: "تمت الموافقة على الوصفة", message: "تمت الموافقة على {{name}} ({{code}})." },
          rejected: { title: "تم رفض الوصفة", message: "تم رفض {{name}} ({{code}})." },
          erp_pending: { title: "وصفة جاهزة لإدخال ERP", message: "تمت الموافقة على {{name}} ({{code}}) وهي جاهزة لإدخال ERP." },
          erp_completed: { title: "اكتمل إدخال ERP", message: "اكتمل إدخال {{name}} ({{code}}) في ERP." },
          reader_assigned: { title: "تم إسناد وصفة إليك", message: "تم إسناد {{name}} ({{code}}) إليك للقراءة." },
          reader_revoked: { title: "تم إلغاء إسناد الوصفة", message: "لم تعد {{name}} ({{code}}) مسندة إليك." },
        },
      },
      recipeReaders: {
        assignedToMe: "المسندة إليّ",
        "mine": "الوصفات المسندة إليّ",
        "assignments": "إسناد قارئي الوصفات",
        "assign": "إسناد إلى قارئ",
        "searchUsers": "ابحث عن مستخدم…",
        "chooseUser": "اختر القارئ",
        "reader": "القارئ",
        "assignedBy": "أُسندت بواسطة",
        "assignedAt": "وقت الإسناد",
        "readAt": "وقت القراءة",
        "assignmentStatus": "حالة الإسناد",
        "actions": "الإجراءات",
        "active": "نشط",
        "revoked": "ملغى",
        "revoke": "إلغاء الإسناد",
        "revokePrompt": "هل تريد إلغاء إسناد {{name}}؟ سيتم الاحتفاظ بالسجل.",
        "noAssignments": "لا توجد إسنادات للقراء بعد.",
        "noMine": "لا توجد وصفات مسندة إليك.",
        "unread": "لم تُقرأ",
        "recipe": "الوصفة المسندة",
        "back": "العودة إلى الوصفات المسندة",
        "code": "رمز الوصفة",
        "name": "اسم الوصفة",
        "open": "فتح الوصفة",
        "awaitingApproval": "غير متاحة حتى الاعتماد",
        "readOnly": "للقراءة فقط — يتيح الإسناد عرض الوصفة وتأكيد قراءتها وطباعتها فقط.",
        "markRead": "تأكيد القراءة",
        "read": "تمت القراءة",
        "print": "طباعة",
        "description": "الوصف",
        "category": "الفئة",
        "type": "نوع المنتج",
        "yield": "الكمية الناتجة",
        "ingredient": "المكون",
        "quantity": "الكمية",
        "unit": "الوحدة",
        "notes": "ملاحظات",
        "field": "الحقل",
        "value": "القيمة",
        "errors": {
                "permission": "لم تعد لديك صلاحية تنفيذ هذا الإجراء.",
                "not_approved": "تتاح القراءة للوصفات المعتمدة أو قيد إدخال نظام ERP أو المكتملة في نظام ERP فقط.",
                "not_found": "تعذر العثور على الوصفة أو الإسناد.",
                "stale": "تغيرت الوصفة. أغلق هذه النافذة وأعد تحميل الوصفة ثم حاول مجددًا.",
                "inactive": "المستخدم المحدد لم يعد نشطًا.",
                "duplicate": "هذا المستخدم لديه بالفعل إسناد نشط لهذه الوصفة.",
                "unavailable": "هذا الإسناد غير متاح. ربما تم إلغاؤه أو أصبحت الوصفة بانتظار الاعتماد.",
                "failed": "تعذر إكمال الإجراء. يرجى المحاولة مرة أخرى."
        }
},

      /* =================================================
          GENERAL
      ================================================= */

      common: {
        english: "الإنجليزية",
        arabic: "العربية",

        search: "بحث",
        searchAnything: "ابحث عن أي شيء...",

        loading: "جاري التحميل...",
        saving: "جاري الحفظ...",

        viewAll: "عرض الكل",

        cancel: "إلغاء",
        close: "إغلاق",

        edit: "تعديل",
        delete: "حذف",

        add: "إضافة",
        save: "حفظ",

        tryAgain: "إعادة المحاولة",

        previousPage: "الصفحة السابقة",
        nextPage: "الصفحة التالية",

        user: "مستخدم",

        total: "الإجمالي",

        recipes: "وصفات",

        showing: "عرض",
        to: "إلى",
        of: "من أصل",
      },


      /* =================================================
          SIDEBAR
      ================================================= */

      sidebar: {

        dashboard:
          "لوحة التحكم",

        recipes:
          "الوصفات",

        productMaster:
          "المنتجات",

        erpEntry:
          "إدخال ERP",

        reports:
          "التقارير",

        auditTrail:
          "سجل النشاط",

        settings:
          "الإعدادات",

        logout:
          "تسجيل الخروج",

        loggingOut:
          "جاري تسجيل الخروج...",

        logoutError:
          "تعذر تسجيل الخروج. يرجى المحاولة مرة أخرى.",
      },


      /* =================================================
          HEADER
      ================================================= */

      header: {

        searchAnything:
          "ابحث عن أي شيء...",

        notifications:
          "الإشعارات",

        loadingNotifications:
          "جاري تحميل الإشعارات...",

        noNotifications:
          "لا توجد إشعارات حتى الآن.",

        chooseImageError:
          "يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP.",

        imageSizeError:
          "يجب أن يكون حجم الصورة أقل من 5 ميجابايت.",

        imageLoadError:
          "تعذر تحميل الصورة.",


        /* =============================================
            PAGE TITLES
        ============================================= */

        dashboard: {

          welcomeBack:
            "مرحبًا بعودتك، {{name}} 👋",

          subtitle: "",
        },


        recipes: {

          title:
            "الوصفات",

          subtitle:
            "إدارة وتنظيم جميع الوصفات.",

          addNewRecipe:
            "إضافة وصفة جديدة",
        },


        createRecipe: {

          title:
            "إنشاء وصفة جديدة",

          subtitle:
            "أنشئ وصفة جديدة وأضف مكوناتها.",
        },


        recipeDetails: {

          title:
            "تفاصيل الوصفة",

          subtitle:
            "عرض معلومات الوصفة ومكوناتها.",
        },


        productMaster: {

          title:
            "المنتجات",

          subtitle:
            "إدارة جميع المنتجات المستخدمة في الوصفات.",

          addNewProduct:
            "إضافة منتج جديد",
        },


        erpEntry: {

          title:
            "إدخال ERP",

          subtitle:
            "إدارة الوصفات الجاهزة للإدخال إلى نظام ERP.",
        },


        erpEntryDetails: {

          title:
            "تفاصيل إدخال ERP",

          subtitle:
            "عرض تفاصيل الوصفة واستكمال إدخالها إلى نظام ERP.",
        },


        reports: {

          title:
            "التقارير",

          subtitle:
            "عرض تقارير الوصفات وسير العمل.",
        },


        auditTrail: {

          title:
            "سجل النشاط",

          subtitle:
            "متابعة إجراءات الوصفات وتغييرات الحالة.",
        },


        settings: {

          title:
            "الإعدادات",

          subtitle:
            "إدارة إعدادات النظام والمستخدمين.",
        },


        defaultPage: {

          title:
            "إدارة الوصفات",

          subtitle: "",
        },
      },

      login: {
  welcomeBack:
    "مرحبًا بعودتك",

  subtitle:
    "يرجى تسجيل الدخول إلى حسابك",

  adminManager:
    "المدير / المسؤول",

  employee:
    "الموظف",

  username:
    "اسم المستخدم",

  usernamePlaceholder:
    "أدخل اسم المستخدم",

  password:
    "كلمة المرور",

  passwordPlaceholder:
    "أدخل كلمة المرور",

  forgotPassword:
    "نسيت كلمة المرور؟",

  signIn:
    "تسجيل الدخول",

  signingIn:
    "جاري تسجيل الدخول...",

  showPassword:
    "إظهار كلمة المرور",

  hidePassword:
    "إخفاء كلمة المرور",

  errors: {
    enterCredentials:
      "يرجى إدخال اسم المستخدم وكلمة المرور.",

    couldNotSignIn:
      "تعذر تسجيل الدخول.",

    sessionError:
      "تعذر إنشاء جلسة المستخدم.",

    incorrectCredentials:
      "اسم المستخدم أو كلمة المرور غير صحيحة.",
  },
},


      /* =================================================
          DASHBOARD
      ================================================= */

      dashboard: {

        loading:
          "جاري تحميل لوحة التحكم...",

        loadError:
          "تعذر تحميل لوحة التحكم.",

        tryAgain:
          "إعادة المحاولة",


        /* =============================================
            STATS
        ============================================= */

        stats: {

          totalRecipes:
            "إجمالي الوصفات",

          draft:
            "مسودة",

          waitingApproval:
            "بانتظار الموافقة",

          erpPending:
            "بانتظار إدخال ERP",

          erpCompleted:
            "تم إدخال ERP",

          rejected:
            "مرفوض",

          percentOfTotal:
            "{{value}}% من الإجمالي",

          noChangeLastMonth:
            "0% مقارنة بالشهر الماضي",

          increaseLastMonth:
            "↑ {{value}}% مقارنة بالشهر الماضي",

          decreaseLastMonth:
            "↓ {{value}}% مقارنة بالشهر الماضي",
        },


        /* =============================================
            CHARTS
        ============================================= */

        charts: {

          recipesByStatus:
            "الوصفات حسب الحالة",

          recipesByCategory:
            "الوصفات حسب الفئة",
          uncategorized: "غير مصنف",

          viewAll:
            "عرض الكل",

          total:
            "الإجمالي",

          recipeCount:
            "{{value}} وصفة",

          recipes:
            "الوصفات",
        },


        /* =============================================
            RECENT RECIPES
        ============================================= */

        recentRecipes: {

          title:
            "أحدث الوصفات",

          searchPlaceholder:
            "ابحث في الوصفات...",

          noRecipes:
            "لا توجد وصفات.",


          /* =========================================
              FILTERS
          ========================================= */

          filters: {

            allStatus:
              "جميع الحالات",

            draft:
              "مسودة",

            waitingApproval:
              "بانتظار الموافقة",

            approved:
              "تمت الموافقة",

            erpPending:
              "بانتظار إدخال ERP",

            erpCompleted:
              "تم إدخال ERP",

            rejected:
              "مرفوض",


            allTypes:
              "جميع الأنواع",

            finishedProduct:
              "منتج نهائي",

            semiFinished:
              "منتج نصف مصنع",

            rawMaterial:
              "مادة خام",

            packaging:
              "تغليف",
          },


          /* =========================================
              TABLE
          ========================================= */

          table: {

            recipeName:
              "اسم الوصفة",

            type:
              "النوع",

            yield:
              "الكمية الناتجة",

            status:
              "الحالة",

            assignedTo:
              "مسند إلى",

            lastUpdated:
              "آخر تحديث",
          },


          /* =========================================
              PAGINATION
          ========================================= */

          pagination: {

            showing:
              "عرض",

            to:
              "إلى",

            of:
              "من أصل",

            recipes:
              "وصفة",

            previousPage:
              "الصفحة السابقة",

            nextPage:
              "الصفحة التالية",
          },
        },
      },



      /* =================================================
          RECIPES PAGE
      ================================================= */

      recipesPage: {
        loading: "جاري تحميل الوصفات...",
        backToRecipes: "العودة إلى الوصفات",
        noRecipesFound: "لا توجد وصفات.",
        noDescription: "لا يوجد وصف",

        tabs: {
          allRecipes: "جميع الوصفات",
          draft: "مسودة",
          submitted: "تم الإرسال",
          pendingApproval: "بانتظار الموافقة",
          approved: "تمت الموافقة",
          rejected: "مرفوض",
          erpPending: "بانتظار إدخال ERP",
          erpCompleted: "تم إدخال ERP",
        },

        stats: {
          finishedProducts: "المنتجات النهائية",
          semiFinished: "المنتجات نصف المصنعة",
          pendingApproval: "بانتظار الموافقة",
          recipeProducts: "منتجات الوصفات",
          requiresReview: "تحتاج إلى مراجعة",
        },

        filters: {
          searchPlaceholder: "ابحث في الوصفات...",
          allTypes: "جميع الأنواع",
          allCategories: "جميع الفئات",
        },

        table: {
          id: "المعرف",
          recipeName: "اسم الوصفة",
          status: "الحالة",
          requestedBy: "مقدم الطلب",
          lastUpdated: "آخر تحديث",
          actions: "الإجراءات",
          action: "الإجراء",
          actionsFor: "إجراءات {{name}}",
        },

        form: {
          editRecipe: "تعديل الوصفة",
          createRecipe: "إنشاء وصفة جديدة",
          editSubtitle: "تحديث معلومات الوصفة ومكوناتها.",
          createSubtitle: "أضف معلومات الوصفة ومكوناتها.",
          recipeInformation: "معلومات الوصفة",
          selectProductHelp: "اختر منتجًا من قائمة المنتجات.",
          product: "المنتج",
          selectProduct: "اختر المنتج",
          productType: "نوع المنتج",
          type: "النوع",
          category: "الفئة",
          yield: "الكمية الناتجة",
          yieldUnit: "وحدة الكمية الناتجة",
          yieldPlaceholder: "مثال: 40",
          description: "الوصف",
          descriptionPlaceholder: "أدخل وصف الوصفة...",
          quantity: "الكمية",
          unit: "الوحدة",
        },

        voice: {
          languageLabel: "لغة الإملاء الصوتي",
          start: "إملاء الوصف",
          stop: "إيقاف",
          starting: "جارٍ تجهيز الميكروفون…",
          recording: "جارٍ التسجيل… تحدث الآن. راجع النص قبل الحفظ.",
          stopping: "جارٍ الإيقاف…",
          unsupported: "الإدخال الصوتي غير مدعوم في هذا المتصفح. يرجى كتابة الوصف.",
          denied: "تم رفض إذن الميكروفون. اسمح به من إعدادات المتصفح ثم حاول مرة أخرى.",
          microphone: "الميكروفون غير متاح. تحقق من الميكروفون وحاول مرة أخرى.",
          noSpeech: "لم يتم اكتشاف كلام. يرجى المحاولة مرة أخرى.",
          network: "تعذر اتصال خدمة التعرف على الكلام. تحقق من الاتصال أو اكتب الوصف.",
          language: "تعذر على المتصفح التعرف على هذه اللغة. يرجى كتابة الوصف.",
          failed: "تعذر بدء الإدخال الصوتي أو انقطع. حاول مرة أخرى أو اكتب الوصف.",
        },

        validation: {
          product: "يرجى اختيار منتج.",
          yield: "يرجى إدخال كمية ناتجة أكبر من صفر.",
          ingredients: "يرجى إضافة مكون واحد على الأقل.",
          ingredientsRequiredOnSubmit: "مطلوبة فقط عند الإرسال للموافقة.",
        },
        ingredients: {
          title: "المكونات",
          subtitle: "أضف جميع المنتجات المطلوبة لهذه الوصفة.",
          addIngredient: "إضافة مكون",
          editIngredient: "تعديل مكون",
          updateIngredient: "تحديث المكون",
          ingredient: "المكون",
          selectIngredient: "اختر المكون",
          noneAdded: "لم تتم إضافة مكونات بعد.",
          noIngredients: "لا توجد مكونات.",
        },

        actions: {
          saveDraft: "حفظ كمسودة",
          submitForApproval: "إرسال للموافقة",
          saveChanges: "حفظ التغييرات",
          processing: "جاري التنفيذ...",
          approve: "موافقة",
          reject: "رفض",
        },

        details: {
          notFound: "لم يتم العثور على الوصفة",
          rejectionReason: "سبب الرفض:",
          createdBy: "تم الإنشاء بواسطة",
        },

        reject: {
          title: "رفض الوصفة",
          prompt: "يرجى إدخال سبب رفض",
          placeholder: "أدخل سبب الرفض...",
          rejecting: "جاري الرفض...",
          confirmReject: "تأكيد الرفض",
        },

        delete: {
          title: "تأكيد الإجراء",
          prompt: "هل أنت متأكد من حذف",
          deleting: "جاري الحذف...",
          cancel: "لا",
          confirm: "نعم",
        },

        pagination: {
          showing: "عرض {{from}} إلى {{to}} من أصل {{total}} وصفة",
        },

        errors: {
          couldNotLoad: "تعذر تحميل الوصفات.",
          selectProductFirst: "يرجى اختيار المنتج أولًا.",
          ingredientAlreadyAdded: "تمت إضافة هذا المكون بالفعل.",
          couldNotSave: "تعذر حفظ الوصفة.",
          couldNotUpdate: "تعذر تحديث الوصفة.",
          couldNotDelete: "تعذر حذف الوصفة.",
          couldNotApprove: "تعذر اعتماد الوصفة.",
          enterRejectionReason: "يرجى إدخال سبب الرفض.",
          couldNotReject: "تعذر رفض الوصفة.",
        },
      },




      /* =================================================
          PRODUCT MASTER PAGE
      ================================================= */

      productMasterPage: {
        loading: "جاري تحميل المنتجات...",
        noProducts: "لا توجد منتجات.",
        management: {
          categories: "إدارة الفئات", units: "إدارة الوحدات",
          selectCategory: "اختر الفئة", selectUnit: "اختر الوحدة الأساسية",
          newValue: "قيمة جديدة", editValue: "تعديل القيمة", add: "إضافة", save: "حفظ",
          delete: "حذف", close: "إغلاق",
          confirmDelete: 'هل تريد حذف "{{value}}"؟ يمكن حذف القيم غير المستخدمة فقط.',
          blank: "أدخل قيمة غير فارغة.", duplicate: "هذه القيمة موجودة بالفعل.",
          inUse: "لا يمكن تعديل اسم هذه القيمة أو حذفها لأنها مستخدمة حالياً.",
          categoryDeleteInUse: "لا يمكن حذف هذه الفئة لأنها مستخدمة حالياً في منتجات موجودة.",
          unitDeleteInUse: "لا يمكن حذف هذه الوحدة لأنها مستخدمة حالياً في النظام.",
          stale: "تم تغيير هذه القيمة. أغلق نموذج المنتج وأعد فتحه لتحديث البيانات.",
          permission: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
          activeRequired: "اختر الفئة والوحدة الأساسية من الخيارات المتاحة.",
          failed: "تعذر حفظ القيمة. حاول مرة أخرى.",
          loadFailed: "تعذر تحميل الفئات والوحدات. أغلق النموذج وأعد فتحه للمحاولة مجدداً.",
        },

        stats: {
          totalProducts: "إجمالي المنتجات",
          productsWithRecipe: "المنتجات التي لها وصفة",
          categories: "الفئات",
          rawMaterials: "المواد الخام",
          hundredPercent: "100% من الإجمالي",
          ofTotal: "من الإجمالي",
          totalCategories: "إجمالي الفئات",
          totalRawMaterials: "إجمالي المواد الخام",
        },

        filters: {
          searchPlaceholder: "ابحث في المنتجات...",
          allTypes: "جميع الأنواع",
          allCategories: "جميع الفئات",
          allUnits: "جميع الوحدات",
          clear: "مسح الفلاتر",
        },

        table: {
          productCode: "كود المنتج",
          productName: "اسم المنتج",
          type: "النوع",
          category: "الفئة",
          baseUnit: "الوحدة الأساسية",
          recipeStatus: "حالة الوصفة",
          lastUpdated: "آخر تحديث",
          actions: "الإجراءات",
        },

        recipeStatus: {
          available: "الوصفة متاحة",
          none: "لا توجد وصفة",
        },

        units: {
          kg: "كجم",
          gram: "جرام",
          piece: "قطعة",
          litre: "لتر",
          ml: "مل",
          pack: "عبوة",
        },

        pagination: {
          showing: "عرض {{from}} إلى {{to}} من أصل {{total}} منتج",
        },

        delete: {
          title: "تأكيد الإجراء",
          prompt: "هل أنت متأكد من حذف",
          deleting: "جاري الحذف...",
          confirm: "تأكيد",
        },

        form: {
          editProduct: "تعديل المنتج",
          addNewProduct: "إضافة منتج جديد",
          editSubtitle: "تحديث معلومات المنتج.",
          addSubtitle: "إضافة منتج جديد إلى قائمة المنتجات.",
          productName: "اسم المنتج",
          productType: "نوع المنتج",
          category: "الفئة",
          baseUnit: "الوحدة الأساسية",
          description: "الوصف",
          namePlaceholder: "أدخل اسم المنتج",
          categoryPlaceholder: "مثال: الدقيق",
          descriptionPlaceholder: "أدخل وصف المنتج...",
          saveChanges: "حفظ التغييرات",
          addProduct: "إضافة المنتج",
        },

        errors: {
          couldNotLoad: "تعذر تحميل المنتجات.",
          usedInRecipe: "لا يمكن حذف هذا المنتج لأنه مستخدم بالفعل في وصفة.",
          couldNotDelete: "تعذر حذف المنتج.",
          nameCategoryRequired: "اسم المنتج والفئة مطلوبان.",
          noEditPermission: "ليس لديك صلاحية لتعديل المنتجات.",
          noAddPermission: "ليس لديك صلاحية لإضافة المنتجات.",
          duplicateProduct: "يوجد منتج بنفس الكود أو القيمة الفريدة بالفعل.",
          couldNotSave: "تعذر حفظ المنتج.",
          productTypeConfiguration: "نوع المنتج المحدد غير مُهيّأ بشكل صحيح. يرجى التواصل مع مسؤول النظام.",
        },
      },


      /* =================================================
          ERP ENTRY
      ================================================= */

      erpEntryPage: {
        loading: "جاري تحميل وصفات ERP...",
        empty: "لا توجد وصفات معتمدة جاهزة للإدخال إلى ERP.",

        filters: {
          searchPlaceholder: "ابحث في الوصفات...",
          allTypes: "جميع الأنواع",
          allCategories: "جميع الفئات",
          erpPending: "حالة ERP: قيد الانتظار",
          erpCompleted: "حالة ERP: مكتمل",
          allStatuses: "جميع حالات ERP",
          clearFilters: "تصفية",
        },

        table: {
          recipeName: "اسم الوصفة",
          type: "النوع",
          category: "الفئة",
          yield: "الكمية الناتجة",
          approvedOn: "تاريخ الموافقة",
          status: "الحالة",
          action: "الإجراء",
        },

        actions: {
          enterERP: "إدخال ERP",
          completed: "مكتمل",
        },
        
        pagination: {
          showing: "عرض {{from}} إلى {{to}} من أصل {{total}} وصفة",
        },

        errors: {
          couldNotLoad: "تعذر تحميل وصفات ERP.",
        },
      },

      erpDetailsPage: {
        loading: "جاري تحميل تفاصيل ERP...",
        notFound: "لم يتم العثور على الوصفة",
        back: "العودة إلى إدخال ERP",
        erpEntry: "إدخال ERP",
        subtitle: "تفاصيل الوصفة وإدخال ERP",
        unnamedRecipe: "وصفة بدون اسم",
        recipeApprover: "مسؤول اعتماد الوصفة",
        noDescription: "لا يوجد وصف",

        fields: {
          type: "النوع",
          category: "الفئة",
          yield: "الكمية الناتجة",
          status: "الحالة",
          id: "المعرف",
          description: "الوصف",
        },

        approval: {
          title: "معلومات الموافقة",
          approvedBy: "تمت الموافقة بواسطة",
          approvedOn: "تاريخ الموافقة",
          status: "حالة الموافقة",
        },

        form: {
          reference: "مرجع ERP",
          entryDate: "تاريخ إدخال ERP",
          enteredBy: "تم الإدخال بواسطة",
          notes: "ملاحظات ERP",
          optional: "(اختياري)",
          notesPlaceholder: "أدخل أي ملاحظات إضافية...",
        },

        actions: {
          completed: "تم إدخال ERP",
          completing: "جاري الإكمال...",
          markCompleted: "تحديد كـ ERP مكتمل",
        },

        errors: {
          couldNotLoad: "تعذر تحميل تفاصيل ERP.",
          couldNotCreate: "تعذر إنشاء إدخال ERP.",
          couldNotComplete: "تعذر إكمال إدخال ERP.",
        },
      },



      /* =================================================
          REPORTS PAGE
      ================================================= */

      reportsPage: {
        loading: "جاري تحميل التقارير...",
        noReports: "لا توجد تقارير.",

        filters: {
          title: "فلاتر التقارير",
          subtitle: "حدد نتائج التقرير باستخدام الفلاتر أدناه.",
          from: "من",
          to: "إلى",
          allTypes: "جميع الأنواع",
          allCategories: "جميع الفئات",
          allStatus: "جميع الحالات",
          clear: "مسح الفلاتر",
        },

        export: {
          export: "تصدير",
          pdf: "تصدير PDF",
          excel: "تصدير Excel",
        },

        table: {
          title: "تقرير الوصفات",
          showingRecords: "عرض {{from}} إلى {{to}} من أصل {{total}} سجل",
          recipeName: "اسم الوصفة",
          type: "النوع",
          category: "الفئة",
          yield: "الكمية الناتجة",
          status: "الحالة",
          assignedTo: "مسند إلى",
          lastUpdated: "آخر تحديث",
          actions: "الإجراءات",
        },

        actions: {
          moreActions: "المزيد من الإجراءات",
          viewDetails: "عرض التفاصيل",
        },

        details: {
          subtitle: "معلومات التقرير الكاملة لهذه الوصفة.",
          recipeId: "معرف الوصفة",
          recipeName: "اسم الوصفة",
          type: "النوع",
          category: "الفئة",
          yield: "الكمية الناتجة",
          status: "الحالة",
          assignedTo: "مسند إلى",
          requestedBy: "مقدم الطلب",
          createdAt: "تاريخ الإنشاء",
          lastUpdated: "آخر تحديث",
        },

        pagination: {
          showing: "عرض {{from}} إلى {{to}} من أصل {{total}} وصفة",
        },

        errors: {
          couldNotLoad: "تعذر تحميل التقارير.",
        },
      },



      /* =================================================
          AUDIT TRAIL PAGE
      ================================================= */

      auditTrailPage: {
        loading: "جاري تحميل سجل النشاط...",
        noRecords: "لا توجد سجلات نشاط.",
        filters: {
          from: "من",
          to: "إلى",
          allTypes: "جميع الأنواع",
          allStatus: "جميع الحالات",
          searchPlaceholder: "ابحث عن وصفة...",
        },
        export: {
          export: "تصدير",
          pdf: "تصدير PDF",
          excel: "تصدير Excel",
        },
        table: {
          recipeId: "معرف الوصفة",
          recipeName: "اسم الوصفة",
          type: "النوع",
          category: "الفئة",
          yield: "الكمية الناتجة",
          currentStatus: "الحالة الحالية",
          createdBy: "تم الإنشاء بواسطة",
          createdAt: "تاريخ الإنشاء",
          lastUpdated: "آخر تحديث",
          actions: "الإجراءات",
        },
        actions: {
          moreActions: "المزيد من الإجراءات",
          viewDetails: "عرض التفاصيل",
        },
        details: {
          subtitle: "عرض السجل الكامل للوصفة ومعلومات التدقيق.",
          recipeId: "معرف الوصفة",
          category: "الفئة",
          yield: "الكمية الناتجة",
          currentStatus: "الحالة الحالية",
          creationInformation: "معلومات الإنشاء",
          createdBy: "تم الإنشاء بواسطة",
          createdAt: "تاريخ الإنشاء",
          lastUpdated: "آخر تحديث",
          decision: "القرار",
          title: "تفاصيل سجل الوصفة",
          recipeInformation: "معلومات الوصفة",
          approvalInformation: "معلومات الموافقة",
          erpInformation: "معلومات ERP",
          activityTimeline: "سجل النشاط",
          productCode: "كود المنتج",
          productType: "نوع المنتج",
          submittedAt: "تاريخ الإرسال",
          approvalDecision: "قرار الموافقة",
          approvedBy: "تمت الموافقة بواسطة",
          approvedAt: "تاريخ الموافقة",
          rejectedBy: "تم الرفض بواسطة",
          rejectedAt: "تاريخ الرفض",
          reviewRound: "جولة المراجعة",
          rejectionReason: "سبب الرفض / الإرجاع",
          erpReference: "مرجع ERP",
          erpStatus: "حالة ERP",
          erpEntryDate: "تاريخ إدخال ERP",
          enteredBy: "تم الإدخال بواسطة",
          erpCreatedAt: "تاريخ إنشاء ERP",
          erpCompletedAt: "تاريخ اكتمال ERP",
          erpNotes: "ملاحظات ERP",
          noActivity: "لا يوجد سجل نشاط لهذه الوصفة حتى الآن.",
        },
        values: {
          completed: "مكتمل",
          pending: "قيد الانتظار",
        },
        values: {
  completed: "مكتمل",
},

        pagination: {
          showing: "عرض {{from}} إلى {{to}} من أصل {{total}} وصفة",
        },
        errors: {
          couldNotLoad: "تعذر تحميل سجل النشاط.",
        },
      },



      /* =================================================
          SETTINGS PAGE
      ================================================= */

      settingsPage: {
        permissionModules: { general: "الإعدادات العامة", accounts: "الصلاحيات وحقوق المستخدمين", master: "البيانات الأساسية" },
        loading: "جاري تحميل الإعدادات...",

        tabs: {
          general: "الإعدادات العامة",
          permissions: "الصلاحيات وحقوق المستخدمين",
        },

        general: {
          title: "الإعدادات العامة",
          subtitle: "إدارة تفضيلاتك الشخصية.",
          fullName: "الاسم الكامل",
          email: "البريد الإلكتروني",
          language: "اللغة",
          saveChanges: "حفظ التغييرات",
        },

        permissions: {
          employees: "الموظفون",
          selectEmployee: "اختر موظفًا",
          addNewUser: "إضافة مستخدم جديد",
          searchEmployees: "ابحث عن موظف...",
          roles: "الأدوار",
          chooseRole: "اختر دورًا",
          searchRoles: "ابحث عن دور...",
          addNewRole: "إضافة دور جديد",
          managePasswords: "إدارة كلمات مرور المستخدمين والوصول إلى الحساب",
          assignedTo: "مُعيّن إلى",
          resetPassword: "إعادة تعيين كلمة المرور",
          allPermissions: "جميع الصلاحيات",
          toggleAll: "تشغيل أو إيقاف جميع الصلاحيات",
          module: "القسم",
          view: "عرض",
          add: "إضافة",
          edit: "تعديل",
          delete: "حذف",
          print: "طباعة",
          selectedRole: "الدور المحدد:",
          savePermissions: "حفظ الصلاحيات",
        },
        productTypeManagement: {
          description: "إدارة أنواع المنتجات وإمكانية استخدامها في الوصفات والمكونات.",
          add: "إضافة نوع منتج", edit: "تعديل نوع المنتج", delete: "حذف نوع المنتج", save: "حفظ",
          name: "اسم نوع المنتج", arabicName: "الاسم بالعربية", ingredient: "يمكن استخدامه كمكون؟", recipes: "يمكن أن تكون له وصفات؟",
          yes: "نعم", no: "لا", choose: "اختر نعم أو لا", search: "البحث في أنواع المنتجات…",
          retire: "إحالة للتقاعد",
          confirmRetire: "هل تريد إحالة {{name}} للتقاعد؟ ستظل السجلات الحالية قابلة للعرض، ولن يتاح اختيار هذا النوع للاستخدام الجديد.",
          retired: "تمت إحالة نوع المنتج هذا للتقاعد ولا يمكن استخدامه في سجلات جديدة.",
          confirmDelete: "حذف {{name}}؟", blank: "أدخل اسم نوع المنتج والاسم بالعربية.",
          duplicate: "يوجد نوع منتج بهذا الاسم بالفعل.", stale: "تم تغيير نوع المنتج. أغلق النافذة وأعد فتحها قبل المحاولة مجددًا.",
          permission: "ليس لديك صلاحية لتنفيذ هذا الإجراء.", inUse: "نوع المنتج مستخدم في منتجات موجودة ولا يمكن حذفه.",
          protected: "نوع المنتج مطلوب للنظام أو سبق أن أصدر أكواد منتجات ولا يمكن حذفه.",
          systemDeleteProtected: "لا يمكن حذف نوع المنتج هذا لأنه نوع منتج مُعرّف من النظام.",
          issuedCodesDeleteProtected: "لا يمكن حذف نوع المنتج هذا لأن أكواد منتجات قد صدرت بالفعل ضمنه. استخدم الإحالة للتقاعد بدلاً من ذلك.",
          historyDeleteProtected: "لا يمكن حذف نوع المنتج هذا لوجود أكواد منتجات أو سجلات تاريخية محمية مرتبطة به. استخدم الإحالة للتقاعد بدلاً من ذلك.",
          ingredientInUse: "نوع المنتج مستخدم حاليًا في مكونات وصفات. لا يمكن إيقاف استخدامه كمكون.",
          recipeInUse: "توجد وصفات لمنتجات من هذا النوع. لا يمكن إيقاف إمكانية إنشاء الوصفات.",
          configuration: "اختر نعم أو لا لكل من إعدادات الوصفات والمكونات.", failed: "تعذر إتمام الإجراء. حاول مرة أخرى.",
          loadFailed: "تعذر تحميل أنواع المنتجات. يرجى تحديث الصفحة والمحاولة مجددًا.",
        },
        masterData: {
          title: "البيانات الأساسية",
          productTypes: "أنواع المنتجات",
          description: "إدارة الفئات والوحدات وأنواع المنتجات المستخدمة في النظام.",
          categories: "الفئات", units: "الوحدات",
          categoryDescription: "إدارة فئات المنتجات المستخدمة في دليل المنتجات.",
          unitDescription: "إدارة وحدات القياس المستخدمة في المنتجات والوصفات.",
          typeDescription: "أنواع المنتجات المحددة في النظام للوصفات والمكونات وتوليد أكواد المنتجات.",
          addCategory: "إضافة فئة", addUnit: "إضافة وحدة",
          categorySearch: "البحث في الفئات…", unitSearch: "البحث في الوحدات…",
          categoryName: "اسم الفئة", unitName: "اسم الوحدة",
          actions: "الإجراءات", readOnly: "للقراءة فقط",
        },

        userModal: {
          title: "إضافة مستخدم جديد",
          subtitle: "أنشئ بيانات تسجيل الدخول وحدد الدور.",
          accountInformation: "معلومات الحساب",
          accountSubtitle: "أدخل بيانات تسجيل دخول الموظف.",
          username: "اسم المستخدم",
          password: "كلمة المرور",
          passwordPlaceholder: "6 أحرف على الأقل",
          confirmPassword: "تأكيد كلمة المرور",
          repeatPassword: "أعد إدخال كلمة المرور",
          role: "الدور",
          signInNote: "يسجل الموظفون الدخول باستخدام اسم المستخدم وكلمة المرور المؤقتة.",
          createUser: "إنشاء المستخدم",
        },

        roleModal: {
          title: "إضافة دور جديد",
          subtitle: "أنشئ مسمى وظيفيًا جديدًا.",
          roleName: "اسم الدور",
          roleNamePlaceholder: "مشرف الوصفات",
          description: "الوصف",
          descriptionPlaceholder: "اكتب وصف الدور",
          createRole: "إنشاء الدور",
        },

        passwordModal: {
          title: "إعادة تعيين كلمة المرور",
          subtitle: "أنشئ كلمة مرور جديدة لـ {{name}}.",
          newPassword: "كلمة المرور الجديدة",
        },

        delete: {
          title: "تأكيد الإجراء",
          prompt: "هل أنت متأكد من حذف",
          confirm: "تأكيد",
        },

        success: {
          title: "تم بنجاح",
          ok: "حسنًا",
          generalSaved: "تم حفظ الإعدادات العامة بنجاح.",
          roleAssigned: "تم تعيين {{name}} إلى دور {{role}}.",
          userCreated: "تم إنشاء المستخدم بنجاح.",
          roleCreated: "تم إنشاء الدور بنجاح.",
          roleDeleted: "تم حذف الدور بنجاح.",
          userDeleted: "تم حذف المستخدم بنجاح.",
          passwordReset: "تمت إعادة تعيين كلمة المرور بنجاح.",
          permissionsSaved: "تم حفظ الصلاحيات بنجاح.",
        },

        errors: {
          couldNotLoad: "تعذر تحميل الإعدادات.",
          couldNotSaveGeneral: "تعذر حفظ الإعدادات العامة.",
          couldNotChangeRole: "تعذر تغيير دور الموظف.",
          completeRequired: "يرجى استكمال جميع الحقول المطلوبة.",
          passwordLength: "يجب ألا تقل كلمة المرور عن 6 أحرف.",
          passwordMismatch: "كلمتا المرور غير متطابقتين.",
          couldNotCreateUser: "تعذر إنشاء المستخدم.",
          enterRoleName: "يرجى إدخال اسم الدور.",
          roleExists: "هذا الدور موجود بالفعل.",
          couldNotCreateRole: "تعذر إنشاء الدور.",
          couldNotDelete: "تعذر حذف العنصر المحدد.",
          couldNotResetPassword: "تعذر إعادة تعيين كلمة المرور.",
          couldNotSavePermissions: "تعذر حفظ الصلاحيات.",
        },
      },

      /* =================================================
          RECIPE STATUS
      ================================================= */

      status: {

        draft:
          "مسودة",

        submitted:
          "تم الإرسال",

        pendingApproval:
          "بانتظار الموافقة",

        underReview:
          "قيد المراجعة",

        waitingApproval:
          "بانتظار الموافقة",

        approved:
          "تمت الموافقة",

        rejected:
          "مرفوض",

        erpPending:
          "بانتظار إدخال ERP",

        erpCompleted:
          "تم إدخال ERP",
      },


      /* =================================================
          PRODUCT TYPES
      ================================================= */

      productTypes: {

        finishedProduct:
          "منتج نهائي",

        semiFinished:
          "منتج نصف مصنع",

        rawMaterial:
          "مادة خام",

        packaging:
          "تغليف",
      },


      /* =================================================
          ROLES
      ================================================= */

      roles: {

        user:
          "مستخدم",

        administrator:
          "مسؤول النظام",

        admin:
          "مسؤول",

        manager:
          "مدير",

        headChef:
          "رئيس الطهاة",

        approver:
          "مسؤول الموافقة",

        erpUser:
          "مستخدم ERP",
      },
    },
  },
};


/* =====================================================
    SAVED LANGUAGE
===================================================== */

const savedLanguage =
  localStorage.getItem(
    "recipe-language"
  ) || "en";


/* =====================================================
    INITIALIZE I18N
===================================================== */

i18n
  .use(
    initReactI18next
  )
  .init({

    resources,

    lng:
      savedLanguage,

    fallbackLng:
      "en",

    interpolation: {
      escapeValue:
        false,
    },
  });


const updateDirection =
  (language) => {

    const isArabic =
      language === "ar";


    document.documentElement.lang =
      language;


    document.documentElement.dir =
      isArabic
        ? "rtl"
        : "ltr";


    document.body.dir =
      isArabic
        ? "rtl"
        : "ltr";
  };


updateDirection(
  savedLanguage
);


/* =====================================================
    LANGUAGE CHANGE EVENT
===================================================== */

i18n.on(
  "languageChanged",
  (language) => {

    localStorage.setItem(
      "recipe-language",
      language
    );


    updateDirection(
      language
    );
  }
);
export default i18n;
