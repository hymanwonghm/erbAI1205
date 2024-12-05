const path = require("path");
const multer = require("multer");
const { Router } = require("express");
const {
  listImageController,
  getImageController,
  createImageController,
} = require("../controllers");

const router = Router();

/**
 * configure the diskStorage of multer, the disk storage engine
 * gives you full control on storing files to disk locally
 *
 * destination: destination is used to determine within which folder the uploaded files
 * should be stored. This can be given as a string (e.g. '/tmp/uploads').
 * If no destination is given, the operating system's default directory for temporary
 * files is used. Since we want to store the files locally for image
 * uploaded from a POST request, we need to specify where do the images stored.
 *
 * filename: filename is used to determine what the file should be named inside the folder.
 * If no filename is given, each file will be given a random name that doesn't include any
 * file extension.
 * */
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../public/images"),
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// set up the multer with storage
const upload = multer({
  storage: storage,
});

router.route("/list").get(listImageController);
router.route("/get/:id").get(getImageController);

/**
 * upload.single("imageFile") is a middleware, it will be run
 * before the postDocumentsController middleware being called.
 *
 * It is important that you use the name field value from the form in your
 * upload function (i.e. imageFile in the postman form-data key you specified).
 * This tells multer which field on the request it should look for the files in.
 */
router.route("/create").post(upload.single("imageFile"), createImageController);

module.exports = { router };
