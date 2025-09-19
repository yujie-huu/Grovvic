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
      correctAnswer: 1,
      image: "https://live.staticflickr.com/5225/5660705731_8d03e59385_b.jpg",
      explanation: "Carbon is needed for energy. Its oxidation produces the heat required for composting. These tend to be brown and dry!" + 
        "\n\nNitrogen is needed to reproduce organisms and oxidize the carbon. These tend to be green and wet!" + 
        "\n\nOxygen is needed for the bacteria to perform decomposition." +
        "\n\nWater is needed to keep things moist, just enough to maintain activity without causing anaerobic conditions!",
      learnMore: "https://www.epicgardening.com/composting-for-beginners/"
    },
    // {
    //   id: 3,
    //   question: "What is composting?",
    //   options: [
    //     "Autumn leaves - Carbon",
    //     "Meat - Keep out",
    //     "Pea straw - Carbon",
    //     "Lawn clippings - Nitrogen",
    //     "Hay - Carbon",
    //     "Cat and dog droppings - Keep out",
    //     "Garden prunings - Nitrogen",
    //     "Green leaves - Nitrogen",
    //     "Moistened cardboard - Carbon",
    //     "Onion - Keep out",
    //     "Kitchen scraps - Nitrogen",
    //     "Egg shells - Nitrogen",
    //     "Shredded newspaper - Carbon",
    //     "Glossy paper - Keep out",
    //     "Tea bags - Nitrogen",
    //     "Dairy products - Keep out",
    //     "Coffee grounds - Nitrogen",
    //     "Sick plants - Keep out"
    //   ],
    //   correctAnswer: 2,
    //   image: "/images/quiz_q3.png",
    //   explanation: "Build thin 3-10 cm layers. Alternate between nitrogen and carbon ingredients," + 
    //   " with a ratio of 1 nitrogen and 3 carbon. Large material should be cut up as small as possible. " + 
    //   "Add water in between the layers, enough to keep things moist but not soaking.",
    //   learnMore: "https://www.abc.net.au/gardening/how-to/compost/9433472 "
    // },
    {
      id: 4,
      question: "How can you add oxygen into your compost?",
      options: [
        "By putting the compost in plastic bags",
        "By keeping the compost pile underwater",
        "By adding more nitrogen-rich materials",
        "By regularly turning the compost"
      ],
      correctAnswer: 3,
      image: "https://images.stockcake.com/public/5/8/6/5862358d-25b8-4809-83db-e3765856ab19/gardening-with-worms-stockcake.jpg",
      explanation: "Turn the compost twice a week to allow oxygen to enter the pile. Aerobic microbes" + 
      " need oxygen to break things down quicker.",
      learnMore: "https://www.epicgardening.com/composting-for-beginners/"
    },
    {
      id: 5,
      question: "Choosing a composting system: What is the main advantage of using a triple-bin compost system?",
      options: [
        "It makes compost decompose instantly",
        "It separates different stages of composting and makes turning easier",
        "It prevents compost from ever needing to be turned",
        "It eliminates the need for carbon and nitrogen in composting"
      ],
      correctAnswer: 1,
      image: "https://live.staticflickr.com/5118/7386662744_c40d2b11c8_b.jpg ",
      explanation: "The triple-bin system splits the compost into:" + 
      "\n\n Bin 1: Filled with raw materials according to the proper ratio" +
      "\n\n Bin 2: Turned and aerated, monitoring the temperature regularly" +
      "\n\n Bin 3: Final aging and cooling process",
      learnMore: "https://www.epicgardening.com/composting-for-beginners/"
    },
    {
      id: 6,
      question: "Choosing a composting system: What is the main advantage of using a compost tumbler?",
      options: [
        "It is easy to turn with a handle, keeping pests out and providing good airflow",
        "It never requires moisture management",
        "It must be left open when not being turned to allow oxygen to enter",
        "It composts really quickly"
      ],
      correctAnswer: 0,
      image: "https://live.staticflickr.com/2532/3784646852_39549930ee_b.jpg",
      explanation: "Compost tumblers are compact, pest-proof, and easy to rotate," + 
      " making the process less labor-intensive!",
      learnMore: "https://www.epicgardening.com/composting-for-beginners/"
    },
    {
      id: 7,
      question: "Choosing a composting system: What is the main advantage of using a classic compost pile?",
      options: [
        "It uses expensive equipment and sealed containers",
        "It cannot be done without a compost tumbler",
        "It is the cheapest and simplest method",
        "It works the best when the pile is very small"
      ],
      correctAnswer: 2,
      image: "https://cdn12.picryl.com/photo/2016/12/31/dung-compost-heap-rallying-point-nature-landscapes-b416c9-1024.jpg",
      explanation: "A classic compost pile is cost-effective and simple, but it requires layering properly " + 
      "and turning frequently to heat up and break down properly.",
      learnMore: "https://www.epicgardening.com/composting-for-beginners/"
    },
    {
      id: 8,
      question: "Where is the ideal compost location? ",
      options: [
        "Right next to your back door",
        "On moisture-managing surface like wood chips, concrete, or hardened soil",
        "On a hill",
        "In full sun in hot climates",
        "Covered to prevent a soggy pile in wet climates",
        "In full to partial sun in cool and mild climates"
      ],
      correctAnswer: [1, 4, 5],
      image: "https://bpb-us-e2.wpmucdn.com/websites.umass.edu/dist/2/23786/files/2018/08/pano-sm-2.jpg",
      explanation: "a. You should locate it near your back door, but not close enough that bugs become an issue" + 
      "\n\nc. It should be on flat, level ground" +
      "\n\nd. It should be in partial shade in hot climates",
      learnMore: "https://www.epicgardening.com/composting-for-beginners/"
    },
    {
      id: 9,
      question: "If your compost smells bad, what is the most likely cause and solution?",
      options: [
        "It's too wet or there is not enough oxygen. Add some dry ingredients like shredded paper and mix to create air pockets",
        "It's too dry. Add more water to soak the pile",
        "It has too much nitrogen. Stop turning the pile and seal it tightly",
        "It has too much carbon. Add more nitrogen ingredients"
      ],
      correctAnswer: 0,
      image: "https://live.staticflickr.com/3140/2734302640_2bff2eb378_b.jpg",
      explanation: "A smelly compost pile usually means excess moisture or poor airflow." + 
      " Adding dry carbon ingredients and turning the pile helps restore balance.",
      learnMore: "https://www.abc.net.au/gardening/how-to/compost-troubles/9433510"
    },
    {
      id: 10,
      question: "If there are ants and slaters in your compost, what does it mean?",
      options: [
        "The heap is too wet. Add more dry materials",
        "The heap has too much nitrogen. Add more carbon materials",
        "The heap is finished and is ready to use",
        "The heap is too dry. Add a sprinkling of water or remove some dry materials"
      ],
      correctAnswer: 3,
      image: "https://cdn12.picryl.com/photo/2016/12/31/ants-wood-ants-formica-nature-landscapes-1d1297-1024.jpg",
      explanation: "Ants and slaters thrive in dry compost. Lightly watering or balancing with" + 
      " fewer dry materials will restore proper moisture levels.",
      learnMore: "https://www.sgaonline.org.au/pdfs/sg_melbourne.pdf"
    },
    {
      id: 11,
      question: "How can you tell when compost is ready to use in the garden?",
      options: [
        "It smells strong and sour, with visible food scraps",
        "It is warm and steamy in the middle of the pile",
        "It looks dark and crumbly, smells earthy, and does not have much recognizable materials",
        "It is crawling with ants and fresh insects"
      ],
      correctAnswer: 2,
      image: "https://live.staticflickr.com/3302/3251916048_39da389738_b.jpg",
      explanation: "Finished compost has a rich, soil-like texture and smell, with" + 
      "no visible kitchen or garden scraps.",
      learnMore: "https://www.theartofdoingstuff.com/how-to-know-if-your-compost-is-ready-to-use/"
    }
    
  ];

  const currentQ = questions[currentQuestion];
  const currentState = questionStates[currentQuestion] || { 
    selectedAnswers: [], 
    showAnswer: false 
  };

  // Check if current question is multiple choice
  const isMultipleChoice = Array.isArray(currentQ.correctAnswer);

  const handleAnswerSelect = (index) => {
    let newSelectedAnswers;
    
    if (isMultipleChoice) {
      // For multiple choice questions
      const currentAnswers = currentState.selectedAnswers || [];
      if (currentAnswers.includes(index)) {
        // Remove if already selected
        newSelectedAnswers = currentAnswers.filter(answer => answer !== index);
      } else {
        // Add to selection
        newSelectedAnswers = [...currentAnswers, index];
      }
    } else {
      // For single choice questions
      newSelectedAnswers = [index];
    }
    
    const newState = {
      ...currentState,
      selectedAnswers: newSelectedAnswers,
      showAnswer: !isMultipleChoice // Auto-show answer for single choice, not for multiple choice
    };
    
    setQuestionStates({
      ...questionStates,
      [currentQuestion]: newState
    });
  };

  // Add function to check if answer is complete for multiple choice
  const isAnswerComplete = () => {
    if (!isMultipleChoice) {
      return currentState.selectedAnswers && currentState.selectedAnswers.length > 0;
    }
    
    // For multiple choice, allow submission if at least one answer is selected
    // The user can submit even if they haven't selected all correct answers
    const selectedAnswers = currentState.selectedAnswers || [];
    return selectedAnswers.length > 0;
  };

  // Add function to show answer for multiple choice
  const handleShowAnswer = () => {
    const newState = {
      ...currentState,
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
            {currentQ.options.map((option, index) => {
              const isSelected = currentState.selectedAnswers && currentState.selectedAnswers.includes(index);
              
              // Fix the logic for checking correct/incorrect answers
              let isCorrect = false;
              let isIncorrect = false;
              
              if (currentState.showAnswer) {
                if (isMultipleChoice) {
                  // For multiple choice questions
                  isCorrect = currentQ.correctAnswer.includes(index);
                  isIncorrect = isSelected && !isCorrect;
                } else {
                  // For single choice questions
                  isCorrect = index === currentQ.correctAnswer;
                  isIncorrect = isSelected && !isCorrect;
                }
              }
              
              return (
                <div 
                  key={index}
                  className={`option ${
                    isSelected ? 'selected' : ''
                  } ${
                    isCorrect ? 'correct' : ''
                  } ${
                    isIncorrect ? 'incorrect' : ''
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                  <span className="option-text">{option}</span>
                  {isCorrect && (
                    <span className="check-icon">✓</span>
                  )}
                  {isIncorrect && (
                    <span className="cross-icon">✗</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit button for multiple choice questions */}
          {isMultipleChoice && !currentState.showAnswer && (
            <div className="submit-section">
              <button 
                className="submit-button"
                onClick={handleShowAnswer}
                disabled={!isAnswerComplete()}
              >
                Submit Answer
              </button>
            </div>
          )}

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