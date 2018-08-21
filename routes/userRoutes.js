require('@tensorflow/tfjs')
const tf = require('@tensorflow/tfjs-node');
const mongoose = require('mongoose');
const User = mongoose.model('User');


module.exports = app => {
  app.post('/api/add_face_data', async (req, res) => {
    const AllImage = User.find({})
    const number = AllImage.length
    if (number >= 300) {
      const image_id = await AllImage.sort({created_at: -1}).limit(1)[0]._id
      User.deleteOne({_id: image_id})
    }

    const target_images = await AllImage.where({email: req.body.email})
    if (target_images.length >= 30) {
      return res.json({message: "you already had registered more than 30 photos", dataAmount: 30})
    }
    const newUser = await User.create({email: req.body.email, x_data: req.body.x, created_at: Date.now()})
    if (newUser) {
      const AllImage = await User.find({email: req.body.email})
      const number = AllImage.length
      return res.json({message: "Goob job!", newUser: newUser, dataAmount: number})
    }
    // res.json({message: "something going wrong"})
  })

  app.post('/api/get_data_amount', async (req, res) => {
    const email = req.body.email
    const AllImage = await User.find({email: email})
    const number = AllImage.length
    res.json({message: "Goob job!", dataAmount: number})
  })

  app.get('/api/test', async (req, res) => {
    const AllImage = User.find({})
    const number = AllImage.length
    const image = await AllImage.sort({created_at: -1}).limit(1).where({'email': 'keika'})
    return res.json({images: image[0]._id})
  })

  app.post('/api/get_all_images', async (req, res) => {
    if (!req.body.email) {
      return res.json({message: "email was not provided"})
    }
    const AllImage = await User.find({email: req.body.email})

    const fakeImages = await User.find({email: {'$ne': req.body.email }});
    if (AllImage.length < 30) {
      return res.json({images: AllImage, fake_images: fakeImages})
    }
    return res.json({message: "something going wrong", images: AllImage})
  })
};
