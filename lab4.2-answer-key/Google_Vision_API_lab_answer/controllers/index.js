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

  // console.log(images); // for debug only
  res.send(images);
};

const getImageController = async (req, res) => {
  const id = req.params.id;
  const image = await db("image").select("*").where({ id: id });

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
              type: "LABEL_DETECTION",
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
    const label_annotations = result["responses"][0]["labelAnnotations"];

    // verify that the label_annotations is not empty
    if (!label_annotations) {
      console.log(result["responses"]);
      throw new Error("label_annotations does not exist");
    }

    const labels = [];
    for (const label of label_annotations) {
      labels.push(label["description"]);
      // console.log(`${label["description"]}\n`); // for debug only
    }
    // console.log(labels.join(",")); // for debug only

    const newImage = await db("image")
      .insert({
        name: imageFileName,
        detected_label: labels.join(","),
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
