const express = require('express');
const app = express();

const UserRoutes = require('./routes/user');
const CourseRoutes = require('./routes/course');
const PaymentRoutes = require('./routes/payment');
const ProfileRoutes = require('./routes/profile');

require('dotenv').config();
const database = require('./config/database');
const {cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");

const cookieParser = require('cookie-parser');
const cors = require('cors');

database.connect();
cloudinaryConnect();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(
    cors({
        origin:"http://localhost:3000",
        credentials:true
    })
)


app.use(
	fileUpload({
		useTempFiles:true,
		tempFileDir:"/tmp",
	})
)





app.use('/api/v1/auth',UserRoutes);
app.use('/api/v1/profile',ProfileRoutes);
app.use('/api/v1/payment',PaymentRoutes);
app.use('/api/v1/course',CourseRoutes);
app.listen(process.env.PORT, async () => {
    console.log(`Server started at port ${process.env.PORT}`);
})