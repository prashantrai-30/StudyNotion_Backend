const express = require('express');
const router = express.Router();

const {createCourse,getAllCourses,getCourseDetails,getFullCourseDetails,editCourse,getInstructorCourses,deleteCourse,} = require("../controllers/course");
const {showAllCategories,createCategory,categoryPageDetails,} = require("../controllers/category");

const {createSection,updateSection,deleteSection,} = require("../controllers/section");
  
const {createSubSection,updateSubSection,deleteSubSection,} = require("../controllers/subSection");

const {createRating,getAverageRating,getAllRating,} = require("../controllers/ratingAndReview");
  
const {updateCourseProgress} = require("../controllers/courseProgress");
  
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth");

// course route
router.post("/createCourse", auth, isInstructor, createCourse);

router.get("/getAllCourses", getAllCourses);

router.post("/getCourseDetails", getCourseDetails);

router.post("/getFullCourseDetails", auth, getFullCourseDetails);

router.post("/editCourse", auth, isInstructor, editCourse);

router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses);

router.delete("/deleteCourse", deleteCourse);

router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);

//section route
router.post("/addSection", auth, isInstructor, createSection);

router.post("/updateSection", auth, isInstructor, updateSection);

router.post("/deleteSection", auth, isInstructor, deleteSection);

//category route
router.post("/createCategory", auth, isAdmin, createCategory);

router.get("/showAllCategories", showAllCategories);

router.post("/getCategoryPageDetails", categoryPageDetails);
// subsection route
router.post("/updateSubSection", auth, isInstructor, updateSubSection);

router.post("/deleteSubSection", auth, isInstructor, deleteSubSection);

router.post("/addSubSection", auth, isInstructor, createSubSection);

// rating and review route
router.post("/createRating", auth, isStudent, createRating);

router.get("/getAverageRating", getAverageRating);

router.get("/getReviews", getAllRating);

  

module.exports = router;