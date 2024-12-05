require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const knex = require("knex");
const configOptions = require("../knexfile");
const db = knex(configOptions);

// Copy from the Google vision api document:
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
  const images = await db("image").select("*");
  for (const image of images) {
    image["face_detected"] = JSON.parse(image["face_detected"]);
  }

  // console.log(images); // for debug only
  res.send(images);
};

const getImageController = async (req, res) => {
  const id = req.params.id;
  const image = await db("image").select("*").where({ id: id }).first();
  image["face_detected"] = JSON.parse(image["face_detected"]);

  // console.log(image); // for debug only
  res.send(image);
};

const createImageController = async (req, res) => {
  try {
    // Google Vision API key is stored in env file
    const apiKey = process.env.API_KEY;

    // req.file exist after upload.single("imageFile") middleware is resolved
    const imageFileName = req.file.originalname;
    const base64ImageStr = encodeImage(imageFileName);

    // check out the document to see how to configure the request body of the google vision PAI
    // https://cloud.google.com/vision/docs/reference/rest/v1/AnnotateImageRequest
    request_body = {
      requests: [
        {
          image: {
            content: base64ImageStr, // this need to be base64 string
          },
          features: [
            {
              type: "FACE_DETECTION",
              maxResults: 50,
            },
          ],
        },
      ],
    };

    // call the Google Vision API, check out the official document below:
    // https://cloud.google.com/vision/docs/request
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      request_body
    );
    const result = response.data;
    const face_annotations = result["responses"][0]["faceAnnotations"];

    // verify that the face_annotations is not empty
    if (!face_annotations) {
      console.log(result["responses"]);
      throw new Error("face_annotations does not exist");
    }

    const faces = [];
    for (const face of face_annotations) {
      let face_expression = {};
      face_expression["joyLikelihood"] = face["joyLikelihood"];
      face_expression["sorrowLikelihood"] = face["sorrowLikelihood"];
      face_expression["angerLikelihood"] = face["angerLikelihood"];
      face_expression["surpriseLikelihood"] = face["surpriseLikelihood"];
      face_expression["underExposedLikelihood"] =
        face["underExposedLikelihood"];
      face_expression["blurredLikelihood"] = face["blurredLikelihood"];
      face_expression["headwearLikelihood"] = face["headwearLikelihood"];
      faces.push(face_expression);
    }
    // console.log(faces); // for debug only

    const newImage = await db("image")
      .insert({
        name: imageFileName,
        face_detected: JSON.stringify(faces),
      })
      .then((item) => {
        return item.rowCount;
      });

    if (newImage === 1) {
      return res.status(201).json({ message: "Image created successfully" });
    }
  } catch (error) {
    res.status(500).send(`Error occurs. Error: ${error}`);
  }
};

module.exports = {
  listImageController,
  getImageController,
  createImageController,
};
