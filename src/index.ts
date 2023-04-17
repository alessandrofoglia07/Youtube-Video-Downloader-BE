import express, { Request, Response } from 'express';
import cors from 'cors';
import ytdl from 'ytdl-core';

const app = express();

app.use(cors());
app.use(express.json());

app.listen(5000, () => console.log('Server is running on port 5000'));

const checkVideoExists = async (url: string) => {
    try {
        await ytdl.getInfo(url);
        return true; // Video exists
    } catch (err: any) {
        if (err.message.includes('Video unavailable')) {
            console.log('Video does not exist');
            return false; // Video does not exist
        }
        throw err;
    }
};

const getVideoThumbnail = async (url: string) => {
    const info = await ytdl.getInfo(url);
    const thumbnails = info.videoDetails.thumbnails;
    const thumbnail = thumbnails[thumbnails.length - 1].url;
    return thumbnail;
};

app.post('/api/thumbnail', async (req: Request, res: Response) => {
    const { url } = req.body;

    const videoExists = await checkVideoExists(url);
    if (!videoExists) return res.status(404).send('Video does not exist');

    try {
        const thumbnail = await getVideoThumbnail(url);
        res.status(200).send(thumbnail);
    } catch (err) {
        console.log(err);
    }
});

app.post('/api/download', async (req: Request, res: Response) => {
    const { url } = req.body;

    const videoExists = await checkVideoExists(url);
    if (!videoExists) return res.status(404).send('Video does not exist');

    try {
        const title: string = (await ytdl.getInfo(url)).videoDetails.title;
        const fileName = title.trim().replaceAll(' ', '_');

        const videoStream = ytdl(url, { filter: 'audioandvideo', quality: 'highestvideo' });

        res.setHeader('Content-Disposition', `attachment; filename=${fileName}.mp4`);
        res.setHeader('Content-Type', 'video/mp4');
        res.header("Access-Control-Expose-Headers", "*");

        videoStream.pipe(res);

    } catch (err) {
        console.log(err);
    }
});