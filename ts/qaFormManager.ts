// --- Type Definitions ---
interface ResponseData {
    error_code: number;
    message: string;
    data: {
        token: string;
        url: string;
        account: string;
        credit: number;
    };
}

interface EnvConfig {
    requestUrl: string;
    handler: (data: ResponseData) => void; // 函數接受 ResponseData 並不返回任何東西
}

interface EnvData {
    [key: string]: EnvConfig; // 允許任何字串作為鍵，值為 EnvConfig
}

interface RequestBody {
    account: string;
    game_id: number;
    lang: string;
    token: string;
}

// --- Environment Configuration ---
const envData: EnvData = {
    Prep: {
        requestUrl: 'https://agent.prdwk.com/loginAndRegisterSpecify',
        handler: prep
    },
    Prod: {
        requestUrl: 'https://agent.idnslot.info/loginAndRegisterSpecify',
        handler: prod
    },
    Playhard: {
        requestUrl: 'https://agent.idnslot.tech/loginAndRegisterSpecify',
        handler: playhard
    },
    Ifun7: {
        requestUrl: 'https://agent.idnslot.tech/loginAndRegisterSpecify',
        handler: ifun7
    },
};

const DEBUG: boolean = false;

// --- Environment Specific Functions ---
function prep(responseData: ResponseData): void {
    console.log("prep function called with:", responseData);

    if (!responseData || !responseData.data || !responseData.data.url) {
        console.error("Prep: No URL found in responseData to redirect.");
        return;
    }
    
    let originalUrl: string = responseData.data.url;
    console.log("Original URL:", originalUrl);

    const oldDomain: string = "https://dc6ed8aefj69r.cloudfront.net";
    const newDomain: string = "https://gc.prdwk.com";
    let modifiedUrl: string = originalUrl;

    if (originalUrl.startsWith(oldDomain)) {
        modifiedUrl = originalUrl.replace(oldDomain, newDomain);
    }

    try {
        const urlObject = new URL(modifiedUrl);
        const params = urlObject.searchParams;
        
        const oldBetRecordUrlValue: string = `${oldDomain}/betrecord/`;
        const newBetRecordUrlValue: string = `${newDomain}/betrecord/`;

        if (params.has("betrecordurl")) {
            let currentBetRecordUrl = params.get("betrecordurl") as string; // Type assertion
            if (currentBetRecordUrl.startsWith(oldDomain)) {
                currentBetRecordUrl = currentBetRecordUrl.replace(oldDomain, newDomain);
                params.set("betrecordurl", currentBetRecordUrl);
            } else if (currentBetRecordUrl === oldBetRecordUrlValue) {
                params.set("betrecordurl", newBetRecordUrlValue);
            }
        }
        
        urlObject.search = params.toString();
        modifiedUrl = urlObject.toString();
    } catch (e) {
        console.error("Error parsing or modifying URL parameters:", e);
    }

    console.log("Redirecting to new URL for Prep (new tab):", modifiedUrl);
    window.open(modifiedUrl, '_blank');
}

function prod(responseData: ResponseData): void {
    console.log("prod function called with:", responseData);
    if (!responseData || !responseData.data || !responseData.data.url) {
        console.error("Prod: No URL found in responseData to redirect."); // Changed console msg to Prod
        return;
    }
    let modifiedUrl: string = responseData.data.url;
    console.log("Redirecting to new URL for Prod (new tab):", modifiedUrl);
    window.open(modifiedUrl, '_blank');
}

function playhard(responseData: ResponseData): void {
    console.log("playhard function called with:", responseData);
    // Add environment-specific logic for Playhard here
}

function ifun7(responseData: ResponseData): void {
    console.log("ifun7 function called with:", responseData);
    // Add environment-specific logic for Ifun7 here
}

// --- API Call Function ---
async function postData(url: string, data: RequestBody): Promise<ResponseData> {
    console.log("Requesting URL:", url);
    console.log("Request data:", data);
    try {
        const response: Response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        let responseDataResult: ResponseData;
        try {
            responseDataResult = await response.json() as ResponseData;
            console.log("Raw response data:", responseDataResult);
        } catch (e) {
            console.error("Failed to parse response JSON:", e);
            const textResponse: string = await response.text();
            console.error("Raw response text:", textResponse);
            throw new Error(`Failed to parse response JSON. Server responded with: ${response.status} ${response.statusText}. Response text: ${textResponse}`);
        }
        
        if (!response.ok) {
            console.error('HTTP error in postData:', response.status, response.statusText, responseDataResult);
            const error = new Error(`HTTP error: ${response.status} ${response.statusText}`) as any; // Use 'any' for custom error properties
            error.status = response.status;
            error.data = responseDataResult;
            throw error;
        }
        return responseDataResult;
    } catch (error) {
        console.error('Detailed error in postData:', error);
        if ((error as any).status) {
            throw error;
        }
        throw new Error(`Network error or issue processing request: ${(error as Error).message}`);
    }
}

// --- Main Submit Handler ---
// Ensure this function is globally accessible if called directly from HTML onclick
// Alternatively, attach event listener programmatically
(window as any).handleSubmit = async function handleSubmit(): Promise<void> { // Return type is Promise<void> for async functions not returning a value
    console.log("handleSubmit function called");

    const envElement = document.getElementById('environment') as HTMLSelectElement | null;
    const accountElement = document.getElementById('account') as HTMLInputElement | null;
    const gameElement = document.getElementById('game') as HTMLInputElement | null;
    const langElement = document.getElementById('lang') as HTMLInputElement | null;
    const tokenElement = document.getElementById('token') as HTMLInputElement | null;

    const env: string = envElement ? envElement.value : '';
    const account: string = accountElement ? accountElement.value : '';
    const game: string = gameElement ? gameElement.value : '';
    const lang: string = langElement ? langElement.value : '';
    const token: string = tokenElement ? tokenElement.value : '';

    if (!env || !account || !game || !lang || !token) {
        console.error('請填寫所有欄位');
        return; 
    }

    const selectedEnvData: EnvConfig | undefined = envData[env];
    if (!selectedEnvData || !selectedEnvData.requestUrl) {
        console.error('無效的環境選項或找不到對應的 URL');
        return;
    }
    if (typeof selectedEnvData.handler !== 'function') {
        console.error('未針對此環境定義處理函數。');
        console.warn('No handler function defined for environment:', env);
        return;
    }

    const requestUrl: string = selectedEnvData.requestUrl;
    const gameId: number = parseInt(game, 10);

    if (isNaN(gameId)) {
        console.error('Game ID 必須是數字');
        return;
    }

    const requestBody: RequestBody = {
        account: account,
        game_id: gameId,
        lang: lang,
        token: token
    };

    if (DEBUG) {
        // Note: In TypeScript, 'responseData' needs to be declared if it's reassigned.
        // However, since DEBUG is false, this block might not be actively used.
        // For type safety, if DEBUG could be true, responseData should be properly typed.
        let debugResponseData: ResponseData = {
            error_code: 0,
            message: "",
            data: {
                token: "DEBUG_TOKEN",
                url: "https://dc6ed8aefj69r.cloudfront.net/45slot/index.html?gameid=4500&token=DEBUG_TOKEN",
                account: "DEBUG_ACCOUNT",
                credit: 0
            }
        };
        selectedEnvData.handler(debugResponseData);
        return;
    }

    try {
        const responseData: ResponseData = await postData(requestUrl, requestBody);
        console.log('Response from server:', responseData);
        console.error('請求成功! 請查看控制台以獲取響應內容。');
        selectedEnvData.handler(responseData);
    } catch (error) {
        console.error('Error in handleSubmit:', error);
        const err = error as any; // Type assertion for error object
        if (err.data && err.data.message) {
            console.error(`請求失敗: ${err.status || ''} - ${err.data.message}`);
        } else if (err.message) {
            console.error(`請求時發生錯誤: ${err.message}`);
        } else {
            console.error('請求時發生未知錯誤。');
        }
    }
    // No explicit return false needed for button click handler that's async void
} 