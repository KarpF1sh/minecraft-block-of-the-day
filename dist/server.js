"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fetchBlocks_1 = require("./fetchBlocks");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const SERVER_PORT = process.env.SERVERPORT || 3000;
const BASE_PATH = process.env.BASE_PATH || '';
const app = (0, express_1.default)();
console.log(__dirname);
// Serve static files
app.use('/static', express_1.default.static(path_1.default.join(__dirname, '../public/static/')));
// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../views'));
// Set the base path for the application
app.use((req, res, next) => {
    res.locals.basePath = BASE_PATH.endsWith('/') && BASE_PATH.length > 1
        ? BASE_PATH.slice(0, -1)
        : BASE_PATH;
    next();
});
// TODO: Unify the error handling in the app
app.get('/', async (req, res) => {
    try {
        const block = await (0, fetchBlocks_1.getBlock)(); // Fetch blocks
        res.render('index', { block }); // Render the index page with blocks data
    }
    catch (error) {
        if (error instanceof fetchBlocks_1.RequestError) {
            console.error(`Request error: ${error.message} (code: ${error.code})`);
            res.status(error.code).json({ error: error.message });
            // Or if it's a generic error for some reason
        }
        else if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
            res.status(500).json({ error: 'Unknown internal Server Error' });
        }
        else {
            console.error("Unknown error", error);
            res.status(500).json({ error: 'Unknown internal Server Error' });
        }
    }
});
app.get('/api', async (req, res) => {
    try {
        res.status(200).json(await (0, fetchBlocks_1.getBlock)()); // Send JSON response
    }
    catch (error) {
        // If the error is a RequestError, handle it
        if (error instanceof fetchBlocks_1.RequestError) {
            console.error(`Request error: ${error.message} (code: ${error.code})`);
            res.status(error.code).json({ error: error.message });
            // Or if it's a generic error for some reason
        }
        else if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
            res.status(500).json({ error: 'Unknown internal Server Error' });
        }
        else {
            console.error("Unknown error", error);
            res.status(500).json({ error: 'Unknown internal Server Error' });
        }
    }
});
app.listen(SERVER_PORT, () => {
    if (process.env.NODE_ENV === 'production') {
        console.log(`Server running in production mode on port ${SERVER_PORT}`);
    }
    else {
        console.log(`Server running at http://localhost:${SERVER_PORT}`);
    }
});
