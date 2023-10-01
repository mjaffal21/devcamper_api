const express = require('express');
const {
  GetReviews,
  GetReview,
  AddReview,
  UpdateReview,
  DeleteReview
} = require('../controllers/reviews');

const Review = require('../models/Review');

const router = express.Router();

const advancedResults = require('../middlewares/advancedResults');
const { Protect, Authorize } = require('../middlewares/auth');

router
  .route('/')
  .get(
    advancedResults(Review, {
      path: 'bootcamp',
      select: 'name description'
    }),
    GetReviews
  )

router
  .route('/:id')
  .get(GetReview)
  .put(Protect, Authorize('user', 'admin'), UpdateReview)
  .delete(Protect, Authorize('user', 'admin'), DeleteReview);

module.exports = router;