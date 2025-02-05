const express = require('express');
const router = express.Router();

const{updateProfile,deleteAccount,updateDisplayPicture,instructorDashboard,getEnrolledCourses,getAllUserDetails} = require('../controllers/profile');
const {auth,isInstructor} = require('../middlewares/auth')
router.delete("/deleteProfile", auth, deleteAccount)

router.put("/updateProfile", auth, updateProfile)

router.get("/getUserDetails", auth, getAllUserDetails)

router.get("/getEnrolledCourses", auth, getEnrolledCourses)

router.put("/updateDisplayPicture", auth, updateDisplayPicture)

router.get("/instructorDashboard", auth, isInstructor, instructorDashboard)

module.exports = router;