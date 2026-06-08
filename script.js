const csvUpload = document.getElementById("csvUpload");
const selectedFile = document.getElementById("selectedFile");
const processingStatus = document.getElementById("processingStatus");

const totalReviews = document.getElementById("totalReviews");
const recommendedReviews = document.getElementById("recommendedReviews");
const notRecommendedReviews = document.getElementById("notRecommendedReviews");
const averageConfidence = document.getElementById("averageConfidence");

const insightTableBody = document.getElementById("insightTableBody");

const priorityTarget = document.getElementById("priorityTarget");
const majorProjects = document.getElementById("majorProjects");
const fillIns = document.getElementById("fillIns");
const notImportant = document.getElementById("notImportant");

let reviewData = [];

csvUpload.addEventListener("change", handleFileUpload);

async function handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    selectedFile.textContent = file.name;
    processingStatus.textContent = "Uploading and scoring dataset...";

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/api/analyze", {
            method: "POST",
            body: formData
        });

        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.detail || "Unable to analyze dataset.");
        }

        reviewData = payload;
        generateDashboard(payload);
        processingStatus.textContent = "Analysis completed";
    } catch (error) {
        processingStatus.textContent = `Analysis failed: ${error.message}`;
        clearDashboard();
    }
}

function generateDashboard(payload) {
    updateSummaryCards(payload.summary || {});
    renderInsightTable(payload.insights || []);
    renderPriorityMatrix(payload.matrix || {});
}

function clearDashboard() {
    totalReviews.textContent = "0";
    recommendedReviews.textContent = "0";
    notRecommendedReviews.textContent = "0";
    averageConfidence.textContent = "0.0%";

    insightTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="empty-state">
                No analysis results available.
            </td>
        </tr>
    `;

    priorityTarget.textContent = "No insights available.";
    majorProjects.textContent = "No insights available.";
    fillIns.textContent = "No insights available.";
    notImportant.textContent = "No insights available.";
}

function updateSummaryCards(summary) {
    totalReviews.textContent = formatNumber(summary.total_reviews);
    recommendedReviews.textContent = formatNumber(summary.recommended_reviews);
    notRecommendedReviews.textContent = formatNumber(summary.not_recommended_reviews);
    averageConfidence.textContent = formatPercentage(summary.average_confidence);
}

function formatNumber(value) {
    const number = Number(value || 0);
    return number.toLocaleString();
}

function formatPercentage(value) {
    const number = Number(value || 0);
    return `${number.toFixed(1)}%`;
}

function renderInsightTable(insights) {

    if (insights.length === 0) {

        insightTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    No insights generated.
                </td>
            </tr>
        `;

        return;
    }

    let html = "";

    insights.forEach(insight => {

        html += `
        <tr>
            <td>${capitalize(insight.category)}</td>
            <td>${insight.issue || `Customer feedback related to ${capitalize(insight.category)}`}</td>
            <td>${insight.frequency}</td>
            <td>${insight.sentiment}</td>
            <td>${insight.priority}</td>
        </tr>
        `;
    });

    insightTableBody.innerHTML = html;
}

function renderPriorityMatrix(matrix) {

    renderMatrixColumn(priorityTarget, matrix.priority_target || []);
    renderMatrixColumn(majorProjects, matrix.major_projects || []);
    renderMatrixColumn(fillIns, matrix.fill_ins || []);
    renderMatrixColumn(notImportant, matrix.not_important || []);
}

function renderMatrixColumn(container, items) {
    if (!items.length) {
        container.textContent = "No insights available.";
        return;
    }

    container.innerHTML = items
        .map(insight => `
            <div class="matrix-item">
                <strong>${capitalize(insight.category)}</strong>
                <br>
                Frequency: ${insight.frequency}
            </div>
        `)
        .join("");
}

function capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
}
