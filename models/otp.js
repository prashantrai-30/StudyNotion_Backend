const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');
const {otpTemplate} = require('../mail/templates/emailVerificationTemplate');

const OtpSchema = new mongoose.Schema({
   email:{
    type:String,
    required:true
   },
   otp:{
    type:String,
    required:true
   },
   createdAt: {
    type:Date,
    default:Date.now(),
    expires: 3000
   }
});

// function to send mail

async function sendVerificationEmail(email,otp) {
    try {
        const mailresponse = await mailSender(email,"OTP for Verification",otpTemplate(otp));
        console.log("email sent successfully",mailresponse);
    } catch (error) {
        console.log("error occured while sending mail",error);
        throw error;

    }
}

OtpSchema.pre("save", async function (next) {
    await sendVerificationEmail(this.email,this.otp);
    next();
})

module.exports = mongoose.model("Otp",OtpSchema);