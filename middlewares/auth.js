const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/user');
const { response } = require('express');

//auth
exports.auth = async (req, res, next) => {
    try {
        // extract token
        const token = req.cookies.token ||
            req.body.token ||
            req.header("Authorisation").replace("Bearer ", "");
        // if token is missing then return response
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is missing"
            });
        }
        // Vefify the token
        try {
            const decode = await jwt.verify(token, process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode;
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "token is invalid"
            })
        }
        next();
    } catch (error) {
        return res.status(401).json({
            succcess: false,
            message: "Something went wrong while validating token"
        })
    }
}

//isStudent

exports.isStudent = async (req,res,next) => {
    try {
        if(req.user.accountType !== "Student") {
            return res.status(401).json({
                success:false,
                message:"This is a protected route for student only"
            });
        }
        next();
    } catch (error) {
        return res.status(501).json({
            success:false,
            message:"User role can't be verified"
        })
    }
}

//isInstructor

exports.isInstructor = async (req,res,next) => {
    try {
        if(req.user.accountType !== "Instructor") {
            return res.status(401).json({
                success:false,
                message:"This is a protected route for instrutor only"
            });
        }
        next();
    } catch (error) {
        return res.status(501).json({
            success:false,
            message:"User role can't be verified"
        })
    }
}

//isAdmin

exports.isAdmin = async (req,res,next) => {
    try {
        console.log(req.user.accountType);
        if(req.user.accountType !== "Admin") {
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Admin only"
            });
        }
        next();
    } catch (error) {
        return res.status(501).json({
            success:false,
            message:"User role can't be verified"
        })
    }
}