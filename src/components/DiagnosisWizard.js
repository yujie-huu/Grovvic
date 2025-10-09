import React, { useMemo, useState } from "react";
// 默认使用你项目中的 JSON 数据
import rawData from "../data/US5.2_Data_final_nested_fixed.json";

/**
 * DiagnosisWizard
 * 增强：Category → Problem → Do you(Y/N)
 *       - 选 Yes：进入 Does it... 列表 → 选中后 Next → 显示 Likely cause（可返回上一级换别的“Does it...”）
 *       - 选 No ：立即显示 Do you 的 No 对应内容
 */
export default function DiagnosisWizard({
  data = rawData,
  onCategoryChange,
  onProblemChange,
  onStepDone, // 在查看到最终 cause 时也回调（可选）
}) {
  const categories = useMemo(() => Object.keys(data || {}), [data]);
  const [step, setStep] = useState("category");

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);

  // Do you（Y/N）选择结果
  const [doYouAnswer, setDoYouAnswer] = useState(null); // "Yes" | "No"



  // 选中的 “Does it …” step question
  const [selectedCauseStepQ, setSelectedCauseStepQ] = useState(null);
  const green = "#4E6F50";
  const greenDark = "#3F5A40";

  // —— 工具函数 —— //
  const strip = (s = "") =>
    s
      .replace(/^Category:\s*/i, "")
      .replace(/^Problem:\s*/i, "")
      .replace(/^Step Question:\s*/i, "");

  const currentProblemNode = useMemo(() => {
    if (!selectedCategory || !selectedProblem) return null;
    const catObj = data[selectedCategory] || {};
    const probObj = catObj[selectedProblem] || {};
    // 唯一的“Do you …”键
    const doYouKey = Object.keys(probObj).find((k) => /^Step Question:\s*Do you/i.test(k));
    if (!doYouKey) return null;
    const doYouObj = probObj[doYouKey]; // { Yes: { 'Step Question: Does it ...': [...] }, No: '...' }
    return { doYouKey, doYouObj };
  }, [data, selectedCategory, selectedProblem]);

  const problems = useMemo(() => {
    if (!selectedCategory) return [];
  const problemObj = data[selectedCategory] || {};
    return Object.keys(problemObj);
  }, [data, selectedCategory]);

  // “Does it …” 列表
  const causeStepQuestions = useMemo(() => {
    if (!currentProblemNode || doYouAnswer !== "Yes") return [];
    const yesObj = currentProblemNode.doYouObj?.Yes || {};
    return Object.keys(yesObj || {}); // 一组 “Step Question: Does it …”
  }, [currentProblemNode, doYouAnswer]);

  // 取得选中 “Does it …” 的 Answer=Yes 文本（Likely cause…）
  const selectedCauseText = useMemo(() => {
    if (!selectedCauseStepQ || !currentProblemNode) return "";
    const yesObj = (currentProblemNode.doYouObj && currentProblemNode.doYouObj.Yes) || {};
    const arr = yesObj[selectedCauseStepQ];
    if (!Array.isArray(arr)) return "";
    // 形如:
    // [
    //   ["Answer=Yes", "Likely cause: ... Suggested solution: ..."],
    //   ["Answer=No",  "Try next possible cause." / "Explore alternative causes."]
    // ]
    const yesRow = arr.find((r) => r[0]?.toLowerCase?.() === "answer=yes");
    return yesRow?.[1] || "";
  }, [currentProblemNode, selectedCauseStepQ]);

  // Do you = No 时显示的内容
  const doYouNoText = useMemo(() => {
    if (!currentProblemNode) return "";
    return (currentProblemNode.doYouObj && currentProblemNode.doYouObj.No) || "";
  }, [currentProblemNode]);

  // —— 导航 —— //
  const handleNext = () => {
    if (step === "category") {
      if (selectedCategory) {
        setStep("problem");
      }
      return;
    }

    if (step === "problem") {
      if (selectedProblem) {
        setStep("doYou");
      }
      return;
    }

    if (step === "doYou") {
      if (doYouAnswer === "Yes") {
        setStep("causePicker");
      }
      // doYouAnswer === "No" 时页面即刻显示 No 文本（在本 step 就显示，不需要 Next）
      return;
    }

    if (step === "causePicker") {
      if (selectedCauseStepQ) {
        setStep("causeView");
        onStepDone?.({
          categoryKey: selectedCategory,
          problemKey: selectedProblem,
        });
      }
      return;
    }
    // step === "causeView" 时，不再有下一步（按需求）
  };

  const handlePrev = () => {
    if (step === "problem") {
      // 返回 Category
      setStep("category");
      setSelectedProblem(null);
      setDoYouAnswer(null);
      setSelectedCauseStepQ(null);
      return;
    }
    if (step === "doYou") {
      // 返回 Problem
      setStep("problem");
      setDoYouAnswer(null);
      setSelectedCauseStepQ(null);
      return;
    }
    if (step === "causePicker") {
      // 返回 Do you
      setStep("doYou");
      setSelectedCauseStepQ(null);
      return;
    }
    if (step === "causeView") {
      // 返回 “Does it …” 列表
      setStep("causePicker");
      return;
    }
  };

  // —— UI 样式（与你之前的一致/兼容） —— //
  const styles = {
    wrapper: {
      width: "100vw",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "60px 16px",
      color: "#222",
      backgroundImage: "url('/images/diagnose.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
    },
    heroBanner: {
      background: "transparent",
      backgroundSize: "cover",
      backgroundPosition: "center",
      padding: "32px 20px",
      textAlign: "center",
      borderRadius: "12px",
      marginBottom: "8px",
    },
    heroTitle: {
      fontSize: "34px",
      fontWeight: 800,
      color: "#000",
      marginBottom: "30px",
      marginTop: "-40px",
      lineHeight: "1.25", 
    },
    heroSubtitle: {
      fontSize: "18px",
      fontWeight: 300,
      color: "#1a1a1a",  
      maxWidth: "600px",
      margin: "0 auto -20px",
      whiteSpace: "nowrap",
    },
    cardContainer: {
      background: "#f8fafc", // 更通透的亮白
      borderRadius: "0px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      padding: "28px 28px 36px",
      maxWidth: "760px",
      width: "92%",
      margin: "0 auto 60px",
      manHeight: "650px",
      textAlign: "center",
    },
    title: {
      fontSize: 32,
      fontWeight: 800,
      margin: "0 0 8px",
      color: "#1a1a1a",
      letterSpacing: "0.4px",
    },
    badge: {
      display: "inline-block",
      background: green,
      color: "#fff",
      borderRadius: 6,
      padding: "6px 14px",
      marginLeft: 8,
      fontSize: 34,
      fontWeight: 600,
    },
    subtitle: {
      color: "#1a1a1a",
      marginBottom: 16,
    },
    card: {
      borderRadius: 12,
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      overflow: "hidden",
      margin: "0 auto",
      textAlign: "left",
      border: "1px solid #e9edf0",
      maxWidth: "500px",
    },
    header: {
      background: green,
      color: "#fff",
      padding: "14px 18px",
      fontSize: 20,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerText: {
  whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    option: {
      width: "100%",
  textAlign: "left",
      background: "#fff",
      border: "none",
      borderTop: "1px solid #eee",
      padding: "16px 18px",
      fontSize: 16,
      cursor: "pointer",
    },
    optionActive: {
      background: "#f3f7f3",
      color: greenDark,
      fontWeight: 700,
    },
    footer: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      margin: "20px auto 0",
      width: "100%",
      maxWidth: 520,
      padding: "0 12px",
    },
    primaryBtn: {
      background: green,
      color: "#fff",
      border: "none",
      padding: "12px 28px",
      borderRadius: 28,
      fontSize: 16,
      fontWeight: 600,
      cursor: "pointer",
    },
    secondaryBtn: {
      background: "#fff",
      color: green,
      border: `1px solid ${green}`,
      padding: "10px 18px",
      borderRadius: 28,
      fontSize: 16,
      fontWeight: 600,
      cursor: "pointer",
    },
    // Yes/No 按钮容器
    yesNoWrap: {
      display: "flex",
      gap: 12,
      padding: "16px 18px",
      background: "#fff",
      borderTop: "1px solid #eee",
    },
    yesNoBtn: {
      flex: 1,
      padding: "12px 16px",
      borderRadius: 10,
      border: "1px solid #dcdcdc",
      background: "#fff",
      cursor: "pointer",
      fontSize: 16,
      fontWeight: 600,
    },
    yesNoBtnActive: {
      background: "#f3f7f3",
      color: greenDark,
      borderColor: "#cbd5d8",
    },
    resultBox: {
      background: "#fff",
      padding: "20px",
      borderTop: "1px solid #eee",
      fontSize: 16,
      lineHeight: 1.6,
      color: "#2a2a2a",
    },
  };

  // —— 头部（绿色条） —— //
  function SelectHeader({ label }) {
    return (
      <div style={styles.header}>
        <span style={styles.headerText}>{label}</span>
      </div>
    );
  }

  // —— 列表 —— //
  function OptionList({
    items = [],
    selected,
    onSelect,
    renderLabel = (x) => x,
    maxVisible = 4,
    scrollWhenMoreThan = 4,
  }) {
    const itemHeight = 56;
    const willScroll = items.length > scrollWhenMoreThan;
    const fixedHeight = maxVisible * itemHeight;

    return (
      <div
        style={{
          borderTop: "1px solid #dcdcdc",
          borderRadius: "0 0 10px 10px",
          overflowY: willScroll ? "auto" : "hidden",
          maxHeight: willScroll ? fixedHeight : "auto",
          background: "#fff",
        }}
      >
        {items.map((key) => {
          const isActive = selected === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                ...styles.option,
                ...(isActive ? styles.optionActive : {}),
              }}
              title={renderLabel(key)}
            >
              {renderLabel(key)}
            </button>
          );
        })}
      </div>
    );
  }

  // —— 主体渲染 —— //
  const currentTitleBadge = step === "category" ? "Category" :
                            step === "problem"  ? "Problem"  :
                            step === "doYou"    ? "Symptom"  :
                            step === "causePicker" ? "Symptom" : "Possible Cause & Solution";

  const selectHeaderLabel =
    step === "category"
      ? selectedCategory
        ? strip(selectedCategory)
        : "Select a category"
      : step === "problem"
      ? selectedProblem
        ? strip(selectedProblem)
        : "Select a problem"
      : step === "doYou"
      ? (currentProblemNode ? strip(currentProblemNode.doYouKey) : "Confirm the symptom")
      : step === "causePicker"
      ? (selectedCauseStepQ ? strip(selectedCauseStepQ) : "Select a symptom")
      : strip(selectedCauseStepQ || "Result");

  // “Do you …” 的 No 结果视图（在 doYou 步骤内就显示）
  const showDoYouNoResult = step === "doYou" && doYouAnswer === "No" && !!doYouNoText;

  // causeView 仅显示 Answer=Yes 的描述
  const showCauseView = step === "causeView" && !!selectedCauseText;

  const parsedCause = useMemo(() => {
    if (!selectedCauseText) return { cause: "", solution: "" };
    const parts = selectedCauseText.split(/Suggested\s*solution:\s*/i);
    return {
      cause: (parts[0] || "").trim(),       // 含 "Likely cause: ..."
      solution: (parts[1] || "").trim(),    // 仅内容，不含前缀
    };
  }, [selectedCauseText]);


  return (
    <div style={styles.wrapper}>
      {/* 顶部标题（不在白卡片内） */}
      <div style={{ ...styles.heroBanner }}>
        <h1 style={{ ...styles.heroTitle }}>Didn’t find your answer?</h1>
        <p style={styles.heroSubtitle}>
          Try our interactive diagnosis tool to identify plant issues and discover the right fix.
        </p>
      </div>

      {/* 白色卡片 */}
      <div style={styles.cardContainer}>
        {/* 标题 */}
        <h1 style={{ fontSize: 34, fontWeight:600, margin: "30px 0 35px" }}>
          Select the{" "}
          <span style={styles.badge}>{currentTitleBadge}</span>
        </h1>
        <p style={styles.subtitle}>
          {step === "category"
            ? "Choose the general type of problem (leaves, flowers, roots, or pests)."
            : step === "problem"
            ? "Pick the specific issue that best matches your plant’s condition."
            : step === "doYou"
            ? "Confirm whether you are seeing this symptom."
            : step === "causePicker"
            ? "Select the symptom that looks closest to what you see."
            : "Review the likely cause and follow the suggested solution."
          }
        </p>

        {/* 主卡片 */}
        <div style={styles.card}>
          <SelectHeader label={selectHeaderLabel} />

          {/* Category 选择 */}
          {step === "category" && (
            <OptionList
              items={categories}
              selected={selectedCategory}
              onSelect={(key) => {
                setSelectedCategory(key);
                setSelectedProblem(null);
                setDoYouAnswer(null);
                setSelectedCauseStepQ(null);
                onCategoryChange?.(key);
              }}
              renderLabel={strip}
              maxVisible={4}
            />
          )}

          {/* Problem 选择 */}
          {step === "problem" && (
            <OptionList
              items={problems}
              selected={selectedProblem}
              onSelect={(key) => {
                setSelectedProblem(key);
                setDoYouAnswer(null);
                setSelectedCauseStepQ(null);
                onProblemChange?.(key);
              }}
              renderLabel={strip}
              scrollWhenMoreThan={4}
            />
          )}

          {/* Do you（Yes/No） */}
          {step === "doYou" && currentProblemNode && (
            <div style={styles.yesNoWrap}>
              <button
                style={{
                  ...styles.yesNoBtn,
                  ...(doYouAnswer === "Yes" ? styles.yesNoBtnActive : {}),
                }}
                onClick={() => {
                  setDoYouAnswer("Yes");
                  setSelectedCauseStepQ(null);
                }}
              >
                Yes
              </button>
              <button
                style={{
                  ...styles.yesNoBtn,
                  ...(doYouAnswer === "No" ? styles.yesNoBtnActive : {}),
                }}
                onClick={() => {
                  setDoYouAnswer("No");
                  setSelectedCauseStepQ(null);
                }}
              >
                No
              </button>
            </div>
          )}

          {/* Do you = No 时，直接显示对应内容 */}
          {showDoYouNoResult && (
            <div style={styles.resultBox}>
              {doYouNoText}
            </div>
          )}

          {/* 选择 “Does it …” */}
          {step === "causePicker" && (
            <OptionList
              items={causeStepQuestions}
              selected={selectedCauseStepQ}
              onSelect={(key) => setSelectedCauseStepQ(key)}
              renderLabel={strip}
              scrollWhenMoreThan={4}
            />
          )}

          {/* 最终原因视图（仅显示 Answer=Yes 的 Likely cause 文本） */}
          {showCauseView && (
            <div style={styles.resultBox}>
              <div>{parsedCause.cause}</div>
                {parsedCause.solution && (
                  <div style={{ marginTop: 12 }}>
                    <div>Suggested solution:{parsedCause.solution}.</div>
                    <div></div>
                  </div>
                )}
            </div>
          )}

        </div>

        {/* 底部按钮区 */}
        <div style={styles.footer}>
          {/* 返回按钮：problem 之后的步骤都可返回 */}
          {(step === "problem" || step === "doYou" || step === "causePicker" || step === "causeView") ? (
            <button onClick={handlePrev} style={styles.secondaryBtn}>
              Previous
            </button>
          ) : (
            <div />   /* 空占位，保证布局对齐 */
          )}

          {/* Next 按钮：在 causeView 不再显示（按需求 “不再有下一个 next”） */}
          {step !== "causeView" && (
            <button
              onClick={handleNext}
              style={{
                ...styles.primaryBtn,
                opacity:
                  (step === "category" && !selectedCategory) ||
                  (step === "problem" && !selectedProblem) ||
                  (step === "doYou" && doYouAnswer === null) ||
                  (step === "causePicker" && !selectedCauseStepQ)
                    ? 0.6
                    : 1,
                cursor:
                  (step === "category" && !selectedCategory) ||
                  (step === "problem" && !selectedProblem) ||
                  (step === "doYou" && doYouAnswer === null) ||
                  (step === "causePicker" && !selectedCauseStepQ)
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={
                (step === "category" && !selectedCategory) ||
                (step === "problem" && !selectedProblem) ||
                (step === "doYou" && doYouAnswer === null) ||
                (step === "causePicker" && !selectedCauseStepQ)
              }
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
