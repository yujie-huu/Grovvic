import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Support.css";

const Support = () => {
  const [faqContent, setFaqContent] = useState("");
  const [parsedData, setParsedData] = useState([]);
  const [openSection, setOpenSection] = useState(null);
  const [openQuestion, setOpenQuestion] = useState({});

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

    </div>
  );
};
export default Support;
