let chart;

// 🔹 ANALYZE TEXT
function analyzeText() {
  const text = document.getElementById("textInput").value;

  if (!text.trim()) {
    alert("Enter text first");
    return;
  }

  const formData = new FormData();
  formData.append("text", text);

  sendRequest(formData);
}

// 🔹 ANALYZE FILE
function analyzeFile() {
  const fileInput = document.getElementById("fileInput");

  if (!fileInput.files.length) {
    alert("Select a file first");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  sendRequest(formData);
}

// 🔹 COMMON REQUEST
async function sendRequest(formData) {
  document.getElementById("loader").style.display = "block";

  try {
    const res = await fetch("/analyze", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    document.getElementById("loader").style.display = "none";

    if (data.error) {
      alert(data.error);
      return;
    }

    // RESULT
    document.getElementById("result").innerHTML =
      `<p><strong>Total:</strong> ${data.count}</p>
       <div>${data.highlighted}</div>`;

    // TOP
    document.getElementById("top").innerHTML =
      data.top.length
        ? data.top.map(t => `<li>${t[0]} - ${t[1]}</li>`).join("")
        : "<li>No data</li>";

    // HISTORY
    document.getElementById("history").innerHTML =
      data.history.length
        ? data.history.map(h => `<li>${h}</li>`).join("")
        : "<li>No history</li>";

    renderChart(data.top);

  } catch {
    document.getElementById("loader").style.display = "none";
    alert("Error processing request");
  }
}

// 🔥 GRAPH
function renderChart(topData) {
  const canvas = document.getElementById("chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (!topData || topData.length === 0) {
    if (chart) chart.destroy();
    canvas.style.display = "none";
    return;
  }

  canvas.style.display = "block";

  if (chart) chart.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#00c6ff");
  gradient.addColorStop(1, "#0072ff");

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: topData.map(t => t[0]),
      datasets: [{
        label: "Frequency",
        data: topData.map(t => t[1]),
        backgroundColor: gradient,
        borderRadius: 12
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: { color: "#fff" }
        }
      },
      scales: {
        x: {
          ticks: { color: "#fff" }
        },
        y: {
          ticks: { color: "#fff" }
        }
      }
    }
  });
}

// 🔄 LOAD DATA
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/data");
    const data = await res.json();

    document.getElementById("top").innerHTML =
      data.top.map(t => `<li>${t[0]} - ${t[1]}</li>`).join("");

    document.getElementById("history").innerHTML =
      data.history.map(h => `<li>${h}</li>`).join("");

    renderChart(data.top);

  } catch {}
});

// CLEAR TEXT
function clearText() {
  document.getElementById("textInput").value = "";
}

// CLEAR FILE
function clearFile() {
  document.getElementById("fileInput").value = "";
}

// CLEAR DATABASE
async function clearHistory() {
  await fetch("/clear", { method: "POST" });
  location.reload();
}

// DOWNLOAD
function downloadReport() {
  const data = document.getElementById("result").innerText;

  fetch("/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data })
  })
  .then(res => res.blob())
  .then(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "report.txt";
    a.click();
  });
}
