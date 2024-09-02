const SubSection = require('../models/subSection');
const Section = require('../models/section');
const { uploadImageToCloudinary } = require('../utils/imageuploader');
require('dotenv').config();

//create subsection
exports.createSubSection = async (req, res) => {
    try {
        //fetch data
        const { title,description, sectionId,timeDuration } = req.body;
        //fetch file/video
        const videoFile = req.files.videoFile;
        //validation
        if (!title || !description || !sectionId || !videoFile || !timeDuration) {
            return res.status(400).json({
                success: false,
                message: "All field are required"
            });
        }
        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(videoFile, process.env.FOLDER_NAME);
        console.log(uploadDetails);
        //create new subsection in db
        const newSubSection = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url,
        });
        console.log("new is here",newSubSection);
        //update section by inserting new subsection
        const updatedSection = await Section.findByIdAndUpdate(
            {
                _id:sectionId
            },
            {
                $push:
                {
                    subSection: newSubSection._id
                }

            },
            {
                new: true
            }
        ).populate("subSection");
        //return response
        return res.status(200).json({
            success: true,
            message: "SubSection created successfully",
            data: updatedSection
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating Subsection",
        })
    }
}

//update subsection

exports.updateSubSection = async (req, res) => {
    try {
        //fetch data
        const { title, description,subsectionId,sectionId,timeDuration } = req.body;
        const subSection = await SubSection.findById(subsectionId);
        console.log(subSection);
        //validation
        if (!subSection) {
            return res.status(400).json({
                success: false,
                message: "Subsection not found"
            });
        }
        if (title !== undefined) {
            subSection.title = title
          }
      
          if (description !== undefined) {
            subSection.description = description
          }
          if (timeDuration !== undefined) {
            subSection.description = timeDuration;
          }
          if (req.files.video !== undefined) {
            const video = req.files.video;
            const uploadDetails = await uploadImageToCloudinary(video,process.env.FOLDER_NAME);
            console.log(uploadDetails);
            subSection.videoUrl = uploadDetails.secure_url;
            console.log('type is here');
            console.log(typeof(uploadDetails.secure_url));
          }
      
          await subSection.save();
          console.log("subsection is here",subSection)
          const updatedSection = await Section.findById(sectionId).populate(
            "subSection"
          )
        //return response
        return res.status(200).json({
            success: true,
            message: "SubSection updated successfully",
            data: updatedSection
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating Subsection",
        })
    }
}

// delete subsection
exports.deleteSubSection = async (req,res) => {
    try {
        //fetch data
        const {subsectionId, sectionId} = req.body;
        //validation
        if(!subsectionId || !sectionId) {
            return res.status(400).json({
                success:false,
                message:"All field are required"
            });
        }
        await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
              $pull: {
                subSection: subsectionId,
              },
            }
          )
        //update section
        const deletedSubSection = await SubSection.findByIdAndDelete({
            _id:subsectionId
        });
        if (!deletedSubSection) {
            return res
              .status(404)
              .json({ success: false, message: "SubSection not found" })
          }
      
        const updatedSection = await Section.findById(sectionId).populate(
            "subSection"
          )
        //return response
        return res.status(200).json({
            success:true,
            message:"SubSection deleted successfully",
            data:updatedSection
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting Subsection",
        })
    }
}

