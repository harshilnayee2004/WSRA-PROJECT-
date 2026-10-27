const API = {
    citizens: "/api/citizens",
    officer: "/api/officers",
    issues: "/api/issues",
    soap: "/ws"
};

let citizensCache = [];
let officerCache = [];
let issuesCache = [];

// --------------------------------------------------
// GENERAL HELPERS
// --------------------------------------------------

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return replacements[character];
    });
}

function showMessage(message, isError = false) {
    const box = document.getElementById("messageBox");

    box.textContent = message;
    box.classList.remove("hidden", "error");

    if (isError) {
        box.classList.add("error");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    clearTimeout(showMessage.timer);

    showMessage.timer = setTimeout(function () {
        box.classList.add("hidden");
    }, 6000);
}

async function apiRequest(url, options = {}) {
    const requestOptions = {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        }
    };

    let response;

    try {
        response = await fetch(url, requestOptions);
    } catch (error) {
        throw new Error(
            "Cannot connect to the backend. Check that CityFix is running on port 8082."
        );
    }

    const text = await response.text();

    let data = null;

    if (text.trim()) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!response.ok) {
        let message = "";

        if (typeof data === "string") {
            message = data;
        } else if (data && typeof data === "object") {
            message = data.message || data.error || JSON.stringify(data);
        }

        throw new Error(
            message || `Request failed with HTTP status ${response.status}.`
        );
    }

    return data;
}

function formatValue(value) {
    return value === null || value === undefined || value === ""
        ? "—"
        : escapeHtml(value);
}

function displayDate(value) {
    if (!value) {
        return "—";
    }

    return escapeHtml(String(value).replace("T", " "));
}

function statusBadge(status) {
    const value = String(status || "UNKNOWN");
    const normalized = value.toUpperCase();

    let badgeClass = "badge";

    if (normalized === "SUBMITTED") {
        badgeClass += " badge-submitted";
    } else if (normalized === "ASSIGNED") {
        badgeClass += " badge-assigned";
    } else if (normalized === "IN_PROGRESS") {
        badgeClass += " badge-in-progress";
    } else if (normalized === "RESOLVED") {
        badgeClass += " badge-resolved";
    } else if (normalized === "CLOSED") {
        badgeClass += " badge-closed";
    }

    return `<span class="${badgeClass}">${escapeHtml(value.replaceAll("_", " "))}</span>`;
}

function priorityBadge(priority) {
    const value = String(priority || "MEDIUM");
    const normalized = value.toUpperCase();

    let badgeClass = "badge";

    if (normalized === "LOW") {
        badgeClass += " badge-low";
    } else if (normalized === "MEDIUM") {
        badgeClass += " badge-medium";
    } else if (normalized === "HIGH") {
        badgeClass += " badge-high";
    } else if (normalized === "URGENT") {
        badgeClass += " badge-urgent";
    }

    return `<span class="${badgeClass}">${escapeHtml(value)}</span>`;
}

function showEmptyRow(tableBodyId, columnCount, message) {
    document.getElementById(tableBodyId).innerHTML =
        `<tr><td colspan="${columnCount}" class="empty-state">${escapeHtml(message)}</td></tr>`;
}

function errorRow(tableBodyId, columnCount, error) {
    showEmptyRow(tableBodyId, columnCount, error.message || "Unable to load records.");
}

function getArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    // Supports a Spring Page response, if an endpoint returns one.
    if (data && Array.isArray(data.content)) {
        return data.content;
    }

    return [];
}

function resetFormSafely(formId) {
    document.getElementById(formId).reset();
}

// --------------------------------------------------
// NAVIGATION
// --------------------------------------------------

document.querySelectorAll(".nav-button").forEach(function (button) {
    button.addEventListener("click", function () {
        openSection(button.dataset.section);
    });
});

document.querySelectorAll("[data-go]").forEach(function (button) {
    button.addEventListener("click", function () {
        openSection(button.dataset.go);
    });
});

function openSection(sectionId) {
    document.querySelectorAll(".page-section").forEach(function (section) {
        section.classList.remove("active-section");
    });

    document.querySelectorAll(".nav-button").forEach(function (button) {
        button.classList.toggle("active", button.dataset.section === sectionId);
    });

    const section = document.getElementById(sectionId);

    if (section) {
        section.classList.add("active-section");
    }

    if (sectionId === "dashboard") {
        loadDashboard();
    } else if (sectionId === "citizens") {
        loadCitizens();
    } else if (sectionId === "officer") {
        loadOfficer();
    } else if (sectionId === "issues") {
        loadIssues();
    }
}

// --------------------------------------------------
// CITIZENS: GET ALL
// --------------------------------------------------

async function loadCitizens() {
    const body = document.getElementById("citizensBody");

    body.innerHTML =
        '<tr><td colspan="6" class="empty-state">Loading citizens...</td></tr>';

    try {
        const data = await apiRequest(API.citizens);

        citizensCache = getArray(data);

        renderCitizens(citizensCache);

        document.getElementById("citizenCount").textContent =
            citizensCache.length;
    } catch (error) {
        errorRow("citizensBody", 6, error);
        showMessage("Unable to load citizens: " + error.message, true);
    }
}

function renderCitizens(citizens) {
    const body = document.getElementById("citizensBody");

    if (!citizens.length) {
        showEmptyRow("citizensBody", 6, "No citizens found.");
        return;
    }

    body.innerHTML = citizens.map(function (citizen) {
        return `
            <tr>
                <td>${formatValue(citizen.id)}</td>
                <td>${formatValue(citizen.name)}</td>
                <td>${formatValue(citizen.email)}</td>
                <td>${formatValue(citizen.ward)}</td>
                <td>${formatValue(citizen.phone)}</td>
                <td>
                    <div class="action-cell">
                        <button class="small-button" data-action="edit-citizen"
                            data-id="${escapeHtml(citizen.id)}">Edit</button>
                        <button class="small-button" data-action="find-citizen"
                            data-id="${escapeHtml(citizen.id)}">View</button>
                        <button class="danger-button" data-action="delete-citizen"
                            data-id="${escapeHtml(citizen.id)}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// --------------------------------------------------
// CITIZENS: POST AND PUT
// --------------------------------------------------

document.getElementById("citizenForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("citizenId").value;

    const citizen = {
        name: document.getElementById("citizenName").value.trim(),
        email: document.getElementById("citizenEmail").value.trim(),
        ward: document.getElementById("citizenWard").value.trim(),
        phone: document.getElementById("citizenPhone").value.trim()
    };

    try {
        if (id) {
            await apiRequest(`${API.citizens}/${encodeURIComponent(id)}`, {
                method: "PUT",
                body: JSON.stringify(citizen)
            });

            showMessage("Citizen updated successfully.");
        } else {
            await apiRequest(API.citizens, {
                method: "POST",
                body: JSON.stringify(citizen)
            });

            showMessage("Citizen added successfully.");
        }

        resetCitizenForm();
        await loadCitizens();
    } catch (error) {
        showMessage("Citizen operation failed: " + error.message, true);
    }
});

function startCitizenEdit(id) {
    const citizen = citizensCache.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!citizen) {
        showMessage("Citizen not found in the current list. Refresh the list.", true);
        return;
    }

    document.getElementById("citizenId").value = citizen.id;
    document.getElementById("citizenName").value = citizen.name || "";
    document.getElementById("citizenEmail").value = citizen.email || "";
    document.getElementById("citizenWard").value = citizen.ward || "";
    document.getElementById("citizenPhone").value = citizen.phone || "";

    document.getElementById("citizenFormTitle").textContent = "Update Citizen";
    document.getElementById("citizenSubmitButton").textContent = "Save Changes";
    document.getElementById("cancelCitizenEdit").hidden = false;

    openSection("citizens");
    document.getElementById("citizenFormTitle").scrollIntoView({ behavior: "smooth" });
}

function resetCitizenForm() {
    resetFormSafely("citizenForm");

    document.getElementById("citizenId").value = "";
    document.getElementById("citizenFormTitle").textContent = "Add Citizen";
    document.getElementById("citizenSubmitButton").textContent = "Add Citizen";
    document.getElementById("cancelCitizenEdit").hidden = true;
}

document.getElementById("cancelCitizenEdit").addEventListener("click", resetCitizenForm);

document.getElementById("citizenForm").addEventListener("reset", function () {
    setTimeout(function () {
        document.getElementById("citizenId").value = "";
        document.getElementById("citizenFormTitle").textContent = "Add Citizen";
        document.getElementById("citizenSubmitButton").textContent = "Add Citizen";
        document.getElementById("cancelCitizenEdit").hidden = true;
    }, 0);
});

// --------------------------------------------------
// CITIZENS: GET BY ID AND DELETE
// --------------------------------------------------

async function findCitizen(id) {
    try {
        const citizen = await apiRequest(
            `${API.citizens}/${encodeURIComponent(id)}`
        );

        citizensCache = [
            citizen,
            ...citizensCache.filter(item => String(item.id) !== String(citizen.id))
        ];

        renderCitizens([citizen]);
        showMessage("Citizen record retrieved successfully.");
    } catch (error) {
        showMessage("Could not retrieve citizen: " + error.message, true);
    }
}

async function deleteCitizen(id) {
    const confirmed = confirm(`Are you sure you want to delete citizen ${id}?`);

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`${API.citizens}/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        showMessage("Citizen deleted successfully.");
        await loadCitizens();
    } catch (error) {
        showMessage("Could not delete citizen: " + error.message, true);
    }
}

document.getElementById("citizenSearchForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("citizenSearchId").value.trim();

    if (!id) {
        showMessage("Enter a citizen ID.", true);
        return;
    }

    await findCitizen(id);
});

document.getElementById("showAllCitizens").addEventListener("click", loadCitizens);
document.getElementById("refreshCitizens").addEventListener("click", loadCitizens);

document.getElementById("citizensBody").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit-citizen") {
        startCitizenEdit(id);
    } else if (action === "find-citizen") {
        findCitizen(id);
    } else if (action === "delete-citizen") {
        deleteCitizen(id);
    }
});

// --------------------------------------------------
// FIELD OFFICERS: GET ALL
// --------------------------------------------------

async function loadOfficer() {
    const body = document.getElementById("officerBody");

    body.innerHTML =
        '<tr><td colspan="6" class="empty-state">Loading officer...</td></tr>';

    try {
        const data = await apiRequest(API.officer);

        officerCache = getArray(data);

        renderOfficer(officerCache);

        document.getElementById("officerCount").textContent =
            officerCache.length;
    } catch (error) {
        errorRow("officerBody", 6, error);
        showMessage("Unable to load officer: " + error.message, true);
    }
}

function renderOfficer(officerList) {
    const body = document.getElementById("officerBody");

    if (!officerList.length) {
        showEmptyRow("officerBody", 6, "No field officer found.");
        return;
    }

    body.innerHTML = officerList.map(function (officer) {
        return `
            <tr>
                <td>${formatValue(officer.id)}</td>
                <td>${formatValue(officer.name)}</td>
                <td>${formatValue(officer.email)}</td>
                <td>${formatValue(officer.department)}</td>
                <td>${formatValue(officer.phone)}</td>
                <td>
                    <div class="action-cell">
                        <button class="small-button" data-action="edit-officer"
                            data-id="${escapeHtml(officer.id)}">Edit</button>
                        <button class="small-button" data-action="find-officer"
                            data-id="${escapeHtml(officer.id)}">View</button>
                        <button class="danger-button" data-action="delete-officer"
                            data-id="${escapeHtml(officer.id)}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// --------------------------------------------------
// FIELD OFFICERS: POST AND PUT
// --------------------------------------------------

document.getElementById("officerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("officerId").value;

    const officer = {
        name: document.getElementById("officerName").value.trim(),
        email: document.getElementById("officerEmail").value.trim(),
        department: document.getElementById("officerDepartment").value.trim(),
        phone: document.getElementById("officerPhone").value.trim()
    };

    try {
        if (id) {
            await apiRequest(`${API.officer}/${encodeURIComponent(id)}`, {
                method: "PUT",
                body: JSON.stringify(officer)
            });

            showMessage("Field officer updated successfully.");
        } else {
            await apiRequest(API.officer, {
                method: "POST",
                body: JSON.stringify(officer)
            });

            showMessage("Field officer added successfully.");
        }

        resetOfficerForm();
        await loadOfficer();
    } catch (error) {
        showMessage("Officer operation failed: " + error.message, true);
    }
});

function startOfficerEdit(id) {
    const officer = officerCache.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!officer) {
        showMessage("Officer not found in the current list. Refresh the list.", true);
        return;
    }

    document.getElementById("officerId").value = officer.id;
    document.getElementById("officerName").value = officer.name || "";
    document.getElementById("officerEmail").value = officer.email || "";
    document.getElementById("officerDepartment").value = officer.department || "";
    document.getElementById("officerPhone").value = officer.phone || "";

    document.getElementById("officerFormTitle").textContent = "Update Field Officer";
    document.getElementById("officerSubmitButton").textContent = "Save Changes";
    document.getElementById("cancelOfficerEdit").hidden = false;

    openSection("officer");
    document.getElementById("officerFormTitle").scrollIntoView({ behavior: "smooth" });
}

function resetOfficerForm() {
    resetFormSafely("officerForm");

    document.getElementById("officerId").value = "";
    document.getElementById("officerFormTitle").textContent = "Add Field Officer";
    document.getElementById("officerSubmitButton").textContent = "Add Officer";
    document.getElementById("cancelOfficerEdit").hidden = true;
}

document.getElementById("cancelOfficerEdit").addEventListener("click", resetOfficerForm);

document.getElementById("officerForm").addEventListener("reset", function () {
    setTimeout(function () {
        document.getElementById("officerId").value = "";
        document.getElementById("officerFormTitle").textContent = "Add Field Officer";
        document.getElementById("officerSubmitButton").textContent = "Add Officer";
        document.getElementById("cancelOfficerEdit").hidden = true;
    }, 0);
});

// --------------------------------------------------
// FIELD OFFICERS: GET BY ID AND DELETE
// --------------------------------------------------

async function findOfficer(id) {
    try {
        const officer = await apiRequest(
            `${API.officer}/${encodeURIComponent(id)}`
        );

        officerCache = [
            officer,
            ...officerCache.filter(item => String(item.id) !== String(officer.id))
        ];

        renderOfficer([officer]);
        showMessage("Officer record retrieved successfully.");
    } catch (error) {
        showMessage("Could not retrieve officer: " + error.message, true);
    }
}

async function deleteOfficer(id) {
    const confirmed = confirm(`Are you sure you want to delete officer ${id}?`);

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`${API.officer}/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        showMessage("Officer deleted successfully.");
        await loadOfficer();
    } catch (error) {
        showMessage("Could not delete officer: " + error.message, true);
    }
}

document.getElementById("officerSearchForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("officerSearchId").value.trim();

    if (!id) {
        showMessage("Enter an officer ID.", true);
        return;
    }

    await findOfficer(id);
});

document.getElementById("showAllOfficer").addEventListener("click", loadOfficer);
document.getElementById("refreshOfficer").addEventListener("click", loadOfficer);

document.getElementById("officerBody").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit-officer") {
        startOfficerEdit(id);
    } else if (action === "find-officer") {
        findOfficer(id);
    } else if (action === "delete-officer") {
        deleteOfficer(id);
    }
});

// --------------------------------------------------
// ISSUES: GET ALL, STATUS, AND CATEGORY FILTERS
// --------------------------------------------------

async function loadIssues() {
    const body = document.getElementById("issuesBody");

    body.innerHTML =
        '<tr><td colspan="9" class="empty-state">Loading issues...</td></tr>';

    try {
        const data = await apiRequest(API.issues);

        issuesCache = getArray(data);

        renderIssues(issuesCache);
        updateIssueDashboard(issuesCache);
    } catch (error) {
        errorRow("issuesBody", 9, error);
        showMessage("Unable to load issues: " + error.message, true);
    }
}

function renderIssues(issues) {
    const body = document.getElementById("issuesBody");

    if (!issues.length) {
        showEmptyRow("issuesBody", 9, "No issues found.");
        return;
    }

    body.innerHTML = issues.map(function (issue) {
        return `
            <tr>
                <td>${formatValue(issue.id)}</td>
                <td>${formatValue(issue.title)}</td>
                <td>${formatValue(issue.citizenId)}</td>
                <td>${formatValue(issue.category)}</td>
                <td>${formatValue(issue.location)}</td>
                <td>${priorityBadge(issue.priority)}</td>
                <td>${statusBadge(issue.status)}</td>
                <td>${formatValue(issue.assignedOfficerId)}</td>
                <td>
                    <div class="action-cell">
                        <button class="small-button" data-action="edit-issue"
                            data-id="${escapeHtml(issue.id)}">Edit</button>
                        <button class="small-button" data-action="find-issue"
                            data-id="${escapeHtml(issue.id)}">View</button>
                        <button class="small-button" data-action="issue-history"
                            data-id="${escapeHtml(issue.id)}">History</button>
                        <button class="danger-button" data-action="delete-issue"
                            data-id="${escapeHtml(issue.id)}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function updateIssueDashboard(issues) {
    document.getElementById("issueCount").textContent = issues.length;

    const resolved = issues.filter(function (issue) {
        return String(issue.status || "").toUpperCase() === "RESOLVED";
    }).length;

    document.getElementById("resolvedCount").textContent = resolved;

    const recent = [...issues].sort(function (a, b) {
        return Number(b.id || 0) - Number(a.id || 0);
    }).slice(0, 5);

    const body = document.getElementById("recentIssuesBody");

    if (!recent.length) {
        showEmptyRow("recentIssuesBody", 5, "No issues found.");
        return;
    }

    body.innerHTML = recent.map(function (issue) {
        return `
            <tr>
                <td>${formatValue(issue.id)}</td>
                <td>${formatValue(issue.title)}</td>
                <td>${formatValue(issue.category)}</td>
                <td>${priorityBadge(issue.priority)}</td>
                <td>${statusBadge(issue.status)}</td>
            </tr>
        `;
    }).join("");
}

// --------------------------------------------------
// ISSUES: POST AND PUT
// --------------------------------------------------

document.getElementById("issueForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("issueId").value;

    const issue = {
        citizenId: Number(document.getElementById("issueCitizenId").value),
        title: document.getElementById("issueTitle").value.trim(),
        description: document.getElementById("issueDescription").value.trim(),
        category: document.getElementById("issueCategory").value,
        location: document.getElementById("issueLocation").value.trim(),
        priority: document.getElementById("issuePriority").value
    };

    try {
        if (id) {
            // Preserve fields that the edit form does not directly modify.
            const oldIssue = issuesCache.find(function (item) {
                return String(item.id) === String(id);
            });

            if (oldIssue) {
                issue.status = oldIssue.status;
                issue.assignedOfficerId = oldIssue.assignedOfficerId;
                issue.createdAt = oldIssue.createdAt;
            }

            await apiRequest(`${API.issues}/${encodeURIComponent(id)}`, {
                method: "PUT",
                body: JSON.stringify(issue)
            });

            showMessage("Issue updated successfully.");
        } else {
            await apiRequest(API.issues, {
                method: "POST",
                body: JSON.stringify(issue)
            });

            showMessage("Issue submitted successfully.");
        }

        resetIssueForm();
        await loadIssues();
    } catch (error) {
        showMessage("Issue operation failed: " + error.message, true);
    }
});

function startIssueEdit(id) {
    const issue = issuesCache.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!issue) {
        showMessage("Issue not found in the current list. Refresh the list.", true);
        return;
    }

    document.getElementById("issueId").value = issue.id;
    document.getElementById("issueCitizenId").value = issue.citizenId || "";
    document.getElementById("issueTitle").value = issue.title || "";
    document.getElementById("issueDescription").value = issue.description || "";
    document.getElementById("issueCategory").value = issue.category || "";
    document.getElementById("issueLocation").value = issue.location || "";
    document.getElementById("issuePriority").value = issue.priority || "MEDIUM";

    document.getElementById("issueFormTitle").textContent = "Update Issue";
    document.getElementById("issueSubmitButton").textContent = "Save Changes";
    document.getElementById("cancelIssueEdit").hidden = false;

    openSection("issues");
    document.getElementById("issueFormTitle").scrollIntoView({ behavior: "smooth" });
}

function resetIssueForm() {
    resetFormSafely("issueForm");

    document.getElementById("issueId").value = "";
    document.getElementById("issueFormTitle").textContent = "Submit Issue";
    document.getElementById("issueSubmitButton").textContent = "Submit Issue";
    document.getElementById("cancelIssueEdit").hidden = true;
}

document.getElementById("cancelIssueEdit").addEventListener("click", resetIssueForm);

document.getElementById("issueForm").addEventListener("reset", function () {
    setTimeout(function () {
        document.getElementById("issueId").value = "";
        document.getElementById("issueFormTitle").textContent = "Submit Issue";
        document.getElementById("issueSubmitButton").textContent = "Submit Issue";
        document.getElementById("cancelIssueEdit").hidden = true;
    }, 0);
});

// --------------------------------------------------
// ISSUES: GET BY ID AND DELETE
// --------------------------------------------------

async function findIssue(id) {
    try {
        const issue = await apiRequest(
            `${API.issues}/${encodeURIComponent(id)}`
        );

        issuesCache = [
            issue,
            ...issuesCache.filter(item => String(item.id) !== String(issue.id))
        ];

        renderIssues([issue]);
        document.getElementById("actionIssueId").value = issue.id;

        showMessage("Issue record retrieved successfully.");
    } catch (error) {
        showMessage("Could not retrieve issue: " + error.message, true);
    }
}

async function deleteIssue(id) {
    const confirmed = confirm(`Are you sure you want to delete issue ${id}?`);

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`${API.issues}/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        showMessage("Issue deleted successfully.");
        await loadIssues();
    } catch (error) {
        showMessage("Could not delete issue: " + error.message, true);
    }
}

document.getElementById("issueSearchForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("issueSearchId").value.trim();

    if (!id) {
        showMessage("Enter an issue ID.", true);
        return;
    }

    await findIssue(id);
});

document.getElementById("showAllIssues").addEventListener("click", loadIssues);
document.getElementById("refreshIssues").addEventListener("click", loadIssues);

document.getElementById("issuesBody").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit-issue") {
        startIssueEdit(id);
    } else if (action === "find-issue") {
        findIssue(id);
    } else if (action === "delete-issue") {
        deleteIssue(id);
    } else if (action === "issue-history") {
        document.getElementById("historyIssueId").value = id;
        openSection("history");
        loadIssueHistory(id);
    }
});

// --------------------------------------------------
// ISSUES: FILTER BY STATUS OR CATEGORY
// --------------------------------------------------

document.getElementById("applyIssueFilters").addEventListener("click", async function () {
    const status = document.getElementById("statusFilter").value;
    const category = document.getElementById("categoryFilter").value;

    try {
        let endpoint = API.issues;

        if (status) {
            endpoint = `${API.issues}/status/${encodeURIComponent(status)}`;
        } else if (category) {
            endpoint = `${API.issues}/category/${encodeURIComponent(category)}`;
        }

        let data = await apiRequest(endpoint);
        let result = getArray(data);

        // If both filters are selected, combine the results client-side.
        if (status && category) {
            result = result.filter(function (issue) {
                return String(issue.category || "").toUpperCase() === category.toUpperCase();
            });
        }

        renderIssues(result);
        showMessage(`Filter applied. ${result.length} issue(s) found.`);
    } catch (error) {
        showMessage("Unable to filter issues: " + error.message, true);
    }
});

// --------------------------------------------------
// ISSUES: ASSIGN OFFICER
// --------------------------------------------------

document.getElementById("assignOfficerButton").addEventListener("click", async function () {
    const issueId = document.getElementById("actionIssueId").value.trim();
    const officerId = document.getElementById("assignOfficerId").value.trim();

    if (!issueId || !officerId) {
        showMessage("Enter both an issue ID and an officer ID.", true);
        return;
    }

    try {
        await apiRequest(
            `${API.issues}/${encodeURIComponent(issueId)}/assign/${encodeURIComponent(officerId)}`,
            { method: "PUT" }
        );

        showMessage("Officer assigned to issue successfully.");
        await loadIssues();
    } catch (error) {
        showMessage("Could not assign officer: " + error.message, true);
    }
});

// --------------------------------------------------
// ISSUES: UPDATE STATUS
// --------------------------------------------------

document.getElementById("updateIssueStatusButton").addEventListener("click", async function () {
    const issueId = document.getElementById("actionIssueId").value.trim();
    const status = document.getElementById("newIssueStatus").value;
    const remarks = document.getElementById("statusRemarks").value.trim();

    if (!issueId) {
        showMessage("Enter an issue ID before updating its status.", true);
        return;
    }

    const query = new URLSearchParams({
        status: status,
        remarks: remarks
    });

    try {
        await apiRequest(
            `${API.issues}/${encodeURIComponent(issueId)}/status?${query.toString()}`,
            { method: "PATCH" }
        );

        showMessage("Issue status updated successfully.");
        document.getElementById("statusRemarks").value = "";

        await loadIssues();
    } catch (error) {
        showMessage("Could not update issue status: " + error.message, true);
    }
});

// --------------------------------------------------
// ISSUE HISTORY
// --------------------------------------------------

document.getElementById("historyForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("historyIssueId").value.trim();

    if (!id) {
        showMessage("Enter an issue ID.", true);
        return;
    }

    await loadIssueHistory(id);
});

async function loadIssueHistory(id) {
    const body = document.getElementById("historyBody");

    body.innerHTML =
        '<tr><td colspan="6" class="empty-state">Loading history...</td></tr>';

    try {
        const data = await apiRequest(
            `${API.issues}/${encodeURIComponent(id)}/history`
        );

        const history = getArray(data);

        if (!history.length) {
            showEmptyRow("historyBody", 6, "No history records found for this issue.");
            return;
        }

        body.innerHTML = history.map(function (item) {
            return `
                <tr>
                    <td>${formatValue(item.id)}</td>
                    <td>${formatValue(item.issueId)}</td>
                    <td>${formatValue(item.oldStatus)}</td>
                    <td>${formatValue(item.newStatus)}</td>
                    <td>${formatValue(item.remarks)}</td>
                    <td>${displayDate(item.changedAt)}</td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        errorRow("historyBody", 6, error);
        showMessage("Could not load issue history: " + error.message, true);
    }
}

// --------------------------------------------------
// SOAP ISSUE STATISTICS
// --------------------------------------------------

document.getElementById("loadSoapStats").addEventListener("click", loadSoapStatistics);

async function loadSoapStatistics() {
    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:com="http://cityfix.com/soap/issues">
    <soapenv:Header/>
    <soapenv:Body>
        <com:GetIssueStatisticsRequest/>
    </soapenv:Body>
</soapenv:Envelope>`;

    document.getElementById("soapResponse").textContent = "Calling SOAP service...";

    try {
        const response = await fetch(API.soap, {
            method: "POST",
            headers: {
                "Content-Type": "text/xml; charset=UTF-8"
            },
            body: soapRequest
        });

        const responseText = await response.text();

        document.getElementById("soapResponse").textContent = responseText;

        if (!response.ok) {
            throw new Error(`SOAP request failed with HTTP status ${response.status}.`);
        }

        const parser = new DOMParser();
        const xml = parser.parseFromString(responseText, "text/xml");

        if (xml.querySelector("parsererror")) {
            throw new Error("The SOAP service returned invalid XML.");
        }

        function findXmlValue(localName) {
            const nodes = Array.from(xml.getElementsByTagName("*"));

            const node = nodes.find(function (element) {
                return element.localName === localName;
            });

            return node ? node.textContent.trim() : "—";
        }

        document.getElementById("soapTotal").textContent =
            findXmlValue("totalIssues");

        document.getElementById("soapSubmitted").textContent =
            findXmlValue("submittedIssues");

        document.getElementById("soapAssigned").textContent =
            findXmlValue("assignedIssues");

        document.getElementById("soapInProgress").textContent =
            findXmlValue("inProgressIssues");

        document.getElementById("soapResolved").textContent =
            findXmlValue("resolvedIssues");

        document.getElementById("soapClosed").textContent =
            findXmlValue("closedIssues");

        showMessage("SOAP issue statistics loaded successfully.");
    } catch (error) {
        document.getElementById("soapResponse").textContent +=
            "\n\nError: " + error.message;

        showMessage(
            "Could not load SOAP statistics. Check the SOAP endpoint and configuration. " +
            error.message,
            true
        );
    }
}

// --------------------------------------------------
// DASHBOARD
// --------------------------------------------------

async function loadDashboard() {
    try {
        const results = await Promise.all([
            apiRequest(API.citizens),
            apiRequest(API.officer),
            apiRequest(API.issues)
        ]);

        citizensCache = getArray(results[0]);
        officerCache = getArray(results[1]);
        issuesCache = getArray(results[2]);

        document.getElementById("citizenCount").textContent =
            citizensCache.length;

        document.getElementById("officerCount").textContent =
            officerCache.length;

        updateIssueDashboard(issuesCache);
    } catch (error) {
        showMessage("Could not refresh dashboard: " + error.message, true);
    }
}

document.getElementById("refreshDashboard").addEventListener("click", loadDashboard);

// --------------------------------------------------
// INITIAL LOAD
// --------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    loadDashboard();
});