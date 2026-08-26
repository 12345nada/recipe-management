import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import "../styles/Settings.css";


/* =========================================
   INITIAL EMPLOYEES
========================================= */

const initialEmployees = [
  {
    id: 1,
    name: "Nada Lotfallah",
    username: "@nada.lotfallah3",
    role: "Administrator",
    branch: "Cairo",
  },

  {
    id: 2,
    name: "Haidy",
    username: "@haidy",
    role: "ERP User",
    branch: "Alex",
  },

  {
    id: 3,
    name: "Fady Karam",
    username: "@fady.karam",
    role: "Head Chef",
    branch: "Cairo",
  },

  {
    id: 4,
    name: "Hany Kamal",
    username: "@hany.kamal",
    role: "ERP User",
    branch: "Alex",
  },
];


/* =========================================
   INITIAL ROLES
========================================= */

const initialRoles = [
  {
    id: 1,
    name: "Administrator",
    description: "Full system access",
    removable: false,
  },

  {
    id: 2,
    name: "ERP User",
    description: "ERP entry and data management",
    removable: true,
  },

  {
    id: 3,
    name: "Head Chef",
    description: "Manage recipes",
    removable: true,
  },
];


/* =========================================
   MODULES
========================================= */

const modules = [
  "Dashboard",
  "Recipes",
  "Product Master",
  "ERP Entry",
  "Reports",
  "Audit Trail",
  "Settings",
];


/* =========================================
   DEFAULT PERMISSIONS
========================================= */

const createPermissions = (
  enabled = true
) => {
  const result = {};

  modules.forEach(
    (module) => {
      result[module] = {
        view: enabled,
        add: enabled,
        edit: enabled,
        delete: enabled,
      };
    }
  );

  return result;
};


/* =========================================
   SETTINGS
========================================= */

function Settings() {
  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "permissions"
  );


  const [
    generalSettings,
    setGeneralSettings,
  ] = useState({
    fullName: "Chef Ahmed",
    email: "ahmed@bites.com",
    language: "English",
  });

  const handleGeneralSettingsChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setGeneralSettings(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };

  const handleSaveGeneralSettings =
    () => {
      alert(
        "General settings saved successfully."
      );
    };


  /* =======================================
     EMPLOYEES
  ======================================= */

  const [
    employees,
    setEmployees,
  ] = useState(
    initialEmployees
  );

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] = useState(1);

  const [
    employeeSearch,
    setEmployeeSearch,
  ] = useState("");


  /* =======================================
     ROLES
  ======================================= */

  const [
    roles,
    setRoles,
  ] = useState(
    initialRoles
  );

  const [
    selectedRoleId,
    setSelectedRoleId,
  ] = useState(1);

  const [
    roleSearch,
    setRoleSearch,
  ] = useState("");


  /* =======================================
     PERMISSIONS
  ======================================= */

  const [
    rolePermissions,
    setRolePermissions,
  ] = useState({
    1: createPermissions(true),

    2: {
      Dashboard: {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },

      Recipes: {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },

      "Product Master": {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },

      "ERP Entry": {
        view: true,
        add: true,
        edit: true,
        delete: false,
      },

      Reports: {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },

      "Audit Trail": {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },

      Settings: {
        view: false,
        add: false,
        edit: false,
        delete: false,
      },
    },

    3: {
      Dashboard: {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },

      Recipes: {
        view: true,
        add: true,
        edit: true,
        delete: false,
      },

      "Product Master": {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },

      "ERP Entry": {
        view: false,
        add: false,
        edit: false,
        delete: false,
      },

      Reports: {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },

      "Audit Trail": {
        view: false,
        add: false,
        edit: false,
        delete: false,
      },

      Settings: {
        view: false,
        add: false,
        edit: false,
        delete: false,
      },
    },
  });


  /* =======================================
     MODALS
  ======================================= */

  const [
    showUserModal,
    setShowUserModal,
  ] = useState(false);

  const [
    showRoleModal,
    setShowRoleModal,
  ] = useState(false);

  const [
    showPasswordModal,
    setShowPasswordModal,
  ] = useState(false);


  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState(null);


  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  /* =======================================
     ADD USER FORM
  ======================================= */

  const [
    userForm,
    setUserForm,
  ] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    roleId: "1",
    branch: "Cairo",
  });


  /* =======================================
     ADD ROLE FORM
  ======================================= */

  const [
    roleForm,
    setRoleForm,
  ] = useState({
    name: "",
    description: "",
  });


  /* =======================================
     PASSWORD FORM
  ======================================= */

  const [
    passwordForm,
    setPasswordForm,
  ] = useState({
    password: "",
    confirmPassword: "",
  });


  /* =======================================
     SELECTED DATA
  ======================================= */

  const selectedEmployee =
    employees.find(
      (employee) =>
        employee.id ===
        selectedEmployeeId
    );


  const selectedRole =
    roles.find(
      (role) =>
        role.id ===
        selectedRoleId
    );


  const permissions =
    rolePermissions[
      selectedRoleId
    ] ||
    createPermissions(false);


  /* =======================================
     FILTER EMPLOYEES
  ======================================= */

  const filteredEmployees =
    useMemo(() => {
      const value =
        employeeSearch
          .trim()
          .toLowerCase();

      return employees.filter(
        (employee) =>
          employee.name
            .toLowerCase()
            .includes(value) ||
          employee.username
            .toLowerCase()
            .includes(value)
      );
    }, [
      employees,
      employeeSearch,
    ]);


  /* =======================================
     FILTER ROLES
  ======================================= */

  const filteredRoles =
    useMemo(() => {
      const value =
        roleSearch
          .trim()
          .toLowerCase();

      return roles.filter(
        (role) =>
          role.name
            .toLowerCase()
            .includes(value)
      );
    }, [
      roles,
      roleSearch,
    ]);


  /* =======================================
     ALL PERMISSIONS
  ======================================= */

  const allPermissionsEnabled =
    modules.every(
      (module) =>
        Object.values(
          permissions[module]
        ).every(Boolean)
    );


  /* =======================================
     EMPLOYEE SELECT
  ======================================= */

  const handleEmployeeSelect =
    (employee) => {

      setSelectedEmployeeId(
        employee.id
      );

      const employeeRole =
        roles.find(
          (role) =>
            role.name ===
            employee.role
        );

      if (employeeRole) {
        setSelectedRoleId(
          employeeRole.id
        );
      }
    };


  /* =======================================
     ROLE SELECT
  ======================================= */

  const handleRoleSelect =
    (role) => {

      setSelectedRoleId(
        role.id
      );

    };


  /* =======================================
     ROLE CHANGE FOR EMPLOYEE
  ======================================= */

  const handleEmployeeRoleChange =
    (event) => {

      const roleId =
        Number(
          event.target.value
        );

      const role =
        roles.find(
          (item) =>
            item.id === roleId
        );

      if (!role) {
        return;
      }

      setSelectedRoleId(
        roleId
      );

      setEmployees(
        (previous) =>
          previous.map(
            (employee) =>
              employee.id ===
              selectedEmployeeId
                ? {
                    ...employee,
                    role:
                      role.name,
                  }
                : employee
          )
      );
    };


  /* =======================================
     TOGGLE PERMISSION
  ======================================= */

  const togglePermission = (
    module,
    permission
  ) => {

    setRolePermissions(
      (previous) => ({
        ...previous,

        [selectedRoleId]: {
          ...previous[
            selectedRoleId
          ],

          [module]: {
            ...previous[
              selectedRoleId
            ][module],

            [permission]:
              !previous[
                selectedRoleId
              ][module][
                permission
              ],
          },
        },
      })
    );

  };


  /* =======================================
     TOGGLE ALL
  ======================================= */

  const toggleAllPermissions =
    () => {

      const value =
        !allPermissionsEnabled;

      setRolePermissions(
        (previous) => ({
          ...previous,

          [selectedRoleId]:
            createPermissions(
              value
            ),
        })
      );

    };


  /* =======================================
     ADD USER
  ======================================= */

  const handleCreateUser =
    (event) => {

      event.preventDefault();

      if (
        !userForm.fullName.trim() ||
        !userForm.username.trim() ||
        !userForm.password
      ) {
        alert(
          "Please complete all required fields."
        );

        return;
      }

      if (
        userForm.password.length <
        6
      ) {
        alert(
          "Password must be at least 6 characters."
        );

        return;
      }

      if (
        userForm.password !==
        userForm.confirmPassword
      ) {
        alert(
          "Passwords do not match."
        );

        return;
      }

      const role =
        roles.find(
          (item) =>
            item.id ===
            Number(
              userForm.roleId
            )
        );

      const newEmployee = {
        id: Date.now(),

        name:
          userForm.fullName.trim(),

        username:
          userForm.username
            .trim()
            .startsWith("@")
            ? userForm.username.trim()
            : `@${userForm.username.trim()}`,

        role:
          role?.name ||
          "Head Chef",

        branch:
          userForm.branch,
      };

      setEmployees(
        (previous) => [
          ...previous,
          newEmployee,
        ]
      );

      setSelectedEmployeeId(
        newEmployee.id
      );

      if (role) {
        setSelectedRoleId(
          role.id
        );
      }

      setUserForm({
        fullName: "",
        username: "",
        password: "",
        confirmPassword: "",
        roleId: "1",
        branch: "Cairo",
      });

      setShowUserModal(
        false
      );
    };


  /* =======================================
     ADD ROLE
  ======================================= */

  const handleCreateRole =
    (event) => {

      event.preventDefault();

      if (
        !roleForm.name.trim()
      ) {
        alert(
          "Please enter role name."
        );

        return;
      }

      const exists =
        roles.some(
          (role) =>
            role.name
              .toLowerCase() ===
            roleForm.name
              .trim()
              .toLowerCase()
        );

      if (exists) {
        alert(
          "This role already exists."
        );

        return;
      }

      const newRole = {
        id: Date.now(),

        name:
          roleForm.name.trim(),

        description:
          roleForm.description.trim() ||
          "Custom role",

        removable: true,
      };

      setRoles(
        (previous) => [
          ...previous,
          newRole,
        ]
      );

      setRolePermissions(
        (previous) => ({
          ...previous,

          [newRole.id]:
            createPermissions(
              false
            ),
        })
      );

      setSelectedRoleId(
        newRole.id
      );

      setRoleForm({
        name: "",
        description: "",
      });

      setShowRoleModal(
        false
      );
    };


  /* =======================================
     DELETE ROLE
  ======================================= */

  const handleDeleteRole =
    (role) => {

      if (
        !role.removable
      ) {
        return;
      }

      setDeleteConfirmation({
        type: "role",
        item: role,
      });
    };


  /* =======================================
     DELETE USER
  ======================================= */

  const handleDeleteUser =
    (employee) => {

      setDeleteConfirmation({
        type: "user",
        item: employee,
      });
    };


  const confirmDelete =
    () => {

      if (
        !deleteConfirmation
      ) {
        return;
      }

      if (
        deleteConfirmation.type ===
        "role"
      ) {
        const role =
          deleteConfirmation.item;

        setRoles(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !==
                role.id
            )
        );

        setRolePermissions(
          (previous) => {

            const updated = {
              ...previous,
            };

            delete updated[
              role.id
            ];

            return updated;
          }
        );

        if (
          selectedRoleId ===
          role.id
        ) {
          setSelectedRoleId(1);
        }
      }


      if (
        deleteConfirmation.type ===
        "user"
      ) {
        const employee =
          deleteConfirmation.item;

        setEmployees(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !==
                employee.id
            )
        );

        if (
          selectedEmployeeId ===
          employee.id
        ) {
          setSelectedEmployeeId(
            employees[0]?.id
          );
        }
      }


      setDeleteConfirmation(
        null
      );
    };


  /* =======================================
     RESET PASSWORD
  ======================================= */

  const handleResetPassword =
    (event) => {

      event.preventDefault();

      if (
        passwordForm.password.length <
        6
      ) {
        alert(
          "Password must be at least 6 characters."
        );

        return;
      }

      if (
        passwordForm.password !==
        passwordForm.confirmPassword
      ) {
        alert(
          "Passwords do not match."
        );

        return;
      }

      console.log(
        "Password reset:",
        {
          employee:
            selectedEmployee,

          password:
            passwordForm.password,
        }
      );

      setPasswordForm({
        password: "",
        confirmPassword: "",
      });

      setShowPasswordModal(
        false
      );

      alert(
        "Password reset successfully."
      );
    };


  /* =======================================
     SAVE PERMISSIONS
  ======================================= */

  const handleSavePermissions =
    () => {

      console.log({
        role:
          selectedRole,

        permissions,
      });

      setSuccessMessage(
        "Permissions saved successfully."
      );

    };


  return (
    <div className="settings-page">


      <div className="settings-card">


        {/* ===================================
            TABS
        =================================== */}

        <div className="settings-tabs">

          <button
            type="button"
            className={
              activeTab ===
              "general"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "general"
              )
            }
          >
            General Settings
          </button>


          <button
            type="button"
            className={
              activeTab ===
              "permissions"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "permissions"
              )
            }
          >
            Permissions & User Rights
          </button>

        </div>


        {/* ===================================
            GENERAL
        =================================== */}

        {activeTab ===
        "general" ? (

          <div className="general-settings-panel">

            <div className="general-settings-header">
              <div>
                <h2>
                  General Settings
                </h2>

                <p>
                  Manage your personal preferences.
                </p>
              </div>
            </div>

            <div className="general-settings-grid">

              <label className="general-settings-field">
                <span>
                  Full Name
                </span>

                <input
                  type="text"
                  name="fullName"
                  value={
                    generalSettings.fullName
                  }
                  onChange={
                    handleGeneralSettingsChange
                  }
                />
              </label>

              <label className="general-settings-field">
                <span>
                  Email Address
                </span>

                <input
                  type="email"
                  name="email"
                  value={
                    generalSettings.email
                  }
                  onChange={
                    handleGeneralSettingsChange
                  }
                />
              </label>

              <label className="general-settings-field">
                <span>
                  Language
                </span>

                <select
                  name="language"
                  value={
                    generalSettings.language
                  }
                  onChange={
                    handleGeneralSettingsChange
                  }
                >
                  <option value="English">
                    English
                  </option>

                  <option value="Arabic">
                    Arabic
                  </option>
                </select>
              </label>

             
            </div>

            <div className="general-settings-footer">
              <button
                type="button"
                className="general-save-button"
                onClick={
                  handleSaveGeneralSettings
                }
              >
                <Save
                  size={16}
                />

                Save Changes
              </button>
            </div>

          </div>

        ) : (


          /* =================================
             PERMISSIONS
          ================================= */

          <div className="settings-permissions-layout">


            {/* EMPLOYEES */}

            <section className="settings-employees-column">

              <div className="settings-column-heading">

                <div>
                  <h2>
                    Employees
                  </h2>

                  <p>
                    Select an employee
                  </p>
                </div>

                <Users
                  size={18}
                />

              </div>


              <button
                type="button"
                className="settings-add-user-button"
                onClick={() =>
                  setShowUserModal(
                    true
                  )
                }
              >
                <Plus size={16} />
                Add New User
              </button>


              <div className="settings-search">

                <Search
                  size={15}
                />

                <input
                  type="text"
                  placeholder="Search employees..."
                  value={
                    employeeSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setEmployeeSearch(
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="employee-list">

                {filteredEmployees.map(
                  (employee) => (

                    <div
                      className={`employee-row ${
                        selectedEmployeeId ===
                        employee.id
                          ? "active"
                          : ""
                      }`}
                      key={
                        employee.id
                      }
                    >

                      <button
                        type="button"
                        className="employee-item"
                        onClick={() =>
                          handleEmployeeSelect(
                            employee
                          )
                        }
                      >

                        <div>
                          <strong>
                            {
                              employee.name
                            }
                          </strong>

                          <span>
                            {
                              employee.username
                            }
                          </span>
                        </div>

                      </button>


                      <button
                        type="button"
                        className="delete-employee-button"
                        onClick={() =>
                          handleDeleteUser(
                            employee
                          )
                        }
                      >
                        <Trash2
                          size={14}
                        />
                      </button>

                    </div>

                  )
                )}

              </div>

            </section>


            {/* ROLES */}

            <section className="settings-roles-column">

              <div className="settings-column-heading">

                <div>
                  <h2>
                    Roles
                  </h2>

                  <p>
                    Choose a role
                  </p>
                </div>

                <ShieldCheck
                  size={18}
                />

              </div>


              <div className="settings-search">

                <Search
                  size={15}
                />

                <input
                  type="text"
                  placeholder="Search roles..."
                  value={
                    roleSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setRoleSearch(
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="role-list">

                {filteredRoles.map(
                  (role) => (

                    <div
                      className="role-row"
                      key={
                        role.id
                      }
                    >

                      <button
                        type="button"
                        className={`role-item ${
                          selectedRoleId ===
                          role.id
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          handleRoleSelect(
                            role
                          )
                        }
                      >

                        <strong>
                          {role.name}
                        </strong>

                        <span>
                          {
                            role.description
                          }
                        </span>

                      </button>


                      {role.removable && (

                        <button
                          type="button"
                          className="delete-role-button"
                          onClick={() =>
                            handleDeleteRole(
                              role
                            )
                          }
                        >
                          <Trash2
                            size={14}
                          />
                        </button>

                      )}

                    </div>

                  )
                )}

              </div>


              <button
                type="button"
                className="settings-add-role-button"
                onClick={() =>
                  setShowRoleModal(
                    true
                  )
                }
              >
                <Plus size={17} />
                Add New Role
              </button>

            </section>


            {/* RIGHT */}

            <section className="settings-right-column">


              <div className="settings-account-card">

                <div>

                  <h2>
                    Manage user passwords
                    and account access
                  </h2>

                  <p>
                    {
                      selectedEmployee
                        ?.name
                    }{" "}
                    is assigned to{" "}
                    {
                      selectedEmployee
                        ?.role
                    }
                  </p>

                </div>


                <div className="account-controls">

                  <select
                    value={
                      selectedRoleId
                    }
                    onChange={
                      handleEmployeeRoleChange
                    }
                  >

                    {roles.map(
                      (role) => (

                        <option
                          key={
                            role.id
                          }
                          value={
                            role.id
                          }
                        >
                          {role.name}
                        </option>

                      )
                    )}

                  </select>


                  <button
                    type="button"
                    className="reset-password-button"
                    onClick={() =>
                      setShowPasswordModal(
                        true
                      )
                    }
                  >
                    <KeyRound
                      size={15}
                    />

                    Reset Password
                  </button>

                </div>

              </div>


              {/* ALL PERMISSIONS */}

              <div className="all-permissions-card">

                <div>

                  <strong>
                    All Permissions
                  </strong>

                  <span>
                    Turn all permissions
                    on or off
                  </span>

                </div>


                <button
                  type="button"
                  className={`settings-toggle ${
                    allPermissionsEnabled
                      ? "active"
                      : ""
                  }`}
                  onClick={
                    toggleAllPermissions
                  }
                >
                  <span />
                </button>

              </div>


              {/* TABLE */}

              <div className="permissions-table-wrapper">

                <table className="permissions-table">

                  <thead>

                    <tr>

                      <th>
                        Module
                      </th>

                      <th>
                        View
                      </th>

                      <th>
                        Add
                      </th>

                      <th>
                        Edit
                      </th>

                      <th>
                        Delete
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {modules.map(
                      (module) => (

                        <tr
                          key={
                            module
                          }
                        >

                          <td>
                            {module}
                          </td>


                          {[
                            "view",
                            "add",
                            "edit",
                            "delete",
                          ].map(
                            (
                              permission
                            ) => (

                              <td
                                key={
                                  permission
                                }
                              >

                                <button
                                  type="button"
                                  className={`settings-toggle ${
                                    permissions[
                                      module
                                    ][
                                      permission
                                    ]
                                      ? "active"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    togglePermission(
                                      module,
                                      permission
                                    )
                                  }
                                >
                                  <span />
                                </button>

                              </td>

                            )
                          )}

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>


              {/* SAVE */}

              <div className="permissions-save-footer">

                <span>
                  Selected role:{" "}

                  <strong>
                    {
                      selectedRole
                        ?.name
                    }
                  </strong>
                </span>


                <button
                  type="button"
                  className="save-permissions-button"
                  onClick={
                    handleSavePermissions
                  }
                >
                  <Save
                    size={16}
                  />

                  Save Permissions
                </button>

              </div>

            </section>

          </div>

        )}

      </div>


      {successMessage && (

        <div
          className="settings-success-overlay"
          onMouseDown={() =>
            setSuccessMessage("")
          }
        >

          <div
            className="settings-success-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="settings-success-close"
              aria-label="Close"
              onClick={() =>
                setSuccessMessage("")
              }
            >
              <X size={20} />
            </button>


            <div className="settings-success-icon">
              <CheckCircle2
                size={34}
              />
            </div>


            <h2>
              Success
            </h2>

            <p>
              {successMessage}
            </p>


            <div className="settings-success-actions">

              <button
                type="button"
                className="settings-success-button"
                onClick={() =>
                  setSuccessMessage("")
                }
              >
                OK
              </button>

            </div>

          </div>

        </div>

      )}


      {deleteConfirmation && (

        <div
          className="settings-confirm-overlay"
          onMouseDown={() =>
            setDeleteConfirmation(
              null
            )
          }
        >

          <div
            className="settings-confirm-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="settings-confirm-close"
              aria-label="Close"
              onClick={() =>
                setDeleteConfirmation(
                  null
                )
              }
            >
              <X size={20} />
            </button>


            <div className="settings-confirm-icon">
              <AlertTriangle
                size={32}
              />
            </div>


            <h2>
              Confirm Action
            </h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {
                  deleteConfirmation
                    .item
                    .name
                }
              </strong>
              ?
            </p>


            <div className="settings-confirm-actions">

              <button
                type="button"
                className="settings-confirm-cancel"
                onClick={() =>
                  setDeleteConfirmation(
                    null
                  )
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="settings-confirm-primary"
                onClick={
                  confirmDelete
                }
              >
                Confirm
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================
          ADD USER MODAL
      ===================================== */}

      {showUserModal && (

        <div className="settings-modal-overlay">

          <div className="settings-modal settings-user-modal">

            <div className="settings-modal-header">

              <div>
                <h2>
                  Add New User
                </h2>

                <p>
                  Create login details
                  and assign a role.
                </p>
              </div>

              <button
                type="button"
                className="settings-modal-close"
                onClick={() =>
                  setShowUserModal(
                    false
                  )
                }
              >
                <X size={20} />
              </button>

            </div>


            <form
              onSubmit={
                handleCreateUser
              }
            >

              <div className="user-account-card">

                <div className="user-account-title">

                  <div className="user-step">
                    1
                  </div>

                  <div>
                    <h3>
                      Account Information
                    </h3>

                    <p>
                      Enter employee login
                      details.
                    </p>
                  </div>

                </div>


                <div className="settings-form-grid">


                  <label>
                    Full Name

                    <input
                      type="text"
                      placeholder="Nada Lotfallah"
                      value={
                        userForm.fullName
                      }
                      onChange={(
                        event
                      ) =>
                        setUserForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            fullName:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />
                  </label>


                  <label>
                    Username

                    <input
                      type="text"
                      placeholder="nada.lotfallah"
                      value={
                        userForm.username
                      }
                      onChange={(
                        event
                      ) =>
                        setUserForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            username:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />
                  </label>


                  <label>
                    Password

                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={
                        userForm.password
                      }
                      onChange={(
                        event
                      ) =>
                        setUserForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            password:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />
                  </label>


                  <label>
                    Confirm Password

                    <input
                      type="password"
                      placeholder="Repeat password"
                      value={
                        userForm
                          .confirmPassword
                      }
                      onChange={(
                        event
                      ) =>
                        setUserForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            confirmPassword:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />
                  </label>


                  <label>
                    Role

                    <select
                      value={
                        userForm.roleId
                      }
                      onChange={(
                        event
                      ) =>
                        setUserForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            roleId:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    >

                      {roles.map(
                        (role) => (

                          <option
                            key={
                              role.id
                            }
                            value={
                              role.id
                            }
                          >
                            {
                              role.name
                            }
                          </option>

                        )
                      )}

                    </select>
                  </label>


                  <label>
                    Branch

                    <select
                      value={
                        userForm.branch
                      }
                      onChange={(
                        event
                      ) =>
                        setUserForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            branch:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    >

                      <option value="Cairo">
                        Cairo
                      </option>

                      <option value="Alex">
                        Alex
                      </option>

                    </select>
                  </label>

                </div>


                <div className="user-info-note">
                  <UserRound size={15} />

                  Employees sign in
                  using their username
                  and temporary password.
                </div>

              </div>


              <div className="settings-modal-actions">

                <button
                  type="button"
                  className="settings-modal-cancel"
                  onClick={() =>
                    setShowUserModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="settings-modal-primary"
                >
                  Create User
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================
          ADD ROLE MODAL
      ===================================== */}

      {showRoleModal && (

        <div className="settings-modal-overlay">

          <div className="settings-modal settings-role-modal">

            <div className="settings-modal-header">

              <div>
                <h2>
                  Add New Role
                </h2>

                <p>
                  Create a new job title.
                </p>
              </div>

              <button
                type="button"
                className="settings-modal-close"
                onClick={() =>
                  setShowRoleModal(
                    false
                  )
                }
              >
                <X size={20} />
              </button>

            </div>


            <form
              onSubmit={
                handleCreateRole
              }
            >

              <label className="settings-modal-field">
                Role Name

                <input
                  type="text"
                  placeholder="Recipe Supervisor"
                  value={
                    roleForm.name
                  }
                  onChange={(
                    event
                  ) =>
                    setRoleForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        name:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                />
              </label>


              <label className="settings-modal-field">
                Description

                <textarea
                  placeholder="Describe the role"
                  value={
                    roleForm.description
                  }
                  onChange={(
                    event
                  ) =>
                    setRoleForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        description:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                />
              </label>


              <div className="settings-modal-actions">

                <button
                  type="button"
                  className="settings-modal-cancel"
                  onClick={() =>
                    setShowRoleModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="settings-modal-primary"
                >
                  Create Role
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================
          RESET PASSWORD MODAL
      ===================================== */}

      {showPasswordModal && (

        <div className="settings-modal-overlay">

          <div className="settings-modal settings-password-modal">

            <div className="settings-modal-header">

              <div>
                <h2>
                  Reset Password
                </h2>

                <p>
                  Create a new password
                  for{" "}
                  {
                    selectedEmployee
                      ?.name
                  }.
                </p>
              </div>

              <button
                type="button"
                className="settings-modal-close"
                onClick={() =>
                  setShowPasswordModal(
                    false
                  )
                }
              >
                <X size={20} />
              </button>

            </div>


            <div className="reset-user-card">

              <strong>
                {
                  selectedEmployee
                    ?.name
                }
              </strong>

              <span>
                {
                  selectedEmployee
                    ?.username
                }
              </span>

            </div>


            <form
              onSubmit={
                handleResetPassword
              }
            >

              <label className="settings-modal-field">
                New Password

                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={
                    passwordForm.password
                  }
                  onChange={(
                    event
                  ) =>
                    setPasswordForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        password:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                />
              </label>


              <label className="settings-modal-field">
                Confirm Password

                <input
                  type="password"
                  placeholder="Repeat password"
                  value={
                    passwordForm
                      .confirmPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setPasswordForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        confirmPassword:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                />
              </label>


              <div className="settings-modal-actions">

                <button
                  type="button"
                  className="settings-modal-cancel"
                  onClick={() =>
                    setShowPasswordModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="settings-modal-primary"
                >
                  Reset Password
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


export default Settings;