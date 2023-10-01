const express = require('express');
const {
  GetUsers,
  GetUser,
  CreateUser,
  UpdateUser,
  DeleteUser
} = require('../controllers/users');

const User = require('../models/User');

const router = express.Router();

const advancedResults = require('../middlewares/advancedResults');
const { Protect, Authorize } = require('../middlewares/auth');

router.use(Protect);
router.use(Authorize('admin'));

router
  .route('/')
  .get(advancedResults(User), GetUsers)
  .post(CreateUser);

router
  .route('/:id')
  .get(GetUser)
  .put(UpdateUser)
  .delete(DeleteUser);

module.exports = router;