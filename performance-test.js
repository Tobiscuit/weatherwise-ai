const axios = require('axios');

const TEST_LOCATIONS = [
  'New York',
  'London', 
  'Tokyo',
  'Sydney',
  'Paris'
];

const GEOCODE_API_URL = 'https://geocode.maps.co/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

async function testGeocodingAPI(location) {
  const start = Date.now();
  try {
    const response = await axios.get(GEOCODE_API_URL, {
      params: { q: location },
      timeout: 5000
    });
    const time = Date.now() - start;
    return { success: true, time, data: response.data[0] };
  } catch (error) {
    const time = Date.now() - start;
    return { success: false, time, error: error.message };
  }
}

async function testWeatherAPI(lat, lon) {
  const start = Date.now();
  try {
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'temperature_2m',
        current_weather: true,
        forecast_days: 1
      },
      timeout: 5000
    });
    const time = Date.now() - start;
    return { success: true, time };
  } catch (error) {
    const time = Date.now() - start;
    return { success: false, time, error: error.message };
  }
}

async function runPerformanceTest() {
  console.log('🚀 Starting Performance Test...\n');
  
  const results = {
    geocoding: [],
    weather: [],
    summary: {
      totalGeocodingTime: 0,
      totalWeatherTime: 0,
      successfulGeocoding: 0,
      successfulWeather: 0
    }
  };
  
  for (const location of TEST_LOCATIONS) {
    console.log(`📍 Testing: ${location}`);
    
    // Test geocoding
    const geocodeResult = await testGeocodingAPI(location);
    results.geocoding.push({ location, ...geocodeResult });
    
    if (geocodeResult.success) {
      results.summary.successfulGeocoding++;
      results.summary.totalGeocodingTime += geocodeResult.time;
      
      // Test weather API with coordinates
      const weatherResult = await testWeatherAPI(
        geocodeResult.data.lat, 
        geocodeResult.data.lon
      );
      results.weather.push({ location, ...weatherResult });
      
      if (weatherResult.success) {
        results.summary.successfulWeather++;
        results.summary.totalWeatherTime += weatherResult.time;
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print results
  console.log('\n📊 Performance Results:\n');
  
  console.log('📍 Geocoding API Results:');
  results.geocoding.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${result.location}: ${result.time}ms ${result.success ? '' : `(${result.error})`}`);
  });
  
  console.log('\n🌤️ Weather API Results:');
  results.weather.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${result.location}: ${result.time}ms ${result.success ? '' : `(${result.error})`}`);
  });
  
  console.log('\n📈 Summary:');
  console.log(`  Geocoding API: ${results.summary.successfulGeocoding}/${TEST_LOCATIONS.length} successful`);
  console.log(`  Average geocoding time: ${Math.round(results.summary.totalGeocodingTime / results.summary.successfulGeocoding)}ms`);
  console.log(`  Weather API: ${results.summary.successfulWeather}/${results.summary.successfulGeocoding} successful`);
  console.log(`  Average weather time: ${Math.round(results.summary.totalWeatherTime / results.summary.successfulWeather)}ms`);
  
  const avgTotalTime = Math.round((results.summary.totalGeocodingTime + results.summary.totalWeatherTime) / results.summary.successfulWeather);
  console.log(`  Estimated total time per request: ${avgTotalTime}ms + Gemini API time`);
  
  // Identify bottlenecks
  console.log('\n🔍 Bottleneck Analysis:');
  const avgGeocoding = Math.round(results.summary.totalGeocodingTime / results.summary.successfulGeocoding);
  const avgWeather = Math.round(results.summary.totalWeatherTime / results.summary.successfulWeather);
  
  if (avgGeocoding > 2000) {
    console.log(`  ⚠️  Geocoding API is slow (${avgGeocoding}ms average)`);
  }
  if (avgWeather > 2000) {
    console.log(`  ⚠️  Weather API is slow (${avgWeather}ms average)`);
  }
  if (avgGeocoding < 1000 && avgWeather < 1000) {
    console.log(`  ✅ APIs are performing well`);
  }
}

runPerformanceTest().catch(console.error); 