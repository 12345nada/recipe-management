import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Plus,
  Pencil,
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
import "../styles/ProductMaster.css";
import ManageProductMasterValuesModal from "../components/ManageProductMasterValuesModal";
import { getProductMasterValues } from "../services/productMasterValuesService";
import { useProductTypes } from "../context/ProductTypesContext";
import ManageProductTypeModal from "../components/ManageProductTypeModal";
import ProductTypesReadiness from "../components/ProductTypesReadiness";


const modules = [
  "Dashboard",
  "Recipes",
  "Product Master",
  "ERP Entry",
  "Reports",
  "Audit Trail",
  "General Settings",
  "Permissions & User Rights",
  "Master Data",
];


const moduleActions = (module) => module === "General Settings" ? ["view", "edit"]
  : ["view", "add", "edit", "delete", ...(["Reports", "Audit Trail"].includes(module) ? ["print"] : [])];

const createPermissions = (enabled = true) => Object.fromEntries(modules.map((module) =>
  [module, Object.fromEntries(moduleActions(module).map((action) => [action, enabled]))]));

const buildPermissionsMap = (rows = []) => {
  const result = {};
  rows.forEach((row) => {
    const roleId = Number(row.role_id);
    result[roleId] ||= createPermissions(false);
    if (modules.includes(row.module_name)) {
      result[roleId][row.module_name] = Object.fromEntries(moduleActions(row.module_name)
        .map((action) => [action, Boolean(row[`can_${action}`])]));
    }
  });
  return result;
};


const refreshedAllows = (current, module, action = "view") => Boolean(current?.is_active &&
    (current.roles?.is_system_admin || (current.permissions?.[module.toLowerCase()]?.view &&
      current.permissions?.[module.toLowerCase()]?.[action])));

function Settings() {
  const { t, i18n } = useTranslation();

  const {
    profile,
    refreshProfile,
    hasPermission,
    isAdmin,
  } = useAuth();

  const canViewGeneral = hasPermission("General Settings", "view");
  const canViewAccounts = hasPermission("Permissions & User Rights", "view");
  const canAddAccounts = canViewAccounts && hasPermission("Permissions & User Rights", "add");
  const canEditAccounts = canViewAccounts && hasPermission("Permissions & User Rights", "edit");
  const canDeleteAccounts = canViewAccounts && hasPermission("Permissions & User Rights", "delete");
  const canEditGeneral = canViewGeneral && hasPermission("General Settings", "edit");
  const canViewMasterData = hasPermission("Master Data", "view");
  const canAddMasterData = canViewMasterData && hasPermission("Master Data", "add");
  const canEditMasterData = canViewMasterData && hasPermission("Master Data", "edit");
  const canDeleteMasterData = canViewMasterData && hasPermission("Master Data", "delete");
  const accessVersion = useRef(0);
  const accountRequest = useRef(0);
  const masterRequest = useRef(0);
  const accessProfile = useRef(profile);
  const refreshPending = useRef(null);
  const mounted = useRef(true);
  const [permissionRevision, setPermissionRevision] = useState(0);
  useEffect(() => { accessProfile.current = profile; }, [profile]);



  const refreshSettingsAccess = useCallback(() => {
    if (refreshPending.current) return refreshPending.current;
    accessVersion.current += 1;
    accountRequest.current += 1;
    masterRequest.current += 1;
    const promise = refreshProfile().then((current) => {
      if (!mounted.current) return null;
      accessProfile.current = current;
      setPermissionRevision((value) => value + 1);
      return current;
    }).catch(() => {
      if (mounted.current) {
        accessProfile.current = null;
        setPermissionRevision((value) => value + 1);
      }
      return null;
    }).finally(() => { refreshPending.current = null; });
    refreshPending.current = promise;
    return promise;
  }, [refreshProfile]);

  // Refresh on entry/focus/visibility return, never polling or Realtime.
  useEffect(() => {
    mounted.current = true;
    void refreshSettingsAccess();
    const focus = () => { void refreshSettingsAccess(); };
    const visible = () => { if (document.visibilityState === "visible") focus(); };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visible);
    return () => {
      mounted.current = false;
      accessVersion.current += 1;
      accountRequest.current += 1;
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refreshSettingsAccess]);

  const authorizeAction = async (module, action) => {
    const current = await refreshSettingsAccess();
    if (!refreshedAllows(current, module, action)) return null;
    const version = accessVersion.current;
    return { isCurrent: () => mounted.current && accessVersion.current === version &&
      refreshedAllows(accessProfile.current, module, action) };
  };

  const { activeTypes: productTypes, label: typeLabel, changed: typeChanged, loading: typesLoading, error: typesError, ready: typesReady } = useProductTypes();
  const [typeSearch, setTypeSearch] = useState("");
  const [typeAction, setTypeAction] = useState(null);
  const [masterValues, setMasterValues] = useState([]);
  const [managingKind, setManagingKind] = useState(null);
  const [masterAction, setMasterAction] = useState(null);
  const [masterSearch, setMasterSearch] = useState({ category: "", unit: "" });
  const openMasterAction = (kind, action, item = null) => {
    setMasterAction({ action, item });
    setManagingKind(kind);
  };
  const [masterLoading, setMasterLoading] = useState(false);
  const [masterError, setMasterError] = useState("");

  useEffect(() => {
    if (!canViewMasterData || !permissionRevision) return;
    let cancelled = false;
    const request = ++masterRequest.current;
    const currentRequest = () => !cancelled && request === masterRequest.current;
    setMasterLoading(true);
    getProductMasterValues().then((values) => {
      if (currentRequest()) { setMasterValues(values); setMasterError(""); }
    }).catch(() => {
      if (currentRequest()) setMasterError(t("productMasterPage.management.loadFailed"));
    }).finally(() => { if (currentRequest()) setMasterLoading(false); });
    return () => { cancelled = true; };
  }, [canViewMasterData, permissionRevision, t]);

  const handleMasterValueChange = (action, item) => {
    masterRequest.current += 1;
    setMasterLoading(false);
    setMasterValues((current) => action === "delete"
      ? current.filter((value) => value.id !== item.id)
      : [...current.filter((value) => value.id !== item.id), item]
        .sort((a, b) => a.value.localeCompare(b.value)));
  };


  const translateModule = (module) => {
    const keys = {
      "Dashboard": "sidebar.dashboard",
      "Recipes": "sidebar.recipes",
      "Product Master": "sidebar.productMaster",
      "ERP Entry": "sidebar.erpEntry",
      "Reports": "sidebar.reports",
      "Audit Trail": "sidebar.auditTrail",
      "General Settings": "settingsPage.permissionModules.general",
      "Permissions & User Rights": "settingsPage.permissionModules.accounts",
      "Master Data": "settingsPage.permissionModules.master",
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
  ] = useState("general");


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


  const authorizedTabs = [canViewGeneral && "general", canViewAccounts && "permissions", canViewMasterData && "master"].filter(Boolean);
  const visibleTab = authorizedTabs.includes(activeTab) ? activeTab : authorizedTabs[0];

  useEffect(() => {
    setActiveTab((current) => {
      const allowed = [canViewGeneral && "general", canViewAccounts && "permissions", canViewMasterData && "master"].filter(Boolean);
      return allowed.includes(current) ? current : allowed[0] || null;
    });
    setSuccessMessage("");
    if (!canViewAccounts) {
      accountRequest.current += 1;
      setEmployees([]); setRoles([]); setRolePermissions({});
      setSelectedEmployeeId(null); setSelectedRoleId(null);
      setEmployeeSearch(""); setRoleSearch("");
    }
    if (!canAddAccounts) {
      setShowUserModal(false); setShowRoleModal(false);
      setUserForm({ fullName: "", username: "", password: "", confirmPassword: "", roleId: "" });
      setRoleForm({ name: "", description: "" });
    }
    if (!canEditAccounts) {
      setShowPasswordModal(false); setPasswordForm({ password: "", confirmPassword: "" });
    }
    if (!canDeleteAccounts) setDeleteConfirmation(null);
    if (!canViewMasterData) {
      setMasterValues([]); setMasterSearch({ category: "", unit: "" }); setTypeSearch("");
      setMasterError(""); setMasterLoading(false);
    }

  }, [canViewGeneral, canViewAccounts, canAddAccounts, canEditAccounts, canDeleteAccounts,
    canViewMasterData, canAddMasterData, canEditMasterData, canDeleteMasterData]);

  // Any master-management capability change closes open management state.
  useEffect(() => {
    setManagingKind(null); setMasterAction(null); setTypeAction(null);
  }, [canViewMasterData, canAddMasterData, canEditMasterData, canDeleteMasterData]);

  const loadSettings = useCallback(
    async (
      showLoader = true
    ) => {
      if (!refreshedAllows(accessProfile.current, "Permissions & User Rights")) return;
      const request = ++accountRequest.current;
      const version = accessVersion.current;
      const currentRequest = () => mounted.current && request === accountRequest.current &&
        version === accessVersion.current && refreshedAllows(accessProfile.current, "Permissions & User Rights");
      try {
        if (showLoader) {
          setLoading(true);
        }

        const data =
          await getSettingsData();
        if (!currentRequest()) return;

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
        if (!currentRequest()) return;
        console.error(
          "Settings load error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotLoad")
        );
      } finally {
        if (currentRequest()) {
          setLoading(false);
        }
      }
    }, [t]);


  useEffect(() => {
    if (!permissionRevision) return;
    if (canViewAccounts) void loadSettings(false);
    else setLoading(false);
    return () => { accountRequest.current += 1; };
  }, [canViewAccounts, permissionRevision, loadSettings]);


  useEffect(() => {
    setGeneralSettings({
      fullName:
        profile?.full_name ||
        "",

      email:
        profile?.email ||
        "",

      language:
        i18n.language?.startsWith("ar") ? "Arabic" : "English",
    });
  }, [
    profile?.full_name,
    profile?.email,
    i18n.language,
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
              roles.find((role) => isAdmin || !role.isSystemAdmin)?.id || ""
            ),
        })
      );
    }
  }, [
    roles,
    userForm.roleId,
    isAdmin,
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
      if (!canEditGeneral || saving) return;
      const authorization = await authorizeAction("General Settings", "edit");
      if (!authorization) return;
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
        if (!authorization.isCurrent()) return;

        accessProfile.current = await refreshProfile();
        if (!authorization.isCurrent()) return;
        await i18n.changeLanguage(generalSettings.language === "Arabic" ? "ar" : "en");

        setSuccessMessage(
          t("settingsPage.success.generalSaved")
        );
      } catch (error) {
        if (!authorization.isCurrent()) return;
        console.error(
          "Save general settings error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotSaveGeneral")
        );
      } finally {
        if (mounted.current) setSaving(false);
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
      if (!canEditAccounts || saving || (!isAdmin && selectedEmployee?.isSystemAdmin)) return;
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
        !role || (!isAdmin && role.isSystemAdmin) ||
        !selectedEmployee
      ) {
        return;
      }

      const authorization = await authorizeAction("Permissions & User Rights", "edit");
      if (!authorization) return;
      try {
        setSaving(true);

        await updateEmployeeRole({
          userId:
            selectedEmployee.id,

          roleId,
        });
        if (!authorization.isCurrent()) return;

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
        if (!authorization.isCurrent()) return;
        console.error(
          "Change employee role error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotChangeRole")
        );
      } finally {
        if (mounted.current) setSaving(false);
      }
    };


  const togglePermission = (
    module,
    permission
  ) => {
    if (!canEditAccounts || saving || !selectedRoleId || (!isAdmin && selectedRole?.isSystemAdmin) || (!isAdmin && selectedRole?.isSystemAdmin) || !moduleActions(module).includes(permission)) {
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
      if (!canEditAccounts || saving || !selectedRoleId) {
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
      if (!canAddAccounts || saving) return;

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

      const authorization = await authorizeAction("Permissions & User Rights", "add");
      if (!authorization) return;
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
        if (!authorization.isCurrent()) return;

        await loadSettings(
          false
        );
        if (!authorization.isCurrent()) return;

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
        if (!authorization.isCurrent()) return;
        console.error(
          "Create user error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotCreateUser")
        );
      } finally {
        if (mounted.current) setSaving(false);
      }
    };


  const handleCreateRole =
    async (
      event
    ) => {
      event.preventDefault();
      if (!canAddAccounts || saving) return;

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

      const authorization = await authorizeAction("Permissions & User Rights", "add");
      if (!authorization) return;
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
        if (!authorization.isCurrent()) return;

        await loadSettings(
          false
        );
        if (!authorization.isCurrent()) return;

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
        if (!authorization.isCurrent()) return;
        console.error(
          "Create role error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotCreateRole")
        );
      } finally {
        if (mounted.current) setSaving(false);
      }
    };


  const handleDeleteRole =
    (role) => {
      if (
        !canDeleteAccounts || saving ||
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
      if (!canDeleteAccounts || saving || (!isAdmin && employee.isSystemAdmin)) return;
      setDeleteConfirmation({
        type: "user",
        item: employee,
      });
    };


  const confirmDelete =
    async () => {
      if (
        !canDeleteAccounts || saving ||
        !deleteConfirmation
      ) {
        return;
      }

      const authorization = await authorizeAction("Permissions & User Rights", "delete");
      if (!authorization) return;
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
        if (!authorization.isCurrent()) return;

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
        if (!authorization.isCurrent()) return;

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
        if (!authorization.isCurrent()) return;
      } catch (error) {
        if (!authorization.isCurrent()) return;
        console.error(
          "Delete settings item error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotDelete")
        );
      } finally {
        if (mounted.current) setSaving(false);
      }
    };


  const handleResetPassword =
    async (
      event
    ) => {
      event.preventDefault();
      if (!canEditAccounts || saving || (!isAdmin && selectedEmployee?.isSystemAdmin)) return;

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

      const authorization = await authorizeAction("Permissions & User Rights", "edit");
      if (!authorization) return;
      try {
        setSaving(true);

        await resetUserPassword({
          userId:
            selectedEmployee.id,

          password:
            passwordForm.password,
        });
        if (!authorization.isCurrent()) return;

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
        if (!authorization.isCurrent()) return;
        console.error(
          "Reset password error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotResetPassword")
        );
      } finally {
        if (mounted.current) setSaving(false);
      }
    };


  const handleSavePermissions =
    async () => {
      if (
        !canEditAccounts || saving || (!isAdmin && selectedRole?.isSystemAdmin) ||
        !selectedRoleId
      ) {
        return;
      }

      const authorization = await authorizeAction("Permissions & User Rights", "edit");
      if (!authorization) return;
      try {
        setSaving(true);

        await saveRolePermissions({
          roleId:
            selectedRoleId,

          permissions,
        });
        if (!authorization.isCurrent()) return;

        if (
          profile?.role_id ===
          selectedRoleId
        ) {
          accessProfile.current = await refreshProfile();
        if (!authorization.isCurrent()) return;
        }

        setSuccessMessage(
          t("settingsPage.success.permissionsSaved")
        );
      } catch (error) {
        if (!authorization.isCurrent()) return;
        console.error(
          "Save permissions error:",
          error
        );

        alert(
          error?.message ||
            t("settingsPage.errors.couldNotSavePermissions")
        );
      } finally {
        if (mounted.current) setSaving(false);
      }
    };


  if (loading || !permissionRevision) {
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

          {canViewGeneral && <button
            type="button"
            className={
              visibleTab ===
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
          </button>}


          {canViewAccounts && <button
            type="button"
            className={
              visibleTab ===
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
          </button>}

          {canViewMasterData && <button type="button"
            className={visibleTab === "master" ? "active" : ""}
            onClick={() => setActiveTab("master")}>
            {t("settingsPage.masterData.title")}
          </button>}

        </div>


        {/* ===================================
            GENERAL
        =================================== */}

        {visibleTab === "master" ? (
          canViewMasterData && <section className="general-settings-panel settings-master-data">
            <div className="general-settings-header"><h2>{t("settingsPage.masterData.title")}</h2><p>{t("settingsPage.masterData.description")}</p></div>
            {masterError && <p className="product-values-error" role="alert">{masterError}</p>}
            <div className="settings-master-data-grid">
              {["category", "unit"].map((kind) => (
                <section className="settings-master-data-section" key={kind}>
                  <div className="settings-master-card-header">
                    <div><h3>{t(`settingsPage.masterData.${kind === "category" ? "categories" : "units"}`)}</h3>
                      <p>{t(`settingsPage.masterData.${kind}Description`)}</p></div>
                    {canAddMasterData && <button type="button" className="settings-master-add"
                      disabled={masterLoading || !!masterError} onClick={() => openMasterAction(kind, "add")}>
                      <Plus size={14} />{t(`settingsPage.masterData.add${kind === "category" ? "Category" : "Unit"}`)}
                    </button>}
                  </div>
                  <label className="settings-master-search"><Search size={15} />
                    <input value={masterSearch[kind]} placeholder={t(`settingsPage.masterData.${kind}Search`)}
                      aria-label={t(`settingsPage.masterData.${kind}Search`)}
                      onChange={(event) => setMasterSearch((current) => ({ ...current, [kind]: event.target.value }))} />
                  </label>
                  <div className="settings-master-table-wrap"><table className="settings-master-table">
                    <thead><tr><th>#</th><th>{t(`settingsPage.masterData.${kind}Name`)}</th><th>{t("settingsPage.masterData.actions")}</th></tr></thead>
                    <tbody>{masterValues.filter((item) => item.kind === kind && item.value.toLocaleLowerCase().includes(masterSearch[kind].trim().toLocaleLowerCase())).map((item, index) => (
                      <tr key={item.id}><td>{index + 1}</td><td>{item.value}</td><td><div className="settings-master-row-actions">
                        {canEditMasterData && <button type="button" aria-label={`${t("productMasterPage.management.editValue")}: ${item.value}`}
                          onClick={() => openMasterAction(kind, "rename", item)}><Pencil size={14} /></button>}
                        {canDeleteMasterData && <button type="button" className="settings-master-delete" aria-label={`${t("productMasterPage.management.delete")}: ${item.value}`}
                          onClick={() => openMasterAction(kind, "delete", item)}><Trash2 size={14} /></button>}
                      </div></td></tr>
                    ))}</tbody>
                  </table></div>
                </section>
              ))}
              <section className="settings-master-data-section settings-product-types-section">
                <div className="settings-master-card-header"><div><h3>{t("settingsPage.masterData.productTypes")}</h3>
                  <p>{t("settingsPage.productTypeManagement.description")}</p></div>
                  {canAddMasterData && <button type="button" className="settings-master-add" disabled={typesLoading || !!typesError}
                    onClick={() => setTypeAction({ action: "add", item: null })}><Plus size={14} />{t("settingsPage.productTypeManagement.add")}</button>}</div>
                <label className="settings-master-search"><Search size={15} />
                  <input value={typeSearch} placeholder={t("settingsPage.productTypeManagement.search")} aria-label={t("settingsPage.productTypeManagement.search")}
                    onChange={(event) => setTypeSearch(event.target.value)} /></label>
                {!typesReady && <ProductTypesReadiness />}
                <div className="settings-master-table-wrap"><table className="settings-master-table">
                  <thead><tr><th>#</th><th>{t("settingsPage.masterData.productTypes")}</th><th>{t("settingsPage.masterData.actions")}</th></tr></thead>
                  <tbody>{productTypes.filter((item) => `${item.value} ${item.arabic_name}`.toLocaleLowerCase().includes(typeSearch.trim().toLocaleLowerCase())).map((item, index) => (
                    <tr key={item.id}><td>{index + 1}</td><td>{typeLabel(item.type_key)}</td><td><div className="settings-master-row-actions">
                      {canEditMasterData && <button type="button" aria-label={`${t("settingsPage.productTypeManagement.edit")}: ${typeLabel(item.type_key)}`}
                        onClick={() => setTypeAction({ action: "edit", item })}><Pencil size={14} /></button>}
                      {canDeleteMasterData && <button type="button" className="settings-master-delete" aria-label={`${t("settingsPage.productTypeManagement.delete")}: ${typeLabel(item.type_key)}`}
                        onClick={() => setTypeAction({ action: "delete", item })}><Trash2 size={14} /></button>}
                      
                    </div></td></tr>
                  ))}</tbody>
                </table></div>
              </section>
            </div>
          </section>
        ) : visibleTab ===
        "general" && canViewGeneral ? (

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
                  disabled={!canEditGeneral || saving}
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
                  disabled={!canEditGeneral || saving}
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
                  disabled={!canEditGeneral || saving}
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
                disabled={!canEditGeneral || saving}
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

        ) : canViewAccounts && visibleTab === "permissions" ? (


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
                disabled={!canAddAccounts || saving}
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
                        disabled={!canDeleteAccounts || saving || (!isAdmin && employee.isSystemAdmin)}
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
                          disabled={!canDeleteAccounts || saving}
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
                disabled={!canEditAccounts || saving || (!isAdmin && selectedEmployee?.isSystemAdmin)}
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
                    disabled={!canEditAccounts || saving || (!isAdmin && selectedRole?.isSystemAdmin)}
                  >

                    {roles.filter((role) => isAdmin || !role.isSystemAdmin || selectedEmployee?.isSystemAdmin).map(
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
                    disabled={!canEditAccounts || saving || (!isAdmin && selectedEmployee?.isSystemAdmin)}
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
                  disabled={!canEditAccounts || saving || (!isAdmin && selectedRole?.isSystemAdmin)}
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
                      <th>{t("settingsPage.permissions.print")}</th>

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
                            {translateModule(module)}
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

                                {moduleActions(module).includes(permission) && <button
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
                                  disabled={!canEditAccounts || saving || (!isAdmin && selectedRole?.isSystemAdmin)}
                                >
                                  <span />
                                </button>}

                              </td>

                            )
                          )}

                          <td>
                            {["Reports", "Audit Trail"].includes(module) && (
                              <button
                                type="button"
                                className={`settings-toggle ${permissions[module].print ? "active" : ""}`}
                                onClick={() => togglePermission(module, "print")}
                                disabled={!canEditAccounts || saving || (!isAdmin && selectedRole?.isSystemAdmin)}
                                aria-label={`${module}: ${t("settingsPage.permissions.print")}`}
                              >
                                <span />
                              </button>
                            )}
                          </td>

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
                  disabled={!canEditAccounts || saving || (!isAdmin && selectedRole?.isSystemAdmin)}
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

        ) : null}

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


      {canViewMasterData && managingKind && <ManageProductMasterValuesModal
        initialAction={masterAction?.action} initialItem={masterAction?.item}
        beforeAction={(action) => authorizeAction("Master Data", action === "rename" ? "edit" : action)}
        kind={managingKind} values={masterValues} canAdd={canAddMasterData}
        canEdit={canEditMasterData} canDelete={canDeleteMasterData}
        onChange={handleMasterValueChange} onClose={() => setManagingKind(null)} />}
      {canViewMasterData && typeAction && <ManageProductTypeModal {...typeAction}
        beforeAction={(action) => authorizeAction("Master Data", action === "retire" ? "delete" : action)}
        canAdd={canAddMasterData && typesReady} canEdit={canEditMasterData && typesReady} canDelete={canDeleteMasterData && typesReady}
        onChange={typeChanged} onClose={() => setTypeAction(null)} />}

      {canDeleteAccounts && deleteConfirmation && (

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
                disabled={!canDeleteAccounts || saving}
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

      {canAddAccounts && showUserModal && (

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

                      {roles.filter((role) => isAdmin || !role.isSystemAdmin).map(
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

      {canAddAccounts && showRoleModal && (

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

      {canEditAccounts && showPasswordModal && (

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
