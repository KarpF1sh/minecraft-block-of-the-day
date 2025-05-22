import express from 'express';
import path from 'path';
import { getBlock, Block, RequestError } from './fetchBlocks';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });
const SERVERPORT = process.env.SERVERPORT;

const app = express();
const port = SERVERPORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.get('/', async (req, res) => {
    try {
        const block = await getBlock(); // Fetch blocks
        res.render('index', { block }); // Render the index page with blocks data

    } catch (error) {
        if (error instanceof RequestError) {
            console.error(`Request error: ${error.message} (code: ${error.code})`);
            res.status(error.code).json({ error: error.message });

        // Or if it's a generic error for some reason
        } else if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
            res.status(500).json({ error: 'Unknown internal Server Error' });

        } else {
            console.error("Unknown error", error);
            res.status(500).json({ error: 'Unknown internal Server Error' });

        }
    }
});

app.get('/api', async (req, res) => {
    try {
        res.status(200).json(await getBlock()); // Send JSON response

    } catch (error) {
        // If the error is a RequestError, handle it
        if (error instanceof RequestError) {
            console.error(`Request error: ${error.message} (code: ${error.code})`);
            res.status(error.code).json({ error: error.message });

        // Or if it's a generic error for some reason
        } else if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
            res.status(500).json({ error: 'Unknown internal Server Error' });

        } else {
            console.error("Unknown error", error);
            res.status(500).json({ error: 'Unknown internal Server Error' });

        }
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
