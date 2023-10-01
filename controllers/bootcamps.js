const path = require('path')
const Bootcamp = require('../models/Bootcamp')
const Course = require('../models/Course')
const Review = require('../models/Review')
const geocoder = require('../utils/geocoder')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middlewares/async')

// @desc    Get All Bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.GetAllBootcamps = asyncHandler(async(req, res,next) => {
    res.status(200).json(res.advancedResults)
})

// @desc    Get Specific Bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.GetBootcampById = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    if(!bootcamp){
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404))
    }
    res.status(200).json({success: true, data: bootcamp})
})

// @desc    Create Bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private
exports.CreateBootcamp =asyncHandler(async(req, res, next) => {
    req.body.user = req.user.id
    // Check for published Bootcamps
    const publishedBootcamp = await Bootcamp.findOne({user: req.user.id})
    if(publishedBootcamp && req.user.role !== 'admin'){
        return next(new ErrorResponse(`The user with id ${req.user.id} has already published a bootcamp`, 400))
    }
    const bootcamp = await Bootcamp.create(req.body)
    res.status(201).json({success: true, data: bootcamp})
})

// @desc    Update Bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.UpdateBootcampById = asyncHandler(async(req, res, next) => {
    let bootcamp = await Bootcamp.findById(req.params.id)
    if(!bootcamp){
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404))
    }
    // Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this bootcamp`, 401))
    }
    bootcamp = Bootcamp.findOneAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
    res.status(200).json({success: true, data: bootcamp})
})

// @desc    Delete Bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
exports.DeleteBootcampById = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    if(!bootcamp){
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404))
    }
    // Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this bootcamp`, 401))
    }
    await bootcamp.deleteOne()
    res.status(200).json({success: true, data: {}})
})

// @desc    Get Bootcamps Within Radius
// @route   GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access  Private
exports.GetBootcampsInRadius = asyncHandler(async(req, res, next) => {
    const {zipcode, distance} = req.params
    // Get lng/lat from geocoder
    const loc = await geocoder.geocode(zipcode)
    const lat = loc[0].latitude
    const lng = loc[0].longitude
    // Calculate Radius using radians
    // Divide dist by radius of earth
    // Earth Radius = 3,963 mi / 6,378 km
    const radius = distance / 3963
    const bootcamps = await Bootcamp.find({
        location: {$geoWithin: {$centerSphere: [[lng, lat], radius]}}
    })
    res.status(200).json({success: true, count: bootcamps.length, data: bootcamps})
})

// @desc    Add Course For Specific Bootcamp
// @route   POST /api/v1/bootcamps/:bootcampId/courses
// @access  Private
exports.CreateCourse = asyncHandler(async(req, res, next) => {
    req.body.bootcamp = req.params.bootcampId
    req.body.user = req.user.id
    const bootcamp = await Bootcamp.findById(req.params.bootcampId)
    if(!bootcamp){
        next(new ErrorResponse(`No bootcamp with id of ${req.params.bootcampId}`, 404))
    }
    // Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to add a course to ${bootcamp._id}`, 401))
    }
    const course = await Course.create(req.body)
    res.status(200).json({
        success: true,
        data: course
    })
})

// @desc      Add review
// @route     POST /api/v1/bootcamps/:bootcampId/reviews
// @access    Private
exports.AddReview = asyncHandler(async (req, res, next) => {
    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.user.id;
    const bootcamp = await Bootcamp.findById(req.params.bootcampId);
    if (!bootcamp) {
      return next(
        new ErrorResponse(
          `No bootcamp with the id of ${req.params.bootcampId}`,
          404
        )
      );
    }
    const review = await Review.create(req.body);
    res.status(201).json({
      success: true,
      data: review
    });
});

// @desc    Upload Photo For Bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private
exports.UploadPhotoBootcamp = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    if(!bootcamp){
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404))
    }
    // Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this bootcamp`, 401))
    }
    if (!req.files) {
        return next(new ErrorResponse(`Please Upload A File`, 400))
    }
    const file = req.files.file
    if(!file.mimetype.startsWith('image')){
        return next(new ErrorResponse('Please Upload an Image',400))
    }
    if(file.size > process.env.MAX_FILE_UPLOAD){
        return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,400))
    }
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if(err){
            console.error(err)
            return next(new ErrorResponse('Problem with file upload', 500))
        }
        await Bootcamp.findByIdAndUpdate(req.params.id, {photo: file.name})
        res.status(200).json({
            success: true,
            data: file.name
        })
    })
})