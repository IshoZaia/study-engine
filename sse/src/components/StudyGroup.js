import { useState, useEffect } from 'react';
import {
  getStudyGroups,
  createStudyGroup,
  updateStudyGroup,
  addMemberToStudyGroup,
  searchUsers,
  deleteStudyGroup,
} from '../services/authService';

const StudyGroupsPage = () => {
  const [studyGroups, setStudyGroups] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStudyGroup, setNewStudyGroup] = useState({ name: '', memberIds: [] });
  const [loading, setLoading] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [selectedStudyGroupId, setSelectedStudyGroupId] = useState(null);

  // Fetch study groups on component mount
  useEffect(() => {
    const fetchStudyGroups = async () => {
      try {
        const studyGroups = await getStudyGroups();
        setStudyGroups(studyGroups);
      } catch (error) {
        console.error('Error fetching study groups:', error);
      }
    };
    fetchStudyGroups();
  }, []);

  // Handle creating a new study group
  const handleCreateStudyGroup = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setLoading(true);

    try {
      const data = await createStudyGroup(newStudyGroup);
      setStudyGroups([...studyGroups, data.studyGroup]);
      alert('Study group created successfully');
      setNewStudyGroup({ name: '', memberIds: [] });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating study group:', error);
      alert('Failed to create study group');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudyGroup = async (studyGroupId) => {
    try {
      await deleteStudyGroup(studyGroupId);
      alert('Study group deleted successfully');
      setStudyGroups((prevGroups) => prevGroups.filter((group) => group._id !== studyGroupId));
    } catch (error) {
      alert('Failed to delete study group');
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
    if (!selectedStudyGroupId) {
      alert('No study group selected');
      return;
    }
    setLoading(true);
    try {
      await addMemberToStudyGroup(selectedStudyGroupId, username);
      alert(`User ${username} added successfully to the study group`);
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
            <h2 className="text-2xl font-bold mb-4">Create a New Study Group</h2>
            <form onSubmit={handleCreateStudyGroup}>
              <input
                type="text"
                placeholder="Study Group Name"
                value={newStudyGroup.name}
                onChange={(e) => setNewStudyGroup({ ...newStudyGroup, name: e.target.value })}
                required
                className="w-full p-2 mb-2 border rounded"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-800"
              >
                {loading ? 'Creating...' : 'Create Study Group'}
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
            <button
              onClick={() => setIsAddMemberModalOpen(false)}
              className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">Your Study Groups</h1>
      {studyGroups.length > 0 ? (
        studyGroups.map((group) => (
          <div key={group._id} className="p-4 mb-4 bg-white rounded-lg shadow-lg relative">
            <button
              onClick={() => handleDeleteStudyGroup(group._id)}
              className="absolute top-2 left-2 text-red-600 hover:text-red-800 text-xl font-bold p-2"
              aria-label="Delete Study Group"
            >
              &times;
            </button>

            <div className="pl-8">
              <h2 className="text-xl font-bold">{group.name}</h2>
              <p>Members: {group.members.length}</p>
            </div>

            <button
              onClick={() => {
                setSelectedStudyGroupId(group._id);
                setIsAddMemberModalOpen(true);
              }}
              className="mt-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-800"
            >
              Add Members
            </button>
          </div>
        ))
      ) : (
        <p>No study groups available. Create one to get started!</p>
      )}
    </div>
  );
};

export default StudyGroupsPage;
