export const weatherCodes: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export const weatherCodeToImage = (code: number): string => {
  switch (code) {
    case 0: return "weather-icons/reshot/clear.svg";
    case 1: return "weather-icons/reshot/clear.svg";
    case 2: return "weather-icons/reshot/partly-cloudy.svg";
    case 3: return "weather-icons/reshot/overcast.svg";
    case 45: return "weather-icons/reshot/fog.svg";
    case 48: return "weather-icons/reshot/fog.svg";
    case 51: return "weather-icons/reshot/light-rain.svg";
    case 53: return "weather-icons/reshot/moderate-rain.svg";
    case 55: return "weather-icons/reshot/dense-rain.svg";
    case 56: return "weather-icons/reshot/light-freezing-rain.svg";
    case 57: return "weather-icons/reshot/dense-freezing-rain.svg";
    case 61: return "weather-icons/reshot/light-rain.svg";
    case 63: return "weather-icons/reshot/moderate-rain.svg";
    case 65: return "weather-icons/reshot/heavy-rain.svg";
    case 66: return "weather-icons/reshot/light-freezing-rain.svg";
    case 67: return "weather-icons/reshot/heavy-freezing-rain.svg";
    case 71: return "weather-icons/reshot/light-snow.svg";
    case 73: return "weather-icons/reshot/moderate-snow.svg";
    case 75: return "weather-icons/reshot/heavy-snow.svg";
    case 77: return "weather-icons/reshot/snow-grains.svg";
    case 80: return "weather-icons/reshot/light-rain-showers.svg";
    case 81: return "weather-icons/reshot/moderate-rain-showers.svg";
    case 82: return "weather-icons/reshot/violent-rain-showers.svg";
    case 85: return "weather-icons/reshot/light-snow-showers.svg";
    case 86: return "weather-icons/reshot/heavy-snow-showers.svg";
    case 95: return "weather-icons/reshot/thunderstorm.svg";
    case 96: return "weather-icons/reshot/thunderstorm.svg";
    case 99: return "weather-icons/reshot/thunderstorm.svg";
    default: return "weather-icons/reshot/info.svg";
  }
}; 