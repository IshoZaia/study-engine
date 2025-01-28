const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const StudyGroup = require('../models/Studygroup');
const User = require('../models/User');
const router = express.Router();

// Create a new study group (authenticated user only)
router.post('/create', authMiddleware, async (req, res) => {
  const { name, memberIds } = req.body;

  try {
    const studyGroup = new StudyGroup({
      name,
      creator: req.user.userId, // Store the creator's ID
      members: memberIds,
    });

    await studyGroup.save();
    res.status(201).json({ message: 'Study group created successfully', studyGroup });
  } catch (error) {
    console.error('Error creating study group:', error);
    res.status(500).json({ message: 'Error creating study group', error });
  }
});

// Get all study groups created by the authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const studyGroups = await StudyGroup.find({ creator: req.user.userId }).populate('members', 'username email');
    res.json({ studyGroups });
  } catch (error) {
    console.error('Error retrieving study groups:', error);
    res.status(500).json({ message: 'Error retrieving study groups', error });
  }
});

// Get a specific study group by ID (only creator can access)
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const studyGroup = await StudyGroup.findById(id).populate('members', 'username email');
    if (!studyGroup) return res.status(404).json({ message: 'Study group not found' });

    // Ensure only the creator can access this study group
    if (studyGroup.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized access to this study group' });
    }

    res.json(studyGroup);
  } catch (error) {
    console.error('Error retrieving study group:', error);
    res.status(500).json({ message: 'Error retrieving study group', error });
  }
});

// Update a study group (only creator can modify)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, addMembers, removeMembers } = req.body;

  try {
    const studyGroup = await StudyGroup.findById(id);
    if (!studyGroup) return res.status(404).json({ message: 'Study group not found' });

    // Ensure only the creator can modify this study group
    if (studyGroup.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to modify this study group' });
    }

    // Update name if provided
    if (name) studyGroup.name = name;

    // Add members if provided
    if (addMembers && Array.isArray(addMembers)) {
      addMembers.forEach((memberId) => {
        if (!studyGroup.members.includes(memberId)) {
          studyGroup.members.push(memberId);
        }
      });
    }

    // Remove members if provided
    if (removeMembers && Array.isArray(removeMembers)) {
      studyGroup.members = studyGroup.members.filter(
        (memberId) => !removeMembers.includes(memberId.toString())
      );
    }

    await studyGroup.save();
    res.json({ message: 'Study group updated successfully', studyGroup });
  } catch (error) {
    console.error('Error updating study group:', error);
    res.status(500).json({ message: 'Error updating study group', error });
  }
});

// Delete a study group (only creator can delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const studyGroup = await StudyGroup.findById(id);
    if (!studyGroup) return res.status(404).json({ message: 'Study group not found' });

    // Ensure only the creator can delete this study group
    if (studyGroup.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this study group' });
    }

    await StudyGroup.findByIdAndDelete(id);
    res.status(200).json({ message: 'Study group deleted successfully' });
  } catch (error) {
    console.error('Error deleting study group:', error);
    res.status(500).json({ message: 'Error deleting study group', error });
  }
});

router.post('/:studyGroupId/add-member', authMiddleware, async (req, res) => {
    const { studyGroupId } = req.params;
    const { username } = req.body;
  
    try {
      // Find the study group by ID
      const studyGroup = await StudyGroup.findById(studyGroupId);
      if (!studyGroup) return res.status(404).json({ message: 'Study group not found' });
  
      // Ensure only the creator can add members to the study group
      if (studyGroup.creator.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Unauthorized. Only the creator can add members to this study group.' });
      }
  
      // Find the user by username
      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // Check if the user is already a member
      const isAlreadyMember = studyGroup.members.some(
        (memberId) => memberId.toString() === user._id.toString()
      );
  
      if (isAlreadyMember) {
        return res.status(400).json({ message: 'User is already a member of this study group' });
      }
  
      // Add the user to the study group's members
      studyGroup.members.push(user._id);
      await studyGroup.save();
  
      res.status(200).json({ message: 'User added to study group successfully', member: user });
    } catch (error) {
      console.error('Error adding member to study group:', error);
      res.status(500).json({ message: 'Error adding member to study group', error });
    }
  });
module.exports = router;
