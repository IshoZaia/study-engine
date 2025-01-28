const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const studyRoutes = require('./routes/studygroupRoutes')
const cors = require('cors');
const cron = require('node-cron');
const Course = require('./models/Course');
const User = require('./models/User');
const Question = require('./models/Question');
const { generateQuestions } = require('./services/geminiService');
const sendEmail = require('./services/cronService');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });


const app = express();
app.use(cors({
    origin: 'http://localhost:5001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    credentials: true,
  }));
  app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/studygroup', studyRoutes);

//For TESTING PURPOSES, Sends email 1/min
//cron.schedule('*/1 * * * *', async () => {
//    console.log('Running 1-minute test cron job...');
//  await processCourses('daily');
 //});
cron.schedule('0 8 * * *', async () => {
    console.log('Running daily cron job...');
    await processCourses('daily');
  });
  
  // Cron job for weekly courses
  cron.schedule('0 8 * * 1', async () => {
    console.log('Running weekly cron job...');
    await processCourses('weekly');
  });

function generateQuestionLink(courseId, userId) {
  return `http://localhost:5001/courses/${courseId}/questions/${userId}`;
}

async function processCourses(frequency) {
  try {
    console.log(`Processing courses with frequency: ${frequency}`);


    const courses = await Course.find({ emailFrequency: frequency })
      .populate('file')
      .populate('creator', 'username email _id') 
      .populate('members.userId', 'username email _id'); 

    console.log(`Courses fetched:`, courses);

    for (const course of courses) {
      console.log(`Processing course: ${course.name}`);

      if (!course.file) {
        console.warn(`No file found for course: ${course.name}`);
        continue;
      }

      console.log(`File path: ${course.file.filepath}`);

      // Archive old newQuestions into previousQuestions
      if (course.newQuestions.length > 0) {
        const questionGroup = {
          id: `${course.name}-${new Date().getTime()}`, // Ensure unique ID
          questions: course.newQuestions,
        };
        course.previousQuestions.push(questionGroup);
        course.newQuestions = [];
      }

      // Generate new questions
      const numQuestions = course.numQuestions || 5;
      const newQuestions = await generateQuestions(course.file.filepath, numQuestions);

      console.log(`Generated questions for ${course.name}:`, newQuestions);

      if (Array.isArray(newQuestions) && newQuestions.length > 0) {
        const savedQuestions = await Question.insertMany(newQuestions);
        console.log(`Saved questions to DB:`, savedQuestions);
        course.newQuestions = savedQuestions.map((q) => q._id);
      } else {
        console.log(`No new questions generated for course: ${course.name}`);
      }

      // Send emails to all members
      for (const member of course.members) {
        if (!member.userId) {
          console.warn(`Member userId is not populated for course: ${course.name}`);
          continue;
        }

        const personalizedLink = generateQuestionLink(course._id, member.userId._id);
        const emailHtml = `
          <h1>New Questions for ${course.name}</h1>
          <p>Click the link below to access the latest questions:</p>
          <a href="${personalizedLink}">View Questions</a>
        `;

        try {
          await sendEmail({
            to: member.userId.email,
            subject: `New Questions for ${course.name}`,
            html: emailHtml,
          });
        } catch (emailError) {
          console.error(`Error sending email to ${member.userId.username}:`, emailError.message);
        }
      }
      // Save course changes
      await course.save();
    }
  } catch (error) {
    console.error('Error processing courses:', error.message);
  }
}

module.exports = { processCourses };

  
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
