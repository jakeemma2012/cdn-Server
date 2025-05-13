const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

//
function execPromise(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stderr });
            } else {
                resolve(stdout);
            }
        });
    });
}

// delete files after miliseconds
function deleteFileAfterDelay(filePath, delayMs = 5000) {
    setTimeout(() => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return;
            }
            console.log('Deleted original file:', filePath);
        });
    }, delayMs);
}


// create m3u8 files
function createMasterPlaylist(baseDir, qualities) {
    const masterPath = path.join(baseDir, 'master.m3u8');
    let playlistContent = '#EXTM3U\n\n';

    for (const { label, bandwidth, resolution } of qualities) {
        playlistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n`;
        playlistContent += `${label}/index.m3u8\n\n`;
    }

    fs.writeFileSync(masterPath, playlistContent.trim(), 'utf8');
    console.log('✅ Created master.m3u8 at:', masterPath);
}

function getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
        exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (err, stdout) => {
            if (err) return reject(err);
            const duration = parseFloat(stdout);
            resolve(Math.round(duration * 1000)); // milisecond
        });
    });
}

async function compressAndSplitVideo(videoPath, folderName) {
    const baseDir = path.dirname(videoPath);
    const filename = path.basename(videoPath, path.extname(videoPath));
    const mainOutputDir = path.join(baseDir, `${folderName}`);

    console.log("Compressing video:", videoPath, "to folder:", mainOutputDir);

    if (!fs.existsSync(mainOutputDir)) {
        fs.mkdirSync(mainOutputDir, { recursive: true });
    }

    // Lấy thời lượng video trước khi xử lý
    const totalDuration = await getVideoDuration(videoPath);
    console.log(`Total video duration: ${totalDuration}ms`);

    const qualities = [
        { label: '1080p', resolution: '1920x1080', bitrate: '5000k', bandwidth: 5000000 },
        { label: '720p', resolution: '1280x720', bitrate: '2800k', bandwidth: 2800000 },
        { label: '480p', resolution: '854x480', bitrate: '1400k', bandwidth: 1400000 },
    ];

    for (const { label, resolution, bitrate } of qualities) {
        const outFolder = path.join(mainOutputDir, label);

        if (!fs.existsSync(outFolder)) {
            fs.mkdirSync(outFolder, { recursive: true });
        }

        const outputHLS = path.join(outFolder, 'index.m3u8');

        const command = `
            ffmpeg -i "${videoPath}" -vf scale=${resolution} -c:a aac -ar 48000 -b:a 96k -c:v libx265 -tag:v hvc1 \
            -crf 22 -preset fast -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod \
            -b:v ${bitrate} -maxrate ${bitrate} -bufsize ${parseInt(bitrate) * 2} \
            -hls_segment_filename "${outFolder}/%03d.ts" "${outputHLS}"
        `.replace(/\s+/g, ' ').trim();

        try {
            console.log(`Processing ${label} quality...`);

            const process = exec(command);
            process.stderr.on('data', (data) => {
                const timeMatch = data.match(/time=(\d+):(\d+):(\d+)/);
                if (timeMatch) {
                    const hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    const seconds = parseInt(timeMatch[3]);
                    const currentTime = hours * 3600 + minutes * 60 + seconds;
                    const progress = (currentTime / (totalDuration / 1000)) * 100;
                    console.log(`${label} Progress: ${progress.toFixed(2)}%`);
                }
            });

            await new Promise((resolve, reject) => {
                process.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`FFmpeg process exited with code ${code}`));
                    }
                });
            });

            console.log(`✅ HLS for ${label} created:`, outputHLS);
        } catch (error) {
            console.error(`❌ Failed creating HLS for ${label}:`, error);
            throw error;
        }
    }

    createMasterPlaylist(mainOutputDir, qualities);
    deleteFileAfterDelay(videoPath);
}

module.exports = compressAndSplitVideo;
