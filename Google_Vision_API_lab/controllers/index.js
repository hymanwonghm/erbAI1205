require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const knex = require("knex");
const configOptions = require("../knexfile");
const db = knex(configOptions);

// **Note: Copy from the Google vision api document:
// https://cloud.google.com/vision/docs/base64?hl=en#using_client_libraries
function encodeImage(image) {
  // get the path of the image you want to access
  const imageFilePath = path.resolve(__dirname, `../public/images/${image}`);

  // read the image data
  const imageFile = fs.readFileSync(imageFilePath);

  // Convert the image data to a Buffer and encode it to base64 format.
  const base64ImageStr = Buffer.from(imageFile).toString("base64");
  return base64ImageStr;
}

const listImageController = async (req, res) => {
  // TODO: add you code here
  const listResult = await db('image').select('*').orderBy('id')
  console.log(listResult)
  res.status(200).json(listResult)
};

const getImageController = async (req, res) => {
  // TODO: add you code here
  const requestedId = req.params.id
  console.log(requestedId)
  const requestedImage = await db('image').select('*').where({id: requestedId})
  console.log(requestedImage)
  res.status(200).json(requestedImage)
};

const createImageController = async (req, res) => {
  try {
    // Google Vision API key is stored in env file
    const apiKey = process.env.API_KEY;

    // req.file exist after upload.single("imageFile") middleware is resolved
    const imageFileName = req.file.originalname;
    const base64ImageStr = encodeImage(imageFileName);

    // **Note: check out the document to see how to configure the request body of the google vision PAI
    // https://cloud.google.com/vision/docs/reference/rest/v1/AnnotateImageRequest
    request_body = {
      requests: [
        {
          image: {
            content: base64ImageStr, // this need to be base64 string
          },
          features: [
            {
              type: "LABEL_DETECTION",
            },
          ],
        },
      ],
    };

    // TODO: add you code here

    // **Note: call the Google Vision API, check out the official document below for reference:
    // https://cloud.google.com/vision/docs/request
    request_body2 = {
      requests: [
        {
          image: {
            content: base64ImageStr, // this need to be base64 string
          },
          features: [
            {
              type: "FACE_DETECTION",
            },
          ],
        },
      ],
    };
    const googleVisionApi = await axios.post(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, request_body)
    const detected_label = googleVisionApi.data.responses[0].labelAnnotations[0].description
    console.log(imageFileName)
    console.log(detected_label)
    const faceDetection = await axios.post(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, request_body2)
    let isFace = false
    Object.keys(faceDetection.data.responses[0]).length !== 0 ? isFace = true: isFace =false
    if (!isFace) {
      console.log(`isFace: ${isFace}`)
      const created = await db('image').insert({"name": imageFileName, "detected_label": detected_label})
    } else {
      console.log(`isFace: ${isFace}`)
      const face = faceDetection.data.responses[0].faceAnnotations[0]
      const joyLikelihood = face.joyLikelihood
      const sorrowLikelihood = face.sorrowLikelihood
      const angerLikelihood = face.angerLikelihood
      const surpriseLikelihood = face.surpriseLikelihood
      const underExposedLikelihood = face.underExposedLikelihood
      const blurredLikelihood = face.blurredLikelihood
      const headwearLikelihood = face.headwearLikelihood
      const created = await db('image').insert({"name": imageFileName, "detected_label": detected_label, "joyLikelihood": joyLikelihood, "sorrowLikelihood": sorrowLikelihood, "angerLikelihood": angerLikelihood, "surpriseLikelihood": surpriseLikelihood, "underExposedLikelihood": underExposedLikelihood, "blurredLikelihood": blurredLikelihood, "headwearLikelihood": headwearLikelihood})
    }
    const queryResult = await db('image').select('*').orderBy('id')
    console.log(queryResult)
    res.status(200).json(queryResult)
  } catch (error) {
    res.status(500).send(`Error occurs. Error: ${error}`);
  }
};

const deleteImageController = async (req, res) => {
  const requestedId = req.params.id
  console.log(requestedId)
  const deleted = await db('image').where({id: requestedId}).del()
  res.status(200).json({messge: "sucessfully deleted"})
}

const updateImageController = async (req, res) => {
  const requestedId = req.params.id
  const updatedLabel = req.body.detected_label
  console.log(requestedId)
  const updated = await db('image').where({id: requestedId}).update({detected_label: updatedLabel})
  res.status(200).json({messge: "sucessfully updated"})
}

module.exports = {
  listImageController,
  getImageController,
  createImageController,
  deleteImageController,
  updateImageController
};
