// ---------- CONFIG ----------
const inputsConfig = {
    mqtt: [
        { id: "broker", placeholder: "MQTT Broker" },
        { id: "port", placeholder: "Port" },
        { id: "topic", placeholder: "Topic" }
    ],
    thingspeak: [{ id: "channelId", placeholder: "Channel ID" }],
    adafruit: [
        { id: "username", placeholder: "Username" },
        { id: "key", placeholder: "AIO Key" },
        { id: "feed", placeholder: "Feed Name" }
    ],
    blynk: [
        { id: "auth", placeholder: "Auth Token" },
        { id: "pin", placeholder: "Virtual Pin (V0, V1...)" }
    ],
    grafana: [
        { id: "url", placeholder: "Grafana API URL" },
        { id: "token", placeholder: "API Token" },
        { id: "query", placeholder: "Query/Metric Name" }
    ]
};

const colors = ["#ffbb00", "#00fcf8", "#00fc47", "#9b59b6", "#f2994a", "#17a2a8", "#e67e22", "#34495e"];
let charts = [];

// ---------- UI ----------
document.getElementById("sourceSelect").addEventListener("change", renderInputs);
const loadBtn = document.getElementById("loadBtn");
loadBtn.addEventListener("click", loadData);

function renderInputs() {
    const source = document.getElementById("sourceSelect").value;
    const container = document.getElementById("dynamicInputs");
    container.innerHTML = "";

    if (!inputsConfig[source]) {
        loadBtn.style.display = "none";
        return;
    }

    inputsConfig[source].forEach(inp => {
        container.insertAdjacentHTML(
            "beforeend",
            `<input type="text" id="${inp.id}" placeholder="${inp.placeholder}">`
        );
    });

    loadBtn.style.display = "inline-block";
}

renderInputs();

// ---------- HELPERS ----------
function resetUI() {
    ["chName", "chDesc", "chCreated", "chUpdated", "chFields"].forEach(id => {
        document.getElementById(id).textContent = "";
    });
    document.getElementById("details").style.display = "none";
    document.getElementById("chartsContainer").innerHTML = "";
    document.getElementById("tableContainer").innerHTML = "";
    document.getElementById("logSection").style.display = "none";
    hideMessage();
}

function showMessage(msg) {
    const el = document.getElementById("message");
    el.textContent = msg;
    el.style.visibility = "visible";
    el.style.opacity = "1";
    el.style.top = "60px";
    setTimeout(() => hideMessage(), 2000);
}
function hideMessage() {
    const el = document.getElementById("message");
    el.style.visibility = "hidden";
    el.style.opacity = "0";
    el.style.top = "5px";
    el.textContent = "";
}
function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

// ---------- DATA LOADER ----------
async function loadData() {
    const btn = loadBtn;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<img src="loading.gif" style="height:15px;vertical-align:middle;" class="loading"> Fetching...`;

    resetUI();
    const source = document.getElementById("sourceSelect").value;

    // Validate required fields
    for (const f of inputsConfig[source] || []) {
        const val = document.getElementById(f.id)?.value.trim();
        if (!val) {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            return showMessage(`Please enter a valid ${f.placeholder}.`);
        }
    }

    try {
        const data =
            source === "thingspeak"
                ? await fetchThingSpeak(document.getElementById("channelId").value)
                : source === "adafruit"
                ? await fetchAdafruit(
                      document.getElementById("username").value,
                      document.getElementById("key").value,
                      document.getElementById("feed").value
                  )
                : source === "blynk"
                ? await fetchBlynk(
                      document.getElementById("auth").value,
                      document.getElementById("pin").value
                  )
                : source === "grafana"
                ? await fetchGrafana(
                      document.getElementById("url").value,
                      document.getElementById("token").value,
                      document.getElementById("query").value
                  )
                : null;

        if (data) renderData(data);
    } catch (err) {
        showMessage("Error: " + err.message);
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

// ---------- FETCHERS ----------
async function fetchThingSpeak(channelId) {
    const res = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds.json?results=50`);
    if (!res.ok) throw new Error("ThingSpeak fetch failed");
    const json = await res.json();

    const fields = [];
    for (let i = 1; i <= 8; i++) {
        const label = json.channel[`field${i}`];
        if (label) fields.push({ key: `field${i}`, label });
    }

    return {
        name: json.channel.name ?? "—",
        desc: json.channel.description ?? "—",
        created: json.channel.created_at ?? "—",
        updated: json.channel.updated_at ?? "—",
        labels: json.feeds.map(f => new Date(f.created_at).toLocaleString()),
        fields,
        feeds: json.feeds
    };
}

async function fetchAdafruit(user, key, feed) {
    const res = await fetch(`https://io.adafruit.com/api/v2/${user}/feeds/${feed}/data?limit=50`, {
        headers: { "X-AIO-Key": key }
    });
    if (!res.ok) throw new Error("Adafruit fetch failed");
    const json = await res.json();
    return {
        name: feed,
        desc: "",
        created: "—",
        updated: "—",
        labels: json.map(f => new Date(f.created_at).toLocaleString()),
        fields: [{ key: "value", label: feed }],
        feeds: json.map(f => ({ value: f.value }))
    };
}

async function fetchBlynk(auth, pin) {
    const res = await fetch(`https://blynk.cloud/external/api/get?token=${auth}&${pin}`);
    if (!res.ok) throw new Error("Blynk fetch failed");
    const val = await res.text();
    return {
        name: `Pin ${pin}`,
        desc: "",
        created: "—",
        updated: new Date().toLocaleString(),
        labels: [new Date().toLocaleString()],
        fields: [{ key: "value", label: `Pin ${pin}` }],
        feeds: [{ value: val }]
    };
}

async function fetchGrafana(url, token, query) {
    const res = await fetch(`${url}/api/ds/query`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ queries: [{ expr: query, interval: "30s" }] })
    });
    if (!res.ok) throw new Error("Grafana fetch failed");
    const json = await res.json();
    const series = json.results?.A?.frames?.[0]?.data ?? {};
    return {
        name: query,
        desc: "",
        created: "—",
        updated: new Date().toLocaleString(),
        labels: series?.time?.map(t => new Date(t).toLocaleString()) ?? [],
        fields: [{ key: "value", label: query }],
        feeds: (series?.values ?? []).map(v => ({ value: v }))
    };
}

// ---------- RENDER ----------
function renderData(data) {
    const getSlicerValue = () =>
        document.querySelector('input[name="slicer"]:checked')?.value || "50";

    const applySlicer = () => {
        let count = getSlicerValue();
        let feeds = data.feeds;
        let labels = data.labels;

        if (count !== "all") {
            const n = parseInt(count);
            feeds = feeds.slice(-n);
            labels = labels.slice(-n);
        }

        renderChartsAndTable({ ...data, feeds, labels });
    };

    // Bind slicer events (only once)
    document.querySelectorAll('input[name="slicer"]').forEach(radio => {
        radio.onchange = applySlicer;
    });

    // Initial render
    applySlicer();
}

function renderChartsAndTable(data) {
    // Details
    document.getElementById("details").style.display = "block";
    document.getElementById("chName").textContent = data.name;
    document.getElementById("chDesc").textContent = data.desc;
    document.getElementById("chCreated").textContent = data.created;
    document.getElementById("chUpdated").textContent = data.updated;
    document.getElementById("chFields").textContent = data.fields.map(f => f.label).join(", ");

    // Reset old charts
    const chartsContainer = document.getElementById("chartsContainer");
    chartsContainer.innerHTML = "";
    charts.forEach(c => c.destroy());
    charts = [];

    // Charts
    data.fields.forEach((field, idx) => {
        const values = data.feeds.map(f => {
            const v = f[field.key];
            const n = Number(v);
            return isFinite(n) ? n : null;
        });
        if (!values.some(v => v !== null)) return;

        const block = document.createElement("div");
        block.className = "chart-block";
        block.innerHTML = `<h3>${field.label}</h3><canvas></canvas>`;
        chartsContainer.appendChild(block);

        const ctx = block.querySelector("canvas").getContext("2d");
        const color = colors[idx % colors.length];
        const chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [{
                    label: field.label,
                    data: values,
                    borderColor: color,
                    borderWidth: 0.7,
                    fill: true,
                    tension: 0.2,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    backgroundColor: ctx => {
                        const { chartArea } = ctx.chart;
                        if (!chartArea) return null;
                        const gradient = ctx.chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, color + "99");
                        gradient.addColorStop(1, color + "00");
                        return gradient;
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: "top" } },
                scales: {
                    x: { title: { display: true, text: "Timestamp" }, grid: { color: "#121212" } },
                    y: { title: { display: true, text: field.label }, grid: { color: "#121212" } }
                }
            }
        });
        charts.push(chart);
    });

    // Table
    document.getElementById("logSection").style.display = "block";
    let thead = `<tr><th>Time</th>${data.fields.map(f => `<th>${f.label}</th>`).join("")}</tr>`;
    let rows = data.feeds
        .map((f, i) => {
            const cols = data.fields.map(field => {
                const v = f[field.key];
                return `<td>${v ? escapeHtml(String(v)) : "-"}</td>`;
            });
            return `<tr><td>${data.labels[i] ?? "-"}</td>${cols.join("")}</tr>`;
        })
        .join("");
    document.getElementById("tableContainer").innerHTML =
        `<table><thead>${thead}</thead><tbody>${rows}</tbody></table>`;
}
