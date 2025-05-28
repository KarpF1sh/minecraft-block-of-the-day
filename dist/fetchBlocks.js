"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestError = void 0;
exports.getBlock = getBlock;
const jsdom_1 = require("jsdom");
// Custom error class for handling request errors
class RequestError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "RequestError";
    }
}
exports.RequestError = RequestError;
// Cache for blocks with expiration
const cache = {
    blocks: null,
    lastFetchTime: null,
    isValid() {
        const now = Date.now();
        return this.blocks !== null && this.lastFetchTime !== null && (now - this.lastFetchTime < 24 * 60 * 60 * 1000); // 24 hours
    },
    update(blocks) {
        this.blocks = blocks;
        this.lastFetchTime = Date.now();
    },
    clear() {
        this.blocks = null;
        this.lastFetchTime = null;
    }
};
async function getBlock() {
    const today = new Date();
    // Unique seed based on the current date
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    // Fetch
    const blocks = await getBlocksCache();
    // Deterministic pseudo-random index from the seed
    const index = Math.floor(Math.abs((Math.sin(seed) * 10000 % 1)) * blocks.length);
    console.log(`index: ${index}, blocks: ${blocks.length}`);
    console.log(blocks[index]);
    return blocks[index];
}
// Only fetch blocks if the cache is invalid, so we don't hit the wiki server too often
async function getBlocksCache() {
    // Check if the cache is valid
    if (cache.isValid()) {
        return cache.blocks;
    }
    // Fetch new blocks and update the cache
    const blocks = await fetchBlocks();
    cache.update(blocks);
    return blocks;
}
function fetchBlocks() {
    const sURL = 'https://minecraft.wiki';
    return fetch(`${sURL}/w/Block`)
        .then(async (response) => {
        if (!response.ok) {
            throw new RequestError(`HTTP error: ${response.statusText}`, response.status);
        }
        return response.text().then((html) => {
            const dom = new jsdom_1.JSDOM(html);
            const blockContainer = dom.window.document.querySelector('div.div-col.columns.column-width');
            if (!blockContainer) {
                throw new RequestError('Parser error: can\'t find container', 500);
            }
            const blockList = blockContainer.querySelectorAll('li');
            if (!blockList) {
                throw new RequestError('Parser error: can\'t find list element', 500);
            }
            // Map the block element list to an array of Block objects
            return Array.from(blockList).map((li) => {
                const blockName = li.textContent ? li.textContent.trim() : '';
                const imgElement = li.querySelector('img');
                // Messy way to get the image URL, but it works
                // Converting from: "/images/thumb/xyz.png/30px-xyz.png?1234" to "https://minecraft.wiki/images/xyz.png"
                const imgSrc = imgElement ? `${sURL}/images/${imgElement.getAttribute('src')?.split('thumb/')[1]?.split('/')[0]}` : '';
                return {
                    name: blockName,
                    image: imgSrc
                };
            });
        });
    });
}
