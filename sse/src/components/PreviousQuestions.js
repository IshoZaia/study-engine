import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getPreviousQuestions } from '../services/authService';

const PreviousQuestionsPage = () => {
  const { courseId } = useParams(); // Extract courseId from the URL
  const [searchParams] = useSearchParams(); // Access query parameters
  const navigate = useNavigate(); // For navigation between pages

  const [questions, setQuestions] = useState([]); // Store questions
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentPage = parseInt(searchParams.get('page')) || 1; // Default to page 1
  const [totalGroups, setTotalGroups] = useState(0); // Store total number of groups

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await getPreviousQuestions(courseId, currentPage); // Fetch data
        console.log('Fetched data from API:', data); // Log the response from API
  
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          console.log('Setting questions state:', data.questions);
          setQuestions(data.questions); // Set questions in state
          setTotalGroups(data.totalGroups); // Set total groups
        } else {
          console.warn('No questions available in the response.');
          setError('No questions available for this group.');
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchQuestions();
  }, [courseId, currentPage]);

  const handleAnswerChange = (questionId, choice) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: choice }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let calculatedScore = 0;
    questions.forEach((question) => {
      if (userAnswers[question._id] === question.answer) {
        calculatedScore++;
      }
    });

    setScore(calculatedScore); // Update the score
    setShowResults(true); // Show the results
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalGroups) {
      navigate(`?page=${newPage}`); // Update the URL with new page number
    }
  };

  if (loading) return <div>Loading questions...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="w-full min-h-screen bg-gray-100 py-4">
      {!showResults ? (
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
                        className="mr-2 align-middle"
                      />
                      {choice}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
        </form>
      ) : (
        <div className="text-center text-lg font-semibold">
          <p>Your Score: {score} out of {questions.length}</p>
        </div>
      )}

      <div className="pagination text-center mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 rounded-lg mr-2"
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalGroups}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalGroups}
          className="px-4 py-2 bg-gray-300 rounded-lg ml-2"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PreviousQuestionsPage;
