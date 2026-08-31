import {
  useEffect,
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

import {
  useAuth,
} from "../context/AuthContext";

import {
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  getSettingsData,
  resetUserPassword,
  saveRolePermissions,
  updateCurrentProfile,
  updateEmployeeRole,
} from "../services/settingsService";

import "../styles/Settings.css";


const modules = [
  "Dashboard",
  "Recipes",
  "Product Master",
  "ERP Entry",
  "Reports",
  "Audit Trail",
  "Settings",
];


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


const buildPermissionsMap = (
  rows = []
) => {
  const result = {};

  rows.forEach(
    (row) => {
      const roleId =
        Number(
          row.role_id
        );

      if (!result[roleId]) {
        result[roleId] =
          createPermissions(
            false
          );
      }

      if (
        row.module_name &&
        result[roleId][
          row.module_name
        ]
      ) {
        result[roleId][
          row.module_name
        ] = {
          view:
            Boolean(
              row.can_view
            ),

          add:
            Boolean(
              row.can_add
            ),

          edit:
            Boolean(
              row.can_edit
            ),

          delete:
            Boolean(
              row.can_delete
            ),
        };
      }
    }
  );

  return result;
};


function Settings() {
  const {
    profile,
    refreshProfile,
  } = useAuth();


  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "permissions"
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    generalSettings,
    setGeneralSettings,
  ] = useState({
    fullName: "",
    email: "",
    language: "English",
  });


  const [
    employees,
    setEmployees,
  ] = useState([]);


  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] = useState(null);


  const [
    employeeSearch,
    setEmployeeSearch,
  ] = useState("");


  const [
    roles,
    setRoles,
  ] = useState([]);


  const [
    selectedRoleId,
    setSelectedRoleId,
  ] = useState(null);


  const [
    roleSearch,
    setRoleSearch,
  ] = useState("");


  const [
    rolePermissions,
    setRolePermissions,
  ] = useState({});


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


  const [
    userForm,
    setUserForm,
  ] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    roleId: "",
  });


  const [
    roleForm,
    setRoleForm,
  ] = useState({
    name: "",
    description: "",
  });


  const [
    passwordForm,
    setPasswordForm,
  ] = useState({
    password: "",
    confirmPassword: "",
  });


  const loadSettings =
    async (
      showLoader = true
    ) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        const data =
          await getSettingsData();

        setEmployees(
          data.employees
        );

        setRoles(
          data.roles
        );

        const permissionMap =
          buildPermissionsMap(
            data.permissions
          );

        data.roles.forEach(
          (role) => {
            if (
              !permissionMap[
                role.id
              ]
            ) {
              permissionMap[
                role.id
              ] =
                createPermissions(
                  Boolean(
                    role.isSystemAdmin
                  )
                );
            }
          }
        );

        setRolePermissions(
          permissionMap
        );

        setSelectedEmployeeId(
          (current) => {
            if (
              current &&
              data.employees.some(
                (employee) =>
                  employee.id ===
                  current
              )
            ) {
              return current;
            }

            return (
              data.employees[0]
                ?.id ||
              null
            );
          }
        );

        setSelectedRoleId(
          (current) => {
            if (
              current &&
              data.roles.some(
                (role) =>
                  role.id ===
                  current
              )
            ) {
              return current;
            }

            const adminRole =
              data.roles.find(
                (role) =>
                  role.isSystemAdmin
              );

            return (
              adminRole?.id ||
              data.roles[0]
                ?.id ||
              null
            );
          }
        );
      } catch (error) {
        console.error(
          "Settings load error:",
          error
        );

        alert(
          error?.message ||
            "Could not load settings."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    };


  useEffect(() => {
    loadSettings();
  }, []);


  useEffect(() => {
    setGeneralSettings({
      fullName:
        profile?.full_name ||
        "",

      email:
        profile?.email ||
        "",

      language:
        "English",
    });
  }, [
    profile?.full_name,
    profile?.email,
  ]);


  useEffect(() => {
    if (
      roles.length &&
      !userForm.roleId
    ) {
      setUserForm(
        (previous) => ({
          ...previous,

          roleId:
            String(
              roles[0].id
            ),
        })
      );
    }
  }, [
    roles,
    userForm.roleId,
  ]);


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
    async () => {
      try {
        setSaving(true);

        await updateCurrentProfile({
          userId:
            profile?.id,

          fullName:
            generalSettings
              .fullName,

          currentEmail:
            profile?.email,

          email:
            generalSettings
              .email,
        });

        await refreshProfile();

        setSuccessMessage(
          "General settings saved successfully."
        );
      } catch (error) {
        console.error(
          "Save general settings error:",
          error
        );

        alert(
          error?.message ||
            "Could not save general settings."
        );
      } finally {
        setSaving(false);
      }
    };


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


  const allPermissionsEnabled =
    modules.every(
      (module) =>
        Object.values(
          permissions[module] ||
            {}
        ).every(Boolean)
    );


  const handleEmployeeSelect =
    (employee) => {
      setSelectedEmployeeId(
        employee.id
      );

      if (
        employee.roleId
      ) {
        setSelectedRoleId(
          employee.roleId
        );
      }
    };


  const handleRoleSelect =
    (role) => {
      setSelectedRoleId(
        role.id
      );
    };


  const handleEmployeeRoleChange =
    async (
      event
    ) => {
      const roleId =
        Number(
          event.target.value
        );

      const role =
        roles.find(
          (item) =>
            item.id === roleId
        );

      if (
        !role ||
        !selectedEmployee
      ) {
        return;
      }

      try {
        setSaving(true);

        await updateEmployeeRole({
          userId:
            selectedEmployee.id,

          roleId,
        });

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
                      roleId:
                        role.id,
                    }
                  : employee
            )
        );

        setSuccessMessage(
          `${selectedEmployee.name} is now assigned to ${role.name}.`
        );
      } catch (error) {
        console.error(
          "Change employee role error:",
          error
        );

        alert(
          error?.message ||
            "Could not change employee role."
        );
      } finally {
        setSaving(false);
      }
    };


  const togglePermission = (
    module,
    permission
  ) => {
    if (!selectedRoleId) {
      return;
    }

    setRolePermissions(
      (previous) => {
        const roleCurrent =
          previous[
            selectedRoleId
          ] ||
          createPermissions(
            false
          );

        return {
          ...previous,

          [selectedRoleId]: {
            ...roleCurrent,

            [module]: {
              ...roleCurrent[
                module
              ],

              [permission]:
                !roleCurrent[
                  module
                ][
                  permission
                ],
            },
          },
        };
      }
    );
  };


  const toggleAllPermissions =
    () => {
      if (!selectedRoleId) {
        return;
      }

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


  const handleCreateUser =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        !userForm.fullName.trim() ||
        !userForm.username.trim() ||
        !userForm.password ||
        !userForm.roleId
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

      try {
        setSaving(true);

        const created =
          await createUser({
            fullName:
              userForm.fullName
                .trim(),

            username:
              userForm.username
                .trim()
                .replace(
                  /^@/,
                  ""
                ),

            password:
              userForm.password,

            roleId:
              Number(
                userForm.roleId
              ),

          });

        await loadSettings(
          false
        );

        setSelectedEmployeeId(
          created?.user?.id ||
          null
        );

        setSelectedRoleId(
          Number(
            userForm.roleId
          )
        );

        setUserForm({
          fullName: "",
          username: "",
          password: "",
          confirmPassword: "",
          roleId:
            String(
              roles[0]?.id ||
              ""
            ),
              });

        setShowUserModal(
          false
        );

        setSuccessMessage(
          "User created successfully."
        );
      } catch (error) {
        console.error(
          "Create user error:",
          error
        );

        alert(
          error?.message ||
            "Could not create user."
        );
      } finally {
        setSaving(false);
      }
    };


  const handleCreateRole =
    async (
      event
    ) => {
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

      try {
        setSaving(true);

        const newRole =
          await createRole({
            name:
              roleForm.name
                .trim(),

            description:
              roleForm.description
                .trim() ||
              "Custom role",
          });

        await loadSettings(
          false
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

        setSuccessMessage(
          "Role created successfully."
        );
      } catch (error) {
        console.error(
          "Create role error:",
          error
        );

        alert(
          error?.message ||
            "Could not create role."
        );
      } finally {
        setSaving(false);
      }
    };


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


  const handleDeleteUser =
    (employee) => {
      setDeleteConfirmation({
        type: "user",
        item: employee,
      });
    };


  const confirmDelete =
    async () => {
      if (
        !deleteConfirmation
      ) {
        return;
      }

      try {
        setSaving(true);

        if (
          deleteConfirmation.type ===
          "role"
        ) {
          await deleteRole(
            deleteConfirmation
              .item.id
          );

          setSuccessMessage(
            "Role deleted successfully."
          );
        }

        if (
          deleteConfirmation.type ===
          "user"
        ) {
          await deleteUser(
            deleteConfirmation
              .item.id
          );

          setSuccessMessage(
            "User deleted successfully."
          );
        }

        setDeleteConfirmation(
          null
        );

        await loadSettings(
          false
        );
      } catch (error) {
        console.error(
          "Delete settings item error:",
          error
        );

        alert(
          error?.message ||
            "Could not delete the selected item."
        );
      } finally {
        setSaving(false);
      }
    };


  const handleResetPassword =
    async (
      event
    ) => {
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

      if (
        !selectedEmployee
      ) {
        return;
      }

      try {
        setSaving(true);

        await resetUserPassword({
          userId:
            selectedEmployee.id,

          password:
            passwordForm.password,
        });

        setPasswordForm({
          password: "",
          confirmPassword: "",
        });

        setShowPasswordModal(
          false
        );

        setSuccessMessage(
          "Password reset successfully."
        );
      } catch (error) {
        console.error(
          "Reset password error:",
          error
        );

        alert(
          error?.message ||
            "Could not reset password."
        );
      } finally {
        setSaving(false);
      }
    };


  const handleSavePermissions =
    async () => {
      if (
        !selectedRoleId
      ) {
        return;
      }

      try {
        setSaving(true);

        await saveRolePermissions({
          roleId:
            selectedRoleId,

          permissions,
        });

        if (
          profile?.role_id ===
          selectedRoleId
        ) {
          await refreshProfile();
        }

        setSuccessMessage(
          "Permissions saved successfully."
        );
      } catch (error) {
        console.error(
          "Save permissions error:",
          error
        );

        alert(
          error?.message ||
            "Could not save permissions."
        );
      } finally {
        setSaving(false);
      }
    };


  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-card">
          <div
            style={{
              padding:
                "40px",
              textAlign:
                "center",
            }}
          >
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

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