const Actor = require('../Models/Actors');
const Episode = require('../Models/Episodes');
const Seasion = require('../Models/Seasions');
const TVSeries = require('../Models/TV_Series');
const WatchList = require('../Models/Watchlist');
const Movie = require('../Models/Movie');


const seedData = async () => {
    try {
        const movieCount = await Movie.count();
        const actorCount = await Actor.count();
        const episodeCount = await Episode.count();
        const seasionCount = await Seasion.count();
        const tvSeriesCount = await TVSeries.count();
        const watchListCount = await WatchList.count();

        console.log('Table status:');
        console.log(`- Actors: ${actorCount} records`);
        console.log(`- Episodes: ${episodeCount} records`);
        console.log(`- Movies: ${movieCount} records`);
        console.log(`- Seasions: ${seasionCount} records`);
        console.log(`- TVSeries: ${tvSeriesCount} records`);
        console.log(`- WatchList: ${watchListCount} records`);

        console.log('Database tables are ready');
    } catch (error) {
        console.error('Error checking database:', error);
    }
};

module.exports = seedData; 