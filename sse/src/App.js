import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import CoursesPage from './components/Courses';
import QuestionsPage from './components/Questions';
import PreviousQuestionsPage from './components/PreviousQuestions';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Partials/Navbar';
import StudyGroupsPage from './components/StudyGroup';
function App() {
  return (
    <Router>
      <Navbar /> {/* Render Navbar */}
      <Routes>
        {/* Public Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId/questions/:userId" element={<QuestionsPage />} />
          <Route path="/courses/:courseId/previous-questions" element={<PreviousQuestionsPage />} />
          <Route path="/studygroup" element={<StudyGroupsPage />} />
        </Route>

        {/* Redirect all other routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
