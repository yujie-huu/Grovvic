import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import './CompostingQuizPage.css';

const CompostingQuizPage = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questionStates, setQuestionStates] = useState({});
  const [showExitModal, setShowExitModal] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const questions = [
    {
      id: 1,
      question: "What is composting?",
      options: [
        "Burning organic waste to make fertilizer quickly",
        "Mixing soil with chemicals to boost plant growth",
        "Naturally breaking down organic materials into nutrient-rich soil",
        "Storing leftover food in sealed plastic bags"
      ],
      correctAnswer: 2,
      image: "https://live.staticflickr.com/65535/53874873897_a3b5f3d455_b.jpg",
      explanation: "Composting is decomposing organic materials like plant and food waste to create a mixture that is rich in nutrients and beneficial organisms. It improves soil fertility and reduces landfill waste!",
      learnMore: "https://www.epicgardening.com/composting-for-beginners/"
    },
    {
      id: 2,
      question: "Which four ingredients are important for effective composting?",
      options: [
        "Sand, clay, fertilizer, and sunlight",
        "Carbon, nitrogen, oxygen, and water", 
        "Leaves, worms, soil, and food",
        "Leftovers, eggshells, heat, and air"
      ],
      correctAnswer: 2,
      image: "https://live.staticflickr.com/5225/5660705731_8d03e59385_b.jpg",
      explanation: "Carbon is needed for energy. Its oxidation produces the heat required for composting. These tend to be brown and dry!" + 
        "\n\nNitrogen is needed to reproduce organisms and oxidize the carbon. These tend to be green and wet!" + 
        "\n\nOxygen is needed for the bacteria to perform decomposition." +
        "\n\nWater is needed to keep things moist, just enough to maintain activity without causing anaerobic conditions!",
      learnMore: "https://www.epicgardening.com/composting-for-beginners/"
    }
    
  ];

  const currentQ = questions[currentQuestion];
  const currentState = questionStates[currentQuestion] || { selectedAnswer: null, showAnswer: false };

  const handleAnswerSelect = (index) => {
    const newState = {
      ...currentState,
      selectedAnswer: index,
      showAnswer: true
    };
    
    setQuestionStates({
      ...questionStates,
      [currentQuestion]: newState
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleExit = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    navigate(-1);
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  const handleBackToQuiz = () => {
    setCurrentQuestion(questions.length - 1);
    setQuizCompleted(false);
  };

  // Congratulations page
  if (quizCompleted) {
    return (
      <div className="quiz-page">
        <div className="quiz-header">
          <div className="exit-button" onClick={handleExit}>
            <MdArrowBack />
          </div>
          <div className="quiz-title">Quiz</div>
        </div>
        
        <div className="congratulations-container">
          <div className="star-icon">⭐</div>
          <h1 className="congratulations-title">Congratulations!</h1>
          <p className="congratulations-text">You've completed this quiz.</p>
          <div className="congratulations-buttons">
            <button className="back-to-quiz-button" onClick={handleBackToQuiz}>
              Back to Quiz
            </button>
            <button className="quit-button" onClick={() => navigate(-1)}>
              Quit
            </button>
          </div>
        </div>

        {/* Exit confirmation modal */}
        {showExitModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Are you sure?</h3>
              <p>Quitting this course will remove all its data</p>
              <p>This action cannot be undone!</p>
              <div className="modal-buttons">
                <button className="modal-button cancel" onClick={cancelExit}>
                  No, go back
                </button>
                <button className="modal-button confirm" onClick={confirmExit}>
                  Quit quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="quiz-page">
      {/* Header */}
      <div className="quiz-header">
        <div className="exit-button" onClick={handleExit}>
          <MdArrowBack />
        </div>
        <div className="quiz-title">Quiz</div>
      </div>

      {/* Main content */}
      <div className="quiz-content">
        <div className="question-section">
          <div className="question-number">QUESTION {currentQuestion + 1}</div>
          <h2 className="question-text">{currentQ.question}</h2>
          
          <div className="options-container">
            {currentQ.options.map((option, index) => (
              <div 
                key={index}
                className={`option ${
                  currentState.selectedAnswer === index ? 'selected' : ''
                } ${
                  currentState.showAnswer && index === currentQ.correctAnswer ? 'correct' : ''
                } ${
                  currentState.showAnswer && currentState.selectedAnswer === index && index !== currentQ.correctAnswer ? 'incorrect' : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                <span className="option-text">{option}</span>
                {currentState.showAnswer && index === currentQ.correctAnswer && (
                  <span className="check-icon">✓</span>
                )}
                {currentState.showAnswer && currentState.selectedAnswer === index && index !== currentQ.correctAnswer && (
                  <span className="cross-icon">✗</span>
                )}
              </div>
            ))}
          </div>

          {/* Answer explanation */}
          {currentState.showAnswer && (
            <div className="answer-section">
              <h3>Answer</h3>
              <p className="explanation">{currentQ.explanation}</p>
              <a 
                href={currentQ.learnMore} 
                target="_blank" 
                rel="noopener noreferrer"
                className="learn-more-link"
              >
                LEARN MORE
              </a>
            </div>
          )}
        </div>

        {/* Image section */}
        <div className="image-section">
          <img 
            src={currentQ.image} 
            alt="Question illustration"
            className={`question-image ${currentState.showAnswer ? 'clear' : 'blurred'}`}
          />
        </div>
      </div>

      {/* Footer navigation */}
      <div className="quiz-footer">
        <button 
          className="nav-button" 
          onClick={handlePrev}
          disabled={currentQuestion === 0}
        >
          Prev
        </button>
        <div className="question-counter">
          {currentQuestion + 1} of {questions.length}
        </div>
        <button 
          className="nav-button next" 
          onClick={handleNext}
        >
          Next
        </button>
      </div>

      {/* Exit confirmation modal */}
      {showExitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Are you sure?</h3>
            <p>Quitting this course will remove all its data</p>
            <p>This action cannot be undone!</p>
            <div className="modal-buttons">
              <button className="modal-button cancel" onClick={cancelExit}>
                No, go back
              </button>
              <button className="modal-button confirm" onClick={confirmExit}>
                Quit quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompostingQuizPage;