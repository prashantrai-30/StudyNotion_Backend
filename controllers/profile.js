const mongoose = require('mongoose');
const Profile = require('../models/profile');
const User = require('../models/user');
const Course = require('../models/course');
const courseProgress = require('../models/courseProgress');
const { convertSecondsToDuration} = require('../utils/secToDuration');
const {uploadImageToCloudinary} = require('../utils/imageuploader');

exports.updateProfile = async (req,res) => {
    try {
        //fetch data
        const {firstName,lastName,gender="",dateOfBirth="",about="",contactNumber=""} = req.body;
        //get UserId
        const id = req.user.id;
        //find profile
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        console.log("profileId is",profileId);
        const profileDetails = await Profile.findById({_id:profileId});
        console.log(profileDetails);
        
        const user = await User.findByIdAndUpdate(id, {
            firstName,
            lastName
        });
        console.log("user is",user);
        await user.save();
        //update profile
        profileDetails.gender = gender;
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.contactNumber = contactNumber;
        console.log(profileDetails);
        await profileDetails.save();
        //find the updated user details
        const updatedUserDetails = await User.findById(id).populate("additionalDetails").exec();
        console.log(updatedUserDetails);
        //return profile
        return res.status(200).json({
            success:true,
            message:"Profile updated successfully",
            data:updatedUserDetails
        });
    } catch (error) {
      console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating profile",
        });
    }
}

//delete account

exports.deleteAccount = async (req,res) => {
    try {
        //fetch id
        const id = req.user.id;
        console.log(id);
        const user = await User.findById({_id:id});
        console.log(user);
        //validation
        if(!user) {
            return res.status(400).json({
                success:false,
                message:"User Not found"
            });
        }
        const profileId = user.additionalDetails;
        //delete user profile
        await Profile.findByIdAndDelete({
            _id: new mongoose.Types.ObjectId(profileId)
        });
        // delete association of user
        for(const courseId of user.courses) {
            await Course.findByIdAndUpdate(
                courseId,
                { $pull: { studentEnrolled: id}},
                {new:true}
            )
        }
        //delete user
        await User.findByIdAndDelete({_id:id});
        //return response
        return res.status(200).json({
            success:true,
            message:"Account deleted successfully",
        });
        await courseProgress.deleteMany({userId: id});
    } catch (error) {
      console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting Account",
        })
    }
}

exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }
  
  exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      let userDetails = await User.findOne({
        _id: userId,
      })
        .populate({
          path: "courses",
          populate: {
            path: "courseContent",
            populate: {
              path: "subSection",
            },
          },
        })
        .exec()
      userDetails = userDetails.toObject();
      var SubsectionLength = 0
      for (var i = 0; i < userDetails.courses.length; i++) {
        let totalDurationInSeconds = 0;
        SubsectionLength = 0;
        for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
          totalDurationInSeconds += userDetails.courses[i].courseContent[
            j
          ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
          userDetails.courses[i].totalDuration = convertSecondsToDuration(
            totalDurationInSeconds
          )
          SubsectionLength +=
            userDetails.courses[i].courseContent[j].subSection.length
        }
        let courseProgressCount = await CourseProgress.findOne({
          courseID: userDetails.courses[i]._id,
          userId: userId,
        })
        courseProgressCount = courseProgressCount?.completedVideos.length
        if (SubsectionLength === 0) {
          userDetails.courses[i].progressPercentage = 100
        } else {
          // To make it up to 2 decimal point
          const multiplier = Math.pow(10, 2)
          userDetails.courses[i].progressPercentage =
            Math.round(
              (courseProgressCount / SubsectionLength) * 100 * multiplier
            ) / multiplier
        }
      }
  
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }
  
  exports.instructorDashboard = async (req, res) => {
    try {
      const courseDetails = await Course.find({ instructor: req.user.id })
  
      const courseData = courseDetails.map((course) => {
        const totalStudentsEnrolled = course.studentsEnroled.length
        const totalAmountGenerated = totalStudentsEnrolled * course.price
  
        // Create a new object with the additional fields
        const courseDataWithStats = {
          _id: course._id,
          courseName: course.courseName,
          courseDescription: course.courseDescription,
          // Include other course properties as needed
          totalStudentsEnrolled,
          totalAmountGenerated,
        }
  
        return courseDataWithStats
      })
  
      res.status(200).json({ courses: courseData })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Server Error" })
    }
  }

  exports.getAllUserDetails = async (req, res) => {
    try {
      const id = req.user.id
      const userDetails = await User.findById(id)
        .populate("additionalDetails")
        .exec()
      console.log(userDetails)
      res.status(200).json({
        success: true,
        message: "User Data fetched successfully",
        data: userDetails,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }
