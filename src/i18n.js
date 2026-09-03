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

          recipesByType:
            "Recipes by Type",

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

        ingredients: {
          title: "Ingredients",
          subtitle: "Add all products required for this recipe.",
          addIngredient: "Add Ingredient",
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
          confirm: "Confirm",
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
          savePermissions: "Save Permissions",
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

          recipesByType:
            "الوصفات حسب النوع",

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

        ingredients: {
          title: "المكونات",
          subtitle: "أضف جميع المنتجات المطلوبة لهذه الوصفة.",
          addIngredient: "إضافة مكون",
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
          confirm: "تأكيد",
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
          selectedRole: "الدور المحدد:",
          savePermissions: "حفظ الصلاحيات",
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
