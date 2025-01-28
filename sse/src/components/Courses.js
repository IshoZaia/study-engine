import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getCourses,
  createCourse,
  uploadFile,
  updateCourse,
  addMember,
  searchUsers,
  deleteCourse,
  getStudyGroups, // Function to fetch study groups
  addStudyGroupToCourse // Function to add a study group to the course
} from '../services/authService';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    emailFrequency: 'daily',
    numQuestions: 5,
  });
  const [file, setFile] = useState({});
  const [loading, setLoading] = useState(false);
  const [courseUpdates, setCourseUpdates] = useState({});
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]); // Store study groups
  const [query, setQuery] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedStudyGroupId, setSelectedStudyGroupId] = useState(null); // Track selected study group

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courses = await getCourses();
        setCourses(courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  // Fetch study groups for the add members modal
  useEffect(() => {
    const fetchStudyGroups = async () => {
      try {
        const data = await getStudyGroups();
        setStudyGroups(data);
      } catch (error) {
        console.error('Error fetching study groups:', error);
      }
    };
    fetchStudyGroups();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setLoading(true);

    try {
      const { data } = await createCourse(newCourse);
      setCourses([...courses, data.course]);
      alert('Course created successfully');
      setNewCourse({ name: '', emailFrequency: 'daily', numQuestions: 5 });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await deleteCourse(courseId);
      alert('Course deleted successfully');
      setCourses((prevCourses) =>
        prevCourses.filter((course) => course._id !== courseId)
      );
    } catch (error) {
      alert('Failed to delete course');
    }
  };

  const handleUpload = async (courseId) => {
    if (!file[courseId]) {
      alert('Please select a file to upload');
      return;
    }
    setLoading(true);
    try {
      await uploadFile(courseId, file[courseId]);
      alert('File uploaded successfully');
      setFile((prev) => ({ ...prev, [courseId]: null }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      if (typingTimeout) clearTimeout(typingTimeout);

      const timeout = setTimeout(async () => {
        try {
          const data = await searchUsers(query);
          setUsers(data);
        } catch (error) {
          console.error('Error searching users:', error);
        }
      }, 300);

      setTypingTimeout(timeout);
    } else {
      setUsers([]);
    }

    return () => clearTimeout(typingTimeout);
  }, [query]);

  const handleAddMember = async (username) => {
    if (!selectedCourseId) {
      alert('No course selected');
      return;
    }
    setLoading(true);
    try {
      await addMember(selectedCourseId, username);
      alert(`User ${username} added successfully to the course`);
      setQuery('');
      setUsers([]);
      setIsAddMemberModalOpen(false);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudyGroup = async () => {
    if (!selectedCourseId || !selectedStudyGroupId) {
      alert('Please select a course and a study group');
      return;
    }
    setLoading(true);
    try {
      await addStudyGroupToCourse(selectedCourseId, selectedStudyGroupId);
      alert('Study group members added successfully to the course');
      setIsAddMemberModalOpen(false);
    } catch (error) {
      console.error('Error adding study group:', error);
      alert('Failed to add study group');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (courseId) => {
    setLoading(true);
    try {
      const updates = courseUpdates[courseId] || {};
      await updateCourse(courseId, updates);
      alert('Course updated successfully');
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (courseId, e) => {
    const selectedFile = e.target.files[0];
    setFile((prev) => ({ ...prev, [courseId]: selectedFile }));
  };

  const handleUpdateChange = (courseId, e) => {
    const { name, value } = e.target;
    setCourseUpdates((prev) => ({
      ...prev,
      [courseId]: { ...prev[courseId], [name]: value },
    }));
  };

  return (
    <div className="p-6">
      <button
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-800 z-50"
        onClick={() => setIsModalOpen(true)}
      >
        +
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Create a New Course</h2>
            <form onSubmit={handleCreateCourse}>
              <input
                type="text"
                placeholder="Course Name"
                value={newCourse.name}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, name: e.target.value })
                }
                required
                className="w-full p-2 mb-2 border rounded"
              />
              <select
                value={newCourse.emailFrequency}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, emailFrequency: e.target.value })
                }
                className="w-full p-2 mb-2 border rounded"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <input
                type="number"
                min="1"
                max="20"
                placeholder="Number of Questions"
                value={newCourse.numQuestions}
                onChange={(e) =>
                  setNewCourse({
                    ...newCourse,
                    numQuestions: parseInt(e.target.value, 10),
                  })
                }
                required
                className="w-full p-2 mb-4 border rounded"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-800"
              >
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-bold mb-4">Add Member</h2>
            <input
              type="text"
              placeholder="Search by username or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-2 mb-4 border rounded"
            />
            {users.length > 0 ? (
              <ul className="mb-4 max-h-48 overflow-y-auto border rounded">
                {users.map((user) => (
                  <li
                    key={user._id}
                    className="p-2 border-b cursor-pointer hover:bg-gray-200"
                    onClick={() => handleAddMember(user.username)}
                  >
                    {user.username} ({user.email})
                  </li>
                ))}
              </ul>
            ) : (
              query && <p>No users found</p>
            )}

            <h3 className="mt-4 mb-2 font-semibold">Or Add a Study Group:</h3>
            <select
              onChange={(e) => setSelectedStudyGroupId(e.target.value)}
              className="w-full p-2 mb-4 border rounded"
            >
              <option value="">Select a Study Group</option>
              {studyGroups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddStudyGroup}
              disabled={loading}
              className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-800 mb-2"
            >
              {loading ? 'Adding...' : 'Add Study Group to Course'}
            </button>
            <button
              onClick={() => setIsAddMemberModalOpen(false)}
              className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">Your Courses</h1>
      {courses.length > 0 ? (
        courses.map((course) => (
          <div key={course._id} className="p-4 mb-4 bg-white rounded-lg shadow-lg relative">
            <button
              onClick={() => handleDeleteCourse(course._id)}
              className="absolute top-2 left-2 text-red-600 hover:text-red-800 text-xl font-bold p-2"
              aria-label="Delete Course"
            >
              &times;
            </button>
            <div className="pl-8">
              <h2 className="text-xl font-bold">{course.name}</h2>
              <p>Email Frequency: {course.emailFrequency}</p>
              <p>Number of Questions: {course.numQuestions}</p>
            </div>
            <input
              type="file"
              onChange={(e) => handleFileChange(course._id, e)}
              className="mt-2"
            />
            <button
              onClick={() => handleUpload(course._id)}
              disabled={loading}
              className="mt-2 p-2 bg-green-600 text-white rounded hover:bg-green-800"
            >
              {loading ? 'Uploading...' : 'Upload File'}
            </button>
            <h3 className="mt-4">Update Course</h3>
            <select
              name="emailFrequency"
              onChange={(e) => handleUpdateChange(course._id, e)}
              value={
                courseUpdates[course._id]?.emailFrequency || course.emailFrequency
              }
              className="w-full p-2 mb-2 border rounded"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <input
              type="number"
              name="numQuestions"
              min="1"
              max="20"
              placeholder="Number of Questions"
              onChange={(e) => handleUpdateChange(course._id, e)}
              value={
                courseUpdates[course._id]?.numQuestions || course.numQuestions
              }
              className="w-full p-2 mb-4 border rounded"
            />
            <button
              onClick={() => handleUpdateCourse(course._id)}
              disabled={loading}
              className="p-2 bg-yellow-600 text-white rounded hover:bg-yellow-800"
            >
              {loading ? 'Updating...' : 'Update Course'}
            </button>

            <button
              onClick={() => {
                setSelectedCourseId(course._id);
                setIsAddMemberModalOpen(true);
              }}
              className="mt-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-800"
            >
              Add Members
            </button>

            <Link
              to={`/courses/${course._id}/previous-questions`}
              className="block mt-4 text-blue-600 hover:underline"
            >
              View Previous Questions
            </Link>
          </div>
        ))
      ) : (
        <p>No courses available. Create one to get started!</p>
      )}
    </div>
  );
};

export default CoursesPage;
