const cloudinary = require('cloudinary').v2;
const Problem = require('../models/problem');
const User = require('../models/user');
const SolutionVideo = require('../models/solutionVideo');

 // Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRETE_KEY // Make sure this matches your .env file
});


const generateUploadSignature = async( req , res) => {
    try{
        // --- FIX 1 ---
        // Get problemId from URL parameters, not body
        const { problemId } = req.params; 
    const userId = req.result._id; // Get admin's ID from middleware

        //verify problem exists
        const problem = await Problem.findById(problemId);
        if(!problem){
            return res.status(400).json({ error : "Problem not found"});
        }

        // Generate unique public_id for the video
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `leetcode-solutions/${problemId}/${userId}_${timestamp}`;

   // Upload parameters
    const uploadParams = {
      timestamp: timestamp,
      public_id: publicId,
    }; 

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRETE_KEY 
    );

    res.json({
      signature,
      timestamp,
      public_id: publicId,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
    });
    }
    catch(err){
        console.error('Error generating upload signature:', err);
        res.status(500).json({ error: 'Failed to generate upload credentials' });
    }
}

const saveVideoMetaData = async( req , res) => {
    try{
        const {
      problemId,
      cloudinaryPublicId,
      secureUrl,
      duration,
    } = req.body;

    const userId = req.result._id;

    // Verify the upload with Cloudinary
    const cloudinaryResource = await cloudinary.api.resource(
      cloudinaryPublicId,
      { resource_type: 'video' }
    );

    if (!cloudinaryResource) {
      return res.status(400).json({ error: 'Video not found on Cloudinary' });
    }

    // --- LOGIC UPDATE ---
    // Check if a video *already* exists for this problem.
    // If it does, we'll replace it.
    const existingVideo = await SolutionVideo.findOne({
      problemId: problemId,
    });

    if (existingVideo) {
      console.log(`Replacing old video for problem ${problemId}. Old public_id: ${existingVideo.cloudinaryPublicId}`);
      // Delete the old video from Cloudinary
      await cloudinary.uploader.destroy(existingVideo.cloudinaryPublicId, { resource_type: 'video' });
      // Delete the old record from our database
      await SolutionVideo.findByIdAndDelete(existingVideo._id);
    }

    // --- FIX 2 ---
    // Generate a proper thumbnail URL, not an <img> tag
    const thumbnailUrl = cloudinary.url(cloudinaryResource.public_id, {
      resource_type: 'video',
      crop: 'fill',
      width: 400,
      height: 225,
      start_offset: 'auto', // Cloudinary picks a good frame
      // --- UPDATE: Changed format from 'jpg' to 'png' ---
      format: 'png' // Generate a .png thumbnail
    });

    // Create video solution record
    const videoSolution = await SolutionVideo.create({
      problemId,
      userId,
      cloudinaryPublicId,
      secureUrl,
      duration: cloudinaryResource.duration || duration,
      thumbnailUrl // Save the generated URL
    });


    res.status(201).json({
      message: 'Video solution saved successfully',
      videoSolution: {
        id: videoSolution._id,
        thumbnailUrl: videoSolution.thumbnailUrl,
        duration: videoSolution.duration,
        uploadedAt: videoSolution.createdAt
      }
    });
    }
    catch(err){
        // --- FIX 3 ---
        // Use 'err' from the catch block, not 'error'
        console.error('Error saving video metadata:', err);
        res.status(500).json({ error: 'Failed to save video metadata' });
 
    }
}

const deleteVideo = async( req , res) => {
    try {
    const { problemId } = req.params;
    const userId = req.result._id; // Not currently used, but good practice

    // Find and delete the video record from our database
    const video = await SolutionVideo.findOneAndDelete({ problemId: problemId });
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found in database' });
    }

    // Delete the actual video file from Cloudinary
    await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video' , invalidate: true });

    res.json({ message: 'Video deleted successfully' });

  } catch (err) { // <-- FIX 4: Use 'err'
    console.error('Error deleting video:', err); // <-- Use 'err'
    res.status(500).json({ error: 'Failed to delete video' });
  }
}

module.exports = {generateUploadSignature,saveVideoMetaData,deleteVideo};