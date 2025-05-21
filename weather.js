const apiKey = 'e100139bb89c999bfa40f24c0c0f6ecb';
let chartInstance = null;
let allLabels = [];
let allTemps = [];

const stateCapitals = {
  "Johor": "Johor Bahru",
  "Kedah": "Alor Setar",
  "Kelantan": "Kota Bharu",
  "Melaka": "Melaka",
  "Negeri Sembilan": "Seremban",
  "Pahang": "Kuantan",
  "Perak": "Ipoh",
  "Perlis": "Kangar",
  "Pulau Pinang": "George Town",
  "Sabah": "Kota Kinabalu",
  "Sarawak": "Kuching",
  "Selangor": "Shah Alam",
  "Terengganu": "Kuala Terengganu",
  "Kuala Lumpur": "Kuala Lumpur",
  "Labuan": "Labuan",
  "Putrajaya": "Putrajaya"
};

document.getElementById('stateSelect').addEventListener('change', () => {
  const state = document.getElementById('stateSelect').value;
  if (!state) return clearChart();

  const city = stateCapitals[state];
  fetchWeather(city);
});

document.getElementById('searchInput').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();

  const filteredLabels = allLabels.filter(label => label.toLowerCase().includes(query));
  const filteredTemps = filteredLabels.map(label => {
    const index = allLabels.indexOf(label);
    return allTemps[index];
  });

  renderChart(filteredLabels, filteredTemps);
});

async function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.cod !== "200") {
      alert("City not found. Please try again.");
      clearChart();
      return;
    }

    const current = data.list[0];

    document.getElementById('tempValue').textContent = `${current.main.temp.toFixed(1)} °C`;
    document.getElementById('windValue').textContent = `${current.wind.speed} km/h`;
    const rain = current.rain && current.rain['3h'] ? `${current.rain['3h']} mm` : '0 mm';
    document.getElementById('rainValue').textContent = rain;

    document.getElementById('weatherInfo').classList.remove('hidden');

    allLabels = data.list.map(item => item.dt_txt);
    allTemps = data.list.map(item => item.main.temp);

    renderChart(allLabels.slice(0, 10), allTemps.slice(0, 10)); // Default show 10 entries
  } catch (error) {
    alert("Error fetching weather data. Check console.");
    console.error(error);
    clearChart();
  }
}

function renderChart(labels, data) {
  const ctx = document.getElementById('weatherChart').getContext('2d');

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Temperature (°C)',
        data,
        backgroundColor: 'rgba(59,130,246,0.2)',
        borderColor: 'rgba(59,130,246,1)',
        pointBackgroundColor: 'rgba(59,130,246,1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: { mode: 'index', intersect: false }
      },
      interaction: {
        mode: 'nearest',
        intersect: false
      }
    }
  });
}

function clearChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  document.getElementById('weatherInfo').classList.add('hidden');
  document.getElementById('searchInput').value = '';
  renderChart([], []);
}