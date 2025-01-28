import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPersonalizedQuestions, submitAnswers } from '../services/authService';

const QuestionsPage = () => {
  const { courseId, userId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await getPersonalizedQuestions(courseId, userId);
        setQuestions(data.questions);
      } catch (err) {
        setError('Failed to load questions.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [courseId, userId]);

  const handleAnswerChange = (questionId, choice) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: choice }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    let calculatedScore = 0;
    questions.forEach((question) => {
      if (userAnswers[question._id] === question.answer) {
        calculatedScore++;
      }
    });
  
    setScore(calculatedScore);
    setShowResults(true);
  
    try {
      await submitAnswers(courseId, userId, {
        correctAnswers: calculatedScore,
        totalQuestions: questions.length,
      });
      alert(`You scored ${calculatedScore} out of ${questions.length}!`);
      navigate(`/courses`);
    } catch (err) {
      console.error('Error submitting answers:', err);
      alert('Failed to submit answers.');
    }
  };

  if (loading) {
    return <div className="text-center text-lg py-4">Please wait, questions are loading...</div>;
  }

  if (error) {
    return <div className="text-center text-lg text-red-600">{error}</div>;
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 py-4">
      <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
        {questions.map((question) => (
          <div key={question._id} className="bg-white shadow-lg rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-center mb-4">{question.text}</h2>
            <ul className="list-none">
              {question.choices.map((choice) => (
                <li key={choice} className="my-2">
                  <label className="block text-center">
                    <input
                      type="radio"
                      name={`question_${question._id}`}
                      value={choice}
                      onChange={() => handleAnswerChange(question._id, choice)}
                      disabled={showResults}
                      className="mr-2 align-middle"
                    />
                    <span
                      className={`${
                        showResults && choice === question.answer
                          ? 'text-green-600 font-semibold'
                          : 'text-gray-900'
                      }`}
                    >
                      {choice}
                    </span>
                    {showResults && userAnswers[question._id] === choice && choice !== question.answer && (
                      <span className="ml-2 text-red-600 font-semibold">(Your Choice)</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!showResults && (
          <div className="text-center">
            <button
              type="submit"
              className={`px-6 py-2 text-white rounded-lg ${
                Object.keys(userAnswers).length === questions.length
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={Object.keys(userAnswers).length !== questions.length}
            >
              Submit Answers
            </button>
          </div>
        )}
        {showResults && (
          <div className="text-lg font-semibold text-center">
            Score: {score} out of {questions.length}
          </div>
        )}
      </form>
    </div>
  );
};

export default QuestionsPage;
