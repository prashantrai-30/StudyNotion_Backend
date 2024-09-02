const Course = require('../models/course');
const Category = require('../models/category');
const User = require('../models/user');
const Section = require('../models/section');
const SubSection = require('../models/subSection');
const {uploadImageToCloudinary} = require('../utils/imageuploader')
const CourseProgress = require('../models/courseProgress');
const { convertSecondsToDuration} = require('../utils/secToDuration');
// create course
exports.createCourse = async (req,res) => {
    try {
    //fetch data
    const id = req.user.id;
    console.log(id);
    console.log(req.body);
    let {courseName,courseDescription, whatYouWillLearn,price,category,tag:_tag,instruction:_instructions,status} = req.body;
    //get thumbnail
    console.log(req.files.thumbnailImage);
    const thumbnail = req.files.thumbnailImage;
    //convert the tag aand instruction from atringified array to array
    const tag = typeof _tag === 'string' ? JSON.parse(_tag) : _tag;
    const instruction = typeof _instruction === 'string' ? JSON.parse(_instruction) : _instruction;
    console.log("tag",tag);
    console.log("instruction",instruction);
    //validation
    if(!courseName || !courseDescription || !tag.length || !instructions.length || !whatYouWillLearn || !price || !category || !thumbnail) {
        return res.status(400).json({
            success:false,
            message:"All field are required"
        });
    }
    
    if(!status || status === undefined) {
        status = "Draft"
    }
    // check for instructor(not for validation)
    const instructorDetails = await User.findById(id, {
        accountType:"Instructor"
    });
    console.log("Instructor details",instructorDetails);

    if(!instructorDetails) {
        return res.status(404).json({
            success:false,
            message:"Instructor not found"
        });
    }
    //check  given tag is valid or not
    const categoryDetails = await Category.findById(category);
    if(!categoryDetails) {
        return res.status(404).json({
            success:false,
            message:"category not found"
        });
    }
    //upload image to cloudinary
    const thumbnailImage = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME);
    // create entry in db
    const newCourse = await Course.create({
        courseName:courseName,
        courseDescription:courseDescription,
        instructor:instructorDetails._id,
        whatYouWillLearn:whatYouWillLearn,
        price:price,
        category:categoryDetails._id,
        thumbnail:thumbnailImage.secure_url,
        tag,
        instructions
    });
    //add new course to user schema for instructor
    await User.findByIdAndUpdate({
        _id:instructorDetails._id
    },
    {
        $push: {
            courses:newCourse._id
        }
    },
    {
        new:true
    });
    //add new course to Category schema
    await Category.findByIdAndUpdate({
        _id:categoryDetails._id
    },
    {
        $push:{
            course:newCourse._id
        }
    },
    {
        new:true
    });
    //return response
    console.log("new course is",newCourse);
    return res.status(200).json({
        success:true,
        message:"Course created successfully",
        data:newCourse
    });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating course",
        })
    }

}

exports.editCourse = async (req, res) => {
    try {
      const { courseId } = req.body
      const updates = req.body
      const course = await Course.findById(courseId)
  
      if (!course) {
        return res.status(404).json({ error: "Course not found" })
      }
  
      // If Thumbnail Image is found, update it
      if (req.files) {
        console.log("thumbnail update")
        const thumbnail = req.files.thumbnailImage
        const thumbnailImage = await uploadImageToCloudinary(
          thumbnail,
          process.env.FOLDER_NAME
        )
        course.thumbnail = thumbnailImage.secure_url
      }
  
      // Update only the fields that are present in the request body
      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key])
          } else {
            course[key] = updates[key]
          }
        }
      }
  
      await course.save()
  
      const updatedCourse = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }
  // Get Course List
  exports.getAllCourses = async (req, res) => {
    try {
      const allCourses = await Course.find(
        { status: "Published" },
        {
          courseName: true,
          price: true,
          thumbnail: true,
          instructor: true,
          ratingAndReviews: true,
          studentsEnrolled: true,
        }
      )
        .populate("instructor")
        .exec()
      console.log(allCourses);
      return res.status(200).json({
        success: true,
        data: allCourses,
      })
    } catch (error) {
      console.log(error)
      return res.status(404).json({
        success: false,
        message: `Can't Fetch Course Data`,
        error: error.message,
      })
    }
  }
  // Get One Single Course Details
  // exports.getCourseDetails = async (req, res) => {
  //   try {
  //     const { courseId } = req.body
  //     const courseDetails = await Course.findOne({
  //       _id: courseId,
  //     })
  //       .populate({
  //         path: "instructor",
  //         populate: {
  //           path: "additionalDetails",
  //         },
  //       })
  //       .populate("category")
  //       .populate("ratingAndReviews")
  //       .populate({
  //         path: "courseContent",
  //         populate: {
  //           path: "subSection",
  //         },
  //       })
  //       .exec()
  //     // console.log(
  //     //   "###################################### course details : ",
  //     //   courseDetails,
  //     //   courseId
  //     // );
  //     if (!courseDetails || !courseDetails.length) {
  //       return res.status(400).json({
  //         success: false,
  //         message: `Could not find course with id: ${courseId}`,
  //       })
  //     }
  
  //     if (courseDetails.status === "Draft") {
  //       return res.status(403).json({
  //         success: false,
  //         message: `Accessing a draft course is forbidden`,
  //       })
  //     }
  
  //     return res.status(200).json({
  //       success: true,
  //       data: courseDetails,
  //     })
  //   } catch (error) {
  //     return res.status(500).json({
  //       success: false,
  //       message: error.message,
  //     })
  //   }
  // }
  exports.getCourseDetails = async (req, res) => {
    try {
      const { courseId } = req.body
      const courseDetails = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
            select: "-videoUrl",
          },
        })
        .exec()
  
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find course with id: ${courseId}`,
        })
      }
  
      // if (courseDetails.status === "Draft") {
      //   return res.status(403).json({
      //     success: false,
      //     message: `Accessing a draft course is forbidden`,
      //   });
      // }
  
      let totalDurationInSeconds = 0
      courseDetails.courseContent.forEach((content) => {
        content.subSection.forEach((subSection) => {
          const timeDurationInSeconds = parseInt(subSection.timeDuration)
          totalDurationInSeconds += timeDurationInSeconds
        })
      })
  
      const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
  
      return res.status(200).json({
        success: true,
        data: {
          courseDetails,
          totalDuration,
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }
  exports.getFullCourseDetails = async (req, res) => {
    try {
      const { courseId } = req.body
      const userId = req.user.id
      const courseDetails = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      let courseProgressCount = await CourseProgress.findOne({
        courseID: courseId,
        userId: userId,
      })
  
      console.log("courseProgressCount : ", courseProgressCount)
  
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find course with id: ${courseId}`,
        })
      }
  
      // if (courseDetails.status === "Draft") {
      //   return res.status(403).json({
      //     success: false,
      //     message: `Accessing a draft course is forbidden`,
      //   });
      // }
  
      let totalDurationInSeconds = 0
      courseDetails.courseContent.forEach((content) => {
        content.subSection.forEach((subSection) => {
          const timeDurationInSeconds = parseInt(subSection.timeDuration)
          totalDurationInSeconds += timeDurationInSeconds
        })
      })
  
      const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
  
      return res.status(200).json({
        success: true,
        data: {
          courseDetails,
          totalDuration,
          completedVideos: courseProgressCount?.completedVideos
            ? courseProgressCount?.completedVideos
            : [],
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }
  
  // Get a list of Course for a given Instructor
  exports.getInstructorCourses = async (req, res) => {
    try {
      // Get the instructor ID from the authenticated user or request body
      const instructorId = req.user.id
  
      // Find all courses belonging to the instructor
      const instructorCourses = await Course.find({
        instructor: instructorId,
      }).sort({ createdAt: -1 })
  
      // Return the instructor's courses
      res.status(200).json({
        success: true,
        data: instructorCourses,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Failed to retrieve instructor courses",
        error: error.message,
      })
    }
  }
  // Delete the Course
  exports.deleteCourse = async (req, res) => {
    try {
      const { courseId } = req.body
  
      // Find the course
      const course = await Course.findById(courseId)
      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }
  
      // Unenroll students from the course
      const studentsEnrolled = course.studentsEnrolled
      for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
          $pull: { courses: courseId },
        })
      }
  
      // Delete sections and sub-sections
      const courseSections = course.courseContent
      for (const sectionId of courseSections) {
        // Delete sub-sections of the section
        const section = await Section.findById(sectionId)
        if (section) {
          const subSections = section.subSection
          for (const subSectionId of subSections) {
            await SubSection.findByIdAndDelete(subSectionId)
          }
        }
  
        // Delete the section
        await Section.findByIdAndDelete(sectionId)
      }
  
      // Delete the course
      await Course.findByIdAndDelete(courseId)
  
      return res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      })
    }
  }