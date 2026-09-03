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

import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const {
    profile,
    refreshProfile,
  } = useAuth();


  const translateModule = (module) => {
    const keys = {
      "Dashboard": "sidebar.dashboard",
      "Recipes": "sidebar.recipes",
      "Product Master": "sidebar.productMaster",
      "ERP Entry": "sidebar.erpEntry",
      "Reports": "sidebar.reports",
      "Audit Trail": "sidebar.auditTrail",
      "Settings": "sidebar.settings",
    };
    return keys[module] ? t(keys[module]) : module;
  };

  const translateRole = (role) => {
    const keys = {
      "User": "roles.user",
      "Administrator": "roles.administrator",
      "Admin": "roles.admin",
      "Manager": "roles.manager",
      "Head Chef": "roles.headChef",
      "Approver": "roles.approver",
      "ERP User": "roles.erpUser",
    };
    return keys[role] ? t(keys[role]) : role;
  };


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
            t("settingsPage.errors.couldNotLoad")
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
          t("settingsPage.success.generalSaved")
        );
      } catch (error) {
        console.error(
          "Save general settings error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotSaveGeneral")
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
          t("settingsPage.success.roleAssigned", { name: selectedEmployee.name, role: translateRole(role.name) })
        );
      } catch (error) {
        console.error(
          "Change employee role error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotChangeRole")
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
          t("settingsPage.errors.completeRequired")
        );
        return;
      }

      if (
        userForm.password.length <
        6
      ) {
        alert(
          t("settingsPage.errors.passwordLength")
        );
        return;
      }

      if (
        userForm.password !==
        userForm.confirmPassword
      ) {
        alert(
          t("settingsPage.errors.passwordMismatch")
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
          t("settingsPage.success.userCreated")
        );
      } catch (error) {
        console.error(
          "Create user error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotCreateUser")
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
          t("settingsPage.errors.enterRoleName")
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
          t("settingsPage.errors.roleExists")
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
          t("settingsPage.success.roleCreated")
        );
      } catch (error) {
        console.error(
          "Create role error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotCreateRole")
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
            t("settingsPage.success.roleDeleted")
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
            t("settingsPage.success.userDeleted")
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
            t("settingsPage.errors.couldNotDelete")
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
          t("settingsPage.errors.passwordLength")
        );
        return;
      }

      if (
        passwordForm.password !==
        passwordForm.confirmPassword
      ) {
        alert(
          t("settingsPage.errors.passwordMismatch")
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
          t("settingsPage.success.passwordReset")
        );
      } catch (error) {
        console.error(
          "Reset password error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotResetPassword")
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
          t("settingsPage.success.permissionsSaved")
        );
      } catch (error) {
        console.error(
          "Save permissions error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotSavePermissions")
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
            {t("settingsPage.loading")}
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
            {t("settingsPage.tabs.general")}
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
            {t("settingsPage.tabs.permissions")}
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
                  {t("settingsPage.tabs.general")}
                </h2>

                <p>
                  {t("settingsPage.general.subtitle")}
                </p>
              </div>
            </div>

            <div className="general-settings-grid">

              <label className="general-settings-field">
                <span>
                  {t("settingsPage.general.fullName")}
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
                  {t("settingsPage.general.email")}
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
                  {t("settingsPage.general.language")}
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
                    {t("common.english")}
                  </option>

                  <option value="Arabic">
                    {t("common.arabic")}
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

                {t("settingsPage.general.saveChanges")}
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
                    {t("settingsPage.permissions.employees")}
                  </h2>

                  <p>
                    {t("settingsPage.permissions.selectEmployee")}
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
                {t("settingsPage.permissions.addNewUser")}
              </button>


              <div className="settings-search">

                <Search
                  size={15}
                />

                <input
                  type="text"
                  placeholder={t("settingsPage.permissions.searchEmployees")}
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
                    {t("settingsPage.permissions.roles")}
                  </h2>

                  <p>
                    {t("settingsPage.permissions.chooseRole")}
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
                  placeholder={t("settingsPage.permissions.searchRoles")}
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
                          {translateRole(role.name)}
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
                {t("settingsPage.permissions.addNewRole")}
              </button>

            </section>


            {/* RIGHT */}

            <section className="settings-right-column">


              <div className="settings-account-card">

                <div>

                  <h2>
                    {t("settingsPage.permissions.managePasswords")}

                  </h2>

                  <p>
                    {
                      selectedEmployee
                        ?.name
                    }{" "}
                    is assigned to{" "}
                    {
                      translateRole(
                        selectedEmployee
                          ?.role
                      )
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
                          {translateRole(role.name)}
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

                    {t("settingsPage.passwordModal.title")}
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
                        {t("settingsPage.permissions.module")}
                      </th>

                      <th>
                        {t("settingsPage.permissions.view")}
                      </th>

                      <th>
                        {t("settingsPage.permissions.add")}
                      </th>

                      <th>
                        {t("settingsPage.permissions.edit")}
                      </th>

                      <th>
                        {t("settingsPage.permissions.delete")}
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
                  {t("settingsPage.permissions.selectedRole")}{" "}

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

                  {t("settingsPage.permissions.savePermissions")}
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
              aria-label={t("common.close")}
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
              {t("settingsPage.success.title")}
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
                {t("settingsPage.success.ok")}
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
              aria-label={t("common.close")}
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
              {t("settingsPage.delete.title")}
            </h2>

            <p>
              {t("settingsPage.delete.prompt")}{" "}
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
                {t("common.cancel")}
              </button>


              <button
                type="button"
                className="settings-confirm-primary"
                onClick={
                  confirmDelete
                }
              >
                {t("settingsPage.delete.confirm")}
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
                  {t("settingsPage.permissions.addNewUser")}
                </h2>

                <p>
                  {t("settingsPage.userModal.subtitle")}

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
                      {t("settingsPage.userModal.accountInformation")}
                    </h3>

                    <p>
                      {t("settingsPage.userModal.accountSubtitle")}

                    </p>
                  </div>

                </div>


                <div className="settings-form-grid">


                  <label>
                    {t("settingsPage.general.fullName")}

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
                    {t("settingsPage.userModal.username")}

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
                    {t("settingsPage.userModal.password")}

                    <input
                      type="password"
                      placeholder={t("settingsPage.userModal.passwordPlaceholder")}
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
                    {t("settingsPage.delete.confirm")} Password

                    <input
                      type="password"
                      placeholder={t("settingsPage.userModal.repeatPassword")}
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
                    {t("settingsPage.userModal.role")}

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
                              translateRole(
                                role.name
                              )
                            }
                          </option>

                        )
                      )}

                    </select>
                  </label>

                </div>


                <div className="user-info-note">
                  <UserRound size={15} />

                  {t("settingsPage.userModal.signInNote")}


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
                  {t("common.cancel")}
                </button>


                <button
                  type="submit"
                  className="settings-modal-primary"
                >
                  {t("settingsPage.userModal.createUser")}
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
                  {t("settingsPage.permissions.addNewRole")}
                </h2>

                <p>
                  {t("settingsPage.roleModal.subtitle")}
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
                {t("settingsPage.roleModal.roleName")}

                <input
                  type="text"
                  placeholder={t("settingsPage.roleModal.roleNamePlaceholder")}
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
                {t("settingsPage.roleModal.description")}

                <textarea
                  placeholder={t("settingsPage.roleModal.descriptionPlaceholder")}
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
                  {t("common.cancel")}
                </button>


                <button
                  type="submit"
                  className="settings-modal-primary"
                >
                  {t("settingsPage.roleModal.createRole")}
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
                  {t("settingsPage.passwordModal.title")}
                </h2>

                <p>
                  {t("settingsPage.passwordModal.subtitle", { name: selectedEmployee?.name || "" })}

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
                  placeholder={t("settingsPage.userModal.passwordPlaceholder")}
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
                {t("settingsPage.delete.confirm")} Password

                <input
                  type="password"
                  placeholder={t("settingsPage.userModal.repeatPassword")}
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
                  {t("common.cancel")}
                </button>


                <button
                  type="submit"
                  className="settings-modal-primary"
                >
                  {t("settingsPage.passwordModal.title")}
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