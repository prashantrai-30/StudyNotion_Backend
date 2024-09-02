const express = require('express');
const router = express.Router();

const {auth} = require('../middlewares/auth');
const {signUp,logIn,sendOtp,changePassword}= require('../controllers/Auth');
const {resetPassword,resetPasswordToken} = require('../controllers/resetPassword');

router.post('/signup',signUp);

router.post('/login',logIn);

router.post('/sendotp',sendOtp);

router.post('/changepassword',changePassword);

router.post('/reset-password-token',resetPasswordToken);

router.post('/reset-password',resetPassword);


module.exports = router;