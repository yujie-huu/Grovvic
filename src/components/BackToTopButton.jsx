import { useState, useEffect } from "react";
import "./BackToTopButton.css";
import { MdArrowUpward } from "react-icons/md";

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Listen to scroll events
  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled more than 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  // Click to scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Don't render component if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="back-to-top-container">
      <button
        className="back-to-top-button"
        onClick={scrollToTop}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Back to top"
      >
        <MdArrowUpward/>
      </button>
      {showTooltip && (
        <div className="back-to-top-tooltip">
          Back to top
        </div>
      )}
    </div>
  );
}