
async function loadComponents() {
    const elements = document.querySelectorAll("[data-include]");

    for (const el of elements) {
        const file = el.getAttribute("data-include");

        try {
            const res = await fetch(file);
            if (!res.ok) throw new Error(`Failed to load ${file}`);

            const html = await res.text();
            el.innerHTML = html;
        } catch (err) {
            showMessage(`Error loading ${file}: ${err.message}`);
        }
    }
}

document.addEventListener("DOMContentLoaded", loadComponents);
function showMessage(msg) {
    const msgContainer = document.getElementById("msg-container");

    // Create a new message element each time
    const el = document.createElement("div");
    el.className = "msg";
    el.textContent = msg;

    msgContainer.appendChild(el);

    // Animate in
    requestAnimationFrame(() => {
        el.style.visibility = "visible";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
    });

    // Auto-hide after 4 seconds
    setTimeout(() => {
        el.style.opacity = "0";
        el.style.transform = "translateY(-10px)";
        setTimeout(() => {
            el.remove();
            if (!msgContainer.hasChildNodes()) msgContainer.remove();
        }, 400);
    }, 3000);
}

function hideMessage() {
    const el = document.getElementById("message");
    if (!el) return;

    el.style.opacity = "0";
    el.style.top = "5px";

    // Wait for CSS transition to end, then hide
    setTimeout(() => {
        el.style.visibility = "hidden";
        el.textContent = "";
    }, 500);
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("service-worker.js")
            .then(reg => console.log("✅ Service Worker registered:", reg.scope))
            .catch(err => console.log("❌ Service Worker registration failed:", err));
    });
}