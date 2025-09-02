// Weather.jsx
import React, { useEffect, useState } from 'react'
import './Weather.css'
import axios from 'axios'

const Weather = () => {
  const [current, setCurrent] = useState(null)
  const [forecastList, setForecastList] = useState([]) // hourly
  const [dailyForecasts, setDailyForecasts] = useState([]) // 8-day forecast
  const [unit, setUnit] = useState('metric')
  const [selectedCity, setSelectedCity] = useState('Melbourne')

  const apiKey = 'cc6ac231ffa5fcb7e2893394cea3d7d4'
  const country = 'AU'

  const victoriaCities = [
    'Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Mildura',
    'Shepparton', 'Warrnambool', 'Wangaratta', 'Traralgon', 'Sale',
    'Bairnsdale', 'Echuca', 'Colac', 'Morwell', 'Portland'
  ]

  const fetchWeather = async (cityName, unitType) => {
    try {
      // Step 1: Get latitude and longitude by city name
      const geoRes = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
        params: {
          q: `${cityName},${country}`,
          limit: 1,
          appid: apiKey
        }
      })

      if (!geoRes.data || geoRes.data.length === 0) {
        throw new Error('Geocoding failed')
      }

      const { lat, lon } = geoRes.data[0]

      // Step 2: Fetch weather using One Call API 3.0
      const weatherRes = await axios.get('https://api.openweathermap.org/data/3.0/onecall', {
        params: {
          lat,
          lon,
          units: unitType,
          exclude: 'minutely,alerts',
          appid: apiKey
        }
      })

      const data = weatherRes.data

      // Step 3: Store weather data
      setCurrent(data.current)
      setForecastList(data.hourly.slice(0, 24))      // 24-hour forecast
      setDailyForecasts(data.daily.slice(0, 8))       // 8-day forecast

    } catch (err) {
      console.error('One Call API error:', err)
      alert('❌ Failed to fetch weather data. Please check your API key and subscription.')
    }
  }

  useEffect(() => {
    fetchWeather(selectedCity, unit)
  }, [unit, selectedCity])

  const toggleUnit = () => {
    setUnit(prev => (prev === 'metric' ? 'imperial' : 'metric'))
  }

  if (!current) return <p>Loading weather...</p>

  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const formatTime = (unix) => new Date(unix * 1000).toLocaleTimeString([], { hour: 'numeric', hour12: true })
  const formatSunTime = (unix) => new Date(unix * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  const formatDay = (unix) => new Date(unix * 1000).toLocaleDateString('en-US', { weekday: 'short' })

  const tempUnit = unit === 'metric' ? '°C' : '°F'
  const speedUnit = unit === 'metric' ? 'km/h' : 'mph'
  const windSpeed = unit === 'metric' ? (current.wind_speed * 3.6).toFixed(1) : current.wind_speed.toFixed(1)
  const todayMin = Math.round(dailyForecasts[0].temp.min)

  return (
    <div className="weather-page">
      <div className="weather-main-card">
        <div className="weather-main-top">
          <div className="location-wrapper">
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
              </svg>
            </span>
            <select
              className="location-tag"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              {victoriaCities.map(city => (
                <option key={city} value={city}>Victoria, {city}</option>
              ))}
            </select>
          </div>

          <div className="unit-toggle" onClick={toggleUnit}>{tempUnit} ▾</div>
        </div>

        <div className="weather-main-body">
          <div className="weather-main-left">
            <div className="weekday">{weekday}</div>
            <div className="date">{date}</div>
          </div>

          <div className="weather-main-center">
            <div className="weather-icon">
              <img
                src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`}
                alt={current.weather[0].description}
              />
            </div>
          </div>

          <div className="weather-main-right">
            <div className="temp">{Math.round(current.temp)}{tempUnit}</div>
            <div className="minmax">/{todayMin}{tempUnit}</div>
            <div className="desc">{current.weather[0].main}</div>
            <div className="feels">Feels like {Math.round(current.feels_like)}{tempUnit}</div>
          </div>
        </div>
      </div>

      <div className="weather-highlights-wrapper">
        <h3>Today's Highlight</h3>
        <div className="weather-highlights">
          <div className="highlight-box">
            <p>🌬️ Wind</p>
            <strong>{windSpeed} {speedUnit}</strong>
            <p className="subtext">{formatSunTime(current.dt)}</p>
          </div>
          <div className="highlight-box">
            <p>💧 Humidity</p>
            <strong>{current.humidity}%</strong>
            <p className="subtext">Humidity is good</p>
          </div>
          <div className="highlight-box">
            <p>🌅 Sunrise</p>
            <strong>{formatSunTime(current.sunrise)}</strong>
          </div>
          <div className="highlight-box">
            <p>🔬 UV Index</p>
            <strong>{current.uvi}</strong>
            <p className="subtext">UV risk level</p>
          </div>
          <div className="highlight-box">
            <p>👁️ Visibility</p>
            <strong>{(current.visibility / 1000).toFixed(1)} km</strong>
            <p className="subtext">{formatSunTime(current.dt)}</p>
          </div>
          <div className="highlight-box">
            <p>🌇 Sunset</p>
            <strong>{formatSunTime(current.sunset)}</strong>
          </div>
        </div>
      </div>

      <div className="hourly-forecast">
        {forecastList.slice(0, 12).map((item, index) => (
          <div className="hour-card" key={index}>
            <p className="hour-time">
              {new Date(item.dt * 1000).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
            <img
              src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
              alt={item.weather[0].description}
              className="hour-icon"
            />
            <p className="hour-temp">{Math.round(item.temp)}{tempUnit}</p>
          </div>
        ))}
      </div>

      <div className="seven-day-forecast">
        <h3>7 Day Forecast</h3>
        <div className="day-cards">
          {dailyForecasts.map((item, index) => (
            <div className="day-card" key={index}>
              <p className="day-name">{index === 0 ? 'Today' : formatDay(item.dt)}</p>
              <img
                src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                alt={item.weather[0].description}
                className="day-icon"
              />
              <p className="day-temp">{Math.round(item.temp.day)}{tempUnit}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="gardening-tips-full">
        <h2>🌱 Gardening Tips for the Week</h2>
        <p className="tip-content">
          Tips will be added here...
        </p>
      </div>

    </div>
  )
}

export default Weather
