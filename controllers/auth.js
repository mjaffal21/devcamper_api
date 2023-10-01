const crypto = require('crypto')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middlewares/async')
const sendEmail = require('../utils/sendEmail')
const User = require('../models/User')

// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public
exports.Register = asyncHandler(async(req, res,next) => {
    const {name, email, password, role} = req.body
    // Create User
    const user = await User.create({
        name,
        email,
        password,
        role
    })
    // Create Token
    const token = user.getSignedJwtToken()
    res.status(200).json({ success: true, token})
})

// @desc    Login User
// @route   POST /api/v1/auth/login
// @access  Public
exports.Login = asyncHandler(async(req, res,next) => {
    const {email, password} = req.body
    // Validate email & password
    if(!email || !password){
        return next(new ErrorResponse('Please provide an email or password', 400))
    }
    // Check for user
    const user = await User.findOne({email: email}).select('+password')
    if(!user){
        return next(new ErrorResponse('Invalid Credentials', 401))
    }
    const isMatch = await user.matchPassword(password)
    if(!isMatch){
        return next(new ErrorResponse('Invalid Credentials', 401))
    }
    sendTokenResponse(user, 200, res)
})

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Public
exports.Logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get Logged User
// @route   GET /api/v1/auth/me
// @access  Private
exports.GetMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id)
    res.status(200).json({
        success: true,
        data: user
    })
})

// @desc      Update user details
// @route     PUT /api/v1/auth/updatedetails
// @access    Private
exports.UpdateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
    };
  
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });
  
    res.status(200).json({
      success: true,
      data: user,
    });
});

// @desc      Update password
// @route     PUT /api/v1/auth/updatepassword
// @access    Private
exports.UpdatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');
    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return next(new ErrorResponse('Password is incorrect', 401));
    }
    user.password = req.body.newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
});

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.ForgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({email: req.body.email})
    if(!user){
        return next(new ErrorResponse('there is no user with that email', 404))
    }
    // Get reset token
    const resetToken = user.getResetPasswordToken()

    await user.save({validateBeforeSave: false})

    const resetUrl = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
    });
    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Email could not be sent', 500));
  }
})

// @desc      Reset password
// @route     PUT /api/v1/auth/resetpassword/:resettoken
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');
  
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
  
    if (!user) {
      return next(new ErrorResponse('Invalid token', 400));
    }
  
    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
  
    sendTokenResponse(user, 200, res);
  });
  

// Get Token From Model, Create Cookie, and Send Response
const sendTokenResponse = (user, statusCode, res) => {
    // Create Token
    const token = user.getSignedJwtToken()
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    }
    if(process.env.NODE_ENV === 'production'){
        options.secure = true
    }
    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token
        })
}