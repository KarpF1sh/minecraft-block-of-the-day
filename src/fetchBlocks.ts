import { JSDOM } from 'jsdom';

export interface Block {
    name: string;
    image: string;
}

// Custom error class for handling request errors
export class RequestError extends Error {
    code: number;

    constructor(message: string, code: number) {
      super(message);
      this.code = code;
      this.name = "RequestError";
    }
}

// Cache for blocks with expiration
const cache = {
    blocks: null as Block[] | null,
    lastFetchTime: null as number | null,
    isValid(): boolean {
        const now = Date.now();
        return this.blocks !== null && this.lastFetchTime !== null && (now - this.lastFetchTime < 24 * 60 * 60 * 1000); // 24 hours
    },
    update(blocks: Block[]): void {
        this.blocks = blocks;
        this.lastFetchTime = Date.now();
    },
    clear(): void {
        this.blocks = null;
        this.lastFetchTime = null;
    }
};

export async function getBlock(): Promise<Block> {
    const today = new Date();
     // Unique seed based on the current date
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // Fetch
    const blocks: Block[] = await getBlocksCache();

    // Deterministic pseudo-random index from the seed
    const index = Math.floor((Math.sin(seed) * 10000 % 1) * blocks.length);
    return blocks[index];
}

// Only fetch blocks if the cache is invalid, so we don't hit the wiki server too often
async function getBlocksCache(): Promise<Block[]> {
    // Check if the cache is valid
    if (cache.isValid()) {
        return cache.blocks!;
    }

    // Fetch new blocks and update the cache
    const blocks = await fetchBlocks();
    cache.update(blocks);

    return blocks;
}

function fetchBlocks(): Promise<Block[]> {
    const sURL = 'https://minecraft.wiki';

    return fetch(`${sURL}/w/Block`)
        .then(async (response): Promise<Block[]> => {
            if (!response.ok) {
                throw new RequestError(`HTTP error: ${response.statusText}`, response.status);
            }

            return response.text().then((html) => {
                const dom = new JSDOM(html);

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
                }) as Block[];
            });
        })
    }
