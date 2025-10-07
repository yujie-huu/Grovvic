import React, { useEffect, useState,useRef} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Support.css";

const Support = () => {
  const [faqContent, setFaqContent] = useState("");
  const [parsedData, setParsedData] = useState([]);
  const [openSection, setOpenSection] = useState(null);
  const [openQuestion, setOpenQuestion] = useState({});
  const [communityData, setCommunityData] = useState([]);

  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0 });
  
  const trackRef = useRef(null);

  // 映射表：标题 → 图片路径
  const imageMap = {
    "Hume City Council – Community Gardens": "/images/support_community_1.png",
    "Cultivating Community": "/images/support_community_2.webp",
    "Open Gardens Victoria": "/images/support_community_3.png",
    "Community Gardens Australia (ACFCGN)": "/images/support_community_4.jpg",
    "Gardens for Wildlife Victoria": "/images/support_community_5.png",
  };

  // 从 public 目录加载 markdown 文件
  useEffect(() => {
    fetch("/faq/faq.md")
      .then((res) => res.text())
      .then((text) => setFaqContent(text))
      .catch((err) => console.error("Error loading FAQ:", err));
  }, []);

  // 解析 markdown 文本结构
  useEffect(() => {
    if (!faqContent) return;

    const lines = faqContent.split("\n");
    const data = [];
    let currentSection = null;
    let currentQuestion = null;

    for (const line of lines) {
      if (line.startsWith("## ")) {
        currentSection = { section: line.replace("## ", "").trim(), items: [] };
        data.push(currentSection);
      } else if (line.startsWith("### ")) {
        currentQuestion = {
          q: line.replace("### ", "").trim(),
          a: [],
        };
        currentSection?.items.push(currentQuestion);
      } else if (line.match(/^\d+\./)) {
        currentQuestion?.a.push(line.replace(/^\d+\.\s*/, "").trim());
      }
    }
    setParsedData(data);
  }, [faqContent]);

  const toggleSection = (idx) => {
    setOpenSection(openSection === idx ? null : idx);
  };

  const toggleQuestion = (sIdx, qIdx) => {
    setOpenQuestion((prev) => {
      const key = `${sIdx}`;
      const cur = prev[key] === qIdx ? null : qIdx;
      return { ...prev, [key]: cur };
    });
  };


  // ✅ 读取 community.md 文件
  useEffect(() => {
    fetch("/community/community.md")
      .then((res) => res.text())
      .then((text) => {
        // 拆分每个条目：根据空行分块
        const blocks = text
          .split(/\n\s*\n/) // 两个换行表示一个项目
          .map((b) => b.trim())
          .filter(Boolean);

        // 每个 block 包含 3 行：标题、链接、描述
        const parsed = blocks.map((block) => {
          const lines = block.split("\n").filter(Boolean);

          // 去掉标题前的 ##
          const rawTitle = lines[0]?.trim() || "";
          const title = rawTitle.replace(/^#+\s*/, "");

          // ✅ 链接识别逻辑
          let url = lines[1]?.trim() || "";
          const match = url.match(/\((https?:\/\/[^\s)]+)\)/);
          if (match) url = match[1];
          if (url && !url.startsWith("http")) url = "https://" + url;

          const desc = lines.slice(2).join(" ").trim() || "";

          // ✅ 添加图片路径映射
          const img = imageMap[title] || "/images/default.png";

          return { title, url, desc, img };
        });

        setCommunityData(parsed);
      })
      .catch((err) => console.error("Failed to load community.md:", err));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    track.addEventListener("mousedown", (e) => {
      isDown = true;
      track.classList.add("active");
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    track.addEventListener("mouseleave", () => {
      isDown = false;
      track.classList.remove("active");
    });

    track.addEventListener("mouseup", () => {
      isDown = false;
      track.classList.remove("active");
    });

    track.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1; // 移动速度
      track.scrollLeft = scrollLeft - walk;
    });
  }, []);

// 鼠标拖拽
const onMouseDown = (e) => {
  if (!trackRef.current) return;
  setIsDragging(true);
  dragState.current.startX =
    e.pageX - trackRef.current.getBoundingClientRect().left;
  dragState.current.scrollLeft = trackRef.current.scrollLeft;
};

const onMouseMove = (e) => {
  if (!isDragging || !trackRef.current) return;
  e.preventDefault();
  const x = e.pageX - trackRef.current.getBoundingClientRect().left;
  const walk = x - dragState.current.startX;
  trackRef.current.scrollLeft = dragState.current.scrollLeft - walk;
};

const onMouseUpOrLeave = () => setIsDragging(false);

// 触摸滑动
const onTouchStart = (e) => {
  if (!trackRef.current) return;
  const touch = e.touches[0];
  setIsDragging(true);
  dragState.current.startX =
    touch.pageX - trackRef.current.getBoundingClientRect().left;
  dragState.current.scrollLeft = trackRef.current.scrollLeft;
};

const onTouchMove = (e) => {
  if (!isDragging || !trackRef.current) return;
  const touch = e.touches[0];
  const x = touch.pageX - trackRef.current.getBoundingClientRect().left;
  const walk = x - dragState.current.startX;
  trackRef.current.scrollLeft = dragState.current.scrollLeft - walk;
};

const onTouchEnd = () => setIsDragging(false);

// ✅ 滚轮逻辑：文字滚动完全独立，不会触发横向滚动
useEffect(() => {
  const el = trackRef.current;
  if (!el) return;

  const onWheelNative = (e) => {
    const pElement = e.target.closest(".local-program-card p");

    if (pElement) {
      const canScroll = pElement.scrollHeight > pElement.clientHeight;

      if (canScroll) {
        const atTop = pElement.scrollTop === 0;
        const atBottom =
          pElement.scrollTop + pElement.clientHeight >= pElement.scrollHeight - 1;

        // ✅ 文字区可滚时允许默认行为，不传递给外层
        // 即使在顶或底，也阻止事件冒泡，防止卡片滑动
        if (e.deltaY < 0 && atTop) {
          e.preventDefault();
          return;
        }
        if (e.deltaY > 0 && atBottom) {
          e.preventDefault();
          return;
        }

        // 允许文字区滚动（上下）
        return;
      }
    }

    // ✅ 非文字区才执行横向滚动
    e.preventDefault();
    const delta =
      Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    el.scrollLeft += delta * 3; // 横向灵敏度调整
  };

  el.addEventListener("wheel", onWheelNative, { passive: false });
  return () => el.removeEventListener("wheel", onWheelNative);
}, []);



  return (
    <div className="support-page">
      {/* 背景图区域 */}
      <div
        className="support-hero"
        style={{
          backgroundImage: "url(/images/support_1.jpg)", // ✅ 仅保留动态部分
        }}
      >
        <div className="support-hero-content">
          <h1>
            Hello,
            <br /> How can we help?
          </h1>
          <p>Find the answer to your gardening questions.</p>
          <input
            type="text"
            placeholder="Search"
            className="support-search"
          />
        </div>
      </div>

      {/*FAQ布局*/}
      <section className="support-section">
        <h2>Frequently Asked Questions</h2>
        <div className="support-faq-grid">
          {/* 左边 FAQ 列表 */}
          <ul className="support-links">
            {parsedData.map((sec, sIdx) => (
              <li key={sIdx}>
                <button
                  className={`support-link ${openSection === sIdx ? "is-open" : ""}`}
                  onClick={() => toggleSection(sIdx)}
                >
                  <span className="left">
                    <span className="dot"></span>
                    <span className="text">{sec.section}</span>
                  </span>
                  <span className="chevron"></span>
                </button>

                {/* ✅ 如果展开小标题，显示其中的问题 */}
                {openSection === sIdx && (
                  <ul className="faq-questions">
                    {sec.items.map((item, qIdx) => {
                      const isOpen = openQuestion[`${sIdx}`] === qIdx;
                      return (
                        <li key={qIdx}>
                          <button
                            className={`question-link ${isOpen ? "is-open" : ""}`}
                            onClick={() => toggleQuestion(sIdx, qIdx)}
                          >
                            {item.q}
                          </button>
                          {isOpen && (
                            <div className="answer">
                              <ol>
                                {item.a.map((step, i) => (
                                  <li key={i}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>


          {/* 右边 FAQ 配图 */}
          <div className="faq-right">
            <img
              src="/images/support_2.jpg"   // ✅ 这里用 public 下的路径
              alt="FAQ illustration"
              className="faq-side-image"
            />
          </div>
        </div>
      </section>

      {/* Local Programs Section */}
      <section className="local-programs-section">
        <div className="local-programs-header">
          <p>DISCOVER MORE</p>
          <h2>LOCAL GOVERNMENT PROGRAMS</h2>
        </div>

        <div className="local-programs-cards">
          {/* 卡片 1 */}
          <div className="local-program-card">
            <div className="local-program-body">
              <img src="/images/support_local_1.png" alt="Gardens for Harvest" />
              <h3>GARDENS FOR HARVEST</h3>
              <p>
                A free program offering home-growing guides, seasonal tips,
                workshops, and community connections to support sustainable
                food gardening at home—even in small spaces.
              </p>
            </div>
            <div className="local-program-divider"></div>
            <a href="#" className="local-program-link">LEARN MORE</a>
          </div>

          {/* 卡片 2 */}
          <div className="local-program-card">
            <div className="local-program-body">
              <img src="/images/support_local_2.png" alt="Gardens for Wildlife Victoria" />
              <h3>GARDENS FOR WILD LIFE VICTORIA</h3>
              <p>
                A statewide network supporting wildlife-friendly gardens,
                building skills, partnerships, and community connections
                through resources and workshops.
              </p>
            </div>
            <div className="local-program-divider"></div>
            <a href="#" className="local-program-link">LEARN MORE</a>
          </div>

          {/* 卡片 3 */}
          <div className="local-program-card">
            <div className="local-program-body">
              <img src="/images/support_local_3.png" alt="My Smart Garden" />
              <h3>MY SMART GARDEN</h3>
              <p>
                A free program run by partner councils across Melbourne,
                offering education and support for sustainable home gardening.
              </p>
            </div>
            <div className="local-program-divider"></div>
            <a href="#" className="local-program-link">LEARN MORE</a>
          </div>

          {/* 卡片 4 */}
          <div className="local-program-card">
            <div className="local-program-body">
              <img src="/images/support_local_4.png" alt="Victorian Schools Garden Program" />
              <h3>VICTORIAN SCHOOLS GARDEN PROGRAM</h3>
              <p>
                Supports student learning, health, and wellbeing by encouraging
                schools to use outdoor spaces and build lifelong connections
                with nature.
              </p>
            </div>
            <div className="local-program-divider"></div>
            <a href="#" className="local-program-link">LEARN MORE</a>
          </div>
        </div>
      </section>
      
      {/* Local Gardening Communities Section */}
      <section className="local-communities-section">
        <div className="local-communities-header">
          <h2>LOCAL GARDENING COMMUNITIES</h2>
        </div>

        <div
          ref={trackRef}
          className="local-communities-track"
          role="region"
          aria-label="Local communities horizontal scroller"
          // 鼠标拖拽
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUpOrLeave}
          onMouseLeave={onMouseUpOrLeave}
          // 触摸滑动
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          // 注意：这里不再挂 React 的 onWheel，使用原生监听（见 useEffect）
        >
          {communityData.map((item, idx) => (
            <div className="local-program-card community-card" key={idx}>
              <img src={item.img} alt={item.title} className="community-card-img" />

              <div className="local-program-body">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>

              <div className="local-program-divider"></div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="local-program-link"
              >
                LEARN MORE
              </a>
            </div>
          ))}
        </div>
      </section>




    </div>
  );
};
export default Support;
