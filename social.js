const API_KEY = 'AIzaSyBREvvkgsy3K7N571bpkValCoT04pA09pU'; // <-- Replace with your API key
const CHANNEL_ID = 'UCtLdAw9Ov5MFAVcEzOQoN8Q'; // <-- Replace with your channel ID

let allVideosData = [];
let topVideosData = [];

async function fetchChannelData() {
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${CHANNEL_ID}&key=${API_KEY}`);
    const data = await res.json();
    const channel = data.items[0];

    document.getElementById('channelTitle').textContent = channel.snippet.title;
    document.getElementById('subscriberCount').textContent = Number(channel.statistics.subscriberCount).toLocaleString();
    document.getElementById('viewCount').textContent = Number(channel.statistics.viewCount).toLocaleString();
    document.getElementById('videoCount').textContent = Number(channel.statistics.videoCount).toLocaleString();
  } catch (err) {
    console.error('Error fetching channel data:', err);
  }
}

async function fetchTopVideos() {
  try {
    const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`);
    const playlistData = await playlistRes.json();
    const uploadPlaylistId = playlistData.items[0].contentDetails.relatedPlaylists.uploads;

    // Fetch up to 50 videos for the full list
    const uploadsRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadPlaylistId}&key=${API_KEY}`);
    const uploads = await uploadsRes.json();

    const videoIds = uploads.items.map(item => item.snippet.resourceId.videoId).join(',');

    const videoStatsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${API_KEY}`);
    const videoStats = await videoStatsRes.json();

    allVideosData = videoStats.items.sort((a, b) => b.statistics.viewCount - a.statistics.viewCount);
    topVideosData = allVideosData.slice(0, 5);

    renderTopVideos(topVideosData);
    renderAllVideos(allVideosData);
    renderChart(topVideosData);
  } catch (err) {
    console.error('Error fetching videos:', err);
  }
}

function renderTopVideos(videos) {
  const tbody = document.getElementById('topVideos');
  tbody.innerHTML = '';

  videos.forEach(video => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="py-2 px-4">${video.snippet.title}</td>
      <td class="py-2 px-4">${Number(video.statistics.viewCount).toLocaleString()}</td>
      <td class="py-2 px-4">${Number(video.statistics.likeCount || 0).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAllVideos(videos) {
  const tbody = document.getElementById('allVideos');
  tbody.innerHTML = '';

  videos.forEach(video => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="py-2 px-4">${video.snippet.title}</td>
      <td class="py-2 px-4">${Number(video.statistics.viewCount).toLocaleString()}</td>
      <td class="py-2 px-4">${Number(video.statistics.likeCount || 0).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderChart(videos) {
  const labels = videos.map(v => v.snippet.title);
  const views = videos.map(v => v.statistics.viewCount);
  const likes = videos.map(v => v.statistics.likeCount || 0);

  const ctx = document.getElementById('videoChart').getContext('2d');
  
  // Destroy previous chart if exists (optional, to avoid duplication)
  if (window.videoChartInstance) {
    window.videoChartInstance.destroy();
  }

  window.videoChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Views',
          data: views,
          backgroundColor: 'rgba(72, 129, 236, 0.7)',
        },
        {
          label: 'Likes',
          data: likes,
          backgroundColor: 'rgba(92, 202, 246, 0.7)',
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: {
            display: false,  // hide x-axis labels (video titles)
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        tooltip: {
          enabled: true,
          callbacks: {
            title: (tooltipItems) => {
              return labels[tooltipItems[0].dataIndex];
            }
          }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchChannelData();
  fetchTopVideos();

  const searchInputAll = document.getElementById('videoSearchAll');
  searchInputAll.addEventListener('input', () => {
    const query = searchInputAll.value.toLowerCase();
    const filteredVideos = allVideosData.filter(video =>
      video.snippet.title.toLowerCase().includes(query)
    );
    renderAllVideos(filteredVideos);
  });
});