const User = require('../models/user');
const mailSender = require('../utils/mailSender');
const bcrypt = require('bcrypt');
const crypto = require('crypto');


//resetPasswordToken

exports.resetPasswordToken = async (req, res) => {
    try {
        //get email from user
        const email = req.body.email;
        //validation
        const userExist = await User.findOne({ email: email });
        if (!userExist) {
            return res.status(401).json({
                success: false,
                message: "User not Exist"
            });
        }
        //generate token
        let token = crypto.randomUUID();
        //update user by adding token and expiry time
        const updatedDetails = await User.findOneAndUpdate({ email: email }, { token: token, resetPasswordExpires: Date.now() + 3600000 }, { new: true });
        // create url
        const url = `http://localhost:3000/update-password/${token}`;
        //send mail containing the url
        await mailSender(email, "Link  for Passowrd Reset", `Paasword reset link ${url}`);
        //return response
        return res.status(200).json(
            {
                success: true,
                message: "Email sent successfully"
            }
        );

    } catch (error) {
        return res.status(500).json(
            {
                success: false,
                message: "Something went wrong while reset password"
            }
        )
    }


}

//resetPassword

exports.resetPassword = async (req, res) => {
    try {
        //take new password and confirmed new password from user from user
        const { password, confirmedPassword, token } = req.body;
        //validation
        if (password !== confirmedPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and Confirmerd Password doesn't match"
            });
        }
        //get user detail from db using token
        const userDetails = await User.findOne({ token });
        //if no entry - invalid token
        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: "Token is invalid"
            });
        }
        //token time check
        if (userDetails.resetPasswordExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Token expire generate new link for reset password"
            });
        }
        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        //update new password
        await User.findOneAndUpdate(
            {
                token: token
            },
            {
                password: hashedPassword
            },
            {
                new: true
            }
        )
        //return response
        return res.status(200).json({
            success: true,
            message: "Password reset Successfully"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while reseting password"
        })
    }
}