const Category = require('../models/category');
const { Mongoose } = require("mongoose");
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }
//create tag 

exports.createCategory = async (req,res) => {
    try {
        //fetch data
        const {name,description} = req.body;
        //data validation
        if(!name || !description) {
            return res.status(400).json({
                success:false,
                message:"All field are required"
            });
        }
        //create entry in db
        const categoryDetails = await Category.create({
            name:name,
            description:description,
        });
        //return response
        return res.status(200).json({
            success:true,
            message:"Category created successfully",
            data:categoryDetails
        });
    } catch (error) {
        return res.status(500).json(
            {
                success:false,
                message:error.message
            }
        )
    }
}

//get all tags

exports.showAllCategories = async (req,res) => {
    try {
        const allCategory = await Category.find({}, {name:true,description:true});
        return res.status(200).json({
            success:true,
            message:"All Categories returned successfully",
            data:allCategory
        });
    } catch (error) {
        return res.status(500).json(
            {
                success:false,
                message:error.message
            }
        )
    }
}

//categoryPageDetails 

exports.categoryPageDetails = async (req, res) => {
    try {
      const { categoryId } = req.body
      // Get courses for the specified category
      const selectedCategory = await Category.findById(categoryId)
        .populate({
          path: "course",
          match: { status: "Published" },
          populate: "ratingAndReviews",
        })
        .exec()

      // Handle the case when the category is not found
      if (!selectedCategory) {
        console.log("Category not found.")
        return res
          .status(404)
          .json({ 
            success: false, 
            message: "Category not found" 
          })
      }
      // Handle the case when there are no courses
      if (selectedCategory.course.length === 0) {
        console.log("No courses found for the selected category.")
        return res.status(404).json({
          success: false,
          message: "No courses found for the selected category.",
        })
      }
  
      // Get courses for other categories
      const categoriesExceptSelected = await Category.find({
        _id: { $ne: categoryId },
      })
      let differentCategory = await Category.findOne(
        categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
          ._id
      )
        .populate({
          path: "courses",
          match: { status: "Published" },
        })
        .exec()
      // Get top-selling courses across all categories
      const allCategories = await Category.find()
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: {
            path: "instructor",
        },
        })
        .exec()
      const allCourses = allCategories.flatMap((category) => category.courses)
      const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
       // console.log("mostSellingCourses COURSE", mostSellingCourses)
      res.status(200).json({
        success: true,
        data: {
          selectedCategory,
          differentCategory,
          mostSellingCourses,
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }