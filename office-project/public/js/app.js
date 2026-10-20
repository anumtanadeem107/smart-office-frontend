"use strict";

/*
  FRONTEND DEMO ONLY

  Records are stored in this browser.
  Login and permissions are simulated.

  Later, replace the storage functions with calls to
  your Express API and MySQL database.
*/

const STORAGE_KEY = "smart-office-frontend-v2";
const SESSION_KEY = "smart-office-session-v2";
const DEMO_PASSWORD = "Office@123";

const app = document.querySelector("#app");
const modal = document.querySelector("#modal");
const toastElement = document.querySelector("#toast");

let database;
let currentUser;
let currentPage = "dashboard";
let searchText = "";
let statusFilter = "";
let pageNumber = 1;
let modalSubmit = null;
let toastTimer;

const PAGE_SIZE = 8;

function today() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function localTime() {
  const date = new Date();
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
}

function futureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function initialData() {
  return {
    users: [
      { id: 1, username: "admin", role: "Administrator" },
      { id: 2, username: "manager", role: "Manager" },
      { id: 3, username: "employee", role: "Employee" }
    ],

    departments: [
      { id: 1, departmentName: "Administration" },
      { id: 2, departmentName: "Engineering" }
    ],

    designations: [
      { id: 1, designationName: "Office Administrator" },
      { id: 2, designationName: "Team Manager" },
      { id: 3, designationName: "Software Engineer" }
    ],

    employees: [
      {
        id: 1,
        userId: 1,
        name: "Ayesha Khan",
        email: "admin@smartoffice.demo",
        phone: "0300-0000001",
        departmentId: 1,
        designationId: 1,
        joiningDate: "2026-01-05",
        status: "Active"
      },
      {
        id: 2,
        userId: 2,
        name: "Omar Farooq",
        email: "manager@smartoffice.demo",
        phone: "0300-0000002",
        departmentId: 2,
        designationId: 2,
        joiningDate: "2026-01-10",
        status: "Active"
      },
      {
        id: 3,
        userId: 3,
        name: "Sara Ahmed",
        email: "employee@smartoffice.demo",
        phone: "0300-0000003",
        departmentId: 2,
        designationId: 3,
        joiningDate: "2026-02-01",
        status: "Active"
      }
    ],

    rooms: [
      {
        id: 1,
        roomName: "Boardroom",
        capacity: 12,
        status: "Available"
      },
      {
        id: 2,
        roomName: "Focus Room",
        capacity: 4,
        status: "Available"
      },
      {
        id: 3,
        roomName: "Creative Studio",
        capacity: 8,
        status: "Maintenance"
      }
    ],

    bookings: [],

    assets: [
      {
        id: 1,
        assetName: "Dell Latitude",
        assetType: "Laptop",
        serialNumber: "SO-LT-001",
        status: "Assigned"
      },
      {
        id: 2,
        assetName: "Dell Monitor",
        assetType: "Monitor",
        serialNumber: "SO-MN-002",
        status: "Available"
      }
    ],

    assignments: [
      {
        id: 1,
        assetId: 1,
        employeeId: 3,
        assignedDate: today(),
        returnDate: "",
        status: "Active"
      }
    ],

    leaves: [],

    tasks: [
      {
        id: 1,
        title: "Review database relationships",
        description: "Review the ERD and verify foreign keys.",
        assignedTo: 3,
        assignedBy: 2,
        deadline: futureDate(3),
        priority: "High",
        status: "Pending"
      }
    ],

    complaints: [],

    visitors: [],

    visits: []
  };
}

const configurations = {
  users: {
    title: "User accounts",
    singular: "account",
    description: "Manage usernames and access roles.",
    roles: ["Administrator"],
    fields: [
      ["username", "Username", "text"],
      [
        "role",
        "Role",
        "select",
        ["Administrator", "Manager", "Employee"]
      ]
    ]
  },

  employees: {
    title: "Employees",
    singular: "employee",
    description: "Keep employee profiles organized and up to date.",
    roles: ["Administrator"],
    fields: [
      ["userId", "User account", "relation", "users"],
      ["name", "Full name", "text"],
      ["email", "Email", "email"],
      ["phone", "Phone", "tel"],
      ["departmentId", "Department", "relation", "departments"],
      ["designationId", "Designation", "relation", "designations"],
      ["joiningDate", "Joining date", "date"],
      ["status", "Status", "select", ["Active", "Inactive"]]
    ]
  },

  departments: {
    title: "Departments",
    singular: "department",
    description: "Organize the departments in your office.",
    roles: ["Administrator"],
    fields: [
      ["departmentName", "Department name", "text"]
    ]
  },

  designations: {
    title: "Designations",
    singular: "designation",
    description: "Manage employee job positions.",
    roles: ["Administrator"],
    fields: [
      ["designationName", "Designation name", "text"]
    ]
  },

  rooms: {
    title: "Meeting rooms",
    singular: "room",
    description: "View office rooms and their operational status.",
    roles: ["Administrator", "Employee"],
    fields: [
      ["roomName", "Room name", "text"],
      ["capacity", "Capacity", "number"],
      ["status", "Status", "select", ["Available", "Maintenance"]]
    ]
  },

  bookings: {
    title: "Room bookings",
    singular: "booking",
    description: "Reserve rooms and check existing reservations.",
    roles: ["Administrator", "Employee"],
    fields: [
      ["roomId", "Room", "relation", "rooms"],
      ["bookingDate", "Booking date", "date"],
      ["startTime", "Start time", "time"],
      ["endTime", "End time", "time"],
      ["purpose", "Purpose", "textarea"]
    ],
    extra: [
      ["employeeId", "Organizer", "relation", "employees"],
      ["status", "Status", "text"]
    ]
  },

  assets: {
    title: "Assets",
    singular: "asset",
    description: "Manage equipment and current availability.",
    roles: ["Administrator", "Employee"],
    fields: [
      ["assetName", "Asset name", "text"],
      ["assetType", "Asset type", "select",
        ["Laptop", "Monitor", "Printer", "Furniture", "Other"]],
      ["serialNumber", "Serial number", "text"],
      ["status", "Status", "select", ["Available", "Maintenance"]]
    ]
  },

  assignments: {
    title: "Asset history",
    singular: "assignment",
    description: "Track assignments, returns and transfers.",
    roles: ["Administrator", "Employee"],
    fields: [
      ["assetId", "Asset", "relation", "assets"],
      ["employeeId", "Employee", "relation", "employees"],
      ["assignedDate", "Assigned date", "date"],
      ["returnDate", "Return date", "date"],
      ["status", "Status", "text"]
    ]
  },

  leaves: {
    title: "Leave requests",
    singular: "leave request",
    description: "Submit requests and follow manager decisions.",
    roles: ["Manager", "Employee"],
    fields: [
      ["startDate", "Start date", "date"],
      ["endDate", "End date", "date"],
      ["reason", "Reason", "textarea"]
    ],
    extra: [
      ["employeeId", "Employee", "relation", "employees"],
      ["status", "Status", "text"],
      ["approvedBy", "Reviewed by", "relation", "employees"]
    ]
  },

  tasks: {
    title: "Tasks",
    singular: "task",
    description: "Keep responsibilities and deadlines clear.",
    roles: ["Manager", "Employee"],
    fields: [
      ["title", "Title", "text"],
      ["description", "Description", "textarea"],
      ["assignedTo", "Assigned to", "relation", "employees"],
      ["deadline", "Deadline", "date"],
      ["priority", "Priority", "select", ["Low", "Medium", "High"]]
    ],
    extra: [
      ["assignedBy", "Assigned by", "relation", "employees"],
      ["status", "Status", "text"]
    ]
  },

  complaints: {
    title: "Complaints",
    singular: "complaint",
    description: "Report workplace issues and track their resolution.",
    roles: ["Administrator", "Employee"],
    fields: [
      ["category", "Category", "select",
        ["IT & Equipment", "Facilities", "Furniture", "Other"]],
      ["description", "Description", "textarea"]
    ],
    extra: [
      ["employeeId", "Reported by", "relation", "employees"],
      ["submittedDate", "Submitted date", "date"],
      ["status", "Status", "text"]
    ]
  },

  visitors: {
    title: "Visitor profiles",
    singular: "visitor",
    description: "Register visitor details before recording a visit.",
    roles: ["Administrator"],
    fields: [
      ["name", "Visitor name", "text"],
      ["contact", "Contact", "text"],
      ["identificationNo", "Identification number", "text"]
    ]
  },

  visits: {
    title: "Visitor log",
    singular: "visit",
    description: "Record arrivals, hosts and departures.",
    roles: ["Administrator"],
    fields: [
      ["visitorId", "Visitor", "relation", "visitors"],
      ["employeeId", "Host employee", "relation", "employees"],
      ["purpose", "Purpose", "text"],
      ["checkInTime", "Check-in time", "datetime-local"]
    ],
    extra: [
      ["checkOutTime", "Check-out time", "datetime-local"]
    ]
  }
};

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character];
  });
}

function findRecord(collection, id) {
  return database[collection].find(record => record.id === Number(id));
}

function employeeFor(user = currentUser) {
  if (!user) return null;

  return database.employees.find(employee => employee.userId === user.id);
}

function recordName(collection, record) {
  if (!record) return "—";

  const fields = {
    users: "username",
    employees: "name",
    departments: "departmentName",
    designations: "designationName",
    rooms: "roomName",
    assets: "assetName",
    visitors: "name"
  };

  return record[fields[collection]] || `Record ${record.id}`;
}

function referenceName(collection, id) {
  return recordName(collection, findRecord(collection, id));
}

function loadDatabase() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    database = initialData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  } else {
    database = JSON.parse(saved);

    for (const collection of Object.keys(initialData())) {
      if (!Array.isArray(database[collection])) {
        throw new Error("Saved demo data is invalid. Reset the demo.");
      }
    }
  }

  const userId = Number(sessionStorage.getItem(SESSION_KEY));
  currentUser = findRecord("users", userId) || null;

  if (currentUser && employeeFor()?.status !== "Active") {
    currentUser = null;
    sessionStorage.removeItem(SESSION_KEY);
  }
}

function insertRecord(collection, values) {
  const id = Math.max(
    0,
    ...database[collection].map(record => record.id)
  ) + 1;

  const record = { ...values, id };
  database[collection].push(record);

  return record;
}

function changeDatabase(operation) {
  loadDatabase();

  if (!currentUser) {
    throw new Error("Please sign in again.");
  }

  const backup = JSON.stringify(database);

  try {
    operation();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  } catch (error) {
    database = JSON.parse(backup);
    throw error;
  }
}

function notify(message) {
  clearTimeout(toastTimer);
  toastElement.textContent = message;
  toastElement.classList.add("visible");

  toastTimer = setTimeout(() => {
    toastElement.classList.remove("visible");
  }, 4000);
}

function requireRole(...roles) {
  if (!currentUser || !roles.includes(currentUser.role)) {
    throw new Error("This action is not available for your role.");
  }
}

function canCreate(collection) {
  if (!currentUser) return false;

  const permissions = {
    Administrator: [
      "users", "employees", "departments", "designations",
      "rooms", "assets", "visitors", "visits"
    ],
    Manager: ["tasks"],
    Employee: ["bookings", "leaves", "complaints"]
  };

  return permissions[currentUser.role].includes(collection);
}

function canEdit(collection) {
  return canCreate(collection) &&
    !["bookings", "leaves", "complaints", "visits"].includes(collection);
}

function canDelete(collection) {
  return currentUser?.role === "Administrator" &&
    ["employees", "departments", "designations", "rooms", "assets"]
      .includes(collection);
}

function scopedRecords(collection) {
  const rows = database[collection];

  if (currentUser.role !== "Employee") return rows;

  const employeeId = employeeFor().id;

  if (["leaves", "complaints", "assignments"].includes(collection)) {
    return rows.filter(record => record.employeeId === employeeId);
  }

  if (collection === "tasks") {
    return rows.filter(record => record.assignedTo === employeeId);
  }

  if (collection === "assets") {
    const ids = database.assignments
      .filter(record =>
        record.employeeId === employeeId &&
        record.status === "Active"
      )
      .map(record => record.assetId);

    return rows.filter(record => ids.includes(record.id));
  }

  return rows;
}

function badge(value) {
  let color = "";

  if (["Active", "Available", "Approved", "Completed", "Resolved",
       "Confirmed", "Returned"].includes(value)) {
    color = "green";
  } else if (["Pending", "Submitted", "Maintenance", "Medium"].includes(value)) {
    color = "amber";
  } else if (["Rejected", "Inactive", "High", "Cancelled"].includes(value)) {
    color = "red";
  } else if (["Assigned", "In Progress"].includes(value)) {
    color = "blue";
  }

  return `<span class="badge ${color}">${escapeHTML(value)}</span>`;
}

function actionButton(label, action, id = "", className = "small") {
  return `
    <button
      class="btn ${className}"
      type="button"
      data-action="${action}"
      data-id="${id}">
      ${label}
    </button>
  `;
}

function showLogin(message = "") {
  app.innerHTML = `
    <div class="login-layout">
      <section class="login-intro">
        <div class="brand">
          <span class="brand-mark">SO</span>
          Smart Office
        </div>

        <div class="intro-copy">
          <h1>Your office.<br><span>Working together.</span></h1>
          <p>
            Bring people, resources and everyday workflows
            into one organized workspace.
          </p>
        </div>

        <small>Smart Office Resource & Workflow Management System</small>
      </section>

      <main id="main" class="login-main">
        <section class="login-card">
          <p class="eyebrow">WELCOME TO YOUR WORKSPACE</p>
          <h2>Welcome back.</h2>
          <p class="muted">Sign in to explore Smart Office.</p>

          <form id="login-form">
            <label>
              Username or email
              <input name="username" autocomplete="username" required>
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                autocomplete="current-password"
                required>
            </label>

            <div id="login-error" class="error" role="alert">
              ${escapeHTML(message)}
            </div>

            <button class="btn primary" type="submit">Sign in</button>
          </form>

          <div class="demo-accounts">
            <strong>Try a demo role</strong>
            <p class="muted">
              Password for demo accounts: <b>Office@123</b>
            </p>
            <div class="demo-buttons">
              ${actionButton("Administrator", "demo", "admin")}
              ${actionButton("Manager", "demo", "manager")}
              ${actionButton("Employee", "demo", "employee")}
            </div>
          </div>

          <p class="login-footer">
            Frontend demo only. Use fictional data.
            Real authentication and MySQL will be added later.
          </p>

          ${actionButton("Reset demo data", "reset")}
        </section>
      </main>
    </div>
  `;
}

function showDashboard() {
  const employee = employeeFor();

  const accessible = Object.entries(configurations).filter(([, config]) =>
    config.roles.includes(currentUser.role)
  );

  let stats;

  if (currentUser.role === "Administrator") {
    stats = [
      ["Active employees",
        database.employees.filter(row => row.status === "Active").length],
      ["Rooms in service",
        database.rooms.filter(row => row.status === "Available").length],
      ["Available assets",
        database.assets.filter(row => row.status === "Available").length],
      ["Visitors inside",
        database.visits.filter(row => !row.checkOutTime).length]
    ];
  } else {
    stats = [
      ["Open tasks",
        scopedRecords("tasks").filter(row => row.status !== "Completed").length],
      ["Pending leave",
        scopedRecords("leaves").filter(row => row.status === "Pending").length],
      ["Completed tasks",
        scopedRecords("tasks").filter(row => row.status === "Completed").length],
      ["High-priority tasks",
        scopedRecords("tasks").filter(row =>
          row.priority === "High" && row.status !== "Completed"
        ).length]
    ];
  }

  return `
    <p class="eyebrow">${escapeHTML(currentUser.role)} workspace</p>

    <div class="page-heading">
      <div>
        <h1>Welcome, ${escapeHTML(employee.name.split(" ")[0])}.</h1>
        <p>Your office activity, organized in one place.</p>
      </div>
    </div>

    <section class="stats">
      ${stats.map(([label, value]) => `
        <article class="stat-card">
          <p>${label}</p>
          <strong>${value}</strong>
        </article>
      `).join("")}
    </section>

    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-content">
          <h2>Quick access</h2>
          <div class="quick-links">
            ${accessible.map(([key, config]) => `
              <a class="quick-link" href="#${key}">
                ${config.title} →
              </a>
            `).join("")}
          </div>
        </div>
      </section>

      <section class="welcome-panel">
        <p class="eyebrow">YOUR PROFILE</p>
        <h2>${escapeHTML(employee.name)}</h2>
        <p>
          ${escapeHTML(referenceName("departments", employee.departmentId))}
          <br>
          ${escapeHTML(referenceName("designations", employee.designationId))}
        </p>
        <p>${escapeHTML(employee.email)}</p>

        <div class="notice">
          This is a local frontend demonstration.
          Changes are saved in this browser.
        </div>
      </section>
    </div>
  `;
}

function displayValue(field, record) {
  const [key, , type, source] = field;
  const value = record[key];

  if (value === undefined || value === null || value === "") return "—";

  if (type === "relation") {
    return escapeHTML(referenceName(source, value));
  }

  if (key === "status" || key === "priority" || key === "role") {
    return badge(value);
  }

  return escapeHTML(String(value).replace("T", " "));
}

function rowActions(collection, record) {
  const buttons = [];

  if (canEdit(collection)) {
    buttons.push(actionButton("Edit", "edit", record.id));
  }

  if (canDelete(collection)) {
    buttons.push(actionButton("Remove", "delete", record.id));
  }

  const role = currentUser.role;
  const employeeId = employeeFor().id;

  if (collection === "bookings" && record.status === "Confirmed") {
    const future = `${record.bookingDate}T${record.endTime}` > localTime();

    if (future && (role === "Administrator" || record.employeeId === employeeId)) {
      buttons.push(actionButton("Cancel", "cancel-booking", record.id));
    }
  }

  if (collection === "assets" && role === "Administrator") {
    if (record.status === "Available") {
      buttons.push(actionButton("Assign", "assign-asset", record.id));
    }

    if (record.status === "Assigned") {
      buttons.push(actionButton("Transfer", "transfer-asset", record.id));
      buttons.push(actionButton("Return", "return-asset", record.id));
    }
  }

  if (collection === "leaves" && role === "Manager" &&
      record.status === "Pending") {
    buttons.push(actionButton("Review", "review-leave", record.id));
  }

  if (collection === "tasks" && role === "Employee") {
    buttons.push(actionButton("Update status", "task-status", record.id));
  }

  if (collection === "complaints" && role === "Administrator" &&
      record.status !== "Closed") {
    buttons.push(actionButton("Update", "complaint-status", record.id));
  }

  if (collection === "visits" && !record.checkOutTime) {
    buttons.push(actionButton("Check out", "checkout", record.id));
  }

  return buttons.length
    ? `<div class="actions">${buttons.join("")}</div>`
    : "—";
}

function showCollection() {
  const config = configurations[currentPage];

  if (!config || !config.roles.includes(currentUser.role)) {
    return `
      <h1>Page unavailable</h1>
      <p>This page is not available for your role.</p>
      <a href="#dashboard" class="btn primary">Return to dashboard</a>
    `;
  }

  const fields = [...config.fields, ...(config.extra || [])];
  const allRows = scopedRecords(currentPage);

  let rows = allRows.filter(record => {
    const content = fields.map(field => {
      if (field[2] === "relation") {
        return referenceName(field[3], record[field[0]]);
      }

      return record[field[0]] ?? "";
    }).join(" ").toLowerCase();

    return content.includes(searchText.toLowerCase()) &&
      (!statusFilter || record.status === statusFilter);
  });

  rows = [...rows].sort((a, b) => b.id - a.id);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  pageNumber = Math.min(pageNumber, totalPages);

  const visible = rows.slice(
    (pageNumber - 1) * PAGE_SIZE,
    pageNumber * PAGE_SIZE
  );

  const statuses = [...new Set(allRows.map(row => row.status).filter(Boolean))];

  return `
    <div class="page-heading">
      <div>
        <h1>${config.title}</h1>
        <p>${config.description}</p>
      </div>

      ${canCreate(currentPage)
        ? actionButton(`+ Add ${config.singular}`, "create", "", "primary")
        : ""}
    </div>

    ${currentPage === "users" ? `
      <p class="notice">
        Demo accounts use Office@123. Create an account here, then link it
        to an active employee profile before signing in with it.
      </p>
    ` : ""}

    <section class="panel">
      <div class="toolbar">
        <input
          id="search"
          type="search"
          aria-label="Search records"
          placeholder="Search ${config.title.toLowerCase()}..."
          value="${escapeHTML(searchText)}">

        ${statuses.length ? `
          <select id="status-filter" aria-label="Filter by status">
            <option value="">All statuses</option>
            ${statuses.map(status => `
              <option
                value="${escapeHTML(status)}"
                ${statusFilter === status ? "selected" : ""}>
                ${escapeHTML(status)}
              </option>
            `).join("")}
          </select>
        ` : ""}
      </div>

      <div class="table-wrap" tabindex="0" aria-label="Records table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              ${fields.map(field => `<th>${field[1]}</th>`).join("")}
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${visible.length ? visible.map(record => `
              <tr>
                <td>#${record.id}</td>
                ${fields.map(field => `
                  <td class="${field[2] === "textarea" ? "long-text" : ""}">
                    ${displayValue(field, record)}
                  </td>
                `).join("")}
                <td>${rowActions(currentPage, record)}</td>
              </tr>
            `).join("") : `
              <tr>
                <td colspan="${fields.length + 2}" class="empty">
                  No records found. Add a record or change your search.
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        <span>${rows.length} record(s)</span>

        <div class="pagination">
          <button
            class="btn small"
            data-action="previous"
            ${pageNumber === 1 ? "disabled" : ""}>
            Previous
          </button>

          <span>${pageNumber} / ${totalPages}</span>

          <button
            class="btn small"
            data-action="next"
            ${pageNumber === totalPages ? "disabled" : ""}>
            Next
          </button>
        </div>
      </div>
    </section>
  `;
}

function render() {
  try {
    loadDatabase();
  } catch (error) {
    showLogin(error.message);
    return;
  }

  if (!currentUser) {
    showLogin();
    return;
  }

  currentPage = location.hash.slice(1) || "dashboard";

  const navigation = Object.entries(configurations).filter(([, config]) =>
    config.roles.includes(currentUser.role)
  );

  const employee = employeeFor();

  app.innerHTML = `
    <aside class="sidebar" id="sidebar">
      <a class="brand" href="#dashboard">
        <span class="brand-mark">SO</span>
        Smart Office
      </a>

      <p class="nav-label">WORKSPACE</p>

      <nav aria-label="Main navigation">
        <a
          class="nav-link ${currentPage === "dashboard" ? "active" : ""}"
          href="#dashboard">
          Overview
        </a>

        ${navigation.map(([key, config]) => `
          <a
            class="nav-link ${currentPage === key ? "active" : ""}"
            href="#${key}">
            ${config.title}
          </a>
        `).join("")}
      </nav>

      <div class="sidebar-bottom">
        <p>
          <strong>${escapeHTML(employee.name)}</strong><br>
          <small>${escapeHTML(currentUser.role)}</small>
        </p>

        ${actionButton("Sign out", "logout")}
      </div>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="btn mobile-menu"
            data-action="menu"
            aria-controls="sidebar"
            aria-expanded="false">
            Menu
          </button>

          <span>
            ${configurations[currentPage]?.title || "Overview"}
          </span>
        </div>

        <span class="demo-label">FRONTEND DEMO</span>
      </header>

      <main id="main" class="workspace-main">
        ${currentPage === "dashboard" ? showDashboard() : showCollection()}
      </main>
    </div>
  `;
}

function relationOptions(collection, fieldName) {
  let rows = database[collection];

  if (collection === "employees") {
    rows = rows.filter(employee => employee.status === "Active");

    if (fieldName === "assignedTo") {
      rows = rows.filter(employee =>
        findRecord("users", employee.userId)?.role === "Employee"
      );
    }
  }

  if (collection === "rooms") {
    rows = rows.filter(room => room.status === "Available");
  }

  return rows.map(record => ({
    value: record.id,
    label: recordName(collection, record)
  }));
}

function formField(field, value = "") {
  const [name, label, type, source] = field;
  const full = type === "textarea" ? "full" : "";
  let control;

  if (type === "select" || type === "relation") {
    const options = type === "relation"
      ? relationOptions(source, name)
      : source.map(option => ({ value: option, label: option }));

    control = `
      <select name="${name}" required>
        <option value="">Select ${label.toLowerCase()}</option>
        ${options.map(option => `
          <option
            value="${escapeHTML(option.value)}"
            ${String(value) === String(option.value) ? "selected" : ""}>
            ${escapeHTML(option.label)}
          </option>
        `).join("")}
      </select>
    `;
  } else if (type === "textarea") {
    control = `
      <textarea name="${name}" maxlength="2000" required>${escapeHTML(value)}</textarea>
    `;
  } else {
    control = `
      <input
        name="${name}"
        type="${type}"
        value="${escapeHTML(value)}"
        ${type === "number" ? 'min="1" max="500" step="1"' : ""}
        ${["text", "email", "tel"].includes(type) ? 'maxlength="150"' : ""}
        required>
    `;
  }

  return `<label class="${full}">${label}${control}</label>`;
}

function openModal(title, body, onSubmit, submitLabel = "Save") {
  modalSubmit = onSubmit;

  modal.innerHTML = `
    <div class="dialog-header">
      <h2 id="modal-title">${escapeHTML(title)}</h2>
      ${actionButton("Close", "close")}
    </div>

    <form id="record-form">
      <div class="dialog-body">
        ${body}
        <div id="form-error" class="error" role="alert"></div>
      </div>

      <div class="dialog-footer">
        ${actionButton("Cancel", "close")}
        <button class="btn primary" type="submit">${submitLabel}</button>
      </div>
    </form>
  `;

  modal.showModal();
}

function closeModal() {
  modal.close();
  modalSubmit = null;
}

function openRecordForm(id) {
  const collection = currentPage;
  const config = configurations[collection];

  if (id ? !canEdit(collection) : !canCreate(collection)) {
    throw new Error("You cannot perform this action.");
  }

  const record = id ? findRecord(collection, id) : {};

  let fields = config.fields;

  // Assigned status is controlled through asset operations.
  if (collection === "assets" && record.status === "Assigned") {
    fields = fields.filter(field => field[0] !== "status");
  }

  const body = `
    <div class="form-grid">
      ${fields.map(field => {
        let value = record[field[0]] ?? "";

        if (!id && field[0] === "checkInTime") value = localTime();

        return formField(field, value);
      }).join("")}
    </div>
  `;

  openModal(
    `${id ? "Edit" : "Add"} ${config.singular}`,
    body,
    values => {
      changeDatabase(() => saveRecord(collection, values, id));
      closeModal();
      render();
      notify("Record saved successfully.");
    }
  );
}

function validateUnique(collection, field, value, id) {
  const duplicate = database[collection].some(record =>
    record.id !== Number(id) &&
    String(record[field]).toLowerCase() === String(value).toLowerCase()
  );

  if (duplicate) {
    throw new Error(`${field} already exists.`);
  }
}

function saveRecord(collection, values, id) {
  if (id ? !canEdit(collection) : !canCreate(collection)) {
    throw new Error("You cannot save this record.");
  }

  const existing = id ? findRecord(collection, id) : null;

  if (id && !existing) throw new Error("Record not found.");

  const record = existing ? { ...existing } : {};

  for (const field of configurations[collection].fields) {
    const [name, label, type, source] = field;

    if (collection === "assets" &&
        existing?.status === "Assigned" && name === "status") {
      continue;
    }

    const value = String(values[name] ?? "").trim();

    if (!value) throw new Error(`${label} is required.`);

    if (type === "relation") {
      const linked = findRecord(source, value);

      if (!linked) throw new Error(`Choose a valid ${label.toLowerCase()}.`);

      if (source === "employees" && linked.status !== "Active") {
        throw new Error("Choose an active employee.");
      }

      record[name] = Number(value);
    } else if (type === "number") {
      const number = Number(value);

      if (!Number.isInteger(number) || number < 1 || number > 500) {
        throw new Error(`${label} must be between 1 and 500.`);
      }

      record[name] = number;
    } else {
      if (type === "select" && !source.includes(value)) {
        throw new Error(`Choose a valid ${label.toLowerCase()}.`);
      }

      record[name] = value;
    }
  }

  const employeeId = employeeFor().id;

  if (collection === "users") {
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(record.username)) {
      throw new Error("Username must be 3–40 letters, numbers, dots, underscores or hyphens.");
    }

    validateUnique(collection, "username", record.username, id);

    if (existing?.id === currentUser.id && record.role !== "Administrator") {
      throw new Error("You cannot change your own administrator role.");
    }
  }

  if (collection === "employees") {
    validateUnique(collection, "email", record.email, id);
    validateUnique(collection, "userId", record.userId, id);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      throw new Error("Enter a valid email address.");
    }

    if (existing?.userId === currentUser.id &&
        (record.status !== "Active" || record.userId !== currentUser.id)) {
      throw new Error("You cannot disable or unlink your own profile.");
    }
  }

  if (collection === "departments") {
    validateUnique(collection, "departmentName", record.departmentName, id);
  }

  if (collection === "designations") {
    validateUnique(collection, "designationName", record.designationName, id);
  }

  if (collection === "rooms") {
    validateUnique(collection, "roomName", record.roomName, id);

    const upcoming = database.bookings.some(booking =>
      booking.roomId === Number(id) &&
      booking.status === "Confirmed" &&
      `${booking.bookingDate}T${booking.endTime}` > localTime()
    );

    if (record.status === "Maintenance" && upcoming) {
      throw new Error("Cancel upcoming bookings before enabling maintenance.");
    }
  }

  if (collection === "bookings") {
    const room = findRecord("rooms", record.roomId);

    if (room.status !== "Available") {
      throw new Error("This room is under maintenance.");
    }

    if (record.endTime <= record.startTime) {
      throw new Error("End time must be after start time.");
    }

    if (`${record.bookingDate}T${record.startTime}` < localTime()) {
      throw new Error("Choose a future booking time.");
    }

    const conflict = database.bookings.some(booking =>
      booking.roomId === record.roomId &&
      booking.bookingDate === record.bookingDate &&
      booking.status === "Confirmed" &&
      record.startTime < booking.endTime &&
      record.endTime > booking.startTime
    );

    if (conflict) {
      throw new Error("This room is already booked during that time.");
    }

    record.employeeId = employeeId;
    record.status = "Confirmed";
  }

  if (collection === "assets") {
    validateUnique(collection, "serialNumber", record.serialNumber, id);
  }

  if (collection === "leaves") {
    if (record.endDate < record.startDate) {
      throw new Error("End date cannot be before start date.");
    }

    if (record.startDate < today()) {
      throw new Error("Choose today or a future start date.");
    }

    const overlap = database.leaves.some(leave =>
      leave.employeeId === employeeId &&
      ["Pending", "Approved"].includes(leave.status) &&
      record.startDate <= leave.endDate &&
      record.endDate >= leave.startDate
    );

    if (overlap) {
      throw new Error("You already have leave requested for these dates.");
    }

    record.employeeId = employeeId;
    record.status = "Pending";
    record.approvedBy = null;
  }

  if (collection === "tasks") {
    const assignee = findRecord("employees", record.assignedTo);

    if (findRecord("users", assignee.userId)?.role !== "Employee") {
      throw new Error("Choose an employee account as the assignee.");
    }

    record.assignedBy = existing?.assignedBy || employeeId;
    record.status = existing?.status || "Pending";
  }

  if (collection === "complaints") {
    record.employeeId = employeeId;
    record.submittedDate = today();
    record.status = "Submitted";
  }

  if (collection === "visitors") {
    validateUnique(collection, "identificationNo", record.identificationNo, id);
  }

  if (collection === "visits") {
    if (record.checkInTime > localTime()) {
      throw new Error("Check-in cannot be in the future.");
    }

    if (database.visits.some(visit =>
      visit.visitorId === record.visitorId && !visit.checkOutTime
    )) {
      throw new Error("This visitor already has an open visit.");
    }

    record.checkOutTime = "";
  }

  if (existing) Object.assign(existing, record);
  else insertRecord(collection, record);
}

function deleteRecord(collection, id) {
  if (!canDelete(collection)) {
    throw new Error("You cannot remove this record.");
  }

  const record = findRecord(collection, id);
  if (!record) throw new Error("Record not found.");

  let linked = false;

  if (collection === "departments") {
    linked = database.employees.some(row => row.departmentId === record.id);
  }

  if (collection === "designations") {
    linked = database.employees.some(row => row.designationId === record.id);
  }

  if (collection === "rooms") {
    linked = database.bookings.some(row => row.roomId === record.id);
  }

  if (collection === "assets") {
    linked = database.assignments.some(row => row.assetId === record.id);
  }

  if (collection === "employees") {
    linked =
      record.userId === currentUser.id ||
      ["bookings", "assignments", "leaves", "complaints", "visits"]
        .some(key => database[key].some(row => row.employeeId === record.id)) ||
      database.tasks.some(row =>
        row.assignedTo === record.id || row.assignedBy === record.id
      ) ||
      database.leaves.some(row => row.approvedBy === record.id);
  }

  if (linked) {
    throw new Error("This record has linked history. Change its status instead.");
  }

  database[collection] = database[collection].filter(row => row.id !== record.id);
}

function workflow(action, id, values) {
  const employeeId = employeeFor().id;

  if (action === "cancel-booking") {
    const booking = findRecord("bookings", id);

    if (currentUser.role !== "Administrator" &&
        !(currentUser.role === "Employee" && booking.employeeId === employeeId)) {
      throw new Error("You can cancel only your own bookings.");
    }

    if (booking.status !== "Confirmed" ||
        `${booking.bookingDate}T${booking.endTime}` <= localTime()) {
      throw new Error("This booking can no longer be cancelled.");
    }

    booking.status = "Cancelled";
  }

  if (["assign-asset", "transfer-asset", "return-asset"].includes(action)) {
    requireRole("Administrator");

    const asset = findRecord("assets", id);
    const active = database.assignments.find(row =>
      row.assetId === asset.id && row.status === "Active"
    );

    if (action === "assign-asset" && (active || asset.status !== "Available")) {
      throw new Error("This asset is not available.");
    }

    if (action !== "assign-asset" && !active) {
      throw new Error("This asset has no active assignment.");
    }

    if (action !== "return-asset") {
      const employee = findRecord("employees", values.employeeId);

      if (!employee || employee.status !== "Active") {
        throw new Error("Choose an active employee.");
      }

      if (active?.employeeId === employee.id) {
        throw new Error("Choose a different employee.");
      }
    }

    if (active) {
      active.returnDate = today();
      active.status = "Returned";
    }

    if (action === "return-asset") {
      asset.status = "Available";
    } else {
      insertRecord("assignments", {
        assetId: asset.id,
        employeeId: Number(values.employeeId),
        assignedDate: today(),
        returnDate: "",
        status: "Active"
      });

      asset.status = "Assigned";
    }
  }

  if (action === "review-leave") {
    requireRole("Manager");
    const leave = findRecord("leaves", id);

    if (leave.status !== "Pending" || leave.employeeId === employeeId) {
      throw new Error("This request cannot be reviewed.");
    }

    if (!["Approved", "Rejected"].includes(values.status)) {
      throw new Error("Select a valid decision.");
    }

    leave.status = values.status;
    leave.approvedBy = employeeId;
  }

  if (action === "task-status") {
    requireRole("Employee");
    const task = findRecord("tasks", id);

    if (task.assignedTo !== employeeId) {
      throw new Error("You can update only your own tasks.");
    }

    if (!["Pending", "In Progress", "Completed"].includes(values.status)) {
      throw new Error("Choose a valid status.");
    }

    task.status = values.status;
  }

  if (action === "complaint-status") {
    requireRole("Administrator");
    const complaint = findRecord("complaints", id);

    const next = {
      Submitted: "In Progress",
      "In Progress": "Resolved",
      Resolved: "Closed"
    }[complaint.status];

    if (!next || values.status !== next) {
      throw new Error("Choose the next valid workflow status.");
    }

    complaint.status = next;
  }

  if (action === "checkout") {
    requireRole("Administrator");
    const visit = findRecord("visits", id);

    if (visit.checkOutTime) throw new Error("This visitor already checked out.");

    if (!values.checkOutTime ||
        values.checkOutTime < visit.checkInTime ||
        values.checkOutTime > localTime()) {
      throw new Error("Checkout must be after arrival and cannot be in the future.");
    }

    visit.checkOutTime = values.checkOutTime;
  }
}

function openWorkflow(action, id) {
  let title = "Confirm action";
  let body = "<p>Confirm this operation?</p>";

  if (["assign-asset", "transfer-asset"].includes(action)) {
    title = action === "assign-asset" ? "Assign asset" : "Transfer asset";
    body = formField(
      ["employeeId", "Employee", "relation", "employees"]
    );
  }

  if (action === "return-asset") {
    title = "Return asset";
    body = "<p>Close the current assignment and make this asset available?</p>";
  }

  if (action === "cancel-booking") {
    title = "Cancel booking";
    body = "<p>Cancel this reservation and release the room?</p>";
  }

  if (action === "review-leave") {
    title = "Review leave request";
    body = formField(
      ["status", "Decision", "select", ["Approved", "Rejected"]]
    );
  }

  if (action === "task-status") {
    title = "Update task progress";
    body = formField(
      ["status", "Status", "select", ["Pending", "In Progress", "Completed"]],
      findRecord("tasks", id).status
    );
  }

  if (action === "complaint-status") {
    title = "Update complaint";

    const next = {
      Submitted: "In Progress",
      "In Progress": "Resolved",
      Resolved: "Closed"
    }[findRecord("complaints", id).status];

    body = formField(
      ["status", "Next status", "select", [next]],
      next
    );
  }

  if (action === "checkout") {
    title = "Check out visitor";
    body = formField(
      ["checkOutTime", "Check-out time", "datetime-local"],
      localTime()
    );
  }

  openModal(title, body, values => {
    changeDatabase(() => workflow(action, id, values));
    closeModal();
    render();
    notify("Update saved successfully.");
  }, "Confirm");
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;

  try {
    if (action === "demo") {
      const form = document.querySelector("#login-form");
      form.elements.username.value = id;
      form.elements.password.value = DEMO_PASSWORD;
      return;
    }

    if (action === "close") {
      closeModal();
      return;
    }

    if (action === "reset") {
      openModal(
        "Reset demo?",
        "<p>This removes local demo changes and restores sample records.</p>",
        () => {
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(SESSION_KEY);
          closeModal();
          render();
          notify("Demo reset.");
        },
        "Reset"
      );
      return;
    }

    if (action === "logout") {
      sessionStorage.removeItem(SESSION_KEY);
      currentUser = null;
      location.hash = "dashboard";
      render();
      return;
    }

    if (action === "menu") {
      const sidebar = document.querySelector("#sidebar");
      const open = sidebar.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
      return;
    }

    if (action === "create") {
      openRecordForm();
      return;
    }

    if (action === "edit") {
      openRecordForm(Number(id));
      return;
    }

    if (action === "delete") {
      const collection = currentPage;

      openModal(
        "Remove record?",
        "<p>Records with linked history cannot be removed.</p>",
        () => {
          changeDatabase(() => deleteRecord(collection, Number(id)));
          closeModal();
          render();
          notify("Record removed.");
        },
        "Remove"
      );
      return;
    }

    if (action === "previous" || action === "next") {
      pageNumber += action === "next" ? 1 : -1;
      render();
      return;
    }

    openWorkflow(action, Number(id));
  } catch (error) {
    notify(error.message);
  }
});

document.addEventListener("submit", event => {
  event.preventDefault();

  const form = event.target;
  const values = Object.fromEntries(new FormData(form));

  if (form.id === "login-form") {
    try {
      loadDatabase();

      const identifier = values.username.trim().toLowerCase();

      const user = database.users.find(account => {
        const employee = database.employees.find(
          record => record.userId === account.id
        );

        return account.username.toLowerCase() === identifier ||
          employee?.email.toLowerCase() === identifier;
      });

      const employee = user && database.employees.find(
        record => record.userId === user.id
      );

      if (!user || employee?.status !== "Active" ||
          values.password !== DEMO_PASSWORD) {
        throw new Error("Invalid sign-in details.");
      }

      sessionStorage.setItem(SESSION_KEY, String(user.id));
      location.hash = "dashboard";
      searchText = "";
      statusFilter = "";
      pageNumber = 1;
      render();
    } catch (error) {
      document.querySelector("#login-error").textContent = error.message;
    }
  }

  if (form.id === "record-form" && modalSubmit) {
    try {
      modalSubmit(values);
    } catch (error) {
      document.querySelector("#form-error").textContent = error.message;
    }
  }
});

document.addEventListener("input", event => {
  if (event.target.id !== "search") return;

  searchText = event.target.value;
  const position = event.target.selectionStart;

  pageNumber = 1;
  render();

  const input = document.querySelector("#search");
  input.focus();
  input.setSelectionRange(position, position);
});

document.addEventListener("change", event => {
  if (event.target.id === "status-filter") {
    statusFilter = event.target.value;
    pageNumber = 1;
    render();
  }
});

window.addEventListener("hashchange", () => {
  searchText = "";
  statusFilter = "";
  pageNumber = 1;

  if (modal.open) closeModal();
  render();
});

window.addEventListener("storage", event => {
  if (event.key === STORAGE_KEY) {
    if (modal.open) closeModal();
    render();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.open) {
    document.querySelector("#sidebar")?.classList.remove("open");
    document.querySelector('[data-action="menu"]')
      ?.setAttribute("aria-expanded", "false");
  }
});

render();
