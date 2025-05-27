const API_KEY = 'e100139bb89c999bfa40f24c0c0f6ecb';
let chartInstance = null;

function unixToLocalTime(unix, offset) {
  const date = new Date((unix + offset) * 1000);
  let hours = date.getUTCHours(), mins = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${String(mins).padStart(2, '0')} ${ampm}`;
}

async function fetchWeather(city = 'Kuala Lumpur') {
  try {

    const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
    if (!currentRes.ok) throw new Error('City not found');
    const currentData = await currentRes.json();

    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
    if (!forecastRes.ok) throw new Error('Forecast not found');
    const forecastData = await forecastRes.json();

    const { timezone } = currentData;

    updateUI(currentData, forecastData, timezone);
    updateChart(forecastData);

  } catch (err) {
    alert('Error fetching weather: ' + err.message);
    clearChart();
  }
}

function getRainVolumeFromForecast(forecastData) {
  if (!forecastData || !forecastData.list) return 0;
  let totalRain = 0;
  for (let i = 0; i < 3; i++) {
    const rain = forecastData.list[i].rain;
    if (rain) {
      totalRain += rain['3h'] || rain['1h'] || 0;
    }
  }
  return Math.round(totalRain * 100) / 100; 
}

function updateUI(current, forecastData, offset) {
  const now = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  document.getElementById('monthYear').textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById('date').textContent = now.toDateString();

  document.getElementById('windSpeed').textContent = `${Math.round(current.wind?.speed * 3.6) || '--'} km/h`;

  console.log('Current rain data:', current.rain);
  console.log('Forecast rain data:', forecastData.list.slice(0,3).map(item => item.rain));
  const rainVolCurrent = current.rain ? (current.rain['1h'] ?? current.rain['3h'] ?? 0) : 0;
  const rainVolForecast = getRainVolumeFromForecast(forecastData);
  const displayedRain = rainVolCurrent > 0 ? rainVolCurrent : rainVolForecast;
  document.getElementById('rainVolume').textContent = `${displayedRain} mm`;

  document.getElementById('pressure').textContent = `${current.main?.pressure || '--'} hPa`;
  document.getElementById('humidity').textContent = `${current.main?.humidity ?? '--'}%`;

  document.getElementById('locationName').textContent = current.name;
  document.getElementById('locationRegion').textContent = current.sys?.country === 'MY' ? 'Malaysia' : current.sys?.country || '';
  document.getElementById('localTime').textContent = unixToLocalTime(Math.floor(Date.now() / 1000), offset);
  document.getElementById('tempC').textContent = `${Math.round(current.main?.temp) || '--'}°C`;
  document.getElementById('weatherDesc').textContent = current.weather?.[0]?.description.replace(/\b\w/g, c => c.toUpperCase()) || 'N/A';

  const weatherConditionDiv = document.getElementById('weatherCondition');
  weatherConditionDiv.innerHTML = `
    <div class="bg-white/10 p-3 rounded-xl flex justify-between">
      <span>Condition</span><span>${current.weather?.[0]?.main || '--'}</span>
    </div>
    <div class="bg-white/10 p-3 rounded-xl flex justify-between">
      <span>Description</span><span>${current.weather?.[0]?.description || '--'}</span>
    </div>
  `;

  document.getElementById('sunriseTime').textContent = current.sys?.sunrise ? unixToLocalTime(current.sys.sunrise, offset) : '--';
  document.getElementById('sunsetTime').textContent = current.sys?.sunset ? unixToLocalTime(current.sys.sunset, offset) : '--';
}

function updateChart(forecastData) {
  const ctx = document.getElementById('weatherChart').getContext('2d');

  if (chartInstance) chartInstance.destroy();

  const labels = forecastData.list.slice(0, 10).map(item => item.dt_txt);
  const temps = forecastData.list.slice(0, 10).map(item => item.main.temp);

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Temperature (°C)',
        data: temps,
        backgroundColor: 'rgba(59,130,246,0.2)',
        borderColor: 'rgba(59,130,246,1)',
        pointBackgroundColor: 'rgba(59,130,246,1)',
        borderWidth: 2,
        tension: 0.3,
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: { maxRotation: 45, minRotation: 45 },
        },
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

function clearChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}

document.getElementById('searchBtn').addEventListener('click', () => {
  const city = document.getElementById('cityInput').value.trim();
  if (city) {
    fetchWeather(city);
  }
});

document.getElementById('cityInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    const city = e.target.value.trim();
    if (city) {
      fetchWeather(city);
    }
  }
});

fetchWeather('Kuala Lumpur');
