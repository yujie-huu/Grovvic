// Weather.jsx
import React, { useEffect, useState } from 'react'
import './Weather.css'
import axios from 'axios'
import { buildWateringTable } from '../utils/watering.js';
import Plot from "react-plotly.js";
import tempSpec from "../data/annual_temp_anomaly.json";
import rainSpec from "../data/annual_rainfall_anomaly.json";
import futureSpec from "../data/climatology_monthly_interactive.json";

const Weather = () => {
  const [current, setCurrent] = useState(null)
  const [forecastList, setForecastList] = useState([]) // hourly
  const [dailyForecasts, setDailyForecasts] = useState([]) // 8-day forecast
  const [unit, setUnit] = useState('metric')
  const [selectedCity, setSelectedCity] = useState('Melbourne')
  const [climateType, setClimateType] = useState('temperature')

  const apiKey = 'cc6ac231ffa5fcb7e2893394cea3d7d4'
  const country = 'AU'

  const victoriaCities = [
    'Melbourne','Geelong','Ballarat','Bendigo','Mildura',
    'Shepparton','Warrnambool','Wangaratta','Traralgon','Sale',
    'Bairnsdale','Echuca','Colac','Morwell','Portland'
  ]

  const fetchWeather = async (cityName, unitType) => {
    try {
      const geoRes = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
        params: { q: `${cityName},${country}`, limit: 1, appid: apiKey }
      })
      if (!geoRes.data || geoRes.data.length === 0) throw new Error('Geocoding failed')
      const { lat, lon } = geoRes.data[0]

      const weatherRes = await axios.get('https://api.openweathermap.org/data/3.0/onecall', {
        params: { lat, lon, units: unitType, exclude: 'minutely,alerts', appid: apiKey }
      })
      const data = weatherRes.data
      setCurrent(data.current)
      setForecastList(data.hourly.slice(0, 24))
      setDailyForecasts(data.daily.slice(0, 8))
    } catch (err) {
      console.error('One Call API error:', err)
      alert('❌ Failed to fetch weather data. Please check your API key and subscription.')
    }
  }

  useEffect(() => { fetchWeather(selectedCity, unit) }, [unit, selectedCity])

  const toggleUnit = () => setUnit(prev => (prev === 'metric' ? 'imperial' : 'metric'))

  if (!current) return <p>Loading weather...</p>

  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const formatSunTime = (unix) =>
    new Date(unix * 1000).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true
    }).replace('AM','am').replace('PM','pm')

  const formatDay = (unix) =>
    new Date(unix * 1000).toLocaleDateString('en-US', { weekday: 'short' })

  const tempUnit = unit === 'metric' ? '°C' : '°F'
  const speedUnit = unit === 'metric' ? 'km/h' : 'mph'
  const windSpeed = unit === 'metric'
    ? (current.wind_speed * 3.6).toFixed(1)
    : current.wind_speed.toFixed(1)
  const todayMin = Math.round(dailyForecasts?.[0]?.temp?.min ?? current.temp)

  const toKmh = (speed) => unit === 'imperial' ? (speed || 0) * 1.60934 : (speed || 0) * 3.6
  const toCelsius = (t)   => unit === 'imperial' ? (t - 32) * 5 / 9 : t
  const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

  // ---- Today (daily) numbers for tips ----
  const todayDaily = dailyForecasts?.[0] || {}
  const dayTempC   = toCelsius(todayDaily?.temp?.day ?? current?.temp ?? 0)
  const dayRainMm  = todayDaily?.rain ?? 0
  const dayWindKmh = toKmh(todayDaily?.wind_speed ?? current?.wind_speed ?? 0)
  const dayHumidity= todayDaily?.humidity ?? current?.humidity ?? 0
  const dayUvi     = todayDaily?.uvi ?? current?.uvi ?? 0

  // ✅ Daily Gardening Tips 只保留天气类（不再拼接 watering 文案）
  const dayTips = []
  if (dayTempC > 30) dayTips.push("It's a hot day. Use shade cloth or move pots out of direct sunlight!")
  else if (dayTempC >= 1 && dayTempC <= 10) dayTips.push("It's a cold day. Cover seedlings or bring them indoors!")
  else if (dayTempC < 1) dayTips.push("It's a frosty day. Cover fragile plants with sheets overnight and bring pots indoors!")
  if (dayRainMm < 1) dayTips.push("It's a dry day. Make sure you've mulched your garden to keep the soil moist!")
  else if (dayRainMm > 20) dayTips.push("It's a stormy day. Harvest ripe produce to avoid damage! Raise pots and stake tall plants if you need to!")
  if (dayWindKmh > 25) dayTips.push("It's a windy day. Shelter fragile pots and secure trellises!")
  if (dayHumidity > 70) dayTips.push("It's a humid day. Watch for fungal infection!")
  if (dayUvi > 8) dayTips.push("It's a bright day. Shade seedlings and sensitive plants!")
  if (dayTips.length === 0) dayTips.push("The weather is calm today. Keep up your regular gardening care routine.")

  // ---- Weekly tips (weather only) ----
  const next7 = (dailyForecasts || []).slice(0, 7)
  const meanTempC = mean(next7.map(d => toCelsius(d?.temp?.day ?? 0)))
  const meanRainMm = mean(next7.map(d => d?.rain ?? 0))
  const maxTempC   = next7.length ? Math.max(...next7.map(d => toCelsius(d?.temp?.max ?? -Infinity))) : -Infinity
  const minTempC   = next7.length ? Math.min(...next7.map(d => toCelsius(d?.temp?.min ??  Infinity))) :  Infinity
  const maxWindKmh = next7.length ? Math.max(...next7.map(d => toKmh(d?.wind_speed ?? 0))) : 0
  const maxUvi     = next7.length ? Math.max(...next7.map(d => d?.uvi ?? 0)) : 0
  const maxDailyRain = next7.length ? Math.max(...next7.map(d => d?.rain ?? 0)) : 0

  // define "extreme" heuristics
  const hasExtreme = (maxTempC >= 35) || (minTempC <= 1) || (maxWindKmh >= 50) || (maxUvi >= 8) || (maxDailyRain >= 30)

  // 1.3
  const imageSrc = climateType === 'temperature' 
    ? '/images/temperature_average.jpg'
    : '/images/rainfall_average.png';

  const climateInsightsTemp = (
    <>
      {/* 单独的长卡片 */}
      <div className="climate-intro-card">
        <h2>Historical Climate Insights</h2>
        <p>
          Average temperatures in Victoria have risen by ~0.8°C since the 1950s,
          with more frequent and intense heatwaves.
        </p>
      </div>

      <div className="climate-card-grid">
        <div className="climate-card">
          <h3>PLANT HEAT-TOLERANT CROPS</h3>
          <p>Choose summer-resilient vegetables like tomatoes, chillies, eggplants.</p>
        </div>
        <div className="climate-card">
          <h3>AVOID COOL-SEASON CROPS</h3>
          <p>Skip lettuce or coriander during hot periods (they may bolt early or wilt).</p>
        </div>
        <div className="climate-card">
          <h3>ADJUST PLANTING SCHEDULES</h3>
          <p>Use longer warm seasons by planting earlier in spring or extending into autumn.</p>
        </div>
        <div className="climate-card">
          <h3>PROTECT PLANTS FROM HEAT WAVES</h3>
          <p>Use shade cloths, mulch, or plant covers to reduce heat stress.</p>
        </div>
        <div className="climate-card">
          <h3>WATER TIMING</h3>
          <p>Water early morning or late evening to minimize evaporation.</p>
        </div>
      </div>
    </>
  )


  const climateInsightsRain = (
    <>
      <p className="climate-intro">
        There’s been a significant decline in autumn rainfall, slight drops in winter and spring,
        and a small increase in summer rainfall. Fewer very wet years have occurred.
      </p>
      <div className="climate-card-grid">
        <div className="climate-card">
          <h3>IRRIGATE MORE DURING AUTUMN</h3>
          <p>Compensate for reduced natural soil moisture during fall planting periods.</p>
        </div>
        <div className="climate-card">
          <h3>USE WATER-SAVING TECHNIQUES</h3>
          <p>Install drip irrigation or deep watering systems to minimize water waste.</p>
        </div>
        <div className="climate-card">
          <h3>COLLECT AND REUSE RAINWATER</h3>
          <p>Install rain barrels to capture water during wetter months for dry season use.</p>
        </div>
        <div className="climate-card">
          <h3>IMPROVE SOIL MOISTURE RETENTION</h3>
          <p>Add compost or organic matter to enhance water-holding capacity.</p>
        </div>
        <div className="climate-card">
          <h3>GROW DROUGHT-TOLERANT PLANTS</h3>
          <p>Select native or low-water species (e.g., succulents, lavender, kangaroo paw).</p>
        </div>
      </div>
    </>
  )



  const weeklyRules = [
    { check: () => meanTempC > 30 && meanRainMm < 1,
      tip: "This week will be hot and dry. Refresh mulch to reduce evaporation and set up shade cloth to reduce sun damage!" },
    { check: () => meanTempC >= 10 && meanTempC <= 25,
      tip: "This week will be nice and cool. Now is the perfect time to plant and sow seeds!" },
    { check: () => meanRainMm > 7,
      tip: "This will be a rainy week. Make sure to check drainage, raise pots, refresh mulch, and stake plants to prevent damage! Avoid stepping on the wet soil to prevent compaction!" },
    { check: () => hasExtreme,
      tip: "Extreme weather is expected this week. Use extreme weather tips: provide shade, cover fragile plants, secure trellises, check drainage, and harvest & stake if needed." },
  ]
  let weeklyTips = weeklyRules.filter(r => r.check()).map(r => r.tip)
  if (weeklyTips.length === 0) weeklyTips = [
    "This week's weather looks mild and steady. Please stick to your regular watering and care routine."
  ]


  const wateringTable = buildWateringTable(todayDaily, next7, {
    soil: 'loam',   // 可按需连接到设置
    hoseLpm: 12,
  })


  const weatherTips = [
  // 🌡️ Temperature
  {
    type: 'temperature',
    condition: (temp) => temp > 30,
    tip: "Use shade cloth or move pots out of direct sunlight!"
  },
  {
    type: 'temperature',
    condition: (temp) => temp >= 10 && temp <= 25,
    tip: "Now is the perfect time to plant and sow seeds!"
  },
  {
    type: 'temperature',
    condition: (temp) => temp >= 1 && temp < 10,
    tip: "Cover seedlings or bring them indoors!"
  },
  {
    type: 'temperature',
    condition: (temp) => temp < 1,
    tip: "Cover fragile plants with sheets overnight and bring pots indoors!"
  },
  // 🌧️ Rainfall
  {
    type: 'rainfall',
    condition: (rain) => rain < 1,
    tip: "Make sure you've mulched your garden to keep the soil moist!"
  },
  {
    type: 'rainfall',
    condition: (rain) => rain > 20,
    tip: "Harvest ripe produce to avoid damage! Raise pots and stake tall plants if you need to!"
  },
  // 🌬️ Wind
  {
    type: 'wind',
    condition: (windKmh) => windKmh > 25,
    tip: "Shelter fragile pots and secure trellises!"
  },
  // 💧 Humidity
  {
    type: 'humidity',
    condition: (humidity) => humidity > 70,
    tip: "Watch for fungal infection!"
  },
  // 🌞 UV Index
  {
    type: 'uv',
    condition: (uvi) => uvi > 8,
    tip: "Shade seedlings and sensitive plants!"
  }
  ]

  const getWeatherTip = (hourData) => {
    const temp = hourData.temp
    const rain = hourData.rain?.['1h'] || 0
    const windKmh = hourData.wind_speed * 3.6
    const humidity = hourData.humidity
    const uvi = hourData.uvi

    for (const rule of weatherTips) {
      if (rule.type === 'temperature' && rule.condition(temp)) return rule.tip
      if (rule.type === 'rainfall' && rule.condition(rain)) return rule.tip
      if (rule.type === 'wind' && rule.condition(windKmh)) return rule.tip
      if (rule.type === 'humidity' && rule.condition(humidity)) return rule.tip
      if (rule.type === 'uv' && rule.condition(uvi)) return rule.tip
    }
    return null
  }


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



      <div class="weather-sections">
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


        <div
          className="gardening-hero"
          style={{
            ['--tip-count']: dayTips.length,   // ✅ 把当日 tip 的条数传给 CSS
            backgroundImage: `url(${process.env.PUBLIC_URL || ''}/images/days.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="gardening-hero__content">
            <div className="gardening-hero__left">
              <h2>Daily Gardening Tips</h2>
              <ul>
                {dayTips.map((txt, i) => (
                  <li key={i}>{txt}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>


        <div className="watering-guide">
          <h2>💧 Watering Guide</h2>
          <div className="water-when">
            When to water today: <strong>{wateringTable.whenToWaterToday}</strong>
          </div>

          <div className="watering-content">
            {/* 表格部分 */}
            <div className="watering-table-wrap">
              <table className="watering-table">
                <thead>
                  <tr>
                    <th>Plant</th>
                    <th>How Often?</th>
                    <th>Garden Hose /<br/>Watering Can</th>
                    <th>Drip / Rotary<br/>Irrigation</th>
                    <th>Spray /<br/>Sprinkler</th>
                  </tr>
                </thead>
                <tbody>
                  {wateringTable.rows.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.plant}</td>
                      <td>{r.howOften}</td>
                      <td>
                        <span
                          className={`water-badge ${
                            parseFloat(r.hose) < 60 ? "water-green" : "water-blue"
                          }`}
                        >
                          {r.hose}
                        </span>
                      </td>
                      <td>{r.drip}</td>
                      <td>{r.spray}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* notes part */}
            {wateringTable.notes?.length > 0 && (
              <ul className="watering-notes">
                {wateringTable.notes.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            )}
          </div>
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

        <div className="gardening-tips-banner">
          <h2>Gardening Tips for the Week</h2>
          <p className="tip-text">{weeklyTips[0]}</p>
        </div>

 
        <div
          className="weekly-image-banner"
          style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/images/iter2-weather-history.png)`,
            backgroundSize: "contain",     // 完整展示原图
            backgroundRepeat: "no-repeat", // 不重复
            backgroundPosition: "center",  // 居中
            height: "500px"                // 高度可按需求调整
          }}
        >
          <div className="weekly-image-overlay">
            <h2>Beyond Weather: From History To Future Resilient</h2>
          </div>
        </div>


        <div className="climate-section">
          <div className="climate-dropdown">
            <select onChange={(e) => setClimateType(e.target.value)} value={climateType}>
              <option value="temperature">Temperature</option>
              <option value="rainfall">Rainfall</option>
            </select>
          </div>

          {/* 图表容器：添加 margin-bottom 保证不遮盖卡片 */}
          <div
            className="climate-image"
            style={{
              position: "relative",
              zIndex: 1,            // 确保图表层级较低
              marginBottom: "40px", // 与下方卡片留出空间
            }}
          >
            <Plot
              data={(climateType === "temperature" ? tempSpec : rainSpec).data}
              layout={{
                ...(climateType === "temperature" ? tempSpec : rainSpec).layout,
                autosize: true,
                dragmode: false, // 禁止拖拽
              }}
              config={{
                //staticPlot: true,       禁止交互，仅悬停提示
                displayModeBar: false, // 隐藏右上角工具栏
                displaylogo: false,
                responsive: true,
              }}
              style={{
                width: "100%",
                height: "100%",
              }}
              useResizeHandler
            />
          </div>
        </div>



        <div className="green-box climate-box">
          {/* <h2>Historical Climate Insights</h2> */}
          {climateType === 'temperature' ? climateInsightsTemp : climateInsightsRain}
        </div>



        <div
          className="climate-section"
          style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/images/future-insights.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: "60px 20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div className="climate-chart-card">
            {/* 图表容器：与下方代码一致用 climate-image，并留出下方间距避免遮盖卡片 */}
            <div
              className="climate-image"
              style={{
                position: "relative",
                zIndex: 1,             // 确保图表层级较低
                marginBottom: "40px",  // 与下方卡片留出空间
              }}
            >
              <Plot
                data={futureSpec.data}
                layout={{
                  ...futureSpec.layout,
                  autosize: true,
                  dragmode: false,              // 禁止拖拽
                  // 如需去掉底部缩略滑块，可加：xaxis: { ...(futureSpec.layout?.xaxis||{}), rangeslider: { visible: false } }
                }}
                config={{
                  staticPlot: true,             // 仅展示，不可操作（保留悬停提示）
                  displayModeBar: false,        // 隐藏右上角工具栏
                  displaylogo: false,
                  responsive: true,
                }}
                style={{ width: "100%", height: "100%" }}  // 占满 climate-image 容器
                useResizeHandler
              />
            </div>
          </div>
        </div>



        <div className="green-box climate-box">
          <div className="climate-card-grid">
            <div className="climate-card">
              <h3>HOTTER SUMMERS</h3>
              <p>Grow heat-tolerant veggies (tomatoes, chillies, okra, sweet potatoes). Mulch to keep soil moist, water early/late, and use shade cloth for tender crops.</p>
            </div>
            <div className="climate-card">
              <h3>LONGER AUTUMNS</h3>
              <p>Plant cool-season crops earlier and enjoy extended yields of summer crops. Stagger planting to handle unexpected heat/dry spells.</p>
            </div>
            <div className="climate-card">
              <h3>MILDER WINTERS</h3>
              <p>Try borderline crops (ginger, broccoli, tropical herbs). Less frost risk helps citrus and avocado thrive, but watch for cold snaps.</p>
            </div>
            <div className="climate-card">
              <h3>EARLIER SPRINGS</h3>
              <p>Start warm-season crops sooner. Watch for early pests and strengthen soil with compost, organics, and rotation.</p>
            </div>
            <div className="climate-card">
              <h3>YEAR-ROUND</h3>
              <p>Choose native/drought-resilient plants, install smart irrigation, collect rainwater, and diversify plantings for resilience.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Weather
