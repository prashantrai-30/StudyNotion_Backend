const User = require('../models/user');
const Otp = require('../models/otp');
const Profile = require('../models/profile');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailSender = require('../utils/mailSender');
require('dotenv').config();
const {passwordUpdated} = require('../mail/templates/passwordUpdate');

//Send OTP
exports.sendOtp = async (req, res) => {

    try {
        // fetch email from request body
        const { email } = req.body;

        //check user alraedy exits
        const checkUserPresent = await User.findOne({ email });
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: "User Already Register"
            });
        }
        //generate otp
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
        console.log("OTP", otp);

        //check uniquness of otp
        let duplicateOtp = await Otp.findOne({ otp: otp });
        while (duplicateOtp) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false
            });
            duplicateOtp = await Otp.findOne({ otp: otp });
        }
        const otpPayload = { email, otp };

        //create an entry for OTP
        const otpBody = await Otp.create(otpPayload);
        console.log("OTP body",otpBody);

        //return response Successfull
        res.status(200).json({
            success: true,
            message: "OTP sent Successfully"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }

}

//signup

exports.signUp = async (req, res) => {
    try {
        //data fetch from user request body
        const { firstName, lastName, email, password, confirmedPassword,accountType, otp } = req.body;
        // Validation
        if (!firstName || !lastName || !email || !password || !confirmedPassword || !accountType || !otp) {
            return res.status(403).json({
                success: false,
                message: "All field are required"
            })
        }
        // match password and confirmed password
        if (password !== confirmedPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and Confirmed Password doesn't match"
            });
        }
        // check user already exists or not 
        const checkUserPresent = await User.findOne({ email });
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: "User Already Register"
            });
        }
        //find most recent otp
        const recentOtp = await Otp.find({ email }).sort({ createdAt: -1 }).limit(1);
      

        //Validate otp
        if (recentOtp.length == 0) {
            return res.status(400).json({
                success: false,
                message: "OTP not found"
            })
        }
        else if (otp !== recentOtp[0].otp) {
            return res.status(400).json({
                success: false,
                message: "Otp invalid"
            })
        }
        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);
        // entry create in DB

        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber:null
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            accountType,
            additionalDetails: profileDetails,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        });
        // return res
        return res.status(200).json({
            success: true,
            message: "User Created Successfully",
            data:user
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "User can't be registered"
        });
    }
}

// Login

exports.logIn = async (req, res) => {
    try {
        // get data from req body
        const { email, password } = req.body;
        // validate data
        if (!email || !password) {
            return res.status(403).json({
                success: false,
                message: "All field are required"
            });
        }
        // user exist or not
        const user = await User.findOne({ email }).populate("additionalDetails");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }
        // match password and generate token
        if (await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "2h"
            });
            user.token = token;
            user.password = undefined;
            // create cookie and send response
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                message: "logged in successfully",
                user,
                token
            })
        }
        else {
            return res.status(401).json({
                success:false,
                message:"Password is incorrect"
            })
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Login Failed"
        })
    }

}

// change Password

exports.changePassword = async (req, res) => {
    try {
      // Get user data from req.user
      const id = req.user.id;
      const userDetails = await User.findById(id)
  
      // Get old password, new password, and confirm new password from req.body
      const { oldPassword, newPassword } = req.body;
      if(! oldPassword || !newPassword) {
        return res.status(403).json({
            success: false,
            message: "All field are required"
        });
      }
      // Validate old password
      const isPasswordMatch = await bcrypt.compare(
        oldPassword,
        userDetails.password
      )
      if (!isPasswordMatch) {
        // If old password does not match, return a 401 (Unauthorized) error
        return res
          .status(401)
          .json({ success: false, message: "The password is incorrect" })
      }
  
      // Update password
      const encryptedPassword = await bcrypt.hash(newPassword, 10)
      const updatedUserDetails = await User.findByIdAndUpdate(
        id,
        { password: encryptedPassword },
        { new: true }
      )
  
      // Send notification email
      try {
        const emailResponse = await mailSender(
          updatedUserDetails.email,
          "Password for your account has been updated",
          passwordUpdated(
            updatedUserDetails.email,
            `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
          )
        )
        console.log("Email sent successfully:", emailResponse.response)
      } catch (error) {
        // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while sending email:", error)
        return res.status(500).json({
          success: false,
          message: "Error occurred while sending email",
          error: error.message,
        })
      }
  
      // Return success response
      return res
        .status(200)
        .json({ success: true, message: "Password updated successfully" })
    } catch (error) {
      // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while updating password:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while updating password",
        error: error.message,
      })
    }
  }