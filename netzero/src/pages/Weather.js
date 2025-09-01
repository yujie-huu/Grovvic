import React, { useEffect, useState } from 'react'
import './Weather.css'
import axios from 'axios'

const Weather = () => {
  const [weather, setWeather] = useState(null)
  const [uvData, setUvData] = useState(null)
  const [unit, setUnit] = useState('metric')
  const [selectedCity, setSelectedCity] = useState('Melbourne') // 默认城市

  const apiKey = '1f5dfe74e7b3fd6b3def4b169f80177b'
  const country = 'AU'

  const victoriaCities = [
  'Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Mildura',
  'Shepparton', 'Warrnambool', 'Wangaratta', 'Traralgon', 'Sale',
  'Bairnsdale', 'Echuca', 'Colac', 'Morwell', 'Portland'
]

  const fetchWeather = async (cityName, unitType) => {
    try {
      const res = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          q: `${cityName},${country}`,
          units: unitType,
          appid: apiKey
        }
      })
      setWeather(res.data)

      const { lat, lon } = res.data.coord
      const uvRes = await axios.get('https://api.openweathermap.org/data/2.5/onecall', {
        params: {
          lat,
          lon,
          exclude: 'minutely,hourly,daily,alerts',
          units: unitType,
          appid: apiKey
        }
      })
      setUvData(uvRes.data.current.uvi)
    } catch (err) {
      console.error('Weather API error:', err)
    }
  }

  useEffect(() => {
    fetchWeather(selectedCity, unit)
  }, [unit, selectedCity]) // 每当单位或城市变化都重新加载

  const toggleUnit = () => {
    setUnit(prev => (prev === 'metric' ? 'imperial' : 'metric'))
  }

  if (!weather) return <p>Loading weather...</p>

  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const formatTime = ts => new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const tempUnit = unit === 'metric' ? '°C' : '°F'
  const speedUnit = unit === 'metric' ? 'km/h' : 'mph'

  return (
    <div className="weather-page">
      {/* Left Card */}
      <div className="weather-main-card">
        <div className="weather-main-top">
          <select
            className="location-tag"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            {victoriaCities.map(city => (
              <option key={city} value={city}>
                📍 Victoria , {city}
              </option>
            ))}
          </select>
          <div className="unit-toggle" onClick={toggleUnit}>
            {tempUnit} ▾
          </div>
        </div>

        <div className="weather-main-body">
          <div className="weather-main-left">
            <div className="weekday">{weekday}</div>
            <div className="date">{date}</div>
          </div>

          <div className="weather-main-center">
            <div className="weather-icon">
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt={weather.weather[0].description}
              />
            </div>
          </div>

          <div className="weather-main-right">
            <div className="temp">{Math.round(weather.main.temp)}{tempUnit}</div>
            <div className="minmax">/{Math.round(weather.main.temp_min)}{tempUnit}</div>
            <div className="desc">{weather.weather[0].main}</div>
            <div className="feels">Feels like {Math.round(weather.main.feels_like)}{tempUnit}</div>
          </div>
        </div>
      </div>

      {/* Right Highlights（保持不变） */}
      <div className="weather-highlights-wrapper">
        <h3>Today's Highlight</h3>
        <div className="weather-highlights">
          <div className="highlight-box">
            <p>🌬️ Wind</p>
            <strong>{weather.wind.speed} {speedUnit}</strong>
            <p className="subtext">{formatTime(weather.dt)}</p>
          </div>
          <div className="highlight-box">
            <p>💧 Humidity</p>
            <strong>{weather.main.humidity}%</strong>
            <p className="subtext">Humidity is good</p>
          </div>
          <div className="highlight-box">
            <p>🌅 Sunrise</p>
            <strong>{formatTime(weather.sys.sunrise)}</strong>
          </div>
          <div className="highlight-box">
            <p>🔬 UV Index</p>
            <strong>{uvData ? uvData.toFixed(1) + ' UV' : 'N/A UV'}</strong>
            <p className="subtext">
              {uvData > 6 ? 'High UV' : uvData > 3 ? 'Moderate UV' : 'Low UV'}
            </p>
          </div>
          <div className="highlight-box">
            <p>👁️ Visibility</p>
            <strong>{(weather.visibility / 1000).toFixed(1)} km</strong>
            <p className="subtext">{formatTime(weather.dt)}</p>
          </div>
          <div className="highlight-box">
            <p>🌇 Sunset</p>
            <strong>{formatTime(weather.sys.sunset)}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Weather
