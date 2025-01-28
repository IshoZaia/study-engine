const express = require('express');
const multer = require('multer');
const Course = require('../models/Course');
const path = require('path');
const User = require('../models/User')
const fs = require('fs');
const File = require('../models/File');
const authMiddleware = require('../middleware/authMiddleware');
const StudyGroup = require('../models/Studygroup');
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath); // Create the folder if it doesn't exist
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`); // Save with timestamp
    },
  });
  
  const upload = multer({ storage });

// Create a new course (authenticated user only)
router.post('/create', authMiddleware, async (req, res) => {
  const { name, emailFrequency, numQuestions } = req.body;

  try {
    const course = new Course({
      name,
      creator: req.user.userId, // Store the creator's ID
      members: [
        {
          userId: req.user.userId, // Add the creator as the first member
          totalCorrect: 0,         // Initialize their score
          totalQuestions: 0,
        },
      ],
      emailFrequency,
      numQuestions,
    });

    console.log('Creating course for user:', req.user.userId);

    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Error creating course', error });
  }
});

// Get all courses for the authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Find courses where the user is either a creator or a member
    const courses = await Course.find({
      $or: [
        { creator: req.user.userId }, // User is the creator
        { 'members.userId': req.user.userId }, // User is a member
      ],
    }).populate('file');
    res.json({ courses });
  } catch (error) {
    console.error('Error retrieving courses:', error);
    res.status(500).json({ message: 'Error retrieving courses', error });
  }
});

//Add member to a specific course
router.post('/:courseId/add-member', async (req, res) => {
  try {
    const { username } = req.body;
    const { courseId } = req.params;

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the user is already a member
    const isMember = course.members.some(
      (member) => member.userId.toString() === user._id.toString()
    );
    if (isMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Add the user to the course members
    course.members.push({ userId: user._id });
    await course.save();

    res.status(200).json({ message: 'User added as a member', member: user });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ message: 'Error adding member', error });
  }
});

// Delete a course (Only the creator can delete it)
router.delete('/:courseId', authMiddleware, async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Ensure only the creator can delete the course
    if (course.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this course' });
    }

    // Delete the course
    await Course.findByIdAndDelete(courseId);

    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Error deleting course', error });
  }
});



// Upload a file to a specific course
router.post('/upload/:courseId', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find the course by ID
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Ensure the user is the creator of the course
    if (course.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized. Only the creator can upload files.' });
    }

    const filePath = req.file.path; // Get the file path

    // Create a new file record
    const newFile = new File({
      name: req.file.originalname,
      filepath: filePath,
    });

    await newFile.save();

    // Delete old file if it exists
    if (course.file) {
      const oldFile = await File.findByIdAndDelete(course.file);
      if (oldFile) {
        fs.unlinkSync(oldFile.filepath); // Remove the old file from the file system
      }
    }

    // Assign the new file to the course
    course.file = newFile._id;
    await course.save();

    res.json({ message: 'File uploaded successfully', course });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error });
  }
});

// Update course configurations
router.put('/update/:courseId', authMiddleware, async (req, res) => {
  const { courseId } = req.params;
  const { emailFrequency, numQuestions } = req.body;

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Ensure only the creator can modify the course
    if (course.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized. Only the creator can modify this course.' });
    }

    // Update course configurations
    if (emailFrequency) course.emailFrequency = emailFrequency;
    if (numQuestions) course.numQuestions = numQuestions;

    await course.save();
    res.json({ message: 'Course updated successfully', course });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Error updating course', error });
  }
});

//generic get for questions (deprecated)
router.get('/questions/:courseId', authMiddleware, async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId).populate('newQuestions');
      if (!course) return res.status(404).json({ message: 'Course not found' });
  
      res.json(course.newQuestions);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching questions', error });
    }
  });
  
  //Get all previous questions, paginates through each group of questions
  router.get('/:courseId/previous-questions', authMiddleware, async (req, res) => {
    try {
      const { page = 1 } = req.query;
  
      // Fetch course and populate questions
      const course = await Course.findById(req.params.courseId).populate({
        path: 'previousQuestions.questions',
        model: 'Question',
      });
  
      // Log the course and question group
      console.log('Course:', course);
      if (!course || course.previousQuestions.length === 0) {
        return res.status(404).json({ message: 'No previous questions found.' });
      }
  
      const index = page - 1;
      const validIndex = index >= 0 && index < course.previousQuestions.length ? index : 0;
  
      const questionGroup = course.previousQuestions[validIndex];
  
      console.log('Question Group:', questionGroup); // Log the question group
  
      if (!questionGroup || questionGroup.questions.length === 0) {
        return res.status(404).json({ message: 'No questions available for this group.' });
      }
  
      // Log the final response to ensure it is being sent correctly
      console.log('Returning questions:', questionGroup.questions);
  
      res.status(200).json({
        currentPage: validIndex + 1,
        totalGroups: course.previousQuestions.length,
        questions: questionGroup.questions,
      });
    } catch (error) {
      console.error('Error fetching previous questions:', error);
      res.status(500).json({ message: 'Error fetching previous questions', error });
    }
  });
  
//Get questions for user
  router.get('/:courseId/questions/:userId', authMiddleware, async (req, res) => {
    const { courseId, userId } = req.params;
  
    try {
      // Fetch the course and ensure the user is a member
      const course = await Course.findById(courseId).populate('newQuestions');
      if (!course) return res.status(404).json({ message: 'Course not found' });
  
      const isMember = course.members.some((member) => member.userId.equals(userId));
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied. User is not part of this course.' });
      }
  
      // Return the new questions for this course
      res.json({ questions: course.newQuestions });
    } catch (error) {
      console.error('Error fetching personalized questions:', error);
      res.status(500).json({ message: 'Error fetching questions', error });
    }
  });
  
// Submit answer to questions for score
router.post('/submit/:courseId/:userId', authMiddleware, async (req, res) => {
  const { correctAnswers, totalQuestions } = req.body;
  const { courseId, userId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const member = course.members.find((m) => m.userId.toString() === userId);
    if (!member) return res.status(404).json({ message: 'Member not found in this course' });

    // Update member stats
    member.totalCorrect += correctAnswers;
    member.totalQuestions += totalQuestions;

    await course.save();
    res.status(200).json({ message: 'Answers submitted successfully', member });
  } catch (error) {
    console.error('Error submitting answers:', error);
    res.status(500).json({ message: 'Error submitting answers', error });
  }
});

//search for users, part of addMembers
  router.get('/search-users', authMiddleware, async (req, res) => {
    const { query } = req.query;
  
    try {
      const users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      }).select('username email'); // Only return relevant fields
  
      res.status(200).json(users);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'Error searching users', error });
    }
  });

// Add study group members to a specific course
router.post('/:courseId/add-study-group/:studyGroupId', authMiddleware, async (req, res) => {
  const { courseId, studyGroupId } = req.params;

  try {
    // Find the course by ID
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Ensure only the creator of the course can add a study group
    if (course.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized. Only the creator can add a study group.' });
    }

    // Find the study group by ID
    const studyGroup = await StudyGroup.findById(studyGroupId).populate('members', 'username');
    if (!studyGroup) return res.status(404).json({ message: 'Study group not found' });

    // Add each member of the study group to the course, if not already a member
    studyGroup.members.forEach(member => {
      const isAlreadyMember = course.members.some(
        courseMember => courseMember.userId.toString() === member._id.toString()
      );

      if (!isAlreadyMember) {
        course.members.push({
          userId: member._id,
          totalCorrect: 0,
          totalQuestions: 0,
        });
      }
    });

    await course.save();
    res.status(200).json({ message: 'Study group members added to course successfully', course });
  } catch (error) {
    console.error('Error adding study group to course:', error);
    res.status(500).json({ message: 'Error adding study group to course', error });
  }
});

module.exports = router;
