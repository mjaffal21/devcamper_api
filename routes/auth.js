const express = require('express')
const {Register, Login, Logout , GetMe, ForgotPassword, resetPassword, UpdateDetails, UpdatePassword} = require('../controllers/auth')

const router = express.Router()
const {Protect} = require('../middlewares/auth')

router
    .route('/register')
    .post(Register)

router
    .route('/login')
    .post(Login)

router
    .route('/logout')
    .get(Logout)

router
    .route('/me')
    .get(Protect, GetMe)

router
    .route('/forgotpassword')
    .post(ForgotPassword)

router
    .route('/resetpassword/:resettoken')
    .put(resetPassword)

router
    .route('/updatedetails')
    .put(Protect, UpdateDetails)

router
    .route('/updatepassword')
    .put(Protect, UpdatePassword)

module.exports = router