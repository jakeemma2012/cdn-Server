const LinkVideos = require('../Models/LinkVideos');
const LinkImages = require('../Models/LinkImages');
const LinkBackdrops = require('../Models/LinkBackDrop');
const User = require('../Models/User');

const seedData = async () => {
    try {
        const linkVideosCount = await LinkVideos.count();
        const linkImagesCount = await LinkImages.count();
        const linkBackdropsCount = await LinkBackdrops.count();
        const userCount = await User.count();

        console.log('Table status:');
        console.log(`- LinkVideos: ${linkVideosCount} records`);
        console.log(`- LinkImages: ${linkImagesCount} records`);
        console.log(`- LinkBackdrops: ${linkBackdropsCount} records`);
        console.log(`- User: ${userCount} records`);
        console.log('Database tables are ready');
    } catch (error) {
        console.error('Error checking database:', error);
    }
};

module.exports = seedData; 