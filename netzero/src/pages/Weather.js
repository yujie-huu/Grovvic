import React, { useEffect, useState } from 'react'
import './Weather.css'
import axios from 'axios'

const Weather = () => {
  const [weather, setWeather] = useState(null)
  const [forecastList, setForecastList] = useState([])
  const [unit, setUnit] = useState('metric')
  const [selectedCity, setSelectedCity] = useState('Melbourne')
  const [dailyForecasts, setDailyForecasts] = useState([])

  const apiKey = '1f5dfe74e7b3fd6b3def4b169f80177b'  
  const country = 'AU'

  const victoriaCities = [
    'Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Mildura',
    'Shepparton', 'Warrnambool', 'Wangaratta', 'Traralgon', 'Sale',
    'Bairnsdale', 'Echuca', 'Colac', 'Morwell', 'Portland'
  ]

  const fetchWeather = async (cityName, unitType) => {
    try {
      const current = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          q: `${cityName},${country}`,
          units: unitType,
          appid: apiKey
        }
      })
      setWeather(current.data)

      const forecast = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
        params: {
          q: `${cityName},${country}`,
          units: unitType,
          appid: apiKey
        }
      })

      const todayDate = new Date().toISOString().split('T')[0]
      const todayForecasts = forecast.data.list.filter(item =>
        item.dt_txt.startsWith(todayDate)
      ).slice(0, 8)

      setForecastList(todayForecasts)

      // extracts the first forecast item for each day of the week
      const groupedByDate = {}
      forecast.data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0]
        if (!groupedByDate[date]) groupedByDate[date] = item
      })
      const next7Days = Object.values(groupedByDate).slice(0, 8)
      setDailyForecasts(next7Days)
    } catch (err) {
      console.error('Weather API error:', err)
    }
  }

  useEffect(() => {
    fetchWeather(selectedCity, unit)
  }, [unit, selectedCity])

  const toggleUnit = () => {
    setUnit(prev => (prev === 'metric' ? 'imperial' : 'metric'))
  }

  if (!weather) return <p>Loading weather...</p>

  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const formatTime = (dtTxt) => {
    const date = new Date(dtTxt)
    return date.toLocaleTimeString([], { hour: 'numeric', hour12: true })
  }

  const formatSunTime = (ts) => new Date(ts * 1000).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  
  const formatDay = (dtTxt) => {
    const date = new Date(dtTxt)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  const tempUnit = unit === 'metric' ? '°C' : '°F'
  const speedUnit = unit === 'metric' ? 'km/h' : 'mph'




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
                <option key={city} value={city}>
                  Victoria, {city}
                </option>
              ))}
            </select>
          </div>

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

      <div className="weather-highlights-wrapper">
        <h3>Today's Highlight</h3>
        <div className="weather-highlights">
          <div className="highlight-box">
            <p>🌬️ Wind</p>
            <strong>{weather.wind.speed} {speedUnit}</strong>
            <p className="subtext">{formatSunTime(weather.dt)}</p>
          </div>
          <div className="highlight-box">
            <p>💧 Humidity</p>
            <strong>{weather.main.humidity}%</strong>
            <p className="subtext">Humidity is good</p>
          </div>
          <div className="highlight-box">
            <p>🌅 Sunrise</p>
            <strong>{formatSunTime(weather.sys.sunrise)}</strong>
          </div>
          <div className="highlight-box">
            <p>🔬 UV Index</p>
            <strong>N/A UV</strong>
            <p className="subtext">Low UV</p>
          </div>
          <div className="highlight-box">
            <p>👁️ Visibility</p>
            <strong>{(weather.visibility / 1000).toFixed(1)} km</strong>
            <p className="subtext">{formatSunTime(weather.dt)}</p>
          </div>
          <div className="highlight-box">
            <p>🌇 Sunset</p>
            <strong>{formatSunTime(weather.sys.sunset)}</strong>
          </div>
        </div>
      </div>

      {/* Hourly Forecast Section (now: 3-hourly forecast for today only) */}
      <div className="hourly-forecast">
        {forecastList.map((item, index) => (
          <div className="hour-card" key={index}>
            <p className="hour-time">{formatTime(item.dt_txt)}</p>
            <img
              src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
              alt={item.weather[0].description}
              className="hour-icon"
            />
            <p className="hour-temp">{Math.round(item.main.temp)}{tempUnit}</p>
          </div>
        ))}
      </div>

      <div className="seven-day-forecast">
        <h3>7 Day Forecast</h3>
        <div className="day-cards">
          {dailyForecasts.map((item, index) => (
            <div className="day-card" key={index}>
              <p className="day-name">{index === 0 ? 'Today' : formatDay(item.dt_txt)}</p>
              <img
                src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                alt={item.weather[0].description}
                className="day-icon"
              />
              <p className="day-temp">{Math.round(item.main.temp)}{tempUnit}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default Weather
